import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Home, Search, Edit3, Users, User, Bell, Settings,
  Heart, MessageCircle, Bookmark, Share2, Star, Plus, ChevronRight,
  X, Send, Image, ChevronLeft, LogOut, Camera, MoreHorizontal,
  Flame, Sparkles, Trophy, Calendar, Lock, Eye, EyeOff, UserPlus,
  Gift, ThumbsUp, ThumbsDown, Trash2, Edit, Target, Check, ArrowLeft,
  Clock, TrendingUp, Menu, Upload
} from 'lucide-react';

// Import ReadCrewPage component
import ReadCrewPage from './components/ReadCrewPage';

// Import API functions
import { donationAPI, reviewAPI, otpAPI, checkBackendConnection, getBookRecommendations } from './services/api';
import axios from 'axios';

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
const MOCK_POSTS = [
  {
    id: 1, user: 'Aishwarya Rao', handle: '@readswithaish', avatar: 'AR',
    book: 'Atomic Habits', time: '5h ago',
    content: "Atomic Habits has totally changed the way I approach goals! Small, consistent actions really do add up. Loving the journey so far! 🌿 #habitbuilding",
    likes: 120, comments: 18, shares: 1, saved: false, liked: false
  },
  {
    id: 2, user: 'Amit', handle: '@amit_reads', avatar: 'AM',
    book: 'Ikigai', time: '12h ago',
    content: "Finding Ikigai has made me reflect deeply on my life purpose. Such an inspiring concept! 🌟🦋✨",
    likes: 86, comments: 11, shares: 1, saved: false, liked: false
  },
  {
    id: 3, user: 'Sakshi', handle: '@sakshi_books', avatar: 'SK',
    book: "Man's Search for Meaning", time: '2d ago',
    content: "Halfway through this powerful book and I'm so moved. 🌟 Viktor Frankl's insights on finding purpose in suffering are...",
    likes: 94, comments: 7, shares: 2, saved: false, liked: false
  }
];

const POPULAR_CREWS = [
  { id: 1, name: 'Atomic Habits', author: 'James Clear', genre: 'Self Improvement', members: 1200, chats: 5, cover: '#C8956C' },
  { id: 2, name: 'Fantasy Readers Guild', author: 'Various', genre: 'Fantasy', members: 920, chats: 8, cover: '#8B7355' },
  { id: 3, name: 'Tuesdays with Morrie', author: 'Mitch Albom', genre: 'Inspiration', members: 430, chats: 3, cover: '#A0826D' },
];

const SUGGESTED_BOOKS = [
  { title: 'Deep Work', author: 'Cal Newport', color: '#2D2D2D' },
  { title: 'Becoming', author: 'Michelle Obama', color: '#C4A882' },
  { title: 'Sapiens', author: 'Yuval Harari', color: '#7B9EA6' },
  { title: 'Atomic Habits', author: 'James Clear', color: '#E8A87C' },
];

const MOODS = [
  { label: 'Inspired', emoji: '📕' },
  { label: 'Emotional', emoji: '💧' },
  { label: 'Thoughtful', emoji: '🌿' },
  { label: 'Motivated', emoji: '🔥' },
  { label: 'Escapism', emoji: '🔮' },
  { label: 'Reflective', emoji: '✏️' },
];

