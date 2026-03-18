// App.jsx — ReadCrew · ALL BUGS FIXED
//
// ══════════════════════════════════════════════════════════════════════════════
//  BUGS FIXED:
//  1. Posts disappearing (now uses localStorage + syncs to server)
//  2. Likes showing 0 (uses server likedBy array, email-based keys)
//  3. Notifications never arrived (polling + BroadcastChannel + socket.io)
//  4. Comment indent mess (capped at 3 visual levels with MAX_DEPTH=2)
//  5. Comments always visible (hidden by default, loads on demand)
// ══════════════════════════════════════════════════════════════════════════════

import React, {
  useState, useEffect, useRef, useCallback, memo,
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
} from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'https://versal-book-app.onrender.com';

// ─── SOCKET ──────────────────────────────────────────────────────────────────
const socket = io(API_URL, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  autoConnect: true,
});

// ─── BroadcastChannel for cross-tab notifications ────────────────────────────
let _bc = null;
try { _bc = new BroadcastChannel('rc_notif'); } catch { /* ignore */ }
const broadcastNotif = (targetEmail, notif) => {
  try { _bc?.postMessage({ targetEmail, notif }); } catch { /* ignore */ }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const MAX_DEPTH = 2; // 3 visual levels: 0 → 1 → 2

// ═══════════════════════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const formatTimeAgo = (ts) => {
  if (!ts) return '';
  const d = Date.now() - new Date(ts).getTime();
  const m = Math.floor(d / 60000);
  const h = Math.floor(d / 3600000);
  const dy = Math.floor(d / 86400000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (dy < 7) return `${dy}d ago`;
  if (dy < 30) return `${Math.floor(dy / 7)}w ago`;
  if (dy < 365) return `${Math.floor(dy / 30)}mo ago`;
  return `${Math.floor(dy / 365)}y ago`;
};

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const sanitize = (t) => {
  if (!t) return '';
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
          .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
};
const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2,9)}`;

// ─── localStorage keys (ALL use email, never user.id) ───────────────────────
const lpKey = (email) => `rc_lp_${email}`;        // liked posts
const lcKey = (email) => `rc_lc_${email}`;        // liked comments
const spKey = (email) => `rc_sp_${email}`;        // saved posts
const notifKey = (email) => `rc_notif_${email}`;  // notifications

// ─── push a notification into localStorage + BroadcastChannel ─────────────────
const storeNotif = (targetEmail, notif) => {
  if (!targetEmail) return;
  const full = { id: genId(), ...notif, timestamp: new Date().toISOString(), read: false };
  const list = JSON.parse(localStorage.getItem(notifKey(targetEmail)) || '[]');
  list.unshift(full);
  if (list.length > 150) list.length = 150;
  localStorage.setItem(notifKey(targetEmail), JSON.stringify(list));
  broadcastNotif(targetEmail, full);
  window.dispatchEvent(new CustomEvent('rc:notif', { detail: { targetEmail } }));
};

// ═══════════════════════════════════════════════════════════════════════════════
//  TINY SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const Spin = ({ size = 'md', full = false }) => {
  const sz = { sm:'w-4 h-4', md:'w-8 h-8', lg:'w-12 h-12', xl:'w-16 h-16' }[size];
  if (full) return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className={`${sz} border-4 border-t-transparent border-orange-500 rounded-full animate-spin`} />
    </div>
  );
  return <div className={`${sz} border-4 border-t-transparent border-orange-500 rounded-full animate-spin`} />;
};

const StarRating = ({ rating=0, onChange, size='sm', readonly=false }) => {
  const sz = size==='xs'?'w-3 h-3':size==='sm'?'w-4 h-4':'w-6 h-6';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i=>(
        <Star key={i}
          className={`${sz} ${i<=rating?'fill-amber-400 text-amber-400':'text-gray-300'} ${onChange&&!readonly?'cursor-pointer hover:scale-110 transition':''}` }
          onClick={()=>onChange?.(i)} />
      ))}
    </div>
  );
};

const Avatar = ({ initials, size='md', src, online, onClick }) => {
  const sz = { xs:'w-7 h-7 text-xs', sm:'w-9 h-9 text-sm', md:'w-11 h-11 text-base', lg:'w-16 h-16 text-xl', xl:'w-20 h-20 text-2xl' }[size];
  const gradients = [
    'from-orange-500 to-red-500',
    'from-blue-500 to-purple-500',
    'from-green-500 to-teal-500',
    'from-purple-500 to-pink-500',
    'from-yellow-500 to-orange-500',
    'from-indigo-500 to-blue-500'
  ];
  const gradient = gradients[(initials||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0) % gradients.length];
  return (
    <div className="relative shrink-0 cursor-pointer" onClick={onClick}>
      {src
        ? <img src={src} alt="" className={`${sz} rounded-full object-cover border-2 border-orange-200 hover:border-orange-400 transition`} />
        : <div className={`${sz} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-semibold text-white shadow-md`}>
            {(initials||'??').slice(0,2).toUpperCase()}
          </div>
      }
      {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  DYNAMIC BOOK COVER
// ═══════════════════════════════════════════════════════════════════════════════

const DynamicBookCover = ({ title, author, size='md', onClick }) => {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const sizeMap = { xs:'w-12 h-16', sm:'w-16 h-20', md:'w-24 h-32', lg:'w-32 h-40', xl:'w-40 h-48' };
  const cls = sizeMap[size] || sizeMap.md;

  useEffect(()=>{
    if(!title){ setErr(true); setLoading(false); return; }
    let dead = false;
    (async()=>{
      try{
        const query = encodeURIComponent(author ? `${title} ${author}` : title);
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&projection=lite`,
          { signal: AbortSignal.timeout(5000) }
        );
        if(res.ok && !dead){
          const data = await res.json();
          const links = data.items?.[0]?.volumeInfo?.imageLinks;
          if(links){
            const raw = links.extraLarge || links.large || links.medium || links.thumbnail;
            if(raw){
              setUrl(raw.replace('http:','https:').replace('&edge=curl',''));
              setLoading(false);
              return;
            }
          }
        }
      }catch{/* fall through */}
      
      try{
        const res = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=1`,
          { signal: AbortSignal.timeout(4000) }
        );
        if(res.ok && !dead){
          const data = await res.json();
          const book = data.docs?.[0];
          if(book?.cover_i){
            setUrl(`https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`);
            setLoading(false);
            return;
          }
        }
      }catch{/* fall through */}
      
      if(!dead){ setErr(true); setLoading(false); }
    })();
    return () => { dead = true; };
  },[title,author]);

  const palette = ['#7B9EA6','#C8622A','#8B5E3C','#2C3E50','#E74C3C','#3498DB','#9B59B6','#1ABC9C','#27AE60','#F39C12'];
  const bgColor = palette[(title||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0) % palette.length];

  if(loading) return (
    <div className={`${cls} bg-gray-200 rounded-xl animate-pulse flex items-center justify-center`} onClick={onClick}>
      <BookOpen className="w-6 h-6 text-gray-400"/>
    </div>
  );
  
  if(err||!url) return (
    <div
      className={`${cls} rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg cursor-pointer`}
      style={{backgroundColor: bgColor}}
      onClick={onClick}
    >
      <span className="text-xl">{(title||'BK').slice(0,2).toUpperCase()}</span>
      <BookOpen className="w-4 h-4 mt-1 opacity-60"/>
    </div>
  );
  
  return (
    <div className={`${cls} rounded-xl overflow-hidden bg-gray-100 cursor-pointer group`} onClick={onClick}>
      <img
        src={url}
        alt=""
        className="w-full h-full object-cover shadow-lg group-hover:scale-105 transition-transform"
        onError={()=>{ setUrl(null); setErr(true); }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  NOTIFICATION TOAST
// ═══════════════════════════════════════════════════════════════════════════════

const NotifToast = ({ notif, onClose }) => {
  useEffect(()=>{ const t = setTimeout(onClose, 5000); return ()=> clearTimeout(t); },[onClose]);
  
  const icons = {
    like: <Heart className="w-5 h-5 text-red-500"/>,
    comment: <MessageCircle className="w-5 h-5 text-blue-500"/>,
    mention: <AtSign className="w-5 h-5 text-amber-500"/>,
    reshare: <Repeat className="w-5 h-5 text-indigo-500"/>,
    follow: <UserCheck className="w-5 h-5 text-green-500"/>,
    invite: <UserPlus className="w-5 h-5 text-purple-500"/>,
    message: <MessageSquare className="w-5 h-5 text-emerald-500"/>,
    review: <Star className="w-5 h-5 text-yellow-500"/>,
    info: <Info className="w-5 h-5 text-blue-500"/>
  };
  
  return (
    <div className="fixed top-20 left-1/2 z-[200] w-[90%] max-w-sm animate-slideDown" style={{transform:'translateX(-50%)'}}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            {icons[notif.type] || <Bell className="w-5 h-5 text-gray-500"/>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 font-medium leading-snug">{notif.message}</p>
            <p className="text-xs text-gray-500 mt-1">{new Date(notif.timestamp).toLocaleTimeString()}</p>
          </div>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600"/>
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  BOOK DETAILS MODAL
// ═══════════════════════════════════════════════════════════════════════════════

const BookDetailsModal = ({ book, onClose, onCreateCrew }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(()=>{
    (async()=>{
      try{
        const query = encodeURIComponent(`${book.title} ${book.author||''}`);
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`);
        if(res.ok){
          const data = await res.json();
          const v = data.items?.[0]?.volumeInfo;
          if(v) setDetails({
            title: v.title,
            subtitle: v.subtitle,
            author: v.authors?.join(', ') || book.author,
            description: v.description || '',
            pages: v.pageCount,
            publishedDate: v.publishedDate,
            publisher: v.publisher,
            rating: v.averageRating,
            ratingsCount: v.ratingsCount,
            previewLink: v.previewLink,
          });
        }
      }catch{} finally { setLoading(false); }
    })();
  },[book]);
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h3 className="font-bold text-lg">Book Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Spin size="lg"/></div>
        ) : details ? (
          <div className="p-4 space-y-4">
            <div className="flex gap-4">
              <DynamicBookCover title={book.title} author={book.author} size="lg"/>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{details.title}</h2>
                {details.subtitle && <p className="text-sm text-gray-500 mt-1">{details.subtitle}</p>}
                <p className="text-gray-500 text-sm">by {details.author}</p>
                {details.rating && (
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={Math.round(details.rating)} size="xs" readonly/>
                    <span className="text-xs text-gray-500">{details.rating.toFixed(1)} ({details.ratingsCount||0})</span>
                  </div>
                )}
              </div>
            </div>
            {details.description && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {details.description.replace(/<[^>]*>/g,'').substring(0,400)}...
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {details.pages && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-gray-400 text-xs">Pages</p>
                  <p className="font-semibold">{details.pages}</p>
                </div>
              )}
              {details.publishedDate && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-gray-400 text-xs">Published</p>
                  <p className="font-semibold">{new Date(details.publishedDate).getFullYear()}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={()=>{ onCreateCrew(book); onClose(); }}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4"/>Create Crew
              </button>
              {details.previewLink && (
                <a href={details.previewLink} target="_blank" rel="noopener noreferrer" className="px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                  <ExternalLink className="w-5 h-5"/>
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
            <p className="text-gray-500">No details available</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  SHARE / RESHARE MODALS
// ═══════════════════════════════════════════════════════════════════════════════

const ShareModal = ({ post, onClose }) => {
  const url = window.location.href;
  const text = `"${post.content?.substring(0,80)}" — ${post.userName} on ReadCrew`;
  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="bg-white rounded-t-2xl w-full p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Share Post</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            ['WhatsApp','#25D366',()=>window.open(`https://wa.me/?text=${encodeURIComponent(text+' '+url)}`)],
            ['Facebook','#1877F2',()=>window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)],
            ['Twitter','#1DA1F2',()=>window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`)]
          ].map(([label, color, action]) => (
            <button key={label} onClick={action} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full text-white font-bold text-lg flex items-center justify-center" style={{backgroundColor:color}}>
                {label[0]}
              </div>
              <span className="text-xs text-gray-600">{label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={()=>{ navigator.clipboard.writeText(url); alert('Link copied!'); }}
          className="w-full py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50"
        >
          <Link2 className="w-5 h-5 text-orange-500"/>Copy Link
        </button>
      </div>
    </div>
  );
};

const ReshareModal = ({ post, onClose, onReshare }) => {
  const [comment, setComment] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="bg-white rounded-t-2xl w-full p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Reshare Post</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
        </div>
        <textarea
          value={comment}
          onChange={e=>setComment(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 resize-none mb-3"
          placeholder="Add a comment (optional)"
          rows={3}
        />
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1">
            Original by <span className="font-semibold">{post.userName}</span>
          </p>
          <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
        </div>
        <button
          onClick={()=>{ onReshare(post,comment); onClose(); }}
          className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          <Repeat className="w-4 h-4"/>Reshare
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  POST OPTIONS MODAL
// ═══════════════════════════════════════════════════════════════════════════════

const PostOptionsModal = ({ post, user, onClose, onReshare, onSave, isSaved, onDelete, isOwner, onFollow, isFollowing, onBlock, isBlocked }) => {
  const options = [
    { id:'save', icon:Bookmark, label:isSaved?'Unsave':'Save', color:isSaved?'text-orange-500':'text-gray-700', action:()=>onSave(post) },
    { id:'reshare', icon:Repeat, label:'Reshare', color:'text-blue-600', action:()=>onReshare(post) },
  ];
  
  if(!isOwner){
    options.push({
      id:'follow',
      icon:isFollowing ? UserMinus : UserPlus,
      label:isFollowing ? 'Unfollow' : 'Follow',
      color:isFollowing ? 'text-red-500' : 'text-green-600',
      action:()=>onFollow(post.userEmail, post.userName)
    });
    options.push({
      id:'block',
      icon:isBlocked ? UserCheck : UserMinus,
      label:isBlocked ? 'Unblock User' : 'Block User',
      color:isBlocked ? 'text-green-600' : 'text-red-500',
      action:()=>onBlock(post.userEmail, post.userName)
    });
  }
  
  if(isOwner){
    options.push({ id:'delete', icon:Trash2, label:'Delete Post', color:'text-red-500', action:()=>onDelete(post) });
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="bg-white rounded-t-2xl w-full overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-center">Post Options</h3>
        </div>
        <div className="divide-y divide-gray-100 max-h-[50vh] overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={()=>{ opt.action(); onClose(); }}
              className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50"
            >
              <opt.icon className={`w-5 h-5 ${opt.color}`}/>
              <span className={`text-sm font-medium ${opt.color}`}>{opt.label}</span>
            </button>
          ))}
          <button onClick={onClose} className="w-full px-4 py-3.5 text-sm text-gray-500 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  INLINE POST CARD — ALL BUGS FIXED
// ═══════════════════════════════════════════════════════════════════════════════

const InlinePostCard = memo(({
  post, user, profileSrc, updateNotificationCount,
  onShare, onReshareClick, onSaveToggle, isSaved,
  onDelete, onFollow, isFollowing, onBlock, isBlocked,
  onViewUserProfile, onViewBookDetails,
}) => {
  // BUG 5: comments hidden by default
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  
  // BUG 2: init isLiked from post.likedBy (server truth) first
  const [isLiked, setIsLiked] = useState(() => {
    if (post.likedBy && Array.isArray(post.likedBy)) {
      return post.likedBy.includes(user.email);
    }
    try {
      const raw = localStorage.getItem(lpKey(user.email));
      return raw ? JSON.parse(raw).includes(post.id) : false;
    } catch { return false; }
  });
  
  const [likeCount, setLikeCount] = useState(
    post.likedBy?.length ?? post.likes ?? 0
  );
  
  // liked comments (email-keyed)
  const [likedComments, setLikedComments] = useState(() => {
    try {
      const raw = localStorage.getItem(lcKey(user.email));
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });
  
  const [newComment, setNewComment] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [showOptions, setShowOptions] = useState(false);
  const inputRef = useRef(null);
  
  // BUG 5: load comments only when section is opened
  useEffect(() => {
    if (!showComments || comments.length > 0) return;
    setLoadingComments(true);
    axios.get(`${API_URL}/api/social/posts/${post.id}/comments`)
      .then(r => { if (r.data.success) setComments(r.data.comments); })
      .catch(() => {
        const cached = JSON.parse(localStorage.getItem(`post_${post.id}_comments`) || '[]');
        setComments(cached);
      })
      .finally(() => setLoadingComments(false));
  }, [showComments, post.id]);
  
  // notification helper
  const pushNotif = useCallback((targetEmail, notif) => {
    storeNotif(targetEmail, notif);
    updateNotificationCount?.();
  }, [updateNotificationCount]);
  
  // BUG 2: like/unlike toggle (works both ways)
  const handleLikePost = async () => {
    const willLike = !isLiked;
    const newCount = willLike ? likeCount + 1 : Math.max(0, likeCount - 1);
    
    // Optimistic update
    setIsLiked(willLike);
    setLikeCount(newCount);
    
    // Update localStorage (email-keyed)
    try {
      const liked = JSON.parse(localStorage.getItem(lpKey(user.email)) || '[]');
      const updated = willLike
        ? (liked.includes(post.id) ? liked : [...liked, post.id])
        : liked.filter(id => id !== post.id);
      localStorage.setItem(lpKey(user.email), JSON.stringify(updated));
    } catch {}
    
    try {
      const res = await axios.post(`${API_URL}/api/social/posts/${post.id}/like`, {
        userEmail: user.email,
        userName: user.name,
      });
      if (res.data.success) {
        // Server is authoritative — overwrite optimistic values
        setLikeCount(res.data.likes);
        setIsLiked(res.data.liked);
      }
    } catch { /* keep optimistic */ }
    
    // Notify post author (only when liking, not unliking)
    if (willLike && post.userEmail !== user.email) {
      pushNotif(post.userEmail, {
        type: 'like',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} liked your post`,
        postId: post.id,
      });
    }
  };
  
  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    
    const mentions = (newComment.match(/@(\w+)/g) || []).map(m => m.slice(1));
    const data = {
      userName: user.name,
      userEmail: user.email,
      content: sanitize(newComment.trim()),
      mentions,
      parentId: replyTo?.id || null,
    };
    setNewComment('');
    setReplyTo(null);
    
    try {
      const res = await axios.post(`${API_URL}/api/social/posts/${post.id}/comments`, data);
      if (res.data.success) setComments(prev => [...prev, res.data.comment]);
    } catch {
      const comment = {
        id: genId(),
        ...data,
        userInitials: user.name.slice(0,2).toUpperCase(),
        timestamp: new Date().toISOString(),
        likes: 0,
        likedBy: []
      };
      setComments(prev => [...prev, comment]);
      const cached = JSON.parse(localStorage.getItem(`post_${post.id}_comments`) || '[]');
      cached.push(comment);
      localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(cached));
    }
    
    if (post.userEmail !== user.email) {
      pushNotif(post.userEmail, {
        type: 'comment',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} commented: "${newComment.substring(0,50)}"`,
        postId: post.id,
      });
    }
  };
  
  const handleLikeComment = async (comment) => {
    if (likedComments.has(comment.id)) return;
    
    // Optimistic update
    setComments(prev => prev.map(c => 
      c.id === comment.id ? { ...c, likes: (c.likes||0) + 1 } : c
    ));
    
    const next = new Set(likedComments);
    next.add(comment.id);
    setLikedComments(next);
    
    try {
      localStorage.setItem(lcKey(user.email), JSON.stringify([...next]));
    } catch {}
    
    try {
      await axios.post(`${API_URL}/api/social/comments/${comment.id}/like`, { userEmail: user.email });
    } catch { /* ignore */ }
    
    if (comment.userEmail && comment.userEmail !== user.email) {
      pushNotif(comment.userEmail, {
        type: 'like',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} liked your comment`,
        postId: post.id,
      });
    }
  };
  
  const handleDeleteComment = (id) => {
    setComments(prev => prev.filter(c => c.id !== id && c.parentId !== id));
  };
  
  const topLevel = comments.filter(c => !c.parentId);
  const visible = showAllComments ? topLevel : topLevel.slice(0, 3);
  
  // BUG 4: MAX_DEPTH=2 → 3 visual levels
  const CommentRow = ({ comment, depth = 0 }) => {
    const replies = depth < MAX_DEPTH
      ? comments.filter(c => c.parentId === comment.id)
      : [];
    const liked = likedComments.has(comment.id);
    const isOwn = comment.userEmail === user.email;
    
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
      <div className="flex gap-2.5">
        <div className="flex flex-col items-center flex-shrink-0" style={{ width: 30 }}>
          <button onClick={() => onViewUserProfile(comment.userEmail, comment.userName)}>
            <Avatar initials={comment.userName} size="xs" src={comment.userPhoto}/>
          </button>
          {replies.length > 0 && showReplies[comment.id] && (
            <div className="w-0.5 flex-1 bg-orange-200 mt-1 rounded-full min-h-[16px]" />
          )}
        </div>
        <div className="flex-1 min-w-0 pb-2">
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
          <div className="flex items-center gap-4 mt-1">
            <button
              onClick={() => handleLikeComment(comment)}
              disabled={liked}
              className={`flex items-center gap-1 text-xs font-medium transition ${
                liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-500' : ''}`}/>
              <span>{comment.likes || 0}</span>
            </button>
            {depth < MAX_DEPTH && (
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
                className="ml-auto text-gray-200 hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5"/>
              </button>
            )}
          </div>
          {replies.length > 0 && (
            <div className="mt-2">
              {!showReplies[comment.id] && (
                <button
                  onClick={() => setShowReplies(prev => ({ ...prev, [comment.id]: true }))}
                  className="text-xs text-orange-500 font-semibold mb-1 flex items-center gap-1"
                >
                  ↳ View {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </button>
              )}
              {showReplies[comment.id] && (
                <div className="space-y-2 pl-3 border-l-2 border-orange-100">
                  {replies.map(r => (
                    <CommentRow key={r.id} comment={r} depth={depth+1}/>
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
          isOwner={user.email === post.userEmail}
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
              <Avatar initials={post.userName} size="md" src={post.userPhoto}/>
            </button>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => onViewUserProfile(post.userEmail, post.userName)}
                className="font-bold text-gray-900 text-sm hover:underline"
              >
                {post.userName || 'Anonymous'}
              </button>
              <span className="text-xs text-gray-400 ml-2">{formatTimeAgo(post.createdAt)}</span>
              {post.bookName && (
                <button
                  onClick={() => onViewBookDetails?.({ title: post.bookName, author: post.author })}
                  className="flex items-center gap-1 mt-0.5 hover:underline"
                >
                  <BookOpen className="w-3 h-3 text-orange-400"/>
                  <span className="text-xs text-gray-500">
                    {post.bookName}{post.author ? ` · ${post.author}` : ''}
                  </span>
                </button>
              )}
            </div>
            <button
              onClick={() => setShowOptions(true)}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
            >
              <MoreHorizontal className="w-4 h-4"/>
            </button>
          </div>
        </div>
        
        {/* Body */}
        <div className="px-4 pb-3">
          {post.image && (
            <img src={post.image} alt="" className="w-full rounded-xl mb-3 max-h-56 object-cover"/>
          )}
          {post.isReshare && post.originalPost && (
            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <Repeat className="w-3 h-3"/>
              Reshared from <span className="font-semibold ml-1">{post.originalPost.userName}</span>
            </p>
          )}
          <p className="text-gray-800 text-base leading-relaxed" style={{fontFamily:'Georgia,serif'}}>
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
        
        {/* Action bar — BUG 5: comment button toggles section */}
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-5">
          <button
            onClick={handleLikePost}
            className={`flex items-center gap-1.5 text-sm font-semibold transition ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`}/>
            <span>{likeCount}</span>
          </button>
          
          <button
            onClick={() => setShowComments(prev => !prev)}
            className={`flex items-center gap-1.5 text-sm font-semibold transition ${
              showComments ? 'text-orange-500' : 'text-gray-500 hover:text-orange-500'
            }`}
          >
            <MessageCircle className="w-5 h-5"/>
            <span>{comments.length || post.comments || 0}</span>
          </button>
          
          <button
            onClick={() => onSaveToggle(post)}
            className={`flex items-center gap-1.5 text-sm font-semibold transition ${
              isSaved ? 'text-orange-500' : 'text-gray-500 hover:text-orange-400'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-orange-500' : ''}`}/>
          </button>
          
          <button
            onClick={() => onShare(post)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-orange-500 transition ml-auto"
          >
            <Share2 className="w-4 h-4"/>
            <span>{post.reshareCount || 0}</span>
          </button>
        </div>
        
        {/* BUG 5: comments section only mounts when showComments is true */}
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
                    <X className="w-3.5 h-3.5 text-gray-400"/>
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                {profileSrc ? (
                  <img src={profileSrc} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0"/>
                ) : (
                  <Avatar initials={user?.name} size="sm"/>
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
                <div className="flex justify-center py-4"><Spin size="sm"/></div>
              ) : (
                visible.map(c => <CommentRow key={c.id} comment={c} depth={0}/>)
              )}
              {topLevel.length > 3 && (
                <button
                  onClick={() => setShowAllComments(prev => !prev)}
                  className="text-xs text-orange-500 font-semibold flex items-center gap-1"
                >
                  {showAllComments ? (
                    <><ChevronDown className="w-3.5 h-3.5 rotate-180"/>Show less</>
                  ) : (
                    <><ChevronDown className="w-3.5 h-3.5"/>View all {topLevel.length} comments</>
                  )}
                </button>
              )}
              {comments.length === 0 && !loadingComments && (
                <p className="text-xs text-gray-400 text-center py-2">Be the first to comment 💬</p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
//  NAV BARS
// ═══════════════════════════════════════════════════════════════════════════════

const BottomNav = ({ active, setPage, unreadCount=0, show=true }) => {
  if (!show) return null;
  
  const items = [
    { id:'home',    icon:BookOpen,  label:'Home'    },
    { id:'explore', icon:Sparkles,  label:'Explore' },
    { id:'post',    icon:Edit3,     label:'Post'    },
    { id:'crews',   icon:Users,     label:'Crews'   },
    { id:'profile', icon:User,      label:'Profile' },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 max-w-md mx-auto shadow-lg">
      <div className="flex items-center justify-around py-2 px-2">
        {items.map(({ id, icon:Icon, label }) => (
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
                <Icon className="w-5 h-5 text-white"/>
              </div>
            ) : (
              <Icon className="w-5 h-5" strokeWidth={active === id ? 2.5 : 1.8}/>
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

const TopBar = ({ user, setPage, title, showBack=false, onBack, showProfile=true, onNotifClick, notifCount=0, profileSrc }) => (
  <header className="sticky top-0 bg-white/95 backdrop-blur-sm z-40 px-4 py-3 flex items-center justify-between border-b border-gray-200">
    <div className="flex items-center gap-3">
      {showBack && (
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600"/>
        </button>
      )}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-md">
          <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5}/>
        </div>
        <span className="font-bold text-gray-900 text-lg" style={{fontFamily:'Georgia,serif'}}>
          {title || 'ReadCrew'}
        </span>
      </div>
    </div>
    {showProfile && (
      <div className="flex items-center gap-3">
        <button onClick={onNotifClick} className="relative p-1 hover:bg-gray-100 rounded-lg">
          <Bell className="w-5 h-5 text-gray-600"/>
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </button>
        <button onClick={() => setPage('profile')} className="hover:opacity-80">
          {profileSrc ? (
            <img src={profileSrc} alt="" className="w-8 h-8 rounded-full object-cover border border-orange-200"/>
          ) : (
            <Avatar initials={user?.name} size="sm"/>
          )}
        </button>
      </div>
    )}
  </header>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  NOTIFICATIONS PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const NotificationsPage = ({ user, onClose, refreshCount }) => {
  const [notifs, setNotifs] = useState([]);
  
  useEffect(() => {
    const cached = JSON.parse(localStorage.getItem(notifKey(user.email)) || '[]');
    setNotifs(cached);
    
    axios.get(`${API_URL}/api/social/notifications/${encodeURIComponent(user.email)}`)
      .then(r => {
        if (r.data.success) {
          const fresh = r.data.notifications;
          setNotifs(fresh);
          localStorage.setItem(notifKey(user.email), JSON.stringify(fresh));
        }
      })
      .catch(() => { /* keep cached */ });
  }, [user.email]);
  
  const markAllRead = () => {
    const updated = notifs.map(n => ({ ...n, read: true }));
    setNotifs(updated);
    localStorage.setItem(notifKey(user.email), JSON.stringify(updated));
    axios.post(`${API_URL}/api/social/notifications/${encodeURIComponent(user.email)}/read`, { userEmail:user.email })
      .catch(() => {});
    refreshCount?.();
  };
  
  const icons = {
    like: <Heart className="w-4 h-4 text-red-500"/>,
    comment: <MessageCircle className="w-4 h-4 text-blue-500"/>,
    message: <MessageSquare className="w-4 h-4 text-emerald-500"/>,
    invite: <UserPlus className="w-4 h-4 text-purple-500"/>,
    follow: <UserCheck className="w-4 h-4 text-orange-500"/>,
    reshare: <Repeat className="w-4 h-4 text-indigo-500"/>,
    mention: <AtSign className="w-4 h-4 text-amber-500"/>,
    review: <Star className="w-4 h-4 text-yellow-500"/>
  };
  
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600"/>
        </button>
        <h2 className="font-semibold text-gray-900">Notifications</h2>
        <button onClick={markAllRead} className="text-sm text-orange-500 font-medium">
          Mark all read
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        {notifs.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {[...notifs].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map(n => (
              <div key={n.id} className={`p-4 ${n.read ? 'bg-white' : 'bg-orange-50'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    {icons[n.type] || <Bell className="w-4 h-4 text-gray-500"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"/>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [readingGoal, setReadingGoal] = useState({ yearly: 20, monthly: 5 });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  const sendOTP = () => {
    setError('');
    if (!isLogin && name.trim().length < 2) {
      setError('Please enter your full name');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email');
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
      password
    }));
    setDevOtp(otp);
    setShowOTP(true);
  };
  
  const verifyOTP = () => {
    setError('');
    if (otpInput.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }
    const saved = localStorage.getItem('devOTP');
    const pending = JSON.parse(localStorage.getItem('pendingUser') || '{}');
    if (otpInput !== saved) {
      setError('Incorrect code. Try again.');
      return;
    }
    localStorage.removeItem('devOTP');
    localStorage.removeItem('pendingUser');
    
    const userData = {
      id: genId(),
      name: pending.name || name,
      email: pending.email || email,
      password: pending.password || password,
      readingGoal,
      isVerified: true,
      createdAt: new Date().toISOString(),
      stats: { booksRead: 0, reviewsGiven: 0, postsCreated: 0, crewsJoined: 0 },
      joinedCrews: [],
      readingList: [],
      bio: 'Reading is my superpower',
      location: '',
      website: ''
    };
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const idx = users.findIndex(u => u.email === userData.email);
    if (idx >= 0) users[idx] = { ...users[idx], ...userData };
    else users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(userData));
    onLogin(userData);
  };
  
  const handleLogin = () => {
    setError('');
    if (!isValidEmail(email)) {
      setError('Please enter a valid email');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found && (found.password === password || !found.password)) {
      localStorage.setItem('currentUser', JSON.stringify(found));
      onLogin(found);
      return;
    }
    setError(found ? 'Incorrect password.' : 'No account found. Please sign up.');
  };
  
  if (showOTP) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-7 border border-gray-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-orange-500"/>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Check your email</h2>
          <p className="text-gray-500 text-sm">Code sent to <strong>{email}</strong></p>
        </div>
        {devOtp && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-4 text-center">
            <p className="text-xs text-amber-700 font-medium mb-2">📧 Email unavailable — use this code:</p>
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
          onChange={e => { setOtpInput(e.target.value.replace(/\D/g,'').slice(0,6)); setError(''); }}
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
          <button onClick={() => { setShowOTP(false); setError(''); setDevOtp(''); }} className="text-gray-500 text-sm flex items-center gap-1">
            <ArrowLeft className="w-4 h-4"/> Back
          </button>
          <button onClick={sendOTP} className="text-orange-500 text-sm font-semibold">
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
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-10 h-10 text-white"/>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent" style={{fontFamily:'Georgia,serif'}}>
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
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                <User className="w-5 h-5 text-gray-400"/>
                <input
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                  placeholder="Full Name *"
                  autoComplete="name"
                />
              </div>
            )}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
              <Mail className="w-5 h-5 text-gray-400"/>
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
              <Lock className="w-5 h-5 text-gray-400"/>
              <input
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                type={showPass ? 'text' : 'password'}
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                placeholder={isLogin ? 'Password *' : 'Create a password *'}
              />
              <button onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff className="w-4 h-4 text-gray-400"/> : <Eye className="w-4 h-4 text-gray-400"/>}
              </button>
            </div>
            {!isLogin && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={e => setAgreeToTerms(e.target.checked)}
                  className="rounded border-gray-300 text-orange-500"
                />
                <label htmlFor="terms" className="text-xs text-gray-600">
                  I agree to the Terms of Service and Privacy Policy
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
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
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

// ═══════════════════════════════════════════════════════════════════════════════
//  POST PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const PostPage = ({ user, onPost, setPage }) => {
  const [content, setContent] = useState('');
  const [bookName, setBookName] = useState('');
  const [author, setAuthor] = useState('');
  const [image, setImage] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();
  
  const submit = async () => {
    if (!content.trim()) return;
    setSaving(true);
    
    const postData = {
      id: genId(),
      content: sanitize(content.trim()),
      bookName: bookName.trim() || undefined,
      author: author.trim() || undefined,
      image,
      isPublic,
      userName: user.name,
      userEmail: user.email,
    };
    
    try {
      const res = await axios.post(`${API_URL}/api/social/posts`, postData);
      if (res.data.success) onPost(res.data.post);
      else onPost({ ...postData, createdAt: new Date().toISOString(), likes: 0, reshareCount: 0 });
    } catch {
      onPost({ ...postData, createdAt: new Date().toISOString(), likes: 0, reshareCount: 0 });
    }
    
    setSaving(false);
    setPage('home');
  };
  
  return (
    <div className="fixed inset-0 flex flex-col bg-white z-[55]" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onClick={() => setPage('home')} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5 text-gray-600"/>
        </button>
        <h2 className="font-semibold text-gray-900">Create Post</h2>
        <button
          onClick={submit}
          disabled={!content.trim() || saving}
          className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'Posting…' : 'Share'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex gap-3 mb-4">
          <Avatar initials={user?.name} size="md" src={user?.profileImage}/>
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
            <img src={image} alt="preview" className="w-full rounded-xl max-h-56 object-cover"/>
            <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
              <X className="w-4 h-4 text-white"/>
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 hover:bg-gray-200"
          >
            <Camera className="w-4 h-4"/>Add Photo
          </button>
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${
              !isPublic ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {isPublic ? <Globe className="w-4 h-4"/> : <Lock className="w-4 h-4"/>}
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
              alert('Max 5 MB');
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

// ═══════════════════════════════════════════════════════════════════════════════
//  AI BOOK RECOMMENDATIONS (fallback)
// ═══════════════════════════════════════════════════════════════════════════════

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
  ],
};

const clientRec = (text, prev = []) => {
  const t = text.toLowerCase();
  let cat = 'selfhelp';
  if (/thriller|suspense|crime|murder|dark|horror/i.test(t)) cat = 'thriller';
  else if (/fantasy|magic|dragon|wizard|epic/i.test(t)) cat = 'fantasy';
  else if (/romance|love|swoony|dating/i.test(t)) cat = 'romance';
  else if (/sci.?fi|space|future|robot|alien|mars/i.test(t)) cat = 'scifi';
  else if (/mystery|whodun|cozy|clue/i.test(t)) cat = 'mystery';
  
  const pool = BOOK_DB[cat] || BOOK_DB.selfhelp;
  const prevTitles = new Set(prev.map(b => b.title));
  const fresh = pool.filter(b => !prevTitles.has(b.title));
  
  return {
    reply: `Here are some great ${cat} picks for you 📚`,
    books: (fresh.length > 0 ? fresh : pool).slice(0, 3)
  };
};

const BookCard = ({ book, onCreateCrew, onViewDetails }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
    <div className="flex gap-4">
      <DynamicBookCover title={book.title} author={book.author} size="md" onClick={() => onViewDetails?.(book)}/>
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
            <StarRating rating={Math.round(book.rating)} size="xs" readonly/>
            <span className="text-xs text-gray-600">{book.rating}</span>
          </div>
        )}
      </div>
    </div>
    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
      <button onClick={() => onViewDetails?.(book)} className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold">
        View Details
      </button>
      <button onClick={onCreateCrew} className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
        <Users className="w-4 h-4"/>Create Crew
      </button>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  EXPLORE PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const ExplorePage = ({ user, setPage, onCreateCrew }) => {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hey! 👋 I'm Page Turner, your AI book guide. Tell me what you're in the mood for!",
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const sessionId = useRef(`session_${Date.now()}`);
  const endRef = useRef(null);
  
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText, timestamp: new Date() }]);
    setLoading(true);
    
    let usedBackend = false;
    try {
      const res = await fetch(`${API_URL}/api/books/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, sessionId: sessionId.current }),
        signal: AbortSignal.timeout(30000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.reply) {
          setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }]);
          if (data.recommendations?.length > 0) setBooks(data.recommendations);
          usedBackend = true;
        }
      }
    } catch { /* fall through */ }
    
    if (!usedBackend) {
      const { reply, books: recs } = clientRec(userText, books);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);
      if (recs.length > 0) setBooks(recs);
    }
    
    setLoading(false);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] to-[#FAF6F1] pb-24 flex flex-col overflow-y-auto">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-[#2D1F14]" style={{fontFamily:'Georgia,serif'}}>
          What to read next?
        </h1>
        <p className="text-sm text-[#8B7968]">Chat with your AI book guide</p>
      </div>
      
      <div className="flex-1 px-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-white"/>
              </div>
            )}
            <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-orange-500 text-white rounded-br-sm'
                : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white"/>
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1.5">
                {[0, 150, 300].map(delay => (
                  <div
                    key={delay}
                    className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        
        {books.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 px-1">
              <div className="h-px flex-1 bg-orange-200"/>
              <span className="text-xs text-orange-500 font-semibold">📚 RECOMMENDATIONS</span>
              <div className="h-px flex-1 bg-orange-200"/>
            </div>
            {books.map((book, i) => (
              <BookCard
                key={i}
                book={book}
                onCreateCrew={() => { onCreateCrew(book); setPage('crews'); }}
                onViewDetails={b => setSelectedBook(b)}
              />
            ))}
          </div>
        )}
        
        <div ref={endRef}/>
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
            <Send className="w-4 h-4"/>
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

// ═══════════════════════════════════════════════════════════════════════════════
//  REVIEWS PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const ReviewsPage = ({ user, setPage, refreshNotifCount, onViewUserProfile }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [likedReviews, setLikedReviews] = useState(() => 
    JSON.parse(localStorage.getItem(`user_${user.email}_likedReviews`) || '[]')
  );
  const [form, setForm] = useState({ bookName: '', author: '', rating: 5, review: '', sentiment: 'positive' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  
  useEffect(() => {
    axios.get(`${API_URL}/api/social/reviews`)
      .then(res => { if (res.data.success) setReviews(res.data.reviews); })
      .catch(() => setReviews(JSON.parse(localStorage.getItem('reviews') || '[]')))
      .finally(() => setLoading(false));
  }, []);
  
  const handleLike = (review) => {
    if (likedReviews.includes(review.id)) return;
    
    const updated = [...likedReviews, review.id];
    setLikedReviews(updated);
    localStorage.setItem(`user_${user.email}_likedReviews`, JSON.stringify(updated));
    
    setReviews(prev => prev.map(r => r.id === review.id ? { ...r, likes: (r.likes||0) + 1 } : r));
    
    axios.post(`${API_URL}/api/social/reviews/${review.id}/like`, { userEmail: user.email }).catch(() => {});
    
    if (review.userEmail !== user.email) {
      storeNotif(review.userEmail, {
        type: 'review',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} liked your review of "${review.bookName}"`,
      });
      refreshNotifCount?.();
    }
  };
  
  const handleCreate = async () => {
    if (!form.bookName || !form.review) {
      alert('Please fill all fields');
      return;
    }
    
    const data = { ...form, userName: user.name, userEmail: user.email };
    
    try {
      const res = await axios.post(`${API_URL}/api/social/reviews`, data);
      if (res.data.success) setReviews(prev => [res.data.review, ...prev]);
    } catch {
      const newReview = { id: genId(), ...data, createdAt: new Date().toISOString(), likes: 0 };
      setReviews(prev => [newReview, ...prev]);
      const saved = JSON.parse(localStorage.getItem('reviews') || '[]');
      saved.unshift(newReview);
      localStorage.setItem('reviews', JSON.stringify(saved));
    }
    
    setShowForm(false);
    setForm({ bookName: '', author: '', rating: 5, review: '', sentiment: 'positive' });
  };
  
  const filtered = reviews.filter(r => 
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
          <ChevronLeft className="w-5 h-5"/>
        </button>
        <h2 className="font-semibold text-gray-900">Book Reviews</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium"
        >
          {showForm ? 'Cancel' : 'Write Review'}
        </button>
      </div>
      
      <div className="px-4 py-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by book or author…"
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
          />
        </div>
        
        {showForm && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
            <h3 className="font-semibold mb-3">Write a Review</h3>
            <div className="space-y-3 mb-4">
              <input
                value={form.bookName}
                onChange={e => setForm({ ...form, bookName: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                placeholder="Book name *"
              />
              <input
                value={form.author}
                onChange={e => setForm({ ...form, author: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                placeholder="Author"
              />
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Rating</label>
                <StarRating rating={form.rating} onChange={r => setForm({ ...form, rating: r })} size="md"/>
              </div>
              <textarea
                value={form.review}
                onChange={e => setForm({ ...form, review: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none resize-none"
                placeholder="Write your review…"
                rows={4}
              />
            </div>
            <button
              onClick={handleCreate}
              className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium"
            >
              Submit Review
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-8"><Spin/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
            <p className="text-gray-500">No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(review => {
              const isLiked = likedReviews.includes(review.id);
              return (
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
                      <StarRating rating={review.rating} size="xs"/>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{review.review}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button
                      onClick={() => onViewUserProfile(review.userEmail, review.userName)}
                      className="flex items-center gap-2 hover:opacity-75"
                    >
                      <Avatar initials={review.userName} size="xs"/>
                      <span className="text-xs text-gray-600 hover:underline">{review.userName}</span>
                    </button>
                    <button
                      onClick={() => handleLike(review)}
                      disabled={isLiked}
                      className={`flex items-center gap-1 text-xs ${
                        isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500' : ''}`}/>
                      {review.likes || 0}
                    </button>
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

// ═══════════════════════════════════════════════════════════════════════════════
//  CREW CHAT HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

const useCrewPresence = (crewId, userId, userName) => {
  const [onlineCount, setOnlineCount] = useState(0);
  const heartbeatRef = useRef(null);
  const PRESENCE_TTL = 30000;
  
  const markPresent = useCallback(() => {
    if (!crewId || !userId) return;
    localStorage.setItem(`crp_${crewId}_${userId}`, JSON.stringify({ userId, userName, ts: Date.now() }));
  }, [crewId, userId, userName]);
  
  const markAbsent = useCallback(() => {
    if (!crewId || !userId) return;
    localStorage.removeItem(`crp_${crewId}_${userId}`);
  }, [crewId, userId]);
  
  const getOnlineCount = useCallback(() => {
    if (!crewId) return 0;
    const now = Date.now();
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`crp_${crewId}_`)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && now - data.ts < PRESENCE_TTL) count++;
          else localStorage.removeItem(key);
        } catch { /* ignore */ }
      }
    }
    return count;
  }, [crewId]);
  
  useEffect(() => {
    if (!crewId || !userId) return;
    markPresent();
    setOnlineCount(getOnlineCount());
    heartbeatRef.current = setInterval(() => {
      markPresent();
      setOnlineCount(getOnlineCount());
    }, 15000);
    return () => {
      clearInterval(heartbeatRef.current);
      markAbsent();
    };
  }, [crewId, userId, markPresent, markAbsent, getOnlineCount]);
  
  return { onlineCount };
};

const useTyping = (crewId, userId, userName) => {
  const [typing, setTyping] = useState([]);
  const typingTimeoutRef = useRef(null);
  const TYPING_TTL = 3000;
  
  const broadcastTyping = useCallback(() => {
    if (!crewId || !userId) return;
    localStorage.setItem(`crt_${crewId}_${userId}`, JSON.stringify({ userId, userName, ts: Date.now() }));
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      localStorage.removeItem(`crt_${crewId}_${userId}`);
    }, TYPING_TTL);
  }, [crewId, userId, userName]);
  
  const stopTyping = useCallback(() => {
    if (!crewId || !userId) return;
    clearTimeout(typingTimeoutRef.current);
    localStorage.removeItem(`crt_${crewId}_${userId}`);
  }, [crewId, userId]);
  
  useEffect(() => {
    if (!crewId) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const typingUsers = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`crt_${crewId}_`) && !key.endsWith(`_${userId}`)) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && now - data.ts < TYPING_TTL) {
              typingUsers.push(data.userName || 'Someone');
            } else {
              localStorage.removeItem(key);
            }
          } catch { /* ignore */ }
        }
      }
      setTyping(typingUsers);
    }, 1500);
    return () => {
      clearInterval(interval);
      stopTyping();
    };
  }, [crewId, userId, stopTyping]);
  
  return { typing, broadcastTyping, stopTyping };
};

// ═══════════════════════════════════════════════════════════════════════════════
//  CREW CHAT ROOM
// ═══════════════════════════════════════════════════════════════════════════════

const CrewChatRoom = ({ crew, user, onBack, refreshNotifCount, onViewUserProfile }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState([]);
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const { onlineCount } = useCrewPresence(crew.id, user.id, user.name);
  const { typing, broadcastTyping, stopTyping } = useTyping(crew.id, user.id, user.name);
  
  useEffect(() => {
    const cached = JSON.parse(localStorage.getItem(`crew_${crew.id}_messages`) || '[]');
    setMessages(cached.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
    
    socket.emit('join_crew_room', crew.id);
    socket.on('new_crew_message', data => {
      if (String(data.crewId) === String(crew.id)) {
        setMessages(prev => [...prev, { ...data.message, timestamp: new Date(data.message.timestamp) }]);
      }
    });
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    setMembers(users.filter(u => u.joinedCrews?.includes(crew.id) || u.joinedCrews?.includes(String(crew.id))));
    
    return () => {
      socket.emit('leave_crew_room', crew.id);
      socket.off('new_crew_message');
    };
  }, [crew.id]);
  
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    stopTyping();
    
    const message = {
      id: genId(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userInitials: user.name?.slice(0,2).toUpperCase(),
      content: sanitize(newMessage.trim()),
      type: 'text',
      timestamp: new Date().toISOString()
    };
    setNewMessage('');
    
    try {
      const res = await axios.post(`${API_URL}/api/social/crews/${crew.id}/messages`, {
        userName: user.name,
        userEmail: user.email,
        content: message.content,
        type: 'text'
      });
      if (res.data.success) {
        setMessages(prev => [...prev, { ...res.data.message, timestamp: new Date(res.data.message.timestamp) }]);
      }
    } catch {
      const cached = JSON.parse(localStorage.getItem(`crew_${crew.id}_messages`) || '[]');
      cached.push(message);
      localStorage.setItem(`crew_${crew.id}_messages`, JSON.stringify(cached));
      setMessages(prev => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);
    }
    
    // Notify other members
    members.filter(m => m.email !== user.email).forEach(member => {
      storeNotif(member.email, {
        type: 'message',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} sent a message in "${crew.name}"`,
        crewId: crew.id
      });
    });
    refreshNotifCount?.();
  };
  
  const sendImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Max 5 MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const message = {
        id: genId(),
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userInitials: user.name?.slice(0,2).toUpperCase(),
        content: ev.target.result,
        type: 'image',
        timestamp: new Date().toISOString()
      };
      
      const cached = JSON.parse(localStorage.getItem(`crew_${crew.id}_messages`) || '[]');
      cached.push(message);
      localStorage.setItem(`crew_${crew.id}_messages`, JSON.stringify(cached));
      setMessages(prev => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);
      
      // Notify other members
      members.filter(m => m.email !== user.email).forEach(member => {
        storeNotif(member.email, {
          type: 'message',
          fromUser: user.name,
          fromUserEmail: user.email,
          message: `${user.name} shared an image in "${crew.name}"`,
          crewId: crew.id
        });
      });
      refreshNotifCount?.();
    };
    reader.readAsDataURL(file);
  };
  
  const formatTime = (ts) => {
    const diff = Date.now() - new Date(ts);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    return new Date(ts).toLocaleDateString();
  };
  
  return (
    <div className="fixed inset-0 flex flex-col z-[60] bg-[#e5ddd5]" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="flex-shrink-0 bg-white border-b px-4 py-2 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full">
          <ChevronLeft className="w-5 h-5 text-gray-600"/>
        </button>
        <DynamicBookCover title={crew.name} author={crew.author} size="xs"/>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{crew.name}</p>
          <p className="text-xs text-gray-500">
            {members.length} members
            {onlineCount > 0 && <span className="ml-2 text-green-600">· {onlineCount} online</span>}
          </p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mb-3"/>
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
                      className="w-7 h-7 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 hover:opacity-80"
                    >
                      {msg.userInitials || '??'}
                    </button>
                  )}
                  <div className={`rounded-2xl px-3.5 py-2 shadow-sm ${
                    isOwn ? 'bg-[#dcf8c6] rounded-br-sm' : 'bg-white rounded-bl-sm'
                  }`}>
                    {!isOwn && <p className="text-xs font-semibold text-orange-600 mb-0.5">{msg.userName}</p>}
                    {msg.type === 'image' ? (
                      <img
                        src={msg.content}
                        alt="shared"
                        className="max-w-full rounded-xl max-h-60 cursor-pointer"
                        onClick={() => window.open(msg.content, '_blank')}
                      />
                    ) : (
                      <p className="text-sm leading-relaxed break-words text-gray-900">{msg.content}</p>
                    )}
                    <p className="text-[10px] text-gray-400 text-right mt-0.5">{formatTime(msg.timestamp)}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef}/>
      </div>
      
      {typing.length > 0 && (
        <div className="px-4 py-1 text-xs text-gray-500 italic">
          {typing.length === 1
            ? `${typing[0]} is typing…`
            : `${typing.length} people are typing…`}
        </div>
      )}
      
      <div className="flex-shrink-0 bg-gray-50 border-t px-3 py-2.5">
        <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow border border-gray-100">
          <button onClick={() => fileRef.current?.click()} className="w-8 h-8 flex items-center justify-center">
            <Plus className="w-5 h-5 text-orange-500"/>
          </button>
          <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={sendImage}/>
          <input
            type="text"
            value={newMessage}
            onChange={e => { setNewMessage(e.target.value); broadcastTyping(); }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); stopTyping(); sendMessage(); } }}
            onBlur={stopTyping}
            className="flex-1 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
            placeholder="Type a message…"
          />
          <button
            onClick={() => { stopTyping(); sendMessage(); }}
            disabled={!newMessage.trim()}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition ${
              newMessage.trim() ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'
            }`}
          >
            <Send className="w-4 h-4"/>
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  CREWS PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const CrewsPage = ({ user, crews: initialCrews, setPage, refreshNotifCount, onViewUserProfile }) => {
  const [view, setView] = useState('list');
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [crews, setCrews] = useState([]);
  const [joinedCrews, setJoinedCrews] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newCrew, setNewCrew] = useState({ name: '', author: '', genre: '' });
  const [toast, setToast] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('crews') || '[]');
    setCrews(saved.length > 0 ? saved : initialCrews);
    const joined = JSON.parse(localStorage.getItem(`user_${user.email}_joinedCrews`) || '[]');
    setJoinedCrews(joined);
  }, [user.email, initialCrews]);
  
  const isJoined = (id) => joinedCrews.includes(id) || joinedCrews.includes(String(id));
  
  const joinCrew = (crew) => {
    if (isJoined(crew.id)) return;
    
    const updated = [...joinedCrews, crew.id];
    setJoinedCrews(updated);
    localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updated));
    
    const updatedCrews = crews.map(c => c.id === crew.id ? { ...c, members: (c.members||1) + 1 } : c);
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));
    
    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.crewsJoined = (stats.crewsJoined || 0) + 1;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
    
    axios.post(`${API_URL}/api/social/crews/${crew.id}/join`, { userEmail: user.email }).catch(() => {});
    
    setToast(`🎉 Joined "${crew.name}"!`);
    setTimeout(() => setToast(''), 3000);
  };
  
  const leaveCrew = (crew) => {
    if (!window.confirm(`Leave ${crew.name}?`)) return;
    
    const updated = joinedCrews.filter(id => id !== crew.id && id !== String(crew.id));
    setJoinedCrews(updated);
    localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updated));
    
    const updatedCrews = crews.map(c => c.id === crew.id ? { ...c, members: Math.max(0, (c.members||1) - 1) } : c);
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));
    
    if (selectedCrew?.id === crew.id) {
      setView('list');
      setSelectedCrew(null);
    }
  };
  
  const createCrew = () => {
    if (!newCrew.name || !newCrew.author) {
      alert('Please fill book name and author');
      return;
    }
    
    if (crews.some(c => c.name.toLowerCase() === newCrew.name.toLowerCase() && c.author.toLowerCase() === newCrew.author.toLowerCase())) {
      alert('A crew for this book already exists!');
      return;
    }
    
    const newCrewData = {
      id: genId(),
      ...newCrew,
      members: 1,
      chats: 0,
      createdBy: user.email,
      createdByName: user.name,
      createdAt: new Date().toISOString()
    };
    
    const updatedCrews = [newCrewData, ...crews];
    setCrews(updatedCrews);
    localStorage.setItem('crews', JSON.stringify(updatedCrews));
    
    setJoinedCrews(prev => {
      const updated = [...prev, newCrewData.id];
      localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updated));
      return updated;
    });
    
    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.crewsJoined = (stats.crewsJoined || 0) + 1;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
    
    setShowCreate(false);
    setNewCrew({ name: '', author: '', genre: '' });
    setToast(`🎉 Created "${newCrewData.name}"!`);
    setTimeout(() => setToast(''), 3000);
  };
  
  const filteredCrews = crews.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.genre || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (view === 'chat' && selectedCrew) {
    return (
      <CrewChatRoom
        crew={selectedCrew}
        user={user}
        onBack={() => setView('detail')}
        refreshNotifCount={refreshNotifCount}
        onViewUserProfile={onViewUserProfile}
      />
    );
  }
  
  if (view === 'detail' && selectedCrew) {
    const joined = isJoined(selectedCrew.id);
    return (
      <div className="h-screen flex flex-col bg-white overflow-hidden" style={{maxWidth:'448px',margin:'0 auto'}}>
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => setView('list')} className="p-1 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5"/>
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
                {!joined ? (
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
                      storeNotif(email, {
                        type: 'invite',
                        fromUser: user.name,
                        message: `${user.name} invited you to "${selectedCrew.name}"!`
                      });
                      alert(`Invited ${email}!`);
                    }
                  }}
                  className="px-4 py-3 border border-gray-200 rounded-xl"
                >
                  <UserPlus className="w-5 h-5"/>
                </button>
              </div>
              {joined && (
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
        {selectedBook && (
          <BookDetailsModal
            book={selectedBook}
            onClose={() => setSelectedBook(null)}
            onCreateCrew={() => {}}
          />
        )}
      </div>
    );
  }
  
  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      {toast && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg z-[100] text-center">
          {toast}
        </div>
      )}
      
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white"/>
          </div>
          <span className="font-bold" style={{fontFamily:'Georgia,serif'}}>Reading Crews</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium"
        >
          Create Crew
        </button>
      </div>
      
      <div className="px-4 py-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by book, author, or genre…"
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
          />
        </div>
        
        {showCreate && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
            <h3 className="font-semibold mb-3">Create New Crew</h3>
            <div className="space-y-3">
              <input
                value={newCrew.name}
                onChange={e => setNewCrew({ ...newCrew, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                placeholder="Book title *"
              />
              <input
                value={newCrew.author}
                onChange={e => setNewCrew({ ...newCrew, author: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                placeholder="Author *"
              />
              <input
                value={newCrew.genre}
                onChange={e => setNewCrew({ ...newCrew, genre: e.target.value })}
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
                  onClick={() => setShowCreate(false)}
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
            <Users className="w-5 h-5 text-orange-500"/>My Crews
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
                  <DynamicBookCover title={crew.name} author={crew.author} size="sm"/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 truncate">{crew.name}</p>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">
                        Joined
                      </span>
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
                    <DynamicBookCover title={crew.name} author={crew.author} size="sm"/>
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
      
      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onCreateCrew={() => {}}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  PROFILE PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const ProfilePage = ({ user, posts, setPage, onLogout, onUpdateUser, profileSrc, setProfileSrc, savedPosts, following, followers }) => {
  const [tab, setTab] = useState('Posts');
  const [stats, setStats] = useState(() => 
    JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{"booksRead":0,"reviewsGiven":0,"postsCreated":0,"crewsJoined":0}')
  );
  const [goal, setGoal] = useState(user?.readingGoal || { yearly: 0, monthly: 0 });
  const [showGoal, setShowGoal] = useState(false);
  const [editGoal, setEditGoal] = useState(goal);
  const [books, setBooks] = useState(() => 
    JSON.parse(localStorage.getItem(`user_${user.email}_readingList`) || '[]')
  );
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', rating: 5, notes: '' });
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const fileRef = useRef();
  
  const myPosts = posts.filter(p => p.userEmail === user?.email);
  const myReviews = JSON.parse(localStorage.getItem('reviews') || '[]').filter(r => r.userEmail === user?.email);
  const saved = posts.filter(p => savedPosts?.includes(p.id));
  
  const uploadImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Max 5 MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageData = ev.target.result;
      setProfileSrc(imageData);
      localStorage.setItem(`user_${user.email}_profile_image`, imageData);
      
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      localStorage.setItem('users', JSON.stringify(
        users.map(u => u.email === user.email ? { ...u, profileImage: imageData } : u)
      ));
      localStorage.setItem('currentUser', JSON.stringify({ ...user, profileImage: imageData }));
      onUpdateUser?.({ ...user, profileImage: imageData });
    };
    reader.readAsDataURL(file);
  };
  
  const saveProfile = () => {
    const updated = { ...user, name: editName, bio: editBio };
    localStorage.setItem('currentUser', JSON.stringify(updated));
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    localStorage.setItem('users', JSON.stringify(
      users.map(u => u.email === user.email ? updated : u)
    ));
    
    onUpdateUser?.(updated);
    setEditing(false);
  };
  
  const saveGoal = () => {
    const updated = { ...user, readingGoal: editGoal };
    localStorage.setItem('currentUser', JSON.stringify(updated));
    setGoal(editGoal);
    setShowGoal(false);
    onUpdateUser?.(updated);
  };
  
  const addBook = () => {
    if (!newBook.title) {
      alert('Enter book title');
      return;
    }
    
    const book = { id: genId(), ...newBook, addedAt: new Date().toISOString() };
    const updated = [book, ...books];
    setBooks(updated);
    localStorage.setItem(`user_${user.email}_readingList`, JSON.stringify(updated));
    
    const newStats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    newStats.booksRead = updated.length;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(newStats));
    setStats(prev => ({ ...prev, booksRead: updated.length }));
    
    setNewBook({ title: '', author: '', rating: 5, notes: '' });
    setShowAddBook(false);
  };
  
  const deleteBook = (id) => {
    const updated = books.filter(b => b.id !== id);
    setBooks(updated);
    localStorage.setItem(`user_${user.email}_readingList`, JSON.stringify(updated));
    
    const newStats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    newStats.booksRead = updated.length;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(newStats));
    setStats(prev => ({ ...prev, booksRead: updated.length }));
  };
  
  const tabs = ['Posts', 'Reviews', 'Books Read', 'Saved Posts'];
  
  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white"/>
          </div>
          <span className="font-bold" style={{fontFamily:'Georgia,serif'}}>Profile</span>
        </div>
        <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-lg">
          <LogOut className="w-5 h-5 text-gray-600"/>
        </button>
      </div>
      
      <div className="px-4 py-5">
        <div className="flex items-start gap-4 mb-5">
          <div className="relative flex-shrink-0">
            {profileSrc ? (
              <img src={profileSrc} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-orange-200"/>
            ) : (
              <Avatar initials={user?.name} size="xl"/>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow hover:bg-orange-600"
            >
              <Camera className="w-3.5 h-3.5 text-white"/>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadImage}/>
          </div>
          
          <div className="flex-1 min-w-0">
            {editing ? (
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
                    onClick={saveProfile}
                    className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
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
                <button
                  onClick={() => setEditing(true)}
                  className="mt-3 px-4 py-1.5 border border-orange-200 text-orange-600 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-orange-50"
                >
                  <Edit className="w-3.5 h-3.5"/>Edit Profile
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500"/>
              <h3 className="font-semibold">Reading Goal {new Date().getFullYear()}</h3>
            </div>
            <button
              onClick={() => setShowGoal(!showGoal)}
              className="text-sm text-orange-500 font-medium"
            >
              {showGoal ? 'Cancel' : 'Edit'}
            </button>
          </div>
          
          {showGoal ? (
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
                onClick={saveGoal}
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
                  {goal.yearly > 0 ? `${stats.booksRead}/${goal.yearly} books` : 'No goal set'}
                </span>
              </div>
              {goal.yearly > 0 && (
                <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${Math.min((stats.booksRead / goal.yearly) * 100, 100)}%` }}
                  />
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="grid grid-cols-4 gap-2 bg-white rounded-xl p-3 border border-gray-200 mb-5">
          {[
            { label: 'Books', value: stats.booksRead, icon: BookOpen, color: 'text-blue-600' },
            { label: 'Reviews', value: stats.reviewsGiven, icon: Star, color: 'text-purple-600' },
            { label: 'Posts', value: stats.postsCreated, icon: Edit3, color: 'text-green-600' },
            { label: 'Crews', value: stats.crewsJoined, icon: Users, color: 'text-orange-600' }
          ].map((item, i) => (
            <div key={i} className="text-center">
              <item.icon className={`w-5 h-5 ${item.color} mx-auto mb-1`}/>
              <p className="text-lg font-bold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
        
        <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-shrink-0 text-sm pb-2.5 px-3 font-medium border-b-2 transition ${
                tab === t ? 'text-orange-500 border-orange-500' : 'text-gray-500 border-transparent'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        
        {tab === 'Posts' && (
          <div className="space-y-4">
            {myPosts.length === 0 ? (
              <div className="text-center py-8">
                <Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
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
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5"/>{post.likes || 0}
                    </span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {tab === 'Reviews' && (
          <div className="space-y-4">
            {myReviews.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                <p className="text-gray-500">No reviews yet</p>
                <button onClick={() => setPage('reviews')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">
                  Write a Review
                </button>
              </div>
            ) : (
              myReviews.map(review => (
                <div key={review.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-3 mb-2">
                    <DynamicBookCover title={review.bookName} author={review.author} size="sm"/>
                    <div>
                      <h3 className="font-semibold text-sm">{review.bookName}</h3>
                      <p className="text-xs text-gray-500">by {review.author}</p>
                      <StarRating rating={review.rating} size="xs"/>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{review.review}</p>
                </div>
              ))
            )}
          </div>
        )}
        
        {tab === 'Books Read' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">{books.length} books read</p>
              <button
                onClick={() => setShowAddBook(!showAddBook)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium"
              >
                <Plus className="w-4 h-4"/>{showAddBook ? 'Cancel' : 'Add Book'}
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
                    <StarRating rating={newBook.rating} onChange={r => setNewBook({ ...newBook, rating: r })} size="md"/>
                  </div>
                  <textarea
                    value={newBook.notes}
                    onChange={e => setNewBook({ ...newBook, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none resize-none"
                    placeholder="Notes (optional)"
                    rows={2}
                  />
                  <button
                    onClick={addBook}
                    className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium"
                  >
                    Add to My Books
                  </button>
                </div>
              </div>
            )}
            
            {books.length === 0 ? (
              <div className="text-center py-8">
                <BookMarked className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                <p className="text-gray-500 text-sm">No books tracked yet</p>
              </div>
            ) : (
              books.map(book => (
                <div key={book.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-start gap-3">
                  <DynamicBookCover title={book.title} author={book.author} size="sm"/>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{book.title}</h3>
                    <p className="text-xs text-gray-500">{book.author}</p>
                    <StarRating rating={book.rating} size="xs"/>
                    {book.notes && <p className="text-xs text-gray-600 mt-1 italic">"{book.notes}"</p>}
                  </div>
                  <button onClick={() => deleteBook(book.id)} className="p-1 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-400"/>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
        
        {tab === 'Saved Posts' && (
          <div className="space-y-4">
            {saved.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                <p className="text-gray-500">No saved posts yet</p>
              </div>
            ) : (
              saved.map(post => (
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

// ═══════════════════════════════════════════════════════════════════════════════
//  HOME PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const HomePage = ({ user, crews, setPage, refreshNotifCount, profileSrc, savedPosts, onSavePost, onResharePost, onDeletePost, onFollow, following, onBlock, blockedUsers, onViewUserProfile, onViewBookDetails }) => {
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedPage, setFeedPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [trending, setTrending] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showShare, setShowShare] = useState(null);
  const [showReshare, setShowReshare] = useState(null);
  const [stats, setStats] = useState(() => 
    JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{"booksRead":0,"reviewsGiven":0,"postsCreated":0,"crewsJoined":0}')
  );
  const [progress, setProgress] = useState(0);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);
  
  const loadPosts = useCallback(async (page = 1, replace = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    
    try {
      const res = await axios.get(`${API_URL}/api/social/posts`, {
        params: { page, limit: 20, userEmail: user.email },
        timeout: 10000
      });
      if (res.data.success) {
        const fresh = res.data.posts.filter(p => !blockedUsers.includes(p.userEmail));
        setFeedPosts(prev => replace ? fresh : [...prev, ...fresh]);
        setHasMore(res.data.hasMore);
        setFeedPage(page);
      }
    } catch {
      if (page === 1) {
        const cached = JSON.parse(localStorage.getItem('allPosts') || '[]');
        setFeedPosts(cached.filter(p => !blockedUsers.includes(p.userEmail)));
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user.email, blockedUsers]);
  
  useEffect(() => {
    loadPosts(1, true);
    
    axios.get(`${API_URL}/api/books/trending?limit=8`)
      .then(res => { if (res.data.success) setTrending(res.data.books); })
      .catch(() => setTrending([
        { title: 'Atomic Habits', author: 'James Clear', rating: 4.8 },
        { title: 'Project Hail Mary', author: 'Andy Weir', rating: 4.8 },
        { title: 'Fourth Wing', author: 'Rebecca Yarros', rating: 4.6 },
        { title: 'The Midnight Library', author: 'Matt Haig', rating: 4.6 },
        { title: 'The Psychology of Money', author: 'Morgan Housel', rating: 4.7 },
      ]));
    
    const newStats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    setStats(newStats);
    
    if (user?.readingGoal?.yearly > 0) {
      setProgress(Math.min(((newStats.booksRead || 0) / user.readingGoal.yearly) * 100, 100));
    }
    
    socket.on('new_post', post => {
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
  }, [user.email, blockedUsers, loadPosts]);
  
  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadPosts(feedPage + 1);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, feedPage, loadPosts]);
  
  const userCrews = crews.filter(c => user?.joinedCrews?.includes(c.id));
  
  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <TopBar
        user={user}
        setPage={setPage}
        profileSrc={profileSrc}
        onNotifClick={() => setPage('notifications')}
        notifCount={JSON.parse(localStorage.getItem(notifKey(user.email)) || '[]').filter(n => !n.read).length}
      />
      
      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onCreateCrew={book => {
            const newCrew = {
              id: genId(),
              name: book.title,
              author: book.author,
              genre: book.genre || 'General',
              members: 1,
              chats: 0,
              createdBy: user.email,
              createdByName: user.name,
              createdAt: new Date().toISOString()
            };
            const updated = JSON.parse(localStorage.getItem('crews') || '[]');
            localStorage.setItem('crews', JSON.stringify([newCrew, ...updated]));
            setPage('crews');
          }}
        />
      )}
      
      {showShare && <ShareModal post={showShare} onClose={() => setShowShare(null)}/>}
      
      {showReshare && (
        <ReshareModal
          post={showReshare}
          onClose={() => setShowReshare(null)}
          onReshare={(post, comment) => {
            onResharePost(post, comment);
            setShowReshare(null);
          }}
        />
      )}
      
      <div className="px-4 py-4 space-y-5">
        {/* Welcome card */}
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
                <span className="font-semibold">{stats.booksRead}/{user.readingGoal.yearly} books</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }}/>
              </div>
            </div>
          )}
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Books', value: stats.booksRead, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100', page: 'profile' },
            { label: 'Reviews', value: stats.reviewsGiven, icon: Star, color: 'text-purple-600', bg: 'bg-purple-100', page: 'reviews' },
            { label: 'Posts', value: stats.postsCreated, icon: Edit3, color: 'text-green-600', bg: 'bg-green-100', page: 'post' },
            { label: 'Crews', value: stats.crewsJoined, icon: Users, color: 'text-orange-600', bg: 'bg-orange-100', page: 'crews' }
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md"
              onClick={() => setPage(item.page)}
            >
              <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center mb-2`}>
                <item.icon className={`w-4 h-4 ${item.color}`}/>
              </div>
              <p className="text-lg font-bold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
        
        {/* Trending books */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500"/>Trending Books
            </h2>
            <button onClick={() => setPage('explore')} className="text-sm text-orange-500 font-semibold">
              Explore All
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {trending.map((book, i) => (
              <div
                key={i}
                className="shrink-0 w-28 cursor-pointer"
                onClick={() => setSelectedBook(book)}
              >
                <DynamicBookCover title={book.title} author={book.author} size="md"/>
                <p className="text-sm font-semibold text-gray-900 mt-2 leading-tight line-clamp-2">{book.title}</p>
                <p className="text-xs text-gray-500 truncate">{book.author}</p>
                {book.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400"/>
                    <span className="text-xs">{book.rating}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Quick post bar */}
        <button
          onClick={() => setPage('post')}
          className="w-full bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-center gap-3 hover:shadow-md"
        >
          {profileSrc ? (
            <img src={profileSrc} alt="" className="w-9 h-9 rounded-full object-cover"/>
          ) : (
            <Avatar initials={user?.name} size="sm"/>
          )}
          <span className="text-gray-400 text-sm flex-1 text-left">Share your reading journey…</span>
          <span className="text-xs text-orange-500 font-medium bg-orange-50 px-3 py-1 rounded-full">Post</span>
        </button>
        
        {/* Feed */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-500"/>Community Feed
          </h2>
          <div className="space-y-4">
            {loading && feedPosts.length === 0 ? (
              <div className="flex justify-center py-8"><Spin/></div>
            ) : feedPosts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                <p className="text-gray-500">No posts yet. Be the first!</p>
                <button onClick={() => setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">
                  Create Post
                </button>
              </div>
            ) : (
              feedPosts.map((post, idx) => (
                <InlinePostCard
                  key={post.id || post._id || idx}
                  post={post}
                  user={user}
                  profileSrc={profileSrc}
                  updateNotificationCount={refreshNotifCount}
                  onShare={p => setShowShare(p)}
                  onReshareClick={p => setShowReshare(p)}
                  onSaveToggle={onSavePost}
                  isSaved={savedPosts?.includes(post.id)}
                  onDelete={onDeletePost}
                  onFollow={onFollow}
                  isFollowing={following?.includes(post.userEmail)}
                  onBlock={onBlock}
                  isBlocked={blockedUsers?.includes(post.userEmail)}
                  onViewUserProfile={onViewUserProfile}
                  onViewBookDetails={b => setSelectedBook(b)}
                />
              ))
            )}
            <div ref={sentinelRef} className="py-2">
              {loading && feedPosts.length > 0 && (
                <div className="flex justify-center py-3"><Spin size="sm"/></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

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
    { id: 5, name: 'Tuesdays with Morrie', author: 'Mitch Albom', genre: 'Inspiration', members: 1, chats: 0, createdBy: 'system', createdByName: 'ReadCrew', createdAt: new Date().toISOString() },
  ]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);
  const prevNotifCount = useRef(0);
  
  // Online/offline detection
  useEffect(() => {
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);
  
  // Show/hide bottom nav
  useEffect(() => {
    setShowNav(page !== 'post' && !viewingUser);
  }, [page, viewingUser]);
  
  // Load initial data
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      setLoggedIn(true);
      setFollowing(JSON.parse(localStorage.getItem(`user_${u.email}_following`) || '[]'));
      setFollowers(JSON.parse(localStorage.getItem(`user_${u.email}_followers`) || '[]'));
      setBlocked(JSON.parse(localStorage.getItem(`user_${u.email}_blocked`) || '[]'));
      setSavedPosts(JSON.parse(localStorage.getItem(spKey(u.email)) || '[]'));
      const img = localStorage.getItem(`user_${u.email}_profile_image`);
      if (img) setProfileSrc(img);
    }
    
    const savedCrews = JSON.parse(localStorage.getItem('crews') || '[]');
    if (savedCrews.length > 0) setCrews(savedCrews);
    
    setPosts(JSON.parse(localStorage.getItem('allPosts') || '[]'));
    setLoading(false);
  }, []);
  
  // BUG 3: Notification system with polling + BroadcastChannel
  const refreshCount = useCallback(() => {
    if (!user) return;
    const list = JSON.parse(localStorage.getItem(notifKey(user.email)) || '[]');
    const unread = list.filter(n => !n.read).length;
    setNotifCount(unread);
    if (unread > prevNotifCount.current) {
      const newest = list.find(n => !n.read);
      if (newest) setToast(newest);
    }
    prevNotifCount.current = unread;
  }, [user]);
  
  useEffect(() => {
    if (!user) return;
    refreshCount();
    
    // Poll server every 10 seconds
    const poll = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/social/notifications/${encodeURIComponent(user.email)}`, { timeout: 8000 });
        if (res.data.success) {
          const serverList = res.data.notifications;
          localStorage.setItem(notifKey(user.email), JSON.stringify(serverList));
          const unread = serverList.filter(n => !n.read).length;
          if (unread > prevNotifCount.current) {
            const newest = serverList.find(n => !n.read);
            if (newest) setToast(newest);
          }
          prevNotifCount.current = unread;
          setNotifCount(unread);
        }
      } catch { /* ignore */ }
    };
    poll();
    const interval = setInterval(poll, 10000);
    
    // BroadcastChannel
    if (_bc) {
      _bc.onmessage = (e) => {
        if (e.data?.targetEmail === user.email) {
          setToast(e.data.notif);
          refreshCount();
        }
      };
    }
    
    // Custom event
    const onNotif = () => refreshCount();
    window.addEventListener('rc:notif', onNotif);
    
    // Socket.io
    socket.emit('join_user_room', user.email);
    socket.on('new_notification', notif => {
      setToast(notif);
      storeNotif(user.email, notif);
      refreshCount();
    });
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('rc:notif', onNotif);
      socket.off('new_notification');
      if (_bc) _bc.onmessage = null;
    };
  }, [user, refreshCount]);
  
  const handleLogin = (u) => {
    setUser(u);
    setLoggedIn(true);
    localStorage.setItem('currentUser', JSON.stringify(u));
    setPage('home');
  };
  
  const handleLogout = () => {
    setLoggedIn(false);
    setUser(null);
    setPage('home');
    localStorage.removeItem('currentUser');
  };
  
  const handleUpdateUser = (u) => {
    setUser(u);
    localStorage.setItem('currentUser', JSON.stringify(u));
  };
  
  const handlePost = (postData) => {
    const newPost = {
      ...postData,
      id: postData.id || genId(),
      createdAt: postData.createdAt || new Date().toISOString(),
      likes: postData.likes || 0,
      comments: 0,
      reshareCount: postData.reshareCount || 0
    };
    
    const all = JSON.parse(localStorage.getItem('allPosts') || '[]');
    all.unshift(newPost);
    if (all.length > 500) all.length = 500;
    localStorage.setItem('allPosts', JSON.stringify(all));
    setPosts(all);
    
    const stats = JSON.parse(localStorage.getItem(`user_${user.email}_stats`) || '{}');
    stats.postsCreated = (stats.postsCreated || 0) + 1;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
    
    const updatedUser = { ...user, stats };
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };
  
  const handleDeletePost = (post) => {
    const all = JSON.parse(localStorage.getItem('allPosts') || '[]').filter(p => p.id !== post.id);
    localStorage.setItem('allPosts', JSON.stringify(all));
    setPosts(all);
  };
  
  const handleSavePost = (post) => {
    const current = JSON.parse(localStorage.getItem(spKey(user.email)) || '[]');
    const updated = current.includes(post.id)
      ? current.filter(id => id !== post.id)
      : [...current, post.id];
    localStorage.setItem(spKey(user.email), JSON.stringify(updated));
    setSavedPosts(updated);
  };
  
  const handleReshare = (originalPost, comment) => {
    const all = JSON.parse(localStorage.getItem('allPosts') || '[]');
    const updatedAll = all.map(p => p.id === originalPost.id ? { ...p, reshareCount: (p.reshareCount || 0) + 1 } : p);
    localStorage.setItem('allPosts', JSON.stringify(updatedAll));
    setPosts(updatedAll);
    
    handlePost({
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
    });
    
    if (originalPost.userEmail !== user.email) {
      storeNotif(originalPost.userEmail, {
        type: 'reshare',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} reshared your post`,
        postId: originalPost.id
      });
      refreshCount();
    }
  };
  
  const handleFollow = (targetEmail, targetName) => {
    const current = JSON.parse(localStorage.getItem(`user_${user.email}_following`) || '[]');
    const willFollow = !current.includes(targetEmail);
    
    const updated = willFollow ? [...current, targetEmail] : current.filter(e => e !== targetEmail);
    localStorage.setItem(`user_${user.email}_following`, JSON.stringify(updated));
    setFollowing(updated);
    
    const targetFollowers = JSON.parse(localStorage.getItem(`user_${targetEmail}_followers`) || '[]');
    const updatedTarget = willFollow
      ? (targetFollowers.includes(user.email) ? targetFollowers : [...targetFollowers, user.email])
      : targetFollowers.filter(e => e !== user.email);
    localStorage.setItem(`user_${targetEmail}_followers`, JSON.stringify(updatedTarget));
    
    if (willFollow) {
      storeNotif(targetEmail, {
        type: 'follow',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} started following you`,
      });
      refreshCount();
    }
  };
  
  const handleBlock = (targetEmail) => {
    const current = JSON.parse(localStorage.getItem(`user_${user.email}_blocked`) || '[]');
    const willBlock = !current.includes(targetEmail);
    
    const updated = willBlock ? [...current, targetEmail] : current.filter(e => e !== targetEmail);
    localStorage.setItem(`user_${user.email}_blocked`, JSON.stringify(updated));
    setBlocked(updated);
    
    if (willBlock) {
      const unfollow = following.filter(e => e !== targetEmail);
      localStorage.setItem(`user_${user.email}_following`, JSON.stringify(unfollow));
      setFollowing(unfollow);
    }
  };
  
  const filteredPosts = posts.filter(p => !blocked.includes(p.userEmail));
  
  if (loading) return <Spin size="xl" full/>;
  if (!loggedIn) return <LoginPage onLogin={handleLogin}/>;
  
  return (
    <div className="flex justify-center min-h-screen bg-gray-200">
      {toast && <NotifToast notif={toast} onClose={() => setToast(null)}/>}
      
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-1 text-xs z-[100]">
          <WifiOff className="w-3 h-3 inline mr-1"/>You're offline.
        </div>
      )}
      
      <div className="w-full max-w-md relative bg-white min-h-screen overflow-hidden shadow-xl">
        
        {/* Viewing another user's profile */}
        {viewingUser && (
          <div className="fixed inset-0 bg-white z-[60] overflow-y-auto" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
              <button onClick={() => setViewingUser(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5"/>
              </button>
              <h2 className="font-semibold">{viewingUser.name}'s Profile</h2>
              <div className="w-6"/>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-4 mb-5">
                <Avatar initials={viewingUser.name} size="xl"/>
                <div>
                  <h2 className="text-xl font-bold">{viewingUser.name}</h2>
                  <p className="text-sm text-gray-500">@{viewingUser.name?.toLowerCase().replace(/\s/g,'')}</p>
                  {viewingUser.email !== user.email && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleFollow(viewingUser.email, viewingUser.name)}
                        className={`flex-1 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 ${
                          following.includes(viewingUser.email) ? 'bg-gray-200 text-gray-700' : 'bg-orange-500 text-white'
                        }`}
                      >
                        {following.includes(viewingUser.email) ? (
                          <><UserMinus className="w-4 h-4"/>Unfollow</>
                        ) : (
                          <><UserPlus className="w-4 h-4"/>Follow</>
                        )}
                      </button>
                      <button
                        onClick={() => handleBlock(viewingUser.email)}
                        className={`px-4 py-2 rounded-xl font-semibold text-sm ${
                          blocked.includes(viewingUser.email) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3"/>{p.likes || 0}</span>
                      <span>{formatTimeAgo(p.createdAt)}</span>
                    </div>
                  </div>
                ))}
                {posts.filter(p => p.userEmail === viewingUser.email).length === 0 && (
                  <div className="text-center py-8">
                    <Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
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
                crews={crews}
                setPage={setPage}
                refreshNotifCount={refreshCount}
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
                onViewBookDetails={(book) => console.log('View book details:', book)}
              />
            )}
            
            {page === 'post' && <PostPage user={user} onPost={handlePost} setPage={setPage}/>}
            
            {page === 'reviews' && (
              <ReviewsPage
                user={user}
                setPage={setPage}
                refreshNotifCount={refreshCount}
                onViewUserProfile={(email, name) => setViewingUser({ email, name })}
              />
            )}
            
            {page === 'explore' && (
              <ExplorePage
                user={user}
                setPage={setPage}
                onCreateCrew={book => {
                  const newCrew = {
                    id: genId(),
                    name: book.title,
                    author: book.author,
                    genre: book.genre || 'General',
                    members: 1,
                    chats: 0,
                    createdBy: user.email,
                    createdByName: user.name,
                    createdAt: new Date().toISOString()
                  };
                  const updated = [newCrew, ...crews];
                  setCrews(updated);
                  localStorage.setItem('crews', JSON.stringify(updated));
                  setPage('crews');
                }}
              />
            )}
            
            {page === 'crews' && (
              <CrewsPage
                user={user}
                crews={crews}
                setPage={setPage}
                refreshNotifCount={refreshCount}
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
                onClose={() => { setPage('home'); refreshCount(); }}
                refreshCount={refreshCount}
              />
            )}
            
            <BottomNav active={page} setPage={setPage} unreadCount={notifCount} show={showNav}/>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Global CSS ────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.querySelector('style[data-rc]')) {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
      to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    .animate-slideDown { animation: slideDown .3s ease-out; }
    .line-clamp-1 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; }
    .line-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
    .line-clamp-3 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
  `;
  style.setAttribute('data-rc', 'true');
  document.head.appendChild(style);
}