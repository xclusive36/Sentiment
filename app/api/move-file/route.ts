import { NextRequest, NextResponse } from 'next/server';
import { moveFile } from '@/lib/files';

export async function POST(request: NextRequest) {
  try {
    const { oldPath, newPath } = await request.json();

    if (!oldPath || !newPath) {
      return NextResponse.json(
        { error: 'Missing oldPath or newPath' },
        { status: 400 }
      );
    }

    const success = moveFile(oldPath, newPath);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to move file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in move-file API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
