import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const markdownDirectory = path.join(process.cwd(), 'markdown');
const dailyNotesFolder = 'journal';

export interface DailyNoteInfo {
  date: Date;
  path: string;
  exists: boolean;
  content?: string;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display (e.g., "Monday, January 1, 2024")
 */
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get the path for a daily note
 */
export function getDailyNotePath(date: Date): string {
  const filename = `${formatDateForFilename(date)}.md`;
  return path.join(dailyNotesFolder, filename);
}

/**
 * Generate daily note template
 */
export function generateDailyNoteTemplate(date: Date): string {
  const displayDate = formatDateForDisplay(date);
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
  
  return `---
title: ${displayDate}
date: ${date.toISOString()}
tags: [journal, daily-note]
---

# ${displayDate}

## 📝 Notes

<!-- Your thoughts, ideas, and notes for today -->

## ✅ Tasks

- [ ] 

## 🎯 Goals

- 

## 💭 Reflections

<!-- End of day reflections -->

---

**Day of Week:** ${dayOfWeek}
`;
}

/**
 * Check if a daily note exists
 */
export function dailyNoteExists(date: Date): boolean {
  const relativePath = getDailyNotePath(date);
  const fullPath = path.join(markdownDirectory, relativePath);
  return fs.existsSync(fullPath);
}

/**
 * Get daily note info
 */
export function getDailyNoteInfo(date: Date): DailyNoteInfo {
  const relativePath = getDailyNotePath(date);
  const fullPath = path.join(markdownDirectory, relativePath);
  const exists = fs.existsSync(fullPath);
  
  let content: string | undefined;
  if (exists) {
    content = fs.readFileSync(fullPath, 'utf8');
  }
  
  return {
    date,
    path: relativePath,
    exists,
    content,
  };
}

/**
 * Create a daily note
 */
export function createDailyNote(date: Date, customContent?: string): string {
  const relativePath = getDailyNotePath(date);
  const fullPath = path.join(markdownDirectory, relativePath);
  
  // Ensure journal directory exists
  const journalDir = path.join(markdownDirectory, dailyNotesFolder);
  if (!fs.existsSync(journalDir)) {
    fs.mkdirSync(journalDir, { recursive: true });
  }
  
  // Don't overwrite existing notes
  if (fs.existsSync(fullPath)) {
    return relativePath;
  }
  
  const content = customContent || generateDailyNoteTemplate(date);
  fs.writeFileSync(fullPath, content, 'utf8');
  
  return relativePath;
}

/**
 * Get all daily notes in a date range
 */
export function getDailyNotesInRange(startDate: Date, endDate: Date): DailyNoteInfo[] {
  const notes: DailyNoteInfo[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    notes.push(getDailyNoteInfo(new Date(currentDate)));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return notes;
}

/**
 * Get all existing daily notes
 */
export function getAllDailyNotes(): DailyNoteInfo[] {
  const journalDir = path.join(markdownDirectory, dailyNotesFolder);
  
  if (!fs.existsSync(journalDir)) {
    return [];
  }
  
  const files = fs.readdirSync(journalDir);
  const notes: DailyNoteInfo[] = [];
  
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    
    const filename = path.basename(file, '.md');
    // Parse YYYY-MM-DD format
    const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    
    if (match) {
      const [, year, month, day] = match;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      notes.push(getDailyNoteInfo(date));
    }
  }
  
  // Sort by date descending (newest first)
  notes.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  return notes;
}

/**
 * Get today's date at midnight in local time
 */
export function getTodayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Parse date from YYYY-MM-DD string
 */
export function parseDate(dateString: string): Date | null {
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  
  const [, year, month, day] = match;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}
