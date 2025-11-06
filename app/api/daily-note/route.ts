import { NextRequest, NextResponse } from 'next/server';
import { createDailyNote, getDailyNoteInfo, getTodayDate, parseDate, getDailyNotePath } from '@/lib/daily-notes';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date: dateString, content } = body;
    
    // Parse date or use today
    let date: Date;
    if (dateString) {
      const parsed = parseDate(dateString);
      if (!parsed) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      date = parsed;
    } else {
      date = getTodayDate();
    }
    
    // Create the daily note
    const path = createDailyNote(date, content);
    
    return NextResponse.json({
      success: true,
      path,
      date: date.toISOString(),
    });
  } catch (error) {
    console.error('Error creating daily note:', error);
    return NextResponse.json(
      { error: 'Failed to create daily note' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateString = searchParams.get('date');
    
    // Parse date or use today
    let date: Date;
    if (dateString) {
      const parsed = parseDate(dateString);
      if (!parsed) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      date = parsed;
    } else {
      date = getTodayDate();
    }
    
    // Get daily note info
    const info = getDailyNoteInfo(date);
    
    return NextResponse.json({
      date: info.date.toISOString(),
      path: info.path,
      exists: info.exists,
      content: info.content,
    });
  } catch (error) {
    console.error('Error getting daily note:', error);
    return NextResponse.json(
      { error: 'Failed to get daily note' },
      { status: 500 }
    );
  }
}
