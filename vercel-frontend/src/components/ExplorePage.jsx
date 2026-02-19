import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronLeft, Search, BookOpen, UserPlus } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

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

// Book Card Component
const BookCard = ({ book, onJoinCrew, onInvite }) => {
  const getBookColor = (title) => {
    const colors = ['#C8622A', '#7B9EA6', '#8B5E3C', '#C8956C', '#2D2419'];
    const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EDE8E3] overflow-hidden shadow-sm hover:shadow-md transition">
      <div className="flex gap-4 p-4">
        {/* Book cover */}
        <div 
          className="shrink-0 w-20 h-28 rounded-xl flex items-center justify-center shadow-md"
          style={{ backgroundColor: getBookColor(book.title) }}
        >
          <BookOpen className="w-8 h-8 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#2D2419] text-base leading-tight line-clamp-2" style={{ fontFamily: 'Georgia, serif' }}>
            {book.title}
          </h3>
          <p className="text-sm text-[#9B8E84] mt-0.5">by {book.author}</p>
          {book.genre && (
            <span className="inline-block text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full mt-1">
              {book.genre}
            </span>
          )}
          {book.description && (
            <p className="text-xs text-[#6B5D52] mt-2 leading-relaxed line-clamp-2">{book.description}</p>
          )}
          {book.reason && (
            <p className="text-xs text-[#8B7968] italic mt-1 line-clamp-2">💡 {book.reason}</p>
          )}
        </div>
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => onJoinCrew(book)}
          className="flex-1 py-2.5 bg-[#C8622A] text-white rounded-xl text-sm font-semibold hover:bg-[#B05520] transition"
        >
          Join Crew
        </button>
        <button 
          onClick={() => onInvite(book)}
          className="px-4 py-2.5 border border-[#EDE8E3] text-[#6B5D52] rounded-xl text-sm font-medium hover:bg-[#FAF6F1] transition"
        >
          <UserPlus className="w-4 h-4 inline" />
        </button>
      </div>
    </div>
  );
};

const ExplorePage = ({ user, setPage, onCreateCrew }) => {
  const [query, setQuery] = useState('');
  const [intensity, setIntensity] = useState(50);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
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
    if (!selectedTags.includes(label)) {
      setSelectedTags([...selectedTags, label]);
    }
    inputRef.current?.focus();
  };

  const removeTag = (tag) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleFindBook = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setSearched(true);
    setResults([]);
    setShowSuggestions(false);

    const intensityLabel = 
      intensity < 33 ? 'light and easy to read' : 
      intensity < 66 ? 'moderately engaging' : 
      'deep and intellectually intense';
    
    const fullQuery = `${query}. Books that are ${intensityLabel}. Recommend 5 books.`;

    try {
      const response = await axios.post(`${API_URL}/api/recommend/ai`, {
        query: fullQuery
      });

      if (response.data.success && response.data.recommendations) {
        setResults(response.data.recommendations);
      } else {
        // Fallback to mock data
        setResults(getMockRecommendations(query));
      }
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      // Fallback to mock data
      setResults(getMockRecommendations(query));
    } finally {
      setLoading(false);
    }
  };

  const getMockRecommendations = (searchQuery) => {
    const lower = searchQuery.toLowerCase();
    
    if (lower.includes('space') || lower.includes('sci-fi')) {
      return [
        { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', description: 'A lone astronaut must save humanity', reason: 'Perfect blend of science and adventure' },
        { title: 'The Martian', author: 'Andy Weir', genre: 'Sci-Fi', description: 'Survival on Mars', reason: 'Humorous and scientifically accurate' },
        { title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi', description: 'Epic space opera', reason: 'Classic worldbuilding and politics' },
      ];
    } else if (lower.includes('motivation') || lower.includes('self')) {
      return [
        { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', description: 'Tiny changes, remarkable results', reason: 'Practical and easy to implement' },
        { title: 'The 7 Habits of Highly Effective People', author: 'Stephen Covey', genre: 'Self-Help', description: 'Timeless principles for success', reason: 'Life-changing framework' },
        { title: 'Can\'t Hurt Me', author: 'David Goggins', genre: 'Motivation', description: 'Master your mind and defy the odds', reason: 'Incredibly inspiring and raw' },
      ];
    } else {
      return [
        { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', description: 'Between life and death, there is a library', reason: 'Beautiful and thought-provoking' },
        { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', description: 'A lone astronaut must save humanity', reason: 'Perfect blend of science and adventure' },
        { title: 'Educated', author: 'Tara Westover', genre: 'Memoir', description: 'A memoir of survival and transformation', reason: 'Powerful and moving story' },
      ];
    }
  };

  const handleJoinCrew = (book) => {
    if (window.confirm(`Join or create a crew for "${book.title}"?`)) {
      onCreateCrew(book);
      setPage('crews');
    }
  };

  const handleInvite = (book) => {
    if (navigator.share) {
      navigator.share({
        title: `Let's read ${book.title} together!`,
        text: `I found this amazing book "${book.title}" by ${book.author}. Want to start a reading crew?`,
        url: window.location.href,
      });
    } else {
      alert('Invite your friends to read this book together!');
    }
  };

  // RESULTS VIEW
  if (searched) {
    return (
      <div className="min-h-screen bg-[#FAF6F1] pb-24">
        {/* Header */}
        <div className="sticky top-0 bg-[#FAF6F1] z-40 px-4 py-3 flex items-center gap-3 border-b border-[#EDE8E3]">
          <button
            onClick={() => { setSearched(false); setResults([]); }}
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
          {loading && (
            <div className="text-center py-16">
              <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="w-16 h-16 border-4 border-[#F0E8DF] border-t-[#C8622A] rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[#C8622A]" />
                </div>
              </div>
              <p className="text-[#6B5D52] font-medium" style={{ fontFamily: 'Georgia, serif' }}>
                Finding your perfect book...
              </p>
              <p className="text-xs text-[#9B8E84] mt-1">Based on: "{query}"</p>
            </div>
          )}

          {/* Book Results */}
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
                  <BookCard 
                    key={i} 
                    book={book} 
                    onJoinCrew={handleJoinCrew}
                    onInvite={handleInvite}
                  />
                ))}
              </div>

              <button
                onClick={() => { setSearched(false); setResults([]); setQuery(''); setSelectedTags([]); }}
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

  // MAIN EXPLORE VIEW (matching the image design)
  return (
    <div
      className="min-h-screen pb-24 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at top center, #F5E6D3 0%, #FAF6F1 60%)',
      }}
    >
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 px-5 pt-12 max-w-md mx-auto">
        {/* Title */}
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

        {/* Search Box */}
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

          {/* Dynamic Suggestions Dropdown */}
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

          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {selectedTags.map((tag, i) => (
                <span 
                  key={i}
                  className="flex items-center gap-1.5 bg-[#F0E8DF] text-[#6B5D52] text-xs px-3 py-1.5 rounded-full"
                >
                  🌙 {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-[#C8622A]">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Intensity Slider */}
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
                className="w-full h-1.5 rounded-full outline-none cursor-pointer appearance-none"
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

        {/* Find My Book Button */}
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
              <span>✨</span>
              Find My Book
            </span>
          )}
        </button>

        {/* Browse all genres link */}
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