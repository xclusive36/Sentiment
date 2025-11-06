import { NextRequest, NextResponse } from 'next/server';
import { recordFileAccess } from '@/lib/stats';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path } = body;
    
    if (!path) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }
    
    recordFileAccess(path);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording file access:', error);
    return NextResponse.json(
      { error: 'Failed to record file access' },
      { status: 500 }
    );
  }
}
