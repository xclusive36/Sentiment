'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Flashcard, StudySession } from '@/lib/spaced-repetition';

export default function StudyPage() {
  const [session, setSession] = useState<StudySession | null>(null);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [queue, setQueue] = useState<Flashcard[]>([]);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      // First sync cards from markdown
      await fetch('/api/flashcards?action=sync');
      
      // Then get study session
      const res = await fetch('/api/flashcards?action=session');
      const data = await res.json();
      setSession(data);
      
      // Build review queue: due cards + some new cards
      const reviewQueue = [...data.cardsDue];
      if (reviewQueue.length < 10) {
        reviewQueue.push(...data.cardsNew.slice(0, 10 - reviewQueue.length));
      }
      
      setQueue(reviewQueue);
      if (reviewQueue.length > 0) {
        setCurrentCard(reviewQueue[0]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching session:', error);
      setIsLoading(false);
    }
  };

  const handleReview = async (quality: number) => {
    if (!currentCard) return;

    try {
      await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: currentCard.id, quality }),
      });

      setReviewedCount(prev => prev + 1);
      setShowAnswer(false);

      // Move to next card
      const nextQueue = queue.slice(1);
      setQueue(nextQueue);
      
      if (nextQueue.length > 0) {
        setCurrentCard(nextQueue[0]);
      } else {
        setCurrentCard(null);
      }
    } catch (error) {
      console.error('Error reviewing card:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading study session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Failed to load session</div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                All Done!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You've completed {reviewedCount} card{reviewedCount !== 1 ? 's' : ''} in this session.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={fetchSession}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Start New Session
                </button>
                <Link
                  href="/"
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {reviewedCount} / {reviewedCount + queue.length} cards
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {queue.length} remaining
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(reviewedCount / (reviewedCount + queue.length)) * 100}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden min-h-[400px] flex flex-col">
            {/* Card Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <Link
                    href={`/file/${currentCard.fileSlug}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {currentCard.fileTitle}
                  </Link>
                  {currentCard.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {currentCard.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {currentCard.totalReviews > 0 && (
                    <span>Reviewed {currentCard.totalReviews}x</span>
                  )}
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="text-center mb-8">
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wide">
                  {showAnswer ? 'Answer' : 'Question'}
                </div>
                <div className="text-xl md:text-2xl text-gray-900 dark:text-gray-100 leading-relaxed">
                  {showAnswer ? currentCard.back : currentCard.front}
                </div>
              </div>

              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                >
                  Show Answer
                </button>
              ) : (
                <div className="w-full max-w-md">
                  <div className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
                    How well did you remember?
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleReview(0)}
                      className="px-4 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-800 dark:text-red-200 rounded-lg transition-colors text-sm font-medium"
                    >
                      😞 Forgot
                      <div className="text-xs opacity-70">Review: 1 day</div>
                    </button>
                    <button
                      onClick={() => handleReview(2)}
                      className="px-4 py-3 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-800 dark:text-orange-200 rounded-lg transition-colors text-sm font-medium"
                    >
                      😐 Hard
                      <div className="text-xs opacity-70">Review: 1 day</div>
                    </button>
                    <button
                      onClick={() => handleReview(3)}
                      className="px-4 py-3 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-800 dark:text-green-200 rounded-lg transition-colors text-sm font-medium"
                    >
                      🙂 Good
                      <div className="text-xs opacity-70">
                        Review: {currentCard.repetitions === 0 ? '1 day' : currentCard.repetitions === 1 ? '6 days' : `${Math.round(currentCard.interval * currentCard.easeFactor)} days`}
                      </div>
                    </button>
                    <button
                      onClick={() => handleReview(5)}
                      className="px-4 py-3 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-lg transition-colors text-sm font-medium"
                    >
                      😄 Easy
                      <div className="text-xs opacity-70">
                        Review: {currentCard.repetitions === 0 ? '1 day' : currentCard.repetitions === 1 ? '6 days' : `${Math.round(currentCard.interval * currentCard.easeFactor * 1.3)} days`}
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              Create flashcards in your notes with <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Q:</code> and <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">A:</code> format
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
