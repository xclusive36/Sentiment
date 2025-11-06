import { NextRequest, NextResponse } from 'next/server';
import { getRecentlyAccessed, getFrequentlyAccessed, getFileStats, getTotalAccesses } from '@/lib/stats';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');
    const path = searchParams.get('path');
    
    if (path) {
      // Get stats for specific file
      const stats = getFileStats(path);
      return NextResponse.json(stats);
    }
    
    switch (type) {
      case 'recent':
        return NextResponse.json({
          files: getRecentlyAccessed(limit),
          total: getTotalAccesses(),
        });
      
      case 'frequent':
        return NextResponse.json({
          files: getFrequentlyAccessed(limit),
          total: getTotalAccesses(),
        });
      
      case 'summary':
        return NextResponse.json({
          recent: getRecentlyAccessed(5),
          frequent: getFrequentlyAccessed(5),
          totalAccesses: getTotalAccesses(),
        });
      
      default:
        return NextResponse.json({
          recent: getRecentlyAccessed(limit),
          frequent: getFrequentlyAccessed(limit),
          totalAccesses: getTotalAccesses(),
        });
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
