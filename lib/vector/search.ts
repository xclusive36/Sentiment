/**
 * Semantic search using vector embeddings
 * Finds similar documents based on meaning rather than keywords
 */

import { generateEmbedding, cosineSimilarity } from './embeddings';
import { getAllDocuments, type VectorDocument } from './storage';

export interface SearchResult {
  document: VectorDocument;
  similarity: number;
}

export interface SearchOptions {
  /** Minimum similarity score (0-1) */
  threshold?: number;
  /** Maximum number of results */
  limit?: number;
  /** Filter by metadata */
  filter?: (doc: VectorDocument) => boolean;
}

/**
 * Search for similar documents using semantic similarity
 */
export async function search(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    threshold = 0.3,
    limit = 10,
    filter = () => true,
  } = options;

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);

  // Get all documents
  const documents = await getAllDocuments();

  // Calculate similarities
  const results: SearchResult[] = documents
    .filter(filter)
    .map((doc) => ({
      document: doc,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding),
    }))
    .filter((result) => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return results;
}

/**
 * Find documents similar to a given document
 */
export async function findSimilar(
  documentId: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    threshold = 0.5,
    limit = 5,
    filter = () => true,
  } = options;

  const documents = await getAllDocuments();
  const targetDoc = documents.find((doc) => doc.id === documentId);

  if (!targetDoc) {
    throw new Error(`Document ${documentId} not found`);
  }

  const results: SearchResult[] = documents
    .filter((doc) => doc.id !== documentId)
    .filter(filter)
    .map((doc) => ({
      document: doc,
      similarity: cosineSimilarity(targetDoc.embedding, doc.embedding),
    }))
    .filter((result) => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return results;
}

/**
 * Cluster documents by similarity
 * Simple k-means clustering implementation
 */
export async function clusterDocuments(
  k: number = 5
): Promise<VectorDocument[][]> {
  const documents = await getAllDocuments();

  if (documents.length === 0) {
    return [];
  }

  if (documents.length <= k) {
    return documents.map((doc) => [doc]);
  }

  // Initialize centroids randomly
  const centroids: number[][] = [];
  const usedIndices = new Set<number>();

  while (centroids.length < k) {
    const randomIndex = Math.floor(Math.random() * documents.length);
    if (!usedIndices.has(randomIndex)) {
      centroids.push([...documents[randomIndex].embedding]);
      usedIndices.add(randomIndex);
    }
  }

  // Run k-means iterations
  const maxIterations = 10;
  let clusters: VectorDocument[][] = [];

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign documents to nearest centroid
    clusters = Array.from({ length: k }, () => []);

    documents.forEach((doc) => {
      let nearestCentroid = 0;
      let maxSimilarity = -1;

      centroids.forEach((centroid, i) => {
        const similarity = cosineSimilarity(doc.embedding, centroid);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          nearestCentroid = i;
        }
      });

      clusters[nearestCentroid].push(doc);
    });

    // Update centroids
    centroids.forEach((_, i) => {
      if (clusters[i].length > 0) {
        const dimensions = clusters[i][0].embedding.length;
        const newCentroid = new Array(dimensions).fill(0);

        clusters[i].forEach((doc) => {
          doc.embedding.forEach((val, dim) => {
            newCentroid[dim] += val;
          });
        });

        newCentroid.forEach((val, dim) => {
          newCentroid[dim] = val / clusters[i].length;
        });

        centroids[i] = newCentroid;
      }
    });
  }

  return clusters.filter((cluster) => cluster.length > 0);
}

/**
 * Get topic suggestions based on document clusters
 */
export async function suggestTopics(
  numTopics: number = 5
): Promise<{ topic: string; documents: VectorDocument[] }[]> {
  const clusters = await clusterDocuments(numTopics);

  return clusters.map((cluster, i) => {
    // Extract most common words from cluster
    const allWords = cluster
      .flatMap((doc) => doc.text.toLowerCase().split(/\s+/))
      .filter((word) => word.length > 3);

    const wordFreq = new Map<string, number>();
    allWords.forEach((word) => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    const topWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((entry) => entry[0]);

    return {
      topic: topWords.join(', ') || `Topic ${i + 1}`,
      documents: cluster,
    };
  });
}
