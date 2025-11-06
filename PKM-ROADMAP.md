# 🗺️ PKM (Personal Knowledge Management) Roadmap

## Overview

This document outlines the transformation of Sentiment from a file management system into a comprehensive Personal Knowledge Management (PKM) application. Features are prioritized by impact and implementation complexity.

## Completed Features ✅

### 1. Daily Notes / Journal ✅
**Status:** Complete  
**Impact:** High  
**Completed:** 2025-11-06

A robust journaling system with:
- Interactive calendar view for all daily notes
- One-click note creation for any date
- Structured templates with sections for notes, tasks, goals, reflections
- Recent entries sidebar
- Wiki link support for date references (`[[YYYY-MM-DD]]`)
- Auto-tagging with `#journal` and `#daily-note`
- Integration with existing search, backlinks, and export features

**Documentation:** See `DAILY-NOTES.md`

---

## High Priority Features 🔥

### 2. Graph Visualization
**Status:** Pending  
**Impact:** Very High  
**Estimated Effort:** 3-5 days

**Description:**  
Interactive knowledge graph showing relationships between notes via wiki links.

**Features:**
- Force-directed graph layout
- Node size based on backlink count (importance)
- Color coding by tags or folders
- Click nodes to navigate
- Zoom and pan controls
- Filter by tags, search terms, or date range
- Highlight path between two nodes
- Export graph as image

**Technical Approach:**
```typescript
// Library options
import ForceGraph2D from 'react-force-graph-2d';
// or
import { Network } from 'vis-network';

interface GraphNode {
  id: string;
  label: string;
  size: number; // based on backlinks
  color: string; // based on tags
  file: FileData;
}

interface GraphLink {
  source: string;
  target: string;
  type: 'wiki-link' | 'backlink';
}
```

**Components:**
- `components/KnowledgeGraph.tsx` - Main graph visualization
- `app/graph/page.tsx` - Full-screen graph view
- `lib/graph-data.ts` - Graph data generation utilities

**Integration Points:**
- Homepage widget showing mini-graph
- File viewer showing local graph (immediate connections)
- Context menu on nodes for quick actions

---

### 3. Block References & Transclusion
**Status:** Pending  
**Impact:** Very High  
**Estimated Effort:** 4-6 days

**Description:**  
Reference and embed specific paragraphs/blocks from other notes.

**Features:**
- Unique block IDs (e.g., `^block-abc123`)
- Block reference syntax: `[[file#block-id]]`
- Embed syntax: `![[file#block-id]]`
- Show referenced blocks inline
- Update references when source changes
- Block backlinks

**Technical Approach:**
```markdown
## Example Note

This is a paragraph with a unique ID. ^my-block-id

## Another Note

Reference: [[note#my-block-id]]
Embed: ![[note#my-block-id]]
```

**Components:**
- `lib/block-parser.ts` - Extract and manage block IDs
- `lib/block-transclude.ts` - Embed block content
- Extend `lib/wikilinks.ts` for block references

**Implementation Steps:**
1. Auto-generate block IDs on save
2. Parse block reference syntax
3. Resolve and render block content
4. Track block backlinks
5. Handle block updates

---

### 4. Saved Searches / Smart Folders
**Status:** Pending  
**Impact:** High  
**Estimated Effort:** 2-3 days

**Description:**  
Virtual folders based on saved search queries that auto-update.

**Features:**
- Save complex search queries
- Pin to sidebar
- Auto-update results
- Example queries:
  - "All untagged files"
  - "Modified last week"
  - "Contains TODO"
  - "Tagged #project AND #active"

**Technical Approach:**
```typescript
interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: {
    tags?: string[];
    dateRange?: { start: Date; end: Date };
    folders?: string[];
    content?: string;
  };
  color?: string;
  icon?: string;
}
```

**Components:**
- `components/SavedSearches.tsx` - Sidebar list
- `components/SearchBuilder.tsx` - Query builder UI
- `app/search/[id]/page.tsx` - Search results page
- `lib/saved-searches.ts` - Persistence and execution

**Storage:**
- `.sentiment-searches.json` in project root

---

## Medium Priority Features ⭐

### 5. Hierarchical Tags / Nested Tags
**Status:** Pending  
**Impact:** Medium-High  
**Estimated Effort:** 3-4 days

**Description:**  
Support tag hierarchies like `#project/work/client-a`.

**Features:**
- Tag tree visualization
- Parent tag includes children in filters
- Tag renaming across all files
- Auto-suggest tags based on hierarchy
- Collapse/expand tag tree

**Technical Approach:**
```typescript
interface TagNode {
  name: string;
  fullPath: string;
  parent: TagNode | null;
  children: TagNode[];
  fileCount: number;
}

// Example: #project/work/client-a
// Creates tree: project > work > client-a
```

