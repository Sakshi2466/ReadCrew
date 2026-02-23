import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen, Search, Edit3, Users, User, Bell, Heart, MessageCircle,
  Bookmark, Share2, Star, Plus, X, Send, ChevronLeft, LogOut,
  Camera, MoreHorizontal, Sparkles, Lock, Eye, EyeOff, UserPlus,
  Gift, Trash2, Target, Check, Clock, TrendingUp, Globe, ChevronDown,
  Paperclip, Mail, Phone, ExternalLink, Link2, Flag, Smile,
  MessageSquare, Image, ArrowLeft
} from 'lucide-react';

import { otpAPI } from './services/api';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://versal-book-app.onrender.com';

// ─── STORAGE HELPERS (ONLY FOR USER SESSION) ─────────────────────────────────
const ls = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  raw: (k) => localStorage.getItem(k),
  setRaw: (k, v) => localStorage.setItem(k, v),
};

// ─── DYNAMIC BOOK COVER ─────────────────────────────────────────────────────
const DynamicBookCover = ({ title, author, size = 'md', onClick, className = '' }) => {
  const [coverUrl, setCoverUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const sizes = { xs: 'w-12 h-16', sm: 'w-16 h-20', md: 'w-24 h-32', lg: 'w-32 h-40', xl: 'w-40 h-52' };
  const cls = sizes[size] || 'w-24 h-32';
  const colors = ['#7B9EA6','#C8622A','#8B5E3C','#E8A87C','#C4A882','#2C3E50','#E74C3C','#3498DB','#9B59B6','#1ABC9C','#27AE60','#F39C12','#D35400','#8E44AD','#16A085'];
  const hash = (title||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  const bg = colors[hash % colors.length];
  const initials = (title||'BK').slice(0,2).toUpperCase();

  useEffect(() => {
    if (!title) { setError(true); setLoading(false); return; }
    const q = encodeURIComponent(author ? `${title} ${author}` : title);
    fetch(`https://openlibrary.org/search.json?q=${q}&limit=1`)
      .then(r => r.json())
      .then(d => {
        const b = d.docs?.[0];
        if (!b) throw new Error('not found');
        const c = b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`
          : b.isbn?.[0] ? `https://covers.openlibrary.org/b/isbn/${b.isbn[0]}-M.jpg`
          : b.cover_edition_key ? `https://covers.openlibrary.org/b/olid/${b.cover_edition_key}-M.jpg`
          : null;
        if (c) setCoverUrl(c); else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [title, author]);

  if (loading) return (
    <div className={`${cls} ${className} bg-gray-200 rounded-xl animate-pulse flex items-center justify-center`} onClick={onClick}>
      <BookOpen className="w-6 h-6 text-gray-400" />
    </div>
  );
  if (error || !coverUrl) return (
    <div className={`${cls} ${className} rounded-xl flex flex-col items-center justify-center text-white font-bold cursor-pointer`}
      style={{ backgroundColor: bg }} onClick={onClick}>
      <span className="text-2xl">{initials}</span>
      <BookOpen className="w-4 h-4 mt-1 opacity-60" />
    </div>
  );
  return (
    <div className={`${cls} ${className} relative rounded-xl overflow-hidden cursor-pointer`} onClick={onClick}>
      <img src={coverUrl} alt={title} className="w-full h-full object-cover" onError={() => setError(true)} loading="lazy" />
    </div>
  );
};

// ─── STAR RATING ────────────────────────────────────────────────────────────
const StarRating = ({ rating = 0, onChange, size = 'sm' }) => {
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`${sz} ${i<=rating?'fill-amber-400 text-amber-400':'text-gray-300'} ${onChange?'cursor-pointer':''}`}
          onClick={() => onChange?.(i)} />
      ))}
    </div>
  );
};

const LoadingSpinner = ({ size='md' }) => {
  const s = { sm:'w-4 h-4', md:'w-8 h-8', lg:'w-12 h-12' }[size];
  return <div className={`${s} border-4 border-t-transparent border-orange-500 rounded-full animate-spin`} />;
};

// ─── BOTTOM NAV ─────────────────────────────────────────────────────────────
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 max-w-md mx-auto">
      <div className="flex items-center justify-around py-2 px-2">
        {items.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setPage(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative ${active===id?'text-orange-500':'text-gray-400'}`}>
            {id==='post' ? (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center -mt-5 shadow-lg ${active===id?'bg-orange-500':'bg-gray-800'}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            ) : (
              <Icon className="w-5 h-5" strokeWidth={active===id?2.5:1.8} />
            )}
            {id==='crews' && unreadCount>0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{unreadCount}</span>
            )}
            <span className={`text-[10px] font-medium ${id==='post'?'mt-1':''}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// ─── TOP BAR ────────────────────────────────────────────────────────────────
const TopBar = ({ user, setPage, title, onNotificationClick, notificationCount=0, profileSrc }) => (
  <header className="sticky top-0 bg-white/95 backdrop-blur-sm z-40 px-4 py-3 flex items-center justify-between border-b border-gray-200">
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
        <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
      <span className="font-bold text-gray-900 text-lg" style={{fontFamily:'Georgia,serif'}}>{title||'ReadCrew'}</span>
    </div>
    <div className="flex items-center gap-3">
      <button onClick={onNotificationClick} className="relative p-1 hover:bg-gray-100 rounded-lg">
        <Bell className="w-5 h-5 text-gray-600" />
        {notificationCount>0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{notificationCount}</span>
        )}
      </button>
      <button onClick={()=>setPage('profile')} className="hover:opacity-80 transition">
        {profileSrc ? (
          <img src={profileSrc} alt="profile" className="w-8 h-8 rounded-full object-cover border border-orange-200" />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.slice(0,2).toUpperCase()}
          </div>
        )}
      </button>
    </div>
  </header>
);

