import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { getAllMarkdownFiles, type FileData } from './files';

const DB_PATH = path.join(process.cwd(), '.sentiment-db.sqlite');

let db: Database.Database | null = null;

/**
 * Initialize the database connection and create tables
 */
export function initializeDatabase(): Database.Database {
  if (db) {
    return db;
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency

  // Create notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      relative_path TEXT NOT NULL,
      folder_path TEXT,
      size INTEGER,
      created_at INTEGER NOT NULL,
      modified_at INTEGER NOT NULL,
      last_accessed_at INTEGER,
      access_count INTEGER DEFAULT 0,
      word_count INTEGER DEFAULT 0
    )
  `);

  // Create tags table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);

  // Create note_tags junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS note_tags (
      note_id TEXT NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (note_id, tag_id),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);

  // Create aliases table
  db.exec(`
    CREATE TABLE IF NOT EXISTS aliases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id TEXT NOT NULL,
      alias TEXT NOT NULL,
      UNIQUE(note_id, alias),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    )
  `);

  // Create links table (wikilinks)
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id TEXT NOT NULL,
      target_slug TEXT NOT NULL,
      link_text TEXT,
      is_resolved BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (source_id) REFERENCES notes(id) ON DELETE CASCADE
    )
  `);

  // Create FTS5 virtual table for full-text search
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
      title,
      content,
      tags,
      content='notes',
      content_rowid='rowid'
    )
  `);

  // Create triggers to keep FTS in sync
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
      INSERT INTO notes_fts(rowid, title, content, tags)
      VALUES (new.rowid, new.title, new.content, '');
    END;
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
      DELETE FROM notes_fts WHERE rowid = old.rowid;
    END;
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
      UPDATE notes_fts 
      SET title = new.title, content = new.content
      WHERE rowid = new.rowid;
    END;
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_notes_slug ON notes(slug);
    CREATE INDEX IF NOT EXISTS idx_notes_modified ON notes(modified_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notes_accessed ON notes(last_accessed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_note_tags_note ON note_tags(note_id);
    CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_id);
    CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_slug);
  `);

  console.log('Database initialized at:', DB_PATH);
  return db;
}

/**
 * Get database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Sync all markdown files to database
 */
export function syncFilesToDatabase(): { added: number; updated: number; deleted: number } {
  const database = getDatabase();
  const structure = getAllMarkdownFiles();
  
  const stats = { added: 0, updated: 0, deleted: 0 };
  
  // Get all file IDs from markdown
  const markdownFileIds = new Set<string>();
  const allFiles: FileData[] = [];
  
  const collectFiles = (files: FileData[]) => {
    files.forEach(file => {
      markdownFileIds.add(file.id);
      allFiles.push(file);
    });
  };
  
  const collectFromFolders = (folders: typeof structure.folders) => {
    folders.forEach(folder => {
      collectFiles(folder.files);
      collectFromFolders(folder.subfolders);
    });
  };
  
  collectFiles(structure.files);
  collectFromFolders(structure.folders);
  
  // Start transaction
  const sync = database.transaction(() => {
    // Upsert notes
    const upsertNote = database.prepare(`
      INSERT INTO notes (id, slug, title, content, excerpt, relative_path, folder_path, 
                        size, created_at, modified_at, word_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        excerpt = excluded.excerpt,
        modified_at = excluded.modified_at,
        word_count = excluded.word_count
    `);
    
    allFiles.forEach(file => {
      const wordCount = file.content.split(/\s+/).length;
      const folderPath = path.dirname(file.relativePath);
      
      const result = upsertNote.run(
        file.id,
        file.slug,
        file.title,
        file.content,
        file.excerpt,
        file.relativePath,
        folderPath === '.' ? '' : folderPath,
        file.stats.size,
        file.stats.created.getTime(),
        file.stats.modified.getTime(),
        wordCount
      );
      
      if (result.changes > 0) {
        stats.updated++;
      }
      
      // Sync tags
      syncNoteTags(file.id, file.tags);
      
      // Sync aliases
      syncNoteAliases(file.id, file.aliases);
      
      // Sync links
      syncNoteLinks(file.id, file.content);
    });
    
    // Delete notes that no longer exist
    const existingNotes = database.prepare('SELECT id FROM notes').all() as { id: string }[];
    existingNotes.forEach(note => {
      if (!markdownFileIds.has(note.id)) {
        database.prepare('DELETE FROM notes WHERE id = ?').run(note.id);
        stats.deleted++;
      }
    });
  });
  
  sync();
  
  stats.added = allFiles.length - stats.updated;
  
  console.log('Database sync complete:', stats);
  return stats;
}

/**
 * Sync tags for a note
 */
function syncNoteTags(noteId: string, tags: string[]): void {
  const database = getDatabase();
  
  // Delete existing tags
  database.prepare('DELETE FROM note_tags WHERE note_id = ?').run(noteId);
  
  if (tags.length === 0) return;
  
  // Insert tags and get IDs
  const insertTag = database.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
  const getTagId = database.prepare('SELECT id FROM tags WHERE name = ?');
  const insertNoteTag = database.prepare('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)');
  
  tags.forEach(tag => {
    insertTag.run(tag);
    const tagRow = getTagId.get(tag) as { id: number } | undefined;
    if (tagRow) {
      insertNoteTag.run(noteId, tagRow.id);
    }
  });
}

