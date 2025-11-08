'use client';

import { Home, Search, PlusCircle, Network, Menu, LucideIcon } from 'lucide-react';

interface BottomNavProps {
  currentView?: string;
  onViewChange?: (view: string) => void;
  onNewNote?: () => void;
  onOpenMenu?: () => void;
  theme?: 'light' | 'dark';
}

interface NavButtonProps {
  icon: LucideIcon;
  label: string;
  view?: string;
  onClick?: () => void;
  highlight?: boolean;
  isActive: boolean;
  activeClass: string;
  inactiveClass: string;
  theme: 'light' | 'dark';
}

function NavButton({
  icon: Icon,
  label,
  onClick,
  highlight,
  isActive,
  activeClass,
  inactiveClass,
  theme,
}: NavButtonProps) {
  const baseButtonClass =
    'flex flex-col items-center justify-center gap-1 transition-colors relative';

  return (
    <button
      onClick={onClick}
      className={`${baseButtonClass} ${isActive ? activeClass : inactiveClass} ${
        highlight ? 'scale-110' : ''
      }`}
      style={{ minWidth: '44px', minHeight: '44px' }}
      aria-label={label}
    >
      <Icon className={`w-6 h-6 ${highlight ? 'w-7 h-7' : ''}`} />
      <span className="text-xs font-medium">{label}</span>
      {isActive && (
        <div
          className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full"
          style={{ backgroundColor: theme === 'dark' ? '#60a5fa' : '#2563eb' }}
        />
      )}
    </button>
  );
}

export default function BottomNav({
  currentView = 'home',
  onViewChange,
  onNewNote,
  onOpenMenu,
  theme = 'light',
}: BottomNavProps) {
  const activeClass = theme === 'dark' ? 'text-blue-400' : 'text-blue-600';
  const inactiveClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t safe-area-bottom md:hidden"
      style={{
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      data-bottom-nav
    >
      <div className="flex items-center justify-around px-2 py-2">
        <NavButton
          icon={Home}
          label="Home"
          onClick={() => onViewChange?.('home')}
          isActive={currentView === 'home'}
          activeClass={activeClass}
          inactiveClass={inactiveClass}
          theme={theme}
        />
        <NavButton
          icon={Search}
          label="Search"
          onClick={() => onViewChange?.('search')}
          isActive={currentView === 'search'}
          activeClass={activeClass}
          inactiveClass={inactiveClass}
          theme={theme}
        />
        <NavButton
          icon={PlusCircle}
          label="New"
          onClick={onNewNote}
          highlight
          isActive={false}
          activeClass={activeClass}
          inactiveClass={inactiveClass}
          theme={theme}
        />
        <NavButton
          icon={Network}
          label="Graph"
          onClick={() => onViewChange?.('graph')}
          isActive={currentView === 'graph'}
          activeClass={activeClass}
          inactiveClass={inactiveClass}
          theme={theme}
        />
        <NavButton
          icon={Menu}
          label="Menu"
          onClick={onOpenMenu}
          isActive={false}
          activeClass={activeClass}
          inactiveClass={inactiveClass}
          theme={theme}
        />
      </div>
    </nav>
  );
}
