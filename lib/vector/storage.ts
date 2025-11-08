/**
 * Vector storage and retrieval using IndexedDB
 * Persists embeddings locally for fast semantic search
 */

export interface VectorDocument {
  id: string;
  text: string;
  embedding: number[];
  metadata: VectorMetadata;
  timestamp: number;
}

// Well-defined metadata stored alongside vector documents
export interface VectorMetadata {
  /** Full path or identifier of the source file */
  path?: string;
  /** File name, usually derived from path */
  fileName?: string;
  /** If this vector represents a chunk, the id of the parent document */
  parentId?: string;
  /** Chunk index (0-based) when document is chunked */
  chunkIndex?: number;
  /** Total number of chunks for the parent document */
  totalChunks?: number;
  /** Optional tags or labels */
  tags?: string[];
}

const DB_NAME = 'sentiment-vectors';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

let db: IDBDatabase | null = null;

/**
 * Initialize the vector database
 */
export async function initVectorDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        });

        // Create indexes for efficient querying
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('metadata', 'metadata', { unique: false });
      }
    };
  });
}

/**
 * Store a document with its embedding
 */
export async function storeDocument(doc: VectorDocument): Promise<void> {
  const database = await initVectorDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(doc);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Store multiple documents
 */
export async function storeDocuments(docs: VectorDocument[]): Promise<void> {
  const database = await initVectorDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    let completed = 0;
    let hasError = false;

    docs.forEach((doc) => {
      const request = store.put(doc);

      request.onsuccess = () => {
        completed++;
        if (completed === docs.length && !hasError) {
          resolve();
        }
      };

      request.onerror = () => {
        if (!hasError) {
          hasError = true;
          reject(request.error);
        }
      };
    });

    if (docs.length === 0) {
      resolve();
    }
  });
}

/**
 * Retrieve a document by ID
 */
export async function getDocument(id: string): Promise<VectorDocument | null> {
  const database = await initVectorDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve all documents
 */
export async function getAllDocuments(): Promise<VectorDocument[]> {
  const database = await initVectorDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a document
 */
export async function deleteDocument(id: string): Promise<void> {
  const database = await initVectorDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all documents
 */
export async function clearAllDocuments(): Promise<void> {
  const database = await initVectorDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get document count
 */
export async function getDocumentCount(): Promise<number> {
  const database = await initVectorDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
