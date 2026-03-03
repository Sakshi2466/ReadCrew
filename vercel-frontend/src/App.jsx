// App.jsx - Complete ReadCrew Application
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
  UserCheck, UserMinus, Hash, AtSign as AtIcon, Shield
} from 'lucide-react';

// API Configuration
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'https://versal-book-app.onrender.com';

// ========================================
// HELPER FUNCTIONS
// ========================================
const getUserAvatar = (email) => {
  if (!email) return null;
  return localStorage.getItem(`user_${email}_profile_image`) || null;
};

const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return past.toLocaleDateString();
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
    message: <MessageSquare className="w-5 h-5 text-emerald-500" />
  };

  const bgColors = {
    like: 'bg-red-50 border-red-200',
    comment: 'bg-blue-50 border-blue-200',
    mention: 'bg-amber-50 border-amber-200',
    reshare: 'bg-indigo-50 border-indigo-200',
    follow: 'bg-green-50 border-green-200',
    invite: 'bg-purple-50 border-purple-200',
    message: 'bg-emerald-50 border-emerald-200'
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
            'bg-purple-100'
          }`}>
            {icons[notification.type] || <Bell className="w-5 h-5 text-gray-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 font-medium leading-snug">{notification.message}</p>
            <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(notification.timestamp)}</p>
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
// DYNAMIC BOOK COVER COMPONENT
// ========================================
const DynamicBookCover = ({ title, author, size = 'md', onClick }) => {
  const [coverUrl, setCoverUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const sizeMap = {
    xs: 'w-12 h-16',
    sm: 'w-16 h-20',
    md: 'w-24 h-32',
    lg: 'w-32 h-40',
    xl: 'w-40 h-48'
  };
  
  const coverClassName = sizeMap[size] || sizeMap.md;

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
    const query = author ? `${title} ${author}`.trim() : title;

    // Try Google Books API first
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1&projection=lite`,
        { signal: AbortSignal.timeout(5000) }
      );
      
      if (response.ok) {
        const data = await response.json();
        const imageLinks = data.items?.[0]?.volumeInfo?.imageLinks;
        
        if (imageLinks) {
          const cover = imageLinks.extraLarge || imageLinks.large || imageLinks.medium || imageLinks.thumbnail || imageLinks.smallThumbnail;
          if (cover) {
            const cleanedCover = cover.replace('http:', 'https:').replace('&edge=curl', '').replace(/zoom=\d/, 'zoom=3');
            setCoverUrl(cleanedCover);
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.log('Google Books API failed, trying Open Library...');
    }

    // Try Open Library
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`,
        { signal: AbortSignal.timeout(5000) }
      );
      
      if (response.ok) {
        const data = await response.json();
        const book = data.docs?.[0];
        
        if (book?.cover_i) {
          setCoverUrl(`https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`);
          setIsLoading(false);
          return;
        }
        
        if (book?.isbn?.[0]) {
          setCoverUrl(`https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-L.jpg`);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.log('Open Library failed');
    }

    setError(true);
    setIsLoading(false);
  };

  const getFallbackColor = () => {
    const colors = ['#7B9EA6', '#C8622A', '#8B5E3C', '#E8A87C', '#C4A882', '#2C3E50', '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C'];
    const hash = (title || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const initials = title ? title.slice(0, 2).toUpperCase() : 'BK';

  if (isLoading) {
    return (
      <div className={`${coverClassName} bg-gray-200 rounded-xl flex items-center justify-center animate-pulse`} onClick={onClick}>
        <BookOpen className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  if (error || !coverUrl) {
    return (
      <div
        className={`${coverClassName} rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg cursor-pointer hover:scale-105 transition-transform`}
        style={{ backgroundColor: getFallbackColor() }}
        onClick={onClick}
      >
        <span className="text-2xl">{initials}</span>
        <BookOpen className="w-5 h-5 mt-1 opacity-60" />
      </div>
    );
  }

  return (
    <div
      className={`${coverClassName} relative group cursor-pointer rounded-xl overflow-hidden bg-gray-100 shadow-md`}
      onClick={onClick}
    >
      <img
        src={coverUrl}
        alt={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
// USER AVATAR COMPONENT
// ========================================
const UserAvatar = ({ email, name, size = 40, ring = false, onClick }) => {
  const [src, setSrc] = useState(() => getUserAvatar(email));

  useEffect(() => {
    setSrc(getUserAvatar(email));
  }, [email]);

  const initials = (name || '').slice(0, 2).toUpperCase() || 'U';
  const sizePx = typeof size === 'number' ? size : 40;

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  return (
    <div
      onClick={handleClick}
      className="flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
      style={{
        width: sizePx,
        height: sizePx,
        borderRadius: '50%',
        overflow: 'hidden',
        border: ring ? '2.5px solid #C8622A' : '2px solid rgba(200,98,42,0.2)',
        boxShadow: ring ? '0 0 0 3px rgba(200,98,42,0.15)' : 'none',
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setSrc(null)}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #f97316, #ef4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: sizePx < 32 ? 10 : sizePx < 44 ? 13 : 16,
          }}
        >
          {initials}
        </div>
      )}
    </div>
  );
};

// ========================================
// STAR RATING COMPONENT
// ========================================
const StarRating = ({ rating = 0, onChange, size = 'sm', readOnly = false }) => {
  const sz = size === 'sm' ? 'w-4 h-4' : size === 'xs' ? 'w-3 h-3' : 'w-6 h-6';
  
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sz} ${
            star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
          } ${onChange && !readOnly ? 'cursor-pointer hover:scale-110 transition' : ''}`}
          onClick={() => {
            if (onChange && !readOnly) {
              onChange(star);
            }
          }}
        />
      ))}
    </div>
  );
};

