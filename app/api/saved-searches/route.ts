import { NextRequest, NextResponse } from 'next/server';
import {
  getAllSavedSearches,
  getSavedSearch,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  executeSavedSearch,
  markSearchAsUsed,
} from '@/lib/saved-searches';
import { getAllMarkdownFiles } from '@/lib/files';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const execute = searchParams.get('execute') === 'true';
    
    if (id) {
      const search = getSavedSearch(id);
      
      if (!search) {
        return NextResponse.json(
          { error: 'Search not found' },
          { status: 404 }
        );
      }
      
      if (execute) {
        const structure = getAllMarkdownFiles();
        const results = executeSavedSearch(search, structure);
        markSearchAsUsed(id);
        
        return NextResponse.json({
          search,
          results,
          count: results.length,
        });
      }
      
      return NextResponse.json(search);
    }
    
    const searches = getAllSavedSearches();
    return NextResponse.json({ searches });
  } catch (error) {
    console.error('Error fetching saved searches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved searches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, query, filters, color, icon, pinned } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    const search = createSavedSearch(name, query || '', filters || {}, {
      color,
      icon,
      pinned,
    });
    
    return NextResponse.json({ search });
  } catch (error) {
    console.error('Error creating saved search:', error);
    return NextResponse.json(
      { error: 'Failed to create saved search' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const search = updateSavedSearch(id, updates);
    
    if (!search) {
      return NextResponse.json(
        { error: 'Search not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ search });
  } catch (error) {
    console.error('Error updating saved search:', error);
    return NextResponse.json(
      { error: 'Failed to update saved search' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const success = deleteSavedSearch(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Search not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting saved search:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved search' },
      { status: 500 }
    );
  }
}
