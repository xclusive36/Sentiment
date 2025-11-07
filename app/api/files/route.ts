import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { deleteFileStats } from '@/lib/stats';

const markdownDirectory = path.join(process.cwd(), 'markdown');

// Create new file
export async function POST(request: NextRequest) {
  try {
    const { relativePath, content } = await request.json();

    if (!relativePath || content === undefined) {
      return NextResponse.json(
        { error: 'Missing relativePath or content' },
        { status: 400 }
      );
    }

    const fullPath = path.join(markdownDirectory, relativePath);

    // Check if file already exists
    if (fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'File already exists' },
        { status: 409 }
      );
    }

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(fullPath, content, 'utf8');

    return NextResponse.json({ success: true, path: relativePath });
  } catch (error) {
    console.error('Error creating file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update existing file
export async function PUT(request: NextRequest) {
  try {
    const { relativePath, content } = await request.json();

    if (!relativePath || content === undefined) {
      return NextResponse.json(
        { error: 'Missing relativePath or content' },
        { status: 400 }
      );
    }

    const fullPath = path.join(markdownDirectory, relativePath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Write file
    fs.writeFileSync(fullPath, content, 'utf8');

    return NextResponse.json({ success: true, path: relativePath });
  } catch (error) {
    console.error('Error updating file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const relativePath = searchParams.get('path');

    if (!relativePath) {
      return NextResponse.json(
        { error: 'Missing path parameter' },
        { status: 400 }
      );
    }

    const fullPath = path.join(markdownDirectory, relativePath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Delete file
    fs.unlinkSync(fullPath);
    
    // Remove from stats
    deleteFileStats(relativePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
