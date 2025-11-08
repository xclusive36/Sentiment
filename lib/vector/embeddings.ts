/**
 * Embedding generation using Transformers.js
 * Generates vector embeddings for semantic search
 */

import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js environment
env.allowLocalModels = false;
env.useBrowserCache = true;

// Minimal shape for the embedding pipeline's callable result.
// The actual transformers.js pipeline returns an object with a callable signature.
// We only need to call it with (text, options) and access output.data (Float32Array-like).
// We keep the pipeline loosely typed to avoid pulling in full transformer types.
// The returned object from `pipeline('feature-extraction', ...)` is callable and returns
// a structure with a `data` field (TypedArray). We'll capture that minimally.
type EmbeddingOutput = { data: { length: number; [i: number]: number } };
type EmbeddingPipeline = (text: string, options?: { pooling?: 'mean' | 'none'; normalize?: boolean }) => Promise<EmbeddingOutput>;

// Use `unknown` initially, narrow after load.
let embeddingPipeline: EmbeddingPipeline | null = null;

/**
 * Initialize the embedding model
 * Uses all-MiniLM-L6-v2 (384 dimensions, fast, good quality)
 */
export async function initializeEmbeddings() {
  if (!embeddingPipeline) {
    try {
      const loaded: unknown = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      // Best-effort runtime shape validation
      if (typeof loaded === 'function') {
        embeddingPipeline = loaded as EmbeddingPipeline;
        console.log('Embedding model loaded successfully');
      } else {
        throw new Error('Unexpected embedding pipeline shape');
      }
    } catch (error) {
      console.error('Failed to load embedding model:', error);
      throw error;
    }
  }
  return embeddingPipeline as EmbeddingPipeline;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = await initializeEmbeddings();
  const output = await model(text, {
    pooling: 'mean',
    normalize: true,
  });
  return Array.from(output.data as ArrayLike<number>);
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);
  }

  return embeddings;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
