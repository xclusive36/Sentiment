# 📓 Daily Notes / Journal Feature

## Overview

The Daily Notes feature transforms Sentiment into a powerful journaling tool, allowing you to capture daily thoughts, tasks, goals, and reflections in a structured format.

## Key Features

### ✅ Implemented

1. **Calendar View** - Interactive monthly calendar showing all your daily notes
2. **Quick Creation** - Click any date to instantly create a new entry
3. **Template System** - Auto-generated templates with consistent structure
4. **Recent Entries** - Sidebar showing your 10 most recent journal entries
5. **Wiki Link Support** - Link between dates using `[[YYYY-MM-DD]]` syntax
6. **Auto-tagging** - All daily notes automatically tagged with `#journal` and `#daily-note`
7. **Visual Indicators** - Blue-highlighted dates show existing notes
8. **Navigation** - Easy month-to-month navigation with "Today" quick button

## Usage

### Accessing the Journal

From the homepage, click the **"Daily Journal"** button in the top-right corner.

### Creating a Daily Note

**Method 1: Calendar**
1. Navigate to `/journal`
2. Click any date in the calendar
3. A new note is automatically created with the template

**Method 2: API**
```bash
curl -X POST http://localhost:3000/api/daily-note \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-01-15"}'
```

**Method 3: Manual Creation**
Create a file in `markdown/journal/YYYY-MM-DD.md`

### Daily Note Template

Each daily note is created with this structure:

```markdown
---
title: Monday, January 15, 2025
date: 2025-01-15T00:00:00.000Z
tags: [journal, daily-note]
---

# Monday, January 15, 2025

## 📝 Notes

<!-- Your thoughts, ideas, and notes for today -->

## ✅ Tasks

- [ ] 

## 🎯 Goals

- 

## 💭 Reflections

<!-- End of day reflections -->

---

**Day of Week:** Monday
```

### Customizing Templates

To customize the template, edit `lib/daily-notes.ts` and modify the `generateDailyNoteTemplate()` function.

### Linking Between Days

Use wiki-link syntax to reference other days:

```markdown
Today I finished the project I started on [[2025-01-10]].

Looking forward to [[2025-01-20|the weekend]].
```

These links automatically resolve to the journal folder.

## File Structure

```
markdown/
└── journal/
    ├── 2025-01-01.md
    ├── 2025-01-02.md
    ├── 2025-01-03.md
    └── ...
```

## Calendar Interface

### Visual Indicators

- **Blue Background** - Dates with existing notes
- **Border Ring** - Today's date
- **Gray Hover** - Dates you can click to create notes
- **Dimmed Dates** - Days from adjacent months

### Navigation Controls

- **Previous/Next Arrows** - Navigate months
- **Today Button** - Jump to current month
- **Click Date** - View existing note or create new one

## API Endpoints

### Create Daily Note

```
POST /api/daily-note
Content-Type: application/json

{
  "date": "2025-01-15",      // Optional, defaults to today
  "content": "..."            // Optional, uses template if not provided
}
```

**Response:**
```json
{
  "success": true,
  "path": "journal/2025-01-15.md",
  "date": "2025-01-15T00:00:00.000Z"
}
```

### Get Daily Note Info

```
GET /api/daily-note?date=2025-01-15
```

**Response:**
```json
{
  "date": "2025-01-15T00:00:00.000Z",
  "path": "journal/2025-01-15.md",
  "exists": true,
  "content": "..."
}
```

## Integration with Existing Features

### Search
Daily notes are included in full-text search. Search for keywords across all journal entries.

### Tags
- All daily notes are tagged with `#journal` and `#daily-note`
- Use the tag filter on the homepage to view only journal entries
- Add custom tags in the frontmatter

### Backlinks
Daily notes participate in the wiki link system. Reference a daily note from any file and it will show up in backlinks.

### Export
Export individual daily notes to HTML using the export button.

### Drag & Drop Organization
While daily notes are organized by date, you can still use drag-and-drop in the file list to reorder the journal folder.

## Use Cases

