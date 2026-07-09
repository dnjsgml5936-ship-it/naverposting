import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts, createPost, getPost, updatePost, deletePost } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { BlogPost } from '@/types';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    // 관리자는 전체, 일반 사용자는 본인 글만
    const posts = user.role === 'admin' ? getAllPosts() : getAllPosts(user.id);
    return NextResponse.json(posts);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.status !== 'approved') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const body = await request.json();
    const now = new Date().toISOString();

    const post: BlogPost = {
      id: uuidv4(),
      title: body.title,
      content: body.content,
      htmlContent: body.htmlContent,
      keyword: body.keyword,
      domain: body.domain || 'insurance',
      category: body.category,
      tags: body.tags || [],
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      generationInput: body.generationInput,
      userId: user.id,
    };

    const created = createPost(post);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'id는 필수입니다.' }, { status: 400 });
    }

    const existing = getPost(body.id);
    if (!existing) {
      return NextResponse.json({ error: '포스트를 찾을 수 없습니다.' }, { status: 404 });
    }
    // 본인 글이거나 관리자만 수정 가능
    if (user.role !== 'admin' && existing.userId !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const updated = updatePost(body.id, body);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id는 필수입니다.' }, { status: 400 });
    }

    const existing = getPost(id);
    if (!existing) {
      return NextResponse.json({ error: '포스트를 찾을 수 없습니다.' }, { status: 404 });
    }
    if (user.role !== 'admin' && existing.userId !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    deletePost(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
