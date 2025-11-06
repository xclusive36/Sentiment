import fs from 'fs';
import path from 'path';

// SM-2 Algorithm for spaced repetition
export interface FlashcardReview {
  cardId: string;
  quality: number; // 0-5
  timestamp: Date;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  fileSlug: string;
  fileTitle: string;
  tags: string[];
  
  // SM-2 parameters
  easeFactor: number; // Default: 2.5
  interval: number; // Days until next review
  repetitions: number; // Number of correct reviews in a row
  nextReview: Date;
  lastReview: Date | null;
  
  // Stats
  totalReviews: number;
  correctReviews: number;
  incorrectReviews: number;
  createdAt: Date;
}

export interface StudySession {
  cardsDue: Flashcard[];
  cardsNew: Flashcard[];
  cardsLearning: Flashcard[];
  stats: {
    totalCards: number;
    dueToday: number;
    newToday: number;
    completedToday: number;
  };
}

const FLASHCARDS_FILE = '.sentiment-flashcards.json';

/**
 * Extract flashcards from markdown content
 * Format: 
 * Q: Question text
 * A: Answer text
 * ---
 */
export function extractFlashcardsFromContent(
  content: string,
  fileSlug: string,
  fileTitle: string,
  tags: string[]
): Flashcard[] {
  const flashcards: Flashcard[] = [];
  
  // Match Q: and A: patterns
  const pattern = /Q:\s*(.+?)\nA:\s*(.+?)(?=\n(?:Q:|---|\n|$))/gm;
  const matches = content.matchAll(pattern);
  
  for (const match of matches) {
    const front = match[1].trim();
    const back = match[2].trim();
    
    if (front && back) {
      const cardId = generateCardId(fileSlug, front);
      
      flashcards.push({
        id: cardId,
        front,
        back,
        fileSlug,
        fileTitle,
        tags,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: new Date(),
        lastReview: null,
        totalReviews: 0,
        correctReviews: 0,
        incorrectReviews: 0,
        createdAt: new Date(),
      });
    }
  }
  
  return flashcards;
}

/**
 * Generate unique card ID from file and content
 */
function generateCardId(fileSlug: string, front: string): string {
  const hash = Buffer.from(`${fileSlug}-${front}`).toString('base64');
  return hash.substring(0, 16).replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Load all flashcards from storage
 */
export function loadFlashcards(): Map<string, Flashcard> {
  const filePath = path.join(process.cwd(), FLASHCARDS_FILE);
  
  if (!fs.existsSync(filePath)) {
    return new Map();
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const cards = new Map<string, Flashcard>();
    
    Object.entries(data).forEach(([id, card]: [string, any]) => {
      cards.set(id, {
        ...card,
        nextReview: new Date(card.nextReview),
        lastReview: card.lastReview ? new Date(card.lastReview) : null,
        createdAt: new Date(card.createdAt),
      });
    });
    
    return cards;
  } catch (error) {
    console.error('Error loading flashcards:', error);
    return new Map();
  }
}

/**
 * Save flashcards to storage
 */
export function saveFlashcards(cards: Map<string, Flashcard>): void {
  const filePath = path.join(process.cwd(), FLASHCARDS_FILE);
  const data: Record<string, Flashcard> = {};
  
  cards.forEach((card, id) => {
    data[id] = card;
  });
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Calculate next review date using SM-2 algorithm
 * @param card Current flashcard state
 * @param quality Response quality (0-5)
 * @returns Updated flashcard
 */
export function calculateNextReview(card: Flashcard, quality: number): Flashcard {
  const now = new Date();
  let { easeFactor, interval, repetitions } = card;
  
  // SM-2 Algorithm
  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect response - restart
    repetitions = 0;
    interval = 1;
  }
  
  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }
  
  // Calculate next review date
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + interval);
  
  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    nextReview,
    lastReview: now,
    totalReviews: card.totalReviews + 1,
    correctReviews: card.correctReviews + (quality >= 3 ? 1 : 0),
    incorrectReviews: card.incorrectReviews + (quality < 3 ? 1 : 0),
  };
}

/**
 * Get cards due for review
 */
export function getDueCards(cards: Map<string, Flashcard>): Flashcard[] {
  const now = new Date();
  const dueCards: Flashcard[] = [];
  
  cards.forEach(card => {
    if (card.nextReview <= now) {
      dueCards.push(card);
    }
  });
  
  return dueCards.sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime());
}

/**
 * Get new cards (never reviewed)
 */
export function getNewCards(cards: Map<string, Flashcard>, limit: number = 20): Flashcard[] {
  const newCards: Flashcard[] = [];
  
  cards.forEach(card => {
    if (card.totalReviews === 0) {
      newCards.push(card);
    }
  });
  
  return newCards
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .slice(0, limit);
}

/**
 * Get learning cards (reviewed but not mastered)
 */
export function getLearningCards(cards: Map<string, Flashcard>): Flashcard[] {
  const learningCards: Flashcard[] = [];
  
  cards.forEach(card => {
    if (card.totalReviews > 0 && card.repetitions < 3) {
      learningCards.push(card);
    }
  });
  
  return learningCards;
}

/**
 * Get study session
 */
export function getStudySession(cards: Map<string, Flashcard>): StudySession {
  const dueCards = getDueCards(cards);
  const newCards = getNewCards(cards);
  const learningCards = getLearningCards(cards);
  
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let completedToday = 0;
  cards.forEach(card => {
    if (card.lastReview && card.lastReview >= startOfDay) {
      completedToday++;
    }
  });
  
  return {
    cardsDue: dueCards,
    cardsNew: newCards,
    cardsLearning: learningCards,
    stats: {
      totalCards: cards.size,
      dueToday: dueCards.length,
      newToday: newCards.length,
      completedToday,
    },
  };
}

/**
 * Get retention rate for a card
 */
export function getRetentionRate(card: Flashcard): number {
  if (card.totalReviews === 0) return 0;
  return (card.correctReviews / card.totalReviews) * 100;
}

/**
 * Get streak (consecutive correct reviews)
 */
export function getStreak(card: Flashcard): number {
  return card.repetitions;
}

/**
 * Filter cards by tags
 */
export function filterCardsByTags(cards: Flashcard[], tags: string[]): Flashcard[] {
  if (tags.length === 0) return cards;
  return cards.filter(card => 
    tags.some(tag => card.tags.includes(tag))
  );
}

/**
 * Get study statistics
 */
export function getStudyStats(cards: Map<string, Flashcard>) {
  let totalReviews = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let mastered = 0;
  let learning = 0;
  let newCards = 0;
  
  cards.forEach(card => {
    totalReviews += card.totalReviews;
    totalCorrect += card.correctReviews;
    totalIncorrect += card.incorrectReviews;
    
    if (card.totalReviews === 0) {
      newCards++;
    } else if (card.repetitions >= 3) {
      mastered++;
    } else {
      learning++;
    }
  });
  
  const avgRetention = totalReviews > 0 ? (totalCorrect / totalReviews) * 100 : 0;
  
  return {
    totalCards: cards.size,
    totalReviews,
    totalCorrect,
    totalIncorrect,
    avgRetention,
    mastered,
    learning,
    newCards,
  };
}
