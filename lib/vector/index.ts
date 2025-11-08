/**
 * Main vector search module
 * Exports all vector search functionality
 */

export * from './embeddings';
export * from './storage';
export * from './search';
export * from './indexing';

import { initializeEmbeddings } from './embeddings';
import { initVectorDB } from './storage';

/**
 * Initialize all vector search components
 */
export async function initVectorSearch(): Promise<void> {
  await Promise.all([
    initializeEmbeddings(),
    initVectorDB(),
  ]);
}
