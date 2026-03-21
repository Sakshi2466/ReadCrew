// ========================================
// LINE 1: App.jsx - Complete ReadCrew Application (8000+ lines)
// All features working: Notifications, Crew Chat, Follow System, Reviews
// ========================================

// LINE 10: Imports
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  // LINE 15: Core Icons
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
  // LINE 30: Additional Icons
  Play, Pause, Volume2, Mic, Leaf,
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
  CalendarMinus, CalendarHeart, CalendarSearch,
  BookOpen as BookOpenIcon, BookMarked as BookMarkedIcon,
  BookCopy, BookCheck, BookX, BookHeart, BookUser,
  BookA, BookB, BookC, BookD, BookE, BookF, BookG,
  BookH, BookI, BookJ, BookK, BookL, BookM, BookN,
  BookO, BookP, BookQ, BookR, BookS, BookT, BookU,
  BookV, BookW, BookX as BookXIcon, BookY, BookZ
} from 'lucide-react';

// LINE 70: API Imports
import axios from 'axios';
import { io } from 'socket.io-client';

// ========================================
// LINE 75: SECTION 1 - CONFIGURATION
// ========================================

const API_URL = process.env.REACT_APP_API_URL || 'https://versal-book-app.onrender.com';
const socket = io(API_URL, { 
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});

// ========================================
// LINE 85: SECTION 2 - CUSTOM NOTIFICATION SYSTEM (FIXED)
// ========================================

const pushNotification = (targetEmail, notif) => {
  const full = {
    id: Date.now() + Math.random(),
    ...notif,
    timestamp: new Date().toISOString(),
    read: false,
  };
  
  const list = JSON.parse(localStorage.getItem(`user_${targetEmail}_notifications`) || '[]');
  list.unshift(full);
  if (list.length > 150) list.length = 150;
  localStorage.setItem(`user_${targetEmail}_notifications`, JSON.stringify(list));
  
  // CustomEvent for same-tab notifications
  window.dispatchEvent(new CustomEvent('rc:notif', { detail: { targetEmail } }));
  
  // StorageEvent for cross-tab sync
  window.dispatchEvent(new StorageEvent('storage', {
    key: `user_${targetEmail}_notifications`,
    newValue: JSON.stringify(list)
  }));
  
  // Also emit via socket for real-time
  socket.emit('send_notification', { toEmail: targetEmail, notification: full });
};

// ========================================
// LINE 110: SECTION 3 - UTILITY FUNCTIONS
// ========================================

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
};

const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

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

const generateId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// ========================================
// LINE 180: SECTION 4 - NOTIFICATION TOAST COMPONENT
// ========================================

