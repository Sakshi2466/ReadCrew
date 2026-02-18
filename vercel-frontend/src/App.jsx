import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Home, Search, Edit3, Users, User, Bell, Settings,
  Heart, MessageCircle, Bookmark, Share2, Star, Plus, ChevronRight,
  X, Send, Image, ChevronLeft, LogOut, Camera, MoreHorizontal,
  Sparkles, Lock, Eye, EyeOff, UserPlus, Gift, ThumbsUp, ThumbsDown, 
  Trash2, Edit, Target, Check, ArrowLeft, Clock, TrendingUp, Menu, Upload,
  Calendar, Award, MessageSquare, Globe, ChevronDown, Filter, Play, Pause, 
  Volume2, Mic, Paperclip, Mail, Phone, Leaf, ExternalLink
} from 'lucide-react';

// Import API functions
import { donationAPI, reviewAPI, otpAPI, checkBackendConnection, getBookRecommendations, chatAPI, crewAPI, userAPI, bookCrewAPI, getTrendingBooks, aiChatAPI } from './services/api';
import axios from 'axios';

// Validation functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);
const validateName = (name) => name && name.trim().length >= 2;

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
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'explore', icon: Sparkles, label: 'Explore' },
    { id: 'post', icon: Edit3, label: 'Post' },
    { id: 'crews', icon: Users, label: 'Crews' },
    { id: 'profile', icon: User, label: 'Profile' },
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
const TopBar = ({ user, setPage, title, showBack = false, onBack }) => (
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
    <div className="flex items-center gap-3">
      <button className="relative p-1 hover:bg-gray-100 rounded-lg transition">
        <Bell className="w-5 h-5 text-gray-600" />
        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>
      <button onClick={() => setPage('profile')} className="hover:opacity-80 transition">
        <Avatar initials={user?.name?.slice(0, 2)} size="sm" color="#C8622A" />
      </button>
    </div>
  </header>
);

