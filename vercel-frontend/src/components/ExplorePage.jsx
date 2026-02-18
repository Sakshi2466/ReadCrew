import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronLeft, Search, BookOpen } from 'lucide-react';
import { getBookRecommendations } from '../services/api';
import { getBookDetails, getPlaceholderGradient } from '../utils/bookCoverAPI';

// Smart keyword suggestions based on what user types
const SUGGESTION_MAP = {
  space: [
    { emoji: '🚀', label: 'Space exploration' },
    { emoji: '👨‍🚀', label: 'Sci-fi adventure' },
    { emoji: '🌌', label: 'Cosmic philosophy' },
    { emoji: '📚', label: 'Real NASA stories' },
  ],
  love: [
    { emoji: '❤️', label: 'Romantic drama' },
    { emoji: '💔', label: 'Heartbreak & healing' },
    { emoji: '💑', label: 'Long-distance love' },
    { emoji: '🌹', label: 'Classic romance' },
  ],
  sad: [
    { emoji: '😢', label: 'Grief & loss' },
    { emoji: '🌧️', label: 'Emotional healing' },
    { emoji: '📖', label: 'Cathartic fiction' },
    { emoji: '🕊️', label: 'Hope after sorrow' },
  ],
  magic: [
    { emoji: '✨', label: 'Fantasy worlds' },
    { emoji: '🧙', label: 'Wizard adventures' },
    { emoji: '🔮', label: 'Mystical journeys' },
    { emoji: '🐉', label: 'Dragons & myth' },
  ],
  history: [
    { emoji: '🏛️', label: 'Ancient civilizations' },
    { emoji: '⚔️', label: 'Wars & battles' },
    { emoji: '👑', label: 'Royalty & empire' },
    { emoji: '🗺️', label: 'Historical fiction' },
  ],
  motivation: [
    { emoji: '💪', label: 'Self-improvement' },
    { emoji: '🎯', label: 'Goal setting' },
    { emoji: '🧠', label: 'Mindset shifts' },
    { emoji: '🚀', label: 'Entrepreneurship' },
  ],
  mystery: [
    { emoji: '🔍', label: 'Detective novels' },
    { emoji: '🕵️', label: 'Crime thrillers' },
    { emoji: '👻', label: 'Psychological horror' },
    { emoji: '🗝️', label: 'Unsolved mysteries' },
  ],
  nature: [
    { emoji: '🌿', label: 'Environmental fiction' },
    { emoji: '🌊', label: 'Ocean adventures' },
    { emoji: '🏔️', label: 'Wilderness survival' },
    { emoji: '🌸', label: 'Peaceful & slow' },
  ],
};

const DEFAULT_SUGGESTIONS = [
  { emoji: '📕', label: 'Something emotional' },
  { emoji: '🔥', label: 'Motivating & energetic' },
  { emoji: '🌿', label: 'Calm & reflective' },
  { emoji: '🔮', label: 'Dark & mysterious' },
];

