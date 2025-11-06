# 📁 Sentiment

A powerful Next.js File Management & Storage Dashboard for managing and exploring markdown files with advanced features.

## Features

### Core Features
- 📄 **Browse Markdown Files** - View all markdown files with nested folder support
- 🔍 **Full-Text Search** - Fast search with live results and context snippets
- 📖 **Markdown Viewer** - Beautiful rendering with syntax highlighting
- ✏️ **File Editor** - Create, edit, and delete markdown files with live preview
- 📤 **File Upload** - Drag-and-drop or browse to upload markdown files
- 🗂️ **Folder Management** - Organize files in nested folders with drag-and-drop
- 📑 **Table of Contents** - Auto-generated TOC with smooth scrolling
- 🧭 **Breadcrumb Navigation** - Easy navigation through nested folders
- 🏷️ **Tags & Filtering** - Tag files and filter by categories
- 🔗 **Wiki Links** - Link between documents with `[[wiki-link]]` syntax
- 🔙 **Backlinks** - See which documents reference current file
- 📥 **HTML Export** - Export files to styled HTML documents
- 🎨 **Modern UI** - Built with Tailwind CSS and responsive design
- 🌙 **Dark Mode** - Automatic dark mode support

## Getting Started

### Installation

The project is already set up! Dependencies are installed.

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Managing Markdown Files

#### Creating New Files
1. Click the "New File" button on the homepage
2. Enter a file name (`.md` extension is optional)
3. Write your content in the editor with live preview
4. Click "Save" to create the file

#### Uploading Files
1. Drag and drop `.md` files onto the upload area
2. Or click "Browse Files" to select files
3. Files are automatically added to your collection

#### Editing Files
1. Open any file
2. Click the "Edit" button
3. Make changes with live preview
4. Click "Save" to update

#### Organizing Files
- Drag files to reorder them
- Drag files into folders to move them
- Create nested folder structures in the `markdown/` directory

### Example Markdown File

```markdown
---
title: My Document
---

# Hello World

This is a markdown file with **bold** and *italic* text.

## Features

- Lists
- Code blocks
- And more!
```

## Project Structure

```
sentiment/
├── app/
│   ├── page.tsx              # Main dashboard page
│   ├── file/[slug]/page.tsx  # Individual file viewer
│   └── globals.css           # Global styles
├── lib/
│   └── files.ts              # File system utilities
├── markdown/                 # Place your .md files here
│   ├── welcome.md
│   └── example.md
└── package.json
```

## Technologies

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **react-markdown** - Markdown rendering
- **gray-matter** - Frontmatter parsing

## Feature Details

### Search
- **Full-text search** across all files
- **Real-time results** with debounced input
- **Context snippets** showing where matches occur
- **Highlighted matches** in results

### Editor
- **Markdown editor** with syntax highlighting
- **Live preview** toggle
- **Frontmatter support** for metadata
- **Auto-save validation**

### Table of Contents
- **Auto-generated** from headings (H1-H6)
- **Active section highlighting** while scrolling
- **Smooth scroll** to sections
- **Sticky sidebar** on desktop

### File Organization
- **Drag-and-drop** file reordering (persisted)
- **Drag-and-drop** folder reordering (persisted)
- **Move files** between folders
- **Nested folder** support
- **Breadcrumb navigation** for deep structures
- **Order persistence** - Custom order saved automatically

### Tags & Categories
- **Frontmatter tags** - Add tags to files via frontmatter
- **Tag filtering** - Filter files by one or more tags
- **Tag display** - Visual tag badges on files
- **Tag collection** - Auto-collect all tags across files

### Wiki Links & Backlinks
- **[[Wiki Links]]** - Link to other files using wiki-style syntax
- **Pipe syntax** - Use `[[file|Display Text]]` for custom text
- **Automatic resolution** - Links automatically find target files
- **Backlinks panel** - See all files that link to current document
- **Context display** - View surrounding text of backlinks

### Export
- **HTML export** - Beautiful styled HTML documents
- **Print-ready** - Optimized for printing
- **Metadata included** - File info and tags in exports

## API Endpoints

- `GET /api/search?q={query}` - Search files
- `GET /api/files/content?path={path}` - Get file content
- `POST /api/files` - Create new file
- `PUT /api/files` - Update existing file
- `DELETE /api/files?path={path}` - Delete file
- `POST /api/upload` - Upload file(s)
- `POST /api/move-file` - Move/rename file
- `POST /api/order` - Save file/folder order
- `GET /api/export?path={path}&format=html` - Export file

## Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
