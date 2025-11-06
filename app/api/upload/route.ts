import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const markdownDirectory = path.join(process.cwd(), 'markdown');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderPath = formData.get('folderPath') as string || '';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check if it's a markdown file
    if (!file.name.endsWith('.md')) {
      return NextResponse.json(
        { error: 'Only markdown (.md) files are supported' },
        { status: 400 }
      );
    }

    const targetDir = path.join(markdownDirectory, folderPath);
    const targetPath = path.join(targetDir, file.name);

    // Check if file already exists
    if (fs.existsSync(targetPath)) {
      return NextResponse.json(
        { error: 'File already exists' },
        { status: 409 }
      );
    }

    // Ensure directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Write file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(targetPath, buffer);

    const relativePath = path.join(folderPath, file.name);

    return NextResponse.json({
      success: true,
      path: relativePath,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
