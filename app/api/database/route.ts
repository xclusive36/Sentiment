import { NextRequest, NextResponse } from 'next/server';
import {
  initializeDatabase,
  syncFilesToDatabase,
  fullTextSearch,
  getDatabaseStats,
  getMostAccessedNotes,
  getRecentlyModifiedNotes,
  getAllTagsWithCounts,
} from '@/lib/database';

// Initialize database on startup
initializeDatabase();

// GET - Query database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const action = searchParams.get('action');

    if (action === 'stats') {
      const stats = getDatabaseStats();
      return NextResponse.json(stats);
    }

    if (action === 'search') {
      const query = searchParams.get('q');
      if (!query) {
        return NextResponse.json(
          { error: 'Missing query parameter' },
          { status: 400 }
        );
      }

      const limit = parseInt(searchParams.get('limit') || '50');
      const results = fullTextSearch(query, limit);
      
      return NextResponse.json({
        query,
        results,
        count: results.length,
      });
    }

    if (action === 'most-accessed') {
      const limit = parseInt(searchParams.get('limit') || '10');
      const notes = getMostAccessedNotes(limit);
      return NextResponse.json(notes);
    }

    if (action === 'recently-modified') {
      const limit = parseInt(searchParams.get('limit') || '10');
      const notes = getRecentlyModifiedNotes(limit);
      return NextResponse.json(notes);
    }

    if (action === 'tags') {
      const tags = getAllTagsWithCounts();
      return NextResponse.json(tags);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Database operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'sync') {
      const stats = syncFilesToDatabase();
      return NextResponse.json({
        success: true,
        message: 'Database synced successfully',
        stats,
      });
    }

    if (action === 'initialize') {
      initializeDatabase();
      const dbStats = getDatabaseStats();
      return NextResponse.json({
        success: true,
        message: 'Database initialized',
        stats: dbStats,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Database operation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
