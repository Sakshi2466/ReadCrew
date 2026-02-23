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
  CheckCheck, BookMarked, PlusCircle, MapPin, Navigation, Map
} from 'lucide-react';

import { otpAPI } from './services/api';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://versal-book-app.onrender.com';

// ========================================
// DYNAMIC BOOK COVER
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
    } catch { /* fall through */ }

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
          {notificationCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{notificationCount}</span>}
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
const NotificationsPage = ({ user, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    const n = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
    setNotifications(n);
  }, []);
  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
  };
  const icons = { 
    like: <Heart className="w-4 h-4 text-red-500" />, 
    comment: <MessageCircle className="w-4 h-4 text-blue-500" />, 
    message: <MessageSquare className="w-4 h-4 text-green-500" />, 
    invite: <UserPlus className="w-4 h-4 text-purple-500" />,
    share: <Share2 className="w-4 h-4 text-orange-500" />
  };
  const bgColors = { 
    like: 'bg-red-100', 
    comment: 'bg-blue-100', 
    message: 'bg-green-100', 
    invite: 'bg-purple-100',
    share: 'bg-orange-100'
  };
  return (
    <div className="fixed inset-0 bg-white z-50 max-w-md mx-auto">
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

// ─── SHARE MODAL ────────────────────────────────────────────────────────
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
    <div className="fixed inset-0 bg-black/50 z-[65] flex items-end justify-center max-w-md mx-auto">
      <div className="bg-white rounded-t-2xl w-full p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Share Post</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
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
  );
};

// ─── POST OPTIONS MENU ─────────────────────────────────────────────────
const PostOptionsMenu = ({ post, currentUser, onClose, onSave, onFollow, onShare, isSaved, isFollowing }) => {
  const menuRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const isOwnPost = post.userEmail === currentUser.email;

  return (
    <div ref={menuRef} className="absolute right-4 top-12 bg-white rounded-xl shadow-xl border border-gray-200 py-1 w-48 z-50">
      {!isOwnPost && (
        <>
          <button 
            onClick={() => { onFollow(); onClose(); }}
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-gray-500" />
            <span>{isFollowing ? 'Unfollow' : 'Follow'} User</span>
          </button>
          <div className="border-t border-gray-100 my-1"></div>
        </>
      )}
      <button 
        onClick={() => { onSave(); onClose(); }}
        className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
      >
        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-orange-500 text-orange-500' : 'text-gray-500'}`} />
        <span>{isSaved ? 'Unsave Post' : 'Save Post'}</span>
      </button>
      <button 
        onClick={() => { onShare(); onClose(); }}
        className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
      >
        <Share2 className="w-4 h-4 text-gray-500" />
        <span>Share Post</span>
      </button>
      {!isOwnPost && (
        <>
          <div className="border-t border-gray-100 my-1"></div>
          <button className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
            <Flag className="w-4 h-4" />
            <span>Report Post</span>
          </button>
        </>
      )}
    </div>
  );
};

