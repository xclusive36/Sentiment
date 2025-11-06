import { NextRequest, NextResponse } from 'next/server';
import { getAllMarkdownFiles } from '@/lib/files';
import {
  loadFlashcards,
  saveFlashcards,
  extractFlashcardsFromContent,
  getStudySession,
  calculateNextReview,
  getStudyStats,
  type Flashcard,
} from '@/lib/spaced-repetition';

// GET - Get all flashcards or study session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const action = searchParams.get('action');

    if (action === 'sync') {
      // Sync flashcards from markdown files
      const structure = getAllMarkdownFiles();
      const existingCards = loadFlashcards();
      const updatedCards = new Map(existingCards);

      // Extract cards from all files
      const processFiles = (files: typeof structure.files) => {
        files.forEach(file => {
          const cards = extractFlashcardsFromContent(
            file.content,
            file.slug,
            file.title,
            file.tags
          );

          cards.forEach(newCard => {
            const existing = existingCards.get(newCard.id);
            if (existing) {
              // Keep existing SM-2 data
              updatedCards.set(newCard.id, {
                ...existing,
                front: newCard.front,
                back: newCard.back,
                fileTitle: newCard.fileTitle,
                tags: newCard.tags,
              });
            } else {
              // Add new card
              updatedCards.set(newCard.id, newCard);
            }
          });
        });
      };

      const processFolders = (folders: typeof structure.folders) => {
        folders.forEach(folder => {
          processFiles(folder.files);
          processFolders(folder.subfolders);
        });
      };

      processFiles(structure.files);
      processFolders(structure.folders);

      saveFlashcards(updatedCards);

      return NextResponse.json({ 
        message: 'Flashcards synced',
        count: updatedCards.size,
      });
    }

    if (action === 'session') {
      // Get study session
      const cards = loadFlashcards();
      const session = getStudySession(cards);

      return NextResponse.json(session);
    }

    if (action === 'stats') {
      // Get study statistics
      const cards = loadFlashcards();
      const stats = getStudyStats(cards);

      return NextResponse.json(stats);
    }

    // Get all flashcards
    const cards = loadFlashcards();
    const cardsArray = Array.from(cards.values());

    return NextResponse.json(cardsArray);
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Review a flashcard
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, quality } = body;

    if (!cardId || quality === undefined) {
      return NextResponse.json(
        { error: 'Missing cardId or quality' },
        { status: 400 }
      );
    }

    if (quality < 0 || quality > 5) {
      return NextResponse.json(
        { error: 'Quality must be between 0 and 5' },
        { status: 400 }
      );
    }

    const cards = loadFlashcards();
    const card = cards.get(cardId);

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    // Calculate next review
    const updatedCard = calculateNextReview(card, quality);
    cards.set(cardId, updatedCard);
    saveFlashcards(cards);

    return NextResponse.json({
      success: true,
      card: updatedCard,
      nextReview: updatedCard.nextReview,
      interval: updatedCard.interval,
    });
  } catch (error) {
    console.error('Error reviewing flashcard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a flashcard
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const cardId = searchParams.get('cardId');

    if (!cardId) {
      return NextResponse.json(
        { error: 'Missing cardId' },
        { status: 400 }
      );
    }

    const cards = loadFlashcards();
    
    if (!cards.has(cardId)) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    cards.delete(cardId);
    saveFlashcards(cards);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