// Book recommendations database
const BOOK_RECOMMENDATIONS = [
  {
    id: 1,
    category: 'Fantasy',
    emoji: '📚',
    description: 'Imaginative worlds, magic, mythical creatures',
    books: [
      { title: 'The Hobbit', author: 'J.R.R. Tolkien', rating: 4.7 },
      { title: 'Harry Potter Series', author: 'J.K. Rowling', rating: 4.8 },
      { title: 'The Name of the Wind', author: 'Patrick Rothfuss', rating: 4.5 },
      { title: 'A Song of Ice and Fire', author: 'George R.R. Martin', rating: 4.6 }
    ]
  },
  {
    id: 2,
    category: 'Science Fiction',
    emoji: '🚀',
    description: 'Future tech, space exploration, aliens',
    books: [
      { title: 'Dune', author: 'Frank Herbert', rating: 4.5 },
      { title: '1984', author: 'George Orwell', rating: 4.4 },
      { title: 'The Martian', author: 'Andy Weir', rating: 4.7 },
      { title: 'Foundation', author: 'Isaac Asimov', rating: 4.3 }
    ]
  },
  {
    id: 3,
    category: 'Mystery/Thriller',
    emoji: '🔍',
    description: 'Suspense, crime solving, plot twists',
    books: [
      { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', rating: 4.2 },
      { title: 'Gone Girl', author: 'Gillian Flynn', rating: 4.1 },
      { title: 'The Silent Patient', author: 'Alex Michaelides', rating: 4.5 },
      { title: 'The Da Vinci Code', author: 'Dan Brown', rating: 4.0 }
    ]
  },
  {
    id: 4,
    category: 'Romance',
    emoji: '❤️',
    description: 'Love stories, relationships, emotional journeys',
    books: [
      { title: 'Pride and Prejudice', author: 'Jane Austen', rating: 4.8 },
      { title: 'The Notebook', author: 'Nicholas Sparks', rating: 4.3 },
      { title: 'Normal People', author: 'Sally Rooney', rating: 4.0 },
      { title: 'Red, White & Royal Blue', author: 'Casey McQuiston', rating: 4.6 }
    ]
  },
  {
    id: 5,
    category: 'Biography/Autobiography',
    emoji: '📖',
    description: 'Real-life stories, memoirs, historical figures',
    books: [
      { title: 'The Diary of a Young Girl', author: 'Anne Frank', rating: 4.8 },
      { title: 'Becoming', author: 'Michelle Obama', rating: 4.8 },
      { title: 'Educated', author: 'Tara Westover', rating: 4.7 },
      { title: 'Steve Jobs', author: 'Walter Isaacson', rating: 4.6 }
    ]
  },
  {
    id: 6,
    category: 'Self-Help/Motivational',
    emoji: '💪',
    description: 'Personal growth, productivity, mindset',
    books: [
      { title: 'Atomic Habits', author: 'James Clear', rating: 4.8 },
      { title: 'The 7 Habits of Highly Effective People', author: 'Stephen R. Covey', rating: 4.7 },
      { title: 'The Power of Now', author: 'Eckhart Tolle', rating: 4.3 },
      { title: 'Think and Grow Rich', author: 'Napoleon Hill', rating: 4.2 }
    ]
  },
  {
    id: 7,
    category: 'Historical Fiction',
    emoji: '🏛️',
    description: 'Historical events, period settings',
    books: [
      { title: 'The Book Thief', author: 'Markus Zusak', rating: 4.7 },
      { title: 'All the Light We Cannot See', author: 'Anthony Doerr', rating: 4.6 },
      { title: 'The Nightingale', author: 'Kristen Hannah', rating: 4.8 },
      { title: 'Wolf Hall', author: 'Hilary Mantel', rating: 4.5 }
    ]
  },
  {
    id: 8,
    category: 'Horror',
    emoji: '👻',
    description: 'Fear, supernatural, psychological terror',
    books: [
      { title: 'It', author: 'Stephen King', rating: 4.6 },
      { title: 'Dracula', author: 'Bram Stoker', rating: 4.2 },
      { title: 'The Shining', author: 'Stephen King', rating: 4.7 },
      { title: 'Frankenstein', author: 'Mary Shelley', rating: 4.1 }
    ]
  },
  {
    id: 9,
    category: 'Literary Fiction',
    emoji: '✍️',
    description: 'Character-driven, artistic prose, social commentary',
    books: [
      { title: 'To Kill a Mockingbird', author: 'Harper Lee', rating: 4.8 },
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', rating: 4.3 },
      { title: 'Beloved', author: 'Toni Morrison', rating: 4.4 },
      { title: 'The Catcher in the Rye', author: 'J.D. Salinger', rating: 4.1 }
    ]
  },
  {
    id: 10,
    category: 'Young Adult',
    emoji: '🌟',
    description: 'Teen protagonists, coming-of-age',
    books: [
      { title: 'The Fault in Our Stars', author: 'John Green', rating: 4.7 },
      { title: 'The Hunger Games', author: 'Suzanne Collins', rating: 4.7 },
      { title: 'Divergent', author: 'Veronica Roth', rating: 4.2 },
      { title: 'Twilight', author: 'Stephenie Meyer', rating: 3.8 }
    ]
  },
  {
    id: 11,
    category: 'Adventure',
    emoji: '🗺️',
    description: 'Exploration, survival, action',
    books: [
      { title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', rating: 4.9 },
      { title: 'Treasure Island', author: 'Robert Louis Stevenson', rating: 4.0 },
      { title: 'Life of Pi', author: 'Yann Martel', rating: 4.2 },
      { title: 'The Alchemist', author: 'Paulo Coelho', rating: 4.3 }
    ]
  },
  {
    id: 12,
    category: 'Philosophy',
    emoji: '🤔',
    description: 'Existential questions, ethics, consciousness',
    books: [
      { title: 'Meditations', author: 'Marcus Aurelius', rating: 4.5 },
      { title: 'Thus Spoke Zarathustra', author: 'Friedrich Nietzsche', rating: 4.0 },
      { title: 'The Republic', author: 'Plato', rating: 4.2 },
      { title: 'Sophie\'s World', author: 'Jostein Gaarder', rating: 4.3 }
    ]
  }
];

// Validation functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);
const validateName = (name) => name && name.trim().length >= 2;

// ─── AVATAR COMPONENT ──────────────────────────────────────────────────────
const Avatar = ({ initials, size = 'md', color = '#C8956C', src }) => {
  const sizes = { xs: 'w-7 h-7 text-xs', sm: 'w-9 h-9 text-sm', md: 'w-11 h-11 text-base', lg: 'w-16 h-16 text-xl', xl: 'w-20 h-20 text-2xl' };
  if (src) return <img src={src} alt={initials} className={`${sizes[size]} rounded-full object-cover`} />;
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
      style={{ backgroundColor: color }}>
      {initials?.slice(0, 2)}
    </div>
  );
};

// ─── STAR RATING ───────────────────────────────────────────────────────────
const StarRating = ({ rating = 0, onChange, size = 'sm' }) => {
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${sz} ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} ${onChange ? 'cursor-pointer' : ''}`}
          onClick={() => onChange?.(i)} />
      ))}
    </div>
  );
};

// ─── BOTTOM NAV ────────────────────────────────────────────────────────────
const BottomNav = ({ active, setPage }) => {
  const items = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'explore', icon: Search, label: 'Explore' },
    { id: 'post', icon: Edit3, label: 'Post' },
    { id: 'crews', icon: Users, label: 'Crews' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EDE8E3] z-50 max-w-md mx-auto">
      <div className="flex items-center justify-around py-2 px-2">
        {items.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setPage(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${active === id ? 'text-[#C8622A]' : 'text-[#9B8E84]'}`}>
            {id === 'post' ? (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center -mt-5 shadow-lg ${active === id ? 'bg-[#C8622A]' : 'bg-[#2D2419]'}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            ) : (
              <Icon className="w-5 h-5" strokeWidth={active === id ? 2.5 : 1.8} />
            )}
            <span className={`text-[10px] font-medium ${id === 'post' ? 'mt-1' : ''}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// ─── TOP BAR ───────────────────────────────────────────────────────────────
const TopBar = ({ user, setPage }) => (
  <header className="sticky top-0 bg-[#FAF6F1] z-40 px-4 py-3 flex items-center justify-between border-b border-[#EDE8E3]">
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 bg-[#C8622A] rounded-lg flex items-center justify-center">
        <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
      <span className="font-bold text-[#2D2419] text-lg" style={{ fontFamily: 'Georgia, serif' }}>ReadCrew</span>
    </div>
    <div className="flex items-center gap-3">
      <button className="relative p-1">
        <Bell className="w-5 h-5 text-[#6B5D52]" />
        <span className="absolute top-0 right-0 w-2 h-2 bg-[#C8622A] rounded-full"></span>
      </button>
      <button onClick={() => setPage('profile')}>
        <Avatar initials={user?.name?.slice(0, 2) || 'RC'} size="sm" color="#C8622A" />
      </button>
    </div>
  </header>
);

// ─── LOGIN PAGE ─────────────────────────────────────────────────────────────
const LoginPage = ({ onLogin, onSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!validateName(name) || !validateEmail(email) || !validatePhone(phone)) {
      alert('Please fill all fields correctly');
      return;
    }
    
    setLoading(true);
    try {
      const result = await otpAPI.sendOTP({ name, email, phone });
      
      if (result.success) {
        setShowOTP(true);
        alert('OTP sent to your email! Check your inbox.');
        if (result.otp) {
          console.log(`🔐 DEVELOPMENT OTP: ${result.otp}`);
        }
      } else {
        alert(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      // Fallback to mock OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('devOTP', otp);
      setShowOTP(true);
      alert(`Development mode OTP: ${otp}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpInput.length !== 6) {
      alert('Enter 6-digit OTP');
      return;
    }
    
    setLoading(true);
    try {
      const result = await otpAPI.verifyOTP({ email, otp: otpInput });
      
      if (result.success) {
        const userData = {
          id: Date.now().toString(),
          name: name,
          email: email,
          phone: phone,
          isVerified: true,
          createdAt: new Date().toISOString(),
          readingGoal: { monthly: 0, books: [] }
        };
        
        onSignup(userData);
        setShowOTP(false);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      // Fallback to mock verification
      const devOTP = localStorage.getItem('devOTP');
      if (devOTP && otpInput === devOTP) {
        const userData = {
          id: Date.now().toString(),
          name: name,
          email: email,
          phone: phone,
          isVerified: true,
          createdAt: new Date().toISOString(),
          readingGoal: { monthly: 0, books: [] }
        };
        onSignup(userData);
        setShowOTP(false);
        localStorage.removeItem('devOTP');
      } else {
        alert('❌ Invalid OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  if (showOTP) {
    return (
      <div className="min-h-screen bg-[#FAF6F1] flex flex-col items-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-7 border border-[#EDE8E3] mt-20">
          <h2 className="text-2xl font-bold text-[#2D2419] text-center mb-2">Verify OTP</h2>
          <p className="text-center text-[#9B8E84] text-sm mb-6">Enter the code sent to {email}</p>
          <input
            type="text"
            value={otpInput}
            onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-4 py-4 rounded-xl border-2 border-[#EDE8E3] focus:border-[#C8622A] focus:outline-none text-center text-3xl tracking-widest mb-6"
            placeholder="000000"
            maxLength="6"
            autoFocus
          />
          <button
            onClick={handleVerifyOTP}
            disabled={loading || otpInput.length !== 6}
            className="w-full py-4 bg-[#C8622A] text-white rounded-2xl font-semibold disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
          <button
            onClick={() => setShowOTP(false)}
            className="w-full mt-4 text-[#9B8E84] hover:text-[#C8622A] flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F1] flex flex-col items-center" style={{ fontFamily: "'Georgia', serif" }}>
      {/* Illustration area */}
      <div className="w-full max-w-md relative overflow-hidden" style={{ height: '280px' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5EDE3] to-[#FAF6F1]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 320 220" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Background arch */}
            <ellipse cx="160" cy="240" rx="170" ry="120" fill="#EDE0D0" opacity="0.5" />
            {/* Books stack left */}
            <rect x="20" y="160" width="35" height="8" rx="2" fill="#C8622A" />
            <rect x="22" y="152" width="32" height="8" rx="2" fill="#8B5E3C" />
            <rect x="18" y="144" width="38" height="8" rx="2" fill="#6B9A8B" />
            <rect x="21" y="136" width="33" height="8" rx="2" fill="#C4A882" />
            {/* Plant left */}
            <ellipse cx="15" cy="148" rx="8" ry="6" fill="#7A9E7E" opacity="0.7" />
            <ellipse cx="8" cy="140" rx="6" ry="5" fill="#5E8B62" opacity="0.6" />
            {/* Person 1 - reading */}
            <circle cx="95" cy="100" r="18" fill="#D4A574" />
            <path d="M77 130 Q95 118 113 130 L113 170 Q95 162 77 170 Z" fill="#E8624A" />
            {/* Book in hands */}
            <rect x="80" y="140" width="30" height="22" rx="2" fill="#F5E6D0" />
            <line x1="95" y1="140" x2="95" y2="162" stroke="#C4A882" strokeWidth="1" />
            {/* Person 2 */}
            <circle cx="155" cy="95" r="18" fill="#C8956C" />
            <path d="M137 125 Q155 113 173 125 L173 168 Q155 160 137 168 Z" fill="#D4834A" />
            <rect x="140" y="135" width="30" height="22" rx="2" fill="#E8A87C" />
            <line x1="155" y1="135" x2="155" y2="157" stroke="#C4A882" strokeWidth="1" />
            {/* Person 3 */}
            <circle cx="215" cy="98" r="17" fill="#A87856" />
            <path d="M198 128 Q215 116 232 128 L232 168 Q215 160 198 168 Z" fill="#6B8B6E" />
            <rect x="200" y="138" width="30" height="22" rx="2" fill="#F0F0F0" />
            <line x1="215" y1="138" x2="215" y2="160" stroke="#C4A882" strokeWidth="1" />
            {/* Person 4 */}
            <circle cx="272" cy="100" r="17" fill="#8B6252" />
            {/* Curly hair */}
            <path d="M255 85 Q265 72 275 78 Q285 72 290 82 Q295 90 288 95 Q285 80 272 83 Q258 80 255 85Z" fill="#2D1810" />
            <path d="M255 128 Q272 116 289 128 L289 168 Q272 160 255 168 Z" fill="#C4A882" />
            <rect x="258" y="138" width="30" height="22" rx="2" fill="#F0F0F0" />
            <line x1="273" y1="138" x2="273" y2="160" stroke="#C4A882" strokeWidth="1" />
            {/* Plant right */}
            <ellipse cx="305" cy="148" rx="8" ry="6" fill="#7A9E7E" opacity="0.7" />
            <rect x="300" y="148" width="10" height="18" rx="2" fill="#C4A882" />
            {/* Sofa suggestion */}
            <rect x="60" y="165" width="220" height="20" rx="8" fill="#D4C4B0" opacity="0.6" />
          </svg>
        </div>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-2 -mt-4 mb-1">
        <div className="w-9 h-9 bg-[#C8622A] rounded-xl flex items-center justify-center shadow-md">
          <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-3xl font-bold text-[#2D2419]" style={{ fontFamily: 'Georgia, serif' }}>ReadCrew</span>
      </div>
      <p className="text-[#9B8E84] text-sm mb-6">Read together, grow together.</p>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl mx-4 p-7 border border-[#EDE8E3]">
        <h2 className="text-2xl font-bold text-[#2D2419] text-center mb-6" style={{ fontFamily: 'Georgia, serif' }}>
          {isLogin ? 'Log In' : 'Sign Up'}
        </h2>

        <div className="space-y-4">
          {!isLogin && (
            <div className="flex items-center gap-3 bg-[#FAF6F1] border border-[#EDE8E3] rounded-xl px-4 py-3.5">
              <User className="w-5 h-5 text-[#9B8E84]" />
              <input value={name} onChange={e => setName(e.target.value)}
                className="flex-1 bg-transparent text-[#2D2419] placeholder-[#B8AEA8] outline-none text-sm"
                placeholder="Full Name" />
            </div>
          )}
          <div className="flex items-center gap-3 bg-[#FAF6F1] border border-[#EDE8E3] rounded-xl px-4 py-3.5">
            <User className="w-5 h-5 text-[#9B8E84]" />
            <input value={email} onChange={e => setEmail(e.target.value)}
              className="flex-1 bg-transparent text-[#2D2419] placeholder-[#B8AEA8] outline-none text-sm"
              placeholder="Email" />
          </div>
          {!isLogin && (
            <div className="flex items-center gap-3 bg-[#FAF6F1] border border-[#EDE8E3] rounded-xl px-4 py-3.5">
              <User className="w-5 h-5 text-[#9B8E84]" />
              <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="flex-1 bg-transparent text-[#2D2419] placeholder-[#B8AEA8] outline-none text-sm"
                placeholder="Phone Number" maxLength="10" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3 bg-[#FAF6F1] border border-[#EDE8E3] rounded-xl px-4 py-3.5">
              <Lock className="w-5 h-5 text-[#9B8E84]" />
              <input value={password} onChange={e => setPassword(e.target.value)}
                type={showPass ? 'text' : 'password'}
                className="flex-1 bg-transparent text-[#2D2419] placeholder-[#B8AEA8] outline-none text-sm"
                placeholder="••••••••" />
              <button onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff className="w-4 h-4 text-[#9B8E84]" /> : <Eye className="w-4 h-4 text-[#9B8E84]" />}
              </button>
            </div>
            {isLogin && (
              <div className="text-right mt-1.5">
                <button className="text-xs text-[#9B8E84] hover:text-[#C8622A]">Forgot password?</button>
              </div>
            )}
          </div>
        </div>

        <button onClick={() => {
          if (isLogin) {
            onLogin({ name: name || email.split('@')[0] || 'Reader', email: email || 'user@readcrew.com' });
          } else {
            handleSendOTP();
          }
        }}
          className="w-full mt-5 py-4 bg-[#C8622A] text-white rounded-2xl font-semibold text-base hover:bg-[#B05520] transition shadow-md">
          {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Sign Up')}
        </button>

        <div className="mt-4 space-y-3">
          <button className="w-full py-3.5 border border-[#EDE8E3] rounded-2xl flex items-center justify-center gap-3 text-sm font-medium text-[#2D2419] hover:bg-[#FAF6F1] transition">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            Continue with <strong>Google</strong>
          </button>
          <button className="w-full py-3.5 border border-[#EDE8E3] rounded-2xl flex items-center justify-center gap-3 text-sm font-medium text-[#2D2419] hover:bg-[#FAF6F1] transition">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            Continue with <strong>Facebook</strong>
          </button>
        </div>

        <p className="text-center text-sm text-[#9B8E84] mt-5">
          {isLogin ? "New to ReadCrew? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-[#C8622A] font-semibold hover:underline">
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
      <div className="h-8" />
    </div>
  );
};

// ─── HOME PAGE ──────────────────────────────────────────────────────────────
const HomePage = ({ user, posts, crews, suggestedBooks, setPage, donations, reviews }) => (
  <div className="pb-24">
    <TopBar user={user} setPage={setPage} />
    <div className="px-4 py-4 space-y-5">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D2419]" style={{ fontFamily: 'Georgia, serif' }}>
          Welcome, {user?.name?.split(' ')[0]}! 🌿
        </h1>
        <p className="text-[#9B8E84] text-sm mt-0.5">Read together, grow together.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Stories', value: donations?.length || 0, icon: Gift, color: 'text-blue-600' },
          { label: 'Reviews', value: reviews?.length || 0, icon: Star, color: 'text-purple-600' },
          { label: 'Crews', value: crews?.length || 3, icon: Users, color: 'text-orange-600' }
        ].map(({ label, value, icon: Icon, color }, idx) => (
          <div key={idx} className="bg-white rounded-xl p-3 shadow-sm border border-[#EDE8E3]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9B8E84]">{label}</p>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </div>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Search + Create Crew */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white border border-[#EDE8E3] rounded-xl px-3 py-2.5 shadow-sm">
          <Search className="w-4 h-4 text-[#9B8E84]" />
          <input className="flex-1 bg-transparent text-sm text-[#2D2419] placeholder-[#B8AEA8] outline-none"
            placeholder="Search for books or crews..." />
          <ChevronRight className="w-4 h-4 text-[#9B8E84]" />
        </div>
        <button onClick={() => setPage('crews')}
          className="px-4 py-2.5 bg-[#C8622A] text-white rounded-xl text-sm font-semibold shadow-sm whitespace-nowrap">
          Create Crew
        </button>
      </div>

      {/* Reading illustration */}
      <div className="bg-[#F5EDE3] rounded-2xl overflow-hidden" style={{ height: '140px' }}>
        <svg viewBox="0 0 340 140" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <rect width="340" height="140" fill="#F5EDE3" />
          {/* Books stack */}
          <rect x="15" y="90" width="40" height="7" rx="2" fill="#C8622A" opacity="0.8" />
          <rect x="18" y="83" width="36" height="7" rx="2" fill="#8B5E3C" opacity="0.8" />
          <rect x="12" y="76" width="44" height="7" rx="2" fill="#6B9A8B" opacity="0.8" />
          {/* Person 1 */}
          <circle cx="120" cy="62" r="15" fill="#D4A574" />
          <path d="M105 85 Q120 76 135 85 L135 120 Q120 114 105 120 Z" fill="#E8A060" />
          <rect x="108" y="92" width="24" height="18" rx="2" fill="#F5E6D0" />
          <line x1="120" y1="92" x2="120" y2="110" stroke="#C4A882" strokeWidth="1" />
          {/* Person 2 */}
          <circle cx="185" cy="58" r="15" fill="#A87856" />
          <path d="M170 81 Q185 72 200 81 L200 118 Q185 112 170 118 Z" fill="#D4834A" />
          <rect x="172" y="88" width="26" height="18" rx="2" fill="#E8A87C" />
          <line x1="185" y1="88" x2="185" y2="106" stroke="#C4A882" strokeWidth="1" />
          {/* Person 3 */}
          <circle cx="250" cy="60" r="14" fill="#8B6252" />
          <path d="M236 83 Q250 74 264 83 L264 118 Q250 112 236 118 Z" fill="#6B8B6E" />
          <rect x="238" y="90" width="24" height="17" rx="2" fill="#F0F0E8" />
          <line x1="250" y1="90" x2="250" y2="107" stroke="#C4A882" strokeWidth="1" />
          {/* Plants */}
          <ellipse cx="305" cy="85" rx="12" ry="9" fill="#7A9E7E" opacity="0.7" />
          <ellipse cx="318" cy="78" rx="9" ry="7" fill="#5E8B62" opacity="0.6" />
          <rect x="310" y="92" width="8" height="25" rx="3" fill="#C4A882" />
          {/* Floor */}
          <rect x="0" y="118" width="340" height="22" rx="0" fill="#EDE0D0" opacity="0.5" />
        </svg>
      </div>

      {/* Popular Crews */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🔥</span>
          <h2 className="text-lg font-bold text-[#2D2419]" style={{ fontFamily: 'Georgia, serif' }}>Popular Crews</h2>
          <span className="text-xl">🔥</span>
        </div>
        <p className="text-xs text-[#9B8E84] mb-3">Join the hottest book clubs and reading groups.</p>
        <div className="grid grid-cols-2 gap-3">
          {crews.slice(0, 2).map(crew => (
            <div key={crew.id} className="bg-white rounded-2xl overflow-hidden border border-[#EDE8E3] shadow-sm">
              <div className="h-20 flex items-center justify-center" style={{ backgroundColor: crew.cover + '40' }}>
                <div className="w-12 h-16 rounded-lg shadow-md flex items-center justify-center"
                  style={{ backgroundColor: crew.cover }}>
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-[#2D2419] text-sm leading-tight">{crew.name}</h3>
                <p className="text-xs text-[#9B8E84] mt-0.5">{crew.genre}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 text-xs text-[#9B8E84]">
                    <Users className="w-3 h-3" />
                    <span>{crew.members >= 1000 ? `${(crew.members / 1000).toFixed(1)}K` : crew.members}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#9B8E84]">
                    <MessageCircle className="w-3 h-3" />
                    <span>{crew.chats}</span>
                  </div>
                </div>
                <button onClick={() => setPage('crews')}
                  className="w-full mt-2 py-1.5 bg-[#C8622A] text-white rounded-xl text-xs font-semibold">
                  Join Crew
                </button>
              </div>
            </div>
          ))}
          {/* Reading challenge card */}
          <div className="col-span-2 bg-white rounded-2xl p-4 border border-[#EDE8E3] shadow-sm">
            <h3 className="font-bold text-[#2D2419] text-sm mb-1">Your Reading Challenge</h3>
            <p className="text-xs text-[#9B8E84]">You've read 5 out of 20 books for 2024</p>
            <div className="mt-2 h-2 bg-[#F5EDE3] rounded-full overflow-hidden">
              <div className="h-full w-1/4 bg-[#C8622A] rounded-full" />
            </div>
            <p className="text-xs text-[#7A9E7E] mt-1 font-medium">You're ahead of schedule!</p>
            <div className="flex gap-2 mt-3">
              {suggestedBooks.slice(0, 4).map((b, i) => (
                <div key={i} className="w-10 h-14 rounded-lg shadow-sm flex items-end justify-center pb-1"
                  style={{ backgroundColor: b.color }}>
                  <span className="text-white text-[7px] text-center leading-tight px-0.5 font-medium">{b.title.slice(0, 6)}</span>
                </div>
              ))}
            </div>
            <button className="mt-2 text-xs text-[#C8622A] font-semibold">View All Books →</button>
          </div>
        </div>
      </div>

      {/* Upcoming Event */}
      <div className="bg-white rounded-2xl p-4 border border-[#EDE8E3] shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span>🔔</span>
          <h2 className="font-bold text-[#2D2419] text-sm">Upcoming Live Event</h2>
        </div>
        <div className="flex gap-3">
          <div className="w-12 h-16 rounded-lg bg-[#2D2D2D] flex items-center justify-center shadow-sm shrink-0">
            <BookOpen className="w-6 h-6 text-[#E8A87C]" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#2D2419] text-sm">Atomic Habits Discussion</h3>
            <p className="text-xs text-[#9B8E84] mt-0.5">Mon, Apr 29 at 7:00 PM</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Avatar initials="SK" size="xs" color="#C8622A" />
              <span className="text-xs text-[#9B8E84]">Sakshi + 920 interested</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between bg-[#FAF6F1] rounded-xl px-3 py-2">
          <span className="text-xs font-medium text-[#2D2419]">In 3 days</span>
          <ChevronRight className="w-4 h-4 text-[#9B8E84]" />
        </div>
      </div>

      {/* Suggested for you */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span>💡</span>
            <h2 className="font-bold text-[#2D2419]" style={{ fontFamily: 'Georgia, serif' }}>Suggested For You</h2>
            <span>🔥</span>
          </div>
          <button className="text-xs text-[#9B8E84] border border-[#EDE8E3] rounded-lg px-2 py-1">Browse All</button>
        </div>
        <p className="text-xs text-[#9B8E84] mb-3">Books you might enjoy, handpicked for you.</p>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {suggestedBooks.map((b, i) => (
            <div key={i} className="shrink-0 w-24">
              <div className="w-24 h-32 rounded-xl shadow-md flex items-end justify-center pb-2"
                style={{ backgroundColor: b.color }}>
                <span className="text-white text-[9px] text-center px-1 font-medium leading-tight">{b.title}</span>
              </div>
              <p className="text-xs font-semibold text-[#2D2419] mt-1.5 leading-tight">{b.title}</p>
              <p className="text-[10px] text-[#9B8E84]">{b.author}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── EXPLORE (MOOD BASED) ───────────────────────────────────────────────────
const ExplorePage = ({ user, setPage }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [suggestion, setSuggestion] = useState(null);

  const moodBooks = {
    Reflective: { title: 'Tuesdays with Morrie', author: 'Mitch Albom', color: '#A0826D', desc: 'A touching story about life\'s most important lessons from a dying professor', reviews: '22k', rating: 4.5 },
    Motivated: { title: 'Atomic Habits', author: 'James Clear', color: '#E8A87C', desc: 'Tiny changes, remarkable results. Build habits that stick.', reviews: '18k', rating: 4.8 },
    Thoughtful: { title: 'Sapiens', author: 'Yuval Harari', color: '#7B9EA6', desc: 'A brief history of humankind that will reshape how you see the world.', reviews: '15k', rating: 4.6 },
    Inspired: { title: 'Becoming', author: 'Michelle Obama', color: '#C4A882', desc: 'An intimate and powerful memoir by the former First Lady.', reviews: '20k', rating: 4.7 },
    Emotional: { title: "The Kite Runner", author: 'Khaled Hosseini', color: '#C8622A', desc: 'A heart-wrenching story of friendship, betrayal and redemption.', reviews: '12k', rating: 4.5 },
    Escapism: { title: 'The Name of the Wind', author: 'Patrick Rothfuss', color: '#6B8B6E', desc: 'An epic fantasy about a legendary magician and his extraordinary life.', reviews: '9k', rating: 4.7 },
  };

  const handleMood = (mood) => {
    setSelectedMood(mood);
    setSuggestion(moodBooks[mood] || moodBooks['Reflective']);
  };

  if (suggestion) {
    return (
      <div className="pb-24 bg-[#FAF6F1] min-h-screen">
        <TopBar user={user} setPage={setPage} />
        <div className="px-4 py-6">
          {/* Reading bot */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#F5EDE3] border-2 border-[#C8622A] flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#C8622A]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[#2D2419]">Reading Bot</span>
                <div className="w-2 h-2 bg-green-400 rounded-full" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#EDE8E3]">
            <p className="text-[#6B5D52] text-sm mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Since you're feeling <strong>{selectedMood}</strong>, here's something beautiful for you...
            </p>

            <div className="flex gap-4 p-4 bg-[#FAF6F1] rounded-xl mb-4">
              <div className="w-20 h-28 rounded-xl shadow-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: suggestion.color }}>
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="text-xs px-2 py-0.5 bg-[#C8622A]/10 text-[#C8622A] rounded-full font-medium">★ Inspiration</span>
                <h3 className="font-bold text-[#2D2419] text-lg mt-1" style={{ fontFamily: 'Georgia, serif' }}>{suggestion.title}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <Heart className="w-3 h-3 text-[#C8622A]" />
                  <span className="text-xs text-[#9B8E84]">{suggestion.reviews} Reviews</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-[#6B5D52] mb-5">{suggestion.desc}</p>

            <button className="w-full py-2.5 border border-[#EDE8E3] rounded-xl text-sm font-medium text-[#2D2419] mb-3 hover:bg-[#FAF6F1]">
              ✦ View Reviews
            </button>
            <button onClick={() => setPage('crews')}
              className="w-full py-3 bg-[#C8622A] text-white rounded-xl font-semibold text-sm mb-3">
              Join Crew
            </button>
            <button onClick={() => setPage('crews')}
              className="w-full py-2.5 border border-[#EDE8E3] rounded-xl text-sm font-medium text-[#2D2419] hover:bg-[#FAF6F1]">
              Start New Crew
            </button>
          </div>

          <button onClick={() => setSuggestion(null)} className="mt-4 flex items-center gap-1 text-sm text-[#9B8E84]">
            <ChevronLeft className="w-4 h-4" /> Choose different mood
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-[#FAF6F1] min-h-screen">
      <TopBar user={user} setPage={setPage} />
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-[#2D2419] mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          Hi {user?.name?.split(' ')[0]} 🌿
        </h1>
        <p className="text-[#9B8E84] text-sm mb-6">What feels right today?</p>

        <div className="space-y-3 mb-8">
          {MOODS.map(({ label, emoji }) => (
            <button key={label} onClick={() => handleMood(label)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${selectedMood === label ? 'bg-[#C8622A]/10 border-[#C8622A]' : 'bg-white border-[#EDE8E3] hover:border-[#C8622A]/40'}`}>
              <span className="text-2xl">{emoji}</span>
              <span className="font-medium text-[#2D2419]">{label}</span>
            </button>
          ))}
        </div>

        <button onClick={() => handleMood('Reflective')}
          className="w-full py-4 bg-[#C8622A] text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-md">
          <Sparkles className="w-5 h-5" />
          Let AI Suggest ▾
        </button>
      </div>
    </div>
  );
};

// ─── POST PAGE ──────────────────────────────────────────────────────────────
const PostPage = ({ user, onPost, setPage }) => {
  const [content, setContent] = useState('');
  const [bookName, setBookName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [image, setImage] = useState(null);
  const fileRef = useRef();

  return (
    <div className="pb-24 bg-[#FAF6F1] min-h-screen">
      <div className="sticky top-0 bg-[#FAF6F1] z-40 px-4 py-3 flex items-center justify-between border-b border-[#EDE8E3]">
        <button onClick={() => setPage('home')}><ChevronLeft className="w-6 h-6 text-[#6B5D52]" /></button>
        <span className="font-semibold text-[#2D2419]">Post</span>
        <button className="p-1.5 border border-[#EDE8E3] rounded-xl bg-white">
          <Bookmark className="w-5 h-5 text-[#6B5D52]" />
        </button>
      </div>

      <div className="px-4 py-4">
        <div className="flex gap-3">
          <Avatar initials={user?.name?.slice(0, 2)} size="md" color="#C8622A" />
          <div className="flex-1">
            {/* Book selector */}
            <div className="flex items-center gap-2 bg-white border border-[#EDE8E3] rounded-xl px-3 py-2 mb-3">
              <div className="w-5 h-5 bg-[#C8622A]/20 rounded flex items-center justify-center">
                <BookOpen className="w-3 h-3 text-[#C8622A]" />
              </div>
              <input value={bookName} onChange={e => setBookName(e.target.value)}
                className="flex-1 text-sm text-[#2D2419] placeholder-[#B8AEA8] outline-none bg-transparent"
                placeholder="Man's Search for..." />
            </div>

            <textarea value={content} onChange={e => setContent(e.target.value)}
              className="w-full bg-transparent text-[#2D2419] placeholder-[#B8AEA8] outline-none text-sm resize-none leading-relaxed"
              placeholder="Write about your reading experience..." rows={5} />
          </div>
        </div>

        {/* Book card preview */}
        {bookName && (
          <div className="mt-4 bg-white rounded-2xl p-4 border border-[#EDE8E3] flex gap-3 items-start">
            <div className="w-12 h-16 rounded-lg bg-[#C8622A]/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-[#C8622A]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#2D2419] text-sm">{bookName}</p>
              <p className="text-xs text-[#9B8E84]">by Author</p>
            </div>
            <button onClick={() => setBookName('')}><X className="w-4 h-4 text-[#9B8E84]" /></button>
          </div>
        )}

        {/* Image preview */}
        {image && (
          <div className="mt-3 relative">
            <img src={image} alt="upload" className="w-full h-40 object-cover rounded-xl" />
            <button onClick={() => setImage(null)}
              className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* Visibility toggle */}
        <div className="mt-4 flex gap-3">
          {['Public', 'Private'].map(v => (
            <button key={v} onClick={() => setIsPublic(v === 'Public')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition ${isPublic === (v === 'Public') ? 'bg-[#C8622A]/10 border-[#C8622A] text-[#C8622A]' : 'border-[#EDE8E3] text-[#9B8E84]'}`}>
              {v === 'Private' && <Lock className="w-3 h-3" />}
              {v}
            </button>
          ))}
        </div>

        {/* Attach photo */}
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setImage(ev.target.result); r.readAsDataURL(f); } }} />
        <button onClick={() => fileRef.current?.click()}
          className="mt-4 flex items-center gap-2 text-sm text-[#6B5D52] border border-[#EDE8E3] bg-white rounded-xl px-4 py-2.5 w-full justify-center">
          <Camera className="w-4 h-4" /> Attach Photo
        </button>
      </div>

      {/* Post button */}
      <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-4">
        <button
          onClick={() => { if (content.trim()) { onPost({ content, bookName, image, isPublic }); setPage('home'); } }}
          disabled={!content.trim()}
          className="w-full py-4 bg-[#C8622A] text-white rounded-2xl font-bold text-base shadow-lg disabled:opacity-50">
          Post
        </button>
      </div>
    </div>
  );
};

// ─── CREWS PAGE ─────────────────────────────────────────────────────────────
const CrewsPage = ({ user, crews, setPage }) => {
  const [view, setView] = useState('list'); // 'list', 'chat', 'bookpage'
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [messages, setMessages] = useState([
    { id: 1, user: 'Aman', text: 'The part where Morrie says "Once you learn how to die, you learn how to live" really hit me. Such a pow...', time: '10:20 AM', initials: 'AM', color: '#7B9EA6' },
    { id: 2, user: 'Vikram', text: 'A life-changing book. Makes you appreciate the simple...', time: '10:22 AM', initials: 'VK', color: '#8B5E3C' },
    { id: 3, user: 'Deepika', text: "Mitch Albom's writing is so touching. I cried and felt inspired at the time.", time: '10:25 AM', initials: 'DP', color: '#C8956C' },
  ]);
  const [newMsg, setNewMsg] = useState('');
  const endRef = useRef();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (view === 'chat' && selectedCrew) {
    return (
      <div className="h-screen flex flex-col bg-[#FAF6F1]">
        {/* Chat header */}
        <div className="bg-white border-b border-[#EDE8E3] px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <button onClick={() => setView('bookpage')} className="text-[#6B5D52]">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 flex-1 mx-3">
            <div className="w-8 h-8 rounded-lg shadow-sm flex items-center justify-center"
              style={{ backgroundColor: selectedCrew.cover }}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-[#2D2419] text-sm">Crew Chat Room</p>
            </div>
          </div>
          <button><MoreHorizontal className="w-5 h-5 text-[#9B8E84]" /></button>
        </div>

        {/* Book banner in chat */}
        <div className="bg-white px-4 py-3 border-b border-[#EDE8E3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-14 rounded-lg shadow-sm flex items-center justify-center"
              style={{ backgroundColor: selectedCrew.cover }}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-[#2D2419] text-sm">{selectedCrew.name}</p>
              <p className="text-xs text-[#9B8E84]">{selectedCrew.members >= 1000 ? `${(selectedCrew.members / 1000).toFixed(1)}K` : selectedCrew.members} Members</p>
            </div>
            <button className="ml-auto flex items-center gap-1.5 text-xs text-[#C8622A] border border-[#C8622A]/30 rounded-xl px-3 py-1.5">
              <UserPlus className="w-3 h-3" /> Invite Friends
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map(msg => {
            const isOwn = msg.user === user?.name;
            return (
              <div key={msg.id} className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                {!isOwn && <Avatar initials={msg.initials} size="sm" color={msg.color} />}
                <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isOwn && <p className="text-xs text-[#9B8E84] mb-1 px-1">{msg.user}</p>}
                  <div className={`rounded-2xl px-3.5 py-2.5 ${isOwn ? 'bg-[#C8622A] text-white' : 'bg-white border border-[#EDE8E3] text-[#2D2419]'}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <p className="text-[10px] text-[#B8AEA8] mt-1 px-1">{msg.time}</p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-[#EDE8E3] px-4 py-3">
          <div className="flex items-center gap-2">
            <Avatar initials={user?.name?.slice(0, 2)} size="sm" color="#C8622A" />
            <div className="flex-1 flex items-center gap-2 bg-[#FAF6F1] border border-[#EDE8E3] rounded-2xl px-3 py-2.5">
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newMsg.trim()) {
                    setMessages(prev => [...prev, { id: Date.now(), user: user.name, text: newMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), initials: user.name.slice(0, 2), color: '#C8622A' }]);
                    setNewMsg('');
                  }
                }}
                className="flex-1 bg-transparent text-sm text-[#2D2419] placeholder-[#B8AEA8] outline-none"
                placeholder="Ask ReadCrew AI..." />
              <button onClick={() => {
                if (newMsg.trim()) {
                  setMessages(prev => [...prev, { id: Date.now(), user: user.name, text: newMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), initials: user.name.slice(0, 2), color: '#C8622A' }]);
                  setNewMsg('');
                }
              }}>
                <Send className="w-4 h-4 text-[#C8622A]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'bookpage' && selectedCrew) {
    const reviews = [
      { user: 'Aman', initials: 'AM', color: '#7B9EA6', text: 'Profound and heartwarming. Made me reflect on what truly matters!', time: '2h ago' },
      { user: 'Deepika', initials: 'DP', color: '#C8956C', text: "Mitch Albom's writing is so touching. I cried and felt inspired at the time.", time: '5h ago' },
      { user: 'Vikram', initials: 'VK', color: '#8B5E3C', text: 'A life-changing book. Makes you appreciate the simple.', time: '1d ago' },
    ];
    return (
      <div className="pb-24 bg-[#FAF6F1] min-h-screen">
        <div className="sticky top-0 bg-[#FAF6F1] z-40 px-4 py-3 flex items-center gap-3 border-b border-[#EDE8E3]">
          <button onClick={() => setView('list')}><ChevronLeft className="w-6 h-6 text-[#6B5D52]" /></button>
          <span className="font-semibold text-[#2D2419]">{selectedCrew.name}</span>
          <button className="ml-auto"><Bookmark className="w-5 h-5 text-[#9B8E84]" /></button>
        </div>

        <div className="px-4 py-4">
          {/* Book info */}
          <span className="text-xs px-2.5 py-1 bg-[#F5EDE3] text-[#C8622A] rounded-full font-medium">{selectedCrew.genre}</span>
          <div className="flex gap-4 mt-3">
            <div className="w-24 h-32 rounded-xl shadow-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: selectedCrew.cover }}>
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-[#2D2419] text-xl" style={{ fontFamily: 'Georgia, serif' }}>{selectedCrew.name}</h2>
              <p className="text-sm text-[#9B8E84] mt-1">{selectedCrew.author}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-[#2D2419]">3dk</span>
                <span className="text-xs text-[#9B8E84]">Bviews</span>
              </div>
              <StarRating rating={4} />
              <div className="flex items-center gap-1 mt-1">
                <Heart className="w-3 h-3 text-[#C8622A]" />
                <span className="text-xs text-[#9B8E84]">22k Reviews</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-5 border-b border-[#EDE8E3] pb-0">
            {['Reviews', 'Crew Chat', 'About', 'Similar'].map((tab, i) => (
              <button key={tab} onClick={() => tab === 'Crew Chat' && setView('chat')}
                className={`text-sm pb-2.5 font-medium border-b-2 ${i === 0 ? 'text-[#C8622A] border-[#C8622A]' : 'text-[#9B8E84] border-transparent'}`}>
                {tab}
              </button>
            ))}
          </div>

          {/* Reviews */}
          <div className="mt-4 flex items-center gap-2 mb-4">
            <span className="text-3xl font-bold text-[#2D2419]">4.5</span>
            <div>
              <StarRating rating={4} />
              <p className="text-xs text-[#9B8E84]">22k Reviews →</p>
            </div>
          </div>

          <div className="space-y-4">
            {reviews.map((r, i) => (
              <div key={i} className="flex gap-3">
                <Avatar initials={r.initials} size="sm" color={r.color} />
                <div className="flex-1 bg-white rounded-2xl p-3 border border-[#EDE8E3]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#2D2419] text-sm">{r.user}</span>
                    <button><MoreHorizontal className="w-4 h-4 text-[#B8AEA8]" /></button>
                  </div>
                  <p className="text-xs text-[#6B5D52] leading-relaxed">{r.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Message input at bottom */}
          <div className="mt-4 flex items-center gap-2 bg-white border border-[#EDE8E3] rounded-2xl px-3 py-2.5">
            <Avatar initials={user?.name?.slice(0, 2)} size="xs" color="#C8622A" />
            <input className="flex-1 bg-transparent text-sm text-[#2D2419] placeholder-[#B8AEA8] outline-none"
              placeholder="Write a message..." onClick={() => setView('chat')} readOnly />
            <Send className="w-4 h-4 text-[#9B8E84]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-[#FAF6F1] min-h-screen">
      <TopBar user={user} setPage={setPage} />
      <div className="px-4 py-4">
        <h1 className="text-2xl font-bold text-[#2D2419] mb-4" style={{ fontFamily: 'Georgia, serif' }}>Reading Crews</h1>

        <div className="flex items-center gap-2 bg-white border border-[#EDE8E3] rounded-xl px-3 py-2.5 mb-5">
          <Search className="w-4 h-4 text-[#9B8E84]" />
          <input className="flex-1 bg-transparent text-sm text-[#2D2419] placeholder-[#B8AEA8] outline-none"
            placeholder="Search crews..." />
        </div>

        <div className="space-y-4">
          {crews.map(crew => (
            <div key={crew.id} className="bg-white rounded-2xl overflow-hidden border border-[#EDE8E3] shadow-sm"
              onClick={() => { setSelectedCrew(crew); setView('bookpage'); }}>
              <div className="h-28 relative" style={{ backgroundColor: crew.cover + '30' }}>
                <div className="absolute inset-0 flex items-center px-4 gap-4">
                  <div className="w-16 h-22 rounded-xl shadow-md flex items-center justify-center"
                    style={{ backgroundColor: crew.cover, height: '88px', width: '64px' }}>
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-[#2D2419]">{crew.name}</p>
                    <p className="text-xs text-[#9B8E84]">by {crew.author}</p>
                    <span className="text-xs px-2 py-0.5 bg-white/70 text-[#C8622A] rounded-full font-medium mt-1 inline-block">{crew.genre}</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-[#9B8E84]">
                    <Users className="w-4 h-4" />
                    <span>{crew.members >= 1000 ? `${(crew.members / 1000).toFixed(1)}K` : crew.members} Members</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setSelectedCrew(crew); setView('bookpage'); }}
                    className="px-5 py-2 bg-[#C8622A] text-white rounded-xl text-sm font-semibold">
                    Join Crew
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────
const ProfilePage = ({ user, posts, setPage, onLogout }) => {
  const [activeTab, setActiveTab] = useState('Posts');
  const tabs = ['Posts', 'Reviews', 'Crews', 'Saved'];
  const myPosts = posts.filter(p => p.user === user?.name);

  return (
    <div className="pb-24 bg-[#FAF6F1] min-h-screen">
      <div className="sticky top-0 bg-[#FAF6F1] z-40 px-4 py-3 flex items-center justify-between border-b border-[#EDE8E3]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#C8622A] rounded-md flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-[#2D2419]" style={{ fontFamily: 'Georgia, serif' }}>ReadCrew</span>
        </div>
        <button onClick={onLogout} className="p-2 hover:bg-[#F5EDE3] rounded-xl transition">
          <Settings className="w-5 h-5 text-[#6B5D52]" />
        </button>
      </div>

      <div className="px-4 py-5">
        {/* Profile header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <Avatar initials={user?.name?.slice(0, 2)} size="xl" color="#C8622A" />
            <button className="absolute bottom-0 right-0 w-6 h-6 bg-[#C8622A] rounded-full flex items-center justify-center border-2 border-white">
              <Camera className="w-3 h-3 text-white" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[#2D2419]" style={{ fontFamily: 'Georgia, serif' }}>{user?.name}</h2>
            <p className="text-sm text-[#9B8E84]">@{user?.name?.toLowerCase().replace(' ', '')}</p>
            <p className="text-sm text-[#6B5D52] mt-1 italic">"Books that change how I think."</p>
            <button className="mt-2 px-5 py-1.5 border border-[#C8622A]/40 text-[#C8622A] rounded-xl text-sm font-medium flex items-center gap-1">
              Edit Profile <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-0 bg-white rounded-2xl border border-[#EDE8E3] overflow-hidden mb-5">
          {[
            { label: 'Books', val: 48 },
            { label: 'Reviews', val: 32 },
            { label: 'Posts', val: myPosts.length || 76 },
            { label: 'Crews', val: 5 },
          ].map(({ label, val }, i) => (
            <div key={label} className={`py-3 text-center ${i < 3 ? 'border-r border-[#EDE8E3]' : ''}`}>
              <p className="text-xl font-bold text-[#2D2419]">{val}</p>
              <p className="text-xs text-[#9B8E84]">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#EDE8E3] mb-4">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 text-sm pb-2.5 font-medium border-b-2 transition ${activeTab === tab ? 'text-[#C8622A] border-[#C8622A]' : 'text-[#9B8E84] border-transparent'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Posts */}
        {activeTab === 'Posts' && (
          <div className="space-y-4">
            {(myPosts.length > 0 ? myPosts : MOCK_POSTS.slice(0, 2)).map(post => (
              <div key={post.id} className="bg-white rounded-2xl p-4 border border-[#EDE8E3] shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar initials={user?.name?.slice(0, 2)} size="sm" color="#C8622A" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[#2D2419] text-sm">{user?.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <BookOpen className="w-3 h-3 text-[#C8622A]" />
                          <p className="text-xs text-[#9B8E84]">{post.book || post.bookName}</p>
                        </div>
                      </div>
                      <button><MoreHorizontal className="w-4 h-4 text-[#B8AEA8]" /></button>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-[#2D2419] leading-relaxed">{post.content}</p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#EDE8E3]">
                  <div className="flex items-center gap-1 text-xs text-[#9B8E84]">
                    <Heart className="w-4 h-4" /> {post.likes}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#9B8E84]">
                    <MessageCircle className="w-4 h-4" /> {post.comments}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#9B8E84]">
                    <Share2 className="w-4 h-4" /> {post.shares}
                  </div>
                  <div className="ml-auto">
                    <Bookmark className="w-4 h-4 text-[#9B8E84]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab !== 'Posts' && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-[#EDE8E3] mx-auto mb-3" />
            <p className="text-[#9B8E84] text-sm">No {activeTab.toLowerCase()} yet</p>
          </div>
        )}

        <button onClick={onLogout}
          className="mt-6 w-full py-3 border border-red-200 text-red-500 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-50">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
};

// ─── SHARED STORIES FEED ───────────────────────────────────────────────────
const FeedPage = ({ user, posts, setPosts, setPage }) => {
  const toggleLike = (id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };
  const toggleSave = (id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, saved: !p.saved } : p));
  };

  return (
    <div className="pb-24 bg-[#FAF6F1] min-h-screen">
      <TopBar user={user} setPage={setPage} />
      <div className="px-4 py-4">
        {/* Post input bar */}
        <div className="bg-white rounded-2xl border border-[#EDE8E3] px-4 py-3 flex items-center gap-3 mb-5 shadow-sm">
          <div className="w-8 h-8 bg-[#C8622A]/20 rounded-xl flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-[#C8622A]" />
          </div>
          <input className="flex-1 bg-transparent text-sm text-[#2D2419] placeholder-[#B8AEA8] outline-none"
            placeholder="Write a post..."
            onClick={() => setPage('post')} readOnly />
          <Avatar initials={user?.name?.slice(0, 2)} size="xs" color="#C8622A" />
        </div>

        {/* Book filter pill */}
        <div className="flex items-center gap-2 bg-white border border-[#EDE8E3] rounded-xl px-3 py-2.5 mb-5 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-[#2D2D2D] flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-[#E8A87C]" />
          </div>
          <span className="text-sm font-medium text-[#2D2419]">Man's Search For Meaning</span>
          <ChevronRight className="w-4 h-4 text-[#9B8E84] ml-auto" />
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl p-4 border border-[#EDE8E3] shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <Avatar initials={post.avatar} size="sm" color={post.id === 1 ? '#C8622A' : post.id === 2 ? '#7B9EA6' : '#8B5E3C'} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#2D2419] text-sm">{post.user}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-[#9B8E84]">{post.time}</span>
                        <span className="text-xs text-[#B8AEA8]">·</span>
                        <div className="flex items-center gap-0.5">
                          <BookOpen className="w-3 h-3 text-[#C8622A]" />
                          <span className="text-xs text-[#9B8E84]">{post.book}</span>
                        </div>
                      </div>
                    </div>
                    <button><MoreHorizontal className="w-4 h-4 text-[#B8AEA8]" /></button>
                  </div>
                </div>
              </div>
              <p className="text-sm text-[#2D2419] leading-relaxed mb-3">{post.content}</p>
              <div className="flex items-center gap-4 pt-3 border-t border-[#EDE8E3]">
                <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1.5 text-xs text-[#9B8E84]">
                  <Heart className={`w-4 h-4 ${post.liked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>{post.likes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-xs text-[#9B8E84]">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments}</span>
                </button>
                <button className="flex items-center gap-1.5 text-xs text-[#9B8E84]">
                  <Share2 className="w-4 h-4" />
                  <span>{post.shares}</span>
                </button>
                <button onClick={() => toggleSave(post.id)} className="ml-auto">
                  <Bookmark className={`w-4 h-4 ${post.saved ? 'fill-[#C8622A] text-[#C8622A]' : 'text-[#9B8E84]'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Message input */}
        <div className="fixed bottom-[72px] left-0 right-0 max-w-md mx-auto bg-white border-t border-[#EDE8E3] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#C8622A]/20 rounded-full flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-[#C8622A]" />
            </div>
            <div className="flex-1 bg-[#FAF6F1] border border-[#EDE8E3] rounded-2xl px-3 py-2 flex items-center gap-2">
              <input className="flex-1 bg-transparent text-xs text-[#2D2419] placeholder-[#B8AEA8] outline-none"
                placeholder="write a message..." />
              <Send className="w-3.5 h-3.5 text-[#C8622A]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [crews] = useState(POPULAR_CREWS);
  
  // Additional states from the other app
  const [donations, setDonations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
    setCurrentPage('home');
  };

  const handlePost = (postData) => {
    const newPost = {
      id: Date.now(),
      user: currentUser.name,
      handle: '@' + currentUser.name.toLowerCase().replace(' ', ''),
      avatar: currentUser.name.slice(0, 2).toUpperCase(),
      book: postData.bookName || 'General',
      time: 'Just now',
      content: postData.content,
      image: postData.image,
      likes: 0, comments: 0, shares: 0,
      saved: false, liked: false
    };
    setPosts(prev => [newPost, ...prev]);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FAF6F1]">
        <div className="max-w-md mx-auto">
          <LoginPage onLogin={handleLogin} onSignup={handleLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F1]">
      <div className="max-w-md mx-auto relative">
        {currentPage === 'home' && (
          <HomePage 
            user={currentUser} 
            posts={posts} 
            crews={crews}
            donations={donations}
            reviews={reviews}
            suggestedBooks={SUGGESTED_BOOKS} 
            setPage={setCurrentPage} 
          />
        )}
        {currentPage === 'explore' && (
          <ExplorePage user={currentUser} setPage={setCurrentPage} />
        )}
        {currentPage === 'post' && (
          <PostPage user={currentUser} onPost={handlePost} setPage={setCurrentPage} />
        )}
        {currentPage === 'crews' && (
          <CrewsPage user={currentUser} crews={crews} setPage={setCurrentPage} />
        )}
        {currentPage === 'feed' && (
          <FeedPage user={currentUser} posts={posts} setPosts={setPosts} setPage={setCurrentPage} />
        )}
        {currentPage === 'profile' && (
          <ProfilePage user={currentUser} posts={posts} setPage={setCurrentPage}
            onLogout={() => { setIsLoggedIn(false); setCurrentUser(null); setCurrentPage('home'); }} />
        )}
        {/* ReadCrew Page - NEW */}
        {currentPage === 'readcrew' && (
          <ReadCrewPage 
            currentUser={currentUser}
            onBack={() => setCurrentPage('home')}
          />
        )}
        <BottomNav active={currentPage} setPage={setCurrentPage} />
      </div>
    </div>
  );
}