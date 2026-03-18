// App.jsx — ReadCrew Complete Production Build
// Features: MongoDB integration, Socket.io real-time, 10K user scale
// Bug Fixes: Posts persistence, Likes/Notifications, Comment depth, Lazy loading

import React, {
  useState, useEffect, useRef, useCallback, memo
} from 'react';
import {
  BookOpen, Search, Edit3, Users, User, Bell,
  Heart, MessageCircle, Bookmark, Share2, Star, Plus, ChevronRight,
  X, Send, ChevronLeft, LogOut, Camera, MoreHorizontal,
  Sparkles, Lock, Eye, EyeOff, UserPlus,
  Trash2, Edit, Target, ArrowLeft, TrendingUp,
  MessageSquare, Globe, ChevronDown,
  Mail, ExternalLink,
  Link2, AtSign,
  BookMarked, MapPin, Navigation, Map, Repeat,
  UserCheck, UserMinus, WifiOff,
  AlertCircle, CheckCircle, Info,
  Clock, Calendar, Phone, Navigation as NavIcon,
  Repeat as ReshareIcon, AtSign as MentionIcon,
  Home, Settings, Filter, ThumbsUp, ThumbsDown,
  Volume2, VolumeX, Play, Pause, Mic,
  Paperclip, Image as ImageIcon, Video, Camera as CameraIcon2,
  Download, Upload, RefreshCw, RotateCcw,
  Maximize2, Minimize2, SkipBack, SkipForward,
  Circle, Square, Triangle, Sun, Moon,
  Cloud, CloudRain, CloudSnow, CloudLightning,
  Wind, Droplets, Thermometer, Compass,
  Anchor, Ship, Plane, Train, Car, Bike,
  Bus, Truck, Rocket, Satellite,
  Briefcase, Building, Home as HomeIcon,
  Hospital, School, Store, Restaurant, Cafe, Hotel,
  Church, Mosque, Temple, Park, Museum, Library,
  Stadium, Theatre, Cinema, Music, Radio,
  Headphones, Speaker, Podcast,
  Tv, Monitor, Laptop, Tablet, Smartphone, Watch,
  AlarmClock, Timer, Stopwatch, Hourglass,
  CalendarDays, CalendarRange, CalendarCheck, CalendarX,
  CalendarPlus, CalendarMinus, CalendarHeart, CalendarSearch,
  BookCopy, BookCheck, BookX, BookHeart, BookUser,
  BookA, BookB, BookC, BookD, BookE, BookF, BookG,
  BookH, BookI, BookJ, BookK, BookL, BookM, BookN,
  BookO, BookP, BookQ, BookR, BookS, BookT, BookU,
  BookV, BookW, BookX as BookXIcon, BookY, BookZ
} from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

// ========================================
// CONFIGURATION
// ========================================
const API_URL = process.env.REACT_APP_API_URL || 'https://versal-book-app.onrender.com';
const socket = io(API_URL, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  autoConnect: true,
  withCredentials: true
});

// BroadcastChannel for cross-tab notifications
let _bc = null;
try {
  _bc = new BroadcastChannel('rc_notifications');
} catch (e) {
  // Silently fail if BroadcastChannel not supported
}

// ========================================
// UTILITY FUNCTIONS
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
    .replace(/'/g, '&#039;');
};

const extractMentions = (text) => {
  const mentions = text.match(/@(\w+)/g) || [];
  return mentions.map(m => m.substring(1));
};

const generateId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ========================================
// LOCALSTORAGE HELPERS (All use email keys)
// ========================================

const getLikedPostsKey = (email) => `user_${email}_likedPosts`;
const getLikedCommentsKey = (email) => `user_${email}_likedComments`;
const getSavedPostsKey = (email) => `user_${email}_savedPosts`;
const getFollowingKey = (email) => `user_${email}_following`;
const getFollowersKey = (email) => `user_${email}_followers`;
const getBlockedKey = (email) => `user_${email}_blocked`;
const getNotificationsKey = (email) => `user_${email}_notifications`;
const getStatsKey = (email) => `user_${email}_stats`;
const getJoinedCrewsKey = (email) => `user_${email}_joinedCrews`;
const getReadingListKey = (email) => `user_${email}_readingList`;
const getProfileImageKey = (email) => `user_${email}_profile_image`;

// ========================================
// NOTIFICATION STORAGE & BROADCAST
// ========================================

const storeNotification = (targetEmail, notification) => {
  if (!targetEmail) return;
  
  const fullNotif = {
    id: generateId(),
    ...notification,
    timestamp: new Date().toISOString(),
    read: false
  };
  
  const existing = JSON.parse(localStorage.getItem(getNotificationsKey(targetEmail)) || '[]');
  existing.unshift(fullNotif);
  if (existing.length > 150) existing.length = 150;
  localStorage.setItem(getNotificationsKey(targetEmail), JSON.stringify(existing));
  
  // Broadcast to same browser (other tabs)
  try {
    _bc?.postMessage({ targetEmail, notification: fullNotif });
  } catch (e) {}
  
  // Dispatch custom event for same tab
  window.dispatchEvent(new CustomEvent('rc:notification', { 
    detail: { targetEmail, notification: fullNotif } 
  }));
  
  return fullNotif;
};