**Components:**
- `components/TagTree.tsx` - Hierarchical tag browser
- `lib/tag-hierarchy.ts` - Tag tree utilities
- Extend `components/TagFilter.tsx`

---

### 6. Metadata Templates
**Status:** Pending  
**Impact:** Medium  
**Estimated Effort:** 2-3 days

**Description:**  
Define frontmatter templates for different note types.

**Features:**
- Note types: Meeting, Project, Person, Reference, Article
- Auto-suggest metadata fields
- Required vs optional fields
- Field validation on save
- Template picker on new file creation

**Technical Approach:**
```typescript
interface NoteTemplate {
  id: string;
  name: string;
  icon: string;
  frontmatter: {
    field: string;
    type: 'string' | 'date' | 'array' | 'number';
    required: boolean;
    default?: any;
  }[];
  bodyTemplate: string;
}

// Example templates
const templates = {
  meeting: {
    name: 'Meeting Notes',
    frontmatter: [
      { field: 'date', type: 'date', required: true },
      { field: 'attendees', type: 'array', required: true },
      { field: 'project', type: 'string', required: false }
    ],
    bodyTemplate: '## Agenda\n\n## Notes\n\n## Action Items'
  }
};
```

**Components:**
- `components/TemplateSelector.tsx` - Choose template
- `components/TemplateFrontmatter.tsx` - Frontmatter form
- `lib/templates.ts` - Template management
- Update `app/new/page.tsx` to use templates

---

### 7. Aliases
**Status:** Pending  
**Impact:** Medium  
**Estimated Effort:** 1-2 days

**Description:**  
Multiple names for the same document.

**Features:**
- Define aliases in frontmatter
- Wiki links resolve to aliases
- Show all aliases in search
- Auto-suggest aliases when linking

**Technical Approach:**
```markdown
---
title: Personal Knowledge Management
aliases: [PKM, Second Brain, Knowledge Base]
---
```

**Implementation:**
- Extend `lib/wikilinks.ts` for alias resolution
- Update search to include aliases
- Show aliases in file metadata
- Update backlink detection

---

## Advanced Features 🚀

### 8. Bidirectional Sync with External Editors
**Status:** Pending  
**Impact:** Very High  
**Estimated Effort:** 5-7 days

**Description:**  
Edit files in Obsidian, VS Code, or other editors with live sync.

**Features:**
- File system watcher for changes
- Conflict resolution UI
- Git integration
- Import/export to common formats

**Technical Approach:**
```typescript
import chokidar from 'chokidar';

const watcher = chokidar.watch('markdown/**/*.md', {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true
});

watcher.on('change', path => {
  // Reload file data
  // Check for conflicts
  // Emit update event
});
```

**Conflict Resolution:**
- Show diff view
- Allow user to choose version
- Merge changes option

---

### 9. Spaced Repetition / Flashcards
**Status:** Pending  
**Impact:** Medium-High (for learning use case)  
**Estimated Effort:** 4-5 days

**Description:**  
Built-in SRS system for knowledge retention.

**Features:**
- Flashcard syntax: `Q: Question? | A: Answer`
- SM-2 or FSRS algorithm
- Review queue sorted by due date
- Statistics dashboard
- Export to Anki

**Technical Approach:**
```markdown
## Flashcards

Q: What is the capital of France? | A: Paris ^flashcard-1
Q: What year did WWII end? | A: 1945 ^flashcard-2
```

**Components:**
- `components/FlashcardReview.tsx` - Review UI
- `app/review/page.tsx` - Review session
- `lib/srs-algorithm.ts` - Spaced repetition logic
- `.sentiment-srs.json` - Review history

---

### 10. Timeline View
**Status:** Pending  
**Impact:** Medium  
**Estimated Effort:** 2-3 days

**Description:**  
Chronological view of all notes and edits.

**Features:**
- Visual timeline of notes by creation/modification date
- Filter by date range, tags, folders
- Show edit history
- "On this day" feature (past years)
- Zoom levels (day, week, month, year)

**Components:**
- `components/Timeline.tsx` - Visual timeline
- `app/timeline/page.tsx` - Timeline view
- Group by day/week/month

---

### 11. Database Layer
**Status:** Pending  
**Impact:** Very High (for scaling)  
**Estimated Effort:** 7-10 days

**Description:**  
Hybrid file + database approach for better performance.

**Features:**
- SQLite or PostgreSQL for metadata
- Full-text search index (Meilisearch, Tantivy)
- Keep markdown files as source of truth
- Fast queries and relationships

**Technical Approach:**
```typescript
// Schema
interface NoteMetadata {
  id: string;
  path: string;
  title: string;
  tags: string[];
  created: Date;
  modified: Date;
  wordCount: number;
  backlinks: string[];
  outgoingLinks: string[];
}

// Index on create/update
db.notes.upsert(metadata);
searchIndex.add(metadata);
```

