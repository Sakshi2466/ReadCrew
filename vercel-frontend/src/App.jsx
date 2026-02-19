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
import axios from 'axios';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'https://versal-book-app.onrender.com';

// Validation functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
const TopBar = ({ user, setPage, title, showBack = false, onBack, showProfile = true, onNotificationClick, unreadCount = 0 }) => (
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
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {unreadCount}
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
const NotificationsPage = ({ user, onClose, onMarkAsRead }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const userNotifications = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    // Sort by timestamp descending (newest first)
    userNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setNotifications(userNotifications);
  };

  const markAsRead = (notificationId) => {
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
    
    // Update unread count in parent
    const unreadCount = updated.filter(n => !n.read).length;
    onMarkAsRead(unreadCount);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
    onMarkAsRead(0);
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'like': return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'message': return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'review': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'invite': return <UserPlus className="w-4 h-4 text-purple-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationBg = (type) => {
    switch(type) {
      case 'like': return 'bg-red-100';
      case 'comment': return 'bg-blue-100';
      case 'message': return 'bg-green-100';
      case 'review': return 'bg-yellow-100';
      case 'invite': return 'bg-purple-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-semibold text-gray-900">Notifications</h2>
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllAsRead}
            className="text-sm text-orange-500 font-medium"
          >
            Mark all read
          </button>
        )}
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
                className={`p-4 cursor-pointer transition ${notif.read ? 'bg-white hover:bg-gray-50' : 'bg-orange-50 hover:bg-orange-100'}`}
                onClick={() => markAsRead(notif.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationBg(notif.type)}`}>
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notif.timestamp).toLocaleString()}
                    </p>
                    {notif.type === 'message' && notif.crewName && (
                      <p className="text-xs text-orange-500 mt-1">in {notif.crewName}</p>
                    )}
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
      // Mock OTP send
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('devOTP', otp);
      setShowOTP(true);
      alert(`Your OTP is: ${otp}`);
    } catch (error) {
      console.error('Error sending OTP:', error);
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
    } catch (error) {
      console.error('Error verifying OTP:', error);
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
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
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const foundUser = users.find(u => u.email === email && u.password === password);
                
                if (foundUser) {
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
const HomePage = ({ user, setPage }) => {
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const [feedPosts, setFeedPosts] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookDetails, setShowBookDetails] = useState(false);
  const [bookDetails, setBookDetails] = useState(null);
  const [loadingBookDetails, setLoadingBookDetails] = useState(false);
  const [joinedCrews, setJoinedCrews] = useState([]);
  const [userStats, setUserStats] = useState({
    booksRead: user?.stats?.booksRead || 0,
    reviewsGiven: user?.stats?.reviewsGiven || 0,
    postsCreated: user?.stats?.postsCreated || 0,
    crewsJoined: user?.stats?.crewsJoined || 0
  });

  useEffect(() => {
    loadTrendingBooks();
    loadFeedPosts();
    calculateReadingProgress();
    
    const savedStats = localStorage.getItem(`user_${user.email}_stats`);
    if (savedStats) {
      setUserStats(JSON.parse(savedStats));
    }

    const savedJoinedCrews = JSON.parse(localStorage.getItem(`user_${user.email}_joinedCrews`) || '[]');
    setJoinedCrews(savedJoinedCrews);
  }, [user.email]);

  const loadTrendingBooks = async () => {
    setLoadingTrending(true);
    try {
      setTrendingBooks([
        { id: 1, title: 'Atomic Habits', author: 'James Clear', rating: 4.8, readers: 15420, cover: '#E8A87C' },
        { id: 2, title: 'The Psychology of Money', author: 'Morgan Housel', rating: 4.7, readers: 12350, cover: '#7B9EA6' },
        { id: 3, title: 'Deep Work', author: 'Cal Newport', rating: 4.6, readers: 9870, cover: '#2D2D2D' },
        { id: 4, title: 'Sapiens', author: 'Yuval Harari', rating: 4.8, readers: 21500, cover: '#C4A882' },
      ]);
    } catch (error) {
      console.error('Error loading trending books:', error);
    } finally {
      setLoadingTrending(false);
    }
  };

  const loadFeedPosts = () => {
    const allPosts = JSON.parse(localStorage.getItem('all_posts') || '[]');
    allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setFeedPosts(allPosts.slice(0, 10));
  };

  const calculateReadingProgress = () => {
    if (user?.readingGoal?.yearly > 0) {
      const progress = (userStats.booksRead / user.readingGoal.yearly) * 100;
      setReadingProgress(Math.min(progress, 100));
    } else {
      setReadingProgress(0);
    }
  };

  const handleLikePost = (postId) => {
    const allPosts = JSON.parse(localStorage.getItem('all_posts') || '[]');
    const postIndex = allPosts.findIndex(p => p.id === postId);
    
    if (postIndex !== -1) {
      const post = allPosts[postIndex];
      
      if (!post.likedBy) post.likedBy = [];
      
      if (post.likedBy.includes(user.email)) {
        post.likes = (post.likes || 1) - 1;
        post.likedBy = post.likedBy.filter(email => email !== user.email);
      } else {
        post.likes = (post.likes || 0) + 1;
        post.likedBy = [...(post.likedBy || []), user.email];
        
        if (post.userEmail !== user.email) {
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
      }
      
      allPosts[postIndex] = post;
      localStorage.setItem('all_posts', JSON.stringify(allPosts));
      loadFeedPosts();
    }
  };

  const handleComment = (postId) => {
    const commentText = prompt('Enter your comment:');
    if (commentText && commentText.trim()) {
      const allPosts = JSON.parse(localStorage.getItem('all_posts') || '[]');
      const postIndex = allPosts.findIndex(p => p.id === postId);
      
      if (postIndex !== -1) {
        const post = allPosts[postIndex];
        
        if (!post.comments) post.comments = [];
        const newComment = {
          id: Date.now(),
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          text: commentText,
          timestamp: new Date().toISOString()
        };
        
        post.comments.push(newComment);
        post.commentCount = (post.commentCount || 0) + 1;
        allPosts[postIndex] = post;
        localStorage.setItem('all_posts', JSON.stringify(allPosts));
        
        if (post.userEmail !== user.email) {
          const notification = {
            id: Date.now(),
            type: 'comment',
            fromUser: user.name,
            fromUserEmail: user.email,
            postId: postId,
            message: `${user.name} commented on your post: "${commentText.substring(0, 30)}${commentText.length > 30 ? '...' : ''}"`,
            timestamp: new Date().toISOString(),
            read: false
          };
          
          const userNotifications = JSON.parse(localStorage.getItem(`user_${post.userEmail}_notifications`) || '[]');
          userNotifications.unshift(notification);
          localStorage.setItem(`user_${post.userEmail}_notifications`, JSON.stringify(userNotifications));
        }
        
        loadFeedPosts();
        alert('Comment added!');
      }
    }
  };

  const handleShare = (postId) => {
    const allPosts = JSON.parse(localStorage.getItem('all_posts') || '[]');
    const postIndex = allPosts.findIndex(p => p.id === postId);
    
    if (postIndex !== -1) {
      allPosts[postIndex].shares = (allPosts[postIndex].shares || 0) + 1;
      localStorage.setItem('all_posts', JSON.stringify(allPosts));
      loadFeedPosts();
      alert('Post shared!');
    }
  };

  const handleBookClick = async (book) => {
    setSelectedBook(book);
    setShowBookDetails(true);
    setLoadingBookDetails(true);
    
    try {
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

  const hasReadingGoal = user?.readingGoal?.yearly > 0 || user?.readingGoal?.monthly > 0;

  const isPostLiked = (post) => {
    return post.likedBy?.includes(user.email) || false;
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <TopBar user={user} setPage={setPage} title="Home" />
      
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
                        const newCrew = {
                          id: Date.now(),
                          name: selectedBook.title,
                          author: selectedBook.author,
                          genre: bookDetails.genre || 'General',
                          members: 1,
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
                    <button className="px-4 py-3 border border-gray-200 rounded-xl">
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
          
          {!hasReadingGoal && (
            <button
              onClick={() => setPage('profile')}
              className="mt-3 w-full bg-white/20 hover:bg-white/30 rounded-xl py-2 text-sm font-medium transition"
            >
              Set Reading Goals →
            </button>
          )}
        </div>

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
              feedPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
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
                          {new Date(post.createdAt).toLocaleDateString()}
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
                    {post.content}
                  </p>
                  
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                    <button 
                      onClick={() => handleLikePost(post.id)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-500"
                    >
                      <Heart className={`w-4 h-4 ${isPostLiked(post) ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{post.likes || 0}</span>
                    </button>
                    <button 
                      onClick={() => handleComment(post.id)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-500"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.commentCount || 0}</span>
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

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Top Trending Books
            </h2>
            <button 
              onClick={() => setPage('explore')}
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
            {(() => {
              const allCrews = JSON.parse(localStorage.getItem('crews') || '[]');
              const userJoinedCrews = allCrews.filter(crew => joinedCrews.includes(crew.id)).slice(0, 2);
              
              return userJoinedCrews.length > 0 ? (
                userJoinedCrews.map(crew => (
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
                ))
              ) : (
                <div className="col-span-2 bg-white rounded-xl p-6 text-center border border-gray-200">
                  <p className="text-gray-500 text-sm">You haven't joined any crews yet</p>
                  <button 
                    onClick={() => setPage('crews')}
                    className="mt-2 text-orange-500 text-sm font-medium"
                  >
                    Browse Crews →
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── EXPLORE PAGE ─────────────────────────────────────────────────────────
const ExplorePage = ({ user, setPage, onCreateCrew }) => {
  const [query, setQuery] = useState('');
  const [intensity, setIntensity] = useState(50);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const handleFindBook = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setSearched(true);
    setResults([]);

    try {
      const response = await axios.post(`${API_URL}/api/recommend/ai`, {
        query: query
      });

      if (response.data.success && response.data.recommendations) {
        setResults(response.data.recommendations);
      } else {
        throw new Error('No recommendations');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setResults([
        { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', description: 'Tiny changes, remarkable results', rating: 4.8 },
        { title: 'The Martian', author: 'Andy Weir', genre: 'Sci-Fi', description: 'Survival on Mars', rating: 4.7 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCrewFromBook = (book) => {
    onCreateCrew({
      title: book.title,
      author: book.author,
      genre: book.genre || 'General'
    });
    setPage('crews');
  };

  const getBookColor = (title) => {
    const colors = ['#C8622A', '#7B9EA6', '#8B5E3C', '#C8956C'];
    const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

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
                      <button 
                        onClick={() => handleCreateCrewFromBook(book)} 
                        className="flex-1 py-2.5 bg-[#C8622A] text-white rounded-xl text-sm font-semibold"
                      >
                        Create Crew
                      </button>
                      <button className="px-4 py-2.5 border border-[#EDE8E3] rounded-xl">
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

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-b from-[#F5E6D3] to-[#FAF6F1]">
      <div className="px-5 pt-12 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-[2rem] font-bold text-[#2D1F14] leading-tight mb-3">
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFindBook()}
            className="w-full bg-[#FAF8F5] border border-[#E8E0D8] rounded-2xl px-4 py-3.5 text-[#2D1F14] text-base outline-none focus:border-[#C8622A] mb-3"
            placeholder="e.g., fantasy books with magic"
          />
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
const PostPage = ({ user, setPage }) => {
  const [content, setContent] = useState('');
  const [bookName, setBookName] = useState('');
  const [author, setAuthor] = useState('');
  const [image, setImage] = useState(null);
  const fileRef = useRef();

  const handleSubmit = () => {
    if (!content.trim()) return;

    const postData = {
      id: Date.now(),
      content,
      bookName,
      author,
      image,
      userName: user.name,
      userEmail: user.email,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      commentCount: 0,
      comments: [],
      shares: 0
    };

    // Save to all posts
    const allPosts = JSON.parse(localStorage.getItem('all_posts') || '[]');
    allPosts.unshift(postData);
    localStorage.setItem('all_posts', JSON.stringify(allPosts));

    // Update user stats
    const updatedStats = {
      ...user.stats,
      postsCreated: (user.stats?.postsCreated || 0) + 1
    };
    
    const updatedUser = {
      ...user,
      stats: updatedStats
    };
    
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(updatedStats));

    setPage('home');
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
              placeholder="What are you reading?"
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

        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700"
        >
          <Camera className="w-4 h-4" />
          Add Photo
        </button>

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
    review: ''
  });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = () => {
    const savedReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    savedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setReviews(savedReviews);
    setLoading(false);
  };

  const handleCreateReview = () => {
    if (!newReview.bookName || !newReview.author || !newReview.review) {
      alert('Please fill all fields');
      return;
    }

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
    
    // Create notification
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
    
    setReviews([reviewData, ...reviews]);
    setShowCreateForm(false);
    setNewReview({
      bookName: '',
      author: '',
      rating: 5,
      review: ''
    });
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
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
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
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString()}
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
const CrewsPage = ({ user, setPage }) => {
  const [view, setView] = useState('list');
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [crewMembers, setCrewMembers] = useState([]);
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

  useEffect(() => {
    loadCrews();
    loadJoinedCrews();
  }, []);

  useEffect(() => {
    if (selectedCrew) {
      loadCrewMessages();
      loadCrewMembers();
      scrollToBottom();
    }
  }, [selectedCrew]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadCrews = () => {
    const savedCrews = JSON.parse(localStorage.getItem('crews') || '[]');
    setCrews(savedCrews);
  };

  const loadJoinedCrews = () => {
    const savedJoinedCrews = JSON.parse(localStorage.getItem(`user_${user.email}_joinedCrews`) || '[]');
    setJoinedCrews(savedJoinedCrews);
  };

  const loadCrewMessages = () => {
    const crewMessages = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`) || '[]');
    setMessages(crewMessages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
  };

  const loadCrewMembers = () => {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const members = allUsers
      .filter(u => u.joinedCrews?.includes(selectedCrew.id))
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        initials: u.name?.slice(0, 2),
        color: '#C8622A',
        online: true
      }));
    
    setCrewMembers(members);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedCrew || !isUserJoined(selectedCrew.id)) return;

    const message = {
      id: Date.now(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
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

    // Notify other crew members
    crewMembers.forEach(member => {
      if (member.email !== user.email) {
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

        const memberNotifications = JSON.parse(localStorage.getItem(`user_${member.email}_notifications`) || '[]');
        memberNotifications.unshift(notification);
        localStorage.setItem(`user_${member.email}_notifications`, JSON.stringify(memberNotifications));
      }
    });
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
          <button onClick={() => setView('details')} className="p-1 hover:bg-gray-100 rounded-lg">
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
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{selectedCrew.name}</p>
              <p className="text-xs text-gray-500">
                {crewMembers.length} member{crewMembers.length !== 1 ? 's' : ''}
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
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {hasJoined && (
          <div className="bg-white border-t border-gray-200 px-4 py-3">
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
                  }}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                  placeholder="Type a message..."
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-1.5 disabled:opacity-50"
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

  if (view === 'details' && selectedCrew) {
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
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{crewMembers.length} members</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 border-b border-gray-200 mb-4">
            <button
              onClick={() => setView('chat')}
              className="text-sm pb-2 font-medium border-b-2 text-orange-500 border-orange-500"
            >
              Chat
            </button>
            <button
              className="text-sm pb-2 font-medium text-gray-500"
            >
              Members
            </button>
          </div>

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
            <button
              onClick={() => setView('chat')}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-4 font-semibold mb-4"
            >
              Go to Chat
            </button>
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
          <span className="font-bold text-gray-900">Reading Crews</span>
        </div>
        <button
          onClick={() => setShowCreateCrewForm(true)}
          className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium"
        >
          Create Crew
        </button>
      </div>
      
      <div className="px-4 py-4">
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

        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            My Crews
          </h2>
          <div className="space-y-3">
            {crews.filter(crew => isUserJoined(crew.id)).length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                <p className="text-gray-500 text-sm">You haven't joined any crews yet</p>
              </div>
            ) : (
              crews.filter(crew => isUserJoined(crew.id)).map(crew => (
                <div
                  key={crew.id}
                  className="bg-white rounded-xl overflow-hidden border border-green-200 shadow-sm cursor-pointer hover:shadow-md transition relative"
                  onClick={() => { setSelectedCrew(crew); setView('details'); }}
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

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Discover Crews</h2>
          <div className="space-y-3">
            {crews.filter(crew => !isUserJoined(crew.id)).map(crew => (
              <div
                key={crew.id}
                className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition"
                onClick={() => { setSelectedCrew(crew); setView('details'); }}
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
const ProfilePage = ({ user, setPage, onLogout }) => {
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
  const [userPosts, setUserPosts] = useState([]);
  const fileRef = useRef();

  const tabs = ['Posts', 'Reviews', 'Crews'];

  useEffect(() => {
    const savedStats = localStorage.getItem(`user_${user.email}_stats`);
    if (savedStats) {
      setUserStats(JSON.parse(savedStats));
    }
    
    const savedImage = localStorage.getItem(`user_${user.email}_profile_image`);
    if (savedImage) {
      setProfileImage(savedImage);
    }

    // Load user posts
    const allPosts = JSON.parse(localStorage.getItem('all_posts') || '[]');
    const myPosts = allPosts.filter(p => p.userEmail === user.email);
    setUserPosts(myPosts);
  }, [user.email]);

  const handleSaveGoal = () => {
    const updatedUser = {
      ...user,
      readingGoal: editGoal
    };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setReadingGoal(editGoal);
    setShowEditGoal(false);
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

  const readingProgress = readingGoal.yearly > 0 
    ? Math.min((userStats.booksRead / readingGoal.yearly) * 100, 100) 
    : 0;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-gray-900">Profile</span>
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
                      style={{ width: `${readingProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>Monthly: {readingGoal.monthly > 0 ? `${userStats.booksRead}/${readingGoal.monthly}` : 'No goal'}</span>
                    <span>{Math.round(readingProgress)}% Complete</span>
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
            {userPosts.length === 0 ? (
              <div className="text-center py-8">
                <Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No posts yet</p>
              </div>
            ) : (
              userPosts.map(post => (
                <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-700 mb-3">{post.content}</p>
                  {post.bookName && (
                    <p className="text-xs text-gray-500">Book: {post.bookName}</p>
                  )}
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100 mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Heart className="w-4 h-4" /> {post.likes || 0}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MessageCircle className="w-4 h-4" /> {post.commentCount || 0}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'Reviews' && (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Your reviews will appear here</p>
          </div>
        )}

        {activeTab === 'Crews' && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Your crews will appear here</p>
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
        updateUnreadCount(user);
      } catch (error) {
        console.error('Error loading saved user:', error);
      }
    }

    // Initialize default crews if none exist
    if (!localStorage.getItem('crews')) {
      const defaultCrews = [
        { id: 1, name: 'Atomic Habits', author: 'James Clear', genre: 'Self Improvement', members: 1, cover: '#E8A87C' },
        { id: 2, name: 'Tuesdays with Morrie', author: 'Mitch Albom', genre: 'Inspiration', members: 1, cover: '#C8622A' },
        { id: 3, name: 'The Alchemist', author: 'Paulo Coelho', genre: 'Fiction', members: 1, cover: '#7B9EA6' },
        { id: 4, name: 'Sapiens', author: 'Yuval Harari', genre: 'History', members: 1, cover: '#C4A882' },
      ];
      localStorage.setItem('crews', JSON.stringify(defaultCrews));
    }
  }, []);

  const updateUnreadCount = (user) => {
    const notifications = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  };

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
    setCurrentPage('home');
    updateUnreadCount(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleCreateCrew = (book) => {
    const newCrew = {
      id: Date.now(),
      name: book.title,
      author: book.author,
      genre: book.genre || 'General',
      members: 1,
      cover: '#C8622A',
      createdBy: currentUser.email,
      createdAt: new Date().toISOString(),
      messages: []
    };
    
    const existingCrews = JSON.parse(localStorage.getItem('crews') || '[]');
    existingCrews.push(newCrew);
    localStorage.setItem('crews', JSON.stringify(existingCrews));
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
      {showNotifications && (
        <NotificationsPage 
          user={currentUser} 
          onClose={() => {
            setShowNotifications(false);
            updateUnreadCount(currentUser);
          }}
          onMarkAsRead={(count) => setUnreadCount(count)}
        />
      )}

      <div className="max-w-md mx-auto relative">
        {currentPage === 'home' && (
          <HomePage 
            user={currentUser}
            setPage={setCurrentPage}
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
            setPage={setCurrentPage} 
          />
        )}
        
        {currentPage === 'crews' && (
          <CrewsPage 
            user={currentUser} 
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
            setPage={setCurrentPage}
            onLogout={handleLogout}
          />
        )}
        
        <BottomNav 
          active={currentPage} 
          setPage={setCurrentPage} 
          unreadCount={unreadCount}
        />
      </div>
    </div>
  );
}