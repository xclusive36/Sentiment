import { NextRequest, NextResponse } from 'next/server';
import {
  addComment,
  getCommentsForFile,
  getAllComments,
  toggleCommentResolution,
  deleteComment,
  getRecentActivities,
  getCollaborationStats,
  getAllUsers,
  getOrCreateUser,
} from '@/lib/collaboration';

// GET - Query collaboration data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const action = searchParams.get('action');
    const fileSlug = searchParams.get('fileSlug');

    if (action === 'comments') {
      if (fileSlug) {
        const comments = getCommentsForFile(fileSlug);
        return NextResponse.json(comments);
      }
      const comments = getAllComments();
      return NextResponse.json(comments);
    }

    if (action === 'activities') {
      const limit = parseInt(searchParams.get('limit') || '50');
      const activities = getRecentActivities(limit);
      return NextResponse.json(activities);
    }

    if (action === 'stats') {
      const stats = getCollaborationStats();
      return NextResponse.json(stats);
    }

    if (action === 'users') {
      const users = getAllUsers();
      return NextResponse.json(users);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Collaboration query error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Collaboration operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'add-comment') {
      const { fileSlug, author, content, parentId } = body;
      
      // Ensure user exists
      getOrCreateUser(author);
      
      const comment = addComment(fileSlug, author, content, parentId);
      return NextResponse.json({ success: true, comment });
    }

    if (action === 'toggle-resolve') {
      const { commentId } = body;
      const resolved = toggleCommentResolution(commentId);
      return NextResponse.json({ success: true, resolved });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Collaboration operation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete operations
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const commentId = searchParams.get('commentId');

    if (commentId) {
      const success = deleteComment(commentId);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: 'Missing commentId' }, { status: 400 });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
