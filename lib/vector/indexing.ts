/**
 * Indexing utilities for building and maintaining vector index
 * Processes markdown files and generates searchable embeddings
 */

import { generateEmbedding } from './embeddings';
import { storeDocument, storeDocuments, type VectorDocument, type VectorMetadata } from './storage';

export interface IndexOptions {
  /** Chunk size in characters */
  chunkSize?: number;
  /** Overlap between chunks */
  chunkOverlap?: number;
  /** Progress callback */
  onProgress?: (current: number, total: number) => void;
}

/**
 * Split text into overlapping chunks
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 100
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);

    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim());
    }

    start += chunkSize - overlap;
  }

  return chunks;
}

/**
 * Index a single document
 */
export async function indexDocument(
  id: string,
  text: string,
  metadata: VectorMetadata = {},
  options: IndexOptions = {}
): Promise<void> {
  const { chunkSize = 500, chunkOverlap = 100 } = options;

  // For shorter documents, index as a single chunk
  if (text.length <= chunkSize) {
    const embedding = await generateEmbedding(text);

    const doc: VectorDocument = {
      id,
      text,
      embedding,
      metadata,
      timestamp: Date.now(),
    };

    await storeDocument(doc);
    return;
  }

  // For longer documents, chunk and index
  const chunks = chunkText(text, chunkSize, chunkOverlap);

  const docs: VectorDocument[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i]);

    docs.push({
      id: `${id}-chunk-${i}`,
      text: chunks[i],
      embedding,
      metadata: {
        ...metadata,
        parentId: id,
        chunkIndex: i,
        totalChunks: chunks.length,
      },
      timestamp: Date.now(),
    });
  }

  await storeDocuments(docs);
}

/**
 * Index multiple documents
 */
export async function indexDocuments(
  documents: { id: string; text: string; metadata?: VectorMetadata }[],
  options: IndexOptions = {}
): Promise<void> {
  const { onProgress } = options;

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    await indexDocument(doc.id, doc.text, doc.metadata, options);

    if (onProgress) {
      onProgress(i + 1, documents.length);
    }
  }
}

/**
 * Extract text content from markdown
 * Removes frontmatter and formatting
 */
export function extractTextFromMarkdown(markdown: string): string {
  let text = markdown;

  // Remove frontmatter (YAML between --- markers)
  text = text.replace(/^---\n[\s\S]*?\n---\n/m, '');

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');

  // Remove inline code
  text = text.replace(/`[^`]+`/g, '');

  // Remove links but keep text
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

  // Remove images
  text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '');

  // Remove headers
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Remove bold/italic
  text = text.replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1');

  // Remove strikethrough
  text = text.replace(/~~([^~]+)~~/g, '$1');

  // Remove blockquotes
  text = text.replace(/^>\s+/gm, '');

  // Remove list markers
  text = text.replace(/^[-*+]\s+/gm, '');
  text = text.replace(/^\d+\.\s+/gm, '');

  // Remove task list markers
  text = text.replace(/^- \[[ x]\]\s+/gm, '');

  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}$/gm, '');

  // Normalize whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();

  return text;
}

/**
 * Build index from file system
 */
export async function buildIndexFromFiles(
  files: { path: string; content: string }[],
  options: IndexOptions = {}
): Promise<void> {
  const documents = files.map((file) => ({
    id: file.path,
    text: extractTextFromMarkdown(file.content),
    metadata: {
      path: file.path,
      fileName: file.path.split('/').pop(),
    },
  }));

  await indexDocuments(documents, options);
}
