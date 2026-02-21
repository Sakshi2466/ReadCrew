// ═══════════════════════════════════════════════════════════
// CHANGES MADE (search for "// ✅ CHANGED" comments):
//
// 1. CrewsPage: added `onViewChange` prop
// 2. CrewsPage: created a `changeView` helper that calls both
//    setView and onViewChange — replaced all setView calls with changeView
// 3. App: added `crewChatActive` state
// 4. App: passes `onViewChange` to CrewsPage
// 5. App: BottomNav `show` prop hides nav when crewChatActive is true
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen, Home, Search, Edit3, Users, User, Bell, Settings,
  Heart, MessageCircle, Bookmark, Share2, Star, Plus, ChevronRight,
  X, Send, Image, ChevronLeft, LogOut, Camera, MoreHorizontal,
  Sparkles, Lock, Eye, EyeOff, UserPlus, Gift, ThumbsUp, ThumbsDown,
  Trash2, Edit, Target, Check, ArrowLeft, Clock, TrendingUp, Menu, Upload,
  Calendar, Award, MessageSquare, Globe, ChevronDown, Filter, Play, Pause,
  Volume2, Mic, Paperclip, Mail, Phone, Leaf, ExternalLink, ThumbsUp as LikeIcon,
  Link2, Instagram, Facebook, Twitter, WhatsApp, AtSign, Flag, Pin, Smile
} from 'lucide-react';

import { donationAPI, reviewAPI, otpAPI, checkBackendConnection, getBookRecommendations, chatAPI, crewAPI, userAPI, bookCrewAPI, getTrendingBooks, aiChatAPI } from './services/api';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://versal-book-app.onrender.com';

