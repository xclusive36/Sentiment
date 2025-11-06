import { NextRequest, NextResponse } from 'next/server';
import { getMarkdownFileByPath, getAllMarkdownFiles } from '@/lib/files';
import { findBacklinks } from '@/lib/wikilinks';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const relativePath = searchParams.get('path');

    if (!relativePath) {
      return NextResponse.json(
        { error: 'Missing path parameter' },
        { status: 400 }
      );
    }

    const file = getMarkdownFileByPath(relativePath);

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Get backlinks
    const structure = getAllMarkdownFiles();
    const backlinks = findBacklinks(relativePath, structure);

    return NextResponse.json({
      title: file.title,
      content: file.content,
      relativePath: file.relativePath,
      tags: file.tags,
      backlinks,
      stats: file.stats,
    });
  } catch (error) {
    console.error('Error getting file content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