### 1. Daily Standup
```markdown
## 📝 Notes

**Yesterday:**
- Completed user authentication
- Fixed bug #123

**Today:**
- Implement dashboard
- Review PRs

**Blockers:**
- None
```

### 2. Gratitude Journal
```markdown
## 💭 Reflections

Three things I'm grateful for:
1. 
2. 
3. 
```

### 3. Habit Tracking
```markdown
## ✅ Tasks

- [x] Exercise
- [x] Meditate
- [ ] Read for 30 minutes
- [x] Drink 8 glasses of water
```

### 4. Project Log
```markdown
## 📝 Notes

**Project: Website Redesign**
- Finalized color scheme
- Created wireframes for homepage
- Client feedback: positive

Next: [[2025-01-16|Tomorrow]] - implement navbar
```

## Tips & Best Practices

1. **Consistency** - Try to write in your journal daily, even if just a few lines
2. **Morning & Evening** - Use Notes section for morning planning, Reflections for evening review
3. **Link Liberally** - Reference past entries to build context
4. **Custom Sections** - Add your own sections to the template (e.g., ## 🍽️ Meals, ## 💪 Workout)
5. **Tags** - Add custom tags for topics (e.g., `tags: [journal, daily-note, work, personal]`)
6. **Search History** - Use search to find past entries by keyword
7. **Week/Month Reviews** - Create summary notes linking to daily entries

## Technical Details

### Date Format
- Filenames use ISO 8601 date format: `YYYY-MM-DD.md`
- Dates are stored in local time (midnight)
- All date parsing is validated with regex

### Performance
- Calendar renders 42 days (6 weeks) at a time
- Recent entries limited to 10 most recent
- File existence checks are cached during rendering

### Utilities

Located in `lib/daily-notes.ts`:

- `getTodayDate()` - Get today's date at midnight
- `formatDateForFilename(date)` - Convert to YYYY-MM-DD
- `formatDateForDisplay(date)` - Convert to "Monday, January 1, 2024"
- `getDailyNotePath(date)` - Get file path for a date
- `generateDailyNoteTemplate(date)` - Create template content
- `dailyNoteExists(date)` - Check if note exists
- `createDailyNote(date, content?)` - Create new note
- `getAllDailyNotes()` - Get all existing notes (sorted)
- `getDailyNotesInRange(start, end)` - Get notes in date range
- `parseDate(string)` - Parse YYYY-MM-DD string to Date

## Future Enhancements

Potential features for future development:

- [ ] **Weekly/Monthly View** - Aggregate view of entries
- [ ] **Streak Tracking** - Show consecutive days of journaling
- [ ] **Template Library** - Multiple template options
- [ ] **Mood Tracking** - Emoji or scale-based mood logging
- [ ] **Time Entries** - Add timestamps for entries throughout the day
- [ ] **Weather Integration** - Automatically log weather
- [ ] **Export Options** - Export date ranges to PDF
- [ ] **Statistics** - Word count, entry count, streaks
- [ ] **Reminders** - Notifications to journal daily
- [ ] **Quick Capture** - Floating button for instant notes

## Troubleshooting

### Notes Not Appearing in Calendar

- Ensure filename matches `YYYY-MM-DD.md` format exactly
- Check that file is in `markdown/journal/` directory
- Verify file has `.md` extension
- Refresh the journal page

### Date Links Not Working

- Ensure link format is `[[YYYY-MM-DD]]`
- Date must be in exact format (e.g., `[[2025-01-15]]`, not `[[2025-1-15]]`)
- Links work even if target note doesn't exist yet

### Calendar Wrong Month

- Click "Today" button to reset to current month
- Check your system date/time settings
- Clear browser cache

## Contributing

To extend the daily notes feature:

1. **Custom Templates** - Edit `lib/daily-notes.ts`
2. **Calendar Styling** - Modify `components/Calendar.tsx`
3. **Additional Views** - Create new pages in `app/journal/`
4. **API Extensions** - Add endpoints in `app/api/daily-note/`

---

**Feature Status:** ✅ Complete and Production Ready

**Created:** 2025-11-06  
**Last Updated:** 2025-11-06
