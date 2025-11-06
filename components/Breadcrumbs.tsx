import Link from 'next/link';

interface BreadcrumbsProps {
  path: string;
}

export default function Breadcrumbs({ path }: BreadcrumbsProps) {
  const segments = path.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
      <Link
        href="/"
        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
      >
        Home
      </Link>

      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const href = `/file/${segments.slice(0, index + 1).join('/')}`;
        const displayName = segment.replace('.md', '');

        return (
          <div key={index} className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            {isLast ? (
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                {displayName}
              </span>
            ) : (
              <Link
                href={href}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                {displayName}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
