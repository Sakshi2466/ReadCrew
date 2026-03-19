// App.jsx - Complete ReadCrew App with All Features Fixed + System Design Patches
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen, Home, Search, Edit3, Users, User, Bell, Settings,
  Heart, MessageCircle, Bookmark, Share2, Star, Plus, ChevronRight,
  X, Send, Image as ImageIcon, ChevronLeft, LogOut, Camera, MoreHorizontal,
  Sparkles, Lock, Eye, EyeOff, UserPlus, Gift, ThumbsUp, ThumbsDown,
  Trash2, Edit, Target, Check, ArrowLeft, Clock, TrendingUp, Menu, Upload,
  Calendar, Award, MessageSquare, Globe, ChevronDown, Filter, Play, Pause,
  Volume2, Mic, Paperclip, Mail, Phone, Leaf, ExternalLink,
  Link2, Instagram, Facebook, Twitter, AtSign, Flag, Pin, Smile,
  CheckCheck, BookMarked, PlusCircle, MapPin, Navigation, Map, Repeat,
  UserCheck, UserMinus, Hash, AtSign as AtIcon, Wifi, WifiOff,
  List, Grid, ThumbsUp as ThumbsUpIcon, ThumbsDown as ThumbsDownIcon,
  AlertCircle, CheckCircle, Info, HelpCircle, Coffee, Music,
  Film, Camera as CameraIcon, Video, Image as ImageIcon2,
  Download, Upload as UploadIcon, RefreshCw, RotateCcw,
  Maximize2, Minimize2, VolumeX, Volume1, Volume2 as Volume2Icon,
  SkipBack, SkipForward, Circle, Square, Triangle,
  Sun, Moon, Cloud, CloudRain, CloudSnow, CloudLightning,
  Wind, Droplets, Thermometer, Sunrise, Sunset,
  Compass, Anchor, Ship, Plane, Train, Car, Bike,
  Bus, Truck, Rocket, Satellite, Globe as GlobeIcon,
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

// API imports
import axios from 'axios';
import { io } from 'socket.io-client';

// ========================================
// CONFIGURATION
// ========================================
const API_URL = process.env.REACT_APP_API_URL || 'https://versal-book-app.onrender.com';

// Initialize socket with proper error handling and reconnection
const socket = io(API_URL, { 
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
});

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
// NOTIFICATION TOAST COMPONENT
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

// Add animation keyframes
if (typeof document !== 'undefined' && !document.querySelector('style[data-notification-animation]')) {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { transform: translate(-50%, -100%); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
  `;
  style.setAttribute('data-notification-animation', 'true');
  document.head.appendChild(style);
}

// ========================================
// DYNAMIC BOOK COVER — Google Books with fallbacks
// ========================================
const DynamicBookCover = ({ title, author, className = 'w-32 h-40', onClick, size = 'md' }) => {
  const [coverUrl, setCoverUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const sizeMap = { xs: 'w-12 h-16', sm: 'w-16 h-20', md: 'w-24 h-32', lg: 'w-32 h-40', xl: 'w-40 h-48' };
  const coverClassName = sizeMap[size] || className;

  useEffect(() => {
    if (!title) { setError(true); setIsLoading(false); return; }
    fetchBookCover();
  }, [title, author]);

  const fetchBookCover = async () => {
    setIsLoading(true); setError(false);
    const query = author ? `${title} ${author}`.trim() : title;

    // Strategy 1: Google Books API
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1&projection=lite`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        const data = await res.json();
        const links = data.items?.[0]?.volumeInfo?.imageLinks;
        if (links) {
          const raw = links.extraLarge || links.large || links.medium || links.thumbnail || links.smallThumbnail;
          if (raw) {
            const clean = raw.replace('http:', 'https:').replace('&edge=curl', '').replace(/zoom=\d/, 'zoom=3');
            setCoverUrl(clean);
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      // 429 or other error - fall through to Open Library
    }

    // Strategy 2: Open Library
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        const data = await res.json();
        const book = data.docs?.[0];
        let cover = null;
        if (book?.cover_i) cover = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
        else if (book?.isbn?.length > 0) cover = `https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-L.jpg`;
        else if (book?.cover_edition_key) cover = `https://covers.openlibrary.org/b/olid/${book.cover_edition_key}-L.jpg`;
        if (cover) { setCoverUrl(cover); setIsLoading(false); return; }
      }
    } catch { /* fall through */ }

    // Strategy 3: Open Library title search directly
    try {
      const titleOnly = encodeURIComponent(title.split(' ').slice(0, 3).join(' '));
      const res = await fetch(`https://covers.openlibrary.org/b/title/${titleOnly}-L.jpg`, { signal: AbortSignal.timeout(3000) });
      if (res.ok && res.headers.get('content-type')?.startsWith('image')) {
        setCoverUrl(res.url); setIsLoading(false); return;
      }
    } catch { /* fall through */ }

    setError(true);
    setIsLoading(false);
  };

  const getFallbackColor = () => {
    const colors = ['#7B9EA6','#C8622A','#8B5E3C','#E8A87C','#C4A882','#2C3E50','#E74C3C','#3498DB','#9B59B6','#1ABC9C','#27AE60','#F39C12','#D35400','#8E44AD','#16A085'];
    const hash = (title||'').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const initials = title ? title.slice(0, 2).toUpperCase() : 'BK';

  if (isLoading) return (
    <div className={`${coverClassName} bg-gray-200 rounded-xl flex items-center justify-center animate-pulse`} onClick={onClick}>
      <BookOpen className="w-8 h-8 text-gray-400" />
    </div>
  );

  if (error || !coverUrl) return (
    <div className={`${coverClassName} rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg cursor-pointer hover:scale-105 transition-transform`}
      style={{ backgroundColor: getFallbackColor() }} onClick={onClick}>
      <span className="text-2xl">{initials}</span>
      <BookOpen className="w-5 h-5 mt-1 opacity-60" />
    </div>
  );

  return (
    <div className={`${coverClassName} relative group cursor-pointer rounded-xl overflow-hidden bg-gray-100`} onClick={onClick}>
      <img src={coverUrl} alt=""
        className="w-full h-full object-cover shadow-lg group-hover:scale-105 transition-transform"
        onError={() => { setCoverUrl(null); setError(true); }}
        loading="lazy" referrerPolicy="no-referrer"
        style={{ display: 'block' }} />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
    </div>
  );
};