// ─── NOTIFICATIONS PAGE ──────────────────────────────────────────────────────
const NotificationsPage = ({ user, onClose, onUpdateNotifCount }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/notifications/${user.email}`, {
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        onUpdateNotifCount?.();
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        onUpdateNotifCount?.();
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const icons = { like: '❤️', comment: '💬', message: '📨', invite: '👥' };

  return (
    <div className="fixed inset-0 bg-white z-[70] flex flex-col max-w-md mx-auto left-1/2 -translate-x-1/2">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
        <h2 className="font-semibold text-gray-900">Notifications</h2>
        <button onClick={markAllAsRead} className="text-sm text-orange-500 font-medium">Mark all read</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner/></div>
        ) : notifications.length===0 ? (
          <div className="text-center py-16"><Bell className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No notifications yet</p></div>
        ) : notifications.map(n => (
          <div key={n.id} onClick={()=>markAsRead(n.id)}
            className={`p-4 border-b border-gray-100 cursor-pointer flex items-start gap-3 ${n.read?'bg-white':'bg-orange-50'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${n.read?'bg-gray-100':'bg-orange-100'}`}>
              {icons[n.type]||'🔔'}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">{n.message}</p>
              <p className="text-xs text-gray-400 mt-0.5">{new Date(n.timestamp).toLocaleString()}</p>
            </div>
            {!n.read && <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"/>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── SHARE MODAL ────────────────────────────────────────────────────────────
const ShareModal = ({ post, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareText = `"${post.content?.substring(0,80)}..." — shared on ReadCrew 📚`;
  const shareUrl = `${window.location.origin}`;

  const whatsapp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText+'\n'+shareUrl)}`, '_blank');
  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[65] flex items-end max-w-md mx-auto left-1/2 -translate-x-1/2" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full p-5" onClick={e=>e.stopPropagation()}>
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4"/>
        <h3 className="font-semibold text-gray-900 mb-4">Share Post</h3>
        <div className="flex gap-4 mb-5">
          <button onClick={whatsapp} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center shadow-md">
              <span className="text-2xl">💬</span>
            </div>
            <span className="text-xs text-gray-600">WhatsApp</span>
          </button>
          <button onClick={copyLink} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center shadow-md">
              <Link2 className="w-6 h-6 text-white"/>
            </div>
            <span className="text-xs text-gray-600">Copy Link</span>
          </button>
          <button onClick={() => {
            if (navigator.share) navigator.share({ title:'ReadCrew Post', text: shareText, url: shareUrl });
          }} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center shadow-md">
              <Share2 className="w-6 h-6 text-white"/>
            </div>
            <span className="text-xs text-gray-600">More</span>
          </button>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200">
          <span className="flex-1 text-sm text-gray-500 truncate">{shareUrl}</span>
          <button onClick={copyLink}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition ${copied?'bg-green-500 text-white':'bg-orange-500 text-white hover:bg-orange-600'}`}>
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-3 py-3 text-gray-500 text-sm">Cancel</button>
      </div>
    </div>
  );
};

// ─── COMMENT SECTION (GLOBAL STORAGE) ───────────────────────────────────────
const CommentSection = ({ post, user, onClose, onUpdateNotifCount }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [likedComments, setLikedComments] = useState(new Set());
  const [postLiked, setPostLiked] = useState(false);
  const [postLikes, setPostLikes] = useState(post.likes || 0);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const inputRef = useRef();
  const listRef = useRef();

  useEffect(() => {
    fetchComments();
    fetchPostDetails();
    checkIfSaved();
  }, [post.id]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/social/posts/${post.id}/comments`, {
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const sortedComments = (data.comments || []).sort(
            (a,b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
          setComments(sortedComments);
        }
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPostDetails = async () => {
    try {
      const res = await fetch(`${API_URL}/api/social/posts/${post.id}`, {
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.post) {
          setPostLikes(data.post.likes || 0);
          setPostLiked(data.post.likedBy?.includes(user.email) || false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch post details:', error);
    }
  };

  const checkIfSaved = async () => {
    try {
      const res = await fetch(`${API_URL}/api/social/posts/${post.id}/saved/${user.email}`, {
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        setSaved(data.saved || false);
      }
    } catch (error) {
      console.error('Failed to check saved status:', error);
    }
  };

  const handleLikePost = async () => {
    if (postLiked) return;
    
    // Optimistic update
    setPostLiked(true);
    setPostLikes(l => l + 1);
    
    try {
      const res = await fetch(`${API_URL}/api/social/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, userName: user.name }),
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        setPostLikes(data.likes);
        if (post.userEmail !== user.email) {
          onUpdateNotifCount?.();
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      setPostLiked(false);
      setPostLikes(l => l - 1);
      console.error('Failed to like post:', error);
    }
  };

  const handleSave = async () => {
    const newSaved = !saved;
    setSaved(newSaved);
    
    try {
      await fetch(`${API_URL}/api/social/posts/${post.id}/save`, {
        method: newSaved ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email }),
        signal: AbortSignal.timeout(5000)
      });
    } catch (error) {
      // Revert on error
      setSaved(!newSaved);
      console.error('Failed to save/unsave post:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    const commentData = {
      id: Date.now().toString(), // temporary ID
      postId: post.id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      content: newComment.trim(),
      timestamp: new Date().toISOString(),
      parentId: replyTo?.id || null,
      likes: 0,
      likedBy: [],
      isAuthor: user.email === post.userEmail
    };
    
    // Optimistic update
    setComments(prev => [...prev, commentData]);
    setNewComment('');
    setReplyTo(null);
    setTimeout(() => listRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 50);
    
    try {
      const res = await fetch(`${API_URL}/api/social/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData),
        signal: AbortSignal.timeout(8000)
      });
      
      if (res.ok) {
        const data = await res.json();
        // Replace optimistic comment with server version
        setComments(prev => {
          const withoutOptimistic = prev.filter(x => x.id !== commentData.id);
          return [...withoutOptimistic, data.comment].sort(
            (a,b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
        });
        
        if (post.userEmail !== user.email) {
          onUpdateNotifCount?.();
        }
        if (replyTo && replyTo.userEmail !== user.email) {
          onUpdateNotifCount?.();
        }
      } else {
        // Remove optimistic comment on error
        setComments(prev => prev.filter(x => x.id !== commentData.id));
        setNewComment(commentData.content);
        setReplyTo(replyTo);
      }
    } catch (error) {
      // Remove optimistic comment on error
      setComments(prev => prev.filter(x => x.id !== commentData.id));
      setNewComment(commentData.content);
      setReplyTo(replyTo);
      console.error('Failed to post comment:', error);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (likedComments.has(commentId)) return;
    
    // Optimistic update
    setLikedComments(prev => new Set([...prev, commentId]));
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c
    ));
    
    try {
      const res = await fetch(`${API_URL}/api/social/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email }),
        signal: AbortSignal.timeout(5000)
      });
      
      if (!res.ok) {
        // Revert on error
        setLikedComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(commentId);
          return newSet;
        });
        setComments(prev => prev.map(c => 
          c.id === commentId ? { ...c, likes: Math.max(0, (c.likes || 0) - 1) } : c
        ));
      }
    } catch (error) {
      // Revert on error
      setLikedComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, likes: Math.max(0, (c.likes || 0) - 1) } : c
      ));
      console.error('Failed to like comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    // Optimistic update
    setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId));
    
    try {
      const res = await fetch(`${API_URL}/api/social/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email }),
        signal: AbortSignal.timeout(5000)
      });
      
      if (!res.ok) {
        // Revert on error - refetch comments
        fetchComments();
      }
    } catch (error) {
      // Revert on error - refetch comments
      fetchComments();
      console.error('Failed to delete comment:', error);
    }
  };

  const topLevel = comments.filter(c => !c.parentId);
  const totalCount = comments.length;

  const CommentItem = ({ comment, depth = 0 }) => {
    const replies = comments.filter(c => c.parentId === comment.id);
    const isLiked = likedComments.has(comment.id);
    const isOwn = comment.userId === user.id;
    const open = showReplies[comment.id];

    return (
      <div className={depth > 0 ? 'ml-11 mt-2' : 'mt-4'}>
        <div className="flex gap-2.5 group">
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {comment.userName?.slice(0,2).toUpperCase()}
            </div>
            {replies.length > 0 && open && <div className="w-px flex-1 bg-orange-200 mt-1"/>}
          </div>

          <div className="flex-1 min-w-0">
            <div className={`rounded-2xl rounded-tl-sm px-4 py-2.5 inline-block max-w-full ${comment.isAuthor ? 'bg-orange-50 border border-orange-100' : 'bg-white border border-gray-100'} shadow-sm`}>
              <div className="flex items-center flex-wrap gap-1.5 mb-0.5">
                <span className="font-bold text-sm text-gray-900">{comment.userName}</span>
                {comment.isAuthor && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-orange-500 text-white rounded-full font-medium">Author</span>
                )}
                <span className="text-[10px] text-gray-400">{new Date(comment.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
            </div>

            <div className="flex items-center gap-4 mt-1.5 ml-1">
              <button onClick={() => handleLikeComment(comment.id)} disabled={isLiked}
                className={`flex items-center gap-1 text-xs transition ${isLiked?'text-red-500':'text-gray-400 hover:text-red-400'}`}>
                <Heart className={`w-3.5 h-3.5 ${isLiked?'fill-red-500':''}`} />
                {comment.likes||0}
              </button>
              <button onClick={() => { setReplyTo(comment); inputRef.current?.focus(); }}
                className="text-xs text-gray-400 hover:text-orange-500 font-medium">Reply</button>
              {isOwn && (
                <button onClick={() => handleDeleteComment(comment.id)}
                  className="text-xs text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3 h-3"/>
                </button>
              )}
            </div>

            {replies.length > 0 && (
              <button onClick={() => setShowReplies(s => ({...s,[comment.id]:!s[comment.id]}))}
                className="flex items-center gap-1.5 text-xs text-orange-500 font-medium mt-1.5 ml-1">
                <div className="w-5 h-px bg-orange-300"/>
                {open ? 'Hide replies' : `View ${replies.length} ${replies.length===1?'reply':'replies'}`}
              </button>
            )}

            {open && replies.map(r => <CommentItem key={r.id} comment={r} depth={depth+1}/>)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[65] flex flex-col max-w-md mx-auto left-1/2 -translate-x-1/2" style={{background:'#F6F1EB'}}>
      {showShare && <ShareModal post={post} onClose={()=>setShowShare(false)}/>}

      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
        <div className="text-center">
          <h2 className="font-semibold text-gray-900">Comments</h2>
          <p className="text-xs text-gray-400">{totalCount} comment{totalCount!==1?'s':''}</p>
        </div>
        <div className="w-8"/>
      </div>

      <div className="bg-white mx-3 mt-3 rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-shrink-0">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="relative">
            {post.userPhoto ? (
              <img src={post.userPhoto} className="w-11 h-11 rounded-full object-cover" alt=""/>
            ) : (
              <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">
                {post.userName?.slice(0,2).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3}/>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">{post.userName}</span>
              {post.isAdmin && <span className="text-[10px] px-1.5 py-0.5 bg-orange-500 text-white rounded-full font-medium">Admin</span>}
              <span className="text-xs text-gray-400">{new Date(post.createdAt||Date.now()).toLocaleString()}</span>
            </div>
            {post.bookName && (
              <div className="flex items-center gap-1 mt-0.5">
                <BookOpen className="w-3 h-3 text-orange-400"/>
                <span className="text-xs text-gray-500">{post.bookName}</span>
              </div>
            )}
          </div>
        </div>

        <p className="px-4 pb-3 text-sm text-gray-700 leading-relaxed">{post.content}</p>
        {post.image && <img src={post.image} alt="" className="w-full max-h-48 object-cover"/>}

        <div className="flex items-center gap-0 border-t border-gray-100">
          <button onClick={handleLikePost} disabled={postLiked}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm transition ${postLiked?'text-red-500':'text-gray-500 hover:text-red-400'}`}>
            <Heart className={`w-4 h-4 ${postLiked?'fill-red-500':''}`}/>
            <span className="font-medium">{postLikes}</span>
          </button>
          <div className="w-px h-6 bg-gray-100"/>
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-gray-500">
            <MessageCircle className="w-4 h-4"/>
            <span className="font-medium">{totalCount}</span>
          </div>
          <div className="w-px h-6 bg-gray-100"/>
          <button onClick={handleSave}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm transition ${saved?'text-orange-500':'text-gray-500 hover:text-orange-400'}`}>
            <Bookmark className={`w-4 h-4 ${saved?'fill-orange-500':''}`}/>
            <span className="font-medium">Save</span>
          </button>
          <div className="w-px h-6 bg-gray-100"/>
          <button onClick={()=>setShowShare(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-gray-500 hover:text-orange-400 transition">
            <Share2 className="w-4 h-4"/>
            <span className="font-medium">Share</span>
          </button>
        </div>
      </div>

      <div className="bg-white mx-3 mt-2 rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-3">
          {user.profileImage ? (
            <img src={user.profileImage} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt=""/>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.slice(0,2).toUpperCase()}
            </div>
          )}
          <input
            ref={inputRef}
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSubmitComment();} }}
            placeholder={replyTo ? `Reply to ${replyTo.userName}…` : 'Write a comment…'}
            className="flex-1 text-sm text-gray-700 placeholder-gray-400 bg-transparent outline-none"
          />
          <button onClick={handleSubmitComment} disabled={!newComment.trim()}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition ${newComment.trim()?'bg-orange-500 text-white':'bg-gray-100 text-gray-400'}`}>
            Post
          </button>
        </div>
        {replyTo && (
          <div className="bg-orange-50 border-t border-orange-100 px-4 py-2 flex items-center justify-between">
            <p className="text-xs text-orange-700">Replying to <span className="font-semibold">{replyTo.userName}</span></p>
            <button onClick={()=>setReplyTo(null)}><X className="w-3.5 h-3.5 text-orange-400"/></button>
          </div>
        )}
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-3 pb-6">
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner/></div>
        ) : topLevel.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <MessageCircle className="w-7 h-7 text-orange-200"/>
            </div>
            <p className="text-sm text-gray-500">No comments yet. Start the conversation!</p>
          </div>
        ) : topLevel.map(c => <CommentItem key={c.id} comment={c}/>)}
      </div>
    </div>
  );
};

// ─── LOGIN PAGE ──────────────────────────────────────────────────────────────
const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [readingGoal, setReadingGoal] = useState({ yearly: 20, monthly: 2 });

  const handleSendOTP = async () => {
    if (!name.trim() || !validateEmail(email)) { alert('Please fill all fields correctly'); return; }
    setLoading(true);
    try {
      const result = await otpAPI.sendOTP({ name, email });
      if (result.success) { setShowOTP(true); alert('OTP sent to your email!'); }
      else alert(result.message || 'Failed to send OTP');
    } catch {
      // For development only - in production, this should not happen
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      alert(`Dev OTP would be: ${otp} (This is only for development)`);
    } finally { setLoading(false); }
  };

  const handleLogin = async () => {
    if (!validateEmail(email) || !password) { alert('Please fill all fields correctly'); return; }
    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(8000)
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        // Store only minimal session info locally
        ls.set('currentUser', data.user);
        ls.set('sessionToken', data.token);
        onLogin(data.user);
      } else {
        alert(data.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name.trim() || !validateEmail(email) || !password) {
      alert('Please fill all fields correctly');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          readingGoal
        }),
        signal: AbortSignal.timeout(8000)
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        ls.set('currentUser', data.user);
        ls.set('sessionToken', data.token);
        onLogin(data.user);
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showOTP) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-7 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Verify OTP</h2>
        <p className="text-center text-gray-500 text-sm mb-6">Enter the 6-digit code sent to <span className="font-semibold text-orange-500">{email}</span></p>
        <input type="text" value={otpInput} onChange={e=>setOtpInput(e.target.value.replace(/\D/g,'').slice(0,6))}
          className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none text-center text-3xl tracking-widest mb-6"
          placeholder="000000" maxLength="6" autoFocus />
        <button onClick={handleSignup} disabled={loading||otpInput.length!==6}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-50 shadow-lg">
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </button>
        <button onClick={()=>setShowOTP(false)} className="w-full mt-3 text-gray-500 hover:text-orange-500 flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4"/> Back
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" style={{fontFamily:"'Georgia',serif"}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">ReadCrew</h1>
          <p className="text-gray-500 text-sm mt-2">Read together, grow together.</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-7 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">{isLogin?'Welcome Back!':'Join the Crew'}</h2>
          <div className="space-y-4">
            {!isLogin && (
              <>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <User className="w-5 h-5 text-gray-400"/>
                  <input value={name} onChange={e=>setName(e.target.value)} className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm" placeholder="Full Name"/>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-orange-500"/> Reading Goals (Optional)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Yearly</label>
                      <input type="number" value={readingGoal.yearly} onChange={e=>setReadingGoal({...readingGoal,yearly:+e.targetValue})}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm" min="0" placeholder="20"/>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Monthly</label>
                      <input type="number" value={readingGoal.monthly} onChange={e=>setReadingGoal({...readingGoal,monthly:+e.targetValue})}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm" min="0" placeholder="2"/>
                    </div>
                  </div>
                </div>
              </>
            )}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
              <Mail className="w-5 h-5 text-gray-400"/>
              <input value={email} onChange={e=>setEmail(e.target.value)} className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm" placeholder="Email"/>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
              <Lock className="w-5 h-5 text-gray-400"/>
              <input value={password} onChange={e=>setPassword(e.target.value)} type={showPass?'text':'password'}
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm" placeholder="Password"/>
              <button onClick={()=>setShowPass(!showPass)}>{showPass?<EyeOff className="w-4 h-4 text-gray-400"/>:<Eye className="w-4 h-4 text-gray-400"/>}</button>
            </div>
          </div>
          <button
            onClick={isLogin ? handleLogin : handleSendOTP}
            className="w-full mt-5 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold text-base hover:shadow-xl transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Create Account')}
          </button>
          <p className="text-center text-sm text-gray-500 mt-4">
            {isLogin ? "New to ReadCrew? " : "Already have an account? "}
            <button onClick={()=>setIsLogin(!isLogin)} className="text-orange-500 font-semibold hover:underline">
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── HOME PAGE (GLOBAL STORAGE) ─────────────────────────────────────────────
const HomePage = ({ user, setPage, onUpdateNotifCount, profileSrc }) => {
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [trendPage, setTrendPage] = useState(1);
  const [hasMoreTrending, setHasMoreTrending] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedPosts, setFeedPosts] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedPage, setFeedPage] = useState(1);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const [loadingMoreFeed, setLoadingMoreFeed] = useState(false);
  const [showComments, setShowComments] = useState(null);
  const [showShare, setShowShare] = useState(null);
  const [showBookDetails, setShowBookDetails] = useState(null);
  const [bookDetails, setBookDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [userStats, setUserStats] = useState({ booksRead:0, reviewsGiven:0, postsCreated:0, crewsJoined:0 });
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [savedPosts, setSavedPosts] = useState(new Set());
  
  const feedSentinelRef = useRef();
  const loadingFeedRef = useRef(false);

  useEffect(() => {
    loadTrending(1);
    loadFeedPosts(1, false);
    fetchUserStats();
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!feedSentinelRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreFeed && !loadingFeedRef.current && !loadingMoreFeed) {
          loadFeedPosts(feedPage + 1, true);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    
    observer.observe(feedSentinelRef.current);
    return () => observer.disconnect();
  }, [hasMoreFeed, feedPage, loadingMoreFeed]);

  const fetchUserStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/${user.email}/stats`, {
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUserStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const loadTrending = async (page, append = false) => {
    if (page === 1) setLoadingTrending(true); else setLoadingMore(true);
    
    try {
      const res = await fetch(`${API_URL}/api/books/trending?page=${page}`, {
        signal: AbortSignal.timeout(8000)
      });
      const data = await res.json();
      
      if (data.success && data.books?.length) {
        setTrendingBooks(prev => append ? [...prev, ...data.books] : data.books);
        setHasMoreTrending(data.hasMore);
        setTrendPage(page);
      } else {
        setHasMoreTrending(false);
      }
    } catch (error) {
      console.error('Failed to load trending books:', error);
      setHasMoreTrending(false);
    } finally {
      setLoadingTrending(false);
      setLoadingMore(false);
    }
  };

  const loadFeedPosts = async (page = 1, append = false) => {
    if (loadingFeedRef.current) return;
    loadingFeedRef.current = true;
    
    if (append) {
      setLoadingMoreFeed(true);
    } else {
      setLoadingFeed(true);
    }
    
    try {
      const res = await fetch(`${API_URL}/api/social/posts?page=${page}&limit=10`, {
        signal: AbortSignal.timeout(8000)
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const newPosts = data.posts || [];
          setFeedPosts(prev => append ? [...prev, ...newPosts] : newPosts);
          setHasMoreFeed(data.hasMore || false);
          setFeedPage(page);
          
          // Check liked status for new posts
          const likedPromises = newPosts.map(post => 
            fetch(`${API_URL}/api/social/posts/${post.id}/liked/${user.email}`, {
              signal: AbortSignal.timeout(3000)
            })
          );
          
          const likedResults = await Promise.allSettled(likedPromises);
          const likedSet = new Set();
          
          for (let i = 0; i < likedResults.length; i++) {
            const result = likedResults[i];
            if (result.status === 'fulfilled' && result.value.ok) {
              const data = await result.value.json();
              if (data.liked) {
                likedSet.add(newPosts[i].id);
              }
            }
          }
          
          setLikedPosts(prev => new Set([...prev, ...likedSet]));
          
          // Check saved status
          const savedPromises = newPosts.map(post =>
            fetch(`${API_URL}/api/social/posts/${post.id}/saved/${user.email}`, {
              signal: AbortSignal.timeout(3000)
            })
          );
          
          const savedResults = await Promise.allSettled(savedPromises);
          const savedSet = new Set();
          
          for (let i = 0; i < savedResults.length; i++) {
            const result = savedResults[i];
            if (result.status === 'fulfilled' && result.value.ok) {
              const data = await result.value.json();
              if (data.saved) {
                savedSet.add(newPosts[i].id);
              }
            }
          }
          
          setSavedPosts(prev => new Set([...prev, ...savedSet]));
        }
      }
    } catch (error) {
      console.error('Failed to load feed posts:', error);
    } finally {
      setLoadingFeed(false);
      setLoadingMoreFeed(false);
      loadingFeedRef.current = false;
    }
  };

  const handleLikePost = async (post) => {
    if (likedPosts.has(post.id)) return;
    
    // Optimistic update
    setLikedPosts(prev => new Set([...prev, post.id]));
    setFeedPosts(prev => prev.map(p => 
      p.id === post.id ? { ...p, likes: (p.likes || 0) + 1 } : p
    ));
    
    try {
      const res = await fetch(`${API_URL}/api/social/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, userName: user.name }),
        signal: AbortSignal.timeout(5000)
      });
      
      if (res.ok) {
        const data = await res.json();
        // Update with actual like count from server
        setFeedPosts(prev => prev.map(p => 
          p.id === post.id ? { ...p, likes: data.likes } : p
        ));
        
        if (post.userEmail !== user.email) {
          onUpdateNotifCount?.();
        }
      } else {
        // Revert on error
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(post.id);
          return newSet;
        });
        setFeedPosts(prev => prev.map(p => 
          p.id === post.id ? { ...p, likes: Math.max(0, (p.likes || 0) - 1) } : p
        ));
      }
    } catch (error) {
      // Revert on error
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(post.id);
        return newSet;
      });
      setFeedPosts(prev => prev.map(p => 
        p.id === post.id ? { ...p, likes: Math.max(0, (p.likes || 0) - 1) } : p
      ));
      console.error('Failed to like post:', error);
    }
  };

  const handleSavePost = async (post) => {
    const isSaved = savedPosts.has(post.id);
    const newSaved = !isSaved;
    
    // Optimistic update
    if (newSaved) {
      setSavedPosts(prev => new Set([...prev, post.id]));
    } else {
      setSavedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(post.id);
        return newSet;
      });
    }
    
    try {
      await fetch(`${API_URL}/api/social/posts/${post.id}/save`, {
        method: newSaved ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email }),
        signal: AbortSignal.timeout(5000)
      });
    } catch (error) {
      // Revert on error
      if (newSaved) {
        setSavedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(post.id);
          return newSet;
        });
      } else {
        setSavedPosts(prev => new Set([...prev, post.id]));
      }
      console.error('Failed to save/unsave post:', error);
    }
  };

  const handleBookClick = async (book) => {
    setShowBookDetails(book);
    setLoadingDetails(true);
    
    try {
      const res = await fetch(`${API_URL}/api/books/book-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookName: book.title, author: book.author }),
        signal: AbortSignal.timeout(8000)
      });
      
      const data = await res.json();
      if (data.success) {
        setBookDetails(data.details);
      } else {
        setBookDetails({ description: `"${book.title}" by ${book.author} is a must-read.` });
      }
    } catch (error) {
      console.error('Failed to fetch book details:', error);
      setBookDetails({ description: `"${book.title}" by ${book.author} is a must-read.` });
    } finally {
      setLoadingDetails(false);
    }
  };

  const getCommentCount = (postId) => {
    // This would ideally come from the post object itself
    const post = feedPosts.find(p => p.id === postId);
    return post?.comments || 0;
  };

  const notifCount = 0; // This will be passed from parent

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <TopBar user={user} setPage={setPage} title="ReadCrew" profileSrc={profileSrc}
        onNotificationClick={() => setPage('notifications')} notificationCount={notifCount}/>

      {showComments && (
        <CommentSection post={showComments} user={user} onClose={()=>setShowComments(null)}
          onUpdateNotifCount={onUpdateNotifCount}/>
      )}
      {showShare && <ShareModal post={showShare} onClose={()=>setShowShare(null)}/>}
      {showBookDetails && (
        <div className="fixed inset-0 bg-black/50 z-[65] flex items-end max-w-md mx-auto left-1/2 -translate-x-1/2" onClick={()=>{setShowBookDetails(null);setBookDetails(null);}}>
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-4 mb-3"/>
            <div className="px-5 pb-6">
              <div className="flex gap-4 mb-4">
                <DynamicBookCover title={showBookDetails.title} author={showBookDetails.author} size="lg"/>
                <div className="flex-1">
                  <h2 className="font-bold text-gray-900 text-lg leading-tight">{showBookDetails.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">by {showBookDetails.author}</p>
                  <div className="flex items-center gap-1 mt-2"><StarRating rating={Math.round(showBookDetails.rating||4)}/><span className="text-sm text-gray-500 ml-1">{showBookDetails.rating||4.5}</span></div>
                  {showBookDetails.readers && <p className="text-xs text-gray-400 mt-1">{(showBookDetails.readers/1000).toFixed(1)}K readers</p>}
                </div>
              </div>
              {loadingDetails ? <div className="flex justify-center py-6"><LoadingSpinner/></div> : (
                bookDetails && <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">{bookDetails.description}</p>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={()=>{setShowBookDetails(null);setBookDetails(null);setPage('crews');}}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold">Create Crew</button>
                <button onClick={()=>{setShowBookDetails(null);setBookDetails(null);}}
                  className="px-4 py-3 border border-gray-200 rounded-xl text-gray-600 text-sm">Close</button>
              </div>
            </div>
          </div>
        </div>
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
              <BookOpen className="w-6 h-6 text-white"/>
            </div>
          </div>
          {user?.readingGoal?.yearly > 0 && (
            <div className="mt-4 bg-white/20 rounded-xl p-3">
              <div className="flex justify-between text-sm mb-2">
                <span>Yearly Goal</span>
                <span className="font-semibold">{userStats.booksRead||0}/{user.readingGoal.yearly} books</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full">
                <div className="h-full bg-white rounded-full" style={{width:`${Math.min((userStats.booksRead||0)/user.readingGoal.yearly*100, 100)}%`}}/>
              </div>
              <p className="text-right text-xs text-orange-100 mt-1">{Math.round((userStats.booksRead||0)/user.readingGoal.yearly*100)}%</p>
            </div>
          )}
          {(!user?.readingGoal?.yearly || user.readingGoal.yearly === 0) && (
            <button onClick={()=>setPage('profile')} className="mt-3 w-full bg-white/20 rounded-xl py-2 text-sm font-medium hover:bg-white/30 transition">
              Set Reading Goals →
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label:'Books', val:userStats.booksRead||0, icon:BookOpen, color:'text-blue-600', bg:'bg-blue-50', page:'profile' },
            { label:'Reviews', val:userStats.reviewsGiven||0, icon:Star, color:'text-purple-600', bg:'bg-purple-50', page:'reviews' },
            { label:'Posts', val:userStats.postsCreated||0, icon:Edit3, color:'text-green-600', bg:'bg-green-50', page:'post' },
            { label:'Crews', val:userStats.crewsJoined||0, icon:Users, color:'text-orange-600', bg:'bg-orange-50', page:'crews' },
          ].map(({ label,val,icon:Icon,color,bg,page })=>(
            <div key={label} onClick={()=>setPage(page)} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition">
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}><Icon className={`w-4 h-4 ${color}`}/></div>
              <p className="text-lg font-bold text-gray-900">{val}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Create Post Button */}
        <button onClick={()=>setPage('post')} className="w-full bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-center gap-3 hover:shadow-md transition">
          {profileSrc ? <img src={profileSrc} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt=""/> :
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{user?.name?.slice(0,2).toUpperCase()}</div>}
          <span className="text-gray-400 text-sm flex-1 text-left">Share your reading journey…</span>
          <span className="text-xs text-orange-500 font-medium bg-orange-50 px-3 py-1 rounded-full">Post</span>
        </button>

        {/* Community Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-orange-500"/>Community Feed</h2>
            <button onClick={()=>setPage('reviews')} className="text-sm text-orange-500 font-semibold">View All</button>
          </div>
          <div className="space-y-4">
            {loadingFeed ? (
              <div className="flex justify-center py-8"><LoadingSpinner/></div>
            ) : feedPosts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                <p className="text-gray-500">No posts yet. Be the first to share!</p>
                <button onClick={()=>setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Create Post</button>
              </div>
            ) : (
              <>
                {feedPosts.map((post) => {
                  const commentCount = getCommentCount(post.id);
                  const isLiked = likedPosts.has(post.id);
                  const isSaved = savedPosts.has(post.id);
                  
                  return (
                    <div key={post.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      {/* Post header */}
                      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                        <div className="relative">
                          {post.userPhoto ? (
                            <img src={post.userPhoto} alt="" className="w-10 h-10 rounded-full object-cover"/>
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {post.userName?.slice(0,2)||'U'}
                            </div>
                          )}
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3}/>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">{post.userName||'Anonymous'}</span>
                            <span className="text-xs text-gray-400">{new Date(post.createdAt||Date.now()).toLocaleString()}</span>
                          </div>
                          {post.bookName && <div className="flex items-center gap-1 mt-0.5"><BookOpen className="w-3 h-3 text-orange-400"/><span className="text-xs text-gray-500">{post.bookName}</span></div>}
                        </div>
                        <button className="p-1 hover:bg-gray-100 rounded-full"><MoreHorizontal className="w-4 h-4 text-gray-400"/></button>
                      </div>

                      {post.image && <img src={post.image} alt="" className="w-full max-h-56 object-cover"/>}
                      <p className="px-4 pb-3 text-sm text-gray-700 leading-relaxed">{post.story||post.content}</p>

                      {/* Interaction row */}
                      <div className="flex items-center border-t border-gray-100">
                        <button onClick={()=>handleLikePost(post)} disabled={isLiked}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm transition ${isLiked?'text-red-500':'text-gray-500 hover:text-red-400'}`}>
                          <Heart className={`w-4 h-4 ${isLiked?'fill-red-500':''}`}/><span>{post.likes||0}</span>
                        </button>
                        <div className="w-px h-6 bg-gray-100"/>
                        <button onClick={()=>setShowComments(post)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm text-gray-500 hover:text-orange-400 transition">
                          <MessageCircle className="w-4 h-4"/><span>{commentCount}</span>
                        </button>
                        <div className="w-px h-6 bg-gray-100"/>
                        <button onClick={()=>handleSavePost(post)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm transition ${isSaved?'text-orange-500':'text-gray-500 hover:text-orange-400'}`}>
                          <Bookmark className={`w-4 h-4 ${isSaved?'fill-orange-500':''}`}/><span>Save</span>
                        </button>
                        <div className="w-px h-6 bg-gray-100"/>
                        <button onClick={()=>setShowShare(post)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm text-gray-500 hover:text-orange-400 transition">
                          <Share2 className="w-4 h-4"/><span>Share</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {/* Infinite scroll sentinel */}
                <div ref={feedSentinelRef} className="py-2">
                  {loadingMoreFeed && (
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

        {/* Trending Books */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-orange-500"/>Trending Books</h2>
            <button onClick={()=>setPage('explore')} className="text-sm text-orange-500 font-semibold">Explore All</button>
          </div>
          {loadingTrending ? (
            <div className="flex justify-center py-8"><LoadingSpinner/></div>
          ) : (
            <>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {trendingBooks.map((book, i) => (
                  <div key={i} className="shrink-0 w-28 cursor-pointer hover:scale-105 transition-transform" onClick={()=>handleBookClick(book)}>
                    <DynamicBookCover title={book.title} author={book.author} size="md" className="mb-2"/>
                    <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{book.title}</p>
                    <p className="text-xs text-gray-500 truncate">{book.author}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400"/>
                      <span className="text-xs font-medium">{book.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
              {hasMoreTrending && (
                <button onClick={()=>loadTrending(trendPage+1,true)} disabled={loadingMore}
                  className="w-full mt-2 py-2.5 border border-orange-200 text-orange-500 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-orange-50 transition">
                  {loadingMore ? <><LoadingSpinner size="sm"/>Loading…</> : 'Load More Books'}
                </button>
              )}
            </>
          )}
        </div>

        {/* Your Crews */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-orange-500"/>Your Crews</h2>
            <button onClick={()=>setPage('crews')} className="text-sm text-orange-500 font-semibold">View All</button>
          </div>
          {(!user?.joinedCrews||user.joinedCrews.length===0) ? (
            <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
              <p className="text-gray-500 text-sm">No crews joined yet</p>
              <button onClick={()=>setPage('crews')} className="mt-2 text-orange-500 text-sm font-medium">Browse Crews →</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {user.joinedCrews.slice(0,4).map(crewId => {
                // This would need to fetch crew details from API
                // For now, we'll show a placeholder
                return (
                  <div key={crewId} onClick={()=>setPage('crews')} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition p-3">
                    <div className="w-full h-16 bg-orange-100 rounded-lg mb-2 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-orange-500"/>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">Loading...</p>
                    <p className="text-xs text-gray-500 mt-0.5">Your crew</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── EXPLORE PAGE ───────────────────────────────────────────────────────────
// (This component remains similar but with API calls for recommendations)
const ExplorePage = ({ user, setPage, onCreateCrew }) => {
  const [mode, setMode] = useState('chat');
  const [chatHistory, setChatHistory] = useState([
    { role:'assistant', content:"Hey! 👋 I'm Page Turner — tell me what you're in the mood for, and I'll find your perfect next read! 📚" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [allBooks, setAllBooks] = useState([]);
  const [bookPage, setBookPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sessionId] = useState(()=>`s_${Date.now()}`);
  const [lastQuery, setLastQuery] = useState('');
  const chatRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    chatRef.current?.scrollTo({ top: 99999, behavior:'smooth' });
  }, [chatHistory, loading, allBooks]);

  const sendChat = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setLastQuery(msg);
    setChatHistory(prev => [...prev, { role:'user', content: msg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/books/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, sessionId }),
        signal: AbortSignal.timeout(20000)
      });
      
      const data = await res.json();
      
      if (data.reply) {
        setChatHistory(prev => [...prev, { role:'assistant', content: data.reply }]);
      }
      
      if (data.hasRecommendations && data.recommendations?.length > 0) {
        setAllBooks(data.recommendations);
        setHasMore(true);
        setBookPage(1);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory(prev => [...prev, { 
        role:'assistant', 
        content: "I'm having trouble connecting right now. Please try again in a moment." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreBooks = async () => {
    if (loadingMore || !hasMore || !lastQuery) return;
    setLoadingMore(true);
    
    try {
      const nextPage = bookPage + 1;
      const res = await fetch(`${API_URL}/api/books/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: lastQuery, page: nextPage }),
        signal: AbortSignal.timeout(10000)
      });
      
      const data = await res.json();
      if (data.recommendations?.length) {
        const existingTitles = new Set(allBooks.map(b => b.title));
        const fresh = data.recommendations.filter(b => !existingTitles.has(b.title));
        setAllBooks(prev => [...prev, ...fresh]);
        setBookPage(nextPage);
        setHasMore(data.hasMore && nextPage < 5);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more books:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  if (mode === 'character') {
    // Character mode implementation (similar to before but with API calls)
    return (
      <div className="min-h-screen bg-[#FAF6F1] pb-24">
        <div className="sticky top-0 bg-white border-b border-[#EDE8E3] z-40 px-4 py-3 flex items-center gap-3">
          <button onClick={()=>setMode('chat')} className="p-2 hover:bg-gray-100 rounded-xl"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
          <span className="font-semibold text-gray-900">Find Books by Character</span>
        </div>
        <div className="px-4 py-5">
          <p className="text-sm text-gray-600">Character search coming soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] to-[#FAF6F1] pb-24">
      <div className="px-5 pt-10 pb-4">
        <h1 className="text-2xl font-bold text-[#2D1F14] mb-1" style={{fontFamily:'Georgia,serif'}}>What to read next?</h1>
        <p className="text-sm text-[#8B7968]">Chat with AI or find books by character</p>
      </div>
      <div className="flex gap-2 px-5 mb-4">
        <button onClick={()=>setMode('chat')} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-orange-500 text-white shadow">
          <Sparkles className="w-3.5 h-3.5"/> AI Chat
        </button>
        <button onClick={()=>setMode('character')} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-600 border border-gray-200 shadow-sm hover:border-orange-300 transition">
          🎭 By Character
        </button>
      </div>

      {/* Chat Window */}
      <div className="mx-5 bg-white/80 backdrop-blur rounded-3xl shadow-lg border border-[#EDE8E3] overflow-hidden">
        <div ref={chatRef} className="h-72 overflow-y-auto p-4 space-y-3">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role==='user'?'justify-end':'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role==='user' ? 'bg-[#C8622A] text-white rounded-br-sm' : 'bg-[#F6F0E8] text-[#3A2C25] rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#F6F0E8] rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1.5">
                  {[0,150,300].map(d => <div key={d} className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Chat Input */}
        <div className="border-t border-[#EDE8E3] px-3 py-2.5 flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat();} }}
            placeholder="Type a mood, genre, or ask anything…"
            className="flex-1 bg-[#FAF8F5] rounded-full px-4 py-2.5 text-sm text-[#2D1F14] outline-none border border-[#E8E0D8] focus:border-[#C8622A] transition"
          />
          <button onClick={sendChat} disabled={!input.trim()||loading}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition ${input.trim()&&!loading?'bg-[#C8622A] text-white hover:bg-[#B0521A]':'bg-gray-200 text-gray-400'}`}>
            <Send className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Books Display */}
      {allBooks.length > 0 && (
        <div className="px-5 mt-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Recommendations for you:</h3>
          {allBooks.map((book, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex gap-4">
                <DynamicBookCover title={book.title} author={book.author} size="md"/>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{book.title}</h4>
                  <p className="text-sm text-gray-500">by {book.author}</p>
                  {book.genre && <span className="inline-block mt-1 text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full">{book.genre}</span>}
                  {book.description && <p className="text-xs text-gray-600 mt-2">{book.description}</p>}
                  {book.reason && <p className="text-xs text-orange-600 mt-1 italic">"{book.reason}"</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={Math.round(book.rating||4)} size="xs"/>
                    <span className="text-xs font-medium">{book.rating}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={()=>{ onCreateCrew(book); setPage('crews'); }}
                  className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold">Create Crew</button>
                <button onClick={()=>onCreateCrew(book)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl"><UserPlus className="w-4 h-4 text-gray-600"/></button>
              </div>
            </div>
          ))}
          {hasMore && (
            <button onClick={loadMoreBooks} disabled={loadingMore}
              className="w-full py-3 border border-orange-200 text-orange-500 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-orange-50 transition">
              {loadingMore ? <><LoadingSpinner size="sm"/>Loading…</> : 'Load More Books'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── POST PAGE (GLOBAL STORAGE) ─────────────────────────────────────────────
const PostPage = ({ user, onPost, setPage }) => {
  const [content, setContent] = useState('');
  const [bookName, setBookName] = useState('');
  const [author, setAuthor] = useState('');
  const [image, setImage] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isDonation, setIsDonation] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const uploadImage = async (base64Image) => {
    try {
      const res = await fetch(`${API_URL}/api/upload/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
        signal: AbortSignal.timeout(15000)
      });
      const data = await res.json();
      return data.success ? data.imageUrl : null;
    } catch (error) {
      console.error('Image upload failed:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setUploading(true);
    
    let imageUrl = null;
    if (image) {
      imageUrl = await uploadImage(image);
    }
    
    const postData = {
      content,
      bookName,
      author,
      image: imageUrl,
      isPublic,
      type: isDonation ? 'donation' : 'post',
      userName: user.name,
      userEmail: user.email,
      userPhoto: user.profileImage || null,
      createdAt: new Date().toISOString()
    };
    
    onPost(postData);
    setPage('home');
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white z-[55] max-w-md mx-auto left-1/2 -translate-x-1/2">
      <div className="flex-shrink-0 sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={()=>setPage('home')} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-600"/></button>
        <h2 className="font-semibold text-gray-900">Create Post</h2>
        <button onClick={handleSubmit} disabled={!content.trim() || uploading}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">
          {uploading ? 'Uploading...' : 'Share'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
            {user?.name?.slice(0,2).toUpperCase()}
          </div>
          <textarea value={content} onChange={e=>setContent(e.target.value)}
            className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-base resize-none"
            placeholder={isDonation?'Share your book donation story…':'What are you reading?'} rows={5} autoFocus/>
        </div>
        <div className="space-y-3 mb-4">
          <input value={bookName} onChange={e=>setBookName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300" placeholder="Book name (optional)"/>
          <input value={author} onChange={e=>setAuthor(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300" placeholder="Author (optional)"/>
        </div>
        {image && (
          <div className="relative mb-4">
            <img src={image} alt="" className="w-full rounded-xl max-h-56 object-cover"/>
            <button onClick={()=>setImage(null)} className="absolute top-2 right-2 bg-black/50 rounded-full p-1"><X className="w-4 h-4 text-white"/></button>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <button onClick={()=>fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 hover:bg-gray-200 transition">
            <Camera className="w-4 h-4"/> Add Photo
          </button>
          <button onClick={()=>setIsDonation(!isDonation)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition ${isDonation?'bg-orange-500 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            <Gift className="w-4 h-4"/> Donation
          </button>
          <button onClick={()=>setIsPublic(!isPublic)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition ${!isPublic?'bg-gray-800 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {isPublic ? <Globe className="w-4 h-4"/> : <Lock className="w-4 h-4"/>}
            {isPublic ? 'Public' : 'Private'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e=>{ const f=e.target.files[0]; if(f){const r=new FileReader();r.onload=ev=>setImage(ev.target.result);r.readAsDataURL(f);} }}/>
      </div>
    </div>
  );
};

// ─── REVIEWS PAGE (GLOBAL STORAGE) ──────────────────────────────────────────
const ReviewsPage = ({ user, setPage, onUpdateNotifCount }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [likedReviews, setLikedReviews] = useState(new Set());
  const [form, setForm] = useState({ bookName:'', author:'', rating:5, review:'', sentiment:'positive' });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/social/reviews`, {
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReviews(data.reviews || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (review) => {
    if (likedReviews.has(review.id)) return;
    
    // Optimistic update
    setLikedReviews(prev => new Set([...prev, review.id]));
    setReviews(prev => prev.map(r => 
      r.id === review.id ? { ...r, likes: (r.likes || 0) + 1 } : r
    ));
    
    try {
      const res = await fetch(`${API_URL}/api/social/reviews/${review.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, userName: user.name }),
        signal: AbortSignal.timeout(5000)
      });
      
      if (res.ok && review.userEmail !== user.email) {
        onUpdateNotifCount?.();
      } else if (!res.ok) {
        // Revert on error
        setLikedReviews(prev => {
          const newSet = new Set(prev);
          newSet.delete(review.id);
          return newSet;
        });
        setReviews(prev => prev.map(r => 
          r.id === review.id ? { ...r, likes: Math.max(0, (r.likes || 0) - 1) } : r
        ));
      }
    } catch (error) {
      // Revert on error
      setLikedReviews(prev => {
        const newSet = new Set(prev);
        newSet.delete(review.id);
        return newSet;
      });
      setReviews(prev => prev.map(r => 
        r.id === review.id ? { ...r, likes: Math.max(0, (r.likes || 0) - 1) } : r
      ));
      console.error('Failed to like review:', error);
    }
  };

  const handleCreate = async () => {
    if (!form.bookName||!form.author||!form.review) { alert('Please fill all fields'); return; }
    
    const reviewData = {
      ...form,
      userName: user.name,
      userEmail: user.email,
      userPhoto: user.profileImage || null,
      createdAt: new Date().toISOString(),
      likes: 0
    };
    
    // Optimistic update
    const tempId = Date.now();
    const optimisticReview = { ...reviewData, id: tempId };
    setReviews(prev => [optimisticReview, ...prev]);
    setShowForm(false);
    setForm({ bookName:'', author:'', rating:5, review:'', sentiment:'positive' });
    
    try {
      const res = await fetch(`${API_URL}/api/social/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
        signal: AbortSignal.timeout(8000)
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Replace optimistic review with real one
          setReviews(prev => prev.map(r => 
            r.id === tempId ? data.review : r
          ));
        }
      } else {
        // Remove optimistic review on error
        setReviews(prev => prev.filter(r => r.id !== tempId));
      }
    } catch (error) {
      // Remove optimistic review on error
      setReviews(prev => prev.filter(r => r.id !== tempId));
      console.error('Failed to create review:', error);
    }
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <button onClick={()=>setPage('home')} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
        <h2 className="font-semibold text-gray-900">Book Reviews</h2>
        <button onClick={()=>setShowForm(!showForm)} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium">
          {showForm?'Cancel':'Write Review'}
        </button>
      </div>
      <div className="px-4 py-4">
        {showForm && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Write a Review</h3>
            <div className="space-y-3 mb-4">
              <input value={form.bookName} onChange={e=>setForm({...form,bookName:e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Book name"/>
              <input value={form.author} onChange={e=>setForm({...form,author:e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Author"/>
              <div><label className="text-xs text-gray-600 mb-1 block">Rating</label>
                <StarRating rating={form.rating} onChange={r=>setForm({...form,rating:r})} size="md"/></div>
              <textarea value={form.review} onChange={e=>setForm({...form,review:e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300 resize-none"
                placeholder="Write your review…" rows={4}/>
              <div className="flex gap-2">
                {['positive','negative'].map(s=>(
                  <button key={s} type="button" onClick={()=>setForm({...form,sentiment:s})}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${form.sentiment===s?(s==='positive'?'bg-green-500 text-white':'bg-red-500 text-white'):'bg-gray-100 text-gray-600'}`}>
                    {s==='positive'?'👍 Positive':'👎 Negative'}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleCreate} className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium">Submit Review</button>
          </div>
        )}
        {loading ? <div className="flex justify-center py-8"><LoadingSpinner/></div> :
          reviews.length===0 ? (
            <div className="text-center py-12"><Star className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No reviews yet. Be the first!</p></div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => {
                const isLiked = likedReviews.has(rev.id);
                return (
                  <div key={rev.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-start gap-3 mb-2">
                      <DynamicBookCover title={rev.bookName} author={rev.author} size="sm"/>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{rev.bookName}</h3>
                        <p className="text-xs text-gray-500">by {rev.author}</p>
                        <StarRating rating={rev.rating} size="xs"/>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{rev.review}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">{rev.userName?.slice(0,2)||'U'}</div>
                        <span className="text-xs text-gray-500">{rev.userName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={()=>handleLike(rev)} disabled={isLiked}
                          className={`flex items-center gap-1 text-xs transition ${isLiked?'text-red-500':'text-gray-400 hover:text-red-400'}`}>
                          <Heart className={`w-3.5 h-3.5 ${isLiked?'fill-red-500':''}`}/>{rev.likes||0}
                        </button>
                        <span className={`text-xs px-2 py-1 rounded-full ${rev.sentiment==='positive'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                          {rev.sentiment==='positive'?'👍':'👎'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
};

// ─── CREWS PAGE (GLOBAL STORAGE) ────────────────────────────────────────────
const CrewsPage = ({ user, setPage, onUpdateNotifCount }) => {
  const [view, setView] = useState('list');
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [crews, setCrews] = useState([]);
  const [joinedCrews, setJoinedCrews] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newCrew, setNewCrew] = useState({ name:'', author:'', genre:'' });
  const [selectedTab, setSelectedTab] = useState('chat');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef();
  const fileInputRef = useRef();

  useEffect(() => {
    fetchCrews();
    fetchUserJoinedCrews();
  }, []);

  useEffect(() => {
    if (selectedCrew) {
      fetchMessages(selectedCrew.id);
    }
  }, [selectedCrew]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  const fetchCrews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/social/crews`, {
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCrews(data.crews || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch crews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserJoinedCrews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/${user.email}/joined-crews`, {
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setJoinedCrews(data.joinedCrews || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch joined crews:', error);
    }
  };

  const fetchMessages = async (crewId) => {
    try {
      const res = await fetch(`${API_URL}/api/social/crews/${crewId}/messages`, {
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const isJoined = (crewId) => joinedCrews.includes(crewId);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''), 3000); };

  const joinCrew = async (crew) => {
    if (isJoined(crew.id)) return;
    
    // Optimistic update
    setJoinedCrews(prev => [...prev, crew.id]);
    
    try {
      const res = await fetch(`${API_URL}/api/social/crews/${crew.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, userName: user.name }),
        signal: AbortSignal.timeout(5000)
      });
      
      if (res.ok) {
        showToast(`🎉 Joined ${crew.name}!`);
        onUpdateNotifCount?.();
      } else {
        // Revert on error
        setJoinedCrews(prev => prev.filter(id => id !== crew.id));
      }
    } catch (error) {
      // Revert on error
      setJoinedCrews(prev => prev.filter(id => id !== crew.id));
      console.error('Failed to join crew:', error);
    }
  };

  const leaveCrew = async (crew) => {
    if (!window.confirm(`Leave ${crew.name}?`)) return;
    
    // Optimistic update
    setJoinedCrews(prev => prev.filter(id => id !== crew.id));
    
    if (selectedCrew?.id === crew.id) {
      setView('list');
      setSelectedCrew(null);
    }
    
    try {
      await fetch(`${API_URL}/api/social/crews/${crew.id}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email }),
        signal: AbortSignal.timeout(5000)
      });
      showToast(`Left ${crew.name}`);
    } catch (error) {
      // Revert on error
      setJoinedCrews(prev => [...prev, crew.id]);
      console.error('Failed to leave crew:', error);
    }
  };

  const createCrew = async () => {
    if (!newCrew.name||!newCrew.author) { alert('Please fill book name and author'); return; }
    
    const crewData = {
      ...newCrew,
      createdBy: user.email,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
      members: 1
    };
    
    try {
      const res = await fetch(`${API_URL}/api/social/crews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crewData),
        signal: AbortSignal.timeout(8000)
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCrews(prev => [data.crew, ...prev]);
          setJoinedCrews(prev => [...prev, data.crew.id]);
          setShowCreate(false);
          setNewCrew({ name:'', author:'', genre:'' });
          showToast('✅ Crew created!');
        }
      }
    } catch (error) {
      console.error('Failed to create crew:', error);
      alert('Failed to create crew. Please try again.');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()||!selectedCrew||!isJoined(selectedCrew.id)) return;
    
    const msgData = {
      userId: user.id,
      userName: user.name,
      userPhoto: user.profileImage || null,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'text'
    };
    
    // Optimistic update
    const tempMsg = { ...msgData, id: Date.now() };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    
    try {
      const res = await fetch(`${API_URL}/api/social/crews/${selectedCrew.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msgData),
        signal: AbortSignal.timeout(5000)
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Replace optimistic message with real one
          setMessages(prev => prev.map(m => 
            m.id === tempMsg.id ? data.message : m
          ));
          onUpdateNotifCount?.();
        }
      } else {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        setNewMessage(msgData.content);
      }
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setNewMessage(msgData.content);
      console.error('Failed to send message:', error);
    }
  };

  const sendImage = async (e) => {
    const file = e.target.files[0];
    if (!file||!selectedCrew||!isJoined(selectedCrew.id)) return;
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      
      // Upload image first
      try {
        const uploadRes = await fetch(`${API_URL}/api/upload/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
          signal: AbortSignal.timeout(15000)
        });
        
        const uploadData = await uploadRes.json();
        if (!uploadData.success) return;
        
        const msgData = {
          userId: user.id,
          userName: user.name,
          userPhoto: user.profileImage || null,
          content: uploadData.imageUrl,
          timestamp: new Date().toISOString(),
          type: 'image'
        };
        
        const res = await fetch(`${API_URL}/api/social/crews/${selectedCrew.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msgData),
          signal: AbortSignal.timeout(5000)
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setMessages(prev => [...prev, data.message]);
          }
        }
      } catch (error) {
        console.error('Failed to send image:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (ts) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff/60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h`;
    return date.toLocaleDateString();
  };

  if (view === 'chat' && selectedCrew) {
    const joined = isJoined(selectedCrew.id);
    
    return (
      <div className="fixed inset-0 flex flex-col z-[60] bg-[#e5ddd5] max-w-md mx-auto left-1/2 -translate-x-1/2">
        {toast && <div className="absolute top-4 left-4 right-4 bg-green-500 text-white text-center py-2.5 rounded-xl z-10 text-sm font-medium shadow-lg">{toast}</div>}

        <div className="flex-shrink-0 bg-[#075E54] px-4 py-3 flex items-center gap-3 shadow-md">
          <button onClick={()=>setView('detail')} className="p-1"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <DynamicBookCover title={selectedCrew.name} author={selectedCrew.author} size="xs" className="rounded-full!"/>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm truncate">{selectedCrew.name}</p>
            <p className="text-xs text-green-200">{joined?'Active crew':'Join to participate'}</p>
          </div>
          <button className="p-1"><MoreHorizontal className="w-5 h-5 text-white"/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {!joined ? (
            <div className="flex flex-col items-center justify-center h-full text-center bg-white/80 rounded-2xl p-8 mx-4">
              <Lock className="w-14 h-14 text-gray-400 mb-4"/>
              <p className="font-medium text-gray-700 mb-2">This chat is private</p>
              <p className="text-sm text-gray-500 mb-4">Join to read and send messages</p>
              <button onClick={()=>joinCrew(selectedCrew)} className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium shadow">Join Crew</button>
            </div>
          ) : (
            <>
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-white/60 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-7 h-7 text-gray-400"/>
                  </div>
                  <p className="text-gray-600 text-sm">No messages yet. Say hello! 👋</p>
                </div>
              )}
              {messages.map((msg, idx) => {
                const isOwn = msg.userId === user.id;
                const prevMsg = idx > 0 ? messages[idx-1] : null;
                const sameSender = prevMsg && prevMsg.userId === msg.userId;
                
                return (
                  <div key={msg.id} className={`flex mb-1 ${isOwn?'justify-end':'justify-start'}`}>
                    <div className={`flex max-w-[78%] items-end gap-1.5 ${isOwn?'flex-row-reverse':''}`}>
                      {!isOwn && (sameSender ? <div className="w-7 flex-shrink-0"/> : (
                        <div className="w-7 h-7 flex-shrink-0 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                          {msg.userName?.slice(0,2).toUpperCase()}
                        </div>
                      ))}
                      <div>
                        {!isOwn && !sameSender && <p className="text-xs text-[#075E54] mb-0.5 ml-1 font-medium">{msg.userName}</p>}
                        <div className={`rounded-2xl px-3.5 py-2 shadow-sm ${isOwn?'bg-[#dcf8c6] rounded-br-sm':'bg-white rounded-bl-sm'}`}>
                          {msg.type === 'image' ? (
                            <img src={msg.content} alt="" className="max-w-full rounded-xl max-h-52"/>
                          ) : (
                            <p className="text-sm text-gray-900 break-words leading-relaxed">{msg.content}</p>
                          )}
                          <p className="text-[10px] text-gray-400 text-right mt-0.5 leading-none">
                            {formatTime(msg.timestamp)}{isOwn && <span className="ml-1 text-blue-400">✓✓</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef}/>
            </>
          )}
        </div>

        {joined && (
          <div className="flex-shrink-0 bg-[#f0f0f0] border-t border-gray-200 px-3 py-2.5" style={{paddingBottom:'max(10px, env(safe-area-inset-bottom))'}}>
            <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow border border-gray-200">
              <button onClick={()=>fileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center hover:bg-orange-50 rounded-full transition flex-shrink-0">
                <Plus className="w-5 h-5 text-orange-500"/>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={sendImage}/>
              <input
                type="text"
                value={newMessage}
                onChange={e=>setNewMessage(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();} }}
                className="flex-1 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent min-w-0"
                placeholder="Type a message…"
              />
              <button onClick={sendMessage} disabled={!newMessage.trim()}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition flex-shrink-0 ${newMessage.trim()?'bg-[#075E54] text-white shadow':'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                <Send className="w-4 h-4"/>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'detail' && selectedCrew) {
    const joined = isJoined(selectedCrew.id);
    
    return (
      <div className="h-screen flex flex-col bg-white max-w-md mx-auto left-1/2 -translate-x-1/2">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-10 flex-shrink-0">
          <button onClick={()=>setView('list')} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
          <span className="font-semibold text-gray-900 flex-1">Crew Info</span>
          <button className="p-2 hover:bg-gray-100 rounded-full"><MoreHorizontal className="w-5 h-5 text-gray-600"/></button>
        </div>
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="bg-gradient-to-b from-orange-50 to-white px-4 pt-6 pb-4 flex flex-col items-center text-center">
            <DynamicBookCover title={selectedCrew.name} author={selectedCrew.author} size="xl" className="mb-4"/>
            <h1 className="text-2xl font-bold text-gray-900">{selectedCrew.name}</h1>
            <p className="text-gray-600">by {selectedCrew.author}</p>
            {selectedCrew.genre && <span className="mt-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">{selectedCrew.genre}</span>}
            <div className="flex gap-6 mt-4">
              <div className="text-center"><p className="text-xl font-bold text-gray-900">{selectedCrew.members||1}</p><p className="text-xs text-gray-500">Members</p></div>
              <div className="text-center"><p className="text-xl font-bold text-gray-900">{messages.length}</p><p className="text-xs text-gray-500">Messages</p></div>
            </div>
            <div className="flex gap-3 mt-5 w-full">
              {!joined ? (
                <button onClick={()=>joinCrew(selectedCrew)} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold">Join Crew</button>
              ) : (
                <button onClick={()=>setView('chat')} className="flex-1 py-3 bg-[#075E54] text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5"/> Open Chat
                </button>
              )}
              <button onClick={()=>{
                const email = window.prompt("Friend's email to invite:");
                if (email) {
                  // Send invite via backend
                  fetch(`${API_URL}/api/social/crews/${selectedCrew.id}/invite`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ inviterEmail: user.email, inviteeEmail: email })
                  }).then(() => alert('Invitation sent!')).catch(() => alert('Failed to send invitation'));
                }
              }} className="px-4 py-3 border border-gray-200 rounded-xl"><UserPlus className="w-5 h-5"/></button>
            </div>
          </div>

          <div className="flex border-b border-gray-200 px-4">
            {['chat','members','about'].map(t=>(
              <button key={t} onClick={()=>setSelectedTab(t)}
                className={`flex-1 py-3 text-sm font-medium border-b-2 capitalize transition ${selectedTab===t?'text-orange-500 border-orange-500':'text-gray-500 border-transparent'}`}>{t}</button>
            ))}
          </div>
          <div className="p-4 pb-20">
            {selectedTab==='chat' && (
              joined ? (
                <button onClick={()=>setView('chat')} className="w-full py-4 bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5"/> Open Chat ({messages.length} messages)
                </button>
              ) : <div className="text-center py-8"><Lock className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">Join to see messages</p></div>
            )}
            {selectedTab==='members' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">{selectedCrew.members||1} Members</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">{selectedCrew.createdByName?.slice(0,2)||'CR'}</div>
                  <div><p className="font-semibold text-gray-900">{selectedCrew.createdByName||'Creator'}</p><p className="text-xs text-gray-400">Creator</p></div>
                </div>
              </div>
            )}
            {selectedTab==='about' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600">A crew for readers of "{selectedCrew.name}" by {selectedCrew.author}. Join to share thoughts and connect with other readers.</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Created</span><span>{new Date(selectedCrew.createdAt||Date.now()).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Genre</span><span>{selectedCrew.genre||'General'}</span></div>
                </div>
                {joined && <button onClick={()=>leaveCrew(selectedCrew)} className="w-full py-3 border border-red-200 text-red-500 rounded-xl font-medium">Leave Crew</button>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {toast && <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-green-500 text-white text-center py-2.5 rounded-xl z-[100] text-sm font-medium shadow-lg">{toast}</div>}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <span className="font-bold text-gray-900" style={{fontFamily:'Georgia,serif'}}>Reading Crews</span>
        <button onClick={()=>setShowCreate(true)} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium">+ Create</button>
      </div>
      <div className="px-4 py-4">
        {showCreate && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Create New Crew</h3>
            <div className="space-y-3 mb-3">
              <input value={newCrew.name} onChange={e=>setNewCrew({...newCrew,name:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Book name"/>
              <input value={newCrew.author} onChange={e=>setNewCrew({...newCrew,author:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Author"/>
              <input value={newCrew.genre} onChange={e=>setNewCrew({...newCrew,genre:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Genre"/>
            </div>
            <div className="flex gap-2">
              <button onClick={createCrew} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">Create</button>
              <button onClick={()=>setShowCreate(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}

        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-orange-500"/>My Crews</h2>
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner/></div>
        ) : crews.filter(c=>joinedCrews.includes(c.id)).length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center border border-gray-200 mb-5">
            <p className="text-gray-500 text-sm">No crews joined yet</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {crews.filter(c=>joinedCrews.includes(c.id)).map(crew=>(
              <div key={crew.id} className="bg-white rounded-xl border border-green-200 shadow-sm cursor-pointer hover:shadow-md transition overflow-hidden"
                onClick={()=>{setSelectedCrew(crew);setView('detail');}}>
                <div className="flex items-center px-4 py-3 gap-4">
                  <DynamicBookCover title={crew.name} author={crew.author} size="sm"/>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{crew.name}</p>
                    <p className="text-xs text-gray-500">by {crew.author}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {crew.genre && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre}</span>}
                      <span className="text-xs text-gray-500">{crew.members||1} members</span>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Joined</span>
                </div>
                <div className="flex border-t border-gray-100 px-4 py-2 gap-2">
                  <button onClick={e=>{e.stopPropagation();setSelectedCrew(crew);setView('chat');}}
                    className="flex-1 py-1.5 bg-orange-100 text-orange-600 rounded-lg text-xs font-medium">💬 Chat</button>
                  <button onClick={e=>{e.stopPropagation();const em=window.prompt("Friend's email:");if(em){
                    fetch(`${API_URL}/api/social/crews/${crew.id}/invite`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ inviterEmail: user.email, inviteeEmail: em })
                    }).then(()=>alert('Invitation sent!')).catch(()=>alert('Failed to send invitation'));
                  }}} className="px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg text-xs font-medium">Invite</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-lg font-bold text-gray-900 mb-3">Discover Crews</h2>
        <div className="space-y-3">
          {crews.filter(c=>!joinedCrews.includes(c.id)).map(crew=>(
            <div key={crew.id} className="bg-white rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition overflow-hidden"
              onClick={()=>{setSelectedCrew(crew);setView('detail');}}>
              <div className="flex items-center px-4 py-3 gap-4">
                <DynamicBookCover title={crew.name} author={crew.author} size="sm"/>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{crew.name}</p>
                  <p className="text-xs text-gray-500">by {crew.author}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {crew.genre && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre}</span>}
                    <span className="text-xs text-gray-500">{crew.members||1} members</span>
                  </div>
                </div>
                <button onClick={e=>{e.stopPropagation();joinCrew(crew);}}
                  className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold">Join</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── PROFILE PAGE (GLOBAL STORAGE) ─────────────────────────────────────────
const ProfilePage = ({ user, posts, setPage, onLogout, onUpdateUser, profileSrc, setProfileSrc }) => {
  const [activeTab, setActiveTab] = useState('Posts');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name||'');
  const [editBio, setEditBio] = useState(user?.bio||'');
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [editGoal, setEditGoal] = useState(user?.readingGoal||{yearly:0,monthly:0});
  const [readingGoal, setReadingGoal] = useState(user?.readingGoal||{yearly:0,monthly:0});
  const [stats, setStats] = useState({booksRead:0,reviewsGiven:0,postsCreated:0,crewsJoined:0});
  const [myPosts, setMyPosts] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef();

  useEffect(() => {
    fetchUserData();
    fetchUserPosts();
    fetchUserReviews();
    fetchSavedPosts();
  }, [user.email]);

  const fetchUserData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/${user.email}`, {
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.user.stats || {booksRead:0,reviewsGiven:0,postsCreated:0,crewsJoined:0});
          setReadingGoal(data.user.readingGoal || {yearly:0,monthly:0});
          setEditGoal(data.user.readingGoal || {yearly:0,monthly:0});
          setEditName(data.user.name);
          setEditBio(data.user.bio || '');
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/social/posts/user/${user.email}`, {
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMyPosts(data.posts || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
    }
  };

  const fetchUserReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/social/reviews/user/${user.email}`, {
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMyReviews(data.reviews || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user reviews:', error);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/social/posts/saved/${user.email}`, {
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSavedPosts(data.posts || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      
      try {
        const res = await fetch(`${API_URL}/api/users/profile-photo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, photo: base64 }),
          signal: AbortSignal.timeout(15000)
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setProfileSrc(data.photoUrl);
            const updatedUser = { ...user, profileImage: data.photoUrl };
            onUpdateUser?.(updatedUser);
          }
        }
      } catch (error) {
        console.error('Failed to upload profile photo:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/${user.email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, bio: editBio }),
        signal: AbortSignal.timeout(5000)
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const updatedUser = { ...user, name: editName, bio: editBio };
          onUpdateUser?.(updatedUser);
          setShowEditProfile(false);
        }
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleSaveGoal = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/${user.email}/reading-goal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editGoal),
        signal: AbortSignal.timeout(5000)
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReadingGoal(editGoal);
          const updatedUser = { ...user, readingGoal: editGoal };
          onUpdateUser?.(updatedUser);
          setShowEditGoal(false);
        }
      }
    } catch (error) {
      console.error('Failed to update reading goal:', error);
    }
  };

  const progress = readingGoal.yearly > 0 ? Math.min((stats.booksRead||0)/readingGoal.yearly*100,100) : 0;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <span className="font-bold text-gray-900" style={{fontFamily:'Georgia,serif'}}>Profile</span>
        <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-lg"><LogOut className="w-5 h-5 text-gray-600"/></button>
      </div>

      <div className="px-4 py-5">
        <div className="flex items-start gap-4 mb-5">
          <div className="relative">
            {profileSrc ? (
              <img src={profileSrc} alt={user?.name} className="w-20 h-20 rounded-full object-cover border-2 border-orange-200"/>
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">{user?.name?.slice(0,2).toUpperCase()}</div>
            )}
            <button onClick={()=>fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white hover:bg-orange-600 transition shadow">
              <Camera className="w-3.5 h-3.5 text-white"/>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500">@{user?.name?.toLowerCase().replace(/\s/g,'')}</p>
            <p className="text-sm text-gray-600 mt-1 italic">{user?.bio||'"Reading is my superpower"'}</p>
            <button onClick={()=>setShowEditProfile(true)} className="mt-2 px-4 py-1.5 border border-orange-200 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition">Edit Profile</button>
          </div>
        </div>

        {showEditProfile && (
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Edit Profile</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Display Name</label>
                <input value={editName} onChange={e=>setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm bg-white"/>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Bio</label>
                <textarea value={editBio} onChange={e=>setEditBio(e.target.value)} rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm resize-none bg-white"
                  placeholder="Tell us about yourself…"/>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveProfile} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">Save Changes</button>
                <button onClick={()=>setShowEditProfile(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><Target className="w-4 h-4 text-orange-500"/><h3 className="font-semibold text-gray-900">Reading Goal {new Date().getFullYear()}</h3></div>
            <button onClick={()=>setShowEditGoal(!showEditGoal)} className="text-sm text-orange-500 font-medium">{showEditGoal?'Cancel':'Edit'}</button>
          </div>
          {showEditGoal ? (
            <div className="space-y-2 mt-2">
              <input type="number" value={editGoal.yearly} onChange={e=>setEditGoal({...editGoal,yearly:+e.target.value})} min="0"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm bg-white" placeholder="Yearly goal (books)"/>
              <input type="number" value={editGoal.monthly} onChange={e=>setEditGoal({...editGoal,monthly:+e.target.value})} min="0"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm bg-white" placeholder="Monthly goal (books)"/>
              <button onClick={handleSaveGoal} className="w-full py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">Save Goal</button>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold">{readingGoal.yearly>0 ? `${stats.booksRead||0}/${readingGoal.yearly} books` : 'No goal set'}</span>
              </div>
              {readingGoal.yearly>0 && (
                <><div className="h-2 bg-orange-200 rounded-full"><div className="h-full bg-orange-500 rounded-full" style={{width:`${progress}%`}}/></div>
                <p className="text-right text-xs text-gray-500 mt-1">{Math.round(progress)}%</p></>
              )}
              {readingGoal.yearly===0 && <button onClick={()=>setShowEditGoal(true)} className="w-full mt-1 py-2 border border-orange-200 text-orange-500 rounded-lg text-sm">Set a Goal</button>}
            </>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 bg-white rounded-xl p-3 border border-gray-200 mb-5">
          {[
            {label:'Books',val:stats.booksRead||0,icon:BookOpen,color:'text-blue-600'},
            {label:'Reviews',val:stats.reviewsGiven||0,icon:Star,color:'text-purple-600'},
            {label:'Posts',val:stats.postsCreated||0,icon:Edit3,color:'text-green-600'},
            {label:'Crews',val:stats.crewsJoined||0,icon:Users,color:'text-orange-600'}
          ].map(({label,val,icon:I,color})=>(
            <div key={label} className="text-center"><I className={`w-5 h-5 ${color} mx-auto mb-1`}/><p className="text-lg font-bold text-gray-900">{val}</p><p className="text-xs text-gray-500">{label}</p></div>
          ))}
        </div>

        <div className="flex border-b border-gray-200 mb-4">
          {['Posts','Reviews','Saved'].map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)}
              className={`flex-1 text-sm pb-2.5 font-medium border-b-2 transition ${activeTab===t?'text-orange-500 border-orange-500':'text-gray-500 border-transparent'}`}>{t}</button>
          ))}
        </div>

        {activeTab === 'Posts' && (myPosts.length === 0 ? (
          <div className="text-center py-8"><Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No posts yet</p><button onClick={()=>setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Create Post</button></div>
        ) : <div className="space-y-4">{myPosts.map(p=>(
          <div key={p.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-700">{p.content}</p>
            {p.image && <img src={p.image} alt="" className="w-full rounded-xl mt-2 max-h-48 object-cover"/>}
            <div className="flex gap-4 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5"/>{p.likes||0}</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5"/>{p.comments||0}</span>
            </div>
          </div>
        ))}</div>)}

        {activeTab === 'Reviews' && (myReviews.length === 0 ? (
          <div className="text-center py-8"><Star className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No reviews yet</p><button onClick={()=>setPage('reviews')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Write Review</button></div>
        ) : <div className="space-y-4">{myReviews.map(r=>(
          <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-start gap-3 mb-2">
              <DynamicBookCover title={r.bookName} author={r.author} size="sm"/>
              <div className="flex-1"><h3 className="font-semibold text-gray-900 text-sm">{r.bookName}</h3><p className="text-xs text-gray-500">by {r.author}</p><StarRating rating={r.rating} size="xs"/></div>
            </div>
            <p className="text-sm text-gray-700 mb-2">{r.review}</p>
            <span className={`text-xs px-2 py-1 rounded-full ${r.sentiment==='positive'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{r.sentiment==='positive'?'👍':'👎'}</span>
          </div>
        ))}</div>)}

        {activeTab === 'Saved' && (loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner/></div>
        ) : savedPosts.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
            <p className="text-gray-500 text-sm">No saved posts yet</p>
            <p className="text-xs text-gray-400 mt-1">Tap the Save button on any post to bookmark it here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedPosts.map(p => (
              <div key={p.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {p.userName?.slice(0,2)||'U'}
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-sm text-gray-900">{p.userName}</span>
                    {p.bookName && <div className="flex items-center gap-1 mt-0.5"><BookOpen className="w-3 h-3 text-orange-400"/><span className="text-xs text-gray-500">{p.bookName}</span></div>}
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{p.story||p.content}</p>
                {p.image && <img src={p.image} alt="" className="w-full rounded-xl mt-2 max-h-48 object-cover"/>}
                <div className="flex items-center gap-3 pt-2 mt-2 border-t border-gray-100 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5"/>{p.likes||0}</span>
                  <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                  <span className="ml-auto px-2 py-0.5 bg-orange-50 text-orange-500 rounded-full font-medium">Saved</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('home');
  const [notifCount, setNotifCount] = useState(0);
  const [profileSrc, setProfileSrc] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);

  // PostPage + notifications page hide BottomNav
  const hideBottomNav = page === 'post' || page === 'notifications';

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('sessionToken');
    
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setSessionToken(savedToken);
        setIsLoggedIn(true);
        
        const img = localStorage.getItem(`user_${parsedUser.email}_profile_image`);
        if (img) setProfileSrc(img);
        
        // Validate session with server
        validateSession(parsedUser.email, savedToken);
        countNotifs(parsedUser.email);
      } catch (err) {
        console.error('Failed to restore session:', err);
      }
    }
  }, []);

  const validateSession = async (email, token) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
        signal: AbortSignal.timeout(5000)
      });
      
      const data = await res.json();
      if (!data.success) {
        // Session expired, log out
        handleLogout();
      }
    } catch (error) {
      console.error('Session validation failed:', error);
    }
  };

  // Real-time notification polling
  useEffect(() => {
    if (!user?.email) return;
    
    const interval = setInterval(() => {
      countNotifs(user.email);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [user?.email]);

  const countNotifs = async (email) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${email}/unread-count`, {
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        setNotifCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  };

  const updateNotifCount = useCallback(() => {
    if (user?.email) countNotifs(user.email);
  }, [user?.email]);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setPage('home');
    
    const img = localStorage.getItem(`user_${userData.email}_profile_image`);
    if (img) setProfileSrc(img);
    
    countNotifs(userData.email);
  };

  const handlePost = async (postData) => {
    try {
      const res = await fetch(`${API_URL}/api/social/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
        signal: AbortSignal.timeout(8000)
      });
      
      if (res.ok) {
        setPage('home');
        updateNotifCount();
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  const handleCreateCrew = (book) => {
    setPage('crews');
    // The actual crew creation will happen in the CrewsPage
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setProfileSrc(null);
    setSessionToken(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('sessionToken');
    setPage('home');
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen max-w-md mx-auto">
      <LoginPage onLogin={handleLogin}/>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto relative">
        {page === 'home' && (
          <HomePage 
            user={user} 
            setPage={setPage} 
            onUpdateNotifCount={updateNotifCount} 
            profileSrc={profileSrc}
          />
        )}
        {page === 'explore' && (
          <ExplorePage 
            user={user} 
            setPage={setPage} 
            onCreateCrew={handleCreateCrew}
          />
        )}
        {page === 'post' && (
          <PostPage 
            user={user} 
            onPost={handlePost} 
            setPage={setPage}
          />
        )}
        {page === 'crews' && (
          <CrewsPage 
            user={user} 
            setPage={setPage} 
            onUpdateNotifCount={updateNotifCount}
          />
        )}
        {page === 'reviews' && (
          <ReviewsPage 
            user={user} 
            setPage={setPage} 
            onUpdateNotifCount={updateNotifCount}
          />
        )}
        {page === 'profile' && (
          <ProfilePage 
            user={user} 
            posts={[]} 
            setPage={setPage} 
            onLogout={handleLogout} 
            onUpdateUser={handleUpdateUser} 
            profileSrc={profileSrc} 
            setProfileSrc={setProfileSrc}
          />
        )}
        {page === 'notifications' && (
          <NotificationsPage 
            user={user} 
            onClose={() => {
              setPage('home');
              countNotifs(user.email);
            }} 
            onUpdateNotifCount={updateNotifCount}
          />
        )}
        <BottomNav 
          active={page} 
          setPage={setPage} 
          unreadCount={notifCount} 
          show={!hideBottomNav}
        />
      </div>
    </div>
  );
}