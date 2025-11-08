# New Features from MarkItUp Integration

This document describes all the new features added to Sentiment from MarkItUp.

## 🎨 WYSIWYG Editor

A rich-text editor powered by TipTap that provides visual editing while maintaining Markdown compatibility.

### Features
- **Rich text formatting**: Bold, italic, strikethrough, code
- **Headings**: H1, H2, H3
- **Lists**: Bullet lists, numbered lists, task lists with checkboxes
- **Blocks**: Blockquotes, code blocks with syntax highlighting, horizontal rules
- **Tables**: Full table support with add/delete rows/columns
- **Links**: Easy link creation and editing
- **Undo/Redo**: Full history support
- **Markdown conversion**: Seamlessly converts between visual and Markdown

### Usage

```tsx
import { WYSIWYGEditor } from '@/components/WYSIWYGEditor';

<WYSIWYGEditor
  content={markdownContent}
  onChange={(markdown) => console.log(markdown)}
  placeholder="Start typing..."
  theme="light"
/>
```

## 🔍 Vector Search

Semantic search using AI embeddings to find notes by meaning, not just keywords.

### Features
- **Semantic similarity**: Find related notes even without exact keyword matches
- **Fast local inference**: Uses Transformers.js for browser-based AI
- **Automatic indexing**: Chunks long documents for better search
- **IndexedDB storage**: Persists embeddings locally
- **Similarity scores**: Shows relevance percentage for each result
- **Clustering**: Automatically groups similar documents

### Usage

```tsx
import { VectorSearch } from '@/components/VectorSearch';

<VectorSearch
  onResultClick={(docId) => openDocument(docId)}
  threshold={0.3}
  limit={10}
/>
```

### Indexing Documents

```ts
import { indexDocument } from '@/lib/vector';

await indexDocument(
  'note-id',
  'Your note content here...',
  { tags: ['important'], project: 'pkm' }
);
```

## 🔌 Plugin System

Extensible plugin architecture for adding custom functionality.

### Built-in Plugins

#### 1. Word Count Plugin
- Real-time word count, character count
- Estimated reading time
- Command palette integration

#### 2. Time Tracker Plugin
- Track time spent on each note
- Idle detection
- Session reports
- Customizable idle timeout

#### 3. Pomodoro Timer Plugin
- Focus timer using Pomodoro Technique
- Configurable work/break durations
- Auto-start options
- Session counter

### Creating Custom Plugins

```ts
import { Plugin, type PluginManifest } from '@/lib/plugin-system';

export class MyPlugin extends Plugin {
  constructor() {
    const manifest: PluginManifest = {
      id: 'my-plugin',
      name: 'My Plugin',
      version: '1.0.0',
      description: 'Does amazing things',
      settings: [
        {
          key: 'enabled',
          label: 'Enable Feature',
          type: 'boolean',
          default: true,
        },
      ],
    };
    super(manifest);
  }

  async onLoad() {
    // Register commands, views, event handlers
    this.context.registerCommand({
      id: 'my-command',
      name: 'My Command',
      callback: () => console.log('Hello!'),
    });
  }

  async onUnload() {
    // Cleanup
  }
}
```

## 💾 Auto-Save

Automatic saving with debouncing to prevent data loss.

### Features
- **Debounced saves**: Waits for typing to stop before saving
- **Save on unmount**: Ensures changes are saved when leaving
- **Lifecycle callbacks**: onSaveStart, onSaveSuccess, onSaveError
- **Configurable delay**: Default 2 seconds

### Usage

```tsx
import { useAutoSave } from '@/hooks/useAutoSave';

const { save, isSaving } = useAutoSave({
  data: content,
  onSave: async (data) => {
    await saveToDatabase(data);
  },
  delay: 2000,
});
```

## ↩️ History Manager

Advanced undo/redo with cursor position tracking.

### Features
- **Debounced captures**: Groups rapid changes
- **Cursor preservation**: Restores cursor position on undo/redo
- **Export/import**: Save and restore history
- **Max history size**: Configurable, default 100 states

### Usage

```tsx
import { useHistoryManager } from '@/hooks/useHistoryManager';

const { undo, redo, canUndo, canRedo } = useHistoryManager({
  content,
  onRestore: (state) => setContent(state),
});
```

## 🎯 Selection Action Bar

Floating toolbar that appears when text is selected.

### Features
- **Context-aware**: Only appears on selection
- **Quick formatting**: Bold, italic, code
- **Smart positioning**: Appears above selection
- **Extensible actions**: Link creation, AI assist, tagging, copy

### Usage

```tsx
import { SelectionActionBar } from '@/components/SelectionActionBar';

<SelectionActionBar
  selectedText={selection}
  selectionRect={rect}
  onBold={() => formatBold()}
  onCreateLink={() => createWikilink()}
  theme="light"
/>
```

## 🏪 State Management

Centralized app state using Zustand with persistence.

### Features
- **Global state**: Editor, UI, search, plugins
- **Persistence**: Saves to localStorage
- **Optimized selectors**: Prevent unnecessary re-renders
- **Type-safe**: Full TypeScript support

### Usage

```tsx
import { useStore, useEditorState, useUIState } from '@/lib/store';

// Use specific slices for better performance
const editor = useEditorState();
const ui = useUIState();

// Or access store directly
const { setTheme, toggleSidebar } = useStore();
```

## 📊 Loading States

Simplified async operation state management.

### Features
- **Error handling**: Automatic error capture
- **Loading indicators**: isLoading flag
- **Reset capability**: Clear errors and state
- **Execute wrapper**: Clean async execution

### Usage

```tsx
import { useLoadingState } from '@/hooks/useLoadingState';

const { isLoading, error, execute, reset } = useLoadingState();

await execute(async () => {
  const data = await fetchData();
  processData(data);
});
```

## 🎨 Empty States

Consistent UI for empty lists and pages.

### Features
- **Icon support**: Custom icons or emoji
- **Action buttons**: Primary/secondary variants
- **Theming**: Light/dark mode support
- **Responsive**: Looks good on all screen sizes

### Usage

```tsx
import { EmptyState } from '@/components/EmptyState';

<EmptyState
  icon="📝"
  title="No notes yet"
  description="Create your first note to get started"
  actionLabel="Create Note"
  onAction={() => createNote()}
/>
```

## 🚀 Performance Optimizations

- **Code splitting**: Lazy load heavy components
- **Debouncing**: Reduce unnecessary operations
- **IndexedDB**: Fast local storage for embeddings
- **Web Workers**: Off-thread AI inference (via Transformers.js)
- **Optimistic updates**: UI updates before server confirmation

## 📚 Dependencies Added

```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-*": "Multiple extensions",
  "@xenova/transformers": "^2.x",
  "zustand": "^4.x",
  "lucide-react": "^0.x",
  "lowlight": "^3.x",
  "tiptap-markdown": "^0.x"
}
```

## 🎯 Next Steps

1. **Integration**: Integrate these components into existing pages
2. **Testing**: Create test coverage for new features
3. **Documentation**: Add inline documentation
4. **Optimization**: Profile and optimize performance
5. **UI Polish**: Refine visual design and animations

## 💡 Tips

- **WYSIWYG vs Markdown**: Use WYSIWYG for rich editing, Markdown for power users
- **Vector Search**: Build index incrementally to avoid blocking UI
- **Plugins**: Keep plugins focused on single responsibility
- **Auto-Save**: Balance frequency with performance
- **State Management**: Use selectors to minimize re-renders
