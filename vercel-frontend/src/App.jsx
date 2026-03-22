// ========================================
// LINE 1: App.jsx - Complete ReadCrew Application (10000+ lines)
// Modern Social Reading Platform with Gen-Z Aesthetic
// All features: Posts, Comments, Likes, Follows, Crews, Notifications, AI Book Discovery
// ========================================

// LINE 10: Imports
import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import {
  // LINE 15: Core Icons - Modern UI Kit
  BookOpen, Home, Search, Edit3, Users, User, Bell, Settings,
  Heart, MessageCircle, Bookmark, Share2, Star, Plus, ChevronRight,
  X, Send, Image as ImageIcon, ChevronLeft, LogOut, Camera, MoreHorizontal,
  Sparkles, Lock, Eye, EyeOff, UserPlus, Gift, ThumbsUp, ThumbsDown,
  Trash2, Edit, Target, Check, ArrowLeft, Clock, TrendingUp, Menu, Upload,
  Calendar, Award, MessageSquare, Globe, ChevronDown, Filter,
  Paperclip, Mail, Phone, ExternalLink,
  Link2, AtSign, Flag, Pin,
  CheckCheck, BookMarked, PlusCircle, MapPin, Navigation, Map, Repeat,
  UserCheck, UserMinus, Wifi, WifiOff,
  AlertCircle, CheckCircle, Info,
  Play, Pause, Volume2, Mic, Leaf, Sparkle,
  Instagram, Facebook, Twitter, Hash, AtSign as AtIcon,
  List, Grid, ThumbsUp as ThumbsUpIcon, ThumbsDown as ThumbsDownIcon,
  HelpCircle, Coffee, Music, Film, Camera as CameraIcon,
  Video, Image as ImageIcon2, Download, Upload as UploadIcon,
  RefreshCw, RotateCcw, Maximize2, Minimize2, VolumeX,
  Volume1, Volume2 as Volume2Icon, SkipBack, SkipForward,
  Circle, Square, Triangle, Sun, Moon, Cloud,
  CloudRain, CloudSnow, CloudLightning, Wind, Droplets,
  Thermometer, Sunrise, Sunset, Compass, Anchor,
  Ship, Plane, Train, Car, Bike, Bus, Truck,
  Rocket, Satellite, Globe as GlobeIcon,
  Map as MapIcon, MapPin as MapPinIcon, Navigation as NavigationIcon,
  Compass as CompassIcon, Briefcase, Building, Home as HomeIcon,
  Hospital, School, Store, Restaurant, Cafe, Hotel,
  Church, Mosque, Temple, Park, Museum, Library,
  Stadium, Theatre, Cinema, Music as MusicIcon, Radio,
  Headphones, Speaker, Mic as MicIcon, Podcast,
  Tv, Monitor, Laptop, Tablet, Smartphone, Watch,
  Clock as ClockIcon, AlarmClock, Timer, Stopwatch,
  Hourglass, Calendar as CalendarIcon, CalendarDays,
  CalendarRange, CalendarCheck, CalendarX, CalendarPlus,
  CalendarMinus, CalendarHeart, CalendarSearch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { io } from 'socket.io-client';

// ========================================
// LINE 80: Configuration & Context
// ========================================

const API_URL = process.env.REACT_APP_API_URL || 'https://versal-book-app.onrender.com';
const socket = io(API_URL, { 
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});

// App Context for global state
const AppContext = createContext();

// Theme colors - Gen-Z aesthetic
const THEME = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#FFE66D',
  dark: '#2C3E50',
  light: '#F7F9FC',
  gradient: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
  glass: 'rgba(255, 255, 255, 0.95)',
  shadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  blur: 'blur(10px)'
};

// ========================================
// LINE 110: SECTION 1 - UTILITY FUNCTIONS (Enhanced)
// ========================================

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  if (weeks < 4) return `${weeks}w`;
  if (months < 12) return `${months}mo`;
  return `${years}y`;
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const sanitizeText = (text) => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br/>');
};

const extractMentions = (text) => {
  const mentions = text.match(/@(\w+)/g) || [];
  return mentions.map(m => m.substring(1));
};

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// ========================================
// LINE 150: SECTION 2 - NOTIFICATION SYSTEM (Enhanced)
// ========================================

const pushNotification = (targetEmail, notif) => {
  const full = {
    id: generateId(),
    ...notif,
    timestamp: new Date().toISOString(),
    read: false,
  };
  
  const list = JSON.parse(localStorage.getItem(`user_${targetEmail}_notifications`) || '[]');
  list.unshift(full);
  if (list.length > 200) list.length = 200;
  localStorage.setItem(`user_${targetEmail}_notifications`, JSON.stringify(list));
  
  window.dispatchEvent(new CustomEvent('rc:notif', { detail: { targetEmail } }));
  socket.emit('send_notification', { toEmail: targetEmail, notification: full });
};

const getUnreadCount = (email) => {
  const notifs = JSON.parse(localStorage.getItem(`user_${email}_notifications`) || '[]');
  return notifs.filter(n => !n.read && n.type !== 'message').length;
};

const markAllNotificationsRead = (email) => {
  const notifs = JSON.parse(localStorage.getItem(`user_${email}_notifications`) || '[]');
  const updated = notifs.map(n => ({ ...n, read: true }));
  localStorage.setItem(`user_${email}_notifications`, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('rc:notif', { detail: { targetEmail: email } }));
};

// ========================================
// LINE 180: SECTION 3 - ANIMATED COMPONENTS (Gen-Z Aesthetic)
// ========================================

const AnimatedButton = ({ children, onClick, variant = 'primary', className = '', disabled = false, loading = false }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-white/90 backdrop-blur-sm text-gray-700 border border-gray-200 hover:border-[#FF6B6B]',
    outline: 'border-2 border-[#FF6B6B] text-[#FF6B6B] hover:bg-[#FF6B6B] hover:text-white',
    ghost: 'text-gray-600 hover:bg-gray-100'
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : children}
    </motion.button>
  );
};

const AnimatedCard = ({ children, className = '', onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    whileHover={{ y: -4 }}
    transition={{ duration: 0.2 }}
    onClick={onClick}
    className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
  >
    {children}
  </motion.div>
);

const SkeletonLoader = ({ type = 'post' }) => {
  if (type === 'post') {
    return (
      <div className="bg-white rounded-2xl p-4 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-24" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 p-4 animate-pulse">
      <div className="w-12 h-12 bg-gray-200 rounded-full" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-24" />
      </div>
    </div>
  );
};

// ========================================
// LINE 250: SECTION 4 - AVATAR WITH STATUS (Enhanced)
// ========================================

const Avatar = ({ name, src, size = 'md', online, onClick, badge }) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };

  const gradients = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-orange-500',
    'from-red-500 to-pink-500'
  ];

  const getGradient = () => {
    const hash = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  const initials = name?.slice(0, 2).toUpperCase() || '??';

  return (
    <div className="relative shrink-0 cursor-pointer" onClick={onClick}>
      {src ? (
        <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white shadow-md`} />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${getGradient()} flex items-center justify-center font-semibold text-white shadow-md`}>
          {initials}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse" />
      )}
      {badge && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
          {badge}
        </span>
      )}
    </div>
  );
};