// ========================================
// LOADING SPINNER COMPONENT
// ========================================
const LoadingSpinner = ({ size = 'md', color = 'orange' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  const colors = {
    orange: 'border-orange-500',
    blue: 'border-blue-500',
    purple: 'border-purple-500'
  };
  
  return (
    <div className={`${sizes[size]} border-4 border-t-transparent ${colors[color]} rounded-full animate-spin`} />
  );
};

// ========================================
// BOTTOM NAVIGATION COMPONENT
// ========================================
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
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center -mt-5 shadow-lg ${
                  active === id ? 'bg-[#C8622A]' : 'bg-gray-800'
                }`}
              >
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
            
            <span className={`text-[10px] font-medium ${id === 'post' ? 'mt-1' : ''}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// ========================================
// TOP BAR COMPONENT
// ========================================
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
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>
        <button onClick={() => setPage('profile')} className="hover:opacity-80 transition">
          <UserAvatar email={user?.email} name={user?.name} size={32} ring />
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
    loadNotifications();
  }, [user.email]);

  const loadNotifications = () => {
    const stored = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    setNotifications(stored);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
    updateNotificationCount?.();
  };

  const markAsRead = (id) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
    updateNotificationCount?.();
  };

  const deleteNotification = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
    updateNotificationCount?.();
  };

  const icons = {
    like: <Heart className="w-4 h-4 text-red-500" />,
    comment: <MessageCircle className="w-4 h-4 text-blue-500" />,
    message: <MessageSquare className="w-4 h-4 text-emerald-500" />,
    invite: <UserPlus className="w-4 h-4 text-purple-500" />,
    follow: <UserCheck className="w-4 h-4 text-orange-500" />,
    reshare: <Repeat className="w-4 h-4 text-indigo-500" />,
    mention: <AtIcon className="w-4 h-4 text-amber-500" />
  };

  const bgColors = {
    like: 'bg-red-100',
    comment: 'bg-blue-100',
    message: 'bg-emerald-100',
    invite: 'bg-purple-100',
    follow: 'bg-orange-100',
    reshare: 'bg-indigo-100',
    mention: 'bg-amber-100'
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
            {notifications
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 ${notification.read ? 'bg-white' : 'bg-orange-50'} hover:bg-gray-50 transition cursor-pointer relative`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${bgColors[notification.type] || 'bg-gray-100'}`}>
                      {icons[notification.type] || <Bell className="w-4 h-4 text-gray-500" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-relaxed">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(notification.timestamp)}</p>
                    </div>
                    
                    {!notification.read && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-3 h-3 text-gray-400" />
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
// SHARE MODAL COMPONENT
// ========================================
const ShareModal = ({ post, onClose }) => {
  const shareUrl = window.location.href;
  const shareText = `Check out this post by ${post.userName}: "${post.content?.substring(0, 50)}..."`;

  const shareHandlers = {
    whatsapp: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank'),
    facebook: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank'),
    twitter: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank'),
    copyLink: () => {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto animate-fadeIn">
        <div className="border-b border-gray-100 p-4 flex justify-between items-center">
          <h3 className="font-semibold text-lg">Share Post</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-4 gap-4 mb-4">
            {[
              { key: 'whatsapp', color: '#25D366', letter: 'W' },
              { key: 'facebook', color: '#1877F2', letter: 'F' },
              { key: 'twitter', color: '#1DA1F2', letter: 'T' }
            ].map(({ key, color, letter }) => (
              <button
                key={key}
                onClick={shareHandlers[key]}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                >
                  {letter}
                </div>
                <span className="text-xs text-gray-600 capitalize">{key}</span>
              </button>
            ))}
          </div>
          
          <button
            onClick={shareHandlers.copyLink}
            className="w-full py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50 transition"
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
// RESHARE MODAL COMPONENT
// ========================================
const ReshareModal = ({ post, onClose, onReshare }) => {
  const [comment, setComment] = useState('');

  const handleReshare = () => {
    onReshare(post, comment);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto animate-fadeIn">
        <div className="border-b border-gray-100 p-4 flex justify-between items-center">
          <h3 className="font-semibold text-lg">Reshare Post</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 resize-none mb-3"
            placeholder="Add your thoughts..."
            rows={3}
          />
          
          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <p className="text-xs text-gray-500 mb-1">
              Original post by <span className="font-semibold">{post.userName}</span>:
            </p>
            <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
          </div>
          
          <button
            onClick={handleReshare}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition"
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
// POST OPTIONS MODAL COMPONENT
// ========================================
const PostOptionsModal = ({ post, user, onClose, onReshare, onSave, isSaved, onDelete, isOwner, onFollow, isFollowing, onBlock, isBlocked }) => {
  const options = [
    {
      id: 'reshare',
      icon: Repeat,
      label: 'Reshare',
      color: 'text-blue-600',
      action: () => onReshare(post)
    },
    {
      id: 'save',
      icon: Bookmark,
      label: isSaved ? 'Unsave' : 'Save',
      color: isSaved ? 'text-orange-500' : 'text-gray-700',
      action: () => onSave(post)
    }
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
    options.push({
      id: 'delete',
      icon: Trash2,
      label: 'Delete',
      color: 'text-red-500',
      action: () => onDelete(post)
    });
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
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto overflow-hidden animate-fadeIn">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-center text-lg">Post Options</h3>
        </div>
        
        <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                option.action();
                onClose();
              }}
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
// COMMENT COMPONENT
// ========================================
const Comment = ({ comment, isOwn, onLike, onReply, onDelete, liked, onViewUserProfile }) => {
  const [showReplies, setShowReplies] = useState(false);

  const renderContent = () => {
    if (!comment.mentions || comment.mentions.length === 0) {
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
    <div className="flex gap-3">
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 36 }}>
        <UserAvatar
          email={comment.userEmail}
          name={comment.userName}
          size={32}
          ring={isOwn}
          onClick={() => onViewUserProfile(comment.userEmail, comment.userName)}
        />
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

        {renderContent()}

        <div className="flex items-center gap-4 mt-1.5">
          <button
            onClick={() => onLike(comment.id)}
            disabled={liked}
            className={`flex items-center gap-1.5 text-xs font-medium transition-all ${
              liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-500' : ''}`} />
            <span>{comment.likes || 0}</span>
          </button>

          <button
            onClick={() => onReply(comment)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 font-semibold"
          >
            <Share2 className="w-3 h-3 rotate-180" />
            Reply
          </button>

          {isOwn && (
            <button
              onClick={() => onDelete(comment.id)}
              className="ml-auto text-gray-200 hover:text-red-400 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {!showReplies && (
              <button
                onClick={() => setShowReplies(true)}
                className="text-xs text-orange-500 font-semibold mb-2 flex items-center gap-1"
              >
                ↳ View {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}

            {showReplies && (
              <div className="space-y-2 pl-3 border-l-2 border-orange-100">
                {comment.replies.map((reply) => (
                  <Comment
                    key={reply.id}
                    comment={reply}
                    isOwn={reply.userId === user?.id}
                    onLike={onLike}
                    onReply={onReply}
                    onDelete={onDelete}
                    liked={liked}
                    onViewUserProfile={onViewUserProfile}
                  />
                ))}
                <button
                  onClick={() => setShowReplies(false)}
                  className="text-xs text-orange-500 font-semibold mt-1"
                >
                  Hide replies
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// INLINE POST CARD COMPONENT
// ========================================
const InlinePostCard = ({
  post,
  user,
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
  onViewUserProfile
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likedComments, setLikedComments] = useState(new Set());
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    loadComments();
    loadLikedComments();
    checkIfLiked();
  }, [post.id, user.id, user.email]);

  const loadComments = () => {
    const saved = JSON.parse(localStorage.getItem(`post_${post.id}_comments`) || '[]');
    setComments(saved);
  };

  const loadLikedComments = () => {
    const liked = JSON.parse(localStorage.getItem(`user_${user.id}_likedComments`) || '[]');
    setLikedComments(new Set(liked));
  };

  const checkIfLiked = () => {
    const likedPosts = JSON.parse(localStorage.getItem(`user_${user.email}_likedPosts`) || '[]');
    setIsLiked(likedPosts.includes(post.id));
  };

  const handleLikePost = () => {
    if (isLiked) return;

    setIsLiked(true);
    setLikeCount(prev => prev + 1);

    const likedPosts = JSON.parse(localStorage.getItem(`user_${user.email}_likedPosts`) || '[]');
    likedPosts.push(post.id);
    localStorage.setItem(`user_${user.email}_likedPosts`, JSON.stringify(likedPosts));

    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const updatedPosts = allPosts.map(p =>
      p.id === post.id ? { ...p, likes: (p.likes || 0) + 1 } : p
    );
    localStorage.setItem('allPosts', JSON.stringify(updatedPosts));

    if (post.userEmail !== user.email) {
      const notification = {
        id: generateId(),
        type: 'like',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} liked your post`,
        timestamp: new Date().toISOString(),
        read: false,
        postId: post.id
      };

      const userNotifications = JSON.parse(localStorage.getItem(`user_${post.userEmail}_notifications`) || '[]');
      userNotifications.unshift(notification);
      localStorage.setItem(`user_${post.userEmail}_notifications`, JSON.stringify(userNotifications));
      
      updateNotificationCount?.();
    }
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;

    const mentions = [];
    const mentionRegex = /@(\w+)/g;
    let match;
    while ((match = mentionRegex.exec(newComment)) !== null) {
      mentions.push(match[1]);
    }

    const comment = {
      id: generateId(),
      postId: post.id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      content: newComment.trim(),
      timestamp: new Date().toISOString(),
      parentId: replyTo?.id || null,
      likes: 0,
      mentions,
      replies: []
    };

    const updatedComments = [...comments, comment];
    localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(updatedComments));
    setComments(updatedComments);
    setNewComment('');
    setReplyTo(null);

    // Send mentions notifications
    mentions.forEach(mentionedUsername => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const mentionedUser = users.find(u =>
        u.name.toLowerCase().includes(mentionedUsername.toLowerCase()) ||
        u.email.split('@')[0].toLowerCase() === mentionedUsername.toLowerCase()
      );

      if (mentionedUser && mentionedUser.email !== user.email) {
        const notification = {
          id: generateId(),
          type: 'mention',
          fromUser: user.name,
          fromUserEmail: user.email,
          message: `${user.name} mentioned you in a comment: "${newComment.substring(0, 40)}"`,
          timestamp: new Date().toISOString(),
          read: false,
          postId: post.id
        };

        const userNotifications = JSON.parse(localStorage.getItem(`user_${mentionedUser.email}_notifications`) || '[]');
        userNotifications.unshift(notification);
        localStorage.setItem(`user_${mentionedUser.email}_notifications`, JSON.stringify(userNotifications));
      }
    });

    // Send comment notification to post author
    if (post.userEmail !== user.email) {
      const notification = {
        id: generateId(),
        type: 'comment',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} commented: "${newComment.substring(0, 40)}"`,
        timestamp: new Date().toISOString(),
        read: false,
        postId: post.id
      };

      const userNotifications = JSON.parse(localStorage.getItem(`user_${post.userEmail}_notifications`) || '[]');
      userNotifications.unshift(notification);
      localStorage.setItem(`user_${post.userEmail}_notifications`, JSON.stringify(userNotifications));
      
      updateNotificationCount?.();
    }
  };

  const handleLikeComment = (commentId) => {
    if (likedComments.has(commentId)) return;

    const updatedComments = comments.map(c => {
      if (c.id === commentId) {
        return { ...c, likes: (c.likes || 0) + 1 };
      }
      return c;
    });

    setComments(updatedComments);
    localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(updatedComments));

    const newLiked = new Set(likedComments);
    newLiked.add(commentId);
    setLikedComments(newLiked);
    localStorage.setItem(`user_${user.id}_likedComments`, JSON.stringify([...newLiked]));
  };

  const handleDeleteComment = (commentId) => {
    const filtered = comments.filter(c => c.id !== commentId && c.parentId !== commentId);
    setComments(filtered);
    localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(filtered));
  };

  const buildCommentTree = () => {
    const commentMap = {};
    const rootComments = [];

    comments.forEach(comment => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    comments.forEach(comment => {
      if (comment.parentId) {
        if (commentMap[comment.parentId]) {
          commentMap[comment.parentId].replies.push(commentMap[comment.id]);
        }
      } else {
        rootComments.push(commentMap[comment.id]);
      }
    });

    return rootComments;
  };

  const commentTree = buildCommentTree();
  const visibleComments = showAllComments ? commentTree : commentTree.slice(0, 3);
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
        {/* Post Header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <UserAvatar
              email={post.userEmail}
              name={post.userName}
              size={40}
              ring
              onClick={() => onViewUserProfile(post.userEmail, post.userName)}
            />

            <div className="flex-1 min-w-0">
              <button
                onClick={() => onViewUserProfile(post.userEmail, post.userName)}
                className="flex items-center gap-2 flex-wrap hover:underline"
              >
                <span className="font-bold text-gray-900 text-sm">{post.userName || 'Anonymous'}</span>
                <span className="text-xs text-gray-400">{formatTimeAgo(post.createdAt || Date.now())}</span>
              </button>

              {post.bookName && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <BookOpen className="w-3 h-3 text-orange-400" />
                  <span className="text-xs text-gray-500 font-medium">
                    {post.bookName}{post.author ? ` · ${post.author}` : ''}
                  </span>
                </div>
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

        {/* Post Content */}
        <div className="px-4 pb-3">
          {post.image && (
            <img
              src={post.image}
              alt="Post"
              className="w-full rounded-xl mb-3 max-h-56 object-cover"
            />
          )}

          {post.isReshare && post.originalPost && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <Repeat className="w-3 h-3" />
              <span>
                Reshared from <span className="font-semibold">{post.originalPost.userName}</span>
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
              <p className="text-sm text-gray-600">{post.originalPost.content}</p>
            </div>
          )}
        </div>

        {/* Post Actions */}
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
            onClick={() => inputRef.current?.focus()}
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

          <div className="flex items-center gap-2.5">
            <UserAvatar email={user?.email} name={user?.name} size={32} ring />

            <div className="flex-1 flex items-center gap-2 bg-white rounded-full border border-gray-200 px-4 py-2 focus-within:border-orange-400 focus-within:shadow-sm transition">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePostComment();
                  }
                }}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                placeholder={replyTo ? `Reply to @${replyTo.userName}...` : "Write a comment..."}
              />
            </div>

            <button
              onClick={handlePostComment}
              disabled={!newComment.trim()}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                newComment.trim()
                  ? 'bg-orange-500 text-white shadow-sm active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Post
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {comments.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 space-y-1">
            {visibleComments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                isOwn={comment.userId === user.id}
                onLike={handleLikeComment}
                onReply={(c) => {
                  setReplyTo(c);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                onDelete={handleDeleteComment}
                liked={likedComments.has(comment.id)}
                onViewUserProfile={onViewUserProfile}
              />
            ))}

            {commentTree.length > 3 && (
              <button
                onClick={() => setShowAllComments((prev) => !prev)}
                className="text-xs text-orange-500 font-semibold mt-1 flex items-center gap-1 hover:text-orange-600"
              >
                {showAllComments ? (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    View all {commentTree.length} comments
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {comments.length === 0 && (
          <div className="px-4 pb-4">
            <p className="text-xs text-gray-400 text-center">Be the first to comment 💬</p>
          </div>
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
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [readingGoal, setReadingGoal] = useState({ yearly: 20, monthly: 5 });

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const saveUser = (userData) => {
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
    ['followers', 'following', 'blocked', 'savedPosts', 'likedPosts', 'likedReviews'].forEach(key => {
      if (!localStorage.getItem(`user_${userData.email}_${key}`)) {
        localStorage.setItem(`user_${userData.email}_${key}`, JSON.stringify([]));
      }
    });

    if (!localStorage.getItem(`user_${userData.email}_stats`)) {
      localStorage.setItem(`user_${userData.email}_stats`, JSON.stringify({
        booksRead: 0,
        reviewsGiven: 0,
        postsCreated: 0,
        crewsJoined: 0
      }));
    }

    return userData;
  };

  const handleSendOTP = () => {
    setError('');

    if (!isLogin) {
      if (!name.trim() || name.trim().length < 2) {
        setError('Please enter your full name');
        return;
      }
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('devOTP', otp);

    setShowOTP(true);
    setDevOtp(otp);
    setInfo('Email service unavailable - use the code below:');
    setLoading(false);
  };

  const handleVerifyOTP = () => {
    setError('');

    if (otpInput.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    const storedOTP = localStorage.getItem('devOTP');

    if (otpInput !== storedOTP) {
      setError('Invalid verification code');
      return;
    }

    localStorage.removeItem('devOTP');

    const userData = saveUser({
      id: generateId(),
      name,
      email,
      password,
      readingGoal,
      isVerified: true,
      createdAt: new Date().toISOString(),
      bio: 'Reading is my superpower',
      stats: { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 },
      joinedCrews: []
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
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (user && (user.password === password || !user.password)) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      onLogin(user);
    } else {
      setError(user ? 'Incorrect password' : 'No account found. Please sign up.');
    }

    setLoading(false);
  };

  if (showOTP) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-7 border border-gray-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Verify Your Email</h2>
            <p className="text-sm text-gray-500">We sent a code to {email}</p>
          </div>

          {devOtp && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-4 text-center">
              <p className="text-xs text-amber-700 font-medium mb-2">📧 Development Code:</p>
              <p className="text-4xl font-bold text-amber-800 tracking-widest">{devOtp}</p>
            </div>
          )}

          {info && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-700">
              {info}
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
            onChange={(e) => {
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
            disabled={otpInput.length !== 6 || loading}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-50 mb-3"
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>

          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                setShowOTP(false);
                setError('');
                setInfo('');
                setDevOtp('');
              }}
              className="text-gray-500 text-sm flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="text-orange-500 text-sm font-semibold"
            >
              Resend Code
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
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                    placeholder="Full Name *"
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
                        onChange={(e) => setReadingGoal({ ...readingGoal, yearly: parseInt(e.target.value) || 0 })}
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
                        onChange={(e) => setReadingGoal({ ...readingGoal, monthly: parseInt(e.target.value) || 0 })}
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
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                placeholder="Email address *"
              />
            </div>

            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
              <Lock className="w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                placeholder={isLogin ? 'Password *' : 'Create a password *'}
              />
              <button onClick={() => setShowPassword(!showPassword)} type="button">
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={isLogin ? handleLogin : handleSendOTP}
            disabled={loading}
            className="w-full mt-5 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-60"
          >
            {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Create Account →'}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
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
// BOOK DATABASE
// ========================================
const BOOK_DB = {
  thriller: [
    {
      title: 'Gone Girl',
      author: 'Gillian Flynn',
      genre: 'Thriller',
      description: 'A woman vanishes on her anniversary. Her husband becomes the prime suspect.',
      reason: 'Twisty, addictive, impossible to put down',
      rating: 4.6,
      pages: 422,
      year: 2012
    },
    {
      title: 'The Silent Patient',
      author: 'Alex Michaelides',
      genre: 'Thriller',
      description: 'A famous painter shoots her husband and then never speaks again.',
      reason: 'Jaw-dropping twist that will blindside you',
      rating: 4.5,
      pages: 336,
      year: 2019
    },
    {
      title: 'Verity',
      author: 'Colleen Hoover',
      genre: 'Thriller',
      description: 'A writer discovers a disturbing manuscript in a bestselling author\'s home.',
      reason: 'You will NOT see the ending coming — guaranteed',
      rating: 4.6,
      pages: 336,
      year: 2018
    }
  ],
  fantasy: [
    {
      title: 'The Name of the Wind',
      author: 'Patrick Rothfuss',
      genre: 'Fantasy',
      description: 'The legendary Kvothe tells his own extraordinary story of magic and tragedy.',
      reason: 'Stunning prose and world-building unlike anything else',
      rating: 4.7,
      pages: 662,
      year: 2007
    },
    {
      title: 'Mistborn: The Final Empire',
      author: 'Brandon Sanderson',
      genre: 'Fantasy',
      description: 'A crew of thieves plots to rob an immortal god-emperor.',
      reason: 'Inventive magic system with a deeply satisfying plot',
      rating: 4.7,
      pages: 541,
      year: 2006
    },
    {
      title: 'Fourth Wing',
      author: 'Rebecca Yarros',
      genre: 'Fantasy',
      description: 'A war college for dragon riders filled with forbidden romance and danger.',
      reason: 'Fast-paced, romantic, and absolutely addictive',
      rating: 4.6,
      pages: 528,
      year: 2023
    }
  ],
  romance: [
    {
      title: 'Beach Read',
      author: 'Emily Henry',
      genre: 'Romance',
      description: 'Two rival authors swap genres and accidentally fall in love.',
      reason: 'Witty, heartfelt and genuinely funny',
      rating: 4.6,
      pages: 361,
      year: 2020
    },
    {
      title: 'It Ends with Us',
      author: 'Colleen Hoover',
      genre: 'Romance',
      description: 'A powerful story about love, resilience, and the hardest choices.',
      reason: 'Emotional, important and beautifully written',
      rating: 4.6,
      pages: 368,
      year: 2016
    }
  ],
  scifi: [
    {
      title: 'Project Hail Mary',
      author: 'Andy Weir',
      genre: 'Sci-Fi',
      description: 'A lone astronaut wakes up with amnesia and must save Earth from extinction.',
      reason: 'Most fun you\'ll have reading science fiction in your life',
      rating: 4.8,
      pages: 476,
      year: 2021
    },
    {
      title: 'Dune',
      author: 'Frank Herbert',
      genre: 'Sci-Fi',
      description: 'A young nobleman navigates politics, ecology and religion on a desert planet.',
      reason: 'The foundation of all modern science fiction',
      rating: 4.8,
      pages: 688,
      year: 1965
    }
  ],
  selfhelp: [
    {
      title: 'Atomic Habits',
      author: 'James Clear',
      genre: 'Self-Help',
      description: 'How tiny changes in behavior lead to remarkable results over time.',
      reason: 'The most practical habit book ever written — genuinely changes behavior',
      rating: 4.8,
      pages: 320,
      year: 2018
    },
    {
      title: 'The Psychology of Money',
      author: 'Morgan Housel',
      genre: 'Finance',
      description: 'Timeless lessons on wealth, greed, and happiness from 19 short stories.',
      reason: 'Will change how you think about money forever',
      rating: 4.7,
      pages: 256,
      year: 2020
    }
  ],
  literary: [
    {
      title: 'The Midnight Library',
      author: 'Matt Haig',
      genre: 'Fiction',
      description: 'Between life and death lies a library containing every life you could have lived.',
      reason: 'Beautiful, philosophical and profoundly hopeful',
      rating: 4.6,
      pages: 288,
      year: 2020
    },
    {
      title: 'The Alchemist',
      author: 'Paulo Coelho',
      genre: 'Inspirational',
      description: 'A shepherd boy journeys across the desert in pursuit of his personal legend.',
      reason: 'Short, profound and endlessly re-readable',
      rating: 4.7,
      pages: 197,
      year: 1988
    }
  ]
};

// ========================================
// AI RECOMMENDATION ENGINE
// ========================================
const generateRecommendations = (userInput, previousBooks = []) => {
  const text = userInput.toLowerCase();

  const detectGenre = () => {
    if (/thriller|suspense|crime|murder|dark|creepy|mystery/i.test(text)) return 'thriller';
    if (/fantasy|magic|dragon|wizard|sword|epic|harry potter|tolkien/i.test(text)) return 'fantasy';
    if (/romance|love|swoony|kiss|dating|enemies to lovers/i.test(text)) return 'romance';
    if (/sci fi|scifi|science fiction|space|future|robot|alien|tech|mars/i.test(text)) return 'scifi';
    if (/self help|self-help|habit|productivity|motivation|improve|success|mindset|business|finance/i.test(text)) return 'selfhelp';
    return 'literary';
  };

  const genre = detectGenre();
  const bookList = BOOK_DB[genre] || BOOK_DB.literary;

  const previousTitles = new Set(previousBooks.map(b => b.title));
  const newBooks = bookList.filter(b => !previousTitles.has(b.title));
  const recommendations = (newBooks.length >= 3 ? newBooks : bookList).slice(0, 5);

  const responses = {
    thriller: "Here are 5 gripping thrillers that will keep you on the edge of your seat! 🔪",
    fantasy: "Step into 5 magical worlds that will transport you completely ✨",
    romance: "5 romance novels that will make your heart flutter ❤️",
    scifi: "5 mind-bending sci-fi adventures await you 🚀",
    selfhelp: "5 books that will transform your thinking and habits 💡",
    literary: "5 beautifully written literary gems for your soul 📚"
  };

  return {
    message: responses[genre],
    books: recommendations
  };
};

// ========================================
// BOOK CARD COMPONENT
// ========================================
const BookCard = ({ book, onCreateCrew }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
      <div className="flex gap-4">
        <DynamicBookCover title={book.title} author={book.author} size="md" />

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm leading-tight">{book.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">by {book.author}</p>

          {book.genre && (
            <span className="inline-block mt-1.5 text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
              {book.genre}
            </span>
          )}

          {book.description && (
            <p className="text-xs text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">
              {book.description}
            </p>
          )}

          {book.reason && (
            <p className="text-xs text-orange-700 mt-1 italic line-clamp-2">
              "{book.reason}"
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={Math.round(book.rating || 4)} size="xs" />
            <span className="text-xs font-semibold text-gray-700">{book.rating || 4.0}</span>
            {book.pages && <span className="text-xs text-gray-400">• {book.pages}p</span>}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
        <button
          onClick={onCreateCrew}
          className="flex-1 py-2.5 bg-[#C8622A] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-[#B5521A] transition"
        >
          <Users className="w-4 h-4" />
          Create Crew
        </button>

        <button
          onClick={() => {
            navigator.clipboard.writeText(`"${book.title}" by ${book.author}`);
            alert('Book info copied!');
          }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
        >
          <Share2 className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

// ========================================
// USER PROFILE MODAL
// ========================================
const UserProfileModal = ({ userEmail, userName, currentUser, onClose, onFollow, isFollowing, onViewFullProfile, onBlock, isBlocked }) => {
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

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
      const follower = users.find(u => u.email === email);
      return {
        email,
        name: follower?.name || email.split('@')[0],
        initials: follower?.name?.slice(0, 2).toUpperCase() || email.slice(0, 2).toUpperCase()
      };
    });

    const followingWithDetails = userFollowing.map(email => {
      const followed = users.find(u => u.email === email);
      return {
        email,
        name: followed?.name || email.split('@')[0],
        initials: followed?.name?.slice(0, 2).toUpperCase() || email.slice(0, 2).toUpperCase()
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
  };

  const UserListModal = ({ title, users, onClose, onUserClick }) => (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
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
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {user.initials}
                  </div>
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
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-4 mb-6">
              <UserAvatar email={userEmail} name={userName} size={64} ring />

              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 truncate">{userName}</h2>
                <p className="text-sm text-gray-500">@{userName?.toLowerCase().replace(/\s/g, '')}</p>

                <div className="flex gap-4 mt-2">
                  <button
                    onClick={() => setShowFollowers(true)}
                    className="text-center hover:opacity-75 transition"
                  >
                    <p className="font-bold text-gray-900">{followers.length}</p>
                    <p className="text-xs text-gray-500">Followers</p>
                  </button>
                  <button
                    onClick={() => setShowFollowing(true)}
                    className="text-center hover:opacity-75 transition"
                  >
                    <p className="font-bold text-gray-900">{following.length}</p>
                    <p className="text-xs text-gray-500">Following</p>
                  </button>
                </div>
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
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Heart className="w-3 h-3" />
                          {post.likes || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userReviews.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Recent Reviews</h3>
                <div className="space-y-3">
                  {userReviews.map(review => (
                    <div key={review.id} className="bg-gray-50 rounded-xl p-3">
                      <p className="font-medium text-sm text-gray-900">{review.bookName}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{review.review}</p>
                      <StarRating rating={review.rating} size="xs" />
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
// FULL USER PROFILE PAGE
// ========================================
const FullUserProfilePage = ({ viewedUserEmail, viewedUserName, currentUser, onBack, onFollow, isFollowing, onBlock, isBlocked }) => {
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [userCrews, setUserCrews] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('Posts');
  const [userStats, setUserStats] = useState({
    booksRead: 0,
    reviewsGiven: 0,
    postsCreated: 0,
    crewsJoined: 0
  });

  const isOwnProfile = viewedUserEmail === currentUser.email;

  useEffect(() => {
    loadUserData();
  }, [viewedUserEmail]);

  const loadUserData = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.email === viewedUserEmail);
    if (found) setUserData(found);

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
      const follower = users.find(u => u.email === email);
      return {
        email,
        name: follower?.name || email.split('@')[0],
        initials: follower?.name?.slice(0, 2).toUpperCase() || email.slice(0, 2).toUpperCase()
      };
    });

    const followingWithDetails = userFollowing.map(email => {
      const followed = users.find(u => u.email === email);
      return {
        email,
        name: followed?.name || email.split('@')[0],
        initials: followed?.name?.slice(0, 2).toUpperCase() || email.slice(0, 2).toUpperCase()
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

    const joinedCrews = JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_joinedCrews`) || '[]');
    const allCrews = JSON.parse(localStorage.getItem('crews') || '[]');
    const crews = allCrews.filter(c => joinedCrews.includes(c.id) || joinedCrews.includes(String(c.id)));
    setUserCrews(crews);
  };

  const tabs = ['Posts', 'Reviews', 'Crews'];

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
          <UserAvatar email={viewedUserEmail} name={viewedUserName} size={80} ring />

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">{viewedUserName}</h2>
            <p className="text-sm text-gray-500">@{viewedUserName?.toLowerCase().replace(/\s/g, '')}</p>
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

            {!isOwnProfile && viewedUserEmail !== currentUser.email && (
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

        {!isOwnProfile && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">Books read and saved posts are private to this user</p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 bg-white rounded-xl p-3 border border-gray-200 mb-5">
          {[
            { label: 'Books', value: isOwnProfile ? userStats.booksRead : '🔒', icon: BookOpen, color: 'text-blue-600' },
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
              className={`flex-1 text-sm pb-2.5 px-3 font-medium border-b-2 transition ${
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
            ) : (
              userPosts.map(post => (
                <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                  {post.bookName && <p className="text-xs text-orange-500">📖 {post.bookName}</p>}
                  {post.image && <img src={post.image} alt="" className="w-full rounded-xl mt-2" />}
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
                      {crew.genre && (
                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                          {crew.genre}
                        </span>
                      )}
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
  user,
  posts,
  setPosts,
  crews,
  setPage,
  onUpdateStats,
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
  onViewUserProfile
}) => {
  const [trendingBooks] = useState([
    { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8, readers: 25000 },
    { title: 'The Psychology of Money', author: 'Morgan Housel', genre: 'Finance', rating: 4.7, readers: 18000 },
    { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.8, readers: 22000 },
    { title: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', rating: 4.6, readers: 35000 },
    { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', rating: 4.6, readers: 19000 },
  ]);

  const [feedPosts, setFeedPosts] = useState([]);
  const [showShare, setShowShare] = useState(null);
  const [showReshare, setShowReshare] = useState(null);
  const [userStats, setUserStats] = useState({
    booksRead: 0,
    reviewsGiven: 0,
    postsCreated: 0,
    crewsJoined: 0
  });
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    loadFeed();
    loadUserStats();
  }, [user?.email]);

  const loadFeed = () => {
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    setFeedPosts(allPosts.slice(0, 15));
  };

  const loadUserStats = () => {
    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    setUserStats(stats);

    if (user?.readingGoal?.yearly > 0) {
      const progress = Math.min((stats.booksRead || 0) / user.readingGoal.yearly * 100, 100);
      setReadingProgress(progress);
    }
  };

  const userCrews = crews.filter(c => user?.joinedCrews?.includes(c.id));

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <TopBar
        user={user}
        setPage={setPage}
        title="ReadCrew"
        onNotificationClick={() => setPage('notifications')}
        notificationCount={JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]').filter(n => !n.read).length}
      />

      {showShare && <ShareModal post={showShare} onClose={() => setShowShare(null)} />}
      {showReshare && (
        <ReshareModal
          post={showReshare}
          onClose={() => setShowReshare(null)}
          onReshare={(p, c) => {
            onResharePost(p, c);
            setShowReshare(null);
          }}
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

          {user?.readingGoal?.yearly > 0 && (
            <div className="mt-4 bg-white/20 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm mb-2">
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
            <button onClick={() => setPage('explore')} className="text-sm text-orange-500 font-semibold">
              Explore All
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {trendingBooks.map((book, i) => (
              <div key={i} className="shrink-0 w-28 cursor-pointer hover:scale-105 transition-transform">
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
          className="w-full bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-center gap-3 hover:shadow-md transition"
        >
          <UserAvatar email={user?.email} name={user?.name} size={36} ring />
          <span className="text-gray-400 text-sm flex-1 text-left">Share your reading journey...</span>
          <span className="text-xs text-orange-500 font-medium bg-orange-50 px-3 py-1 rounded-full">Post</span>
        </button>

        {/* Community Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              Community Feed
            </h2>
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
              feedPosts.map((post) => (
                <InlinePostCard
                  key={post.id}
                  post={post}
                  user={user}
                  updateNotificationCount={updateNotificationCount}
                  onShare={(p) => setShowShare(p)}
                  onReshareClick={(p) => setShowReshare(p)}
                  onSaveToggle={onSavePost}
                  isSaved={savedPosts?.includes(post.id)}
                  onDelete={onDeletePost}
                  onFollow={onFollow}
                  isFollowing={following?.includes(post.userEmail)}
                  onBlock={onBlock}
                  isBlocked={blockedUsers?.includes(post.userEmail)}
                  onViewUserProfile={onViewUserProfile}
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
const ExplorePage = ({ user, setPage, onCreateCrew }) => {
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! 👋 I'm Page Turner, your AI book guide. Tell me what you're in the mood for — a genre, a vibe, or the last book you loved!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [previousBooks, setPreviousBooks] = useState([]);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setLoading(true);

    setTimeout(() => {
      const { message, books } = generateRecommendations(userMessage, previousBooks);

      setChatMessages(prev => [...prev, { role: 'assistant', content: message, timestamp: new Date() }]);

      if (books.length > 0) {
        setRecommendations(books);
        setPreviousBooks(prev => [...prev, ...books]);
      }

      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] to-[#FAF6F1] pb-24 overflow-y-auto">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-[#2D1F14] mb-1" style={{ fontFamily: 'Georgia, serif' }}>
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
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#C8622A] text-white rounded-br-sm'
                    : 'bg-white text-[#3A2C25] rounded-bl-sm shadow-sm border border-gray-100'
                }`}
              >
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
                {[0, 150, 300].map(d => (
                  <div
                    key={d}
                    className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 px-1">
              <div className="h-px flex-1 bg-orange-200" />
              <span className="text-xs text-orange-500 font-semibold">📚 RECOMMENDATIONS</span>
              <div className="h-px flex-1 bg-orange-200" />
            </div>

            {recommendations.map((book, i) => (
              <BookCard
                key={`${i}-${book.title}`}
                book={book}
                onCreateCrew={() => {
                  onCreateCrew(book);
                  setPage('crews');
                }}
              />
            ))}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="sticky bottom-20 mx-4 mt-4 bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-gray-200 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
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
  const fileRef = useRef();

  const handleSubmit = () => {
    if (!content.trim()) return;

    const postData = {
      id: generateId(),
      content,
      bookName,
      author,
      image,
      isPublic,
      type: 'post',
      userName: user.name,
      userEmail: user.email,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      shares: 0,
      reshareCount: 0
    };

    onPost(postData);
    setPage('home');
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
          disabled={!content.trim()}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
        >
          Share
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex gap-3 mb-4">
          <UserAvatar email={user?.email} name={user?.name} size={40} ring />
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
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 hover:bg-gray-200 transition"
          >
            <Camera className="w-4 h-4" />
            Add Photo
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
          onChange={e => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = ev => setImage(ev.target.result);
              reader.readAsDataURL(file);
            }
          }}
        />
      </div>
    </div>
  );
};

// ========================================
// REVIEWS PAGE
// ========================================
const ReviewsPage = ({ user, setPage, updateNotificationCount, onViewUserProfile }) => {
  const [reviews, setReviews] = useState([]);
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

  useEffect(() => {
    loadReviews();
    loadLikedReviews();
  }, [user.email]);

  const loadReviews = () => {
    const stored = JSON.parse(localStorage.getItem('reviews') || '[]');
    setReviews(stored);
  };

  const loadLikedReviews = () => {
    const liked = JSON.parse(localStorage.getItem(`user_${user.email}_likedReviews`) || '[]');
    setLikedReviews(liked);
  };

  const handleLikeReview = (reviewId, review) => {
    if (likedReviews.includes(reviewId)) return;

    const updatedLiked = [...likedReviews, reviewId];
    setLikedReviews(updatedLiked);
    localStorage.setItem(`user_${user.email}_likedReviews`, JSON.stringify(updatedLiked));

    const updatedReviews = reviews.map(r =>
      r.id === reviewId ? { ...r, likes: (r.likes || 0) + 1 } : r
    );
    setReviews(updatedReviews);
    localStorage.setItem('reviews', JSON.stringify(updatedReviews));

    if (review.userEmail !== user.email) {
      const notification = {
        id: generateId(),
        type: 'like',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} liked your review of "${review.bookName}"`,
        timestamp: new Date().toISOString(),
        read: false
      };

      const userNotifications = JSON.parse(localStorage.getItem(`user_${review.userEmail}_notifications`) || '[]');
      userNotifications.unshift(notification);
      localStorage.setItem(`user_${review.userEmail}_notifications`, JSON.stringify(userNotifications));
      updateNotificationCount?.();
    }
  };

  const handleCreateReview = () => {
    if (!newReview.bookName || !newReview.author || !newReview.review) {
      alert('Please fill all fields');
      return;
    }

    const reviewData = {
      id: generateId(),
      ...newReview,
      userName: user.name,
      userEmail: user.email,
      createdAt: new Date().toISOString(),
      likes: 0
    };

    const updatedReviews = [reviewData, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem('reviews', JSON.stringify(updatedReviews));
    setShowCreateForm(false);
    setNewReview({ bookName: '', author: '', rating: 5, review: '', sentiment: 'positive' });

    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.reviewsGiven = (stats.reviewsGiven || 0) + 1;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
  };

  const filteredReviews = reviews.filter(r =>
    r.bookName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
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
        {/* Search Bar */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by book or author..."
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

        {/* Create Review Form */}
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
                {['positive', 'negative'].map(sentiment => (
                  <button
                    key={sentiment}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, sentiment })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      newReview.sentiment === sentiment
                        ? sentiment === 'positive'
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {sentiment === 'positive' ? '👍 Positive' : '👎 Negative'}
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

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchQuery ? `No reviews found for "${searchQuery}"` : 'No reviews yet. Be the first!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => {
              const isLiked = likedReviews.includes(review.id);
              return (
                <div key={review.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-3 mb-2">
                    <DynamicBookCover title={review.bookName} author={review.author} size="sm" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{review.bookName}</h3>
                      <p className="text-xs text-gray-500">by {review.author}</p>
                      <StarRating rating={review.rating} size="xs" />
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{review.review}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button
                      onClick={() => onViewUserProfile(review.userEmail, review.userName)}
                      className="flex items-center gap-2 hover:opacity-75 transition"
                    >
                      <UserAvatar email={review.userEmail} name={review.userName} size={24} />
                      <span className="text-xs text-gray-600 hover:underline">{review.userName}</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleLikeReview(review.id, review)}
                        disabled={isLiked}
                        className={`flex items-center gap-1 text-xs ${
                          isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500' : ''}`} />
                        {review.likes || 0}
                      </button>

                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          review.sentiment === 'positive'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
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
// CREWS PAGE
// ========================================
const CrewsPage = ({ user, crews: initialCrews, setPage, updateNotificationCount, onViewUserProfile }) => {
  const [view, setView] = useState('list');
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [crewMembers, setCrewMembers] = useState([]);
  const [crews, setCrews] = useState([]);
  const [joinedCrews, setJoinedCrews] = useState([]);
  const [showJoinMsg, setShowJoinMsg] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCrewData, setNewCrewData] = useState({ name: '', author: '', genre: '' });
  const [selectedTab, setSelectedTab] = useState('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadCrews();
    loadJoinedCrews();
  }, [user.email]);

  useEffect(() => {
    if (selectedCrew) {
      loadMessages();
      loadCrewMembers();
    }
  }, [selectedCrew]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadCrews = () => {
    const stored = JSON.parse(localStorage.getItem('crews') || '[]');
    setCrews(stored.length > 0 ? stored : initialCrews);
  };

  const loadJoinedCrews = () => {
    const joined = JSON.parse(localStorage.getItem(`user_${user.email}_joinedCrews`) || '[]');
    setJoinedCrews(joined);
  };

  const loadMessages = () => {
    const msgs = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`) || '[]');
    setMessages(msgs.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
  };

  const loadCrewMembers = () => {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const members = allUsers
      .filter(u => {
        const joined = JSON.parse(localStorage.getItem(`user_${u.email}_joinedCrews`) || '[]');
        return joined.includes(selectedCrew.id) || joined.includes(String(selectedCrew.id));
      })
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        initials: u.name?.slice(0, 2),
        online: Math.random() > 0.5
      }));

    if (!members.find(m => m.email === selectedCrew.createdBy)) {
      members.push({
        id: selectedCrew.createdBy,
        name: selectedCrew.createdByName || 'Creator',
        email: selectedCrew.createdBy,
        initials: (selectedCrew.createdByName || 'CR').slice(0, 2),
        online: true,
        isCreator: true
      });
    }

    setCrewMembers(members);
  };

  const isJoined = (crewId) => joinedCrews.includes(crewId);

  const joinCrew = (crew) => {
    const updatedJoined = [...joinedCrews, crew.id];
    setJoinedCrews(updatedJoined);
    localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updatedJoined));

    const updatedCrews = crews.map(c =>
      c.id === crew.id ? { ...c, members: (c.members || 1) + 1 } : c
    );
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map(u =>
      u.email === user.email ? { ...u, joinedCrews: updatedJoined } : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.crewsJoined = (stats.crewsJoined || 0) + 1;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, joinedCrews: updatedJoined, stats }));

    setShowJoinMsg(`🎉 Joined "${crew.name}"!`);
    setTimeout(() => setShowJoinMsg(''), 3000);
  };

  const leaveCrew = (crew) => {
    if (!window.confirm(`Leave ${crew.name}?`)) return;

    const updatedJoined = joinedCrews.filter(id => id !== crew.id);
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

    const updatedCrews = [newCrew, ...crews];
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));

    joinCrew(newCrew);
    setShowCreateForm(false);
    setNewCrewData({ name: '', author: '', genre: '' });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedCrew || !isJoined(selectedCrew.id)) return;

    const message = {
      id: `msg_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userInitials: user.name?.slice(0, 2).toUpperCase(),
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    const existingMessages = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`) || '[]');
    existingMessages.push(message);
    localStorage.setItem(`crew_${selectedCrew.id}_messages`, JSON.stringify(existingMessages));

    setMessages(prev => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);

    // Notify other members
    const otherMembers = crewMembers.filter(m => m.email !== user.email);
    otherMembers.forEach(member => {
      const notification = {
        id: generateId(),
        type: 'message',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} sent a message in "${selectedCrew.name}"`,
        timestamp: new Date().toISOString(),
        read: false,
        crewId: selectedCrew.id
      };

      const memberNotifications = JSON.parse(localStorage.getItem(`user_${member.email}_notifications`) || '[]');
      memberNotifications.unshift(notification);
      localStorage.setItem(`user_${member.email}_notifications`, JSON.stringify(memberNotifications));
    });

    updateNotificationCount?.();
    setNewMessage('');
  };

  const sendImage = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedCrew || !isJoined(selectedCrew.id)) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const message = {
        id: Date.now(),
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userInitials: user.name?.slice(0, 2).toUpperCase(),
        content: ev.target.result,
        timestamp: new Date().toISOString(),
        type: 'image'
      };

      const existingMessages = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`) || '[]');
      existingMessages.push(message);
      localStorage.setItem(`crew_${selectedCrew.id}_messages`, JSON.stringify(existingMessages));

      setMessages(prev => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);
    };

    reader.readAsDataURL(file);
  };

  const formatTime = (ts) => {
    const diff = Date.now() - new Date(ts);
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    if (days < 7) return `${days}d`;
    return new Date(ts).toLocaleDateString();
  };

  const Toast = () => showJoinMsg ? (
    <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg z-[100] text-center">
      {showJoinMsg}
    </div>
  ) : null;

  const filteredCrews = crews.filter(crew =>
    crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crew.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (crew.genre && crew.genre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Chat View
  if (view === 'chat' && selectedCrew) {
    const hasJoined = isJoined(selectedCrew.id);
    const messagesByDate = messages.reduce((acc, msg) => {
      const date = new Date(msg.timestamp).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(msg);
      return acc;
    }, {});

    return (
      <div className="fixed inset-0 flex flex-col z-[60] overflow-hidden" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%', background: '#ece5dd' }}>
        <Toast />

        {/* Chat Header */}
        <div className="flex-shrink-0 bg-[#C8622A] px-4 py-2.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('detail')} className="p-1 rounded-full hover:bg-white/20">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <DynamicBookCover title={selectedCrew.name} author={selectedCrew.author} size="xs" />
            <div>
              <p className="font-bold text-white text-sm">{selectedCrew.name}</p>
              <p className="text-xs text-orange-100">{crewMembers.length} members</p>
            </div>
          </div>
          <button className="p-2 rounded-full hover:bg-white/20">
            <MoreHorizontal className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
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
          ) : (
            <>
              {Object.entries(messagesByDate).map(([date, msgs]) => (
                <div key={date}>
                  <div className="flex justify-center my-3">
                    <span className="bg-[#C8622A]/20 text-[#7a3c12] text-xs px-3 py-1 rounded-full font-medium">
                      {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {msgs.map((msg) => {
                    const isOwn = msg.userId === user.id;
                    return (
                      <div key={msg.id} className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[80%] items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          {!isOwn && (
                            <UserAvatar
                              email={msg.userEmail}
                              name={msg.userName}
                              size={28}
                              onClick={() => onViewUserProfile(msg.userEmail, msg.userName)}
                            />
                          )}

                          <div
                            className={`rounded-2xl px-3.5 py-2 shadow-sm ${
                              isOwn
                                ? 'bg-[#C8622A] rounded-br-sm'
                                : 'bg-white rounded-bl-sm'
                            }`}
                          >
                            {!isOwn && (
                              <p className="text-xs font-bold text-[#C8622A] mb-0.5">{msg.userName}</p>
                            )}

                            {msg.type === 'image' ? (
                              <img
                                src={msg.content}
                                alt="Shared"
                                className="max-w-full rounded-xl max-h-60"
                              />
                            ) : (
                              <p className={`text-sm leading-relaxed break-words ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                                {msg.content}
                              </p>
                            )}

                            <p className={`text-[10px] text-right mt-0.5 ${isOwn ? 'text-orange-200' : 'text-gray-400'}`}>
                              {formatTime(msg.timestamp)}
                              {isOwn && <span className="ml-1">✓✓</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500">No messages yet. Say something!</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        {hasJoined && (
          <div className="flex-shrink-0 bg-[#ece5dd] px-3 py-2.5" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
            <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow border border-gray-100">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 flex items-center justify-center flex-shrink-0"
              >
                <Plus className="w-5 h-5 text-[#C8622A]" />
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
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
                placeholder="Type a message..."
              />

              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition ${
                  newMessage.trim() ? 'bg-[#C8622A] text-white' : 'bg-gray-200 text-gray-400'
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

  // Crew Detail View
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
              <DynamicBookCover title={selectedCrew.name} author={selectedCrew.author} size="xl" className="mb-4" />
              <h1 className="text-2xl font-bold text-gray-900">{selectedCrew.name}</h1>
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
                <div className="text-center">
                  <p className="text-xl font-bold">{messages.length}</p>
                  <p className="text-xs text-gray-500">Messages</p>
                </div>
              </div>

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
                    className="flex-1 py-3 bg-[#C8622A] text-white rounded-xl font-semibold"
                  >
                    Open Chat
                  </button>
                )}

                <button
                  onClick={() => {
                    const email = prompt("Friend's email:");
                    if (email) {
                      const notification = {
                        id: Date.now(),
                        type: 'invite',
                        fromUser: user.name,
                        message: `${user.name} invited you to join "${selectedCrew.name}"!`,
                        timestamp: new Date().toISOString(),
                        read: false
                      };
                      const userNotifications = JSON.parse(localStorage.getItem(`user_${email}_notifications`) || '[]');
                      userNotifications.unshift(notification);
                      localStorage.setItem(`user_${email}_notifications`, JSON.stringify(userNotifications));
                      alert(`Invited ${email}!`);
                    }
                  }}
                  className="px-4 py-3 border border-gray-200 rounded-xl"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex border-b border-gray-200 px-4">
            {['Chat', 'Members', 'About'].map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab.toLowerCase())}
                className={`flex-1 py-3 text-sm font-medium border-b-2 ${
                  selectedTab === tab.toLowerCase()
                    ? 'text-orange-500 border-orange-500'
                    : 'text-gray-500 border-transparent'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4 pb-24">
            {selectedTab === 'chat' && (
              hasJoined ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setView('chat')}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-[#C8622A] text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Open Chat
                  </button>

                  {messages.slice(-3).reverse().map(msg => (
                    <div key={msg.id} className="flex items-start gap-3 py-2">
                      <UserAvatar email={msg.userEmail} name={msg.userName} size={32} />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm">{msg.userName}</span>
                        <p className="text-sm text-gray-600 truncate">
                          {msg.type === 'image' ? '📷 Image' : msg.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Join to see messages</p>
                </div>
              )
            )}

            {selectedTab === 'members' && (
              <div className="space-y-4">
                {crewMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <UserAvatar
                          email={member.email}
                          name={member.name}
                          size={40}
                          onClick={() => onViewUserProfile(member.email, member.name)}
                        />
                        {member.online && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <button
                          onClick={() => onViewUserProfile(member.email, member.name)}
                          className="font-semibold hover:underline"
                        >
                          {member.name}
                        </button>
                        <p className="text-xs text-gray-500">
                          {member.isCreator ? '👑 Creator' : member.online ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedTab === 'about' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold mb-2">About this Crew</h3>
                  <p className="text-sm text-gray-600">
                    A crew for readers of "{selectedCrew.name}" by {selectedCrew.author}.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created</span>
                    <span>{new Date(selectedCrew.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">By</span>
                    <span>{selectedCrew.createdByName || 'Creator'}</span>
                  </div>
                  {selectedCrew.genre && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Genre</span>
                      <span>{selectedCrew.genre}</span>
                    </div>
                  )}
                </div>

                {hasJoined && (
                  <button
                    onClick={() => leaveCrew(selectedCrew)}
                    className="w-full py-3 border border-red-200 text-red-500 rounded-xl font-medium"
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

  // Crew List View
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
          className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium"
        >
          + Create Crew
        </button>
      </div>

      <div className="px-4 py-4">
        {/* Search Bar */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all crews by book, author, or genre..."
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

        {/* No Results */}
        {searchQuery && filteredCrews.length === 0 && (
          <div className="bg-white rounded-xl p-6 text-center border border-orange-200 mb-4">
            <Search className="w-10 h-10 text-orange-300 mx-auto mb-2" />
            <p className="text-gray-700 font-semibold mb-1">No crew found for "{searchQuery}"</p>
            <p className="text-gray-500 text-sm mb-3">Be the first to create this crew!</p>
            <button
              onClick={() => {
                setNewCrewData({ name: searchQuery, author: '', genre: '' });
                setShowCreateForm(true);
              }}
              className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold"
            >
              Create this Crew
            </button>
          </div>
        )}

        {/* Create Crew Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Create New Crew</h3>
            </div>

            {newCrewData.name && (
              <div className="flex justify-center mb-4">
                <DynamicBookCover title={newCrewData.name} author={newCrewData.author} size="lg" />
              </div>
            )}

            <div className="space-y-3">
              <input
                value={newCrewData.name}
                onChange={e => setNewCrewData({ ...newCrewData, name: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300"
                placeholder="📖 Book title *"
              />

              <input
                value={newCrewData.author}
                onChange={e => setNewCrewData({ ...newCrewData, author: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300"
                placeholder="✍️ Author *"
              />

              <input
                value={newCrewData.genre}
                onChange={e => setNewCrewData({ ...newCrewData, genre: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300"
                placeholder="🏷️ Genre (e.g. Fiction, Self-Help)"
              />

              <div className="flex gap-2">
                <button
                  onClick={createCrew}
                  className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-bold"
                >
                  Create Crew
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Crews */}
        {!searchQuery && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              My Crews
            </h2>

            {crews.filter(c => isJoined(c.id)).length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                <p className="text-gray-500 text-sm">No crews joined yet. Explore below!</p>
              </div>
            ) : (
              crews.filter(c => isJoined(c.id)).map(crew => (
                <div
                  key={crew.id}
                  className="bg-white rounded-xl overflow-hidden border border-green-200 shadow-sm cursor-pointer mb-3"
                  onClick={() => {
                    setSelectedCrew(crew);
                    setView('detail');
                  }}
                >
                  <div className="flex items-center px-4 gap-4 py-3">
                    <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 truncate">{crew.name}</p>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full flex-shrink-0">
                          Joined
                        </span>
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
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedCrew(crew);
                        setView('chat');
                      }}
                      className="px-3 py-1 bg-[#C8622A] text-white rounded-lg text-xs font-medium"
                    >
                      Chat
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Discover Crews */}
        <div>
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            {searchQuery ? `Search Results (${filteredCrews.filter(c => !isJoined(c.id)).length})` : 'Discover Crews'}
          </h2>

          {!searchQuery && (
            <p className="text-xs text-gray-400 mb-3">All reading crews — join any that interests you</p>
          )}

          <div className="space-y-3">
            {filteredCrews.filter(c => !isJoined(c.id)).map(crew => (
              <div
                key={crew.id}
                className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer"
                onClick={() => {
                  setSelectedCrew(crew);
                  setView('detail');
                }}
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
                    onClick={e => {
                      e.stopPropagation();
                      joinCrew(crew);
                    }}
                    className="px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}

            {!searchQuery && filteredCrews.filter(c => !isJoined(c.id)).length === 0 && (
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                <p className="text-gray-500 text-sm">You've joined all available crews! 🎉</p>
              </div>
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
    loadUserData();
  }, [user.email]);

  const loadUserData = () => {
    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    setUserStats(stats);

    const savedImage = localStorage.getItem(`user_${user.email}_profile_image`);
    if (savedImage) setProfileSrc(savedImage);

    const books = JSON.parse(localStorage.getItem(`user_${user.email}_booksRead`) || '[]');
    setMyBooks(books);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageData = ev.target.result;
      setProfileSrc(imageData);
      localStorage.setItem(`user_${user.email}_profile_image`, imageData);

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map(u => u.email === user.email ? { ...u, profileImage: imageData } : u);
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, profileImage: imageData }));

      onUpdateUser?.({ ...user, profileImage: imageData });
    };

    reader.readAsDataURL(file);
  };

  const handleSaveGoal = () => {
    const updatedUser = { ...user, readingGoal: editGoal };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setReadingGoal(editGoal);
    setShowEditGoal(false);
    onUpdateUser?.(updatedUser);
  };

  const handleSaveProfile = () => {
    const updatedUser = { ...user, name: editName, bio: editBio };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map(u => u.email === user.email ? updatedUser : u);
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    onUpdateUser?.(updatedUser);
    setEditingProfile(false);
  };

  const handleAddBook = () => {
    if (!newBook.title) {
      alert('Enter book title');
      return;
    }

    const book = {
      id: Date.now(),
      ...newBook,
      addedAt: new Date().toISOString()
    };

    const updatedBooks = [book, ...myBooks];
    setMyBooks(updatedBooks);
    localStorage.setItem(`user_${user.email}_booksRead`, JSON.stringify(updatedBooks));

    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.booksRead = updatedBooks.length;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
    setUserStats(prev => ({ ...prev, booksRead: updatedBooks.length }));

    setNewBook({ title: '', author: '', rating: 5, notes: '' });
    setShowAddBook(false);
  };

  const handleDeleteBook = (bookId) => {
    const updatedBooks = myBooks.filter(b => b.id !== bookId);
    setMyBooks(updatedBooks);
    localStorage.setItem(`user_${user.email}_booksRead`, JSON.stringify(updatedBooks));

    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.booksRead = updatedBooks.length;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
    setUserStats(prev => ({ ...prev, booksRead: updatedBooks.length }));
  };

  const tabs = ['Posts', 'Reviews', 'Books Read', 'Crews', 'Saved Posts'];

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold" style={{ fontFamily: 'Georgia, serif' }}>My Profile</span>
        </div>
        <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-lg">
          <LogOut className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="px-4 py-5">
        {/* Profile Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="relative flex-shrink-0">
            {profileSrc ? (
              <img
                src={profileSrc}
                alt={user?.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-orange-300 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.slice(0, 2).toUpperCase()}
              </div>
            )}

            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>

            <input
              ref={fileRef}
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
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300"
                  placeholder="Your bio..."
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
                <h2 className="text-xl font-bold text-gray-900 truncate">{user?.name}</h2>
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
                  className="mt-3 px-4 py-1.5 border border-orange-200 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <p className="text-xs text-gray-500">
            Your <strong>Books Read</strong> and <strong>Saved Posts</strong> are private — only you can see them
          </p>
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
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Monthly Goal</label>
                  <input
                    type="number"
                    value={editGoal.monthly}
                    onChange={e => setEditGoal({ ...editGoal, monthly: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm"
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
              <div className="flex items-center justify-between text-sm mb-1">
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
        <div className="flex border-b border-gray-200 mb-4 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 text-sm pb-2.5 px-3 font-medium border-b-2 transition ${
                activeTab === tab ? 'text-orange-500 border-orange-500' : 'text-gray-500 border-transparent'
              }`}
            >
              {(tab === 'Books Read' || tab === 'Saved Posts') && (
                <Lock className="w-3 h-3 inline mr-1 opacity-50" />
              )}
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
                  {post.image && <img src={post.image} alt="" className="w-full rounded-xl mt-2" />}
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

        {/* Reviews Tab */}
        {activeTab === 'Reviews' && (
          <div className="space-y-4">
            {myReviews.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No reviews yet</p>
                <button
                  onClick={() => setPage('reviews')}
                  className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm"
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

        {/* Books Read Tab */}
        {activeTab === 'Books Read' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">
                {myBooks.length} books read
                <Lock className="w-3 h-3 inline ml-1 text-gray-400" />
              </p>
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
              myBooks.map(book => (
                <div key={book.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-start gap-3">
                  <DynamicBookCover title={book.title} author={book.author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900">{book.title}</h3>
                    <p className="text-xs text-gray-500">{book.author}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <StarRating rating={book.rating} size="xs" />
                    </div>
                    {book.notes && <p className="text-xs text-gray-600 mt-1 italic">"{book.notes}"</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(book.addedAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    className="p-1 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Crews Tab */}
        {activeTab === 'Crews' && (
          <div className="space-y-3">
            {userStats.crewsJoined === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No crews joined yet</p>
                <button
                  onClick={() => setPage('crews')}
                  className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm"
                >
                  Browse Crews
                </button>
              </div>
            ) : (
              <button
                onClick={() => setPage('crews')}
                className="w-full py-3 bg-orange-50 border border-orange-200 text-orange-600 rounded-xl font-medium"
              >
                View My Crews →
              </button>
            )}
          </div>
        )}

        {/* Saved Posts Tab */}
        {activeTab === 'Saved Posts' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
              <Lock className="w-3 h-3" />
              Only visible to you
            </p>

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
    {
      id: 1,
      name: 'Atomic Habits',
      author: 'James Clear',
      genre: 'Self Improvement',
      members: 1,
      chats: 0,
      createdBy: 'system',
      createdByName: 'ReadCrew',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Tuesdays with Morrie',
      author: 'Mitch Albom',
      genre: 'Inspiration',
      members: 1,
      chats: 0,
      createdBy: 'system',
      createdByName: 'ReadCrew',
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      name: 'The Alchemist',
      author: 'Paulo Coelho',
      genre: 'Fiction',
      members: 1,
      chats: 0,
      createdBy: 'system',
      createdByName: 'ReadCrew',
      createdAt: new Date().toISOString()
    }
  ]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [currentToast, setCurrentToast] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [viewingFullProfile, setViewingFullProfile] = useState(null);

  useEffect(() => {
    setShowBottomNav(!(currentPage === 'post' || viewingFullProfile));
  }, [currentPage, viewingFullProfile]);

  useEffect(() => {
    loadStoredUser();
    loadStoredData();
  }, []);

  const loadStoredUser = () => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setIsLoggedIn(true);

      setFollowing(JSON.parse(localStorage.getItem(`user_${user.email}_following`) || '[]'));
      setFollowers(JSON.parse(localStorage.getItem(`user_${user.email}_followers`) || '[]'));
      setBlockedUsers(JSON.parse(localStorage.getItem(`user_${user.email}_blocked`) || '[]'));
      setSavedPosts(JSON.parse(localStorage.getItem(`user_${user.email}_savedPosts`) || '[]'));

      const profileImage = localStorage.getItem(`user_${user.email}_profile_image`);
      if (profileImage) setProfileSrc(profileImage);
    }
  };

  const loadStoredData = () => {
    setPosts(JSON.parse(localStorage.getItem('allPosts') || '[]'));

    const storedCrews = JSON.parse(localStorage.getItem('crews') || '[]');
    if (storedCrews.length > 0) setCrews(storedCrews);
  };

  const checkForNewNotifications = useCallback(() => {
    if (!currentUser) return;

    const notifications = JSON.parse(localStorage.getItem(`user_${currentUser.email}_notifications`) || '[]');
    const unreadCount = notifications.filter(n => !n.read).length;
    setNotificationCount(unreadCount);

    const latestUnread = notifications.find(n => !n.read);
    if (latestUnread && !currentToast) setCurrentToast(latestUnread);
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

    ['following', 'followers', 'blocked'].forEach(key => {
      if (!localStorage.getItem(`user_${userData.email}_${key}`)) {
        localStorage.setItem(`user_${userData.email}_${key}`, JSON.stringify([]));
      }
    });

    if (!localStorage.getItem(`user_${userData.email}_stats`)) {
      localStorage.setItem(`user_${userData.email}_stats`, JSON.stringify({
        booksRead: 0,
        reviewsGiven: 0,
        postsCreated: 0,
        crewsJoined: 0
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
      shares: 0,
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
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const filtered = allPosts.filter(p => p.id !== post.id);
    localStorage.setItem('allPosts', JSON.stringify(filtered));
    setPosts(filtered);

    const stats = JSON.parse(localStorage.getItem(`user_${currentUser.email}_stats`) || '{}');
    stats.postsCreated = Math.max((stats.postsCreated || 0) - 1, 0);
    localStorage.setItem(`user_${currentUser.email}_stats`, JSON.stringify(stats));
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
    const updatedPosts = allPosts.map(p =>
      p.id === originalPost.id ? { ...p, reshareCount: (p.reshareCount || 0) + 1 } : p
    );
    localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
    setPosts(updatedPosts);

    if (originalPost.userEmail !== currentUser.email) {
      const notification = {
        id: generateId(),
        type: 'reshare',
        fromUser: currentUser.name,
        fromUserEmail: currentUser.email,
        message: `${currentUser.name} reshared your post`,
        timestamp: new Date().toISOString(),
        read: false,
        postId: originalPost.id
      };

      const userNotifications = JSON.parse(localStorage.getItem(`user_${originalPost.userEmail}_notifications`) || '[]');
      userNotifications.unshift(notification);
      localStorage.setItem(`user_${originalPost.userEmail}_notifications`, JSON.stringify(userNotifications));
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
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      shares: 0,
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

      const notification = {
        id: generateId(),
        type: 'follow',
        fromUser: currentUser.name,
        fromUserEmail: currentUser.email,
        message: `${currentUser.name} started following you`,
        timestamp: new Date().toISOString(),
        read: false
      };

      const userNotifications = JSON.parse(localStorage.getItem(`user_${targetEmail}_notifications`) || '[]');
      userNotifications.unshift(notification);
      localStorage.setItem(`user_${targetEmail}_notifications`, JSON.stringify(userNotifications));
    }
  };

  const handleBlockUser = (targetEmail) => {
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

  const filteredPosts = posts.filter(post => !blockedUsers.includes(post.userEmail));

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

      <div className="w-full max-w-md relative bg-white min-h-screen overflow-hidden shadow-xl">
        {/* User Profile Modal */}
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

        {/* Full Profile Page */}
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

        {/* Main Pages */}
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
                onFollow={handleFollow}
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
              unreadCount={notificationCount}
              show={showBottomNav}
            />
          </>
        )}
      </div>
    </div>
  );
}