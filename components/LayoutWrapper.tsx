'use client';

import type { FileStructure } from '@/lib/files';
import HomePageClient from '@/components/HomePageClient';

interface LayoutWrapperProps {
  initialStructure: FileStructure;
  allTags: string[];
}

export default function LayoutWrapper({ initialStructure, allTags }: LayoutWrapperProps) {

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* Main Container */}
      <div className="main-container flex flex-col lg:flex-row">
        {/* Main Content Area - mobile first: padding bottom for nav, remove on md+ */}
        <div className="flex-1 min-w-0 pb-20 transition-all duration-300 md:pb-0">
          <HomePageClient initialStructure={initialStructure} allTags={allTags} />
        </div>
      </div>
    </div>
  );
}
