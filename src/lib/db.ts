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
      publishedAt TEXT,
      userId TEXT
    )
  `);

  // 사용자 계정
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL
    )
  `);

  // 로그인 세션 (DB 기반)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  // AI 생성 로그 (저장 여부와 무관하게 모든 생성 호출 기록 — API 사용량 추적)
  db.exec(`
    CREATE TABLE IF NOT EXISTS generation_logs (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      keyword TEXT NOT NULL DEFAULT '',
      domain TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      inputTokens INTEGER NOT NULL DEFAULT 0,
      outputTokens INTEGER NOT NULL DEFAULT 0,
      success INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL
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
  // 작성자 컬럼 — 로그인 도입 이전 글은 NULL(관리자 계정 생성 시 귀속)
  const hasUserId = columns.some((c) => c.name === 'userId');
  if (!hasUserId) {
    db.exec("ALTER TABLE posts ADD COLUMN userId TEXT");
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

// userId를 넘기면 본인 글만, 없으면(관리자) 전체 조회
export function getAllPosts(userId?: string): BlogPost[] {
  const db = getDb();
  const rows = userId
    ? (db.prepare('SELECT * FROM posts WHERE userId = ? ORDER BY createdAt DESC').all(userId) as BlogPost[])
    : (db.prepare('SELECT * FROM posts ORDER BY createdAt DESC').all() as BlogPost[]);
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
    INSERT INTO posts (id, title, content, htmlContent, keyword, domain, category, tags, status, createdAt, updatedAt, generationInput, userId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    post.generationInput ? JSON.stringify(post.generationInput) : null,
    post.userId || null
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

// ============================================================
// 사용자 / 세션 / 사용량 로그
// ============================================================
export interface UserRow {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export function countUsers(): number {
  const db = getDb();
  return (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number }).cnt;
}

export function getUserByUsername(username: string): UserRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined;
}

export function getUserById(id: string): UserRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export function createUser(user: UserRow): UserRow {
  const db = getDb();
  db.prepare(
    'INSERT INTO users (id, username, passwordHash, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(user.id, user.username, user.passwordHash, user.role, user.status, user.createdAt);
  return user;
}

export function getAllUsers(): Omit<UserRow, 'passwordHash'>[] {
  const db = getDb();
  return db.prepare(
    'SELECT id, username, role, status, createdAt FROM users ORDER BY createdAt ASC'
  ).all() as Omit<UserRow, 'passwordHash'>[];
}

export function setUserStatus(id: string, status: UserRow['status']): boolean {
  const db = getDb();
  return db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id).changes > 0;
}

// 로그인 도입 이전 글(userId NULL)을 관리자 계정으로 귀속
export function assignOrphanPostsTo(userId: string): number {
  const db = getDb();
  return db.prepare('UPDATE posts SET userId = ? WHERE userId IS NULL').run(userId).changes;
}

// --- 세션 ---
export function createSession(id: string, userId: string, expiresAt: string): void {
  const db = getDb();
  db.prepare('INSERT INTO sessions (id, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?)').run(
    id, userId, expiresAt, new Date().toISOString()
  );
}

export function getSessionUser(sessionId: string): UserRow | undefined {
  const db = getDb();
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as
    | { id: string; userId: string; expiresAt: string }
    | undefined;
  if (!session) return undefined;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    return undefined;
  }
  return getUserById(session.userId);
}

export function deleteSession(sessionId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

// --- 생성 로그 ---
export interface GenerationLogRow {
  id: string;
  userId: string;
  keyword: string;
  domain: string;
  category: string;
  inputTokens: number;
  outputTokens: number;
  success: number;
  createdAt: string;
}

export function logGeneration(log: GenerationLogRow): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO generation_logs (id, userId, keyword, domain, category, inputTokens, outputTokens, success, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    log.id, log.userId, log.keyword, log.domain, log.category,
    log.inputTokens, log.outputTokens, log.success, log.createdAt
  );
}

// 사용자별 × 월별 생성 통계 (생성 횟수 / 저장 글 수 / 토큰 사용량)
export interface UsageStatRow {
  userId: string;
  username: string;
  month: string; // YYYY-MM
  generations: number;
  inputTokens: number;
  outputTokens: number;
  savedPosts: number;
}

export function getUsageStats(): UsageStatRow[] {
  const db = getDb();
  // 생성 로그 집계
  const genRows = db.prepare(`
    SELECT g.userId AS userId, u.username AS username,
           substr(g.createdAt, 1, 7) AS month,
           COUNT(*) AS generations,
           SUM(g.inputTokens) AS inputTokens,
           SUM(g.outputTokens) AS outputTokens
    FROM generation_logs g
    LEFT JOIN users u ON u.id = g.userId
    GROUP BY g.userId, month
  `).all() as Omit<UsageStatRow, 'savedPosts'>[];

  // 저장 글 집계
  const postRows = db.prepare(`
    SELECT userId, substr(createdAt, 1, 7) AS month, COUNT(*) AS savedPosts
    FROM posts
    WHERE userId IS NOT NULL
    GROUP BY userId, month
  `).all() as { userId: string; month: string; savedPosts: number }[];

  const map = new Map<string, UsageStatRow>();
  for (const r of genRows) {
    map.set(`${r.userId}|${r.month}`, {
      userId: r.userId,
      username: r.username || '(삭제된 사용자)',
      month: r.month,
      generations: r.generations,
      inputTokens: r.inputTokens || 0,
      outputTokens: r.outputTokens || 0,
      savedPosts: 0,
    });
  }
  for (const p of postRows) {
    const key = `${p.userId}|${p.month}`;
    const existing = map.get(key);
    if (existing) {
      existing.savedPosts = p.savedPosts;
    } else {
      const user = getUserById(p.userId);
      map.set(key, {
        userId: p.userId,
        username: user?.username || '(삭제된 사용자)',
        month: p.month,
        generations: 0,
        inputTokens: 0,
        outputTokens: 0,
        savedPosts: p.savedPosts,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    b.month.localeCompare(a.month) || a.username.localeCompare(b.username)
  );
}