// ========================================
// LOADING SPINNER
// ========================================
const LoadingSpinner = ({ size = 'md', color = 'orange', fullScreen = false }) => {
  const sizes = { 
    xs: 'w-4 h-4', 
    sm: 'w-6 h-6', 
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
// STAR RATING COMPONENT
// ========================================
const StarRating = ({ rating = 0, onChange, size = 'sm', readonly = false }) => {
  const sizeClass = size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${sizeClass} ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} 
            ${onChange && !readonly ? 'cursor-pointer hover:scale-110 transition' : ''}`}
          onClick={() => onChange?.(i)}
        />
      ))}
    </div>
  );
};

// ========================================
// AVATAR COMPONENT
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
  
  const hash = (initials || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradient = gradients[hash % gradients.length];
  
  return (
    <div className="relative shrink-0 cursor-pointer" onClick={onClick}>
      {src ? (
        <img 
          src={src} 
          alt={initials} 
          className={`${sizes[size]} rounded-full object-cover border-2 border-orange-200 hover:border-orange-400 transition`}
          onError={(e) => { e.target.src = ''; }}
        />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-semibold text-white shadow-md`}>
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
// NOTIFICATION TOAST
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
// DYNAMIC BOOK COVER
// ========================================
const DynamicBookCover = ({ title, author, size = 'md', onClick }) => {
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
  const containerClass = sizeMap[size] || sizeMap.md;

  useEffect(() => {
    if (!title) {
      setError(true);
      setLoading(false);
      return;
    }
    
    let isMounted = true;
    const fetchCover = async () => {
      const query = encodeURIComponent(author ? `${title} ${author}` : title);
      
      // Try Google Books API first
      try {
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&projection=lite`,
          { signal: AbortSignal.timeout(5000) }
        );
        
        if (res.ok && isMounted) {
          const data = await res.json();
          const links = data.items?.[0]?.volumeInfo?.imageLinks;
          if (links) {
            const raw = links.extraLarge || links.large || links.medium || links.thumbnail;
            if (raw) {
              const clean = raw.replace('http:', 'https:').replace('&edge=curl', '');
              setCoverUrl(clean);
              setLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        // Fall through to Open Library
      }

      // Try Open Library
      try {
        const res = await fetch(
          `https://openlibrary.org/search.json?q=${query}&limit=1`,
          { signal: AbortSignal.timeout(4000) }
        );
        
        if (res.ok && isMounted) {
          const data = await res.json();
          const book = data.docs?.[0];
          let cover = null;
          
          if (book?.cover_i) {
            cover = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
          } else if (book?.isbn?.length > 0) {
            cover = `https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-L.jpg`;
          } else if (book?.cover_edition_key) {
            cover = `https://covers.openlibrary.org/b/olid/${book.cover_edition_key}-L.jpg`;
          }
          
          if (cover) {
            setCoverUrl(cover);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        // Fall through to fallback
      }

      if (isMounted) {
        setError(true);
        setLoading(false);
      }
    };

    fetchCover();
    
    return () => {
      isMounted = false;
    };
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
      <div className={`${containerClass} bg-gray-200 rounded-xl flex items-center justify-center animate-pulse`} onClick={onClick}>
        <BookOpen className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  if (error || !coverUrl) {
    return (
      <div
        className={`${containerClass} rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg cursor-pointer hover:scale-105 transition-transform`}
        style={{ backgroundColor: getFallbackColor() }}
        onClick={onClick}
      >
        <span className="text-2xl">{initials}</span>
        <BookOpen className="w-5 h-5 mt-1 opacity-60" />
      </div>
    );
  }

  return (
    <div className={`${containerClass} relative group cursor-pointer rounded-xl overflow-hidden bg-gray-100 shadow-md`} onClick={onClick}>
      <img
        src={coverUrl}
        alt={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        onError={() => { setCoverUrl(null); setError(true); }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
    </div>
  );
};

// ========================================
// BOOK DETAILS MODAL
// ========================================
const BookDetailsModal = ({ book, onClose, onCreateCrew }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const query = encodeURIComponent(`${book.title} ${book.author || ''}`);
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`
        );
        
        if (res.ok) {
          const data = await res.json();
          const item = data.items?.[0]?.volumeInfo;
          if (item) {
            setDetails({
              title: item.title,
              subtitle: item.subtitle,
              author: item.authors?.join(', ') || book.author,
              description: item.description || 'No description available',
              pages: item.pageCount,
              publishedDate: item.publishedDate,
              publisher: item.publisher,
              categories: item.categories,
              rating: item.averageRating,
              ratingsCount: item.ratingsCount,
              previewLink: item.previewLink
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch book details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [book]);

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
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
                <p className="text-gray-500 text-sm">by {details.author}</p>
                {details.categories && details.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {details.categories.slice(0, 3).map((cat, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                {details.rating && (
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={Math.round(details.rating)} size="xs" readonly />
                    <span className="text-xs text-gray-600">
                      {details.rating.toFixed(1)} ({details.ratingsCount || 0} ratings)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {details.description && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {details.description.replace(/<[^>]*>/g, '').substring(0, 500)}...
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {details.pages && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-gray-500 text-xs">Pages</p>
                  <p className="font-semibold">{details.pages}</p>
                </div>
              )}
              {details.publishedDate && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-gray-500 text-xs">Published</p>
                  <p className="font-semibold">{new Date(details.publishedDate).getFullYear()}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  onCreateCrew(book);
                  onClose();
                }}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
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
// SHARE MODAL
// ========================================
const ShareModal = ({ post, onClose }) => {
  const shareUrl = window.location.href;
  const shareText = `"${post.content?.substring(0, 80)}" — ${post.userName} on ReadCrew`;

  const shareHandlers = {
    whatsapp: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank'),
    facebook: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank'),
    twitter: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank'),
    copyLink: () => { navigator.clipboard.writeText(shareUrl); alert('Link copied!'); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 overflow-y-auto" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h3 className="font-semibold">Share Post</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-4 gap-4 mb-4">
            {[
              ['whatsapp', '#25D366', 'W'],
              ['facebook', '#1877F2', 'F'],
              ['twitter', '#1DA1F2', 'T']
            ].map(([key, color, letter]) => (
              <button key={key} onClick={shareHandlers[key]} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: color }}>
                  {letter}
                </div>
                <span className="text-xs text-gray-600 capitalize">{key}</span>
              </button>
            ))}
          </div>
          <button
            onClick={shareHandlers.copyLink}
            className="w-full py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50"
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
// RESHARE MODAL
// ========================================
const ReshareModal = ({ post, onClose, onReshare }) => {
  const [comment, setComment] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h3 className="font-semibold">Reshare Post</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 resize-none"
            placeholder="Add a comment (optional)"
            rows={3}
          />
          <div className="bg-gray-50 rounded-xl p-3 my-4">
            <p className="text-xs text-gray-500 mb-1">Original by <span className="font-semibold">{post.userName}</span></p>
            <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
          </div>
          <button
            onClick={() => {
              onReshare(post, comment);
              onClose();
            }}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
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
// POST OPTIONS MODAL
// ========================================
const PostOptionsModal = ({ post, user, onClose, onReshare, onSave, isSaved, onDelete, isOwner, onFollow, isFollowing, onBlock, isBlocked }) => {
  const options = [
    { id: 'reshare', icon: Repeat, label: 'Reshare', color: 'text-blue-600', action: () => onReshare(post) },
    { id: 'save', icon: Bookmark, label: isSaved ? 'Unsave' : 'Save', color: isSaved ? 'text-orange-500' : 'text-gray-700', action: () => onSave(post) },
  ];

  if (!isOwner) {
    options.push({
      id: 'follow',
      icon: isFollowing ? UserMinus : UserPlus,
      label: isFollowing ? 'Unfollow' : 'Follow',
      color: isFollowing ? 'text-red-500' : 'text-green-600',
      action: () => onFollow(post.userEmail, post.userName)
    });
  }

  if (isOwner) {
    options.push({ id: 'delete', icon: Trash2, label: 'Delete', color: 'text-red-500', action: () => onDelete(post) });
  } else {
    options.push({
      id: 'block',
      icon: isBlocked ? UserCheck : UserMinus,
      label: isBlocked ? 'Unblock' : 'Block User',
      color: isBlocked ? 'text-green-600' : 'text-red-500',
      action: () => onBlock(post.userEmail, post.userName)
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-center">Post Options</h3>
        </div>
        <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
          {options.map(option => (
            <button
              key={option.id}
              onClick={() => { option.action(); onClose(); }}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition"
            >
              <option.icon className={`w-5 h-5 ${option.color}`} />
              <span className={`text-sm font-medium ${option.color}`}>{option.label}</span>
            </button>
          ))}
          <button onClick={onClose} className="w-full px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================================
// COMMENT ROW COMPONENT (with depth limiting)
// ========================================
const CommentRow = ({
  comment,
  depth = 0,
  comments,
  likedComments,
  user,
  onLikeComment,
  onDeleteComment,
  onReply,
  onViewUserProfile,
  showReplies,
  setShowReplies
}) => {
  // FIX 4: Depth limiting - don't render beyond depth 2
  if (depth >= 2) return null;

  const replies = comments.filter(c => c.parentId === comment.id);
  const liked = likedComments.has(comment.id);
  const isOwn = comment.userEmail === user.email;

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'mt-3' : ''}`}>
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 36 }}>
        <button onClick={() => onViewUserProfile(comment.userEmail, comment.userName)}>
          <Avatar initials={comment.userName} size="sm" src={comment.userPhoto} />
        </button>
        {replies.length > 0 && depth < 1 && (
          <div className="w-0.5 flex-1 bg-orange-200 mt-1 rounded-full min-h-[20px]" />
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
          <span className="text-xs text-gray-400 ml-auto">{formatTimeAgo(comment.timestamp)}</span>
        </div>

        <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{comment.content}</p>

        <div className="flex items-center gap-4 mt-1.5">
          <button
            onClick={() => onLikeComment(comment.id)}
            disabled={liked}
            className={`flex items-center gap-1.5 text-xs font-medium transition-all ${
              liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-500' : ''}`} />
            <span>{comment.likes || 0}</span>
          </button>
          {depth < 1 && (
            <button
              onClick={() => onReply(comment)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 font-semibold"
            >
              <Share2 className="w-3 h-3 rotate-180" />
              Reply
            </button>
          )}
          {isOwn && (
            <button onClick={() => onDeleteComment(comment.id)} className="ml-auto text-gray-200 hover:text-red-400 transition">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {replies.length > 0 && depth < 1 && (
          <div className="mt-2">
            {!showReplies[comment.id] && replies.length > 1 ? (
              <button
                onClick={() => setShowReplies(prev => ({ ...prev, [comment.id]: true }))}
                className="text-xs text-orange-500 font-semibold mb-2 flex items-center gap-1"
              >
                ↳ View {replies.length} replies
              </button>
            ) : (
              <div className="space-y-2 pl-3 border-l-2 border-orange-100">
                {replies.map(reply => (
                  <CommentRow
                    key={reply.id}
                    comment={reply}
                    depth={depth + 1}
                    comments={comments}
                    likedComments={likedComments}
                    user={user}
                    onLikeComment={onLikeComment}
                    onDeleteComment={onDeleteComment}
                    onReply={onReply}
                    onViewUserProfile={onViewUserProfile}
                    showReplies={showReplies}
                    setShowReplies={setShowReplies}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// INLINE POST CARD
// ========================================
const InlinePostCard = memo(({
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
  // FIX 5: Lazy loading comments - hidden by default
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likedComments, setLikedComments] = useState(new Set());
  const [replyTo, setReplyTo] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [showOptions, setShowOptions] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const inputRef = useRef(null);

  // FIX 2: Consistent like state from localStorage (email key)
  const [isLiked, setIsLiked] = useState(() => {
    const likedPosts = JSON.parse(localStorage.getItem(getLikedPostsKey(user.email)) || '[]');
    return likedPosts.includes(post.id);
  });
  const [likeCount, setLikeCount] = useState(post.likes || 0);

  // FIX 5: Load comments only when showComments becomes true
  useEffect(() => {
    if (!showComments) return;

    setLoadingComments(true);
    
    // Try to fetch from server first
    axios.get(`${API_URL}/api/social/posts/${post.id}/comments`)
      .then(res => {
        if (res.data.success) {
          setComments(res.data.comments);
          // Load liked comments from localStorage
          const liked = JSON.parse(localStorage.getItem(getLikedCommentsKey(user.email)) || '[]');
          setLikedComments(new Set(liked));
        }
      })
      .catch(() => {
        // Fallback to localStorage
        const saved = JSON.parse(localStorage.getItem(`post_${post.id}_comments`) || '[]');
        setComments(saved);
        const liked = JSON.parse(localStorage.getItem(getLikedCommentsKey(user.email)) || '[]');
        setLikedComments(new Set(liked));
      })
      .finally(() => setLoadingComments(false));
  }, [showComments, post.id, user.email]);

  const handleLikePost = async () => {
    // Optimistic update
    const newLiked = !isLiked;
    const newCount = newLiked ? likeCount + 1 : likeCount - 1;
    
    setIsLiked(newLiked);
    setLikeCount(newCount);

    // Update localStorage
    const likedPosts = JSON.parse(localStorage.getItem(getLikedPostsKey(user.email)) || '[]');
    if (newLiked) {
      if (!likedPosts.includes(post.id)) {
        likedPosts.push(post.id);
      }
    } else {
      const index = likedPosts.indexOf(post.id);
      if (index > -1) likedPosts.splice(index, 1);
    }
    localStorage.setItem(getLikedPostsKey(user.email), JSON.stringify(likedPosts));

    // Send to server
    try {
      const res = await axios.post(`${API_URL}/api/social/posts/${post.id}/like`, {
        userEmail: user.email,
        userName: user.name
      });
      
      if (res.data.success) {
        setLikeCount(res.data.likes);
        
        // Emit socket for real-time notification
        socket.emit('like_post', {
          postId: post.id,
          postAuthorEmail: post.userEmail,
          likedBy: { email: user.email, name: user.name }
        });
      }
    } catch (error) {
      console.error('Failed to like post:', error);
      // Keep optimistic state
    }

    // Send notification to post author if liking
    if (newLiked && post.userEmail !== user.email) {
      const notification = {
        type: 'like',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} liked your post`,
        postId: post.id
      };
      
      storeNotification(post.userEmail, notification);
      
      // Socket notification
      socket.emit('new_notification', {
        toEmail: post.userEmail,
        notification
      });
      
      updateNotificationCount?.();
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    const mentions = extractMentions(newComment);
    const commentData = {
      userName: user.name,
      userEmail: user.email,
      content: sanitizeText(newComment.trim()),
      mentions,
      parentId: replyTo?.id || null
    };

    setNewComment('');
    setReplyTo(null);

    try {
      const res = await axios.post(`${API_URL}/api/social/posts/${post.id}/comments`, commentData);
      if (res.data.success) {
        const updatedComments = [...comments, res.data.comment];
        setComments(updatedComments);
        localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(updatedComments));
        
        // Socket for real-time
        socket.emit('new_comment', {
          postId: post.id,
          postAuthorEmail: post.userEmail,
          comment: res.data.comment,
          commenter: { email: user.email, name: user.name }
        });
      }
    } catch (error) {
      // Fallback
      const comment = {
        id: generateId(),
        ...commentData,
        userInitials: user.name.slice(0, 2).toUpperCase(),
        timestamp: new Date().toISOString(),
        likes: 0,
        likedBy: []
      };
      const updatedComments = [...comments, comment];
      setComments(updatedComments);
      localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(updatedComments));
    }

    // Handle mentions
    mentions.forEach(mentionedUsername => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const mentionedUser = users.find(u =>
        u.name.toLowerCase().includes(mentionedUsername.toLowerCase()) ||
        u.email.split('@')[0].toLowerCase() === mentionedUsername.toLowerCase()
      );

      if (mentionedUser && mentionedUser.email !== user.email) {
        const notification = {
          type: 'mention',
          fromUser: user.name,
          fromUserEmail: user.email,
          message: `${user.name} mentioned you in a comment`,
          postId: post.id
        };
        
        storeNotification(mentionedUser.email, notification);
        socket.emit('new_notification', {
          toEmail: mentionedUser.email,
          notification
        });
      }
    });

    // Notify post author
    if (post.userEmail !== user.email) {
      const notification = {
        type: 'comment',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} commented on your post`,
        postId: post.id
      };
      
      storeNotification(post.userEmail, notification);
      socket.emit('new_notification', {
        toEmail: post.userEmail,
        notification
      });
      
      updateNotificationCount?.();
    }
  };

  const handleLikeComment = (commentId) => {
    if (likedComments.has(commentId)) return;

    // Update local state
    const updated = comments.map(c =>
      c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c
    );
    setComments(updated);
    localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(updated));

    const newLiked = new Set(likedComments);
    newLiked.add(commentId);
    setLikedComments(newLiked);
    localStorage.setItem(getLikedCommentsKey(user.email), JSON.stringify([...newLiked]));

    // Find comment to notify author
    const comment = comments.find(c => c.id === commentId);
    if (comment && comment.userEmail !== user.email) {
      const notification = {
        type: 'like',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} liked your comment`,
        postId: post.id
      };
      
      storeNotification(comment.userEmail, notification);
      socket.emit('new_notification', {
        toEmail: comment.userEmail,
        notification
      });
    }
  };

  const handleDeleteComment = (commentId) => {
    const filtered = comments.filter(c => c.id !== commentId && c.parentId !== commentId);
    setComments(filtered);
    localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(filtered));
  };

  const topLevelComments = comments.filter(c => !c.parentId);
  const isPostOwner = user.email === post.userEmail;

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
          isOwner={isPostOwner}
          onFollow={onFollow}
          isFollowing={isFollowing}
          onBlock={onBlock}
          isBlocked={isBlocked}
        />
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <button onClick={() => onViewUserProfile(post.userEmail, post.userName)} className="flex-shrink-0">
              <Avatar initials={post.userName} size="md" src={post.userPhoto} />
            </button>
            <div className="flex-1 min-w-0">
              <button onClick={() => onViewUserProfile(post.userEmail, post.userName)} className="font-bold text-gray-900 text-sm hover:underline">
                {post.userName || 'Anonymous'}
              </button>
              <span className="text-xs text-gray-400 ml-2">{formatTimeAgo(post.createdAt)}</span>
              {post.bookName && (
                <button
                  onClick={() => onViewBookDetails?.({ title: post.bookName, author: post.author })}
                  className="flex items-center gap-1 mt-0.5 hover:underline"
                >
                  <BookOpen className="w-3 h-3 text-orange-400" />
                  <span className="text-xs text-gray-500">{post.bookName}{post.author ? ` · ${post.author}` : ''}</span>
                </button>
              )}
            </div>
            <button onClick={() => setShowOptions(true)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 pb-3">
          {post.image && (
            <img src={post.image} alt="" className="w-full rounded-xl mb-3 max-h-56 object-cover" />
          )}
          {post.isReshare && post.originalPost && (
            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <Repeat className="w-3 h-3" />
              Reshared from <span className="font-semibold ml-1">{post.originalPost.userName}</span>
            </p>
          )}
          <p className="text-gray-800 text-base leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
            {post.content}
          </p>
          {post.reshareComment && (
            <div className="mt-2 bg-orange-50 rounded-lg p-3 border border-orange-100">
              <p className="text-sm text-orange-800 italic">"{post.reshareComment}"</p>
            </div>
          )}
          {post.isReshare && post.originalPost && (
            <div className="mt-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Original:</p>
              <p className="text-sm text-gray-600">{post.originalPost.content}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-5">
          <button
            onClick={handleLikePost}
            className={`flex items-center gap-1.5 text-sm font-semibold transition ${
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
            <span>{comments.length || post.comments || 0}</span>
          </button>

          <button
            onClick={() => onSaveToggle(post)}
            className={`flex items-center gap-1.5 text-sm font-semibold transition ${
              isSaved ? 'text-orange-500' : 'text-gray-500 hover:text-orange-400'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-orange-500' : ''}`} />
          </button>

          <button
            onClick={() => onShare(post)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-orange-500 transition ml-auto"
          >
            <Share2 className="w-4 h-4" />
            <span>{post.reshareCount || 0}</span>
          </button>
        </div>

        {/* FIX 5: Comments section - only rendered when showComments is true */}
        {showComments && (
          <>
            {/* Comment input */}
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
                  <img src={profileSrc} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <Avatar initials={user?.name} size="sm" />
                )}
                <div className="flex-1 flex items-center gap-2 bg-white rounded-full border border-gray-200 px-4 py-2 focus-within:border-orange-400 transition">
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
                    placeholder={replyTo ? `Reply to @${replyTo.userName}…` : 'Write a comment… use @ to mention'}
                  />
                </div>
                <button
                  onClick={handlePostComment}
                  disabled={!newComment.trim()}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition ${
                    newComment.trim() ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Post
                </button>
              </div>
            </div>

            {/* Comments list */}
            <div className="px-4 py-3 border-t border-gray-100 space-y-1">
              {loadingComments ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : topLevelComments.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">Be the first to comment 💬</p>
              ) : (
                <>
                  {topLevelComments.map(comment => (
                    <CommentRow
                      key={comment.id}
                      comment={comment}
                      depth={0}
                      comments={comments}
                      likedComments={likedComments}
                      user={user}
                      onLikeComment={handleLikeComment}
                      onDeleteComment={handleDeleteComment}
                      onReply={setReplyTo}
                      onViewUserProfile={onViewUserProfile}
                      showReplies={showReplies}
                      setShowReplies={setShowReplies}
                    />
                  ))}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
});

// ========================================
// BOTTOM NAVIGATION
// ========================================
const BottomNav = ({ active, setPage, unreadCount = 0, show = true }) => {
  if (!show) return null;

  const items = [
    { id: 'home', icon: BookOpen, label: 'Home' },
    { id: 'explore', icon: Sparkles, label: 'Explore' },
    { id: 'post', icon: Edit3, label: 'Post' },
    { id: 'crews', icon: Users, label: 'Crews' },
    { id: 'profile', icon: User, label: 'Profile' }
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

// ========================================
// TOP BAR
// ========================================
const TopBar = ({ user, setPage, title, showBack = false, onBack, showProfile = true, onNotificationClick, notificationCount = 0, profileSrc }) => (
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
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>
        <button onClick={() => setPage('profile')} className="hover:opacity-80 transition">
          {profileSrc ? (
            <img src={profileSrc} alt="profile" className="w-8 h-8 rounded-full object-cover border border-orange-200" />
          ) : (
            <Avatar initials={user?.name} size="sm" />
          )}
        </button>
      </div>
    )}
  </header>
);

// ========================================
// NOTIFICATIONS PAGE
// ========================================
const NotificationsPage = ({ user, onClose, updateNotificationCount }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const notifs = JSON.parse(localStorage.getItem(getNotificationsKey(user.email)) || '[]');
    setNotifications(notifs);
  }, [user.email]);

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(getNotificationsKey(user.email), JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: getNotificationsKey(user.email) }));
    updateNotificationCount?.();
  };

  const icons = {
    like: <Heart className="w-4 h-4 text-red-500" />,
    comment: <MessageCircle className="w-4 h-4 text-blue-500" />,
    message: <MessageSquare className="w-4 h-4 text-emerald-500" />,
    invite: <UserPlus className="w-4 h-4 text-purple-500" />,
    follow: <UserCheck className="w-4 h-4 text-orange-500" />,
    reshare: <Repeat className="w-4 h-4 text-indigo-500" />,
    mention: <AtSign className="w-4 h-4 text-amber-500" />,
    join: <Users className="w-4 h-4 text-blue-500" />,
    review: <Star className="w-4 h-4 text-yellow-500" />
  };

  const bgColors = {
    like: 'bg-red-100',
    comment: 'bg-blue-100',
    message: 'bg-emerald-100',
    invite: 'bg-purple-100',
    follow: 'bg-orange-100',
    reshare: 'bg-indigo-100',
    mention: 'bg-amber-100',
    join: 'bg-blue-100',
    review: 'bg-yellow-100'
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-semibold text-gray-900">Notifications</h2>
        <button onClick={markAllAsRead} className="text-sm text-orange-500 font-medium">
          Mark all read
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {[...notifications]
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map(notif => (
                <div key={notif.id} className={`p-4 ${notif.read ? 'bg-white' : 'bg-orange-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${bgColors[notif.type] || 'bg-gray-100'}`}>
                      {icons[notif.type] || <Bell className="w-4 h-4 text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-relaxed">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(notif.timestamp).toLocaleString()}</p>
                    </div>
                    {!notif.read && <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />}
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
// LOGIN PAGE
// ========================================
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [devOtpDisplay, setDevOtpDisplay] = useState('');
  const [readingGoal, setReadingGoal] = useState({ yearly: 20, monthly: 5 });
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const sendOTP = () => {
    setErrorMsg('');
    if (!isLogin && (!name.trim() || name.trim().length < 2)) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid email');
      return;
    }
    if (!isLogin && !agreeToTerms) {
      setErrorMsg('Please agree to the terms');
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('devOTP', otp);
    localStorage.setItem('pendingUser', JSON.stringify({
      email,
      name: name || email.split('@')[0],
      password: password || 'password123'
    }));
    setDevOtpDisplay(otp);
    setShowOTP(true);
  };

  const verifyOTP = () => {
    setErrorMsg('');
    if (otpInput.length !== 6) {
      setErrorMsg('Enter the 6-digit code');
      return;
    }

    const savedOTP = localStorage.getItem('devOTP');
    const pendingUser = JSON.parse(localStorage.getItem('pendingUser') || '{}');

    if (otpInput !== savedOTP) {
      setErrorMsg('Incorrect code. Try again.');
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
      bio: 'Reading is my superpower',
      location: '',
      website: ''
    };

    // Save to localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const existingIndex = users.findIndex(u => u.email === userData.email);
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...userData };
    } else {
      users.push(userData);
    }
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(userData));

    // Initialize user data structures
    localStorage.setItem(getFollowingKey(userData.email), JSON.stringify([]));
    localStorage.setItem(getFollowersKey(userData.email), JSON.stringify([]));
    localStorage.setItem(getBlockedKey(userData.email), JSON.stringify([]));
    localStorage.setItem(getStatsKey(userData.email), JSON.stringify(userData.stats));
    localStorage.setItem(getJoinedCrewsKey(userData.email), JSON.stringify([]));
    localStorage.setItem(getReadingListKey(userData.email), JSON.stringify([]));
    localStorage.setItem(getSavedPostsKey(userData.email), JSON.stringify([]));

    setShowOTP(false);
    onLogin(userData);
  };

  const handleLogin = () => {
    setErrorMsg('');
    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid email');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your password');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (found && (found.password === password || !found.password)) {
      localStorage.setItem('currentUser', JSON.stringify(found));
      onLogin(found);
    } else {
      setErrorMsg(found ? 'Incorrect password' : 'No account found');
    }
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
            <p className="text-gray-500 text-sm">Code sent to <strong>{email}</strong></p>
          </div>

          {devOtpDisplay && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-4 text-center">
              <p className="text-xs text-amber-700 font-medium mb-2">📧 Email unavailable — use this code:</p>
              <p className="text-4xl font-bold text-amber-800 tracking-widest">{devOtpDisplay}</p>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          <input
            type="text"
            inputMode="numeric"
            value={otpInput}
            onChange={e => { setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrorMsg(''); }}
            className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none text-center text-3xl tracking-widest mb-4 font-mono"
            placeholder="000000"
            maxLength="6"
            autoFocus
          />

          <button
            onClick={verifyOTP}
            disabled={otpInput.length !== 6}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-50 mb-3"
          >
            Verify & Continue
          </button>

          <div className="flex justify-between">
            <button
              onClick={() => { setShowOTP(false); setErrorMsg(''); setDevOtpDisplay(''); }}
              className="text-gray-500 text-sm flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={sendOTP} className="text-orange-500 text-sm font-semibold">
              Resend code
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-10 h-10 text-white" />
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

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          <div className="space-y-3">
            {!isLogin && (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                <User className="w-5 h-5 text-gray-400" />
                <input
                  value={name}
                  onChange={e => { setName(e.target.value); setErrorMsg(''); }}
                  className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                  placeholder="Full Name *"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
              <Mail className="w-5 h-5 text-gray-400" />
              <input
                value={email}
                onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
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
                onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
                type={showPass ? 'text' : 'password'}
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                placeholder={isLogin ? 'Password *' : 'Create a password *'}
              />
              <button onClick={() => setShowPass(!showPass)} type="button">
                {showPass ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>

            {!isLogin && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={e => setAgreeToTerms(e.target.checked)}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="terms" className="text-xs text-gray-600">
                  I agree to the Terms and Privacy Policy
                </label>
              </div>
            )}
          </div>

          <button
            onClick={isLogin ? handleLogin : sendOTP}
            disabled={loading}
            className="w-full mt-5 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-60"
          >
            {isLogin ? 'Log In' : 'Create Account →'}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
              className="text-orange-500 font-semibold"
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
// POST PAGE
// ========================================
const PostPage = ({ user, onPost, setPage }) => {
  const [content, setContent] = useState('');
  const [bookName, setBookName] = useState('');
  const [author, setAuthor] = useState('');
  const [image, setImage] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setUploading(true);

    const postData = {
      content: sanitizeText(content.trim()),
      bookName: bookName.trim() || undefined,
      author: author.trim() || undefined,
      image,
      isPublic,
      userName: user.name,
      userEmail: user.email,
      userPhoto: user.profileImage,
      userInitials: user.name.slice(0, 2).toUpperCase()
    };

    try {
      // Try server first
      const res = await axios.post(`${API_URL}/api/social/posts`, postData);
      if (res.data.success) {
        onPost(res.data.post);
        // Emit socket for real-time
        socket.emit('new_post', res.data.post);
      }
    } catch (error) {
      // Fallback to localStorage
      const newPost = {
        ...postData,
        id: generateId(),
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
        reshareCount: 0
      };
      onPost(newPost);
    }

    setUploading(false);
    setPage('home');
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white z-[55] overflow-hidden" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={() => setPage('home')} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-semibold text-gray-900">Create Post</h2>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || uploading}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
        >
          {uploading ? 'Posting...' : 'Share'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex gap-3 mb-4">
          <Avatar initials={user?.name} size="md" src={user?.profileImage} />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-base resize-none"
            placeholder="What are you reading?"
            rows={5}
            autoFocus
          />
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
            <img src={image} alt="preview" className="w-full rounded-xl max-h-56 object-cover" />
            <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 hover:bg-gray-200"
          >
            <Camera className="w-4 h-4" />
            Add Photo
          </button>
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${
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
          onChange={e => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
              alert('Image size should be less than 5MB');
              return;
            }
            const reader = new FileReader();
            reader.onload = ev => setImage(ev.target.result);
            reader.readAsDataURL(file);
          }}
        />
      </div>
    </div>
  );
};

// ========================================
// HOME PAGE
// ========================================
const HomePage = ({
  user,
  posts,
  setPosts,
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
  const [feedPosts, setFeedPosts] = useState([]);
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showShare, setShowShare] = useState(null);
  const [showReshare, setShowReshare] = useState(null);
  const [userStats, setUserStats] = useState(user?.stats || { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 });
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    // Filter blocked users from feed
    const filtered = posts.filter(p => !blockedUsers.includes(p.userEmail));
    setFeedPosts(filtered);

    // Load trending books
    const fetchTrending = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/books/trending?limit=8`);
        if (res.data.success) {
          setTrendingBooks(res.data.books);
        }
      } catch {
        setTrendingBooks([
          { title: 'Atomic Habits', author: 'James Clear', rating: 4.8 },
          { title: 'Project Hail Mary', author: 'Andy Weir', rating: 4.8 },
          { title: 'Fourth Wing', author: 'Rebecca Yarros', rating: 4.6 },
          { title: 'The Midnight Library', author: 'Matt Haig', rating: 4.6 },
          { title: 'The Psychology of Money', author: 'Morgan Housel', rating: 4.7 }
        ]);
      }
    };
    fetchTrending();

    // Load user stats
    const stats = JSON.parse(localStorage.getItem(getStatsKey(user.email)) || '{}');
    setUserStats(stats);
    if (user?.readingGoal?.yearly > 0) {
      setReadingProgress(Math.min((stats.booksRead || 0) / user.readingGoal.yearly * 100, 100));
    }

    // Socket listeners for real-time updates
    socket.on('new_post', (post) => {
      if (!blockedUsers.includes(post.userEmail)) {
        setFeedPosts(prev => [post, ...prev]);
      }
    });

    socket.on('post_deleted', ({ postId }) => {
      setFeedPosts(prev => prev.filter(p => (p._id || p.id) !== postId));
    });

    socket.on('post_liked', ({ postId, likes }) => {
      setFeedPosts(prev => prev.map(p => (p._id || p.id) === postId ? { ...p, likes } : p));
    });

    return () => {
      socket.off('new_post');
      socket.off('post_deleted');
      socket.off('post_liked');
    };
  }, [posts, blockedUsers, user.email]);

  const handleReshareClick = (post) => {
    setShowReshare(post);
  };

  const handleReshare = (post, comment) => {
    onResharePost(post, comment);
    setShowReshare(null);
  };

  const userCrews = crews.filter(c => user?.joinedCrews?.includes(c.id));
  const hasReadingGoal = user?.readingGoal?.yearly > 0;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <TopBar
        user={user}
        setPage={setPage}
        title="ReadCrew"
        profileSrc={profileSrc}
        onNotificationClick={() => setPage('notifications')}
        notificationCount={JSON.parse(localStorage.getItem(getNotificationsKey(user.email)) || '[]').filter(n => !n.read).length}
      />

      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onCreateCrew={(book) => {
            const newCrew = {
              id: Date.now(),
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
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
          {hasReadingGoal && (
            <div className="mt-4 bg-white/20 rounded-xl p-3">
              <div className="flex justify-between text-sm mb-2">
                <span>Yearly Goal</span>
                <span className="font-semibold">{userStats.booksRead}/{user.readingGoal.yearly} books</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${readingProgress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Books', value: userStats.booksRead, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100', page: 'profile' },
            { label: 'Reviews', value: userStats.reviewsGiven, icon: Star, color: 'text-purple-600', bg: 'bg-purple-100', page: 'reviews' },
            { label: 'Posts', value: userStats.postsCreated, icon: Edit3, color: 'text-green-600', bg: 'bg-green-100', page: 'post' },
            { label: 'Crews', value: userStats.crewsJoined, icon: Users, color: 'text-orange-600', bg: 'bg-orange-100', page: 'crews' }
          ].map(({ label, value, icon: Icon, color, bg, page }, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md"
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
            <button onClick={() => setPage('explore')} className="text-sm text-orange-500 font-semibold">
              Explore All
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
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
                    <span className="text-xs">{book.rating}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
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
            {userCrews.slice(0, 2).map(crew => (
              <div
                key={crew.id}
                className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer"
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
                    <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-lg text-xs">Joined</span>
                  </div>
                </div>
              </div>
            ))}
            {userCrews.length === 0 && (
              <div className="col-span-2 bg-white rounded-xl p-6 text-center border border-gray-200">
                <p className="text-gray-500 text-sm">No crews joined yet</p>
                <button onClick={() => setPage('crews')} className="mt-2 text-orange-500 text-sm font-medium">
                  Browse Crews →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Post */}
        <button
          onClick={() => setPage('post')}
          className="w-full bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-center gap-3 hover:shadow-md"
        >
          {profileSrc ? (
            <img src={profileSrc} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <Avatar initials={user?.name} size="sm" />
          )}
          <span className="text-gray-400 text-sm flex-1 text-left">Share your reading journey…</span>
          <span className="text-xs text-orange-500 font-medium bg-orange-50 px-3 py-1 rounded-full">Post</span>
        </button>

        {/* Feed */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-500" />
            Community Feed
          </h2>
          <div className="space-y-4">
            {feedPosts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No posts yet. Be the first!</p>
                <button onClick={() => setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">
                  Create Post
                </button>
              </div>
            ) : (
              feedPosts.map(post => (
                <InlinePostCard
                  key={post.id}
                  post={post}
                  user={user}
                  profileSrc={profileSrc}
                  updateNotificationCount={updateNotificationCount}
                  onShare={setShowShare}
                  onReshareClick={handleReshareClick}
                  onSaveToggle={onSavePost}
                  isSaved={savedPosts?.includes(post.id)}
                  onDelete={onDeletePost}
                  onFollow={onFollow}
                  isFollowing={following?.includes(post.userEmail)}
                  onBlock={onBlock}
                  isBlocked={blockedUsers?.includes(post.userEmail)}
                  onViewUserProfile={onViewUserProfile}
                  onViewBookDetails={setSelectedBook}
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
// EXPLORE PAGE
// ========================================
const BOOK_DB = {
  thriller: [
    { title: 'Gone Girl', author: 'Gillian Flynn', genre: 'Thriller', rating: 4.6, reason: 'Twisty, addictive — impossible to put down' },
    { title: 'The Silent Patient', author: 'Alex Michaelides', genre: 'Thriller', rating: 4.5, reason: 'Jaw-dropping twist guaranteed' },
    { title: 'Verity', author: 'Colleen Hoover', genre: 'Thriller', rating: 4.6, reason: 'You will NOT see the ending coming' }
  ],
  fantasy: [
    { title: 'The Name of the Wind', author: 'Patrick Rothfuss', genre: 'Fantasy', rating: 4.7, reason: 'Stunning prose and world-building' },
    { title: 'Mistborn', author: 'Brandon Sanderson', genre: 'Fantasy', rating: 4.7, reason: 'Inventive magic + deeply satisfying plot' },
    { title: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', rating: 4.6, reason: 'Fast-paced, romantic, absolutely addictive' }
  ],
  romance: [
    { title: 'Beach Read', author: 'Emily Henry', genre: 'Romance', rating: 4.6, reason: 'Witty, heartfelt and genuinely funny' },
    { title: 'It Ends with Us', author: 'Colleen Hoover', genre: 'Romance', rating: 4.6, reason: 'Emotional, important and beautifully written' },
    { title: 'People We Meet on Vacation', author: 'Emily Henry', genre: 'Romance', rating: 4.6, reason: 'Nostalgic, swoony and deeply satisfying' }
  ],
  scifi: [
    { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.8, reason: 'Most fun you will ever have reading sci-fi' },
    { title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi', rating: 4.8, reason: 'Foundation of all modern science fiction' },
    { title: 'The Martian', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.8, reason: 'Funny, clever and impossible to put down' }
  ],
  selfhelp: [
    { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8, reason: 'Most practical habit book ever written' },
    { title: 'The Psychology of Money', author: 'Morgan Housel', genre: 'Finance', rating: 4.7, reason: 'Will change how you think about money forever' },
    { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', rating: 4.7, reason: 'Will fundamentally change how you see humanity' }
  ],
  mystery: [
    { title: 'And Then There Were None', author: 'Agatha Christie', genre: 'Mystery', rating: 4.7, reason: 'Bestselling mystery novel of all time' },
    { title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', genre: 'Mystery', rating: 4.7, reason: 'Glamorous, emotional and utterly unforgettable' },
    { title: 'The Thursday Murder Club', author: 'Richard Osman', genre: 'Mystery', rating: 4.5, reason: 'Charming, funny and genuinely clever' }
  ]
};

const generateClientRecommendations = (userText, previousBooks = []) => {
  const text = userText.toLowerCase();
  let category = 'literary';

  if (/thriller|suspense|crime|murder|dark|horror/i.test(text)) category = 'thriller';
  else if (/fantasy|magic|dragon|wizard|epic/i.test(text)) category = 'fantasy';
  else if (/romance|love|swoony|dating|relationship/i.test(text)) category = 'romance';
  else if (/sci.?fi|space|future|robot|alien|mars/i.test(text)) category = 'scifi';
  else if (/self.?help|habit|product|motivate|improve|mindset|success/i.test(text)) category = 'selfhelp';
  else if (/mystery|whodunit|cozy|clue|puzzle|detective/i.test(text)) category = 'mystery';

  const bookList = BOOK_DB[category] || BOOK_DB.thriller;
  const previousTitles = new Set(previousBooks.map(b => b.title));
  const fresh = bookList.filter(b => !previousTitles.has(b.title));
  const recommendations = (fresh.length >= 3 ? fresh : bookList).slice(0, 5);

  const intros = {
    thriller: "Here are 5 gripping thrillers you won't be able to put down! 🔪",
    fantasy: "5 magical worlds waiting for you to explore ✨",
    romance: "5 romance reads that will give you all the feels ❤️",
    scifi: "5 sci-fi journeys that will blow your mind 🚀",
    selfhelp: "5 books that will genuinely change how you think 💡",
    mystery: "5 mysteries that'll keep you guessing until the last page 🔍",
    literary: "Here are 5 great books based on your request 📚"
  };

  return {
    reply: intros[category] || "Here are some great picks for you! 📚",
    books: recommendations
  };
};

const BookCard = ({ book, onCreateCrew, onViewDetails }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
    <div className="flex gap-4">
      <DynamicBookCover title={book.title} author={book.author} size="md" onClick={() => onViewDetails(book)} />
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 text-sm">{book.title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">by {book.author}</p>
        {book.genre && (
          <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full inline-block mt-1">
            {book.genre}
          </span>
        )}
        {book.reason && (
          <p className="text-xs text-orange-700 mt-1 italic line-clamp-2">"{book.reason}"</p>
        )}
        {book.rating && (
          <div className="flex items-center gap-1 mt-1">
            <StarRating rating={Math.round(book.rating)} size="xs" readonly />
            <span className="text-xs text-gray-600">{book.rating}</span>
          </div>
        )}
      </div>
    </div>
    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
      <button
        onClick={() => onViewDetails(book)}
        className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold"
      >
        View Details
      </button>
      <button
        onClick={onCreateCrew}
        className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
      >
        <Users className="w-4 h-4" />
        Create Crew
      </button>
    </div>
  </div>
);

const ExplorePage = ({ user, setPage, onCreateCrew }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! 👋 I'm Page Turner, your AI book guide. Tell me what you're in the mood for!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText, timestamp: new Date() }]);
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/books/chat`, {
        message: userText,
        sessionId: `session_${user.email}_${Date.now()}`
      });

      if (res.data.success && res.data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply, timestamp: new Date() }]);
        if (res.data.recommendations?.length > 0) {
          setBooks(res.data.recommendations);
        }
      }
    } catch (error) {
      // Fallback to client-side recommendations
      const { reply, books: recs } = generateClientRecommendations(userText, books);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);
      setBooks(recs);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] to-[#FAF6F1] pb-24 overflow-y-auto">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-[#2D1F14]" style={{ fontFamily: 'Georgia, serif' }}>
          What to read next?
        </h1>
        <p className="text-sm text-[#8B7968]">Chat with your AI book guide</p>
      </div>

      <div className="flex-1 px-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-orange-500 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {books.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 px-1">
              <div className="h-px flex-1 bg-orange-200" />
              <span className="text-xs text-orange-500 font-semibold">📚 RECOMMENDATIONS</span>
              <div className="h-px flex-1 bg-orange-200" />
            </div>
            {books.map((book, i) => (
              <BookCard
                key={i}
                book={book}
                onCreateCrew={() => {
                  onCreateCrew(book);
                  setPage('crews');
                }}
                onViewDetails={setSelectedBook}
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
            placeholder="Tell me what you're in the mood for…"
            className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
              input.trim() && !loading ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

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
// REVIEWS PAGE
// ========================================
const ReviewsPage = ({ user, setPage, updateNotificationCount, onViewUserProfile }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [likedReviews, setLikedReviews] = useState([]);
  const [newReview, setNewReview] = useState({ bookName: '', author: '', rating: 5, review: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/social/reviews`);
        if (res.data.success) {
          setReviews(res.data.reviews);
        }
      } catch {
        const saved = JSON.parse(localStorage.getItem('reviews') || '[]');
        setReviews(saved);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();

    const liked = JSON.parse(localStorage.getItem(getLikedPostsKey(user.email)) || '[]');
    setLikedReviews(liked);
  }, [user.email]);

  const handleLikeReview = (reviewId, review) => {
    if (likedReviews.includes(reviewId)) return;

    const updated = [...likedReviews, reviewId];
    setLikedReviews(updated);
    localStorage.setItem(getLikedPostsKey(user.email), JSON.stringify(updated));

    const updatedReviews = reviews.map(r =>
      r.id === reviewId ? { ...r, likes: (r.likes || 0) + 1 } : r
    );
    setReviews(updatedReviews);
    localStorage.setItem('reviews', JSON.stringify(updatedReviews));

    if (review.userEmail !== user.email) {
      const notification = {
        type: 'review',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} liked your review of "${review.bookName}"`
      };
      storeNotification(review.userEmail, notification);
      socket.emit('new_notification', { toEmail: review.userEmail, notification });
      updateNotificationCount?.();
    }
  };

  const handleCreateReview = async () => {
    if (!newReview.bookName || !newReview.author || !newReview.review) {
      alert('Please fill all fields');
      return;
    }

    const reviewData = {
      ...newReview,
      userName: user.name,
      userEmail: user.email,
      userInitials: user.name.slice(0, 2).toUpperCase()
    };

    try {
      const res = await axios.post(`${API_URL}/api/social/reviews`, reviewData);
      if (res.data.success) {
        setReviews(prev => [res.data.review, ...prev]);
      }
    } catch {
      const review = {
        id: generateId(),
        ...reviewData,
        createdAt: new Date().toISOString(),
        likes: 0
      };
      const saved = JSON.parse(localStorage.getItem('reviews') || '[]');
      saved.unshift(review);
      localStorage.setItem('reviews', JSON.stringify(saved));
      setReviews(prev => [review, ...prev]);
    }

    setShowCreateForm(false);
    setNewReview({ bookName: '', author: '', rating: 5, review: '' });

    const stats = JSON.parse(localStorage.getItem(getStatsKey(user.email)) || '{}');
    stats.reviewsGiven = (stats.reviewsGiven || 0) + 1;
    localStorage.setItem(getStatsKey(user.email), JSON.stringify(stats));
  };

  const filteredReviews = reviews.filter(r =>
    r.bookName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onCreateCrew={() => {}}
        />
      )}

      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <button onClick={() => setPage('home')} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
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
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by book or author…"
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
          />
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
            <h3 className="font-semibold mb-3">Write a Review</h3>
            <div className="space-y-3 mb-4">
              <input
                value={newReview.bookName}
                onChange={e => setNewReview({ ...newReview, bookName: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                placeholder="Book name *"
              />
              <input
                value={newReview.author}
                onChange={e => setNewReview({ ...newReview, author: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
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
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none resize-none"
                placeholder="Write your review…"
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
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map(review => (
              <div key={review.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3 mb-2">
                  <DynamicBookCover
                    title={review.bookName}
                    author={review.author}
                    size="sm"
                    onClick={() => setSelectedBook({ title: review.bookName, author: review.author })}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{review.bookName}</h3>
                    <p className="text-xs text-gray-500">by {review.author}</p>
                    <StarRating rating={review.rating} size="xs" readonly />
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">{review.review}</p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    onClick={() => onViewUserProfile(review.userEmail, review.userName)}
                    className="flex items-center gap-2 hover:opacity-75"
                  >
                    <Avatar initials={review.userName} size="xs" />
                    <span className="text-xs text-gray-600">{review.userName}</span>
                  </button>
                  <button
                    onClick={() => handleLikeReview(review.id, review)}
                    disabled={likedReviews.includes(review.id)}
                    className={`flex items-center gap-1 text-xs ${
                      likedReviews.includes(review.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${likedReviews.includes(review.id) ? 'fill-red-500' : ''}`} />
                    {review.likes || 0}
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
// CREWS PAGE
// ========================================
const CrewsPage = ({ user, crews: initialCrews, setPage, updateNotificationCount, onViewUserProfile }) => {
  const [view, setView] = useState('list');
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [crews, setCrews] = useState([]);
  const [joinedCrews, setJoinedCrews] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCrewData, setNewCrewData] = useState({ name: '', author: '', genre: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('crews') || '[]');
    setCrews(saved.length > 0 ? saved : initialCrews);
    const jc = JSON.parse(localStorage.getItem(getJoinedCrewsKey(user.email)) || '[]');
    setJoinedCrews(jc);
  }, [user.email]);

  useEffect(() => {
    if (selectedCrew) {
      const msgs = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`) || '[]');
      setMessages(msgs);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedCrew]);

  const isJoined = (crewId) => joinedCrews.includes(crewId);

  const joinCrew = (crew) => {
    const updated = [...joinedCrews, crew.id];
    setJoinedCrews(updated);
    localStorage.setItem(getJoinedCrewsKey(user.email), JSON.stringify(updated));

    const updatedCrews = crews.map(c =>
      c.id === crew.id ? { ...c, members: (c.members || 1) + 1 } : c
    );
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));

    const stats = JSON.parse(localStorage.getItem(getStatsKey(user.email)) || '{}');
    stats.crewsJoined = (stats.crewsJoined || 0) + 1;
    localStorage.setItem(getStatsKey(user.email), JSON.stringify(stats));

    socket.emit('join_crew_room', crew.id);
  };

  const leaveCrew = (crew) => {
    if (!window.confirm(`Leave ${crew.name}?`)) return;

    const updated = joinedCrews.filter(id => id !== crew.id);
    setJoinedCrews(updated);
    localStorage.setItem(getJoinedCrewsKey(user.email), JSON.stringify(updated));

    const updatedCrews = crews.map(c =>
      c.id === crew.id ? { ...c, members: Math.max(0, (c.members || 1) - 1) } : c
    );
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));

    if (selectedCrew?.id === crew.id) {
      setView('list');
      setSelectedCrew(null);
    }

    socket.emit('leave_crew_room', crew.id);
  };

  const createCrew = () => {
    if (!newCrewData.name || !newCrewData.author) {
      alert('Please fill book name and author');
      return;
    }

    const newCrew = {
      id: Date.now(),
      ...newCrewData,
      members: 1,
      chats: 0,
      createdBy: user.email,
      createdByName: user.name,
      createdAt: new Date().toISOString()
    };

    const updated = [newCrew, ...crews];
    setCrews(updated);
    localStorage.setItem('crews', JSON.stringify(updated));
    joinCrew(newCrew);
    setShowCreateForm(false);
    setNewCrewData({ name: '', author: '', genre: '' });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedCrew || !isJoined(selectedCrew.id)) return;

    const msg = {
      id: `msg_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userInitials: user.name.slice(0, 2).toUpperCase(),
      content: newMessage.trim(),
      type: 'text',
      timestamp: new Date().toISOString()
    };

    setNewMessage('');
    setMessages(prev => [...prev, msg]);

    const existing = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`) || '[]');
    existing.push(msg);
    localStorage.setItem(`crew_${selectedCrew.id}_messages`, JSON.stringify(existing));

    socket.emit('new_crew_message', {
      crewId: selectedCrew.id,
      message: msg
    });
  };

  const filteredCrews = crews.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.genre && c.genre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (view === 'chat' && selectedCrew) {
    const hasJoined = isJoined(selectedCrew.id);

    return (
      <div className="fixed inset-0 flex flex-col z-[60] bg-[#e5ddd5]" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
        <div className="flex-shrink-0 bg-white border-b px-4 py-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('detail')} className="p-1 hover:bg-gray-100 rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <DynamicBookCover title={selectedCrew.name} author={selectedCrew.author} size="xs" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{selectedCrew.name}</p>
              <p className="text-xs text-gray-500">{selectedCrew.members || 1} members</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {!hasJoined ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Lock className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium mb-2">Join to see messages</p>
              <button
                onClick={() => joinCrew(selectedCrew)}
                className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium"
              >
                Join Crew
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No messages yet. Say something!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isOwn = msg.userId === user.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[78%] items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      <button
                        onClick={() => onViewUserProfile(msg.userEmail, msg.userName)}
                        className="w-7 h-7 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      >
                        {msg.userInitials}
                      </button>
                    )}
                    <div className={`rounded-2xl px-3.5 py-2 shadow-sm ${
                      isOwn ? 'bg-[#dcf8c6] rounded-br-sm' : 'bg-white rounded-bl-sm'
                    }`}>
                      {!isOwn && <p className="text-xs font-semibold text-orange-600 mb-0.5">{msg.userName}</p>}
                      <p className="text-sm leading-relaxed break-words text-gray-900">{msg.content}</p>
                      <p className="text-[10px] text-gray-400 text-right mt-0.5">
                        {formatTimeAgo(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {hasJoined && (
          <div className="flex-shrink-0 bg-gray-50 border-t px-3 py-2.5">
            <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow border border-gray-100">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                className="flex-1 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
                placeholder="Type a message…"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition ${
                  newMessage.trim() ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'
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

  if (view === 'detail' && selectedCrew) {
    const hasJoined = isJoined(selectedCrew.id);

    return (
      <div className="h-screen flex flex-col bg-white" style={{ maxWidth: '448px', margin: '0 auto' }}>
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => setView('list')} className="p-1 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold flex-1">Crew Info</span>
        </div>
        <div className="flex-1 overflow-y-auto pb-24">
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
                <span className="mt-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs">
                  {selectedCrew.genre}
                </span>
              )}
              <p className="text-gray-500 mt-2">{selectedCrew.members || 1} members</p>
              <div className="flex gap-3 mt-5 w-full">
                {!hasJoined ? (
                  <button
                    onClick={() => joinCrew(selectedCrew)}
                    className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold"
                  >
                    Join Crew
                  </button>
                ) : (
                  <button
                    onClick={() => setView('chat')}
                    className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold"
                  >
                    Open Chat
                  </button>
                )}
                <button
                  onClick={() => {
                    const email = prompt("Friend's email:");
                    if (email && isValidEmail(email)) {
                      const notification = {
                        type: 'invite',
                        fromUser: user.name,
                        message: `${user.name} invited you to "${selectedCrew.name}"!`
                      };
                      storeNotification(email, notification);
                      socket.emit('new_notification', { toEmail: email, notification });
                      alert(`Invited ${email}!`);
                    }
                  }}
                  className="px-4 py-3 border border-gray-200 rounded-xl"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
              {hasJoined && (
                <button
                  onClick={() => leaveCrew(selectedCrew)}
                  className="w-full mt-3 py-2 border border-red-200 text-red-500 rounded-xl text-sm"
                >
                  Leave Crew
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold" style={{ fontFamily: 'Georgia, serif' }}>Reading Crews</span>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium"
        >
          Create Crew
        </button>
      </div>

      <div className="px-4 py-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by book, author, or genre…"
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
          />
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
            <h3 className="font-semibold mb-3">Create New Crew</h3>
            <div className="space-y-3">
              <input
                value={newCrewData.name}
                onChange={e => setNewCrewData({ ...newCrewData, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                placeholder="Book title *"
              />
              <input
                value={newCrewData.author}
                onChange={e => setNewCrewData({ ...newCrewData, author: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                placeholder="Author *"
              />
              <input
                value={newCrewData.genre}
                onChange={e => setNewCrewData({ ...newCrewData, genre: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                placeholder="Genre (optional)"
              />
              <div className="flex gap-2">
                <button
                  onClick={createCrew}
                  className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
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
            My Crews
          </h2>
          {filteredCrews.filter(c => isJoined(c.id)).length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
              <p className="text-gray-500 text-sm">No crews joined yet</p>
            </div>
          ) : (
            filteredCrews.filter(c => isJoined(c.id)).map(crew => (
              <div
                key={crew.id}
                className="bg-white rounded-xl border border-green-200 shadow-sm cursor-pointer mb-3 overflow-hidden"
                onClick={() => { setSelectedCrew(crew); setView('detail'); }}
              >
                <div className="flex items-center px-4 gap-4 py-3">
                  <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 truncate">{crew.name}</p>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">Joined</span>
                    </div>
                    <p className="text-xs text-gray-500">by {crew.author}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{crew.members || 1} members</p>
                  </div>
                </div>
                <div className="px-4 py-2 flex justify-end border-t border-gray-100">
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedCrew(crew); setView('chat'); }}
                    className="px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg text-xs font-medium"
                  >
                    Open Chat
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold mb-3">Discover Crews</h2>
          <div className="space-y-3">
            {filteredCrews.filter(c => !isJoined(c.id)).length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                <p className="text-gray-500 text-sm">No crews to discover</p>
              </div>
            ) : (
              filteredCrews.filter(c => !isJoined(c.id)).map(crew => (
                <div
                  key={crew.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm cursor-pointer overflow-hidden"
                  onClick={() => { setSelectedCrew(crew); setView('detail'); }}
                >
                  <div className="flex items-center px-4 gap-4 py-3">
                    <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{crew.name}</p>
                      <p className="text-xs text-gray-500">by {crew.author}</p>
                      {crew.genre && (
                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full inline-block mt-0.5">
                          {crew.genre}
                        </span>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{crew.members || 1} members</p>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex justify-end border-t border-gray-100">
                    <button
                      onClick={e => { e.stopPropagation(); joinCrew(crew); }}
                      className="px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold"
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
    </div>
  );
};

// ========================================
// PROFILE PAGE
// ========================================
const ProfilePage = ({ user, posts, setPage, onLogout, onUpdateUser, profileSrc, setProfileSrc, savedPosts, following, followers }) => {
  const [activeTab, setActiveTab] = useState('Posts');
  const [userStats, setUserStats] = useState(user?.stats || { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 });
  const [readingGoal, setReadingGoal] = useState(user?.readingGoal || { yearly: 0, monthly: 0 });
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [editGoal, setEditGoal] = useState(readingGoal);
  const [myBooks, setMyBooks] = useState([]);
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', rating: 5, notes: '' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const fileRef = useRef();

  const myPosts = posts.filter(p => p.userEmail === user?.email);
  const myReviews = JSON.parse(localStorage.getItem('reviews') || '[]').filter(r => r.userEmail === user?.email);
  const savedPostsList = posts.filter(p => savedPosts?.includes(p.id));

  useEffect(() => {
    const stats = JSON.parse(localStorage.getItem(getStatsKey(user.email)) || '{}');
    setUserStats(stats);
    const books = JSON.parse(localStorage.getItem(getReadingListKey(user.email)) || '[]');
    setMyBooks(books);
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
      const imgData = ev.target.result;
      setProfileSrc(imgData);
      localStorage.setItem(getProfileImageKey(user.email), imgData);

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map(u =>
        u.email === user.email ? { ...u, profileImage: imgData } : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      const updatedUser = { ...user, profileImage: imgData };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      onUpdateUser(updatedUser);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveGoal = () => {
    const updatedUser = { ...user, readingGoal: editGoal };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setReadingGoal(editGoal);
    setShowEditGoal(false);
    onUpdateUser(updatedUser);
  };

  const handleSaveProfile = () => {
    const updatedUser = { ...user, name: editName, bio: editBio };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map(u =>
      u.email === user.email ? updatedUser : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    onUpdateUser(updatedUser);
    setEditingProfile(false);
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

    const updated = [book, ...myBooks];
    setMyBooks(updated);
    localStorage.setItem(getReadingListKey(user.email), JSON.stringify(updated));

    const stats = JSON.parse(localStorage.getItem(getStatsKey(user.email)) || '{}');
    stats.booksRead = updated.length;
    localStorage.setItem(getStatsKey(user.email), JSON.stringify(stats));
    setUserStats(prev => ({ ...prev, booksRead: updated.length }));

    setNewBook({ title: '', author: '', rating: 5, notes: '' });
    setShowAddBook(false);
  };

  const handleDeleteBook = (bookId) => {
    const updated = myBooks.filter(b => b.id !== bookId);
    setMyBooks(updated);
    localStorage.setItem(getReadingListKey(user.email), JSON.stringify(updated));

    const stats = JSON.parse(localStorage.getItem(getStatsKey(user.email)) || '{}');
    stats.booksRead = updated.length;
    localStorage.setItem(getStatsKey(user.email), JSON.stringify(stats));
    setUserStats(prev => ({ ...prev, booksRead: updated.length }));
  };

  const tabs = ['Posts', 'Reviews', 'Books Read', 'Saved Posts'];

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
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
              <img src={profileSrc} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-orange-200" />
            ) : (
              <Avatar initials={user?.name} size="xl" />
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          <div className="flex-1 min-w-0">
            {editingProfile ? (
              <div className="space-y-2">
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                  placeholder="Your name"
                />
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none resize-none"
                  placeholder="Your bio…"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                <p className="text-sm text-gray-500">@{user?.name?.toLowerCase().replace(/\s/g, '')}</p>
                <p className="text-sm text-gray-600 mt-1 italic">"{user?.bio || 'Reading is my superpower'}"</p>

                <div className="flex gap-4 mt-2">
                  <div className="text-center">
                    <p className="font-bold text-gray-900">{followers?.length || 0}</p>
                    <p className="text-xs text-gray-500">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900">{following?.length || 0}</p>
                    <p className="text-xs text-gray-500">Following</p>
                  </div>
                </div>

                <button
                  onClick={() => setEditingProfile(true)}
                  className="mt-3 px-4 py-1.5 border border-orange-200 text-orange-600 rounded-lg text-sm font-medium flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold">Reading Goal {new Date().getFullYear()}</h3>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Yearly Goal</label>
                  <input
                    type="number"
                    value={editGoal.yearly}
                    onChange={e => setEditGoal({ ...editGoal, yearly: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
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
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
                    min="0"
                    max="20"
                  />
                </div>
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
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold">
                  {readingGoal.yearly > 0 ? `${userStats.booksRead}/${readingGoal.yearly} books` : 'No goal set'}
                </span>
              </div>
              {readingGoal.yearly > 0 && (
                <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${Math.min((userStats.booksRead / readingGoal.yearly) * 100, 100)}%` }}
                  />
                </div>
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

        <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 text-sm pb-2.5 px-3 font-medium border-b-2 transition ${
                activeTab === tab ? 'text-orange-500 border-orange-500' : 'text-gray-500 border-transparent'
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
                <button onClick={() => setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">
                  Create First Post
                </button>
              </div>
            ) : (
              myPosts.map(post => (
                <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                  {post.bookName && <p className="text-xs text-orange-500">📖 {post.bookName}</p>}
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-100 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{post.likes || 0}</span>
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
                <button onClick={() => setPage('reviews')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">
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
                      <StarRating rating={review.rating} size="xs" readonly />
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
              <p className="text-sm font-semibold text-gray-700">{myBooks.length} books read</p>
              <button
                onClick={() => setShowAddBook(!showAddBook)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                {showAddBook ? 'Cancel' : 'Add Book'}
              </button>
            </div>

            {showAddBook && (
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="space-y-3">
                  <input
                    value={newBook.title}
                    onChange={e => setNewBook({ ...newBook, title: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                    placeholder="Book title *"
                  />
                  <input
                    value={newBook.author}
                    onChange={e => setNewBook({ ...newBook, author: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
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
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none resize-none"
                    placeholder="Notes (optional)"
                    rows={2}
                  />
                  <button
                    onClick={handleAddBook}
                    className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium"
                  >
                    Add to My Books
                  </button>
                </div>
              </div>
            )}

            {myBooks.length === 0 ? (
              <div className="text-center py-8">
                <BookMarked className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No books tracked yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myBooks.map(book => (
                  <div key={book.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-start gap-3">
                    <DynamicBookCover title={book.title} author={book.author} size="sm" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900">{book.title}</h3>
                      <p className="text-xs text-gray-500">{book.author}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <StarRating rating={book.rating} size="xs" readonly />
                      </div>
                      {book.notes && <p className="text-xs text-gray-600 mt-1 italic">"{book.notes}"</p>}
                      <p className="text-xs text-gray-400 mt-1">{new Date(book.addedAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => handleDeleteBook(book.id)} className="p-1 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Saved Posts' && (
          <div className="space-y-4">
            {savedPostsList.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No saved posts yet</p>
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
// MAIN APP COMPONENT
// ========================================
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [profileSrc, setProfileSrc] = useState(null);
  const [page, setPage] = useState('home');
  const [showNav, setShowNav] = useState(true);
  const [posts, setPosts] = useState([]);
  const [crews, setCrews] = useState([
    { id: 1, name: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', members: 1, chats: 0, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date().toISOString() },
    { id: 2, name: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', members: 1, chats: 0, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date().toISOString() },
    { id: 3, name: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', members: 1, chats: 0, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date().toISOString() },
    { id: 4, name: 'The Alchemist', author: 'Paulo Coelho', genre: 'Fiction', members: 1, chats: 0, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date().toISOString() },
    { id: 5, name: 'Tuesdays with Morrie', author: 'Mitch Albom', genre: 'Inspiration', members: 1, chats: 0, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date().toISOString() }
  ]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [currentToast, setCurrentToast] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      setLoggedIn(true);

      setFollowing(JSON.parse(localStorage.getItem(getFollowingKey(u.email)) || '[]'));
      setFollowers(JSON.parse(localStorage.getItem(getFollowersKey(u.email)) || '[]'));
      setBlocked(JSON.parse(localStorage.getItem(getBlockedKey(u.email)) || '[]'));
      setSavedPosts(JSON.parse(localStorage.getItem(getSavedPostsKey(u.email)) || '[]'));

      const img = localStorage.getItem(getProfileImageKey(u.email));
      if (img) setProfileSrc(img);
    }

    const storedCrews = JSON.parse(localStorage.getItem('crews') || '[]');
    if (storedCrews.length > 0) setCrews(storedCrews);

    const storedPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    setPosts(storedPosts);

    setLoading(false);
  }, []);

  // Notification polling and socket listeners
  useEffect(() => {
    if (!user) return;

    const updateNotificationCount = () => {
      const notifs = JSON.parse(localStorage.getItem(getNotificationsKey(user.email)) || '[]');
      const unread = notifs.filter(n => !n.read).length;
      setNotificationCount(unread);
    };

    updateNotificationCount();

    // Socket listeners
    socket.on('new_notification', (notification) => {
      if (notification.toEmail === user.email) {
        storeNotification(user.email, notification);
        setCurrentToast(notification);
        updateNotificationCount();
      }
    });

    socket.on('post_liked', ({ postId, likes }) => {
      setPosts(prev => prev.map(p => (p._id || p.id) === postId ? { ...p, likes } : p));
    });

    socket.on('new_comment', ({ postId }) => {
      // Refresh comments logic could be added here
    });

    socket.on('new_post', (post) => {
      if (!blocked.includes(post.userEmail)) {
        setPosts(prev => [post, ...prev]);
      }
    });

    socket.on('post_deleted', ({ postId }) => {
      setPosts(prev => prev.filter(p => (p._id || p.id) !== postId));
    });

    // Poll for notification changes every 30 seconds as backup
    const interval = setInterval(updateNotificationCount, 30000);

    // Listen for storage events (cross-tab)
    const handleStorage = (e) => {
      if (e.key?.includes('_notifications')) {
        updateNotificationCount();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Custom event for same-tab notifications
    const handleCustomNotif = (e) => {
      if (e.detail?.targetEmail === user.email) {
        setCurrentToast(e.detail.notification);
        updateNotificationCount();
      }
    };
    window.addEventListener('rc:notification', handleCustomNotif);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('rc:notification', handleCustomNotif);
      socket.off('new_notification');
      socket.off('post_liked');
      socket.off('new_comment');
      socket.off('new_post');
      socket.off('post_deleted');
    };
  }, [user, blocked]);

  useEffect(() => {
    setShowNav(page !== 'post' && !viewingUser);
  }, [page, viewingUser]);

  const handleLogin = (userData) => {
    setUser(userData);
    setLoggedIn(true);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setPage('home');
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUser(null);
    setPage('home');
    localStorage.removeItem('currentUser');
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const handlePost = (postData) => {
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    allPosts.unshift(postData);
    if (allPosts.length > 500) allPosts.length = 500;
    localStorage.setItem('allPosts', JSON.stringify(allPosts));
    setPosts(allPosts);

    const stats = JSON.parse(localStorage.getItem(getStatsKey(user.email)) || '{}');
    stats.postsCreated = (stats.postsCreated || 0) + 1;
    localStorage.setItem(getStatsKey(user.email), JSON.stringify(stats));
    setUser(prev => ({ ...prev, stats }));
    localStorage.setItem('currentUser', JSON.stringify({ ...user, stats }));
  };

  const handleDeletePost = (post) => {
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]').filter(p => p.id !== post.id);
    localStorage.setItem('allPosts', JSON.stringify(allPosts));
    setPosts(allPosts);

    const stats = JSON.parse(localStorage.getItem(getStatsKey(user.email)) || '{}');
    stats.postsCreated = Math.max((stats.postsCreated || 0) - 1, 0);
    localStorage.setItem(getStatsKey(user.email), JSON.stringify(stats));
  };

  const handleSavePost = (post) => {
    const current = JSON.parse(localStorage.getItem(getSavedPostsKey(user.email)) || '[]');
    const updated = current.includes(post.id)
      ? current.filter(id => id !== post.id)
      : [...current, post.id];
    localStorage.setItem(getSavedPostsKey(user.email), JSON.stringify(updated));
    setSavedPosts(updated);
  };

  const handleReshare = (originalPost, comment) => {
    // Update original post's reshare count
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const updatedPosts = allPosts.map(p =>
      p.id === originalPost.id ? { ...p, reshareCount: (p.reshareCount || 0) + 1 } : p
    );
    localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
    setPosts(updatedPosts);

    // Create reshare post
    const resharePost = {
      id: generateId(),
      content: originalPost.content,
      bookName: originalPost.bookName,
      author: originalPost.author,
      image: originalPost.image,
      isPublic: true,
      isReshare: true,
      originalPost: {
        id: originalPost.id,
        userName: originalPost.userName,
        userEmail: originalPost.userEmail,
        content: originalPost.content
      },
      reshareComment: comment,
      userName: user.name,
      userEmail: user.email,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      reshareCount: 0
    };

    handlePost(resharePost);

    // Notify original author
    if (originalPost.userEmail !== user.email) {
      const notification = {
        type: 'reshare',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} reshared your post`,
        postId: originalPost.id
      };
      storeNotification(originalPost.userEmail, notification);
      socket.emit('new_notification', { toEmail: originalPost.userEmail, notification });
    }
  };

  const handleFollow = (targetEmail, targetName) => {
    const currentFollowing = JSON.parse(localStorage.getItem(getFollowingKey(user.email)) || '[]');
    const isFollowing = currentFollowing.includes(targetEmail);

    if (isFollowing) {
      // Unfollow
      const updatedFollowing = currentFollowing.filter(e => e !== targetEmail);
      localStorage.setItem(getFollowingKey(user.email), JSON.stringify(updatedFollowing));
      setFollowing(updatedFollowing);

      const targetFollowers = JSON.parse(localStorage.getItem(getFollowersKey(targetEmail)) || '[]');
      const updatedTargetFollowers = targetFollowers.filter(e => e !== user.email);
      localStorage.setItem(getFollowersKey(targetEmail), JSON.stringify(updatedTargetFollowers));
    } else {
      // Follow
      const updatedFollowing = [...currentFollowing, targetEmail];
      localStorage.setItem(getFollowingKey(user.email), JSON.stringify(updatedFollowing));
      setFollowing(updatedFollowing);

      const targetFollowers = JSON.parse(localStorage.getItem(getFollowersKey(targetEmail)) || '[]');
      if (!targetFollowers.includes(user.email)) {
        targetFollowers.push(user.email);
        localStorage.setItem(getFollowersKey(targetEmail), JSON.stringify(targetFollowers));
      }

      // Send notification
      const notification = {
        type: 'follow',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} started following you`
      };
      storeNotification(targetEmail, notification);
      socket.emit('new_notification', { toEmail: targetEmail, notification });
    }
  };

  const handleBlock = (targetEmail) => {
    const currentBlocked = JSON.parse(localStorage.getItem(getBlockedKey(user.email)) || '[]');
    const isBlocked = currentBlocked.includes(targetEmail);

    if (isBlocked) {
      // Unblock
      const updatedBlocked = currentBlocked.filter(e => e !== targetEmail);
      localStorage.setItem(getBlockedKey(user.email), JSON.stringify(updatedBlocked));
      setBlocked(updatedBlocked);
    } else {
      // Block
      const updatedBlocked = [...currentBlocked, targetEmail];
      localStorage.setItem(getBlockedKey(user.email), JSON.stringify(updatedBlocked));
      setBlocked(updatedBlocked);

      // Also unfollow if following
      const currentFollowing = JSON.parse(localStorage.getItem(getFollowingKey(user.email)) || '[]');
      if (currentFollowing.includes(targetEmail)) {
        const updatedFollowing = currentFollowing.filter(e => e !== targetEmail);
        localStorage.setItem(getFollowingKey(user.email), JSON.stringify(updatedFollowing));
        setFollowing(updatedFollowing);
      }
    }
  };

  const filteredPosts = posts.filter(p => !blocked.includes(p.userEmail));

  if (loading) return <LoadingSpinner size="xl" fullScreen />;
  if (!loggedIn) return <LoginPage onLogin={handleLogin} />;

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

        {viewingUser && (
          <div className="fixed inset-0 bg-white z-[60] overflow-y-auto" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
              <button onClick={() => setViewingUser(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="font-semibold">{viewingUser.name}'s Profile</h2>
              <div className="w-6" />
            </div>
            <div className="p-4">
              <div className="flex items-start gap-4 mb-5">
                <Avatar initials={viewingUser.name} size="xl" />
                <div>
                  <h2 className="text-xl font-bold">{viewingUser.name}</h2>
                  <p className="text-sm text-gray-500">@{viewingUser.name?.toLowerCase().replace(/\s/g, '')}</p>
                  {viewingUser.email !== user.email && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleFollow(viewingUser.email, viewingUser.name)}
                        className={`flex-1 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 ${
                          following.includes(viewingUser.email)
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-orange-500 text-white'
                        }`}
                      >
                        {following.includes(viewingUser.email) ? (
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
                        onClick={() => handleBlock(viewingUser.email)}
                        className={`px-4 py-2 rounded-xl font-semibold text-sm ${
                          blocked.includes(viewingUser.email)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {blocked.includes(viewingUser.email) ? 'Unblock' : 'Block'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {posts.filter(p => p.userEmail === viewingUser.email).slice(0, 5).map(p => (
                  <div key={p.id} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                    <p className="text-sm text-gray-700 line-clamp-2">{p.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{p.likes || 0}</span>
                      <span>{formatTimeAgo(p.createdAt)}</span>
                    </div>
                  </div>
                ))}
                {posts.filter(p => p.userEmail === viewingUser.email).length === 0 && (
                  <div className="text-center py-8">
                    <Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No posts yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!viewingUser && (
          <>
            {page === 'home' && (
              <HomePage
                user={user}
                posts={filteredPosts}
                setPosts={setPosts}
                crews={crews}
                setPage={setPage}
                updateNotificationCount={() => {
                  const notifs = JSON.parse(localStorage.getItem(getNotificationsKey(user.email)) || '[]');
                  setNotificationCount(notifs.filter(n => !n.read).length);
                }}
                profileSrc={profileSrc}
                savedPosts={savedPosts}
                onSavePost={handleSavePost}
                onResharePost={handleReshare}
                onDeletePost={handleDeletePost}
                onFollow={handleFollow}
                following={following}
                onBlock={handleBlock}
                blockedUsers={blocked}
                onViewUserProfile={(email, name) => setViewingUser({ email, name })}
                onViewBookDetails={(book) => {
                  // This will be handled by HomePage's internal state
                }}
              />
            )}

            {page === 'post' && (
              <PostPage user={user} onPost={handlePost} setPage={setPage} />
            )}

            {page === 'reviews' && (
              <ReviewsPage
                user={user}
                setPage={setPage}
                updateNotificationCount={() => {
                  const notifs = JSON.parse(localStorage.getItem(getNotificationsKey(user.email)) || '[]');
                  setNotificationCount(notifs.filter(n => !n.read).length);
                }}
                onViewUserProfile={(email, name) => setViewingUser({ email, name })}
              />
            )}

            {page === 'explore' && (
              <ExplorePage
                user={user}
                setPage={setPage}
                onCreateCrew={(book) => {
                  const newCrew = {
                    id: Date.now(),
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
                  setCrews(updatedCrews);
                  localStorage.setItem('crews', JSON.stringify(updatedCrews));
                  setPage('crews');
                }}
              />
            )}

            {page === 'crews' && (
              <CrewsPage
                user={user}
                crews={crews}
                setPage={setPage}
                updateNotificationCount={() => {
                  const notifs = JSON.parse(localStorage.getItem(getNotificationsKey(user.email)) || '[]');
                  setNotificationCount(notifs.filter(n => !n.read).length);
                }}
                onViewUserProfile={(email, name) => setViewingUser({ email, name })}
              />
            )}

            {page === 'profile' && (
              <ProfilePage
                user={user}
                posts={filteredPosts}
                setPage={setPage}
                onLogout={handleLogout}
                onUpdateUser={handleUpdateUser}
                profileSrc={profileSrc}
                setProfileSrc={setProfileSrc}
                savedPosts={savedPosts}
                following={following}
                followers={followers}
              />
            )}

            {page === 'notifications' && (
              <NotificationsPage
                user={user}
                onClose={() => {
                  setPage('home');
                  const notifs = JSON.parse(localStorage.getItem(getNotificationsKey(user.email)) || '[]');
                  setNotificationCount(notifs.filter(n => !n.read).length);
                }}
                updateNotificationCount={() => {
                  const notifs = JSON.parse(localStorage.getItem(getNotificationsKey(user.email)) || '[]');
                  setNotificationCount(notifs.filter(n => !n.read).length);
                }}
              />
            )}

            <BottomNav
              active={page}
              setPage={setPage}
              unreadCount={notificationCount}
              show={showNav}
            />
          </>
        )}
      </div>
    </div>
  );
}

// Global styles
if (typeof document !== 'undefined' && !document.querySelector('style[data-rc]')) {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { transform: translate(-50%, -100%); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
    .animate-slideDown {
      animation: slideDown 0.3s ease-out;
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
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    .animate-bounce {
      animation: bounce 1s infinite;
    }
  `;
  style.setAttribute('data-rc', 'true');
  document.head.appendChild(style);
}