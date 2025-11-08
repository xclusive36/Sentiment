/**
 * Plugin system for extending Sentiment PKM
 * Allows loading and managing plugins at runtime
 */

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  icon?: string;
  settings?: PluginSetting[];
}

export interface PluginSetting {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  default: unknown;
  options?: { label: string; value: unknown }[];
  description?: string;
}

export interface PluginContext {
  /** Access to the global store */
  store: unknown;
  /** Register a command */
  registerCommand: (command: PluginCommand) => void;
  /** Register a view */
  registerView: (view: PluginView) => void;
  /** Register an event handler */
  on: <K extends string>(event: K, handler: (...args: EventArgs<K>) => void) => void;
  /** Get plugin settings */
  getSetting: (key: string) => unknown;
  /** Set plugin settings */
  setSetting: (key: string, value: unknown) => void;
  /** Show notification */
  showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export interface PluginCommand {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  hotkey?: string;
  callback: () => void | Promise<void>;
}

export interface PluginView {
  id: string;
  name: string;
  icon?: string;
  component: React.ComponentType;
  location?: 'sidebar' | 'panel' | 'modal';
}

export abstract class Plugin {
  public manifest: PluginManifest;
  protected context: PluginContext;

  constructor(manifest: PluginManifest) {
    this.manifest = manifest;
    this.context = {} as PluginContext; // Will be set by loader
  }

  /** Initialize the plugin - called once when plugin is loaded */
  abstract onLoad(): void | Promise<void>;

  /** Cleanup - called when plugin is unloaded */
  abstract onUnload(): void | Promise<void>;

  /** Set the plugin context */
  public setContext(context: PluginContext): void {
    this.context = context;
  }
}

// Typed event map for plugins. Extend as new events are added.
export interface PluginEvents {
  'editor:change': [string];
  'file:open': [string];
}

type EventArgs<K extends string> = K extends keyof PluginEvents
  ? PluginEvents[K]
  : unknown[];

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private commands: Map<string, PluginCommand> = new Map();
  private views: Map<string, PluginView> = new Map();
  private eventHandlers: Map<string, Array<(...args: unknown[]) => void>> = new Map();

  /**
   * Register a plugin
   */
  public registerPlugin(plugin: Plugin): void {
    if (this.plugins.has(plugin.manifest.id)) {
      console.warn(`Plugin ${plugin.manifest.id} is already registered`);
      return;
    }

    const context: PluginContext = {
      store: null, // Can be injected from app
      registerCommand: (command) => this.registerCommand(plugin.manifest.id, command),
      registerView: (view) => this.registerView(plugin.manifest.id, view),
      on: (event, handler) => this.addEventListener(event, handler),
      getSetting: (key) => this.getPluginSetting(plugin.manifest.id, key),
      setSetting: (key, value) => this.setPluginSetting(plugin.manifest.id, key, value),
      showNotification: (message, type = 'info') => this.showNotification(message, type),
    };

    plugin.setContext(context);
    this.plugins.set(plugin.manifest.id, plugin);
  }

  /**
   * Load a plugin
   */
  public async loadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      await plugin.onLoad();
      console.log(`Plugin ${pluginId} loaded successfully`);
    } catch (error) {
      console.error(`Failed to load plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Unload a plugin
   */
  public async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return;
    }

    try {
      await plugin.onUnload();

      // Clean up commands
      for (const [commandId] of this.commands.entries()) {
        if (commandId.startsWith(`${pluginId}:`)) {
          this.commands.delete(commandId);
        }
      }

      // Clean up views
      for (const [viewId] of this.views.entries()) {
        if (viewId.startsWith(`${pluginId}:`)) {
          this.views.delete(viewId);
        }
      }

      console.log(`Plugin ${pluginId} unloaded successfully`);
    } catch (error) {
      console.error(`Failed to unload plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Get all registered plugins
   */
  public getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a specific plugin
   */
  public getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Register a command
   */
  private registerCommand(pluginId: string, command: PluginCommand): void {
    const commandId = `${pluginId}:${command.id}`;
    this.commands.set(commandId, command);
  }

  /**
   * Get all commands
   */
  public getCommands(): PluginCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Execute a command
   */
  public async executeCommand(commandId: string): Promise<void> {
    const command = this.commands.get(commandId);
    if (!command) {
      throw new Error(`Command ${commandId} not found`);
    }

    await command.callback();
  }

  /**
   * Register a view
   */
  private registerView(pluginId: string, view: PluginView): void {
    const viewId = `${pluginId}:${view.id}`;
    this.views.set(viewId, view);
  }

  /**
   * Get all views
   */
  public getViews(): PluginView[] {
    return Array.from(this.views.values());
  }

  /**
   * Get views by location
   */
  public getViewsByLocation(location: 'sidebar' | 'panel' | 'modal'): PluginView[] {
    return Array.from(this.views.values()).filter((view) => view.location === location);
  }

  /**
   * Add event listener
   */
  private addEventListener<K extends string>(
    event: K,
    handler: (...args: EventArgs<K>) => void
  ): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    // Store as unknown[] at runtime while preserving strong typing for callers
    this.eventHandlers.get(event)!.push(handler as unknown as (...args: unknown[]) => void);
  }

  /**
   * Emit an event
   */
  public emit<K extends string>(event: K, ...args: EventArgs<K>): void {
    const handlers = this.eventHandlers.get(event as string);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          (handler as (...args: unknown[]) => void)(...((args as unknown[]) ?? []));
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get plugin setting
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getPluginSetting(_pluginId: string, _key: string): unknown {
    // This would integrate with the store
    return null;
  }

  /**
   * Set plugin setting
   */
  private setPluginSetting(pluginId: string, key: string, value: unknown): void {
    // This would integrate with the store
    console.log(`Setting ${pluginId}.${key} to`, value);
  }

  /**
   * Show notification
   */
  private showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error'): void {
    // This would integrate with a toast/notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

// Singleton instance
export const pluginManager = new PluginManager();

/**
 * Load plugins from a directory or registry
 */
export async function loadPluginsFromRegistry(
  plugins: Array<new () => Plugin>
): Promise<void> {
  for (const PluginClass of plugins) {
    try {
      const plugin = new PluginClass();
      pluginManager.registerPlugin(plugin);
      await pluginManager.loadPlugin(plugin.manifest.id);
    } catch (error) {
      console.error(`Failed to load plugin:`, error);
    }
  }
}