/**
 * Sync aliases for a note
 */
function syncNoteAliases(noteId: string, aliases: string[]): void {
  const database = getDatabase();
  
  // Delete existing aliases
  database.prepare('DELETE FROM aliases WHERE note_id = ?').run(noteId);
  
  if (aliases.length === 0) return;
  
  const insertAlias = database.prepare('INSERT INTO aliases (note_id, alias) VALUES (?, ?)');
  aliases.forEach(alias => {
    insertAlias.run(noteId, alias);
  });
}

/**
 * Sync wikilinks for a note
 */
function syncNoteLinks(noteId: string, content: string): void {
  const database = getDatabase();
  
  // Delete existing links
  database.prepare('DELETE FROM links WHERE source_id = ?').run(noteId);
  
  // Extract wikilinks
  const linkPattern = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  const links: Array<{ target: string; text: string | null }> = [];
  
  let match;
  while ((match = linkPattern.exec(content)) !== null) {
    links.push({
      target: match[1].trim(),
      text: match[2]?.trim() || null,
    });
  }
  
  if (links.length === 0) return;
  
  const insertLink = database.prepare(`
    INSERT INTO links (source_id, target_slug, link_text, is_resolved)
    VALUES (?, ?, ?, ?)
  `);
  
  links.forEach(link => {
    // Check if target exists
    const targetExists = database.prepare('SELECT id FROM notes WHERE slug = ?').get(link.target);
    insertLink.run(noteId, link.target, link.text, targetExists ? 1 : 0);
  });
}

/**
 * Full-text search using FTS5
 */
export interface SearchResult {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  relativePath: string;
  rank: number;
  snippet: string;
}

export function fullTextSearch(query: string, limit: number = 50): SearchResult[] {
  const database = getDatabase();
  
  // FTS5 query with snippet highlighting
  const results = database.prepare(`
    SELECT 
      notes.id,
      notes.slug,
      notes.title,
      notes.excerpt,
      notes.relative_path as relativePath,
      notes_fts.rank,
      snippet(notes_fts, 1, '<mark>', '</mark>', '...', 64) as snippet
    FROM notes_fts
    JOIN notes ON notes.rowid = notes_fts.rowid
    WHERE notes_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `).all(query, limit) as SearchResult[];
  
  return results;
}

/**
 * Get note by ID
 */
export function getNoteById(id: string) {
  const database = getDatabase();
  return database.prepare('SELECT * FROM notes WHERE id = ?').get(id);
}

/**
 * Get note by slug
 */
export function getNoteBySlug(slug: string) {
  const database = getDatabase();
  return database.prepare('SELECT * FROM notes WHERE slug = ?').get(slug);
}

/**
 * Get all tags with counts
 */
export function getAllTagsWithCounts(): Array<{ name: string; count: number }> {
  const database = getDatabase();
  return database.prepare(`
    SELECT tags.name, COUNT(note_tags.note_id) as count
    FROM tags
    LEFT JOIN note_tags ON tags.id = note_tags.tag_id
    GROUP BY tags.id, tags.name
    ORDER BY count DESC, tags.name ASC
  `).all() as Array<{ name: string; count: number }>;
}

/**
 * Get notes by tag
 */
export function getNotesByTag(tagName: string) {
  const database = getDatabase();
  return database.prepare(`
    SELECT notes.*
    FROM notes
    JOIN note_tags ON notes.id = note_tags.note_id
    JOIN tags ON note_tags.tag_id = tags.id
    WHERE tags.name = ?
    ORDER BY notes.modified_at DESC
  `).all(tagName);
}

/**
 * Get database statistics
 */
export function getDatabaseStats() {
  const database = getDatabase();
  
  const noteCount = database.prepare('SELECT COUNT(*) as count FROM notes').get() as { count: number };
  const tagCount = database.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number };
  const linkCount = database.prepare('SELECT COUNT(*) as count FROM links').get() as { count: number };
  const totalSize = database.prepare('SELECT SUM(size) as total FROM notes').get() as { total: number };
  const totalWords = database.prepare('SELECT SUM(word_count) as total FROM notes').get() as { total: number };
  
  return {
    notes: noteCount.count,
    tags: tagCount.count,
    links: linkCount.count,
    totalSize: totalSize.total || 0,
    totalWords: totalWords.total || 0,
    dbSize: fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH).size : 0,
  };
}

/**
 * Record note access
 */
export function recordNoteAccess(noteId: string): void {
  const database = getDatabase();
  database.prepare(`
    UPDATE notes 
    SET last_accessed_at = ?, access_count = access_count + 1
    WHERE id = ?
  `).run(Date.now(), noteId);
}

/**
 * Get most accessed notes
 */
export function getMostAccessedNotes(limit: number = 10) {
  const database = getDatabase();
  return database.prepare(`
    SELECT * FROM notes
    WHERE access_count > 0
    ORDER BY access_count DESC, last_accessed_at DESC
    LIMIT ?
  `).all(limit);
}

/**
 * Get recently modified notes
 */
export function getRecentlyModifiedNotes(limit: number = 10) {
  const database = getDatabase();
  return database.prepare(`
    SELECT * FROM notes
    ORDER BY modified_at DESC
    LIMIT ?
  `).all(limit);
}