// ========================================
// LINE 300: SECTION 5 - DYNAMIC BOOK COVER (Enhanced)
// ========================================

const BookCover = ({ title, author, size = 'md', onClick, rating }) => {
  const [coverUrl, setCoverUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const sizeMap = {
    xs: 'w-12 h-16',
    sm: 'w-16 h-20',
    md: 'w-24 h-32',
    lg: 'w-32 h-40',
    xl: 'w-40 h-48',
    '2xl': 'w-48 h-56'
  };

  useEffect(() => {
    if (!title) {
      setError(true);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchCover = async () => {
      const query = encodeURIComponent(author ? `${title} ${author}` : title);
      
      try {
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`,
          { signal: AbortSignal.timeout(5000) }
        );
        
        if (response.ok && isMounted) {
          const data = await response.json();
          const imageLinks = data.items?.[0]?.volumeInfo?.imageLinks;
          if (imageLinks) {
            const url = imageLinks.thumbnail || imageLinks.smallThumbnail;
            if (url) {
              setCoverUrl(url.replace('http:', 'https:'));
              setLoading(false);
              return;
            }
          }
        }
      } catch (error) {}

      try {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=${query}&limit=1`,
          { signal: AbortSignal.timeout(5000) }
        );
        
        if (response.ok && isMounted) {
          const data = await response.json();
          const book = data.docs?.[0];
          if (book?.cover_i) {
            setCoverUrl(`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`);
            setLoading(false);
            return;
          }
        }
      } catch (error) {}

      if (isMounted) {
        setError(true);
        setLoading(false);
      }
    };

    fetchCover();
    return () => { isMounted = false; };
  }, [title, author]);

  const getFallbackColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'];
    const hash = (title || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (loading) {
    return (
      <div className={`${sizeMap[size]} bg-gray-200 rounded-xl animate-pulse flex items-center justify-center`} onClick={onClick}>
        <BookOpen className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  if (error || !coverUrl) {
    return (
      <div
        className={`${sizeMap[size]} rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg cursor-pointer transition-transform hover:scale-105`}
        style={{ backgroundColor: getFallbackColor() }}
        onClick={onClick}
      >
        <span className="text-lg">{title?.slice(0, 2).toUpperCase() || 'BK'}</span>
        {rating && (
          <div className="flex items-center gap-0.5 mt-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs">{rating}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${sizeMap[size]} rounded-xl overflow-hidden shadow-lg cursor-pointer transition-transform hover:scale-105`} onClick={onClick}>
      <img src={coverUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
    </div>
  );
};

// ========================================
// LINE 400: SECTION 6 - STAR RATING (Interactive)
// ========================================

const StarRating = ({ rating = 0, onChange, size = 'md', readonly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <motion.button
          key={i}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => !readonly && onChange?.(i)}
          onMouseEnter={() => !readonly && setHoverRating(i)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          className={`${sizes[size]} ${!readonly && 'cursor-pointer'}`}
        >
          <Star
            className={`transition-all duration-150 ${
              i <= (hoverRating || rating)
                ? 'fill-[#FFE66D] text-[#FFE66D] drop-shadow-sm'
                : 'fill-gray-200 text-gray-300'
            }`}
          />
        </motion.button>
      ))}
    </div>
  );
};

// ========================================
// LINE 440: SECTION 7 - LOADING SPINNER (Animated)
// ========================================

const LoadingSpinner = ({ size = 'md', fullScreen = false }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12', xl: 'w-16 h-16' };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="relative">
          <div className={`${sizes[size]} border-4 border-[#FF6B6B] border-t-transparent rounded-full animate-spin`} />
          <div className={`${sizes[size]} border-4 border-[#4ECDC4] border-t-transparent rounded-full animate-spin absolute inset-0 opacity-50`} style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={`${sizes[size]} border-3 border-[#FF6B6B] border-t-transparent rounded-full animate-spin`} />
    </div>
  );
};

// ========================================
// LINE 480: SECTION 8 - TOAST NOTIFICATION (Animated)
// ========================================

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] w-[90%] max-w-sm"
    >
      <div className={`rounded-2xl shadow-xl border p-4 flex items-center gap-3 ${colors[type]}`}>
        {icons[type]}
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button onClick={onClose} className="opacity-60 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// ========================================
// LINE 530: SECTION 9 - BOTTOM NAVIGATION (Gen-Z Style)
// ========================================

const BottomNav = ({ active, setPage, unreadCount = 0 }) => {
  const items = [
    { id: 'home', icon: Home, label: 'Home', activeIcon: Home },
    { id: 'explore', icon: Compass, label: 'Explore', activeIcon: Compass },
    { id: 'post', icon: Edit3, label: 'Post', activeIcon: Edit3, isSpecial: true },
    { id: 'reviews', icon: Star, label: 'Reviews', activeIcon: Star },
    { id: 'profile', icon: User, label: 'Profile', activeIcon: User }
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-50 max-w-md mx-auto shadow-2xl"
    >
      <div className="flex items-center justify-around py-2 px-2">
        {items.map(({ id, icon: Icon, activeIcon: ActiveIcon, label, isSpecial }) => {
          const isActive = active === id;
          return (
            <motion.button
              key={id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative ${
                isActive ? 'text-[#FF6B6B]' : 'text-gray-400'
              }`}
            >
              {isSpecial ? (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center -mt-6 shadow-lg ${
                    isActive ? 'bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4]' : 'bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </motion.div>
              ) : (
                <>
                  {isActive ? (
                    <ActiveIcon className="w-5 h-5" strokeWidth={2.5} />
                  ) : (
                    <Icon className="w-5 h-5" strokeWidth={1.8} />
                  )}
                  {id === 'home' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  <span className="text-[10px] font-medium mt-1">{label}</span>
                </>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

// ========================================
// LINE 600: SECTION 10 - TOP BAR (Glassmorphism)
// ========================================

const TopBar = ({ user, setPage, title, showBack = false, onBack, onNotificationClick, notificationCount = 0 }) => (
  <motion.header
    initial={{ y: -100 }}
    animate={{ y: 0 }}
    className="sticky top-0 bg-white/80 backdrop-blur-xl z-40 px-4 py-3 flex items-center justify-between border-b border-gray-100"
  >
    <div className="flex items-center gap-3">
      {showBack && (
        <motion.button whileTap={{ scale: 0.95 }} onClick={onBack} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </motion.button>
      )}
      <div className="flex items-center gap-2">
        <motion.div
          whileHover={{ rotate: 5 }}
          className="w-8 h-8 bg-gradient-to-br from-[#FF6B6B] to-[#4ECDC4] rounded-xl flex items-center justify-center shadow-md"
        >
          <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5} />
        </motion.div>
        <span className="font-bold text-gray-900 text-xl bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] bg-clip-text text-transparent">
          {title || 'ReadCrew'}
        </span>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onNotificationClick}
        className="relative p-2 hover:bg-gray-100 rounded-full transition"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {notificationCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold"
          >
            {notificationCount > 9 ? '9+' : notificationCount}
          </motion.span>
        )}
      </motion.button>
      <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPage('profile')}>
        <Avatar name={user?.name} size="sm" src={user?.profileImage} />
      </motion.button>
    </div>
  </motion.header>
);

// ========================================
// LINE 660: SECTION 11 - NOTIFICATIONS PAGE (Fixed)
// ========================================

const NotificationsPage = ({ user, onClose, updateNotificationCount }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    const handleStorageChange = () => loadNotifications();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('rc:notif', loadNotifications);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('rc:notif', loadNotifications);
    };
  }, [user.email]);

  const loadNotifications = () => {
    const allNotifs = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    setNotifications(allNotifs.filter(n => n.type !== 'message'));
    setLoading(false);
  };

  const markAsRead = (id) => {
    const allNotifs = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    const updated = allNotifs.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
    loadNotifications();
    updateNotificationCount?.();
  };

  const markAllAsRead = () => {
    const allNotifs = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    const updated = allNotifs.map(n => ({ ...n, read: true }));
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
    loadNotifications();
    updateNotificationCount?.();
  };

  const deleteNotification = (id) => {
    const allNotifs = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    const updated = allNotifs.filter(n => n.id !== id);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
    loadNotifications();
    updateNotificationCount?.();
  };

  const icons = {
    like: <Heart className="w-4 h-4 text-red-500" />,
    comment: <MessageCircle className="w-4 h-4 text-blue-500" />,
    follow: <UserPlus className="w-4 h-4 text-green-500" />,
    reshare: <Repeat className="w-4 h-4 text-purple-500" />,
    mention: <AtIcon className="w-4 h-4 text-amber-500" />,
    review: <Star className="w-4 h-4 text-yellow-500" />,
    invite: <UserPlus className="w-4 h-4 text-indigo-500" />,
    join: <Users className="w-4 h-4 text-cyan-500" />
  };

  const bgColors = {
    like: 'bg-red-100',
    comment: 'bg-blue-100',
    follow: 'bg-green-100',
    reshare: 'bg-purple-100',
    mention: 'bg-amber-100',
    review: 'bg-yellow-100',
    invite: 'bg-indigo-100',
    join: 'bg-cyan-100'
  };

  const hasUnread = notifications.some(n => !n.read);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden"
        style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between flex-shrink-0">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="font-bold text-lg bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] bg-clip-text text-transparent">
            Notifications
          </h2>
          <button
            onClick={markAllAsRead}
            className={`text-sm font-medium px-3 py-1.5 rounded-full transition ${
              hasUnread ? 'bg-[#FF6B6B] text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!hasUnread}
          >
            Mark all read
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : notifications.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No notifications yet</p>
              <p className="text-sm text-gray-300 mt-1">When someone interacts with your posts, you'll see it here</p>
            </motion.div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((notif, index) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                    className={`p-4 transition cursor-pointer ${notif.read ? 'bg-white' : 'bg-gradient-to-r from-[#FFF5F5] to-white'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${bgColors[notif.type] || 'bg-gray-100'}`}>
                        {icons[notif.type] || <Bell className="w-4 h-4 text-gray-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 leading-relaxed">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(notif.timestamp)}</p>
                      </div>
                      {!notif.read && <div className="w-2 h-2 bg-[#FF6B6B] rounded-full mt-2 flex-shrink-0 animate-pulse" />}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                        className="text-gray-300 hover:text-red-500 transition p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ========================================
// LINE 780: SECTION 12 - POST CARD (Full Interactive)
// ========================================

const PostCard = ({
  post,
  user,
  onLike,
  onComment,
  onShare,
  onSave,
  onReshare,
  onDelete,
  onFollow,
  onBlock,
  onViewProfile,
  isSaved = false,
  isFollowing = false,
  isBlocked = false
}) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [showOptions, setShowOptions] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReshare, setShowReshare] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [likedComments, setLikedComments] = useState(new Set());
  const inputRef = useRef(null);

  useEffect(() => {
    const likedPosts = JSON.parse(localStorage.getItem(`user_${user.email}_likedPosts`) || '[]');
    setIsLiked(likedPosts.includes(post.id));
    
    const liked = JSON.parse(localStorage.getItem(`user_${user.email}_likedComments`) || '[]');
    setLikedComments(new Set(liked));
  }, [post.id, user.email]);

  const loadComments = () => {
    const allComments = JSON.parse(localStorage.getItem('allComments') || '[]');
    setComments(allComments.filter(c => c.postId === post.id));
  };

  useEffect(() => {
    if (showComments) loadComments();
  }, [showComments]);

  const handleLike = () => {
    if (isLiked) return;
    setIsLiked(true);
    setLikeCount(prev => prev + 1);

    const likedPosts = JSON.parse(localStorage.getItem(`user_${user.email}_likedPosts`) || '[]');
    likedPosts.push(post.id);
    localStorage.setItem(`user_${user.email}_likedPosts`, JSON.stringify(likedPosts));

    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const updatedPosts = allPosts.map(p => p.id === post.id ? { ...p, likes: (p.likes || 0) + 1 } : p);
    localStorage.setItem('allPosts', JSON.stringify(updatedPosts));

    if (post.userEmail !== user.email) {
      pushNotification(post.userEmail, {
        type: 'like',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} liked your post`,
        postId: post.id
      });
    }
    onLike?.(post);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const commentData = {
      id: generateId(),
      postId: post.id,
      userName: user.name,
      userEmail: user.email,
      content: newComment.trim(),
      parentId: replyTo?.id || null,
      timestamp: new Date().toISOString(),
      likes: 0
    };

    const allComments = JSON.parse(localStorage.getItem('allComments') || '[]');
    allComments.push(commentData);
    localStorage.setItem('allComments', JSON.stringify(allComments));
    setComments(prev => [...prev, commentData]);
    setNewComment('');
    setReplyTo(null);

    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const updatedPosts = allPosts.map(p => p.id === post.id ? { ...p, comments: (p.comments || 0) + 1 } : p);
    localStorage.setItem('allPosts', JSON.stringify(updatedPosts));

    if (post.userEmail !== user.email) {
      pushNotification(post.userEmail, {
        type: 'comment',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} commented: "${newComment.substring(0, 50)}"`,
        postId: post.id
      });
    }
  };

  const handleLikeComment = (commentId, commentUserId) => {
    if (likedComments.has(commentId)) return;

    setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c));
    const newLiked = new Set(likedComments);
    newLiked.add(commentId);
    setLikedComments(newLiked);
    localStorage.setItem(`user_${user.email}_likedComments`, JSON.stringify([...newLiked]));

    const allComments = JSON.parse(localStorage.getItem('allComments') || '[]');
    const updatedComments = allComments.map(c => c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c);
    localStorage.setItem('allComments', JSON.stringify(updatedComments));

    if (commentUserId !== user.email) {
      pushNotification(commentUserId, {
        type: 'like',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} liked your comment`,
        postId: post.id
      });
    }
  };

  const handleDeleteComment = (commentId) => {
    const filtered = comments.filter(c => c.id !== commentId && c.parentId !== commentId);
    setComments(filtered);

    const allComments = JSON.parse(localStorage.getItem('allComments') || '[]');
    const updatedAll = allComments.filter(c => c.id !== commentId && c.parentId !== commentId);
    localStorage.setItem('allComments', JSON.stringify(updatedAll));

    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const updatedPosts = allPosts.map(p => p.id === post.id ? { ...p, comments: Math.max(0, (p.comments || 0) - 1) } : p);
    localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
  };

  const CommentRow = ({ comment, depth = 0 }) => {
    const replies = depth < 2 ? comments.filter(c => c.parentId === comment.id) : [];
    const isLiked = likedComments.has(comment.id);
    const isOwn = comment.userEmail === user.email;

    return (
      <div className={`flex gap-2.5 ${depth > 0 ? 'ml-8' : ''}`}>
        <Avatar name={comment.userName} size="xs" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => onViewProfile(comment.userEmail, comment.userName)} className="font-semibold text-gray-900 text-sm hover:underline">
              {comment.userName}
            </button>
            <span className="text-xs text-gray-400 ml-auto">{formatTimeAgo(comment.timestamp)}</span>
          </div>
          <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{comment.content}</p>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => handleLikeComment(comment.id, comment.userEmail)}
              className={`flex items-center gap-1 text-xs font-medium transition ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
            >
              <Heart className={`w-3 h-3 ${isLiked ? 'fill-red-500' : ''}`} />
              <span>{comment.likes || 0}</span>
            </button>
            {depth < 2 && (
              <button
                onClick={() => { setReplyTo(comment); setTimeout(() => inputRef.current?.focus(), 100); }}
                className="text-xs text-gray-400 hover:text-[#FF6B6B] font-medium"
              >
                Reply
              </button>
            )}
            {isOwn && (
              <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-300 hover:text-red-400">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          {replies.length > 0 && (
            <div className="mt-2 space-y-2 pl-3 border-l-2 border-gray-100">
              {replies.map(reply => <CommentRow key={reply.id} comment={reply} depth={depth + 1} />)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const ShareModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}
      onClick={() => setShowShare(false)}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl w-full max-w-sm p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Share to</h3>
          <button onClick={() => setShowShare(false)}><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[
            ['WhatsApp', '#25D366', 'W'], ['Facebook', '#1877F2', 'F'], ['Twitter', '#1DA1F2', 'T'], ['Copy Link', '#6C757D', 'L']
          ].map(([name, color, letter]) => (
            <button key={name} onClick={() => {
              if (name === 'Copy Link') {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied!');
              }
              setShowShare(false);
            }} className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: color }}>
                {letter}
              </div>
              <span className="text-xs text-gray-600">{name}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  const ReshareModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}
      onClick={() => setShowReshare(false)}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl w-full max-w-sm p-5"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-bold mb-3">Add a comment</h3>
        <textarea
          placeholder="What are your thoughts?"
          className="w-full p-3 border rounded-xl text-sm resize-none focus:outline-none focus:border-[#FF6B6B]"
          rows={3}
        />
        <button
          onClick={() => { onReshare?.(post); setShowReshare(false); }}
          className="w-full mt-3 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white rounded-xl font-medium"
        >
          Reshare
        </button>
      </motion.div>
    </motion.div>
  );

  const OptionsModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}
      onClick={() => setShowOptions(false)}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-white rounded-t-2xl w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-center">Post Options</h3>
        </div>
        <div className="divide-y divide-gray-100">
          <button onClick={() => { setShowReshare(true); setShowOptions(false); }} className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50">
            <Repeat className="w-5 h-5 text-blue-500" />
            <span>Reshare</span>
          </button>
          <button onClick={() => { onSave?.(post); setShowOptions(false); }} className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50">
            <Bookmark className={`w-5 h-5 ${isSaved ? 'text-[#FF6B6B] fill-[#FF6B6B]' : 'text-gray-500'}`} />
            <span>{isSaved ? 'Unsave' : 'Save Post'}</span>
          </button>
          {post.userEmail !== user.email && (
            <>
              <button onClick={() => { onFollow?.(post.userEmail, post.userName); setShowOptions(false); }} className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50">
                {isFollowing ? <UserMinus className="w-5 h-5 text-red-500" /> : <UserPlus className="w-5 h-5 text-green-500" />}
                <span>{isFollowing ? 'Unfollow' : 'Follow'}</span>
              </button>
              <button onClick={() => { onBlock?.(post.userEmail, post.userName); setShowOptions(false); }} className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50">
                <UserMinus className="w-5 h-5 text-red-500" />
                <span>Block User</span>
              </button>
            </>
          )}
          {post.userEmail === user.email && (
            <button onClick={() => { onDelete?.(post); setShowOptions(false); }} className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 text-red-500">
              <Trash2 className="w-5 h-5" />
              <span>Delete Post</span>
            </button>
          )}
          <button onClick={() => setShowOptions(false)} className="w-full px-4 py-3.5 text-gray-500 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <>
      <AnimatePresence>{showShare && <ShareModal />}</AnimatePresence>
      <AnimatePresence>{showReshare && <ReshareModal />}</AnimatePresence>
      <AnimatePresence>{showOptions && <OptionsModal />}</AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300"
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-start gap-3">
            <button onClick={() => onViewProfile(post.userEmail, post.userName)}>
              <Avatar name={post.userName} size="md" src={post.userPhoto} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => onViewProfile(post.userEmail, post.userName)} className="font-bold text-gray-900 text-sm hover:underline">
                  {post.userName}
                </button>
                <span className="text-xs text-gray-400">{formatTimeAgo(post.createdAt)}</span>
              </div>
              {post.bookName && (
                <div className="flex items-center gap-1 mt-0.5">
                  <BookOpen className="w-3 h-3 text-[#FF6B6B]" />
                  <span className="text-xs text-gray-500 font-medium">{post.bookName}</span>
                </div>
              )}
            </div>
            <button onClick={() => setShowOptions(true)} className="p-1 hover:bg-gray-100 rounded-full">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          {post.image && (
            <img src={post.image} alt="" className="w-full rounded-xl mb-3 max-h-96 object-cover cursor-pointer" />
          )}
          {post.isReshare && post.originalPost && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <Repeat className="w-3 h-3" />
              <span>Reshared from <span className="font-semibold">{post.originalPost.userName}</span></span>
            </div>
          )}
          <p className="text-gray-800 text-base leading-relaxed">{post.content}</p>
          {post.reshareComment && (
            <div className="mt-3 bg-gradient-to-r from-[#FFF5F5] to-[#F0FFF4] rounded-xl p-3">
              <p className="text-sm text-[#FF6B6B] italic">"{post.reshareComment}"</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleLike} className={`flex items-center gap-1.5 text-sm font-semibold transition ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}>
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
            <span>{likeCount}</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowComments(!showComments)} className={`flex items-center gap-1.5 text-sm font-semibold transition ${showComments ? 'text-[#FF6B6B]' : 'text-gray-500 hover:text-[#FF6B6B]'}`}>
            <MessageCircle className="w-5 h-5" />
            <span>{post.comments || comments.length}</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowShare(true)} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#FF6B6B] transition">
            <Share2 className="w-4 h-4" />
            <span>{post.reshareCount || 0}</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onSave?.(post)} className={`ml-auto flex items-center gap-1.5 text-sm font-semibold transition ${isSaved ? 'text-[#FF6B6B]' : 'text-gray-500 hover:text-[#FF6B6B]'}`}>
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-[#FF6B6B]' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </motion.button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-100"
            >
              <div className="px-4 py-3 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Avatar name={user.name} size="sm" />
                  <div className="flex-1 flex items-center gap-2 bg-white rounded-full border border-gray-200 px-4 py-2 focus-within:border-[#FF6B6B]">
                    {replyTo && (
                      <div className="flex items-center gap-1 text-xs text-[#FF6B6B] bg-pink-50 px-2 py-1 rounded-full">
                        <span>Replying to {replyTo.userName}</span>
                        <button onClick={() => setReplyTo(null)}><X className="w-3 h-3" /></button>
                      </div>
                    )}
                    <input
                      ref={inputRef}
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                      className="flex-1 bg-transparent text-sm outline-none"
                      placeholder={replyTo ? "Write a reply..." : "Write a comment... (use @ to mention)"}
                    />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition ${newComment.trim() ? 'bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white' : 'bg-gray-200 text-gray-400'}`}
                  >
                    Post
                  </motion.button>
                </div>
              </div>

              <div className="px-4 py-3 space-y-3 max-h-96 overflow-y-auto">
                {comments.filter(c => !c.parentId).length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No comments yet. Be the first!</p>
                ) : (
                  comments.filter(c => !c.parentId).map(comment => (
                    <CommentRow key={comment.id} comment={comment} />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

// ========================================
// LINE 1100: SECTION 13 - HOME PAGE (Feed)
// ========================================

const HomePage = ({
  user,
  posts,
  onLike,
  onComment,
  onShare,
  onSave,
  onReshare,
  onDelete,
  onFollow,
  onBlock,
  onViewProfile,
  savedPosts,
  following,
  blockedUsers,
  updateNotificationCount
}) => {
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const [stories] = useState([
    { id: 1, user: { name: 'Your Story', avatar: null, hasStory: false } },
    { id: 2, user: { name: 'Emma Watson', avatar: null, hasStory: true } },
    { id: 3, user: { name: 'BookLover', avatar: null, hasStory: true } },
    { id: 4, user: { name: 'ReadingAddict', avatar: null, hasStory: true } }
  ]);

  useEffect(() => {
    const savedTrending = [
      { title: 'Atomic Habits', author: 'James Clear', rating: 4.8, cover: null },
      { title: 'Project Hail Mary', author: 'Andy Weir', rating: 4.9, cover: null },
      { title: 'Fourth Wing', author: 'Rebecca Yarros', rating: 4.7, cover: null },
      { title: 'The Midnight Library', author: 'Matt Haig', rating: 4.6, cover: null }
    ];
    setTrendingBooks(savedTrending);
  }, []);

  const filteredPosts = posts.filter(p => !blockedUsers?.includes(p.userEmail));

  return (
    <div className="pb-24 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <TopBar
        user={user}
        setPage={() => {}}
        onNotificationClick={() => {}}
        notificationCount={updateNotificationCount ? getUnreadCount(user.email) : 0}
      />

      {/* Stories Row */}
      <div className="px-4 py-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3">
          {stories.map(story => (
            <motion.button
              key={story.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => story.user.hasStory && setActiveStory(story)}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div className={`w-16 h-16 rounded-full p-0.5 ${story.user.hasStory ? 'bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4]' : 'bg-gray-200'}`}>
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <Avatar name={story.user.name} size="lg" />
                </div>
              </div>
              <span className="text-xs font-medium text-gray-600">{story.user.name.split(' ')[0]}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Trending Books */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#FF6B6B]" />
            <span className="bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] bg-clip-text text-transparent">Trending Books</span>
          </h2>
          <button className="text-sm text-[#FF6B6B] font-medium">See All →</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {trendingBooks.map((book, i) => (
            <div key={i} className="flex-shrink-0 w-28 text-center">
              <BookCover title={book.title} author={book.author} size="lg" />
              <p className="text-sm font-semibold mt-2 line-clamp-1">{book.title}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-gray-600">{book.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#4ECDC4]" />
            <span>For You</span>
          </h2>
          <button className="text-xs text-gray-400">Following</button>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400">No posts yet. Follow some readers!</p>
            <button className="mt-4 px-6 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white rounded-full text-sm font-medium">
              Explore Readers
            </button>
          </div>
        ) : (
          filteredPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              user={user}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
              onSave={onSave}
              onReshare={onReshare}
              onDelete={onDelete}
              onFollow={onFollow}
              onBlock={onBlock}
              onViewProfile={onViewProfile}
              isSaved={savedPosts?.includes(post.id)}
              isFollowing={following?.includes(post.userEmail)}
              isBlocked={blockedUsers?.includes(post.userEmail)}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ========================================
// LINE 1250: SECTION 14 - EXPLORE PAGE (AI Book Discovery)
// ========================================

const ExplorePage = ({ user, onCreateCrew }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hey book lover! ✨ Tell me what you're in the mood for — a genre, a vibe, a character type, or even the last book you loved. I'll find your next obsession!", timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeGenre, setActiveGenre] = useState(null);

  const genres = [
    { name: 'Thriller', icon: '🔪', color: 'from-red-500 to-orange-500' },
    { name: 'Fantasy', icon: '🐉', color: 'from-purple-500 to-pink-500' },
    { name: 'Romance', icon: '❤️', color: 'from-pink-500 to-rose-500' },
    { name: 'Sci-Fi', icon: '🚀', color: 'from-blue-500 to-cyan-500' },
    { name: 'Mystery', icon: '🔍', color: 'from-indigo-500 to-purple-500' },
    { name: 'Self-Help', icon: '💡', color: 'from-green-500 to-emerald-500' }
  ];

  const bookDB = {
    thriller: [
      { title: 'Gone Girl', author: 'Gillian Flynn', rating: 4.6, reason: 'Twisty, addictive, impossible to put down' },
      { title: 'The Silent Patient', author: 'Alex Michaelides', rating: 4.5, reason: 'Jaw-dropping twist guaranteed' },
      { title: 'Verity', author: 'Colleen Hoover', rating: 4.6, reason: 'You will NOT see the ending coming' }
    ],
    fantasy: [
      { title: 'The Name of the Wind', author: 'Patrick Rothfuss', rating: 4.7, reason: 'Stunning prose and world-building' },
      { title: 'Mistborn', author: 'Brandon Sanderson', rating: 4.7, reason: 'Inventive magic system + satisfying plot' },
      { title: 'Fourth Wing', author: 'Rebecca Yarros', rating: 4.6, reason: 'Fast-paced, romantic, absolutely addictive' }
    ],
    romance: [
      { title: 'Beach Read', author: 'Emily Henry', rating: 4.6, reason: 'Witty, heartfelt and genuinely funny' },
      { title: 'People We Meet on Vacation', author: 'Emily Henry', rating: 4.6, reason: 'Nostalgic, swoony and deeply satisfying' },
      { title: 'The Love Hypothesis', author: 'Ali Hazelwood', rating: 4.7, reason: 'STEM romance that will make you swoon' }
    ],
    scifi: [
      { title: 'Project Hail Mary', author: 'Andy Weir', rating: 4.8, reason: 'Most fun you\'ll have reading sci-fi' },
      { title: 'The Martian', author: 'Andy Weir', rating: 4.8, reason: 'Funny, clever and impossible to put down' },
      { title: 'Children of Time', author: 'Adrian Tchaikovsky', rating: 4.7, reason: 'Mind-blowing concepts' }
    ],
    mystery: [
      { title: 'And Then There Were None', author: 'Agatha Christie', rating: 4.7, reason: 'Best-selling mystery of all time' },
      { title: 'The Thursday Murder Club', author: 'Richard Osman', rating: 4.5, reason: 'Charming, funny and clever' },
      { title: 'The Guest List', author: 'Lucy Foley', rating: 4.4, reason: 'Perfect atmospheric thriller' }
    ],
    selfhelp: [
      { title: 'Atomic Habits', author: 'James Clear', rating: 4.8, reason: 'Most practical habit book ever written' },
      { title: 'The Psychology of Money', author: 'Morgan Housel', rating: 4.7, reason: 'Will change how you think about money' },
      { title: 'Dare to Lead', author: 'Brené Brown', rating: 4.6, reason: 'Courageous leadership for everyone' }
    ]
  };

  const handleGenreSelect = (genre) => {
    setActiveGenre(genre);
    const genreKey = genre.toLowerCase().replace('-', '');
    const recs = bookDB[genreKey] || bookDB.thriller;
    setBooks(recs);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Great choice! Here are some amazing ${genre} books you might love 📚`,
      timestamp: new Date()
    }]);
  };

  const sendMessage = () => {
    if (!input.trim() || loading) return;
    
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText, timestamp: new Date() }]);
    setLoading(true);

    setTimeout(() => {
      const lowerText = userText.toLowerCase();
      let category = 'literary';
      if (lowerText.includes('thrill') || lowerText.includes('suspense')) category = 'thriller';
      else if (lowerText.includes('fantasy') || lowerText.includes('magic')) category = 'fantasy';
      else if (lowerText.includes('romance') || lowerText.includes('love')) category = 'romance';
      else if (lowerText.includes('sci-fi') || lowerText.includes('space')) category = 'scifi';
      else if (lowerText.includes('mystery') || lowerText.includes('detective')) category = 'mystery';
      else if (lowerText.includes('self') || lowerText.includes('habit')) category = 'selfhelp';
      
      const recs = bookDB[category] || bookDB.thriller;
      setBooks(recs);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Based on what you said, here are some books you might enjoy! ${category === 'literary' ? '✨' : '📚'}`,
        timestamp: new Date()
      }]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5F5] to-white pb-24">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] bg-clip-text text-transparent">
          Discover Your Next Read
        </h1>
        <p className="text-gray-500 mt-1">AI-powered book recommendations just for you</p>
      </div>

      {/* Genre Pills */}
      <div className="px-5 mb-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {genres.map(genre => (
            <motion.button
              key={genre.name}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleGenreSelect(genre.name)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeGenre === genre.name
                  ? `bg-gradient-to-r ${genre.color} text-white shadow-lg`
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-[#FF6B6B]'
              }`}
            >
              <span className="mr-1">{genre.icon}</span>
              {genre.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white' : 'bg-gray-100 text-gray-700'} rounded-2xl px-4 py-2.5`}>
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-[10px] mt-1 opacity-70">{formatTimeAgo(msg.timestamp)}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-2.5">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Tell me what you're in the mood for..."
                className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#FF6B6B]"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                  input.trim() && !loading ? 'bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white' : 'bg-gray-200 text-gray-400'
                }`}
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {books.length > 0 && (
        <div className="px-4">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Sparkle className="w-5 h-5 text-[#FFE66D]" />
            Recommended for you
          </h3>
          <div className="space-y-3">
            {books.map((book, i) => (
              <AnimatedCard key={i} className="p-4">
                <div className="flex gap-4">
                  <BookCover title={book.title} author={book.author} size="md" />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{book.title}</h4>
                    <p className="text-sm text-gray-500">by {book.author}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <StarRating rating={Math.round(book.rating)} size="sm" readonly />
                      <span className="text-xs text-gray-500">{book.rating}</span>
                    </div>
                    <p className="text-xs text-[#FF6B6B] mt-2 italic">"{book.reason}"</p>
                    <div className="flex gap-2 mt-3">
                      <button className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                        View Details
                      </button>
                      <button
                        onClick={() => onCreateCrew?.(book)}
                        className="flex-1 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white rounded-xl text-sm font-medium hover:opacity-90 transition"
                      >
                        Create Crew
                      </button>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ========================================
// LINE 1500: SECTION 15 - PROFILE PAGE (Full)
// ========================================

const ProfilePage = ({ user, posts, onLogout, onUpdateUser, onViewProfile }) => {
  const [activeTab, setActiveTab] = useState('posts');
  const [stats, setStats] = useState({ booksRead: 0, reviews: 0, followers: 0, following: 0 });
  const [readingGoal, setReadingGoal] = useState(user?.readingGoal || 20);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [books, setBooks] = useState([]);
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', rating: 5 });

  useEffect(() => {
    const savedStats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    setStats(savedStats);
    const savedBooks = JSON.parse(localStorage.getItem(`user_${user.email}_readingList`) || '[]');
    setBooks(savedBooks);
  }, [user.email]);

  const handleAddBook = () => {
    if (!newBook.title) return;
    const book = { id: generateId(), ...newBook, addedAt: new Date().toISOString() };
    const updated = [book, ...books];
    setBooks(updated);
    localStorage.setItem(`user_${user.email}_readingList`, JSON.stringify(updated));
    setNewBook({ title: '', author: '', rating: 5 });
    setShowAddBook(false);
    setStats(prev => ({ ...prev, booksRead: updated.length }));
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify({ ...stats, booksRead: updated.length }));
  };

  const handleSaveProfile = () => {
    const updatedUser = { ...user, bio: editBio };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    onUpdateUser?.(updatedUser);
    setShowEditProfile(false);
  };

  const myPosts = posts.filter(p => p.userEmail === user?.email);
  const myReviews = JSON.parse(localStorage.getItem('reviews') || '[]').filter(r => r.userEmail === user?.email);

  return (
    <div className="pb-24 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header with Cover Photo */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4]" />
        <div className="absolute -bottom-12 left-4">
          <Avatar name={user.name} size="2xl" src={user.profileImage} />
        </div>
        <div className="absolute bottom-4 right-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEditProfile(true)}
            className="px-4 py-2 bg-white rounded-full text-sm font-medium shadow-md hover:shadow-lg transition"
          >
            Edit Profile
          </motion.button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="pt-16 px-4 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
        <p className="text-gray-500 text-sm">@{user.name?.toLowerCase().replace(/\s/g, '')}</p>
        <p className="text-gray-600 mt-2">{user.bio || 'Reading is my superpower ✨'}</p>

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{stats.booksRead || 0}</p>
            <p className="text-xs text-gray-500">Books Read</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{myReviews.length}</p>
            <p className="text-xs text-gray-500">Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{stats.followers || 0}</p>
            <p className="text-xs text-gray-500">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{stats.following || 0}</p>
            <p className="text-xs text-gray-500">Following</p>
          </div>
        </div>

        {/* Reading Goal Progress */}
        <div className="mt-4 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">2024 Reading Goal</span>
            <span className="text-sm font-bold text-[#FF6B6B]">{stats.booksRead || 0}/{readingGoal} books</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((stats.booksRead || 0) / readingGoal) * 100}%` }}
              className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] rounded-full"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-6 border-b border-gray-200">
          {['posts', 'reviews', 'books'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 px-1 text-sm font-medium transition-all ${
                activeTab === tab ? 'text-[#FF6B6B] border-b-2 border-[#FF6B6B]' : 'text-gray-500'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-4 space-y-3">
          {activeTab === 'posts' && myPosts.map(post => (
            <div key={post.id} className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-gray-700">{post.content}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span>❤️ {post.likes || 0}</span>
                <span>💬 {post.comments || 0}</span>
                <span>🔄 {post.reshareCount || 0}</span>
              </div>
            </div>
          ))}

          {activeTab === 'reviews' && myReviews.map(review => (
            <div key={review.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <BookCover title={review.bookName} author={review.author} size="sm" />
                <div>
                  <h3 className="font-semibold">{review.bookName}</h3>
                  <StarRating rating={review.rating} size="sm" readonly />
                  <p className="text-sm text-gray-600 mt-1">{review.review}</p>
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'books' && (
            <div>
              <button
                onClick={() => setShowAddBook(!showAddBook)}
                className="w-full mb-3 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Book
              </button>

              {showAddBook && (
                <div className="bg-white rounded-xl p-4 mb-3 shadow-sm">
                  <input
                    value={newBook.title}
                    onChange={e => setNewBook({ ...newBook, title: e.target.value })}
                    className="w-full p-2 border rounded-lg mb-2 text-sm"
                    placeholder="Book title"
                  />
                  <input
                    value={newBook.author}
                    onChange={e => setNewBook({ ...newBook, author: e.target.value })}
                    className="w-full p-2 border rounded-lg mb-2 text-sm"
                    placeholder="Author"
                  />
                  <StarRating rating={newBook.rating} onChange={r => setNewBook({ ...newBook, rating: r })} size="sm" />
                  <button onClick={handleAddBook} className="w-full mt-3 py-2 bg-[#FF6B6B] text-white rounded-lg text-sm">
                    Add to My Books
                  </button>
                </div>
              )}

              {books.map(book => (
                <div key={book.id} className="bg-white rounded-xl p-3 shadow-sm flex gap-3">
                  <BookCover title={book.title} author={book.author} size="sm" />
                  <div>
                    <h4 className="font-semibold">{book.title}</h4>
                    <p className="text-sm text-gray-500">{book.author}</p>
                    <StarRating rating={book.rating} size="xs" readonly />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="mt-8 w-full py-3 border border-red-200 text-red-500 rounded-xl font-medium hover:bg-red-50 transition"
        >
          Log Out
        </button>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
            style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}
            onClick={() => setShowEditProfile(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-2xl w-full max-w-sm p-5"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg mb-4">Edit Profile</h3>
              <textarea
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                className="w-full p-3 border rounded-xl text-sm resize-none"
                placeholder="Write your bio..."
                rows={4}
              />
              <div className="flex gap-2 mt-4">
                <button onClick={handleSaveProfile} className="flex-1 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white rounded-xl font-medium">
                  Save
                </button>
                <button onClick={() => setShowEditProfile(false)} className="flex-1 py-2 border border-gray-200 rounded-xl font-medium">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ========================================
// LINE 1700: SECTION 16 - LOGIN PAGE (Modern)
// ========================================

const LoginPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const handleSendOTP = () => {
    if (!isLogin && name.length < 2) {
      setError('Please enter your name');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('devOTP', otp);
    localStorage.setItem('pendingUser', JSON.stringify({ email, name: name || email.split('@')[0], password: password || 'password123' }));
    setDevOtp(otp);
    setShowOTP(true);
  };

  const handleVerifyOTP = () => {
    const savedOtp = localStorage.getItem('devOTP');
    const pendingUser = JSON.parse(localStorage.getItem('pendingUser') || '{}');
    
    if (otpInput !== savedOtp) {
      setError('Invalid code');
      return;
    }

    const userData = {
      id: generateId(),
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      readingGoal: 20,
      bio: 'Reading is my superpower ✨',
      createdAt: new Date().toISOString(),
      stats: { booksRead: 0, reviews: 0, followers: 0, following: 0 }
    };

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    ['followers', 'following', 'blocked', 'notifications', 'likedPosts', 'likedComments', 'readingList', 'savedPosts'].forEach(key => {
      if (!localStorage.getItem(`user_${userData.email}_${key}`)) {
        localStorage.setItem(`user_${userData.email}_${key}`, JSON.stringify([]));
      }
    });
    
    setShowOTP(false);
    onLogin(userData);
  };

  const handleLogin = () => {
    if (!email || !password) {
      setError('Please fill all fields');
      return;
    }
    setLoading(true);
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      localStorage.setItem('currentUser', JSON.stringify(found));
      onLogin(found);
    } else {
      setError('Invalid credentials');
    }
    setLoading(false);
  };

  if (showOTP) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5F5] to-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
        >
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B6B] to-[#4ECDC4] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Verify your email</h2>
            <p className="text-gray-500 text-sm mt-1">We sent a code to {email}</p>
          </div>

          {devOtp && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-center">
              <p className="text-xs text-amber-700">Demo code:</p>
              <p className="text-2xl font-bold text-amber-800 tracking-wider">{devOtp}</p>
            </div>
          )}

          <input
            type="text"
            value={otpInput}
            onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full text-center text-3xl tracking-widest p-4 border rounded-xl mb-4 focus:outline-none focus:border-[#FF6B6B]"
            placeholder="000000"
          />

          <button
            onClick={handleVerifyOTP}
            disabled={otpInput.length !== 6}
            className="w-full py-3 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white rounded-xl font-semibold disabled:opacity-50"
          >
            Verify & Continue
          </button>

          <button onClick={() => setShowOTP(false)} className="w-full mt-3 text-gray-500 text-sm">
            Back to login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F5] to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            whileHover={{ rotate: 5 }}
            className="w-24 h-24 bg-gradient-to-br from-[#FF6B6B] to-[#4ECDC4] rounded-2xl shadow-2xl flex items-center justify-center mx-auto mb-4"
          >
            <BookOpen className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] bg-clip-text text-transparent">
            ReadCrew
          </h1>
          <p className="text-gray-500 mt-2">Read together, grow together.</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-center mb-6">{isLogin ? 'Welcome Back!' : 'Join the Crew'}</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          {!isLogin && (
            <div className="mb-3">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF6B6B]"
                placeholder="Full Name"
              />
            </div>
          )}

          <div className="mb-3">
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF6B6B]"
              placeholder="Email"
              type="email"
            />
          </div>

          <div className="mb-4 relative">
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF6B6B]"
              placeholder="Password"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button
            onClick={isLogin ? handleLogin : handleSendOTP}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <LoadingSpinner size="sm" /> : isLogin ? 'Log In' : 'Create Account →'}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-[#FF6B6B] font-semibold">
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// ========================================
// LINE 1900: SECTION 17 - MAIN APP COMPONENT
// ========================================

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [following, setFollowing] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setIsLoggedIn(true);
      
      const userSaved = JSON.parse(localStorage.getItem(`user_${user.email}_savedPosts`) || '[]');
      const userFollowing = JSON.parse(localStorage.getItem(`user_${user.email}_following`) || '[]');
      const userBlocked = JSON.parse(localStorage.getItem(`user_${user.email}_blocked`) || '[]');
      
      setSavedPosts(userSaved);
      setFollowing(userFollowing);
      setBlockedUsers(userBlocked);
    }
    
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    setPosts(allPosts);
    
    if (!localStorage.getItem('allComments')) {
      localStorage.setItem('allComments', JSON.stringify([]));
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    if (currentUser) {
      const count = getUnreadCount(currentUser.email);
      setNotificationCount(count);
    }
  }, [currentUser]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setCurrentPage('home');
    showToast('Welcome to ReadCrew! 📚', 'success');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    showToast('Logged out successfully', 'info');
  };

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  const handlePost = (postData) => {
    const newPost = { ...postData, id: generateId(), createdAt: new Date().toISOString(), likes: 0, comments: 0, reshareCount: 0 };
    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
    
    const stats = JSON.parse(localStorage.getItem(`user_${currentUser.email}_stats`) || '{}');
    stats.postsCreated = (stats.postsCreated || 0) + 1;
    localStorage.setItem(`user_${currentUser.email}_stats`, JSON.stringify(stats));
  };

  const handleDeletePost = (post) => {
    const updatedPosts = posts.filter(p => p.id !== post.id);
    setPosts(updatedPosts);
    localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
    
    const allComments = JSON.parse(localStorage.getItem('allComments') || '[]');
    const filteredComments = allComments.filter(c => c.postId !== post.id);
    localStorage.setItem('allComments', JSON.stringify(filteredComments));
  };

  const handleSavePost = (post) => {
    let updated;
    if (savedPosts.includes(post.id)) {
      updated = savedPosts.filter(id => id !== post.id);
      showToast('Post unsaved', 'info');
    } else {
      updated = [...savedPosts, post.id];
      showToast('Post saved to your collection', 'success');
    }
    setSavedPosts(updated);
    localStorage.setItem(`user_${currentUser.email}_savedPosts`, JSON.stringify(updated));
  };

  const handleReshare = (originalPost, comment) => {
    const resharePost = {
      id: generateId(),
      content: originalPost.content,
      bookName: originalPost.bookName,
      author: originalPost.author,
      image: originalPost.image,
      isReshare: true,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userPhoto: currentUser.profileImage,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      reshareCount: 0,
      originalPost: {
        id: originalPost.id,
        userName: originalPost.userName,
        userEmail: originalPost.userEmail,
        content: originalPost.content
      },
      reshareComment: comment
    };
    
    const updatedPosts = [resharePost, ...posts];
    setPosts(updatedPosts);
    localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
    
    const updatedOriginal = posts.map(p => p.id === originalPost.id ? { ...p, reshareCount: (p.reshareCount || 0) + 1 } : p);
    localStorage.setItem('allPosts', JSON.stringify(updatedOriginal));
    
    if (originalPost.userEmail !== currentUser.email) {
      pushNotification(originalPost.userEmail, {
        type: 'reshare',
        fromUser: currentUser.name,
        fromUserEmail: currentUser.email,
        message: `${currentUser.name} reshared your post`,
        postId: originalPost.id
      });
    }
    
    showToast('Post reshared!', 'success');
  };

  const handleFollow = (targetEmail, targetName) => {
    const updatedFollowing = following.includes(targetEmail)
      ? following.filter(e => e !== targetEmail)
      : [...following, targetEmail];
    setFollowing(updatedFollowing);
    localStorage.setItem(`user_${currentUser.email}_following`, JSON.stringify(updatedFollowing));
    
    const targetFollowers = JSON.parse(localStorage.getItem(`user_${targetEmail}_followers`) || '[]');
    if (!following.includes(targetEmail)) {
      const updatedTargetFollowers = [...targetFollowers, currentUser.email];
      localStorage.setItem(`user_${targetEmail}_followers`, JSON.stringify(updatedTargetFollowers));
      pushNotification(targetEmail, {
        type: 'follow',
        fromUser: currentUser.name,
        fromUserEmail: currentUser.email,
        message: `${currentUser.name} started following you`
      });
      showToast(`Now following ${targetName}`, 'success');
    } else {
      showToast(`Unfollowed ${targetName}`, 'info');
    }
  };

  const handleBlockUser = (targetEmail, targetName) => {
    const updatedBlocked = blockedUsers.includes(targetEmail)
      ? blockedUsers.filter(e => e !== targetEmail)
      : [...blockedUsers, targetEmail];
    setBlockedUsers(updatedBlocked);
    localStorage.setItem(`user_${currentUser.email}_blocked`, JSON.stringify(updatedBlocked));
    showToast(updatedBlocked.includes(targetEmail) ? `Blocked ${targetName}` : `Unblocked ${targetName}`, 'info');
  };

  const handleViewProfile = (email, name) => {
    showToast(`Viewing ${name}'s profile`, 'info');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUpdateNotificationCount = () => {
    if (currentUser) {
      setNotificationCount(getUnreadCount(currentUser.email));
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="flex justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md relative bg-white min-h-screen shadow-2xl overflow-hidden">
        <AnimatePresence>
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </AnimatePresence>

        {currentPage === 'home' && (
          <HomePage
            user={currentUser}
            posts={posts}
            onLike={() => {}}
            onComment={() => {}}
            onShare={() => {}}
            onSave={handleSavePost}
            onReshare={handleReshare}
            onDelete={handleDeletePost}
            onFollow={handleFollow}
            onBlock={handleBlockUser}
            onViewProfile={handleViewProfile}
            savedPosts={savedPosts}
            following={following}
            blockedUsers={blockedUsers}
            updateNotificationCount={handleUpdateNotificationCount}
          />
        )}

        {currentPage === 'explore' && (
          <ExplorePage user={currentUser} onCreateCrew={(book) => {
            const newCrew = {
              id: generateId(),
              name: book.title,
              author: book.author,
              genre: book.genre || 'General',
              members: 1,
              createdBy: currentUser.email,
              createdByName: currentUser.name
            };
            const crews = JSON.parse(localStorage.getItem('crews') || '[]');
            crews.push(newCrew);
            localStorage.setItem('crews', JSON.stringify(crews));
            setCurrentPage('crews');
          }} />
        )}

        {currentPage === 'profile' && (
          <ProfilePage
            user={currentUser}
            posts={posts}
            onLogout={handleLogout}
            onUpdateUser={handleUpdateUser}
            onViewProfile={handleViewProfile}
          />
        )}

        {currentPage === 'notifications' && (
          <NotificationsPage
            user={currentUser}
            onClose={() => setCurrentPage('home')}
            updateNotificationCount={handleUpdateNotificationCount}
          />
        )}

        <BottomNav
          active={currentPage}
          setPage={setCurrentPage}
          unreadCount={notificationCount}
        />
      </div>
    </div>
  );
}

// Add global styles
if (typeof document !== 'undefined' && !document.querySelector('style[data-readcrew]')) {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { transform: translate(-50%, -100%); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
    .animate-slideDown { animation: slideDown 0.3s ease-out; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    .animate-bounce { animation: bounce 1s infinite; }
    .line-clamp-1 {
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
    }
    .line-clamp-2 {
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
    .line-clamp-3 {
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
    }
    * {
      -webkit-tap-highlight-color: transparent;
    }
  `;
  style.setAttribute('data-readcrew', 'true');
  document.head.appendChild(style);
}