// ─── AVATAR ────────────────────────────────────────────────────────────────
const Avatar = ({ initials, size = 'md', color = '#C8622A', src, online, onClick }) => {
  const sizes = { xs: 'w-7 h-7 text-xs', sm: 'w-9 h-9 text-sm', md: 'w-11 h-11 text-base', lg: 'w-16 h-16 text-xl', xl: 'w-20 h-20 text-2xl' };
  
  const getGradient = () => {
    const gradients = [
      'from-orange-500 to-red-500',
      'from-blue-500 to-purple-500',
      'from-green-500 to-teal-500',
      'from-purple-500 to-pink-500',
      'from-yellow-500 to-orange-500',
      'from-indigo-500 to-blue-500'
    ];
    const hash = (initials || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  return (
    <div className="relative shrink-0 cursor-pointer" onClick={onClick}>
      {src ? (
        <img src={src} alt={initials} className={`${sizes[size]} rounded-full object-cover border-2 border-orange-200 hover:border-orange-400 transition`} />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${getGradient()} flex items-center justify-center font-semibold text-white shadow-md`}>
          {initials?.slice(0, 2).toUpperCase()}
        </div>
      )}
      {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>}
    </div>
  );
};

// ─── STAR RATING ──────────────────────────────────────────────────────────
const StarRating = ({ rating = 0, onChange, size = 'sm', readonly = false }) => {
  const sz = size === 'sm' ? 'w-4 h-4' : size === 'xs' ? 'w-3 h-3' : 'w-6 h-6';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star 
          key={i} 
          className={`${sz} ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} 
            ${onChange && !readonly ? 'cursor-pointer hover:scale-110 transition' : ''}`} 
          onClick={() => onChange?.(i)} 
        />
      ))}
    </div>
  );
};

// ─── LOADING SPINNER ──────────────────────────────────────────────────────
const LoadingSpinner = ({ size = 'md', color = 'orange', fullScreen = false }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12', xl: 'w-16 h-16' };
  const colors = { orange: 'border-orange-500', blue: 'border-blue-500', purple: 'border-purple-500', green: 'border-green-500' };
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className={`${sizes[size]} border-4 border-t-transparent ${colors[color]} rounded-full animate-spin`} />
      </div>
    );
  }
  
  return <div className={`${sizes[size]} border-4 border-t-transparent ${colors[color]} rounded-full animate-spin`}></div>;
};

// ========================================
// BOOK DETAILS MODAL
// ========================================
const BookDetailsModal = ({ book, onClose, onCreateCrew }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookDetails();
  }, [book]);

  const fetchBookDetails = async () => {
    try {
      const query = `${book.title} ${book.author || ''}`;
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`
      );
      
      if (res.ok) {
        const data = await res.json();
        if (data.items?.[0]) {
          const item = data.items[0].volumeInfo;
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
            previewLink: item.previewLink,
            infoLink: item.infoLink,
            language: item.language
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch book details:', error);
    } finally {
      setLoading(false);
    }
  };

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
              {details.publisher && (
                <div className="bg-gray-50 rounded-lg p-3 text-center col-span-2">
                  <p className="text-gray-500 text-xs">Publisher</p>
                  <p className="font-semibold">{details.publisher}</p>
                </div>
              )}
              {details.language && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-gray-500 text-xs">Language</p>
                  <p className="font-semibold uppercase">{details.language}</p>
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
// USER PROFILE MODAL (Quick View)
// ========================================
const UserProfileModal = ({ userEmail, userName, currentUser, onClose, onFollow, isFollowing, onViewFullProfile, onBlock, isBlocked }) => {
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [stats, setStats] = useState({ posts: 0, reviews: 0, followers: 0, following: 0 });

  useEffect(() => {
    loadUserData();
  }, [userEmail]);

  const loadUserData = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.email === userEmail);
    if (found) {
      setUserData(found);
    }

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
    setStats({
      followers: followersWithDetails.length,
      following: followingWithDetails.length
    });

    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const posts = allPosts
      .filter(p => p.userEmail === userEmail)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setUserPosts(posts.slice(0, 5));
    setStats(prev => ({ ...prev, posts: posts.length }));

    const allReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    const reviews = allReviews
      .filter(r => r.userEmail === userEmail)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setUserReviews(reviews.slice(0, 3));
    setStats(prev => ({ ...prev, reviews: reviews.length }));
  };

  const formatTimeAgo = (ts) => {
    const diff = Date.now() - new Date(ts);
    const mins = Math.floor(diff / 60000), hrs = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  const UserListModal = ({ title, users, onClose, onUserClick }) => (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
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
      {showFollowers && (
        <UserListModal
          title="Followers"
          users={followers}
          onClose={() => setShowFollowers(false)}
          onUserClick={onViewFullProfile}
        />
      )}
      {showFollowing && (
        <UserListModal
          title="Following"
          users={following}
          onClose={() => setShowFollowing(false)}
          onUserClick={onViewFullProfile}
        />
      )}

      <div className="fixed inset-0 bg-black/50 z-[75] flex items-center justify-center p-4 overflow-y-auto" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
        <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
            <h3 className="font-bold">User Profile</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="p-5">
            <div className="flex items-center gap-4 mb-6">
              <Avatar initials={userName} size="lg" />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 truncate">{userName}</h2>
                <p className="text-sm text-gray-500">@{userName?.toLowerCase().replace(/\s/g, '')}</p>
                {userData?.bio && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{userData.bio}</p>
                )}
                
                <div className="flex gap-4 mt-2">
                  <button 
                    onClick={() => setShowFollowers(true)}
                    className="text-center hover:opacity-75 transition"
                  >
                    <p className="font-bold text-gray-900">{stats.followers}</p>
                    <p className="text-xs text-gray-500">Followers</p>
                  </button>
                  <button 
                    onClick={() => setShowFollowing(true)}
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
                  className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                    isFollowing 
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                      : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
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
                  className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
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
    </>
  );
};

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
    const n = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    setNotifications(n);
  }, [user.email]);
  
  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: `user_${user.email}_notifications` }));
    updateNotificationCount?.();
  };
  
  const icons = { 
    like: <Heart className="w-4 h-4 text-red-500" />, 
    comment: <MessageCircle className="w-4 h-4 text-blue-500" />, 
    message: <MessageSquare className="w-4 h-4 text-emerald-500" />, 
    invite: <UserPlus className="w-4 h-4 text-purple-500" />, 
    follow: <UserCheck className="w-4 h-4 text-orange-500" />,
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
    follow: 'bg-orange-100',
    reshare: 'bg-indigo-100',
    mention: 'bg-amber-100',
    join: 'bg-blue-100',
    review: 'bg-yellow-100'
  };
  
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
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
            {notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((notif) => (
              <div key={notif.id} className={`p-4 ${notif.read ? 'bg-white' : 'bg-orange-50'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${bgColors[notif.type] || 'bg-gray-100'}`}>
                    {icons[notif.type] || <Bell className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 leading-relaxed">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(notif.timestamp).toLocaleString()}</p>
                  </div>
                  {!notif.read && <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>}
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
// SHARE MODAL
// ========================================
const ShareModal = ({ post, onClose }) => {
  const shareUrl = window.location.href;
  const shareText = `Check out this post by ${post.userName}: "${post.content?.substring(0, 50)}..."`;
  
  const handlers = {
    whatsapp: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank'),
    facebook: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank'),
    twitter: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank'),
    copyLink: () => { navigator.clipboard.writeText(shareUrl); alert('Link copied!'); }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 overflow-y-auto" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
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
              <button key={key} onClick={handlers[key]} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: color }}>
                  {letter}
                </div>
                <span className="text-xs text-gray-600 capitalize">{key}</span>
              </button>
            ))}
          </div>
          <button 
            onClick={handlers.copyLink} 
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

  const handleReshare = () => {
    onReshare(post, comment);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 overflow-y-auto" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
          <h3 className="font-semibold">Reshare Post</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">Add a comment (optional):</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 resize-none"
              placeholder="What are your thoughts?"
              rows={3}
            />
          </div>
          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <p className="text-xs text-gray-500 mb-1">
              Original post by <span className="font-semibold">{post.userName}</span>:
            </p>
            <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
          </div>
          <button
            onClick={handleReshare}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
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
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 overflow-y-auto" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
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
// FIXED COMMENT RENDERING - Max 2 levels deep
// ========================================
const CommentItem = ({ comment, postId, currentUser, onReply, onLike, onDelete, onViewProfile }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const loadReplies = async () => {
    setLoadingReplies(true);
    try {
      const res = await axios.get(`${API_URL}/api/social/comments/${comment.id}/replies`);
      if (res.data.success) {
        setReplies(res.data.replies);
      }
    } catch (error) {
      console.error('Failed to load replies:', error);
      const saved = JSON.parse(localStorage.getItem(`comment_${comment.id}_replies`) || '[]');
      setReplies(saved);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    
    try {
      const res = await axios.post(`${API_URL}/api/social/posts/${postId}/comments`, {
        content: replyText,
        parentCommentId: comment.id,
        userEmail: currentUser.email,
        userName: currentUser.name
      });
      
      if (res.data.success) {
        setReplies(prev => [...prev, res.data.comment]);
        setReplyText('');
        setShowReplyInput(false);
        if (!showReplies) {
          setShowReplies(true);
        }
      }
    } catch (error) {
      console.error('Failed to post reply:', error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <button onClick={() => onViewProfile(comment.userEmail, comment.userName)}>
          <Avatar initials={comment.userName} size="sm" src={comment.userPhoto} />
        </button>
        <div className="flex-1">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <button 
                onClick={() => onViewProfile(comment.userEmail, comment.userName)}
                className="font-semibold text-sm hover:underline"
              >
                {comment.userName}
              </button>
              <span className="text-xs text-gray-400">{formatTimeAgo(comment.timestamp)}</span>
            </div>
            <p className="text-sm text-gray-800">{comment.content}</p>
          </div>
          <div className="flex items-center gap-4 mt-1 ml-2">
            <button
              onClick={() => onLike(comment.id)}
              className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
            >
              <Heart className="w-3 h-3" />
              {comment.likes || 0}
            </button>
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-xs text-gray-500 hover:text-orange-500"
            >
              Reply
            </button>
            {comment.userEmail === currentUser.email && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                Delete
              </button>
            )}
          </div>
          
          {showReplyInput && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-1 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-300"
              />
              <button
                onClick={handleReplySubmit}
                disabled={!replyText.trim()}
                className="px-3 py-1 bg-orange-500 text-white rounded-lg text-sm disabled:opacity-50"
              >
                Reply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Show replies toggle */}
      {comment.repliesCount > 0 && (
        <div className="ml-12">
          {!showReplies ? (
            <button
              onClick={() => { loadReplies(); setShowReplies(true); }}
              className="text-xs text-orange-500 font-medium flex items-center gap-1"
            >
              <ChevronDown className="w-3 h-3" />
              View {comment.repliesCount} {comment.repliesCount === 1 ? 'reply' : 'replies'}
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowReplies(false)}
                className="text-xs text-gray-500 font-medium flex items-center gap-1 mb-2"
              >
                <ChevronDown className="w-3 h-3 rotate-180" />
                Hide replies
              </button>
              <div className="space-y-3">
                {loadingReplies ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  replies.map(reply => (
                    <div key={reply.id} className="flex gap-3">
                      <button onClick={() => onViewProfile(reply.userEmail, reply.userName)}>
                        <Avatar initials={reply.userName} size="xs" src={reply.userPhoto} />
                      </button>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <button 
                              onClick={() => onViewProfile(reply.userEmail, reply.userName)}
                              className="font-semibold text-xs hover:underline"
                            >
                              {reply.userName}
                            </button>
                            <span className="text-xs text-gray-400">{formatTimeAgo(reply.timestamp)}</span>
                          </div>
                          <p className="text-sm text-gray-800">{reply.content}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 ml-1">
                          <button
                            onClick={() => onLike(reply.id)}
                            className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
                          >
                            <Heart className="w-2.5 h-2.5" />
                            {reply.likes || 0}
                          </button>
                          {reply.userEmail === currentUser.email && (
                            <button
                              onClick={() => onDelete(reply.id)}
                              className="text-xs text-gray-400 hover:text-red-500"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ========================================
// INLINE POST CARD with fixed comment loading
// ========================================
const InlinePostCard = ({ 
  post, user, profileSrc, updateNotificationCount, onShare, onReshareClick, 
  onSaveToggle, isSaved, onDelete, onFollow, isFollowing, onBlock, isBlocked,
  onViewUserProfile, onViewBookDetails
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likedComments, setLikedComments] = useState(new Set());
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    loadLikedState();
  }, [post.id, user.email, user.id]);

  const loadLikedState = () => {
    // FIX: Use user.email consistently for all localStorage keys
    const liked = JSON.parse(localStorage.getItem(`user_${user.email}_likedComments`) || '[]');
    setLikedComments(new Set(liked));
    
    const likedPosts = JSON.parse(localStorage.getItem(`user_${user.email}_likedPosts`) || '[]');
    setIsLiked(likedPosts.includes(post.id));
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const res = await axios.get(`${API_URL}/api/social/posts/${post.id}/comments`);
      if (res.data.success) {
        setComments(res.data.comments);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      const saved = JSON.parse(localStorage.getItem(`post_${post.id}_comments`) || '[]');
      setComments(saved);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    if (!showComments && comments.length === 0) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const handleLikePost = async () => {
    if (isLiked) return;
    setIsLiked(true);
    setLikeCount(p => p + 1);
    
    try {
      await axios.post(`${API_URL}/api/social/posts/${post.id}/like`, {
        userEmail: user.email,
        userName: user.name
      });

      // FIX: Use user.email consistently
      const likedPosts = JSON.parse(localStorage.getItem(`user_${user.email}_likedPosts`) || '[]');
      likedPosts.push(post.id);
      localStorage.setItem(`user_${user.email}_likedPosts`, JSON.stringify(likedPosts));

      // Emit socket event for real-time update
      socket.emit('post:liked', {
        postId: post.id,
        userId: user.email,
        liked: true
      });
    } catch (error) {
      console.error('Failed to like post:', error);
    }

    if (post.userEmail !== user.email) {
      const notif = { 
        id: Date.now(), 
        type: 'like', 
        fromUser: user.name, 
        fromUserEmail: user.email,
        message: `${user.name} liked your post`, 
        timestamp: new Date().toISOString(), 
        read: false,
        postId: post.id 
      };
      const notifs = JSON.parse(localStorage.getItem(`user_${post.userEmail}_notifications`) || '[]');
      notifs.unshift(notif);
      localStorage.setItem(`user_${post.userEmail}_notifications`, JSON.stringify(notifs));
      
      // FIX: Use socket for cross-tab notifications
      socket.emit('notification:received', {
        userId: post.userEmail,
        notification: notif
      });
      
      updateNotificationCount?.();
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(newComment)) !== null) {
      mentions.push(match[1]);
    }
    
    const commentData = {
      userName: user.name,
      userEmail: user.email,
      content: newComment.trim(),
      mentions: mentions,
      parentId: replyTo?.id || null
    };
    
    const commentText = newComment;
    setNewComment('');
    setReplyTo(null);

    try {
      const res = await axios.post(`${API_URL}/api/social/posts/${post.id}/comments`, commentData);
      if (res.data.success) {
        const updated = [...comments, res.data.comment];
        setComments(updated);
        localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(updated));
        
        // Emit socket event
        socket.emit('comment:created', {
          postId: post.id,
          comment: res.data.comment
        });
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      const comment = { 
        id: generateId(), 
        ...commentData, 
        userInitials: user.name.slice(0,2).toUpperCase(), 
        timestamp: new Date().toISOString(), 
        likes: 0,
        likedBy: []
      };
      const updated = [...comments, comment];
      setComments(updated);
      localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(updated));
    }

    // Handle mentions
    mentions.forEach(mentionedUsername => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const mentionedUser = users.find(u => 
        u.name.toLowerCase().includes(mentionedUsername.toLowerCase()) ||
        u.email.split('@')[0].toLowerCase() === mentionedUsername.toLowerCase()
      );
      
      if (mentionedUser && mentionedUser.email !== user.email) {
        const notif = { 
          id: Date.now(), 
          type: 'mention', 
          fromUser: user.name, 
          fromUserEmail: user.email,
          message: `${user.name} mentioned you in a comment: "${commentText.substring(0, 40)}"`, 
          timestamp: new Date().toISOString(), 
          read: false,
          postId: post.id
        };
        const notifs = JSON.parse(localStorage.getItem(`user_${mentionedUser.email}_notifications`) || '[]');
        notifs.unshift(notif);
        localStorage.setItem(`user_${mentionedUser.email}_notifications`, JSON.stringify(notifs));
        
        socket.emit('notification:received', {
          userId: mentionedUser.email,
          notification: notif
        });
      }
    });
    
    if (post.userEmail !== user.email) {
      const notif = { 
        id: Date.now(), 
        type: 'comment', 
        fromUser: user.name, 
        fromUserEmail: user.email,
        message: `${user.name} commented: "${commentText.substring(0, 40)}"`, 
        timestamp: new Date().toISOString(), 
        read: false,
        postId: post.id 
      };
      const notifs = JSON.parse(localStorage.getItem(`user_${post.userEmail}_notifications`) || '[]');
      notifs.unshift(notif);
      localStorage.setItem(`user_${post.userEmail}_notifications`, JSON.stringify(notifs));
      
      socket.emit('notification:received', {
        userId: post.userEmail,
        notification: notif
      });
      
      updateNotificationCount?.();
    }
  };

  const handleLikeComment = (commentId) => {
    if (likedComments.has(commentId)) return;
    
    // FIX: Use user.email consistently
    const updated = comments.map(c => c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c);
    setComments(updated);
    localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(updated));
    
    const newLiked = new Set(likedComments);
    newLiked.add(commentId);
    setLikedComments(newLiked);
    localStorage.setItem(`user_${user.email}_likedComments`, JSON.stringify([...newLiked]));
  };

  const handleDeleteComment = (commentId) => {
    const filtered = comments.filter(c => c.id !== commentId && c.parentId !== commentId);
    setComments(filtered);
    localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(filtered));
    
    socket.emit('comment:deleted', {
      postId: post.id,
      commentId
    });
  };

  const topLevel = comments.filter(c => !c.parentId);
  const visibleComments = showAllComments ? topLevel : topLevel.slice(0, 3);
  const isPostAuthor = user.email === post.userEmail;

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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <button onClick={() => onViewUserProfile(post.userEmail, post.userName)} className="relative flex-shrink-0">
              <Avatar 
                initials={post.userName} 
                size="md" 
                src={post.userPhoto}
              />
            </button>

            <div className="flex-1 min-w-0">
              <button onClick={() => onViewUserProfile(post.userEmail, post.userName)} className="flex items-center gap-2 flex-wrap hover:underline">
                <span className="font-bold text-gray-900 text-sm">{post.userName || 'Anonymous'}</span>
                <span className="text-xs text-gray-400">{formatTimeAgo(post.createdAt || Date.now())}</span>
              </button>
              {post.bookName && (
                <button
                  onClick={() => onViewBookDetails({ title: post.bookName, author: post.author })}
                  className="flex items-center gap-1.5 mt-0.5 hover:underline"
                >
                  <BookOpen className="w-3 h-3 text-orange-400" />
                  <span className="text-xs text-gray-500 font-medium">
                    {post.bookName}{post.author ? ` · ${post.author}` : ''}
                  </span>
                </button>
              )}
            </div>

            <button onClick={() => setShowOptions(true)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-3">
          {post.image && (
            <img src={post.image} alt="" className="w-full rounded-xl mb-3 max-h-56 object-cover" />
          )}
          
          {post.isReshare && post.originalPost && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <Repeat className="w-3 h-3" />
              <span>Reshared from <span className="font-semibold">{post.originalPost.userName}</span></span>
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
              <p className="text-sm text-gray-600">{post.originalPost.content}</p>
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-5">
          <button
            onClick={handleLikePost}
            disabled={isLiked}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-all ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{likeCount}</span>
          </button>

          <button
            onClick={handleToggleComments}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-orange-500 transition"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{comments.length}</span>
          </button>

          <button
            onClick={() => onSaveToggle(post)}
            className={`flex items-center gap-1.5 text-sm font-semibold transition ${
              isSaved ? 'text-orange-500' : 'text-gray-500 hover:text-orange-400'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-orange-500' : ''}`} />
            <span>Save</span>
          </button>

          <button
            onClick={() => onShare(post)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-orange-500 transition ml-auto"
          >
            <Share2 className="w-4 h-4" />
            <span>{post.reshareCount || 0}</span>
          </button>
        </div>

        {showComments && (
          <>
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
              <div className="flex items-center gap-2.5">
                {profileSrc ? (
                  <img src={profileSrc} alt="p" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <Avatar initials={user?.name} size="sm" />
                )}
                <div className="flex-1 flex items-center gap-2 bg-white rounded-full border border-gray-200 px-4 py-2 focus-within:border-orange-400 focus-within:shadow-sm transition">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
                    className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                    placeholder={replyTo ? `Reply to @${replyTo.userName}...` : "Write a comment... (use @ to mention)"}
                  />
                </div>
                <button
                  onClick={handlePostComment}
                  disabled={!newComment.trim()}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    newComment.trim() ? 'bg-orange-500 text-white shadow-sm active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Post
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                <span className="font-semibold">Tip:</span> Use @username to mention someone
              </p>
            </div>

            {comments.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 space-y-4">
                {loadingComments ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : (
                  visibleComments.map(comment => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      postId={post.id}
                      currentUser={user}
                      onReply={(comment) => setReplyTo(comment)}
                      onLike={handleLikeComment}
                      onDelete={handleDeleteComment}
                      onViewProfile={onViewUserProfile}
                    />
                  ))
                )}

                {topLevel.length > 3 && (
                  <button
                    onClick={() => setShowAllComments(p => !p)}
                    className="text-xs text-orange-500 font-semibold mt-1 flex items-center gap-1 hover:text-orange-600"
                  >
                    {showAllComments
                      ? <><ChevronDown className="w-3.5 h-3.5 rotate-180" /> Show less</>
                      : <><ChevronDown className="w-3.5 h-3.5" /> View all {topLevel.length} comments</>
                    }
                  </button>
                )}
              </div>
            )}

            {comments.length === 0 && !loadingComments && (
              <div className="px-4 pb-4">
                <p className="text-xs text-gray-400 text-center">Be the first to comment 💬</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
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
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const saveLocalUser = (userData) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const idx = users.findIndex(u => u.email === userData.email);
    if (idx >= 0) users[idx] = { ...users[idx], ...userData };
    else users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    if (!localStorage.getItem(`user_${userData.email}_followers`)) {
      localStorage.setItem(`user_${userData.email}_followers`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`user_${userData.email}_following`)) {
      localStorage.setItem(`user_${userData.email}_following`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`user_${userData.email}_blocked`)) {
      localStorage.setItem(`user_${userData.email}_blocked`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`user_${userData.email}_likedComments`)) {
      localStorage.setItem(`user_${userData.email}_likedComments`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`user_${userData.email}_likedPosts`)) {
      localStorage.setItem(`user_${userData.email}_likedPosts`, JSON.stringify([]));
    }
    
    ['stats','joinedCrews','notifications','readingList','savedPosts'].forEach(key => {
      if (!localStorage.getItem(`user_${userData.email}_${key}`)) {
        localStorage.setItem(`user_${userData.email}_${key}`, JSON.stringify(userData[key] || (key === 'stats' ? userData.stats : [])));
      }
    });
    return userData;
  };

  const handleSendOTP = async () => {
    setErrorMsg('');
    if (!isLogin && (!name.trim() || name.trim().length < 2)) { 
      setErrorMsg('Please enter your full name (at least 2 characters)'); 
      return; 
    }
    if (!validateEmail(email)) { 
      setErrorMsg('Please enter a valid email address'); 
      return; 
    }
    if (!isLogin && !agreeToTerms) {
      setErrorMsg('Please agree to the terms and conditions');
      return;
    }
    setLoading(true);
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('devOTP', otp);
      localStorage.setItem('pendingUser', JSON.stringify({
        email,
        name: name || email.split('@')[0],
        password: password || 'password123'
      }));
      setShowOTP(true);
      setDevOtpDisplay(otp);
      setInfoMsg('Email service is temporarily unavailable — use the code below to continue:');
    } catch {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('devOTP', otp);
      setShowOTP(true);
      setDevOtpDisplay(otp);
      setInfoMsg('Email service is temporarily unavailable — use the code below to continue:');
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    setErrorMsg('');
    if (otpInput.length !== 6) { 
      setErrorMsg('Please enter the 6-digit code'); 
      return; 
    }
    setLoading(true);
    try {
      const devOTP = localStorage.getItem('devOTP');
      const pendingUser = JSON.parse(localStorage.getItem('pendingUser') || '{}');
      const otpOk = (devOTP && otpInput === devOTP);

      if (!otpOk) {
        setErrorMsg('❌ Incorrect code. Please try again.');
        setLoading(false);
        return;
      }

      if (devOTP) localStorage.removeItem('devOTP');
      if (pendingUser) localStorage.removeItem('pendingUser');

      const userData = saveLocalUser({
        id: generateId(),
        name: pendingUser.name || name,
        email: pendingUser.email || email,
        password: pendingUser.password || password,
        readingGoal,
        isVerified: true,
        createdAt: new Date().toISOString(),
        stats: { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 },
        joinedCrews: [], 
        likedPosts: [], 
        likedComments: [],
        booksRead: [],
        readingList: [],
        savedPosts: [],
        followers: [], 
        following: [], 
        blockedUsers: [],
        bio: 'Reading is my superpower',
        location: '',
        website: '',
        preferences: {
          emailNotifications: true,
          pushNotifications: true,
          darkMode: false
        }
      });

      setShowOTP(false);
      onLogin(userData);
    } catch (err) {
      setErrorMsg('Verification failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleLogin = async () => {
    setErrorMsg('');
    if (!validateEmail(email)) { 
      setErrorMsg('Please enter a valid email address'); 
      return; 
    }
    if (!password.trim()) { 
      setErrorMsg('Please enter your password'); 
      return; 
    }
    setLoading(true);

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found && (found.password === password || !found.password)) {
      localStorage.setItem('currentUser', JSON.stringify(found));
      setLoading(false);
      onLogin(found);
      return;
    }

    setErrorMsg(found ? 'Incorrect password. Please try again.' : 'No account found. Please sign up first.');
    setLoading(false);
  };

  const handleResetPassword = () => {
    if (!validateEmail(resetEmail)) {
      setErrorMsg('Please enter a valid email');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setResetSent(true);
      setLoading(false);
    }, 1500);
  };

  if (showOTP) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-7 border border-gray-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Check your email</h2>
          <p className="text-gray-500 text-sm">We sent a code to <strong>{email}</strong></p>
          <p className="text-xs text-gray-400 mt-1">Also check your spam/junk folder</p>
        </div>

        {devOtpDisplay && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-4 text-center">
            <p className="text-xs text-amber-700 font-medium mb-2">📧 Email service unavailable — use this code:</p>
            <p className="text-4xl font-bold text-amber-800 tracking-widest">{devOtpDisplay}</p>
            <p className="text-xs text-amber-600 mt-2">Copy this code and paste it below</p>
          </div>
        )}

        {infoMsg && !devOtpDisplay && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 text-sm text-green-700">{infoMsg}</div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">{errorMsg}</div>
        )}

        <input 
          type="text" 
          inputMode="numeric" 
          value={otpInput}
          onChange={e => { setOtpInput(e.target.value.replace(/\D/g,'').slice(0,6)); setErrorMsg(''); }}
          className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none text-center text-3xl tracking-widest mb-4 font-mono"
          placeholder="000000" 
          maxLength="6" 
          autoFocus 
        />

        <button 
          onClick={handleVerifyOTP} 
          disabled={loading || otpInput.length !== 6}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-50 mb-3"
        >
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </button>

        <div className="flex justify-between items-center">
          <button 
            onClick={() => { setShowOTP(false); setErrorMsg(''); setInfoMsg(''); setDevOtpDisplay(''); }} 
            className="text-gray-500 text-sm flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={handleSendOTP} disabled={loading} className="text-orange-500 text-sm font-semibold">
            Resend code
          </button>
        </div>
      </div>
    </div>
  );

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

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">
              {errorMsg}
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
            }}
            className="text-gray-500 text-sm flex items-center gap-1 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent" style={{fontFamily:'Georgia,serif'}}>ReadCrew</h1>
          <p className="text-gray-500 text-sm mt-2">Read together, grow together.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-7 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-5">{isLogin ? 'Welcome Back!' : 'Join the Crew'}</h2>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">{errorMsg}</div>
          )}

          <div className="space-y-3">
            {!isLogin && (
              <>
                <div className={`flex items-center gap-3 bg-gray-50 border rounded-xl px-4 py-3.5 ${!name.trim() && errorMsg ? 'border-red-300' : 'border-gray-200'}`}>
                  <User className="w-5 h-5 text-gray-400" />
                  <input 
                    value={name} 
                    onChange={e => { setName(e.target.value); setErrorMsg(''); }}
                    className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                    placeholder="Full Name *" 
                    autoComplete="name" 
                  />
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-orange-500" />Reading Goals (Optional)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Yearly books</label>
                      <input 
                        type="number" 
                        value={readingGoal.yearly} 
                        onChange={e => setReadingGoal({...readingGoal, yearly: parseInt(e.target.value)||0})} 
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
                        onChange={e => setReadingGoal({...readingGoal, monthly: parseInt(e.target.value)||0})} 
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
                autoComplete={isLogin ? 'current-password' : 'new-password'} 
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
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="terms" className="text-xs text-gray-600">
                  I agree to the <button className="text-orange-500">Terms of Service</button> and <button className="text-orange-500">Privacy Policy</button>
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
            className="w-full mt-5 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><LoadingSpinner size="sm" color="orange" /><span>Please wait...</span></> : isLogin ? 'Log In' : 'Create Account →'}
          </button>

          {isLogin && (
            <p className="text-xs text-center text-gray-400 mt-3">
              Login works across all your devices
            </p>
          )}

          <p className="text-center text-sm text-gray-500 mt-4">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setEmail(''); setPassword(''); setName(''); }}
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

// ============================================================================
// CLIENT-SIDE AI BOOK DATABASE (fallback when backend is cold/offline)
// ============================================================================
const BOOK_DB = {
  thriller: [
    { title: 'Gone Girl', author: 'Gillian Flynn', genre: 'Thriller', description: 'A woman vanishes on her anniversary. Her husband becomes the prime suspect.', reason: 'Twisty, addictive, impossible to put down', rating: 4.6, pages: 422, year: 2012 },
    { title: 'The Silent Patient', author: 'Alex Michaelides', genre: 'Thriller', description: 'A famous painter shoots her husband and then never speaks again.', reason: 'Jaw-dropping twist that will blindside you', rating: 4.5, pages: 336, year: 2019 },
    { title: 'Verity', author: 'Colleen Hoover', genre: 'Thriller', description: 'A writer discovers a disturbing manuscript in a bestselling author\'s home.', reason: 'You will NOT see the ending coming — guaranteed', rating: 4.6, pages: 336, year: 2018 },
  ],
  fantasy: [
    { title: 'The Name of the Wind', author: 'Patrick Rothfuss', genre: 'Fantasy', description: 'The legendary Kvothe tells his own extraordinary story of magic and tragedy.', reason: 'Stunning prose and world-building unlike anything else', rating: 4.7, pages: 662, year: 2007 },
    { title: 'Mistborn: The Final Empire', author: 'Brandon Sanderson', genre: 'Fantasy', description: 'A crew of thieves plots to rob an immortal god-emperor.', reason: 'Inventive magic system with a deeply satisfying plot', rating: 4.7, pages: 541, year: 2006 },
    { title: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', description: 'A war college for dragon riders filled with forbidden romance and danger.', reason: 'Fast-paced, romantic, and absolutely addictive', rating: 4.6, pages: 528, year: 2023 },
  ],
  romance: [
    { title: 'Beach Read', author: 'Emily Henry', genre: 'Romance', description: 'Two rival authors swap genres and accidentally fall in love.', reason: 'Witty, heartfelt and genuinely funny', rating: 4.6, pages: 361, year: 2020 },
    { title: 'It Ends with Us', author: 'Colleen Hoover', genre: 'Romance', description: 'A powerful story about love, resilience, and the hardest choices.', reason: 'Emotional, important and beautifully written', rating: 4.6, pages: 368, year: 2016 },
    { title: 'People We Meet on Vacation', author: 'Emily Henry', genre: 'Romance', description: 'Two best friends, one annual vacation, ten years of unresolved feelings.', reason: 'Nostalgic, swoony and deeply satisfying', rating: 4.6, pages: 369, year: 2021 },
  ],
  scifi: [
    { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', description: 'A lone astronaut wakes up with amnesia and must save Earth from extinction.', reason: 'Most fun you\'ll have reading science fiction in your life', rating: 4.8, pages: 476, year: 2021 },
    { title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi', description: 'A young nobleman navigates politics, ecology and religion on a desert planet.', reason: 'The foundation of all modern science fiction', rating: 4.8, pages: 688, year: 1965 },
    { title: 'The Martian', author: 'Andy Weir', genre: 'Sci-Fi', description: 'An astronaut is stranded on Mars and must science his way home.', reason: 'Funny, clever and impossible to put down', rating: 4.8, pages: 369, year: 2011 },
  ],
  selfhelp: [
    { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', description: 'How tiny changes in behavior lead to remarkable results over time.', reason: 'The most practical habit book ever written — genuinely changes behavior', rating: 4.8, pages: 320, year: 2018 },
    { title: 'The Psychology of Money', author: 'Morgan Housel', genre: 'Finance', description: 'Timeless lessons on wealth, greed, and happiness from 19 short stories.', reason: 'Will change how you think about money forever', rating: 4.7, pages: 256, year: 2020 },
    { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', description: 'A brief history of humankind from Stone Age to the 21st century.', reason: 'Will fundamentally change how you see the entire human story', rating: 4.7, pages: 443, year: 2011 },
  ],
  literary: [
    { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', description: 'Between life and death lies a library containing every life you could have lived.', reason: 'Beautiful, philosophical and profoundly hopeful', rating: 4.6, pages: 288, year: 2020 },
    { title: 'Normal People', author: 'Sally Rooney', genre: 'Literary Fiction', description: 'Two people orbit each other through school, college and into adulthood.', reason: 'Painfully accurate about modern relationships and class', rating: 4.4, pages: 273, year: 2018 },
    { title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', description: 'A shepherd boy journeys across the desert in pursuit of his personal legend.', reason: 'Short, profound and endlessly re-readable', rating: 4.7, pages: 197, year: 1988 },
  ],
  emotional: [
    { title: 'A Little Life', author: 'Hanya Yanagihara', genre: 'Literary Fiction', description: 'Four friends navigate life, trauma and love over decades.', reason: 'One of the most emotionally powerful novels ever written', rating: 4.6, pages: 720, year: 2015 },
    { title: 'The Fault in Our Stars', author: 'John Green', genre: 'YA Fiction', description: 'Two teenagers with cancer fall in love.', reason: 'Cathartic sad — you will cry but feel better for it', rating: 4.7, pages: 313, year: 2012 },
    { title: 'Flowers for Algernon', author: 'Daniel Keyes', genre: 'Sci-Fi', description: 'A man with an intellectual disability becomes a genius through a dangerous experiment.', reason: 'One of the saddest, most beautiful books ever written', rating: 4.6, pages: 311, year: 1966 },
  ],
  feelgood: [
    { title: 'The House in the Cerulean Sea', author: 'TJ Klune', genre: 'Fantasy', description: 'A caseworker for magical children discovers a mysterious orphanage and unexpected love.', reason: 'Cozy, wholesome and genuinely delightful from start to finish', rating: 4.7, pages: 396, year: 2020 },
    { title: 'A Man Called Ove', author: 'Fredrik Backman', genre: 'Fiction', description: 'A grumpy widower finds new purpose through his annoying new neighbors.', reason: 'Will make you laugh and cry — but mostly feel warm inside', rating: 4.7, pages: 337, year: 2012 },
    { title: 'Eleanor Oliphant is Completely Fine', author: 'Gail Honeyman', genre: 'Fiction', description: 'A socially isolated woman slowly opens up to friendship and life.', reason: 'Tender, funny and ultimately deeply uplifting', rating: 4.6, pages: 327, year: 2017 },
  ],
  historical: [
    { title: 'All the Light We Cannot See', author: 'Anthony Doerr', genre: 'Historical Fiction', description: 'A blind French girl and a German boy\'s paths collide in WWII.', reason: 'Exquisitely written — Pulitzer Prize winner for good reason', rating: 4.7, pages: 531, year: 2014 },
    { title: 'The Book Thief', author: 'Markus Zusak', genre: 'Historical Fiction', description: 'A girl in Nazi Germany steals books — narrated by Death itself.', reason: 'Utterly unique voice and an unforgettable story', rating: 4.8, pages: 584, year: 2005 },
    { title: 'The Nightingale', author: 'Kristin Hannah', genre: 'Historical Fiction', description: 'Two French sisters resist Nazi occupation in very different ways.', reason: 'Devastating and triumphant — you will absolutely cry', rating: 4.8, pages: 440, year: 2015 },
  ],
  mystery: [
    { title: 'And Then There Were None', author: 'Agatha Christie', genre: 'Mystery', description: 'Ten strangers are lured to an island and begin dying one by one.', reason: 'The bestselling mystery novel of all time — still perfect', rating: 4.7, pages: 264, year: 1939 },
    { title: 'The Thursday Murder Club', author: 'Richard Osman', genre: 'Mystery', description: 'Four retirees in a care home solve cold cases — then a real murder occurs.', reason: 'Charming, funny, and genuinely clever', rating: 4.5, pages: 382, year: 2020 },
    { title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', genre: 'Mystery', description: 'A reclusive Hollywood legend reveals her scandalous life story.', reason: 'Glamorous, emotional, and utterly unforgettable', rating: 4.7, pages: 400, year: 2017 },
  ],
};

// Smart client-side AI response generator
const generateClientResponse = (userText, previousBooks = []) => {
  const text = userText.toLowerCase();
  const detectCategory = () => {
    if (/thrille|suspens|crime|murder|dark|creepy|horror|detective/i.test(text)) return 'thriller';
    if (/fantasy|magic|dragon|wizard|sword|epic|tolkien|harry potter/i.test(text)) return 'fantasy';
    if (/romance|love|swoony|kiss|dating|enemies.to.lovers/i.test(text)) return 'romance';
    if (/sci.?fi|space|future|robot|alien|tech|mars|nasa/i.test(text)) return 'scifi';
    if (/self.?help|habit|product|motivat|improve|success|mindset|business|finance/i.test(text)) return 'selfhelp';
    if (/mystery|whodun|cozy|clue|puzzle|agatha/i.test(text)) return 'mystery';
    if (/histor|period|war|ancient|medieval|century|wwii|world war/i.test(text)) return 'historical';
    if (/sad|depress|cry|grief|mournful|heartbreak|lonely|melanchol/i.test(text)) return 'emotional';
    if (/happy|fun|light|cozy|comfort|feel.?good|laugh|cheer/i.test(text)) return 'feelgood';
    if (/literary|fiction|prose|character|emotion|feel|beautiful|meaning/i.test(text)) return 'literary';
    return 'literary';
  };
  const category = detectCategory();
  const bookList = BOOK_DB[category] || BOOK_DB.literary;
  const prevTitles = new Set(previousBooks.map(b => b.title));
  const fresh = bookList.filter(b => !prevTitles.has(b.title));
  const recs = (fresh.length >= 3 ? fresh : bookList).slice(0, 5);
  const intros = {
    thriller: "Here are 5 gripping thrillers you won't be able to put down! 🔪",
    fantasy: "5 magical worlds waiting for you to explore ✨",
    romance: "5 romance reads that will give you all the feels ❤️",
    scifi: "5 sci-fi journeys that will blow your mind 🚀",
    selfhelp: "5 books that will genuinely change how you think 💡",
    mystery: "5 mysteries that'll keep you guessing until the last page 🔍",
    historical: "5 historical novels that transport you completely 🏰",
    emotional: "5 beautifully emotional books for when you need to feel seen 🥺",
    feelgood: "5 feel-good reads guaranteed to lift your spirits 🌟",
    literary: "5 beautifully written books that will stay with you 📚",
  };
  return { reply: intros[category] || "Here are 5 great picks for you! 📚", books: recs };
};

// ─── BOOK CARD component ─────────────────────────────────────────────────
const BookCard = ({ book, onCreateCrew, onViewDetails }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
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
        {book.genre && <span className="inline-block mt-1.5 text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{book.genre}</span>}
        {book.description && <p className="text-xs text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">{book.description}</p>}
        {book.reason && <p className="text-xs text-orange-700 mt-1 italic line-clamp-2">"{book.reason}"</p>}
        <div className="flex items-center gap-2 mt-2">
          <StarRating rating={Math.round(book.rating||4)} size="xs" />
          <span className="text-xs font-semibold text-gray-700">{book.rating||4.0}</span>
          {book.pages && <span className="text-xs text-gray-400">• {book.pages}p</span>}
          {book.year && <span className="text-xs text-gray-400">• {book.year}</span>}
        </div>
      </div>
    </div>
    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
      <button 
        onClick={() => onViewDetails?.(book)} 
        className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold"
      >
        View Details
      </button>
      <button 
        onClick={onCreateCrew} 
        className="flex-1 py-2.5 bg-[#C8622A] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
      >
        <Users className="w-4 h-4" />Create Crew
      </button>
    </div>
  </div>
);

// ========================================
// FULL USER PROFILE PAGE
// ========================================
const FullUserProfilePage = ({ viewedUserEmail, viewedUserName, currentUser, onBack, onFollow, isFollowing, onBlock, isBlocked }) => {
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [userBooks, setUserBooks] = useState([]);
  const [userCrews, setUserCrews] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('Posts');
  const [userStats, setUserStats] = useState({ booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 });

  useEffect(() => {
    loadUserData();
  }, [viewedUserEmail]);

  const loadUserData = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.email === viewedUserEmail);
    if (found) {
      setUserData(found);
    }

    const stats = JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_stats`) || '{}');
    setUserStats({
      booksRead: stats.booksRead || 0,
      reviewsGiven: stats.reviewsGiven || 0,
      postsCreated: stats.postsCreated || 0,
      crewsJoined: stats.crewsJoined || 0
    });

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
  };

  const tabs = ['Posts', 'Reviews', 'Books Read', 'Crews'];

  return (
    <div className="min-h-screen bg-gray-50 pb-24 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-semibold text-gray-900">{viewedUserName}'s Profile</h2>
        <div className="w-6"></div>
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
            <p className="text-sm text-gray-500">@{viewedUserName?.toLowerCase().replace(/\s/g,'')}</p>
            <p className="text-sm text-gray-600 mt-1 italic">"{userData?.bio || 'Reading is my superpower'}"</p>
            
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
                  className={`flex-1 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 ${
                    isFollowing 
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                      : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
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
                  className={`px-4 py-2 rounded-xl font-semibold text-sm ${
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

        {/* Privacy Notice */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3 px-1">
          <Globe className="w-3 h-3" />
          <span>Posts, Reviews, Books & Crews are public · Saved posts are private</span>
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
            {userPosts.length === 0 ? (
              <div className="text-center py-8">
                <Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No posts yet</p>
              </div>
            ) : userPosts.map(post => (
              <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                {post.bookName && <p className="text-xs text-orange-500">📖 {post.bookName}</p>}
                {post.image && <img src={post.image} alt="" className="w-full rounded-xl mt-2" />}
                <div className="flex items-center gap-4 pt-2 border-t border-gray-100 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{post.likes||0}</span>
                  <span className="flex items-center gap-1"><Repeat className="w-3.5 h-3.5" />{post.reshareCount||0}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Reviews' && (
          <div className="space-y-4">
            {userReviews.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No reviews yet</p>
              </div>
            ) : userReviews.map(review => (
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
            ))}
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
                    <div className="flex items-center gap-1 mt-1"><StarRating rating={book.rating} size="xs" /></div>
                    {book.notes && <p className="text-xs text-gray-600 mt-1 italic">"{book.notes}"</p>}
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
// HOME PAGE
// ========================================
const HomePage = ({ 
  user, posts, setPosts, crews, setPage, donations, reviews, onUpdateStats, 
  updateNotificationCount, profileSrc, savedPosts, onSavePost, onResharePost, 
  onDeletePost, onFollow, following, onBlock, blockedUsers, onViewUserProfile,
  onViewBookDetails
}) => {
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [feedPosts, setFeedPosts] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookDetails, setShowBookDetails] = useState(false);
  const [showShare, setShowShare] = useState(null);
  const [showReshare, setShowReshare] = useState(null);
  const [userStats, setUserStats] = useState({
    booksRead: user?.stats?.booksRead || 0, 
    reviewsGiven: user?.stats?.reviewsGiven || 0,
    postsCreated: user?.stats?.postsCreated || 0, 
    crewsJoined: user?.joinedCrews?.length || 0
  });
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    loadTrendingBooks();
    loadFeedPosts();
    
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

    socket.on('comment:new', ({ postId, comment }) => {
      // Update comments count when a new comment is added
      setFeedPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
      ));
    });

    socket.on('comment:deleted', ({ postId }) => {
      setFeedPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) } : p
      ));
    });

    const savedStats = localStorage.getItem(`user_${user.email}_stats`);
    if (savedStats) setUserStats(JSON.parse(savedStats));
    if (user?.readingGoal?.yearly > 0) {
      const s = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
      setReadingProgress(Math.min((s.booksRead || 0) / user.readingGoal.yearly * 100, 100));
    }

    return () => {
      socket.off('new_post');
      socket.off('post_deleted');
      socket.off('post_liked');
      socket.off('comment:new');
      socket.off('comment:deleted');
    };
  }, [user?.email, blockedUsers]);

  const loadTrendingBooks = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/books/trending?limit=10`);
      if (res.data.success) {
        setTrendingBooks(res.data.books);
      }
    } catch (error) {
      console.error('Failed to load trending books:', error);
      setTrendingBooks([
        { id: 1, title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8 },
        { title: 'The Psychology of Money', author: 'Morgan Housel', genre: 'Finance', rating: 4.7 },
        { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.8 },
        { title: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', rating: 4.6 },
        { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', rating: 4.6 },
      ]);
    } finally {
      setLoadingTrending(false);
    }
  };

  const loadFeedPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/social/posts?userEmail=${user.email}`);
      if (res.data.success) {
        setFeedPosts(res.data.posts.filter(p => !blockedUsers.includes(p.userEmail)));
      }
    } catch (error) {
      console.error('Failed to load feed:', error);
      const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
      setFeedPosts(allPosts.slice(0, 15));
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
  const hasReadingGoal = user?.readingGoal?.yearly > 0 || user?.readingGoal?.monthly > 0;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <TopBar 
        user={user} 
        setPage={setPage} 
        title="ReadCrew" 
        profileSrc={profileSrc}
        onNotificationClick={() => setPage('notifications')}
        notificationCount={JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]').filter(n => !n.read).length} 
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
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
          {hasReadingGoal && (
            <div className="mt-4 bg-white/20 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Yearly Goal</span>
                <span className="font-semibold">{userStats.booksRead}/{user?.readingGoal?.yearly} books</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${readingProgress}%` }} />
              </div>
            </div>
          )}
          {!hasReadingGoal && (
            <button onClick={() => setPage('profile')} className="mt-3 w-full bg-white/20 hover:bg-white/30 rounded-xl py-2 text-sm font-medium">
              Set Reading Goals →
            </button>
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
              <TrendingUp className="w-5 h-5 text-orange-500" />Trending Books
            </h2>
            <button onClick={() => setPage('explore')} className="text-sm text-orange-500 font-semibold">
              Explore All
            </button>
          </div>
          {loadingTrending ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {trendingBooks.map((book, i) => (
                <div 
                  key={i} 
                  className="shrink-0 w-28 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setSelectedBook(book)}
                >
                  <DynamicBookCover title={book.title} author={book.author} size="md" className="mb-2" />
                  <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{book.title}</p>
                  <p className="text-xs text-gray-500 truncate">{book.author}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium">{book.rating}</span>
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
              <Users className="w-5 h-5 text-orange-500" />Your Crews
            </h2>
            <button onClick={() => setPage('crews')} className="text-sm text-orange-500 font-semibold">
              View All
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {userCrews.slice(0,2).map(crew => (
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
                      <Users className="w-3 h-3" />{crew.members||1}
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

        {/* Create Post Button */}
        <button 
          onClick={() => setPage('post')} 
          className="w-full bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-center gap-3 hover:shadow-md"
        >
          {profileSrc ? (
            <img src={profileSrc} alt="p" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <Avatar initials={user?.name} size="sm" />
          )}
          <span className="text-gray-400 text-sm flex-1 text-left">Share your reading journey...</span>
          <span className="text-xs text-orange-500 font-medium bg-orange-50 px-3 py-1 rounded-full">Post</span>
        </button>

        {/* Community Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />Community Feed
            </h2>
            <button onClick={() => setPage('reviews')} className="text-sm text-orange-500 font-semibold">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {feedPosts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No posts yet. Be the first to share!</p>
                <button onClick={() => setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">
                  Create Post
                </button>
              </div>
            ) : (
              feedPosts.map((post, idx) => (
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
                  onViewBookDetails={onViewBookDetails}
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
// EXPLORE PAGE (simplified for brevity - keep your existing implementation)
// ========================================
const ExplorePage = ({ user, setPage, onCreateCrew }) => {
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! 👋 I'm Page Turner, your AI book guide. Tell me what you're in the mood for — a genre, a vibe, a character type, or even the last book you loved. Let's find your next great read!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [allBooks, setAllBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userText, timestamp: new Date() }]);
    setLoading(true);

    let usedBackend = false;
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 35000);
      const res = await fetch(`${API_URL}/api/books/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
        signal: controller.signal
      });
      clearTimeout(tid);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && data.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }]);
        if (data.recommendations?.length > 0) {
          setAllBooks(data.recommendations);
        }
        usedBackend = true;
      }
    } catch { /* fallback to client-side */ }

    if (!usedBackend) {
      const { reply, books } = generateClientResponse(userText, allBooks);
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);
      if (books.length > 0) { setAllBooks(books); }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] to-[#FAF6F1] pb-24 overflow-y-auto">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-[#2D1F14] mb-1" style={{fontFamily:'Georgia,serif'}}>
          What to read next?
        </h1>
        <p className="text-sm text-[#8B7968]">Chat with your AI book guide</p>
      </div>

      <div className="mx-4 space-y-3">
        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-[#C8622A] text-white rounded-br-sm' 
                  : 'bg-white text-[#3A2C25] rounded-bl-sm shadow-sm border border-gray-100'
              }`}>
                {msg.content}
              </div>
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
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
              </div>
            </div>
          </div>
        )}

        {allBooks.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 px-1">
              <div className="h-px flex-1 bg-orange-200" />
              <span className="text-xs text-orange-500 font-semibold">📚 RECOMMENDATIONS</span>
              <div className="h-px flex-1 bg-orange-200" />
            </div>
            {allBooks.map((book, i) => (
              <BookCard 
                key={`${i}-${book.title}`} 
                book={book} 
                onCreateCrew={() => { onCreateCrew(book); setPage('crews'); }}
                onViewDetails={(book) => setSelectedBook(book)}
              />
            ))}
          </div>
        )}

        <div ref={chatEndRef} />
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
              input.trim() && !loading ? 'bg-[#C8622A] text-white' : 'bg-gray-100 text-gray-400'
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
    };

    try {
      const res = await axios.post(`${API_URL}/api/social/posts`, postData);
      if (res.data.success) {
        onPost(res.data.post);
      }
    } catch (error) {
      console.error('Failed to post to server:', error);
      onPost({ 
        ...postData, 
        id: generateId(), 
        createdAt: new Date().toISOString(), 
        likes: 0, 
        reshareCount: 0,
        userPhoto: user.profileImage,
        userInitials: user.name.slice(0,2).toUpperCase()
      });
    }
    
    setPage('home');
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white z-[55] overflow-hidden" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
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
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => fileRef.current?.click()} 
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 hover:bg-gray-200"
          >
            <Camera className="w-4 h-4" />Add Photo
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
            if (file) { 
              if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB');
                return;
              }
              const r = new FileReader(); 
              r.onload = ev => setImage(ev.target.result); 
              r.readAsDataURL(file); 
            }
          }} 
        />
      </div>
    </div>
  );
};

// ========================================
// REVIEWS PAGE (simplified for brevity - keep your existing implementation)
// ========================================
const ReviewsPage = ({ user, setPage, updateNotificationCount, onViewUserProfile }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/social/reviews`)
      .then(res => {
        if (res.data.success) setReviews(res.data.reviews || []);
      })
      .catch(() => {
        const saved = JSON.parse(localStorage.getItem('reviews') || '[]');
        setReviews(saved);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredReviews = reviews.filter(review => 
    review.bookName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.author.toLowerCase().includes(searchQuery.toLowerCase())
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
      
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <button onClick={() => setPage('home')} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-semibold text-gray-900">Book Reviews</h2>
        <button 
          onClick={() => setPage('post')} 
          className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium"
        >
          Write Review
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
              placeholder="Search by book title or author..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No reviews yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
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
                    <Avatar initials={review.userName} size="xs" />
                    <span className="text-xs text-gray-600 hover:underline">{review.userName}</span>
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
// CREWS PAGE (simplified for brevity - keep your existing implementation)
// ========================================
const CrewsPage = ({ user, crews: initialCrews, setPage, updateNotificationCount, onViewUserProfile }) => {
  const [crews, setCrews] = useState([]);
  const [joinedCrews, setJoinedCrews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showJoinMsg, setShowJoinMsg] = useState('');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('crews') || '[]');
    setCrews(saved.length > 0 ? saved : initialCrews);
    const jc = JSON.parse(localStorage.getItem(`user_${user.email}_joinedCrews`) || '[]');
    setJoinedCrews(jc);
  }, [user.email]);

  const isJoined = (crewId) => joinedCrews.includes(crewId);

  const joinCrew = (crew) => {
    const updated = [...joinedCrews, crew.id];
    setJoinedCrews(updated);
    localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updated));
    
    const updatedCrews = crews.map(c => c.id === crew.id ? { ...c, members: (c.members||1)+1 } : c);
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));
    
    setShowJoinMsg(`🎉 Joined "${crew.name}"!`);
    setTimeout(() => setShowJoinMsg(''), 3000);
  };

  const filteredCrews = crews.filter(crew => 
    crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crew.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const Toast = () => showJoinMsg ? (
    <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg z-[100] text-center">
      {showJoinMsg}
    </div>
  ) : null;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <Toast />
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold" style={{fontFamily:'Georgia,serif'}}>Reading Crews</span>
        </div>
      </div>
      
      <div className="px-4 py-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crews by book title or author..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
            />
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />My Crews
          </h2>
          {filteredCrews.filter(c => isJoined(c.id)).length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
              <p className="text-gray-500 text-sm">No crews joined yet. Explore below!</p>
            </div>
          ) : (
            filteredCrews.filter(c => isJoined(c.id)).map(crew => (
              <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-green-200 shadow-sm mb-3">
                <div className="flex items-center px-4 gap-4 py-3">
                  <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 truncate">{crew.name}</p>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">Joined</span>
                    </div>
                    <p className="text-xs text-gray-500">by {crew.author}</p>
                  </div>
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
                <p className="text-gray-500 text-sm">No crews match your search</p>
              </div>
            ) : (
              filteredCrews.filter(c => !isJoined(c.id)).map(crew => (
                <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <div className="flex items-center px-4 gap-4 py-3">
                    <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{crew.name}</p>
                      <p className="text-xs text-gray-500">by {crew.author}</p>
                      <span className="text-xs text-gray-400">{crew.members||1} members</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex justify-end border-t border-gray-100">
                    <button 
                      onClick={() => joinCrew(crew)} 
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
// PROFILE PAGE (simplified for brevity - keep your existing implementation)
// ========================================
const ProfilePage = ({ user, posts, setPage, onLogout, onUpdateUser, profileSrc, setProfileSrc, savedPosts, following, followers }) => {
  const [activeTab, setActiveTab] = useState('Posts');
  const [userStats, setUserStats] = useState(user?.stats || { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const fileRef = useRef();

  const myPosts = posts.filter(p => p.userEmail === user?.email);
  const savedPostsList = posts.filter(p => savedPosts?.includes(p.id));

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
      localStorage.setItem(`user_${user.email}_profile_image`, imgData);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    const updatedUser = { ...user, name: editName, bio: editBio };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    onUpdateUser?.(updatedUser);
    setEditingProfile(false);
  };

  const tabs = ['Posts', 'Saved Posts'];

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold" style={{fontFamily:'Georgia,serif'}}>Profile</span>
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
              onClick={() => fileRef.current?.click()} 
              className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow hover:bg-orange-600 transition"
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
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" 
                  placeholder="Your name" 
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
                <p className="text-sm text-gray-500">@{user?.name?.toLowerCase().replace(/\s/g,'')}</p>
                <p className="text-sm text-gray-600 mt-2 italic">"{user?.bio || 'Reading is my superpower'}"</p>
                
                <button 
                  onClick={() => setEditingProfile(true)} 
                  className="mt-3 px-4 py-1.5 border border-orange-200 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />Edit Profile
                </button>
              </>
            )}
          </div>
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
                <button 
                  onClick={() => setPage('post')} 
                  className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm"
                >
                  Create First Post
                </button>
              </div>
            ) : (
              myPosts.map(post => (
                <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                  {post.bookName && <p className="text-xs text-orange-500">📖 {post.bookName}</p>}
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-100 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />{post.likes||0}
                    </span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
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
              </div>
            ) : (
              savedPostsList.map(post => (
                <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-700 mb-2">{post.content}</p>
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
  const [socketConnected, setSocketConnected] = useState(false);

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
    if (currentPage === 'post' || viewingFullProfile) {
      setShowBottomNav(false);
    } else {
      setShowBottomNav(true);
    }
  }, [currentPage, viewingFullProfile]);

  // Socket connection setup
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket connected');
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    });

    socket.on('notification:new', (notification) => {
      if (notification.toEmail === currentUser?.email) {
        setNotificationCount(prev => prev + 1);
        setCurrentToast(notification);
        
        const notifs = JSON.parse(localStorage.getItem(`user_${currentUser.email}_notifications`) || '[]');
        notifs.unshift(notification);
        localStorage.setItem(`user_${currentUser.email}_notifications`, JSON.stringify(notifs));
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('notification:new');
    };
  }, [currentUser]);

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

        // Authenticate socket with user email
        socket.emit('auth', { userId: user.email });
      }
      
      const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
      setPosts(allPosts);
      
      const storedCrews = JSON.parse(localStorage.getItem('crews') || '[]');
      if (storedCrews.length > 0) {
        setCrews(storedCrews);
      }
      
      setLoading(false);
    };

    loadInitialData();
  }, []);

  const checkForNewNotifications = useCallback(() => {
    if (!currentUser) return;
    
    const notifications = JSON.parse(localStorage.getItem(`user_${currentUser.email}_notifications`) || '[]');
    const unreadCount = notifications.filter(n => !n.read).length;
    setNotificationCount(unreadCount);
    setUnreadMessages(unreadCount);
    
    const latestUnread = notifications.find(n => !n.read);
    if (latestUnread && !currentToast) {
      setCurrentToast(latestUnread);
    }
  }, [currentUser, currentToast]);

  useEffect(() => {
    if (!currentUser) return;
    
    checkForNewNotifications();
    
    const interval = setInterval(checkForNewNotifications, 30000);
    
    const handleStorageChange = (e) => {
      if (e.key?.includes('_notifications')) {
        checkForNewNotifications();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUser, checkForNewNotifications]);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    // Initialize all user data with email as key (FIX: consistent email usage)
    if (!localStorage.getItem(`user_${userData.email}_following`)) {
      localStorage.setItem(`user_${userData.email}_following`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`user_${userData.email}_followers`)) {
      localStorage.setItem(`user_${userData.email}_followers`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`user_${userData.email}_blocked`)) {
      localStorage.setItem(`user_${userData.email}_blocked`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`user_${userData.email}_likedComments`)) {
      localStorage.setItem(`user_${userData.email}_likedComments`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`user_${userData.email}_likedPosts`)) {
      localStorage.setItem(`user_${userData.email}_likedPosts`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`user_${userData.email}_stats`)) {
      localStorage.setItem(`user_${userData.email}_stats`, JSON.stringify({
        booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0
      }));
    }
    
    socket.emit('auth', { userId: userData.email });
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
      commentsCount: 0,
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

    // Emit socket event for real-time feed updates
    socket.emit('post:created', { post: newPost });
  };

  const handleDeletePost = (post) => {
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const filtered = allPosts.filter(p => p.id !== post.id);
    localStorage.setItem('allPosts', JSON.stringify(filtered));
    setPosts(filtered);
    
    const stats = JSON.parse(localStorage.getItem(`user_${currentUser.email}_stats`) || '{}');
    stats.postsCreated = Math.max((stats.postsCreated || 0) - 1, 0);
    localStorage.setItem(`user_${currentUser.email}_stats`, JSON.stringify(stats));

    socket.emit('post:deleted', { postId: post.id });
  };

  const handleSavePost = (post) => {
    const userSaved = JSON.parse(localStorage.getItem(`user_${currentUser.email}_savedPosts`) || '[]');
    
    if (userSaved.includes(post.id)) {
      const filtered = userSaved.filter(id => id !== post.id);
      localStorage.setItem(`user_${currentUser.email}_savedPosts`, JSON.stringify(filtered));
      setSavedPosts(filtered);
    } else {
      userSaved.push(post.id);
      localStorage.setItem(`user_${currentUser.email}_savedPosts`, JSON.stringify(userSaved));
      setSavedPosts(userSaved);
    }
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
      const notif = { 
        id: Date.now(), 
        type: 'reshare', 
        fromUser: currentUser.name, 
        fromUserEmail: currentUser.email,
        message: `${currentUser.name} reshared your post`, 
        timestamp: new Date().toISOString(), 
        read: false,
        postId: originalPost.id
      };
      const notifs = JSON.parse(localStorage.getItem(`user_${originalPost.userEmail}_notifications`) || '[]');
      notifs.unshift(notif);
      localStorage.setItem(`user_${originalPost.userEmail}_notifications`, JSON.stringify(notifs));
      
      socket.emit('notification:received', {
        userId: originalPost.userEmail,
        notification: notif
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
      type: 'reshare',
      userName: currentUser.name,
      userEmail: currentUser.email,
      userPhoto: currentUser.profileImage,
      userInitials: currentUser.name.slice(0,2).toUpperCase(),
      createdAt: new Date().toISOString(),
      likes: 0,
      commentsCount: 0,
      reshareCount: 0,
      isReshare: true,
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
      const updatedFollowing = currentFollowing.filter(email => email !== targetEmail);
      localStorage.setItem(`user_${currentUser.email}_following`, JSON.stringify(updatedFollowing));
      setFollowing(updatedFollowing);
      
      const targetFollowers = JSON.parse(localStorage.getItem(`user_${targetEmail}_followers`) || '[]');
      const updatedTargetFollowers = targetFollowers.filter(email => email !== currentUser.email);
      localStorage.setItem(`user_${targetEmail}_followers`, JSON.stringify(updatedTargetFollowers));
    } else {
      currentFollowing.push(targetEmail);
      localStorage.setItem(`user_${currentUser.email}_following`, JSON.stringify(currentFollowing));
      setFollowing(currentFollowing);
      
      const targetFollowers = JSON.parse(localStorage.getItem(`user_${targetEmail}_followers`) || '[]');
      if (!targetFollowers.includes(currentUser.email)) {
        targetFollowers.push(currentUser.email);
        localStorage.setItem(`user_${targetEmail}_followers`, JSON.stringify(targetFollowers));
      }
      
      const notif = { 
        id: Date.now(), 
        type: 'follow', 
        fromUser: currentUser.name, 
        fromUserEmail: currentUser.email,
        message: `${currentUser.name} started following you`, 
        timestamp: new Date().toISOString(), 
        read: false 
      };
      const notifs = JSON.parse(localStorage.getItem(`user_${targetEmail}_notifications`) || '[]');
      notifs.unshift(notif);
      localStorage.setItem(`user_${targetEmail}_notifications`, JSON.stringify(notifs));
      
      socket.emit('notification:received', {
        userId: targetEmail,
        notification: notif
      });
      
      checkForNewNotifications();
    }
  };

  const handleBlockUser = (targetEmail, targetName) => {
    const currentBlocked = JSON.parse(localStorage.getItem(`user_${currentUser.email}_blocked`) || '[]');
    
    if (currentBlocked.includes(targetEmail)) {
      const updatedBlocked = currentBlocked.filter(email => email !== targetEmail);
      localStorage.setItem(`user_${currentUser.email}_blocked`, JSON.stringify(updatedBlocked));
      setBlockedUsers(updatedBlocked);
    } else {
      currentBlocked.push(targetEmail);
      localStorage.setItem(`user_${currentUser.email}_blocked`, JSON.stringify(currentBlocked));
      setBlockedUsers(currentBlocked);
      
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

  const handleViewBookDetails = (book) => {
    // This will be handled by the component that uses this function
    console.log('View book details:', book);
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

      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-1 text-xs z-[100]">
          <WifiOff className="w-3 h-3 inline mr-1" />
          You're offline. Some features may be limited.
        </div>
      )}

      {/* Socket connection status (optional) */}
      {!socketConnected && isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white text-center py-1 text-xs z-[100]">
          Connecting to real-time updates...
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
                setPosts={setPosts} 
                crews={crews} 
                setPage={setCurrentPage} 
                donations={[]} 
                reviews={[]} 
                onUpdateStats={handleUpdateUser} 
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
                onViewBookDetails={handleViewBookDetails}
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
                    id: Date.now(),
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
if (typeof document !== 'undefined' && !document.querySelector('style[data-app-styles]')) {
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
  style.setAttribute('data-app-styles', 'true');
  document.head.appendChild(style);
}