import { NextRequest, NextResponse } from 'next/server';
import { updateFolderOrder } from '@/lib/order';

export async function POST(request: NextRequest) {
  try {
    const { folderPath, files, folders } = await request.json();

    if (folderPath === undefined || !files || !folders) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const success = updateFolderOrder(folderPath, files, folders);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to save order' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in order API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
