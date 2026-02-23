// ExplorePage.jsx - Working AI Chat with Regular JSON
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronLeft, Send, BookOpen, Share2, Users, X, Info } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://versal-book-app.onrender.com';

// ─── DYNAMIC BOOK COVER ────────────────────────────────────────────────────────
const DynamicBookCover = ({ title, author, size = 'md', onClick }) => {
  const [coverUrl, setCoverUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const sizeMap = { xs: 'w-12 h-16', sm: 'w-16 h-20', md: 'w-24 h-32', lg: 'w-32 h-40', xl: 'w-40 h-48' };
  const coverClassName = sizeMap[size];

  useEffect(() => {
    if (!title) { setError(true); setLoading(false); return; }
    const query = author ? `${title} ${author}` : title;
    
    fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`, { signal: AbortSignal.timeout(5000) })
      .then(res => res.json())
      .then(data => {
        const book = data.docs?.[0];
        if (book?.cover_i) setCoverUrl(`https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`);
        else setError(true);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [title, author]);

  const getFallbackColor = () => {
    const colors = ['#7B9EA6','#C8622A','#8B5E3C','#E8A87C','#C4A882','#2C3E50','#E74C3C'];
    const hash = (title||'').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (loading) return <div className={`${coverClassName} bg-gray-200 rounded-xl animate-pulse`} />;
  if (error || !coverUrl) return (
    <div className={`${coverClassName} rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg cursor-pointer`} 
      style={{backgroundColor: getFallbackColor()}} onClick={onClick}>
      <span className="text-2xl">{title?.slice(0,2).toUpperCase()}</span>
      <BookOpen className="w-5 h-5 mt-1 opacity-60" />
    </div>
  );

  return <img src={coverUrl} alt={title} className={`${coverClassName} rounded-xl shadow-lg object-cover cursor-pointer hover:scale-105 transition`} onClick={onClick} />;
};

// ─── BOOK DETAILS MODAL (for viewing book info) ───────────────────────────────
const BookDetailsModal = ({ book, onClose, onCreateCrew }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/api/books/book-details`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ bookName: book.title, author: book.author })
        });
        const data = await res.json();
        if (data.success) setDetails(data);
      } catch (err) {
        console.error('Failed to fetch details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [book]);

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center max-w-md mx-auto">
      <div className="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h3 className="font-bold text-lg">Book Details</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : details ? (
          <div className="p-4 space-y-4">
            <div className="flex gap-4">
              <DynamicBookCover title={book.title} author={book.author} size="lg" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{book.title}</h2>
                <p className="text-gray-500">by {book.author}</p>
                {book.genre && <span className="inline-block mt-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs">{book.genre}</span>}
                {book.rating && <div className="mt-2"><span className="font-semibold">⭐ {book.rating}</span></div>}
              </div>
            </div>

            {details.summary && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-orange-500" />
                  About This Book
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{details.summary}</p>
              </div>
            )}

            {details.themes?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {details.themes.map((theme, i) => (
                    <span key={i} className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full">{theme}</span>
                  ))}
                </div>
              </div>
            )}

            {details.quotes?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">📖 Famous Quotes</h4>
                <div className="space-y-3">
                  {details.quotes.map((q, i) => (
                    <div key={i} className="bg-orange-50 rounded-xl p-3 border-l-4 border-orange-400">
                      <p className="text-sm italic text-gray-800">"{q.quote}"</p>
                      {q.context && <p className="text-xs text-gray-500 mt-1">{q.context}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {details.similarBooks?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">📚 Similar Books</h4>
                <div className="space-y-3">
                  {details.similarBooks.map((b, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
                      <div className="flex gap-3">
                        <DynamicBookCover title={b.title} author={b.author} size="sm" />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-sm">{b.title}</h5>
                          <p className="text-xs text-gray-500">by {b.author}</p>
                          {b.description && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{b.description}</p>}
                          {b.reason && <p className="text-xs text-orange-600 mt-1 italic">"{b.reason}"</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={() => { onCreateCrew(book); onClose(); }} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold">
                Create Crew
              </button>
              <button onClick={() => { navigator.clipboard.writeText(`"${book.title}" by ${book.author}`); alert('Copied!'); }} className="px-4 py-3 border border-gray-200 rounded-xl">
                <Share2 className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ─── BOOK CARD ─────────────────────────────────────────────────────────────────
const BookCard = ({ book, onCreateCrew, onViewDetails }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
    <div className="flex gap-4">
      <DynamicBookCover title={book.title} author={book.author} size="md" onClick={() => onViewDetails?.(book)} />
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 text-sm leading-tight">{book.title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">by {book.author}</p>
        {book.genre && <span className="inline-block mt-1.5 text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{book.genre}</span>}
        {book.description && <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{book.description}</p>}
        {book.reason && <p className="text-xs text-orange-700 mt-1 italic line-clamp-2">"{book.reason}"</p>}
        {book.rating && <div className="mt-2"><span className="text-xs font-semibold">⭐ {book.rating}</span></div>}
      </div>
    </div>
    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
      <button onClick={() => onViewDetails?.(book)} className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold">View Details</button>
      <button onClick={onCreateCrew} className="flex-1 py-2.5 bg-[#C8622A] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5">
        <Users className="w-4 h-4" />Crew
      </button>
    </div>
  </div>
);

// ─── CHARACTER MODE ────────────────────────────────────────────────────────────
const CharacterMode = ({ setMode, onCreateCrew, setPage }) => {
  const [charName, setCharName] = useState('');
  const [charBook, setCharBook] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);

  const searchCharacter = async () => {
    if (!charName.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/books/character-search`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ character: charName.trim(), fromBook: charBook.trim() || undefined }),
        signal: AbortSignal.timeout(15000)
      });
      const data = await res.json();
      if (data.success) setResult(data);
    } catch (err) {
      alert('Failed to search. Try again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {selectedBook && <BookDetailsModal book={selectedBook} onClose={() => setSelectedBook(null)} onCreateCrew={(b) => { onCreateCrew(b); setPage('crews'); }} />}
      
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => setMode('chat')} className="p-1 hover:bg-gray-100 rounded-xl"><ChevronLeft className="w-5 h-5" /></button>
        <span className="font-semibold">Find Books by Character</span>
      </div>
      <div className="px-4 py-5 space-y-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200">
          <p className="text-sm text-gray-600 mb-4">Love a character? Find books with similar ones! 🎭</p>
          <input value={charName} onChange={e => setCharName(e.target.value)} placeholder="Character name (e.g. Hermione)" 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-2 outline-none focus:border-orange-400" 
            onKeyDown={e => e.key === 'Enter' && searchCharacter()} />
          <input value={charBook} onChange={e => setCharBook(e.target.value)} placeholder="From which book? (optional)" 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-3 outline-none focus:border-orange-400"
            onKeyDown={e => e.key === 'Enter' && searchCharacter()} />
          <button onClick={searchCharacter} disabled={!charName.trim() || loading} 
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold disabled:opacity-50">
            {loading ? 'Searching...' : '🎭 Find Similar Books'}
          </button>
        </div>
        {result && (
          <div className="space-y-4">
            <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
              <p className="text-sm text-orange-800 leading-relaxed">{result.characterAnalysis}</p>
            </div>
            {result.recommendations?.map((book, i) => (
              <BookCard key={i} book={book} onCreateCrew={() => { onCreateCrew(book); setPage('crews'); }} onViewDetails={setSelectedBook} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

// ─── MAIN EXPLORE PAGE ─────────────────────────────────────────────────────────
const ExplorePage = ({ user, setPage, onCreateCrew }) => {
  const [mode, setMode] = useState('chat');
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hey! 👋 I'm Page Turner, your AI book companion.\n\nYou can ask me:\n📚 Book recommendations\n📖 To tell you about specific books\n💭 Famous quotes\n🎭 Books with characters you love\n\nWhat would you like to explore?",
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [sessionId] = useState(`session_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText, timestamp: new Date() }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/books/chat`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ message: userText, sessionId }),
        signal: AbortSignal.timeout(20000)
      });

      const data = await res.json();
      
      if (data.success && data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }]);
        if (data.hasRecommendations && data.recommendations?.length > 0) {
          setRecs(data.recommendations);
        }
      } else {
        throw new Error('No response');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Having trouble connecting 😅 Try again or pick a suggestion below!", 
        timestamp: new Date() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'character') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] to-[#FAF6F1] pb-24">
        <CharacterMode setMode={setMode} onCreateCrew={onCreateCrew} setPage={setPage} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] to-[#FAF6F1] pb-24">
      {selectedBook && <BookDetailsModal book={selectedBook} onClose={() => setSelectedBook(null)} onCreateCrew={(b) => { onCreateCrew(b); setPage('crews'); }} />}
      
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-[#2D1F14] mb-1" style={{fontFamily:'Georgia,serif'}}>Your AI Book Companion</h1>
        <p className="text-sm text-[#8B7968]">Ask me anything about books!</p>
      </div>

      <div className="flex gap-2 px-5 mb-4">
        <button onClick={() => setMode('chat')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${mode==='chat' ? 'bg-orange-500 text-white shadow' : 'bg-white text-gray-600 border'}`}>
          <Sparkles className="w-3.5 h-3.5" />AI Chat
        </button>
        <button onClick={() => setMode('character')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${mode==='character' ? 'bg-orange-500 text-white shadow' : 'bg-white text-gray-600 border'}`}>
          🎭 By Character
        </button>
      </div>

      <div className="mx-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role==='user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-[78%] flex flex-col ${msg.role==='user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${msg.role==='user' ? 'bg-[#C8622A] text-white rounded-br-sm' : 'bg-white text-[#3A2C25] rounded-bl-sm shadow-sm border'}`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                {[0,150,300].map(d => <div key={d} className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}} />)}
              </div>
            </div>
          </div>
        )}

        {recs.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2"><div className="h-px flex-1 bg-orange-200" /><span className="text-xs text-orange-500 font-semibold">📚 RECOMMENDED FOR YOU</span><div className="h-px flex-1 bg-orange-200" /></div>
            {recs.map((book, i) => <BookCard key={i} book={book} onCreateCrew={() => { onCreateCrew(book); setPage('crews'); }} onViewDetails={setSelectedBook} />)}
          </div>
        )}

        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="px-5 mt-4">
          <p className="text-xs text-[#8B7968] mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {['Tell me about The Alchemist', 'Books like Harry Potter', 'Famous quotes from Pride and Prejudice', 'Something sad but beautiful', 'Best thriller of 2024', 'Books about self-growth'].map(s => (
              <button key={s} onClick={() => setInput(s)} className="text-xs px-3 py-1.5 bg-white border rounded-full text-[#6B5D52] hover:border-orange-300 hover:bg-orange-50">{s}</button>
            ))}
          </div>
        </div>
      )}

      <div className="sticky bottom-20 mx-4 mt-4 bg-white/95 backdrop-blur rounded-2xl shadow-lg border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} 
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send(); }}}
            placeholder="Ask me anything about books..." 
            className="flex-1 bg-transparent text-sm outline-none text-[#2D1F14] placeholder-gray-400" />
          <button onClick={send} disabled={!input.trim() || loading} 
            className={`w-9 h-9 rounded-full flex items-center justify-center transition ${input.trim() && !loading ? 'bg-[#C8622A] text-white' : 'bg-gray-100 text-gray-400'}`}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;