const getSuggestions = (input) => {
  if (!input.trim()) return DEFAULT_SUGGESTIONS;
  const lower = input.toLowerCase();
  for (const [key, suggestions] of Object.entries(SUGGESTION_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return suggestions;
  }
  return [
    { emoji: '✨', label: `${input} fiction` },
    { emoji: '📖', label: `${input} non-fiction` },
    { emoji: '🌟', label: `Popular ${input} books` },
    { emoji: '🆕', label: `New ${input} releases` },
  ];
};

// Parse AI response into book objects
const parseBooks = (text) => {
  const books = [];
  const sections = text.split(/\n(?=\d+\.|##|\*\*)/);
  for (const section of sections) {
    const titleMatch = section.match(/\*\*(.+?)\*\*\s+by\s+(.+?)[\n\*]/);
    if (titleMatch) {
      const rest = section.replace(/\*\*.*?\*\*\s+by\s+.+?\n/, '').trim();
      books.push({
        title: titleMatch[1].trim(),
        author: titleMatch[2].trim(),
        description: rest.replace(/\*+/g, '').replace(/\n/g, ' ').trim().slice(0, 160),
        coverUrl: null, // Will be fetched
        loading: true,
      });
    }
  }
  return books.slice(0, 6);
};

// Book Card Component with real cover
const BookCard = ({ book, index, setPage }) => {
  const [coverUrl, setCoverUrl] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real cover
    const fetchCover = async () => {
      const details = await getBookDetails(book.title, book.author);
      if (details.coverUrl) {
        setCoverUrl(details.coverUrl);
      }
      setLoading(false);
    };
    fetchCover();
  }, [book.title, book.author]);

  const gradient = getPlaceholderGradient(book.title);

  return (
    <div className="bg-white rounded-2xl border border-[#EDE8E3] overflow-hidden shadow-sm hover:shadow-md transition">
      <div className="flex gap-4 p-4">
        {/* Book cover with real image or gradient fallback */}
        <div className="relative shrink-0" style={{ width: '80px', height: '120px' }}>
          {loading ? (
            <div
              className="w-full h-full rounded-xl flex items-center justify-center"
              style={{ background: gradient }}
            >
              <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            </div>
          ) : coverUrl && !imageError ? (
            <img
              src={coverUrl}
              alt={book.title}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover rounded-xl shadow-lg"
            />
          ) : (
            <div
              className="w-full h-full rounded-xl flex items-center justify-center shadow-md"
              style={{ background: gradient }}
            >
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#2D2419] text-base leading-tight line-clamp-2" style={{ fontFamily: 'Georgia, serif' }}>
            {book.title}
          </h3>
          <p className="text-sm text-[#9B8E84] mt-0.5">by {book.author}</p>
          {book.description && (
            <p className="text-xs text-[#6B5D52] mt-2 leading-relaxed line-clamp-3">{book.description}</p>
          )}
        </div>
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => setPage('crews')}
          className="flex-1 py-2.5 bg-[#C8622A] text-white rounded-xl text-sm font-semibold hover:bg-[#B05520] transition"
        >
          Join Crew
        </button>
        <button className="px-4 py-2.5 border border-[#EDE8E3] text-[#6B5D52] rounded-xl text-sm font-medium hover:bg-[#FAF6F1] transition">
          Reviews
        </button>
      </div>
    </div>
  );
};

const ExplorePage = ({ user, setPage }) => {
  const [query, setQuery] = useState('');
  const [intensity, setIntensity] = useState(50);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [aiText, setAiText] = useState('');
  const [searched, setSearched] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    if (query.trim()) {
      setSuggestions(getSuggestions(query));
      setShowSuggestions(true);
    } else {
      setSuggestions(DEFAULT_SUGGESTIONS);
      setShowSuggestions(false);
    }
  }, [query]);

  const handleSuggestionClick = (label) => {
    setQuery(label);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleFindBook = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setResults([]);
    setAiText('');
    setShowSuggestions(false);

    const intensityLabel = intensity < 33 ? 'light and easy to read' : intensity < 66 ? 'moderately engaging' : 'deep and intellectually intense';
    const prompt = `${query}, books that are ${intensityLabel}`;

    let fullText = '';
    try {
      await getBookRecommendations(
        prompt,
        (token) => { fullText += token; setAiText(fullText); },
        () => {
          const parsed = parseBooks(fullText);
          setResults(parsed);
          setLoading(false);
        }
      );
    } catch {
      setLoading(false);
    }
  };

  // RESULTS VIEW
  if (searched) {
    return (
      <div className="min-h-screen bg-[#FAF6F1] pb-24">
        {/* Header */}
        <div className="sticky top-0 bg-[#FAF6F1] z-40 px-4 py-3 flex items-center gap-3 border-b border-[#EDE8E3]">
          <button
            onClick={() => { setSearched(false); setResults([]); setAiText(''); }}
            className="p-2 hover:bg-[#F0E8DF] rounded-xl transition"
          >
            <ChevronLeft className="w-5 h-5 text-[#6B5D52]" />
          </button>
          <div className="flex-1 bg-white border border-[#EDE8E3] rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-[#9B8E84]" />
            <span className="text-sm text-[#2D2419]">{query}</span>
          </div>
        </div>

        <div className="px-4 py-5">
          {loading && results.length === 0 && (
            <div className="text-center py-16">
              <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="w-16 h-16 border-4 border-[#F0E8DF] border-t-[#C8622A] rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#C8622A]" />
                </div>
              </div>
              <p className="text-[#6B5D52] font-medium" style={{ fontFamily: 'Georgia, serif' }}>Finding your perfect book...</p>
              <p className="text-xs text-[#9B8E84] mt-1">Based on: "{query}"</p>
            </div>
          )}

          {/* Streaming AI text if no parsed books yet */}
          {loading && aiText && results.length === 0 && (
            <div className="bg-white rounded-2xl p-5 border border-[#EDE8E3] mb-4">
              <p className="text-sm text-[#6B5D52] leading-relaxed whitespace-pre-wrap">{aiText}
                <span className="inline-block w-0.5 h-4 bg-[#C8622A] animate-pulse ml-0.5 align-middle" />
              </p>
            </div>
          )}

          {/* Book Result Cards with REAL covers */}
          {results.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">✨</span>
                <h2 className="font-bold text-[#2D2419]" style={{ fontFamily: 'Georgia, serif' }}>
                  Books for "{query}"
                </h2>
              </div>
              <div className="space-y-4">
                {results.map((book, i) => (
                  <BookCard key={i} book={book} index={i} setPage={setPage} />
                ))}
              </div>

              <button
                onClick={() => { setSearched(false); setResults([]); setAiText(''); setQuery(''); }}
                className="mt-6 w-full py-3 border border-[#EDE8E3] bg-white rounded-2xl text-sm font-medium text-[#6B5D52] hover:bg-[#F5EDE3] transition"
              >
                ← Search again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // MAIN EXPLORE VIEW
  return (
    <div
      className="min-h-screen pb-24 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at top center, #F5E6D3 0%, #FAF6F1 60%)',
      }}
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 px-5 pt-12 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1
            className="text-[2rem] font-bold text-[#2D1F14] leading-tight mb-3"
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.5px' }}
          >
            What do you feel like<br />reading today?
          </h1>
          <p className="text-[#8B7968] text-sm leading-relaxed">
            You can type anything — a mood, a topic, a vibe, a<br />random thought.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-[#EDE8E3] mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">✨</span>
            <span className="text-[#8B7968] text-sm" style={{ fontFamily: 'Georgia, serif' }}>
              Tell me what's on your mind...
            </span>
          </div>

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => e.key === 'Enter' && handleFindBook()}
            placeholder=""
            className="w-full bg-[#FAF8F5] border border-[#E8E0D8] rounded-2xl px-4 py-3.5 text-[#2D1F14] text-base outline-none focus:border-[#C8622A] transition mb-3"
            style={{ fontFamily: 'Georgia, serif' }}
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="bg-[#FAF8F5] border border-[#E8E0D8] rounded-2xl overflow-hidden mb-3">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s.label)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F0E8DF] transition text-left border-b border-[#EDE8E3] last:border-0"
                >
                  <span className="text-xl">{s.emoji}</span>
                  <span className="text-[#2D1F14] text-sm font-medium">{s.label}</span>
                </button>
              ))}
            </div>
          )}

          {query.trim() && (
            <div className="flex gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 bg-[#F0E8DF] text-[#6B5D52] text-xs px-3 py-1.5 rounded-full">
                🌙 {query}
              </span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <p className="text-center text-[#6B5D52] text-sm font-medium mb-3">
            How intense should it be?
          </p>
          <div className="flex items-center gap-3">
            <span className="text-lg">☀️</span>
            <span className="text-xs text-[#9B8E84]">Light</span>
            <div className="flex-1 relative">
              <input
                type="range"
                min="0"
                max="100"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full h-1.5 rounded-full outline-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #C8622A ${intensity}%, #E8DDD5 ${intensity}%)`,
                }}
              />
            </div>
            <span className="text-xs text-[#9B8E84]">Deep</span>
            <span className="text-lg">🌑</span>
          </div>
          <div className="flex justify-center mt-2">
            <span className="text-xs text-[#C8622A] font-medium">
              {intensity < 33 ? 'Light & Breezy' : intensity < 66 ? 'Moderately Deep' : 'Deep & Intense'}
            </span>
          </div>
        </div>

        <button
          onClick={handleFindBook}
          disabled={!query.trim() || loading}
          className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]"
          style={{
            background: loading ? '#C8622A' : 'linear-gradient(135deg, #C8622A 0%, #A0481E 100%)',
            boxShadow: '0 4px 20px rgba(200, 98, 42, 0.35)',
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Finding your book...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>✦</span>
              Find My Book
            </span>
          )}
        </button>

        <div className="mt-5 text-center">
          <button
            onClick={() => setPage('crews')}
            className="text-sm text-[#9B8E84] hover:text-[#C8622A] transition"
          >
            or browse all genres →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;