// ─── LOGIN PAGE ─────────────────────────────────────────────────────────────
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [readingGoal, setReadingGoal] = useState({ yearly: 20, monthly: 5 });

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
        alert('OTP sent to your email!');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('devOTP', otp);
      setShowOTP(true);
      alert(`Dev OTP: ${otp}`);
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
          readingGoal: readingGoal,
          isVerified: true,
          createdAt: new Date().toISOString(),
          stats: { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 },
          joinedCrews: []
        };
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem(`user_${userData.email}_stats`, JSON.stringify(userData.stats));
        localStorage.setItem(`user_${userData.email}_joinedCrews`, JSON.stringify([]));
        
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
          phone: phone,
          readingGoal: readingGoal,
          isVerified: true,
          createdAt: new Date().toISOString(),
          stats: { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 },
          joinedCrews: []
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem(`user_${userData.email}_stats`, JSON.stringify(userData.stats));
        localStorage.setItem(`user_${userData.email}_joinedCrews`, JSON.stringify([]));
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center" style={{ fontFamily: "'Georgia', serif" }}>
      <div className="w-full max-w-md relative overflow-hidden" style={{ height: '240px' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-orange-100 to-gray-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl shadow-2xl flex items-center justify-center rotate-12 transform hover:rotate-0 transition-transform">
              <BookOpen className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 -mt-8 mb-2">
        <span className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          ReadCrew
        </span>
      </div>
      <p className="text-gray-500 text-sm mb-8">Read together, grow together.</p>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl mx-4 p-7 border border-gray-200">
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
              
              {/* Reading Goals during signup */}
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-500" />
                  Set Your Reading Goals
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Yearly Goal (books)</label>
                    <input
                      type="number"
                      value={readingGoal.yearly}
                      onChange={(e) => setReadingGoal({...readingGoal, yearly: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Monthly Goal (books)</label>
                    <input
                      type="number"
                      value={readingGoal.monthly}
                      onChange={(e) => setReadingGoal({...readingGoal, monthly: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none"
                      min="1"
                      max="20"
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
          
          {!isLogin && (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
              <Phone className="w-5 h-5 text-gray-400" />
              <input 
                value={phone} 
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                placeholder="Phone Number" 
                maxLength="10" 
              />
            </div>
          )}
          
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
              // Mock login - in real app, verify with backend
              const mockUser = {
                id: Date.now().toString(),
                name: name || email.split('@')[0],
                email: email,
                readingGoal: { yearly: 20, monthly: 5 },
                stats: { booksRead: 12, reviewsGiven: 8, postsCreated: 15, crewsJoined: 3 },
                joinedCrews: [1, 2] // Mock joined crews
              };
              localStorage.setItem('currentUser', JSON.stringify(mockUser));
              onLogin(mockUser);
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
      <div className="h-8" />
    </div>
  );
};

// ─── HOME PAGE ──────────────────────────────────────────────────────────────
const HomePage = ({ user, posts, setPosts, crews, setPage, donations, reviews, onUpdateStats }) => {
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const [feedPosts, setFeedPosts] = useState([]);
  const [selectedTab, setSelectedTab] = useState('feed');

  useEffect(() => {
    fetchTrendingBooks();
    loadFeedPosts();
    calculateReadingProgress();
  }, []);

  const fetchTrendingBooks = async () => {
    setLoadingTrending(true);
    try {
      // Try to fetch from Groq API first
      let response = '';
      await getTrendingBooks(
        (token) => { response += token; },
        () => {
          try {
            // Parse the response to extract book data
            const books = parseTrendingBooks(response);
            setTrendingBooks(books);
          } catch (e) {
            console.error('Error parsing trending books:', e);
            useMockTrendingBooks();
          }
        }
      );
    } catch (error) {
      console.error('Error fetching trending books:', error);
      useMockTrendingBooks();
    } finally {
      setLoadingTrending(false);
    }
  };

  const useMockTrendingBooks = () => {
    const mockTrending = [
      { id: 1, title: 'Atomic Habits', author: 'James Clear', rating: 4.8, readers: 15420, cover: '#E8A87C', description: 'Tiny changes, remarkable results', genre: 'Self-Help', pages: 320, published: '2018' },
      { id: 2, title: 'The Psychology of Money', author: 'Morgan Housel', rating: 4.7, readers: 12350, cover: '#7B9EA6', description: 'Timeless lessons on wealth, greed, and happiness', genre: 'Finance', pages: 256, published: '2020' },
      { id: 3, title: 'Deep Work', author: 'Cal Newport', rating: 4.6, readers: 9870, cover: '#2D2D2D', description: 'Rules for focused success in a distracted world', genre: 'Productivity', pages: 304, published: '2016' },
      { id: 4, title: 'Sapiens', author: 'Yuval Harari', rating: 4.8, readers: 21500, cover: '#C4A882', description: 'A brief history of humankind', genre: 'History', pages: 512, published: '2011' },
      { id: 5, title: 'The Alchemist', author: 'Paulo Coelho', rating: 4.5, readers: 32400, cover: '#C8622A', description: 'A fable about following your dreams', genre: 'Fiction', pages: 208, published: '1988' },
    ];
    setTrendingBooks(mockTrending);
  };

  const parseTrendingBooks = (response) => {
    // Simple parsing - in production you'd have a more sophisticated parser
    const lines = response.split('\n');
    const books = [];
    
    lines.forEach(line => {
      if (line.includes('title:') || line.includes('Title:')) {
        // Extract book info
        const title = line.split(':')[1]?.trim() || 'Unknown';
        books.push({
          id: books.length + 1,
          title: title,
          author: 'Various',
          rating: 4.5,
          readers: 10000,
          cover: '#C8622A',
          description: 'A trending book',
          genre: 'General',
          pages: 300,
          published: '2024'
        });
      }
    });
    
    return books.length > 0 ? books : [];
  };

  const loadFeedPosts = () => {
    // Combine donations and posts into a single feed
    const feed = [
      ...(donations || []).map(d => ({ ...d, type: 'donation', timestamp: new Date(d.createdAt) })),
      ...(posts || []).map(p => ({ ...p, type: 'post', timestamp: new Date(p.createdAt || Date.now()) }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
    
    setFeedPosts(feed);
  };

  const calculateReadingProgress = () => {
    if (user?.readingGoal) {
      const progress = (user.stats?.booksRead || 0) / user.readingGoal.yearly * 100;
      setReadingProgress(Math.min(progress, 100));
    }
  };

  const handleLikePost = async (postId, type) => {
    try {
      if (type === 'donation') {
        await donationAPI.like(postId);
      }
      // Update UI optimistically
      setFeedPosts(prev => prev.map(p => 
        p._id === postId ? { ...p, likes: (p.likes || 0) + 1, liked: true } : p
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    if (tab === 'reviews') setPage('reviews');
    else if (tab === 'crews') setPage('crews');
    else if (tab === 'posts') setPage('post');
    else if (tab === 'books') setPage('explore');
  };

  const hasReadingGoal = user?.readingGoal?.yearly > 0 && user?.readingGoal?.monthly > 0;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <TopBar user={user} setPage={setPage} title="Home" />
      
      <div className="px-4 py-4 space-y-5">
        {/* Welcome Card - Shows differently based on whether user has goals */}
        {!hasReadingGoal ? (
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Leaf className="w-6 h-6" />
              <h2 className="text-xl font-bold">Welcome, {user?.name?.split(' ')[0]}! 🌱</h2>
            </div>
            <p className="text-green-100 text-sm">Read together, grow together. Set your reading goals to track progress!</p>
            <button 
              onClick={() => setPage('profile')}
              className="mt-3 px-4 py-2 bg-white text-green-600 rounded-xl text-sm font-semibold"
            >
              Set Reading Goals
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xl font-bold">Welcome back, {user?.name?.split(' ')[0]}! 📚</h2>
                <p className="text-orange-100 text-sm mt-1">Keep reading, keep growing</p>
              </div>
              <Avatar initials={user?.name?.slice(0, 2)} size="md" color="white" />
            </div>
            
            {/* Reading Progress */}
            <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Yearly Goal Progress</span>
                <span className="font-semibold">{user?.stats?.booksRead || 0}/{user?.readingGoal?.yearly || 20} books</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${readingProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-orange-100">
                <span>Monthly: {user?.stats?.booksRead || 0}/{user?.readingGoal?.monthly || 5}</span>
                <span>{Math.round(readingProgress)}% Complete</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats - Clickable */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Books', value: user?.stats?.booksRead || 0, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100', tab: 'books' },
            { label: 'Reviews', value: user?.stats?.reviewsGiven || 0, icon: Star, color: 'text-purple-600', bg: 'bg-purple-100', tab: 'reviews' },
            { label: 'Posts', value: user?.stats?.postsCreated || 0, icon: Edit3, color: 'text-green-600', bg: 'bg-green-100', tab: 'posts' },
            { label: 'Crews', value: user?.stats?.crewsJoined || 0, icon: Users, color: 'text-orange-600', bg: 'bg-orange-100', tab: 'crews' }
          ].map(({ label, value, icon: Icon, color, bg, tab }, idx) => (
            <button 
              key={idx} 
              onClick={() => handleTabChange(tab)}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 hover:shadow-md transition text-left"
            >
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </button>
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
          <Avatar initials={user?.name?.slice(0, 2)} size="xs" color="#C8622A" className="ml-auto" />
        </button>

        {/* Live Feed - Posts from community */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              Community Feed
            </h2>
            <button className="text-sm text-orange-500 font-semibold">View All</button>
          </div>

          <div className="space-y-4">
            {feedPosts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No posts yet. Be the first to share!</p>
              </div>
            ) : (
              feedPosts.map((post, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar initials={post.userName?.slice(0, 2) || 'U'} size="sm" color="#C8622A" />
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
                    <button className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments || 0}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-xs text-gray-500">
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
            <button className="text-sm text-orange-500 font-semibold">See All</button>
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
                  onClick={() => {
                    // Navigate to book details
                    setPage('explore');
                    // You would pass the book data via state/context
                  }}
                >
                  <div 
                    className="w-32 h-40 rounded-xl shadow-lg flex items-end justify-center pb-3 mb-2 relative overflow-hidden group"
                    style={{ backgroundColor: book.cover }}
                  >
                    <BookOpen className="w-8 h-8 text-white opacity-50" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ExternalLink className="w-6 h-6 text-white" />
                    </div>
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

        {/* Popular Crews */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              Popular Crews
            </h2>
            <button onClick={() => setPage('crews')} className="text-sm text-orange-500 font-semibold">
              View All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(crews || []).slice(0, 2).map(crew => (
              <div 
                key={crew.id} 
                className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => {
                  // Navigate to crew detail
                  setPage('crews');
                  // You would pass the selected crew via state/context
                }}
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
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle join crew
                      }}
                      className="px-3 py-1 bg-orange-500 text-white rounded-lg text-xs font-medium"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── EXPLORE WITH GROQ AI CHAT ─────────────────────────────────────────────
const ExplorePage = ({ user, setPage, onCreateCrew }) => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      type: 'ai', 
      content: "Hi! I'm your AI reading companion. Tell me what kind of books you're interested in, and I'll recommend something perfect for you! 📚",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedBooks, setSuggestedBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookDetails, setShowBookDetails] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call Groq API for book recommendations
      let aiResponse = '';
      let books = [];

      // Use the AI chat API
      await aiChatAPI.streamResponse(
        inputMessage,
        (token) => { aiResponse += token; },
        () => {
          // Parse the response to extract book data
          books = parseBookRecommendations(aiResponse);
          setSuggestedBooks(books);
          
          const aiMessage = {
            id: Date.now() + 1,
            type: 'ai',
            content: aiResponse,
            books: books,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, aiMessage]);
          setIsLoading(false);
        },
        user.id
      );
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback to mock response
      setTimeout(() => {
        const mockBooks = getMockRecommendations(inputMessage);
        setSuggestedBooks(mockBooks);
        
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: getMockResponse(inputMessage),
          books: mockBooks,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1500);
    }
  };

  const getMockRecommendations = (input) => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('fantasy') || lowerInput.includes('magic')) {
      return [
        { id: 1, title: 'The Name of the Wind', author: 'Patrick Rothfuss', rating: 4.7, genre: 'Fantasy', description: 'A masterpiece of storytelling about a legendary magician.', cover: '#8B4513', pages: 662, published: '2007' },
        { id: 2, title: 'Mistborn', author: 'Brandon Sanderson', rating: 4.8, genre: 'Fantasy', description: 'An epic fantasy with a unique magic system.', cover: '#4A4A4A', pages: 541, published: '2006' },
        { id: 3, title: 'The Lies of Locke Lamora', author: 'Scott Lynch', rating: 4.6, genre: 'Fantasy', description: 'Ocean\'s Eleven meets fantasy in this brilliant heist novel.', cover: '#2C3E50', pages: 499, published: '2006' }
      ];
    } else if (lowerInput.includes('self help') || lowerInput.includes('motivation')) {
      return [
        { id: 4, title: 'Atomic Habits', author: 'James Clear', rating: 4.8, genre: 'Self-Help', description: 'Tiny changes, remarkable results.', cover: '#E8A87C', pages: 320, published: '2018' },
        { id: 5, title: 'The Psychology of Money', author: 'Morgan Housel', rating: 4.7, genre: 'Finance', description: 'Timeless lessons on wealth and happiness.', cover: '#7B9EA6', pages: 256, published: '2020' },
        { id: 6, title: 'Daring Greatly', author: 'Brené Brown', rating: 4.6, genre: 'Self-Help', description: 'How courage changes everything.', cover: '#C44536', pages: 304, published: '2012' }
      ];
    } else if (lowerInput.includes('thriller') || lowerInput.includes('mystery')) {
      return [
        { id: 7, title: 'The Silent Patient', author: 'Alex Michaelides', rating: 4.5, genre: 'Thriller', description: 'A shocking psychological thriller.', cover: '#2C1810', pages: 336, published: '2019' },
        { id: 8, title: 'Gone Girl', author: 'Gillian Flynn', rating: 4.3, genre: 'Thriller', description: 'The thriller that defined a generation.', cover: '#8B0000', pages: 432, published: '2012' },
        { id: 9, title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', rating: 4.4, genre: 'Mystery', description: 'A spellbinding mystery.', cover: '#2F4F4F', pages: 672, published: '2005' }
      ];
    } else {
      return [
        { id: 10, title: 'The Midnight Library', author: 'Matt Haig', rating: 4.6, genre: 'Fiction', description: 'Between life and death, there is a library.', cover: '#483D8B', pages: 304, published: '2020' },
        { id: 11, title: 'Project Hail Mary', author: 'Andy Weir', rating: 4.8, genre: 'Sci-Fi', description: 'A lone astronaut must save humanity.', cover: '#CD5C5C', pages: 496, published: '2021' },
        { id: 12, title: 'Educated', author: 'Tara Westover', rating: 4.7, genre: 'Memoir', description: 'A memoir of survival and transformation.', cover: '#DAA520', pages: 352, published: '2018' }
      ];
    }
  };

  const getMockResponse = (input) => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('fantasy') || lowerInput.includes('magic')) {
      return "Based on your interest in fantasy, I recommend these magical books that have captivated millions of readers!";
    } else if (lowerInput.includes('self help') || lowerInput.includes('motivation')) {
      return "Looking to grow and improve? Here are some life-changing books that our community loves!";
    } else if (lowerInput.includes('thriller') || lowerInput.includes('mystery')) {
      return "If you love suspense and plot twists, you'll absolutely love these thrillers!";
    } else {
      return "I've found some fantastic books that match your interests. Take a look!";
    }
  };

  const parseBookRecommendations = (response) => {
    // Simple parsing - in production you'd have a more sophisticated parser
    const lines = response.split('\n');
    const books = [];
    
    lines.forEach(line => {
      if (line.includes('title:') || line.includes('Title:')) {
        const title = line.split(':')[1]?.trim() || 'Unknown';
        books.push({
          id: books.length + 1,
          title: title,
          author: 'Author',
          rating: 4.5,
          genre: 'General',
          description: 'A recommended book',
          cover: '#C8622A',
          pages: 300,
          published: '2024'
        });
      }
    });
    
    return books.length > 0 ? books : getMockRecommendations('');
  };

  const handleJoinCrew = (book) => {
    // Check if crew exists, if not, prompt to create
    const crewExists = false; // In real app, check database
    
    if (crewExists) {
      setPage('crews');
    } else {
      if (window.confirm(`No crew found for "${book.title}". Would you like to create one?`)) {
        onCreateCrew(book);
        setPage('crews');
      }
    }
  };

  const handleInviteFriends = (book) => {
    if (navigator.share) {
      navigator.share({
        title: `Let's read ${book.title} together!`,
        text: `I found this amazing book "${book.title}" by ${book.author}. Want to start a reading crew?`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(`Check out "${book.title}" by ${book.author} - let's read together!`);
      alert('Link copied to clipboard!');
    }
  };

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setShowBookDetails(true);
  };

  // Book Details Modal
  if (showBookDetails && selectedBook) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => setShowBookDetails(false)} className="p-1 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900 flex-1">Book Details</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex gap-4 mb-6">
              <div 
                className="w-28 h-36 rounded-xl shadow-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: selectedBook.cover }}
              >
                <BookOpen className="w-12 h-12 text-white opacity-80" />
              </div>
              <div className="flex-1">
                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full font-medium inline-block mb-2">
                  {selectedBook.genre}
                </span>
                <h2 className="font-bold text-gray-900 text-xl">{selectedBook.title}</h2>
                <p className="text-sm text-gray-500">by {selectedBook.author}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StarRating rating={selectedBook.rating} />
                  <span className="text-sm font-medium">{selectedBook.rating}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">About this book</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedBook.description}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Book Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Author</span>
                    <span className="text-gray-900 font-medium">{selectedBook.author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Genre</span>
                    <span className="text-gray-900 font-medium">{selectedBook.genre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pages</span>
                    <span className="text-gray-900 font-medium">{selectedBook.pages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Published</span>
                    <span className="text-gray-900 font-medium">{selectedBook.published}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rating</span>
                    <span className="text-gray-900 font-medium">{selectedBook.rating}/5</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleJoinCrew(selectedBook)}
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-medium"
                >
                  Join Crew
                </button>
                <button
                  onClick={() => handleInviteFriends(selectedBook)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-700"
                >
                  <UserPlus className="w-4 h-4 inline mr-2" />
                  Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => setPage('home')} className="p-1 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">AI Reading Assistant</h1>
              <p className="text-xs text-gray-500">Powered by Groq AI</p>
            </div>
          </div>
        </div>
        <Avatar initials={user?.name?.slice(0, 2)} size="sm" color="#C8622A" />
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
              {message.type === 'ai' && (
                <div className="flex items-center gap-2 mb-1 ml-1">
                  <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">AI Assistant</span>
                </div>
              )}
              
              <div className={`rounded-2xl px-4 py-3 ${
                message.type === 'user' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>

              {/* Book Suggestions */}
              {message.books && message.books.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.books.map((book, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition"
                      onClick={() => handleBookClick(book)}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-12 h-16 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: book.cover }}
                        >
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{book.title}</h4>
                          <p className="text-xs text-gray-500">by {book.author}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <StarRating rating={book.rating} size="xs" />
                            <span className="text-xs text-gray-500 ml-1">{book.rating}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{book.description}</p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinCrew(book);
                              }}
                              className="flex-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium"
                            >
                              Join Crew
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInviteFriends(book);
                              }}
                              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600"
                            >
                              <UserPlus className="w-3 h-3 inline mr-1" />
                              Invite
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-[10px] text-gray-400 mt-1 px-2">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" color="orange" />
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Always visible at bottom */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition">
            <Paperclip className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2">
            <input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
              placeholder="Ask for book recommendations..."
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="p-1 disabled:opacity-50"
            >
              <Send className="w-5 h-5 text-orange-500" />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Ask me about any genre, mood, or book you're looking for!
        </p>
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
      content,
      bookName,
      author,
      image,
      isPublic,
      type: isDonation ? 'donation' : 'post',
      userName: user.name,
      userEmail: user.email,
      createdAt: new Date().toISOString()
    };

    try {
      if (isDonation) {
        await donationAPI.create(postData);
      }
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
          <Avatar initials={user?.name?.slice(0, 2)} size="md" color="#C8622A" />
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

        {/* Book Details */}
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

        {/* Image Preview */}
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

        {/* Post Options */}
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

// ─── CREWS PAGE WITH REAL-TIME CHAT ─────────────────────────────────────────
const CrewsPage = ({ user, crews: initialCrews, setPage }) => {
  const [view, setView] = useState('list'); // 'list', 'chat', 'bookpage', 'about', 'similar'
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [crewMembers, setCrewMembers] = useState([]);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [crews, setCrews] = useState(initialCrews || []);
  const [joinedCrews, setJoinedCrews] = useState([]);
  const [showJoinMessage, setShowJoinMessage] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load joined crews from localStorage
  useEffect(() => {
    const savedJoinedCrews = localStorage.getItem(`user_${user.email}_joinedCrews`);
    if (savedJoinedCrews) {
      setJoinedCrews(JSON.parse(savedJoinedCrews));
    }
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

  const loadCrewMessages = async () => {
    try {
      // In production, fetch from API
      const mockMessages = [
        { 
          id: 1, 
          userId: 'user1', 
          userName: 'Aman', 
          userInitials: 'AM',
          content: 'The part where Morrie says "Once you learn how to die, you learn how to live" really hit me. Such a powerful message!',
          timestamp: new Date(Date.now() - 3600000),
          color: '#7B9EA6'
        },
        { 
          id: 2, 
          userId: 'user2', 
          userName: 'Vikram', 
          userInitials: 'VK',
          content: 'A life-changing book. Makes you appreciate the simple things in life.',
          timestamp: new Date(Date.now() - 1800000),
          color: '#8B5E3C'
        },
        { 
          id: 3, 
          userId: 'user3', 
          userName: 'Deepika', 
          userInitials: 'DP',
          content: "Mitch Albom's writing is so touching. I cried and felt inspired at the same time.",
          timestamp: new Date(Date.now() - 900000),
          color: '#C8956C'
        }
      ];
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadCrewMembers = async () => {
    try {
      // In production, fetch from API
      const mockMembers = [
        { id: 'user1', name: 'Aman', initials: 'AM', color: '#7B9EA6', online: true },
        { id: 'user2', name: 'Vikram', initials: 'VK', color: '#8B5E3C', online: false },
        { id: 'user3', name: 'Deepika', initials: 'DP', color: '#C8956C', online: true }
      ];
      
      // Add current user if they've joined
      if (isUserJoined(selectedCrew?.id)) {
        mockMembers.push({ 
          id: user.id, 
          name: user.name, 
          initials: user.name?.slice(0, 2), 
          color: '#C8622A', 
          online: true 
        });
      }
      
      setCrewMembers(mockMembers);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const loadSimilarBooks = async () => {
    try {
      // In production, fetch from API
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
      timestamp: new Date(),
      color: '#C8622A'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    try {
      // In production, send to API
      await chatAPI.sendMessage(selectedCrew.id, message);
    } catch (error) {
      console.error('Error sending message:', error);
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
    // Update joined crews
    const updatedJoinedCrews = [...joinedCrews, crew.id];
    setJoinedCrews(updatedJoinedCrews);
    localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updatedJoinedCrews));
    
    // Update crew members count
    setCrews(prev => prev.map(c => 
      c.id === crew.id ? { ...c, members: (c.members || 1) + 1 } : c
    ));
    
    // Update user stats
    const updatedUser = {
      ...user,
      stats: {
        ...user.stats,
        crewsJoined: (user.stats?.crewsJoined || 0) + 1
      }
    };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Show join message
    setJoinMessage(`You've joined the ${crew.name} crew! 🎉`);
    setShowJoinMessage(true);
    setTimeout(() => setShowJoinMessage(false), 3000);
  };

  const handleLeaveCrew = (crew) => {
    if (window.confirm(`Are you sure you want to leave ${crew.name}?`)) {
      const updatedJoinedCrews = joinedCrews.filter(id => id !== crew.id);
      setJoinedCrews(updatedJoinedCrews);
      localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updatedJoinedCrews));
      
      setCrews(prev => prev.map(c => 
        c.id === crew.id ? { ...c, members: Math.max(0, (c.members || 1) - 1) } : c
      ));
      
      // Update user stats
      const updatedUser = {
        ...user,
        stats: {
          ...user.stats,
          crewsJoined: Math.max(0, (user.stats?.crewsJoined || 1) - 1)
        }
      };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      if (selectedCrew?.id === crew.id) {
        setView('list');
        setSelectedCrew(null);
      }
    }
  };

  const handleSimilarBookClick = (book) => {
    // Navigate to book details
    setPage('explore');
  };

  // Join message toast
  const JoinMessageToast = () => (
    <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg z-[100] animate-slideDown">
      {joinMessage}
    </div>
  );

  // Chat View
  if (view === 'chat' && selectedCrew) {
    const hasJoined = isUserJoined(selectedCrew.id);

    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {showJoinMessage && <JoinMessageToast />}
        
        {/* Chat Header */}
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
            <button 
              onClick={() => handleLeaveCrew(selectedCrew)}
              className="text-xs text-red-500 px-2 py-1 border border-red-200 rounded-lg"
            >
              Leave
            </button>
          )}
        </div>

        {/* Messages */}
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
                      <Avatar 
                        initials={message.userInitials} 
                        size="sm" 
                        color={message.color}
                        online={crewMembers.find(m => m.id === message.userId)?.online}
                      />
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
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {isTyping && (
                <div className="flex gap-2">
                  <Avatar initials="..." size="sm" color="#C8622A" />
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

        {/* Input Area - Only show if joined */}
        {hasJoined && (
          <div className="bg-white border-t border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Avatar initials={user?.name?.slice(0, 2)} size="sm" color="#C8622A" />
              <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  onKeyDown={handleTyping}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                  placeholder="Type a message..."
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-1 disabled:opacity-50"
                >
                  <Send className="w-5 h-5 text-orange-500" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Book Detail View (Reviews, About, Similar)
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
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Bookmark className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Book Info */}
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
                <span className="text-xs text-gray-400">(22k reviews)</span>
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

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200 mb-4">
            {['Reviews', 'Crew Chat', 'About', 'Similar'].map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab.toLowerCase().replace(' ', ''))}
                className={`text-sm pb-2 font-medium border-b-2 transition ${
                  view === tab.toLowerCase().replace(' ', '')
                    ? 'text-orange-500 border-orange-500'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Reviews Tab */}
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
                    <Avatar initials={`R${i}`} size="sm" color={['#C8622A', '#7B9EA6', '#C8956C'][i-1]} />
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

          {/* Crew Chat Tab */}
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
                      <Avatar initials={msg.userInitials} size="sm" color={msg.color} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{msg.userName}</span>
                          <span className="text-xs text-gray-400">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

          {/* About Tab */}
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

          {/* Similar Books Tab */}
          {view === 'similar' && (
            <div className="space-y-3">
              {similarBooks.map((book, i) => (
                <div 
                  key={i} 
                  className="bg-white rounded-xl p-4 border border-gray-200 cursor-pointer hover:shadow-md transition"
                  onClick={() => handleSimilarBookClick(book)}
                >
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

  // Crews List View
  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {showJoinMessage && <JoinMessageToast />}
      
      <TopBar user={user} setPage={setPage} title="Reading Crews" />
      
      <div className="px-4 py-4">
        {/* Search and Create */}
        <div className="flex gap-2 mb-5">
          <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
              placeholder="Search crews..."
            />
          </div>
          <button className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-semibold shadow-sm">
            Create
          </button>
        </div>

        {/* My Crews */}
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
                </div>
              ))
            )}
          </div>
        </div>

        {/* Discover Crews */}
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
                <div className="px-4 py-3 flex justify-end">
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
  const [readingGoal, setReadingGoal] = useState(user?.readingGoal || { yearly: 20, monthly: 5 });
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [editGoal, setEditGoal] = useState(readingGoal);

  const tabs = ['Posts', 'Reviews', 'Crews', 'Saved'];
  const myPosts = posts.filter(p => p.user === user?.name);

  useEffect(() => {
    // Load user stats from localStorage
    const savedStats = localStorage.getItem(`user_${user.email}_stats`);
    if (savedStats) {
      setUserStats(JSON.parse(savedStats));
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
        {/* Profile Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            <Avatar initials={user?.name?.slice(0, 2)} size="xl" color="#C8622A" />
            <button className="absolute bottom-0 right-0 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white hover:bg-orange-600 transition">
              <Camera className="w-3 h-3 text-white" />
            </button>
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

        {/* Reading Goal Card */}
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
                  min="1"
                  max="100"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Monthly Goal (books)</label>
                <input
                  type="number"
                  value={editGoal.monthly}
                  onChange={(e) => setEditGoal({...editGoal, monthly: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none"
                  min="1"
                  max="20"
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
                <span className="font-semibold text-gray-900">{userStats.booksRead}/{readingGoal.yearly} books</span>
              </div>
              <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${(userStats.booksRead / readingGoal.yearly) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>Monthly: {userStats.booksRead}/{readingGoal.monthly}</span>
                <span>{Math.round((userStats.booksRead / readingGoal.yearly) * 100)}% Complete</span>
              </div>
            </>
          )}
        </div>

        {/* Stats Grid */}
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

        {/* Tabs */}
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

        {/* Posts Tab */}
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
                    <Avatar initials={user?.name?.slice(0, 2)} size="sm" color="#C8622A" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{user?.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <BookOpen className="w-3 h-3 text-orange-500" />
                            <p className="text-xs text-gray-500">{post.book || 'General'}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{post.time || 'Just now'}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{post.content}</p>
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

        {/* Other Tabs */}
        {activeTab !== 'Posts' && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No {activeTab.toLowerCase()} yet</p>
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
  const [crews, setCrews] = useState([
    { id: 1, name: 'Atomic Habits', author: 'James Clear', genre: 'Self Improvement', members: 1, chats: 0, cover: '#E8A87C' },
    { id: 2, name: 'Tuesdays with Morrie', author: 'Mitch Albom', genre: 'Inspiration', members: 1, chats: 0, cover: '#C8622A' },
    { id: 3, name: 'The Alchemist', author: 'Paulo Coelho', genre: 'Fiction', members: 1, chats: 0, cover: '#7B9EA6' },
    { id: 4, name: 'Sapiens', author: 'Yuval Harari', genre: 'History', members: 1, chats: 0, cover: '#C4A882' },
  ]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Check for saved user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
        loadUserData(user);
      } catch (error) {
        console.error('Error loading saved user:', error);
      }
    }
  }, []);

  const loadUserData = async (user) => {
    try {
      // Load user's posts, donations, etc.
      const userPosts = JSON.parse(localStorage.getItem(`user_${user.email}_posts`) || '[]');
      setPosts(userPosts);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
    setCurrentPage('home');
  };

  const handlePost = (postData) => {
    const newPost = {
      id: Date.now(),
      ...postData,
      user: currentUser.name,
      time: 'Just now',
      likes: 0,
      comments: 0,
      shares: 0
    };

    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    
    // Save to localStorage
    localStorage.setItem(`user_${currentUser.email}_posts`, JSON.stringify(updatedPosts));
    
    // Update user stats
    const updatedUser = {
      ...currentUser,
      stats: {
        ...currentUser.stats,
        postsCreated: (currentUser.stats?.postsCreated || 0) + 1
      }
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
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
      createdAt: new Date().toISOString()
    };
    
    setCrews(prev => [newCrew, ...prev]);
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
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 left-4 max-w-md mx-auto px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg z-[100] ${
          notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'error' ? 'bg-red-500' :
          'bg-blue-500'
        }`}>
          {notification.message}
        </div>
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