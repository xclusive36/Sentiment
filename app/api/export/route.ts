import { NextRequest, NextResponse } from 'next/server';
import { getMarkdownFileByPath } from '@/lib/files';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const relativePath = searchParams.get('path');
    const format = searchParams.get('format') || 'html';

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

    if (format === 'html') {
      // Simple markdown to HTML conversion (basic)
      const contentHtml = file.content
        .split('\n')
        .map(line => {
          // Headers
          if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
          if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
          if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
          // Bold and italic
          line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          line = line.replace(/\*(.+?)\*/g, '<em>$1</em>');
          // Code
          line = line.replace(/`(.+?)`/g, '<code>$1</code>');
          // Links
          line = line.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
          // Paragraphs
          if (line.trim() && !line.startsWith('<')) return `<p>${line}</p>`;
          return line;
        })
        .join('\n');

      // Create styled HTML document
      const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${file.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: #f8fafc;
      padding: 2rem;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 3rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .meta {
      color: #64748b;
      font-size: 0.875rem;
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .tags {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 0.75rem;
    }
    .tag {
      background: #f1f5f9;
      color: #475569;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8125rem;
    }
    .content h1, .content h2, .content h3, .content h4, .content h5, .content h6 {
      margin-top: 2rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    .content h2 {
      font-size: 1.875rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .content h3 {
      font-size: 1.5rem;
    }
    .content p {
      margin-bottom: 1rem;
    }
    .content ul, .content ol {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    .content li {
      margin-bottom: 0.5rem;
    }
    .content code {
      background: #f1f5f9;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.875em;
      font-family: 'Courier New', monospace;
    }
    .content pre {
      background: #1e293b;
      color: #f8fafc;
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin-bottom: 1rem;
    }
    .content pre code {
      background: transparent;
      padding: 0;
    }
    .content blockquote {
      border-left: 4px solid #3b82f6;
      padding-left: 1rem;
      color: #64748b;
      font-style: italic;
      margin: 1rem 0;
    }
    .content a {
      color: #3b82f6;
      text-decoration: none;
    }
    .content a:hover {
      text-decoration: underline;
    }
    .content img {
      max-width: 100%;
      height: auto;
      border-radius: 0.5rem;
      margin: 1rem 0;
    }
    .footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 0.875rem;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        padding: 1rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${file.title}</h1>
      <div class="meta">
        <span>Created: ${new Date(file.stats.created).toLocaleDateString()}</span>
        <span>Modified: ${new Date(file.stats.modified).toLocaleDateString()}</span>
        <span>Size: ${formatFileSize(file.stats.size)}</span>
      </div>
      ${file.tags && file.tags.length > 0 ? `
      <div class="tags">
        ${file.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
      ` : ''}
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      Exported from Sentiment on ${new Date().toLocaleDateString()}
    </div>
  </div>
</body>
</html>`;

      return new NextResponse(htmlDocument, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${file.slug}.html"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Unsupported format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error exporting file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
