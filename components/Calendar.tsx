'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasNote: boolean;
}

interface CalendarProps {
  currentDate: Date;
  existingNotes: string[]; // Array of date strings in YYYY-MM-DD format
  onMonthChange?: (date: Date) => void;
}

export default function Calendar({ currentDate, existingNotes, onMonthChange }: CalendarProps) {
  const [viewDate, setViewDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  
  const existingNotesSet = useMemo(() => new Set(existingNotes), [existingNotes]);
  
  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const lastDate = lastDay.getDate();
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add days from previous month to fill the first week
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        hasNote: existingNotesSet.has(formatDateKey(date)),
      });
    }
    
    // Add days of current month
    for (let date = 1; date <= lastDate; date++) {
      const day = new Date(year, month, date);
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday: day.getTime() === today.getTime(),
        hasNote: existingNotesSet.has(formatDateKey(day)),
      });
    }
    
    // Add days from next month to fill the last week
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let date = 1; date <= remainingDays; date++) {
      const day = new Date(year, month + 1, date);
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: day.getTime() === today.getTime(),
        hasNote: existingNotesSet.has(formatDateKey(day)),
      });
    }
    
    return days;
  }, [viewDate, existingNotesSet]);
  
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const goToPreviousMonth = () => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    setViewDate(newDate);
    onMonthChange?.(newDate);
  };
  
  const goToNextMonth = () => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    setViewDate(newDate);
    onMonthChange?.(newDate);
  };
  
  const goToToday = () => {
    const today = new Date();
    const newDate = new Date(today.getFullYear(), today.getMonth(), 1);
    setViewDate(newDate);
    onMonthChange?.(newDate);
  };
  
  const handleCreateNote = async (date: Date) => {
    try {
      const dateString = formatDateKey(date);
      const response = await fetch('/api/daily-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateString }),
      });
      
      if (response.ok) {
        const data = await response.json();
        window.location.href = `/file/${encodeURIComponent(data.path.replace(/\.md$/, ''))}`;
      }
    } catch (error) {
      console.error('Error creating daily note:', error);
    }
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-white">
          {monthName}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
            aria-label="Next month"
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-slate-600 dark:text-slate-400 py-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => {
          const dateKey = formatDateKey(day.date);
          const dayNumber = day.date.getDate();
          
          if (day.hasNote) {
            return (
              <Link
                key={index}
                href={`/file/${encodeURIComponent(`journal/${dateKey}`)}`}
                className={`
                  aspect-square flex items-center justify-center rounded-lg
                  transition-all border-2
                  ${day.isCurrentMonth 
                    ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800' 
                    : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 opacity-50'
                  }
                  ${day.isToday ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
                `}
              >
                <span className={`text-sm font-semibold ${day.isCurrentMonth ? 'text-blue-900 dark:text-blue-100' : 'text-blue-700 dark:text-blue-300'}`}>
                  {dayNumber}
                </span>
              </Link>
            );
          }
          
          return (
            <button
              key={index}
              onClick={() => handleCreateNote(day.date)}
              className={`
                aspect-square flex items-center justify-center rounded-lg
                transition-all border-2 border-transparent
                ${day.isCurrentMonth 
                  ? 'hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600' 
                  : 'text-slate-400 dark:text-slate-600'
                }
                ${day.isToday ? 'bg-slate-100 dark:bg-slate-700 border-slate-400 dark:border-slate-500' : ''}
              `}
            >
              <span className={`text-sm ${day.isCurrentMonth ? 'text-slate-700 dark:text-slate-300' : ''}`}>
                {dayNumber}
              </span>
            </button>
          );
        })}
      </div>
      
      <div className="mt-6 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900 border-2 border-blue-300 dark:border-blue-700"></div>
          <span>Has note</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-slate-400 dark:border-slate-500"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600"></div>
          <span>Click to create</span>
        </div>
      </div>
    </div>
  );
}
