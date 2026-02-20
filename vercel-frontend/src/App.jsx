import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen, Home, Search, Edit3, Users, User, Bell, Settings,
  Heart, MessageCircle, Bookmark, Share2, Star, Plus, ChevronRight,
  X, Send, Image, ChevronLeft, LogOut, Camera, MoreHorizontal,
  Sparkles, Lock, Eye, EyeOff, UserPlus, Gift, ThumbsUp, ThumbsDown,
  Trash2, Edit, Target, Check, ArrowLeft, Clock, TrendingUp, Menu, Upload,
  Calendar, Award, MessageSquare, Globe, ChevronDown, Filter,
  Paperclip, Mail, Phone
} from 'lucide-react';

import { donationAPI, reviewAPI, otpAPI, checkBackendConnection, getBookRecommendations, chatAPI, crewAPI, userAPI, bookCrewAPI, getTrendingBooks, aiChatAPI } from './services/api';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://versal-book-app.onrender.com';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateName = (name) => name && name.trim().length >= 2;

function getAvatarColor(str = '') {
  const palette = ['#C8622A','#7B9EA6','#8B5E3C','#5C7A5C','#9B6B9B','#5A7A9B','#A67C5B'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

// ─── PERSISTENT STORAGE HELPERS ──────────────────────────────────────────────
const storage = {
  get: (key, fallback = null) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  getRaw: (key) => localStorage.getItem(key),
  setRaw: (key, value) => localStorage.setItem(key, value),
};

// ─── DYNAMIC BOOK COVER ───────────────────────────────────────────────────────
export const DynamicBookCover = ({ title, author, size = 'md', onClick }) => {
  const [coverUrl, setCoverUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const sizeMap = { xs: 'w-10 h-14', sm: 'w-14 h-20', md: 'w-20 h-28', lg: 'w-28 h-36', xl: 'w-36 h-48' };
  const sz = sizeMap[size] || sizeMap.md;

  useEffect(() => {
    if (!title) { setError(true); setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setError(false); setCoverUrl(null);
    const query = encodeURIComponent(author ? `${title} ${author}` : title);
    fetch(`https://openlibrary.org/search.json?q=${query}&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const doc = data.docs?.[0];
        if (doc?.cover_i) setCoverUrl(`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`);
        else if (doc?.isbn?.[0]) setCoverUrl(`https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`);
        else setError(true);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [title, author]);

  const fallbackColor = (() => {
    const c = ['#7B9EA6','#C8622A','#8B5E3C','#E8A87C','#C4A882','#2C3E50','#9B59B6','#27AE60','#D35400'];
    const h = (title || '').split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
    return c[h % c.length];
  })();

  if (loading) return (
    <div className={`${sz} bg-gray-200 rounded-xl flex items-center justify-center animate-pulse flex-shrink-0`} onClick={onClick}>
      <BookOpen className="w-6 h-6 text-gray-400" />
    </div>
  );

  if (error || !coverUrl) return (
    <div className={`${sz} rounded-xl flex flex-col items-center justify-center text-white font-bold shadow cursor-pointer flex-shrink-0`}
      style={{ backgroundColor: fallbackColor }} onClick={onClick}>
      <span className="text-lg leading-none">{(title || '?').slice(0, 2).toUpperCase()}</span>
      <BookOpen className="w-4 h-4 mt-1 opacity-60" />
    </div>
  );

  return (
    <div className={`${sz} relative cursor-pointer flex-shrink-0`} onClick={onClick}>
      <img src={coverUrl} alt={title} className="w-full h-full rounded-xl object-cover shadow"
        onError={() => setError(true)} loading="lazy" />
    </div>
  );
};

export default DynamicBookCover;

// ─── AVATAR ───────────────────────────────────────────────────────────────────
const Avatar = ({ name = '', src, size = 'md', online = false }) => {
  const sizes = { xs: 'w-7 h-7 text-xs', sm: 'w-9 h-9 text-sm', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' };
  const color = getAvatarColor(name);
  return (
    <div className="relative flex-shrink-0">
      {src ? <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />
        : <div className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white`} style={{ background: color }}>
          {name.slice(0, 2).toUpperCase()}
        </div>}
      {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />}
    </div>
  );
};

// ─── STAR RATING ─────────────────────────────────────────────────────────────
const StarRating = ({ rating = 0, onChange, size = 'sm' }) => {
  const sz = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`${sz} ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} ${onChange ? 'cursor-pointer' : ''}`}
          onClick={() => onChange?.(i)} />
      ))}
    </div>
  );
};

// ─── SPINNER ─────────────────────────────────────────────────────────────────
const Spinner = ({ size = 'md' }) => {
  const s = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-4', lg: 'w-12 h-12 border-4' }[size];
  return <div className={`${s} border-orange-500 border-t-transparent rounded-full animate-spin`} />;
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type = 'success' }) => {
  if (!msg) return null;
  const bg = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  return (
    <div className={`fixed top-4 left-4 right-4 max-w-md mx-auto z-[200] ${bg} text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium`}>
      {msg}
    </div>
  );
};

