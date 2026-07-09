import Database from 'better-sqlite3';
import path from 'path';
import { BlogPost } from '@/types';

// Railway Volume 마운트 경로 우선, 없으면 로컬 data/ 사용
const DB_DIR = process.env.DB_PATH || path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'blog.db');

function getDb() {
  const fs = require('fs');
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      htmlContent TEXT NOT NULL,
      keyword TEXT NOT NULL,
      domain TEXT NOT NULL DEFAULT 'insurance',
      category TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'draft',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      publishedAt TEXT
    )
  `);

  // 기존 테이블 마이그레이션
  const columns = db.prepare("PRAGMA table_info(posts)").all() as { name: string }[];
  const hasDomain = columns.some((c) => c.name === 'domain');
  if (!hasDomain) {
    db.exec("ALTER TABLE posts ADD COLUMN domain TEXT NOT NULL DEFAULT 'insurance'");
  }
  // 생성 입력값(GenerateRequest) 저장용 컬럼 — 과거 글은 NULL
  const hasGenerationInput = columns.some((c) => c.name === 'generationInput');
  if (!hasGenerationInput) {
    db.exec("ALTER TABLE posts ADD COLUMN generationInput TEXT");
  }

  // 발굴 키워드 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS discovered_keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL,
      domain TEXT NOT NULL,
      seedKeyword TEXT NOT NULL,
      monthlySearchCount INTEGER NOT NULL DEFAULT 0,
      monthlyPcCount INTEGER NOT NULL DEFAULT 0,
      monthlyMobileCount INTEGER NOT NULL DEFAULT 0,
      monthlyBlogCount INTEGER NOT NULL DEFAULT 0,
      compIdx TEXT NOT NULL DEFAULT '',
      opportunityScore REAL NOT NULL DEFAULT 0,
      grade TEXT NOT NULL DEFAULT 'C',
      discoveredAt TEXT NOT NULL,
      UNIQUE(keyword, domain)
    )
  `);

  return db;
}

// DB 원본 row를 BlogPost로 변환 (tags / generationInput JSON 파싱)
function rowToPost(row: BlogPost): BlogPost {
  const raw = row as unknown as { generationInput?: string | null };
  let generationInput: BlogPost['generationInput'];
  if (raw.generationInput) {
    try {
      generationInput = JSON.parse(raw.generationInput);
    } catch {
      generationInput = undefined;
    }
  }
  return {
    ...row,
    domain: row.domain || 'insurance',
    tags: JSON.parse(row.tags as unknown as string),
    generationInput,
  };
}

export function getAllPosts(): BlogPost[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM posts ORDER BY createdAt DESC').all() as BlogPost[];
  return rows.map(rowToPost);
}

export function getPost(id: string): BlogPost | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as BlogPost | undefined;
  if (!row) return undefined;
  return rowToPost(row);
}

export function createPost(post: BlogPost): BlogPost {
  const db = getDb();
  db.prepare(`
    INSERT INTO posts (id, title, content, htmlContent, keyword, domain, category, tags, status, createdAt, updatedAt, generationInput)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    post.id,
    post.title,
    post.content,
    post.htmlContent,
    post.keyword,
    post.domain || 'insurance',
    post.category,
    JSON.stringify(post.tags),
    post.status,
    post.createdAt,
    post.updatedAt,
    post.generationInput ? JSON.stringify(post.generationInput) : null
  );
  return post;
}

export function updatePost(id: string, updates: Partial<BlogPost>): BlogPost | undefined {
  const existing = getPost(id);
  if (!existing) return undefined;

  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  const db = getDb();
  db.prepare(`
    UPDATE posts SET title=?, content=?, htmlContent=?, keyword=?, domain=?, category=?, tags=?, status=?, updatedAt=?, publishedAt=?
    WHERE id=?
  `).run(
    updated.title,
    updated.content,
    updated.htmlContent,
    updated.keyword,
    updated.domain || 'insurance',
    updated.category,
    JSON.stringify(updated.tags),
    updated.status,
    updated.updatedAt,
    updated.publishedAt || null,
    id
  );
  return updated;
}

export function deletePost(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM posts WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============================================================
// 발굴 키워드 CRUD
// ============================================================
export interface DiscoveredKeywordRow {
  id: number;
  keyword: string;
  domain: string;
  seedKeyword: string;
  monthlySearchCount: number;
  monthlyPcCount: number;
  monthlyMobileCount: number;
  monthlyBlogCount: number;
  compIdx: string;
  opportunityScore: number;
  grade: string;
  discoveredAt: string;
}

export function upsertDiscoveredKeyword(data: Omit<DiscoveredKeywordRow, 'id'>): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO discovered_keywords (keyword, domain, seedKeyword, monthlySearchCount, monthlyPcCount, monthlyMobileCount, monthlyBlogCount, compIdx, opportunityScore, grade, discoveredAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(keyword, domain) DO UPDATE SET
      seedKeyword=excluded.seedKeyword,
      monthlySearchCount=excluded.monthlySearchCount,
      monthlyPcCount=excluded.monthlyPcCount,
      monthlyMobileCount=excluded.monthlyMobileCount,
      monthlyBlogCount=excluded.monthlyBlogCount,
      compIdx=excluded.compIdx,
      opportunityScore=excluded.opportunityScore,
      grade=excluded.grade,
      discoveredAt=excluded.discoveredAt
  `).run(
    data.keyword, data.domain, data.seedKeyword,
    data.monthlySearchCount, data.monthlyPcCount, data.monthlyMobileCount,
    data.monthlyBlogCount, data.compIdx, data.opportunityScore, data.grade, data.discoveredAt,
  );
}

export function getDiscoveredKeywords(options?: {
  domain?: string;
  grade?: string;
  limit?: number;
  offset?: number;
}): { items: DiscoveredKeywordRow[]; total: number } {
  const db = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options?.domain) {
    conditions.push('domain = ?');
    params.push(options.domain);
  }
  if (options?.grade) {
    conditions.push('grade = ?');
    params.push(options.grade);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM discovered_keywords ${where}`).get(...params) as { cnt: number }).cnt;

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  const items = db.prepare(
    `SELECT * FROM discovered_keywords ${where} ORDER BY opportunityScore DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as DiscoveredKeywordRow[];

  return { items, total };
}

export function getDiscoveredKeywordStats(): { total: number; s: number; a: number; b: number; c: number; byDomain: Record<string, number> } {
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as cnt FROM discovered_keywords').get() as { cnt: number }).cnt;
  const s = (db.prepare("SELECT COUNT(*) as cnt FROM discovered_keywords WHERE grade = 'S'").get() as { cnt: number }).cnt;
  const a = (db.prepare("SELECT COUNT(*) as cnt FROM discovered_keywords WHERE grade = 'A'").get() as { cnt: number }).cnt;
  const b = (db.prepare("SELECT COUNT(*) as cnt FROM discovered_keywords WHERE grade = 'B'").get() as { cnt: number }).cnt;
  const c = (db.prepare("SELECT COUNT(*) as cnt FROM discovered_keywords WHERE grade = 'C'").get() as { cnt: number }).cnt;

  const domainRows = db.prepare('SELECT domain, COUNT(*) as cnt FROM discovered_keywords WHERE grade = \'S\' GROUP BY domain').all() as { domain: string; cnt: number }[];
  const byDomain: Record<string, number> = {};
  for (const row of domainRows) {
    byDomain[row.domain] = row.cnt;
  }

  return { total, s, a, b, c, byDomain };
}
