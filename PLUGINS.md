# Plugin System Guide

This guide explains how to build, register, and extend plugins in Sentiment. It covers manifests, lifecycle hooks, commands, views, typed events, and recommended patterns.

## Overview

Plugins let you add focused functionality (timers, analytics, custom views, automations) without modifying core code. Each plugin:

- Declares a `PluginManifest` (id, name, version, description, optional settings)
- Implements lifecycle hooks: `onLoad()` and `onUnload()`
- Registers commands, views, and event listeners through the provided `PluginContext`
- Optionally exposes settings that integrate with the Plugin Manager UI

## Anatomy of a Plugin

```ts
import { Plugin, type PluginManifest } from '@/lib/plugin-system';

export class ExamplePlugin extends Plugin {
  constructor() {
    const manifest: PluginManifest = {
      id: 'example',
      name: 'Example Plugin',
      version: '1.0.0',
      description: 'Shows how to build a plugin',
      author: 'You',
      icon: '✨'
    };
    super(manifest);
  }

  async onLoad() {
    // Register a command
    this.context.registerCommand({
      id: 'do-something',
      name: 'Do Something',
      callback: () => this.context.showNotification('Did something!', 'success')
    });

    // Listen to editor changes
    this.context.on('editor:change', (content) => {
      console.log('Editor updated length:', content.length);
    });
  }

  async onUnload() {
    // Clean up resources if needed
    console.log('Example plugin unloaded');
  }
}
```

## Manifest Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique stable identifier (kebab-case recommended) |
| `name` | Yes | Human-readable name |
| `version` | Yes | Semantic version string (e.g. `1.0.0`) |
| `description` | Yes | Short summary for UI listings |
| `author` | No | Attribution |
| `icon` | No | Emoji or small string used in plugin list |
| `settings` | No | Array of setting descriptors (key, label, type, default, options?) |

## Lifecycle Hooks

- `onLoad()` fires after the plugin is registered. Perform initialization here.
- `onUnload()` fires before the plugin is disabled/unregistered. Release timers, intervals, DOM nodes, observers.

## Commands

Commands are lightweight actions exposed to the command palette and/or UI.

```ts
this.context.registerCommand({
  id: 'start-task',
  name: 'Start Task',
  icon: '🚀',
  hotkey: 'Ctrl+Alt+S',
  callback: () => this.startTask()
});
```

Retrieve and execute commands centrally via the command palette or `pluginManager.executeCommand(pluginId:commandId)`.

## Views

Views allow a plugin to mount UI into predefined layout locations (`sidebar`, `panel`, `modal`).

```ts
this.context.registerView({
  id: 'stats',
  name: 'Statistics',
  icon: '📊',
  location: 'sidebar',
  component: StatsComponent
});
```

## Typed Events

The plugin system defines a typed event map in `lib/plugin-system.ts`:

```ts
export interface PluginEvents {
  'editor:change': [string];       // Current markdown content
  'file:open': [string];           // Relative file path
}
```

Listening:

```ts
this.context.on('file:open', (path) => {
  console.log('Opened file:', path);
});
```

Emitting (usually from core/editor code):

```ts
import { pluginManager } from '@/lib/plugin-system';
pluginManager.emit('editor:change', currentContent);
pluginManager.emit('file:open', relativePath);
```

### Adding New Events

1. Extend the `PluginEvents` interface:

```ts
export interface PluginEvents {
  'editor:change': [string];
  'file:open': [string];
  'editor:save': [string, Date];          // Example: path + timestamp
  'editor:mode-change': ['markdown' | 'wysiwyg'];
}
```

1. Emit the event from appropriate core code (`pluginManager.emit('editor:save', path, new Date())`).

1. Consume in plugins with full type safety:

```ts
this.context.on('editor:save', (path, when) => {
  console.log('Saved', path, 'at', when.toISOString());
});
```

### Fallback / Unknown Events

Events not declared in `PluginEvents` fall back to `unknown[]` args. Prefer explicitly typing all shared events to remove guards and casts.

## Example: Word Count Plugin (Typed Version)

```ts
export class WordCountPlugin extends Plugin {
  async onLoad() {
    this.context.registerCommand({
      id: 'show-stats',
      name: 'Show Document Statistics',
      icon: '📊',
      callback: () => this.showStats()
    });

    this.context.on('editor:change', (content) => {
      const words = content.trim().split(/\s+/).filter(Boolean).length;
      console.log('Word count:', words);
    });
  }

  private showStats() {
    this.context.showNotification('Stats feature coming soon!', 'info');
  }
}
```

## Best Practices

1. Keep plugin state internal; avoid global mutation unless necessary.
2. Use settings for user configurability rather than environment variables or ad-hoc globals.
3. Debounce expensive event handlers (e.g. on `editor:change`) to avoid performance hits.
4. Clean up timers/intervals in `onUnload()`.
5. Avoid storing large data blobs directly in memory; consider indexed storage for heavy analytics.
6. Prefer semantic versioning and document breaking changes.
7. Provide subtle, non-blocking notifications; avoid alert() or blocking modals.
8. Use the typed event map—add events intentionally; do not overload one event with multiple semantic roles.

## Extending Settings

Each setting descriptor supports:

```ts
{
  key: 'workDuration',
  label: 'Work Duration (minutes)',
  type: 'number',
  default: 25,
  description: 'Length of a work interval'
}
```

Supported types: `string`, `number`, `boolean`, `select`.
For `select`, add an `options` array: `{ label, value }[]`.
Access settings via `this.context.getSetting(key)`.

## Error Handling

Wrap critical logic in try/catch inside event handlers. The plugin manager protects against handler failure, but logging meaningful errors helps debugging.

```ts
this.context.on('editor:change', (content) => {
  try {
    // expensive or risky logic
  } catch (e) {
    console.error('[my-plugin] Failed to process content', e);
  }
});
```

## Unloading & Resource Cleanup Checklist

- Clear intervals/timeouts
- Remove DOM nodes manually injected
- Stop observers (ResizeObserver, MutationObserver)
- Flush pending async operations if relevant

## Performance Considerations

- Batch UI updates rather than triggering frequent React renders
- Avoid synchronous parsing of very large documents on every keystroke; use debouncing or chunking
- Keep plugin startup fast (<50ms ideally)

## Testing a Plugin Quickly

1. Register plugin class in `plugins/index.ts`.
2. Ensure the Plugin Manager UI lists it.
3. Trigger your command via the command palette or temporary button.
4. Validate event handlers fire (check browser console).

## Future Expansion Ideas

- Plugin sandboxing (isolation via worker/thread)
- Async plugin loading from external registry
- Version compatibility checks with core API
- Scoped storage API (namespaced persistence per plugin)

## Troubleshooting

| Symptom | Possible Cause | Fix |
|---------|----------------|-----|
| Handler not firing | Event not emitted | Verify `pluginManager.emit()` call path |
| Type error on handler args | Event not in `PluginEvents` | Add tuple entry for new event |
| Settings undefined | Not registered or wrong key | Confirm manifest `settings` and key spelling |
| Plugin missing in UI | Not exported | Add to `plugins/index.ts` |
| Duplicate side-effects | Plugin loaded twice | Check for repeated registration or hot-reload artifact |

## Contributing New Events

1. Open the `lib/plugin-system.ts` file.
2. Add the new event to `PluginEvents`.
3. Emit it from core logic with properly ordered arguments.
4. Update this guide (section: Typed Events) to reflect the new event.

---

If you need a scaffold for a new plugin or want automated validation, let me know—I can add a generator script or testing harness next.
