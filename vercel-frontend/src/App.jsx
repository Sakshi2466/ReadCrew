import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Home, Search, Edit3, Users, User, Bell, Settings,
  Heart, MessageCircle, Bookmark, Share2, Star, Plus, ChevronRight,
  X, Send, Image, ChevronLeft, LogOut, Camera, MoreHorizontal,
  Sparkles, Lock, Eye, EyeOff, UserPlus, Gift, ThumbsUp, ThumbsDown,
  Trash2, Edit, Target, Check, ArrowLeft, Clock, TrendingUp, Menu, Upload,
  Calendar, Award, MessageSquare, Globe, ChevronDown, Filter, Play, Pause,
  Volume2, Mic, Paperclip, Mail, Phone, Leaf, ExternalLink, ThumbsUp as LikeIcon
} from 'lucide-react';

// Import API functions
import { donationAPI, reviewAPI, otpAPI, checkBackendConnection, getBookRecommendations, chatAPI, crewAPI, userAPI, bookCrewAPI, getTrendingBooks, aiChatAPI } from './services/api';
import axios from 'axios';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'https://versal-book-app.onrender.com';

// Validation functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateName = (name) => name && name.trim().length >= 2;

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

// ─── AVATAR COMPONENT ──────────────────────────────────────────────────────
const Avatar = ({ initials, size = 'md', color = '#C8622A', src, online }) => {
  const sizes = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl'
  };

  return (
    <div className="relative shrink-0">
      {src ? (
        <img src={src} alt={initials} className={`${sizes[size]} rounded-full object-cover`} />
      ) : (
        <div className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white`}
          style={{ backgroundColor: color }}>
          {initials?.slice(0, 2).toUpperCase()}
        </div>
      )}
      {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>}
    </div>
  );
};

// ─── STAR RATING ───────────────────────────────────────────────────────────
const StarRating = ({ rating = 0, onChange, size = 'sm' }) => {
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${sz} ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} ${onChange ? 'cursor-pointer hover:scale-110 transition' : ''}`}
          onClick={() => onChange?.(i)}
        />
      ))}
    </div>
  );
};

