# 📁 Sentiment - Professional PKM System

**Sentiment** is a powerful Personal Knowledge Management (PKM) system built with Next.js, featuring markdown editing, wiki-style linking, full-text search, spaced repetition learning, and seamless integration with external editors.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![SQLite](https://img.shields.io/badge/SQLite-FTS5-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### 📝 Core Note Management
- **Markdown Editing**: Create, edit, and manage markdown files with frontmatter support
- **Drag-and-Drop Organization**: Reorder files and folders with intuitive drag-and-drop
- **File Upload**: Bulk upload markdown files
- **Export**: Export notes as HTML
- **Dark Mode**: Full dark mode support throughout

### 🔗 Linking & References
- **Wiki-Style Links**: `[[note-name]]` syntax for bidirectional linking
- **Backlinks**: Automatic backlink detection and display
- **Block References**: Reference specific paragraphs with `^block-id`
- **Transclusion**: Embed content from other notes with `![[note#block]]`
- **Aliases**: Multiple names for the same document

### 🏷️ Organization
- **Hierarchical Tags**: Nested tag structures like `#project/work/client`
- **Tag Browser**: Visual tree view with expand/collapse
- **Folders**: Organize notes in nested folder structures
- **Metadata Templates**: 6 built-in templates (Meeting Notes, Project, Person, Article, Book Notes, Decision Log)

### 🔍 Search & Discovery
- **Full-Text Search (FTS5)**: Lightning-fast SQLite FTS5 search engine
- **Relevance Ranking**: Results ranked by relevance with snippet highlighting
- **Saved Searches**: Create and pin complex search queries
- **Smart Folders**: Virtual folders based on search criteria
- **Tag Filtering**: Filter by single or multiple tags

### 📊 Insights & Analytics
- **Statistics Dashboard**: File counts, orphan detection, connection scoring
- **Recently Viewed**: Track frequently accessed notes
- **Most Accessed**: Identify your most important notes
- **Orphan Detection**: Find notes with no connections
- **Authority Notes**: Discover highly referenced notes
- **Connection Scoring**: 0-100 scale based on backlinks and references

### 📅 Daily Notes & Journal
- **Interactive Calendar**: Navigate daily notes by date
- **Daily Templates**: Structured sections (Notes, Tasks, Goals, Reflections)
- **Auto-Creation**: Automatic daily note generation
- **Date Wiki Links**: Link to specific dates with `[[YYYY-MM-DD]]`
- **Recent Entries**: Quick access to recent journal entries

### 🧠 Learning & Memory
- **Spaced Repetition**: SM-2 algorithm for optimal review timing
- **Flashcards**: Create cards with `Q:` and `A:` syntax
- **Study Sessions**: Organized review queues (due, new, learning)
- **Progress Tracking**: Monitor retention rates and streaks
- **Auto-Sync**: Extract flashcards from all markdown files

### 🎯 Visualization
- **Knowledge Graph**: Interactive force-directed graph visualization
- **Node Coloring**: Color-coded by connection strength (hubs, well-connected, isolated)
- **Timeline View**: Chronological view of all notes
- **Hover Interactions**: Highlight connections on hover
- **Click to Navigate**: Jump to notes from graph view

### 🔄 External Editor Sync
- **Real-Time File Watching**: Detect changes from VS Code, Obsidian, Vim, etc.
- **Bidirectional Sync**: Changes flow both ways instantly
- **Conflict Detection**: Automatic conflict resolution with backup creation
- **Debounced Updates**: Efficient change handling
- **Universal Support**: Works with any text editor

### 🗄️ Database Layer
- **SQLite with FTS5**: High-performance full-text search
- **Metadata Indexing**: Tags, links, and aliases indexed for fast queries
- **WAL Mode**: Concurrent read/write performance
- **Analytics Tracking**: Word counts, access counts, timestamps
- **Link Resolution**: Track resolved and unresolved wikilinks
- **Transaction Support**: Batch operations for efficiency

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/xclusive36/Sentiment.git
cd sentiment

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First-Time Setup

1. The app will create a `markdown/` directory for your notes
2. The database will initialize automatically on first run
3. Create your first note or upload existing markdown files
4. Enable external editor sync from the Sync page

## 📁 Project Structure

```
sentiment/
├── app/                    # Next.js App Router pages
│   ├── api/               # API endpoints (16 routes)
│   ├── database/          # Database management
│   ├── file/[slug]/       # File viewer and editor
│   ├── graph/             # Knowledge graph
│   ├── insights/          # Analytics dashboard
│   ├── journal/           # Daily notes
│   ├── searches/          # Saved searches
│   ├── study/             # Flashcard review
│   ├── sync/              # External editor sync
│   ├── tags/              # Tag browser
│   └── timeline/          # Timeline view
├── components/            # React components (50+)
├── lib/                   # Core libraries
│   ├── files.ts          # File management
│   ├── database.ts       # SQLite operations
│   ├── wikilinks.ts      # Link parsing
│   ├── graph.ts          # Graph generation
│   ├── spaced-repetition.ts  # SM-2 algorithm
│   ├── file-watcher.ts   # External sync
│   └── ...               # More utilities
└── markdown/              # Your notes (gitignored)
```

## 🎨 Key Technologies

- **Next.js 16**: App Router, Server Components, React 19
- **TypeScript**: Full type safety
- **SQLite**: better-sqlite3 with FTS5
- **Tailwind CSS**: Styling and dark mode
- **react-force-graph-2d**: Graph visualization
- **chokidar**: File system watching
- **gray-matter**: Frontmatter parsing

## 📖 Usage Examples

### Creating Wiki Links
```markdown
Link to another note: [[My Note]]
Link with custom text: [[My Note|Click Here]]
Link to daily note: [[2024-01-15]]
```

### Block References & Transclusion
```markdown
This is a paragraph I want to reference later. ^my-block

Embed a block: ![[Other Note#my-block]]
Embed entire file: ![[Other Note]]
```

### Hierarchical Tags
```yaml
---
tags:
  - project/work/client-a
  - meeting/weekly
  - status/active
---
```

### Creating Flashcards
```markdown
Q: What is the capital of France?
A: Paris

Q: What is 2 + 2?
A: 4
```

### Metadata Templates
```yaml
---
title: Meeting with Team
type: meeting
date: 2024-01-15
attendees:
  - Alice
  - Bob
tags:
  - meeting/team
---
```

## 🔧 Configuration

Configuration files are automatically created and stored in:
- `.sentiment-order.json` - File and folder ordering
- `.sentiment-stats.json` - Access statistics
- `.sentiment-searches.json` - Saved searches
- `.sentiment-templates.json` - Custom templates
- `.sentiment-flashcards.json` - Flashcard reviews
- `.sentiment-db.sqlite` - Main database

## 🌐 API Endpoints

| Endpoint | Purpose |
|----------|----------|
| `/api/files` | File CRUD operations |
| `/api/search` | Search notes |
| `/api/database` | Database queries and FTS search |
| `/api/sync` | External editor sync control |
| `/api/flashcards` | Flashcard management |
| `/api/stats` | Access statistics |
| `/api/saved-searches` | Saved search CRUD |
| `/api/templates` | Template management |
| `/api/daily-note` | Daily note operations |
| `/api/order` | File ordering |
| `/api/export` | Export notes |
| `/api/upload` | Bulk file upload |

## 🎯 Roadmap

- [x] Daily Notes & Journal
- [x] Statistics & Insights
- [x] Aliases
- [x] Saved Searches
- [x] Metadata Templates
- [x] Timeline View
- [x] Hierarchical Tags
- [x] Block References & Transclusion
- [x] Knowledge Graph
- [x] Spaced Repetition
- [x] External Editor Sync
- [x] Database Layer (SQLite + FTS5)
- [ ] Collaboration Features (comments, sharing)
- [ ] Mobile App (iOS/Android)

## 📊 Stats

- **12 Major Features** implemented
- **12 Pages** in the application
- **16 API Endpoints** 
- **50+ Components**
- **~12,500+ Lines of Code**
- **100% TypeScript**
- **Full Dark Mode**

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Inspired by [Obsidian](https://obsidian.md/) and [Roam Research](https://roamresearch.com/)
- Icons from [Heroicons](https://heroicons.com/)

## 📧 Support

For issues and questions, please use the [GitHub Issues](https://github.com/xclusive36/Sentiment/issues) page.

---

**Built with ❤️ by the Sentiment Team**
