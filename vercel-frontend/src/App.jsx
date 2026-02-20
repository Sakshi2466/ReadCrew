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

// ========================================
// DYNAMIC BOOK COVER FETCHER (No ISBN Needed!)
// ========================================

const DynamicBookCover = ({ 
  title, 
  author, 
  className = 'w-32 h-40',
  onClick,
  size = 'md' 
}) => {
  const [coverUrl, setCoverUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Size mappings
  const sizeMap = {
    xs: 'w-12 h-16',
    sm: 'w-16 h-20',
    md: 'w-24 h-32',
    lg: 'w-32 h-40',
    xl: 'w-40 h-48'
  };

  const coverClassName = sizeMap[size] || className;

  useEffect(() => {
    if (!title) {
      setError(true);
      setIsLoading(false);
      return;
    }

    fetchBookCover();
  }, [title, author]);

  const fetchBookCover = async () => {
    setIsLoading(true);
    setError(false);

    try {
      // Build search query
      const query = author 
        ? `${title} ${author}`.trim()
        : title;
      
      const searchQuery = encodeURIComponent(query);

      // Search Open Library
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${searchQuery}&limit=1`
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();

      if (data.docs && data.docs.length > 0) {
        const book = data.docs[0];

        // Try to get cover (multiple methods)
        let cover = null;

        // Method 1: cover_i (most common)
        if (book.cover_i) {
          cover = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
        }
        // Method 2: ISBN
        else if (book.isbn && book.isbn.length > 0) {
          cover = `https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-L.jpg`;
        }
        // Method 3: OLID (Open Library ID)
        else if (book.cover_edition_key) {
          cover = `https://covers.openlibrary.org/b/olid/${book.cover_edition_key}-L.jpg`;
        }

        if (cover) {
          setCoverUrl(cover);
        } else {
          setError(true);
        }
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error fetching book cover:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate fallback color based on title
  const getFallbackColor = () => {
    const colors = [
      '#7B9EA6', '#C8622A', '#8B5E3C', '#E8A87C', '#C4A882',
      '#2C3E50', '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C',
      '#27AE60', '#F39C12', '#D35400', '#8E44AD', '#16A085'
    ];
    const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const initials = title ? title.slice(0, 2).toUpperCase() : 'BK';
  const fallbackColor = getFallbackColor();

  // Loading state
  if (isLoading) {
    return (
      <div 
        className={`${coverClassName} bg-gray-200 rounded-xl flex items-center justify-center animate-pulse`}
        onClick={onClick}
      >
        <BookOpen className="w-8 h-8 text-gray-400 animate-pulse" />
      </div>
    );
  }

  // Error state or no cover - show initials
  if (error || !coverUrl) {
    return (
      <div 
        className={`${coverClassName} rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg cursor-pointer group hover:scale-105 transition-transform`}
        style={{ backgroundColor: fallbackColor }}
        onClick={onClick}
      >
        <span className="text-3xl">{initials}</span>
        <BookOpen className="w-6 h-6 mt-2 opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  }

  // Success - show cover
  return (
    <div className={`${coverClassName} relative group cursor-pointer`} onClick={onClick}>
      <img
        src={coverUrl}
        alt={`${title} cover`}
        className="w-full h-full rounded-xl object-cover shadow-lg group-hover:scale-105 transition-transform"
        onError={() => setError(true)}
        loading="lazy"
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-xl" />
    </div>
  );
};

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

// ─── BOTTOM NAV (TAB BAR) ────────────────────────────────────────────────────
const BottomNav = ({ active, setPage, unreadCount = 0, show = true }) => {
  if (!show) return null;
  
  const items = [
    { id: 'home', icon: BookOpen, label: 'Home' },
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
const TopBar = ({ user, setPage, title, showBack = false, onBack, showProfile = true, onNotificationClick, notificationCount = 0 }) => (
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
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {notificationCount}
            </span>
          )}
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
                    notif.type === 'comment' ? 'bg-blue-100' : 
                    notif.type === 'message' ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    {notif.type === 'like' && <Heart className="w-4 h-4 text-red-500" />}
                    {notif.type === 'comment' && <MessageCircle className="w-4 h-4 text-blue-500" />}
                    {notif.type === 'message' && <MessageSquare className="w-4 h-4 text-green-500" />}
                    {notif.type === 'invite' && <UserPlus className="w-4 h-4 text-purple-500" />}
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
          joinedCrews: [],
          likedPosts: [], // Track liked posts
          likedReviews: [], // Track liked reviews
          likedMessages: [] // Track liked messages
        };

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push(userData);
        localStorage.setItem('users', JSON.stringify(users));
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem(`user_${userData.email}_stats`, JSON.stringify(userData.stats));
        localStorage.setItem(`user_${userData.email}_joinedCrews`, JSON.stringify([]));
        localStorage.setItem(`user_${userData.email}_notifications`, JSON.stringify([]));
        localStorage.setItem(`user_${userData.email}_likedPosts`, JSON.stringify([]));
        localStorage.setItem(`user_${userData.email}_likedReviews`, JSON.stringify([]));
        localStorage.setItem(`user_${userData.email}_likedMessages`, JSON.stringify([]));

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
          joinedCrews: [],
          likedPosts: [],
          likedReviews: [],
          likedMessages: []
        };
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push(userData);
        localStorage.setItem('users', JSON.stringify(users));
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem(`user_${userData.email}_stats`, JSON.stringify(userData.stats));
        localStorage.setItem(`user_${userData.email}_joinedCrews`, JSON.stringify([]));
        localStorage.setItem(`user_${userData.email}_notifications`, JSON.stringify([]));
        localStorage.setItem(`user_${userData.email}_likedPosts`, JSON.stringify([]));
        localStorage.setItem(`user_${userData.email}_likedReviews`, JSON.stringify([]));
        localStorage.setItem(`user_${userData.email}_likedMessages`, JSON.stringify([]));
        
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
        {/* Logo Section */}
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

// Validation functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateName = (name) => name && name.trim().length >= 2;

// ─── HOME PAGE ──────────────────────────────────────────────────────────────
const HomePage = ({ user, posts, setPosts, crews, setPage, donations, reviews, onUpdateStats, updateNotificationCount }) => {
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

  // Liked posts tracking
  const [likedPosts, setLikedPosts] = useState([]);

  useEffect(() => {
    loadTrendingBooks();
    loadFeedPosts();
    calculateReadingProgress();
    loadLikedPosts();
    
    // Update stats from localStorage
    const savedStats = localStorage.getItem(`user_${user.email}_stats`);
    if (savedStats) {
      setUserStats(JSON.parse(savedStats));
    }
  }, [user?.stats?.booksRead, user?.joinedCrews]);

  const loadLikedPosts = () => {
    const savedLikedPosts = JSON.parse(localStorage.getItem(`user_${user.email}_likedPosts`) || '[]');
    setLikedPosts(savedLikedPosts);
  };

  const loadTrendingBooks = async () => {
    setLoadingTrending(true);
    try {
      const response = await fetch(`${API_URL}/api/recommend/trending`);
      const data = await response.json();
      
      if (data.success) {
        setTrendingBooks(data.books);
      } else {
        // Fallback to mock data
        const mockBooks = [
          { id: 1, title: 'Atomic Habits', author: 'James Clear', rating: 4.8, readers: 15420 },
          { id: 2, title: 'The Psychology of Money', author: 'Morgan Housel', rating: 4.7, readers: 12350 },
          { id: 3, title: 'Deep Work', author: 'Cal Newport', rating: 4.6, readers: 9870 },
          { id: 4, title: 'Sapiens', author: 'Yuval Harari', rating: 4.8, readers: 21500 },
        ];
        setTrendingBooks(mockBooks);
      }
    } catch (error) {
      console.error('Error loading trending books:', error);
      const mockBooks = [
        { id: 1, title: 'Atomic Habits', author: 'James Clear', rating: 4.8, readers: 15420 },
        { id: 2, title: 'The Psychology of Money', author: 'Morgan Housel', rating: 4.7, readers: 12350 },
        { id: 3, title: 'Deep Work', author: 'Cal Newport', rating: 4.6, readers: 9870 },
        { id: 4, title: 'Sapiens', author: 'Yuval Harari', rating: 4.8, readers: 21500 },
      ];
      setTrendingBooks(mockBooks);
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

  // FIXED: Single like per user
  const handleLikePost = (postId, post) => {
    // Check if already liked
    if (likedPosts.includes(postId)) {
      alert('You have already liked this post');
      return;
    }

    // Update liked posts
    const updatedLikedPosts = [...likedPosts, postId];
    setLikedPosts(updatedLikedPosts);
    localStorage.setItem(`user_${user.email}_likedPosts`, JSON.stringify(updatedLikedPosts));

    // Update post likes count
    setFeedPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, likes: (p.likes || 0) + 1, liked: true } : p
    ));

    // Update in main posts array
    const updatedPosts = posts.map(p => 
      p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
    );
    setPosts(updatedPosts);
    localStorage.setItem(`user_${post.userEmail}_posts`, JSON.stringify(updatedPosts.filter(p => p.userEmail === post.userEmail)));

    // Create notification for post owner
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
      
      // Update notification count in parent
      updateNotificationCount();
    }
  };

  const handleComment = (postId) => {
    const comment = prompt('Enter your comment:');
    if (comment) {
      setFeedPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p
      ));
      
      // Create notification
      const post = feedPosts.find(p => p.id === postId);
      if (post && post.userEmail !== user.email) {
        const notification = {
          id: Date.now(),
          type: 'comment',
          fromUser: user.name,
          fromUserEmail: user.email,
          postId: postId,
          comment: comment,
          message: `${user.name} commented on your post: "${comment.substring(0, 30)}${comment.length > 30 ? '...' : ''}"`,
          timestamp: new Date().toISOString(),
          read: false
        };
        
        const userNotifications = JSON.parse(localStorage.getItem(`user_${post.userEmail}_notifications`) || '[]');
        userNotifications.unshift(notification);
        localStorage.setItem(`user_${post.userEmail}_notifications`, JSON.stringify(userNotifications));
        
        // Update notification count in parent
        updateNotificationCount();
      }
    }
  };

  const handleShare = (postId) => {
    setFeedPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, shares: (p.shares || 0) + 1 } : p
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
                    <DynamicBookCover 
                      title={selectedBook.title}
                      author={selectedBook.author}
                      size="lg"
                    />
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
                          createdBy: user.email,
                          createdByName: user.name,
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
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Welcome, {user?.name?.split(' ')[0]}! 📚</h2>
              <p className="text-orange-100 text-sm mt-1">Ready for your next reading adventure?</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
          
          {/* Reading Progress */}
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

        {/* Quick Stats */}
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
                      onClick={() => handleLikePost(post.id, post)}
                      className={`flex items-center gap-1.5 text-xs ${likedPosts.includes(post.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                      disabled={likedPosts.includes(post.id)}
                    >
                      <Heart className={`w-4 h-4 ${likedPosts.includes(post.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{post.likes || 0}</span>
                    </button>
                    <button 
                      onClick={() => handleComment(post.id)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-500"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments || 0}</span>
                    </button>
                    <button 
                      onClick={() => handleShare(post.id)}
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
                  <DynamicBookCover 
                    title={book.title}
                    author={book.author}
                    size="md"
                    className="mb-2"
                  />
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
                <div className="h-16 flex items-center justify-center p-2 bg-gray-50">
                  <DynamicBookCover 
                    title={crew.name}
                    author={crew.author}
                    size="xs"
                  />
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
      const fallbackBooks = [
        { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', description: 'Tiny changes, remarkable results', rating: 4.8 },
        { title: 'The Martian', author: 'Andy Weir', genre: 'Sci-Fi', description: 'Survival on Mars', rating: 4.7 },
        { title: 'Deep Work', author: 'Cal Newport', genre: 'Productivity', description: 'Focused success in a distracted world', rating: 4.6 },
        { title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi', description: 'Epic desert planet saga', rating: 4.5 },
      ];
      setResults(fallbackBooks);
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
                      <DynamicBookCover 
                        title={book.title}
                        author={book.author}
                        size="md"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-[#2D2419]">{book.title}</h3>
                        <p className="text-sm text-[#9B8E84]">by {book.author}</p>
                        {book.genre && (
                          <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                            {book.genre}
                          </span>
                        )}
                        {book.description && (
                          <p className="text-xs text-[#6B5D52] mt-2 line-clamp-2">{book.description}</p>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          <StarRating rating={book.rating || 4} size="xs" />
                          <span className="text-xs text-gray-500">{book.rating || 4.0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => handleJoinCrew(book)} 
                        className="flex-1 py-2.5 bg-[#C8622A] text-white rounded-xl text-sm font-semibold"
                      >
                        Join Crew
                      </button>
                      <button 
                        onClick={() => handleInvite(book)} 
                        className="px-4 py-2.5 border border-[#EDE8E3] rounded-xl"
                      >
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
const ReviewsPage = ({ user, setPage, updateNotificationCount }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [likedReviews, setLikedReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    bookName: '',
    author: '',
    rating: 5,
    review: '',
    sentiment: 'positive'
  });

  useEffect(() => {
    loadReviews();
    loadLikedReviews();
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

  const loadLikedReviews = () => {
    const savedLikedReviews = JSON.parse(localStorage.getItem(`user_${user.email}_likedReviews`) || '[]');
    setLikedReviews(savedLikedReviews);
  };

  // FIXED: Single like per review
  const handleLikeReview = (reviewId, review) => {
    if (likedReviews.includes(reviewId)) {
      alert('You have already liked this review');
      return;
    }

    const updatedLikedReviews = [...likedReviews, reviewId];
    setLikedReviews(updatedLikedReviews);
    localStorage.setItem(`user_${user.email}_likedReviews`, JSON.stringify(updatedLikedReviews));

    // Update review likes
    const updatedReviews = reviews.map(r => 
      r.id === reviewId ? { ...r, likes: (r.likes || 0) + 1 } : r
    );
    setReviews(updatedReviews);
    localStorage.setItem('reviews', JSON.stringify(updatedReviews));

    // Create notification
    if (review.userEmail !== user.email) {
      const notification = {
        id: Date.now(),
        type: 'like',
        fromUser: user.name,
        fromUserEmail: user.email,
        reviewId: reviewId,
        message: `${user.name} liked your review of "${review.bookName}"`,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      const userNotifications = JSON.parse(localStorage.getItem(`user_${review.userEmail}_notifications`) || '[]');
      userNotifications.unshift(notification);
      localStorage.setItem(`user_${review.userEmail}_notifications`, JSON.stringify(userNotifications));
      
      updateNotificationCount();
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
        createdAt: new Date().toISOString(),
        likes: 0
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
                <div className="flex items-start gap-3 mb-2">
                  <DynamicBookCover 
                    title={review.bookName}
                    author={review.author}
                    size="sm"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{review.bookName}</h3>
                    <p className="text-xs text-gray-500">by {review.author}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <StarRating rating={review.rating} size="xs" />
                    </div>
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
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleLikeReview(review.id, review)}
                      className={`flex items-center gap-1 text-xs ${likedReviews.includes(review.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                      disabled={likedReviews.includes(review.id)}
                    >
                      <Heart className={`w-3 h-3 ${likedReviews.includes(review.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{review.likes || 0}</span>
                    </button>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      review.sentiment === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {review.sentiment === 'positive' ? '👍 Positive' : '👎 Negative'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── CREWS PAGE WITH FULL GROUP CHAT (LIKE WHATSAPP) ──────────────────────
const CrewsPage = ({ user, crews: initialCrews, setPage, updateNotificationCount }) => {
  const [view, setView] = useState('list'); // 'list', 'detail', 'chat'
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
  });
  const [selectedTab, setSelectedTab] = useState('chat'); // 'chat', 'members', 'media'
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

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
        email: u.email,
        initials: u.name?.slice(0, 2),
        color: '#C8622A',
        online: Math.random() > 0.5 // Random online status for demo
      }));
    
    // Add creator if not in list
    if (!members.find(m => m.email === selectedCrew.createdBy)) {
      members.push({
        id: selectedCrew.createdBy,
        name: selectedCrew.createdByName || 'Creator',
        email: selectedCrew.createdBy,
        initials: selectedCrew.createdByName?.slice(0, 2) || 'CR',
        color: '#C8622A',
        online: true,
        isCreator: true
      });
    }
    
    setCrewMembers(members);
  };

  const loadSimilarBooks = async () => {
    try {
      const mockSimilar = [
        { id: 101, title: 'The Five People You Meet in Heaven', author: 'Mitch Albom', rating: 4.5 },
        { id: 102, title: 'For One More Day', author: 'Mitch Albom', rating: 4.3 },
        { id: 103, title: 'The Time Keeper', author: 'Mitch Albom', rating: 4.4 },
        { id: 104, title: 'The Alchemist', author: 'Paulo Coelho', rating: 4.7 }
      ];
      setSimilarBooks(mockSimilar);
    } catch (error) {
      console.error('Error loading similar books:', error);
    }
  };

  // FIXED: Message input always visible at bottom
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedCrew || !isUserJoined(selectedCrew.id)) return;

    const message = {
      id: Date.now(),
      userId: user.id,
      userName: user.name,
      userInitials: user.name?.slice(0, 2),
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    // Save to localStorage
    const existingMessages = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`) || '[]');
    existingMessages.push(message);
    localStorage.setItem(`crew_${selectedCrew.id}_messages`, JSON.stringify(existingMessages));

    setMessages(prev => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);
    setNewMessage('');

    // Notify other crew members
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
      if (member.email !== user.email) {
        const memberNotifications = JSON.parse(localStorage.getItem(`user_${member.email}_notifications`) || '[]');
        memberNotifications.unshift(notification);
        localStorage.setItem(`user_${member.email}_notifications`, JSON.stringify(memberNotifications));
      }
    });

    // Update notification count in parent
    updateNotificationCount();
  };

  const handleSendImage = (e) => {
    const file = e.target.files[0];
    if (file && selectedCrew && isUserJoined(selectedCrew.id)) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const message = {
          id: Date.now(),
          userId: user.id,
          userName: user.name,
          userInitials: user.name?.slice(0, 2),
          content: ev.target.result,
          timestamp: new Date().toISOString(),
          type: 'image'
        };

        // Save to localStorage
        const existingMessages = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`) || '[]');
        existingMessages.push(message);
        localStorage.setItem(`crew_${selectedCrew.id}_messages`, JSON.stringify(existingMessages));

        setMessages(prev => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);
      };
      reader.readAsDataURL(file);
    }
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
      createdByName: user.name,
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
      
      updateNotificationCount();

      alert(`Invitation sent to ${friendEmail}!`);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const groupMessagesByDate = () => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    messages.forEach(msg => {
      const msgDate = new Date(msg.timestamp).toDateString();
      if (msgDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = msgDate;
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  const JoinMessageToast = () => (
    <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg z-[100] animate-slideDown">
      {joinMessage}
    </div>
  );

  // ========== CHAT VIEW (WhatsApp Style) ==========
  if (view === 'chat' && selectedCrew) {
    const hasJoined = isUserJoined(selectedCrew.id);
    const messageGroups = groupMessagesByDate();

    return (
      <div className="h-screen flex flex-col bg-gray-100">
        {showJoinMessage && <JoinMessageToast />}

        {/* Chat Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('detail')} className="p-1 hover:bg-gray-100 rounded-full">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="relative">
              <DynamicBookCover 
                title={selectedCrew.name}
                author={selectedCrew.author}
                size="xs"
              />
              {hasJoined && (
                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{selectedCrew.name}</p>
              <p className="text-xs text-gray-500">
                {crewMembers.length} member{crewMembers.length !== 1 ? 's' : ''} • 
                {crewMembers.filter(m => m.online).length} online
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Chat Messages Area - WhatsApp style bubbles */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 bg-[#e5ddd5]">
          {!hasJoined ? (
            <div className="flex flex-col items-center justify-center h-full text-center bg-white/80 rounded-xl p-8">
              <Lock className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-700 font-medium mb-2">This chat is private</p>
              <p className="text-gray-500 text-sm mb-4">Join this crew to see messages</p>
              <button
                onClick={() => handleJoinCrew(selectedCrew)}
                className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium shadow-lg"
              >
                Join Crew
              </button>
            </div>
          ) : (
            <>
              {messageGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {/* Date Separator */}
                  <div className="flex justify-center mb-4">
                    <span className="bg-gray-300/80 text-gray-700 text-xs px-3 py-1 rounded-full">
                      {new Date(group.date).toLocaleDateString(undefined, { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>

                  {/* Messages */}
                  {group.messages.map((msg, msgIndex) => {
                    const isOwn = msg.userId === user.id;
                    const showAvatar = !isOwn && (msgIndex === 0 || group.messages[msgIndex - 1].userId !== msg.userId);
                    
                    return (
                      <div key={msg.id} className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar - only show for first message in a row from same user */}
                          {!isOwn && showAvatar && (
                            <div className="w-8 h-8 mr-2 flex-shrink-0 self-end mb-1">
                              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {msg.userInitials}
                              </div>
                            </div>
                          )}
                          {!isOwn && !showAvatar && <div className="w-8 mr-2 flex-shrink-0"></div>}
                          
                          {/* Message Bubble */}
                          <div>
                            {/* Sender name - only show for others on first message */}
                            {!isOwn && showAvatar && (
                              <p className="text-xs text-gray-600 mb-1 ml-1">{msg.userName}</p>
                            )}
                            
                            <div className={`rounded-2xl px-4 py-2.5 ${
                              isOwn 
                                ? 'bg-[#dcf8c6] rounded-br-none' 
                                : 'bg-white rounded-bl-none'
                            } shadow-sm`}>
                              {msg.type === 'image' ? (
                                <img src={msg.content} alt="Shared" className="max-w-full rounded-lg max-h-64" />
                              ) : (
                                <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                              )}
                              <p className={`text-[10px] mt-1 text-right ${
                                isOwn ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                {formatMessageTime(msg.timestamp)}
                                {isOwn && (
                                  <span className="ml-1">
                                    ✓✓
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start mb-2">
                  <div className="flex max-w-[75%]">
                    <div className="w-8 h-8 mr-2 flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        ...
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Chat Input - ALWAYS VISIBLE at bottom */}
        {hasJoined && (
          <div className="bg-gray-100 border-t border-gray-200 px-3 py-3">
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-1 shadow-sm">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Plus className="w-5 h-5 text-orange-500" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleSendImage}
              />
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
                className="flex-1 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none"
                placeholder="Type a message..."
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className={`p-2 rounded-full ${
                  newMessage.trim() 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========== CREW DETAIL VIEW ==========
  if (view === 'detail' && selectedCrew) {
    const hasJoined = isUserJoined(selectedCrew.id);

    return (
      <div className="h-screen flex flex-col bg-white">
        {showJoinMessage && <JoinMessageToast />}
        
        {/* Detail Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => setView('list')} className="p-1 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900 flex-1">Crew Info</span>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Cover & Basic Info */}
          <div className="bg-gradient-to-b from-orange-50 to-white px-4 pt-6 pb-4">
            <div className="flex flex-col items-center text-center">
              <DynamicBookCover 
                title={selectedCrew.name}
                author={selectedCrew.author}
                size="xl"
                className="mb-4"
              />
              <h1 className="text-2xl font-bold text-gray-900">{selectedCrew.name}</h1>
              <p className="text-gray-600">by {selectedCrew.author}</p>
              <span className="mt-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                {selectedCrew.genre}
              </span>
              
              {/* Stats */}
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{crewMembers.length}</p>
                  <p className="text-xs text-gray-500">Members</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{messages.length}</p>
                  <p className="text-xs text-gray-500">Messages</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">4.5</p>
                  <p className="text-xs text-gray-500">Rating</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 w-full">
                {!hasJoined ? (
                  <button 
                    onClick={() => handleJoinCrew(selectedCrew)}
                    className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold"
                  >
                    Join Crew
                  </button>
                ) : (
                  <button 
                    onClick={() => setView('chat')}
                    className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold"
                  >
                    Go to Chat
                  </button>
                )}
                <button 
                  onClick={() => handleAddFriend(selectedCrew)}
                  className="px-4 py-3 border border-gray-200 rounded-xl"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-4">
            {['Chat', 'Members', 'Media', 'About'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab.toLowerCase())}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${
                  selectedTab === tab.toLowerCase()
                    ? 'text-orange-500 border-orange-500'
                    : 'text-gray-500 border-transparent'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 pb-24">
            {selectedTab === 'chat' && (
              <div className="space-y-4">
                {hasJoined ? (
                  <>
                    <button
                      onClick={() => setView('chat')}
                      className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Open Chat
                    </button>
                    
                    {/* Recent messages preview */}
                    {messages.slice(-3).reverse().map((msg) => (
                      <div key={msg.id} className="flex items-start gap-3 py-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {msg.userInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{msg.userName}</span>
                            <span className="text-xs text-gray-400">
                              {formatMessageTime(msg.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Join this crew to see messages</p>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'members' && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  {crewMembers.length} Members
                </p>
                {crewMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">
                          {member.initials}
                        </div>
                        {member.online && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">
                          {member.isCreator ? 'Creator' : member.online ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                    {member.email !== user.email && (
                      <button className="text-sm text-orange-500 font-medium">
                        Message
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedTab === 'media' && (
              <div className="text-center py-12">
                <Image className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No media shared yet</p>
              </div>
            )}

            {selectedTab === 'about' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-600">
                    This crew is dedicated to discussing "{selectedCrew.name}" by {selectedCrew.author}. 
                    Join to share your thoughts, ask questions, and connect with other readers.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Crew Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created</span>
                      <span className="text-gray-900">
                        {new Date(selectedCrew.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created by</span>
                      <span className="text-gray-900">{selectedCrew.createdByName || 'Creator'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Genre</span>
                      <span className="text-gray-900">{selectedCrew.genre}</span>
                    </div>
                  </div>
                </div>

                {/* Leave button */}
                {hasJoined && (
                  <button
                    onClick={() => handleLeaveCrew(selectedCrew)}
                    className="w-full py-3 border border-red-200 text-red-500 rounded-xl font-medium mt-4"
                  >
                    Leave Crew
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========== CREW LIST VIEW ==========
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
                placeholder="Genre (e.g., Fiction, Self-Help)"
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

        {/* My Crews Section */}
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
                  onClick={() => { setSelectedCrew(crew); setView('detail'); }}
                >
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Joined
                  </div>
                  <div className="h-20 relative">
                    <div className="absolute inset-0 flex items-center px-4 gap-4">
                      <DynamicBookCover 
                        title={crew.name}
                        author={crew.author}
                        size="sm"
                      />
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
                  <div className="px-4 py-2 flex justify-end gap-2 border-t border-gray-100">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedCrew(crew); setView('chat'); }}
                      className="px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-xs font-medium"
                    >
                      Chat
                    </button>
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

        {/* Discover Crews Section */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Discover Crews</h2>
          <div className="space-y-3">
            {crews.filter(crew => !isUserJoined(crew.id)).map(crew => (
              <div
                key={crew.id}
                className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition"
                onClick={() => { setSelectedCrew(crew); setView('detail'); }}
              >
                <div className="h-20 relative">
                  <div className="absolute inset-0 flex items-center px-4 gap-4">
                    <DynamicBookCover 
                      title={crew.name}
                      author={crew.author}
                      size="sm"
                    />
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
                <div className="px-4 py-3 flex justify-between items-center border-t border-gray-100">
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

  // FIXED: Load profile image on mount and when user changes
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

  // FIXED: Profile image persists after tab changes
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const imageData = ev.target.result;
        setProfileImage(imageData);
        localStorage.setItem(`user_${user.email}_profile_image`, imageData);
        
        // Also update in users array for persistence
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = users.map(u => 
          u.email === user.email ? { ...u, profileImage: imageData } : u
        );
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        // Update current user
        const updatedUser = { ...user, profileImage: imageData };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
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
              <img src={profileImage} alt={user?.name} className="w-20 h-20 rounded-full object-cover border-2 border-orange-200" />
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
  const [showBottomNav, setShowBottomNav] = useState(true); // Control bottom nav visibility
  const [crews, setCrews] = useState([
    { id: 1, name: 'Atomic Habits', author: 'James Clear', genre: 'Self Improvement', members: 1, chats: 0 },
    { id: 2, name: 'Tuesdays with Morrie', author: 'Mitch Albom', genre: 'Inspiration', members: 1, chats: 0 },
    { id: 3, name: 'The Alchemist', author: 'Paulo Coelho', genre: 'Fiction', members: 1, chats: 0 },
    { id: 4, name: 'Sapiens', author: 'Yuval Harari', genre: 'History', members: 1, chats: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // FIXED: Hide bottom nav on pages where keyboard is needed
  useEffect(() => {
    // Hide bottom nav on chat and post pages (where keyboard is needed)
    if (currentPage === 'post' || (currentPage === 'crews' && window.location.hash.includes('chat'))) {
      setShowBottomNav(false);
    } else {
      setShowBottomNav(true);
    }
  }, [currentPage]);

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
      updateNotificationCount();
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // FIXED: Update notification count
  const updateNotificationCount = () => {
    const notifications = JSON.parse(localStorage.getItem(`user_${currentUser?.email}_notifications`) || '[]');
    const unread = notifications.filter(n => !n.read).length;
    setUnreadMessages(unread);
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
      createdBy: currentUser.email,
      createdByName: currentUser.name,
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
    // Mark all as read when opening
    updateNotificationCount();
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
            updateNotificationCount();
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
            updateNotificationCount={updateNotificationCount}
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
            updateNotificationCount={updateNotificationCount}
          />
        )}
        
        {currentPage === 'reviews' && (
          <ReviewsPage 
            user={currentUser}
            setPage={setCurrentPage}
            updateNotificationCount={updateNotificationCount}
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
        
        {/* Bottom Navigation - Only shows when keyboard isn't needed */}
        <BottomNav 
          active={currentPage} 
          setPage={setCurrentPage} 
          unreadCount={unreadMessages}
          show={showBottomNav}
        />
      </div>
    </div>
  );
}