// ========================================
// DYNAMIC BOOK COVER FETCHER
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
      const query = author ? `${title} ${author}`.trim() : title;
      const searchQuery = encodeURIComponent(query);
      const response = await fetch(`https://openlibrary.org/search.json?q=${searchQuery}&limit=1`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      if (data.docs && data.docs.length > 0) {
        const book = data.docs[0];
        let cover = null;
        if (book.cover_i) cover = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
        else if (book.isbn && book.isbn.length > 0) cover = `https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-L.jpg`;
        else if (book.cover_edition_key) cover = `https://covers.openlibrary.org/b/olid/${book.cover_edition_key}-L.jpg`;
        if (cover) setCoverUrl(cover);
        else setError(true);
      } else setError(true);
    } catch (err) {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackColor = () => {
    const colors = ['#7B9EA6','#C8622A','#8B5E3C','#E8A87C','#C4A882','#2C3E50','#E74C3C','#3498DB','#9B59B6','#1ABC9C','#27AE60','#F39C12','#D35400','#8E44AD','#16A085'];
    const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const initials = title ? title.slice(0, 2).toUpperCase() : 'BK';
  const fallbackColor = getFallbackColor();

  if (isLoading) {
    return (
      <div className={`${coverClassName} bg-gray-200 rounded-xl flex items-center justify-center animate-pulse`} onClick={onClick}>
        <BookOpen className="w-8 h-8 text-gray-400 animate-pulse" />
      </div>
    );
  }

  if (error || !coverUrl) {
    return (
      <div className={`${coverClassName} rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg cursor-pointer group hover:scale-105 transition-transform`}
        style={{ backgroundColor: fallbackColor }} onClick={onClick}>
        <span className="text-3xl">{initials}</span>
        <BookOpen className="w-6 h-6 mt-2 opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  }

  return (
    <div className={`${coverClassName} relative group cursor-pointer`} onClick={onClick}>
      <img src={coverUrl} alt={`${title} cover`}
        className="w-full h-full rounded-xl object-cover shadow-lg group-hover:scale-105 transition-transform"
        onError={() => setError(true)} loading="lazy" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-xl" />
    </div>
  );
};

// ─── AVATAR ────────────────────────────────────────────────────────────────
const Avatar = ({ initials, size = 'md', color = '#C8622A', src, online }) => {
  const sizes = { xs: 'w-7 h-7 text-xs', sm: 'w-9 h-9 text-sm', md: 'w-11 h-11 text-base', lg: 'w-16 h-16 text-xl', xl: 'w-20 h-20 text-2xl' };
  return (
    <div className="relative shrink-0">
      {src ? (
        <img src={src} alt={initials} className={`${sizes[size]} rounded-full object-cover`} />
      ) : (
        <div className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white`} style={{ backgroundColor: color }}>
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
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`${sz} ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} ${onChange ? 'cursor-pointer hover:scale-110 transition' : ''}`}
          onClick={() => onChange?.(i)} />
      ))}
    </div>
  );
};

// ─── LOADING SPINNER ───────────────────────────────────────────────────────
const LoadingSpinner = ({ size = 'md', color = 'orange' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const colors = { orange: 'border-orange-500', blue: 'border-blue-500', purple: 'border-purple-500' };
  return <div className={`${sizes[size]} border-4 border-t-transparent ${colors[color]} rounded-full animate-spin`}></div>;
};

// ─── BOTTOM NAV ────────────────────────────────────────────────────────────
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

// ─── TOP BAR ───────────────────────────────────────────────────────────────
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
        <span className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Georgia, serif' }}>{title || 'ReadCrew'}</span>
      </div>
    </div>
    {showProfile && (
      <div className="flex items-center gap-3">
        <button onClick={onNotificationClick} className="relative p-1 hover:bg-gray-100 rounded-lg transition">
          <Bell className="w-5 h-5 text-gray-600" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{notificationCount}</span>
          )}
        </button>
        <button onClick={() => setPage('profile')} className="hover:opacity-80 transition">
          {profileSrc ? (
            <img src={profileSrc} alt="profile" className="w-8 h-8 rounded-full object-cover border border-orange-200" />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
          )}
        </button>
      </div>
    )}
  </header>
);

// ─── NOTIFICATIONS PAGE ───────────────────────────────────────────────────
const NotificationsPage = ({ user, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  useEffect(() => { loadNotifications(); }, []);
  const loadNotifications = () => {
    setNotifications(JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]'));
  };
  const markAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
  };
  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
  };
  const icons = { like: <Heart className="w-4 h-4 text-red-500" />, comment: <MessageCircle className="w-4 h-4 text-blue-500" />, message: <MessageSquare className="w-4 h-4 text-green-500" />, invite: <UserPlus className="w-4 h-4 text-purple-500" /> };
  const bgColors = { like: 'bg-red-100', comment: 'bg-blue-100', message: 'bg-green-100', invite: 'bg-purple-100' };
  return (
    <div className="fixed inset-0 bg-white z-50" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)' }}>
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <h2 className="font-semibold text-gray-900">Notifications</h2>
        <button onClick={markAllAsRead} className="text-sm text-orange-500 font-medium">Mark all read</button>
      </div>
      <div className="overflow-y-auto h-full pb-20">
        {notifications.length === 0 ? (
          <div className="text-center py-12"><Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No notifications yet</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div key={notif.id} className={`p-4 cursor-pointer transition ${notif.read ? 'bg-white hover:bg-gray-50' : 'bg-orange-50 hover:bg-orange-100'}`} onClick={() => markAsRead(notif.id)}>
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

// ─── SHARE MODAL ─────────────────────────────────────────────────────────
const ShareModal = ({ post, onClose }) => {
  const shareUrl = window.location.href;
  const shareText = `Check out this post by ${post.userName}: "${post.content?.substring(0, 50)}..."`;
  const shareHandlers = {
    whatsapp: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank'),
    instagram: () => { navigator.clipboard.writeText(shareText + ' ' + shareUrl); alert('Link copied! You can paste it in Instagram'); },
    facebook: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank'),
    twitter: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank'),
    copyLink: () => { navigator.clipboard.writeText(shareUrl); alert('Link copied to clipboard!'); }
  };
  const shareIcons = {
    whatsapp: { icon: WhatsApp, bg: 'bg-green-500' },
    instagram: { icon: Instagram, bg: 'bg-pink-500' },
    facebook: { icon: Facebook, bg: 'bg-blue-600' },
    twitter: { icon: Twitter, bg: 'bg-sky-500' }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-[65] flex items-end sm:items-center justify-center p-4" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Share Post</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-600" /></button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4 mb-4">
            {Object.entries(shareHandlers).map(([key, handler]) => {
              const Icon = shareIcons[key]?.icon;
              const bg = shareIcons[key]?.bg;
              if (!Icon) return null;
              return (
                <button key={key} onClick={handler} className="flex flex-col items-center gap-2 group">
                  <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-gray-600 capitalize">{key}</span>
                </button>
              );
            })}
          </div>
          <button onClick={shareHandlers.copyLink} className="w-full py-3 border-2 border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50 hover:border-orange-300 transition">
            <Link2 className="w-5 h-5 text-orange-500" />
            <span className="font-medium">Copy Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── COMMENT SECTION ──────────────────────────────────────────────────────
const CommentSection = ({ post, user, onClose, updateNotificationCount }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [likedComments, setLikedComments] = useState(new Set());
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => { loadComments(); loadLikedComments(); }, [post.id]);

  const loadComments = () => setComments(JSON.parse(localStorage.getItem(`post_${post.id}_comments`) || '[]'));
  const loadLikedComments = () => setLikedComments(new Set(JSON.parse(localStorage.getItem(`user_${user.id}_likedComments`) || '[]')));

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    const comment = { id: Date.now(), postId: post.id, userId: user.id, userName: user.name, userEmail: user.email, userInitials: user.name.slice(0,2).toUpperCase(), content: newComment.trim(), timestamp: new Date().toISOString(), parentId: replyTo?.id || null, likes: 0, likedBy: [], isAuthor: user.email === post.userEmail };
    const updatedComments = [...comments, comment];
    localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(updatedComments));
    setComments(updatedComments);
    setNewComment('');
    if (replyTo) setReplyTo(null);
    setTimeout(() => listRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 50);
    if (post.userEmail !== user.email) {
      const notification = { id: Date.now(), type: 'comment', fromUser: user.name, fromUserEmail: user.email, postId: post.id, comment: newComment, message: `${user.name} commented on your post: "${newComment.substring(0,30)}${newComment.length>30?'...':''}"`, timestamp: new Date().toISOString(), read: false };
      const n = JSON.parse(localStorage.getItem(`user_${post.userEmail}_notifications`) || '[]');
      n.unshift(notification);
      localStorage.setItem(`user_${post.userEmail}_notifications`, JSON.stringify(n));
      updateNotificationCount();
    }
  };

  const handleLikeComment = (commentId) => {
    if (likedComments.has(commentId)) return;
    const updated = comments.map(c => c.id === commentId ? { ...c, likes: (c.likes||0)+1, likedBy: [...(c.likedBy||[]), user.id] } : c);
    setComments(updated);
    localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(updated));
    const newLiked = new Set(likedComments); newLiked.add(commentId);
    setLikedComments(newLiked);
    localStorage.setItem(`user_${user.id}_likedComments`, JSON.stringify([...newLiked]));
  };

  const handleDeleteComment = (commentId) => {
    const filtered = comments.filter(c => c.id !== commentId && c.parentId !== commentId);
    setComments(filtered);
    localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(filtered));
  };

  const formatTime = (timestamp) => {
    const diffMs = new Date() - new Date(timestamp);
    const diffMins = Math.floor(diffMs/60000);
    const diffHours = Math.floor(diffMs/3600000);
    const diffDays = Math.floor(diffMs/86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const CommentComponent = ({ comment, depth = 0 }) => {
    const replies = comments.filter(c => c.parentId === comment.id);
    const isLiked = likedComments.has(comment.id);
    const isOwn = comment.userId === user.id;
    return (
      <div className={`${depth > 0 ? 'ml-8 mt-2' : 'mt-3'}`}>
        <div className="flex gap-2.5 group">
          <div className="flex gap-2 flex-1">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">{comment.userInitials}</div>
            <div className="flex-1 min-w-0">
              <div className={`rounded-2xl px-4 py-2.5 ${comment.isAuthor ? 'bg-orange-50 border border-orange-100' : 'bg-white border border-gray-100'} shadow-sm`}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-sm text-gray-900">{comment.userName}</span>
                  {comment.isAuthor && <span className="text-[10px] px-1.5 py-0.5 bg-orange-500 text-white rounded-full font-medium leading-none">Author</span>}
                  <span className="text-[10px] text-gray-400">{formatTime(comment.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
              </div>
              <div className="flex items-center gap-4 mt-1 ml-1">
                <button onClick={() => handleLikeComment(comment.id)} disabled={isLiked} className={`flex items-center gap-1 text-xs transition-all ${isLiked ? 'text-red-500 font-medium' : 'text-gray-400 hover:text-red-400'}`}>
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} /><span>{comment.likes || 0}</span>
                </button>
                <button onClick={() => { setReplyTo(comment); inputRef.current?.focus(); }} className="text-xs text-gray-400 hover:text-orange-500 font-medium">Reply</button>
                {isOwn && <button onClick={() => handleDeleteComment(comment.id)} className="text-xs text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>}
              </div>
              {replies.length > 0 && (
                <button onClick={() => setShowReplies(p => ({...p, [comment.id]: !p[comment.id]}))} className="flex items-center gap-1 text-xs text-orange-500 font-medium mt-1.5 ml-1">
                  <div className="w-4 h-px bg-orange-300" />{showReplies[comment.id] ? 'Hide' : `View ${replies.length} ${replies.length===1?'reply':'replies'}`}
                </button>
              )}
              {showReplies[comment.id] && <div className="mt-2 space-y-2">{replies.map(r => <CommentComponent key={r.id} comment={r} depth={depth+1} />)}</div>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const topLevelComments = comments.filter(c => !c.parentId);
  return (
    <div className="fixed inset-0 z-[65] flex flex-col" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)', background: '#F9F5F0' }}>
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <div className="text-center"><h2 className="font-semibold text-gray-900">Comments</h2><p className="text-xs text-gray-500">{comments.length} comment{comments.length!==1?'s':''}</p></div>
        <div className="w-8" />
      </div>
      <div className="bg-white mx-3 mt-3 rounded-2xl p-3 border border-gray-100 shadow-sm">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{post.userName?.slice(0,2)||'U'}</div>
          <div className="flex-1 min-w-0"><p className="font-semibold text-sm text-gray-900">{post.userName}</p><p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{post.content}</p></div>
        </div>
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4">
        {topLevelComments.length === 0 ? (
          <div className="text-center py-12"><div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3"><MessageCircle className="w-8 h-8 text-orange-300" /></div><p className="text-gray-500 text-sm">No comments yet</p><p className="text-xs text-gray-400 mt-1">Start the conversation!</p></div>
        ) : topLevelComments.map(comment => <CommentComponent key={comment.id} comment={comment} />)}
      </div>
      {replyTo && (
        <div className="bg-orange-50 border-t border-orange-100 px-4 py-2 flex items-center justify-between">
          <p className="text-xs text-orange-700">Replying to <span className="font-semibold">{replyTo.userName}</span></p>
          <button onClick={() => setReplyTo(null)} className="text-orange-400 hover:text-orange-600"><X className="w-4 h-4" /></button>
        </div>
      )}
      <div className="bg-white border-t border-gray-200 px-3 py-2.5" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">{user?.name?.slice(0,2).toUpperCase()}</div>
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 border border-gray-200 focus-within:border-orange-300 focus-within:bg-white transition">
            <input ref={inputRef} type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
              placeholder={replyTo ? `Reply to ${replyTo.userName}...` : "Add a comment..."} />
            <button onClick={handleSubmitComment} disabled={!newComment.trim()} className={`p-1.5 rounded-full transition ${newComment.trim() ? 'text-orange-500 hover:bg-orange-100' : 'text-gray-400'}`}>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── LOGIN PAGE ─────────────────────────────────────────────────────────────
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateName = (name) => name && name.trim().length >= 2;

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
    if (!validateName(name) || !validateEmail(email)) { alert('Please fill all fields correctly'); return; }
    setLoading(true);
    try {
      const result = await otpAPI.sendOTP({ name, email });
      if (result.success) { setShowOTP(true); alert('OTP sent to your email! Check your inbox.'); }
      else alert(result.message || 'Failed to send OTP');
    } catch (error) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('devOTP', otp);
      setShowOTP(true);
      alert(`Development OTP: ${otp}`);
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (otpInput.length !== 6) { alert('Enter 6-digit OTP'); return; }
    setLoading(true);
    try {
      const result = await otpAPI.verifyOTP({ email, otp: otpInput });
      if (result.success) {
        const userData = { id: Date.now().toString(), name, email, password, readingGoal, isVerified: true, createdAt: new Date().toISOString(), stats: { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 }, joinedCrews: [], likedPosts: [], likedReviews: [], likedMessages: [] };
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
      } else alert(`❌ ${result.message}`);
    } catch (error) {
      const devOTP = localStorage.getItem('devOTP');
      if (devOTP && otpInput === devOTP) {
        const userData = { id: Date.now().toString(), name, email, password, readingGoal, isVerified: true, createdAt: new Date().toISOString(), stats: { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 }, joinedCrews: [], likedPosts: [], likedReviews: [], likedMessages: [] };
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
      } else alert('❌ Invalid OTP');
    } finally { setLoading(false); }
  };

  if (showOTP) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-7 border border-gray-200 mt-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Verify OTP</h2>
          <p className="text-center text-gray-500 text-sm mb-6">Enter the code sent to {email}</p>
          <input type="text" value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g,'').slice(0,6))}
            className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none text-center text-3xl tracking-widest mb-6"
            placeholder="000000" maxLength="6" autoFocus />
          <button onClick={handleVerifyOTP} disabled={loading || otpInput.length !== 6}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-50 shadow-lg">
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
          <button onClick={() => setShowOTP(false)} className="w-full mt-4 text-gray-500 hover:text-orange-500 flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" style={{ fontFamily: "'Georgia', serif" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">ReadCrew</h1>
          <p className="text-gray-500 text-sm mt-2">Read together, grow together.</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-7 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">{isLogin ? 'Welcome Back!' : 'Join the Crew'}</h2>
          <div className="space-y-4">
            {!isLogin && (
              <>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <User className="w-5 h-5 text-gray-400" />
                  <input value={name} onChange={e => setName(e.target.value)} className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm" placeholder="Full Name" />
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-orange-500" />Set Your Reading Goals (Optional)</h3>
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-600 mb-1 block">Yearly Goal (books)</label><input type="number" value={readingGoal.yearly} onChange={e => setReadingGoal({...readingGoal, yearly: parseInt(e.target.value)||0})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none" min="0" max="100" placeholder="e.g., 20" /></div>
                    <div><label className="text-xs text-gray-600 mb-1 block">Monthly Goal (books)</label><input type="number" value={readingGoal.monthly} onChange={e => setReadingGoal({...readingGoal, monthly: parseInt(e.target.value)||0})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none" min="0" max="20" placeholder="e.g., 5" /></div>
                  </div>
                </div>
              </>
            )}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
              <Mail className="w-5 h-5 text-gray-400" />
              <input value={email} onChange={e => setEmail(e.target.value)} className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm" placeholder="Email" />
            </div>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
              <Lock className="w-5 h-5 text-gray-400" />
              <input value={password} onChange={e => setPassword(e.target.value)} type={showPass ? 'text' : 'password'} className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm" placeholder="Password" />
              <button onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}</button>
            </div>
          </div>
          <button onClick={() => {
            if (isLogin) {
              const users = JSON.parse(localStorage.getItem('users') || '[]');
              const foundUser = users.find(u => u.email === email);
              if (foundUser && foundUser.password === password) { localStorage.setItem('currentUser', JSON.stringify(foundUser)); onLogin(foundUser); }
              else alert('Invalid email or password');
            } else handleSendOTP();
          }} className="w-full mt-5 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold text-base hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50">
            {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Create Account')}
          </button>
          <p className="text-center text-sm text-gray-500 mt-5">
            {isLogin ? "New to ReadCrew? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-orange-500 font-semibold hover:underline">{isLogin ? 'Sign Up' : 'Log In'}</button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── HOME PAGE ──────────────────────────────────────────────────────────────
const HomePage = ({ user, posts, setPosts, crews, setPage, donations, reviews, onUpdateStats, updateNotificationCount, profileSrc }) => {
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [trendingPage, setTrendingPage] = useState(1);
  const [hasMoreTrending, setHasMoreTrending] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [feedPosts, setFeedPosts] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookDetails, setShowBookDetails] = useState(false);
  const [bookDetails, setBookDetails] = useState(null);
  const [loadingBookDetails, setLoadingBookDetails] = useState(false);
  const [showComments, setShowComments] = useState(null);
  const [showShare, setShowShare] = useState(null);
  const [userStats, setUserStats] = useState({ booksRead: user?.stats?.booksRead||0, reviewsGiven: user?.stats?.reviewsGiven||0, postsCreated: user?.stats?.postsCreated||0, crewsJoined: user?.joinedCrews?.length||0 });
  const [likedPosts, setLikedPosts] = useState([]);

  useEffect(() => {
    loadTrendingBooks(1); loadFeedPosts(); calculateReadingProgress(); loadLikedPosts();
    const s = localStorage.getItem(`user_${user.email}_stats`);
    if (s) setUserStats(JSON.parse(s));
  }, [user?.stats?.booksRead, user?.joinedCrews, posts]);

  const loadLikedPosts = () => setLikedPosts(JSON.parse(localStorage.getItem(`user_${user.email}_likedPosts`) || '[]'));

  const loadTrendingBooks = async (page = 1, append = false) => {
    if (page===1) setLoadingTrending(true); else setLoadingMore(true);
    try {
      const response = await fetch(`${API_URL}/api/books/trending?page=${page}`);
      const data = await response.json();
      if (data.success && data.books?.length > 0) {
        setTrendingBooks(prev => append ? [...prev, ...data.books] : data.books);
        setHasMoreTrending(data.hasMore||false); setTrendingPage(page);
      } else throw new Error('No data');
    } catch {
      const mockBooks = [
        { id:1, title:'Atomic Habits', author:'James Clear', rating:4.8, readers:15420 },
        { id:2, title:'The Psychology of Money', author:'Morgan Housel', rating:4.7, readers:12350 },
        { id:3, title:'Deep Work', author:'Cal Newport', rating:4.6, readers:9870 },
        { id:4, title:'Sapiens', author:'Yuval Harari', rating:4.8, readers:21500 },
        { id:5, title:'Project Hail Mary', author:'Andy Weir', rating:4.9, readers:18700 },
      ];
      setTrendingBooks(prev => append ? [...prev, ...mockBooks.slice(prev.length)] : mockBooks);
      setHasMoreTrending(false);
    } finally { setLoadingTrending(false); setLoadingMore(false); }
  };

  const loadFeedPosts = () => {
    const feed = [
      ...(donations||[]).map(d => ({...d, type:'donation', timestamp: new Date(d.createdAt)})),
      ...(posts||[]).map(p => ({...p, type:'post', timestamp: new Date(p.createdAt||Date.now())}))
    ].sort((a,b) => b.timestamp - a.timestamp).slice(0,10);
    setFeedPosts(feed);
  };

  const calculateReadingProgress = () => {
    if (user?.readingGoal?.yearly > 0) setReadingProgress(Math.min((userStats.booksRead/user.readingGoal.yearly)*100, 100));
    else setReadingProgress(0);
  };

  const handleLikePost = (postId, post) => {
    if (likedPosts.includes(postId)) return;
    const updated = [...likedPosts, postId];
    setLikedPosts(updated);
    localStorage.setItem(`user_${user.email}_likedPosts`, JSON.stringify(updated));
    setFeedPosts(prev => prev.map(p => p.id===postId ? {...p, likes:(p.likes||0)+1, liked:true} : p));
    const updatedPosts = posts.map(p => p.id===postId ? {...p, likes:(p.likes||0)+1} : p);
    setPosts(updatedPosts);
    localStorage.setItem(`user_${post.userEmail}_posts`, JSON.stringify(updatedPosts.filter(p => p.userEmail===post.userEmail)));
    if (post && post.userEmail !== user.email) {
      const notification = { id:Date.now(), type:'like', fromUser:user.name, fromUserEmail:user.email, postId, message:`${user.name} liked your post`, timestamp:new Date().toISOString(), read:false };
      const n = JSON.parse(localStorage.getItem(`user_${post.userEmail}_notifications`)||'[]');
      n.unshift(notification);
      localStorage.setItem(`user_${post.userEmail}_notifications`, JSON.stringify(n));
      updateNotificationCount();
    }
  };

  const handleBookClick = async (book) => {
    setSelectedBook(book); setShowBookDetails(true); setLoadingBookDetails(true);
    try {
      const response = await axios.post(`${API_URL}/api/books/book-details`, { bookName: book.title, author: book.author });
      if (response.data.success) setBookDetails(response.data.details);
      else throw new Error('Failed');
    } catch {
      setBookDetails({ title: book.title, author: book.author, description: `${book.title} is a popular book by ${book.author}.`, genre: 'General', rating: book.rating });
    } finally { setLoadingBookDetails(false); }
  };

  const getCommentCount = (postId) => JSON.parse(localStorage.getItem(`post_${postId}_comments`)||'[]').length;
  const hasReadingGoal = user?.readingGoal?.yearly > 0 || user?.readingGoal?.monthly > 0;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <TopBar user={user} setPage={setPage} title="ReadCrew" profileSrc={profileSrc}
        onNotificationClick={() => setPage('notifications')}
        notificationCount={JSON.parse(localStorage.getItem(`user_${user.email}_notifications`)||'[]').filter(n=>!n.read).length} />

      {showBookDetails && selectedBook && (
        <div className="fixed inset-0 bg-black/50 z-[65] flex items-center justify-center p-4" style={{ maxWidth:'448px', left:'50%', transform:'translateX(-50%)' }}>
          <div className="bg-white rounded-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Book Details</h3>
              <button onClick={() => setShowBookDetails(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              {loadingBookDetails ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : bookDetails && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <DynamicBookCover title={selectedBook.title} author={selectedBook.author} size="lg" />
                    <div className="flex-1"><h2 className="text-xl font-bold text-gray-900">{bookDetails.title||selectedBook.title}</h2><p className="text-gray-600">by {bookDetails.author||selectedBook.author}</p>{bookDetails.genre && <span className="inline-block mt-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs">{bookDetails.genre}</span>}</div>
                  </div>
                  {bookDetails.description && <div className="bg-gray-50 rounded-xl p-4"><p className="text-gray-700 text-sm leading-relaxed">{bookDetails.description}</p></div>}
                  {bookDetails.reason && <div className="bg-orange-50 rounded-xl p-4 border border-orange-100"><p className="text-sm text-orange-800"><span className="font-bold">Why you might like it:</span> {bookDetails.reason}</p></div>}
                  <div className="flex gap-2 pt-4">
                    <button onClick={() => { setShowBookDetails(false); const nc = { id:Date.now(), name:selectedBook.title, author:selectedBook.author, genre:bookDetails.genre||'General', members:1, chats:0, createdBy:user.email, createdByName:user.name, createdAt:new Date().toISOString(), messages:[] }; const ec = JSON.parse(localStorage.getItem('crews')||'[]'); ec.push(nc); localStorage.setItem('crews', JSON.stringify(ec)); alert(`Crew for "${selectedBook.title}" created!`); setPage('crews'); }} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium">Create Crew</button>
                    <button onClick={() => { navigator.clipboard.writeText(`Check out "${selectedBook.title}" by ${selectedBook.author} on ReadCrew!`); alert('Link copied!'); }} className="px-4 py-3 border border-gray-200 rounded-xl"><Share2 className="w-5 h-5" /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showComments && <CommentSection post={showComments} user={user} onClose={() => setShowComments(null)} updateNotificationCount={updateNotificationCount} />}
      {showShare && <ShareModal post={showShare} onClose={() => setShowShare(null)} />}

      <div className="px-4 py-4 space-y-5">
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div><h2 className="text-xl font-bold">Welcome, {user?.name?.split(' ')[0]}! 📚</h2><p className="text-orange-100 text-sm mt-1">Ready for your next reading adventure?</p></div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"><BookOpen className="w-6 h-6 text-white" /></div>
          </div>
          {hasReadingGoal && (
            <div className="mt-4 bg-white/20 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm mb-2"><span>Yearly Goal Progress</span><span className="font-semibold">{userStats.booksRead}/{user?.readingGoal?.yearly||0} books</span></div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden"><div className="h-full bg-white rounded-full transition-all duration-500" style={{ width:`${readingProgress}%` }} /></div>
              <div className="flex items-center justify-between mt-2 text-xs text-orange-100"><span>Monthly: {userStats.booksRead}/{user?.readingGoal?.monthly||0}</span><span>{Math.round(readingProgress)}% Complete</span></div>
            </div>
          )}
          {!hasReadingGoal && <button onClick={() => setPage('profile')} className="mt-3 w-full bg-white/20 hover:bg-white/30 rounded-xl py-2 text-sm font-medium transition">Set Reading Goals →</button>}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label:'Books', value:userStats.booksRead, icon:BookOpen, color:'text-blue-600', bg:'bg-blue-100', page:'profile' },
            { label:'Reviews', value:userStats.reviewsGiven, icon:Star, color:'text-purple-600', bg:'bg-purple-100', page:'reviews' },
            { label:'Posts', value:userStats.postsCreated, icon:Edit3, color:'text-green-600', bg:'bg-green-100', page:'post' },
            { label:'Crews', value:userStats.crewsJoined, icon:Users, color:'text-orange-600', bg:'bg-orange-100', page:'crews' }
          ].map(({ label, value, icon:Icon, color, bg, page }, idx) => (
            <div key={idx} className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition" onClick={() => setPage(page)}>
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}><Icon className={`w-4 h-4 ${color}`} /></div>
              <p className="text-lg font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <button onClick={() => setPage('post')} className="w-full bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-center gap-3 hover:shadow-md transition">
          {profileSrc ? <img src={profileSrc} alt="profile" className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{user?.name?.slice(0,2).toUpperCase()}</div>}
          <span className="text-gray-400 text-sm flex-1 text-left">Share your reading journey...</span>
          <span className="text-xs text-orange-500 font-medium bg-orange-50 px-3 py-1 rounded-full">Post</span>
        </button>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-orange-500" />Community Feed</h2>
            <button onClick={() => setPage('reviews')} className="text-sm text-orange-500 font-semibold">View All</button>
          </div>
          <div className="space-y-4">
            {feedPosts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200"><MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No posts yet. Be the first to share!</p><button onClick={() => setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">Create Post</button></div>
            ) : feedPosts.map((post, idx) => {
              const commentCount = getCommentCount(post.id);
              const isLiked = likedPosts.includes(post.id);
              return (
                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">{post.userName?.slice(0,2)||'U'}</div>
                    <div className="flex-1"><div className="flex items-center justify-between"><div><p className="font-semibold text-gray-900">{post.userName||'Anonymous'}</p><div className="flex items-center gap-1 mt-0.5"><BookOpen className="w-3 h-3 text-orange-500" /><p className="text-xs text-gray-500">{post.bookName||'Shared a story'}</p></div></div><span className="text-xs text-gray-400">{new Date(post.createdAt||Date.now()).toLocaleDateString()}</span></div></div>
                  </div>
                  {post.image && <img src={post.image} alt={post.bookName} className="w-full h-48 object-cover rounded-xl mb-3" />}
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{post.story||post.content}</p>
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                    <button onClick={() => handleLikePost(post.id, post)} disabled={isLiked} className={`flex items-center gap-1.5 text-xs transition ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}><Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} /><span>{post.likes||0}</span></button>
                    <button onClick={() => setShowComments(post)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-500"><MessageCircle className="w-4 h-4" /><span>{commentCount}</span></button>
                    <button onClick={() => setShowShare(post)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-500"><Share2 className="w-4 h-4" /><span>{post.shares||0}</span></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-orange-500" />Top Trending Books</h2>
            <button onClick={() => setPage('explore')} className="text-sm text-orange-500 font-semibold">Explore All</button>
          </div>
          {loadingTrending ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : (
            <div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {trendingBooks.slice(0,10).map((book, i) => (
                  <div key={i} className="shrink-0 w-28 cursor-pointer hover:scale-105 transition-transform" onClick={() => handleBookClick(book)}>
                    <DynamicBookCover title={book.title} author={book.author} size="md" className="mb-2" />
                    <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{book.title}</p>
                    <p className="text-xs text-gray-500 truncate">{book.author}</p>
                    <div className="flex items-center gap-1 mt-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span className="text-xs font-medium">{book.rating}</span><span className="text-xs text-gray-400 ml-1">({(book.readers/1000).toFixed(1)}K)</span></div>
                  </div>
                ))}
              </div>
              {hasMoreTrending && (
                <button onClick={() => loadTrendingBooks(trendingPage+1, true)} disabled={loadingMore} className="w-full mt-2 py-2 border border-orange-200 text-orange-500 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-orange-50 transition">
                  {loadingMore ? <><LoadingSpinner size="sm" />Loading...</> : 'Load More Books'}
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-orange-500" />Your Crews</h2>
            <button onClick={() => setPage('crews')} className="text-sm text-orange-500 font-semibold">View All</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(crews||[]).filter(crew => user?.joinedCrews?.includes(crew.id)).slice(0,2).map(crew => (
              <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => setPage('crews')}>
                <div className="h-16 flex items-center justify-center p-2 bg-gray-50"><DynamicBookCover title={crew.name} author={crew.author} size="xs" /></div>
                <div className="p-3"><h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{crew.name}</h3><p className="text-xs text-gray-500 mt-0.5">{crew.genre}</p><div className="flex items-center justify-between mt-2"><div className="flex items-center gap-1 text-xs text-gray-500"><Users className="w-3 h-3" /><span>{crew.members||1}</span></div><span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-lg text-xs">Joined</span></div></div>
              </div>
            ))}
            {(!user?.joinedCrews || user.joinedCrews.length === 0) && (
              <div className="col-span-2 bg-white rounded-xl p-6 text-center border border-gray-200"><p className="text-gray-500 text-sm">You haven't joined any crews yet</p><button onClick={() => setPage('crews')} className="mt-2 text-orange-500 text-sm font-medium">Browse Crews →</button></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── EXPLORE PAGE ─────────────────────────────────────────────────────────
const ExplorePage = ({ user, setPage, onCreateCrew }) => {
  const [mode, setMode] = useState('chat');
  const [chatHistory, setChatHistory] = useState([{ role:'assistant', content:"📚 Hey! I'm Page Turner, your AI book guide. Tell me what kind of book you're in the mood for — a genre, a feeling, or even a favorite character from a novel!" }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [bookPage, setBookPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(2,9)}`);
  const [charName, setCharName] = useState('');
  const [charBook, setCharBook] = useState('');
  const [charLoading, setCharLoading] = useState(false);
  const [charResult, setCharResult] = useState(null);
  const [exchangeCount, setExchangeCount] = useState(0);
  const chatRef = useRef();

  useEffect(() => { chatRef.current?.scrollTo({ top:99999, behavior:'smooth' }); }, [chatHistory]);

  const sendChat = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role:'user', content:input.trim() };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory); setInput(''); setLoading(true); setExchangeCount(prev => prev+1);
    try {
      const response = await axios.post(`${API_URL}/api/books/chat`, { message:input.trim(), sessionId });
      const { reply, hasRecommendations, recommendations, exchangeCount:serverExchange } = response.data;
      setChatHistory(prev => [...prev, { role:'assistant', content:reply }]);
      setExchangeCount(serverExchange||exchangeCount+1);
      if (hasRecommendations && recommendations?.length) { setBooks(recommendations); setBookPage(1); setHasMore(false); setTimeout(() => setMode('results'), 500); }
    } catch {
      if (exchangeCount >= 1) {
        try {
          const recResponse = await axios.post(`${API_URL}/api/books/recommend`, { query:input.trim(), page:1 });
          if (recResponse.data.success) { const reply = `Based on "${input.trim()}", here are some great books! 📖`; setChatHistory(prev => [...prev, { role:'assistant', content:reply }]); setBooks(recResponse.data.recommendations||[]); setBookPage(1); setHasMore(recResponse.data.hasMore||false); setTimeout(() => setMode('results'), 500); }
        } catch { setChatHistory(prev => [...prev, { role:'assistant', content:"I'm having trouble connecting right now. Try searching directly!" }]); }
      } else setChatHistory(prev => [...prev, { role:'assistant', content:"I'd love to help! What genres do you enjoy? 😊" }]);
    } finally { setLoading(false); }
  };

  const searchCharacter = async () => {
    if (!charName.trim()) return;
    setCharLoading(true); setCharResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/books/character-search`, { character:charName.trim(), fromBook:charBook.trim()||undefined });
      if (response.data.success) setCharResult(response.data); else throw new Error('No results');
    } catch {
      setCharResult({ characterAnalysis:`Fans of "${charName}" will enjoy books with similar characters:`, recommendations:[
        { title:'The Name of the Wind', author:'Patrick Rothfuss', genre:'Fantasy', description:'Epic tale of a legendary figure.', reason:'Similar complex protagonist', rating:4.5 },
        { title:'A Little Life', author:'Hanya Yanagihara', genre:'Fiction', description:'Deeply moving character study.', reason:'Rich character depth', rating:4.4 },
        { title:'The Count of Monte Cristo', author:'Alexandre Dumas', genre:'Adventure', description:'Classic tale of revenge and redemption.', reason:'Complex character arc', rating:4.7 }
      ]});
    } finally { setCharLoading(false); }
  };

  if (mode === 'results') {
    return (
      <div className="min-h-screen bg-[#FAF6F1] pb-24">
        <div className="sticky top-0 bg-white border-b border-[#EDE8E3] z-40 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMode('chat')} className="p-2 hover:bg-gray-100 rounded-xl"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
          <span className="font-semibold text-gray-900">Book Recommendations</span>
        </div>
        <div className="px-4 py-5 space-y-4">
          {books.map((book, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#EDE8E3] p-4 shadow-sm">
              <div className="flex gap-4">
                <DynamicBookCover title={book.title} author={book.author} size="md" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#2D2419] text-sm">{book.title}</h3><p className="text-xs text-[#9B8E84]">by {book.author}</p>
                  {book.genre && <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{book.genre}</span>}
                  {book.description && <p className="text-xs text-[#6B5D52] mt-1.5 line-clamp-2">{book.description}</p>}
                  {book.reason && <p className="text-xs text-orange-700 mt-1 italic">"{book.reason}"</p>}
                  <div className="flex items-center gap-1 mt-2"><StarRating rating={book.rating||4} size="xs" /><span className="text-xs text-gray-500">{book.rating||4.0}</span></div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => { onCreateCrew(book); setPage('crews'); }} className="flex-1 py-2.5 bg-[#C8622A] text-white rounded-xl text-sm font-semibold">Create Crew</button>
                <button onClick={() => { navigator.clipboard.writeText(`Check out "${book.title}" by ${book.author} on ReadCrew!`); alert('Link copied!'); }} className="px-4 py-2.5 border border-[#EDE8E3] rounded-xl"><Share2 className="w-4 h-4 text-gray-600" /></button>
              </div>
            </div>
          ))}
          {hasMore && <button onClick={async () => { setLoadingMore(true); try { const r = await axios.post(`${API_URL}/api/books/recommend`, { query:chatHistory.filter(m=>m.role==='user').pop()?.content||'', page:bookPage+1 }); if (r.data.success && r.data.recommendations) { setBooks(prev=>[...prev,...r.data.recommendations]); setBookPage(p=>p+1); setHasMore(r.data.hasMore||false); } } catch {} finally { setLoadingMore(false); } }} disabled={loadingMore} className="w-full py-3 border border-orange-200 text-orange-500 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-orange-50 transition">{loadingMore ? <><LoadingSpinner size="sm" />Loading...</> : 'Load 5 More Books'}</button>}
          <button onClick={() => setMode('chat')} className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">💬 Refine with Chat</button>
        </div>
      </div>
    );
  }

  if (mode === 'character') {
    return (
      <div className="min-h-screen bg-[#FAF6F1] pb-24">
        <div className="sticky top-0 bg-white border-b border-[#EDE8E3] z-40 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMode('chat')} className="p-2 hover:bg-gray-100 rounded-xl"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
          <span className="font-semibold text-gray-900">Find Books by Character</span>
        </div>
        <div className="px-4 py-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#EDE8E3] shadow-sm">
            <p className="text-sm text-gray-600 mb-4">Love a fictional character? Find books with similar characters!</p>
            <input value={charName} onChange={e => setCharName(e.target.value)} placeholder="Character name (e.g. Sherlock Holmes)" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-2 outline-none focus:border-orange-400" />
            <input value={charBook} onChange={e => setCharBook(e.target.value)} placeholder="From book (optional)" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-3 outline-none focus:border-orange-400" />
            <button onClick={searchCharacter} disabled={!charName.trim()||charLoading} className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-lg transition">
              {charLoading ? <><LoadingSpinner size="sm" />Searching...</> : '🎭 Find Similar Books'}
            </button>
          </div>
          {charResult && (
            <div className="space-y-4">
              <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100"><p className="text-sm text-orange-800 leading-relaxed">{charResult.characterAnalysis}</p></div>
              {(charResult.recommendations||[]).map((book, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#EDE8E3] p-4 shadow-sm">
                  <div className="flex gap-4">
                    <DynamicBookCover title={book.title} author={book.author} size="md" />
                    <div className="flex-1"><h3 className="font-bold text-[#2D2419] text-sm">{book.title}</h3><p className="text-xs text-gray-500">by {book.author}</p>{book.reason && <p className="text-xs text-gray-600 mt-1 italic">"{book.reason}"</p>}<div className="flex items-center gap-1 mt-2"><StarRating rating={book.rating||4} size="xs" /><span className="text-xs text-gray-500">{book.rating||4.0}</span></div></div>
                  </div>
                  <button onClick={() => { onCreateCrew(book); setPage('crews'); }} className="w-full mt-3 py-2.5 bg-[#C8622A] text-white rounded-xl text-sm font-semibold">Create Crew</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] to-[#FAF6F1] pb-24">
      <div className="px-5 pt-10 pb-4"><h1 className="text-2xl font-bold text-[#2D1F14] mb-1" style={{ fontFamily:'Georgia, serif' }}>What to read next?</h1><p className="text-sm text-[#8B7968]">Chat with AI or find books by character</p></div>
      <div className="flex gap-2 px-5 mb-4">
        <button onClick={() => setMode('chat')} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-orange-500 text-white shadow"><Sparkles className="w-3.5 h-3.5" />AI Chat</button>
        <button onClick={() => setMode('character')} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-600 border border-gray-200 shadow-sm hover:border-orange-300 transition">🎭 By Character</button>
      </div>
      <div className="mx-5 bg-white/80 backdrop-blur rounded-3xl shadow-lg border border-[#EDE8E3] overflow-hidden">
        <div ref={chatRef} className="h-64 overflow-y-auto p-4 space-y-3">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role==='user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role==='user' ? 'bg-[#C8622A] text-white rounded-br-sm' : 'bg-[#F6F0E8] text-[#3A2C25] rounded-bl-sm'}`}>{msg.content}</div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-[#F6F0E8] rounded-2xl rounded-bl-sm px-4 py-3"><div className="flex gap-1.5"><div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay:'0ms' }} /><div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay:'150ms' }} /><div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay:'300ms' }} /></div></div></div>}
        </div>
        <div className="border-t border-[#EDE8E3] px-3 py-2.5 flex items-center gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); sendChat(); } }} placeholder="Type a mood, genre, or ask anything..." className="flex-1 bg-[#FAF8F5] rounded-full px-4 py-2.5 text-sm text-[#2D1F14] outline-none border border-[#E8E0D8] focus:border-[#C8622A] transition" />
          <button onClick={sendChat} disabled={!input.trim()||loading} className={`w-9 h-9 rounded-full flex items-center justify-center transition ${input.trim()&&!loading ? 'bg-[#C8622A] text-white hover:bg-[#B0521A]' : 'bg-gray-200 text-gray-400'}`}><Send className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="px-5 mt-4">
        <p className="text-xs text-[#8B7968] mb-2">Try asking:</p>
        <div className="flex flex-wrap gap-2">
          {['📚 Best books of 2024','🔥 Something thrilling','🌿 Calm and cozy','🧠 Mind-blowing fiction','💪 Motivational','🎭 Complex characters'].map(s => (
            <button key={s} onClick={() => setInput(s.replace(/^[^\s]+\s/,''))} className="text-xs px-3 py-1.5 bg-white border border-[#EDE8E3] rounded-full text-[#6B5D52] hover:border-orange-300 hover:text-orange-600 transition">{s}</button>
          ))}
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
  const [isDonation, setIsDonation] = useState(false);
  const fileRef = useRef();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    const postData = { id:Date.now(), content, bookName, author, image, isPublic, type:isDonation?'donation':'post', userName:user.name, userEmail:user.email, createdAt:new Date().toISOString(), likes:0, comments:0, shares:0 };
    try { onPost(postData); setPage('home'); } catch { alert('Failed to create post.'); }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white z-[55]" style={{ maxWidth:'448px', left:'50%', transform:'translateX(-50%)' }}>
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setPage('home')} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-600" /></button>
        <h2 className="font-semibold text-gray-900">Create Post</h2>
        <button onClick={handleSubmit} disabled={!content.trim()} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">Share</button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">{user?.name?.slice(0,2).toUpperCase()}</div>
          <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-base resize-none" placeholder={isDonation?"Share your book donation story...":"What are you reading?"} rows={5} autoFocus />
        </div>
        <div className="space-y-3 mb-4">
          <input value={bookName} onChange={e => setBookName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300" placeholder="Book name (optional)" />
          <input value={author} onChange={e => setAuthor(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300" placeholder="Author (optional)" />
        </div>
        {image && <div className="relative mb-4"><img src={image} alt="preview" className="w-full rounded-xl max-h-56 object-cover" /><button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 rounded-full p-1 hover:bg-black/70 transition"><X className="w-4 h-4 text-white" /></button></div>}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 hover:bg-gray-200 transition"><Camera className="w-4 h-4" />Add Photo</button>
          <button onClick={() => setIsDonation(!isDonation)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition ${isDonation?'bg-orange-500 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><Gift className="w-4 h-4" />Donation Story</button>
          <button onClick={() => setIsPublic(!isPublic)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition ${!isPublic?'bg-gray-800 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{isPublic?<Globe className="w-4 h-4" />:<Lock className="w-4 h-4" />}{isPublic?'Public':'Private'}</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f=e.target.files[0]; if(f){const r=new FileReader();r.onload=ev=>setImage(ev.target.result);r.readAsDataURL(f);} }} />
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
  const [newReview, setNewReview] = useState({ bookName:'', author:'', rating:5, review:'', sentiment:'positive' });

  useEffect(() => { loadReviews(); loadLikedReviews(); }, []);
  const loadReviews = async () => { setLoading(true); try { setReviews(JSON.parse(localStorage.getItem('reviews')||'[]')); } catch {} finally { setLoading(false); } };
  const loadLikedReviews = () => setLikedReviews(JSON.parse(localStorage.getItem(`user_${user.email}_likedReviews`)||'[]'));

  const handleLikeReview = (reviewId, review) => {
    if (likedReviews.includes(reviewId)) return;
    const updated = [...likedReviews, reviewId]; setLikedReviews(updated);
    localStorage.setItem(`user_${user.email}_likedReviews`, JSON.stringify(updated));
    const ur = reviews.map(r => r.id===reviewId ? {...r, likes:(r.likes||0)+1} : r); setReviews(ur); localStorage.setItem('reviews', JSON.stringify(ur));
    if (review.userEmail !== user.email) {
      const n = { id:Date.now(), type:'like', fromUser:user.name, fromUserEmail:user.email, reviewId, message:`${user.name} liked your review of "${review.bookName}"`, timestamp:new Date().toISOString(), read:false };
      const existing = JSON.parse(localStorage.getItem(`user_${review.userEmail}_notifications`)||'[]'); existing.unshift(n); localStorage.setItem(`user_${review.userEmail}_notifications`, JSON.stringify(existing)); updateNotificationCount();
    }
  };

  const handleCreateReview = async () => {
    if (!newReview.bookName||!newReview.author||!newReview.review) { alert('Please fill all fields'); return; }
    const reviewData = { id:Date.now(), ...newReview, userName:user.name, userEmail:user.email, createdAt:new Date().toISOString(), likes:0 };
    const saved = JSON.parse(localStorage.getItem('reviews')||'[]'); saved.unshift(reviewData); localStorage.setItem('reviews', JSON.stringify(saved));
    setReviews([reviewData,...reviews]); setShowCreateForm(false); setNewReview({ bookName:'', author:'', rating:5, review:'', sentiment:'positive' });
    const us = {...user.stats, reviewsGiven:(user.stats?.reviewsGiven||0)+1}; const uu = {...user, stats:us}; localStorage.setItem('currentUser', JSON.stringify(uu)); localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(us));
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <button onClick={() => setPage('home')} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <h2 className="font-semibold text-gray-900">Book Reviews</h2>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium">{showCreateForm?'Cancel':'Write Review'}</button>
      </div>
      <div className="px-4 py-4">
        {showCreateForm && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Write a Review</h3>
            <div className="space-y-3 mb-4">
              <input type="text" value={newReview.bookName} onChange={e => setNewReview({...newReview, bookName:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Book name" />
              <input type="text" value={newReview.author} onChange={e => setNewReview({...newReview, author:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Author" />
              <div><label className="text-xs text-gray-600 mb-1 block">Rating</label><StarRating rating={newReview.rating} onChange={r => setNewReview({...newReview, rating:r})} size="md" /></div>
              <textarea value={newReview.review} onChange={e => setNewReview({...newReview, review:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300 resize-none" placeholder="Write your review..." rows={4} />
              <div><label className="text-xs text-gray-600 mb-1 block">Sentiment</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setNewReview({...newReview, sentiment:'positive'})} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${newReview.sentiment==='positive'?'bg-green-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>👍 Positive</button>
                  <button type="button" onClick={() => setNewReview({...newReview, sentiment:'negative'})} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${newReview.sentiment==='negative'?'bg-red-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>👎 Negative</button>
                </div>
              </div>
            </div>
            <button onClick={handleCreateReview} className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition">Submit Review</button>
          </div>
        )}
        {loading ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : reviews.length===0 ? (
          <div className="text-center py-12"><Star className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No reviews yet. Be the first to write one!</p></div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review, idx) => {
              const isLiked = likedReviews.includes(review.id);
              return (
                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-3 mb-2">
                    <DynamicBookCover title={review.bookName} author={review.author} size="sm" />
                    <div className="flex-1"><h3 className="font-semibold text-gray-900 text-sm">{review.bookName}</h3><p className="text-xs text-gray-500">by {review.author}</p><div className="flex items-center gap-1 mt-1"><StarRating rating={review.rating} size="xs" /></div></div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{review.review}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2"><div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">{review.userName?.slice(0,2)||'U'}</div><span className="text-xs text-gray-500">{review.userName}</span></div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleLikeReview(review.id, review)} disabled={isLiked} className={`flex items-center gap-1 text-xs transition ${isLiked?'text-red-500':'text-gray-400 hover:text-red-400'}`}><Heart className={`w-3.5 h-3.5 ${isLiked?'fill-red-500':''}`} /><span>{review.likes||0}</span></button>
                      <span className={`text-xs px-2 py-1 rounded-full ${review.sentiment==='positive'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{review.sentiment==='positive'?'👍':'👎'}</span>
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

// ─── CREWS PAGE ───────────────────────────────────────────────────────────
// ✅ CHANGED: Added `onViewChange` prop — called whenever the internal view changes.
// This allows the parent App to know when chat is active and hide the bottom nav.
const CrewsPage = ({ user, crews: initialCrews, setPage, updateNotificationCount, onViewChange }) => {
  const [view, setViewState] = useState('list');
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
  const [newCrewData, setNewCrewData] = useState({ name:'', author:'', genre:'' });
  const [selectedTab, setSelectedTab] = useState('chat');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // ✅ CHANGED: Unified `changeView` helper that updates state AND notifies parent
  const changeView = (newView) => {
    setViewState(newView);
    onViewChange?.(newView);
  };

  useEffect(() => {
    const savedCrews = JSON.parse(localStorage.getItem('crews')||'[]');
    setCrews(savedCrews.length > 0 ? savedCrews : initialCrews);
    const savedJoinedCrews = JSON.parse(localStorage.getItem(`user_${user.email}_joinedCrews`)||'[]');
    setJoinedCrews(savedJoinedCrews);
  }, [user.email]);

  useEffect(() => {
    if (selectedCrew) { loadCrewMessages(); loadCrewMembers(); loadSimilarBooks(); }
  }, [selectedCrew]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const loadCrewMessages = () => {
    const crewMessages = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`)||'[]');
    setMessages(crewMessages.map(m => ({...m, timestamp:new Date(m.timestamp)})));
  };

  const loadCrewMembers = () => {
    const allUsers = JSON.parse(localStorage.getItem('users')||'[]');
    const members = allUsers.filter(u => u.joinedCrews?.includes(selectedCrew.id)).map(u => ({ id:u.id, name:u.name, email:u.email, initials:u.name?.slice(0,2), color:'#C8622A', online:Math.random()>0.5 }));
    if (!members.find(m => m.email===selectedCrew.createdBy)) members.push({ id:selectedCrew.createdBy, name:selectedCrew.createdByName||'Creator', email:selectedCrew.createdBy, initials:selectedCrew.createdByName?.slice(0,2)||'CR', color:'#C8622A', online:true, isCreator:true });
    setCrewMembers(members);
  };

  const loadSimilarBooks = async () => {
    setSimilarBooks([
      { id:101, title:'The Five People You Meet in Heaven', author:'Mitch Albom', rating:4.5 },
      { id:102, title:'For One More Day', author:'Mitch Albom', rating:4.3 },
      { id:103, title:'The Time Keeper', author:'Mitch Albom', rating:4.4 },
    ]);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()||!selectedCrew||!isUserJoined(selectedCrew.id)) return;
    const message = { id:Date.now(), userId:user.id, userName:user.name, userInitials:user.name?.slice(0,2).toUpperCase(), content:newMessage.trim(), timestamp:new Date().toISOString(), type:'text' };
    const existing = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`)||'[]');
    existing.push(message); localStorage.setItem(`crew_${selectedCrew.id}_messages`, JSON.stringify(existing));
    setMessages(prev => [...prev, {...message, timestamp:new Date(message.timestamp)}]); setNewMessage('');
    const notification = { id:Date.now(), type:'message', fromUser:user.name, fromUserEmail:user.email, crewId:selectedCrew.id, crewName:selectedCrew.name, message:`${user.name} sent a message in ${selectedCrew.name}`, timestamp:new Date().toISOString(), read:false };
    crewMembers.forEach(member => { if (member.email!==user.email) { const mn = JSON.parse(localStorage.getItem(`user_${member.email}_notifications`)||'[]'); mn.unshift(notification); localStorage.setItem(`user_${member.email}_notifications`, JSON.stringify(mn)); } });
    updateNotificationCount();
  };

  const handleSendImage = (e) => {
    const file = e.target.files[0];
    if (file && selectedCrew && isUserJoined(selectedCrew.id)) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const message = { id:Date.now(), userId:user.id, userName:user.name, userInitials:user.name?.slice(0,2).toUpperCase(), content:ev.target.result, timestamp:new Date().toISOString(), type:'image' };
        const existing = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`)||'[]');
        existing.push(message); localStorage.setItem(`crew_${selectedCrew.id}_messages`, JSON.stringify(existing));
        setMessages(prev => [...prev, {...message, timestamp:new Date(message.timestamp)}]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTyping = () => { setIsTyping(true); clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1000); };
  const isUserJoined = (crewId) => joinedCrews.includes(crewId);

  const handleJoinCrew = (crew) => {
    const updated = [...joinedCrews, crew.id]; setJoinedCrews(updated); localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updated));
    const uc = crews.map(c => c.id===crew.id ? {...c, members:(c.members||1)+1} : c); setCrews(uc); localStorage.setItem('crews', JSON.stringify(uc));
    const users = JSON.parse(localStorage.getItem('users')||'[]'); const uu = users.map(u => u.email===user.email ? {...u, joinedCrews:updated} : u); localStorage.setItem('users', JSON.stringify(uu));
    const us = {...user.stats, crewsJoined:(user.stats?.crewsJoined||0)+1}; const uuu = {...user, stats:us, joinedCrews:updated}; localStorage.setItem('currentUser', JSON.stringify(uuu)); localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(us));
    setJoinMessage(`🎉 You've joined the ${crew.name} crew!`); setShowJoinMessage(true); setTimeout(() => setShowJoinMessage(false), 3000);
  };

  const handleLeaveCrew = (crew) => {
    if (window.confirm(`Are you sure you want to leave ${crew.name}?`)) {
      const updated = joinedCrews.filter(id => id!==crew.id); setJoinedCrews(updated); localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updated));
      const uc = crews.map(c => c.id===crew.id ? {...c, members:Math.max(0,(c.members||1)-1)} : c); setCrews(uc); localStorage.setItem('crews', JSON.stringify(uc));
      const users = JSON.parse(localStorage.getItem('users')||'[]'); const uu = users.map(u => u.email===user.email ? {...u, joinedCrews:updated} : u); localStorage.setItem('users', JSON.stringify(uu));
      const us = {...user.stats, crewsJoined:Math.max(0,(user.stats?.crewsJoined||1)-1)}; const uuu = {...user, stats:us, joinedCrews:updated}; localStorage.setItem('currentUser', JSON.stringify(uuu)); localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(us));
      if (selectedCrew?.id===crew.id) { changeView('list'); setSelectedCrew(null); }
    }
  };

  const handleCreateCrew = () => {
    if (!newCrewData.name||!newCrewData.author) { alert('Please fill in the book name and author'); return; }
    const newCrew = { id:Date.now(), ...newCrewData, members:1, chats:0, createdBy:user.email, createdByName:user.name, createdAt:new Date().toISOString(), messages:[] };
    const uc = [newCrew,...crews]; setCrews(uc); localStorage.setItem('crews', JSON.stringify(uc));
    handleJoinCrew(newCrew); setShowCreateCrewForm(false); setNewCrewData({ name:'', author:'', genre:'' });
    setJoinMessage(`🎉 Crew "${newCrew.name}" created!`); setShowJoinMessage(true); setTimeout(() => setShowJoinMessage(false), 3000);
  };

  const handleAddFriend = (crew) => {
    const friendEmail = prompt("Enter your friend's email to invite them:");
    if (friendEmail) {
      const notification = { id:Date.now(), type:'invite', fromUser:user.name, fromUserEmail:user.email, crewId:crew.id, crewName:crew.name, message:`${user.name} invited you to join the "${crew.name}" crew!`, timestamp:new Date().toISOString(), read:false };
      const fn = JSON.parse(localStorage.getItem(`user_${friendEmail}_notifications`)||'[]'); fn.unshift(notification); localStorage.setItem(`user_${friendEmail}_notifications`, JSON.stringify(fn));
      updateNotificationCount(); alert(`Invitation sent to ${friendEmail}!`);
    }
  };

  const formatMessageTime = (timestamp) => {
    const diffMs = new Date() - new Date(timestamp);
    const diffMins = Math.floor(diffMs/60000); const diffHours = Math.floor(diffMs/3600000); const diffDays = Math.floor(diffMs/86400000);
    if (diffMins<1) return 'Just now'; if (diffMins<60) return `${diffMins}m ago`; if (diffHours<24) return `${diffHours}h ago`; if (diffDays<7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const groupMessagesByDate = () => {
    const groups = []; let currentDate = null; let currentGroup = [];
    messages.forEach(msg => {
      const msgDate = new Date(msg.timestamp).toDateString();
      if (msgDate!==currentDate) { if (currentGroup.length>0) groups.push({ date:currentDate, messages:currentGroup }); currentDate=msgDate; currentGroup=[msg]; } else currentGroup.push(msg);
    });
    if (currentGroup.length>0) groups.push({ date:currentDate, messages:currentGroup });
    return groups;
  };

  const JoinMessageToast = () => (
    <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg z-[100] text-center">{joinMessage}</div>
  );

  // =========== CHAT VIEW ===========
  // ✅ CHANGED: Back button and leave crew now use changeView() so parent App knows
  if (view === 'chat' && selectedCrew) {
    const hasJoined = isUserJoined(selectedCrew.id);
    const messageGroups = groupMessagesByDate();
    return (
      <div className="fixed inset-0 flex flex-col z-[60] bg-[#e5ddd5]" style={{ maxWidth:'448px', left:'50%', transform:'translateX(-50%)' }}>
        {showJoinMessage && <JoinMessageToast />}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            {/* ✅ CHANGED: back uses changeView */}
            <button onClick={() => changeView('detail')} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
            <div className="relative">
              <DynamicBookCover title={selectedCrew.name} author={selectedCrew.author} size="xs" />
              {hasJoined && <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
            </div>
            <div><p className="font-semibold text-gray-900 text-sm">{selectedCrew.name}</p><p className="text-xs text-gray-500">{crewMembers.length} member{crewMembers.length!==1?'s':''} • {crewMembers.filter(m=>m.online).length} online</p></div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full"><MoreHorizontal className="w-5 h-5 text-gray-600" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {!hasJoined ? (
            <div className="flex flex-col items-center justify-center h-full text-center bg-white/80 rounded-xl p-8 mx-4 my-8">
              <Lock className="w-16 h-16 text-gray-400 mb-4" /><p className="text-gray-700 font-medium mb-2">This chat is private</p><p className="text-gray-500 text-sm mb-4">Join this crew to see messages</p>
              <button onClick={() => handleJoinCrew(selectedCrew)} className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium shadow-lg">Join Crew</button>
            </div>
          ) : (
            <>
              {messageGroups.length===0 && (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center"><div className="w-16 h-16 bg-white/60 rounded-full flex items-center justify-center mb-3 shadow-sm"><MessageCircle className="w-8 h-8 text-gray-400" /></div><p className="text-gray-600 font-medium">No messages yet</p><p className="text-gray-500 text-sm mt-1">Be the first to say something!</p></div>
              )}
              {messageGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <div className="flex justify-center my-4"><span className="bg-gray-300/80 text-gray-700 text-xs px-3 py-1 rounded-full shadow-sm">{new Date(group.date).toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' })}</span></div>
                  {group.messages.map((msg, msgIndex) => {
                    const isOwn = msg.userId===user.id;
                    const showAvatar = !isOwn && (msgIndex===0 || group.messages[msgIndex-1].userId!==msg.userId);
                    return (
                      <div key={msg.id} className={`flex mb-1 ${isOwn?'justify-end':'justify-start'}`}>
                        <div className={`flex max-w-[78%] ${isOwn?'flex-row-reverse':'flex-row'} items-end gap-1.5`}>
                          {!isOwn ? (showAvatar ? <div className="w-7 h-7 flex-shrink-0 mb-0.5"><div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold">{msg.userInitials}</div></div> : <div className="w-7 flex-shrink-0" />) : null}
                          <div>
                            {!isOwn && showAvatar && <p className="text-xs text-gray-600 mb-0.5 ml-1 font-medium">{msg.userName}</p>}
                            <div className={`rounded-2xl px-3.5 py-2 shadow-sm ${isOwn?'bg-[#dcf8c6] rounded-br-sm':'bg-white rounded-bl-sm'}`}>
                              {msg.type==='image' ? <img src={msg.content} alt="Shared" className="max-w-full rounded-xl max-h-60" /> : <p className="text-sm leading-relaxed break-words text-gray-900">{msg.content}</p>}
                              <p className="text-[10px] text-gray-400 text-right mt-0.5 leading-none">{formatMessageTime(msg.timestamp)}{isOwn && <span className="ml-1 text-blue-400">✓✓</span>}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start mb-1"><div className="flex items-end gap-1.5 max-w-[78%]"><div className="w-7 h-7 flex-shrink-0"><div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold">..</div></div><div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm"><div className="flex gap-1 items-center"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay:'0ms' }} /><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay:'150ms' }} /><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay:'300ms' }} /></div></div></div></div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {hasJoined && (
          <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-3 py-2.5" style={{ paddingBottom:'max(10px, env(safe-area-inset-bottom))' }}>
            <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow border border-gray-100">
              <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center hover:bg-orange-50 rounded-full transition flex-shrink-0"><Plus className="w-5 h-5 text-orange-500" /></button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleSendImage} />
              <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); handleSendMessage(); } handleTyping(); }}
                className="flex-1 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent min-w-0" placeholder="Type a message..." />
              <button onClick={handleSendMessage} disabled={!newMessage.trim()} className={`w-8 h-8 flex items-center justify-center rounded-full transition flex-shrink-0 ${newMessage.trim()?'bg-orange-500 text-white shadow-md active:scale-95':'bg-gray-200 text-gray-400 cursor-not-allowed'}`}><Send className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========== DETAIL VIEW ===========
  if (view === 'detail' && selectedCrew) {
    const hasJoined = isUserJoined(selectedCrew.id);
    return (
      <div className="h-screen flex flex-col bg-white">
        {showJoinMessage && <JoinMessageToast />}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-10">
          {/* ✅ CHANGED: back uses changeView */}
          <button onClick={() => changeView('list')} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
          <span className="font-semibold text-gray-900 flex-1">Crew Info</span>
          <button className="p-2 hover:bg-gray-100 rounded-full"><MoreHorizontal className="w-5 h-5 text-gray-600" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="bg-gradient-to-b from-orange-50 to-white px-4 pt-6 pb-4">
            <div className="flex flex-col items-center text-center">
              <DynamicBookCover title={selectedCrew.name} author={selectedCrew.author} size="xl" className="mb-4" />
              <h1 className="text-2xl font-bold text-gray-900">{selectedCrew.name}</h1><p className="text-gray-600">by {selectedCrew.author}</p>
              <span className="mt-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">{selectedCrew.genre}</span>
              <div className="flex gap-6 mt-4">
                <div className="text-center"><p className="text-xl font-bold text-gray-900">{crewMembers.length}</p><p className="text-xs text-gray-500">Members</p></div>
                <div className="text-center"><p className="text-xl font-bold text-gray-900">{messages.length}</p><p className="text-xs text-gray-500">Messages</p></div>
                <div className="text-center"><p className="text-xl font-bold text-gray-900">4.5</p><p className="text-xs text-gray-500">Rating</p></div>
              </div>
              <div className="flex gap-3 mt-6 w-full">
                {!hasJoined ? (
                  <button onClick={() => handleJoinCrew(selectedCrew)} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold">Join Crew</button>
                ) : (
                  // ✅ CHANGED: uses changeView
                  <button onClick={() => changeView('chat')} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold">Go to Chat</button>
                )}
                <button onClick={() => handleAddFriend(selectedCrew)} className="px-4 py-3 border border-gray-200 rounded-xl"><UserPlus className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
          <div className="flex border-b border-gray-200 px-4">
            {['Chat','Members','Media','About'].map(tab => (
              <button key={tab} onClick={() => setSelectedTab(tab.toLowerCase())} className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${selectedTab===tab.toLowerCase()?'text-orange-500 border-orange-500':'text-gray-500 border-transparent'}`}>{tab}</button>
            ))}
          </div>
          <div className="p-4 pb-24">
            {selectedTab==='chat' && (
              <div className="space-y-4">
                {hasJoined ? (
                  <>
                    {/* ✅ CHANGED: uses changeView */}
                    <button onClick={() => changeView('chat')} className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"><MessageCircle className="w-5 h-5" />Open Chat</button>
                    {messages.slice(-3).reverse().map(msg => (
                      <div key={msg.id} className="flex items-start gap-3 py-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">{msg.userInitials}</div>
                        <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="font-semibold text-sm">{msg.userName}</span><span className="text-xs text-gray-400">{formatMessageTime(msg.timestamp)}</span></div><p className="text-sm text-gray-600 truncate">{msg.content}</p></div>
                      </div>
                    ))}
                  </>
                ) : <div className="text-center py-8"><Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Join this crew to see messages</p></div>}
              </div>
            )}
            {selectedTab==='members' && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">{crewMembers.length} Members</p>
                {crewMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative"><div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">{member.initials}</div>{member.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>}</div>
                      <div><p className="font-semibold text-gray-900">{member.name}</p><p className="text-xs text-gray-500">{member.isCreator?'Creator':member.online?'Online':'Offline'}</p></div>
                    </div>
                    {member.email!==user.email && <button className="text-sm text-orange-500 font-medium">Message</button>}
                  </div>
                ))}
              </div>
            )}
            {selectedTab==='media' && <div className="text-center py-12"><Image className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">No media shared yet</p></div>}
            {selectedTab==='about' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4"><h3 className="font-semibold text-gray-900 mb-2">Description</h3><p className="text-sm text-gray-600">This crew is dedicated to discussing "{selectedCrew.name}" by {selectedCrew.author}. Join to share your thoughts and connect with other readers.</p></div>
                <div className="bg-gray-50 rounded-xl p-4"><h3 className="font-semibold text-gray-900 mb-2">Crew Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Created</span><span className="text-gray-900">{new Date(selectedCrew.createdAt).toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Created by</span><span className="text-gray-900">{selectedCrew.createdByName||'Creator'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Genre</span><span className="text-gray-900">{selectedCrew.genre}</span></div>
                  </div>
                </div>
                {hasJoined && <button onClick={() => handleLeaveCrew(selectedCrew)} className="w-full py-3 border border-red-200 text-red-500 rounded-xl font-medium mt-4">Leave Crew</button>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========== LIST VIEW ===========
  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {showJoinMessage && <JoinMessageToast />}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2"><div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-white" /></div><span className="font-bold text-gray-900" style={{ fontFamily:'Georgia, serif' }}>Reading Crews</span></div>
        <button onClick={() => setShowCreateCrewForm(true)} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium">Create Crew</button>
      </div>
      <div className="px-4 py-4">
        {showCreateCrewForm && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Create New Crew</h3>
            <div className="space-y-3">
              <input type="text" value={newCrewData.name} onChange={e => setNewCrewData({...newCrewData, name:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Book name" />
              <input type="text" value={newCrewData.author} onChange={e => setNewCrewData({...newCrewData, author:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Author" />
              <input type="text" value={newCrewData.genre} onChange={e => setNewCrewData({...newCrewData, genre:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Genre (e.g., Fiction, Self-Help)" />
              <div className="flex gap-2">
                <button onClick={handleCreateCrew} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition">Create</button>
                <button onClick={() => setShowCreateCrewForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-2 mb-5">
          <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm"><Search className="w-4 h-4 text-gray-400" /><input className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none" placeholder="Search crews..." /></div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-orange-500" />My Crews</h2>
          <div className="space-y-3">
            {crews.filter(crew => isUserJoined(crew.id)).length===0 ? (
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200"><p className="text-gray-500 text-sm">You haven't joined any crews yet</p><p className="text-xs text-gray-400 mt-1">Join a crew to start discussing books!</p></div>
            ) : crews.filter(crew => isUserJoined(crew.id)).map(crew => (
              // ✅ CHANGED: onClick uses changeView
              <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-green-200 shadow-sm cursor-pointer hover:shadow-md transition relative" onClick={() => { setSelectedCrew(crew); changeView('detail'); }}>
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">Joined</div>
                <div className="h-20 relative"><div className="absolute inset-0 flex items-center px-4 gap-4"><DynamicBookCover title={crew.name} author={crew.author} size="sm" /><div><p className="font-bold text-gray-900">{crew.name}</p><p className="text-xs text-gray-500">by {crew.author}</p><div className="flex items-center gap-2 mt-1"><span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre}</span><span className="text-xs text-gray-500">{crew.members||1} members</span></div></div></div></div>
                <div className="px-4 py-2 flex justify-end gap-2 border-t border-gray-100">
                  {/* ✅ CHANGED: Chat button uses changeView */}
                  <button onClick={e => { e.stopPropagation(); setSelectedCrew(crew); changeView('chat'); }} className="px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-xs font-medium">Chat</button>
                  <button onClick={e => { e.stopPropagation(); handleAddFriend(crew); }} className="px-3 py-1 border border-blue-200 text-blue-600 rounded-lg text-xs font-medium">Invite</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Discover Crews</h2>
          <div className="space-y-3">
            {crews.filter(crew => !isUserJoined(crew.id)).map(crew => (
              // ✅ CHANGED: onClick uses changeView
              <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition" onClick={() => { setSelectedCrew(crew); changeView('detail'); }}>
                <div className="h-20 relative"><div className="absolute inset-0 flex items-center px-4 gap-4"><DynamicBookCover title={crew.name} author={crew.author} size="sm" /><div><p className="font-bold text-gray-900">{crew.name}</p><p className="text-xs text-gray-500">by {crew.author}</p><div className="flex items-center gap-2 mt-1"><span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre}</span><span className="text-xs text-gray-500">{crew.members||1} members</span></div></div></div></div>
                <div className="px-4 py-3 flex justify-between items-center border-t border-gray-100">
                  <button onClick={e => { e.stopPropagation(); handleAddFriend(crew); }} className="px-3 py-1 border border-blue-200 text-blue-600 rounded-lg text-xs font-medium">Invite</button>
                  <button onClick={e => { e.stopPropagation(); handleJoinCrew(crew); }} className="px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold">Join</button>
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
const ProfilePage = ({ user, posts, setPage, onLogout, onUpdateUser, profileSrc, setProfileSrc }) => {
  const [activeTab, setActiveTab] = useState('Posts');
  const [userStats, setUserStats] = useState(user?.stats || { booksRead:0, reviewsGiven:0, postsCreated:0, crewsJoined:0 });
  const [readingGoal, setReadingGoal] = useState(user?.readingGoal || { yearly:0, monthly:0 });
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [editGoal, setEditGoal] = useState(readingGoal);
  const fileRef = useRef();
  const tabs = ['Posts','Reviews','Crews','Saved'];
  const myPosts = posts.filter(p => p.userEmail === user?.email);

  useEffect(() => {
    const s = localStorage.getItem(`user_${user.email}_stats`); if (s) setUserStats(JSON.parse(s));
    const img = localStorage.getItem(`user_${user.email}_profile_image`); if (img) setProfileSrc(img);
  }, [user.email]);

  const handleSaveGoal = () => {
    const uu = {...user, readingGoal:editGoal}; localStorage.setItem('currentUser', JSON.stringify(uu)); setReadingGoal(editGoal); setShowEditGoal(false); onUpdateUser?.(uu);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = ev.target.result; setProfileSrc(img); localStorage.setItem(`user_${user.email}_profile_image`, img);
        const users = JSON.parse(localStorage.getItem('users')||'[]'); const uu = users.map(u => u.email===user.email ? {...u, profileImage:img} : u); localStorage.setItem('users', JSON.stringify(uu));
        const uuu = {...user, profileImage:img}; localStorage.setItem('currentUser', JSON.stringify(uuu)); onUpdateUser?.(uuu);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2"><div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-white" /></div><span className="font-bold text-gray-900" style={{ fontFamily:'Georgia, serif' }}>Profile</span></div>
        <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-lg transition"><LogOut className="w-5 h-5 text-gray-600" /></button>
      </div>
      <div className="px-4 py-5">
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            {profileSrc ? <img src={profileSrc} alt={user?.name} className="w-20 h-20 rounded-full object-cover border-2 border-orange-200" /> : <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">{user?.name?.slice(0,2).toUpperCase()}</div>}
            <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white hover:bg-orange-600 transition shadow"><Camera className="w-3.5 h-3.5 text-white" /></button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
          <div className="flex-1"><h2 className="text-xl font-bold text-gray-900">{user?.name}</h2><p className="text-sm text-gray-500">@{user?.name?.toLowerCase().replace(/\s/g,'')}</p><p className="text-sm text-gray-600 mt-1 italic">"Reading is my superpower"</p><button className="mt-2 px-4 py-1.5 border border-orange-200 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition">Edit Profile</button></div>
        </div>
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><Target className="w-4 h-4 text-orange-500" /><h3 className="font-semibold text-gray-900">Reading Goal {new Date().getFullYear()}</h3></div>
            <button onClick={() => setShowEditGoal(!showEditGoal)} className="text-sm text-orange-500 font-medium">{showEditGoal?'Cancel':'Edit'}</button>
          </div>
          {showEditGoal ? (
            <div className="space-y-3 mt-3">
              <div><label className="text-xs text-gray-600 mb-1 block">Yearly Goal (books)</label><input type="number" value={editGoal.yearly} onChange={e => setEditGoal({...editGoal, yearly:parseInt(e.target.value)||0})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none" min="0" max="100" /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">Monthly Goal (books)</label><input type="number" value={editGoal.monthly} onChange={e => setEditGoal({...editGoal, monthly:parseInt(e.target.value)||0})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none" min="0" max="20" /></div>
              <button onClick={handleSaveGoal} className="w-full py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition">Save Goal</button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm mb-1"><span className="text-gray-600">Progress</span><span className="font-semibold text-gray-900">{readingGoal.yearly>0?`${userStats.booksRead}/${readingGoal.yearly} books`:'No goal set'}</span></div>
              {readingGoal.yearly>0 && (<><div className="h-2 bg-orange-200 rounded-full overflow-hidden"><div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width:`${(userStats.booksRead/readingGoal.yearly)*100}%` }} /></div><div className="flex items-center justify-between mt-2 text-xs text-gray-500"><span>Monthly: {readingGoal.monthly>0?`${userStats.booksRead}/${readingGoal.monthly}`:'No goal'}</span><span>{Math.round((userStats.booksRead/readingGoal.yearly)*100)}% Complete</span></div></>)}
            </>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2 bg-white rounded-xl p-3 border border-gray-200 mb-5">
          {[{label:'Books',value:userStats.booksRead,icon:BookOpen,color:'text-blue-600'},{label:'Reviews',value:userStats.reviewsGiven,icon:Star,color:'text-purple-600'},{label:'Posts',value:userStats.postsCreated,icon:Edit3,color:'text-green-600'},{label:'Crews',value:userStats.crewsJoined,icon:Users,color:'text-orange-600'}].map(({label,value,icon:Icon,color},idx) => (
            <div key={idx} className="text-center"><Icon className={`w-5 h-5 ${color} mx-auto mb-1`} /><p className="text-lg font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
          ))}
        </div>
        <div className="flex border-b border-gray-200 mb-4">
          {tabs.map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 text-sm pb-2.5 font-medium border-b-2 transition ${activeTab===tab?'text-orange-500 border-orange-500':'text-gray-500 border-transparent hover:text-gray-700'}`}>{tab}</button>)}
        </div>
        {activeTab==='Posts' && (
          <div className="space-y-4">
            {myPosts.length===0 ? (<div className="text-center py-8"><Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No posts yet</p><button onClick={() => setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">Create Your First Post</button></div>) : myPosts.map(post => (
              <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  {profileSrc ? <img src={profileSrc} alt={user?.name} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">{user?.name?.slice(0,2).toUpperCase()}</div>}
                  <div className="flex-1"><div className="flex items-center justify-between"><div><p className="font-semibold text-gray-900">{user?.name}</p><div className="flex items-center gap-1 mt-0.5"><BookOpen className="w-3 h-3 text-orange-500" /><p className="text-xs text-gray-500">{post.bookName||'General'}</p></div></div><span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span></div></div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">{post.content}</p>
                {post.image && <img src={post.image} alt="post" className="w-full rounded-xl mb-3" />}
                <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-500"><Heart className="w-4 h-4" /> {post.likes||0}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500"><MessageCircle className="w-4 h-4" /> {post.comments||0}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500"><Share2 className="w-4 h-4" /> {post.shares||0}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab==='Reviews' && (<div className="text-center py-8"><Star className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No reviews yet</p><button onClick={() => setPage('reviews')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">Write a Review</button></div>)}
        {activeTab==='Crews' && (<div className="text-center py-8"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No crews joined yet</p><button onClick={() => setPage('crews')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">Browse Crews</button></div>)}
        {activeTab==='Saved' && (<div className="text-center py-12"><Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">No saved items yet</p></div>)}
      </div>
    </div>
  );
};

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [posts, setPosts] = useState([]);
  const [donations, setDonations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [crews, setCrews] = useState([
    { id:1, name:'Atomic Habits', author:'James Clear', genre:'Self Improvement', members:1, chats:0 },
    { id:2, name:'Tuesdays with Morrie', author:'Mitch Albom', genre:'Inspiration', members:1, chats:0 },
    { id:3, name:'The Alchemist', author:'Paulo Coelho', genre:'Fiction', members:1, chats:0 },
    { id:4, name:'Sapiens', author:'Yuval Harari', genre:'History', members:1, chats:0 },
  ]);
  const [notification, setNotification] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [profileSrc, setProfileSrc] = useState(null);

  // ✅ CHANGED: New state — tracks whether the crew chat view is currently active
  const [crewChatActive, setCrewChatActive] = useState(false);

  useEffect(() => {
    if (currentPage === 'post') setShowBottomNav(false);
    else setShowBottomNav(true);
    // ✅ CHANGED: Reset crew chat state when navigating away from crews
    if (currentPage !== 'crews') setCrewChatActive(false);
  }, [currentPage]);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user); setIsLoggedIn(true); loadUserData(user);
        const img = localStorage.getItem(`user_${user.email}_profile_image`); if (img) setProfileSrc(img);
        const savedCrews = JSON.parse(localStorage.getItem('crews')||'[]'); if (savedCrews.length>0) setCrews(savedCrews);
      } catch {}
    }
  }, []);

  const loadUserData = async (user) => {
    try {
      const userPosts = JSON.parse(localStorage.getItem(`user_${user.email}_posts`)||'[]'); setPosts(userPosts);
      updateNotificationCount();
    } catch {}
  };

  const updateNotificationCount = () => {
    const notifications = JSON.parse(localStorage.getItem(`user_${currentUser?.email}_notifications`)||'[]');
    setUnreadMessages(notifications.filter(n => !n.read).length);
  };

  const handleLogin = (userData) => {
    setCurrentUser(userData); setIsLoggedIn(true); setCurrentPage('home'); loadUserData(userData);
    const img = localStorage.getItem(`user_${userData.email}_profile_image`); if (img) setProfileSrc(img);
  };

  const handlePost = (postData) => {
    const updatedPosts = [postData,...posts]; setPosts(updatedPosts);
    localStorage.setItem(`user_${currentUser.email}_posts`, JSON.stringify(updatedPosts));
    const us = {...currentUser.stats, postsCreated:(currentUser.stats?.postsCreated||0)+1};
    const uu = {...currentUser, stats:us}; setCurrentUser(uu); localStorage.setItem('currentUser', JSON.stringify(uu)); localStorage.setItem(`user_${currentUser.email}_stats`, JSON.stringify(us));
    showNotif('Post created successfully!', 'success');
  };

  const handleCreateCrew = (book) => {
    const newCrew = { id:Date.now(), name:book.title, author:book.author, genre:book.genre||'General', members:1, chats:0, createdBy:currentUser.email, createdByName:currentUser.name, createdAt:new Date().toISOString(), messages:[] };
    const uc = [newCrew,...crews]; setCrews(uc); localStorage.setItem('crews', JSON.stringify(uc));
    showNotif(`Crew "${book.title}" created! Invite friends to join.`, 'success');
  };

  const showNotif = (message, type='info') => { setNotification({ message, type }); setTimeout(() => setNotification(null), 3000); };
  const handleUpdateUser = (uu) => { setCurrentUser(uu); localStorage.setItem('currentUser', JSON.stringify(uu)); };

  if (!isLoggedIn) {
    return <div className="min-h-screen bg-gray-50"><div className="max-w-md mx-auto"><LoginPage onLogin={handleLogin} /></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {notification && (
        <div className={`fixed top-4 right-4 left-4 max-w-md mx-auto px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg z-[100] ${notification.type==='success'?'bg-green-500':notification.type==='error'?'bg-red-500':'bg-blue-500'}`}>
          {notification.message}
        </div>
      )}
      {showNotifications && <NotificationsPage user={currentUser} onClose={() => { setShowNotifications(false); updateNotificationCount(); }} />}

      <div className="max-w-md mx-auto relative">
        {currentPage==='home' && <HomePage user={currentUser} posts={posts} setPosts={setPosts} crews={crews} donations={donations} reviews={reviews} setPage={setCurrentPage} onUpdateStats={handleUpdateUser} updateNotificationCount={updateNotificationCount} profileSrc={profileSrc} />}
        {currentPage==='explore' && <ExplorePage user={currentUser} setPage={setCurrentPage} onCreateCrew={handleCreateCrew} />}
        {currentPage==='post' && <PostPage user={currentUser} onPost={handlePost} setPage={setCurrentPage} />}

        {/* ✅ CHANGED: Pass `onViewChange` callback — hides BottomNav when chat is open */}
        {currentPage==='crews' && (
          <CrewsPage
            user={currentUser}
            crews={crews}
            setPage={setCurrentPage}
            updateNotificationCount={updateNotificationCount}
            onViewChange={(v) => setCrewChatActive(v === 'chat')}
          />
        )}

        {currentPage==='reviews' && <ReviewsPage user={currentUser} setPage={setCurrentPage} updateNotificationCount={updateNotificationCount} />}
        {currentPage==='profile' && <ProfilePage user={currentUser} posts={posts} setPage={setCurrentPage} onLogout={() => { setIsLoggedIn(false); setCurrentUser(null); setProfileSrc(null); localStorage.removeItem('currentUser'); setCurrentPage('home'); }} onUpdateUser={handleUpdateUser} profileSrc={profileSrc} setProfileSrc={setProfileSrc} />}
        {currentPage==='notifications' && <NotificationsPage user={currentUser} onClose={() => { setCurrentPage('home'); updateNotificationCount(); }} />}

        {/* ✅ CHANGED: BottomNav hides when post page OR crew chat is active */}
        <BottomNav
          active={currentPage}
          setPage={setCurrentPage}
          unreadCount={unreadMessages}
          show={showBottomNav && !crewChatActive}
        />
      </div>
    </div>
  );
}