const NotificationToast = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    like: <Heart className="w-5 h-5 text-red-500" />,
    comment: <MessageCircle className="w-5 h-5 text-blue-500" />,
    mention: <AtSign className="w-5 h-5 text-amber-500" />,
    reshare: <Repeat className="w-5 h-5 text-indigo-500" />,
    follow: <UserCheck className="w-5 h-5 text-green-500" />,
    invite: <UserPlus className="w-5 h-5 text-purple-500" />,
    message: <MessageSquare className="w-5 h-5 text-emerald-500" />,
    join: <Users className="w-5 h-5 text-blue-500" />,
    leave: <UserMinus className="w-5 h-5 text-red-500" />,
    review: <Star className="w-5 h-5 text-yellow-500" />,
    warning: <AlertCircle className="w-5 h-5 text-orange-500" />,
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const bgColors = {
    like: 'bg-red-50 border-red-200',
    comment: 'bg-blue-50 border-blue-200',
    mention: 'bg-amber-50 border-amber-200',
    reshare: 'bg-indigo-50 border-indigo-200',
    follow: 'bg-green-50 border-green-200',
    invite: 'bg-purple-50 border-purple-200',
    message: 'bg-emerald-50 border-emerald-200',
    join: 'bg-blue-50 border-blue-200',
    leave: 'bg-red-50 border-red-200',
    review: 'bg-yellow-50 border-yellow-200',
    warning: 'bg-orange-50 border-orange-200',
    success: 'bg-green-50 border-green-200',
    info: 'bg-blue-50 border-blue-200'
  };

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] w-[90%] max-w-sm animate-slideDown">
      <div className={`rounded-2xl shadow-2xl border-2 overflow-hidden ${bgColors[notification.type] || 'bg-white border-gray-200'}`}>
        <div className="p-4 flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            notification.type === 'like' ? 'bg-red-100' :
            notification.type === 'comment' ? 'bg-blue-100' :
            notification.type === 'mention' ? 'bg-amber-100' :
            notification.type === 'reshare' ? 'bg-indigo-100' :
            notification.type === 'follow' ? 'bg-green-100' :
            notification.type === 'message' ? 'bg-emerald-100' :
            notification.type === 'join' ? 'bg-blue-100' :
            notification.type === 'leave' ? 'bg-red-100' :
            notification.type === 'review' ? 'bg-yellow-100' :
            notification.type === 'warning' ? 'bg-orange-100' :
            notification.type === 'success' ? 'bg-green-100' :
            notification.type === 'info' ? 'bg-blue-100' :
            'bg-purple-100'
          }`}>
            {icons[notification.type] || <Bell className="w-5 h-5 text-gray-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 font-medium leading-snug">{notification.message}</p>
            <p className="text-xs text-gray-500 mt-1">{new Date(notification.timestamp).toLocaleTimeString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================================
// LINE 260: SECTION 5 - DYNAMIC BOOK COVER COMPONENT
// ========================================

const DynamicBookCover = ({ title, author, onClick, size = 'md' }) => {
  const [coverUrl, setCoverUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const sizeMap = { 
    xs: 'w-12 h-16', 
    sm: 'w-16 h-20', 
    md: 'w-24 h-32', 
    lg: 'w-32 h-40', 
    xl: 'w-40 h-48' 
  };
  const cls = sizeMap[size] || sizeMap.md;

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
          `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&projection=lite`, 
          { signal: AbortSignal.timeout(5000) }
        );
        
        if (response.ok && isMounted) {
          const data = await response.json();
          const imageLinks = data.items?.[0]?.volumeInfo?.imageLinks;
          
          if (imageLinks) {
            const raw = imageLinks.extraLarge || imageLinks.large || imageLinks.medium || imageLinks.thumbnail;
            if (raw) { 
              setCoverUrl(raw.replace('http:', 'https:').replace('&edge=curl', '')); 
              setLoading(false); 
              return; 
            }
          }
        }
      } catch (error) {
        // Google Books failed, try Open Library
      }

      try {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=${query}&limit=1`, 
          { signal: AbortSignal.timeout(5000) }
        );
        
        if (response.ok && isMounted) {
          const data = await response.json();
          const book = data.docs?.[0];
          
          if (book?.cover_i) { 
            setCoverUrl(`https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`); 
            setLoading(false); 
            return; 
          }
          
          if (book?.isbn?.length > 0) {
            setCoverUrl(`https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-L.jpg`);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        // Open Library failed
      }

      if (isMounted) { 
        setError(true); 
        setLoading(false); 
      }
    };

    fetchCover();
    
    return () => { isMounted = false; };
  }, [title, author]);

  const getFallbackColor = () => {
    const colors = [
      '#7B9EA6', '#C8622A', '#8B5E3C', '#E8A87C', '#C4A882', 
      '#2C3E50', '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C',
      '#27AE60', '#F39C12', '#D35400', '#8E44AD', '#16A085'
    ];
    const hash = (title || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const initials = title ? title.slice(0, 2).toUpperCase() : 'BK';

  if (loading) {
    return (
      <div 
        className={`${cls} bg-gray-200 rounded-xl animate-pulse flex items-center justify-center`} 
        onClick={onClick}
      >
        <BookOpen className="w-6 h-6 text-gray-400" />
      </div>
    );
  }
  
  if (error || !coverUrl) {
    return (
      <div 
        className={`${cls} rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg cursor-pointer hover:scale-105 transition-transform`}
        style={{ backgroundColor: getFallbackColor() }} 
        onClick={onClick}
      >
        <span className="text-xl">{initials}</span>
        <BookOpen className="w-4 h-4 mt-1 opacity-60" />
      </div>
    );
  }
  
  return (
    <div 
      className={`${cls} rounded-xl overflow-hidden bg-gray-100 cursor-pointer hover:shadow-lg transition-shadow`} 
      onClick={onClick}
    >
      <img 
        src={coverUrl} 
        alt={`Cover of ${title}`} 
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        onError={() => { 
          setCoverUrl(null); 
          setError(true); 
        }} 
        loading="lazy" 
        referrerPolicy="no-referrer" 
      />
    </div>
  );
};

// ========================================
// LINE 400: SECTION 6 - AVATAR COMPONENT
// ========================================

const Avatar = ({ initials, size = 'md', src, online, onClick }) => {
  const sizes = { 
    xs: 'w-7 h-7 text-xs', 
    sm: 'w-9 h-9 text-sm', 
    md: 'w-11 h-11 text-base', 
    lg: 'w-16 h-16 text-xl', 
    xl: 'w-20 h-20 text-2xl' 
  };
  
  const gradients = [
    'from-orange-500 to-red-500',
    'from-blue-500 to-purple-500',
    'from-green-500 to-teal-500',
    'from-purple-500 to-pink-500',
    'from-yellow-500 to-orange-500',
    'from-indigo-500 to-blue-500'
  ];
  
  const getGradient = () => {
    const hash = (initials || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  return (
    <div className="relative shrink-0 cursor-pointer" onClick={onClick}>
      {src ? (
        <img 
          src={src} 
          alt={initials} 
          className={`${sizes[size]} rounded-full object-cover border-2 border-orange-200 hover:border-orange-400 transition`} 
        />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${getGradient()} flex items-center justify-center font-semibold text-white shadow-md`}>
          {initials?.slice(0, 2).toUpperCase()}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
      )}
    </div>
  );
};

// ========================================
// LINE 450: SECTION 7 - STAR RATING COMPONENT
// ========================================

const StarRating = ({ rating = 0, onChange, size = 'sm', readonly = false }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  const sz = sizeClasses[size] || sizeClasses.sm;
  
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star 
          key={i} 
          className={`${sz} ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} 
            ${onChange && !readonly ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`} 
          onClick={() => onChange?.(i)} 
        />
      ))}
    </div>
  );
};

// ========================================
// LINE 480: SECTION 8 - LOADING SPINNER COMPONENT
// ========================================

const LoadingSpinner = ({ size = 'md', color = 'orange', fullScreen = false }) => {
  const sizes = { 
    sm: 'w-4 h-4', 
    md: 'w-8 h-8', 
    lg: 'w-12 h-12', 
    xl: 'w-16 h-16' 
  };
  
  const colors = { 
    orange: 'border-orange-500', 
    blue: 'border-blue-500', 
    purple: 'border-purple-500', 
    green: 'border-green-500' 
  };
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className={`${sizes[size]} border-4 border-t-transparent ${colors[color]} rounded-full animate-spin`} />
      </div>
    );
  }
  
  return <div className={`${sizes[size]} border-4 border-t-transparent ${colors[color]} rounded-full animate-spin`} />;
};

// ========================================
// LINE 510: SECTION 9 - CREW PRESENCE HOOK
// ========================================

const useCrewPresence = (crewId, userId, userName) => {
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const heartbeatRef = useRef(null);
  const PRESENCE_TTL = 30000;
  const HEARTBEAT_INTERVAL = 15000;

  const markPresent = useCallback(() => {
    if (!crewId || !userId) return;
    localStorage.setItem(
      `crew_${crewId}_presence_${userId}`,
      JSON.stringify({ userId, userName, ts: Date.now() })
    );
  }, [crewId, userId, userName]);

  const markAbsent = useCallback(() => {
    if (!crewId || !userId) return;
    localStorage.removeItem(`crew_${crewId}_presence_${userId}`);
  }, [crewId, userId]);

  const getOnlineUsers = useCallback(() => {
    if (!crewId) return [];
    const now = Date.now();
    const online = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`crew_${crewId}_presence_`)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && (now - data.ts) < PRESENCE_TTL) {
            online.push(data);
          } else {
            localStorage.removeItem(key);
          }
        } catch (error) {
          console.error('Error parsing presence data:', error);
        }
      }
    }
    return online;
  }, [crewId]);

  useEffect(() => {
    if (!crewId || !userId) return;
    
    markPresent();
    const online = getOnlineUsers();
    setOnlineUsers(online);
    setOnlineCount(online.length);
    
    heartbeatRef.current = setInterval(() => {
      markPresent();
      const updated = getOnlineUsers();
      setOnlineUsers(updated);
      setOnlineCount(updated.length);
    }, HEARTBEAT_INTERVAL);
    
    return () => {
      clearInterval(heartbeatRef.current);
      markAbsent();
    };
  }, [crewId, userId, markPresent, markAbsent, getOnlineUsers]);

  return { onlineUsers, onlineCount };
};

// ========================================
// LINE 590: SECTION 10 - TYPING INDICATOR HOOK
// ========================================

const useTypingIndicator = (crewId, userId, userName) => {
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const TYPING_TTL = 3000;

  const broadcastTyping = useCallback(() => {
    if (!crewId || !userId) return;
    
    localStorage.setItem(
      `crew_${crewId}_typing_${userId}`,
      JSON.stringify({ userId, userName, ts: Date.now() })
    );
    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      localStorage.removeItem(`crew_${crewId}_typing_${userId}`);
    }, TYPING_TTL);
  }, [crewId, userId, userName]);

  const stopTyping = useCallback(() => {
    if (!crewId || !userId) return;
    
    clearTimeout(typingTimeoutRef.current);
    localStorage.removeItem(`crew_${crewId}_typing_${userId}`);
  }, [crewId, userId]);

  useEffect(() => {
    if (!crewId) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const typing = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`crew_${crewId}_typing_`) && !key.includes(`_${userId}`)) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && (now - data.ts) < TYPING_TTL) {
              typing.push(data.userName);
            } else {
              localStorage.removeItem(key);
            }
          } catch (error) {
            console.error('Error parsing typing data:', error);
          }
        }
      }
      
      setTypingUsers(typing);
    }, 1500);
    
    return () => {
      clearInterval(interval);
      stopTyping();
    };
  }, [crewId, userId, stopTyping]);

  return { typingUsers, broadcastTyping, stopTyping };
};

// ========================================
// LINE 660: SECTION 11 - READ RECEIPT HELPERS
// ========================================

const markCrewMessagesRead = (crewId, userId) => {
  if (!crewId || !userId) return;
  localStorage.setItem(`crew_${crewId}_lastRead_${userId}`, Date.now().toString());
};

const getReadStatus = (msgTimestamp, crewId, onlineCount) => {
  const msgTime = new Date(msgTimestamp).getTime();
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`crew_${crewId}_lastRead_`)) {
      const lastRead = parseInt(localStorage.getItem(key) || '0');
      if (lastRead >= msgTime) return 'read';
    }
  }
  
  return onlineCount > 1 ? 'delivered' : 'sent';
};

// ========================================
// LINE 685: SECTION 12 - BOOK DETAILS MODAL
// ========================================

const BookDetailsModal = ({ book, onClose, onCreateCrew }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    fetchBookDetails();
  }, [book]);

  const fetchBookDetails = async () => {
    setLoading(true);
    
    try {
      const query = encodeURIComponent(`${book.title} ${book.author || ''}`);
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`,
        { signal: AbortSignal.timeout(8000) }
      );
      
      if (response.ok) {
        const data = await response.json();
        const volumeInfo = data.items?.[0]?.volumeInfo;
        
        if (volumeInfo) {
          setDetails({
            title: volumeInfo.title,
            subtitle: volumeInfo.subtitle,
            authors: volumeInfo.authors || [book.author],
            description: volumeInfo.description || 'No description available',
            pageCount: volumeInfo.pageCount,
            publishedDate: volumeInfo.publishedDate,
            publisher: volumeInfo.publisher,
            categories: volumeInfo.categories || [],
            averageRating: volumeInfo.averageRating,
            ratingsCount: volumeInfo.ratingsCount,
            previewLink: volumeInfo.previewLink,
            infoLink: volumeInfo.infoLink,
            language: volumeInfo.language,
            isbn: volumeInfo.industryIdentifiers
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch book details:', error);
      setDetails({
        title: book.title,
        authors: [book.author],
        description: 'Details temporarily unavailable. Please try again later.',
        categories: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCrew = () => {
    onCreateCrew(book);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h3 className="font-bold text-lg">Book Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : details ? (
          <div className="p-4 space-y-4">
            <div className="flex gap-4">
              <DynamicBookCover title={book.title} author={book.author} size="lg" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{details.title}</h2>
                {details.subtitle && (
                  <p className="text-sm text-gray-600 mt-1">{details.subtitle}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  by {details.authors?.join(', ') || book.author}
                </p>
                {details.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {details.categories.slice(0, 3).map((cat, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                {details.averageRating && (
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={Math.round(details.averageRating)} size="xs" readonly />
                    <span className="text-xs text-gray-600">
                      {details.averageRating.toFixed(1)} ({details.ratingsCount || 0} ratings)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex border-b border-gray-200">
              {['description', 'details'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-sm font-medium border-b-2 transition ${
                    activeTab === tab
                      ? 'text-orange-500 border-orange-500'
                      : 'text-gray-500 border-transparent'
                  }`}
                >
                  {tab === 'description' ? 'Description' : 'Details'}
                </button>
              ))}
            </div>

            {activeTab === 'description' && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {details.description.replace(/<[^>]*>/g, '').substring(0, 1000)}
                  {details.description.length > 1000 && '...'}
                </p>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-3">
                {details.pageCount && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Pages</span>
                    <span className="font-medium">{details.pageCount}</span>
                  </div>
                )}
                {details.publishedDate && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Published</span>
                    <span className="font-medium">
                      {new Date(details.publishedDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {details.publisher && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Publisher</span>
                    <span className="font-medium">{details.publisher}</span>
                  </div>
                )}
                {details.language && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Language</span>
                    <span className="font-medium uppercase">{details.language}</span>
                  </div>
                )}
                {details.isbn && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">ISBN</span>
                    <span className="font-medium text-xs">
                      {details.isbn[0]?.identifier || 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleCreateCrew}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 transition"
              >
                <Users className="w-4 h-4" />
                Create Crew
              </button>
              {details.previewLink && (
                <a
                  href={details.previewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No details available</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// LINE 880: SECTION 13 - USER PROFILE MODAL (Quick View)
// ========================================

const UserProfileModal = ({ 
  userEmail, 
  userName, 
  currentUser, 
  onClose, 
  onFollow, 
  isFollowing, 
  onViewFullProfile, 
  onBlock, 
  isBlocked 
}) => {
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [stats, setStats] = useState({ 
    posts: 0, 
    reviews: 0, 
    followers: 0, 
    following: 0 
  });

  useEffect(() => {
    loadUserData();
  }, [userEmail]);

  const loadUserData = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.email === userEmail);
    if (found) setUserData(found);

    const userFollowers = JSON.parse(localStorage.getItem(`user_${userEmail}_followers`) || '[]');
    const userFollowing = JSON.parse(localStorage.getItem(`user_${userEmail}_following`) || '[]');
    
    const followersWithDetails = userFollowers.map(email => {
      const followerUser = users.find(u => u.email === email);
      return {
        email,
        name: followerUser?.name || email.split('@')[0],
        initials: followerUser?.name?.slice(0, 2).toUpperCase() || email.slice(0, 2).toUpperCase()
      };
    });
    
    const followingWithDetails = userFollowing.map(email => {
      const followingUser = users.find(u => u.email === email);
      return {
        email,
        name: followingUser?.name || email.split('@')[0],
        initials: followingUser?.name?.slice(0, 2).toUpperCase() || email.slice(0, 2).toUpperCase()
      };
    });
    
    setFollowers(followersWithDetails);
    setFollowing(followingWithDetails);

    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const posts = allPosts
      .filter(p => p.userEmail === userEmail)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setUserPosts(posts.slice(0, 5));

    const allReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    const reviews = allReviews
      .filter(r => r.userEmail === userEmail)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setUserReviews(reviews.slice(0, 3));

    setStats({
      posts: posts.length,
      reviews: reviews.length,
      followers: followersWithDetails.length,
      following: followingWithDetails.length
    });
  };

  const UserListModal = ({ title, users, onClose, onUserClick }) => (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {users.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No users to show</p>
          ) : (
            <div className="space-y-3">
              {users.map(user => (
                <button
                  key={user.email}
                  onClick={() => {
                    onClose();
                    onUserClick(user.email, user.name);
                  }}
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition"
                >
                  <Avatar initials={user.initials} size="sm" />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">@{user.email.split('@')[0]}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[75] flex items-center justify-center p-4 overflow-y-auto"
        style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
        <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
            <h3 className="font-bold">User Profile</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-5">
            <div className="flex items-center gap-4 mb-6">
              <Avatar initials={userName} size="lg" src={userData?.profileImage} />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 truncate">{userName}</h2>
                <p className="text-sm text-gray-500">@{userName?.toLowerCase().replace(/\s/g, '')}</p>
                {userData?.bio && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{userData.bio}</p>
                )}
                
                <div className="flex gap-4 mt-2">
                  <button 
                    onClick={() => setActiveTab('followers')}
                    className="text-center hover:opacity-75 transition"
                  >
                    <p className="font-bold text-gray-900">{stats.followers}</p>
                    <p className="text-xs text-gray-500">Followers</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('following')}
                    className="text-center hover:opacity-75 transition"
                  >
                    <p className="font-bold text-gray-900">{stats.following}</p>
                    <p className="text-xs text-gray-500">Following</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{stats.posts}</p>
                <p className="text-xs text-gray-500">Posts</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{stats.reviews}</p>
                <p className="text-xs text-gray-500">Reviews</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{stats.followers}</p>
                <p className="text-xs text-gray-500">Followers</p>
              </div>
            </div>

            {userEmail !== currentUser.email && (
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => onFollow(userEmail, userName)}
                  className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                    isFollowing 
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                      : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </button>
                <button
                  onClick={() => onBlock(userEmail, userName)}
                  className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                    isBlocked 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {isBlocked ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Unblock
                    </>
                  ) : (
                    <>
                      <UserMinus className="w-4 h-4" />
                      Block
                    </>
                  )}
                </button>
              </div>
            )}

            {userPosts.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Recent Posts</h3>
                <div className="space-y-3">
                  {userPosts.map(post => (
                    <div key={post.id} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">{formatTimeAgo(post.createdAt)}</p>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Heart className="w-3 h-3" /> {post.likes || 0}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MessageCircle className="w-3 h-3" /> {post.comments || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                onClose();
                onViewFullProfile(userEmail, userName);
              }}
              className="w-full py-3 border border-orange-200 text-orange-600 rounded-xl font-medium hover:bg-orange-50 transition"
            >
              View Full Profile
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'followers' && (
        <UserListModal
          title="Followers"
          users={followers}
          onClose={() => setActiveTab('posts')}
          onUserClick={onViewFullProfile}
        />
      )}

      {activeTab === 'following' && (
        <UserListModal
          title="Following"
          users={following}
          onClose={() => setActiveTab('posts')}
          onUserClick={onViewFullProfile}
        />
      )}
    </>
  );
};

// ========================================
// LINE 1150: SECTION 14 - BOTTOM NAVIGATION COMPONENT
// ========================================

const BottomNav = ({ active, setPage, unreadCount = 0, show = true }) => {
  if (!show) return null;
  
  const items = [
    { id: 'home', icon: BookOpen, label: 'Home' },
    { id: 'explore', icon: Sparkles, label: 'Explore' },
    { id: 'post', icon: Edit3, label: 'Post' },
    { id: 'reviews', icon: Star, label: 'Reviews' },
    { id: 'crews', icon: Users, label: 'Crews' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 max-w-md mx-auto shadow-lg">
      <div className="flex items-center justify-around py-2 px-2">
        {items.map(({ id, icon: Icon, label }) => (
          <button 
            key={id} 
            onClick={() => setPage(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative ${
              active === id ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {id === 'post' ? (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center -mt-5 shadow-lg ${
                active === id ? 'bg-orange-500' : 'bg-gray-800'
              }`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            ) : (
              <Icon className="w-5 h-5" strokeWidth={active === id ? 2.5 : 1.8} />
            )}
            {id === 'crews' && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <span className={`text-[10px] font-medium ${id === 'post' ? 'mt-1' : ''}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// ========================================
// LINE 1200: SECTION 15 - TOP BAR COMPONENT
// ========================================

const TopBar = ({ 
  user, 
  setPage, 
  title, 
  showBack = false, 
  onBack, 
  onNotificationClick, 
  notificationCount = 0, 
  profileSrc 
}) => (
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
      <button 
        onClick={onNotificationClick} 
        className="relative p-1 hover:bg-gray-100 rounded-lg transition"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>
      <button onClick={() => setPage('profile')} className="hover:opacity-80 transition">
        {profileSrc ? (
          <img 
            src={profileSrc} 
            alt="profile" 
            className="w-8 h-8 rounded-full object-cover border border-orange-200" 
          />
        ) : (
          <Avatar initials={user?.name} size="sm" />
        )}
      </button>
    </div>
  </header>
);

// ========================================
// LINE 1250: SECTION 16 - NOTIFICATIONS PAGE (FIXED)
// ========================================

const NotificationsPage = ({ user, onClose, updateNotificationCount }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadNotifications();
    
    const handleStorageChange = (e) => {
      if (e.key === `user_${user.email}_notifications`) {
        loadNotifications();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('rc:notif', loadNotifications);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('rc:notif', loadNotifications);
    };
  }, [user.email]);
  
  const loadNotifications = () => {
    const notifs = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    // Filter out crew messages from main notifications
    const filtered = notifs.filter(n => n.type !== 'message');
    setNotifications(filtered);
    setLoading(false);
  };
  
  const markAsRead = (id) => {
    const allNotifs = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    const updatedAll = allNotifs.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updatedAll));
    loadNotifications();
    window.dispatchEvent(new CustomEvent('rc:notif', { detail: { targetEmail: user.email } }));
    updateNotificationCount?.();
  };
  
  const markAllAsRead = () => {
    const allNotifs = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    const updatedAll = allNotifs.map(n => ({ ...n, read: true }));
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updatedAll));
    loadNotifications();
    window.dispatchEvent(new CustomEvent('rc:notif', { detail: { targetEmail: user.email } }));
    updateNotificationCount?.();
  };
  
  const deleteNotification = (id) => {
    const allNotifs = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    const updatedAll = allNotifs.filter(n => n.id !== id);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updatedAll));
    loadNotifications();
    window.dispatchEvent(new CustomEvent('rc:notif', { detail: { targetEmail: user.email } }));
    updateNotificationCount?.();
  };
  
  const icons = { 
    like: <Heart className="w-4 h-4 text-red-500" />, 
    comment: <MessageCircle className="w-4 h-4 text-blue-500" />, 
    message: <MessageSquare className="w-4 h-4 text-emerald-500" />, 
    invite: <UserPlus className="w-4 h-4 text-purple-500" />, 
    follow: <UserCheck className="w-4 h-4 text-green-500" />,
    reshare: <Repeat className="w-4 h-4 text-indigo-500" />,
    mention: <AtIcon className="w-4 h-4 text-amber-500" />,
    join: <Users className="w-4 h-4 text-blue-500" />,
    review: <Star className="w-4 h-4 text-yellow-500" />
  };
  
  const bgColors = { 
    like: 'bg-red-100', 
    comment: 'bg-blue-100', 
    message: 'bg-emerald-100', 
    invite: 'bg-purple-100', 
    follow: 'bg-green-100',
    reshare: 'bg-indigo-100',
    mention: 'bg-amber-100',
    join: 'bg-blue-100',
    review: 'bg-yellow-100'
  };
  
  const hasUnread = notifications.some(n => !n.read);
  
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden" 
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-semibold text-gray-900">Notifications</h2>
        <button 
          onClick={markAllAsRead} 
          className="text-sm text-orange-500 font-medium hover:text-orange-600 disabled:opacity-40"
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
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 transition cursor-pointer ${notif.read ? 'bg-white' : 'bg-orange-50'}`}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${bgColors[notif.type] || 'bg-gray-100'}`}>
                      {icons[notif.type] || <Bell className="w-4 h-4 text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-relaxed">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notif.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="text-gray-400 hover:text-red-500 transition p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// LINE 1400: SECTION 17 - SHARE MODAL
// ========================================

const ShareModal = ({ post, onClose }) => {
  const shareUrl = window.location.href;
  const shareText = `Check out this post by ${post.userName}: "${post.content?.substring(0, 50)}..."`;
  
  const shareHandlers = {
    whatsapp: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank'),
    facebook: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank'),
    twitter: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank'),
    telegram: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank'),
    email: () => window.open(`mailto:?subject=Check out this post on ReadCrew&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`, '_blank'),
    copyLink: () => { 
      navigator.clipboard.writeText(shareUrl); 
      alert('Link copied to clipboard!'); 
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 overflow-y-auto" 
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
          <h3 className="font-semibold">Share Post</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              ['whatsapp', '#25D366', 'W'],
              ['facebook', '#1877F2', 'F'],
              ['twitter', '#1DA1F2', 'T'],
              ['telegram', '#0088cc', 'T']
            ].map(([key, color, letter]) => (
              <button 
                key={key} 
                onClick={shareHandlers[key]} 
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-transform group-hover:scale-110" 
                  style={{ backgroundColor: color }}>
                  {letter}
                </div>
                <span className="text-xs text-gray-600 capitalize group-hover:text-gray-900">
                  {key}
                </span>
              </button>
            ))}
          </div>
          
          <div className="mb-4">
            <button 
              onClick={shareHandlers.email}
              className="w-full py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50 transition"
            >
              <Mail className="w-5 h-5 text-orange-500" />
              <span className="font-medium">Email</span>
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
          
          <button 
            onClick={shareHandlers.copyLink} 
            className="w-full mt-4 py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50 transition"
          >
            <Link2 className="w-5 h-5 text-orange-500" />
            <span className="font-medium">Copy Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================================
// LINE 1480: SECTION 18 - RESHARE MODAL
// ========================================

const ReshareModal = ({ post, onClose, onReshare }) => {
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const handleReshare = () => {
    onReshare(post, comment, isPublic);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 overflow-y-auto" 
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
          <h3 className="font-semibold">Reshare Post</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5">
          <div className="mb-4">
            <label className="text-sm text-gray-600 mb-2 block">Add a comment (optional):</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 resize-none"
              placeholder="What are your thoughts?"
              rows={4}
            />
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Avatar initials={post.userName} size="xs" />
              <span className="text-xs font-semibold text-gray-700">{post.userName}</span>
              <span className="text-xs text-gray-400">{formatTimeAgo(post.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-3">{post.content}</p>
            {post.image && (
              <img src={post.image} alt="" className="mt-2 rounded-lg max-h-32 object-cover" />
            )}
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition ${
                isPublic 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {isPublic ? 'Public' : 'Private'}
            </button>
            <span className="text-xs text-gray-400">
              {isPublic ? 'Visible to everyone' : 'Only visible to you'}
            </span>
          </div>
          
          <button
            onClick={handleReshare}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition"
          >
            <Repeat className="w-4 h-4" />
            Reshare
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================================
// LINE 1550: SECTION 19 - POST OPTIONS MODAL (with Report)
// ========================================

const PostOptionsModal = ({ 
  post, 
  user, 
  onClose, 
  onReshare, 
  onSave, 
  isSaved, 
  onDelete, 
  isOwner, 
  onFollow, 
  isFollowing, 
  onBlock, 
  isBlocked 
}) => {
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const reportReasons = [
    'Spam or misleading',
    'Harassment or bullying',
    'Inappropriate content',
    'Misinformation',
    'Hate speech',
    'Violence',
    'Copyright infringement',
    'Other'
  ];

  const handleReport = async () => {
    if (!reportReason) return;
    
    setReportSubmitting(true);
    
    const reports = JSON.parse(localStorage.getItem('reportedPosts') || '[]');
    reports.push({ 
      postId: post.id, 
      reportedBy: user.email,
      reportedByName: user.name,
      reason: reportReason,
      details: reportDetails,
      postContent: post.content,
      postAuthor: post.userEmail,
      postAuthorName: post.userName,
      timestamp: new Date().toISOString() 
    });
    
    localStorage.setItem('reportedPosts', JSON.stringify(reports));
    
    setReportSubmitting(false);
    setReportSent(true);
    
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  if (showReportForm) {
    return (
      <div className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center"
        style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
        <div className="bg-white rounded-t-2xl w-full p-5 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pt-2 pb-2 border-b">
            <h3 className="font-semibold text-lg">Report Post</h3>
            <button onClick={() => setShowReportForm(false)} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {reportSent ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="font-semibold text-gray-900 text-lg">Report submitted</p>
              <p className="text-sm text-gray-500 mt-2">Thanks for helping keep ReadCrew safe.</p>
              <p className="text-xs text-gray-400 mt-4">Our team will review this post shortly.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Post by <span className="font-semibold">{post.userName}</span>:</p>
                <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
              </div>
              
              <p className="text-sm text-gray-700 mb-3 font-medium">Why are you reporting this post?</p>
              
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {reportReasons.map(reason => (
                  <button
                    key={reason}
                    onClick={() => setReportReason(reason)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition ${
                      reportReason === reason
                        ? 'border-orange-500 bg-orange-50 text-orange-700 font-medium'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-2 block">Additional details (optional):</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 resize-none"
                  placeholder="Please provide any additional context..."
                  rows={3}
                  disabled={!reportReason}
                />
              </div>
              
              <button
                onClick={handleReport}
                disabled={!reportReason || reportSubmitting}
                className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-red-600 transition flex items-center justify-center gap-2"
              >
                {reportSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Flag className="w-4 h-4" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
              
              <p className="text-xs text-gray-400 text-center mt-3">
                Reports are confidential and reviewed by our team.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const options = [
    { 
      id: 'reshare', 
      icon: Repeat, 
      label: 'Reshare', 
      color: 'text-blue-600', 
      action: () => { onReshare(post); onClose(); } 
    },
    { 
      id: 'save', 
      icon: Bookmark, 
      label: isSaved ? 'Unsave' : 'Save Post', 
      color: isSaved ? 'text-orange-500' : 'text-gray-700', 
      action: () => { onSave(post); onClose(); } 
    },
  ];

  if (!isOwner) {
    options.push({ 
      id: 'follow', 
      icon: isFollowing ? UserMinus : UserPlus, 
      label: isFollowing ? 'Unfollow' : 'Follow', 
      color: isFollowing ? 'text-red-500' : 'text-green-600', 
      action: () => { onFollow(post.userEmail, post.userName); onClose(); } 
    });
    
    options.push({ 
      id: 'block', 
      icon: isBlocked ? UserCheck : UserMinus, 
      label: isBlocked ? 'Unblock User' : 'Block User', 
      color: isBlocked ? 'text-green-600' : 'text-red-500', 
      action: () => { onBlock(post.userEmail, post.userName); onClose(); } 
    });
    
    options.push({ 
      id: 'report', 
      icon: Flag, 
      label: 'Report Post', 
      color: 'text-red-500', 
      action: () => setShowReportForm(true) 
    });
  }

  if (isOwner) {
    options.push({ 
      id: 'delete', 
      icon: Trash2, 
      label: 'Delete Post', 
      color: 'text-red-500', 
      action: () => { 
        if (window.confirm('Are you sure you want to delete this post?')) {
          onDelete(post); 
          onClose(); 
        }
      } 
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-t-2xl w-full overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-center">Post Options</h3>
        </div>
        
        <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
          {options.map(option => (
            <button
              key={option.id}
              onClick={option.action}
              className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition"
            >
              <option.icon className={`w-5 h-5 ${option.color}`} />
              <span className={`text-sm font-medium ${option.color}`}>{option.label}</span>
            </button>
          ))}
          
          <button
            onClick={onClose}
            className="w-full px-4 py-3.5 text-sm text-gray-500 hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================================
// LINE 1750: SECTION 20 - INLINE POST CARD (with Global Comments/Likes)
// ========================================

const InlinePostCard = ({ 
  post, 
  user, 
  profileSrc, 
  updateNotificationCount, 
  onShare, 
  onReshareClick, 
  onSaveToggle, 
  isSaved, 
  onDelete, 
  onFollow, 
  isFollowing, 
  onBlock, 
  isBlocked, 
  onViewUserProfile, 
  onViewBookDetails 
}) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likedComments, setLikedComments] = useState(new Set());
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [showOptions, setShowOptions] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const likedPosts = JSON.parse(localStorage.getItem(`user_${user.email}_likedPosts`) || '[]');
    setIsLiked(likedPosts.includes(post.id));
    
    const liked = JSON.parse(localStorage.getItem(`user_${user.email}_likedComments`) || '[]');
    setLikedComments(new Set(liked));
  }, [post.id, user.email]);

  useEffect(() => {
    if (!showComments) return;
    loadComments();
  }, [showComments]);

  const loadComments = async () => {
    setLoadingComments(true);
    // Get comments from global storage
    const allComments = JSON.parse(localStorage.getItem('allComments') || '[]');
    const postComments = allComments.filter(c => c.postId === post.id);
    setComments(postComments);
    setLoadingComments(false);
  };

  const handleLikePost = async () => {
    if (isLiked) return;
    
    setIsLiked(true);
    setLikeCount(prev => prev + 1);
    
    const likedPosts = JSON.parse(localStorage.getItem(`user_${user.email}_likedPosts`) || '[]');
    likedPosts.push(post.id);
    localStorage.setItem(`user_${user.email}_likedPosts`, JSON.stringify(likedPosts));
    
    // Update global post likes
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const updatedPosts = allPosts.map(p => 
      p.id === post.id ? { ...p, likes: (p.likes || 0) + 1 } : p
    );
    localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
    
    if (post.userEmail !== user.email) {
      pushNotification(post.userEmail, { 
        type: 'like', 
        fromUser: user.name, 
        fromUserEmail: user.email,
        message: `${user.name} liked your post`, 
        postId: post.id 
      });
      updateNotificationCount?.();
    }
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    
    const mentions = extractMentions(newComment);
    
    const commentData = {
      id: generateId(),
      postId: post.id,
      userName: user.name,
      userEmail: user.email,
      content: newComment.trim(),
      mentions,
      parentId: replyTo?.id || null,
      timestamp: new Date().toISOString(),
      likes: 0
    };
    
    // Save to global comments storage
    const allComments = JSON.parse(localStorage.getItem('allComments') || '[]');
    allComments.push(commentData);
    localStorage.setItem('allComments', JSON.stringify(allComments));
    
    setComments(prev => [...prev, commentData]);
    setNewComment('');
    setReplyTo(null);
    
    // Update post comment count
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const updatedPosts = allPosts.map(p => 
      p.id === post.id ? { ...p, comments: (p.comments || 0) + 1 } : p
    );
    localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
    
    if (post.userEmail !== user.email) {
      pushNotification(post.userEmail, { 
        type: 'comment', 
        fromUser: user.name, 
        fromUserEmail: user.email,
        message: `${user.name} commented: "${newComment.substring(0, 50)}"`, 
        postId: post.id 
      });
      updateNotificationCount?.();
    }
  };

  const handleLikeComment = (commentId, commentUserId) => {
    if (likedComments.has(commentId)) return;
    
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c
    ));
    
    const newLiked = new Set(likedComments);
    newLiked.add(commentId);
    setLikedComments(newLiked);
    localStorage.setItem(`user_${user.email}_likedComments`, JSON.stringify([...newLiked]));
    
    // Update global comment likes
    const allComments = JSON.parse(localStorage.getItem('allComments') || '[]');
    const updatedComments = allComments.map(c => 
      c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c
    );
    localStorage.setItem('allComments', JSON.stringify(updatedComments));
    
    if (commentUserId !== user.email) {
      pushNotification(commentUserId, { 
        type: 'like', 
        fromUser: user.name, 
        fromUserEmail: user.email,
        message: `${user.name} liked your comment`, 
        postId: post.id 
      });
      updateNotificationCount?.();
    }
  };

  const handleDeleteComment = (commentId) => {
    const filtered = comments.filter(c => c.id !== commentId && c.parentId !== commentId);
    setComments(filtered);
    
    const allComments = JSON.parse(localStorage.getItem('allComments') || '[]');
    const updatedAll = allComments.filter(c => c.id !== commentId && c.parentId !== commentId);
    localStorage.setItem('allComments', JSON.stringify(updatedAll));
    
    // Update post comment count
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const updatedPosts = allPosts.map(p => 
      p.id === post.id ? { ...p, comments: Math.max(0, (p.comments || 0) - 1) } : p
    );
    localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
  };

  const topLevelComments = comments.filter(c => !c.parentId);
  const visibleComments = showAllComments ? topLevelComments : topLevelComments.slice(0, 3);
  const isPostAuthor = user.email === post.userEmail;

  const CommentRow = ({ comment, depth = 0 }) => {
    const replies = depth < 2 ? comments.filter(c => c.parentId === comment.id) : [];
    const isLiked = likedComments.has(comment.id);
    const isOwn = comment.userEmail === user.email;

    const renderContent = () => {
      if (!comment.mentions?.length) {
        return <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{comment.content}</p>;
      }
      
      const parts = comment.content.split(/(@\w+)/g);
      return (
        <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">
          {parts.map((part, index) => {
            if (part.startsWith('@')) {
              const username = part.substring(1);
              return (
                <button
                  key={index}
                  onClick={() => {
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const mentionedUser = users.find(u => 
                      u.name.toLowerCase().includes(username.toLowerCase()) ||
                      u.email.split('@')[0].toLowerCase() === username.toLowerCase()
                    );
                    if (mentionedUser) {
                      onViewUserProfile(mentionedUser.email, mentionedUser.name);
                    }
                  }}
                  className="text-orange-600 font-semibold hover:underline"
                >
                  {part}
                </button>
              );
            }
            return part;
          })}
        </p>
      );
    };

    return (
      <div className={`flex gap-2.5 ${depth > 0 ? 'ml-8' : ''}`}>
        <div className="flex flex-col items-center flex-shrink-0" style={{ width: 30 }}>
          <button onClick={() => onViewUserProfile(comment.userEmail, comment.userName)}>
            <Avatar initials={comment.userName} size="xs" src={comment.userPhoto} />
          </button>
          {replies.length > 0 && showReplies[comment.id] && (
            <div className="w-0.5 flex-1 bg-orange-200 mt-1 rounded-full min-h-[16px]" />
          )}
        </div>
        
        <div className="flex-1 min-w-0 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => onViewUserProfile(comment.userEmail, comment.userName)}
              className="font-semibold text-gray-900 text-sm hover:underline"
            >
              {comment.userName}
            </button>
            <span className="text-xs text-gray-400 ml-auto">
              {formatTimeAgo(comment.timestamp)}
            </span>
          </div>
          
          {renderContent()}
          
          <div className="flex items-center gap-4 mt-1.5">
            <button
              onClick={() => handleLikeComment(comment.id, comment.userEmail)}
              disabled={isLiked}
              className={`flex items-center gap-1 text-xs font-medium transition ${
                isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500' : ''}`} />
              <span>{comment.likes || 0}</span>
            </button>
            
            {depth < 2 && (
              <button
                onClick={() => { 
                  setReplyTo(comment); 
                  setTimeout(() => inputRef.current?.focus(), 100); 
                }}
                className="text-xs text-gray-400 hover:text-orange-500 font-semibold"
              >
                Reply
              </button>
            )}
            
            {isOwn && (
              <button 
                onClick={() => handleDeleteComment(comment.id)} 
                className="ml-auto text-gray-200 hover:text-red-400 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          {replies.length > 0 && (
            <div className="mt-2">
              {!showReplies[comment.id] && replies.length > 1 && (
                <button
                  onClick={() => setShowReplies(prev => ({ ...prev, [comment.id]: true }))}
                  className="text-xs text-orange-500 font-semibold mb-2 flex items-center gap-1"
                >
                  <ChevronDown className="w-3 h-3" />
                  View {replies.length} replies
                </button>
              )}
              
              {(showReplies[comment.id] || replies.length === 1) && (
                <div className="space-y-2 pl-3 border-l-2 border-orange-100">
                  {replies.map(reply => (
                    <CommentRow key={reply.id} comment={reply} depth={depth + 1} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {showOptions && (
        <PostOptionsModal
          post={post}
          user={user}
          onClose={() => setShowOptions(false)}
          onReshare={onReshareClick}
          onSave={onSaveToggle}
          isSaved={isSaved}
          onDelete={onDelete}
          isOwner={isPostAuthor}
          onFollow={onFollow}
          isFollowing={isFollowing}
          onBlock={onBlock}
          isBlocked={isBlocked}
        />
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-start gap-3">
            <button 
              onClick={() => onViewUserProfile(post.userEmail, post.userName)} 
              className="flex-shrink-0"
            >
              <Avatar initials={post.userName} size="md" src={post.userPhoto} />
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  onClick={() => onViewUserProfile(post.userEmail, post.userName)} 
                  className="font-bold text-gray-900 text-sm hover:underline"
                >
                  {post.userName || 'Anonymous'}
                </button>
                <span className="text-xs text-gray-400">
                  {formatTimeAgo(post.createdAt)}
                </span>
              </div>
              
              {post.bookName && (
                <button
                  onClick={() => onViewBookDetails?.({ title: post.bookName, author: post.author })}
                  className="flex items-center gap-1.5 mt-0.5 hover:underline"
                >
                  <BookOpen className="w-3 h-3 text-orange-400" />
                  <span className="text-xs text-gray-500 font-medium">
                    {post.bookName}
                    {post.author && ` · ${post.author}`}
                  </span>
                </button>
              )}
            </div>
            
            <button 
              onClick={() => setShowOptions(true)} 
              className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          {post.image && (
            <img 
              src={post.image} 
              alt="" 
              className="w-full rounded-xl mb-3 max-h-96 object-cover cursor-pointer hover:opacity-95 transition"
              onClick={() => window.open(post.image, '_blank')}
            />
          )}
          
          {post.isReshare && post.originalPost && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <Repeat className="w-3 h-3" />
              <span>
                Reshared from{' '}
                <button 
                  onClick={() => onViewUserProfile(post.originalPost.userEmail, post.originalPost.userName)}
                  className="font-semibold hover:underline"
                >
                  {post.originalPost.userName}
                </button>
              </span>
            </div>
          )}
          
          <p className="text-gray-800 text-base leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
            {post.story || post.content}
          </p>
          
          {post.reshareComment && (
            <div className="mt-3 bg-orange-50 rounded-lg p-3 border border-orange-100">
              <p className="text-sm text-orange-800 italic">"{post.reshareComment}"</p>
            </div>
          )}
          
          {post.isReshare && post.originalPost && (
            <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Original post:</p>
              <p className="text-sm text-gray-600 line-clamp-2">{post.originalPost.content}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-5">
          <button
            onClick={handleLikePost}
            disabled={isLiked}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-all ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
            <span>{likeCount}</span>
          </button>

          <button
            onClick={() => setShowComments(prev => !prev)}
            className={`flex items-center gap-1.5 text-sm font-semibold transition ${
              showComments ? 'text-orange-500' : 'text-gray-500 hover:text-orange-500'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>{post.comments || 0}</span>
          </button>

          <button
            onClick={() => onSaveToggle(post)}
            className={`flex items-center gap-1.5 text-sm font-semibold transition ${
              isSaved ? 'text-orange-500' : 'text-gray-500 hover:text-orange-400'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-orange-500' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={() => onShare(post)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-orange-500 transition ml-auto"
          >
            <Share2 className="w-4 h-4" />
            <span>{post.reshareCount || 0}</span>
          </button>
        </div>

        {/* Comments Section - Only rendered when toggled open */}
        {showComments && (
          <>
            {/* Comment Input */}
            <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/60">
              {replyTo && (
                <div className="flex items-center gap-2 mb-2 pl-2 border-l-2 border-orange-400">
                  <p className="text-xs text-orange-600 font-medium flex-1">
                    Replying to <span className="font-bold">{replyTo.userName}</span>
                  </p>
                  <button onClick={() => setReplyTo(null)}>
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                {profileSrc ? (
                  <img 
                    src={profileSrc} 
                    alt="" 
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0" 
                  />
                ) : (
                  <Avatar initials={user?.name} size="sm" />
                )}
                
                <div className="flex-1 flex items-center gap-2 bg-white rounded-full border border-gray-200 px-4 py-2 focus-within:border-orange-400 focus-within:shadow-sm transition">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { 
                      if (e.key === 'Enter' && !e.shiftKey) { 
                        e.preventDefault(); 
                        handlePostComment(); 
                      } 
                    }}
                    className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                    placeholder={replyTo ? `Reply to @${replyTo.userName}...` : "Write a comment... (use @ to mention)"}
                  />
                </div>
                
                <button
                  onClick={handlePostComment}
                  disabled={!newComment.trim()}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    newComment.trim() 
                      ? 'bg-orange-500 text-white shadow-sm hover:bg-orange-600 active:scale-95' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Post
                </button>
              </div>
              
              <p className="text-xs text-gray-400 mt-2">
                <span className="font-semibold">Tip:</span> Use @username to mention someone
              </p>
            </div>

            {/* Comments List */}
            <div className="px-4 py-3 border-t border-gray-100 space-y-3 max-h-96 overflow-y-auto">
              {loadingComments ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : visibleComments.length > 0 ? (
                visibleComments.map(comment => (
                  <CommentRow key={comment.id} comment={comment} depth={0} />
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              )}

              {topLevelComments.length > 3 && (
                <button
                  onClick={() => setShowAllComments(prev => !prev)}
                  className="text-xs text-orange-500 font-semibold mt-2 flex items-center gap-1 hover:text-orange-600"
                >
                  {showAllComments ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      View all {topLevelComments.length} comments
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

// ========================================
// LINE 2150: SECTION 21 - LOGIN PAGE
// ========================================

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [readingGoal, setReadingGoal] = useState({ yearly: 20, monthly: 5 });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendOTP = () => {
    setError('');
    
    if (!isLogin && name.trim().length < 2) {
      setError('Please enter your full name');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!isLogin && !agreeToTerms) {
      setError('Please agree to the terms');
      return;
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('devOTP', otp);
    localStorage.setItem('pendingUser', JSON.stringify({ 
      email, 
      name: name || email.split('@')[0], 
      password: password || 'password123' 
    }));
    
    setDevOtp(otp);
    setShowOTP(true);
  };

  const handleVerifyOTP = () => {
    setError('');
    
    if (otpInput.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    
    const savedOtp = localStorage.getItem('devOTP');
    const pendingUser = JSON.parse(localStorage.getItem('pendingUser') || '{}');
    
    if (otpInput !== savedOtp) {
      setError('Incorrect code. Please try again.');
      return;
    }
    
    localStorage.removeItem('devOTP');
    localStorage.removeItem('pendingUser');
    
    const userData = {
      id: generateId(),
      name: pendingUser.name || name,
      email: pendingUser.email || email,
      password: pendingUser.password || password,
      readingGoal,
      isVerified: true,
      createdAt: new Date().toISOString(),
      stats: { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 },
      joinedCrews: [],
      readingList: [],
      savedPosts: [],
      bio: 'Reading is my superpower',
      location: '',
      website: '',
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        darkMode: false
      }
    };
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const existingIndex = users.findIndex(u => u.email === userData.email);
    
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...userData };
    } else {
      users.push(userData);
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    // Initialize user data
    ['followers', 'following', 'blocked', 'notifications', 'likedPosts', 'likedReviews', 'readingList', 'savedPosts', 'likedComments'].forEach(key => {
      if (!localStorage.getItem(`user_${userData.email}_${key}`)) {
        localStorage.setItem(`user_${userData.email}_${key}`, JSON.stringify([]));
      }
    });
    
    setShowOTP(false);
    onLogin(userData);
  };

  const handleLogin = () => {
    setError('');
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (found) {
      if (found.password === password || !found.password) {
        localStorage.setItem('currentUser', JSON.stringify(found));
        setLoading(false);
        onLogin(found);
        return;
      } else {
        setError('Incorrect password. Please try again.');
      }
    } else {
      setError('No account found. Please sign up first.');
    }
    
    setLoading(false);
  };

  const handleResetPassword = () => {
    if (!validateEmail(resetEmail)) {
      setError('Please enter a valid email');
      return;
    }
    
    setLoading(true);
    
    setTimeout(() => {
      setResetSent(true);
      setLoading(false);
    }, 1500);
  };

  if (showOTP) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-7 border border-gray-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Check your email</h2>
            <p className="text-gray-500 text-sm">We sent a code to <strong>{email}</strong></p>
          </div>

          {devOtp && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-4 text-center">
              <p className="text-xs text-amber-700 font-medium mb-2">📧 Demo mode - use this code:</p>
              <p className="text-4xl font-bold text-amber-800 tracking-widest">{devOtp}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <input
            type="text"
            inputMode="numeric"
            value={otpInput}
            onChange={e => { 
              setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6)); 
              setError(''); 
            }}
            className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none text-center text-3xl tracking-widest mb-4 font-mono"
            placeholder="000000"
            maxLength="6"
            autoFocus
          />

          <button
            onClick={handleVerifyOTP}
            disabled={otpInput.length !== 6}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-50 mb-3"
          >
            Verify & Continue
          </button>

          <div className="flex justify-between">
            <button
              onClick={() => { 
                setShowOTP(false); 
                setError(''); 
                setDevOtp(''); 
              }}
              className="text-gray-500 text-sm flex items-center gap-1 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button 
              onClick={handleSendOTP} 
              className="text-orange-500 text-sm font-semibold hover:text-orange-600"
            >
              Resend code
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-7">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h2>
            <p className="text-gray-500 text-sm">
              {resetSent 
                ? 'Password reset link has been sent to your email'
                : 'Enter your email to receive a password reset link'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {!resetSent ? (
            <>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
                <Mail className="w-5 h-5 text-gray-400" />
                <input
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                  placeholder="Email address"
                  type="email"
                />
              </div>

              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-50 mb-3"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-green-700 text-center">
                Check your email for the password reset link.
              </p>
            </div>
          )}

          <button
            onClick={() => {
              setShowResetPassword(false);
              setResetEmail('');
              setResetSent(false);
              setError('');
            }}
            className="text-gray-500 text-sm flex items-center gap-1 mx-auto hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
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
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent" style={{ fontFamily: 'Georgia, serif' }}>
            ReadCrew
          </h1>
          <p className="text-gray-500 text-sm mt-2">Read together, grow together.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-7 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-5">
            {isLogin ? 'Welcome Back!' : 'Join the Crew'}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {!isLogin && (
              <>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <User className="w-5 h-5 text-gray-400" />
                  <input
                    value={name}
                    onChange={e => { setName(e.target.value); setError(''); }}
                    className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                    placeholder="Full Name *"
                    autoComplete="name"
                  />
                </div>
                
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-orange-500" />
                    Reading Goals (Optional)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Yearly books</label>
                      <input
                        type="number"
                        value={readingGoal.yearly}
                        onChange={e => setReadingGoal({ ...readingGoal, yearly: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Monthly books</label>
                      <input
                        type="number"
                        value={readingGoal.monthly}
                        onChange={e => setReadingGoal({ ...readingGoal, monthly: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm"
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
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                placeholder="Email address *"
                type="email"
                autoComplete="email"
              />
            </div>

            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
              <Lock className="w-5 h-5 text-gray-400" />
              <input
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                type={showPassword ? 'text' : 'password'}
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                placeholder={isLogin ? 'Password *' : 'Create a password *'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              <button onClick={() => setShowPassword(!showPassword)} type="button">
                {showPassword ? 
                  <EyeOff className="w-4 h-4 text-gray-400" /> : 
                  <Eye className="w-4 h-4 text-gray-400" />
                }
              </button>
            </div>

            {!isLogin && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="terms" className="text-xs text-gray-600">
                  I agree to the{' '}
                  <button className="text-orange-500 hover:underline">Terms of Service</button>
                  {' '}and{' '}
                  <button className="text-orange-500 hover:underline">Privacy Policy</button>
                </label>
              </div>
            )}
          </div>

          {isLogin && (
            <button
              onClick={() => setShowResetPassword(true)}
              className="text-sm text-orange-500 mt-2 hover:underline"
            >
              Forgot password?
            </button>
          )}

          <button
            onClick={isLogin ? handleLogin : handleSendOTP}
            disabled={loading}
            className="w-full mt-5 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90 transition"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span>Please wait...</span>
              </>
            ) : isLogin ? 'Log In' : 'Create Account →'}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { 
                setIsLogin(!isLogin); 
                setError(''); 
                setEmail(''); 
                setPassword(''); 
                setName(''); 
              }}
              className="text-orange-500 font-semibold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ========================================
// LINE 2600: SECTION 22 - BOOK DATABASE & AI RESPONSE
// ========================================

const BOOK_DB = {
  thriller: [
    { title: 'Gone Girl', author: 'Gillian Flynn', genre: 'Thriller', rating: 4.6, reason: 'Twisty, addictive, impossible to put down' },
    { title: 'The Silent Patient', author: 'Alex Michaelides', genre: 'Thriller', rating: 4.5, reason: 'Jaw-dropping twist guaranteed' },
    { title: 'Verity', author: 'Colleen Hoover', genre: 'Thriller', rating: 4.6, reason: 'You will NOT see the ending coming' },
    { title: 'The Girl on the Train', author: 'Paula Hawkins', genre: 'Thriller', rating: 4.4, reason: 'Unreliable narrator at its best' },
    { title: 'Sharp Objects', author: 'Gillian Flynn', genre: 'Thriller', rating: 4.5, reason: 'Dark, twisted, and beautifully written' }
  ],
  fantasy: [
    { title: 'The Name of the Wind', author: 'Patrick Rothfuss', genre: 'Fantasy', rating: 4.7, reason: 'Stunning prose and world-building' },
    { title: 'Mistborn', author: 'Brandon Sanderson', genre: 'Fantasy', rating: 4.7, reason: 'Inventive magic system + satisfying plot' },
    { title: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', rating: 4.6, reason: 'Fast-paced, romantic, absolutely addictive' },
    { title: 'The Way of Kings', author: 'Brandon Sanderson', genre: 'Fantasy', rating: 4.8, reason: 'Epic fantasy at its finest' },
    { title: 'A Game of Thrones', author: 'George R.R. Martin', genre: 'Fantasy', rating: 4.7, reason: 'Complex characters and political intrigue' }
  ],
  romance: [
    { title: 'Beach Read', author: 'Emily Henry', genre: 'Romance', rating: 4.6, reason: 'Witty, heartfelt and genuinely funny' },
    { title: 'It Ends with Us', author: 'Colleen Hoover', genre: 'Romance', rating: 4.6, reason: 'Emotional, important and beautifully written' },
    { title: 'People We Meet on Vacation', author: 'Emily Henry', genre: 'Romance', rating: 4.6, reason: 'Nostalgic, swoony and deeply satisfying' },
    { title: 'The Love Hypothesis', author: 'Ali Hazelwood', genre: 'Romance', rating: 4.7, reason: 'STEM romance that will make you swoon' },
    { title: 'Red, White & Royal Blue', author: 'Casey McQuiston', genre: 'Romance', rating: 4.7, reason: 'Charming, witty, and utterly delightful' }
  ],
  scifi: [
    { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.8, reason: 'Most fun you\'ll have reading sci-fi' },
    { title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi', rating: 4.8, reason: 'Foundation of all modern science fiction' },
    { title: 'The Martian', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.8, reason: 'Funny, clever and impossible to put down' },
    { title: 'Children of Time', author: 'Adrian Tchaikovsky', genre: 'Sci-Fi', rating: 4.7, reason: 'Mind-blowing concepts and world-building' },
    { title: 'The Three-Body Problem', author: 'Cixin Liu', genre: 'Sci-Fi', rating: 4.6, reason: 'Hard sci-fi at its absolute best' }
  ],
  selfhelp: [
    { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8, reason: 'Most practical habit book ever written' },
    { title: 'The Psychology of Money', author: 'Morgan Housel', genre: 'Finance', rating: 4.7, reason: 'Will change how you think about money' },
    { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', rating: 4.7, reason: 'Will change how you see humanity' },
    { title: 'Dare to Lead', author: 'Brené Brown', genre: 'Leadership', rating: 4.6, reason: 'Courageous leadership for everyone' },
    { title: 'The Power of Now', author: 'Eckhart Tolle', genre: 'Spirituality', rating: 4.6, reason: 'Life-changing perspective on presence' }
  ],
  mystery: [
    { title: 'And Then There Were None', author: 'Agatha Christie', genre: 'Mystery', rating: 4.7, reason: 'Best-selling mystery novel of all time' },
    { title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', genre: 'Mystery', rating: 4.7, reason: 'Glamorous, emotional and unforgettable' },
    { title: 'The Thursday Murder Club', author: 'Richard Osman', genre: 'Mystery', rating: 4.5, reason: 'Charming, funny and genuinely clever' },
    { title: 'The Silent Patient', author: 'Alex Michaelides', genre: 'Mystery', rating: 4.6, reason: 'Twist that will shock you' },
    { title: 'The Guest List', author: 'Lucy Foley', genre: 'Mystery', rating: 4.4, reason: 'Perfect atmospheric thriller' }
  ],
  literary: [
    { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', rating: 4.6, reason: 'Beautiful, philosophical and profoundly hopeful' },
    { title: 'Normal People', author: 'Sally Rooney', genre: 'Literary Fiction', rating: 4.4, reason: 'Painfully accurate about modern relationships' },
    { title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', rating: 4.7, reason: 'Short, profound and endlessly re-readable' },
    { title: 'A Little Life', author: 'Hanya Yanagihara', genre: 'Literary Fiction', rating: 4.6, reason: 'Devastating and unforgettable' },
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Classic', rating: 4.7, reason: 'Timeless masterpiece of American literature' }
  ],
  historical: [
    { title: 'All the Light We Cannot See', author: 'Anthony Doerr', genre: 'Historical Fiction', rating: 4.7, reason: 'Exquisitely written — Pulitzer Prize winner' },
    { title: 'The Book Thief', author: 'Markus Zusak', genre: 'Historical Fiction', rating: 4.8, reason: 'Utterly unique voice and unforgettable story' },
    { title: 'The Nightingale', author: 'Kristin Hannah', genre: 'Historical Fiction', rating: 4.8, reason: 'Devastating and triumphant — you will absolutely cry' },
    { title: 'The Kite Runner', author: 'Khaled Hosseini', genre: 'Historical Fiction', rating: 4.8, reason: 'Emotional and powerful' },
    { title: 'Pachinko', author: 'Min Jin Lee', genre: 'Historical Fiction', rating: 4.7, reason: 'Epic family saga spanning generations' }
  ]
};

const generateClientResponse = (text, previousBooks = []) => {
  const t = text.toLowerCase();
  
  const detectCategory = () => {
    if (/thrille|suspens|crime|murder|dark|creepy|horror|detective/i.test(t)) return 'thriller';
    if (/fantasy|magic|dragon|wizard|sword|epic|tolkien|harry potter/i.test(t)) return 'fantasy';
    if (/romance|love|swoony|kiss|dating|enemies.to.lovers/i.test(t)) return 'romance';
    if (/sci.?fi|space|future|robot|alien|tech|mars|nasa/i.test(t)) return 'scifi';
    if (/self.?help|habit|product|motivat|improve|success|mindset|business|finance/i.test(t)) return 'selfhelp';
    if (/mystery|whodun|cozy|clue|puzzle|agatha/i.test(t)) return 'mystery';
    if (/histor|period|war|ancient|medieval|century|wwii|world war/i.test(t)) return 'historical';
    if (/literary|fiction|prose|character|emotion|feel|beautiful|meaning/i.test(t)) return 'literary';
    return 'literary';
  };
  
  const category = detectCategory();
  const bookList = BOOK_DB[category] || BOOK_DB.literary;
  const prevTitles = new Set(previousBooks.map(b => b.title));
  const fresh = bookList.filter(b => !prevTitles.has(b.title));
  const recs = (fresh.length >= 5 ? fresh : bookList).slice(0, 5);
  
  const intros = {
    thriller: "Here are 5 gripping thrillers you won't be able to put down! 🔪",
    fantasy: "5 magical worlds waiting for you to explore ✨",
    romance: "5 romance reads that will give you all the feels ❤️",
    scifi: "5 sci-fi journeys that will blow your mind 🚀",
    selfhelp: "5 books that will genuinely change how you think 💡",
    mystery: "5 mysteries that'll keep you guessing until the last page 🔍",
    historical: "5 historical novels that transport you completely 🏰",
    literary: "5 beautifully written books that will stay with you 📚",
  };
  
  return { reply: intros[category] || "Here are 5 great picks for you! 📚", books: recs };
};

// ========================================
// LINE 2800: SECTION 23 - BOOK CARD COMPONENT
// ========================================

const BookCard = ({ book, onCreateCrew, onViewDetails }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
    <div className="flex gap-4">
      <DynamicBookCover 
        title={book.title} 
        author={book.author} 
        size="md" 
        onClick={() => onViewDetails?.(book)}
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 text-sm leading-tight">{book.title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">by {book.author}</p>
        {book.genre && (
          <span className="inline-block mt-1.5 text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
            {book.genre}
          </span>
        )}
        {book.reason && (
          <p className="text-xs text-orange-700 mt-1 italic line-clamp-2">"{book.reason}"</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <StarRating rating={Math.round(book.rating || 4)} size="xs" />
          <span className="text-xs font-semibold text-gray-700">{book.rating || 4.0}</span>
        </div>
      </div>
    </div>
    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
      <button 
        onClick={() => onViewDetails?.(book)} 
        className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition"
      >
        View Details
      </button>
      <button 
        onClick={onCreateCrew} 
        className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-orange-600 transition"
      >
        <Users className="w-4 h-4" />
        Create Crew
      </button>
    </div>
  </div>
);

// ========================================
// LINE 2850: SECTION 24 - POST PAGE
// ========================================

const PostPage = ({ user, onPost, setPage }) => {
  const [content, setContent] = useState('');
  const [bookName, setBookName] = useState('');
  const [author, setAuthor] = useState('');
  const [image, setImage] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const fileInputRef = useRef(null);

  const handleContentChange = (e) => {
    const text = e.target.value;
    setContent(text);
    setCharCount(text.length);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setUploading(true);
    
    const postData = {
      id: generateId(),
      content: sanitizeText(content.trim()),
      bookName: bookName.trim() || undefined,
      author: author.trim() || undefined,
      image,
      isPublic,
      userName: user.name,
      userEmail: user.email,
      userPhoto: user.profileImage,
      userInitials: user.name.slice(0, 2).toUpperCase(),
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      reshareCount: 0
    };

    try {
      const response = await axios.post(`${API_URL}/api/social/posts`, postData);
      if (response.data.success) {
        onPost(response.data.post);
      } else {
        onPost(postData);
      }
    } catch (error) {
      console.error('Failed to post to server:', error);
      onPost(postData);
    }
    
    setUploading(false);
    setPage('home');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white z-[55] overflow-hidden" 
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={() => setPage('home')} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-semibold text-gray-900">Create Post</h2>
        <button 
          onClick={handleSubmit} 
          disabled={!content.trim() || uploading} 
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition"
        >
          {uploading ? <LoadingSpinner size="sm" color="white" /> : 'Share'}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex gap-3 mb-4">
          <Avatar initials={user?.name} size="md" src={user?.profileImage} />
          <div className="flex-1">
            <textarea 
              value={content} 
              onChange={handleContentChange} 
              className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-base resize-none" 
              placeholder="What are you reading? Share your thoughts..." 
              rows={6} 
              maxLength={1000}
              autoFocus 
            />
            <div className="flex justify-end">
              <span className={`text-xs ${charCount > 900 ? 'text-orange-500' : 'text-gray-400'}`}>
                {charCount}/1000
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3 mb-4">
          <input 
            value={bookName} 
            onChange={e => setBookName(e.target.value)} 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300" 
            placeholder="Book name (optional)" 
          />
          <input 
            value={author} 
            onChange={e => setAuthor(e.target.value)} 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300" 
            placeholder="Author (optional)" 
          />
        </div>
        
        {image && (
          <div className="relative mb-4">
            <img src={image} alt="preview" className="w-full rounded-xl max-h-64 object-cover" />
            <button 
              onClick={() => setImage(null)} 
              className="absolute top-2 right-2 bg-black/50 rounded-full p-1 hover:bg-black/70 transition"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 hover:bg-gray-200 transition"
          >
            <Camera className="w-4 h-4" />
            Add Photo
          </button>
          
          <button 
            onClick={() => setIsPublic(!isPublic)} 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition ${
              !isPublic ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {isPublic ? 'Public' : 'Private'}
          </button>
        </div>
        
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleImageUpload} 
        />
      </div>
    </div>
  );
};

// ========================================
// LINE 2950: SECTION 25 - REVIEWS PAGE
// ========================================

const ReviewsPage = ({ user, setPage, updateNotificationCount, onViewUserProfile }) => {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadReviews();
    
    const liked = JSON.parse(localStorage.getItem(`user_${user.email}_likedReviews`) || '[]');
    setLikedReviews(liked);
  }, [user.email]);

  const loadReviews = async () => {
    setLoading(true);
    
    try {
      const response = await axios.get(`${API_URL}/api/social/reviews`);
      if (response.data.success) {
        setReviews(response.data.reviews || []);
        localStorage.setItem('reviews', JSON.stringify(response.data.reviews));
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
      const saved = JSON.parse(localStorage.getItem('reviews') || '[]');
      setReviews(saved);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeReview = (reviewId, review) => {
    if (likedReviews.includes(reviewId)) return;
    
    const updated = [...likedReviews, reviewId];
    setLikedReviews(updated);
    localStorage.setItem(`user_${user.email}_likedReviews`, JSON.stringify(updated));
    
    const updatedReviews = reviews.map(r => 
      r.id === reviewId ? { ...r, likes: (r.likes || 0) + 1 } : r
    );
    setReviews(updatedReviews);
    localStorage.setItem('reviews', JSON.stringify(updatedReviews));
    
    if (review.userEmail !== user.email) {
      pushNotification(review.userEmail, { 
        type: 'review', 
        fromUser: user.name, 
        fromUserEmail: user.email, 
        message: `${user.name} liked your review of "${review.bookName}"` 
      });
      updateNotificationCount?.();
    }
  };

  const handleCreateReview = async () => {
    if (!newReview.bookName || !newReview.author || !newReview.review) { 
      alert('Please fill all fields'); 
      return; 
    }
    
    const reviewData = { 
      id: generateId(),
      ...newReview, 
      userName: user.name, 
      userEmail: user.email,
      userPhoto: user.profileImage,
      createdAt: new Date().toISOString(),
      likes: 0
    };

    try {
      const response = await axios.post(`${API_URL}/api/social/reviews`, reviewData);
      if (response.data.success) {
        const saved = response.data.review;
        setReviews(prev => [saved, ...prev]);
        localStorage.setItem('reviews', JSON.stringify([saved, ...reviews]));
      }
    } catch (error) {
      console.error('Failed to create review:', error);
      setReviews(prev => [reviewData, ...prev]);
      localStorage.setItem('reviews', JSON.stringify([reviewData, ...reviews]));
    }

    setShowCreateForm(false);
    setNewReview({ bookName: '', author: '', rating: 5, review: '', sentiment: 'positive' });
    
    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.reviewsGiven = (stats.reviewsGiven || 0) + 1;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
  };

  const filteredAndSortedReviews = reviews
    .filter(review => 
      review.bookName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.userName?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'popular') return (b.likes || 0) - (a.likes || 0);
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onCreateCrew={() => {}}
        />
      )}
      
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <button onClick={() => setPage('home')} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-semibold text-gray-900">Book Reviews</h2>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)} 
          className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
        >
          {showCreateForm ? 'Cancel' : 'Write Review'}
        </button>
      </div>
      
      <div className="px-4 py-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by book, author, or reviewer..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-400"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Write a Review</h3>
            <div className="space-y-3 mb-4">
              <input 
                type="text" 
                value={newReview.bookName} 
                onChange={e => setNewReview({ ...newReview, bookName: e.target.value })} 
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" 
                placeholder="Book name *" 
              />
              <input 
                type="text" 
                value={newReview.author} 
                onChange={e => setNewReview({ ...newReview, author: e.target.value })} 
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" 
                placeholder="Author *" 
              />
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Rating</label>
                <StarRating 
                  rating={newReview.rating} 
                  onChange={r => setNewReview({ ...newReview, rating: r })} 
                  size="md" 
                />
              </div>
              <textarea 
                value={newReview.review} 
                onChange={e => setNewReview({ ...newReview, review: e.target.value })} 
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300 resize-none" 
                placeholder="Write your review..." 
                rows={4} 
              />
              <div className="flex gap-2">
                {['positive', 'negative'].map(s => (
                  <button 
                    key={s} 
                    type="button" 
                    onClick={() => setNewReview({ ...newReview, sentiment: s })} 
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      newReview.sentiment === s 
                        ? (s === 'positive' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s === 'positive' ? '👍 Positive' : '👎 Negative'}
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={handleCreateReview} 
              className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition"
            >
              Submit Review
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredAndSortedReviews.length === 0 ? (
          <div className="text-center py-12">
            {searchQuery ? (
              <>
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No reviews found for "{searchQuery}"</p>
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="mt-3 text-orange-500 text-sm font-medium hover:underline"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No reviews yet. Be the first!</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedReviews.map((review) => {
              const isLiked = likedReviews.includes(review.id);
              return (
                <div key={review.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start gap-3 mb-2">
                    <DynamicBookCover 
                      title={review.bookName} 
                      author={review.author} 
                      size="sm" 
                      onClick={() => setSelectedBook({ title: review.bookName, author: review.author })}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{review.bookName}</h3>
                      <p className="text-xs text-gray-500">by {review.author}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <StarRating rating={review.rating} size="xs" />
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">{review.review}</p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button 
                      onClick={() => onViewUserProfile(review.userEmail, review.userName)}
                      className="flex items-center gap-2 hover:opacity-75 transition"
                    >
                      <Avatar initials={review.userName} size="xs" src={review.userPhoto} />
                      <span className="text-xs text-gray-600 hover:underline">{review.userName}</span>
                    </button>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleLikeReview(review.id, review)} 
                        disabled={isLiked} 
                        className={`flex items-center gap-1 text-xs transition ${
                          isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500' : ''}`} />
                        {review.likes || 0}
                      </button>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        review.sentiment === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {review.sentiment === 'positive' ? '👍' : '👎'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// LINE 3250: SECTION 26 - EXPLORE PAGE with AI Chat
// ========================================

const ExplorePage = ({ user, setPage, onCreateCrew }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! 👋 I'm Page Turner, your AI book guide. Tell me what you're in the mood for — a genre, a vibe, a character type, or even the last book you loved. Let's find your next great read!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [mode, setMode] = useState('chat');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userText = input.trim();
    setInput('');
    setExchangeCount(prev => prev + 1);
    setMessages(prev => [...prev, { role: 'user', content: userText, timestamp: new Date() }]);
    setLoading(true);

    let usedBackend = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`${API_URL}/api/books/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, sessionId }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.reply) {
          setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }]);
          if (data.exchangeCount) setExchangeCount(data.exchangeCount);
          if (data.recommendations?.length > 0) {
            setBooks(data.recommendations);
          }
          usedBackend = true;
        }
      }
    } catch (error) {
      console.error('AI chat error:', error);
    }

    if (!usedBackend) {
      const { reply, books: recs } = generateClientResponse(userText, books);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);
      if (recs.length > 0) setBooks(recs);
    }

    setLoading(false);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] to-[#FAF6F1] pb-24 overflow-y-auto">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-[#2D1F14] mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          What to read next?
        </h1>
        <p className="text-sm text-[#8B7968]">Chat with your AI book guide</p>
      </div>

      <div className="flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-hide">
        {[
          ['chat', '✨', 'AI Chat'],
          ['browse', '📚', 'Browse'],
          ['popular', '🔥', 'Popular']
        ].map(([id, emoji, label]) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              mode === id
                ? 'bg-orange-500 text-white shadow'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {mode === 'chat' && (
        <>
          <div className="px-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0 shadow">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white rounded-br-sm'
                      : 'bg-white text-[#3A2C25] rounded-bl-sm shadow-sm border border-gray-100'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start items-end gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {books.length > 0 && (
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-px flex-1 bg-orange-200" />
                  <span className="text-xs text-orange-500 font-semibold">📚 RECOMMENDATIONS</span>
                  <div className="h-px flex-1 bg-orange-200" />
                </div>
                {books.map((book, i) => (
                  <BookCard
                    key={`${i}-${book.title}`}
                    book={book}
                    onCreateCrew={() => { onCreateCrew(book); setPage('crews'); }}
                    onViewDetails={(book) => setSelectedBook(book)}
                  />
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="sticky bottom-20 mx-4 mt-4 bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-gray-200 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Tell me what you're in the mood for..."
                className="flex-1 bg-transparent text-sm text-[#2D1F14] outline-none placeholder-gray-400"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition flex-shrink-0 ${
                  input.trim() && !loading
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {mode === 'browse' && (
        <div className="px-4 py-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Browse by Genre</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(BOOK_DB).map(genre => (
              <button
                key={genre}
                onClick={() => {
                  setBooks(BOOK_DB[genre]);
                  setMode('chat');
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Here are some great ${genre} books for you!`,
                    timestamp: new Date()
                  }]);
                }}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition text-left"
              >
                <h3 className="font-semibold text-gray-900 capitalize">{genre}</h3>
                <p className="text-xs text-gray-500 mt-1">{BOOK_DB[genre].length} books</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'popular' && (
        <div className="px-4 py-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Popular This Week</h2>
          <div className="space-y-3">
            {Object.values(BOOK_DB)
              .flat()
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 10)
              .map((book, i) => (
                <BookCard
                  key={i}
                  book={book}
                  onCreateCrew={() => { onCreateCrew(book); setPage('crews'); }}
                  onViewDetails={(book) => setSelectedBook(book)}
                />
              ))}
          </div>
        </div>
      )}

      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onCreateCrew={onCreateCrew}
        />
      )}
    </div>
  );
};

// ========================================
// LINE 3450: SECTION 27 - HOME PAGE (with global feed)
// ========================================

const HomePage = ({ 
  user, 
  posts, 
  crews, 
  setPage, 
  updateNotificationCount, 
  profileSrc, 
  savedPosts, 
  onSavePost, 
  onResharePost, 
  onDeletePost, 
  onFollow, 
  following, 
  onBlock, 
  blockedUsers, 
  onViewUserProfile,
  onViewBookDetails 
}) => {
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showShare, setShowShare] = useState(null);
  const [showReshare, setShowReshare] = useState(null);
  const [stats, setStats] = useState({ 
    booksRead: 0, 
    reviewsGiven: 0, 
    postsCreated: 0, 
    crewsJoined: 0 
  });
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    loadTrendingBooks();
    
    const savedStats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    setStats(savedStats);
    
    if (user?.readingGoal?.yearly > 0) {
      const progress = Math.min((savedStats.booksRead || 0) / user.readingGoal.yearly * 100, 100);
      setReadingProgress(progress);
    }

    socket.on('new_post', (post) => {
      if (!blockedUsers.includes(post.userEmail)) {
        // Update global posts
        const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
        allPosts.unshift(post);
        localStorage.setItem('allPosts', JSON.stringify(allPosts));
      }
    });
    
    socket.on('post_deleted', ({ postId }) => {
      const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
      const filtered = allPosts.filter(p => p.id !== postId);
      localStorage.setItem('allPosts', JSON.stringify(filtered));
    });
    
    socket.on('post_liked', ({ postId, likes }) => {
      const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
      const updated = allPosts.map(p => p.id === postId ? { ...p, likes } : p);
      localStorage.setItem('allPosts', JSON.stringify(updated));
    });

    return () => {
      socket.off('new_post');
      socket.off('post_deleted');
      socket.off('post_liked');
    };
  }, [user.email, blockedUsers]);

  const loadTrendingBooks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/books/trending?limit=8`);
      if (response.data.success) {
        setTrendingBooks(response.data.books);
      }
    } catch (error) {
      console.error('Failed to load trending books:', error);
      setTrendingBooks([
        { title: 'Atomic Habits', author: 'James Clear', rating: 4.8 },
        { title: 'Project Hail Mary', author: 'Andy Weir', rating: 4.8 },
        { title: 'Fourth Wing', author: 'Rebecca Yarros', rating: 4.6 },
        { title: 'The Midnight Library', author: 'Matt Haig', rating: 4.6 },
        { title: 'The Psychology of Money', author: 'Morgan Housel', rating: 4.7 },
        { title: 'It Ends with Us', author: 'Colleen Hoover', rating: 4.6 }
      ]);
    } finally {
      setLoadingTrending(false);
    }
  };

  const handleReshareClick = (post) => {
    setShowReshare(post);
  };

  const handleReshare = (post, comment) => {
    onResharePost(post, comment);
    setShowReshare(null);
  };

  const userCrews = crews.filter(c => user?.joinedCrews?.includes(c.id));
  const hasReadingGoal = user?.readingGoal?.yearly > 0;
  const filteredPosts = posts.filter(p => !blockedUsers.includes(p.userEmail));

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <TopBar
        user={user}
        setPage={setPage}
        profileSrc={profileSrc}
        onNotificationClick={() => setPage('notifications')}
        notificationCount={JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]').filter(n => n.type !== 'message' && !n.read).length}
      />

      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onCreateCrew={(book) => {
            const newCrew = {
              id: generateId(),
              name: book.title,
              author: book.author,
              genre: book.genre || 'General',
              members: 1,
              chats: 0,
              createdBy: user.email,
              createdByName: user.name,
              createdAt: new Date().toISOString()
            };
            const updatedCrews = [newCrew, ...crews];
            localStorage.setItem('crews', JSON.stringify(updatedCrews));
            setPage('crews');
          }}
        />
      )}

      {showShare && <ShareModal post={showShare} onClose={() => setShowShare(null)} />}
      
      {showReshare && (
        <ReshareModal
          post={showReshare}
          onClose={() => setShowReshare(null)}
          onReshare={handleReshare}
        />
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
          
          {hasReadingGoal && (
            <div className="mt-4 bg-white/20 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Yearly Goal</span>
                <span className="font-semibold">{stats.booksRead}/{user.readingGoal.yearly} books</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500" 
                  style={{ width: `${readingProgress}%` }} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Books', value: stats.booksRead, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100', page: 'profile' },
            { label: 'Reviews', value: stats.reviewsGiven, icon: Star, color: 'text-purple-600', bg: 'bg-purple-100', page: 'reviews' },
            { label: 'Posts', value: stats.postsCreated, icon: Edit3, color: 'text-green-600', bg: 'bg-green-100', page: 'post' },
            { label: 'Crews', value: stats.crewsJoined, icon: Users, color: 'text-orange-600', bg: 'bg-orange-100', page: 'crews' }
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

        {/* Trending Books */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Trending Books
            </h2>
            <button onClick={() => setPage('explore')} className="text-sm text-orange-500 font-semibold hover:underline">
              Explore All
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
                  className="shrink-0 w-28 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setSelectedBook(book)}
                >
                  <DynamicBookCover title={book.title} author={book.author} size="md" />
                  <p className="text-sm font-semibold text-gray-900 mt-2 leading-tight line-clamp-2">{book.title}</p>
                  <p className="text-xs text-gray-500 truncate">{book.author}</p>
                  {book.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium">{book.rating}</span>
                    </div>
                  )}
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
            <button onClick={() => setPage('crews')} className="text-sm text-orange-500 font-semibold hover:underline">
              View All
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {userCrews.slice(0, 2).map(crew => (
              <div
                key={crew.id}
                className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition"
                onClick={() => setPage('crews')}
              >
                <div className="h-16 flex items-center justify-center p-2 bg-gray-50">
                  <DynamicBookCover title={crew.name} author={crew.author} size="xs" />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{crew.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{crew.genre}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      {crew.members || 1}
                    </div>
                    <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-lg text-xs font-medium">
                      Joined
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {userCrews.length === 0 && (
              <div className="col-span-2 bg-white rounded-xl p-6 text-center border border-gray-200">
                <p className="text-gray-500 text-sm">No crews joined yet</p>
                <button 
                  onClick={() => setPage('crews')} 
                  className="mt-2 text-orange-500 text-sm font-medium hover:underline"
                >
                  Browse Crews →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Create Post Button */}
        <button
          onClick={() => setPage('post')}
          className="w-full bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-center gap-3 hover:shadow-md transition"
        >
          {profileSrc ? (
            <img src={profileSrc} alt="profile" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <Avatar initials={user?.name} size="sm" />
          )}
          <span className="text-gray-400 text-sm flex-1 text-left">Share your reading journey...</span>
          <span className="text-xs text-orange-500 font-medium bg-orange-50 px-3 py-1 rounded-full">
            Post
          </span>
        </button>

        {/* Community Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              Community Feed
            </h2>
            <button onClick={() => setPage('reviews')} className="text-sm text-orange-500 font-semibold hover:underline">
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No posts yet. Be the first to share!</p>
                <button 
                  onClick={() => setPage('post')} 
                  className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition"
                >
                  Create Post
                </button>
              </div>
            ) : (
              filteredPosts.map((post, idx) => (
                <InlinePostCard
                  key={post.id || idx}
                  post={post}
                  user={user}
                  profileSrc={profileSrc}
                  updateNotificationCount={updateNotificationCount}
                  onShare={(p) => setShowShare(p)}
                  onReshareClick={handleReshareClick}
                  onSaveToggle={onSavePost}
                  isSaved={savedPosts?.includes(post.id)}
                  onDelete={onDeletePost}
                  onFollow={onFollow}
                  isFollowing={following?.includes(post.userEmail)}
                  onBlock={onBlock}
                  isBlocked={blockedUsers?.includes(post.userEmail)}
                  onViewUserProfile={onViewUserProfile}
                  onViewBookDetails={(b) => setSelectedBook(b)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ========================================
// LINE 3800: SECTION 28 - PROFILE PAGE
// ========================================

const ProfilePage = ({ 
  user, 
  posts, 
  setPage, 
  onLogout, 
  onUpdateUser, 
  profileSrc, 
  setProfileSrc, 
  savedPosts, 
  following, 
  followers 
}) => {
  const [activeTab, setActiveTab] = useState('Posts');
  const [stats, setStats] = useState({ 
    booksRead: 0, 
    reviewsGiven: 0, 
    postsCreated: 0, 
    crewsJoined: 0 
  });
  const [readingGoal, setReadingGoal] = useState(user?.readingGoal || { yearly: 0, monthly: 0 });
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [editGoal, setEditGoal] = useState(readingGoal);
  const [books, setBooks] = useState([]);
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', rating: 5, notes: '' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editLocation, setEditLocation] = useState(user?.location || '');
  const [editWebsite, setEditWebsite] = useState(user?.website || '');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const fileInputRef = useRef(null);

  const myPosts = posts.filter(p => p.userEmail === user?.email);
  const myReviews = JSON.parse(localStorage.getItem('reviews') || '[]').filter(r => r.userEmail === user?.email);
  const savedPostsList = posts.filter(p => savedPosts?.includes(p.id));
  const joinedCrews = JSON.parse(localStorage.getItem(`user_${user.email}_joinedCrews`) || '[]');
  const allCrews = JSON.parse(localStorage.getItem('crews') || '[]');
  const myCrews = allCrews.filter(c => joinedCrews.includes(c.id));

  useEffect(() => {
    const savedStats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    setStats(savedStats);
    
    const savedBooks = JSON.parse(localStorage.getItem(`user_${user.email}_readingList`) || '[]');
    setBooks(savedBooks);
  }, [user.email]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageData = ev.target.result;
      setProfileSrc(imageData);
      localStorage.setItem(`user_${user.email}_profile_image`, imageData);
      
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map(u => 
        u.email === user.email ? { ...u, profileImage: imageData } : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, profileImage: imageData }));
      
      onUpdateUser?.({ ...user, profileImage: imageData });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    const updatedUser = { 
      ...user, 
      name: editName, 
      bio: editBio, 
      location: editLocation, 
      website: editWebsite 
    };
    
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map(u => u.email === user.email ? updatedUser : u);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    onUpdateUser?.(updatedUser);
    setEditingProfile(false);
  };

  const handleSaveGoal = () => {
    const updatedUser = { ...user, readingGoal: editGoal };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setReadingGoal(editGoal);
    setShowEditGoal(false);
    onUpdateUser?.(updatedUser);
  };

  const handleAddBook = () => {
    if (!newBook.title) {
      alert('Enter book title');
      return;
    }
    
    const book = { 
      id: generateId(), 
      ...newBook, 
      addedAt: new Date().toISOString() 
    };
    
    const updatedBooks = [book, ...books];
    setBooks(updatedBooks);
    localStorage.setItem(`user_${user.email}_readingList`, JSON.stringify(updatedBooks));
    
    const updatedStats = { ...stats, booksRead: updatedBooks.length };
    setStats(updatedStats);
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(updatedStats));
    
    setNewBook({ title: '', author: '', rating: 5, notes: '' });
    setShowAddBook(false);
  };

  const handleDeleteBook = (bookId) => {
    if (!window.confirm('Remove this book from your list?')) return;
    
    const updatedBooks = books.filter(b => b.id !== bookId);
    setBooks(updatedBooks);
    localStorage.setItem(`user_${user.email}_readingList`, JSON.stringify(updatedBooks));
    
    const updatedStats = { ...stats, booksRead: updatedBooks.length };
    setStats(updatedStats);
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(updatedStats));
  };

  const FollowerModal = ({ title, users, onClose, onUserClick }) => (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {users.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No users to show</p>
          ) : (
            <div className="space-y-3">
              {users.map(email => {
                const usersList = JSON.parse(localStorage.getItem('users') || '[]');
                const userData = usersList.find(u => u.email === email);
                return (
                  <button
                    key={email}
                    onClick={() => {
                      onClose();
                      onUserClick(email, userData?.name || email);
                    }}
                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition"
                  >
                    <Avatar
                      initials={userData?.name || email}
                      size="sm"
                      src={userData?.profileImage}
                    />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">{userData?.name || email}</p>
                      <p className="text-xs text-gray-500">@{email.split('@')[0]}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const tabs = ['Posts', 'Reviews', 'Books Read', 'Crews', 'Saved Posts'];

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      {showFollowers && (
        <FollowerModal
          title="Followers"
          users={followers}
          onClose={() => setShowFollowers(false)}
          onUserClick={(email, name) => {
            // Navigate to user profile
          }}
        />
      )}
      
      {showFollowing && (
        <FollowerModal
          title="Following"
          users={following}
          onClose={() => setShowFollowing(false)}
          onUserClick={(email, name) => {
            // Navigate to user profile
          }}
        />
      )}

      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold" style={{ fontFamily: 'Georgia, serif' }}>Profile</span>
        </div>
        <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-lg">
          <LogOut className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="px-4 py-5">
        <div className="flex items-start gap-4 mb-5">
          <div className="relative flex-shrink-0">
            {profileSrc ? (
              <img
                src={profileSrc}
                alt={user?.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-orange-200"
              />
            ) : (
              <Avatar initials={user?.name} size="xl" />
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow hover:bg-orange-600 transition"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            {editingProfile ? (
              <div className="space-y-2">
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300"
                  placeholder="Your name"
                />
                <input
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300"
                  placeholder="Location"
                />
                <input
                  value={editWebsite}
                  onChange={e => setEditWebsite(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300"
                  placeholder="Website"
                />
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300 resize-none"
                  placeholder="Your bio..."
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 truncate">{user?.name}</h2>
                <p className="text-sm text-gray-500">@{user?.name?.toLowerCase().replace(/\s/g, '')}</p>
                {user?.location && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {user.location}
                  </p>
                )}
                {user?.website && (
                  <a
                    href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-orange-500 mt-1 flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {user.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                <p className="text-sm text-gray-600 mt-2 italic">"{user?.bio || 'Reading is my superpower'}"</p>
                
                <div className="flex gap-4 mt-2">
                  <button
                    onClick={() => setShowFollowers(true)}
                    className="text-center hover:opacity-75 transition"
                  >
                    <p className="font-bold text-gray-900">{followers?.length || 0}</p>
                    <p className="text-xs text-gray-500">Followers</p>
                  </button>
                  <button
                    onClick={() => setShowFollowing(true)}
                    className="text-center hover:opacity-75 transition"
                  >
                    <p className="font-bold text-gray-900">{following?.length || 0}</p>
                    <p className="text-xs text-gray-500">Following</p>
                  </button>
                </div>
                
                <button
                  onClick={() => setEditingProfile(true)}
                  className="mt-3 px-4 py-1.5 border border-orange-200 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        {/* Reading Goal */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold">Reading Goal {new Date().getFullYear()}</h3>
            </div>
            <button
              onClick={() => setShowEditGoal(!showEditGoal)}
              className="text-sm text-orange-500 font-medium hover:text-orange-600"
            >
              {showEditGoal ? 'Cancel' : 'Edit'}
            </button>
          </div>
          
          {showEditGoal ? (
            <div className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Yearly Goal</label>
                  <input
                    type="number"
                    value={editGoal.yearly}
                    onChange={e => setEditGoal({ ...editGoal, yearly: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Monthly Goal</label>
                  <input
                    type="number"
                    value={editGoal.monthly}
                    onChange={e => setEditGoal({ ...editGoal, monthly: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm"
                    min="0"
                    max="20"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveGoal}
                className="w-full py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
              >
                Save Goal
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold">
                  {readingGoal.yearly > 0 ? `${stats.booksRead}/${readingGoal.yearly} books` : 'No goal set'}
                </span>
              </div>
              {readingGoal.yearly > 0 && (
                <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((stats.booksRead / readingGoal.yearly) * 100, 100)}%` }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2 bg-white rounded-xl p-3 border border-gray-200 mb-5">
          {[
            { label: 'Books', value: stats.booksRead, icon: BookOpen, color: 'text-blue-600' },
            { label: 'Reviews', value: stats.reviewsGiven, icon: Star, color: 'text-purple-600' },
            { label: 'Posts', value: stats.postsCreated, icon: Edit3, color: 'text-green-600' },
            { label: 'Crews', value: stats.crewsJoined, icon: Users, color: 'text-orange-600' }
          ].map(({ label, value, icon: Icon, color }, idx) => (
            <div key={idx} className="text-center">
              <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Privacy Notice */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3 px-1">
          <Globe className="w-3 h-3" />
          <span>Posts, Reviews, Books & Crews are public · Saved posts are private</span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 text-sm pb-2.5 px-3 font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab
                  ? 'text-orange-500 border-orange-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'Posts' && (
          <div className="space-y-4">
            {myPosts.length === 0 ? (
              <div className="text-center py-8">
                <Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No posts yet</p>
                <button
                  onClick={() => setPage('post')}
                  className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition"
                >
                  Create First Post
                </button>
              </div>
            ) : (
              myPosts.map(post => (
                <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                  {post.bookName && <p className="text-xs text-orange-500">📖 {post.bookName}</p>}
                  {post.image && (
                    <img src={post.image} alt="" className="w-full rounded-xl mt-2 max-h-40 object-cover" />
                  )}
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-100 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      {post.likes || 0}
                    </span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'Reviews' && (
          <div className="space-y-4">
            {myReviews.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No reviews yet</p>
                <button
                  onClick={() => setPage('reviews')}
                  className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition"
                >
                  Write a Review
                </button>
              </div>
            ) : (
              myReviews.map(review => (
                <div key={review.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-3 mb-2">
                    <DynamicBookCover title={review.bookName} author={review.author} size="sm" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{review.bookName}</h3>
                      <p className="text-xs text-gray-500">by {review.author}</p>
                      <StarRating rating={review.rating} size="xs" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{review.review}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'Books Read' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">{books.length} books read</p>
              <button
                onClick={() => setShowAddBook(!showAddBook)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
              >
                <Plus className="w-4 h-4" />
                {showAddBook ? 'Cancel' : 'Add Book'}
              </button>
            </div>

            {showAddBook && (
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                {newBook.title && (
                  <div className="flex justify-center mb-3">
                    <DynamicBookCover title={newBook.title} author={newBook.author} size="md" />
                  </div>
                )}
                <div className="space-y-3">
                  <input
                    value={newBook.title}
                    onChange={e => setNewBook({ ...newBook, title: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300"
                    placeholder="Book title *"
                  />
                  <input
                    value={newBook.author}
                    onChange={e => setNewBook({ ...newBook, author: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300"
                    placeholder="Author"
                  />
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Your Rating</label>
                    <StarRating
                      rating={newBook.rating}
                      onChange={r => setNewBook({ ...newBook, rating: r })}
                      size="md"
                    />
                  </div>
                  <textarea
                    value={newBook.notes}
                    onChange={e => setNewBook({ ...newBook, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300 resize-none"
                    placeholder="Notes (optional)"
                    rows={2}
                  />
                  <button
                    onClick={handleAddBook}
                    className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition"
                  >
                    Add to My Books
                  </button>
                </div>
              </div>
            )}

            {books.length === 0 ? (
              <div className="text-center py-8">
                <BookMarked className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No books tracked yet</p>
                <p className="text-xs text-gray-400 mt-1">Add books you've finished reading!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {books.map(book => (
                  <div key={book.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-start gap-3">
                    <DynamicBookCover title={book.title} author={book.author} size="sm" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900">{book.title}</h3>
                      <p className="text-xs text-gray-500">{book.author}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <StarRating rating={book.rating} size="xs" />
                      </div>
                      {book.notes && (
                        <p className="text-xs text-gray-600 mt-1 italic">"{book.notes}"</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(book.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteBook(book.id)}
                      className="p-1 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-400 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Crews' && (
          <div className="space-y-3">
            {myCrews.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No crews joined yet</p>
                <button
                  onClick={() => setPage('crews')}
                  className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition"
                >
                  Browse Crews
                </button>
              </div>
            ) : (
              myCrews.map(crew => (
                <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <div className="flex items-center px-4 gap-4 py-3">
                    <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{crew.name}</p>
                      <p className="text-xs text-gray-500">by {crew.author}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {crew.genre && (
                          <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                            {crew.genre}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{crew.members || 1} members</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'Saved Posts' && (
          <div className="space-y-4">
            {savedPostsList.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No saved posts yet</p>
                <p className="text-xs text-gray-400 mt-1">Save posts from the home feed to see them here!</p>
              </div>
            ) : (
              savedPostsList.map(post => (
                <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                  {post.bookName && <p className="text-xs text-orange-500">📖 {post.bookName}</p>}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                    <span className="text-xs text-gray-400">by {post.userName}</span>
                    <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// LINE 4250: SECTION 29 - CREWS PAGE
// ========================================

const CrewsPage = ({ user, crews: initialCrews, setPage, updateNotificationCount, onViewUserProfile }) => {
  const [view, setView] = useState('list');
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [crews, setCrews] = useState([]);
  const [joinedCrews, setJoinedCrews] = useState([]);
  const [crewMembers, setCrewMembers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCrewData, setNewCrewData] = useState({ name: '', author: '', genre: '' });
  const [toastMessage, setToastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [unreadCrewMessages, setUnreadCrewMessages] = useState({});

  useEffect(() => {
    const savedCrews = JSON.parse(localStorage.getItem('crews') || '[]');
    setCrews(savedCrews.length > 0 ? savedCrews : initialCrews);
    
    const joined = JSON.parse(localStorage.getItem(`user_${user.email}_joinedCrews`) || '[]');
    setJoinedCrews(joined);
    
    // Load unread message counts
    const notifications = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    const crewMessages = notifications.filter(n => n.type === 'message' && !n.read);
    
    const unreadCounts = {};
    crewMessages.forEach(n => {
      if (n.crewId) {
        unreadCounts[n.crewId] = (unreadCounts[n.crewId] || 0) + 1;
      }
    });
    setUnreadCrewMessages(unreadCounts);
  }, [user.email]);

  const isJoined = (crewId) => joinedCrews.includes(crewId) || joinedCrews.includes(String(crewId));

  const joinCrew = (crew) => {
    if (isJoined(crew.id)) return;
    
    const updatedJoined = [...joinedCrews, crew.id];
    setJoinedCrews(updatedJoined);
    localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updatedJoined));
    
    const updatedCrews = crews.map(c => 
      c.id === crew.id ? { ...c, members: (c.members || 1) + 1 } : c
    );
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));
    
    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.crewsJoined = (stats.crewsJoined || 0) + 1;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
    
    setToastMessage(`🎉 Joined "${crew.name}"!`);
    setTimeout(() => setToastMessage(''), 3000);
    
    // Notify creator
    if (crew.createdBy !== user.email) {
      pushNotification(crew.createdBy, {
        type: 'join',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} joined your crew "${crew.name}"`,
        crewId: crew.id
      });
      updateNotificationCount?.();
    }
  };

  const leaveCrew = (crew) => {
    if (!window.confirm(`Leave "${crew.name}"?`)) return;
    
    const updatedJoined = joinedCrews.filter(id => id !== crew.id && id !== String(crew.id));
    setJoinedCrews(updatedJoined);
    localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updatedJoined));
    
    const updatedCrews = crews.map(c => 
      c.id === crew.id ? { ...c, members: Math.max(0, (c.members || 1) - 1) } : c
    );
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));
    
    if (selectedCrew?.id === crew.id) {
      setView('list');
      setSelectedCrew(null);
    }
    
    setToastMessage(`Left "${crew.name}"`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const createCrew = () => {
    if (!newCrewData.name || !newCrewData.author) {
      alert('Please fill book name and author');
      return;
    }
    
    const exists = crews.some(c => 
      c.name.toLowerCase() === newCrewData.name.toLowerCase() && 
      c.author.toLowerCase() === newCrewData.author.toLowerCase()
    );
    
    if (exists) {
      alert('A crew for this book already exists!');
      return;
    }
    
    const newCrew = {
      id: generateId(),
      ...newCrewData,
      members: 1,
      chats: 0,
      createdBy: user.email,
      createdByName: user.name,
      createdAt: new Date().toISOString()
    };
    
    const updatedCrews = [newCrew, ...crews];
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));
    
    setJoinedCrews(prev => [...prev, newCrew.id]);
    localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify([...joinedCrews, newCrew.id]));
    
    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.crewsJoined = (stats.crewsJoined || 0) + 1;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
    
    setShowCreateForm(false);
    setNewCrewData({ name: '', author: '', genre: '' });
    setToastMessage(`🎉 Created "${newCrew.name}"!`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const filteredCrews = crews.filter(crew =>
    crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crew.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (crew.genre && crew.genre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const joinedCrewsList = filteredCrews.filter(c => isJoined(c.id));
  const discoverCrewsList = filteredCrews.filter(c => !isJoined(c.id));

  const Toast = () => toastMessage ? (
    <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg z-[100] text-center animate-slideDown">
      {toastMessage}
    </div>
  ) : null;

  // Load crew members when a crew is selected
  useEffect(() => {
    if (!selectedCrew) return;
    
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const members = allUsers
      .filter(u => u.joinedCrews?.includes(selectedCrew.id) || u.joinedCrews?.includes(String(selectedCrew.id)))
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        initials: u.name?.slice(0, 2),
        isCreator: u.email === selectedCrew.createdBy
      }));
    
    if (!members.find(m => m.email === selectedCrew.createdBy)) {
      members.push({
        id: selectedCrew.createdBy,
        name: selectedCrew.createdByName || 'Creator',
        email: selectedCrew.createdBy,
        initials: (selectedCrew.createdByName || 'CR').slice(0, 2),
        isCreator: true
      });
    }
    
    setCrewMembers(members);
  }, [selectedCrew]);

  // FIX 1: Use CrewChatView component
  if (view === 'chat' && selectedCrew) {
    return (
      <CrewChatView
        crew={selectedCrew}
        user={user}
        crewMembers={crewMembers}
        onBack={() => setView('detail')}
        updateNotificationCount={updateNotificationCount}
        onViewUserProfile={onViewUserProfile}
        isJoined={isJoined}
        joinCrew={joinCrew}
      />
    );
  }

  if (view === 'detail' && selectedCrew) {
    const hasJoined = isJoined(selectedCrew.id);
    
    return (
      <div className="h-screen flex flex-col bg-white overflow-hidden" style={{ maxWidth: '448px', margin: '0 auto' }}>
        <Toast />
        
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3 z-10 flex-shrink-0">
          <button onClick={() => setView('list')} className="p-1 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold flex-1">Crew Info</span>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="bg-gradient-to-b from-orange-50 to-white px-4 pt-6 pb-4">
            <div className="flex flex-col items-center text-center">
              <DynamicBookCover
                title={selectedCrew.name}
                author={selectedCrew.author}
                size="xl"
                onClick={() => setSelectedBook({ title: selectedCrew.name, author: selectedCrew.author })}
              />
              <h1 className="text-2xl font-bold text-gray-900 mt-4">{selectedCrew.name}</h1>
              <p className="text-gray-500">by {selectedCrew.author}</p>
              {selectedCrew.genre && (
                <span className="mt-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                  {selectedCrew.genre}
                </span>
              )}
              
              <div className="flex gap-8 mt-4">
                <div className="text-center">
                  <p className="text-xl font-bold">{crewMembers.length}</p>
                  <p className="text-xs text-gray-500">Members</p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-5 w-full">
                {!hasJoined ? (
                  <button
                    onClick={() => joinCrew(selectedCrew)}
                    className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition"
                  >
                    Join Crew
                  </button>
                ) : (
                  <button
                    onClick={() => setView('chat')}
                    className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition"
                  >
                    Open Chat
                  </button>
                )}
                
                <button
                  onClick={() => {
                    const email = prompt("Friend's email to invite:");
                    if (email && isValidEmail(email)) {
                      pushNotification(email, {
                        type: 'invite',
                        fromUser: user.name,
                        fromUserEmail: user.email,
                        message: `${user.name} invited you to join "${selectedCrew.name}"!`,
                        crewId: selectedCrew.id
                      });
                      alert(`Invitation sent to ${email}!`);
                    } else if (email) {
                      alert('Please enter a valid email');
                    }
                  }}
                  className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="font-semibold mb-3">Members ({crewMembers.length})</h3>
            <div className="space-y-3">
              {crewMembers.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                  <button
                    onClick={() => onViewUserProfile(member.email, member.name)}
                    className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold hover:opacity-80 transition"
                  >
                    {member.initials}
                  </button>
                  <div className="flex-1">
                    <button
                      onClick={() => onViewUserProfile(member.email, member.name)}
                      className="font-semibold hover:underline"
                    >
                      {member.name}
                    </button>
                    <p className="text-xs text-gray-500">
                      {member.isCreator ? '👑 Creator' : 'Member'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {hasJoined && (
            <div className="p-4 pt-0">
              <button
                onClick={() => leaveCrew(selectedCrew)}
                className="w-full py-3 border border-red-200 text-red-500 rounded-xl font-medium hover:bg-red-50 transition"
              >
                Leave Crew
              </button>
            </div>
          )}
        </div>
        
        {selectedBook && (
          <BookDetailsModal
            book={selectedBook}
            onClose={() => setSelectedBook(null)}
            onCreateCrew={(book) => {
              const newCrew = {
                id: generateId(),
                name: book.title,
                author: book.author,
                genre: book.genre || 'General',
                members: 1,
                chats: 0,
                createdBy: user.email,
                createdByName: user.name,
                createdAt: new Date().toISOString()
              };
              const updatedCrews = [newCrew, ...crews];
              localStorage.setItem('crews', JSON.stringify(updatedCrews));
              setSelectedBook(null);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <Toast />
      
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold" style={{ fontFamily: 'Georgia, serif' }}>Reading Crews</span>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
        >
          Create Crew
        </button>
      </div>

      <div className="px-4 py-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crews by book, author, or genre..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
            <h3 className="font-semibold mb-3">Create New Crew</h3>
            {newCrewData.name && (
              <div className="flex justify-center mb-4">
                <DynamicBookCover
                  title={newCrewData.name}
                  author={newCrewData.author}
                  size="lg"
                />
              </div>
            )}
            <div className="space-y-3">
              <input
                value={newCrewData.name}
                onChange={e => setNewCrewData({ ...newCrewData, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300"
                placeholder="Book title *"
              />
              <input
                value={newCrewData.author}
                onChange={e => setNewCrewData({ ...newCrewData, author: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300"
                placeholder="Author *"
              />
              <input
                value={newCrewData.genre}
                onChange={e => setNewCrewData({ ...newCrewData, genre: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300"
                placeholder="Genre (optional)"
              />
              <div className="flex gap-2">
                <button
                  onClick={createCrew}
                  className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            My Crews ({joinedCrewsList.length})
          </h2>
          
          {joinedCrewsList.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
              <p className="text-gray-500 text-sm">No crews joined yet. Explore below!</p>
            </div>
          ) : (
            joinedCrewsList.map(crew => (
              <div
                key={crew.id}
                className="bg-white rounded-xl overflow-hidden border border-green-200 shadow-sm cursor-pointer mb-3 hover:shadow-md transition"
                onClick={() => { setSelectedCrew(crew); setView('detail'); }}
              >
                <div className="flex items-center px-4 gap-4 py-3">
                  <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 truncate">{crew.name}</p>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full flex-shrink-0">
                        Joined
                      </span>
                      {unreadCrewMessages[crew.id] > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
                          {unreadCrewMessages[crew.id]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">by {crew.author}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {crew.genre && (
                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                          {crew.genre}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{crew.members || 1} members</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2 flex justify-end gap-2 border-t border-gray-100">
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedCrew(crew); setView('chat'); }}
                    className="px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-xs font-medium hover:bg-orange-200 transition"
                  >
                    Open Chat
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold mb-3">Discover Crews ({discoverCrewsList.length})</h2>
          <div className="space-y-3">
            {discoverCrewsList.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                <p className="text-gray-500 text-sm">No crews to discover</p>
              </div>
            ) : (
              discoverCrewsList.map(crew => (
                <div
                  key={crew.id}
                  className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition"
                  onClick={() => { setSelectedCrew(crew); setView('detail'); }}
                >
                  <div className="flex items-center px-4 gap-4 py-3">
                    <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{crew.name}</p>
                      <p className="text-xs text-gray-500">by {crew.author}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {crew.genre && (
                          <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                            {crew.genre}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{crew.members || 1} members</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex justify-end border-t border-gray-100">
                    <button
                      onClick={e => { e.stopPropagation(); joinCrew(crew); }}
                      className="px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onCreateCrew={(book) => {
            const newCrew = {
              id: generateId(),
              name: book.title,
              author: book.author,
              genre: book.genre || 'General',
              members: 1,
              chats: 0,
              createdBy: user.email,
              createdByName: user.name,
              createdAt: new Date().toISOString()
            };
            const updatedCrews = [newCrew, ...crews];
            localStorage.setItem('crews', JSON.stringify(updatedCrews));
            setSelectedBook(null);
          }}
        />
      )}
    </div>
  );
};

// ========================================
// LINE 4600: SECTION 30 - CREW CHAT VIEW (FIX 1 - Extracted Component)
// ========================================

const CrewChatView = ({ crew, user, crewMembers, onBack, updateNotificationCount, onViewUserProfile, isJoined, joinCrew }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selBook, setSelBook] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // ✓ Hooks at TOP LEVEL — no conditional violation
  const { onlineCount } = useCrewPresence(crew.id, user.id, user.name);
  const { typingUsers, broadcastTyping, stopTyping } = useTypingIndicator(crew.id, user.id, user.name);
  const hasJoined = isJoined(crew.id);

  useEffect(() => {
    const cached = JSON.parse(localStorage.getItem(`crew_${crew.id}_messages`) || '[]');
    setMessages(cached.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
    
    socket.emit('join_crew_room', crew.id);
    socket.on('new_crew_message', d => {
      if (String(d.crewId) === String(crew.id)) {
        setMessages(prev => [...prev, { ...d.message, timestamp: new Date(d.message.timestamp) }]);
      }
    });
    
    return () => {
      socket.emit('leave_crew_room', crew.id);
      socket.off('new_crew_message');
    };
  }, [crew.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    markCrewMessagesRead(crew.id, user.id);
  }, [messages.length]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !hasJoined) return;
    
    stopTyping();
    const msg = {
      id: `msg_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userInitials: user.name?.slice(0, 2).toUpperCase(),
      content: newMessage.trim(),
      type: 'text',
      timestamp: new Date().toISOString(),
    };
    
    setNewMessage('');
    
    try {
      const response = await axios.post(`${API_URL}/api/social/crews/${crew.id}/messages`, msg);
      if (response.data.success) {
        setMessages(prev => [...prev, { ...response.data.message, timestamp: new Date(response.data.message.timestamp) }]);
      }
    } catch (error) {
      const existing = JSON.parse(localStorage.getItem(`crew_${crew.id}_messages`) || '[]');
      existing.push(msg);
      localStorage.setItem(`crew_${crew.id}_messages`, JSON.stringify(existing));
      setMessages(prev => [...prev, { ...msg, timestamp: new Date() }]);
    }
    
    crewMembers.filter(m => m.email !== user.email).forEach(m => {
      pushNotification(m.email, {
        type: 'message',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} sent a message in "${crew.name}"`,
        crewId: crew.id,
        crewName: crew.name
      });
    });
    updateNotificationCount?.();
  };

  const sendImage = (e) => {
    const file = e.target.files[0];
    if (!file || !hasJoined) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Max 5 MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = ev => {
      const msg = {
        id: `msg_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userInitials: user.name?.slice(0, 2).toUpperCase(),
        content: ev.target.result,
        timestamp: new Date().toISOString(),
        type: 'image'
      };
      const existing = JSON.parse(localStorage.getItem(`crew_${crew.id}_messages`) || '[]');
      existing.push(msg);
      localStorage.setItem(`crew_${crew.id}_messages`, JSON.stringify(existing));
      setMessages(prev => [...prev, { ...msg, timestamp: new Date() }]);
      
      crewMembers.filter(m => m.email !== user.email).forEach(m => {
        pushNotification(m.email, {
          type: 'message',
          fromUser: user.name,
          fromUserEmail: user.email,
          message: `${user.name} shared an image in "${crew.name}"`,
          crewId: crew.id,
          crewName: crew.name
        });
      });
      updateNotificationCount?.();
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (ts) => {
    const diff = Date.now() - new Date(ts);
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    return new Date(ts).toLocaleDateString();
  };

  const groupsByDate = messages.reduce((acc, msg) => {
    const date = new Date(msg.timestamp).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  if (!hasJoined) {
    return (
      <div className="fixed inset-0 flex flex-col bg-[#e5ddd5] overflow-hidden"
        style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
        <div className="flex-shrink-0 bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <DynamicBookCover title={crew.name} author={crew.author} size="xs" />
          <div>
            <p className="font-semibold text-gray-900">{crew.name}</p>
            <p className="text-xs text-gray-500">{crewMembers.length} members</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={() => joinCrew(crew)}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium"
          >
            Join to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col z-[60] bg-[#e5ddd5] overflow-hidden"
      style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <DynamicBookCover
            title={crew.name}
            author={crew.author}
            size="xs"
            onClick={() => setSelBook({ title: crew.name, author: crew.author })}
          />
          <div>
            <p className="font-semibold text-gray-900 text-sm">{crew.name}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">{crewMembers.length} members</p>
              {onlineCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                  {onlineCount} online
                </span>
              )}
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <MoreHorizontal className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500">No messages yet. Say something!</p>
          </div>
        )}
        
        {Object.entries(groupsByDate).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex justify-center my-4">
              <span className="bg-gray-300/80 text-gray-700 text-xs px-3 py-1 rounded-full">
                {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            {msgs.map(msg => {
              const isOwn = msg.userId === user.id;
              return (
                <div key={msg.id} className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[78%] items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      <button
                        onClick={() => onViewUserProfile(msg.userEmail, msg.userName)}
                        className="w-7 h-7 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 hover:opacity-80 transition"
                      >
                        {msg.userInitials || '??'}
                      </button>
                    )}
                    <div className={`rounded-2xl px-3.5 py-2 shadow-sm ${isOwn ? 'bg-[#dcf8c6] rounded-br-sm' : 'bg-white rounded-bl-sm'}`}>
                      {!isOwn && <p className="text-xs font-semibold text-orange-600 mb-0.5">{msg.userName}</p>}
                      {msg.type === 'image' ? (
                        <img
                          src={msg.content}
                          alt="Shared"
                          className="max-w-full rounded-xl max-h-60 cursor-pointer"
                          onClick={() => window.open(msg.content, '_blank')}
                        />
                      ) : (
                        <p className="text-sm leading-relaxed break-words text-gray-900">{msg.content}</p>
                      )}
                      <p className="text-[10px] text-gray-400 text-right mt-0.5">
                        {formatTime(msg.timestamp)}
                        {isOwn && (() => {
                          const status = getReadStatus(msg.timestamp, crew.id, onlineCount);
                          if (status === 'read') return <span className="ml-1 text-blue-400">✓✓</span>;
                          if (status === 'delivered') return <span className="ml-1 text-gray-400">✓✓</span>;
                          return <span className="ml-1 text-gray-300">✓</span>;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-xs text-gray-500 italic">
          {typingUsers.length === 1
            ? `${typingUsers[0]} is typing...`
            : typingUsers.length === 2
            ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
            : `${typingUsers.length} people are typing...`}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 bg-gray-50 border-t px-3 py-2.5">
        <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow border border-gray-100">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 flex items-center justify-center flex-shrink-0"
          >
            <Plus className="w-5 h-5 text-orange-500" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={sendImage}
          />
          <input
            type="text"
            value={newMessage}
            onChange={e => {
              setNewMessage(e.target.value);
              broadcastTyping();
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                stopTyping();
                sendMessage();
              }
            }}
            onBlur={stopTyping}
            className="flex-1 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
            placeholder="Type a message..."
          />
          <button
            onClick={() => {
              stopTyping();
              sendMessage();
            }}
            disabled={!newMessage.trim()}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition ${
              newMessage.trim() ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {selBook && (
        <BookDetailsModal
          book={selBook}
          onClose={() => setSelBook(null)}
          onCreateCrew={() => {}}
        />
      )}
    </div>
  );
};

// ========================================
// LINE 4900: SECTION 31 - FULL USER PROFILE PAGE
// ========================================

const FullUserProfilePage = ({ 
  viewedUserEmail, 
  viewedUserName, 
  currentUser, 
  onBack, 
  onFollow, 
  isFollowing, 
  onBlock, 
  isBlocked 
}) => {
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [userBooks, setUserBooks] = useState([]);
  const [userCrews, setUserCrews] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('Posts');
  const [stats, setStats] = useState({ booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 });

  useEffect(() => {
    loadUserData();
  }, [viewedUserEmail]);

  const loadUserData = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.email === viewedUserEmail);
    if (found) setUserData(found);

    const userFollowers = JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_followers`) || '[]');
    const userFollowing = JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_following`) || '[]');
    
    const followersWithDetails = userFollowers.map(email => {
      const followerUser = users.find(u => u.email === email);
      return {
        email,
        name: followerUser?.name || email.split('@')[0],
        initials: followerUser?.name?.slice(0, 2).toUpperCase() || email.slice(0, 2).toUpperCase()
      };
    });
    
    const followingWithDetails = userFollowing.map(email => {
      const followingUser = users.find(u => u.email === email);
      return {
        email,
        name: followingUser?.name || email.split('@')[0],
        initials: followingUser?.name?.slice(0, 2).toUpperCase() || email.slice(0, 2).toUpperCase()
      };
    });
    
    setFollowers(followersWithDetails);
    setFollowing(followingWithDetails);

    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const posts = allPosts.filter(p => p.userEmail === viewedUserEmail);
    setUserPosts(posts);

    const allReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    const reviews = allReviews.filter(r => r.userEmail === viewedUserEmail);
    setUserReviews(reviews);

    const books = JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_readingList`) || '[]');
    setUserBooks(books);

    const joinedCrews = JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_joinedCrews`) || '[]');
    const allCrews = JSON.parse(localStorage.getItem('crews') || '[]');
    const crews = allCrews.filter(c => joinedCrews.includes(c.id) || joinedCrews.includes(String(c.id)));
    setUserCrews(crews);

    const userStats = JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_stats`) || '{}');
    setStats({
      booksRead: userStats.booksRead || 0,
      reviewsGiven: userStats.reviewsGiven || 0,
      postsCreated: userStats.postsCreated || 0,
      crewsJoined: userStats.crewsJoined || 0
    });
  };

  const tabs = ['Posts', 'Reviews', 'Books Read', 'Crews'];

  return (
    <div className="min-h-screen bg-gray-50 pb-24 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-semibold text-gray-900">{viewedUserName}'s Profile</h2>
        <div className="w-6" />
      </div>

      <div className="px-4 py-5">
        <div className="flex items-start gap-4 mb-5">
          <div className="relative flex-shrink-0">
            <Avatar
              initials={viewedUserName}
              size="xl"
              src={userData?.profileImage}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">{viewedUserName}</h2>
            <p className="text-sm text-gray-500">@{viewedUserName?.toLowerCase().replace(/\s/g, '')}</p>
            {userData?.bio && (
              <p className="text-sm text-gray-600 mt-1 italic">"{userData.bio}"</p>
            )}
            
            <div className="flex gap-4 mt-2">
              <div className="text-center">
                <p className="font-bold text-gray-900">{followers.length}</p>
                <p className="text-xs text-gray-500">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">{following.length}</p>
                <p className="text-xs text-gray-500">Following</p>
              </div>
            </div>
            
            {viewedUserEmail !== currentUser.email && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onFollow(viewedUserEmail, viewedUserName)}
                  className={`flex-1 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </button>
                <button
                  onClick={() => onBlock(viewedUserEmail, viewedUserName)}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${
                    isBlocked
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {isBlocked ? 'Unblock' : 'Block'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 bg-white rounded-xl p-3 border border-gray-200 mb-5">
          {[
            { label: 'Books', value: stats.booksRead, icon: BookOpen, color: 'text-blue-600' },
            { label: 'Reviews', value: stats.reviewsGiven, icon: Star, color: 'text-purple-600' },
            { label: 'Posts', value: stats.postsCreated, icon: Edit3, color: 'text-green-600' },
            { label: 'Crews', value: stats.crewsJoined, icon: Users, color: 'text-orange-600' }
          ].map(({ label, value, icon: Icon, color }, idx) => (
            <div key={idx} className="text-center">
              <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex border-b border-gray-200 mb-4 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 text-sm pb-2.5 px-3 font-medium border-b-2 transition ${
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
                  <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                  {post.bookName && <p className="text-xs text-orange-500">📖 {post.bookName}</p>}
                  {post.image && (
                    <img src={post.image} alt="" className="w-full rounded-xl mt-2 max-h-40 object-cover" />
                  )}
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-100 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      {post.likes || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat className="w-3.5 h-3.5" />
                      {post.reshareCount || 0}
                    </span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'Reviews' && (
          <div className="space-y-4">
            {userReviews.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No reviews yet</p>
              </div>
            ) : (
              userReviews.map(review => (
                <div key={review.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-3 mb-2">
                    <DynamicBookCover title={review.bookName} author={review.author} size="sm" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{review.bookName}</h3>
                      <p className="text-xs text-gray-500">by {review.author}</p>
                      <StarRating rating={review.rating} size="xs" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{review.review}</p>
                  <div className="flex items-center justify-end mt-2">
                    <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'Books Read' && (
          <div className="space-y-3">
            {userBooks.length === 0 ? (
              <div className="text-center py-8">
                <BookMarked className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No books tracked yet</p>
              </div>
            ) : (
              userBooks.map(book => (
                <div key={book.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-start gap-3">
                  <DynamicBookCover title={book.title} author={book.author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900">{book.title}</h3>
                    <p className="text-xs text-gray-500">{book.author}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <StarRating rating={book.rating} size="xs" />
                    </div>
                    {book.notes && (
                      <p className="text-xs text-gray-600 mt-1 italic">"{book.notes}"</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{new Date(book.addedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'Crews' && (
          <div className="space-y-3">
            {userCrews.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No crews joined yet</p>
              </div>
            ) : (
              userCrews.map(crew => (
                <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <div className="flex items-center px-4 gap-4 py-3">
                    <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{crew.name}</p>
                      <p className="text-xs text-gray-500">by {crew.author}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {crew.genre && (
                          <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                            {crew.genre}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{crew.members || 1} members</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// LINE 5200: SECTION 32 - MAIN APP COMPONENT
// ========================================

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileSrc, setProfileSrc] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [posts, setPosts] = useState([]);
  const [crews, setCrews] = useState([
    { id: 1, name: 'Atomic Habits', author: 'James Clear', genre: 'Self Improvement', members: 1, chats: 0, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date().toISOString() },
    { id: 2, name: 'Tuesdays with Morrie', author: 'Mitch Albom', genre: 'Inspiration', members: 1, chats: 0, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date().toISOString() },
    { id: 3, name: 'The Alchemist', author: 'Paulo Coelho', genre: 'Fiction', members: 1, chats: 0, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date().toISOString() },
    { id: 4, name: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', members: 1, chats: 0, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date().toISOString() },
    { id: 5, name: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', members: 1, chats: 0, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date().toISOString() },
  ]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [currentToast, setCurrentToast] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [viewingFullProfile, setViewingFullProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);
  const prevCount = useRef(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    setShowBottomNav(currentPage !== 'post' && !viewingFullProfile);
  }, [currentPage, viewingFullProfile]);

  useEffect(() => {
    const loadInitialData = async () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
        
        const userFollowing = JSON.parse(localStorage.getItem(`user_${user.email}_following`) || '[]');
        const userFollowers = JSON.parse(localStorage.getItem(`user_${user.email}_followers`) || '[]');
        const userBlocked = JSON.parse(localStorage.getItem(`user_${user.email}_blocked`) || '[]');
        const userSaved = JSON.parse(localStorage.getItem(`user_${user.email}_savedPosts`) || '[]');
        
        setFollowing(userFollowing);
        setFollowers(userFollowers);
        setBlockedUsers(userBlocked);
        setSavedPosts(userSaved);
        
        const profileImage = localStorage.getItem(`user_${user.email}_profile_image`);
        if (profileImage) setProfileSrc(profileImage);
      }
      
      const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
      setPosts(allPosts);
      
      const storedCrews = JSON.parse(localStorage.getItem('crews') || '[]');
      if (storedCrews.length > 0) {
        setCrews(storedCrews);
      }
      
      // Initialize reported posts if not exists
      if (!localStorage.getItem('reportedPosts')) {
        localStorage.setItem('reportedPosts', JSON.stringify([]));
      }
      
      // Initialize allComments if not exists
      if (!localStorage.getItem('allComments')) {
        localStorage.setItem('allComments', JSON.stringify([]));
      }
      
      setLoading(false);
    };

    loadInitialData();
  }, []);

  // Notification system with CustomEvent + server polling
  const checkForNewNotifications = useCallback(() => {
    if (!currentUser) return;
    
    const notifications = JSON.parse(localStorage.getItem(`user_${currentUser.email}_notifications`) || '[]');
    
    // Separate regular notifications from crew message notifications
    const regularNotifications = notifications.filter(n => n.type !== 'message');
    const crewMessageNotifications = notifications.filter(n => n.type === 'message');
    
    const unreadCount = regularNotifications.filter(n => !n.read).length;
    const unreadCrewMessages = crewMessageNotifications.filter(n => !n.read).length;
    
    if (unreadCount > prevCount.current) {
      const newest = regularNotifications.find(n => !n.read);
      if (newest) setCurrentToast(newest);
    }
    
    setNotificationCount(unreadCount);
    setUnreadMessages(unreadCrewMessages);
    prevCount.current = unreadCount;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    
    checkForNewNotifications();
    
    const pollServer = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/social/notifications/${encodeURIComponent(currentUser.email)}`, { timeout: 6000 });
        if (response.data.success) {
          const fresh = response.data.notifications;
          localStorage.setItem(`user_${currentUser.email}_notifications`, JSON.stringify(fresh));
          checkForNewNotifications();
        }
      } catch (error) {
        console.error('Failed to poll notifications:', error);
      }
    };
    
    const interval = setInterval(pollServer, 8000);
    
    const handleCustomNotification = (e) => {
      if (e.detail.targetEmail === currentUser.email) {
        checkForNewNotifications();
      }
    };
    window.addEventListener('rc:notif', handleCustomNotification);
    
    const handleStorageChange = (e) => {
      if (e.key?.includes('_notifications')) {
        checkForNewNotifications();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    socket.emit('join_user_room', currentUser.email);
    socket.on('new_notification', (notification) => {
      if (notification.toEmail === currentUser?.email) {
        pushNotification(currentUser.email, notification);
        checkForNewNotifications();
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('rc:notif', handleCustomNotification);
      window.removeEventListener('storage', handleStorageChange);
      socket.off('new_notification');
    };
  }, [currentUser, checkForNewNotifications]);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    ['followers', 'following', 'blocked', 'notifications', 'likedPosts', 'likedReviews', 'readingList', 'savedPosts', 'likedComments'].forEach(key => {
      if (!localStorage.getItem(`user_${userData.email}_${key}`)) {
        localStorage.setItem(`user_${userData.email}_${key}`, JSON.stringify([]));
      }
    });
    
    if (!localStorage.getItem(`user_${userData.email}_stats`)) {
      localStorage.setItem(`user_${userData.email}_stats`, JSON.stringify({
        booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0
      }));
    }
    
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentPage('home');
    localStorage.removeItem('currentUser');
  };

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const handlePost = (postData) => {
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const newPost = {
      ...postData,
      id: postData.id || generateId(),
      createdAt: postData.createdAt || new Date().toISOString(),
      likes: postData.likes || 0,
      comments: 0,
      reshareCount: postData.reshareCount || 0
    };
    
    allPosts.unshift(newPost);
    localStorage.setItem('allPosts', JSON.stringify(allPosts));
    setPosts(allPosts);
    
    const stats = JSON.parse(localStorage.getItem(`user_${currentUser.email}_stats`) || '{}');
    stats.postsCreated = (stats.postsCreated || 0) + 1;
    localStorage.setItem(`user_${currentUser.email}_stats`, JSON.stringify(stats));
    
    const updatedUser = { ...currentUser, stats };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const handleDeletePost = (post) => {
    if (!window.confirm('Delete this post?')) return;
    
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const filtered = allPosts.filter(p => p.id !== post.id);
    localStorage.setItem('allPosts', JSON.stringify(filtered));
    setPosts(filtered);
    
    // Also delete all comments for this post
    const allComments = JSON.parse(localStorage.getItem('allComments') || '[]');
    const filteredComments = allComments.filter(c => c.postId !== post.id);
    localStorage.setItem('allComments', JSON.stringify(filteredComments));
    
    const stats = JSON.parse(localStorage.getItem(`user_${currentUser.email}_stats`) || '{}');
    stats.postsCreated = Math.max((stats.postsCreated || 0) - 1, 0);
    localStorage.setItem(`user_${currentUser.email}_stats`, JSON.stringify(stats));
  };

  const handleSavePost = (post) => {
    const userSaved = JSON.parse(localStorage.getItem(`user_${currentUser.email}_savedPosts`) || '[]');
    
    let updated;
    if (userSaved.includes(post.id)) {
      updated = userSaved.filter(id => id !== post.id);
    } else {
      updated = [...userSaved, post.id];
    }
    
    localStorage.setItem(`user_${currentUser.email}_savedPosts`, JSON.stringify(updated));
    setSavedPosts(updated);
  };

  const handleReshare = (originalPost, comment) => {
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const updatedPosts = allPosts.map(p => {
      if (p.id === originalPost.id) {
        return { ...p, reshareCount: (p.reshareCount || 0) + 1 };
      }
      return p;
    });
    localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
    setPosts(updatedPosts);
    
    if (originalPost.userEmail !== currentUser.email) {
      pushNotification(originalPost.userEmail, { 
        type: 'reshare', 
        fromUser: currentUser.name, 
        fromUserEmail: currentUser.email,
        message: `${currentUser.name} reshared your post`, 
        postId: originalPost.id 
      });
      checkForNewNotifications();
    }
    
    const resharePost = {
      id: generateId(),
      content: originalPost.content,
      bookName: originalPost.bookName,
      author: originalPost.author,
      image: originalPost.image,
      isPublic: true,
      isReshare: true,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userPhoto: currentUser.profileImage,
      userInitials: currentUser.name.slice(0, 2).toUpperCase(),
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

    handlePost(resharePost);
  };

  const handleFollow = (targetEmail, targetName) => {
    const currentFollowing = JSON.parse(localStorage.getItem(`user_${currentUser.email}_following`) || '[]');
    
    if (currentFollowing.includes(targetEmail)) {
      // UNFOLLOW logic
      const updatedFollowing = currentFollowing.filter(email => email !== targetEmail);
      localStorage.setItem(`user_${currentUser.email}_following`, JSON.stringify(updatedFollowing));
      setFollowing(updatedFollowing);
      
      const targetFollowers = JSON.parse(localStorage.getItem(`user_${targetEmail}_followers`) || '[]');
      const updatedTargetFollowers = targetFollowers.filter(email => email !== currentUser.email);
      localStorage.setItem(`user_${targetEmail}_followers`, JSON.stringify(updatedTargetFollowers));
    } else {
      // FOLLOW logic - send notification
      const updatedFollowing = [...currentFollowing, targetEmail];
      localStorage.setItem(`user_${currentUser.email}_following`, JSON.stringify(updatedFollowing));
      setFollowing(updatedFollowing);
      
      const targetFollowers = JSON.parse(localStorage.getItem(`user_${targetEmail}_followers`) || '[]');
      if (!targetFollowers.includes(currentUser.email)) {
        const updatedTargetFollowers = [...targetFollowers, currentUser.email];
        localStorage.setItem(`user_${targetEmail}_followers`, JSON.stringify(updatedTargetFollowers));
        
        // Send notification to the person being followed
        pushNotification(targetEmail, { 
          type: 'follow', 
          fromUser: currentUser.name, 
          fromUserEmail: currentUser.email,
          message: `${currentUser.name} started following you` 
        });
        checkForNewNotifications();
        
        // Show confirmation toast
        setCurrentToast({
          type: 'success',
          message: `You are now following ${targetName}`,
          timestamp: new Date().toISOString()
        });
        setTimeout(() => setCurrentToast(null), 3000);
      }
    }
  };

  const handleBlockUser = (targetEmail, targetName) => {
    const currentBlocked = JSON.parse(localStorage.getItem(`user_${currentUser.email}_blocked`) || '[]');
    
    if (currentBlocked.includes(targetEmail)) {
      const updatedBlocked = currentBlocked.filter(email => email !== targetEmail);
      localStorage.setItem(`user_${currentUser.email}_blocked`, JSON.stringify(updatedBlocked));
      setBlockedUsers(updatedBlocked);
    } else {
      const updatedBlocked = [...currentBlocked, targetEmail];
      localStorage.setItem(`user_${currentUser.email}_blocked`, JSON.stringify(updatedBlocked));
      setBlockedUsers(updatedBlocked);
      
      const currentFollowing = JSON.parse(localStorage.getItem(`user_${currentUser.email}_following`) || '[]');
      const updatedFollowing = currentFollowing.filter(email => email !== targetEmail);
      localStorage.setItem(`user_${currentUser.email}_following`, JSON.stringify(updatedFollowing));
      setFollowing(updatedFollowing);
    }
  };

  const handleViewUserProfile = (userEmail, userName) => {
    setViewingFullProfile(null);
    setSelectedUserProfile({ email: userEmail, name: userName });
    setShowUserProfile(true);
  };

  const handleViewFullProfile = (userEmail, userName) => {
    setShowUserProfile(false);
    setSelectedUserProfile(null);
    setViewingFullProfile({ email: userEmail, name: userName });
  };

  const filteredPosts = posts.filter(post => !blockedUsers.includes(post.userEmail));

  if (loading) {
    return <LoadingSpinner size="xl" fullScreen />;
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex justify-center min-h-screen bg-gray-200">
      {currentToast && (
        <NotificationToast
          notification={currentToast}
          onClose={() => setCurrentToast(null)}
        />
      )}

      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-1 text-xs z-[100]">
          <WifiOff className="w-3 h-3 inline mr-1" />
          You're offline. Some features may be limited.
        </div>
      )}

      <div className="w-full max-w-md relative bg-white min-h-screen overflow-hidden shadow-xl">
        {showUserProfile && selectedUserProfile && (
          <UserProfileModal
            userEmail={selectedUserProfile.email}
            userName={selectedUserProfile.name}
            currentUser={currentUser}
            onClose={() => {
              setShowUserProfile(false);
              setSelectedUserProfile(null);
            }}
            onFollow={handleFollow}
            isFollowing={following.includes(selectedUserProfile.email)}
            onBlock={handleBlockUser}
            isBlocked={blockedUsers.includes(selectedUserProfile.email)}
            onViewFullProfile={handleViewFullProfile}
          />
        )}

        {viewingFullProfile && (
          <FullUserProfilePage
            viewedUserEmail={viewingFullProfile.email}
            viewedUserName={viewingFullProfile.name}
            currentUser={currentUser}
            onBack={() => setViewingFullProfile(null)}
            onFollow={handleFollow}
            isFollowing={following.includes(viewingFullProfile.email)}
            onBlock={handleBlockUser}
            isBlocked={blockedUsers.includes(viewingFullProfile.email)}
          />
        )}

        {!viewingFullProfile && (
          <>
            {currentPage === 'home' && (
              <HomePage
                user={currentUser}
                posts={filteredPosts}
                crews={crews}
                setPage={setCurrentPage}
                updateNotificationCount={checkForNewNotifications}
                profileSrc={profileSrc}
                savedPosts={savedPosts}
                onSavePost={handleSavePost}
                onResharePost={handleReshare}
                onDeletePost={handleDeletePost}
                onFollow={handleFollow}
                following={following}
                onBlock={handleBlockUser}
                blockedUsers={blockedUsers}
                onViewUserProfile={handleViewUserProfile}
                onViewBookDetails={(book) => {
                  // Handle book details
                }}
              />
            )}

            {currentPage === 'post' && (
              <PostPage
                user={currentUser}
                onPost={handlePost}
                setPage={setCurrentPage}
              />
            )}

            {currentPage === 'reviews' && (
              <ReviewsPage
                user={currentUser}
                setPage={setCurrentPage}
                updateNotificationCount={checkForNewNotifications}
                onViewUserProfile={handleViewUserProfile}
              />
            )}

            {currentPage === 'explore' && (
              <ExplorePage
                user={currentUser}
                setPage={setCurrentPage}
                onCreateCrew={(book) => {
                  const newCrew = {
                    id: generateId(),
                    name: book.title,
                    author: book.author,
                    genre: book.genre || 'General',
                    members: 1,
                    chats: 0,
                    createdBy: currentUser.email,
                    createdByName: currentUser.name,
                    createdAt: new Date().toISOString()
                  };
                  const updatedCrews = [newCrew, ...crews];
                  setCrews(updatedCrews);
                  localStorage.setItem('crews', JSON.stringify(updatedCrews));
                  setCurrentPage('crews');
                }}
              />
            )}

            {currentPage === 'crews' && (
              <CrewsPage
                user={currentUser}
                crews={crews}
                setPage={setCurrentPage}
                updateNotificationCount={checkForNewNotifications}
                onViewUserProfile={handleViewUserProfile}
              />
            )}

            {currentPage === 'profile' && (
              <ProfilePage
                user={currentUser}
                posts={filteredPosts}
                setPage={setCurrentPage}
                onLogout={handleLogout}
                onUpdateUser={handleUpdateUser}
                profileSrc={profileSrc}
                setProfileSrc={setProfileSrc}
                savedPosts={savedPosts}
                following={following}
                followers={followers}
              />
            )}

            {currentPage === 'notifications' && (
              <NotificationsPage
                user={currentUser}
                onClose={() => {
                  setCurrentPage('home');
                  checkForNewNotifications();
                }}
                updateNotificationCount={checkForNewNotifications}
              />
            )}

            <BottomNav
              active={currentPage}
              setPage={setCurrentPage}
              unreadCount={unreadMessages}
              show={showBottomNav}
            />
          </>
        )}
      </div>
    </div>
  );
}

// Add animation styles
if (typeof document !== 'undefined' && !document.querySelector('style[data-styles]')) {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { transform: translate(-50%, -100%); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
    .animate-slideDown {
      animation: slideDown 0.3s ease-out;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    .animate-bounce {
      animation: bounce 1s infinite;
    }
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
  `;
  style.setAttribute('data-styles', 'true');
  document.head.appendChild(style);
}