// ─── LOADING SPINNER ───────────────────────────────────────────────────────
const LoadingSpinner = ({ size = 'md', color = 'orange' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const colors = { orange: 'border-orange-500', blue: 'border-blue-500', purple: 'border-purple-500' };

  return (
    <div className={`${sizes[size]} border-4 border-t-transparent ${colors[color]} rounded-full animate-spin`}></div>
  );
};

// ─── BOTTOM NAV ────────────────────────────────────────────────────────────
const BottomNav = ({ active, setPage, unreadCount = 0 }) => {
  const items = [
    { id: 'home', icon: BookOpen, label: 'ReadCrew' },
    { id: 'explore', icon: Sparkles, label: 'Explore' },
    { id: 'post', icon: Edit3, label: 'Post' },
    { id: 'crews', icon: Users, label: 'Crews' },
    { id: 'reviews', icon: Star, label: 'Reviews' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 max-w-md mx-auto shadow-lg">
      <div className="flex items-center justify-around py-2 px-2">
        {items.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative ${
              active === id ? 'text-[#C8622A]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {id === 'post' ? (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center -mt-5 shadow-lg ${
                active === id ? 'bg-[#C8622A]' : 'bg-gray-800'
              }`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            ) : (
              <Icon className="w-5 h-5" strokeWidth={active === id ? 2.5 : 1.8} />
            )}
            {id === 'crews' && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
            <span className={`text-[10px] font-medium ${id === 'post' ? 'mt-1' : ''}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// ─── TOP BAR ───────────────────────────────────────────────────────────────
const TopBar = ({ user, setPage, title, showBack = false, onBack, showProfile = true, onNotificationClick }) => (
  <header className="sticky top-0 bg-white/95 backdrop-blur-sm z-40 px-4 py-3 flex items-center justify-between border-b border-gray-200">
    <div className="flex items-center gap-3">
      {showBack && (
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      )}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-md">
          <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Georgia, serif' }}>
          {title || 'ReadCrew'}
        </span>
      </div>
    </div>
    {showProfile && (
      <div className="flex items-center gap-3">
        <button 
          onClick={onNotificationClick}
          className="relative p-1 hover:bg-gray-100 rounded-lg transition"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button onClick={() => setPage('profile')} className="hover:opacity-80 transition">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
        </button>
      </div>
    )}
  </header>
);

// ─── NOTIFICATIONS PAGE ───────────────────────────────────────────────────
const NotificationsPage = ({ user, setPage, onClose }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const userNotifications = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    setNotifications(userNotifications);
  };

  const markAsRead = (notificationId) => {
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 bg-white z-50">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-semibold text-gray-900">Notifications</h2>
        <button 
          onClick={markAllAsRead}
          className="text-sm text-orange-500 font-medium"
        >
          Mark all read
        </button>
      </div>

      <div className="overflow-y-auto h-full pb-20">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                className={`p-4 ${notif.read ? 'bg-white' : 'bg-orange-50'}`}
                onClick={() => markAsRead(notif.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    notif.type === 'like' ? 'bg-red-100' : 
                    notif.type === 'comment' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {notif.type === 'like' && <Heart className="w-4 h-4 text-red-500" />}
                    {notif.type === 'comment' && <MessageCircle className="w-4 h-4 text-blue-500" />}
                    {notif.type === 'message' && <MessageSquare className="w-4 h-4 text-green-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notif.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── LOGIN PAGE ─────────────────────────────────────────────────────────────
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [readingGoal, setReadingGoal] = useState({ yearly: 20, monthly: 5 });

  const handleSendOTP = async () => {
    if (!validateName(name) || !validateEmail(email)) {
      alert('Please fill all fields correctly');
      return;
    }

    setLoading(true);
    try {
      const result = await otpAPI.sendOTP({ name, email });
      if (result.success) {
        setShowOTP(true);
        alert('OTP sent to your email! Check your inbox.');
      } else {
        alert(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('devOTP', otp);
      setShowOTP(true);
      alert(`Development OTP: ${otp} (Check console)`);
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
          password: password,
          readingGoal: readingGoal,
          isVerified: true,
          createdAt: new Date().toISOString(),
          stats: { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 },
          joinedCrews: []
        };

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push(userData);
        localStorage.setItem('users', JSON.stringify(users));
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem(`user_${userData.email}_stats`, JSON.stringify(userData.stats));
        localStorage.setItem(`user_${userData.email}_joinedCrews`, JSON.stringify([]));
        localStorage.setItem(`user_${userData.email}_notifications`, JSON.stringify([]));

        onLogin(userData);
        setShowOTP(false);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      const devOTP = localStorage.getItem('devOTP');
      if (devOTP && otpInput === devOTP) {
        const userData = {
          id: Date.now().toString(),
          name: name,
          email: email,
          password: password,
          readingGoal: readingGoal,
          isVerified: true,
          createdAt: new Date().toISOString(),
          stats: { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 },
          joinedCrews: []
        };
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push(userData);
        localStorage.setItem('users', JSON.stringify(users));
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem(`user_${userData.email}_stats`, JSON.stringify(userData.stats));
        localStorage.setItem(`user_${userData.email}_joinedCrews`, JSON.stringify([]));
        localStorage.setItem(`user_${userData.email}_notifications`, JSON.stringify([]));
        
        onLogin(userData);
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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-7 border border-gray-200 mt-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Verify OTP</h2>
          <p className="text-center text-gray-500 text-sm mb-6">Enter the code sent to {email}</p>
          <input
            type="text"
            value={otpInput}
            onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none text-center text-3xl tracking-widest mb-6"
            placeholder="000000"
            maxLength="6"
            autoFocus
          />
          <button
            onClick={handleVerifyOTP}
            disabled={loading || otpInput.length !== 6}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-50 shadow-lg"
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
          <button
            onClick={() => setShowOTP(false)}
            className="w-full mt-4 text-gray-500 hover:text-orange-500 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" style={{ fontFamily: "'Georgia', serif" }}>
      <div className="w-full max-w-md">
        {/* Logo Section - Properly oriented */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            ReadCrew
          </h1>
          <p className="text-gray-500 text-sm mt-2">Read together, grow together.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-7 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            {isLogin ? 'Welcome Back!' : 'Join the Crew'}
          </h2>

          <div className="space-y-4">
            {!isLogin && (
              <>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <User className="w-5 h-5 text-gray-400" />
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                    placeholder="Full Name"
                  />
                </div>

                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-500" />
                    Set Your Reading Goals (Optional)
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Yearly Goal (books)</label>
                      <input
                        type="number"
                        value={readingGoal.yearly}
                        onChange={(e) => setReadingGoal({...readingGoal, yearly: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none"
                        min="0"
                        max="100"
                        placeholder="e.g., 20"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Monthly Goal (books)</label>
                      <input
                        type="number"
                        value={readingGoal.monthly}
                        onChange={(e) => setReadingGoal({...readingGoal, monthly: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none"
                        min="0"
                        max="20"
                        placeholder="e.g., 5"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
              <Mail className="w-5 h-5 text-gray-400" />
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                placeholder="Email"
              />
            </div>

            <div>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                <Lock className="w-5 h-5 text-gray-400" />
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type={showPass ? 'text' : 'password'}
                  className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                  placeholder="Password"
                />
                <button onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (isLogin) {
                // Login with password verification
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const foundUser = users.find(u => u.email === email);
                
                if (foundUser && foundUser.password === password) {
                  localStorage.setItem('currentUser', JSON.stringify(foundUser));
                  onLogin(foundUser);
                } else {
                  alert('Invalid email or password');
                }
              } else {
                handleSendOTP();
              }
            }}
            className="w-full mt-5 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold text-base hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Create Account')}
          </button>

          <p className="text-center text-sm text-gray-500 mt-5">
            {isLogin ? "New to ReadCrew? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-orange-500 font-semibold hover:underline">
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── HOME PAGE ──────────────────────────────────────────────────────────────
const HomePage = ({ user, posts, setPosts, crews, setPage, donations, reviews, onUpdateStats }) => {
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const [feedPosts, setFeedPosts] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookDetails, setShowBookDetails] = useState(false);
  const [bookDetails, setBookDetails] = useState(null);
  const [loadingBookDetails, setLoadingBookDetails] = useState(false);

  // Real-time stats
  const [userStats, setUserStats] = useState({
    booksRead: user?.stats?.booksRead || 0,
    reviewsGiven: user?.stats?.reviewsGiven || 0,
    postsCreated: user?.stats?.postsCreated || 0,
    crewsJoined: user?.joinedCrews?.length || 0
  });

  useEffect(() => {
    loadTrendingBooks();
    loadFeedPosts();
    calculateReadingProgress();
    
    // Update stats from localStorage
    const savedStats = localStorage.getItem(`user_${user.email}_stats`);
    if (savedStats) {
      setUserStats(JSON.parse(savedStats));
    }
  }, [user?.stats?.booksRead, user?.joinedCrews]);

  const loadTrendingBooks = async () => {
    setLoadingTrending(true);
    try {
      const response = await fetch(`${API_URL}/api/recommend/trending`);
      const data = await response.json();
      
      if (data.success) {
        setTrendingBooks(data.books);
      } else {
        // Fallback to mock data
        setTrendingBooks([
          { id: 1, title: 'Atomic Habits', author: 'James Clear', rating: 4.8, readers: 15420, cover: '#E8A87C' },
          { id: 2, title: 'The Psychology of Money', author: 'Morgan Housel', rating: 4.7, readers: 12350, cover: '#7B9EA6' },
          { id: 3, title: 'Deep Work', author: 'Cal Newport', rating: 4.6, readers: 9870, cover: '#2D2D2D' },
          { id: 4, title: 'Sapiens', author: 'Yuval Harari', rating: 4.8, readers: 21500, cover: '#C4A882' },
        ]);
      }
    } catch (error) {
      console.error('Error loading trending books:', error);
      setTrendingBooks([
        { id: 1, title: 'Atomic Habits', author: 'James Clear', rating: 4.8, readers: 15420, cover: '#E8A87C' },
        { id: 2, title: 'The Psychology of Money', author: 'Morgan Housel', rating: 4.7, readers: 12350, cover: '#7B9EA6' },
        { id: 3, title: 'Deep Work', author: 'Cal Newport', rating: 4.6, readers: 9870, cover: '#2D2D2D' },
        { id: 4, title: 'Sapiens', author: 'Yuval Harari', rating: 4.8, readers: 21500, cover: '#C4A882' },
      ]);
    } finally {
      setLoadingTrending(false);
    }
  };

  const loadFeedPosts = () => {
    const feed = [
      ...(donations || []).map(d => ({ ...d, type: 'donation', timestamp: new Date(d.createdAt) })),
      ...(posts || []).map(p => ({ ...p, type: 'post', timestamp: new Date(p.createdAt || Date.now()) }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
    
    setFeedPosts(feed);
  };

  const calculateReadingProgress = () => {
    if (user?.readingGoal?.yearly > 0) {
      const progress = (userStats.booksRead) / user.readingGoal.yearly * 100;
      setReadingProgress(Math.min(progress, 100));
    } else {
      setReadingProgress(0);
    }
  };

  const handleLikePost = async (postId, type) => {
    try {
      // Update post likes
      setFeedPosts(prev => prev.map(p => 
        p._id === postId ? { ...p, likes: (p.likes || 0) + 1, liked: true } : p
      ));
      
      // Create notification for post owner
      const post = feedPosts.find(p => p._id === postId);
      if (post && post.userEmail !== user.email) {
        const notification = {
          id: Date.now(),
          type: 'like',
          fromUser: user.name,
          fromUserEmail: user.email,
          postId: postId,
          message: `${user.name} liked your post`,
          timestamp: new Date().toISOString(),
          read: false
        };
        
        const userNotifications = JSON.parse(localStorage.getItem(`user_${post.userEmail}_notifications`) || '[]');
        userNotifications.unshift(notification);
        localStorage.setItem(`user_${post.userEmail}_notifications`, JSON.stringify(userNotifications));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = (postId) => {
    const comment = prompt('Enter your comment:');
    if (comment) {
      setFeedPosts(prev => prev.map(p => 
        p._id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p
      ));
      
      // Create notification
      const post = feedPosts.find(p => p._id === postId);
      if (post && post.userEmail !== user.email) {
        const notification = {
          id: Date.now(),
          type: 'comment',
          fromUser: user.name,
          fromUserEmail: user.email,
          postId: postId,
          comment: comment,
          message: `${user.name} commented on your post`,
          timestamp: new Date().toISOString(),
          read: false
        };
        
        const userNotifications = JSON.parse(localStorage.getItem(`user_${post.userEmail}_notifications`) || '[]');
        userNotifications.unshift(notification);
        localStorage.setItem(`user_${post.userEmail}_notifications`, JSON.stringify(userNotifications));
      }
    }
  };

  const handleShare = (postId) => {
    setFeedPosts(prev => prev.map(p => 
      p._id === postId ? { ...p, shares: (p.shares || 0) + 1 } : p
    ));
    alert('Post shared!');
  };

  const handleBookClick = async (book) => {
    setSelectedBook(book);
    setShowBookDetails(true);
    setLoadingBookDetails(true);
    
    try {
      // Fetch book details from Groq API via your backend
      const response = await axios.post(`${API_URL}/api/recommend/ai`, {
        query: `Tell me about the book "${book.title}" by ${book.author}. Include summary, themes, and why people like it.`
      });
      
      if (response.data.success) {
        setBookDetails(response.data.recommendations[0]);
      } else {
        throw new Error('Failed to fetch book details');
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
      setBookDetails({
        title: book.title,
        author: book.author,
        description: `${book.title} is a popular book by ${book.author}. It has received great reviews from readers worldwide.`,
        genre: 'General',
        rating: book.rating
      });
    } finally {
      setLoadingBookDetails(false);
    }
  };

  const handleViewAllTrending = () => {
    setPage('explore');
  };

  const hasReadingGoal = user?.readingGoal?.yearly > 0 || user?.readingGoal?.monthly > 0;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <TopBar user={user} setPage={setPage} title="ReadCrew" />
      
      {/* Book Details Modal */}
      {showBookDetails && selectedBook && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Book Details</h3>
              <button onClick={() => setShowBookDetails(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              {loadingBookDetails ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : bookDetails && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div 
                      className="w-24 h-32 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: selectedBook.cover || '#C8622A' }}
                    >
                      <BookOpen className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900">{bookDetails.title}</h2>
                      <p className="text-gray-600">by {bookDetails.author}</p>
                      {bookDetails.genre && (
                        <span className="inline-block mt-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs">
                          {bookDetails.genre}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {bookDetails.description && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-gray-700 text-sm leading-relaxed">{bookDetails.description}</p>
                    </div>
                  )}
                  
                  {bookDetails.reason && (
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                      <p className="text-sm text-orange-800">
                        <span className="font-bold">Why you might like it:</span> {bookDetails.reason}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-4">
                    <button 
                      onClick={() => {
                        setShowBookDetails(false);
                        // Create crew for this book
                        const newCrew = {
                          id: Date.now(),
                          name: selectedBook.title,
                          author: selectedBook.author,
                          genre: bookDetails.genre || 'General',
                          members: 1,
                          chats: 0,
                          cover: selectedBook.cover || '#C8622A',
                          createdBy: user.email,
                          createdAt: new Date().toISOString(),
                          messages: []
                        };
                        
                        const existingCrews = JSON.parse(localStorage.getItem('crews') || '[]');
                        existingCrews.push(newCrew);
                        localStorage.setItem('crews', JSON.stringify(existingCrews));
                        
                        alert(`Crew for "${selectedBook.title}" created!`);
                        setPage('crews');
                      }}
                      className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium"
                    >
                      Create Crew
                    </button>
                    <button 
                      onClick={() => {
                        alert('Share feature coming soon!');
                      }}
                      className="px-4 py-3 border border-gray-200 rounded-xl"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-4 space-y-5">
        {/* Welcome Card - Without the white circle and avatar */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Welcome, {user?.name?.split(' ')[0]}! 📚</h2>
              <p className="text-orange-100 text-sm mt-1">Ready for your next reading adventure?</p>
            </div>
            {/* Removed the Avatar circle as requested */}
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
          
          {/* Reading Progress - Only show if goals are set */}
          {hasReadingGoal && (
            <div className="mt-4 bg-white/20 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Yearly Goal Progress</span>
                <span className="font-semibold">{userStats.booksRead}/{user?.readingGoal?.yearly || 0} books</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${readingProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-orange-100">
                <span>Monthly: {userStats.booksRead}/{user?.readingGoal?.monthly || 0}</span>
                <span>{Math.round(readingProgress)}% Complete</span>
              </div>
            </div>
          )}
          
          {/* Prompt to set goals if not set */}
          {!hasReadingGoal && (
            <button
              onClick={() => setPage('profile')}
              className="mt-3 w-full bg-white/20 hover:bg-white/30 rounded-xl py-2 text-sm font-medium transition"
            >
              Set Reading Goals →
            </button>
          )}
        </div>

        {/* Quick Stats - Real-time updates */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Books', value: userStats.booksRead, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100', page: 'profile' },
            { label: 'Reviews', value: userStats.reviewsGiven, icon: Star, color: 'text-purple-600', bg: 'bg-purple-100', page: 'reviews' },
            { label: 'Posts', value: userStats.postsCreated, icon: Edit3, color: 'text-green-600', bg: 'bg-green-100', page: 'post' },
            { label: 'Crews', value: userStats.crewsJoined, icon: Users, color: 'text-orange-600', bg: 'bg-orange-100', page: 'crews' }
          ].map(({ label, value, icon: Icon, color, bg, page }, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition"
              onClick={() => setPage(page)}
            >
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Create Post Button */}
        <button 
          onClick={() => setPage('post')}
          className="w-full bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-center gap-3 hover:shadow-md transition"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
            <Edit3 className="w-5 h-5 text-orange-500" />
          </div>
          <span className="text-gray-600">Share your reading journey...</span>
          <span className="ml-auto text-xs text-gray-400">Post</span>
        </button>

        {/* Live Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              Community Feed
            </h2>
            <button 
              onClick={() => setPage('reviews')}
              className="text-sm text-orange-500 font-semibold"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            {feedPosts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No posts yet. Be the first to share!</p>
                <button 
                  onClick={() => setPage('post')}
                  className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"
                >
                  Create Post
                </button>
              </div>
            ) : (
              feedPosts.map((post, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {post.userName?.slice(0, 2) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{post.userName || 'Anonymous'}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <BookOpen className="w-3 h-3 text-orange-500" />
                            <p className="text-xs text-gray-500">{post.bookName || 'Shared a story'}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(post.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {post.image && (
                    <img 
                      src={post.image} 
                      alt={post.bookName} 
                      className="w-full h-48 object-cover rounded-xl mb-3"
                    />
                  )}
                  
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    {post.story || post.content}
                  </p>
                  
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                    <button 
                      onClick={() => handleLikePost(post._id, post.type)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-500"
                    >
                      <Heart className={`w-4 h-4 ${post.liked ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{post.likes || 0}</span>
                    </button>
                    <button 
                      onClick={() => handleComment(post._id)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-500"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments || 0}</span>
                    </button>
                    <button 
                      onClick={() => handleShare(post._id)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-500"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{post.shares || 0}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Trending Books Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Top Trending Books
            </h2>
            <button 
              onClick={handleViewAllTrending}
              className="text-sm text-orange-500 font-semibold"
            >
              View All
            </button>
          </div>

          {loadingTrending ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {trendingBooks.map((book, i) => (
                <div 
                  key={i} 
                  className="shrink-0 w-32 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => handleBookClick(book)}
                >
                  <div 
                    className="w-32 h-40 rounded-xl shadow-lg flex items-end justify-center pb-3 mb-2"
                    style={{ backgroundColor: book.cover }}
                  >
                    <BookOpen className="w-8 h-8 text-white opacity-50" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{book.title}</p>
                  <p className="text-xs text-gray-500">{book.author}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium">{book.rating}</span>
                    <span className="text-xs text-gray-400 ml-1">({(book.readers/1000).toFixed(1)}K)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Your Crews */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              Your Crews
            </h2>
            <button onClick={() => setPage('crews')} className="text-sm text-orange-500 font-semibold">
              View All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(crews || []).filter(crew => user?.joinedCrews?.includes(crew.id)).slice(0, 2).map(crew => (
              <div 
                key={crew.id} 
                className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => setPage('crews')}
              >
                <div className="h-16 flex items-center justify-center" style={{ backgroundColor: crew.cover + '20' }}>
                  <div className="w-10 h-12 rounded-lg shadow-md flex items-center justify-center" style={{ backgroundColor: crew.cover }}>
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{crew.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{crew.genre}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      <span>{crew.members || 1}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-lg text-xs">
                      Joined
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {(!user?.joinedCrews || user.joinedCrews.length === 0) && (
              <div className="col-span-2 bg-white rounded-xl p-6 text-center border border-gray-200">
                <p className="text-gray-500 text-sm">You haven't joined any crews yet</p>
                <button 
                  onClick={() => setPage('crews')}
                  className="mt-2 text-orange-500 text-sm font-medium"
                >
                  Browse Crews →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ENHANCED EXPLORE PAGE ─────────────────────────────────────────────────
const ExplorePage = ({ user, setPage, onCreateCrew }) => {
  const [query, setQuery] = useState('');
  const [intensity, setIntensity] = useState(50);
  const [suggestions, setSuggestions] = useState([
    { emoji: '🚀', label: 'Space exploration' },
    { emoji: '👨‍🚀', label: 'Sci-fi adventure' },
    { emoji: '🌌', label: 'Cosmic philosophy' },
    { emoji: '📚', label: 'Real NASA stories' },
  ]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const inputRef = useRef();

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
    motivation: [
      { emoji: '💪', label: 'Self-improvement' },
      { emoji: '🎯', label: 'Goal setting' },
      { emoji: '🧠', label: 'Mindset shifts' },
      { emoji: '🚀', label: 'Entrepreneurship' },
    ],
  };

  useEffect(() => {
    if (query.trim()) {
      const lower = query.toLowerCase();
      for (const [key, sug] of Object.entries(SUGGESTION_MAP)) {
        if (lower.includes(key)) {
          setSuggestions(sug);
          setShowSuggestions(true);
          return;
        }
      }
      setSuggestions([
        { emoji: '✨', label: `${query} fiction` },
        { emoji: '📖', label: `${query} non-fiction` },
        { emoji: '🌟', label: `Popular ${query}` },
      ]);
      setShowSuggestions(true);
    } else {
      setSuggestions([
        { emoji: '🚀', label: 'Space exploration' },
        { emoji: '👨‍🚀', label: 'Sci-fi adventure' },
        { emoji: '🌌', label: 'Cosmic philosophy' },
        { emoji: '📚', label: 'Real NASA stories' },
      ]);
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
    
    const fullQuery = `${query}. Books that are ${intensityLabel}.`;

    try {
      const response = await axios.post(`${API_URL}/api/recommend/ai`, {
        query: fullQuery
      });

      if (response.data.success && response.data.recommendations) {
        setResults(response.data.recommendations);
      } else {
        throw new Error('No recommendations');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      // Fallback
      setResults([
        { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', description: 'Tiny changes, remarkable results', rating: 4.8 },
        { title: 'The Martian', author: 'Andy Weir', genre: 'Sci-Fi', description: 'Survival on Mars', rating: 4.7 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCrew = (book) => {
    if (window.confirm(`Create crew for "${book.title}"?`)) {
      onCreateCrew(book);
      setPage('crews');
    }
  };

  const handleInvite = (book) => {
    alert('Share feature coming soon!');
  };

  const getBookColor = (title) => {
    const colors = ['#C8622A', '#7B9EA6', '#8B5E3C', '#C8956C'];
    const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // RESULTS VIEW
  if (searched) {
    return (
      <div className="min-h-screen bg-[#FAF6F1] pb-24">
        <div className="sticky top-0 bg-[#FAF6F1] z-40 px-4 py-3 flex items-center gap-3 border-b border-[#EDE8E3]">
          <button onClick={() => { setSearched(false); setResults([]); }} className="p-2 hover:bg-[#F0E8DF] rounded-xl">
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
              <div className="w-16 h-16 border-4 border-[#F0E8DF] border-t-[#C8622A] rounded-full animate-spin mx-auto mb-5" />
              <p className="text-[#6B5D52] font-medium">Finding your perfect book...</p>
            </div>
          )}

          {results.length > 0 && (
            <>
              <h2 className="font-bold text-[#2D2419] mb-4">Books for "{query}"</h2>
              <div className="space-y-4">
                {results.map((book, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-[#EDE8E3] p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-28 rounded-xl flex items-center justify-center" style={{ backgroundColor: getBookColor(book.title) }}>
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-[#2D2419]">{book.title}</h3>
                        <p className="text-sm text-[#9B8E84]">by {book.author}</p>
                        {book.genre && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{book.genre}</span>}
                        {book.description && <p className="text-xs text-[#6B5D52] mt-2">{book.description}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => handleJoinCrew(book)} className="flex-1 py-2.5 bg-[#C8622A] text-white rounded-xl text-sm font-semibold">
                        Join Crew
                      </button>
                      <button onClick={() => handleInvite(book)} className="px-4 py-2.5 border border-[#EDE8E3] rounded-xl">
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // MAIN EXPLORE VIEW
  return (
    <div className="min-h-screen pb-24 bg-gradient-to-b from-[#F5E6D3] to-[#FAF6F1]">
      <div className="px-5 pt-12 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-[2rem] font-bold text-[#2D1F14] leading-tight mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            What do you feel like<br />reading today?
          </h1>
          <p className="text-[#8B7968] text-sm">You can type anything — a mood, a topic, a vibe</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-[#EDE8E3] mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">✨</span>
            <span className="text-[#8B7968] text-sm">Tell me what's on your mind...</span>
          </div>

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => e.key === 'Enter' && handleFindBook()}
            placeholder=""
            className="w-full bg-[#FAF8F5] border border-[#E8E0D8] rounded-2xl px-4 py-3.5 text-[#2D1F14] text-base outline-none focus:border-[#C8622A] mb-3"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="bg-[#FAF8F5] border border-[#E8E0D8] rounded-2xl overflow-hidden mb-3">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => handleSuggestionClick(s.label)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F0E8DF] text-left border-b border-[#EDE8E3] last:border-0">
                  <span className="text-xl">{s.emoji}</span>
                  <span className="text-[#2D1F14] text-sm font-medium">{s.label}</span>
                </button>
              ))}
            </div>
          )}

          {selectedTags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {selectedTags.map((tag, i) => (
                <span key={i} className="flex items-center gap-1.5 bg-[#F0E8DF] text-[#6B5D52] text-xs px-3 py-1.5 rounded-full">
                  🌙 {tag}
                  <button onClick={() => removeTag(tag)}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6">
          <p className="text-center text-[#6B5D52] text-sm font-medium mb-3">How intense should it be?</p>
          <div className="flex items-center gap-3">
            <span className="text-lg">☀️</span>
            <span className="text-xs text-[#9B8E84]">Light</span>
            <input
              type="range"
              min="0"
              max="100"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full outline-none"
              style={{ background: `linear-gradient(to right, #C8622A ${intensity}%, #E8DDD5 ${intensity}%)` }}
            />
            <span className="text-xs text-[#9B8E84]">Deep</span>
            <span className="text-lg">🌑</span>
          </div>
          <p className="text-xs text-[#C8622A] font-medium text-center mt-2">
            {intensity < 33 ? 'Light & Breezy' : intensity < 66 ? 'Moderately Deep' : 'Deep & Intense'}
          </p>
        </div>

        <button
          onClick={handleFindBook}
          disabled={!query.trim() || loading}
          className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-lg disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #C8622A 0%, #A0481E 100%)' }}
        >
          {loading ? 'Finding...' : '✨ Find My Book'}
        </button>
      </div>
    </div>
  );
};

// ─── POST PAGE ──────────────────────────────────────────────────────────────
const PostPage = ({ user, onPost, setPage }) => {
  const [content, setContent] = useState('');
  const [bookName, setBookName] = useState('');
  const [author, setAuthor] = useState('');
  const [image, setImage] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isDonation, setIsDonation] = useState(false);
  const fileRef = useRef();

  const handleSubmit = async () => {
    if (!content.trim()) return;

    const postData = {
      id: Date.now(),
      content,
      bookName,
      author,
      image,
      isPublic,
      type: isDonation ? 'donation' : 'post',
      userName: user.name,
      userEmail: user.email,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      shares: 0
    };

    try {
      onPost(postData);
      setPage('home');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setPage('home')} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-semibold text-gray-900">Create Post</h2>
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
        >
          Share
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-base resize-none"
              placeholder={isDonation ? "Share your book donation story..." : "What are you reading?"}
              rows={4}
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <input
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            placeholder="Book name (optional)"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            placeholder="Author (optional)"
          />
        </div>

        {image && (
          <div className="relative mb-4">
            <img src={image} alt="preview" className="w-full rounded-xl" />
            <button
              onClick={() => setImage(null)}
              className="absolute top-2 right-2 bg-black/50 rounded-full p-1"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700"
          >
            <Camera className="w-4 h-4" />
            Add Photo
          </button>
          
          <button
            onClick={() => setIsDonation(!isDonation)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition ${
              isDonation ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Gift className="w-4 h-4" />
            Donation Story
          </button>
          
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition ${
              !isPublic ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {isPublic ? 'Public' : 'Private'}
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => setImage(ev.target.result);
              reader.readAsDataURL(file);
            }
          }}
        />
      </div>
    </div>
  );
};

// ─── REVIEWS PAGE ─────────────────────────────────────────────────────────
const ReviewsPage = ({ user, setPage }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newReview, setNewReview] = useState({
    bookName: '',
    author: '',
    rating: 5,
    review: '',
    sentiment: 'positive'
  });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const savedReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
      setReviews(savedReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async () => {
    if (!newReview.bookName || !newReview.author || !newReview.review) {
      alert('Please fill all fields');
      return;
    }

    try {
      const reviewData = {
        id: Date.now(),
        ...newReview,
        userName: user.name,
        userEmail: user.email,
        createdAt: new Date().toISOString()
      };

      const savedReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
      savedReviews.unshift(reviewData);
      localStorage.setItem('reviews', JSON.stringify(savedReviews));
      
      setReviews([reviewData, ...reviews]);
      setShowCreateForm(false);
      setNewReview({
        bookName: '',
        author: '',
        rating: 5,
        review: '',
        sentiment: 'positive'
      });
      
      // Update user stats
      const updatedStats = {
        ...user.stats,
        reviewsGiven: (user.stats?.reviewsGiven || 0) + 1
      };
      
      const updatedUser = {
        ...user,
        stats: updatedStats
      };
      
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(updatedStats));
      
      // Trigger notification
      const notification = {
        id: Date.now(),
        type: 'review',
        message: `You wrote a review for "${newReview.bookName}"`,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      const userNotifications = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
      userNotifications.unshift(notification);
      localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(userNotifications));
      
    } catch (error) {
      console.error('Error creating review:', error);
      alert('Failed to create review');
    }
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <button onClick={() => setPage('home')} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-semibold text-gray-900">Book Reviews</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium"
        >
          {showCreateForm ? 'Cancel' : 'Write Review'}
        </button>
      </div>

      <div className="px-4 py-4">
        {showCreateForm && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Write a Review</h3>
            
            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={newReview.bookName}
                onChange={(e) => setNewReview({...newReview, bookName: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                placeholder="Book name"
              />
              <input
                type="text"
                value={newReview.author}
                onChange={(e) => setNewReview({...newReview, author: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                placeholder="Author"
              />
              
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Rating</label>
                <StarRating 
                  rating={newReview.rating} 
                  onChange={(r) => setNewReview({...newReview, rating: r})}
                />
              </div>
              
              <textarea
                value={newReview.review}
                onChange={(e) => setNewReview({...newReview, review: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                placeholder="Write your review..."
                rows={4}
              />
              
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Sentiment</label>
                <select
                  value={newReview.sentiment}
                  onChange={(e) => setNewReview({...newReview, sentiment: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={handleCreateReview}
              className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium"
            >
              Submit Review
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No reviews yet. Be the first to write one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review, idx) => (
              <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{review.bookName}</h3>
                    <p className="text-xs text-gray-500">by {review.author}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <StarRating rating={review.rating} size="xs" />
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 mb-3">{review.review}</p>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {review.userName?.slice(0, 2) || 'U'}
                    </div>
                    <span className="text-xs text-gray-500">{review.userName}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    review.sentiment === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {review.sentiment === 'positive' ? '👍 Positive' : '👎 Negative'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── CREWS PAGE ───────────────────────────────────────────────────────────
const CrewsPage = ({ user, crews: initialCrews, setPage }) => {
  const [view, setView] = useState('list');
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [crewMembers, setCrewMembers] = useState([]);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [crews, setCrews] = useState([]);
  const [joinedCrews, setJoinedCrews] = useState([]);
  const [showJoinMessage, setShowJoinMessage] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [showCreateCrewForm, setShowCreateCrewForm] = useState(false);
  const [newCrewData, setNewCrewData] = useState({
    name: '',
    author: '',
    genre: '',
    cover: '#C8622A'
  });
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Load crews from localStorage
    const savedCrews = JSON.parse(localStorage.getItem('crews') || '[]');
    setCrews(savedCrews.length > 0 ? savedCrews : initialCrews);
    
    // Load joined crews
    const savedJoinedCrews = JSON.parse(localStorage.getItem(`user_${user.email}_joinedCrews`) || '[]');
    setJoinedCrews(savedJoinedCrews);
  }, [user.email]);

  useEffect(() => {
    if (selectedCrew) {
      loadCrewMessages();
      loadCrewMembers();
      loadSimilarBooks();
    }
  }, [selectedCrew]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCrewMessages = () => {
    // Load messages from localStorage for this crew
    const crewMessages = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`) || '[]');
    setMessages(crewMessages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
  };

  const loadCrewMembers = () => {
    // Get all users who joined this crew
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const members = allUsers
      .filter(u => u.joinedCrews?.includes(selectedCrew.id))
      .map(u => ({
        id: u.id,
        name: u.name,
        initials: u.name?.slice(0, 2),
        color: '#C8622A',
        online: Math.random() > 0.5 // Random online status for demo
      }));
    
    setCrewMembers(members);
  };

  const loadSimilarBooks = async () => {
    try {
      const mockSimilar = [
        { id: 101, title: 'The Five People You Meet in Heaven', author: 'Mitch Albom', rating: 4.5, cover: '#8B4513' },
        { id: 102, title: 'For One More Day', author: 'Mitch Albom', rating: 4.3, cover: '#2C3E50' },
        { id: 103, title: 'The Time Keeper', author: 'Mitch Albom', rating: 4.4, cover: '#4A4A4A' },
        { id: 104, title: 'The Alchemist', author: 'Paulo Coelho', rating: 4.7, cover: '#C8622A' }
      ];
      setSimilarBooks(mockSimilar);
    } catch (error) {
      console.error('Error loading similar books:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedCrew || !isUserJoined(selectedCrew.id)) return;

    const message = {
      id: Date.now(),
      userId: user.id,
      userName: user.name,
      userInitials: user.name?.slice(0, 2),
      content: newMessage,
      timestamp: new Date().toISOString(),
      color: '#C8622A'
    };

    // Save to localStorage
    const existingMessages = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`) || '[]');
    existingMessages.push(message);
    localStorage.setItem(`crew_${selectedCrew.id}_messages`, JSON.stringify(existingMessages));

    setMessages(prev => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);
    setNewMessage('');

    // Notify other crew members (simulated)
    const notification = {
      id: Date.now(),
      type: 'message',
      fromUser: user.name,
      fromUserEmail: user.email,
      crewId: selectedCrew.id,
      crewName: selectedCrew.name,
      message: `${user.name} sent a message in ${selectedCrew.name}`,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Store notifications for all members except sender
    crewMembers.forEach(member => {
      if (member.id !== user.id) {
        const memberNotifications = JSON.parse(localStorage.getItem(`user_${member.email}_notifications`) || '[]');
        memberNotifications.unshift(notification);
        localStorage.setItem(`user_${member.email}_notifications`, JSON.stringify(memberNotifications));
      }
    });
  };

  const handleTyping = () => {
    setIsTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1000);
  };

  const isUserJoined = (crewId) => {
    return joinedCrews.includes(crewId);
  };

  const handleJoinCrew = (crew) => {
    const updatedJoinedCrews = [...joinedCrews, crew.id];
    setJoinedCrews(updatedJoinedCrews);
    localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updatedJoinedCrews));

    // Update crew members count
    const updatedCrews = crews.map(c =>
      c.id === crew.id ? { ...c, members: (c.members || 1) + 1 } : c
    );
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));

    // Update user's joinedCrews in users list
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map(u => 
      u.email === user.email ? { ...u, joinedCrews: updatedJoinedCrews } : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    // Update user stats
    const updatedStats = {
      ...user.stats,
      crewsJoined: (user.stats?.crewsJoined || 0) + 1
    };
    
    const updatedUser = {
      ...user,
      stats: updatedStats,
      joinedCrews: updatedJoinedCrews
    };
    
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(updatedStats));

    setJoinMessage(`You've joined the ${crew.name} crew! 🎉`);
    setShowJoinMessage(true);
    setTimeout(() => setShowJoinMessage(false), 3000);
  };

  const handleLeaveCrew = (crew) => {
    if (window.confirm(`Are you sure you want to leave ${crew.name}?`)) {
      const updatedJoinedCrews = joinedCrews.filter(id => id !== crew.id);
      setJoinedCrews(updatedJoinedCrews);
      localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updatedJoinedCrews));

      // Update crew members count
      const updatedCrews = crews.map(c =>
        c.id === crew.id ? { ...c, members: Math.max(0, (c.members || 1) - 1) } : c
      );
      setCrews(updatedCrews);
      localStorage.setItem('crews', JSON.stringify(updatedCrews));

      // Update user's joinedCrews in users list
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map(u => 
        u.email === user.email ? { ...u, joinedCrews: updatedJoinedCrews } : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      // Update user stats
      const updatedStats = {
        ...user.stats,
        crewsJoined: Math.max(0, (user.stats?.crewsJoined || 1) - 1)
      };
      
      const updatedUser = {
        ...user,
        stats: updatedStats,
        joinedCrews: updatedJoinedCrews
      };
      
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(updatedStats));

      if (selectedCrew?.id === crew.id) {
        setView('list');
        setSelectedCrew(null);
      }
    }
  };

  const handleCreateCrew = () => {
    if (!newCrewData.name || !newCrewData.author) {
      alert('Please fill in the book name and author');
      return;
    }

    const newCrew = {
      id: Date.now(),
      ...newCrewData,
      members: 1,
      chats: 0,
      createdBy: user.email,
      createdAt: new Date().toISOString(),
      messages: []
    };

    const updatedCrews = [newCrew, ...crews];
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));

    // Auto-join the creator
    handleJoinCrew(newCrew);

    setShowCreateCrewForm(false);
    setNewCrewData({
      name: '',
      author: '',
      genre: '',
      cover: '#C8622A'
    });

    setJoinMessage(`Crew "${newCrew.name}" created! 🎉`);
    setShowJoinMessage(true);
    setTimeout(() => setShowJoinMessage(false), 3000);
  };

  const handleAddFriend = (crew) => {
    const friendEmail = prompt("Enter your friend's email to invite them:");
    if (friendEmail) {
      const notification = {
        id: Date.now(),
        type: 'invite',
        fromUser: user.name,
        fromUserEmail: user.email,
        crewId: crew.id,
        crewName: crew.name,
        message: `${user.name} invited you to join the "${crew.name}" crew!`,
        timestamp: new Date().toISOString(),
        read: false
      };

      const friendNotifications = JSON.parse(localStorage.getItem(`user_${friendEmail}_notifications`) || '[]');
      friendNotifications.unshift(notification);
      localStorage.setItem(`user_${friendEmail}_notifications`, JSON.stringify(friendNotifications));

      alert(`Invitation sent to ${friendEmail}!`);
    }
  };

  const JoinMessageToast = () => (
    <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg z-[100] animate-slideDown">
      {joinMessage}
    </div>
  );

  if (view === 'chat' && selectedCrew) {
    const hasJoined = isUserJoined(selectedCrew.id);

    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {showJoinMessage && <JoinMessageToast />}

        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <button onClick={() => setView('bookpage')} className="p-1 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 flex-1 mx-3">
            <div className="relative">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: selectedCrew.cover }}
              >
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              {hasJoined && (
                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{selectedCrew.name}</p>
              <p className="text-xs text-gray-500">
                {crewMembers.length} member{crewMembers.length !== 1 ? 's' : ''} •
                {crewMembers.filter(m => m.online).length} online
              </p>
            </div>
          </div>
          {hasJoined && (
            <div className="flex gap-2">
              <button
                onClick={() => handleAddFriend(selectedCrew)}
                className="text-xs text-blue-500 px-2 py-1 border border-blue-200 rounded-lg"
              >
                Add Friend
              </button>
              <button
                onClick={() => handleLeaveCrew(selectedCrew)}
                className="text-xs text-red-500 px-2 py-1 border border-red-200 rounded-lg"
              >
                Leave
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {!hasJoined ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Lock className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 mb-2">Join this crew to see the chat</p>
              <button
                onClick={() => handleJoinCrew(selectedCrew)}
                className="px-6 py-2 bg-orange-500 text-white rounded-xl font-medium"
              >
                Join Crew
              </button>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isOwn = message.userId === user.id;
                return (
                  <div key={message.id} className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {message.userInitials}
                      </div>
                    )}
                    <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                      {!isOwn && (
                        <p className="text-xs text-gray-500 mb-1 px-1">{message.userName}</p>
                      )}
                      <div className={`rounded-2xl px-4 py-2.5 ${
                        isOwn 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 px-1">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {isTyping && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    ...
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {hasJoined && (
          <div className="bg-white border-t border-gray-200 px-4 py-3 pb-safe">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2.5">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                    handleTyping();
                  }}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                  placeholder="Type a message..."
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-1.5 disabled:opacity-50 transition hover:scale-110 active:scale-95"
                >
                  <Send className={`w-5 h-5 ${!newMessage.trim() ? 'text-gray-400' : 'text-orange-500'}`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view !== 'list' && selectedCrew) {
    const hasJoined = isUserJoined(selectedCrew.id);

    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {showJoinMessage && <JoinMessageToast />}
        
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => setView('list')} className="p-1 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900 flex-1">{selectedCrew.name}</span>
          {hasJoined && (
            <button 
              onClick={() => handleAddFriend(selectedCrew)}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Invite Friend"
            >
              <UserPlus className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Bookmark className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex gap-4 mb-6">
            <div 
              className="w-24 h-32 rounded-xl shadow-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: selectedCrew.cover }}
            >
              <BookOpen className="w-12 h-12 text-white opacity-80" />
            </div>
            <div className="flex-1">
              <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full font-medium inline-block mb-2">
                {selectedCrew.genre}
              </span>
              <h2 className="font-bold text-gray-900 text-xl">{selectedCrew.name}</h2>
              <p className="text-sm text-gray-500">by {selectedCrew.author}</p>
              <div className="flex items-center gap-2 mt-2">
                <StarRating rating={4.5} />
                <span className="text-sm font-medium">4.5</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{crewMembers.length} members</span>
                </div>
                {!hasJoined ? (
                  <button 
                    onClick={() => handleJoinCrew(selectedCrew)}
                    className="px-4 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium"
                  >
                    Join Crew
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-sm font-medium">
                    Joined
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 border-b border-gray-200 mb-4 overflow-x-auto pb-1">
            {['Reviews', 'Crew Chat', 'About', 'Similar'].map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab.toLowerCase().replace(' ', ''))}
                className={`text-sm pb-2 font-medium whitespace-nowrap border-b-2 transition ${
                  view === tab.toLowerCase().replace(' ', '')
                    ? 'text-orange-500 border-orange-500'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {view === 'reviews' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl font-bold text-gray-900">4.5</span>
                <div>
                  <StarRating rating={4.5} />
                  <p className="text-sm text-gray-500 mt-1">Based on 22,847 reviews</p>
                </div>
              </div>
              
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      R{i}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Reader {i}</p>
                      <StarRating rating={4} size="xs" />
                    </div>
                    <span className="text-xs text-gray-400 ml-auto">2 days ago</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {i === 1 && "Profound and heartwarming. Made me reflect on what truly matters in life!"}
                    {i === 2 && "A beautiful story about life's most important lessons. Highly recommended!"}
                    {i === 3 && "Reading this book feels like having a conversation with a wise old friend."}
                  </p>
                </div>
              ))}
            </div>
          )}

          {view === 'crewchat' && (
            <div className="space-y-4">
              {!hasJoined ? (
                <div className="text-center py-8">
                  <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-3">Join this crew to see the chat</p>
                  <button
                    onClick={() => handleJoinCrew(selectedCrew)}
                    className="px-6 py-2 bg-orange-500 text-white rounded-xl font-medium"
                  >
                    Join Crew
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setView('chat')}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-4 font-semibold mb-4"
                  >
                    Join the Discussion
                  </button>
                  
                  {messages.slice(-3).map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {msg.userInitials}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{msg.userName}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {view === 'about' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">About this book</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedCrew.name} by {selectedCrew.author} is a powerful and inspiring book that has touched millions of readers worldwide. 
                  It explores deep themes of life, purpose, and human connection through compelling storytelling and profound insights.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Book Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Author</span>
                    <span className="text-gray-900 font-medium">{selectedCrew.author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Genre</span>
                    <span className="text-gray-900 font-medium">{selectedCrew.genre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pages</span>
                    <span className="text-gray-900 font-medium">224</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Published</span>
                    <span className="text-gray-900 font-medium">1997</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'similar' && (
            <div className="space-y-3">
              {similarBooks.map((book, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 cursor-pointer hover:shadow-md transition">
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-12 h-16 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: book.cover }}
                    >
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{book.title}</h4>
                      <p className="text-xs text-gray-500">by {book.author}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <StarRating rating={book.rating} size="xs" />
                        <span className="text-xs text-gray-600">{book.rating}</span>
                      </div>
                      <button className="mt-2 text-xs text-orange-500 font-medium">
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {showJoinMessage && <JoinMessageToast />}
      
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>Reading Crews</span>
        </div>
        <button
          onClick={() => setShowCreateCrewForm(true)}
          className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium"
        >
          Create Crew
        </button>
      </div>
      
      <div className="px-4 py-4">
        {/* Create Crew Form */}
        {showCreateCrewForm && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Create New Crew</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newCrewData.name}
                onChange={(e) => setNewCrewData({...newCrewData, name: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                placeholder="Book name"
              />
              <input
                type="text"
                value={newCrewData.author}
                onChange={(e) => setNewCrewData({...newCrewData, author: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                placeholder="Author"
              />
              <input
                type="text"
                value={newCrewData.genre}
                onChange={(e) => setNewCrewData({...newCrewData, genre: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                placeholder="Genre"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateCrew}
                  className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateCrewForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-5">
          <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
              placeholder="Search crews..."
            />
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            My Crews
          </h2>
          <div className="space-y-3">
            {crews.filter(crew => isUserJoined(crew.id)).length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                <p className="text-gray-500 text-sm">You haven't joined any crews yet</p>
                <p className="text-xs text-gray-400 mt-1">Join a crew to start discussing books!</p>
              </div>
            ) : (
              crews.filter(crew => isUserJoined(crew.id)).map(crew => (
                <div
                  key={crew.id}
                  className="bg-white rounded-xl overflow-hidden border border-green-200 shadow-sm cursor-pointer hover:shadow-md transition relative"
                  onClick={() => { setSelectedCrew(crew); setView('bookpage'); }}
                >
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Joined
                  </div>
                  <div className="h-20 relative" style={{ backgroundColor: crew.cover + '20' }}>
                    <div className="absolute inset-0 flex items-center px-4 gap-4">
                      <div 
                        className="w-14 h-18 rounded-xl shadow-md flex items-center justify-center"
                        style={{ backgroundColor: crew.cover }}
                      >
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{crew.name}</p>
                        <p className="text-xs text-gray-500">by {crew.author}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                            {crew.genre}
                          </span>
                          <span className="text-xs text-gray-500">{crew.members || 1} members</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-end gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAddFriend(crew); }}
                      className="px-3 py-1 border border-blue-200 text-blue-600 rounded-lg text-xs font-medium"
                    >
                      Invite
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Discover Crews</h2>
          <div className="space-y-3">
            {crews.filter(crew => !isUserJoined(crew.id)).map(crew => (
              <div
                key={crew.id}
                className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition"
                onClick={() => { setSelectedCrew(crew); setView('bookpage'); }}
              >
                <div className="h-20 relative" style={{ backgroundColor: crew.cover + '20' }}>
                  <div className="absolute inset-0 flex items-center px-4 gap-4">
                    <div 
                      className="w-14 h-18 rounded-xl shadow-md flex items-center justify-center"
                      style={{ backgroundColor: crew.cover }}
                    >
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{crew.name}</p>
                      <p className="text-xs text-gray-500">by {crew.author}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                          {crew.genre}
                        </span>
                        <span className="text-xs text-gray-500">{crew.members || 1} members</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 flex justify-between items-center">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAddFriend(crew); }}
                    className="px-3 py-1 border border-blue-200 text-blue-600 rounded-lg text-xs font-medium"
                  >
                    Invite
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleJoinCrew(crew); }}
                    className="px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────
const ProfilePage = ({ user, posts, setPage, onLogout, onUpdateStats }) => {
  const [activeTab, setActiveTab] = useState('Posts');
  const [userStats, setUserStats] = useState(user?.stats || {
    booksRead: 0,
    reviewsGiven: 0,
    postsCreated: 0,
    crewsJoined: 0
  });
  const [readingGoal, setReadingGoal] = useState(user?.readingGoal || { yearly: 0, monthly: 0 });
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [editGoal, setEditGoal] = useState(readingGoal);
  const [profileImage, setProfileImage] = useState(null);
  const fileRef = useRef();

  const tabs = ['Posts', 'Reviews', 'Crews', 'Saved'];
  const myPosts = posts.filter(p => p.userEmail === user?.email);

  useEffect(() => {
    const savedStats = localStorage.getItem(`user_${user.email}_stats`);
    if (savedStats) {
      setUserStats(JSON.parse(savedStats));
    }
    
    const savedImage = localStorage.getItem(`user_${user.email}_profile_image`);
    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, [user.email]);

  const handleSaveGoal = () => {
    const updatedUser = {
      ...user,
      readingGoal: editGoal
    };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setReadingGoal(editGoal);
    setShowEditGoal(false);
    onUpdateStats?.(updatedUser);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfileImage(ev.target.result);
        localStorage.setItem(`user_${user.email}_profile_image`, ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>Profile</span>
        </div>
        <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <LogOut className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="px-4 py-5">
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            {profileImage ? (
              <img src={profileImage} alt={user?.name} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.slice(0, 2).toUpperCase()}
              </div>
            )}
            <button 
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white hover:bg-orange-600 transition"
            >
              <Camera className="w-3 h-3 text-white" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500">@{user?.name?.toLowerCase().replace(' ', '')}</p>
            <p className="text-sm text-gray-600 mt-1 italic">"Reading is my superpower"</p>
            <button className="mt-2 px-4 py-1.5 border border-orange-200 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition">
              Edit Profile
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-gray-900">Reading Goal {new Date().getFullYear()}</h3>
            </div>
            <button 
              onClick={() => setShowEditGoal(!showEditGoal)}
              className="text-sm text-orange-500 font-medium"
            >
              {showEditGoal ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {showEditGoal ? (
            <div className="space-y-3 mt-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Yearly Goal (books)</label>
                <input
                  type="number"
                  value={editGoal.yearly}
                  onChange={(e) => setEditGoal({...editGoal, yearly: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none"
                  min="0"
                  max="100"
                  placeholder="e.g., 20"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Monthly Goal (books)</label>
                <input
                  type="number"
                  value={editGoal.monthly}
                  onChange={(e) => setEditGoal({...editGoal, monthly: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none"
                  min="0"
                  max="20"
                  placeholder="e.g., 5"
                />
              </div>
              <button
                onClick={handleSaveGoal}
                className="w-full py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"
              >
                Save Goal
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold text-gray-900">
                  {readingGoal.yearly > 0 ? `${userStats.booksRead}/${readingGoal.yearly} books` : 'No goal set'}
                </span>
              </div>
              {readingGoal.yearly > 0 && (
                <>
                  <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${(userStats.booksRead / readingGoal.yearly) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>Monthly: {readingGoal.monthly > 0 ? `${userStats.booksRead}/${readingGoal.monthly}` : 'No goal'}</span>
                    <span>{Math.round((userStats.booksRead / readingGoal.yearly) * 100)}% Complete</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 bg-white rounded-xl p-3 border border-gray-200 mb-5">
          {[
            { label: 'Books', value: userStats.booksRead, icon: BookOpen, color: 'text-blue-600' },
            { label: 'Reviews', value: userStats.reviewsGiven, icon: Star, color: 'text-purple-600' },
            { label: 'Posts', value: userStats.postsCreated, icon: Edit3, color: 'text-green-600' },
            { label: 'Crews', value: userStats.crewsJoined, icon: Users, color: 'text-orange-600' }
          ].map(({ label, value, icon: Icon, color }, idx) => (
            <div key={idx} className="text-center">
              <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex border-b border-gray-200 mb-4">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-sm pb-2.5 font-medium border-b-2 transition ${
                activeTab === tab 
                  ? 'text-orange-500 border-orange-500' 
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Posts' && (
          <div className="space-y-4">
            {myPosts.length === 0 ? (
              <div className="text-center py-8">
                <Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No posts yet</p>
                <button 
                  onClick={() => setPage('post')}
                  className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"
                >
                  Create Your First Post
                </button>
              </div>
            ) : (
              myPosts.map(post => (
                <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    {profileImage ? (
                      <img src={profileImage} alt={user?.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {user?.name?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{user?.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <BookOpen className="w-3 h-3 text-orange-500" />
                            <p className="text-xs text-gray-500">{post.bookName || 'General'}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{post.content}</p>
                  {post.image && (
                    <img src={post.image} alt="post" className="w-full rounded-xl mb-3" />
                  )}
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Heart className="w-4 h-4" /> {post.likes || 0}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MessageCircle className="w-4 h-4" /> {post.comments || 0}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Share2 className="w-4 h-4" /> {post.shares || 0}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'Reviews' && (
          <div className="space-y-4">
            {userStats.reviewsGiven === 0 ? (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No reviews yet</p>
                <button 
                  onClick={() => setPage('reviews')}
                  className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"
                >
                  Write a Review
                </button>
              </div>
            ) : (
              <p className="text-gray-500 text-center">Your reviews will appear here</p>
            )}
          </div>
        )}

        {activeTab === 'Crews' && (
          <div className="space-y-4">
            {userStats.crewsJoined === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No crews joined yet</p>
                <button 
                  onClick={() => setPage('crews')}
                  className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"
                >
                  Browse Crews
                </button>
              </div>
            ) : (
              <p className="text-gray-500 text-center">Your crews will appear here</p>
            )}
          </div>
        )}

        {activeTab === 'Saved' && (
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No saved items yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [posts, setPosts] = useState([]);
  const [donations, setDonations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [crews, setCrews] = useState([
    { id: 1, name: 'Atomic Habits', author: 'James Clear', genre: 'Self Improvement', members: 1, chats: 0, cover: '#E8A87C' },
    { id: 2, name: 'Tuesdays with Morrie', author: 'Mitch Albom', genre: 'Inspiration', members: 1, chats: 0, cover: '#C8622A' },
    { id: 3, name: 'The Alchemist', author: 'Paulo Coelho', genre: 'Fiction', members: 1, chats: 0, cover: '#7B9EA6' },
    { id: 4, name: 'Sapiens', author: 'Yuval Harari', genre: 'History', members: 1, chats: 0, cover: '#C4A882' },
  ]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
        loadUserData(user);
        
        // Load crews from localStorage
        const savedCrews = JSON.parse(localStorage.getItem('crews') || '[]');
        if (savedCrews.length > 0) {
          setCrews(savedCrews);
        }
      } catch (error) {
        console.error('Error loading saved user:', error);
      }
    }
  }, []);

  const loadUserData = async (user) => {
    try {
      const userPosts = JSON.parse(localStorage.getItem(`user_${user.email}_posts`) || '[]');
      setPosts(userPosts);
      
      // Check for unread notifications
      const notifications = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
      const unread = notifications.filter(n => !n.read).length;
      setUnreadMessages(unread);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
    setCurrentPage('home');
    loadUserData(userData);
  };

  const handlePost = (postData) => {
    const updatedPosts = [postData, ...posts];
    setPosts(updatedPosts);
    
    localStorage.setItem(`user_${currentUser.email}_posts`, JSON.stringify(updatedPosts));
    
    const updatedStats = {
      ...currentUser.stats,
      postsCreated: (currentUser.stats?.postsCreated || 0) + 1
    };
    
    const updatedUser = {
      ...currentUser,
      stats: updatedStats
    };
    
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    localStorage.setItem(`user_${currentUser.email}_stats`, JSON.stringify(updatedStats));
    
    showNotification('Post created successfully!', 'success');
  };

  const handleCreateCrew = (book) => {
    const newCrew = {
      id: Date.now(),
      name: book.title,
      author: book.author,
      genre: book.genre || 'General',
      members: 1,
      chats: 0,
      cover: '#C8622A',
      createdBy: currentUser.email,
      createdAt: new Date().toISOString(),
      messages: []
    };
    
    const updatedCrews = [newCrew, ...crews];
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));
    
    showNotification(`Crew "${book.title}" created! Invite friends to join.`, 'success');
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateStats = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const handleNotificationClick = () => {
    setShowNotifications(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto">
          <LoginPage onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {notification && (
        <div className={`fixed top-4 right-4 left-4 max-w-md mx-auto px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg z-[100] ${
          notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'error' ? 'bg-red-500' :
          'bg-blue-500'
        }`}>
          {notification.message}
        </div>
      )}

      {showNotifications && (
        <NotificationsPage 
          user={currentUser} 
          setPage={setCurrentPage}
          onClose={() => {
            setShowNotifications(false);
            setUnreadMessages(0);
          }} 
        />
      )}

      <div className="max-w-md mx-auto relative">
        {currentPage === 'home' && (
          <HomePage 
            user={currentUser}
            posts={posts}
            setPosts={setPosts}
            crews={crews}
            donations={donations}
            reviews={reviews}
            setPage={setCurrentPage}
            onUpdateStats={handleUpdateStats}
          />
        )}
        
        {currentPage === 'explore' && (
          <ExplorePage 
            user={currentUser} 
            setPage={setCurrentPage}
            onCreateCrew={handleCreateCrew}
          />
        )}
        
        {currentPage === 'post' && (
          <PostPage 
            user={currentUser} 
            onPost={handlePost} 
            setPage={setCurrentPage} 
          />
        )}
        
        {currentPage === 'crews' && (
          <CrewsPage 
            user={currentUser} 
            crews={crews}
            setPage={setCurrentPage} 
          />
        )}
        
        {currentPage === 'reviews' && (
          <ReviewsPage 
            user={currentUser}
            setPage={setCurrentPage}
          />
        )}
        
        {currentPage === 'profile' && (
          <ProfilePage 
            user={currentUser} 
            posts={posts} 
            setPage={setCurrentPage}
            onUpdateStats={handleUpdateStats}
            onLogout={() => { 
              setIsLoggedIn(false); 
              setCurrentUser(null); 
              localStorage.removeItem('currentUser');
              setCurrentPage('home');
            }} 
          />
        )}
        
        <BottomNav 
          active={currentPage} 
          setPage={setCurrentPage} 
          unreadCount={unreadMessages}
        />
      </div>
    </div>
  );
}