**Benefits:**
- Sub-second search across 10,000+ notes
- Complex queries (e.g., "notes created last week with >500 words")
- Instant graph generation
- Statistics and analytics

---

## Quick Wins 🎯

### 12. Recently Modified / Frequently Accessed
**Status:** Pending  
**Impact:** Low-Medium  
**Estimated Effort:** 1 day

**Features:**
- Track file access statistics
- "Recently viewed" section on homepage
- "Most linked" notes list
- "Recently modified" list
- Persist in `.sentiment-stats.json`

---

### 13. Orphan Detection
**Status:** Pending  
**Impact:** Low-Medium  
**Estimated Effort:** 1 day

**Features:**
- Report notes with no incoming or outgoing links
- "Connection score" metric
- Suggest potential links using NLP/similarity
- Bulk actions to connect orphans

---

### 14. Keyboard Shortcuts
**Status:** Pending  
**Impact:** Low  
**Estimated Effort:** 1-2 days

**Shortcuts:**
- `Cmd/Ctrl + K` - Quick search
- `Cmd/Ctrl + N` - New note
- `Cmd/Ctrl + J` - Open today's journal
- `Cmd/Ctrl + G` - Open graph view
- `Cmd/Ctrl + [/]` - Navigate back/forward
- `Cmd/Ctrl + B` - Toggle sidebar
- `Cmd/Ctrl + P` - Command palette

**Implementation:**
```typescript
import { useHotkeys } from 'react-hotkeys-hook';

useHotkeys('cmd+k, ctrl+k', () => openSearch());
useHotkeys('cmd+j, ctrl+j', () => openTodayJournal());
```

---

## Collaboration Features 🤝

### 15. Share & Collaborate
**Status:** Pending (Postponed to later phase)  
**Impact:** High (for teams)  
**Estimated Effort:** 10+ days

**Features:**
- Share individual notes (read-only links)
- Comment threads
- Real-time collaborative editing (Y.js/CRDT)
- Workspace permissions

---

## Mobile & Platform Extensions 📱

### 16. Mobile App
**Status:** Pending (Long-term)  
**Impact:** High  
**Estimated Effort:** 30+ days

**Features:**
- Native iOS/Android apps
- Sync with desktop
- Offline support
- Quick capture widget
- Touch-optimized editor

---

## Explicitly Postponed ⏸️

These features are valuable but postponed per user request:

- **AI-Powered Features** (auto-summarization, suggestions, Q&A)
- **Plugin System** (extensible architecture, marketplace)

---

## Implementation Priority Order

Based on impact and effort, recommended implementation order:

1. ✅ **Daily Notes / Journal** (Complete)
2. 🔜 **Quick Wins** (Recently modified, orphan detection, keyboard shortcuts) - 2-3 days
3. 🔜 **Graph Visualization** - 3-5 days
4. 🔜 **Saved Searches** - 2-3 days
5. 🔜 **Aliases** - 1-2 days
6. 🔜 **Metadata Templates** - 2-3 days
7. 🔜 **Block References & Transclusion** - 4-6 days
8. 🔜 **Hierarchical Tags** - 3-4 days
9. 🔜 **Timeline View** - 2-3 days
10. 🔜 **Spaced Repetition** - 4-5 days
11. 🔜 **Bidirectional Sync** - 5-7 days
12. 🔜 **Database Layer** - 7-10 days (when scaling needed)

**Total Estimated Time (items 2-11):** 29-44 days

---

## Dependencies & Packages

### Current Dependencies
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- react-markdown
- gray-matter
- @dnd-kit

### Potential New Dependencies

**Graph Visualization:**
- `react-force-graph-2d` or `vis-network` or `cytoscape`

**File Watching:**
- `chokidar`

**Database:**
- `better-sqlite3` or `pg` (PostgreSQL)
- `drizzle-orm` or `prisma`

**Search:**
- `meilisearch-js` (if using Meilisearch)

**Keyboard Shortcuts:**
- `react-hotkeys-hook`

**Collaborative Editing:**
- `yjs` + `y-websocket`

---

## Success Metrics

Track these metrics to measure PKM effectiveness:

- **Total Notes:** Count of all notes
- **Daily Note Streak:** Consecutive days with journal entries
- **Link Density:** Average links per note
- **Orphan Rate:** % of notes with no links
- **Search Usage:** Search queries per day
- **Most Connected Notes:** Top 10 by backlinks
- **Tag Coverage:** % of notes with tags
- **Weekly Note Creation:** New notes per week

---

## Community & Feedback

Once core features are stable:

- Create public demo
- Gather user feedback
- Prioritize features based on usage
- Open source considerations

---

**Last Updated:** 2025-11-06  
**Status:** 1/16 features complete (Daily Notes ✅)
