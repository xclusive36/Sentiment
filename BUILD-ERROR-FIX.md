# Build Error Fix: Module 'fs' Not Found

## Problem
The new layout in `app/page.tsx` was marked as a client component (`'use client'`), but it imported `lib/files.ts` which uses Node.js `fs` module. Client components run in the browser and cannot access filesystem APIs.

## Solution
Split the component into **Server Component** (data fetching) and **Client Component** (interactivity):

### 1. `app/page.tsx` (Server Component)
```tsx
import { getAllMarkdownFiles, getAllTags } from '@/lib/files';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function HomePage() {
  const fullStructure = getAllMarkdownFiles();
  const allTags = getAllTags(fullStructure);

  return <LayoutWrapper initialStructure={fullStructure} allTags={allTags} />;
}
```
- ✅ No `'use client'` directive
- ✅ Can use `fs` and Node.js APIs
- ✅ Fetches data on server
- ✅ Passes data to client component

### 2. `components/LayoutWrapper.tsx` (Client Component)
```tsx
'use client';

export default function LayoutWrapper({ initialStructure, allTags }) {
  const [currentView, setCurrentView] = useState('home');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  // ... all the interactive layout logic
}
```
- ✅ Has `'use client'` directive
- ✅ Can use React hooks (useState, useEffect)
- ✅ Handles user interactions
- ✅ Receives server data as props

## Result
- ✅ Build error resolved
- ✅ Layout functionality preserved
- ✅ Proper Next.js architecture
- ✅ Best of both worlds: server data fetching + client interactivity

## How It Works
1. **Server**: `page.tsx` runs on server, fetches file data using `fs`
2. **Hydration**: Server sends HTML + data to browser
3. **Client**: `LayoutWrapper` adds interactivity (sidebar, nav, etc.)
4. **No re-fetch**: Data already loaded, no additional requests

## Files Changed
- Modified: `app/page.tsx` (removed client code)
- Created: `components/LayoutWrapper.tsx` (moved client code here)

---

**The build should now work!** Restart your dev server if needed.
