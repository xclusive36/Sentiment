# Layout Structure Documentation

## Overview
Sentiment now uses a **multi-layer layout architecture** inspired by MarkItUp, combining professional structure with Sentiment's clean visual design.

## Architecture Layers

### Layer 1: Header (Top, Sticky)
- **Component**: `<header>` with hamburger menu and app title
- **Position**: `sticky top-0 z-50`
- **Desktop**: Logo/title, navigation, settings
- **Mobile**: Hamburger menu button

### Layer 2: Toolbar Area (Below Header, Contextual)
- **Component**: `ToolbarArea`
- **Visibility**: Shows when in editor view
- **Features**: 
  - Quick actions (Save, New Note)
  - View mode switcher (Edit/Preview/Split)
  - Respects sidebar collapse state (padding-left adjustment)

### Layer 3: Main Container
- **Structure**: Flexbox with sidebar + content
- **Desktop**: `flex flex-row`
- **Mobile**: Drawer overlay for sidebar

#### 3a. Left Sidebar (Collapsible)
- **Component**: `CollapsibleSidebar`
- **Desktop**: 
  - Collapsible with toggle button
  - When collapsed: 48px width (icon bar)
  - When open: Full width sidebar
- **Mobile**: 
  - Hidden by default
  - Opens as full-screen drawer with backdrop blur
  - Touch-friendly close button

#### 3b. Main Content Area
- **Component**: `HomePageClient` or other view components
- **Features**:
  - Adjusts padding based on sidebar state
  - Responsive width calculations
  - Contains editor, preview, or other views

### Layer 4: Status Bar (Bottom, Above Mobile Nav)
- **Component**: `StatusBar`
- **Features**:
  - Word count, reading time, links, tags
  - Current document name
  - Click to open detailed stats
  - Always visible on desktop
  - Hidden on mobile when bottom nav appears

### Layer 5: Bottom Navigation (Mobile Only)
- **Component**: `BottomNav`
- **Visibility**: `md:hidden` (< 768px)
- **Position**: `fixed bottom-0`
- **Safe Areas**: Respects iOS notches with `safe-area-inset-bottom`
- **Buttons** (44px touch targets):
  1. Home
  2. Search
  3. New Note (highlighted, larger)
  4. Graph
  5. Menu (opens sidebar)

## Responsive Behavior

### Desktop (≥ 1024px)
```
┌────────────────────────────────────────────┐
│ Header (Logo, Nav, Settings)              │
├────────────────────────────────────────────┤
│ Toolbar Area (Save, New, View Modes)      │
├──────────┬─────────────────────────────────┤
│ Sidebar  │ Main Content                    │
│ (Toggle) │ (Editor/Preview/Graph)          │
│          │                                  │
│          │                                  │
├──────────┴─────────────────────────────────┤
│ Status Bar (Stats, Document Info)         │
└────────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌────────────────────────────┐
│ Header (☰ Menu, Title)     │
├────────────────────────────┤
│ Main Content               │
│ (Full Width)               │
│                            │
│                            │
│                            │
├────────────────────────────┤
│ Bottom Nav (⌂ 🔍 ➕ 🕸 ☰) │
└────────────────────────────┘

When sidebar opens:
┌────────────────────────────┐
│ ■■■■ Backdrop Blur ■■■■■  │
│ ┌──────────────┐           │
│ │   Sidebar    │ (Drawer)  │
│ │ [X Close]    │           │
│ │              │           │
│ │ File List    │           │
│ └──────────────┘           │
└────────────────────────────┘
```

## State Management

### Sidebar States
- `showMobileSidebar: boolean` - Mobile drawer visibility
- `isLeftSidebarCollapsed: boolean` - Desktop sidebar collapse
- Transitions: `transition-all duration-300`

### View States
- `currentView: string` - 'home' | 'search' | 'graph' | etc.
- Determines which content is displayed

### Theme States
- `theme: 'light' | 'dark'`
- All components support both themes
- CSS variables for consistency

## Z-Index Hierarchy
```
Header: z-50
Mobile Sidebar Backdrop: z-40
Mobile Sidebar Drawer: z-50
Bottom Nav: z-30
Toolbar Area: z-20
Modals/Overlays: z-50+
```

## CSS Utilities

### Safe Area Support
```css
padding-bottom: env(safe-area-inset-bottom);
```

### Backdrop Blur
```css
backdrop-filter: blur(8px);
-webkit-backdrop-filter: blur(8px);
```

### Smooth Transitions
```css
transition: padding-left 0.3s ease;
transition-all duration-300
```

## Benefits of This Layout

1. **Professional Structure**: Multi-layer hierarchy similar to VS Code, Notion, Obsidian
2. **Mobile-First**: Touch-optimized with 44px tap targets and bottom navigation
3. **Accessibility**: Clear semantic structure, proper ARIA labels
4. **Performant**: Sticky positioning, GPU-accelerated transitions
5. **Flexible**: Adapts to different content types (editor, graph, search)
6. **Contextual**: Toolbar appears only when relevant
7. **Stats Visibility**: Always accessible via status bar
8. **Clean Aesthetic**: Maintains Sentiment's visual design language

## Implementation Notes

- All new components follow Sentiment's color scheme
- Tailwind CSS for responsive utilities
- Lucide React for consistent iconography
- Client-side components ('use client') for interactivity
- TypeScript for type safety
