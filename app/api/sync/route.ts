import { NextRequest, NextResponse } from 'next/server';
import {
  startWatching,
  stopWatching,
  getSyncStatus,
  getWatcherStats,
  ensureWatcherRunning,
} from '@/lib/file-watcher';

// Automatically start watcher when server starts
ensureWatcherRunning();

// GET - Get sync status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const action = searchParams.get('action');

    if (action === 'stats') {
      const stats = getWatcherStats();
      return NextResponse.json(stats);
    }

    const status = getSyncStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Control sync (start/stop)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      startWatching();
      return NextResponse.json({
        success: true,
        message: 'File watcher started',
        status: getSyncStatus(),
      });
    }

    if (action === 'stop') {
      await stopWatching();
      return NextResponse.json({
        success: true,
        message: 'File watcher stopped',
        status: getSyncStatus(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "start" or "stop"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error controlling sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
