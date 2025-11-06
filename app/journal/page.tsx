import Link from 'next/link';
import Calendar from '@/components/Calendar';
import { getAllDailyNotes, getTodayDate, formatDateForFilename } from '@/lib/daily-notes';

export default function JournalPage() {
  const dailyNotes = getAllDailyNotes();
  const today = getTodayDate();
  
  // Extract date strings for calendar
  const existingNoteDates = dailyNotes
    .filter(note => note.exists)
    .map(note => formatDateForFilename(note.date));
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link 
                href="/"
                className="text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
              >
                ← Back to Home
              </Link>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                📓 Daily Journal
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                Track your thoughts, tasks, and reflections
              </p>
            </div>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Calendar 
              currentDate={today}
              existingNotes={existingNoteDates}
            />
          </div>
          
          {/* Recent notes sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                Recent Entries
              </h2>
              
              {dailyNotes.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  No daily notes yet. Click a date to create your first entry!
                </p>
              ) : (
                <div className="space-y-3">
                  {dailyNotes.slice(0, 10).map((note) => {
                    const dateStr = formatDateForFilename(note.date);
                    const displayDate = note.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    
                    return (
                      <Link
                        key={dateStr}
                        href={`/file/${encodeURIComponent(`journal/${dateStr}`)}`}
                        className="block p-3 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {displayDate}
                          </span>
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
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Quick tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-6">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 Quick Tips
              </h3>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Click any date to create a new entry</li>
                <li>• Blue dates have existing notes</li>
                <li>• Notes are automatically tagged with #journal</li>
                <li>• Use wiki links [[YYYY-MM-DD]] to link between days</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
