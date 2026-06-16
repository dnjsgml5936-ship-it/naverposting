import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts, createPost, getPost, updatePost, deletePost } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { BlogPost } from '@/types';

export async function GET() {
  try {
    const posts = getAllPosts();
    return NextResponse.json(posts);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'id는 필수입니다.' }, { status: 400 });
    }
    const updated = updatePost(body.id, body);
    if (!updated) {
      return NextResponse.json({ error: '포스트를 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id는 필수입니다.' }, { status: 400 });
    }
    const deleted = deletePost(id);
    if (!deleted) {
      return NextResponse.json({ error: '포스트를 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
