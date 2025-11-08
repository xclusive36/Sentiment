/**
 * Pomodoro Timer Plugin
 * Implements the Pomodoro Technique for focused work sessions
 */

import { Plugin, type PluginManifest, type PluginSetting } from '@/lib/plugin-system';

type PomodoroState = 'idle' | 'work' | 'break' | 'long-break';

export class PomodoroPlugin extends Plugin {
  private state: PomodoroState = 'idle';
  private remainingTime: number = 0;
  private timer: NodeJS.Timeout | null = null;
  private completedPomodoros: number = 0;

  constructor() {
    const manifest: PluginManifest = {
      id: 'pomodoro',
      name: 'Pomodoro Timer',
      version: '1.0.0',
      description: 'Pomodoro Technique timer for focused work sessions',
      author: 'Sentiment',
      icon: '🍅',
      settings: [
        {
          key: 'workDuration',
          label: 'Work Duration (minutes)',
          type: 'number',
          default: 25,
        },
        {
          key: 'shortBreak',
          label: 'Short Break (minutes)',
          type: 'number',
          default: 5,
        },
        {
          key: 'longBreak',
          label: 'Long Break (minutes)',
          type: 'number',
          default: 15,
        },
        {
          key: 'pomodorosUntilLongBreak',
          label: 'Pomodoros Until Long Break',
          type: 'number',
          default: 4,
        },
        {
          key: 'autoStartBreaks',
          label: 'Auto-start Breaks',
          type: 'boolean',
          default: false,
        },
        {
          key: 'autoStartPomodoros',
          label: 'Auto-start Pomodoros',
          type: 'boolean',
          default: false,
        },
      ] as PluginSetting[],
    };
    super(manifest);
  }

  async onLoad(): Promise<void> {
    // Register commands
    this.context.registerCommand({
      id: 'start-pomodoro',
      name: 'Start Pomodoro',
      icon: '▶️',
      hotkey: 'Ctrl+Shift+P',
      callback: () => this.startPomodoro(),
    });

    this.context.registerCommand({
      id: 'pause-pomodoro',
      name: 'Pause Pomodoro',
      icon: '⏸️',
      callback: () => this.pause(),
    });

    this.context.registerCommand({
      id: 'reset-pomodoro',
      name: 'Reset Pomodoro',
      icon: '⏹️',
      callback: () => this.reset(),
    });

    this.context.registerCommand({
      id: 'skip-to-break',
      name: 'Skip to Break',
      icon: '⏭️',
      callback: () => this.skipToBreak(),
    });

    console.log('Pomodoro plugin loaded');
  }

  async onUnload(): Promise<void> {
    this.stop();
    console.log('Pomodoro plugin unloaded');
  }

  private startPomodoro(): void {
    if (this.state === 'work') {
      this.context.showNotification('Pomodoro already running', 'warning');
      return;
    }

    this.state = 'work';
    const workDuration = (this.context.getSetting('workDuration') as number) || 25;
    this.remainingTime = workDuration * 60;
    this.startTimer();
    this.context.showNotification(`Pomodoro started: ${workDuration} minutes`, 'success');
  }

  private startBreak(isLongBreak: boolean = false): void {
    this.state = isLongBreak ? 'long-break' : 'break';
    const duration = isLongBreak
      ? ((this.context.getSetting('longBreak') as number) || 15)
      : ((this.context.getSetting('shortBreak') as number) || 5);

    this.remainingTime = duration * 60;
    this.startTimer();

    this.context.showNotification(
      `${isLongBreak ? 'Long' : 'Short'} break: ${duration} minutes`,
      'info'
    );
  }

  private startTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      this.remainingTime--;

      if (this.remainingTime <= 0) {
        this.onTimerComplete();
      }
    }, 1000);
  }

  private onTimerComplete(): void {
    this.stop();

    if (this.state === 'work') {
      this.completedPomodoros++;
      this.context.showNotification('Pomodoro complete! Take a break.', 'success');

      const pomodorosUntilLongBreak =
        (this.context.getSetting('pomodorosUntilLongBreak') as number) || 4;
      const isLongBreak = this.completedPomodoros % pomodorosUntilLongBreak === 0;

      const autoStart = this.context.getSetting('autoStartBreaks');
      if (autoStart) {
        this.startBreak(isLongBreak);
      } else {
        this.state = 'idle';
      }
    } else {
      this.context.showNotification('Break complete! Ready for another Pomodoro?', 'info');

      const autoStart = this.context.getSetting('autoStartPomodoros');
      if (autoStart) {
        this.startPomodoro();
      } else {
        this.state = 'idle';
      }
    }
  }

  private pause(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.context.showNotification('Pomodoro paused', 'info');
    }
  }

  private stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.state = 'idle';
    this.remainingTime = 0;
  }

  private reset(): void {
    this.stop();
    this.completedPomodoros = 0;
    this.context.showNotification('Pomodoro reset', 'info');
  }

  private skipToBreak(): void {
    if (this.state !== 'work') {
      this.context.showNotification('No active Pomodoro to skip', 'warning');
      return;
    }

    this.stop();
    this.completedPomodoros++;

    const pomodorosUntilLongBreak =
      (this.context.getSetting('pomodorosUntilLongBreak') as number) || 4;
    const isLongBreak = this.completedPomodoros % pomodorosUntilLongBreak === 0;

    this.startBreak(isLongBreak);
  }
}