// ─── BOTTOM NAV ──────────────────────────────────────────────────────────────
const BottomNav = ({ active, setPage, unread = 0, hidden = false }) => {
  if (hidden) return null;
  const items = [
    { id: 'home', icon: BookOpen, label: 'Home' },
    { id: 'explore', icon: Sparkles, label: 'Explore' },
    { id: 'post', icon: Edit3, label: 'Post', fab: true },
    { id: 'crews', icon: Users, label: 'Crews', badge: unread },
    { id: 'reviews', icon: Star, label: 'Reviews' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 z-50 shadow-2xl">
      <div className="flex items-center justify-around py-1 px-1">
        {items.map(({ id, icon: Icon, label, fab, badge }) => (
          <button key={id} onClick={() => setPage(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl relative transition-all ${active === id ? 'text-[#C8622A]' : 'text-gray-400'}`}>
            {fab ? (
              <div className={`w-11 h-11 rounded-full flex items-center justify-center -mt-6 shadow-lg transition-all ${active === id ? 'bg-[#C8622A]' : 'bg-gray-800'}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            ) : (
              <Icon className="w-5 h-5" strokeWidth={active === id ? 2.5 : 1.8} />
            )}
            {badge > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{badge > 9 ? '9+' : badge}</span>}
            <span className={`text-[10px] font-medium ${fab ? 'mt-1' : ''}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// ─── TOP BAR ─────────────────────────────────────────────────────────────────
const TopBar = ({ user, setPage, title, showBack, onBack, showRight = true, onBell, unread = 0, profileSrc }) => (
  <header className="sticky top-0 bg-white/95 backdrop-blur z-40 px-4 py-3 flex items-center justify-between border-b border-gray-100">
    <div className="flex items-center gap-2">
      {showBack && <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-lg mr-1"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>}
      <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow">
        <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
      <span className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Georgia, serif' }}>{title || 'ReadCrew'}</span>
    </div>
    {showRight && (
      <div className="flex items-center gap-2">
        <button onClick={onBell} className="relative p-1.5 hover:bg-gray-100 rounded-lg">
          <Bell className="w-5 h-5 text-gray-600" />
          {unread > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />}
        </button>
        <button onClick={() => setPage('profile')}>
          {profileSrc
            ? <img src={profileSrc} alt="profile" className="w-8 h-8 rounded-full object-cover" />
            : <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: getAvatarColor(user?.name || '') }}>{(user?.name || 'U').slice(0, 2).toUpperCase()}</div>}
        </button>
      </div>
    )}
  </header>
);

// ─── NOTIFICATIONS PAGE ──────────────────────────────────────────────────────
const NotificationsPage = ({ user, onClose }) => {
  const key = `notifications_${user.email}`;
  const [notifs, setNotifs] = useState(() => storage.get(key, []));

  const markAll = () => {
    const updated = notifs.map(n => ({ ...n, read: true }));
    setNotifs(updated);
    storage.set(key, updated);
  };

  const markOne = (id) => {
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifs(updated);
    storage.set(key, updated);
  };

  const iconMap = { like: { bg: 'bg-red-100', el: <Heart className="w-4 h-4 text-red-500" /> }, comment: { bg: 'bg-blue-100', el: <MessageCircle className="w-4 h-4 text-blue-500" /> }, message: { bg: 'bg-green-100', el: <MessageSquare className="w-4 h-4 text-green-500" /> }, invite: { bg: 'bg-purple-100', el: <UserPlus className="w-4 h-4 text-purple-500" /> }, review: { bg: 'bg-yellow-100', el: <Star className="w-4 h-4 text-yellow-500" /> } };

  return (
    <div className="fixed inset-0 bg-white z-[60] max-w-md mx-auto flex flex-col">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button onClick={onClose} className="p-1"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <h2 className="font-bold text-gray-900">Notifications</h2>
        <button onClick={markAll} className="text-sm text-orange-500 font-semibold">Mark all read</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {notifs.length === 0
          ? <div className="flex flex-col items-center justify-center h-full text-gray-400"><Bell className="w-12 h-12 mb-2" /><p className="text-sm">No notifications yet</p></div>
          : notifs.map(n => (
            <div key={n.id} className={`px-4 py-3 border-b border-gray-50 flex gap-3 items-start cursor-pointer ${n.read ? '' : 'bg-orange-50'}`} onClick={() => markOne(n.id)}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconMap[n.type]?.bg || 'bg-gray-100'}`}>{iconMap[n.type]?.el || <Bell className="w-4 h-4 text-gray-500" />}</div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{n.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(n.timestamp).toLocaleString()}</p>
              </div>
              {!n.read && <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />}
            </div>
          ))}
      </div>
    </div>
  );
};

// ─── PUSH NOTIFICATION HELPER ─────────────────────────────────────────────────
function pushNotification(toEmail, notif) {
  const key = `notifications_${toEmail}`;
  const existing = storage.get(key, []);
  existing.unshift({ id: Date.now() + Math.random(), timestamp: new Date().toISOString(), read: false, ...notif });
  storage.set(key, existing.slice(0, 100));
}

// ─── LOGIN PAGE ──────────────────────────────────────────────────────────────
const LoginPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [readingGoal, setReadingGoal] = useState({ yearly: 20, monthly: 5 });
  const [err, setErr] = useState('');

  const handleSendOTP = async () => {
    if (!validateName(name) || !validateEmail(email)) { setErr('Please fill all fields correctly'); return; }
    setLoading(true); setErr('');
    try {
      const result = await otpAPI.sendOTP({ name, email });
      if (result.success) { setOtpSent(true); }
      else {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        storage.setRaw('devOTP', otp);
        setOtpSent(true);
        setErr(`Dev OTP: ${otp}`);
      }
    } catch {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      storage.setRaw('devOTP', otp);
      setOtpSent(true);
      setErr(`Dev OTP: ${otp}`);
    } finally { setLoading(false); }
  };

  const createUser = () => {
    const userData = {
      id: Date.now().toString(), name, email, password,
      readingGoal, isVerified: true,
      createdAt: new Date().toISOString(),
      stats: { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 },
      joinedCrews: [],
    };
    const users = storage.get('users', []);
    const existing = users.findIndex(u => u.email === email);
    if (existing >= 0) users[existing] = userData; else users.push(userData);
    storage.set('users', users);
    storage.set('currentUser', userData);
    onLogin(userData);
  };

  const handleVerifyOTP = async () => {
    if (otpInput.length !== 6) { setErr('Enter 6-digit OTP'); return; }
    setLoading(true); setErr('');
    try {
      const result = await otpAPI.verifyOTP({ email, otp: otpInput });
      if (result.success) { createUser(); }
      else {
        const devOtp = storage.getRaw('devOTP');
        if (devOtp === otpInput) { storage.setRaw('devOTP', ''); createUser(); }
        else setErr('Invalid OTP');
      }
    } catch {
      const devOtp = storage.getRaw('devOTP');
      if (devOtp === otpInput) { storage.setRaw('devOTP', ''); createUser(); }
      else setErr('Invalid OTP');
    } finally { setLoading(false); }
  };

  const handleLogin = () => {
    const users = storage.get('users', []);
    const found = users.find(u => u.email === email && u.password === password);
    if (found) { storage.set('currentUser', found); onLogin(found); }
    else setErr('Invalid email or password');
  };

  if (otpSent) return (
    <div className="min-h-screen bg-[#FAF6F1] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-7 border border-gray-100">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mx-auto flex items-center justify-center mb-3"><BookOpen className="w-7 h-7 text-white" /></div>
          <h2 className="text-2xl font-bold text-gray-900">Verify Email</h2>
          <p className="text-sm text-gray-500 mt-1">Code sent to {email}</p>
        </div>
        {err && <p className="text-center text-sm mb-3 font-medium text-orange-600 bg-orange-50 rounded-lg p-2">{err}</p>}
        <input type="text" value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g,'').slice(0,6))}
          className="w-full text-center text-3xl tracking-[0.5em] py-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none mb-5" placeholder="——————" maxLength={6} autoFocus />
        <button onClick={handleVerifyOTP} disabled={loading || otpInput.length !== 6}
          className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-50 shadow-lg">
          {loading ? 'Verifying...' : 'Verify & Join'}
        </button>
        <button onClick={() => setOtpSent(false)} className="w-full mt-3 text-gray-400 text-sm flex items-center justify-center gap-1"><ArrowLeft className="w-4 h-4" />Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF6F1] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mx-auto flex items-center justify-center shadow-xl mb-3"><BookOpen className="w-10 h-10 text-white" /></div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent" style={{ fontFamily: 'Georgia, serif' }}>ReadCrew</h1>
          <p className="text-gray-500 text-sm mt-1">Read together. Grow together.</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-7 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-5">{isLogin ? 'Welcome Back!' : 'Join the Crew'}</h2>
          {err && <p className="text-sm text-red-500 bg-red-50 rounded-lg p-2 text-center mb-3">{err}</p>}
          <div className="space-y-3">
            {!isLogin && <>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <User className="w-4 h-4 text-gray-400" />
                <input value={name} onChange={e => setName(e.target.value)} className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder-gray-400" placeholder="Full Name" />
              </div>
              <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1"><Target className="w-3 h-3 text-orange-500" />Reading Goals (optional)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs text-gray-500">Yearly</label><input type="number" value={readingGoal.yearly} onChange={e => setReadingGoal({...readingGoal, yearly: +e.target.value})} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm mt-0.5 outline-none focus:border-orange-400" min="0" /></div>
                  <div><label className="text-xs text-gray-500">Monthly</label><input type="number" value={readingGoal.monthly} onChange={e => setReadingGoal({...readingGoal, monthly: +e.target.value})} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm mt-0.5 outline-none focus:border-orange-400" min="0" /></div>
                </div>
              </div>
            </>}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <input value={email} onChange={e => setEmail(e.target.value)} className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder-gray-400" placeholder="Email address" type="email" />
            </div>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <Lock className="w-4 h-4 text-gray-400" />
              <input value={password} onChange={e => setPassword(e.target.value)} type={showPass ? 'text' : 'password'} className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder-gray-400" placeholder="Password" />
              <button onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}</button>
            </div>
          </div>
          <button onClick={isLogin ? handleLogin : handleSendOTP} disabled={loading}
            className="w-full mt-5 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold shadow-lg disabled:opacity-50">
            {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Send OTP'}
          </button>
          <p className="text-center text-sm text-gray-500 mt-4">
            {isLogin ? "New here? " : "Have an account? "}
            <button onClick={() => { setIsLogin(!isLogin); setErr(''); }} className="text-orange-500 font-semibold">{isLogin ? 'Sign Up' : 'Log In'}</button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
const HomePage = ({ user, setPage, onBell, unread, profileSrc }) => {
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [feedPosts, setFeedPosts] = useState([]);
  const [stats, setStats] = useState(() => storage.get(`stats_${user.email}`, { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 }));
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookModal, setBookModal] = useState(false);
  const [bookDetail, setBookDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    loadTrending();
    loadFeed();
  }, []);

  const loadTrending = async () => {
    setLoadingTrending(true);
    try {
      const r = await fetch(`${API_URL}/api/recommend/trending`);
      const d = await r.json();
      if (d.success) setTrendingBooks(d.books);
      else throw new Error('');
    } catch {
      setTrendingBooks([
        { id:1, title:'Atomic Habits', author:'James Clear', rating:4.8, readers:15420 },
        { id:2, title:'The Psychology of Money', author:'Morgan Housel', rating:4.7, readers:12350 },
        { id:3, title:'Project Hail Mary', author:'Andy Weir', rating:4.8, readers:19870 },
        { id:4, title:'Sapiens', author:'Yuval Harari', rating:4.8, readers:21500 },
        { id:5, title:'The Midnight Library', author:'Matt Haig', rating:4.6, readers:17200 },
      ]);
    } finally { setLoadingTrending(false); }
  };

  const loadFeed = () => {
    const allPosts = storage.get('globalPosts', []);
    setFeedPosts(allPosts.slice(0, 20));
  };

  const handleLikePost = (postId) => {
    const likedKey = `liked_${user.email}`;
    const liked = storage.get(likedKey, []);
    if (liked.includes(postId)) return; // already liked – once only
    storage.set(likedKey, [...liked, postId]);

    const allPosts = storage.get('globalPosts', []);
    const updated = allPosts.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p);
    storage.set('globalPosts', updated);
    setFeedPosts(updated.slice(0, 20));

    const post = allPosts.find(p => p.id === postId);
    if (post && post.userEmail !== user.email) {
      pushNotification(post.userEmail, { type: 'like', message: `${user.name} liked your post "${post.bookName || 'your story'}"` });
    }
  };

  const handleComment = (postId) => {
    const text = prompt('Add a comment:');
    if (!text?.trim()) return;
    const allPosts = storage.get('globalPosts', []);
    const updated = allPosts.map(p => {
      if (p.id !== postId) return p;
      const comments = [...(p.comments || []), { id: Date.now(), user: user.name, text, ts: new Date().toISOString() }];
      return { ...p, commentCount: comments.length, comments };
    });
    storage.set('globalPosts', updated);
    setFeedPosts(updated.slice(0, 20));
    const post = allPosts.find(p => p.id === postId);
    if (post && post.userEmail !== user.email) {
      pushNotification(post.userEmail, { type: 'comment', message: `${user.name} commented on your post` });
    }
  };

  const handleBookClick = async (book) => {
    setSelectedBook(book); setBookModal(true); setLoadingDetail(true);
    try {
      const r = await axios.post(`${API_URL}/api/recommend/ai`, { query: `Tell me about "${book.title}" by ${book.author}` });
      setBookDetail(r.data.recommendations?.[0] || null);
    } catch { setBookDetail(null); }
    finally { setLoadingDetail(false); }
  };

  const readingGoal = user.readingGoal || { yearly: 0, monthly: 0 };
  const progress = readingGoal.yearly > 0 ? Math.min((stats.booksRead / readingGoal.yearly) * 100, 100) : 0;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <TopBar user={user} setPage={setPage} onBell={onBell} unread={unread} profileSrc={profileSrc} />

      {/* Book Detail Modal */}
      {bookModal && selectedBook && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-gray-900">Book Details</h3>
              <button onClick={() => setBookModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-5">
              {loadingDetail ? <div className="flex justify-center py-8"><Spinner /></div> : (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <DynamicBookCover title={selectedBook.title} author={selectedBook.author} size="lg" />
                    <div>
                      <h2 className="font-bold text-gray-900 text-lg">{selectedBook.title}</h2>
                      <p className="text-sm text-gray-500">by {selectedBook.author}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs">{bookDetail?.genre || 'Fiction'}</span>
                      <div className="flex items-center gap-1 mt-1"><StarRating rating={selectedBook.rating || 4} /><span className="text-xs text-gray-500 ml-1">{selectedBook.rating}</span></div>
                    </div>
                  </div>
                  {bookDetail?.description && <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">{bookDetail.description}</p>}
                  {bookDetail?.reason && <p className="text-sm text-orange-800 bg-orange-50 border border-orange-100 rounded-xl p-3"><span className="font-semibold">Why you'll love it: </span>{bookDetail.reason}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setBookModal(false); setPage('crews'); }} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold">Find a Crew</button>
                    <button onClick={() => setBookModal(false)} className="px-4 py-3 border border-gray-200 rounded-xl"><Bookmark className="w-5 h-5 text-gray-500" /></button>
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
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold">Hi, {user.name?.split(' ')[0]}! 📚</h2>
              <p className="text-orange-100 text-sm">Ready to read something amazing?</p>
            </div>
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center"><BookOpen className="w-6 h-6 text-white" /></div>
          </div>
          {readingGoal.yearly > 0 ? (
            <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex justify-between text-sm mb-1.5"><span>Yearly Progress</span><span className="font-semibold">{stats.booksRead} / {readingGoal.yearly}</span></div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden"><div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
              <div className="flex justify-between text-xs text-orange-100 mt-1"><span>Monthly: {stats.booksRead}/{readingGoal.monthly}</span><span>{Math.round(progress)}%</span></div>
            </div>
          ) : (
            <button onClick={() => setPage('profile')} className="w-full bg-white/20 hover:bg-white/30 rounded-xl py-2 text-sm font-medium">Set Reading Goals →</button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { l:'Books', v:stats.booksRead, icon:BookOpen, c:'text-blue-600', b:'bg-blue-50', p:'profile' },
            { l:'Reviews', v:stats.reviewsGiven, icon:Star, c:'text-yellow-600', b:'bg-yellow-50', p:'reviews' },
            { l:'Posts', v:stats.postsCreated, icon:Edit3, c:'text-green-600', b:'bg-green-50', p:'post' },
            { l:'Crews', v:stats.crewsJoined, icon:Users, c:'text-orange-600', b:'bg-orange-50', p:'crews' },
          ].map(({ l, v, icon: Icon, c, b, p }) => (
            <button key={l} onClick={() => setPage(p)} className={`${b} rounded-xl p-3 border border-white shadow-sm text-left`}>
              <Icon className={`w-4 h-4 ${c} mb-1`} />
              <p className="text-lg font-bold text-gray-900">{v}</p>
              <p className="text-xs text-gray-500">{l}</p>
            </button>
          ))}
        </div>

        {/* Trending Books */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-orange-500" />Trending Now</h2>
            <button onClick={() => setPage('explore')} className="text-sm text-orange-500 font-semibold">See All</button>
          </div>
          {loadingTrending
            ? <div className="flex gap-3 overflow-x-auto pb-2">{[...Array(4)].map((_,i) => <div key={i} className="shrink-0 w-24 h-32 bg-gray-200 rounded-xl animate-pulse" />)}</div>
            : <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {trendingBooks.map((b, i) => (
                <button key={i} onClick={() => handleBookClick(b)} className="shrink-0 w-24 text-left hover:scale-105 transition-transform">
                  <DynamicBookCover title={b.title} author={b.author} size="md" />
                  <p className="text-xs font-semibold text-gray-900 mt-1.5 leading-tight line-clamp-2">{b.title}</p>
                  <p className="text-xs text-gray-400">{b.author?.split(' ').slice(-1)[0]}</p>
                  <div className="flex items-center gap-0.5 mt-0.5"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span className="text-xs font-medium text-gray-600">{b.rating}</span></div>
                </button>
              ))}
            </div>}
        </div>

        {/* Create Post */}
        <button onClick={() => setPage('post')} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition">
          <Avatar name={user.name} src={profileSrc} size="sm" />
          <span className="text-sm text-gray-400 flex-1 text-left">Share your reading journey...</span>
          <span className="text-xs text-orange-500 font-semibold">Post</span>
        </button>

        {/* Feed */}
        <div>
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-orange-500" />Community Feed</h2>
          {feedPosts.length === 0
            ? <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No posts yet. Be the first!</p>
                <button onClick={() => setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold">Create Post</button>
              </div>
            : feedPosts.map((post) => {
              const likedKey = `liked_${user.email}`;
              const liked = storage.get(likedKey, []);
              const isLiked = liked.includes(post.id);
              return (
                <div key={post.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-3">
                  <div className="flex items-start gap-2.5 mb-2">
                    <Avatar name={post.userName} size="sm" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{post.userName}</p>
                      {post.bookName && <p className="text-xs text-gray-400 flex items-center gap-1"><BookOpen className="w-3 h-3 text-orange-400" />{post.bookName}</p>}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-2">{post.content}</p>
                  {post.image && <img src={post.image} alt="" className="w-full rounded-xl mb-2 object-cover max-h-60" />}
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-50">
                    <button onClick={() => handleLikePost(post.id)} className={`flex items-center gap-1 text-xs transition ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />{post.likes || 0}
                    </button>
                    <button onClick={() => handleComment(post.id)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400">
                      <MessageCircle className="w-4 h-4" />{post.commentCount || 0}
                    </button>
                    <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-400">
                      <Share2 className="w-4 h-4" />Share
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

// ─── EXPLORE PAGE ─────────────────────────────────────────────────────────────
const ExplorePage = ({ user, setPage }) => {
  const [query, setQuery] = useState('');
  const [intensity, setIntensity] = useState(50);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [tags, setTags] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const inputRef = useRef();

  const suggestions = query.toLowerCase().includes('space') ? ['Space exploration','Sci-fi adventure','NASA stories']
    : query.toLowerCase().includes('love') ? ['Romantic drama','Heartbreak & healing','Classic romance']
    : query.toLowerCase().includes('magic') ? ['High fantasy','Urban fantasy','Dark magic']
    : query ? [`${query} fiction`, `${query} non-fiction`, `Popular ${query}`] : ['Dark academia','Space opera','Cozy mystery','Historical fiction','Self-growth'];

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true); setSearched(true); setResults([]);
    const intensityLabel = intensity < 33 ? 'light and easy' : intensity < 66 ? 'moderately engaging' : 'deep and intense';
    try {
      const r = await axios.post(`${API_URL}/api/recommend/ai`, { query: `${query}. Books that are ${intensityLabel}` });
      if (r.data.success) setResults(r.data.recommendations || []);
      else throw new Error('');
    } catch {
      setResults([
        { title:'Atomic Habits', author:'James Clear', genre:'Self-Help', description:'Tiny changes, remarkable results.', rating:4.8 },
        { title:'The Martian', author:'Andy Weir', genre:'Sci-Fi', description:'Survival on Mars.', rating:4.7 },
        { title:'Dune', author:'Frank Herbert', genre:'Sci-Fi', description:'Epic desert planet saga.', rating:4.5 },
      ]);
    } finally { setLoading(false); }
  };

  const createCrew = (book) => {
    const crews = storage.get('crews', []);
    const existing = crews.find(c => c.name.toLowerCase() === book.title.toLowerCase());
    if (existing) { alert('Crew already exists! Join it in Crews tab.'); setPage('crews'); return; }
    const newCrew = { id: Date.now(), name: book.title, author: book.author, genre: book.genre || 'General', members: 1, chats: 0, createdBy: user.email, createdAt: new Date().toISOString() };
    storage.set('crews', [newCrew, ...crews]);
    // Auto-join
    const joined = storage.get(`joinedCrews_${user.email}`, []);
    storage.set(`joinedCrews_${user.email}`, [...joined, newCrew.id]);
    const s = storage.get(`stats_${user.email}`, {});
    storage.set(`stats_${user.email}`, { ...s, crewsJoined: (s.crewsJoined||0)+1 });
    alert(`Crew for "${book.title}" created!`); setPage('crews');
  };

  if (searched) return (
    <div className="min-h-screen bg-[#FAF6F1] pb-24">
      <div className="sticky top-0 bg-[#FAF6F1] z-40 px-4 py-3 flex items-center gap-3 border-b border-[#EDE8E3]">
        <button onClick={() => { setSearched(false); setResults([]); }} className="p-2 hover:bg-orange-50 rounded-xl"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <div className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-700">{query}</span>
        </div>
      </div>
      <div className="px-4 py-4">
        {loading ? <div className="flex flex-col items-center justify-center py-16"><div className="w-14 h-14 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4" /><p className="text-gray-500">Finding your perfect books...</p></div>
          : results.map((book, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm">
              <div className="flex gap-4">
                <DynamicBookCover title={book.title} author={book.author} size="md" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{book.title}</h3>
                  <p className="text-sm text-gray-500">by {book.author}</p>
                  {book.genre && <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{book.genre}</span>}
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{book.description}</p>
                  <StarRating rating={book.rating || 4} />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => createCrew(book)} className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold">Create Crew</button>
                <button onClick={() => { const users = storage.get('users',[]); const inv = prompt("Friend's email?"); if(inv) pushNotification(inv, { type:'invite', message:`${user.name} wants you to read "${book.title}" on ReadCrew!` }); alert('Invitation sent!'); }} className="px-4 py-2.5 border border-gray-200 rounded-xl"><UserPlus className="w-4 h-4 text-gray-500" /></button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-b from-[#F5E6D3] to-[#FAF6F1]">
      <div className="px-5 pt-12 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#2D1F14] leading-tight mb-2" style={{ fontFamily: 'Georgia, serif' }}>What do you feel like<br />reading today?</h1>
          <p className="text-[#8B7968] text-sm">Type a mood, topic, vibe, or genre</p>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-3xl p-5 shadow-lg border border-[#EDE8E3] mb-6">
          <div className="relative">
            <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setShowSugg(true); }} onFocus={() => setShowSugg(true)}
              onKeyDown={e => { if(e.key==='Enter') search(); }}
              placeholder="e.g. something dark and mysterious..."
              className="w-full bg-[#FAF8F5] border border-[#E8E0D8] rounded-2xl px-4 py-3.5 text-[#2D1F14] outline-none focus:border-[#C8622A] pr-12" />
            {query && <button onClick={() => { setQuery(''); setShowSugg(false); }} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
          </div>
          {showSugg && query && (
            <div className="mt-2 bg-[#FAF8F5] border border-[#E8E0D8] rounded-2xl overflow-hidden">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => { setQuery(s); setShowSugg(false); if(!tags.includes(s)) setTags([...tags, s]); }} className="w-full text-left px-4 py-3 hover:bg-[#F0E8DF] text-sm text-[#2D1F14] border-b border-[#EDE8E3] last:border-0">
                  <span className="mr-2">✨</span>{s}
                </button>
              ))}
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((t, i) => (
                <span key={i} className="flex items-center gap-1 bg-[#F0E8DF] text-[#6B5D52] text-xs px-3 py-1.5 rounded-full">
                  {t}<button onClick={() => setTags(tags.filter(x => x !== t))}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="mb-6">
          <p className="text-center text-sm text-[#6B5D52] font-medium mb-2">Reading intensity</p>
          <div className="flex items-center gap-3">
            <span className="text-base">☀️</span><span className="text-xs text-gray-500">Light</span>
            <input type="range" min="0" max="100" value={intensity} onChange={e => setIntensity(+e.target.value)}
              className="flex-1" style={{ accentColor: '#C8622A' }} />
            <span className="text-xs text-gray-500">Deep</span><span className="text-base">🌑</span>
          </div>
          <p className="text-xs text-orange-500 font-semibold text-center mt-1">{intensity < 33 ? 'Light & Breezy' : intensity < 66 ? 'Moderately Deep' : 'Deep & Intense'}</p>
        </div>
        <button onClick={search} disabled={!query.trim()} className="w-full py-4 rounded-2xl font-bold text-white shadow-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#C8622A,#A0481E)' }}>
          ✨ Find My Books
        </button>
      </div>
    </div>
  );
};

// ─── POST PAGE ────────────────────────────────────────────────────────────────
const PostPage = ({ user, setPage, profileSrc }) => {
  const [content, setContent] = useState('');
  const [bookName, setBookName] = useState('');
  const [author, setAuthor] = useState('');
  const [image, setImage] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

  const handleSubmit = () => {
    if (!content.trim()) return;
    setSubmitting(true);
    const post = {
      id: Date.now(), content, bookName, author, image, isPublic,
      userName: user.name, userEmail: user.email,
      createdAt: new Date().toISOString(), likes: 0, commentCount: 0, comments: [],
    };
    const existing = storage.get('globalPosts', []);
    storage.set('globalPosts', [post, ...existing]);
    // Update stats
    const s = storage.get(`stats_${user.email}`, {});
    storage.set(`stats_${user.email}`, { ...s, postsCreated: (s.postsCreated||0)+1 });
    setTimeout(() => { setSubmitting(false); setPage('home'); }, 300);
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-40">
        <button onClick={() => setPage('home')} className="p-1"><X className="w-5 h-5 text-gray-500" /></button>
        <h2 className="font-bold text-gray-900">Create Post</h2>
        <button onClick={handleSubmit} disabled={!content.trim() || submitting} className="px-4 py-1.5 bg-orange-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40">
          {submitting ? '...' : 'Share'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex gap-3 mb-4">
          <Avatar name={user.name} src={profileSrc} size="md" />
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} autoFocus
            className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-base resize-none"
            placeholder="What are you reading? Share your thoughts..." />
        </div>
        {image && <div className="relative mb-4"><img src={image} alt="preview" className="w-full rounded-2xl max-h-60 object-cover" /><button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 rounded-full p-1"><X className="w-4 h-4 text-white" /></button></div>}
        <div className="space-y-3 mb-4">
          <input value={bookName} onChange={e => setBookName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" placeholder="📖 Book name (optional)" />
          <input value={author} onChange={e => setAuthor(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" placeholder="✍️ Author (optional)" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700">
            <Camera className="w-4 h-4" />Photo
          </button>
          <button onClick={() => setIsPublic(!isPublic)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition ${isPublic ? 'bg-gray-100 text-gray-700' : 'bg-gray-800 text-white'}`}>
            {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}{isPublic ? 'Public' : 'Private'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
          const f = e.target.files[0]; if(!f) return;
          const reader = new FileReader(); reader.onload = ev => setImage(ev.target.result); reader.readAsDataURL(f);
        }} />
      </div>
    </div>
  );
};

// ─── REVIEWS PAGE ─────────────────────────────────────────────────────────────
const ReviewsPage = ({ user, setPage }) => {
  const [reviews, setReviews] = useState(() => storage.get('globalReviews', []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bookName: '', author: '', rating: 5, review: '', sentiment: 'positive' });
  const [err, setErr] = useState('');

  const submit = () => {
    if (!form.bookName || !form.author || !form.review) { setErr('Please fill all fields'); return; }
    const r = { id: Date.now(), ...form, userName: user.name, userEmail: user.email, createdAt: new Date().toISOString(), likes: 0 };
    const updated = [r, ...reviews];
    storage.set('globalReviews', updated);
    setReviews(updated);
    const s = storage.get(`stats_${user.email}`, {});
    storage.set(`stats_${user.email}`, { ...s, reviewsGiven: (s.reviewsGiven||0)+1 });
    setShowForm(false); setForm({ bookName:'', author:'', rating:5, review:'', sentiment:'positive' }); setErr('');
  };

  const likeReview = (id) => {
    const likedKey = `likedReview_${user.email}`;
    const liked = storage.get(likedKey, []);
    if (liked.includes(id)) return; // once only
    storage.set(likedKey, [...liked, id]);
    const updated = reviews.map(r => r.id === id ? { ...r, likes: (r.likes||0)+1 } : r);
    storage.set('globalReviews', updated);
    setReviews(updated);
    const rev = reviews.find(r => r.id === id);
    if (rev && rev.userEmail !== user.email) pushNotification(rev.userEmail, { type:'like', message:`${user.name} liked your review of "${rev.bookName}"` });
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-40">
        <button onClick={() => setPage('home')}><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <h2 className="font-bold text-gray-900">Book Reviews</h2>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-orange-500 text-white rounded-xl text-sm font-semibold">{showForm ? 'Cancel' : '+ Write'}</button>
      </div>
      <div className="px-4 py-4 space-y-4">
        {showForm && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3">Write a Review</h3>
            {err && <p className="text-red-500 text-sm mb-2">{err}</p>}
            <div className="space-y-3">
              <input value={form.bookName} onChange={e => setForm({...form, bookName:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" placeholder="Book name" />
              <input value={form.author} onChange={e => setForm({...form, author:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" placeholder="Author" />
              <div><p className="text-xs text-gray-500 mb-1">Rating</p><StarRating rating={form.rating} onChange={r => setForm({...form, rating:r})} size="lg" /></div>
              <textarea value={form.review} onChange={e => setForm({...form, review:e.target.value})} rows={4} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none resize-none" placeholder="Your honest review..." />
              <select value={form.sentiment} onChange={e => setForm({...form, sentiment:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none">
                <option value="positive">👍 Positive</option>
                <option value="negative">👎 Negative</option>
              </select>
              <button onClick={submit} className="w-full py-2.5 bg-orange-500 text-white rounded-xl font-semibold">Submit Review</button>
            </div>
          </div>
        )}
        {reviews.length === 0 ? (
          <div className="text-center py-12"><Star className="w-12 h-12 text-gray-200 mx-auto mb-2" /><p className="text-gray-400 text-sm">No reviews yet. Write the first!</p></div>
        ) : reviews.map(rev => {
          const likedKey = `likedReview_${user.email}`;
          const liked = storage.get(likedKey, []);
          const isLiked = liked.includes(rev.id);
          return (
            <div key={rev.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex gap-3 mb-2">
                <DynamicBookCover title={rev.bookName} author={rev.author} size="sm" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{rev.bookName}</h3>
                  <p className="text-xs text-gray-500">by {rev.author}</p>
                  <StarRating rating={rev.rating} />
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">{rev.review}</p>
              <div className="flex items-center justify-between border-t border-gray-50 pt-2">
                <div className="flex items-center gap-2">
                  <Avatar name={rev.userName} size="xs" />
                  <span className="text-xs text-gray-500">{rev.userName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${rev.sentiment === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {rev.sentiment === 'positive' ? '👍' : '👎'}
                  </span>
                  <button onClick={() => likeReview(rev.id)} className={`flex items-center gap-1 text-xs transition ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />{rev.likes||0}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── CREWS PAGE ───────────────────────────────────────────────────────────────
const CrewsPage = ({ user, setPage }) => {
  const [crews, setCrews] = useState(() => storage.get('crews', [
    { id:1, name:'Atomic Habits', author:'James Clear', genre:'Self Improvement', members:1 },
    { id:2, name:'Tuesdays with Morrie', author:'Mitch Albom', genre:'Inspiration', members:1 },
    { id:3, name:'The Alchemist', author:'Paulo Coelho', genre:'Fiction', members:1 },
    { id:4, name:'Sapiens', author:'Yuval Harari', genre:'History', members:1 },
  ]));
  const [joinedCrews, setJoinedCrews] = useState(() => storage.get(`joinedCrews_${user.email}`, []));
  const [view, setView] = useState('list');
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [crewTab, setCrewTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newCrew, setNewCrew] = useState({ name:'', author:'', genre:'' });
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // BottomNav is hidden when in chat view
  const inChatView = view === 'chat';

  useEffect(() => { if (inChatView) setTimeout(() => inputRef.current?.focus(), 300); }, [inChatView]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const isJoined = (id) => joinedCrews.includes(id);

  const joinCrew = (crew) => {
    if (isJoined(crew.id)) return;
    const updated = [...joinedCrews, crew.id];
    setJoinedCrews(updated);
    storage.set(`joinedCrews_${user.email}`, updated);
    const updatedCrews = crews.map(c => c.id === crew.id ? { ...c, members: (c.members||1)+1 } : c);
    setCrews(updatedCrews); storage.set('crews', updatedCrews);
    const s = storage.get(`stats_${user.email}`, {});
    storage.set(`stats_${user.email}`, { ...s, crewsJoined: (s.crewsJoined||0)+1 });
    showToast(`Joined "${crew.name}"! 🎉`);
  };

  const leaveCrew = (crew) => {
    if (!window.confirm(`Leave "${crew.name}"?`)) return;
    const updated = joinedCrews.filter(id => id !== crew.id);
    setJoinedCrews(updated); storage.set(`joinedCrews_${user.email}`, updated);
    const updatedCrews = crews.map(c => c.id === crew.id ? { ...c, members: Math.max(0,(c.members||1)-1) } : c);
    setCrews(updatedCrews); storage.set('crews', updatedCrews);
    const s = storage.get(`stats_${user.email}`, {});
    storage.set(`stats_${user.email}`, { ...s, crewsJoined: Math.max(0,(s.crewsJoined||1)-1) });
    if (selectedCrew?.id === crew.id) { setView('list'); setSelectedCrew(null); }
  };

  const openCrew = (crew) => { setSelectedCrew(crew); setCrewTab('chat'); loadMessages(crew); setView('detail'); };

  const loadMessages = (crew) => {
    setMessages(storage.get(`crewMsgs_${crew.id}`, []));
  };

  const sendMessage = () => {
    if (!msgInput.trim() || !isJoined(selectedCrew.id)) return;
    const msg = { id: Date.now(), userId: user.id, userName: user.name, text: msgInput.trim(), ts: new Date().toISOString() };
    const updated = [...messages, msg];
    setMessages(updated);
    storage.set(`crewMsgs_${selectedCrew.id}`, updated);
    setMsgInput('');
    // Notify: find other members (simulate)
    pushNotification('_broadcast_', { type:'message', message:`${user.name} posted in "${selectedCrew.name}"` });
  };

  const createCrew = () => {
    if (!newCrew.name || !newCrew.author) { alert('Please fill book name and author'); return; }
    const crew = { id: Date.now(), ...newCrew, members: 1, chats: 0, createdBy: user.email, createdAt: new Date().toISOString() };
    const updated = [crew, ...crews];
    setCrews(updated); storage.set('crews', updated);
    joinCrew(crew);
    setShowCreate(false); setNewCrew({ name:'', author:'', genre:'' });
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const filteredCrews = crews.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.author.toLowerCase().includes(search.toLowerCase()));

  // ── CHAT VIEW (fullscreen, BottomNav hidden) ──
  if (view === 'chat' && selectedCrew) {
    const hasJoined = isJoined(selectedCrew.id);
    return (
      <div className="fixed inset-0 max-w-md mx-auto bg-gray-50 flex flex-col z-[55]">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setView('detail')} className="p-1"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
          <DynamicBookCover title={selectedCrew.name} author={selectedCrew.author} size="xs" />
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">{selectedCrew.name}</p>
            <p className="text-xs text-gray-400">{selectedCrew.members||1} members</p>
          </div>
          {hasJoined && <button onClick={() => leaveCrew(selectedCrew)} className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded-lg">Leave</button>}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {!hasJoined ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Lock className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500 mb-3">Join this crew to chat</p>
              <button onClick={() => joinCrew(selectedCrew)} className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold">Join Crew</button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-12 h-12 text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : messages.map(msg => {
            const isOwn = msg.userId === user.id || msg.userName === user.name;
            return (
              <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                {!isOwn && <Avatar name={msg.userName} size="xs" />}
                <div className={`max-w-[75%]`}>
                  {!isOwn && <p className="text-xs text-gray-400 mb-0.5 px-1">{msg.userName}</p>}
                  <div className={`px-4 py-2.5 rounded-2xl ${isOwn ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'bg-white border border-gray-100 text-gray-900'}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <p className={`text-[10px] text-gray-400 mt-0.5 ${isOwn ? 'text-right' : 'text-left'} px-1`}>{new Date(msg.ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input — always visible at bottom, NO nav behind it */}
        {hasJoined && (
          <div className="bg-white border-t border-gray-100 px-4 py-3 pb-safe">
            <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2.5">
              <input
                ref={inputRef}
                type="text"
                value={msgInput}
                onChange={e => setMsgInput(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter') sendMessage(); }}
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                placeholder="Type a message..."
              />
              <button onClick={sendMessage} disabled={!msgInput.trim()} className={`transition ${msgInput.trim() ? 'text-orange-500 hover:scale-110' : 'text-gray-300'}`}>
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── DETAIL VIEW ──
  if (view === 'detail' && selectedCrew) {
    const hasJoined = isJoined(selectedCrew.id);
    const tabs = ['chat','reviews','about','similar'];
    return (
      <div className="pb-24 bg-gray-50 min-h-screen">
        {toast && <Toast msg={toast} />}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 z-40">
          <button onClick={() => setView('list')}><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
          <span className="font-bold text-gray-900 flex-1">{selectedCrew.name}</span>
          {hasJoined && <button onClick={() => { const inv = prompt("Friend's email to invite?"); if(inv) { pushNotification(inv, { type:'invite', message:`${user.name} invited you to the "${selectedCrew.name}" crew!` }); alert('Invite sent!'); }}} className="p-1"><UserPlus className="w-5 h-5 text-gray-500" /></button>}
        </div>
        <div className="px-4 py-4">
          <div className="flex gap-4 mb-5">
            <DynamicBookCover title={selectedCrew.name} author={selectedCrew.author} size="lg" />
            <div className="flex-1">
              <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{selectedCrew.genre}</span>
              <h2 className="font-bold text-gray-900 text-xl mt-1">{selectedCrew.name}</h2>
              <p className="text-sm text-gray-500">by {selectedCrew.author}</p>
              <div className="flex items-center gap-1 mt-1"><StarRating rating={4.5} /><span className="text-sm font-medium ml-1">4.5</span></div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 text-sm text-gray-500"><Users className="w-4 h-4" />{selectedCrew.members||1}</div>
                {hasJoined
                  ? <button onClick={() => leaveCrew(selectedCrew)} className="px-3 py-1 border border-red-200 text-red-500 rounded-xl text-xs">Leave</button>
                  : <button onClick={() => joinCrew(selectedCrew)} className="px-4 py-1.5 bg-orange-500 text-white rounded-xl text-sm font-semibold">Join Crew</button>}
              </div>
            </div>
          </div>

          <div className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
            {tabs.map(t => (
              <button key={t} onClick={() => { setCrewTab(t); if(t==='chat' && hasJoined) { loadMessages(selectedCrew); setView('chat'); } }} className={`px-4 py-2 text-sm font-medium capitalize whitespace-nowrap border-b-2 transition ${crewTab===t ? 'text-orange-500 border-orange-500' : 'text-gray-400 border-transparent'}`}>{t}</button>
            ))}
          </div>

          {crewTab === 'chat' && (
            <div className="text-center py-8">
              {hasJoined
                ? <><p className="text-gray-500 mb-3 text-sm">Jump into the conversation!</p><button onClick={() => { loadMessages(selectedCrew); setView('chat'); }} className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold">Open Chat</button></>
                : <><Lock className="w-10 h-10 text-gray-200 mx-auto mb-2" /><p className="text-gray-400 text-sm mb-3">Join crew to chat</p><button onClick={() => joinCrew(selectedCrew)} className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold">Join Crew</button></>}
            </div>
          )}

          {crewTab === 'reviews' && (
            <div className="space-y-4">
              {[4.5,4.0,5.0].map((r, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={`Reader ${i+1}`} size="sm" />
                    <div><p className="font-semibold text-sm">Reader {i+1}</p><StarRating rating={r} /></div>
                    <span className="ml-auto text-xs text-gray-400">2d ago</span>
                  </div>
                  <p className="text-sm text-gray-600">{"Truly life-changing read. Highly recommend to everyone!,A beautiful story about what really matters in life.,One of the best books I've ever read.".split(',')[i]}</p>
                </div>
              ))}
            </div>
          )}

          {crewTab === 'about' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-100"><h3 className="font-semibold text-gray-900 mb-2">About this crew</h3><p className="text-sm text-gray-600 leading-relaxed">A community for readers of "{selectedCrew.name}" by {selectedCrew.author}. Discuss themes, share insights, and connect with fellow readers.</p></div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2">Book Details</h3>
                {[['Author', selectedCrew.author], ['Genre', selectedCrew.genre], ['Members', selectedCrew.members||1]].map(([k,v]) => (
                  <div key={k} className="flex justify-between py-1 border-b border-gray-50 last:border-0"><span className="text-sm text-gray-500">{k}</span><span className="text-sm font-medium text-gray-900">{v}</span></div>
                ))}
              </div>
            </div>
          )}

          {crewTab === 'similar' && (
            <div className="space-y-3">
              {['The Alchemist','Life of Pi','A Man Called Ove'].map((t, i) => {
                const authors = ['Paulo Coelho','Yann Martel','Fredrik Backman'];
                return (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 flex gap-3 items-center">
                    <DynamicBookCover title={t} author={authors[i]} size="sm" />
                    <div className="flex-1"><p className="font-semibold text-gray-900 text-sm">{t}</p><p className="text-xs text-gray-500">by {authors[i]}</p><StarRating rating={4+i*0.2} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  const mineFiltered = filteredCrews.filter(c => isJoined(c.id));
  const discoverFiltered = filteredCrews.filter(c => !isJoined(c.id));

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {toast && <Toast msg={toast} />}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-white" /></div>
          <span className="font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>Reading Crews</span>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-3 py-1.5 bg-orange-500 text-white rounded-xl text-sm font-semibold flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Create</button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {showCreate && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3">New Crew</h3>
            <div className="space-y-2">
              <input value={newCrew.name} onChange={e => setNewCrew({...newCrew, name:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" placeholder="Book name" />
              <input value={newCrew.author} onChange={e => setNewCrew({...newCrew, author:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" placeholder="Author" />
              <input value={newCrew.genre} onChange={e => setNewCrew({...newCrew, genre:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" placeholder="Genre (optional)" />
              <div className="flex gap-2"><button onClick={createCrew} className="flex-1 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold">Create</button><button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm">Cancel</button></div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400 bg-transparent" placeholder="Search crews..." />
        </div>

        {mineFiltered.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5"><Users className="w-4 h-4 text-orange-500" />My Crews</h2>
            <div className="space-y-3">
              {mineFiltered.map(crew => (
                <div key={crew.id} className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
                  <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => openCrew(crew)}>
                    <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{crew.name}</p>
                      <p className="text-xs text-gray-500">by {crew.author}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre||'General'}</span>
                        <span className="text-xs text-gray-400">{crew.members||1} members</span>
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">Joined</span>
                  </button>
                  <div className="flex gap-2 px-4 pb-3">
                    <button onClick={() => { loadMessages(crew); setSelectedCrew(crew); setView('chat'); }} className="flex-1 py-2 bg-orange-500 text-white rounded-xl text-xs font-semibold">Open Chat</button>
                    <button onClick={() => { const inv = prompt("Friend's email?"); if(inv) { pushNotification(inv, { type:'invite', message:`${user.name} invited you to join "${crew.name}" on ReadCrew!` }); alert('Invite sent!'); }}} className="px-4 py-2 border border-gray-200 rounded-xl text-xs text-gray-600">Invite</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="font-bold text-gray-900 mb-2">Discover Crews</h2>
          {discoverFiltered.length === 0
            ? <div className="text-center py-8 text-gray-400 text-sm">You've joined all crews! Create a new one.</div>
            : <div className="space-y-3">
              {discoverFiltered.map(crew => (
                <div key={crew.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => openCrew(crew)}>
                    <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{crew.name}</p>
                      <p className="text-xs text-gray-500">by {crew.author}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre||'General'}</span>
                        <span className="text-xs text-gray-400">{crew.members||1} members</span>
                      </div>
                    </div>
                  </button>
                  <div className="flex gap-2 px-4 pb-3">
                    <button onClick={() => joinCrew(crew)} className="flex-1 py-2 bg-orange-500 text-white rounded-xl text-xs font-semibold">Join Crew</button>
                    <button onClick={() => { const inv = prompt("Friend's email?"); if(inv) { pushNotification(inv, { type:'invite', message:`${user.name} invited you to join "${crew.name}" on ReadCrew!` }); alert('Invite sent!'); }}} className="px-4 py-2 border border-gray-200 rounded-xl text-xs text-gray-600">Invite</button>
                  </div>
                </div>
              ))}
            </div>}
        </div>
      </div>
    </div>
  );
};

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
const ProfilePage = ({ user, setUser, setPage, onLogout, profileSrc, setProfileSrc }) => {
  const [stats, setStats] = useState(() => storage.get(`stats_${user.email}`, { booksRead:0, reviewsGiven:0, postsCreated:0, crewsJoined:0 }));
  const [readingGoal, setReadingGoal] = useState(() => user.readingGoal || { yearly:0, monthly:0 });
  const [editGoal, setEditGoal] = useState(readingGoal);
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [activeTab, setActiveTab] = useState('Posts');
  const [myPosts, setMyPosts] = useState([]);
  const fileRef = useRef();

  useEffect(() => {
    const allPosts = storage.get('globalPosts', []);
    setMyPosts(allPosts.filter(p => p.userEmail === user.email));
    // Re-sync stats
    setStats(storage.get(`stats_${user.email}`, { booksRead:0, reviewsGiven:0, postsCreated:0, crewsJoined:0 }));
  }, [user.email]);

  const handleImageUpload = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      // Persist profile image so it survives tab changes
      storage.setRaw(`profileImg_${user.email}`, dataUrl);
      setProfileSrc(dataUrl);
    };
    reader.readAsDataURL(f);
  };

  const saveGoal = () => {
    const updatedUser = { ...user, readingGoal: editGoal };
    setUser(updatedUser);
    storage.set('currentUser', updatedUser);
    const users = storage.get('users', []);
    storage.set('users', users.map(u => u.email === user.email ? updatedUser : u));
    setReadingGoal(editGoal);
    setShowEditGoal(false);
  };

  const progress = readingGoal.yearly > 0 ? Math.min((stats.booksRead / readingGoal.yearly) * 100, 100) : 0;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-40">
        <div className="flex items-center gap-2"><div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-white" /></div><span className="font-bold text-gray-900" style={{ fontFamily:'Georgia, serif' }}>Profile</span></div>
        <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-xl"><LogOut className="w-5 h-5 text-gray-500" /></button>
      </div>
      <div className="px-4 py-5 space-y-5">
        {/* Avatar */}
        <div className="flex items-start gap-4">
          <div className="relative">
            {profileSrc
              ? <img src={profileSrc} alt="profile" className="w-20 h-20 rounded-full object-cover shadow" />
              : <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow" style={{ background: getAvatarColor(user.name) }}>{user.name?.slice(0,2).toUpperCase()}</div>}
            <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center shadow hover:bg-orange-600 transition">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-400">@{user.name?.toLowerCase().replace(/\s/g,'')}</p>
            <p className="text-sm text-gray-600 mt-1 italic">"Reading is my superpower"</p>
            <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { l:'Books', v:stats.booksRead, icon:BookOpen, c:'text-blue-600', b:'bg-blue-50' },
            { l:'Reviews', v:stats.reviewsGiven, icon:Star, c:'text-yellow-600', b:'bg-yellow-50' },
            { l:'Posts', v:stats.postsCreated, icon:Edit3, c:'text-green-600', b:'bg-green-50' },
            { l:'Crews', v:stats.crewsJoined, icon:Users, c:'text-orange-600', b:'bg-orange-50' },
          ].map(({ l, v, icon:Icon, c, b }) => (
            <div key={l} className={`${b} rounded-xl p-3 border border-white text-center shadow-sm`}>
              <Icon className={`w-4 h-4 ${c} mx-auto mb-1`} /><p className="text-lg font-bold text-gray-900">{v}</p><p className="text-xs text-gray-500">{l}</p>
            </div>
          ))}
        </div>

        {/* Reading Goal */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5"><Target className="w-4 h-4 text-orange-500" /><span className="font-semibold text-gray-900 text-sm">Reading Goal {new Date().getFullYear()}</span></div>
            <button onClick={() => { setEditGoal(readingGoal); setShowEditGoal(!showEditGoal); }} className="text-xs text-orange-500 font-semibold">{showEditGoal ? 'Cancel' : 'Edit'}</button>
          </div>
          {showEditGoal ? (
            <div className="space-y-2 mt-2">
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-gray-500">Yearly</label><input type="number" value={editGoal.yearly} onChange={e => setEditGoal({...editGoal, yearly:+e.target.value})} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm mt-0.5 outline-none focus:border-orange-400" /></div>
                <div><label className="text-xs text-gray-500">Monthly</label><input type="number" value={editGoal.monthly} onChange={e => setEditGoal({...editGoal, monthly:+e.target.value})} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm mt-0.5 outline-none focus:border-orange-400" /></div>
              </div>
              <button onClick={saveGoal} className="w-full py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold">Save</button>
            </div>
          ) : (
            <>
              {readingGoal.yearly > 0 ? (
                <>
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Yearly Progress</span><span className="font-semibold">{stats.booksRead}/{readingGoal.yearly}</span></div>
                  <div className="h-2 bg-orange-200 rounded-full overflow-hidden"><div className="h-full bg-orange-500 rounded-full transition-all" style={{ width:`${progress}%` }} /></div>
                  <p className="text-xs text-gray-400 mt-1">{Math.round(progress)}% complete · Monthly: {stats.booksRead}/{readingGoal.monthly}</p>
                </>
              ) : <p className="text-sm text-gray-400">No goal set yet. Tap Edit to set one!</p>}
            </>
          )}
        </div>

        {/* Tabs */}
        <div>
          <div className="flex border-b border-gray-200 mb-4">
            {['Posts','Saved'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab===t ? 'text-orange-500 border-orange-500' : 'text-gray-400 border-transparent'}`}>{t}</button>
            ))}
          </div>
          {activeTab === 'Posts' && (
            myPosts.length === 0
              ? <div className="text-center py-8"><Edit3 className="w-10 h-10 text-gray-200 mx-auto mb-2" /><p className="text-gray-400 text-sm">No posts yet</p><button onClick={() => setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold">Create Post</button></div>
              : myPosts.map(p => (
                <div key={p.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-3">
                  <p className="text-sm text-gray-700 mb-2">{p.content}</p>
                  {p.bookName && <p className="text-xs text-orange-500 flex items-center gap-1"><BookOpen className="w-3 h-3" />{p.bookName}</p>}
                  {p.image && <img src={p.image} alt="" className="w-full rounded-xl mt-2 max-h-48 object-cover" />}
                  <div className="flex gap-4 mt-2 pt-2 border-t border-gray-50">
                    <span className="flex items-center gap-1 text-xs text-gray-400"><Heart className="w-3.5 h-3.5" />{p.likes||0}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400"><MessageCircle className="w-3.5 h-3.5" />{p.commentCount||0}</span>
                  </div>
                </div>
              ))
          )}
          {activeTab === 'Saved' && (
            <div className="text-center py-12"><Bookmark className="w-10 h-10 text-gray-200 mx-auto mb-2" /><p className="text-gray-400 text-sm">No saved items yet</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export function App() {
  const [user, setUser] = useState(() => storage.get('currentUser', null));
  const [page, setPage] = useState('home');
  const [showNotifs, setShowNotifs] = useState(false);
  const [toast, setToast] = useState('');
  // Profile src persisted per user
  const [profileSrc, setProfileSrcState] = useState(() => {
    const u = storage.get('currentUser', null);
    return u ? (storage.getRaw(`profileImg_${u.email}`) || null) : null;
  });

  const setProfileSrc = useCallback((src) => {
    setProfileSrcState(src);
    if (user) storage.setRaw(`profileImg_${user.email}`, src);
  }, [user]);

  const unreadCount = (() => {
    if (!user) return 0;
    const notifs = storage.get(`notifications_${user.email}`, []);
    return notifs.filter(n => !n.read).length;
  })();

  const handleLogin = (userData) => { setUser(userData); setProfileSrcState(storage.getRaw(`profileImg_${userData.email}`) || null); setPage('home'); };
  const handleLogout = () => { storage.set('currentUser', null); setUser(null); setPage('home'); };

  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(''), 3000); };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {showNotifs && <NotificationsPage user={user} onClose={() => setShowNotifs(false)} />}

      <div className="max-w-md mx-auto relative">
        {page === 'home' && <HomePage user={user} setPage={setPage} onBell={() => setShowNotifs(true)} unread={unreadCount} profileSrc={profileSrc} />}
        {page === 'explore' && <ExplorePage user={user} setPage={setPage} />}
        {page === 'post' && <PostPage user={user} setPage={setPage} profileSrc={profileSrc} />}
        {page === 'crews' && <CrewsPage user={user} setPage={setPage} />}
        {page === 'reviews' && <ReviewsPage user={user} setPage={setPage} />}
        {page === 'profile' && <ProfilePage user={user} setUser={setUser} setPage={setPage} onLogout={handleLogout} profileSrc={profileSrc} setProfileSrc={setProfileSrc} />}

        {/* BottomNav hidden on PostPage (full screen); CrewsPage chat covers it with z-[55] */}
        <BottomNav active={page} setPage={setPage} unread={unreadCount} hidden={page === 'post'} />
      </div>
    </div>
  );
}