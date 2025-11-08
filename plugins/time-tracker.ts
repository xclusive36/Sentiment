/**
 * Time Tracker Plugin
 * Tracks time spent on notes and projects
 */

import { Plugin, type PluginManifest, type PluginSetting } from '@/lib/plugin-system';

interface TimeEntry {
  file: string;
  startTime: number;
  endTime?: number;
  duration: number;
}

export class TimeTrackerPlugin extends Plugin {
  private currentSession: TimeEntry | null = null;
  private entries: TimeEntry[] = [];
  private idleTimeout: NodeJS.Timeout | null = null;

  constructor() {
    const manifest: PluginManifest = {
      id: 'time-tracker',
      name: 'Time Tracker',
      version: '1.0.0',
      description: 'Track time spent on notes and projects',
      author: 'Sentiment',
      icon: '⏱️',
      settings: [
        {
          key: 'idleTimeout',
          label: 'Idle Timeout (minutes)',
          type: 'number',
          default: 5,
          description: 'Stop tracking after this many minutes of inactivity',
        },
        {
          key: 'showNotifications',
          label: 'Show Notifications',
          type: 'boolean',
          default: true,
          description: 'Show notifications when starting/stopping tracking',
        },
      ] as PluginSetting[],
    };
    super(manifest);
  }

  async onLoad(): Promise<void> {
    // Register commands
    this.context.registerCommand({
      id: 'start-tracking',
      name: 'Start Time Tracking',
      icon: '▶️',
      callback: () => this.startTracking(),
    });

    this.context.registerCommand({
      id: 'stop-tracking',
      name: 'Stop Time Tracking',
      icon: '⏹️',
      callback: () => this.stopTracking(),
    });

    this.context.registerCommand({
      id: 'show-report',
      name: 'Show Time Report',
      icon: '📊',
      callback: () => this.showReport(),
    });

    // Listen for file changes (typed)
    this.context.on('file:open', (filePath) => {
      this.handleFileChange(filePath);
    });

    // Listen for activity (typed)
    this.context.on('editor:change', () => {
      this.resetIdleTimer();
    });

    console.log('Time Tracker plugin loaded');
  }

  async onUnload(): Promise<void> {
    this.stopTracking();
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }
    console.log('Time Tracker plugin unloaded');
  }

  private startTracking(): void {
    if (this.currentSession) {
      this.context.showNotification('Already tracking time', 'warning');
      return;
    }

    this.currentSession = {
      file: 'current-file', // Would get from context
      startTime: Date.now(),
      duration: 0,
    };

    const showNotifications = this.context.getSetting('showNotifications');
    if (showNotifications) {
      this.context.showNotification('Time tracking started', 'success');
    }

    this.resetIdleTimer();
  }

  private stopTracking(): void {
    if (!this.currentSession) {
      return;
    }

    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
    this.entries.push(this.currentSession);

    const showNotifications = this.context.getSetting('showNotifications');
    if (showNotifications) {
      const minutes = Math.round(this.currentSession.duration / 60000);
      this.context.showNotification(`Tracked ${minutes} minutes`, 'info');
    }

    this.currentSession = null;

    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
  }

  private handleFileChange(filePath: string): void {
    if (this.currentSession && this.currentSession.file !== filePath) {
      this.stopTracking();
    }
  }

  private resetIdleTimer(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    const idleMinutes = (this.context.getSetting('idleTimeout') as number) || 5;
    this.idleTimeout = setTimeout(() => {
      this.stopTracking();
      this.context.showNotification('Stopped tracking due to inactivity', 'info');
    }, idleMinutes * 60 * 1000);
  }

  private showReport(): void {
    const totalTime = this.entries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalMinutes = Math.round(totalTime / 60000);

    this.context.showNotification(
      `Total time tracked: ${totalMinutes} minutes across ${this.entries.length} sessions`,
      'info'
    );
  }
}
