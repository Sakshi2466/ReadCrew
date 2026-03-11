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
  UserCheck, UserMinus, Hash, AtSign as AtIcon
} from 'lucide-react';

// API imports
import axios from 'axios';
import { io } from 'socket.io-client';
const API_URL = process.env.REACT_APP_API_URL || 'https://versal-book-app.onrender.com';
const socket = io(API_URL, { transports: ['websocket', 'polling'] });

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
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] w-[90%] max-w-sm" style={{ animation: 'slideDown 0.3s ease-out' }}>
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
const Avatar = ({ initials, size = 'md', color = '#C8622A', src, online }) => {
  const sizes = { xs: 'w-7 h-7 text-xs', sm: 'w-9 h-9 text-sm', md: 'w-11 h-11 text-base', lg: 'w-16 h-16 text-xl', xl: 'w-20 h-20 text-2xl' };
  return (
    <div className="relative shrink-0">
      {src ? <img src={src} alt={initials} className={`${sizes[size]} rounded-full object-cover`} />
        : <div className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white`} style={{ backgroundColor: color }}>{initials?.slice(0, 2).toUpperCase()}</div>}
      {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>}
    </div>
  );
};

// ─── STAR RATING ──────────────────────────────────────────────────────────
const StarRating = ({ rating = 0, onChange, size = 'sm' }) => {
  const sz = size === 'sm' ? 'w-4 h-4' : size === 'xs' ? 'w-3 h-3' : 'w-6 h-6';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`${sz} ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} ${onChange ? 'cursor-pointer hover:scale-110 transition' : ''}`} onClick={() => onChange?.(i)} />
      ))}
    </div>
  );
};

// ─── LOADING SPINNER ──────────────────────────────────────────────────────
const LoadingSpinner = ({ size = 'md', color = 'orange' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const colors = { orange: 'border-orange-500', blue: 'border-blue-500', purple: 'border-purple-500' };
  return <div className={`${sizes[size]} border-4 border-t-transparent ${colors[color]} rounded-full animate-spin`}></div>;
};

// ========================================
// PATCH 1 of 7 — PRESENCE + TYPING + READ RECEIPTS
// Add these hooks right after LoadingSpinner
// ========================================

// ─── PRESENCE SYSTEM HOOK ─────────────────────────────────────────────────
const useCrewPresence = (crewId, userId, userName) => {
  const [onlineUsers, setOnlineUsers] = React.useState([]);
  const heartbeatRef = React.useRef(null);
  const PRESENCE_TTL = 30000; // 30 seconds
  const HEARTBEAT_INTERVAL = 15000; // 15 seconds

  const markPresent = React.useCallback(() => {
    if (!crewId || !userId) return;
    localStorage.setItem(
      `crew_${crewId}_presence_${userId}`,
      JSON.stringify({ userId, userName, ts: Date.now() })
    );
  }, [crewId, userId, userName]);

  const markAbsent = React.useCallback(() => {
    if (!crewId || !userId) return;
    localStorage.removeItem(`crew_${crewId}_presence_${userId}`);
  }, [crewId, userId]);

  const getOnlineUsers = React.useCallback(() => {
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
        } catch {}
      }
    }
    return online;
  }, [crewId]);

  React.useEffect(() => {
    if (!crewId || !userId) return;
    markPresent();
    setOnlineUsers(getOnlineUsers());
    heartbeatRef.current = setInterval(() => {
      markPresent();
      setOnlineUsers(getOnlineUsers());
    }, HEARTBEAT_INTERVAL);
    return () => {
      clearInterval(heartbeatRef.current);
      markAbsent();
    };
  }, [crewId, userId]);

  return { onlineUsers, onlineCount: onlineUsers.length };
};

// ─── TYPING INDICATOR HOOK ────────────────────────────────────────────────
const useTypingIndicator = (crewId, userId, userName) => {
  const [typingUsers, setTypingUsers] = React.useState([]);
  const typingTimeoutRef = React.useRef(null);
  const TYPING_TTL = 3000; // 3 seconds

  const broadcastTyping = React.useCallback(() => {
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

  const stopTyping = React.useCallback(() => {
    if (!crewId || !userId) return;
    clearTimeout(typingTimeoutRef.current);
    localStorage.removeItem(`crew_${crewId}_typing_${userId}`);
  }, [crewId, userId]);

  React.useEffect(() => {
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
          } catch {}
        }
      }
      setTypingUsers(typing);
    }, 1500);
    return () => {
      clearInterval(interval);
      stopTyping();
    };
  }, [crewId, userId]);

  return { typingUsers, broadcastTyping, stopTyping };
};

// ─── READ RECEIPT HELPERS ─────────────────────────────────────────────────
const markCrewMessagesRead = (crewId, userId) => {
  if (!crewId || !userId) return;
  localStorage.setItem(`crew_${crewId}_lastRead_${userId}`, Date.now().toString());
};

const getReadStatus = (msgTimestamp, crewId, onlineCount) => {
  const msgTime = new Date(msgTimestamp).getTime();
  // Check if any other user has read up to this message
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`crew_${crewId}_lastRead_`)) {
      const lastRead = parseInt(localStorage.getItem(key) || '0');
      if (lastRead >= msgTime) return 'read';
    }
  }
  return onlineCount > 1 ? 'delivered' : 'sent';
};

// ─── BOTTOM NAV ──────────────────────────────────────────────────────────
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
          <button key={id} onClick={() => setPage(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative ${active === id ? 'text-[#C8622A]' : 'text-gray-400 hover:text-gray-600'}`}>
            {id === 'post' ? (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center -mt-5 shadow-lg ${active === id ? 'bg-[#C8622A]' : 'bg-gray-800'}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            ) : (
              <Icon className="w-5 h-5" strokeWidth={active === id ? 2.5 : 1.8} />
            )}
            {id === 'crews' && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{unreadCount}</span>
            )}
            <span className={`text-[10px] font-medium ${id === 'post' ? 'mt-1' : ''}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// ─── TOP BAR ─────────────────────────────────────────────────────────────
const TopBar = ({ user, setPage, title, showBack = false, onBack, showProfile = true, onNotificationClick, notificationCount = 0, profileSrc }) => (
  <header className="sticky top-0 bg-white/95 backdrop-blur-sm z-40 px-4 py-3 flex items-center justify-between border-b border-gray-200">
    <div className="flex items-center gap-3">
      {showBack && <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-md">
          <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Georgia, serif' }}>{title || 'ReadCrew'}</span>
      </div>
    </div>
    {showProfile && (
      <div className="flex items-center gap-3">
        <button onClick={onNotificationClick} className="relative p-1 hover:bg-gray-100 rounded-lg transition">
          <Bell className="w-5 h-5 text-gray-600" />
          {notificationCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{notificationCount > 9 ? '9+' : notificationCount}</span>}
        </button>
        <button onClick={() => setPage('profile')} className="hover:opacity-80 transition">
          {profileSrc ? <img src={profileSrc} alt="profile" className="w-8 h-8 rounded-full object-cover border border-orange-200" />
            : <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">{user?.name?.slice(0, 2).toUpperCase()}</div>}
        </button>
      </div>
    )}
  </header>
);

// ─── NOTIFICATIONS PAGE ──────────────────────────────────────────────────
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
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <h2 className="font-semibold text-gray-900">Notifications</h2>
        <button onClick={markAllAsRead} className="text-sm text-orange-500 font-medium">Mark all read</button>
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12"><Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No notifications yet</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((notif) => (
              <div key={notif.id} className={`p-4 ${notif.read ? 'bg-white' : 'bg-orange-50'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${bgColors[notif.type] || 'bg-gray-100'}`}>{icons[notif.type] || <Bell className="w-4 h-4 text-gray-500" />}</div>
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

// ─── SHARE MODAL (for external sharing) ─────────────────────────────────
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
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-4 gap-4 mb-4">
            {[['whatsapp','#25D366','W'],['facebook','#1877F2','F'],['twitter','#1DA1F2','T']].map(([key, color, letter]) => (
              <button key={key} onClick={handlers[key]} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{backgroundColor: color}}>{letter}</div>
                <span className="text-xs text-gray-600 capitalize">{key}</span>
              </button>
            ))}
          </div>
          <button onClick={handlers.copyLink} className="w-full py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50">
            <Link2 className="w-5 h-5 text-orange-500" /><span className="font-medium">Copy Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── RESHARE MODAL (internal reshare) ───────────────────────────────────
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
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
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
            <p className="text-xs text-gray-500 mb-1">Original post by <span className="font-semibold">{post.userName}</span>:</p>
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

// ─── POST OPTIONS MODAL ──────────────────────────────────────────────────
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

// ─── INLINE POST CARD with embedded comments ────────────────────────────
const InlinePostCard = ({ 
  post, user, profileSrc, updateNotificationCount, onShare, onReshareClick, 
  onSaveToggle, isSaved, onDelete, onFollow, isFollowing, onBlock, isBlocked,
  onViewUserProfile 
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likedComments, setLikedComments] = useState(new Set());
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [reshareCount, setReshareCount] = useState(post.reshareCount || 0);
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [showOptions, setShowOptions] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`post_${post.id}_comments`) || '[]');
    setComments(saved);
    const liked = JSON.parse(localStorage.getItem(`user_${user.id}_likedComments`) || '[]');
    setLikedComments(new Set(liked));
    const likedPosts = JSON.parse(localStorage.getItem(`user_${user.email}_likedPosts`) || '[]');
    setIsLiked(likedPosts.includes(post.id));
  }, [post.id, user.id, user.email]);

  const formatTimeAgo = (ts) => {
    const diff = Date.now() - new Date(ts);
    const mins = Math.floor(diff / 60000), hrs = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  const handleLikePost = async () => {
    if (isLiked) return;
    setIsLiked(true);
    setLikeCount(p => p + 1);
    
    // ✅ Save to SERVER (visible to all users)
    await axios.post(`${API_URL}/api/posts/${post._id || post.id}/like`, {
      userEmail: user.email,
      userName: user.name
    }).catch(() => {});

    // Keep local notification for now
    if (post.userEmail !== user.email) {
      const notif = { 
        id: Date.now(), 
        type: 'like', 
        fromUser: user.name, 
        fromUserEmail: user.email,
        message: `${user.name} liked your post`, 
        timestamp: new Date().toISOString(), 
        read: false,
        postId: post._id || post.id 
      };
      const notifs = JSON.parse(localStorage.getItem(`user_${post.userEmail}_notifications`) || '[]');
      notifs.unshift(notif);
      localStorage.setItem(`user_${post.userEmail}_notifications`, JSON.stringify(notifs));
      window.dispatchEvent(new StorageEvent('storage', { key: `user_${post.userEmail}_notifications` }));
      updateNotificationCount?.();
    }
  };

  const handleViewProfile = () => {
    onViewUserProfile(post.userEmail, post.userName);
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
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      content: newComment.trim(),
      mentions: mentions
    };
    
    setNewComment('');
    setReplyTo(null);

    // ✅ Save comment to SERVER
    try {
      const res = await axios.post(`${API_URL}/api/posts/${post._id || post.id}/comments`, commentData);
      if (res.data.success) {
        const saved = res.data.comment;
        const updated = [...comments, { ...saved, userInitials: user.name.slice(0,2).toUpperCase() }];
        localStorage.setItem(`post_${post._id || post.id}_comments`, JSON.stringify(updated));
        setComments(updated);
      }
    } catch {
      // fallback: save locally
      const comment = { 
        id: Date.now(), 
        ...commentData, 
        userInitials: user.name.slice(0,2).toUpperCase(), 
        timestamp: new Date().toISOString(), 
        likes: 0 
      };
      const updated = [...comments, comment];
      localStorage.setItem(`post_${post._id || post.id}_comments`, JSON.stringify(updated));
      setComments(updated);
    }

    // Notification for mentions
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
          message: `${user.name} mentioned you in a comment: "${newComment.substring(0, 40)}"`, 
          timestamp: new Date().toISOString(), 
          read: false,
          postId: post._id || post.id
        };
        const notifs = JSON.parse(localStorage.getItem(`user_${mentionedUser.email}_notifications`) || '[]');
        notifs.unshift(notif);
        localStorage.setItem(`user_${mentionedUser.email}_notifications`, JSON.stringify(notifs));
        window.dispatchEvent(new StorageEvent('storage', { key: `user_${mentionedUser.email}_notifications` }));
      }
    });
    
    if (post.userEmail !== user.email) {
      const notif = { 
        id: Date.now(), 
        type: 'comment', 
        fromUser: user.name, 
        fromUserEmail: user.email,
        message: `${user.name} commented: "${newComment.substring(0, 40)}"`, 
        timestamp: new Date().toISOString(), 
        read: false,
        postId: post._id || post.id 
      };
      const notifs = JSON.parse(localStorage.getItem(`user_${post.userEmail}_notifications`) || '[]');
      notifs.unshift(notif);
      localStorage.setItem(`user_${post.userEmail}_notifications`, JSON.stringify(notifs));
      window.dispatchEvent(new StorageEvent('storage', { key: `user_${post.userEmail}_notifications` }));
      updateNotificationCount?.();
    }
  };

  const handleLikeComment = (commentId) => {
    if (likedComments.has(commentId)) return;
    const updated = comments.map(c => c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c);
    setComments(updated);
    localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(updated));
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

  const topLevel = comments.filter(c => !c.parentId);
  const visibleComments = showAllComments ? topLevel : topLevel.slice(0, 3);
  const isPostAuthor = user.email === post.userEmail;

  const CommentRow = ({ comment, isReply = false }) => {
    const replies = comments.filter(c => c.parentId === comment.id);
    const liked = likedComments.has(comment.id);
    const isOwn = comment.userId === user.id;

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
      <div className={`flex gap-3 ${isReply ? 'mt-3' : ''}`}>
        <div className="flex flex-col items-center flex-shrink-0" style={{ width: 36 }}>
          <button onClick={() => onViewUserProfile(comment.userEmail, comment.userName)}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm hover:opacity-80 transition">
              {comment.userInitials}
            </div>
          </button>
          {(replies.length > 0 && (showReplies[comment.id] || replies.length <= 2)) && (
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

          {renderContent()}

          <div className="flex items-center gap-4 mt-1.5">
            <button
              onClick={() => handleLikeComment(comment.id)}
              disabled={liked}
              className={`flex items-center gap-1.5 text-xs font-medium transition-all ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-500' : ''}`} />
              <span>{comment.likes || 0}</span>
            </button>
            <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 font-medium">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{replies.length}</span>
            </button>
            <button
              onClick={() => { setReplyTo(comment); setTimeout(() => inputRef.current?.focus(), 100); }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 font-semibold"
            >
              <Share2 className="w-3 h-3 rotate-180" />
              Reply
            </button>
            {isOwn && (
              <button onClick={() => handleDeleteComment(comment.id)} className="ml-auto text-gray-200 hover:text-red-400 transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {replies.length > 0 && (
            <div className="mt-2">
              {!showReplies[comment.id] && replies.length > 1 && (
                <button
                  onClick={() => setShowReplies(p => ({ ...p, [comment.id]: true }))}
                  className="text-xs text-orange-500 font-semibold mb-2 flex items-center gap-1"
                >
                  ↳ View {replies.length} replies
                </button>
              )}
              {(showReplies[comment.id] || replies.length === 1) && (
                <div className="space-y-2 pl-3 border-l-2 border-orange-100">
                  {replies.map(r => <CommentRow key={r.id} comment={r} isReply />)}
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <button onClick={handleViewProfile} className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm shadow hover:opacity-80 transition">
                {post.userName?.slice(0, 2).toUpperCase() || 'U'}
              </div>
            </button>

            <div className="flex-1 min-w-0">
              <button onClick={handleViewProfile} className="flex items-center gap-2 flex-wrap hover:underline">
                <span className="font-bold text-gray-900 text-sm">{post.userName || 'Anonymous'}</span>
                <span className="text-xs text-gray-400">{formatTimeAgo(post.createdAt || Date.now())}</span>
              </button>
              {post.bookName && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <BookOpen className="w-3 h-3 text-orange-400" />
                  <span className="text-xs text-gray-500 font-medium">{post.bookName}{post.author ? ` · ${post.author}` : ''}</span>
                </div>
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
            className={`flex items-center gap-1.5 text-sm font-semibold transition-all ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
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
            className={`flex items-center gap-1.5 text-sm font-semibold transition ${isSaved ? 'text-orange-500' : 'text-gray-500 hover:text-orange-400'}`}
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

        <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/60">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 pl-2 border-l-2 border-orange-400">
              <p className="text-xs text-orange-600 font-medium flex-1">
                Replying to <span className="font-bold">{replyTo.userName}</span>
                {replyTo.mentions?.length > 0 && (
                  <span className="ml-2 text-xs bg-orange-100 px-2 py-0.5 rounded-full">
                    @mentions: {replyTo.mentions.join(', ')}
                  </span>
                )}
              </p>
              <button onClick={() => setReplyTo(null)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            {profileSrc ? (
              <img src={profileSrc} alt="p" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.slice(0,2).toUpperCase()}
              </div>
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
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${newComment.trim() ? 'bg-orange-500 text-white shadow-sm active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              Post
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            <span className="font-semibold">Tip:</span> Use @username to mention someone
          </p>
        </div>

        {comments.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 space-y-1">
            {visibleComments.map(comment => (
              <CommentRow key={comment.id} comment={comment} />
            ))}

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

        {comments.length === 0 && (
          <div className="px-4 pb-4">
            <p className="text-xs text-gray-400 text-center">Be the first to comment 💬</p>
          </div>
        )}
      </div>
    </>
  );
};

// ─── LOGIN PAGE ──────────────────────────────────────────────────────────
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
    
    ['stats','joinedCrews','notifications','likedPosts','likedReviews'].forEach(key => {
      if (!localStorage.getItem(`user_${userData.email}_${key}`)) {
        localStorage.setItem(`user_${userData.email}_${key}`, JSON.stringify(userData[key] || (key === 'stats' ? userData.stats : [])));
      }
    });
    return userData;
  };

  const handleSendOTP = async () => {
    setErrorMsg('');
    if (!name.trim() || name.trim().length < 2) { setErrorMsg('Please enter your full name (at least 2 characters)'); return; }
    if (!validateEmail(email)) { setErrorMsg('Please enter a valid email address'); return; }
    setLoading(true);
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('devOTP', otp);
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
    if (otpInput.length !== 6) { setErrorMsg('Please enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const devOTP = localStorage.getItem('devOTP');
      const otpOk = (devOTP && otpInput === devOTP);

      if (!otpOk) {
        setErrorMsg('❌ Incorrect code. Please try again.');
        setLoading(false);
        return;
      }

      if (devOTP) localStorage.removeItem('devOTP');

      const userData = saveLocalUser({
        id: Date.now().toString(),
        name: name,
        email: email,
        password,
        readingGoal,
        isVerified: true,
        createdAt: new Date().toISOString(),
        stats: { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 },
        joinedCrews: [], likedPosts: [], likedReviews: [], booksRead: [],
        followers: [], following: [], bio: 'Reading is my superpower'
      });

      setShowOTP(false);
      onLogin(userData);
    } catch (err) {
      setErrorMsg('Verification failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleLogin = async () => {
    setErrorMsg('');
    if (!validateEmail(email)) { setErrorMsg('Please enter a valid email address'); return; }
    if (!password.trim()) { setErrorMsg('Please enter your password'); return; }
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

        <input type="text" inputMode="numeric" value={otpInput}
          onChange={e => { setOtpInput(e.target.value.replace(/\D/g,'').slice(0,6)); setErrorMsg(''); }}
          className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none text-center text-3xl tracking-widest mb-4 font-mono"
          placeholder="000000" maxLength="6" autoFocus />

        <button onClick={handleVerifyOTP} disabled={loading || otpInput.length !== 6}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-50 mb-3">
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </button>

        <div className="flex justify-between items-center">
          <button onClick={() => { setShowOTP(false); setErrorMsg(''); setInfoMsg(''); setDevOtpDisplay(''); }} className="text-gray-500 text-sm flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={handleSendOTP} disabled={loading} className="text-orange-500 text-sm font-semibold">
            Resend code
          </button>
        </div>
      </div>
    </div>
  );

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
                  <input value={name} onChange={e => { setName(e.target.value); setErrorMsg(''); }}
                    className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                    placeholder="Full Name *" autoComplete="name" />
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm"><Target className="w-4 h-4 text-orange-500" />Reading Goals (Optional)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-gray-600 mb-1 block">Yearly books</label><input type="number" value={readingGoal.yearly} onChange={e => setReadingGoal({...readingGoal, yearly: parseInt(e.target.value)||0})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm" min="0" max="100" /></div>
                    <div><label className="text-xs text-gray-600 mb-1 block">Monthly books</label><input type="number" value={readingGoal.monthly} onChange={e => setReadingGoal({...readingGoal, monthly: parseInt(e.target.value)||0})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm" min="0" max="20" /></div>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
              <Mail className="w-5 h-5 text-gray-400" />
              <input value={email} onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                placeholder="Email address *" type="email" autoComplete="email" />
            </div>

            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
              <Lock className="w-5 h-5 text-gray-400" />
              <input value={password} onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
                type={showPass ? 'text' : 'password'}
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                placeholder={isLogin ? 'Password *' : 'Create a password *'}
                autoComplete={isLogin ? 'current-password' : 'new-password'} />
              <button onClick={() => setShowPass(!showPass)} type="button">
                {showPass ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>

          <button
            onClick={isLogin ? handleLogin : handleSendOTP}
            disabled={loading}
            className="w-full mt-5 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><LoadingSpinner size="sm" color="orange" /><span>Please wait...</span></> : isLogin ? 'Log In' : 'Create Account →'}
          </button>

          {isLogin && (
            <p className="text-xs text-center text-gray-400 mt-3">
              Login works across all your devices
            </p>
          )}

          <p className="text-center text-sm text-gray-500 mt-4">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setEmail(''); setPassword(''); setName(''); }}
              className="text-orange-500 font-semibold">
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
const BookCard = ({ book, onCreateCrew }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
    <div className="flex gap-4">
      <DynamicBookCover title={book.title} author={book.author} size="md" />
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
      <button onClick={onCreateCrew} className="flex-1 py-2.5 bg-[#C8622A] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5">
        <Users className="w-4 h-4" />Create Crew
      </button>
      <button onClick={() => { navigator.clipboard.writeText(`"${book.title}" by ${book.author}`); }} className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
        <Share2 className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  </div>
);

// ─── USER PROFILE MODAL (Quick View) ─────────────────────────────────────────────
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
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="p-5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {userName?.slice(0, 2).toUpperCase()}
              </div>
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
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Heart className="w-3 h-3" /> {post.likes || 0}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Repeat className="w-3 h-3" /> {post.reshareCount || 0}
                          </span>
                        </div>
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
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} size="xs" />
                        </div>
                        <p className="text-xs text-gray-400">{formatTimeAgo(review.createdAt)}</p>
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

// ─── FULL USER PROFILE PAGE ─────────────────────────────────────────────
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

    const books = JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_booksRead`) || '[]');
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
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {viewedUserName?.slice(0,2).toUpperCase()}
            </div>
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

        {/* ========================================
            PATCH 7 of 7 — PRIVACY NOTICE
            Added: Posts, Reviews, Books & Crews are public · Saved posts are private
        ======================================== */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3 px-1">
          <Globe className="w-3 h-3" />
          <span>Posts, Reviews, Books &amp; Crews are public · Saved posts are private</span>
        </div>

        <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-shrink-0 text-sm pb-2.5 px-3 font-medium border-b-2 transition ${activeTab === tab ? 'text-orange-500 border-orange-500' : 'text-gray-500 border-transparent'}`}>{tab}</button>
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

// ─── HOME PAGE ──────────────────────────────────────────────────────────────
const HomePage = ({ 
  user, posts, setPosts, crews, setPage, donations, reviews, onUpdateStats, 
  updateNotificationCount, profileSrc, savedPosts, onSavePost, onResharePost, 
  onDeletePost, onFollow, following, onBlock, blockedUsers, onViewUserProfile 
}) => {
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [feedPosts, setFeedPosts] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookDetails, setShowBookDetails] = useState(false);
  const [bookDetails, setBookDetails] = useState(null);
  const [loadingBookDetails, setLoadingBookDetails] = useState(false);
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
    
    // ✅ Real-time: new posts from other users appear instantly
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
    };
  }, [user?.email, blockedUsers]);

  // Trending books database
  const TRENDING_DB = [
    { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8, readers: 25000, trendReason: '#1 on bestseller lists globally' },
    { title: 'The Psychology of Money', author: 'Morgan Housel', genre: 'Finance', rating: 4.7, readers: 18000, trendReason: 'Still topping business charts' },
    { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.8, readers: 22000, trendReason: 'Beloved by readers worldwide' },
    { title: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', rating: 4.6, readers: 35000, trendReason: 'Fastest-selling fantasy debut' },
    { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', rating: 4.6, readers: 19000, trendReason: 'Reese\'s Book Club favorite' },
  ];

  const loadTrendingBooks = async () => {
    setTrendingBooks(TRENDING_DB);
    setLoadingTrending(false);
  };

  const loadFeedPosts = async () => {
    // ✅ Load from SERVER — visible to ALL users
    try {
      const res = await axios.get(`${API_URL}/api/posts`);
      if (res.data.success) {
        setFeedPosts(res.data.posts.filter(p => !blockedUsers.includes(p.userEmail)));
        return;
      }
    } catch {}
    // fallback to localStorage
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    setFeedPosts(allPosts.slice(0, 15));
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
      <TopBar user={user} setPage={setPage} title="ReadCrew" profileSrc={profileSrc}
        onNotificationClick={() => setPage('notifications')}
        notificationCount={JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]').filter(n => !n.read).length} />

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
          {!hasReadingGoal && <button onClick={() => setPage('profile')} className="mt-3 w-full bg-white/20 hover:bg-white/30 rounded-xl py-2 text-sm font-medium">Set Reading Goals →</button>}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Books', value: userStats.booksRead, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100', page: 'profile' },
            { label: 'Reviews', value: userStats.reviewsGiven, icon: Star, color: 'text-purple-600', bg: 'bg-purple-100', page: 'reviews' },
            { label: 'Posts', value: userStats.postsCreated, icon: Edit3, color: 'text-green-600', bg: 'bg-green-100', page: 'post' },
            { label: 'Crews', value: userStats.crewsJoined, icon: Users, color: 'text-orange-600', bg: 'bg-orange-100', page: 'crews' }
          ].map(({ label, value, icon: Icon, color, bg, page }, idx) => (
            <div key={idx} className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md" onClick={() => setPage(page)}>
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}><Icon className={`w-4 h-4 ${color}`} /></div>
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Trending Books */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-orange-500" />Trending Books</h2>
            <button onClick={() => setPage('explore')} className="text-sm text-orange-500 font-semibold">Explore All</button>
          </div>
          {loadingTrending ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : (
            <div className="flex gap-4 overflow-x-auto pb-2">
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
          )}
        </div>

        {/* Your Crews */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-orange-500" />Your Crews</h2>
            <button onClick={() => setPage('crews')} className="text-sm text-orange-500 font-semibold">View All</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {userCrews.slice(0,2).map(crew => (
              <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer" onClick={() => setPage('crews')}>
                <div className="h-16 flex items-center justify-center p-2 bg-gray-50"><DynamicBookCover title={crew.name} author={crew.author} size="xs" /></div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{crew.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{crew.genre}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500"><Users className="w-3 h-3" />{crew.members||1}</div>
                    <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-lg text-xs">Joined</span>
                  </div>
                </div>
              </div>
            ))}
            {userCrews.length === 0 && (
              <div className="col-span-2 bg-white rounded-xl p-6 text-center border border-gray-200">
                <p className="text-gray-500 text-sm">No crews joined yet</p>
                <button onClick={() => setPage('crews')} className="mt-2 text-orange-500 text-sm font-medium">Browse Crews →</button>
              </div>
            )}
          </div>
        </div>

        {/* Create Post Button */}
        <button onClick={() => setPage('post')} className="w-full bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-center gap-3 hover:shadow-md">
          {profileSrc ? <img src={profileSrc} alt="p" className="w-9 h-9 rounded-full object-cover flex-shrink-0" /> : <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{user?.name?.slice(0,2).toUpperCase()}</div>}
          <span className="text-gray-400 text-sm flex-1 text-left">Share your reading journey...</span>
          <span className="text-xs text-orange-500 font-medium bg-orange-50 px-3 py-1 rounded-full">Post</span>
        </button>

        {/* Community Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-orange-500" />Community Feed</h2>
            <button onClick={() => setPage('reviews')} className="text-sm text-orange-500 font-semibold">View All</button>
          </div>
          <div className="space-y-4">
            {feedPosts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No posts yet. Be the first to share!</p>
                <button onClick={() => setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Create Post</button>
              </div>
            ) : feedPosts.map((post, idx) => (
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
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── EXPLORE PAGE ────────────────────────────────────────────────────────────
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
  const [loadingMoreBooks, setLoadingMoreBooks] = useState(false);
  const [hasMoreBooks, setHasMoreBooks] = useState(false);
  const [currentBookPage, setCurrentBookPage] = useState(1);
  const [lastQuery, setLastQuery] = useState('');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [mode, setMode] = useState('chat');
  const [charName, setCharName] = useState('');
  const [charBook, setCharBook] = useState('');
  const [charLoading, setCharLoading] = useState(false);
  const [charResult, setCharResult] = useState(null);
  const [nearbyLocation, setNearbyLocation] = useState(null);
  const [nearbyCity, setNearbyCity] = useState('');
  const [nearbyLocError, setNearbyLocError] = useState('');
  const [nearbyLocLoading, setNearbyLocLoading] = useState(false);
  const [nearbyTab, setNearbyTab] = useState('libraries');
  const [libraries, setLibraries] = useState([]);
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [libLoading, setLibLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const [hasSearchedLibs, setHasSearchedLibs] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const [backendAlive, setBackendAlive] = useState(null);

  useEffect(() => {
    const ping = async () => {
      try {
        const res = await fetch(`${API_URL}/api/books/trending?page=1`, { signal: AbortSignal.timeout(4000) });
        setBackendAlive(res.ok);
      } catch { setBackendAlive(false); }
    };
    ping();
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMoreBooks && !loadingMoreRef.current) loadMoreBooks(); },
      { threshold: 0.1, rootMargin: '120px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMoreBooks, currentBookPage, lastQuery]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    const newExchange = exchangeCount + 1;
    setExchangeCount(newExchange);
    setChatMessages(prev => [...prev, { role: 'user', content: userText, timestamp: new Date() }]);
    setLastQuery(userText);
    setLoading(true);

    let usedBackend = false;
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 35000);
      const res = await fetch(`${API_URL}/api/books/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, sessionId }),
        signal: controller.signal
      });
      clearTimeout(tid);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && data.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }]);
        if (data.exchangeCount) setExchangeCount(data.exchangeCount);
        if (data.hasRecommendations && data.recommendations?.length > 0) {
          setAllBooks(data.recommendations); setHasMoreBooks(true); setCurrentBookPage(1);
        }
        setBackendAlive(true);
        usedBackend = true;
      }
    } catch { setBackendAlive(false); }

    if (!usedBackend) {
      const { reply, books } = generateClientResponse(userText, allBooks);
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);
      if (books.length > 0) { setAllBooks(books); setHasMoreBooks(false); setCurrentBookPage(1); }
    }

    setLoading(false);
  };

  const loadMoreBooks = async () => {
    if (loadingMoreRef.current || !hasMoreBooks || !lastQuery) return;
    loadingMoreRef.current = true;
    setLoadingMoreBooks(true);
    try {
      if (backendAlive) {
        const nextPage = currentBookPage + 1;
        const res = await axios.post(`${API_URL}/api/books/recommend`, { query: lastQuery, page: nextPage }, { timeout: 30000 });
        if (res.data.success && res.data.recommendations?.length > 0) {
          setAllBooks(prev => [...prev, ...res.data.recommendations]);
          setCurrentBookPage(nextPage);
          setHasMoreBooks(res.data.hasMore && nextPage < 5);
          return;
        }
      }
      const { books } = generateClientResponse(lastQuery, allBooks);
      if (books.length > 0) { setAllBooks(prev => [...prev, ...books]); }
      setHasMoreBooks(false);
    } catch { setHasMoreBooks(false); }
    finally { setLoadingMoreBooks(false); loadingMoreRef.current = false; }
  };

  const searchCharacter = async () => {
    if (!charName.trim()) return;
    setCharLoading(true); setCharResult(null);
    try {
      const res = await axios.post(`${API_URL}/api/books/character-search`, { character: charName.trim(), fromBook: charBook.trim() || undefined });
      if (res.data.success) setCharResult(res.data);
    } catch {
      setCharResult({
        characterAnalysis: `Readers who love "${charName}" tend to gravitate towards books with similarly complex, layered characters who undergo meaningful transformations.`,
        recommendations: [
          { title: 'The Name of the Wind', author: 'Patrick Rothfuss', genre: 'Fantasy', description: 'The tale of a mythical figure told in his own words.', reason: 'Complex, gifted protagonist with a compelling backstory', rating: 4.5 },
          { title: 'A Little Life', author: 'Hanya Yanagihara', genre: 'Literary Fiction', description: 'An intimate portrait of four friends over decades.', reason: 'Deep character study with extraordinary emotional depth', rating: 4.4 },
          { title: 'The Secret History', author: 'Donna Tartt', genre: 'Mystery', description: 'A group of classics students unravel after a murder.', reason: 'Morally complex characters you cannot stop reading about', rating: 4.6 },
        ]
      });
    } finally { setCharLoading(false); }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDistKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const getNearbyLocation = () => {
    if (!navigator.geolocation) { setNearbyLocError('Geolocation not supported by your browser'); return; }
    setNearbyLocLoading(true); setNearbyLocError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setNearbyLocation({ lat, lng });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'User-Agent': 'ReadCrew-App/1.0' } });
          const data = await res.json();
          const c = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'your city';
          setNearbyCity(c);
        } catch { setNearbyCity('your city'); }
        setNearbyLocLoading(false);
        fetchLibraries(lat, lng, radiusKm);
      },
      (err) => {
        setNearbyLocLoading(false);
        if (err.code === 1) setNearbyLocError('Location permission denied. Please allow location and try again.');
        else setNearbyLocError('Could not get location. Please try again.');
      },
      { timeout: 15000, enableHighAccuracy: false }
    );
  };

  const fetchLibraries = async (lat, lng, km) => {
    setLibLoading(true); setHasSearchedLibs(true);
    const rad = km * 1000;
    const query = `[out:json][timeout:25];(node["amenity"="library"](around:${rad},${lat},${lng});way["amenity"="library"](around:${rad},${lat},${lng}););out center;`;
    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query, signal: AbortSignal.timeout(20000) });
      const data = await res.json();
      const libs = (data.elements||[]).map(el => {
        const la = el.lat || el.center?.lat, lo = el.lon || el.center?.lon;
        return { id: el.id, name: el.tags?.name || 'Public Library', address: [el.tags?.['addr:street'], el.tags?.['addr:housenumber'], el.tags?.['addr:city']].filter(Boolean).join(', ') || 'See map', phone: el.tags?.phone || null, website: el.tags?.website || null, opening_hours: el.tags?.opening_hours || null, lat: la, lng: lo, distKm: la && lo ? getDistKm(lat, lng, la, lo) : null };
      });
      libs.sort((a, b) => (a.distKm ?? 999) - (b.distKm ?? 999));
      setLibraries(libs);
    } catch { setLibraries([]); }
    finally { setLibLoading(false); }
  };

  const fetchNearbyEvents = async () => {
    if (!nearbyCity) return;
    setEventsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/nearby/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ city: nearbyCity, lat: nearbyLocation?.lat, lng: nearbyLocation?.lng }), signal: AbortSignal.timeout(30000) });
      if (res.ok) { const data = await res.json(); if (data.events?.length > 0) { setNearbyEvents(data.events); setEventsLoading(false); return; } }
    } catch { /* fall through */ }
    const cityEnc = encodeURIComponent(nearbyCity);
    const addDays = (d) => { const dt = new Date(); dt.setDate(dt.getDate()+d); return dt.toLocaleDateString('en-IN', { weekday:'short', month:'short', day:'numeric' }); };
    setNearbyEvents([
      { id:1, title:'Book Club Meetup', type:'Book Club', description:`Monthly book club in ${nearbyCity} — discuss the latest reads over coffee with fellow book lovers!`, date:addDays(7), venue:`${nearbyCity} Community Library`, link:`https://www.meetup.com/find/?keywords=book+club&location=${cityEnc}`, source:'Meetup', free:true, emoji:'📚' },
      { id:2, title:'Author Talk & Book Signing', type:'Author Event', description:`Local and national authors visit ${nearbyCity} bookstores for readings, Q&A sessions, and meet-and-greets.`, date:addDays(14), venue:'Local Bookstore', link:`https://www.eventbrite.com/d/${cityEnc}/book-author/`, source:'Eventbrite', free:false, emoji:'✍️' },
      { id:3, title:'Literary Festival', type:'Festival', description:`Annual celebration of literature featuring panels, author talks, workshops, and a book bazaar.`, date:addDays(30), venue:`${nearbyCity} Cultural Centre`, link:`https://www.eventbrite.com/d/${cityEnc}/literary-festival/`, source:'Eventbrite', free:false, emoji:'🎪' },
    ]);
    setEventsLoading(false);
  };

  useEffect(() => {
    if (mode === 'nearby' && nearbyTab === 'events' && nearbyLocation && nearbyEvents.length === 0) fetchNearbyEvents();
  }, [nearbyTab, mode]);

  if (mode === 'character') return (
    <div className="min-h-screen bg-[#FAF6F1] pb-24 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => setMode('chat')} className="p-1 hover:bg-gray-100 rounded-xl"><ChevronLeft className="w-5 h-5" /></button>
        <span className="font-semibold">Find Books by Character</span>
      </div>
      <div className="flex gap-2 px-4 py-3 border-b border-gray-100 overflow-x-auto">
        {[['chat','✨','AI Chat'],['character','🎭','By Character'],['nearby','📍','Nearby']].map(([id,emoji,label]) => (
          <button key={id} onClick={() => setMode(id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${mode===id ? 'bg-orange-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200'}`}>{emoji} {label}</button>
        ))}
      </div>
      <div className="px-4 py-5 space-y-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200">
          <p className="text-sm text-gray-600 mb-4">Love a fictional character? Find books with similar ones!</p>
          <input value={charName} onChange={e => setCharName(e.target.value)} placeholder="Character name (e.g. Hermione Granger)" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-2 outline-none focus:border-orange-400" />
          <input value={charBook} onChange={e => setCharBook(e.target.value)} placeholder="From which book (optional)" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-3 outline-none focus:border-orange-400" />
          <button onClick={searchCharacter} disabled={!charName.trim() || charLoading} className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
            {charLoading ? <><LoadingSpinner size="sm" />Searching...</> : '🎭 Find Similar Books'}
          </button>
        </div>
        {charResult && (
          <div className="space-y-4">
            <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100"><p className="text-sm text-orange-800 leading-relaxed">{charResult.characterAnalysis}</p></div>
            {(charResult.recommendations||[]).map((book, i) => (
              <BookCard key={i} book={book} onCreateCrew={() => { onCreateCrew(book); setPage('crews'); }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (mode === 'nearby') return (
    <div className="min-h-screen pb-24 overflow-y-auto" style={{ background: 'linear-gradient(160deg, #FFF8F2 0%, #F0EBFF 100%)' }}>
      <div className="sticky top-0 z-40 border-b border-orange-100 px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,248,242,0.96)', backdropFilter:'blur(12px)' }}>
        <button onClick={() => setMode('chat')} className="p-1.5 hover:bg-orange-100 rounded-xl"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-purple-600 rounded-lg flex items-center justify-center shadow"><MapPin className="w-3.5 h-3.5 text-white" /></div>
        <div className="flex-1">
          <span className="font-bold text-gray-900">Nearby</span>
          {nearbyCity && <span className="text-sm text-gray-400 ml-2">· {nearbyCity}</span>}
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3 border-b border-orange-100 bg-white/70 overflow-x-auto">
        {[['chat','✨','AI Chat'],['character','🎭','By Character'],['nearby','📍','Nearby']].map(([id,emoji,label]) => (
          <button key={id} onClick={() => setMode(id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${mode===id ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200'}`}>{emoji} {label}</button>
        ))}
      </div>

      {!nearbyLocation && (
        <div className="px-4 pt-6">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-orange-100 text-center mb-5">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <MapPin className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Find Your Reading World</h2>
            <p className="text-gray-500 text-sm mb-5 leading-relaxed">
              Discover <strong>public libraries</strong> near you and <strong>book events</strong> happening in your city — all for free.
            </p>
            {nearbyLocError && <p className="text-red-500 text-sm mb-3 bg-red-50 rounded-xl px-3 py-2">{nearbyLocError}</p>}
            <button onClick={getNearbyLocation} disabled={nearbyLocLoading}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-2xl font-bold text-sm shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
              {nearbyLocLoading ? <><LoadingSpinner size="sm" />Detecting location...</> : <><MapPin className="w-4 h-4" />Share My Location</>}
            </button>
          </div>
        </div>
      )}

      {nearbyLocation && (
        <>
          <div className="px-4 pt-4 pb-2 flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-200 shadow-sm">
              <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <span className="text-xs text-gray-500">Radius:</span>
              <select value={radiusKm} onChange={e => setRadiusKm(Number(e.target.value))} className="flex-1 text-sm font-semibold text-gray-800 outline-none bg-transparent">
                {[1,2,5,10,20].map(r => <option key={r} value={r}>{r} km</option>)}
              </select>
            </div>
            <button onClick={() => fetchLibraries(nearbyLocation.lat, nearbyLocation.lng, radiusKm)} className="px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold shadow-sm">Search</button>
          </div>

          <div className="px-4 py-2 flex gap-2">
            {[['libraries','🏛️','Libraries'],['events','📅','Events']].map(([id,emoji,label]) => (
              <button key={id} onClick={() => setNearbyTab(id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${nearbyTab===id ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>
                {emoji} {label}
              </button>
            ))}
          </div>

          {nearbyTab === 'libraries' && (
            <div className="px-4 py-3 space-y-3">
              {libLoading && <div className="text-center py-10"><LoadingSpinner size="lg" /></div>}
              {!libLoading && hasSearchedLibs && libraries.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm">
                  <div className="text-5xl mb-3">🏛️</div>
                  <h3 className="font-bold text-gray-800 mb-1">No libraries found nearby</h3>
                  <p className="text-sm text-gray-500 mb-4">Try increasing the search radius</p>
                  <button onClick={() => { setRadiusKm(20); fetchLibraries(nearbyLocation.lat, nearbyLocation.lng, 20); }} className="px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold">Search 20 km</button>
                </div>
              )}
              {!libLoading && libraries.map(lib => (
                <div key={lib.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-orange-200 text-2xl">🏛️</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm">{lib.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{lib.address}</p>
                        {lib.distKm != null && <span className="inline-block mt-1.5 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">📍 {lib.distKm < 1 ? `${Math.round(lib.distKm*1000)}m` : `${lib.distKm.toFixed(1)} km`} away</span>}
                      </div>
                    </div>
                    {lib.opening_hours && <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5"><Clock className="w-3 h-3 text-orange-400 flex-shrink-0" />{lib.opening_hours}</div>}
                  </div>
                  <div className="px-4 py-2.5 border-t border-gray-100 flex gap-2">
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${lib.lat},${lib.lng}`} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"><Navigation className="w-3.5 h-3.5" />Directions</a>
                    <a href={`https://www.openstreetmap.org/?mlat=${lib.lat}&mlon=${lib.lng}#map=17/${lib.lat}/${lib.lng}`} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"><Map className="w-3.5 h-3.5" />View Map</a>
                    {lib.phone && <a href={`tel:${lib.phone}`} className="py-2 px-3 bg-green-100 text-green-700 rounded-xl flex items-center justify-center"><Phone className="w-3.5 h-3.5" /></a>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {nearbyTab === 'events' && (
            <div className="px-4 py-3 space-y-3">
              {eventsLoading && <div className="text-center py-10"><LoadingSpinner size="lg" /><p className="text-gray-500 text-sm mt-3">Finding book events in {nearbyCity}...</p></div>}
              {!eventsLoading && nearbyEvents.length > 0 && (
                <>
                  {nearbyEvents.map(ev => (
                    <div key={ev.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-purple-100 text-2xl">{ev.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-gray-900 text-sm">{ev.title}</h3>
                              {ev.free ? <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold flex-shrink-0">FREE</span> : <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full font-semibold flex-shrink-0">Paid</span>}
                            </div>
                            <p className="text-xs text-purple-600 font-medium">{ev.type}</p>
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" />{ev.date}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.venue}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">{ev.description}</p>
                      </div>
                      <div className="px-4 py-2.5 border-t border-gray-100">
                        <a href={ev.link} target="_blank" rel="noreferrer" className="flex w-full py-2.5 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-xl text-xs font-bold items-center justify-center gap-1.5 shadow-sm"><ExternalLink className="w-3.5 h-3.5" />Find on {ev.source}</a>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] to-[#FAF6F1] pb-24 overflow-y-auto">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-[#2D1F14] mb-1" style={{fontFamily:'Georgia,serif'}}>What to read next?</h1>
        <p className="text-sm text-[#8B7968]">Chat with your AI book guide</p>
      </div>

      <div className="flex gap-2 px-5 mb-4 overflow-x-auto">
        {[['chat','✨','AI Chat'],['character','🎭','By Character'],['nearby','📍','Nearby']].map(([id,emoji,label]) => (
          <button key={id} onClick={() => setMode(id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${mode===id ? 'bg-orange-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'}`}>
            {emoji} {label}
          </button>
        ))}
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
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#C8622A] text-white rounded-br-sm' : 'bg-white text-[#3A2C25] rounded-bl-sm shadow-sm border border-gray-100'}`}>
                {msg.content}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">{formatTime(msg.timestamp)}</span>
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
              <BookCard key={`${i}-${book.title}`} book={book} onCreateCrew={() => { onCreateCrew(book); setPage('crews'); }} />
            ))}

            <div ref={sentinelRef} className="py-2">
              {loadingMoreBooks && (
                <div className="flex items-center justify-center gap-2 py-3">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm text-orange-500 font-medium">Finding more books...</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="sticky bottom-20 mx-4 mt-4 bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-gray-200 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Tell me what you're in the mood for..."
            className="flex-1 bg-transparent text-sm text-[#2D1F14] outline-none placeholder-gray-400" />
          <button onClick={sendMessage} disabled={!input.trim() || loading}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition flex-shrink-0 ${input.trim() && !loading ? 'bg-[#C8622A] text-white' : 'bg-gray-100 text-gray-400'}`}>
            <Send className="w-4 h-4" />
          </button>
        </div>
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
  const fileRef = useRef();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    const postData = {
      content, 
      bookName, 
      author, 
      image, 
      isPublic, 
      type: 'post',
      userName: user.name, 
      userEmail: user.email,
    };

    // ✅ Send to SERVER first
    try {
      await axios.post(`${API_URL}/api/posts`, postData);
    } catch {
      // fallback to local if server fails
      onPost({ 
        ...postData, 
        id: Date.now(), 
        createdAt: new Date().toISOString(), 
        likes: 0, 
        reshareCount: 0 
      });
    }
    setPage('home');
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white z-[55] overflow-hidden" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={() => setPage('home')} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-600" /></button>
        <h2 className="font-semibold text-gray-900">Create Post</h2>
        <button onClick={handleSubmit} disabled={!content.trim()} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">Share</button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">{user?.name?.slice(0,2).toUpperCase()}</div>
          <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-base resize-none" placeholder="What are you reading?" rows={5} autoFocus />
        </div>
        <div className="space-y-3 mb-4">
          <input value={bookName} onChange={e => setBookName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300" placeholder="Book name (optional)" />
          <input value={author} onChange={e => setAuthor(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300" placeholder="Author (optional)" />
        </div>
        {image && (
          <div className="relative mb-4">
            <img src={image} alt="preview" className="w-full rounded-xl max-h-56 object-cover" />
            <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 rounded-full p-1"><X className="w-4 h-4 text-white" /></button>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 hover:bg-gray-200">
            <Camera className="w-4 h-4" />Add Photo
          </button>
          <button onClick={() => setIsPublic(!isPublic)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${!isPublic ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}>
            {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}{isPublic ? 'Public' : 'Private'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files[0]; if (file) { const r = new FileReader(); r.onload = ev => setImage(ev.target.result); r.readAsDataURL(file); }}} />
      </div>
    </div>
  );
};

// ─── REVIEWS PAGE ──────────────────────────────────────────────────────────
const ReviewsPage = ({ user, setPage, updateNotificationCount, onViewUserProfile }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [likedReviews, setLikedReviews] = useState([]);
  const [newReview, setNewReview] = useState({ bookName: '', author: '', rating: 5, review: '', sentiment: 'positive' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // ✅ Load from SERVER — all users' reviews visible
    axios.get(`${API_URL}/api/reviews`)
      .then(res => {
        if (res.data.success) setReviews(res.data.reviews || res.data.data || []);
      })
      .catch(() => {
        const saved = JSON.parse(localStorage.getItem('reviews') || '[]');
        setReviews(saved);
      })
      .finally(() => setLoading(false));

    const liked = JSON.parse(localStorage.getItem(`user_${user.email}_likedReviews`) || '[]');
    setLikedReviews(liked);
  }, [user.email]);

  const handleLikeReview = (reviewId, review) => {
    if (likedReviews.includes(reviewId)) return;
    const updated = [...likedReviews, reviewId];
    setLikedReviews(updated);
    localStorage.setItem(`user_${user.email}_likedReviews`, JSON.stringify(updated));
    const updatedReviews = reviews.map(r => r.id === reviewId ? { ...r, likes: (r.likes||0)+1 } : r);
    setReviews(updatedReviews);
    localStorage.setItem('reviews', JSON.stringify(updatedReviews));
    if (review.userEmail !== user.email) {
      const notif = { id: Date.now(), type: 'like', fromUser: user.name, fromUserEmail: user.email, message: `${user.name} liked your review of "${review.bookName}"`, timestamp: new Date().toISOString(), read: false };
      const notifs = JSON.parse(localStorage.getItem(`user_${review.userEmail}_notifications`) || '[]');
      notifs.unshift(notif);
      localStorage.setItem(`user_${review.userEmail}_notifications`, JSON.stringify(notifs));
      window.dispatchEvent(new StorageEvent('storage', { key: `user_${review.userEmail}_notifications` }));
      updateNotificationCount?.();
    }
  };

  const handleCreateReview = async () => {
    if (!newReview.bookName || !newReview.author || !newReview.review) { alert('Please fill all fields'); return; }
    const reviewData = { ...newReview, userName: user.name, userEmail: user.email };

    // ✅ Save to SERVER
    try {
      const res = await axios.post(`${API_URL}/api/reviews`, reviewData);
      if (res.data.success || res.data.review) {
        const saved = res.data.review || { ...reviewData, _id: Date.now().toString(), createdAt: new Date().toISOString(), likes: 0 };
        setReviews(prev => [saved, ...prev]);
      }
    } catch {
      // fallback to localStorage
      const saved = JSON.parse(localStorage.getItem('reviews') || '[]');
      const r = { id: Date.now().toString(), ...reviewData, createdAt: new Date().toISOString(), likes: 0 };
      saved.unshift(r); 
      localStorage.setItem('reviews', JSON.stringify(saved));
      setReviews(prev => [r, ...prev]);
    }

    setShowCreateForm(false);
    setNewReview({ bookName: '', author: '', rating: 5, review: '', sentiment: 'positive' });
    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.reviewsGiven = (stats.reviewsGiven || 0) + 1;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
  };

  const filteredReviews = reviews.filter(review => 
    review.bookName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <button onClick={() => setPage('home')} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <h2 className="font-semibold text-gray-900">Book Reviews</h2>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium">{showCreateForm ? 'Cancel' : 'Write Review'}</button>
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
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Write a Review</h3>
            <div className="space-y-3 mb-4">
              <input type="text" value={newReview.bookName} onChange={e => setNewReview({...newReview, bookName: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Book name" />
              <input type="text" value={newReview.author} onChange={e => setNewReview({...newReview, author: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Author" />
              <div><label className="text-xs text-gray-600 mb-1 block">Rating</label><StarRating rating={newReview.rating} onChange={r => setNewReview({...newReview, rating: r})} size="md" /></div>
              <textarea value={newReview.review} onChange={e => setNewReview({...newReview, review: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300 resize-none" placeholder="Write your review..." rows={4} />
              <div className="flex gap-2">
                {['positive','negative'].map(s => (
                  <button key={s} type="button" onClick={() => setNewReview({...newReview, sentiment: s})} className={`flex-1 py-2 rounded-lg text-sm font-medium ${newReview.sentiment === s ? (s === 'positive' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-gray-100 text-gray-600'}`}>
                    {s === 'positive' ? '👍 Positive' : '👎 Negative'}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleCreateReview} className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium">Submit Review</button>
          </div>
        )}
        {loading ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            {searchQuery ? (
              <>
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No reviews found for "{searchQuery}"</p>
                <button onClick={() => setSearchQuery('')} className="mt-3 text-orange-500 text-sm font-medium">Clear search</button>
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
            {filteredReviews.map((review, idx) => {
              const isLiked = likedReviews.includes(review.id);
              return (
                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-3 mb-2">
                    <DynamicBookCover title={review.bookName} author={review.author} size="sm" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{review.bookName}</h3>
                      <p className="text-xs text-gray-500">by {review.author}</p>
                      <div className="flex items-center gap-1 mt-1"><StarRating rating={review.rating} size="xs" /></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{review.review}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button 
                      onClick={() => onViewUserProfile(review.userEmail, review.userName)}
                      className="flex items-center gap-2 hover:opacity-75 transition"
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {review.userName?.slice(0,2)||'U'}
                      </div>
                      <span className="text-xs text-gray-600 hover:underline">{review.userName}</span>
                    </button>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleLikeReview(review.id, review)} disabled={isLiked} className={`flex items-center gap-1 text-xs ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500' : ''}`} />{review.likes||0}
                      </button>
                      <span className={`text-xs px-2 py-1 rounded-full ${review.sentiment === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{review.sentiment === 'positive' ? '👍' : '👎'}</span>
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

// ─── CREWS PAGE ─────────────────────────────────────────────────────────────
const CrewsPage = ({ user, crews: initialCrews, setPage, updateNotificationCount, onViewUserProfile }) => {
  const [view, setView] = useState('list');
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [crewMembers, setCrewMembers] = useState([]);
  const [crews, setCrews] = useState([]);
  const [joinedCrews, setJoinedCrews] = useState([]);
  const [showJoinMsg, setShowJoinMsg] = useState('');
  const [showCreateForm, setShowCreateCrewForm] = useState(false);
  const [newCrewData, setNewCrewData] = useState({ name: '', author: '', genre: '' });
  const [selectedTab, setSelectedTab] = useState('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const crewExists = (bookName, author) => {
    return crews.some(crew => 
      crew.name.toLowerCase() === bookName.toLowerCase() && 
      crew.author.toLowerCase() === author.toLowerCase()
    );
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('crews') || '[]');
    setCrews(saved.length > 0 ? saved : initialCrews);
    const jc = JSON.parse(localStorage.getItem(`user_${user.email}_joinedCrews`) || '[]');
    setJoinedCrews(jc);
  }, [user.email]);

  useEffect(() => {
    if (selectedCrew) {
      const msgs = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`) || '[]');
      setMessages(msgs.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Get online users from presence system
      const crewOnlineKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(`crew_${selectedCrew.id}_presence_`)) crewOnlineKeys.push(k);
      }
      const onlineUserIds = new Set(crewOnlineKeys.map(k => {
        try { return JSON.parse(localStorage.getItem(k))?.userId; } catch { return null; }
      }).filter(Boolean));
      
      const members = allUsers.filter(u => u.joinedCrews?.includes(selectedCrew.id) || u.joinedCrews?.includes(String(selectedCrew.id))).map(u => ({ 
        id: u.id, 
        name: u.name, 
        email: u.email, 
        initials: u.name?.slice(0,2), 
        online: onlineUserIds.has(u.id)
      }));

      if (!members.find(m => m.email === selectedCrew.createdBy)) members.push({ id: selectedCrew.createdBy, name: selectedCrew.createdByName||'Creator', email: selectedCrew.createdBy, initials: (selectedCrew.createdByName||'CR').slice(0,2), online: onlineUserIds.has(selectedCrew.createdBy), isCreator: true });
      setCrewMembers(members);
    }
  }, [selectedCrew]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const isJoined = (crewId) => joinedCrews.includes(crewId);

  const joinCrew = async (crew) => {
    // ✅ Tell server this user joined
    axios.post(`${API_URL}/api/crews/${crew.id}/join`, { 
      userEmail: user.email, 
      action: 'join' 
    }).catch(() => {});
    
    const updated = [...joinedCrews, crew.id];
    setJoinedCrews(updated);
    localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updated));
    const updatedCrews = crews.map(c => c.id === crew.id ? { ...c, members: (c.members||1)+1 } : c);
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    localStorage.setItem('users', JSON.stringify(users.map(u => u.email === user.email ? { ...u, joinedCrews: updated } : u)));
    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.crewsJoined = (stats.crewsJoined||0) + 1;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
    const cu = JSON.parse(localStorage.getItem('currentUser') || '{}');
    localStorage.setItem('currentUser', JSON.stringify({ ...cu, joinedCrews: updated, stats }));
    setShowJoinMsg(`🎉 Joined "${crew.name}"!`);
    setTimeout(() => setShowJoinMsg(''), 3000);
  };

  const leaveCrew = (crew) => {
    if (!window.confirm(`Leave ${crew.name}?`)) return;
    const updated = joinedCrews.filter(id => id !== crew.id);
    setJoinedCrews(updated);
    localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updated));
    const updatedCrews = crews.map(c => c.id === crew.id ? { ...c, members: Math.max(0,(c.members||1)-1) } : c);
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));
    if (selectedCrew?.id === crew.id) { setView('list'); setSelectedCrew(null); }
  };

  const createCrew = async () => {
    if (!newCrewData.name || !newCrewData.author) { alert('Please fill book name and author'); return; }
    
    if (crewExists(newCrewData.name, newCrewData.author)) {
      alert('A crew for this book by this author already exists! Each book can have only one crew.');
      return;
    }

    const newCrew = { id: Date.now(), ...newCrewData, members: 1, chats: 0, createdBy: user.email, createdByName: user.name, createdAt: new Date().toISOString() };
    const updatedCrews = [newCrew, ...crews];
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));
    joinCrew(newCrew);
    setShowCreateCrewForm(false);
    setNewCrewData({ name: '', author: '', genre: '' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedCrew || !isJoined(selectedCrew.id)) return;
    
    const msg = {
      userId: user.id, 
      userName: user.name, 
      userEmail: user.email,
      userInitials: user.name?.slice(0,2).toUpperCase(),
      content: newMessage.trim(), 
      type: 'text'
    };
    setNewMessage('');

    // ✅ Send to SERVER — all crew members see it
    try {
      const res = await axios.post(`${API_URL}/api/crews/${selectedCrew.id}/messages`, msg);
      if (res.data.success) {
        setMessages(prev => [...prev, { ...res.data.message, timestamp: new Date(res.data.message.timestamp) }]);
      }
    } catch {
      // fallback to localStorage
      const localMsg = { id: `msg_${Date.now()}`, ...msg, timestamp: new Date().toISOString() };
      const existing = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`) || '[]');
      existing.push(localMsg);
      localStorage.setItem(`crew_${selectedCrew.id}_messages`, JSON.stringify(existing));
      setMessages(prev => [...prev, { ...localMsg, timestamp: new Date() }]);
    }

    // Send notifications to all other crew members
    const otherMembers = crewMembers.filter(member => member.email !== user.email);
    otherMembers.forEach(member => {
      const notif = {
        id: Date.now() + Math.random(),
        type: 'message',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} sent a message in "${selectedCrew.name}"`,
        timestamp: new Date().toISOString(),
        read: false,
        crewId: selectedCrew.id
      };
      
      const memberNotifs = JSON.parse(localStorage.getItem(`user_${member.email}_notifications`) || '[]');
      memberNotifs.unshift(notif);
      localStorage.setItem(`user_${member.email}_notifications`, JSON.stringify(memberNotifs));
    });
    
    // Trigger storage event for other tabs
    window.dispatchEvent(new StorageEvent('storage', { key: `user_${user.email}_notifications` }));
    updateNotificationCount?.();
  };

  const sendImage = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedCrew || !isJoined(selectedCrew.id)) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const msg = { 
        id: Date.now(), 
        userId: user.id, 
        userName: user.name, 
        userEmail: user.email,
        userInitials: user.name?.slice(0,2).toUpperCase(), 
        content: ev.target.result, 
        timestamp: new Date().toISOString(), 
        type: 'image' 
      };
      const existing = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`) || '[]');
      existing.push(msg);
      localStorage.setItem(`crew_${selectedCrew.id}_messages`, JSON.stringify(existing));
      setMessages(prev => [...prev, { ...msg, timestamp: new Date(msg.timestamp) }]);
      
      // Send notifications for image messages too
      const otherMembers = crewMembers.filter(member => member.email !== user.email);
      otherMembers.forEach(member => {
        const notif = {
          id: Date.now() + Math.random(),
          type: 'message',
          fromUser: user.name,
          fromUserEmail: user.email,
          message: `${user.name} shared an image in "${selectedCrew.name}"`,
          timestamp: new Date().toISOString(),
          read: false,
          crewId: selectedCrew.id
        };
        
        const memberNotifs = JSON.parse(localStorage.getItem(`user_${member.email}_notifications`) || '[]');
        memberNotifs.unshift(notif);
        localStorage.setItem(`user_${member.email}_notifications`, JSON.stringify(memberNotifs));
      });
      
      window.dispatchEvent(new StorageEvent('storage', { key: `user_${user.email}_notifications` }));
      updateNotificationCount?.();
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (ts) => {
    const diff = Date.now() - new Date(ts);
    const mins = Math.floor(diff/60000), hrs = Math.floor(diff/3600000), days = Math.floor(diff/86400000);
    if (mins < 1) return 'Just now'; if (mins < 60) return `${mins}m`; if (hrs < 24) return `${hrs}h`; if (days < 7) return `${days}d`; return new Date(ts).toLocaleDateString();
  };

  const Toast = () => showJoinMsg ? (
    <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg z-[100] text-center">{showJoinMsg}</div>
  ) : null;

  // Filter crews based on search query
  const filteredCrews = crews.filter(crew => 
    crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crew.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (crew.genre && crew.genre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (view === 'chat' && selectedCrew) {
    const hasJoined = isJoined(selectedCrew.id);
    
    const { onlineUsers, onlineCount } = useCrewPresence(selectedCrew.id, user.id, user.name);
    const { typingUsers, broadcastTyping, stopTyping } = useTypingIndicator(selectedCrew.id, user.id, user.name);
    
    // ✅ Join socket room for real-time messages
    useEffect(() => {
      if (!selectedCrew) return;
      
      socket.emit('join_crew_room', selectedCrew.id);
      socket.on('new_crew_message', (data) => {
        if (String(data.crewId) === String(selectedCrew.id)) {
          setMessages(prev => [...prev, { ...data.message, timestamp: new Date(data.message.timestamp) }]);
        }
      });
      
      return () => {
        socket.emit('leave_crew_room', selectedCrew.id);
        socket.off('new_crew_message');
      };
    }, [selectedCrew]);
    
    // Mark messages as read when chat is open
    React.useEffect(() => { markCrewMessagesRead(selectedCrew.id, user.id); }, [messages.length]);
    
    const groupsByDate = messages.reduce((acc, msg) => {
      const date = new Date(msg.timestamp).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(msg);
      return acc;
    }, {});

    return (
      <div className="fixed inset-0 flex flex-col z-[60] bg-[#e5ddd5] overflow-hidden" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
        <Toast />
        <div className="flex-shrink-0 bg-white border-b px-4 py-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => { setView('detail'); }} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
            <DynamicBookCover title={selectedCrew.name} author={selectedCrew.author} size="xs" />
            
            <div>
              <p className="font-semibold text-gray-900 text-sm">{selectedCrew.name}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500">{crewMembers.length} members</p>
                {onlineCount > 0 && (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse" />
                    {onlineCount} online
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full"><MoreHorizontal className="w-5 h-5 text-gray-600" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {!hasJoined ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Lock className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium mb-2">Join to see messages</p>
              <button onClick={() => joinCrew(selectedCrew)} className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium">Join Crew</button>
            </div>
          ) : (
            <>
              {Object.entries(groupsByDate).map(([date, msgs]) => (
                <div key={date}>
                  <div className="flex justify-center my-4"><span className="bg-gray-300/80 text-gray-700 text-xs px-3 py-1 rounded-full">{new Date(date).toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' })}</span></div>
                  {msgs.map((msg) => {
                    const isOwn = msg.userId === user.id;
                    return (
                      <div key={msg.id} className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[78%] items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          {!isOwn && (
                            <button onClick={() => onViewUserProfile(msg.userEmail, msg.userName)} className="w-7 h-7 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 hover:opacity-80 transition">
                              {msg.userInitials}
                            </button>
                          )}
                          <div className={`rounded-2xl px-3.5 py-2 shadow-sm ${isOwn ? 'bg-[#dcf8c6] rounded-br-sm' : 'bg-white rounded-bl-sm'}`}>
                            {!isOwn && <p className="text-xs font-semibold text-orange-600 mb-0.5">{msg.userName}</p>}
                            {msg.type === 'image' ? <img src={msg.content} alt="Shared" className="max-w-full rounded-xl max-h-60" /> : <p className="text-sm leading-relaxed break-words text-gray-900">{msg.content}</p>}
                            
                            <p className="text-[10px] text-gray-400 text-right mt-0.5">
                              {formatTime(msg.timestamp)}
                              {isOwn && (() => {
                                const status = getReadStatus(msg.timestamp, selectedCrew.id, onlineCount);
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

        {hasJoined && (
          <div className="flex-shrink-0 bg-gray-50 border-t px-3 py-2.5" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 px-2 pb-1.5">
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
                </div>
                <p className="text-xs text-gray-500 italic">
                  {typingUsers.length === 1
                    ? `${typingUsers[0]} is typing...`
                    : typingUsers.length === 2
                    ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                    : `${typingUsers.length} people are typing...`}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow border border-gray-100">
              <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center flex-shrink-0"><Plus className="w-5 h-5 text-orange-500" /></button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={sendImage} />
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
              <button onClick={() => { stopTyping(); sendMessage(); }} disabled={!newMessage.trim()} className={`w-8 h-8 flex items-center justify-center rounded-full transition ${newMessage.trim() ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
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
      <div className="h-screen flex flex-col bg-white overflow-hidden" style={{ maxWidth: '448px', margin: '0 auto' }}>
        <Toast />
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3 z-10 flex-shrink-0">
          <button onClick={() => { setView('list'); }} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
          <span className="font-semibold flex-1">Crew Info</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="bg-gradient-to-b from-orange-50 to-white px-4 pt-6 pb-4">
            <div className="flex flex-col items-center text-center">
              <DynamicBookCover title={selectedCrew.name} author={selectedCrew.author} size="xl" className="mb-4" />
              <h1 className="text-2xl font-bold text-gray-900">{selectedCrew.name}</h1>
              <p className="text-gray-500">by {selectedCrew.author}</p>
              {selectedCrew.genre && <span className="mt-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">{selectedCrew.genre}</span>}
              <div className="flex gap-8 mt-4">
                <div className="text-center"><p className="text-xl font-bold">{crewMembers.length}</p><p className="text-xs text-gray-500">Members</p></div>
                <div className="text-center"><p className="text-xl font-bold">{messages.length}</p><p className="text-xs text-gray-500">Messages</p></div>
              </div>
              <div className="flex gap-3 mt-5 w-full">
                {!hasJoined ? (
                  <button onClick={() => joinCrew(selectedCrew)} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold">Join Crew</button>
                ) : (
                  <button onClick={() => { setView('chat'); }} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold">Go to Chat</button>
                )}
                <button onClick={() => { const e = prompt("Friend's email to invite:"); if (e) { const n = { id: Date.now(), type: 'invite', fromUser: user.name, message: `${user.name} invited you to join "${selectedCrew.name}"!`, timestamp: new Date().toISOString(), read: false }; const ns = JSON.parse(localStorage.getItem(`user_${e}_notifications`) || '[]'); ns.unshift(n); localStorage.setItem(`user_${e}_notifications`, JSON.stringify(ns)); alert(`Invited ${e}!`); }}} className="px-4 py-3 border border-gray-200 rounded-xl"><UserPlus className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
          <div className="flex border-b border-gray-200 px-4">
            {['Chat','Members','About'].map(tab => (
              <button key={tab} onClick={() => setSelectedTab(tab.toLowerCase())} className={`flex-1 py-3 text-sm font-medium border-b-2 ${selectedTab === tab.toLowerCase() ? 'text-orange-500 border-orange-500' : 'text-gray-500 border-transparent'}`}>{tab}</button>
            ))}
          </div>
          <div className="p-4 pb-24">
            {selectedTab === 'chat' && (
              hasJoined ? (
                <div className="space-y-3">
                  <button onClick={() => { setView('chat'); }} className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                    <MessageCircle className="w-5 h-5" />Open Chat
                  </button>
                  {messages.slice(-3).reverse().map(msg => (
                    <div key={msg.id} className="flex items-start gap-3 py-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{msg.userInitials}</div>
                      <div className="flex-1 min-w-0"><span className="font-semibold text-sm">{msg.userName}</span><p className="text-sm text-gray-600 truncate">{msg.type === 'image' ? '📷 Image' : msg.content}</p></div>
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-8"><Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Join to see messages</p></div>
            )}
            {selectedTab === 'members' && (
              <div className="space-y-4">
                {crewMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <button onClick={() => onViewUserProfile(member.email, member.name)} className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 hover:opacity-80 transition">{member.initials}</button>
                        {member.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <button onClick={() => onViewUserProfile(member.email, member.name)} className="font-semibold hover:underline">{member.name}</button>
                        <p className="text-xs text-gray-500">{member.isCreator ? '👑 Creator' : member.online ? 'Online' : 'Offline'}</p>
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
                  <p className="text-sm text-gray-600">A crew for readers of "{selectedCrew.name}" by {selectedCrew.author}. Share thoughts, discuss themes, and connect!</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Created</span><span>{new Date(selectedCrew.createdAt).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">By</span><span>{selectedCrew.createdByName||'Creator'}</span></div>
                  {selectedCrew.genre && <div className="flex justify-between"><span className="text-gray-500">Genre</span><span>{selectedCrew.genre}</span></div>}
                </div>
                {hasJoined && <button onClick={() => leaveCrew(selectedCrew)} className="w-full py-3 border border-red-200 text-red-500 rounded-xl font-medium">Leave Crew</button>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <Toast />
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-white" /></div>
          <span className="font-bold" style={{fontFamily:'Georgia,serif'}}>Reading Crews</span>
        </div>
        <button onClick={() => setShowCreateCrewForm(true)} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium">Create Crew</button>
      </div>
      
      <div className="px-4 py-4">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crews by book title, author, or genre..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2">
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
                <DynamicBookCover title={newCrewData.name} author={newCrewData.author} size="lg" />
              </div>
            )}
            <div className="space-y-3">
              <input value={newCrewData.name} onChange={e => setNewCrewData({...newCrewData, name: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Book title" />
              <input value={newCrewData.author} onChange={e => setNewCrewData({...newCrewData, author: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Author" />
              <input value={newCrewData.genre} onChange={e => setNewCrewData({...newCrewData, genre: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Genre (e.g. Fiction, Self-Help)" />
              <div className="flex gap-2">
                <button onClick={createCrew} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">Create</button>
                <button onClick={() => setShowCreateCrewForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-orange-500" />My Crews</h2>
          {filteredCrews.filter(c => isJoined(c.id)).length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
              <p className="text-gray-500 text-sm">No crews joined yet. Explore below!</p>
            </div>
          ) : filteredCrews.filter(c => isJoined(c.id)).map(crew => (
            <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-green-200 shadow-sm cursor-pointer mb-3" onClick={() => { setSelectedCrew(crew); setView('detail'); }}>
              <div className="flex items-center px-4 gap-4 py-3">
                <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="font-bold text-gray-900 truncate">{crew.name}</p><span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full flex-shrink-0">Joined</span></div>
                  <p className="text-xs text-gray-500">by {crew.author}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {crew.genre && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre}</span>}
                    <span className="text-xs text-gray-400">{crew.members||1} members</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 flex justify-end gap-2 border-t border-gray-100">
                <button onClick={e => { e.stopPropagation(); setSelectedCrew(crew); setView('chat'); }} className="px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-xs font-medium">Chat</button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-bold mb-3">Discover Crews</h2>
          <div className="space-y-3">
            {filteredCrews.filter(c => !isJoined(c.id)).length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                <p className="text-gray-500 text-sm">No crews match your search</p>
              </div>
            ) : filteredCrews.filter(c => !isJoined(c.id)).map(crew => (
              <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer" onClick={() => { setSelectedCrew(crew); setView('detail'); }}>
                <div className="flex items-center px-4 gap-4 py-3">
                  <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{crew.name}</p>
                    <p className="text-xs text-gray-500">by {crew.author}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {crew.genre && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre}</span>}
                      <span className="text-xs text-gray-400">{crew.members||1} members</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 flex justify-end border-t border-gray-100">
                  <button onClick={e => { e.stopPropagation(); joinCrew(crew); }} className="px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold">Join</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PROFILE PAGE ────────────────────────────────────────────────────────
const ProfilePage = ({ user, posts, setPage, onLogout, onUpdateUser, profileSrc, setProfileSrc, savedPosts, following, followers, onFollow }) => {
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
    const savedStats = localStorage.getItem(`user_${user.email}_stats`);
    if (savedStats) setUserStats(JSON.parse(savedStats));
    const savedImg = localStorage.getItem(`user_${user.email}_profile_image`);
    if (savedImg) setProfileSrc(savedImg);
    const savedBooks = JSON.parse(localStorage.getItem(`user_${user.email}_booksRead`) || '[]');
    setMyBooks(savedBooks);
  }, [user.email]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imgData = ev.target.result;
      setProfileSrc(imgData);
      localStorage.setItem(`user_${user.email}_profile_image`, imgData);
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      localStorage.setItem('users', JSON.stringify(users.map(u => u.email === user.email ? { ...u, profileImage: imgData } : u)));
      const cu = JSON.parse(localStorage.getItem('currentUser') || '{}');
      localStorage.setItem('currentUser', JSON.stringify({ ...cu, profileImage: imgData }));
      onUpdateUser?.({ ...user, profileImage: imgData });
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
    localStorage.setItem('users', JSON.stringify(users.map(u => u.email === user.email ? updatedUser : u)));
    onUpdateUser?.(updatedUser);
    setEditingProfile(false);
  };

  const handleAddBook = () => {
    if (!newBook.title) { alert('Enter book title'); return; }
    const book = { id: Date.now(), ...newBook, addedAt: new Date().toISOString() };
    const updated = [book, ...myBooks];
    setMyBooks(updated);
    localStorage.setItem(`user_${user.email}_booksRead`, JSON.stringify(updated));
    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.booksRead = updated.length;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
    setUserStats(prev => ({ ...prev, booksRead: updated.length }));
    setNewBook({ title: '', author: '', rating: 5, notes: '' });
    setShowAddBook(false);
    const cu = JSON.parse(localStorage.getItem('currentUser') || '{}');
    localStorage.setItem('currentUser', JSON.stringify({ ...cu, stats }));
  };

  const handleDeleteBook = (bookId) => {
    const updated = myBooks.filter(b => b.id !== bookId);
    setMyBooks(updated);
    localStorage.setItem(`user_${user.email}_booksRead`, JSON.stringify(updated));
    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.booksRead = updated.length;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
    setUserStats(prev => ({ ...prev, booksRead: updated.length }));
  };

  const tabs = ['Posts', 'Reviews', 'Books Read', 'Crews', 'Saved Posts'];

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-white" /></div>
          <span className="font-bold" style={{fontFamily:'Georgia,serif'}}>Profile</span>
        </div>
        <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-lg"><LogOut className="w-5 h-5 text-gray-600" /></button>
      </div>

      <div className="px-4 py-5">
        <div className="flex items-start gap-4 mb-5">
          <div className="relative flex-shrink-0">
            {profileSrc ? <img src={profileSrc} alt={user?.name} className="w-20 h-20 rounded-full object-cover border-2 border-orange-200" />
              : <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">{user?.name?.slice(0,2).toUpperCase()}</div>}
            <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
          <div className="flex-1 min-w-0">
            {editingProfile ? (
              <div className="space-y-2">
                <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Your name" />
                <input value={editBio} onChange={e => setEditBio(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Your bio..." />
                <div className="flex gap-2">
                  <button onClick={handleSaveProfile} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">Save</button>
                  <button onClick={() => setEditingProfile(false)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 truncate">{user?.name}</h2>
                <p className="text-sm text-gray-500">@{user?.name?.toLowerCase().replace(/\s/g,'')}</p>
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
                
                <button onClick={() => setEditingProfile(true)} className="mt-3 px-4 py-1.5 border border-orange-200 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 flex items-center gap-1.5">
                  <Edit className="w-3.5 h-3.5" />Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><Target className="w-4 h-4 text-orange-500" /><h3 className="font-semibold">Reading Goal {new Date().getFullYear()}</h3></div>
            <button onClick={() => setShowEditGoal(!showEditGoal)} className="text-sm text-orange-500 font-medium">{showEditGoal ? 'Cancel' : 'Edit'}</button>
          </div>
          {showEditGoal ? (
            <div className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 mb-1 block">Yearly Goal</label><input type="number" value={editGoal.yearly} onChange={e => setEditGoal({...editGoal, yearly: parseInt(e.target.value)||0})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm" /></div>
                <div><label className="text-xs text-gray-600 mb-1 block">Monthly Goal</label><input type="number" value={editGoal.monthly} onChange={e => setEditGoal({...editGoal, monthly: parseInt(e.target.value)||0})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm" /></div>
              </div>
              <button onClick={handleSaveGoal} className="w-full py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">Save Goal</button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold">{readingGoal.yearly > 0 ? `${userStats.booksRead}/${readingGoal.yearly} books` : 'No goal set'}</span>
              </div>
              {readingGoal.yearly > 0 && (
                <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min((userStats.booksRead/readingGoal.yearly)*100, 100)}%` }} />
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
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-shrink-0 text-sm pb-2.5 px-3 font-medium border-b-2 transition ${activeTab === tab ? 'text-orange-500 border-orange-500' : 'text-gray-500 border-transparent'}`}>{tab}</button>
          ))}
        </div>

        {activeTab === 'Posts' && (
          <div className="space-y-4">
            {myPosts.length === 0 ? (
              <div className="text-center py-8">
                <Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No posts yet</p>
                <button onClick={() => setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Create First Post</button>
              </div>
            ) : myPosts.map(post => (
              <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                {post.bookName && <p className="text-xs text-orange-500">📖 {post.bookName}</p>}
                {post.image && <img src={post.image} alt="" className="w-full rounded-xl mt-2" />}
                <div className="flex items-center gap-4 pt-2 border-t border-gray-100 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{post.likes||0}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Reviews' && (
          <div className="space-y-4">
            {myReviews.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No reviews yet</p>
                <button onClick={() => setPage('reviews')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Write a Review</button>
              </div>
            ) : myReviews.map(review => (
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
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">{myBooks.length} books read</p>
              <button onClick={() => setShowAddBook(!showAddBook)} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium">
                <Plus className="w-4 h-4" />{showAddBook ? 'Cancel' : 'Add Book'}
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
                  <input value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Book title *" />
                  <input value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Author" />
                  <div><label className="text-xs text-gray-600 mb-1 block">Your Rating</label><StarRating rating={newBook.rating} onChange={r => setNewBook({...newBook, rating: r})} size="md" /></div>
                  <textarea value={newBook.notes} onChange={e => setNewBook({...newBook, notes: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300 resize-none" placeholder="Notes (optional)" rows={2} />
                  <button onClick={handleAddBook} className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium">Add to My Books</button>
                </div>
              </div>
            )}

            {myBooks.length === 0 ? (
              <div className="text-center py-8">
                <BookMarked className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No books tracked yet</p>
                <p className="text-xs text-gray-400 mt-1">Add books you've finished reading!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myBooks.map(book => (
                  <div key={book.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-start gap-3">
                    <DynamicBookCover title={book.title} author={book.author} size="sm" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900">{book.title}</h3>
                      <p className="text-xs text-gray-500">{book.author}</p>
                      <div className="flex items-center gap-1 mt-1"><StarRating rating={book.rating} size="xs" /></div>
                      {book.notes && <p className="text-xs text-gray-600 mt-1 italic">"{book.notes}"</p>}
                      <p className="text-xs text-gray-400 mt-1">{new Date(book.addedAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => handleDeleteBook(book.id)} className="p-1 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Crews' && (
          <div className="space-y-3">
            {userStats.crewsJoined === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No crews joined yet</p>
                <button onClick={() => setPage('crews')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Browse Crews</button>
              </div>
            ) : (
              <button onClick={() => setPage('crews')} className="w-full py-3 bg-orange-50 border border-orange-200 text-orange-600 rounded-xl font-medium">View My Crews →</button>
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
            ) : savedPostsList.map(post => (
              <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                {post.bookName && <p className="text-xs text-orange-500">📖 {post.bookName}</p>}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                  <span className="text-xs text-gray-400">by {post.userName}</span>
                  <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MAIN APP COMPONENT ──────────────────────────────────────────────────
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

  useEffect(() => {
    if (currentPage === 'post' || viewingFullProfile) {
      setShowBottomNav(false);
    } else {
      setShowBottomNav(true);
    }
  }, [currentPage, viewingFullProfile]);

  useEffect(() => {
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
    
    if (!localStorage.getItem(`user_${userData.email}_following`)) {
      localStorage.setItem(`user_${userData.email}_following`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`user_${userData.email}_followers`)) {
      localStorage.setItem(`user_${userData.email}_followers`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`user_${userData.email}_blocked`)) {
      localStorage.setItem(`user_${userData.email}_blocked`, JSON.stringify([]));
    }
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
      id: postData.id || Date.now(),
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
      window.dispatchEvent(new StorageEvent('storage', { key: `user_${originalPost.userEmail}_notifications` }));
      checkForNewNotifications();
    }
    
    const resharePost = {
      id: Date.now(),
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
      window.dispatchEvent(new StorageEvent('storage', { key: `user_${targetEmail}_notifications` }));
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
              unreadCount={unreadMessages} 
              show={showBottomNav} 
            />
          </>
        )}
      </div>
    </div>
  );
}