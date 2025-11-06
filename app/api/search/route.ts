import { NextRequest, NextResponse } from 'next/server';
import { getAllMarkdownFiles } from '@/lib/files';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.toLowerCase() || '';

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const structure = getAllMarkdownFiles();
    const allFiles = [...structure.files];

    // Recursively collect files from folders
    const collectFiles = (folders: typeof structure.folders): typeof structure.files => {
      const files: typeof structure.files = [];
      folders.forEach(folder => {
        files.push(...folder.files);
        if (folder.subfolders.length > 0) {
          files.push(...collectFiles(folder.subfolders));
        }
      });
      return files;
    };

    allFiles.push(...collectFiles(structure.folders));

    // Search in title, content, and tags
    const results = allFiles
      .map(file => {
        const titleMatch = file.title.toLowerCase().includes(query);
        const contentMatch = file.content.toLowerCase().includes(query);
        const excerptMatch = file.excerpt.toLowerCase().includes(query);

        if (!titleMatch && !contentMatch && !excerptMatch) {
          return null;
        }

        // Find context snippet
        const contentLower = file.content.toLowerCase();
        const queryIndex = contentLower.indexOf(query);
        let snippet = file.excerpt;

        if (queryIndex !== -1) {
          const start = Math.max(0, queryIndex - 60);
          const end = Math.min(file.content.length, queryIndex + query.length + 60);
          snippet = '...' + file.content.slice(start, end).trim() + '...';
        }

        return {
          id: file.id,
          title: file.title,
          relativePath: file.relativePath,
          snippet,
          matchType: titleMatch ? 'title' : 'content',
        };
      })
      .filter(Boolean);

    return NextResponse.json({ results, query });
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
