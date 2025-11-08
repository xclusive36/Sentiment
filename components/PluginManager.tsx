'use client';

import React, { useState } from 'react';
import { Settings, Power, PowerOff, ChevronDown, ChevronUp } from 'lucide-react';
import { pluginManager, type Plugin } from '@/lib/plugin-system';
import { useStore } from '@/lib/store';

export interface PluginManagerProps {
  theme?: 'light' | 'dark';
}

/**
 * Plugin Manager UI
 * Manage installed plugins, toggle them on/off, and configure settings
 */
export function PluginManager({ theme = 'light' }: PluginManagerProps) {
  const { plugins: pluginState } = useStore();
  const [expandedPlugins, setExpandedPlugins] = useState<Set<string>>(new Set());
  const plugins = pluginManager.getPlugins();
  const isDark = theme === 'dark';

  const toggleExpanded = (pluginId: string) => {
    setExpandedPlugins((prev) => {
      const next = new Set(prev);
      if (next.has(pluginId)) {
        next.delete(pluginId);
      } else {
        next.add(pluginId);
      }
      return next;
    });
  };

  const isEnabled = (pluginId: string) => pluginState.enabledPlugins.has(pluginId);

  return (
    <div
      className={`plugin-manager ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className={`w-6 h-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
          <h2 className="text-2xl font-bold">Plugins</h2>
        </div>

        {plugins.length === 0 ? (
          <div
            className={`
              p-8 rounded-lg border-2 border-dashed text-center
              ${isDark ? 'border-gray-700' : 'border-gray-300'}
            `}
          >
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No plugins installed
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {plugins.map((plugin) => (
              <PluginCard
                key={plugin.manifest.id}
                plugin={plugin}
                enabled={isEnabled(plugin.manifest.id)}
                expanded={expandedPlugins.has(plugin.manifest.id)}
                onToggleExpand={() => toggleExpanded(plugin.manifest.id)}
                theme={theme}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface PluginCardProps {
  plugin: Plugin;
  enabled: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  theme: 'light' | 'dark';
}

function PluginCard({ plugin, enabled, expanded, onToggleExpand, theme }: PluginCardProps) {
  const { enablePlugin, disablePlugin, setPluginSetting } = useStore();
  const isDark = theme === 'dark';

  const handleToggle = async () => {
    if (enabled) {
      await pluginManager.unloadPlugin(plugin.manifest.id);
      disablePlugin(plugin.manifest.id);
    } else {
      await pluginManager.loadPlugin(plugin.manifest.id);
      enablePlugin(plugin.manifest.id);
    }
  };

  const handleSettingChange = (key: string, value: unknown) => {
    setPluginSetting(plugin.manifest.id, key, value);
  };

  return (
    <div
      className={`
        rounded-lg border overflow-hidden
        ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
      `}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {plugin.manifest.icon && <span className="text-2xl">{plugin.manifest.icon}</span>}
              <h3 className="text-lg font-semibold">{plugin.manifest.name}</h3>
              <span
                className={`
                  px-2 py-0.5 rounded text-xs font-medium
                  ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}
                `}
              >
                v{plugin.manifest.version}
              </span>
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {plugin.manifest.description}
            </p>
            {plugin.manifest.author && (
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                by {plugin.manifest.author}
              </p>
            )}
          </div>

          {/* Toggle button */}
          <button
            onClick={handleToggle}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${enabled
                ? isDark
                  ? 'bg-green-900 text-green-100 hover:bg-green-800'
                  : 'bg-green-100 text-green-900 hover:bg-green-200'
                : isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {enabled ? (
              <>
                <Power className="w-4 h-4" />
                Enabled
              </>
            ) : (
              <>
                <PowerOff className="w-4 h-4" />
                Disabled
              </>
            )}
          </button>
        </div>

        {/* Settings toggle */}
        {plugin.manifest.settings && plugin.manifest.settings.length > 0 && (
          <button
            onClick={onToggleExpand}
            className={`
              flex items-center gap-2 mt-3 text-sm font-medium transition-colors
              ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}
            `}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Settings
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show Settings
              </>
            )}
          </button>
        )}
      </div>

      {/* Settings panel */}
      {expanded && plugin.manifest.settings && plugin.manifest.settings.length > 0 && (
        <div
          className={`
            border-t p-4
            ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}
          `}
        >
          <h4 className="font-medium mb-3">Settings</h4>
          <div className="space-y-4">
            {plugin.manifest.settings.map((setting) => (
              <PluginSetting
                key={setting.key}
                setting={setting}
                onChange={(value) => handleSettingChange(setting.key, value)}
                theme={theme}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface PluginSettingProps {
  setting: { key: string; label: string; type: string; default: unknown; options?: { label: string; value: unknown }[]; description?: string };
  onChange: (value: unknown) => void;
  theme: 'light' | 'dark';
}

function PluginSetting({ setting, onChange, theme }: PluginSettingProps) {
  const [value, setValue] = useState(setting.default);
  const isDark = theme === 'dark';

  const handleChange = (newValue: unknown) => {
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <div>
      <label className="block mb-2">
        <span className="font-medium">{setting.label}</span>
        {setting.description && (
          <span
            className={`block text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
          >
            {setting.description}
          </span>
        )}
      </label>

      {setting.type === 'boolean' && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value as boolean}
            onChange={(e) => handleChange(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm">Enable</span>
        </label>
      )}

      {setting.type === 'string' && (
        <input
          type="text"
          value={value as string}
          onChange={(e) => handleChange(e.target.value)}
          className={`
            w-full px-3 py-2 rounded border
            ${isDark
              ? 'bg-gray-800 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
            }
          `}
        />
      )}

      {setting.type === 'number' && (
        <input
          type="number"
          value={value as number}
          onChange={(e) => handleChange(Number(e.target.value))}
          className={`
            w-full px-3 py-2 rounded border
            ${isDark
              ? 'bg-gray-800 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
            }
          `}
        />
      )}

      {setting.type === 'select' && setting.options && (
        <select
          value={value as string}
          onChange={(e) => handleChange(e.target.value)}
          className={`
            w-full px-3 py-2 rounded border
            ${isDark
              ? 'bg-gray-800 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
            }
          `}
        >
          {setting.options.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