// ─── INLINE POST CARD with embedded comments ──────────────────────────
const InlinePostCard = ({ post, user, profileSrc, updateNotificationCount, onShare, onUpdatePosts }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likedComments, setLikedComments] = useState(new Set());
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`post_${post.id}_comments`) || '[]');
    setComments(saved);
    const liked = JSON.parse(localStorage.getItem(`user_${user.id}_likedComments`) || '[]');
    setLikedComments(new Set(liked));
    const likedPosts = JSON.parse(localStorage.getItem(`user_${user.email}_likedPosts`) || '[]');
    setIsLiked(likedPosts.includes(post.id));
    
    // Check if post is saved
    const savedPosts = JSON.parse(localStorage.getItem(`user_${user.email}_savedPosts`) || '[]');
    setIsSaved(savedPosts.some(p => p.id === post.id));
    
    // Check if following the user
    const following = JSON.parse(localStorage.getItem(`user_${user.email}_following`) || '[]');
    setIsFollowing(following.includes(post.userEmail));
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

  const handleLikePost = () => {
    if (isLiked) return;
    setIsLiked(true);
    setLikeCount(p => p + 1);
    const likedPosts = JSON.parse(localStorage.getItem(`user_${user.email}_likedPosts`) || '[]');
    likedPosts.push(post.id);
    localStorage.setItem(`user_${user.email}_likedPosts`, JSON.stringify(likedPosts));
    
    // Update post likes in storage
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const updatedPosts = allPosts.map(p => p.id === post.id ? { ...p, likes: (p.likes || 0) + 1 } : p);
    localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
    if (onUpdatePosts) onUpdatePosts(updatedPosts);
    
    if (post.userEmail !== user.email) {
      const notif = { id: Date.now(), type: 'like', fromUser: user.name, message: `${user.name} liked your post`, timestamp: new Date().toISOString(), read: false };
      const notifs = JSON.parse(localStorage.getItem(`user_${post.userEmail}_notifications`) || '[]');
      notifs.unshift(notif);
      localStorage.setItem(`user_${post.userEmail}_notifications`, JSON.stringify(notifs));
      updateNotificationCount?.();
    }
  };

  const handleSavePost = () => {
    const savedPosts = JSON.parse(localStorage.getItem(`user_${user.email}_savedPosts`) || '[]');
    if (isSaved) {
      const updated = savedPosts.filter(p => p.id !== post.id);
      localStorage.setItem(`user_${user.email}_savedPosts`, JSON.stringify(updated));
    } else {
      const postToSave = { ...post, savedAt: new Date().toISOString() };
      localStorage.setItem(`user_${user.email}_savedPosts`, JSON.stringify([postToSave, ...savedPosts]));
    }
    setIsSaved(!isSaved);
  };

  const handleFollowUser = () => {
    const following = JSON.parse(localStorage.getItem(`user_${user.email}_following`) || '[]');
    if (isFollowing) {
      const updated = following.filter(email => email !== post.userEmail);
      localStorage.setItem(`user_${user.email}_following`, JSON.stringify(updated));
    } else {
      localStorage.setItem(`user_${user.email}_following`, JSON.stringify([...following, post.userEmail]));
    }
    setIsFollowing(!isFollowing);
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: Date.now(), postId: post.id, userId: user.id, userName: user.name,
      userEmail: user.email, userInitials: user.name.slice(0, 2).toUpperCase(),
      content: newComment.trim(), timestamp: new Date().toISOString(),
      parentId: replyTo?.id || null, likes: 0,
      isAuthor: user.email === post.userEmail
    };
    const updated = [...comments, comment];
    localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(updated));
    setComments(updated);
    setNewComment('');
    setReplyTo(null);
    
    // Update comment count in post
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const updatedPosts = allPosts.map(p => p.id === post.id ? { ...p, comments: (p.comments || 0) + 1 } : p);
    localStorage.setItem('allPosts', JSON.stringify(updatedPosts));
    
    if (post.userEmail !== user.email) {
      const notif = { id: Date.now(), type: 'comment', fromUser: user.name, message: `${user.name} commented: "${newComment.substring(0, 40)}"`, timestamp: new Date().toISOString(), read: false };
      const notifs = JSON.parse(localStorage.getItem(`user_${post.userEmail}_notifications`) || '[]');
      notifs.unshift(notif);
      localStorage.setItem(`user_${post.userEmail}_notifications`, JSON.stringify(notifs));
      updateNotificationCount?.();
    }
  };

  const handleShare = () => {
    onShare(post);
    
    // Create share notification for post author
    if (post.userEmail !== user.email) {
      const notif = { id: Date.now(), type: 'share', fromUser: user.name, message: `${user.name} shared your post`, timestamp: new Date().toISOString(), read: false };
      const notifs = JSON.parse(localStorage.getItem(`user_${post.userEmail}_notifications`) || '[]');
      notifs.unshift(notif);
      localStorage.setItem(`user_${post.userEmail}_notifications`, JSON.stringify(notifs));
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
    const isCommentAuthor = comment.userEmail === post.userEmail;

    return (
      <div className={`flex gap-3 ${isReply ? 'mt-3' : ''}`}>
        <div className="flex flex-col items-center flex-shrink-0" style={{ width: 36 }}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
            {comment.userInitials}
          </div>
          {(replies.length > 0 && (showReplies[comment.id] || replies.length <= 2)) && (
            <div className="w-0.5 flex-1 bg-orange-200 mt-1 rounded-full min-h-[20px]" />
          )}
        </div>

        <div className="flex-1 min-w-0 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{comment.userName}</span>
            {isCommentAuthor && (
              <span className="text-[10px] px-2 py-0.5 bg-orange-500 text-white rounded-full font-semibold leading-none">Author</span>
            )}
            <span className="text-xs text-gray-400 ml-auto">{formatTimeAgo(comment.timestamp)}</span>
          </div>

          <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{comment.content}</p>

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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
      {showOptions && (
        <PostOptionsMenu
          post={post}
          currentUser={user}
          onClose={() => setShowOptions(false)}
          onSave={handleSavePost}
          onFollow={handleFollowUser}
          onShare={handleShare}
          isSaved={isSaved}
          isFollowing={isFollowing}
        />
      )}
      
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm shadow">
              {post.userName?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white">
              <Check className="w-2 h-2 text-white" strokeWidth={3} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-900 text-sm">{post.userName || 'Anonymous'}</span>
              {isPostAuthor && (
                <span className="text-[10px] px-2 py-0.5 bg-orange-500 text-white rounded-full font-bold">Admin</span>
              )}
              {isFollowing && !isPostAuthor && (
                <span className="text-[10px] px-2 py-0.5 bg-blue-500 text-white rounded-full font-bold">Following</span>
              )}
              <span className="text-xs text-gray-400 ml-auto">{formatTimeAgo(post.createdAt || Date.now())}</span>
            </div>
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
        <p className="text-gray-800 text-base leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
          {post.story || post.content}
        </p>
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
          <span>{post.comments || comments.length}</span>
        </button>

        <button
          onClick={handleSavePost}
          className={`flex items-center gap-1.5 text-sm font-semibold transition ${isSaved ? 'text-orange-500' : 'text-gray-500 hover:text-orange-400'}`}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-orange-500' : ''}`} />
          <span>Save</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-orange-500 transition ml-auto"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/60">
        {replyTo && (
          <div className="flex items-center gap-2 mb-2 pl-2 border-l-2 border-orange-400">
            <p className="text-xs text-orange-600 font-medium flex-1">Replying to <span className="font-bold">{replyTo.userName}</span></p>
            <button onClick={() => setReplyTo(null)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
          </div>
        )}
        <div className="flex items-center gap-2.5">
          {profileSrc ? (
            <img src={profileSrc} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.slice(0, 2).toUpperCase()}
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
              placeholder="Write a comment..."
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
  const [readingGoal, setReadingGoal] = useState({ yearly: 20, monthly: 5 });

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const validateName = (n) => n && n.trim().length >= 2;

  const handleSendOTP = async () => {
    if (!validateName(name) || !validateEmail(email)) { alert('Please fill all fields correctly'); return; }
    setLoading(true);
    try {
      const result = await otpAPI.sendOTP({ name, email });
      if (result.success) { setShowOTP(true); alert('OTP sent to your email!'); }
      else alert(result.message || 'Failed to send OTP');
    } catch {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('devOTP', otp);
      setShowOTP(true);
      alert(`Dev OTP: ${otp}`);
    } finally { setLoading(false); }
  };

  const createUser = (extraData = {}) => {
    const userData = {
      id: Date.now().toString(), name, email, password,
      readingGoal, isVerified: true, createdAt: new Date().toISOString(),
      stats: { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 },
      joinedCrews: [], likedPosts: [], likedReviews: [], booksRead: [], 
      followers: [], following: [], savedPosts: [], ...extraData
    };
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(userData));
    ['stats','joinedCrews','notifications','likedPosts','likedReviews','likedMessages','followers','following','savedPosts'].forEach(key => {
      localStorage.setItem(`user_${userData.email}_${key}`, JSON.stringify(userData[key] || (key === 'stats' ? userData.stats : [])));
    });
    return userData;
  };

  const handleVerifyOTP = async () => {
    if (otpInput.length !== 6) { alert('Enter 6-digit OTP'); return; }
    setLoading(true);
    try {
      const result = await otpAPI.verifyOTP({ email, otp: otpInput });
      if (result.success) { onLogin(createUser()); setShowOTP(false); }
      else alert(`❌ ${result.message}`);
    } catch {
      const devOTP = localStorage.getItem('devOTP');
      if (devOTP && otpInput === devOTP) { onLogin(createUser()); setShowOTP(false); localStorage.removeItem('devOTP'); }
      else alert('❌ Invalid OTP');
    } finally { setLoading(false); }
  };

  if (showOTP) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-7 border border-gray-200 mt-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Verify OTP</h2>
        <p className="text-center text-gray-500 text-sm mb-6">Enter the code sent to {email}</p>
        <input type="text" value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g,'').slice(0,6))}
          className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none text-center text-3xl tracking-widest mb-6"
          placeholder="000000" maxLength="6" autoFocus />
        <button onClick={handleVerifyOTP} disabled={loading || otpInput.length !== 6}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-50">
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </button>
        <button onClick={() => setShowOTP(false)} className="w-full mt-4 text-gray-500 flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
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
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">{isLogin ? 'Welcome Back!' : 'Join the Crew'}</h2>
          <div className="space-y-4">
            {!isLogin && (
              <>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <User className="w-5 h-5 text-gray-400" />
                  <input value={name} onChange={e => setName(e.target.value)} className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm" placeholder="Full Name" />
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-orange-500" /> Reading Goals (Optional)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Yearly</label>
                      <input type="number" value={readingGoal.yearly} onChange={e => setReadingGoal({...readingGoal, yearly: parseInt(e.target.value)||0})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm" min="0" max="100" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Monthly</label>
                      <input type="number" value={readingGoal.monthly} onChange={e => setReadingGoal({...readingGoal, monthly: parseInt(e.target.value)||0})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm" min="0" max="20" />
                    </div>
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
              const found = users.find(u => u.email === email);
              if (found && found.password === password) { localStorage.setItem('currentUser', JSON.stringify(found)); onLogin(found); }
              else alert('Invalid email or password');
            } else { handleSendOTP(); }
          }} className="w-full mt-5 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold">
            {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Create Account'}
          </button>
          <p className="text-center text-sm text-gray-500 mt-5">
            {isLogin ? "New? " : "Have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-orange-500 font-semibold">{isLogin ? 'Sign Up' : 'Log In'}</button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── RICH BOOK DATABASE (offline fallback) ─────────────────────────────────
const TRENDING_DB = [
  [
    { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8, readers: 25000, trendReason: '#1 on bestseller lists globally' },
    { title: 'The Psychology of Money', author: 'Morgan Housel', genre: 'Finance', rating: 4.7, readers: 18000, trendReason: 'Still topping business charts 3 years on' },
    { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.8, readers: 22000, trendReason: 'Beloved by readers worldwide' },
    { title: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', rating: 4.6, readers: 35000, trendReason: 'Fastest-selling fantasy debut ever' },
    { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', rating: 4.6, readers: 19000, trendReason: 'Reese\'s Book Club favorite' },
  ],
  [
    { title: 'Tomorrow and Tomorrow and Tomorrow', author: 'Gabrielle Zevin', genre: 'Fiction', rating: 4.6, readers: 16000, trendReason: 'Pulitzer Prize finalist' },
    { title: 'Demon Copperhead', author: 'Barbara Kingsolver', genre: 'Literary Fiction', rating: 4.6, readers: 14000, trendReason: 'Pulitzer Prize winner 2023' },
    { title: 'Happy Place', author: 'Emily Henry', genre: 'Romance', rating: 4.5, readers: 21000, trendReason: '#1 New York Times bestseller' },
    { title: 'Hell Bent', author: 'Leigh Bardugo', genre: 'Fantasy', rating: 4.5, readers: 17000, trendReason: 'Hugely anticipated sequel' },
    { title: 'Lessons in Chemistry', author: 'Bonnie Garmus', genre: 'Fiction', rating: 4.7, readers: 23000, trendReason: 'Now a hit Apple TV+ series' },
  ],
  [
    { title: 'It Ends with Us', author: 'Colleen Hoover', genre: 'Romance', rating: 4.6, readers: 33000, trendReason: 'Now a major motion picture' },
    { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', rating: 4.7, readers: 30000, trendReason: 'Over 25 million copies sold globally' },
    { title: 'The Silent Patient', author: 'Alex Michaelides', genre: 'Thriller', rating: 4.5, readers: 27000, trendReason: 'Best-selling debut thriller' },
    { title: 'A Court of Thorns and Roses', author: 'Sarah J. Maas', genre: 'Fantasy', rating: 4.6, readers: 29000, trendReason: 'Series phenomenon continues' },
    { title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', genre: 'Fiction', rating: 4.7, readers: 26000, trendReason: 'Still going viral on BookTok' },
  ],
  [
    { title: 'Verity', author: 'Colleen Hoover', genre: 'Thriller', rating: 4.6, readers: 24000, trendReason: 'Most-discussed BookTok thriller' },
    { title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', rating: 4.7, readers: 27000, trendReason: 'Perennial bestseller, 65M+ copies sold' },
    { title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi', rating: 4.8, readers: 31000, trendReason: 'Part 3 film announced' },
    { title: 'Beach Read', author: 'Emily Henry', genre: 'Romance', rating: 4.6, readers: 20000, trendReason: 'Perfect summer read' },
    { title: 'All the Light We Cannot See', author: 'Anthony Doerr', genre: 'Historical Fiction', rating: 4.7, readers: 22000, trendReason: 'Netflix series brought new readers' },
  ],
];

const BOOK_DB = {
  thriller: [
    { title: 'Gone Girl', author: 'Gillian Flynn', genre: 'Thriller', description: 'A woman vanishes on her anniversary. Her husband becomes the prime suspect.', reason: 'Twisty, addictive, impossible to put down', rating: 4.6, pages: 422, year: 2012 },
    { title: 'The Silent Patient', author: 'Alex Michaelides', genre: 'Thriller', description: 'A famous painter shoots her husband and then never speaks again.', reason: 'Jaw-dropping twist that will blindside you', rating: 4.5, pages: 336, year: 2019 },
    { title: 'Behind Closed Doors', author: 'B.A. Paris', genre: 'Thriller', description: 'The perfect marriage hides a terrifying secret.', reason: 'Chilling psychological thriller — addictive and disturbing', rating: 4.4, pages: 294, year: 2016 },
    { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', genre: 'Thriller', description: 'A journalist and hacker investigate a decades-old disappearance in Sweden.', reason: 'Gripping mystery with one of fiction\'s most iconic characters', rating: 4.7, pages: 672, year: 2005 },
    { title: 'Verity', author: 'Colleen Hoover', genre: 'Thriller', description: 'A writer discovers a disturbing manuscript in a bestselling author\'s home.', reason: 'You will NOT see the ending coming — guaranteed', rating: 4.6, pages: 336, year: 2018 },
  ],
  fantasy: [
    { title: 'The Name of the Wind', author: 'Patrick Rothfuss', genre: 'Fantasy', description: 'The legendary Kvothe tells his own extraordinary story of magic and tragedy.', reason: 'Stunning prose and world-building unlike anything else', rating: 4.7, pages: 662, year: 2007 },
    { title: 'Mistborn: The Final Empire', author: 'Brandon Sanderson', genre: 'Fantasy', description: 'A crew of thieves plots to rob an immortal god-emperor.', reason: 'Inventive magic system with a deeply satisfying plot', rating: 4.7, pages: 541, year: 2006 },
    { title: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', description: 'A war college for dragon riders filled with forbidden romance and danger.', reason: 'Fast-paced, romantic, and absolutely addictive', rating: 4.6, pages: 528, year: 2023 },
    { title: 'The Way of Kings', author: 'Brandon Sanderson', genre: 'Fantasy', description: 'An epic saga set across a storm-swept world of ancient knights.', reason: 'Massive scope, deeply human characters', rating: 4.8, pages: 1007, year: 2010 },
    { title: 'The Priory of the Orange Tree', author: 'Samantha Shannon', genre: 'Fantasy', description: 'A feminist epic with queens, dragons, and high-stakes political intrigue.', reason: 'Rich, immersive and beautifully diverse', rating: 4.5, pages: 848, year: 2019 },
  ],
  romance: [
    { title: 'Beach Read', author: 'Emily Henry', genre: 'Romance', description: 'Two rival authors swap genres and accidentally fall in love.', reason: 'Witty, heartfelt and genuinely funny', rating: 4.6, pages: 361, year: 2020 },
    { title: 'The Hating Game', author: 'Sally Thorne', genre: 'Romance', description: 'Two office rivals compete for a promotion — and something more.', reason: 'Perfect enemies-to-lovers tension with a satisfying payoff', rating: 4.5, pages: 384, year: 2016 },
    { title: 'People We Meet on Vacation', author: 'Emily Henry', genre: 'Romance', description: 'Two best friends, one annual vacation, ten years of unresolved feelings.', reason: 'Nostalgic, swoony and deeply satisfying', rating: 4.6, pages: 369, year: 2021 },
    { title: 'It Ends with Us', author: 'Colleen Hoover', genre: 'Romance', description: 'A powerful story about love, resilience, and the hardest choices.', reason: 'Emotional, important and beautifully written', rating: 4.6, pages: 368, year: 2016 },
    { title: 'The Kiss Quotient', author: 'Helen Hoang', genre: 'Romance', description: 'An economist with autism hires a man to teach her about relationships.', reason: 'Fresh, funny and genuinely touching', rating: 4.5, pages: 320, year: 2018 },
  ],
  scifi: [
    { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', description: 'A lone astronaut wakes up with amnesia and must save Earth from extinction.', reason: 'Most fun you\'ll have reading science fiction in your life', rating: 4.8, pages: 476, year: 2021 },
    { title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi', description: 'A young nobleman navigates politics, ecology and religion on a desert planet.', reason: 'The foundation of all modern science fiction', rating: 4.8, pages: 688, year: 1965 },
    { title: 'The Martian', author: 'Andy Weir', genre: 'Sci-Fi', description: 'An astronaut is stranded on Mars and must science his way home.', reason: 'Funny, clever and impossible to put down', rating: 4.8, pages: 369, year: 2011 },
    { title: 'Ender\'s Game', author: 'Orson Scott Card', genre: 'Sci-Fi', description: 'A child genius trains for a war against an alien species.', reason: 'Timeless story about intelligence, strategy and humanity', rating: 4.7, pages: 324, year: 1985 },
    { title: 'The Long Way to a Small Angry Planet', author: 'Becky Chambers', genre: 'Sci-Fi', description: 'A crew travels the galaxy learning about each other and the universe.', reason: 'Cozy, diverse, and deeply optimistic sci-fi', rating: 4.6, pages: 404, year: 2014 },
  ],
  selfhelp: [
    { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', description: 'How tiny changes in behavior lead to remarkable results over time.', reason: 'The most practical habit book ever written — genuinely changes behavior', rating: 4.8, pages: 320, year: 2018 },
    { title: 'The Psychology of Money', author: 'Morgan Housel', genre: 'Finance', description: 'Timeless lessons on wealth, greed, and happiness from 19 short stories.', reason: 'Will change how you think about money forever', rating: 4.7, pages: 256, year: 2020 },
    { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', genre: 'Psychology', description: 'How two systems of thinking shape our judgments and decisions.', reason: 'Mind-bending insights into why humans make the choices we do', rating: 4.6, pages: 499, year: 2011 },
    { title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson', genre: 'Self-Help', description: 'A counterintuitive approach to living a good, meaningful life.', reason: 'Refreshingly honest and more useful than most self-help', rating: 4.5, pages: 224, year: 2016 },
    { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', description: 'A brief history of humankind from Stone Age to the 21st century.', reason: 'Will fundamentally change how you see the entire human story', rating: 4.7, pages: 443, year: 2011 },
  ],
  mystery: [
    { title: 'And Then There Were None', author: 'Agatha Christie', genre: 'Mystery', description: 'Ten strangers are lured to an island and begin dying one by one.', reason: 'The bestselling mystery novel of all time — still perfect', rating: 4.7, pages: 264, year: 1939 },
    { title: 'The Thursday Murder Club', author: 'Richard Osman', genre: 'Mystery', description: 'Four retirees in a care home solve cold cases — then a real murder occurs.', reason: 'Charming, funny, and genuinely clever', rating: 4.5, pages: 382, year: 2020 },
    { title: 'Big Little Lies', author: 'Liane Moriarty', genre: 'Mystery', description: 'Three women\'s lives unravel around a murder at a school fundraiser.', reason: 'Wickedly funny with an emotionally devastating twist', rating: 4.5, pages: 460, year: 2014 },
    { title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', genre: 'Mystery', description: 'A reclusive Hollywood legend reveals her scandalous life story.', reason: 'Glamorous, emotional, and utterly unforgettable', rating: 4.7, pages: 400, year: 2017 },
    { title: 'In the Woods', author: 'Tana French', genre: 'Mystery', description: 'A detective investigates a murder near where he survived a childhood trauma.', reason: 'Atmospheric, literary and deeply unsettling', rating: 4.4, pages: 429, year: 2007 },
  ],
  literary: [
    { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', description: 'Between life and death lies a library containing every life you could have lived.', reason: 'Beautiful, philosophical and profoundly hopeful', rating: 4.6, pages: 288, year: 2020 },
    { title: 'Normal People', author: 'Sally Rooney', genre: 'Literary Fiction', description: 'Two people orbit each other through school, college and into adulthood.', reason: 'Painfully accurate about modern relationships and class', rating: 4.4, pages: 273, year: 2018 },
    { title: 'Tomorrow and Tomorrow and Tomorrow', author: 'Gabrielle Zevin', genre: 'Fiction', description: 'Two friends build video games and a complicated relationship over 30 years.', reason: 'A love story about creativity, not just romance', rating: 4.6, pages: 416, year: 2022 },
    { title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', description: 'A shepherd boy journeys across the desert in pursuit of his personal legend.', reason: 'Short, profound and endlessly re-readable', rating: 4.7, pages: 197, year: 1988 },
    { title: 'A Gentleman in Moscow', author: 'Amor Towles', genre: 'Literary Fiction', description: 'A count is sentenced to house arrest in a luxury Moscow hotel for decades.', reason: 'Witty, warm and deeply satisfying — a perfect novel', rating: 4.7, pages: 480, year: 2016 },
  ],
  historical: [
    { title: 'All the Light We Cannot See', author: 'Anthony Doerr', genre: 'Historical Fiction', description: 'A blind French girl and a German boy\'s paths collide in WWII.', reason: 'Exquisitely written — Pulitzer Prize winner for good reason', rating: 4.7, pages: 531, year: 2014 },
    { title: 'The Book Thief', author: 'Markus Zusak', genre: 'Historical Fiction', description: 'A girl in Nazi Germany steals books — narrated by Death itself.', reason: 'Utterly unique voice and an unforgettable story', rating: 4.8, pages: 584, year: 2005 },
    { title: 'The Nightingale', author: 'Kristin Hannah', genre: 'Historical Fiction', description: 'Two French sisters resist Nazi occupation in very different ways.', reason: 'Devastating and triumphant — you will absolutely cry', rating: 4.8, pages: 440, year: 2015 },
    { title: 'Pillars of the Earth', author: 'Ken Follett', genre: 'Historical Fiction', description: 'The epic story of building a cathedral in medieval England across generations.', reason: 'Massive scope, endlessly fascinating historical detail', rating: 4.7, pages: 973, year: 1989 },
    { title: 'Wolf Hall', author: 'Hilary Mantel', genre: 'Historical Fiction', description: 'Thomas Cromwell navigates the treacherous court of Henry VIII.', reason: 'Immersive, intelligent historical fiction at its absolute finest', rating: 4.5, pages: 650, year: 2009 },
  ],
};

const BOOK_DETAILS_DB = {
  'Atomic Habits': { description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. James Clear draws on the most proven ideas from biology, psychology, and neuroscience to create an easy-to-understand guide for making good habits inevitable and bad habits impossible. You will learn how to make time for new habits, overcome a lack of motivation, and design your environment to make success easier.', genre: 'Self-Help', themes: ['Habit Formation', 'Behavioral Psychology', 'Productivity', 'Identity'], pages: 320, published: '2018' },
  'The Psychology of Money': { description: 'Timeless lessons on wealth, greed, and happiness. Doing well with money isn\'t necessarily about what you know. It\'s about how you behave. And behavior is hard to teach, even to really smart people. Morgan Housel shares 19 short stories exploring the strange ways people think about money and teaches you how to make better sense of one of life\'s most important topics.', genre: 'Finance', themes: ['Personal Finance', 'Behavioral Economics', 'Wealth', 'Decision Making'], pages: 256, published: '2020' },
  'Project Hail Mary': { description: 'A lone astronaut must save Earth from disaster. Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the Earth itself will perish. Except that right now, he doesn\'t know that. He can\'t even remember his own name, let alone the nature of his assignment or how to complete it.', genre: 'Science Fiction', themes: ['Space Exploration', 'Survival', 'Friendship', 'Problem Solving', 'First Contact'], pages: 476, published: '2021' },
  'The Silent Patient': { description: 'Alicia Berenson\'s life is seemingly perfect. A famous painter married to an in-demand fashion photographer, she lives in a grand house with big windows overlooking a park in one of London\'s most desirable areas. One evening her husband Gabriel returns home late from a fashion shoot, and Alicia shoots him five times in the face, and then never speaks another word.', genre: 'Psychological Thriller', themes: ['Psychology', 'Obsession', 'Trauma', 'Truth', 'Art'], pages: 336, published: '2019' },
  'Fourth Wing': { description: 'Enter the brutal and elite world of a war college for dragon riders. Twenty-year-old Violet Sorrengail was supposed to enter the Scribe Quadrant, but her mother—the commanding general—orders her into the riders quadrant instead. If the dragons don\'t kill her, the other candidates might.', genre: 'Fantasy', themes: ['Dragons', 'War', 'Romance', 'Magic', 'Coming of Age'], pages: 528, published: '2023' },
  'The Midnight Library': { description: 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. To see how things would be if you had made other choices. Would you have done anything different, if you had the chance to undo your regrets?', genre: 'Fiction', themes: ['Regret', 'Second Chances', 'Mental Health', 'Philosophy', 'Hope'], pages: 288, published: '2020' },
  'Sapiens': { description: 'A Brief History of Humankind. 100,000 years ago, at least six human species inhabited the earth. Today there is just one—Homo sapiens. How did our species succeed in the battle for dominance? Yuval Noah Harari tells the story of our civilization, from the first humans to walk the earth to the radical breakthroughs of the Cognitive, Agricultural, and Scientific Revolutions.', genre: 'History', themes: ['Human Evolution', 'Civilization', 'Culture', 'Biology', 'Future'], pages: 443, published: '2011' },
  'Dune': { description: 'Set in the distant future amidst a feudal interstellar society in which various noble houses control planetary fiefs, Dune tells the story of young Paul Atreides, whose family accepts the stewardship of the planet Arrakis. The story explores politics, religion, ecology, technology, and human emotion as the forces of the empire confront each other.', genre: 'Science Fiction', themes: ['Politics', 'Religion', 'Ecology', 'Destiny', 'Power'], pages: 688, published: '1965' },
  'The Alchemist': { description: 'A Novel. Paulo Coelho\'s masterpiece tells the magical story of Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure. His quest will lead him to riches far different—and far more satisfying—than he ever imagined. Santiago\'s journey teaches us about the essential wisdom of listening to our hearts and, above all, following our dreams.', genre: 'Inspirational Fiction', themes: ['Dreams', 'Destiny', 'Self-Discovery', 'Spirituality', 'Adventure'], pages: 197, published: '1988' },
  'It Ends with Us': { description: 'Lily hasn\'t always had it easy, but that\'s never stopped her from working hard for the life she wants. She\'s come a long way from the small town in Maine where she grew up—from years of hardship—to a fresh start in Boston. When Lily meets Atlas Corrigan, a man who in many ways is the "one that got away," she can no longer deny what her heart is telling her.', genre: 'Romance', themes: ['Domestic Violence', 'Love', 'Resilience', 'Healing', 'Choices'], pages: 368, published: '2016' },
};

// Client-side AI response generator
const generateClientResponse = (userText, exchangeCount, previousBooks = []) => {
  const text = userText.toLowerCase();
  const detectCategory = () => {
    if (/thrille|suspens|crime|murder|dark|creepy|horror|detective/i.test(text)) return 'thriller';
    if (/fantasy|magic|dragon|wizard|sword|epic|dnd|tolkien|harry potter/i.test(text)) return 'fantasy';
    if (/romance|love|relat|couple|swoony|kiss|dating|enemies.to.lovers/i.test(text)) return 'romance';
    if (/sci.?fi|space|future|robot|alien|tech|science|mars|nasa/i.test(text)) return 'scifi';
    if (/self.?help|habit|product|motivat|improve|success|mindset|business|finance|money/i.test(text)) return 'selfhelp';
    if (/mystery|whodun|cozy|clue|puzzle|detective|agatha/i.test(text)) return 'mystery';
    if (/histor|period|war|ancient|medieval|century|wwii|world war/i.test(text)) return 'historical';
    if (/literary|fiction|prose|character|emotion|feel|sad|beautiful|meaning/i.test(text)) return 'literary';
    if (/alchemist|paulo|coelho/i.test(text)) return 'literary';
    if (/atomic habits|james clear|psychology of money|morgan housel|sapiens/i.test(text)) return 'selfhelp';
    if (/dune|martian|project hail|andy weir|ender/i.test(text)) return 'scifi';
    if (/fourth wing|mistborn|sanderson|name of the wind/i.test(text)) return 'fantasy';
    if (/gone girl|silent patient|girl with dragon/i.test(text)) return 'thriller';
    return null;
  };
  const category = detectCategory();
  if (exchangeCount === 1 && !category) {
    const qs = [
      "Great! To find the perfect book — are you in the mood for something fast-paced and plot-driven, or slower and more character-focused? 📖",
      "Love it! Quick question: thriller/mystery, fantasy/sci-fi, romance, or literary fiction — which sounds best right now? ✨",
      "Happy to help! What's the last book you read and loved? That'll help me nail your next pick 😊",
    ];
    return { reply: qs[Math.floor(Math.random() * qs.length)], books: [] };
  }
  if (exchangeCount === 1 && category) {
    const teasers = {
      thriller: "Thriller fan! Are you into psychological mind-games (Gone Girl style) or fast-paced action-packed stories?",
      fantasy: "A fantasy reader! Do you prefer epic multi-book series or satisfying standalones?",
      romance: "Romance! ❤️ Enemies-to-lovers, second chance, or just pure swoony meet-cutes?",
      scifi: "Sci-fi! Hard science (The Martian) or more character-driven space opera?",
      selfhelp: "Looking to grow — love it! Finance/productivity, or more philosophy and mindset?",
      mystery: "Mystery lover! Cozy and charming, or dark psychological with teeth?",
      literary: "Literary fiction 📚 — the good stuff. Do you want uplifting or emotionally devastating (in the best way)?",
      historical: "Historical fiction! Any era you're drawn to, or just a great story regardless of period?",
    };
    return { reply: teasers[category] || "Tell me a bit more — what kind of mood are you in right now?", books: [] };
  }
  const bookList = BOOK_DB[category] || BOOK_DB.literary;
  const prevTitles = new Set(previousBooks.map(b => b.title));
  const fresh = bookList.filter(b => !prevTitles.has(b.title));
  const recs = (fresh.length >= 3 ? fresh : bookList).slice(0, 5);
  const intros = {
    thriller: "Based on what you love, here are 5 pulse-pounding thrillers! 🔪",
    fantasy: "Here are 5 magical worlds waiting for you! ✨",
    romance: "5 romance reads that will give you all the feels ❤️",
    scifi: "Buckle up — 5 sci-fi journeys you won't forget 🚀",
    selfhelp: "5 books that will genuinely change how you think 💡",
    mystery: "5 mysteries that'll keep you guessing until the last page 🔍",
    literary: "5 beautifully written books that will stay with you for years 📚",
    historical: "5 historical novels that transport you completely 🏰",
    default: "Based on what you've told me, here are 5 perfect picks! 📚",
  };
  const intro = `${category ? intros[category] : intros.default}\n\nSay **'more'** for 5 different recommendations, or tell me more about your mood!`;
  return { reply: intro, books: recs };
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
  const [showShare, setShowShare] = useState(null);
  const [feedPage, setFeedPage] = useState(1);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const feedSentinelRef = useRef(null);
  const loadingFeedRef = useRef(false);
  
  const [userStats, setUserStats] = useState({
    booksRead: user?.stats?.booksRead || 0, 
    reviewsGiven: user?.stats?.reviewsGiven || 0,
    postsCreated: user?.stats?.postsCreated || 0, 
    crewsJoined: user?.joinedCrews?.length || 0
  });

  // Update stats whenever user changes
  useEffect(() => {
    const savedStats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    const joinedCrews = JSON.parse(localStorage.getItem(`user_${user.email}_joinedCrews`) || '[]');
    setUserStats({
      booksRead: savedStats.booksRead || 0,
      reviewsGiven: savedStats.reviewsGiven || 0,
      postsCreated: savedStats.postsCreated || 0,
      crewsJoined: joinedCrews.length || 0
    });
    
    if (user?.readingGoal?.yearly > 0) {
      setReadingProgress(Math.min((savedStats.booksRead || 0) / user.readingGoal.yearly * 100, 100));
    }
  }, [user]);

  useEffect(() => {
    loadTrendingBooks(1);
    loadFeedPosts(1, false);
  }, []);

  // IntersectionObserver for infinite feed scroll
  useEffect(() => {
    if (!feedSentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreFeed && !loadingFeedRef.current && !loadingFeed) {
          loadFeedPosts(feedPage + 1, true);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    observer.observe(feedSentinelRef.current);
    return () => observer.disconnect();
  }, [hasMoreFeed, feedPage, loadingFeed]);

  const getDayBatch = () => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return TRENDING_DB[dayOfYear % TRENDING_DB.length];
  };

  const loadTrendingBooks = async (page = 1, append = false) => {
    setLoadingTrending(true);
    const local = getDayBatch();
    
    try {
      const response = await fetch(`${API_URL}/api/books/trending?page=${page}`, { 
        signal: AbortSignal.timeout(8000) 
      });
      const data = await response.json();
      if (data.success && data.books?.length > 0) {
        setTrendingBooks(prev => append ? [...prev, ...data.books] : data.books);
        setHasMoreTrending(data.hasMore || false);
        setTrendingPage(page);
      } else {
        // Fallback to local data
        setTrendingBooks(prev => append ? [...prev, ...local] : local);
        setHasMoreTrending(false);
      }
    } catch {
      setTrendingBooks(prev => append ? [...prev, ...local] : local);
      setHasMoreTrending(false);
    } finally {
      setLoadingTrending(false);
      setLoadingMore(false);
    }
  };

  const loadFeedPosts = async (page = 1, append = false) => {
    if (loadingFeedRef.current) return;
    loadingFeedRef.current = true;
    setLoadingFeed(true);
    
    try {
      const res = await fetch(`${API_URL}/api/social/posts?page=${page}&limit=10`, { 
        signal: AbortSignal.timeout(8000) 
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.posts?.length > 0) {
          const localPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
          const allIds = new Set(data.posts.map(p => p.id));
          const localOnly = localPosts.filter(p => !allIds.has(p.id));
          
          let merged;
          if (append) {
            merged = [...feedPosts, ...data.posts];
          } else {
            merged = [...localOnly, ...data.posts];
          }
          merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          setFeedPosts(merged);
          setHasMoreFeed(data.hasMore || false);
          setFeedPage(page);
        } else {
          // Fallback to local
          const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
          const paginated = allPosts.slice((page - 1) * 10, page * 10);
          if (append) {
            setFeedPosts(prev => [...prev, ...paginated]);
          } else {
            setFeedPosts(paginated);
          }
          setHasMoreFeed(allPosts.length > page * 10);
          setFeedPage(page);
        }
      }
    } catch {
      // Fallback to local
      const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
      const paginated = allPosts.slice((page - 1) * 10, page * 10);
      if (append) {
        setFeedPosts(prev => [...prev, ...paginated]);
      } else {
        setFeedPosts(paginated);
      }
      setHasMoreFeed(allPosts.length > page * 10);
      setFeedPage(page);
    } finally {
      setLoadingFeed(false);
      loadingFeedRef.current = false;
    }
  };

  const handleUpdatePosts = (updatedPosts) => {
    setFeedPosts(updatedPosts.slice(0, 30));
  };

  const handleBookClick = async (book) => {
    setSelectedBook(book); 
    setShowBookDetails(true); 
    setLoadingBookDetails(true);
    
    const localDetails = BOOK_DETAILS_DB[book.title];
    if (localDetails) { 
      setBookDetails(localDetails); 
      setLoadingBookDetails(false); 
      return; 
    }
    
    try {
      const res = await axios.post(`${API_URL}/api/books/book-details`, 
        { bookName: book.title, author: book.author }, 
        { timeout: 7000 }
      );
      if (res.data.success && res.data.details?.description) {
        setBookDetails(res.data.details);
      } else {
        throw new Error();
      }
    } catch {
      setBookDetails({ 
        description: `"${book.title}" by ${book.author} is a critically acclaimed book that readers worldwide have loved. Explore its themes, characters, and impact by joining a reading crew to discuss with others!`, 
        genre: book.genre || 'General', 
        rating: book.rating, 
        pages: book.pages 
      });
    } finally { 
      setLoadingBookDetails(false); 
    }
  };

  const handleBooksTabClick = () => {
    setPage('profile');
    setTimeout(() => {
      const booksTab = document.querySelector('[data-tab="Books Read"]');
      if (booksTab) booksTab.click();
    }, 100);
  };

  const hasReadingGoal = user?.readingGoal?.yearly > 0 || user?.readingGoal?.monthly > 0;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <TopBar user={user} setPage={setPage} title="ReadCrew" profileSrc={profileSrc}
        onNotificationClick={() => setPage('notifications')}
        notificationCount={JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]').filter(n => !n.read).length} />

      {showBookDetails && selectedBook && (
        <div className="fixed inset-0 bg-black/50 z-[65] flex items-center justify-center p-4 max-w-md mx-auto">
          <div className="bg-white rounded-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between">
              <h3 className="font-bold">Book Details</h3>
              <button onClick={() => setShowBookDetails(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              {loadingBookDetails ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : bookDetails && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <DynamicBookCover title={selectedBook.title} author={selectedBook.author} size="lg" />
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-900">{selectedBook.title}</h2>
                      <p className="text-gray-500 text-sm">by {selectedBook.author}</p>
                      {bookDetails.genre && <span className="inline-block mt-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs">{bookDetails.genre}</span>}
                      {selectedBook.rating && <div className="flex items-center gap-1 mt-2"><StarRating rating={Math.round(selectedBook.rating)} size="sm" /><span className="text-sm font-semibold">{selectedBook.rating}</span></div>}
                    </div>
                  </div>
                  {bookDetails.description && <div className="bg-gray-50 rounded-xl p-4"><p className="text-gray-700 text-sm leading-relaxed">{bookDetails.description}</p></div>}
                  {bookDetails.themes?.length > 0 && <div className="flex flex-wrap gap-2">{bookDetails.themes.map((t,i) => <span key={i} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">{t}</span>)}</div>}
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => { setShowBookDetails(false); setPage('crews'); }} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium">Create Crew</button>
                    <button onClick={() => { navigator.clipboard.writeText(`"${selectedBook.title}" by ${selectedBook.author}`); alert('Copied!'); }} className="px-4 py-3 border border-gray-200 rounded-xl"><Share2 className="w-5 h-5" /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showShare && <ShareModal post={showShare} onClose={() => setShowShare(null)} />}

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

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Books', value: userStats.booksRead, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100', page: 'profile', tab: 'Books Read' },
            { label: 'Reviews', value: userStats.reviewsGiven, icon: Star, color: 'text-purple-600', bg: 'bg-purple-100', page: 'reviews' },
            { label: 'Posts', value: userStats.postsCreated, icon: Edit3, color: 'text-green-600', bg: 'bg-green-100', page: 'profile', tab: 'Posts' },
            { label: 'Crews', value: userStats.crewsJoined, icon: Users, color: 'text-orange-600', bg: 'bg-orange-100', page: 'crews' }
          ].map(({ label, value, icon: Icon, color, bg, page, tab }, idx) => (
            <div key={idx} className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md" 
                 onClick={() => { 
                   setPage(page); 
                   if (tab) {
                     setTimeout(() => {
                       const tabEl = document.querySelector(`[data-tab="${tab}"]`);
                       if (tabEl) tabEl.click();
                     }, 100);
                   }
                 }}>
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}><Icon className={`w-4 h-4 ${color}`} /></div>
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <button onClick={() => setPage('post')} className="w-full bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-center gap-3 hover:shadow-md">
          {profileSrc ? <img src={profileSrc} alt="p" className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">{user?.name?.slice(0,2).toUpperCase()}</div>}
          <span className="text-gray-400 text-sm flex-1 text-left">Share your reading journey...</span>
          <span className="text-xs text-orange-500 font-medium bg-orange-50 px-3 py-1 rounded-full">Post</span>
        </button>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-orange-500" />Community Feed</h2>
            <button onClick={() => setPage('reviews')} className="text-sm text-orange-500 font-semibold">View All</button>
          </div>
          <div className="space-y-4">
            {feedPosts.length === 0 && !loadingFeed ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No posts yet. Be the first to share!</p>
                <button onClick={() => setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Create Post</button>
              </div>
            ) : (
              <>
                {feedPosts.map((post, idx) => (
                  <InlinePostCard
                    key={post.id || idx}
                    post={post}
                    user={user}
                    profileSrc={profileSrc}
                    updateNotificationCount={updateNotificationCount}
                    onShare={(p) => setShowShare(p)}
                    onUpdatePosts={handleUpdatePosts}
                  />
                ))}
                
                {/* Infinite scroll sentinel */}
                <div ref={feedSentinelRef} className="py-2">
                  {loadingFeed && (
                    <div className="flex justify-center py-4">
                      <LoadingSpinner size="sm" />
                      <span className="ml-2 text-sm text-gray-500">Loading more posts...</span>
                    </div>
                  )}
                  {!hasMoreFeed && feedPosts.length > 0 && (
                    <p className="text-center text-xs text-gray-400 py-4">You've reached the end! 🎉</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-orange-500" />Trending Books</h2>
            <button onClick={() => setPage('explore')} className="text-sm text-orange-500 font-semibold">Explore All</button>
          </div>
          {loadingTrending ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : (
            <div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {trendingBooks.map((book, i) => (
                  <div key={i} className="shrink-0 w-28 cursor-pointer hover:scale-105 transition-transform" onClick={() => handleBookClick(book)}>
                    <DynamicBookCover title={book.title} author={book.author} size="md" className="mb-2" />
                    <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{book.title}</p>
                    <p className="text-xs text-gray-500 truncate">{book.author}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium">{book.rating}</span>
                      <span className="text-xs text-gray-400">({(book.readers/1000).toFixed(1)}K)</span>
                    </div>
                  </div>
                ))}
              </div>
              {hasMoreTrending && (
                <button 
                  onClick={() => loadTrendingBooks(trendingPage + 1, true)} 
                  disabled={loadingMore} 
                  className="w-full mt-2 py-2 border border-orange-200 text-orange-500 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                >
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
            {(crews||[]).filter(c => user?.joinedCrews?.includes(c.id)).slice(0,2).map(crew => (
              <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer" onClick={() => setPage('crews')}>
                <div className="h-16 flex items-center justify-center p-2 bg-gray-50"><DynamicBookCover title={crew.name} author={crew.author} size="xs" /></div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{crew.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{crew.genre}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500"><Users className="w-3 h-3" />{crew.members || 1}</div>
                    <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-lg text-xs">Joined</span>
                  </div>
                </div>
              </div>
            ))}
            {(!user?.joinedCrews || user.joinedCrews.length === 0) && (
              <div className="col-span-2 bg-white rounded-xl p-6 text-center border border-gray-200">
                <p className="text-gray-500 text-sm">No crews joined yet</p>
                <button onClick={() => setPage('crews')} className="mt-2 text-orange-500 text-sm font-medium">Browse Crews →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── NEARBY MODE COMPONENT (to be used in ExplorePage) ───────────────────
const NearbyMode = ({ setMode }) => {
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

  const getDistKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const getNearbyLocation = () => {
    if (!navigator.geolocation) { 
      setNearbyLocError('Geolocation not supported by your browser'); 
      return; 
    }
    setNearbyLocLoading(true); 
    setNearbyLocError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setNearbyLocation({ lat, lng });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, 
            { headers: { 'User-Agent': 'ReadCrew-App/1.0' } }
          );
          const data = await res.json();
          const c = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'your city';
          setNearbyCity(c);
        } catch { 
          setNearbyCity('your city'); 
        }
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
    setLibLoading(true); 
    setHasSearchedLibs(true);
    const rad = km * 1000;
    const query = `[out:json][timeout:25];(node["amenity"="library"](around:${rad},${lat},${lng});way["amenity"="library"](around:${rad},${lat},${lng}););out center;`;
    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', { 
        method: 'POST', 
        body: query, 
        signal: AbortSignal.timeout(20000) 
      });
      const data = await res.json();
      const libs = (data.elements||[]).map(el => {
        const la = el.lat || el.center?.lat, lo = el.lon || el.center?.lon;
        return { 
          id: el.id, 
          name: el.tags?.name || 'Public Library', 
          address: [el.tags?.['addr:street'], el.tags?.['addr:housenumber'], el.tags?.['addr:city']].filter(Boolean).join(', ') || 'See map', 
          phone: el.tags?.phone || null, 
          website: el.tags?.website || null, 
          opening_hours: el.tags?.opening_hours || null, 
          lat: la, 
          lng: lo, 
          distKm: la && lo ? getDistKm(lat, lng, la, lo) : null 
        };
      });
      libs.sort((a, b) => (a.distKm ?? 999) - (b.distKm ?? 999));
      setLibraries(libs);
    } catch { 
      setLibraries([]); 
    } finally { 
      setLibLoading(false); 
    }
  };

  const fetchNearbyEvents = async () => {
    if (!nearbyCity) return;
    setEventsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/nearby/events`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ city: nearbyCity, lat: nearbyLocation?.lat, lng: nearbyLocation?.lng }), 
        signal: AbortSignal.timeout(30000) 
      });
      if (res.ok) { 
        const data = await res.json(); 
        if (data.events?.length > 0) { 
          setNearbyEvents(data.events); 
          setEventsLoading(false); 
          return; 
        }
      }
    } catch { /* fall through */ }
    
    const cityEnc = encodeURIComponent(nearbyCity);
    const addDays = (d) => { 
      const dt = new Date(); 
      dt.setDate(dt.getDate()+d); 
      return dt.toLocaleDateString('en-IN', { weekday:'short', month:'short', day:'numeric' }); 
    };
    
    setNearbyEvents([
      { id:1, title:'Book Club Meetup', type:'Book Club', description:`Monthly book club in ${nearbyCity} — discuss the latest reads over coffee with fellow book lovers!`, date:addDays(7), venue:`${nearbyCity} Community Library`, link:`https://www.meetup.com/find/?keywords=book+club&location=${cityEnc}`, source:'Meetup', free:true, emoji:'📚' },
      { id:2, title:'Author Talk & Book Signing', type:'Author Event', description:`Local and national authors visit ${nearbyCity} bookstores for readings, Q&A sessions, and meet-and-greets.`, date:addDays(14), venue:'Local Bookstore', link:`https://www.eventbrite.com/d/${cityEnc}/book-author/`, source:'Eventbrite', free:false, emoji:'✍️' },
      { id:3, title:'Literary Festival', type:'Festival', description:`Annual celebration of literature featuring panels, author talks, workshops, and a book bazaar.`, date:addDays(30), venue:`${nearbyCity} Cultural Centre`, link:`https://www.eventbrite.com/d/${cityEnc}/literary-festival/`, source:'Eventbrite', free:false, emoji:'🎪' },
      { id:4, title:'Poetry & Spoken Word Night', type:'Open Mic', description:'Open mic for poetry lovers and spoken word artists — all skill levels welcome, just bring your words!', date:addDays(10), venue:'Local Café', link:`https://www.meetup.com/find/?keywords=poetry+night&location=${cityEnc}`, source:'Meetup', free:true, emoji:'🎤' },
      { id:5, title:"Children's Storytelling Hour", type:'Kids Event', description:'Free weekly storytelling sessions at the public library — perfect for families with young readers aged 3–10.', date:'Every Saturday', venue:`${nearbyCity} Public Library`, link:`https://www.eventbrite.com/d/${cityEnc}/storytelling/`, source:'Library', free:true, emoji:'🧒' },
      { id:6, title:'Creative Writing Workshop', type:'Workshop', description:'Sharpen your craft with experienced writers. Covers fiction, non-fiction, and personal essays.', date:addDays(21), venue:`${nearbyCity} Arts Centre`, link:`https://www.eventbrite.com/d/${cityEnc}/writing-workshop/`, source:'Eventbrite', free:false, emoji:'🖊️' },
    ]);
    setEventsLoading(false);
  };

  useEffect(() => {
    if (nearbyTab === 'events' && nearbyLocation && nearbyEvents.length === 0) {
      fetchNearbyEvents();
    }
  }, [nearbyTab, nearbyLocation]);

  if (!nearbyLocation) {
    return (
      <div className="px-4 pt-6">
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-orange-100 text-center mb-5">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <MapPin className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Find Your Reading World</h2>
          <p className="text-gray-500 text-sm mb-5 leading-relaxed">
            Discover <strong>public libraries</strong> near you and <strong>book events</strong> happening in your city.
          </p>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {[['🏛️','Libraries','OpenStreetMap'], ['📅','Events','Meetup & Eventbrite'], ['🤖','AI Picks','Groq AI']].map(([e,t,d]) => (
              <div key={t} className="bg-gradient-to-b from-orange-50 to-purple-50 rounded-xl p-2.5 text-center border border-orange-100">
                <div className="text-2xl mb-1">{e}</div>
                <p className="text-xs font-bold text-gray-800">{t}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{d}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 mb-5 text-left space-y-2">
            <p className="text-xs font-bold text-gray-700 mb-2">How it works:</p>
            {[['1','Share your location','One tap — stays on your device'], 
              ['2','Find libraries','Real libraries from OpenStreetMap'], 
              ['3','Discover events','Book clubs, author talks, festivals near you']
            ].map(([n,t,d]) => (
              <div key={n} className="flex items-start gap-2.5">
                <div className="w-5 h-5 bg-orange-500 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{n}</div>
                <div><p className="text-xs font-semibold text-gray-800">{t}</p><p className="text-[11px] text-gray-500">{d}</p></div>
              </div>
            ))}
          </div>

          {nearbyLocError && <p className="text-red-500 text-sm mb-3 bg-red-50 rounded-xl px-3 py-2">{nearbyLocError}</p>}

          <button onClick={getNearbyLocation} disabled={nearbyLocLoading}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-2xl font-bold text-sm shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
            {nearbyLocLoading ? <><LoadingSpinner size="sm" />Detecting location...</> : <><MapPin className="w-4 h-4" />Share My Location</>}
          </button>
          <p className="text-[11px] text-gray-400 mt-3">📡 Uses browser GPS · No data stored · 100% free</p>
        </div>
      </div>
    );
  }

  return (
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
        <button onClick={() => setNearbyTab('libraries')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${nearbyTab==='libraries' ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>
          🏛️ Libraries
        </button>
        <button onClick={() => setNearbyTab('events')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${nearbyTab==='events' ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>
          📅 Events
        </button>
      </div>

      {nearbyTab === 'libraries' && (
        <div className="px-4 py-3 space-y-3">
          {libLoading && <div className="text-center py-10"><LoadingSpinner size="lg" /><p className="text-gray-500 text-sm mt-3">Searching OpenStreetMap...</p></div>}
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
          {libraries.length > 0 && <p className="text-center text-[11px] text-gray-400 pt-1">Data from <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer" className="text-orange-500 underline">OpenStreetMap</a> · Free & open</p>}
        </div>
      )}

      {nearbyTab === 'events' && (
        <div className="px-4 py-3 space-y-3">
          {eventsLoading && <div className="text-center py-10"><LoadingSpinner size="lg" /><p className="text-gray-500 text-sm mt-3">🤖 Finding book events in {nearbyCity}...</p><p className="text-xs text-gray-400 mt-1">Powered by Groq AI</p></div>}
          {!eventsLoading && nearbyEvents.length > 0 && (
            <>
              <div className="bg-gradient-to-r from-purple-50 to-orange-50 rounded-xl px-3 py-2.5 border border-purple-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <p className="text-xs text-gray-600">Curated events for <strong>{nearbyCity}</strong> · Tap links to see real listings</p>
              </div>
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
              <button onClick={() => { setNearbyEvents([]); fetchNearbyEvents(); }} className="w-full py-3 border border-purple-200 text-purple-600 rounded-xl text-sm font-semibold bg-purple-50">🔄 Refresh Suggestions</button>
            </>
          )}
        </div>
      )}
    </>
  );
};

// ─── CHARACTER MODE COMPONENT (to be used in ExplorePage) ───────────────────
const CharacterMode = ({ setMode, onCreateCrew, setPage }) => {
  const [charName, setCharName] = useState('');
  const [charBook, setCharBook] = useState('');
  const [charLoading, setCharLoading] = useState(false);
  const [charResult, setCharResult] = useState(null);

  const searchCharacter = async () => {
    if (!charName.trim()) return;
    setCharLoading(true); setCharResult(null);
    try {
      const res = await axios.post(`${API_URL}/api/books/character-search`, 
        { character: charName.trim(), fromBook: charBook.trim() || undefined },
        { timeout: 8000 }
      );
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
        <button onClick={() => { navigator.clipboard.writeText(`"${book.title}" by ${book.author}`); alert('Copied!'); }} className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
          <Share2 className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => setMode('chat')} className="p-1 hover:bg-gray-100 rounded-xl"><ChevronLeft className="w-5 h-5" /></button>
        <span className="font-semibold">Find Books by Character</span>
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
    </>
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
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const [backendAlive, setBackendAlive] = useState(null);

  useEffect(() => {
    const ping = async () => {
      try {
        const res = await fetch(`${API_URL}/api/books/trending?page=1`, { signal: AbortSignal.timeout(8000) });
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
    setLoading(true);
    setLastQuery(userText);

    let usedBackend = false;

    if (backendAlive !== false) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);
        const res = await axios.post(`${API_URL}/api/books/chat`, { message: userText, sessionId }, { signal: controller.signal });
        clearTimeout(timeout);
        const { reply, hasRecommendations, recommendations, exchangeCount: serverCount } = res.data;
        setChatMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);
        if (serverCount) setExchangeCount(serverCount);
        if (hasRecommendations && recommendations?.length > 0) {
          setAllBooks(recommendations); setHasMoreBooks(true); setCurrentBookPage(1);
        }
        setBackendAlive(true);
        usedBackend = true;
      } catch { setBackendAlive(false); }
    }

    if (!usedBackend) {
      const { reply, books } = generateClientResponse(userText, newExchange, allBooks);
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);
      if (books.length > 0) {
        setAllBooks(books); setHasMoreBooks(true); setCurrentBookPage(1);
      }
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
        const res = await axios.post(`${API_URL}/api/books/recommend`, { query: lastQuery, page: nextPage }, { timeout: 8000 });
        if (res.data.success && res.data.recommendations?.length > 0) {
          setAllBooks(prev => [...prev, ...res.data.recommendations]);
          setCurrentBookPage(nextPage);
          setHasMoreBooks(res.data.hasMore && nextPage < 5);
          return;
        }
      }
      const { books } = generateClientResponse(lastQuery, 3, allBooks);
      if (books.length > 0) { setAllBooks(prev => [...prev, ...books]); }
      setHasMoreBooks(false);
    } catch { setHasMoreBooks(false); }
    finally { setLoadingMoreBooks(false); loadingMoreRef.current = false; }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
        <button onClick={() => { navigator.clipboard.writeText(`"${book.title}" by ${book.author}`); alert('Copied!'); }} className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
          <Share2 className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );

  if (mode === 'character') {
    return <CharacterMode setMode={setMode} onCreateCrew={onCreateCrew} setPage={setPage} />;
  }

  if (mode === 'nearby') {
    return (
      <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(160deg, #FFF8F2 0%, #F0EBFF 100%)' }}>
        <div className="sticky top-0 z-40 border-b border-orange-100 px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,248,242,0.96)', backdropFilter:'blur(12px)' }}>
          <button onClick={() => setMode('chat')} className="p-1.5 hover:bg-orange-100 rounded-xl"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
          <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-purple-600 rounded-lg flex items-center justify-center shadow"><MapPin className="w-3.5 h-3.5 text-white" /></div>
          <div className="flex-1">
            <span className="font-bold text-gray-900">Nearby</span>
          </div>
        </div>
        <NearbyMode setMode={setMode} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] to-[#FAF6F1] pb-24">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-[#2D1F14] mb-1" style={{fontFamily:'Georgia,serif'}}>What to read next?</h1>
        <p className="text-sm text-[#8B7968]">Chat with your AI book guide</p>
      </div>

      <div className="flex gap-2 px-5 mb-4">
        <button onClick={() => setMode('chat')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${mode==='chat' ? 'bg-orange-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'}`}>
          <Sparkles className="w-3.5 h-3.5" />AI Chat
        </button>
        <button onClick={() => setMode('character')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${mode==='character' ? 'bg-orange-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'}`}>
          🎭 By Character
        </button>
        <button onClick={() => setMode('nearby')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${mode==='nearby' ? 'bg-orange-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'}`}>
          📍 Nearby
        </button>
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
              <span className="text-xs text-orange-500 font-semibold">📚 RECOMMENDATIONS FOR YOU</span>
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
              {!hasMoreBooks && allBooks.length > 0 && (
                <div className="text-center py-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">✨ You've seen all recommendations</p>
                  <p className="text-xs text-gray-400">Tell me more preferences for fresh picks!</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {allBooks.length === 0 && (
        <div className="px-5 mt-4">
          <p className="text-xs text-[#8B7968] mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {['Something like The Alchemist', 'Best thriller of 2024', 'Cozy mystery books', 'Books about self-growth', 'Sci-fi like Dune', 'Emotional literary fiction'].map(s => (
              <button key={s} onClick={() => { setInput(s); }} className="text-xs px-3 py-1.5 bg-white border border-[#EDE8E3] rounded-full text-[#6B5D52] hover:border-orange-300 hover:text-orange-600 transition">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

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

  const handleSubmit = () => {
    if (!content.trim()) return;
    const postData = {
      id: Date.now(), content, bookName, author, image, isPublic, type: 'post',
      userName: user.name, userEmail: user.email, createdAt: new Date().toISOString(),
      likes: 0, comments: 0, shares: 0
    };
    onPost(postData);
    setPage('home');
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white z-[55] max-w-md mx-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
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

// ─── REVIEWS PAGE with search ──────────────────────────────────────────────
const ReviewsPage = ({ user, setPage, updateNotificationCount }) => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [likedReviews, setLikedReviews] = useState([]);
  const [newReview, setNewReview] = useState({ bookName: '', author: '', rating: 5, review: '', sentiment: 'positive' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/social/reviews`, { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.reviews?.length > 0) {
            const local = JSON.parse(localStorage.getItem('reviews') || '[]');
            const ids = new Set(data.reviews.map(r => r.id));
            const merged = [...local.filter(r => !ids.has(r.id)), ...data.reviews];
            merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setReviews(merged);
            setFilteredReviews(merged);
            setLoading(false);
            return;
          }
        }
      } catch { /* fall through */ }
      const saved = JSON.parse(localStorage.getItem('reviews') || '[]');
      setReviews(saved);
      setFilteredReviews(saved);
      setLoading(false);
    };
    load();
    const liked = JSON.parse(localStorage.getItem(`user_${user.email}_likedReviews`) || '[]');
    setLikedReviews(liked);
  }, [user.email]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredReviews(reviews);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = reviews.filter(r => 
        r.bookName.toLowerCase().includes(term) || 
        r.author.toLowerCase().includes(term) ||
        (r.userName && r.userName.toLowerCase().includes(term))
      );
      setFilteredReviews(filtered);
    }
  }, [searchTerm, reviews]);

  const handleLikeReview = (reviewId, review) => {
    if (likedReviews.includes(reviewId)) return;
    const updated = [...likedReviews, reviewId];
    setLikedReviews(updated);
    localStorage.setItem(`user_${user.email}_likedReviews`, JSON.stringify(updated));
    const updatedReviews = reviews.map(r => r.id === reviewId ? { ...r, likes: (r.likes||0)+1 } : r);
    setReviews(updatedReviews);
    setFilteredReviews(filteredReviews.map(r => r.id === reviewId ? { ...r, likes: (r.likes||0)+1 } : r));
    localStorage.setItem('reviews', JSON.stringify(updatedReviews));
    if (review.userEmail !== user.email) {
      const notif = { id: Date.now(), type: 'like', fromUser: user.name, message: `${user.name} liked your review of "${review.bookName}"`, timestamp: new Date().toISOString(), read: false };
      const notifs = JSON.parse(localStorage.getItem(`user_${review.userEmail}_notifications`) || '[]');
      notifs.unshift(notif);
      localStorage.setItem(`user_${review.userEmail}_notifications`, JSON.stringify(notifs));
      updateNotificationCount?.();
    }
  };

  const handleCreateReview = async () => {
    if (!newReview.bookName || !newReview.author || !newReview.review) { alert('Please fill all fields'); return; }
    const reviewData = { id: Date.now().toString(), ...newReview, userName: user.name, userEmail: user.email, createdAt: new Date().toISOString(), likes: 0 };
    const saved = JSON.parse(localStorage.getItem('reviews') || '[]');
    saved.unshift(reviewData);
    localStorage.setItem('reviews', JSON.stringify(saved));
    setReviews([reviewData, ...reviews]);
    setFilteredReviews([reviewData, ...reviews]);
    setShowCreateForm(false);
    setNewReview({ bookName: '', author: '', rating: 5, review: '', sentiment: 'positive' });
    try {
      await fetch(`${API_URL}/api/social/reviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData), signal: AbortSignal.timeout(8000)
      });
    } catch { /* offline — local save is enough */ }
    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.reviewsGiven = (stats.reviewsGiven||0) + 1;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <button onClick={() => setPage('home')} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <h2 className="font-semibold text-gray-900">Book Reviews</h2>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium">{showCreateForm ? 'Cancel' : 'Write Review'}</button>
      </div>
      
      {/* Search bar */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reviews by book, author, or user..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300"
          />
        </div>
      </div>
      
      <div className="px-4 py-2">
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
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{searchTerm ? 'No reviews match your search' : 'No reviews yet. Be the first!'}</p>
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
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">{review.userName?.slice(0,2)||'U'}</div>
                      <span className="text-xs text-gray-500">{review.userName}</span>
                    </div>
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

// ─── CREWS PAGE with one-book-one-crew policy ─────────────────────────────
const CrewsPage = ({ user, crews: initialCrews, setPage, updateNotificationCount, onViewChange }) => {
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
  const [showCrewShare, setShowCrewShare] = useState(false);
  const [crewExistsError, setCrewExistsError] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const CrewShareModal = ({ crew, onClose }) => {
    const shareUrl = window.location.href;
    const shareText = `Join me in the "${crew.name}" reading crew on ReadCrew! We're discussing this book by ${crew.author}.`;
    
    const handlers = {
      whatsapp: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank'),
      facebook: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank'),
      twitter: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank'),
      copyLink: () => { navigator.clipboard.writeText(shareUrl); alert('Link copied!'); }
    };
    
    return (
      <div className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center max-w-md mx-auto">
        <div className="bg-white rounded-t-2xl w-full p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Share Crew</h3>
            <button onClick={onClose}><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            {[['whatsapp','#25D366','W'], ['facebook','#1877F2','F'], ['twitter','#1DA1F2','T']].map(([key, color, letter]) => (
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
    );
  };

  useEffect(() => {
    const loadCrews = async () => {
      try {
        const res = await fetch(`${API_URL}/api/social/crews`, { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.crews?.length > 0) {
            const local = JSON.parse(localStorage.getItem('crews') || '[]');
            const globalIds = new Set(data.crews.map(c => String(c.id)));
            const merged = [...local.filter(c => !globalIds.has(String(c.id))), ...data.crews];
            setCrews(merged);
            localStorage.setItem('crews', JSON.stringify(merged));
            return;
          }
        }
      } catch { /* fall through */ }
      const saved = JSON.parse(localStorage.getItem('crews') || '[]');
      setCrews(saved.length > 0 ? saved : initialCrews);
    };
    loadCrews();
    const jc = JSON.parse(localStorage.getItem(`user_${user.email}_joinedCrews`) || '[]');
    setJoinedCrews(jc);
  }, [user.email, initialCrews]);

  useEffect(() => {
    if (selectedCrew) {
      const loadMessages = async () => {
        try {
          const res = await fetch(`${API_URL}/api/social/crews/${selectedCrew.id}/messages`, { signal: AbortSignal.timeout(5000) });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.messages?.length > 0) {
              const local = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`) || '[]');
              const globalIds = new Set(data.messages.map(m => m.id));
              const merged = [...local.filter(m => !globalIds.has(m.id)), ...data.messages];
              merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
              setMessages(merged.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
              return;
            }
          }
        } catch { /* fall through */ }
        const msgs = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`) || '[]');
        setMessages(msgs.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
      };
      loadMessages();
      
      // Get real members from joinedCrews
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const memberEmails = new Set();
      allUsers.forEach(u => {
        if (u.joinedCrews?.includes(selectedCrew.id) || u.joinedCrews?.includes(String(selectedCrew.id))) {
          memberEmails.add(u.email);
        }
      });
      
      const members = allUsers
        .filter(u => memberEmails.has(u.email))
        .map(u => ({ 
          id: u.id, 
          name: u.name, 
          email: u.email, 
          initials: u.name?.slice(0,2), 
          online: Math.random() > 0.5 
        }));
      
      if (!members.find(m => m.email === selectedCrew.createdBy) && selectedCrew.createdBy !== 'system') {
        members.push({ 
          id: selectedCrew.createdBy, 
          name: selectedCrew.createdByName || 'Creator', 
          email: selectedCrew.createdBy, 
          initials: (selectedCrew.createdByName || 'CR').slice(0,2), 
          online: true, 
          isCreator: true 
        });
      }
      setCrewMembers(members);
    }
  }, [selectedCrew]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const isJoined = (crewId) => joinedCrews.includes(crewId);

  const checkCrewExists = (name, author) => {
    return crews.some(c => 
      c.name.toLowerCase() === name.toLowerCase() && 
      c.author.toLowerCase() === author.toLowerCase()
    );
  };

  const joinCrew = (crew) => {
    const updated = [...joinedCrews, crew.id];
    setJoinedCrews(updated);
    localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updated));
    
    // Update crew member count
    const updatedCrews = crews.map(c => 
      c.id === crew.id ? { ...c, members: (c.members || 1) + 1 } : c
    );
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));
    
    // Update user record
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    localStorage.setItem('users', JSON.stringify(users.map(u => u.email === user.email ? { ...u, joinedCrews: updated } : u)));
    
    // Update stats
    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.crewsJoined = (stats.crewsJoined || 0) + 1;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
    
    // Update current user
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
    
    // Update crew member count (minimum 1)
    const updatedCrews = crews.map(c => 
      c.id === crew.id ? { ...c, members: Math.max(1, (c.members || 1) - 1) } : c
    );
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));
    
    if (selectedCrew?.id === crew.id) { 
      setView('list'); 
      onViewChange?.('list'); 
      setSelectedCrew(null); 
    }
  };

  const createCrew = async () => {
    if (!newCrewData.name || !newCrewData.author) { 
      alert('Please fill book name and author'); 
      return; 
    }
    
    // One-book-one-crew policy check
    if (checkCrewExists(newCrewData.name, newCrewData.author)) {
      setCrewExistsError('A crew for this book already exists!');
      setTimeout(() => setCrewExistsError(''), 3000);
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
    setShowCreateCrewForm(false);
    setNewCrewData({ name: '', author: '', genre: '' });
    
    try {
      await fetch(`${API_URL}/api/social/crews`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ...newCrew, createdBy: user.email, createdByName: user.name }), 
        signal: AbortSignal.timeout(6000) 
      });
    } catch { /* offline */ }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedCrew || !isJoined(selectedCrew.id)) return;
    const msg = { 
      id: `msg_${Date.now()}`, 
      userId: user.id, 
      userName: user.name, 
      userInitials: user.name?.slice(0,2).toUpperCase(), 
      content: newMessage.trim(), 
      timestamp: new Date().toISOString(), 
      type: 'text' 
    };
    const existing = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`) || '[]');
    existing.push(msg);
    localStorage.setItem(`crew_${selectedCrew.id}_messages`, JSON.stringify(existing));
    setMessages(prev => [...prev, { ...msg, timestamp: new Date(msg.timestamp) }]);
    setNewMessage('');
    
    // Send notifications to all crew members
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    crewMembers.forEach(member => {
      if (member.email !== user.email) {
        const notif = { 
          id: Date.now() + Math.random(), 
          type: 'message', 
          fromUser: user.name, 
          message: `${user.name} sent a message in ${selectedCrew.name}`, 
          timestamp: new Date().toISOString(), 
          read: false,
          crewId: selectedCrew.id
        };
        const notifs = JSON.parse(localStorage.getItem(`user_${member.email}_notifications`) || '[]');
        notifs.unshift(notif);
        localStorage.setItem(`user_${member.email}_notifications`, JSON.stringify(notifs));
      }
    });
    updateNotificationCount();
    
    try {
      await fetch(`${API_URL}/api/social/crews/${selectedCrew.id}/message`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(msg), 
        signal: AbortSignal.timeout(5000) 
      });
    } catch { /* offline */ }
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
        userInitials: user.name?.slice(0,2).toUpperCase(), 
        content: ev.target.result, 
        timestamp: new Date().toISOString(), 
        type: 'image' 
      };
      const existing = JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`) || '[]');
      existing.push(msg);
      localStorage.setItem(`crew_${selectedCrew.id}_messages`, JSON.stringify(existing));
      setMessages(prev => [...prev, { ...msg, timestamp: new Date(msg.timestamp) }]);
      
      // Send notifications
      crewMembers.forEach(member => {
        if (member.email !== user.email) {
          const notif = { 
            id: Date.now() + Math.random(), 
            type: 'message', 
            fromUser: user.name, 
            message: `${user.name} shared an image in ${selectedCrew.name}`, 
            timestamp: new Date().toISOString(), 
            read: false,
            crewId: selectedCrew.id
          };
          const notifs = JSON.parse(localStorage.getItem(`user_${member.email}_notifications`) || '[]');
          notifs.unshift(notif);
          localStorage.setItem(`user_${member.email}_notifications`, JSON.stringify(notifs));
        }
      });
      updateNotificationCount();
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (ts) => {
    const diff = Date.now() - new Date(ts);
    const mins = Math.floor(diff/60000), hrs = Math.floor(diff/3600000), days = Math.floor(diff/86400000);
    if (mins < 1) return 'Just now'; 
    if (mins < 60) return `${mins}m`; 
    if (hrs < 24) return `${hrs}h`; 
    if (days < 7) return `${days}d`; 
    return new Date(ts).toLocaleDateString();
  };

  const Toast = () => showJoinMsg ? (
    <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg z-[100] text-center">{showJoinMsg}</div>
  ) : null;

  if (view === 'chat' && selectedCrew) {
    const hasJoined = isJoined(selectedCrew.id);
    const groupsByDate = messages.reduce((acc, msg) => {
      const date = new Date(msg.timestamp).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(msg);
      return acc;
    }, {});

    return (
      <div className="fixed inset-0 flex flex-col z-[60] bg-[#e5ddd5] max-w-md mx-auto">
        <Toast />
        <div className="flex-shrink-0 bg-white border-b px-4 py-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => { setView('detail'); onViewChange?.('detail'); }} className="p-1 hover:bg-gray-100 rounded-full">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <DynamicBookCover title={selectedCrew.name} author={selectedCrew.author} size="xs" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{selectedCrew.name}</p>
              <p className="text-xs text-gray-500">{crewMembers.length} members</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowCrewShare(true)} className="p-2 hover:bg-gray-100 rounded-full" title="Share Crew">
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </button>
          </div>
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
                          {!isOwn && <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">{msg.userInitials}</div>}
                          <div className={`rounded-2xl px-3.5 py-2 shadow-sm ${isOwn ? 'bg-[#FEF3E2] rounded-br-sm' : 'bg-white rounded-bl-sm'}`}>
                            {!isOwn && <p className="text-xs font-semibold text-orange-600 mb-0.5">{msg.userName}</p>}
                            {msg.type === 'image' ? <img src={msg.content} alt="Shared" className="max-w-full rounded-xl max-h-60" /> : <p className="text-sm leading-relaxed break-words text-gray-900">{msg.content}</p>}
                            <p className="text-[10px] text-gray-400 text-right mt-0.5">{formatTime(msg.timestamp)}{isOwn && <span className="ml-1 text-blue-400">✓✓</span>}</p>
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
            <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow border border-gray-100">
              <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center flex-shrink-0"><Plus className="w-5 h-5 text-orange-500" /></button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={sendImage} />
              <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} className="flex-1 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent" placeholder="Type a message..." />
              <button onClick={sendMessage} disabled={!newMessage.trim()} className={`w-8 h-8 flex items-center justify-center rounded-full transition ${newMessage.trim() ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {showCrewShare && <CrewShareModal crew={selectedCrew} onClose={() => setShowCrewShare(false)} />}
      </div>
    );
  }

  if (view === 'detail' && selectedCrew) {
    const hasJoined = isJoined(selectedCrew.id);
    return (
      <div className="h-screen flex flex-col bg-white max-w-md mx-auto">
        <Toast />
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => { setView('list'); onViewChange?.('list'); }} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
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
                  <button onClick={() => { setView('chat'); onViewChange?.('chat'); }} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold">Go to Chat</button>
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
                  <button onClick={() => { setView('chat'); onViewChange?.('chat'); }} className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                    <MessageCircle className="w-5 h-5" />Open Chat
                  </button>
                  {messages.slice(-3).reverse().map(msg => (
                    <div key={msg.id} className="flex items-start gap-3 py-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">{msg.userInitials}</div>
                      <div><span className="font-semibold text-sm">{msg.userName}</span><p className="text-sm text-gray-600 truncate">{msg.type === 'image' ? '📷 Image' : msg.content}</p></div>
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
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">{member.initials}</div>
                        {member.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />}
                      </div>
                      <div><p className="font-semibold">{member.name}</p><p className="text-xs text-gray-500">{member.isCreator ? '👑 Creator' : member.online ? 'Online' : 'Offline'}</p></div>
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
    <div className="pb-24 bg-gray-50 min-h-screen">
      <Toast />
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-white" /></div>
          <span className="font-bold" style={{fontFamily:'Georgia,serif'}}>Reading Crews</span>
        </div>
        <button onClick={() => setShowCreateCrewForm(true)} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium">Create Crew</button>
      </div>
      
      {crewExistsError && (
        <div className="mx-4 mt-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm">
          {crewExistsError}
        </div>
      )}
      
      <div className="px-4 py-4">
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
          {crews.filter(c => isJoined(c.id)).length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
              <p className="text-gray-500 text-sm">No crews joined yet. Explore below!</p>
            </div>
          ) : crews.filter(c => isJoined(c.id)).map(crew => (
            <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-green-200 shadow-sm cursor-pointer mb-3" onClick={() => { setSelectedCrew(crew); setView('detail'); onViewChange?.('detail'); }}>
              <div className="flex items-center px-4 gap-4 py-3">
                <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="font-bold text-gray-900 truncate">{crew.name}</p><span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full flex-shrink-0">Joined</span></div>
                  <p className="text-xs text-gray-500">by {crew.author}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {crew.genre && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre}</span>}
                    <span className="text-xs text-gray-400">{crew.members || 1} members</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 flex justify-end gap-2 border-t border-gray-100">
                <button onClick={e => { e.stopPropagation(); setSelectedCrew(crew); setView('chat'); onViewChange?.('chat'); }} className="px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-xs font-medium">Chat</button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-bold mb-3">Discover Crews</h2>
          <div className="space-y-3">
            {crews.filter(c => !isJoined(c.id)).map(crew => (
              <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer" onClick={() => { setSelectedCrew(crew); setView('detail'); onViewChange?.('detail'); }}>
                <div className="flex items-center px-4 gap-4 py-3">
                  <DynamicBookCover title={crew.name} author={crew.author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{crew.name}</p>
                    <p className="text-xs text-gray-500">by {crew.author}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {crew.genre && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre}</span>}
                      <span className="text-xs text-gray-400">{crew.members || 1} members</span>
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

// ─── PROFILE PAGE with saved posts and followers ────────────────────────
const ProfilePage = ({ user, posts, setPage, onLogout, onUpdateUser, profileSrc, setProfileSrc }) => {
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
  const [savedPosts, setSavedPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const fileRef = useRef();

  const myPosts = posts.filter(p => p.userEmail === user?.email);
  const myReviews = JSON.parse(localStorage.getItem('reviews') || '[]').filter(r => r.userEmail === user?.email);

  useEffect(() => {
    const savedStats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    const joinedCrews = JSON.parse(localStorage.getItem(`user_${user.email}_joinedCrews`) || '[]');
    setUserStats({
      booksRead: savedStats.booksRead || 0,
      reviewsGiven: savedStats.reviewsGiven || 0,
      postsCreated: savedStats.postsCreated || 0,
      crewsJoined: joinedCrews.length || 0
    });
    
    const savedImg = localStorage.getItem(`user_${user.email}_profile_image`);
    if (savedImg) setProfileSrc(savedImg);
    
    const savedBooks = JSON.parse(localStorage.getItem(`user_${user.email}_booksRead`) || '[]');
    setMyBooks(savedBooks);
    
    // Load saved posts
    const saved = JSON.parse(localStorage.getItem(`user_${user.email}_savedPosts`) || '[]');
    setSavedPosts(saved);
    
    // Load followers/following
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const followersList = users.filter(u => u.following?.includes(user.email));
    setFollowers(followersList);
    
    const followingList = users.filter(u => user.following?.includes(u.email));
    setFollowing(followingList);
  }, [user.email, setProfileSrc]);

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

  const handleRemoveSavedPost = (postId) => {
    const updated = savedPosts.filter(p => p.id !== postId);
    setSavedPosts(updated);
    localStorage.setItem(`user_${user.email}_savedPosts`, JSON.stringify(updated));
  };

  const tabs = ['Posts', 'Reviews', 'Books Read', 'Saved', 'Crews'];

  const FollowersModal = ({ users, title, onClose }) => (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center max-w-md mx-auto">
      <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-3">
          {users.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No users found</p>
          ) : (
            users.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">
                  {u.name?.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {showFollowersModal && (
        <FollowersModal 
          users={followers} 
          title="Followers" 
          onClose={() => setShowFollowersModal(false)} 
        />
      )}
      {showFollowingModal && (
        <FollowersModal 
          users={following} 
          title="Following" 
          onClose={() => setShowFollowingModal(false)} 
        />
      )}
      
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-white" /></div>
          <span className="font-bold" style={{fontFamily:'Georgia,serif'}}>Profile</span>
        </div>
        <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-lg"><LogOut className="w-5 h-5 text-gray-600" /></button>
      </div>

      <div className="px-4 py-5">
        <div className="flex items-start gap-4 mb-5">
          <div className="relative">
            {profileSrc ? <img src={profileSrc} alt={user?.name} className="w-20 h-20 rounded-full object-cover border-2 border-orange-200" />
              : <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">{user?.name?.slice(0,2).toUpperCase()}</div>}
            <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
          <div className="flex-1">
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
                <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                <p className="text-sm text-gray-500">@{user?.name?.toLowerCase().replace(/\s/g,'')}</p>
                <p className="text-sm text-gray-600 mt-1 italic">"{user?.bio || 'Reading is my superpower'}"</p>
                <div className="flex gap-4 mt-2">
                  <button onClick={() => setShowFollowersModal(true)} className="text-sm">
                    <span className="font-bold">{followers.length}</span> <span className="text-gray-500">Followers</span>
                  </button>
                  <button onClick={() => setShowFollowingModal(true)} className="text-sm">
                    <span className="font-bold">{following.length}</span> <span className="text-gray-500">Following</span>
                  </button>
                </div>
                <button onClick={() => setEditingProfile(true)} className="mt-2 px-4 py-1.5 border border-orange-200 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 flex items-center gap-1.5">
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
            <button 
              key={tab} 
              data-tab={tab}
              onClick={() => setActiveTab(tab)} 
              className={`flex-shrink-0 text-sm pb-2.5 px-3 font-medium border-b-2 transition ${activeTab === tab ? 'text-orange-500 border-orange-500' : 'text-gray-500 border-transparent'}`}
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

        {activeTab === 'Saved' && (
          <div className="space-y-4">
            {savedPosts.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No saved posts yet</p>
                <p className="text-xs text-gray-400 mt-1">Save posts you want to read later!</p>
              </div>
            ) : (
              savedPosts.map(post => (
                <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm relative">
                  <button 
                    onClick={() => handleRemoveSavedPost(post.id)}
                    className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full"
                    title="Remove from saved"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {post.userName?.slice(0,2) || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{post.userName}</p>
                      <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{post.content}</p>
                  {post.bookName && (
                    <p className="text-xs text-orange-500 mt-2">📖 {post.bookName}</p>
                  )}
                </div>
              ))
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
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [posts, setPosts] = useState([]);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [crewChatActive, setCrewChatActive] = useState(false);
  const [crews, setCrews] = useState([
    { id: 1, name: 'Atomic Habits', author: 'James Clear', genre: 'Self Improvement', members: 1, chats: 0, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date().toISOString() },
    { id: 2, name: 'Tuesdays with Morrie', author: 'Mitch Albom', genre: 'Inspiration', members: 1, chats: 0, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date().toISOString() },
    { id: 3, name: 'The Alchemist', author: 'Paulo Coelho', genre: 'Fiction', members: 1, chats: 0, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date().toISOString() },
    { id: 4, name: 'Sapiens', author: 'Yuval Harari', genre: 'History', members: 1, chats: 0, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date().toISOString() },
  ]);
  const [notification, setNotification] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [profileSrc, setProfileSrc] = useState(null);

  useEffect(() => {
    if (currentPage === 'post') setShowBottomNav(false);
    else setShowBottomNav(true);
  }, [currentPage]);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        setIsLoggedIn(true);
        const img = localStorage.getItem(`user_${u.email}_profile_image`);
        if (img) setProfileSrc(img);
        const savedCrews = JSON.parse(localStorage.getItem('crews') || '[]');
        if (savedCrews.length > 0) setCrews(savedCrews);
        const userPosts = JSON.parse(localStorage.getItem(`user_${u.email}_posts`) || '[]');
        const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
        setPosts(allPosts.length > 0 ? allPosts : userPosts);
        updateNotificationCount(u.email);
      } catch (err) { console.error(err); }
    }
  }, []);

  const updateNotificationCount = (email) => {
    const e = email || currentUser?.email;
    if (!e) return;
    const notifs = JSON.parse(localStorage.getItem(`user_${e}_notifications`) || '[]');
    setUnreadMessages(notifs.filter(n => !n.read).length);
  };

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
    setCurrentPage('home');
    const img = localStorage.getItem(`user_${userData.email}_profile_image`);
    if (img) setProfileSrc(img);
    const userPosts = JSON.parse(localStorage.getItem(`user_${userData.email}_posts`) || '[]');
    setPosts(userPosts);
    updateNotificationCount(userData.email);
  };

  const handlePost = async (postData) => {
    const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const updated = [postData, ...allPosts];
    localStorage.setItem('allPosts', JSON.stringify(updated));
    const userPosts = JSON.parse(localStorage.getItem(`user_${currentUser.email}_posts`) || '[]');
    localStorage.setItem(`user_${currentUser.email}_posts`, JSON.stringify([postData, ...userPosts]));
    setPosts(updated);
    try {
      await fetch(`${API_URL}/api/social/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...postData, story: postData.content }),
        signal: AbortSignal.timeout(8000)
      });
    } catch { /* offline — local save is enough */ }
    const stats = JSON.parse(localStorage.getItem(`user_${currentUser.email}_stats`) || '{}');
    stats.postsCreated = (stats.postsCreated||0) + 1;
    localStorage.setItem(`user_${currentUser.email}_stats`, JSON.stringify(stats));
    const cu = JSON.parse(localStorage.getItem('currentUser') || '{}');
    localStorage.setItem('currentUser', JSON.stringify({ ...cu, stats }));
    setNotification({ message: '✅ Post shared with the community!', type: 'success' });
    setTimeout(() => setNotification(null), 2500);
  };

  const handleCreateCrew = (book) => {
    // Check one-book-one-crew policy
    const existingCrew = crews.find(c => 
      c.name.toLowerCase() === book.title.toLowerCase() && 
      c.author.toLowerCase() === book.author.toLowerCase()
    );
    if (existingCrew) {
      setNotification({ message: `❌ Crew for "${book.title}" already exists!`, type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    const newCrew = {
      id: Date.now(), name: book.title, author: book.author, genre: book.genre || 'General',
      members: 1, chats: 0, createdBy: currentUser.email, createdByName: currentUser.name,
      createdAt: new Date().toISOString()
    };
    const updatedCrews = [newCrew, ...crews];
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));
    setNotification({ message: `✅ Crew "${book.title}" created!`, type: 'success' });
    setTimeout(() => setNotification(null), 2500);
  };

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen"><LoginPage onLogin={handleLogin} /></div>
    </div>
  );

  return (
    <div className="flex justify-center min-h-screen bg-gray-200">
      {notification && (
        <div className={`fixed top-4 z-[200] px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg text-center w-[90%] max-w-sm left-1/2 -translate-x-1/2 ${notification.type === 'success' ? 'bg-green-500' : notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>
          {notification.message}
        </div>
      )}
      <div className="w-full max-w-md relative bg-white min-h-screen overflow-x-hidden shadow-xl">
        {currentPage === 'home' && <HomePage user={currentUser} posts={posts} setPosts={setPosts} crews={crews} setPage={setCurrentPage} donations={[]} reviews={[]} onUpdateStats={handleUpdateUser} updateNotificationCount={() => updateNotificationCount()} profileSrc={profileSrc} />}
        {currentPage === 'explore' && <ExplorePage user={currentUser} setPage={setCurrentPage} onCreateCrew={handleCreateCrew} />}
        {currentPage === 'post' && <PostPage user={currentUser} onPost={handlePost} setPage={setCurrentPage} />}
        {currentPage === 'crews' && <CrewsPage user={currentUser} crews={crews} setPage={setCurrentPage} updateNotificationCount={() => updateNotificationCount()} onViewChange={(v) => { setCrewChatActive(v === 'chat'); setShowBottomNav(v !== 'chat'); }} />}
        {currentPage === 'reviews' && <ReviewsPage user={currentUser} setPage={setCurrentPage} updateNotificationCount={() => updateNotificationCount()} />}
        {currentPage === 'profile' && <ProfilePage user={currentUser} posts={posts} setPage={setCurrentPage} onLogout={() => { setIsLoggedIn(false); setCurrentUser(null); setProfileSrc(null); localStorage.removeItem('currentUser'); setCurrentPage('home'); }} onUpdateUser={handleUpdateUser} profileSrc={profileSrc} setProfileSrc={setProfileSrc} />}
        {currentPage === 'notifications' && <NotificationsPage user={currentUser} onClose={() => { setCurrentPage('home'); updateNotificationCount(); }} />}
        <BottomNav active={currentPage} setPage={setCurrentPage} unreadCount={unreadMessages} show={showBottomNav && !crewChatActive} />
      </div>
    </div>
  );
}