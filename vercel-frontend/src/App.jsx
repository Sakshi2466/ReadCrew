// ========================================
// App.jsx - READCREWW Social Platform
// Version: 6.0 — Complete Rewrite
// ✅ READCREWW (double W)
// ✅ One book = one crew globally (enforced)
// ✅ Crews & chat GLOBAL (BroadcastChannel + localStorage)
// ✅ Reviews GLOBAL & working
// ✅ Books read, saved posts, crews = PRIVATE per user
// ✅ Followers/Following → clicking name → goes to profile
// ✅ Leave crew option
// ✅ Mic + image + video in crew chat
// ✅ Orange themed chat wallpaper
// ✅ Book status (story/ring like IG) in profile
// ✅ Book Date REMOVED
// ✅ Gen Z slangs throughout
// ✅ 10k user performance optimizations
// ✅ Full book descriptions (no truncation)
// ========================================

// ── IMPORTS ─────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import {
  BookOpen, Search, Edit3, Users, Bell,
  Heart, MessageCircle, Bookmark, Share2, Star, Plus, ChevronRight,
  X, Send, ChevronLeft, LogOut, Camera, MoreHorizontal,
  Sparkles, Lock, Eye, EyeOff, UserPlus,
  Trash2, Edit, Target, ArrowLeft, TrendingUp,
  MessageSquare, Globe, ChevronDown,
  Mail, Link2, AtSign, Flag,
  MapPin, Navigation, Repeat,
  UserCheck, UserMinus, WifiOff,
  AlertCircle, CheckCircle, Info,
  RefreshCw, ExternalLink, Mic, MicOff, Video, Image,
  Play, Square, StopCircle,
} from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

// ── CONFIGURATION ─────────────────────────────────────────────────────────
const APP_NAME    = 'READCREWW';
const APP_TAGLINE = 'no cap, reading just hits different 📚✨';
const API_URL     = process.env.REACT_APP_API_URL || 'https://versal-book-app.onrender.com';

const bc = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('readcreww_v6') : null;

const socket = io(API_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
});

const api = {
  get:  (url, cfg = {}) => axios.get(`${API_URL}${url}`,  { timeout: 8000, ...cfg }).catch(() => null),
  post: (url, body, cfg = {}) => axios.post(`${API_URL}${url}`, body, { timeout: 8000, ...cfg }).catch(() => null),
};

// ── GLOBAL KEYS ───────────────────────────────────────────────────────────
const GLOBAL_CREWS_KEY   = 'rcreww_global_crews_v6';
const GLOBAL_POSTS_KEY   = 'rcreww_allPosts_v6';
const GLOBAL_REVIEWS_KEY = 'rcreww_reviews_v6';

const getLS  = (key, def) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? def; } catch { return def; } };
const setLS  = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };
const broadcastMsg = (type, payload) => { try { bc?.postMessage({ type, payload }); } catch {} };

// ── SEED CREWS ────────────────────────────────────────────────────────────
const SEED_CREWS = [
  { id: 'sc_atomic',      name: 'Atomic Habits',           author: 'James Clear',        genre: 'Self-Help',      members: 24 },
  { id: 'sc_4wing',       name: 'Fourth Wing',             author: 'Rebecca Yarros',     genre: 'Fantasy',        members: 42 },
  { id: 'sc_hailmary',    name: 'Project Hail Mary',       author: 'Andy Weir',          genre: 'Sci-Fi',         members: 18 },
  { id: 'sc_midnight',    name: 'The Midnight Library',    author: 'Matt Haig',          genre: 'Fiction',        members: 29 },
  { id: 'sc_sapiens',     name: 'Sapiens',                 author: 'Yuval Noah Harari',  genre: 'History',        members: 22 },
  { id: 'sc_silent',      name: 'The Silent Patient',      author: 'Alex Michaelides',   genre: 'Thriller',       members: 33 },
  { id: 'sc_gonegirl',    name: 'Gone Girl',               author: 'Gillian Flynn',      genre: 'Thriller',       members: 21 },
  { id: 'sc_alchemist',   name: 'The Alchemist',           author: 'Paulo Coelho',       genre: 'Inspirational',  members: 31 },
  { id: 'sc_becoming',    name: 'Becoming',                author: 'Michelle Obama',     genre: 'Memoir',         members: 27 },
  { id: 'sc_psychology',  name: 'The Psychology of Money', author: 'Morgan Housel',      genre: 'Finance',        members: 19 },
  { id: 'sc_verity',      name: 'Verity',                  author: 'Colleen Hoover',     genre: 'Thriller',       members: 38 },
  { id: 'sc_beach',       name: 'The Beach',               author: 'Alex Garland',       genre: 'Fiction',        members: 15 },
  { id: 'sc_tuesdays',    name: 'Tuesdays with Morrie',    author: 'Mitch Albom',        genre: 'Inspiration',    members: 12 },
  { id: 'sc_kite',        name: 'The Kite Runner',         author: 'Khaled Hosseini',    genre: 'Historical',     members: 20 },
  { id: 'sc_booktf',      name: 'The Book Thief',          author: 'Markus Zusak',       genre: 'Historical',     members: 17 },
  { id: 'sc_itendsus',    name: 'It Ends with Us',         author: 'Colleen Hoover',     genre: 'Romance',        members: 35 },
  { id: 'sc_dune',        name: 'Dune',                    author: 'Frank Herbert',      genre: 'Sci-Fi',         members: 26 },
  { id: 'sc_normal',      name: 'Normal People',           author: 'Sally Rooney',       genre: 'Literary',       members: 14 },
];

const initGlobalCrews = () => {
  const existing = getLS(GLOBAL_CREWS_KEY, []);
  let changed = false;
  SEED_CREWS.forEach(seed => {
    if (!existing.find(c => c.id === seed.id)) {
      existing.push({ ...seed, createdBy: 'system', createdByName: 'READCREWW', createdAt: '2024-01-01T00:00:00Z', joinedEmails: [] });
      changed = true;
    }
  });
  if (changed) setLS(GLOBAL_CREWS_KEY, existing);
};

const getGlobalCrews = () => getLS(GLOBAL_CREWS_KEY, []);

const saveGlobalCrews = (crews) => {
  setLS(GLOBAL_CREWS_KEY, crews);
  broadcastMsg('crews_updated', null);
};

// ONE BOOK = ONE CREW globally enforced
const getOrCreateCrew = (bookTitle, bookAuthor, bookGenre, userEmail, userName) => {
  const crews  = getGlobalCrews();
  const norm   = s => (s || '').trim().toLowerCase();
  const exists = crews.find(c => norm(c.name) === norm(bookTitle) && norm(c.author) === norm(bookAuthor));
  if (exists) return { crew: exists, created: false };
  const newCrew = {
    id:            generateId(),
    name:          bookTitle,
    author:        bookAuthor,
    genre:         bookGenre || 'General',
    members:       1,
    createdBy:     userEmail,
    createdByName: userName,
    createdAt:     new Date().toISOString(),
    joinedEmails:  [userEmail],
  };
  saveGlobalCrews([newCrew, ...crews]);
  return { crew: newCrew, created: true };
};

// ── GLOBAL POSTS ─────────────────────────────────────────────────────────
const getGlobalPosts = () => getLS(GLOBAL_POSTS_KEY, []);
const saveGlobalPost = (post) => {
  const posts = getGlobalPosts();
  posts.unshift(post);
  if (posts.length > 5000) posts.length = 5000;
  setLS(GLOBAL_POSTS_KEY, posts);
  broadcastMsg('posts_updated', null);
};

// ── GLOBAL REVIEWS ────────────────────────────────────────────────────────
const getGlobalReviews = () => getLS(GLOBAL_REVIEWS_KEY, []);
const saveGlobalReview = (review) => {
  const reviews = getGlobalReviews();
  reviews.unshift(review);
  if (reviews.length > 2000) reviews.length = 2000;
  setLS(GLOBAL_REVIEWS_KEY, reviews);
  broadcastMsg('reviews_updated', null);
};

// ── LIKES / COMMENTS ─────────────────────────────────────────────────────
const getPostLikedBy   = (postId) => getLS(`rcreww_likes_${postId}`, []);
const hasUserLikedPost = (postId, email) => getPostLikedBy(postId).includes(email);
const getLikeCount     = (postId) => getPostLikedBy(postId).length;

const addGlobalLike = (postId, userEmail) => {
  const arr = getPostLikedBy(postId);
  if (arr.includes(userEmail)) return arr.length;
  arr.push(userEmail);
  setLS(`rcreww_likes_${postId}`, arr);
  const all = getGlobalPosts();
  setLS(GLOBAL_POSTS_KEY, all.map(p => p.id === postId ? { ...p, likes: arr.length } : p));
  broadcastMsg('post_liked', { postId, likes: arr.length });
  return arr.length;
};

const getPostComments = (postId) => getLS(`rcreww_cmts_${postId}`, []);
const addGlobalComment = (postId, commentData) => {
  const cmts = getPostComments(postId);
  cmts.push(commentData);
  setLS(`rcreww_cmts_${postId}`, cmts);
  const all = getGlobalPosts();
  setLS(GLOBAL_POSTS_KEY, all.map(p => p.id === postId ? { ...p, comments: cmts.filter(c => !c.parentId).length } : p));
  broadcastMsg('comment_added', { postId });
  return cmts;
};

const incrementReshareCount = (postId) => {
  const all = getGlobalPosts();
  const updated = all.map(p => p.id === postId ? { ...p, reshareCount: (p.reshareCount || 0) + 1 } : p);
  setLS(GLOBAL_POSTS_KEY, updated);
  return updated.find(p => p.id === postId)?.reshareCount || 0;
};

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────
const _shownToastIds = new Set();
const pushNotification = (targetEmail, notif) => {
  if (!targetEmail) return;
  const key  = `rcreww_notifs_${targetEmail}`;
  const list = getLS(key, []);
  const full = { id: generateId(), ...notif, timestamp: new Date().toISOString(), read: false };
  const ago30 = Date.now() - 30000;
  const dup = list.some(n => n.type === full.type && n.fromUserEmail === full.fromUserEmail && n.postId === full.postId && new Date(n.timestamp).getTime() > ago30);
  if (dup) return;
  list.unshift(full);
  if (list.length > 200) list.length = 200;
  setLS(key, list);
  window.dispatchEvent(new CustomEvent('rc:notif', { detail: { targetEmail } }));
  broadcastMsg('notif', { targetEmail });
  api.post('/api/social/notifications', { targetEmail, notification: full });
};

// ── DEEP LINK ─────────────────────────────────────────────────────────────
const deepLink = (type, id) => {
  const base = window.location.origin + window.location.pathname;
  return `${base}?rc_type=${type}&rc_id=${encodeURIComponent(id)}`;
};
const parseDeepLink = () => {
  const p = new URLSearchParams(window.location.search);
  const type = p.get('rc_type'), id = p.get('rc_id');
  if (type && id) return { type, id };
  const h = window.location.hash.replace('#', '');
  if (h.startsWith('post/')) return { type: 'post', id: h.slice(5) };
  if (h.startsWith('crew/')) return { type: 'crew', id: h.slice(5) };
  return null;
};

// ── FEED ALGORITHM ────────────────────────────────────────────────────────
const FEED_WEIGHTS = {
  follow_author: 6.0, close_friend: 3.0, like: 2.0, comment: 3.5, save: 4.0, share: 5.0,
  recency_half_life: 24, min_score_factor: 0.05, discovery_ratio: 0.20,
};
const buildInterestProfile = (userEmail) => {
  const allPosts  = getGlobalPosts();
  const likedIds  = getLS(`rcreww_liked_posts_${userEmail}`, []);
  const savedIds  = getLS(`rcreww_saved_${userEmail}`, []);
  const following = getLS(`rcreww_following_${userEmail}`, []);
  const authorScores = {}, bookScores = {};
  likedIds.forEach(id => {
    const p = allPosts.find(x => x.id === id); if (!p) return;
    authorScores[p.userEmail] = (authorScores[p.userEmail] || 0) + FEED_WEIGHTS.like;
    if (p.bookName) bookScores[p.bookName] = (bookScores[p.bookName] || 0) + FEED_WEIGHTS.like;
  });
  savedIds.forEach(id => {
    const p = allPosts.find(x => x.id === id); if (!p) return;
    authorScores[p.userEmail] = (authorScores[p.userEmail] || 0) + FEED_WEIGHTS.save;
    if (p.bookName) bookScores[p.bookName] = (bookScores[p.bookName] || 0) + FEED_WEIGHTS.save;
  });
  const closeFriends = Object.entries(authorScores).sort(([,a],[,b])=>b-a).slice(0,10).map(([e])=>e);
  return { following, closeFriends, authorScores, bookScores };
};
const scorePost = (post, profile) => {
  let score = 0;
  if (profile.following.includes(post.userEmail)) score += FEED_WEIGHTS.follow_author;
  if (profile.closeFriends.includes(post.userEmail)) score += FEED_WEIGHTS.close_friend;
  score += (profile.authorScores[post.userEmail] || 0) * 0.4;
  if (post.bookName && profile.bookScores[post.bookName]) score += profile.bookScores[post.bookName] * 0.3;
  const eng = (post.likes || 0) * 2 + (post.comments || 0) * 3 + (post.reshareCount || 0) * 5;
  score += Math.log(eng + 1) * 1.5;
  const ageHrs = (Date.now() - new Date(post.createdAt)) / 3600000;
  const decay = Math.max(Math.pow(0.5, ageHrs / FEED_WEIGHTS.recency_half_life), FEED_WEIGHTS.min_score_factor);
  return score * decay;
};
const generatePersonalizedFeed = (userEmail, allPosts, blockedUsers = []) => {
  if (!allPosts?.length) return [];
  const profile    = buildInterestProfile(userEmail);
  const candidates = allPosts.filter(p => !blockedUsers.includes(p.userEmail));
  const scored     = candidates.map(post => ({ post, score: scorePost(post, profile) })).sort((a,b)=>b.score-a.score);
  const pCount     = Math.floor(scored.length * (1 - FEED_WEIGHTS.discovery_ratio));
  const pFeed      = scored.slice(0, pCount).map(s => s.post);
  const dPool      = scored.slice(pCount);
  for (let i = dPool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [dPool[i], dPool[j]] = [dPool[j], dPool[i]]; }
  const dFeed = dPool.map(s => s.post);
  const final = []; let pi = 0, di = 0;
  while (pi < pFeed.length || di < dFeed.length) {
    for (let i = 0; i < 4 && pi < pFeed.length; i++) final.push(pFeed[pi++]);
    if (di < dFeed.length) final.push(dFeed[di++]);
  }
  return final;
};

// ── UTILITIES ─────────────────────────────────────────────────────────────
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
const formatTimeAgo = (ts) => {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  if (isNaN(diff)) return '';
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), d = Math.floor(diff/86400000);
  if (m < 1) return 'just now'; if (m < 60) return `${m}m`; if (h < 24) return `${h}h`;
  if (d < 7) return `${d}d`; return new Date(ts).toLocaleDateString();
};
const sanitizeText = (t) => (t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const extractMentions = (text) => (text.match(/@(\w+)/g)||[]).map(m=>m.substring(1));

const GEN_Z_PLACEHOLDERS = [
  "spill the tea on what you're reading rn ☕",
  "bestie what book got you in your feels?",
  "no cap, what's your current hyperfixation?",
  "it's giving main character energy 📚",
  "POV: you just finished a banger, share it",
  "lowkey obsessed with this book rn...",
  "slay or flop? drop your hot take 🔥",
  "living in my bookish era, what about you?",
  "that plot twist ate fr fr 👀",
];

// ── COVER CACHE ───────────────────────────────────────────────────────────
const _coverCache = new Map();

// ── CREW PRESENCE & TYPING HOOKS ──────────────────────────────────────────
const useCrewPresence = (crewId, userId, userName) => {
  const [onlineCount, setOnlineCount] = useState(0);
  const PRESENCE_TTL = 30000, HEARTBEAT = 15000;
  const mark = useCallback(() => {
    if (!crewId||!userId) return;
    setLS(`crew_${crewId}_presence_${userId}`, { userId, userName, ts: Date.now() });
  },[crewId,userId,userName]);
  const getOnline = useCallback(() => {
    if (!crewId) return [];
    const now = Date.now(), out = [];
    for (let i=0;i<localStorage.length;i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(`crew_${crewId}_presence_`)) {
        try { const d = JSON.parse(localStorage.getItem(k)); if (d && now-d.ts < PRESENCE_TTL) out.push(d); else localStorage.removeItem(k); } catch { localStorage.removeItem(k); }
      }
    }
    return out;
  },[crewId]);
  useEffect(() => {
    if (!crewId||!userId) return;
    mark(); setOnlineCount(getOnline().length);
    const iv = setInterval(()=>{ mark(); setOnlineCount(getOnline().length); }, HEARTBEAT);
    return ()=>{ clearInterval(iv); if(crewId&&userId) localStorage.removeItem(`crew_${crewId}_presence_${userId}`); };
  },[crewId,userId,mark,getOnline]);
  return { onlineCount };
};

const useTypingIndicator = (crewId, userId, userName) => {
  const [typingUsers, setTypingUsers] = useState([]);
  const tRef = useRef(null);
  const TYPING_TTL = 3000;
  const broadcastTyping = useCallback(()=>{
    if (!crewId||!userId) return;
    setLS(`crew_${crewId}_typing_${userId}`, { userId, userName, ts: Date.now() });
    clearTimeout(tRef.current);
    tRef.current = setTimeout(()=>localStorage.removeItem(`crew_${crewId}_typing_${userId}`), TYPING_TTL);
  },[crewId,userId,userName]);
  const stopTyping = useCallback(()=>{
    if (!crewId||!userId) return;
    clearTimeout(tRef.current);
    localStorage.removeItem(`crew_${crewId}_typing_${userId}`);
  },[crewId,userId]);
  useEffect(()=>{
    if (!crewId) return;
    const iv = setInterval(()=>{
      const now=Date.now(), typing=[];
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i);
        if(k?.startsWith(`crew_${crewId}_typing_`)&&!k.includes(`_${userId}`)){
          try{ const d=JSON.parse(localStorage.getItem(k)); if(d&&now-d.ts<TYPING_TTL) typing.push(d.userName); else localStorage.removeItem(k); }catch{localStorage.removeItem(k);}
        }
      }
      setTypingUsers(typing);
    },1500);
    return ()=>{ clearInterval(iv); stopTyping(); };
  },[crewId,userId,stopTyping]);
  return { typingUsers, broadcastTyping, stopTyping };
};

// ══════════════════════════════════════════════════════════════════════════════
// BASE UI COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

const Avatar = memo(({ initials, size = 'md', src, onClick, hasStatus = false, statusBook = null }) => {
  const sizes = { xs:'w-7 h-7 text-xs', sm:'w-9 h-9 text-sm', md:'w-11 h-11 text-sm', lg:'w-16 h-16 text-xl', xl:'w-20 h-20 text-2xl' };
  const grads = ['from-orange-400 to-pink-500','from-violet-500 to-purple-600','from-emerald-400 to-teal-500','from-blue-400 to-indigo-500','from-rose-400 to-red-500','from-amber-400 to-orange-500'];
  const g = grads[(initials||'?').charCodeAt(0) % grads.length];
  const ringColors = ['ring-orange-400','ring-pink-400','ring-violet-400','ring-emerald-400','ring-blue-400','ring-amber-400'];
  const ringColor = ringColors[(initials||'?').charCodeAt(0) % ringColors.length];
  
  return (
    <div className={`relative flex-shrink-0 ${hasStatus ? `ring-2 ring-offset-1 ${ringColor} rounded-full` : ''}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className={`${sizes[size]} rounded-full overflow-hidden`}>
        {src
          ? <img src={src} alt={initials} className="w-full h-full object-cover" />
          : <div className={`w-full h-full bg-gradient-to-br ${g} flex items-center justify-center font-bold text-white`}>{(initials||'?').slice(0,2).toUpperCase()}</div>
        }
      </div>
    </div>
  );
});

const StarRating = memo(({ rating=0, onChange, size='sm', readonly=false }) => {
  const sz = { xs:'w-3 h-3', sm:'w-4 h-4', md:'w-5 h-5', lg:'w-6 h-6' }[size]||'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i=>(
        <Star key={i} className={`${sz} ${i<=rating?'fill-amber-400 text-amber-400':'text-gray-300'} ${onChange&&!readonly?'cursor-pointer hover:scale-110 transition-transform':''}`} onClick={()=>onChange?.(i)}/>
      ))}
    </div>
  );
});

const LoadingSpinner = ({ size='md', color='orange', fullScreen=false }) => {
  const s = { sm:'w-4 h-4', md:'w-8 h-8', lg:'w-12 h-12', xl:'w-16 h-16' }[size]||'w-8 h-8';
  const c = { orange:'border-orange-500', blue:'border-blue-500', white:'border-white', green:'border-green-500' }[color]||'border-orange-500';
  if (fullScreen) return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className={`${s} border-4 border-t-transparent ${c} rounded-full animate-spin`}/>
    </div>
  );
  return <div className={`${s} border-4 border-t-transparent ${c} rounded-full animate-spin`}/>;
};

const DynamicBookCover = memo(({ title, author, onClick, size='md' }) => {
  const sizeMap = { xs:'w-10 h-14', sm:'w-16 h-20', md:'w-24 h-32', lg:'w-32 h-44', xl:'w-40 h-52' };
  const cls = sizeMap[size]||sizeMap.md;
  const cacheKey = `${title}|${author}`;
  const [url,    setUrl]    = useState(_coverCache.get(cacheKey)||null);
  const [error,  setError]  = useState(false);
  const [loading,setLoad]   = useState(!_coverCache.has(cacheKey));

  useEffect(()=>{
    if (_coverCache.has(cacheKey)) { setUrl(_coverCache.get(cacheKey)); setLoad(false); return; }
    if (!title) { setError(true); setLoad(false); return; }
    let alive = true;
    const q = encodeURIComponent(`${title} ${author||''}`);
    fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&projection=lite`,{signal:AbortSignal.timeout(6000)})
      .then(r=>r.json()).then(d=>{
        if (!alive) return;
        const links = d?.items?.[0]?.volumeInfo?.imageLinks;
        if (links) {
          const raw = links.extraLarge||links.large||links.medium||links.thumbnail;
          if (raw) { const u=raw.replace('http:','https:').replace('&edge=curl',''); _coverCache.set(cacheKey,u); setUrl(u); setLoad(false); return; }
        }
        setError(true); setLoad(false);
      }).catch(()=>{ if(alive){setError(true);setLoad(false);} });
    return ()=>{alive=false;};
  },[cacheKey, title, author]);

  const colors = ['#7C3AED','#DC2626','#059669','#2563EB','#D97706','#DB2777','#0891B2','#EA580C'];
  const bg = colors[(title||'').charCodeAt(0)%colors.length];
  const initials = (title||'BK').slice(0,2).toUpperCase();

  if (loading) return <div className={`${cls} bg-gray-100 rounded-xl animate-pulse`} onClick={onClick}/>;
  if (error||!url) return (
    <div className={`${cls} rounded-xl flex flex-col items-center justify-center text-white font-bold cursor-pointer hover:scale-105 transition-transform shadow`} style={{backgroundColor:bg}} onClick={onClick}>
      <span className="text-xl">{initials}</span>
      <BookOpen className="w-4 h-4 mt-1 opacity-60"/>
    </div>
  );
  return (
    <div className={`${cls} rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow`} onClick={onClick}>
      <img src={url} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" onError={()=>{setUrl(null);setError(true);}} loading="lazy"/>
    </div>
  );
});

const NotificationToast = ({ notification, onClose }) => {
  useEffect(()=>{ const t=setTimeout(onClose,5000); return()=>clearTimeout(t); },[onClose]);
  const icons = { like:<Heart className="w-4 h-4 text-red-500"/>, comment:<MessageCircle className="w-4 h-4 text-blue-500"/>, follow:<UserCheck className="w-4 h-4 text-green-500"/>, reshare:<Repeat className="w-4 h-4 text-indigo-500"/>, success:<CheckCircle className="w-4 h-4 text-green-500"/>, info:<Info className="w-4 h-4 text-orange-500"/>, warning:<AlertCircle className="w-4 h-4 text-orange-500"/> };
  const bgs  = { like:'bg-red-50 border-red-200', comment:'bg-blue-50 border-blue-200', follow:'bg-green-50 border-green-200', reshare:'bg-indigo-50 border-indigo-200', success:'bg-green-50 border-green-200', info:'bg-orange-50 border-orange-200', warning:'bg-amber-50 border-amber-200' };
  const ibgs = { like:'bg-red-100', comment:'bg-blue-100', follow:'bg-green-100', reshare:'bg-indigo-100', success:'bg-green-100', info:'bg-orange-100', warning:'bg-amber-100' };
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] w-[90%] max-w-sm animate-slideDown">
      <div className={`rounded-2xl shadow-2xl border-2 overflow-hidden ${bgs[notification.type]||'bg-white border-gray-200'}`}>
        <div className="p-4 flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${ibgs[notification.type]||'bg-gray-100'}`}>
            {icons[notification.type]||<Bell className="w-5 h-5 text-gray-500"/>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 font-semibold leading-snug">{notification.message}</p>
            <p className="text-xs text-gray-500 mt-0.5">{formatTimeAgo(notification.timestamp||new Date())}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// BOOK DETAILS MODAL — FULL description, no truncation
// ══════════════════════════════════════════════════════════════════════════════
const BookDetailsModal = memo(({ book, onClose, onCreateCrew, currentUser }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('description');

  useEffect(()=>{
    let alive = true;
    setLoading(true);
    const q = encodeURIComponent(`${book.title} ${book.author||''}`);
    fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`,{signal:AbortSignal.timeout(10000)})
      .then(r=>r.json()).then(d=>{
        if (!alive) return;
        const info = d?.items?.[0]?.volumeInfo;
        if (info) {
          const rawDesc = info.description || '';
          const cleanDesc = rawDesc.replace(/<[^>]*>/g,'').trim();
          setDetails({
            title:         info.title,
            subtitle:      info.subtitle,
            authors:       info.authors||[book.author],
            description:   cleanDesc || `No description available for "${book.title}" rn bestie 😭 Check Goodreads for the full tea! ☕`,
            pageCount:     info.pageCount,
            publishedDate: info.publishedDate,
            publisher:     info.publisher,
            categories:    info.categories||[],
            averageRating: info.averageRating,
            ratingsCount:  info.ratingsCount,
            previewLink:   info.previewLink,
            language:      info.language,
            isbn:          info.industryIdentifiers,
          });
        } else {
          setDetails({ title: book.title, authors: [book.author||'Unknown Author'], description: `We couldn't fetch the full synopsis for "${book.title}" rn bestie 😭 Try checking Goodreads or your favourite bookstore for the complete description — but no cap, this book slaps fr! ☕📚`, categories: [] });
        }
        setLoading(false);
      }).catch(()=>{
        if (!alive) return;
        setDetails({ title: book.title, authors: [book.author||'Unknown Author'], description: `Couldn't load details rn (offline bestie 😭). Check Goodreads for the full tea! ☕`, categories: [] });
        setLoading(false);
      });
    return ()=>{alive=false;};
  },[book.title, book.author]);

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="bg-white rounded-3xl w-full max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center rounded-t-3xl z-10">
          <h3 className="font-black text-lg text-gray-900">Book Details</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition"><X className="w-5 h-5"/></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg"/></div>
        ) : details && (
          <div className="p-4 space-y-4">
            <div className="flex gap-4">
              <DynamicBookCover title={book.title} author={book.author} size="lg"/>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-black text-gray-900 leading-tight">{details.title}</h2>
                {details.subtitle && <p className="text-sm text-gray-500 mt-0.5">{details.subtitle}</p>}
                <p className="text-gray-500 text-sm mt-1">by {(details.authors||[]).join(', ')}</p>
                {details.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {details.categories.slice(0,3).map((c,i)=>(
                      <span key={i} className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full font-semibold">{c}</span>
                    ))}
                  </div>
                )}
                {details.averageRating && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <StarRating rating={Math.round(details.averageRating)} size="xs" readonly/>
                    <span className="text-xs text-gray-500">{details.averageRating.toFixed(1)} ({(details.ratingsCount||0).toLocaleString()} ratings)</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex border-b border-gray-200">
              {['description','details'].map(t=>(
                <button key={t} onClick={()=>setTab(t)} className={`flex-1 py-2.5 text-sm font-black border-b-2 transition capitalize ${tab===t?'text-orange-500 border-orange-500':'text-gray-400 border-transparent'}`}>{t}</button>
              ))}
            </div>
            {tab==='description' && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{details.description}</p>
              </div>
            )}
            {tab==='details' && (
              <div className="divide-y divide-gray-100">
                {[['Pages',details.pageCount],['Published',details.publishedDate ? new Date(details.publishedDate+'T00:00:00').getFullYear() : null],['Publisher',details.publisher],['Language',details.language?.toUpperCase()],['ISBN',details.isbn?.[0]?.identifier]].filter(([,v])=>v).map(([l,v])=>(
                  <div key={l} className="flex justify-between py-3">
                    <span className="text-sm text-gray-500">{l}</span>
                    <span className="text-sm font-black text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={()=>{ onCreateCrew?.(book); onClose(); }} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-95">
                <Users className="w-4 h-4"/>Create Crew
              </button>
              {details.previewLink && (
                <a href={details.previewLink} target="_blank" rel="noopener noreferrer" className="px-4 py-3 border border-gray-200 rounded-2xl text-gray-600 hover:bg-gray-50 transition">
                  <ExternalLink className="w-5 h-5"/>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// BOOK CARD
// ══════════════════════════════════════════════════════════════════════════════
const BookCard = memo(({ book, onCreateCrew, onViewDetails }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
    <div className="flex gap-3">
      <DynamicBookCover title={book.title} author={book.author} size="sm" onClick={()=>onViewDetails?.(book)}/>
      <div className="flex-1 min-w-0">
        <h3 className="font-black text-gray-900 text-sm leading-tight">{book.title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">by {book.author}</p>
        {book.genre && <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full font-semibold">{book.genre}</span>}
        {book.reason && <p className="text-xs text-gray-500 mt-1 italic">"{book.reason}"</p>}
        <div className="flex items-center gap-1.5 mt-2">
          <StarRating rating={Math.round(book.rating||4)} size="xs" readonly/>
          <span className="text-xs font-black text-gray-700">{book.rating||4.0}</span>
        </div>
      </div>
    </div>
    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
      <button onClick={()=>onViewDetails?.(book)} className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-black hover:bg-blue-600 transition">View Details</button>
      <button onClick={()=>onCreateCrew?.(book)} className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 hover:opacity-90 transition">
        <Users className="w-3.5 h-3.5"/>Join Crew
      </button>
    </div>
  </div>
));

// ══════════════════════════════════════════════════════════════════════════════
// BOTTOM NAV & TOP BAR
// ══════════════════════════════════════════════════════════════════════════════
const BottomNav = memo(({ active, setPage, unreadCount=0, show=true }) => {
  if (!show) return null;
  const items = [
    {id:'home',    icon:BookOpen,  label:'Home'},
    {id:'explore', icon:Sparkles,  label:'Explore'},
    {id:'post',    icon:Edit3,     label:'Post'},
    {id:'reviews', icon:Star,      label:'Reviews'},
    {id:'crews',   icon:Users,     label:'Crews'},
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-50 max-w-md mx-auto shadow-lg">
      <div className="flex items-center justify-around py-2 px-2">
        {items.map(({id,icon:Icon,label})=>(
          <button key={id} onClick={()=>setPage(id)} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative ${active===id?'text-orange-500':'text-gray-400 hover:text-gray-600'}`}>
            {id==='post' ? (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center -mt-5 shadow-lg ${active===id?'bg-orange-500':'bg-gray-800'}`}>
                <Icon className="w-5 h-5 text-white"/>
              </div>
            ) : <Icon className="w-5 h-5" strokeWidth={active===id?2.5:1.8}/>}
            {id==='crews' && unreadCount>0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black">{unreadCount>9?'9+':unreadCount}</span>
            )}
            <span className={`text-[10px] font-black ${id==='post'?'mt-1':''}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
});

const TopBar = memo(({ user, setPage, title, showBack=false, onBack, onNotificationClick, notificationCount=0, profileSrc }) => (
  <header className="sticky top-0 bg-white/95 backdrop-blur-sm z-40 px-4 py-3 flex items-center justify-between border-b border-gray-100">
    <div className="flex items-center gap-3">
      {showBack && <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-xl"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
          <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5}/>
        </div>
        <span className="font-black text-gray-900 text-lg tracking-tight" style={{fontFamily:'Georgia,serif'}}>{title||APP_NAME}</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button onClick={onNotificationClick} className="relative p-2 hover:bg-gray-100 rounded-xl transition">
        <Bell className="w-5 h-5 text-gray-600"/>
        {notificationCount>0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black">{notificationCount>9?'9+':notificationCount}</span>}
      </button>
      <button onClick={()=>setPage('profile')} className="hover:opacity-80 transition">
        <Avatar initials={user?.name} size="sm" src={profileSrc}/>
      </button>
    </div>
  </header>
));

// ══════════════════════════════════════════════════════════════════════════════
// SHARE MODAL
// ══════════════════════════════════════════════════════════════════════════════
const ShareModal = memo(({ post, crewInvite, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = post ? deepLink('post',post.id||post._id) : crewInvite ? deepLink('crew',crewInvite.id) : window.location.href;
  const shareText = crewInvite
    ? `bestie join the "${crewInvite.name}" reading crew on READCREWW! 📚`
    : `omg check out this post on READCREWW: "${(post?.content||'').substring(0,60)}..."`;

  const handlers = {
    whatsapp: ()=>window.open(`https://wa.me/?text=${encodeURIComponent(shareText+' '+shareUrl)}`, '_blank'),
    twitter:  ()=>window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank'),
    facebook: ()=>window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank'),
    linkedin: ()=>window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank'),
    telegram: ()=>window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank'),
    email:    ()=>window.open(`mailto:?subject=${encodeURIComponent('check this out on READCREWW')}&body=${encodeURIComponent(shareText+'\n\n'+shareUrl)}`, '_blank'),
    copy:     ()=>{ navigator.clipboard.writeText(shareUrl).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2500); },
  };
  const platforms = [
    {k:'whatsapp',color:'#25D366',letter:'W',label:'WhatsApp'},
    {k:'twitter', color:'#1DA1F2',letter:'𝕏',label:'Twitter'},
    {k:'facebook',color:'#1877F2',letter:'f',label:'Facebook'},
    {k:'linkedin',color:'#0A66C2',letter:'in',label:'LinkedIn'},
    {k:'telegram',color:'#0088cc',letter:'✈',label:'Telegram'},
  ];
  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="bg-white rounded-3xl w-full max-w-sm mx-auto">
        <div className="border-b border-gray-100 p-4 flex justify-between items-center">
          <h3 className="font-black">{crewInvite?'invite bestie to crew 🔥':'share this post'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5">
          {crewInvite && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-4 flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-orange-500 flex-shrink-0"/>
              <div><p className="text-sm font-black text-gray-900">{crewInvite.name}</p><p className="text-xs text-gray-500">by {crewInvite.author}</p></div>
            </div>
          )}
          <div className="grid grid-cols-5 gap-3 mb-5">
            {platforms.map(({k,color,letter,label})=>(
              <button key={k} onClick={handlers[k]} className="flex flex-col items-center gap-1.5 group">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm transition-transform group-hover:scale-110 shadow-sm" style={{backgroundColor:color}}>{letter}</div>
                <span className="text-[10px] text-gray-500">{label}</span>
              </button>
            ))}
          </div>
          <button onClick={handlers.email} className="w-full py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50 transition mb-2">
            <Mail className="w-5 h-5 text-orange-500"/><span className="font-black text-sm">via email</span>
          </button>
          <button onClick={handlers.copy} className={`w-full py-3 border rounded-xl flex items-center justify-center gap-2 transition ${copied?'border-green-400 bg-green-50 text-green-700':'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            {copied ? <><CheckCircle className="w-5 h-5 text-green-500"/><span className="font-black text-sm">Copied! ✅</span></> : <><Link2 className="w-5 h-5 text-orange-500"/><span className="font-black text-sm">copy link</span></>}
          </button>
        </div>
      </div>
    </div>
  );
});

const ReshareModal = memo(({ post, onClose, onReshare }) => {
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  if (!post) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="bg-white rounded-3xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-100 p-4 flex justify-between items-center sticky top-0 bg-white rounded-t-3xl">
          <h3 className="font-black flex items-center gap-2"><Repeat className="w-4 h-4 text-orange-500"/>reshare this post</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5">
          <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Avatar initials={post.userName} size="xs"/>
              <span className="text-xs font-black text-gray-700">{post.userName}</span>
              <span className="text-xs text-gray-400">{formatTimeAgo(post.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-3">{post.content||post.story}</p>
            {post.bookName && <div className="flex items-center gap-1 mt-2"><BookOpen className="w-3 h-3 text-orange-400"/><span className="text-xs text-gray-500">{post.bookName}</span></div>}
          </div>
          <label className="text-sm text-gray-600 mb-2 block font-black">add your thoughts (optional)</label>
          <textarea value={comment} onChange={e=>setComment(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 resize-none transition mb-2" placeholder="what's the vibe on this? 🤔" rows={3} maxLength={500}/>
          <p className="text-xs text-gray-400 text-right mb-4">{comment.length}/500</p>
          <div className="flex items-center gap-3 mb-5">
            <button onClick={()=>setIsPublic(!isPublic)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition font-black ${isPublic?'bg-orange-500 text-white':'bg-gray-100 text-gray-700'}`}>
              {isPublic?<Globe className="w-4 h-4"/>:<Lock className="w-4 h-4"/>}{isPublic?'Public':'Private'}
            </button>
            <span className="text-xs text-gray-400">{isPublic?'visible to everyone':'only you'}</span>
          </div>
          <button onClick={()=>{onReshare(post,comment.trim(),isPublic);onClose();}} className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-95">
            <Repeat className="w-4 h-4"/>Reshare Now 🚀
          </button>
        </div>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// USER PROFILE MODAL (quick view) — clicking name goes to full profile
// ══════════════════════════════════════════════════════════════════════════════
const UserProfileModal = memo(({ userEmail, userName, currentUser, onClose, onFollow, isFollowing, onViewFullProfile, onBlock, isBlocked }) => {
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [stats, setStats] = useState({ posts:0, reviews:0, followers:0, following:0 });

  useEffect(()=>{
    const users = getLS('rcreww_users',[]);
    const found = users.find(u=>u.email===userEmail);
    if (found) setUserData(found);
    const fwers = getLS(`rcreww_followers_${userEmail}`,[]);
    const fwing = getLS(`rcreww_following_${userEmail}`,[]);
    const allPosts = getGlobalPosts();
    const posts = allPosts.filter(p=>p.userEmail===userEmail).slice(0,5);
    setUserPosts(posts);
    const allRevs = getGlobalReviews();
    setStats({ posts:allPosts.filter(p=>p.userEmail===userEmail).length, reviews:allRevs.filter(r=>r.userEmail===userEmail).length, followers:fwers.length, following:fwing.length });
  },[userEmail]);

  const handleViewFullProfile = () => {
    onClose();
    onViewFullProfile(userEmail, userName);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[75] flex items-center justify-center p-4 overflow-y-auto" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="bg-white rounded-3xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center rounded-t-3xl">
          <h3 className="font-black">profile</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <button onClick={handleViewFullProfile} className="hover:opacity-80 transition">
              <Avatar initials={userName} size="lg" src={userData?.profileImage||getLS(`rcreww_pic_${userEmail}`,null)}/>
            </button>
            <div className="flex-1 min-w-0">
              {/* Clicking name → full profile */}
              <button onClick={handleViewFullProfile} className="font-black text-xl text-gray-900 truncate hover:underline hover:text-orange-500 transition block">{userName}</button>
              <p className="text-sm text-gray-400">@{userName?.toLowerCase().replace(/\s/g,'')}</p>
              {userData?.bio && <p className="text-sm text-gray-600 mt-1 italic line-clamp-2">"{userData.bio}"</p>}
              <div className="flex gap-4 mt-2">
                <div className="text-center"><p className="font-black text-gray-900">{stats.followers}</p><p className="text-xs text-gray-500">followers</p></div>
                <div className="text-center"><p className="font-black text-gray-900">{stats.following}</p><p className="text-xs text-gray-500">following</p></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[['Posts',stats.posts],['Reviews',stats.reviews],['Followers',stats.followers]].map(([l,v])=>(
              <div key={l} className="text-center p-2 bg-gray-50 rounded-xl">
                <p className="text-lg font-black text-gray-900">{v}</p>
                <p className="text-xs text-gray-500">{l}</p>
              </div>
            ))}
          </div>
          {userEmail!==currentUser.email && (
            <div className="flex gap-2 mb-5">
              <button onClick={()=>onFollow(userEmail,userName)} className={`flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition ${isFollowing?'bg-gray-200 text-gray-700':'bg-gradient-to-r from-orange-500 to-pink-500 text-white'}`}>
                {isFollowing?<><UserMinus className="w-4 h-4"/>unfollow</>:<><UserPlus className="w-4 h-4"/>follow</>}
              </button>
              <button onClick={()=>onBlock(userEmail,userName)} className={`flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition ${isBlocked?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                {isBlocked?<><UserCheck className="w-4 h-4"/>unblock</>:<><UserMinus className="w-4 h-4"/>block</>}
              </button>
            </div>
          )}
          {userPosts.length>0 && (
            <div className="mb-5">
              <h3 className="font-black text-gray-900 mb-3">recent posts</h3>
              <div className="space-y-2">
                {userPosts.map(post=>(
                  <div key={post.id} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs text-gray-400">{formatTimeAgo(post.createdAt)}</p>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-gray-500"><Heart className="w-3 h-3"/>{getLikeCount(post.id)||post.likes||0}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-500"><MessageCircle className="w-3 h-3"/>{post.comments||0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={handleViewFullProfile} className="w-full py-3 border border-orange-200 text-orange-600 rounded-2xl font-black hover:bg-orange-50 transition">
            view full profile →
          </button>
        </div>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// POST OPTIONS MODAL
// ══════════════════════════════════════════════════════════════════════════════
const PostOptionsModal = memo(({ post, user, onClose, onReshare, onSave, isSaved, onDelete, isOwner, onFollow, isFollowing, onBlock, isBlocked }) => {
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const reportReasons = ['Spam or misleading','Harassment or bullying','Inappropriate content','Misinformation','Hate speech','Other'];

  const submitReport = () => {
    if (!reason) return;
    const reports = getLS('rcreww_reports',[]);
    reports.push({ postId:post.id, reportedBy:user.email, reason, postContent:post.content, postAuthor:post.userEmail, timestamp:new Date().toISOString() });
    setLS('rcreww_reports',reports);
    setReportSent(true);
    setTimeout(onClose,2000);
  };

  if (showReport) return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="bg-white rounded-t-3xl w-full p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="font-black text-lg">Report Post</h3>
          <button onClick={()=>setShowReport(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
        </div>
        {reportSent ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4"/>
            <p className="font-black text-gray-900 text-lg">Report submitted bestie</p>
            <p className="text-sm text-gray-500 mt-2">thanks for keeping READCREWW safe 🫶</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {reportReasons.map(r=>(
                <button key={r} onClick={()=>setReason(r)} className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition ${reason===r?'border-orange-500 bg-orange-50 text-orange-700 font-black':'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{r}</button>
              ))}
            </div>
            <button onClick={submitReport} disabled={!reason} className="w-full py-3 bg-red-500 text-white rounded-xl font-black disabled:opacity-40 hover:bg-red-600 transition flex items-center justify-center gap-2">
              <Flag className="w-4 h-4"/>Submit Report
            </button>
          </>
        )}
      </div>
    </div>
  );

  const opts = [
    {id:'reshare',icon:Repeat,   label:'Reshare',        color:'text-blue-600',   action:()=>{onReshare(post);onClose();}},
    {id:'save',   icon:Bookmark, label:isSaved?'Unsave':'Save', color:isSaved?'text-orange-500':'text-gray-700', action:()=>{onSave(post);onClose();}},
  ];
  if (!isOwner) {
    opts.push(
      {id:'follow',icon:isFollowing?UserMinus:UserPlus, label:isFollowing?'unfollow':'follow', color:isFollowing?'text-red-500':'text-green-600', action:()=>{onFollow(post.userEmail,post.userName);onClose();}},
      {id:'block', icon:isBlocked?UserCheck:UserMinus,  label:isBlocked?'unblock':'block',      color:isBlocked?'text-green-600':'text-red-500',   action:()=>{onBlock(post.userEmail,post.userName);onClose();}},
      {id:'report',icon:Flag, label:'Report Post', color:'text-red-500', action:()=>setShowReport(true)},
    );
  }
  if (isOwner) opts.push({id:'delete',icon:Trash2,label:'delete post 🗑️',color:'text-red-500',action:()=>{if(window.confirm('delete this post fr?')){onDelete(post);onClose();}}});

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="bg-white rounded-t-3xl w-full overflow-hidden">
        <div className="p-4 border-b border-gray-100"><h3 className="font-black text-center text-gray-700">post options</h3></div>
        <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
          {opts.map(o=>(
            <button key={o.id} onClick={o.action} className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition">
              <o.icon className={`w-5 h-5 ${o.color}`}/><span className={`text-sm font-black ${o.color}`}>{o.label}</span>
            </button>
          ))}
          <button onClick={onClose} className="w-full px-4 py-3.5 text-sm text-gray-400 hover:bg-gray-50 transition font-black">nah, cancel</button>
        </div>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// INLINE POST CARD
// ══════════════════════════════════════════════════════════════════════════════
const InlinePostCard = memo(({ post, user, profileSrc, updateNotificationCount, onShare, onReshareClick, onSaveToggle, isSaved, onDelete, onFollow, isFollowing, onBlock, isBlocked, onViewUserProfile, onViewBookDetails }) => {
  const [isLiked,      setIsLiked]   = useState(()=>hasUserLikedPost(post.id,user.email));
  const [likeCount,    setLikeCount] = useState(()=>getLikeCount(post.id)||post.likes||0);
  const [showComments, setShowCmts]  = useState(false);
  const [comments,     setCmts]      = useState([]);
  const [commentCount, setCmtCount]  = useState(post.comments||0);
  const [newComment,   setNewCmt]    = useState('');
  const [likedCmts,    setLikedCmts] = useState(()=>new Set(getLS(`rcreww_liked_cmts_${user.email}`,[])));
  const [showAllCmts,  setShowAll]   = useState(false);
  const [replyTo,      setReplyTo]   = useState(null);
  const [showReplies,  setShowReplies]=useState({});
  const [showOptions,  setShowOpts]  = useState(false);
  const [loadingCmts,  setLoadCmts]  = useState(false);
  const inputRef = useRef(null);

  useEffect(()=>{
    setLikeCount(getLikeCount(post.id)||post.likes||0);
    setIsLiked(hasUserLikedPost(post.id,user.email));
  },[post.id, user.email]);

  useEffect(()=>{
    if (!showComments) return;
    setLoadCmts(true);
    setCmts(getPostComments(post.id));
    setCmtCount(getPostComments(post.id).filter(c=>!c.parentId).length);
    setLoadCmts(false);
  },[showComments, post.id]);

  const handleLike = useCallback(async()=>{
    if (isLiked) return;
    const c = addGlobalLike(post.id,user.email);
    setIsLiked(true); setLikeCount(c);
    if (post.userEmail!==user.email) { pushNotification(post.userEmail,{type:'like',fromUser:user.name,fromUserEmail:user.email,message:`${user.name} vibed with your post ❤️`,postId:post.id}); updateNotificationCount?.(); }
    try { await axios.post(`${API_URL}/api/social/posts/${post.id}/like`,{userEmail:user.email},{timeout:5000}); } catch {}
  },[isLiked,post.id,post.userEmail,user,updateNotificationCount]);

  const handleComment = useCallback(async()=>{
    if (!newComment.trim()) return;
    const mentions = extractMentions(newComment);
    const cmt = { id:generateId(), userName:user.name, userEmail:user.email, userPhoto:user.profileImage, content:newComment.trim(), mentions, parentId:replyTo?.id||null, timestamp:new Date().toISOString(), likes:0 };
    setNewCmt(''); setReplyTo(null);
    const updated = addGlobalComment(post.id,cmt);
    setCmts(updated);
    setCmtCount(updated.filter(c=>!c.parentId).length);
    if (post.userEmail!==user.email) { pushNotification(post.userEmail,{type:'comment',fromUser:user.name,fromUserEmail:user.email,message:`${user.name} commented: "${newComment.trim().substring(0,60)}"`,postId:post.id}); updateNotificationCount?.(); }
    mentions.forEach(m=>{
      const users=getLS('rcreww_users',[]);
      const mentioned=users.find(u=>u.name.toLowerCase().replace(/\s/g,'')===m.toLowerCase()||u.email.split('@')[0].toLowerCase()===m.toLowerCase());
      if(mentioned&&mentioned.email!==user.email) pushNotification(mentioned.email,{type:'mention',fromUser:user.name,fromUserEmail:user.email,message:`${user.name} mentioned you in a comment`,postId:post.id});
    });
    try { await axios.post(`${API_URL}/api/social/posts/${post.id}/comments`,cmt,{timeout:5000}); } catch {}
  },[newComment,replyTo,post,user,updateNotificationCount]);

  const handleLikeCmt = useCallback((cId,cEmail)=>{
    if (likedCmts.has(cId)) return;
    const updated = comments.map(c=>c.id===cId?{...c,likes:(c.likes||0)+1}:c);
    setCmts(updated);
    setLS(`rcreww_cmts_${post.id}`,updated);
    const newSet = new Set(likedCmts); newSet.add(cId); setLikedCmts(newSet);
    setLS(`rcreww_liked_cmts_${user.email}`,[...newSet]);
    if (cEmail&&cEmail!==user.email) pushNotification(cEmail,{type:'like',fromUser:user.name,fromUserEmail:user.email,message:`${user.name} liked your comment`,postId:post.id});
  },[likedCmts,comments,post.id,user]);

  const handleDelCmt = useCallback((cId)=>{
    const filtered = comments.filter(c=>c.id!==cId&&c.parentId!==cId);
    setCmts(filtered); setCmtCount(filtered.filter(c=>!c.parentId).length);
    setLS(`rcreww_cmts_${post.id}`,filtered);
    const all=getGlobalPosts(); setLS(GLOBAL_POSTS_KEY,all.map(p=>p.id===post.id?{...p,comments:filtered.filter(c=>!c.parentId).length}:p));
  },[comments,post.id]);

  const topLevel = comments.filter(c=>!c.parentId);
  const visible  = showAllCmts ? topLevel : topLevel.slice(0,3);
  const isAuthor = user.email===post.userEmail;

  const CommentRow = ({ comment, depth=0 }) => {
    const replies   = depth<2 ? comments.filter(c=>c.parentId===comment.id) : [];
    const isLikedC  = likedCmts.has(comment.id);
    const isOwn     = comment.userEmail===user.email;
    const parts     = (comment.content||'').split(/(@\w+)/g);
    return (
      <div className={`flex gap-2.5 ${depth>0?'ml-8':''}`}>
        <div className="flex flex-col items-center flex-shrink-0" style={{width:30}}>
          <button onClick={()=>onViewUserProfile(comment.userEmail,comment.userName)}><Avatar initials={comment.userName} size="xs" src={comment.userPhoto}/></button>
          {replies.length>0&&showReplies[comment.id]&&<div className="w-0.5 flex-1 bg-orange-200 mt-1 rounded-full min-h-[16px]"/>}
        </div>
        <div className="flex-1 min-w-0 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Clicking commenter name → profile */}
            <button onClick={()=>onViewUserProfile(comment.userEmail,comment.userName)} className="font-black text-gray-900 text-sm hover:underline hover:text-orange-500 transition">{comment.userName}</button>
            <span className="text-xs text-gray-400 ml-auto">{formatTimeAgo(comment.timestamp)}</span>
          </div>
          <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">
            {parts.map((pt,idx)=>pt.startsWith('@')?<button key={idx} className="text-orange-600 font-black hover:underline" onClick={()=>{const all=getLS('rcreww_users',[]);const f=all.find(u=>u.name.toLowerCase().includes(pt.substring(1).toLowerCase()));if(f)onViewUserProfile(f.email,f.name);}}>{pt}</button>:pt)}
          </p>
          <div className="flex items-center gap-4 mt-1.5">
            <button onClick={()=>handleLikeCmt(comment.id,comment.userEmail)} disabled={isLikedC} className={`flex items-center gap-1 text-xs font-black transition ${isLikedC?'text-red-500':'text-gray-400 hover:text-red-400'}`}>
              <Heart className={`w-3.5 h-3.5 ${isLikedC?'fill-red-500':''}`}/>{comment.likes||0}
            </button>
            {depth<2&&<button onClick={()=>{setReplyTo(comment);setTimeout(()=>inputRef.current?.focus(),100);}} className="text-xs text-gray-400 hover:text-orange-500 font-black">reply</button>}
            {isOwn&&<button onClick={()=>handleDelCmt(comment.id)} className="ml-auto text-gray-200 hover:text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>}
          </div>
          {replies.length>0&&(
            <div className="mt-2">
              {!showReplies[comment.id]&&replies.length>1&&(
                <button onClick={()=>setShowReplies(p=>({...p,[comment.id]:true}))} className="text-xs text-orange-500 font-black mb-2 flex items-center gap-1">
                  <ChevronDown className="w-3 h-3"/>view {replies.length} replies
                </button>
              )}
              {(showReplies[comment.id]||replies.length===1)&&(
                <div className="space-y-2 pl-3 border-l-2 border-orange-100">
                  {replies.map(r=><CommentRow key={r.id} comment={r} depth={depth+1}/>)}
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
      {showOptions&&<PostOptionsModal post={post} user={user} onClose={()=>setShowOpts(false)} onReshare={onReshareClick} onSave={onSaveToggle} isSaved={isSaved} onDelete={onDelete} isOwner={isAuthor} onFollow={onFollow} isFollowing={isFollowing} onBlock={onBlock} isBlocked={isBlocked}/>}
      <div id={`post-${post.id||post._id}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-start gap-3">
            <button onClick={()=>onViewUserProfile(post.userEmail,post.userName)} className="flex-shrink-0">
              <Avatar initials={post.userName} size="md" src={post.userPhoto}/>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Clicking name → full profile */}
                <button onClick={()=>onViewUserProfile(post.userEmail,post.userName)} className="font-black text-gray-900 text-sm hover:underline hover:text-orange-500 transition">{post.userName||'anon'}</button>
                {post.isReshare&&<span className="flex items-center gap-1 text-xs text-gray-400"><Repeat className="w-3 h-3"/>reshared</span>}
                <span className="text-xs text-gray-400">{formatTimeAgo(post.createdAt)}</span>
              </div>
              {post.bookName&&(
                <button onClick={()=>onViewBookDetails?.({title:post.bookName,author:post.author})} className="flex items-center gap-1.5 mt-0.5 hover:underline">
                  <BookOpen className="w-3 h-3 text-orange-400"/>
                  <span className="text-xs text-gray-500 font-black">{post.bookName}{post.author&&` · ${post.author}`}</span>
                </button>
              )}
            </div>
            <button onClick={()=>setShowOpts(true)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400"><MoreHorizontal className="w-4 h-4"/></button>
          </div>
        </div>
        <div className="px-4 pb-3">
          {post.image&&<img src={post.image} alt="" className="w-full rounded-xl mb-3 max-h-96 object-cover cursor-pointer hover:opacity-95 transition" onClick={()=>window.open(post.image,'_blank')} loading="lazy"/>}
          {post.isReshare&&post.originalPost&&(
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <Repeat className="w-3 h-3"/>
              <span>Reshared from <button onClick={()=>onViewUserProfile(post.originalPost.userEmail,post.originalPost.userName)} className="font-black hover:underline hover:text-orange-500 transition">{post.originalPost.userName}</button></span>
            </div>
          )}
          <p className="text-gray-800 text-base leading-relaxed" style={{fontFamily:'Georgia,serif'}}>{post.story||post.content}</p>
          {post.reshareComment&&<div className="mt-3 bg-orange-50 rounded-xl p-3 border border-orange-100"><p className="text-sm text-orange-800 italic">"{post.reshareComment}"</p></div>}
          {post.isReshare&&post.originalPost&&(
            <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">original post by <span className="font-black">{post.originalPost.userName}</span>:</p>
              <p className="text-sm text-gray-600 line-clamp-3">{post.originalPost.content}</p>
            </div>
          )}
        </div>
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-5">
          <button onClick={handleLike} disabled={isLiked} className={`flex items-center gap-1.5 text-sm font-black transition-all ${isLiked?'text-red-500':'text-gray-500 hover:text-red-500'}`}>
            <Heart className={`w-5 h-5 ${isLiked?'fill-red-500 scale-110':''} transition-transform`}/>{likeCount}
          </button>
          <button onClick={()=>setShowCmts(p=>!p)} className={`flex items-center gap-1.5 text-sm font-black transition ${showComments?'text-orange-500':'text-gray-500 hover:text-orange-500'}`}>
            <MessageCircle className="w-5 h-5"/>{commentCount}
          </button>
          <button onClick={()=>onSaveToggle(post)} className={`flex items-center gap-1.5 text-sm font-black transition ${isSaved?'text-orange-500':'text-gray-500 hover:text-orange-400'}`}>
            <Bookmark className={`w-5 h-5 ${isSaved?'fill-orange-500':''}`}/>{isSaved?'saved':'save'}
          </button>
          <button onClick={()=>onShare(post)} className="flex items-center gap-1.5 text-sm font-black text-gray-500 hover:text-orange-500 transition ml-auto">
            <Share2 className="w-4 h-4"/>{post.reshareCount||0}
          </button>
        </div>
        {showComments&&(
          <>
            <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/60">
              {replyTo&&(
                <div className="flex items-center gap-2 mb-2 pl-2 border-l-2 border-orange-400">
                  <p className="text-xs text-orange-600 font-black flex-1">replying to <span className="font-black">@{replyTo.userName}</span></p>
                  <button onClick={()=>setReplyTo(null)}><X className="w-3.5 h-3.5 text-gray-400"/></button>
                </div>
              )}
              <div className="flex items-center gap-2">
                {profileSrc?<img src={profileSrc} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0"/>:<Avatar initials={user?.name} size="sm"/>}
                <div className="flex-1 flex items-center gap-2 bg-white rounded-full border border-gray-200 px-4 py-2 focus-within:border-orange-400 focus-within:shadow-sm transition">
                  <input ref={inputRef} type="text" value={newComment} onChange={e=>setNewCmt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleComment();}}} className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none" placeholder={replyTo?`reply to @${replyTo.userName}...`:"add your take... (@mention bestie)"}/>
                </div>
                <button onClick={handleComment} disabled={!newComment.trim()} className={`px-4 py-2 rounded-full text-sm font-black transition-all ${newComment.trim()?'bg-orange-500 text-white shadow-sm hover:bg-orange-600 active:scale-95':'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>post</button>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 space-y-3 max-h-96 overflow-y-auto">
              {loadingCmts?<div className="flex justify-center py-4"><LoadingSpinner size="sm"/></div>
               : visible.length>0 ? visible.map(c=><CommentRow key={c.id} comment={c} depth={0}/>)
               : <p className="text-xs text-gray-400 text-center py-4">no comments yet bestie. be the main character 🎬</p>}
              {topLevel.length>3&&(
                <button onClick={()=>setShowAll(p=>!p)} className="text-xs text-orange-500 font-black mt-2 flex items-center gap-1 hover:text-orange-600">
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllCmts?'rotate-180':''}`}/>
                  {showAllCmts?'show less':'view all '+topLevel.length+' comments'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
const LoginPage = memo(({ onLogin }) => {
  const [isLogin,    setIsLogin]  = useState(true);
  const [email,      setEmail]    = useState('');
  const [password,   setPw]       = useState('');
  const [showPw,     setShowPw]   = useState(false);
  const [name,       setName]     = useState('');
  const [showOTP,    setShowOTP]  = useState(false);
  const [otpInput,   setOTP]      = useState('');
  const [devOtp,     setDevOtp]   = useState('');
  const [loading,    setLoading]  = useState(false);
  const [error,      setError]    = useState('');
  const [agree,      setAgree]    = useState(false);
  const [readingGoal,setGoal]     = useState({yearly:20,monthly:5});
  const [showReset,  setReset]    = useState(false);
  const [resetEmail, setRE]       = useState('');
  const [resetSent,  setRS]       = useState(false);

  const valid = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSendOTP = () => {
    setError('');
    if (!isLogin&&name.trim().length<2) return setError("drop your name bestie 👀");
    if (!valid(email)) return setError("that email ain't it chief 😬");
    if (!isLogin&&!agree) return setError("gotta agree to the terms no cap");
    const code = Math.floor(100000+Math.random()*900000).toString();
    setLS('rcreww_pending_otp',code);
    setLS('rcreww_pending_user',{email,name:name||email.split('@')[0],password});
    setDevOtp(code); setShowOTP(true);
  };

  const handleVerifyOTP = () => {
    setError('');
    if (otpInput.length!==6) return setError('enter the 6-digit code bestie');
    if (otpInput!==getLS('rcreww_pending_otp','')) return setError('wrong code 😭 try again');
    const pending = getLS('rcreww_pending_user',{});
    const user = { id:generateId(), name:pending.name||name, email:pending.email||email, password:pending.password||password, readingGoal, isVerified:true, createdAt:new Date().toISOString(), bio:'living my best bookish era 📚', location:'', website:'' };
    const users = getLS('rcreww_users',[]);
    const idx = users.findIndex(u=>u.email===user.email);
    if (idx>=0) users[idx]={...users[idx],...user}; else users.push(user);
    setLS('rcreww_users',users); setLS('rcreww_current',user);
    setShowOTP(false); onLogin(user);
  };

  const handleLogin = () => {
    setError('');
    if (!valid(email)) return setError("valid email please bestie 👀");
    if (!password.trim()) return setError("password is mandatory no cap");
    setLoading(true);
    const users = getLS('rcreww_users',[]);
    const found = users.find(u=>u.email.toLowerCase()===email.toLowerCase());
    if (found) {
      if (found.password===password||!found.password) { setLS('rcreww_current',found); setLoading(false); onLogin(found); return; }
      else setError("wrong password, try again 🫣");
    } else setError("no account found — sign up first!");
    setLoading(false);
  };

  if (showOTP) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-7 border border-gray-100">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Mail className="w-8 h-8 text-orange-500"/></div>
          <h2 className="text-2xl font-black text-gray-900 mb-1">check your email bestie</h2>
          <p className="text-gray-500 text-sm">we sent a vibe-check code to <strong>{email}</strong></p>
        </div>
        {devOtp&&<div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-4 text-center"><p className="text-xs text-amber-700 font-black mb-2">📧 demo mode — your code:</p><p className="text-4xl font-black text-amber-800 tracking-widest">{devOtp}</p></div>}
        {error&&<div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600 text-center">{error}</div>}
        <input type="text" inputMode="numeric" value={otpInput} onChange={e=>{setOTP(e.target.value.replace(/\D/g,'').slice(0,6));setError('');}} className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none text-center text-3xl tracking-widest mb-4 font-mono" placeholder="000000" maxLength={6} autoFocus/>
        <button onClick={handleVerifyOTP} disabled={otpInput.length!==6} className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black disabled:opacity-40 mb-3">it's giving verified ✅</button>
        <div className="flex justify-between">
          <button onClick={()=>{setShowOTP(false);setError('');setDevOtp('');}} className="text-gray-500 text-sm flex items-center gap-1 font-semibold"><ArrowLeft className="w-4 h-4"/>back</button>
          <button onClick={handleSendOTP} className="text-orange-500 text-sm font-black hover:text-orange-600">resend code</button>
        </div>
      </div>
    </div>
  );

  if (showReset) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-7 border border-gray-100">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Lock className="w-8 h-8 text-orange-500"/></div>
          <h2 className="text-2xl font-black text-gray-900">reset password</h2>
          <p className="text-gray-500 text-sm mt-1">{resetSent?'check your inbox bestie ✅':'enter your email and we\'ll send a link'}</p>
        </div>
        {!resetSent?(
          <>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 mb-4">
              <Mail className="w-5 h-5 text-gray-400"/><input value={resetEmail} onChange={e=>setRE(e.target.value)} className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none" placeholder="email address" type="email"/>
            </div>
            <button onClick={()=>{if(valid(resetEmail)){setLoading(true);setTimeout(()=>{setRS(true);setLoading(false);},1500);}else setError('valid email pls');}} disabled={loading} className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black disabled:opacity-50 mb-3">
              {loading?'sending...':'send reset link'}
            </button>
          </>
        ):<div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4"><p className="text-sm text-green-700 text-center font-black">✓ reset link sent! check your inbox 📬</p></div>}
        {error&&<div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600 text-center">{error}</div>}
        <button onClick={()=>{setReset(false);setRE('');setRS(false);setError('');}} className="text-gray-500 text-sm flex items-center gap-1 mx-auto font-semibold hover:text-gray-700"><ArrowLeft className="w-4 h-4"/>back to login</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-4"><BookOpen className="w-10 h-10 text-white"/></div>
          <h1 className="text-4xl font-black text-gray-900" style={{fontFamily:'Georgia,serif'}}>{APP_NAME}</h1>
          <p className="text-gray-500 text-sm mt-1">{APP_TAGLINE}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-7 border border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-5">{isLogin?'welcome back bestie 👋':'join the crew fr 🔥'}</h2>
          {error&&<div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600 text-center">{error}</div>}
          <div className="space-y-3">
            {!isLogin&&(
              <>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                  <Users className="w-5 h-5 text-gray-400 flex-shrink-0"/>
                  <input value={name} onChange={e=>{setName(e.target.value);setError('');}} className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm" placeholder="your name (no cap) *" autoComplete="name"/>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2 text-sm"><Target className="w-4 h-4 text-orange-500"/>reading goals (optional)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-gray-600 mb-1 block font-semibold">yearly books</label><input type="number" value={readingGoal.yearly} onChange={e=>setGoal({...readingGoal,yearly:parseInt(e.target.value)||0})} className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-500 focus:outline-none text-sm" min="0" max="365"/></div>
                    <div><label className="text-xs text-gray-600 mb-1 block font-semibold">monthly books</label><input type="number" value={readingGoal.monthly} onChange={e=>setGoal({...readingGoal,monthly:parseInt(e.target.value)||0})} className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-500 focus:outline-none text-sm" min="0" max="31"/></div>
                  </div>
                </div>
              </>
            )}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
              <Mail className="w-5 h-5 text-gray-400 flex-shrink-0"/>
              <input value={email} onChange={e=>{setEmail(e.target.value);setError('');}} className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm" placeholder="email address *" type="email" autoComplete="email"/>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
              <Lock className="w-5 h-5 text-gray-400 flex-shrink-0"/>
              <input value={password} onChange={e=>{setPw(e.target.value);setError('');}} type={showPw?'text':'password'} className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm" placeholder={isLogin?'password *':'create password *'} autoComplete={isLogin?'current-password':'new-password'}/>
              <button onClick={()=>setShowPw(!showPw)} type="button">{showPw?<EyeOff className="w-4 h-4 text-gray-400"/>:<Eye className="w-4 h-4 text-gray-400"/>}</button>
            </div>
            {!isLogin&&(
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} className="mt-0.5 accent-orange-500"/>
                <span className="text-xs text-gray-500">i agree to the <button className="text-orange-500 font-black">Terms of Service</button> and <button className="text-orange-500 font-black">Privacy Policy</button></span>
              </label>
            )}
          </div>
          {isLogin&&<button onClick={()=>setReset(true)} className="text-sm text-orange-500 mt-2 hover:underline block font-semibold">forgot password?</button>}
          <button onClick={isLogin?handleLogin:handleSendOTP} disabled={loading} className="w-full mt-5 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90 transition">
            {loading?<><LoadingSpinner size="sm" color="white"/><span>hang on bestie...</span></>:isLogin?'log in 🚀':'create account fr →'}
          </button>
          <p className="text-center text-sm text-gray-500 mt-4">
            {isLogin?"no account yet? ":"already one of us? "}
            <button onClick={()=>{setIsLogin(!isLogin);setError('');setEmail('');setPw('');setName('');}} className="text-orange-500 font-black hover:underline">{isLogin?'sign up':'log in'}</button>
          </p>
        </div>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// BOOK DATABASE
// ══════════════════════════════════════════════════════════════════════════════
const BOOK_DB = {
  thriller: [
    {title:'Gone Girl',author:'Gillian Flynn',genre:'Thriller',rating:4.6,reason:'bestie this one eats NO crumbs 🔪 — the twist SENT me'},
    {title:'The Silent Patient',author:'Alex Michaelides',genre:'Thriller',rating:4.5,reason:'jaw-dropping twist guaranteed, no cap'},
    {title:'Verity',author:'Colleen Hoover',genre:'Thriller',rating:4.6,reason:'you will NOT see the ending coming fr'},
    {title:'The Girl on the Train',author:'Paula Hawkins',genre:'Thriller',rating:4.4,reason:'unreliable narrator ate and left no crumbs'},
    {title:'Sharp Objects',author:'Gillian Flynn',genre:'Thriller',rating:4.5,reason:'dark academia but make it unhinged 🖤'},
  ],
  fantasy: [
    {title:'Fourth Wing',author:'Rebecca Yarros',genre:'Fantasy',rating:4.6,reason:'living in enemies-to-lovers era bc of this bestie'},
    {title:'The Name of the Wind',author:'Patrick Rothfuss',genre:'Fantasy',rating:4.7,reason:'kvothe is lowkey the GOAT ngl'},
    {title:'Mistborn',author:'Brandon Sanderson',genre:'Fantasy',rating:4.7,reason:'magic system hits different fr 🔥'},
    {title:'The Way of Kings',author:'Brandon Sanderson',genre:'Fantasy',rating:4.8,reason:'3000 pages and i\'d read 3000 more'},
    {title:'A Game of Thrones',author:'George R.R. Martin',genre:'Fantasy',rating:4.7,reason:'chaos era but political, it\'s giving'},
  ],
  romance: [
    {title:'Beach Read',author:'Emily Henry',genre:'Romance',rating:4.6,reason:'enemies-to-lovers szn is upon us ☀️'},
    {title:'It Ends with Us',author:'Colleen Hoover',genre:'Romance',rating:4.6,reason:'i sobbed. main character energy 💀'},
    {title:'People We Meet on Vacation',author:'Emily Henry',genre:'Romance',rating:4.6,reason:'friends-to-lovers slowburn hits DIFFERENT'},
    {title:'The Love Hypothesis',author:'Ali Hazelwood',genre:'Romance',rating:4.7,reason:'STEM girlies this one is YOURS bestie'},
    {title:'Red White & Royal Blue',author:'Casey McQuiston',genre:'Romance',rating:4.7,reason:'chaotic bi energy and i am HERE for it'},
  ],
  scifi: [
    {title:'Project Hail Mary',author:'Andy Weir',genre:'Sci-Fi',rating:4.8,reason:'bestest book of all time no cap fr 🚀'},
    {title:'Dune',author:'Frank Herbert',genre:'Sci-Fi',rating:4.8,reason:'literally built different, zero notes'},
    {title:'The Martian',author:'Andy Weir',genre:'Sci-Fi',rating:4.8,reason:'funny + smart = slay combo bestie'},
    {title:'Children of Time',author:'Adrian Tchaikovsky',genre:'Sci-Fi',rating:4.7,reason:'spiders that hit different (in a good way) 🕷️'},
    {title:'The Three-Body Problem',author:'Cixin Liu',genre:'Sci-Fi',rating:4.6,reason:'hard sci-fi ate and devoured bestie'},
  ],
  selfhelp: [
    {title:'Atomic Habits',author:'James Clear',genre:'Self-Help',rating:4.8,reason:'actually changed my life no hyperbole fr'},
    {title:'The Psychology of Money',author:'Morgan Housel',genre:'Finance',rating:4.7,reason:'money trauma healed in 200 pages, bestie'},
    {title:'Sapiens',author:'Yuval Noah Harari',genre:'History',rating:4.7,reason:'we been in our delusional era for 300k years 💀'},
    {title:'Dare to Lead',author:'Brené Brown',genre:'Leadership',rating:4.6,reason:'vulnerability is the main character trait'},
    {title:'The Power of Now',author:'Eckhart Tolle',genre:'Spirituality',rating:4.6,reason:'mindfulness but make it slay'},
  ],
  mystery: [
    {title:'And Then There Were None',author:'Agatha Christie',genre:'Mystery',rating:4.7,reason:'OG of all mysteries, respect the queen bestie'},
    {title:'The Seven Husbands of Evelyn Hugo',author:'Taylor Jenkins Reid',genre:'Fiction',rating:4.7,reason:'i would literally die for evelyn hugo'},
    {title:'The Thursday Murder Club',author:'Richard Osman',genre:'Mystery',rating:4.5,reason:'retirement home girlies are the real detectives 👴🔍'},
    {title:'One of Us Is Lying',author:'Karen M. McManus',genre:'Mystery',rating:4.5,reason:'booktok made me read this and grateful fr'},
    {title:'The Guest List',author:'Lucy Foley',genre:'Mystery',rating:4.4,reason:'atmosphere was EVERYTHING 🌧️'},
  ],
  historical: [
    {title:'All the Light We Cannot See',author:'Anthony Doerr',genre:'Historical Fiction',rating:4.7,reason:'Pulitzer winner and it deserved every bit bestie'},
    {title:'The Book Thief',author:'Markus Zusak',genre:'Historical Fiction',rating:4.8,reason:'utterly unique voice, unforgettable story'},
    {title:'The Nightingale',author:'Kristin Hannah',genre:'Historical Fiction',rating:4.8,reason:'devastating and triumphant — you WILL cry'},
    {title:'The Kite Runner',author:'Khaled Hosseini',genre:'Historical Fiction',rating:4.8,reason:'emotional and powerful, it stays with u'},
    {title:'Pachinko',author:'Min Jin Lee',genre:'Historical Fiction',rating:4.7,reason:'epic family saga spanning generations 💙'},
  ],
  literary: [
    {title:'The Midnight Library',author:'Matt Haig',genre:'Fiction',rating:4.6,reason:'beautiful, philosophical and profoundly hopeful'},
    {title:'Normal People',author:'Sally Rooney',genre:'Literary Fiction',rating:4.4,reason:'painfully accurate about modern relationships bestie'},
    {title:'The Alchemist',author:'Paulo Coelho',genre:'Inspirational',rating:4.7,reason:'short, profound and endlessly re-readable'},
    {title:'A Little Life',author:'Hanya Yanagihara',genre:'Literary Fiction',rating:4.6,reason:'devastating and unforgettable — bring tissues'},
    {title:'The Great Gatsby',author:'F. Scott Fitzgerald',genre:'Classic',rating:4.7,reason:'timeless masterpiece, the green light era fr'},
  ],
};

const detectGenre = (text) => {
  const t = text.toLowerCase();
  if (/thrille|suspens|crime|murder|dark|horror|detective|psycholog|creepy/i.test(t)) return 'thriller';
  if (/fantasy|magic|dragon|wizard|fae|fourth wing|romantasy|enemies.to.lovers/i.test(t)) return 'fantasy';
  if (/romance|love|swoony|kiss|dating|trope|spicy|bookboyfriend|lovers/i.test(t)) return 'romance';
  if (/sci.?fi|space|future|robot|alien|tech|mars|nasa|dystop/i.test(t)) return 'scifi';
  if (/self.?help|habit|product|motivat|improve|mindset|business|finance|invest|money/i.test(t)) return 'selfhelp';
  if (/mystery|whodun|cozy|clue|puzzle|agatha/i.test(t)) return 'mystery';
  if (/histor|period|war|ancient|medieval|century|wwii|world war/i.test(t)) return 'historical';
  return 'literary';
};

const generateClientResponse = (text, prevBooks=[]) => {
  const cat  = detectGenre(text);
  const list = BOOK_DB[cat]||BOOK_DB.literary;
  const prev = new Set(prevBooks.map(b=>b.title));
  const recs = (list.filter(b=>!prev.has(b.title)).length>=5?list.filter(b=>!prev.has(b.title)):list).slice(0,5);
  const intros = {
    thriller:'okay bestie the villain era is CALLING 🔪 here are your thrills:',
    fantasy:'fantasy bestie era activated ✨ these ones ate:',
    romance:'enemies-to-lovers szn is upon us ❤️ ur heart is not ready:',
    scifi:'full nerd mode activated fr 🚀 these slap:',
    selfhelp:'main character development arc activated 💡 these will literally change ur life:',
    mystery:'detective mode: ON 🔍 these will have you guessing:',
    historical:'history girlies rise bestie 🏰 these transport you:',
    literary:'big feelings era incoming 📚 these will stay with you:',
  };
  return { reply:intros[cat]||'okay fr these books ate 📚 trust the process bestie:', books:recs };
};

// ══════════════════════════════════════════════════════════════════════════════
// EXPLORE PAGE — AI Chat | By Character | Nearby Libraries
// ══════════════════════════════════════════════════════════════════════════════
const CharacterSearch = memo(({ onViewDetails, onCreateCrew }) => {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoad]    = useState(false);
  const exampleChars = ['Hermione Granger','Jay Gatsby','Atticus Finch','Holden Caulfield','Elizabeth Bennet','Kvothe','Sherlock Holmes'];

  const search = async () => {
    if (!query.trim()) return;
    setLoad(true);
    try {
      const q = encodeURIComponent(`character ${query} book`);
      const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=8&projection=lite`,{signal:AbortSignal.timeout(8000)});
      const d = await r.json();
      const books = (d?.items||[]).map(it=>({
        title:  it.volumeInfo?.title,
        author: it.volumeInfo?.authors?.[0]||'Unknown',
        genre:  it.volumeInfo?.categories?.[0]||'Fiction',
        rating: it.volumeInfo?.averageRating||4.0,
        reason: `features "${query}" as a character`,
      })).filter(b=>b.title);
      setResults(books.length ? books : Object.values(BOOK_DB).flat().filter(b=>b.title.toLowerCase().includes(query.toLowerCase())||b.author.toLowerCase().includes(query.toLowerCase())));
    } catch {
      setResults(Object.values(BOOK_DB).flat().filter(b=>b.title.toLowerCase().includes(query.toLowerCase())||b.author.toLowerCase().includes(query.toLowerCase())));
    }
    setLoad(false);
  };

  return (
    <div>
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-4 mb-4">
        <h2 className="font-black text-gray-900 text-lg mb-1 flex items-center gap-2">🎭 search by character</h2>
        <p className="text-sm text-gray-500 mb-4">type a character name and we'll find the book bestie — Hermione, Gatsby, Kvothe, anyone fr!</p>
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 focus-within:border-purple-400 transition">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0"/>
            <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')search();}} className="flex-1 py-3.5 text-sm outline-none bg-transparent placeholder-gray-400" placeholder="e.g. Hermione, Jay Gatsby, Kvothe..."/>
          </div>
          <button onClick={search} disabled={!query.trim()||loading} className="px-5 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-2xl text-sm font-black disabled:opacity-40 hover:opacity-90 transition">
            {loading?<LoadingSpinner size="sm" color="white"/>:'search'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {exampleChars.map(c=>(
            <button key={c} onClick={()=>setQuery(c)} className="text-xs px-3 py-1.5 bg-white border border-purple-200 text-purple-600 rounded-full font-semibold hover:bg-purple-50 transition">{c}</button>
          ))}
        </div>
      </div>
      {results.length>0&&(
        <div className="space-y-3">
          <div className="flex items-center gap-2"><div className="h-px flex-1 bg-purple-200"/><span className="text-xs text-purple-500 font-black">BOOKS WITH "{query.toUpperCase()}"</span><div className="h-px flex-1 bg-purple-200"/></div>
          {results.map((b,i)=><BookCard key={i} book={b} onViewDetails={onViewDetails} onCreateCrew={()=>onCreateCrew(b)}/>)}
        </div>
      )}
    </div>
  );
});

const NearbyLibraries = () => {
  const [libs,    setLibs]    = useState([]);
  const [loading, setLoad]    = useState(false);
  const [error,   setError]   = useState('');

  const find = () => {
    setLoad(true); setError('');
    if (!navigator.geolocation) { setError("location not supported in this browser 😭"); setLoad(false); return; }
    navigator.geolocation.getCurrentPosition(
      pos=>{
        const {latitude:lat,longitude:lng}=pos.coords;
        fetch(`https://nominatim.openstreetmap.org/search?q=library&format=json&limit=6&bounded=1&viewbox=${lng-0.15},${lat+0.15},${lng+0.15},${lat-0.15}`)
          .then(r=>r.json()).then(data=>{
            const results = (data||[]).map(l=>({ name:l.display_name.split(',')[0].trim(), address:l.display_name, lat:parseFloat(l.lat), lng:parseFloat(l.lon) }));
            setLibs(results.length?results:[{name:'Public Library (search manually)',address:'Enable location or search Google Maps for libraries near you',lat,lng}]);
            setLoad(false);
          }).catch(()=>{
            setLibs([{name:'Library Search',address:'Offline — try Google Maps for "libraries near me"',lat,lng}]);
            setLoad(false);
          });
      },
      ()=>{setError("location blocked bestie — enable it in browser settings 📍");setLoad(false);}
    );
  };

  return (
    <div>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 mb-4">
        <h2 className="font-black text-gray-900 text-lg mb-1 flex items-center gap-2">🗺️ nearby libraries</h2>
        <p className="text-sm text-gray-500 mb-4">find where to cop your next physical read IRL bestie 📚 no cap this feature is main character energy</p>
        <button onClick={find} disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition">
          {loading?<><LoadingSpinner size="sm" color="white"/>locating...</>:<><Navigation className="w-4 h-4"/>find libraries near me</>}
        </button>
      </div>
      {error&&<div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 text-center mb-4 font-semibold">{error}</div>}
      {libs.length>0&&(
        <div className="space-y-3">
          {libs.map((lib,i)=>(
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0"><BookOpen className="w-5 h-5 text-blue-600"/></div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 text-sm">{lib.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{lib.address}</p>
                  <a href={`https://maps.google.com/?q=${lib.lat},${lib.lng}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-500 font-black hover:underline">
                    <Navigation className="w-3 h-3"/>open in maps →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!libs.length&&!loading&&!error&&(
        <div className="text-center py-10 text-gray-400">
          <p className="text-5xl mb-3">📍</p>
          <p className="text-sm font-black">tap the button to find libraries near you bestie</p>
          <p className="text-xs mt-1">uses your location (never stored, no cap)</p>
        </div>
      )}
    </div>
  );
};

const GEN_Z_EXPLORE_PROMPTS = [
  "🔪 dark academia vibes", "✨ fantasy but unhinged", "❤️ enemies to lovers szn",
  "🚀 sci-fi that hits different", "💡 main character self-help", "🏰 period drama but slay",
  "🐛 cozy mystery bestie", "💀 thriller ate & left no crumbs",
];

const ExplorePage = memo(({ user, setPage, onCreateCrew }) => {
  const [mode,     setMode]   = useState('chat');
  const [messages, setMsgs]   = useState([{role:'assistant',content:"heyyy bestie! 👋 i'm Page Turner, your AI book bestie living in main character era. spill what vibe you're in — a genre, mood, or last book you hyperfixated on. let's find your next obsession fr 📚✨",ts:Date.now()}]);
  const [input,    setInput]  = useState('');
  const [loading,  setLoad]   = useState(false);
  const [recs,     setRecs]   = useState([]);
  const [selBook,  setSel]    = useState(null);
  const endRef = useRef();

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); },[messages]);

  const send = async () => {
    if (!input.trim()||loading) return;
    const text = input.trim();
    setInput('');
    setMsgs(p=>[...p,{role:'user',content:text,ts:Date.now()}]);
    setLoad(true);
    let replied = false;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:800,
          system:`You are Page Turner, a Gen Z AI book recommendation bestie for READCREWW app. Use casual Gen Z language: bestie, slay, no cap, fr, hits different, ate, lowkey, it's giving, main character energy, hyperfixation, snatched, understood the assignment etc. When recommending books always give 3-5 specific books with authors. Keep responses SHORT (under 120 words). Write conversationally NOT in bullet points. Always end with an emoji. Never use bullet points. Be enthusiastic and use Gen Z slang naturally.`,
          messages:[...messages.filter(m=>m.role==='user'||m.role==='assistant').slice(-6).map(m=>({role:m.role,content:m.content})),{role:'user',content:text}]
        })
      });
      if (res.ok) {
        const d = await res.json();
        const reply = d?.content?.[0]?.text||'';
        if (reply) { setMsgs(p=>[...p,{role:'assistant',content:reply,ts:Date.now()}]); setRecs(BOOK_DB[detectGenre(text)]||BOOK_DB.fantasy); replied = true; }
      }
    } catch {}
    if (!replied) {
      const {reply,books} = generateClientResponse(text,recs);
      setMsgs(p=>[...p,{role:'assistant',content:reply,ts:Date.now()}]);
      setRecs(books);
    }
    setLoad(false);
  };

  const handleCreateCrew = (book) => { onCreateCrew(book); setPage('crews'); };
  const tabs = [{id:'chat',label:'✨ AI Chat'},{id:'character',label:'🎭 By Character'},{id:'libraries',label:'🗺️ Nearby Libraries'}];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-24 overflow-y-auto">
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-2xl font-black text-gray-900" style={{fontFamily:'Georgia,serif'}}>explore 🔍</h1>
        <p className="text-sm text-gray-500">find your next hyperfixation bestie, no cap</p>
      </div>
      <div className="px-4 mb-4 flex gap-2 overflow-x-auto" style={{scrollbarWidth:'none'}}>
        {tabs.map(({id,label})=>(
          <button key={id} onClick={()=>setMode(id)} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all ${mode===id?'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md':'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{label}</button>
        ))}
      </div>
      {selBook&&<BookDetailsModal book={selBook} onClose={()=>setSel(null)} onCreateCrew={handleCreateCrew} currentUser={user}/>}
      {mode==='chat'&&(
        <>
          <div className="px-4 space-y-3 pb-40">
            {messages.map((m,i)=>(
              <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'} items-end gap-2`}>
                {m.role==='assistant'&&<div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow"><BookOpen className="w-4 h-4 text-white"/></div>}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role==='user'?'bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-br-sm':'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-100'}`}>{m.content}</div>
              </div>
            ))}
            {loading&&(
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center"><BookOpen className="w-4 h-4 text-white"/></div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1.5">{[0,150,300].map(d=><div key={d} className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}</div>
                </div>
              </div>
            )}
            {recs.length>0&&(
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-2"><div className="h-px flex-1 bg-orange-200"/><span className="text-xs text-orange-500 font-black">📚 RECS FOR U BESTIE</span><div className="h-px flex-1 bg-orange-200"/></div>
                {recs.map((b,i)=><BookCard key={i} book={b} onViewDetails={setSel} onCreateCrew={()=>handleCreateCrew(b)}/>)}
              </div>
            )}
            <div ref={endRef}/>
          </div>
          {messages.length<=1&&(
            <div className="fixed bottom-36 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
              <div className="flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth:'none'}}>
                {GEN_Z_EXPLORE_PROMPTS.map(p=>(
                  <button key={p} onClick={()=>setInput(p.substring(2).trim())} className="flex-shrink-0 px-3 py-1.5 bg-white border border-orange-200 rounded-full text-xs text-orange-600 font-black hover:bg-orange-50 transition whitespace-nowrap shadow-sm">{p}</button>
                ))}
              </div>
            </div>
          )}
          <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-full max-w-md px-4">
            <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-gray-200 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} placeholder="spill what vibe you're after bestie..." className="flex-1 text-sm text-gray-900 outline-none bg-transparent placeholder-gray-400"/>
                <button onClick={send} disabled={!input.trim()||loading} className={`w-9 h-9 rounded-full flex items-center justify-center transition flex-shrink-0 ${input.trim()&&!loading?'bg-gradient-to-r from-orange-500 to-pink-500 text-white':'bg-gray-100 text-gray-400'}`}><Send className="w-4 h-4"/></button>
              </div>
            </div>
          </div>
        </>
      )}
      {mode==='character'&&<div className="px-4"><CharacterSearch onViewDetails={setSel} onCreateCrew={handleCreateCrew}/></div>}
      {mode==='libraries'&&<div className="px-4"><NearbyLibraries/></div>}
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════════════════════════════════════
const HomePage = memo(({ user, posts, crews, setPage, updateNotificationCount, profileSrc, savedPosts, onSavePost, onResharePost, onDeletePost, onFollow, following, onBlock, blockedUsers, onViewUserProfile, onViewBookDetails, deepLinkPostId, onDeepLinkHandled }) => {
  const [trendingBooks,   setTrend]   = useState([]);
  const [loadingTrending, setLoadTr]  = useState(true);
  const [feedPosts,       setFeed]    = useState([]);
  const [selectedBook,    setSel]     = useState(null);
  const [showShare,       setShare]   = useState(null);
  const [showReshare,     setReshare] = useState(null);
  const [stats,           setStats]   = useState({booksRead:0,reviewsGiven:0,postsCreated:0,crewsJoined:0});
  const [readingProgress, setProgress]= useState(0);

  useEffect(()=>{
    if (!deepLinkPostId||feedPosts.length===0) return;
    setTimeout(()=>{
      const el = document.getElementById(`post-${deepLinkPostId}`);
      if (el) { el.scrollIntoView({behavior:'smooth',block:'center'}); el.style.boxShadow='0 0 0 3px #f97316'; setTimeout(()=>el.style.boxShadow='',2500); }
      onDeepLinkHandled?.();
    },400);
  },[deepLinkPostId,feedPosts]);

  const loadFeed = useCallback(async()=>{
    try {
      const res = await axios.get(`${API_URL}/api/social/posts?userEmail=${encodeURIComponent(user.email)}`,{timeout:8000});
      if (res.data?.success) {
        const sp=res.data.posts||[];
        const lp=getGlobalPosts();
        const merged=[...sp];
        lp.forEach(lx=>{if(!merged.find(sx=>(sx.id||sx._id)===(lx.id||lx._id)))merged.push(lx);});
        setLS(GLOBAL_POSTS_KEY,merged);
        setFeed(generatePersonalizedFeed(user.email,merged,blockedUsers));
        return;
      }
    } catch {}
    const all=getGlobalPosts();
    setFeed(generatePersonalizedFeed(user.email,all,blockedUsers));
  },[user.email,blockedUsers]);

  useEffect(()=>{
    loadFeed();
    const st=getLS(`rcreww_stats_${user.email}`,{});
    setStats(st);
    if (user?.readingGoal?.yearly>0) setProgress(Math.min((st.booksRead||0)/user.readingGoal.yearly*100,100));
    fetch('https://www.googleapis.com/books/v1/volumes?q=bestseller+2024&maxResults=8&projection=lite',{signal:AbortSignal.timeout(8000)})
      .then(r=>r.json()).then(d=>{
        const books=(d?.items||[]).map(it=>({title:it.volumeInfo?.title,author:it.volumeInfo?.authors?.[0],rating:it.volumeInfo?.averageRating||4.2})).filter(b=>b.title);
        if(books.length) setTrend(books); else throw new Error();
        setLoadTr(false);
      }).catch(()=>{
        setTrend([{title:'Atomic Habits',author:'James Clear',rating:4.8},{title:'Fourth Wing',author:'Rebecca Yarros',rating:4.6},{title:'Project Hail Mary',author:'Andy Weir',rating:4.8},{title:'The Midnight Library',author:'Matt Haig',rating:4.6},{title:'Verity',author:'Colleen Hoover',rating:4.6},{title:'Sapiens',author:'Yuval Noah Harari',rating:4.7}]);
        setLoadTr(false);
      });
    socket.on('new_post',post=>{ if(!blockedUsers.includes(post.userEmail)) setFeed(p=>[post,...p]); });
    socket.on('post_deleted',({postId})=>setFeed(p=>p.filter(x=>(x._id||x.id)!==postId)));
    const handler=(e)=>{ if(e.data?.type==='posts_updated') loadFeed(); };
    bc?.addEventListener('message',handler);
    return()=>{ socket.off('new_post'); socket.off('post_deleted'); bc?.removeEventListener('message',handler); };
  },[user.email,loadFeed]);

  useEffect(()=>{ loadFeed(); },[posts.length,following.length]);

  const handleReshare = (post,comment,isPublic) => { onResharePost(post,comment,isPublic); setReshare(null); };
  const userCrews = getGlobalCrews().filter(c=>{
    const joined = getLS(`rcreww_joined_${user.email}`,[]);
    return joined.includes(c.id)||joined.includes(String(c.id));
  });
  const notifCount = getLS(`rcreww_notifs_${user.email}`,[]).filter(n=>!n.read&&n.type!=='message').length;
  const ph = GEN_Z_PLACEHOLDERS[Math.floor(Date.now()/600000)%GEN_Z_PLACEHOLDERS.length];
  const currentStatus = getLS(`rcreww_status_${user.email}`, null);

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <TopBar user={user} setPage={setPage} profileSrc={profileSrc} onNotificationClick={()=>setPage('notifications')} notificationCount={notifCount}/>
      {selectedBook&&<BookDetailsModal book={selectedBook} onClose={()=>setSel(null)} onCreateCrew={book=>{const{crew}=getOrCreateCrew(book.title,book.author,book.genre,user.email,user.name);const joined=getLS(`rcreww_joined_${user.email}`,[]);if(!joined.includes(crew.id)){setLS(`rcreww_joined_${user.email}`,[...joined,crew.id]);}setSel(null);setPage('crews');}} currentUser={user}/>}
      {showShare&&<ShareModal post={showShare} onClose={()=>setShare(null)}/>}
      {showReshare&&<ReshareModal post={showReshare} onClose={()=>setReshare(null)} onReshare={handleReshare}/>}
      <div className="px-4 py-4 space-y-5">
        {/* Hero */}
        <div className="bg-gradient-to-br from-orange-500 via-pink-500 to-red-500 rounded-3xl p-5 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">hey {user?.name?.split(' ')[0]} 🔥</h2>
              <p className="text-orange-100 text-sm mt-0.5">your vibe feed is ready no cap bestie</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm"><BookOpen className="w-6 h-6 text-white"/></div>
          </div>
          {user?.readingGoal?.yearly>0&&(
            <div className="mt-4 bg-white/20 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-semibold">yearly reading goal</span>
                <span className="font-black">{stats.booksRead||0}/{user.readingGoal.yearly} books</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-500" style={{width:`${readingProgress}%`}}/>
              </div>
              <p className="text-xs text-orange-100 mt-1">{Math.round(readingProgress)}% of goal achieved slay! 🎉</p>
            </div>
          )}
        </div>

        {/* Algorithm banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4 text-blue-500"/></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-blue-900">personalized for u bestie ✨</p>
            <p className="text-xs text-blue-600">feed ranked by your likes, follows & reading interests</p>
          </div>
          <button onClick={loadFeed} className="p-1.5 hover:bg-blue-100 rounded-xl transition"><RefreshCw className="w-4 h-4 text-blue-400"/></button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[{label:'Books',val:stats.booksRead||0,icon:BookOpen,color:'text-blue-600',bg:'bg-blue-100',page:'profile'},{label:'Reviews',val:stats.reviewsGiven||0,icon:Star,color:'text-purple-600',bg:'bg-purple-100',page:'reviews'},{label:'Posts',val:stats.postsCreated||0,icon:Edit3,color:'text-green-600',bg:'bg-green-100',page:'post'},{label:'Crews',val:stats.crewsJoined||0,icon:Users,color:'text-orange-600',bg:'bg-orange-100',page:'crews'}].map(({label,val,icon:Icon,color,bg,page},idx)=>(
            <div key={idx} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition" onClick={()=>setPage(page)}>
              <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mb-2`}><Icon className={`w-4 h-4 ${color}`}/></div>
              <p className="text-lg font-black text-gray-900">{val}</p>
              <p className="text-xs text-gray-500 font-semibold">{label}</p>
            </div>
          ))}
        </div>

        {/* Trending */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-orange-500"/>trending rn 🔥</h2>
            <button onClick={()=>setPage('explore')} className="text-sm text-orange-500 font-black hover:underline">explore all →</button>
          </div>
          {loadingTrending?<div className="flex justify-center py-8"><LoadingSpinner/></div>:(
            <div className="flex gap-4 overflow-x-auto pb-2" style={{scrollbarWidth:'none'}}>
              {trendingBooks.map((book,i)=>(
                <div key={i} className="shrink-0 w-28 cursor-pointer hover:scale-105 transition-transform" onClick={()=>setSel(book)}>
                  <DynamicBookCover title={book.title} author={book.author} size="md"/>
                  <p className="text-sm font-black text-gray-900 mt-2 leading-tight line-clamp-2">{book.title}</p>
                  <p className="text-xs text-gray-500 truncate">{book.author}</p>
                  {book.rating&&<div className="flex items-center gap-1 mt-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400"/><span className="text-xs font-black">{book.rating}</span></div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Your Crews */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-orange-500"/>your crews</h2>
            <button onClick={()=>setPage('crews')} className="text-sm text-orange-500 font-black hover:underline">view all →</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {userCrews.slice(0,2).map(crew=>(
              <div key={crew.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition" onClick={()=>setPage('crews')}>
                <div className="h-16 flex items-center justify-center p-2 bg-gray-50"><DynamicBookCover title={crew.name} author={crew.author} size="xs"/></div>
                <div className="p-3">
                  <h3 className="font-black text-gray-900 text-sm line-clamp-2">{crew.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{crew.genre}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500"><Users className="w-3 h-3"/>{crew.members||1}</div>
                    <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-lg text-xs font-black">joined</span>
                  </div>
                </div>
              </div>
            ))}
            {userCrews.length===0&&(
              <div className="col-span-2 bg-white rounded-2xl p-6 text-center border border-gray-100">
                <p className="text-gray-500 text-sm font-semibold">no crews joined yet bestie</p>
                <button onClick={()=>setPage('crews')} className="mt-2 text-orange-500 text-sm font-black hover:underline">browse crews →</button>
              </div>
            )}
          </div>
        </div>

        {/* Create post CTA */}
        <button onClick={()=>setPage('post')} className="w-full bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md transition">
          {profileSrc?<img src={profileSrc} alt="profile" className="w-9 h-9 rounded-full object-cover flex-shrink-0"/>:<Avatar initials={user?.name} size="sm"/>}
          <span className="text-gray-400 text-sm flex-1 text-left">{ph}</span>
          <span className="text-xs font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full">Post</span>
        </button>

        {/* Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-orange-500"/>{following.length>0?'your feed':'community feed'}</h2>
            <button onClick={loadFeed} className="text-xs text-gray-400 flex items-center gap-1 hover:text-orange-500 transition font-semibold"><RefreshCw className="w-3 h-3"/>refresh</button>
          </div>
          <div className="space-y-4">
            {feedPosts.length===0?(
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <p className="text-4xl mb-3">📚</p>
                <p className="text-gray-500 font-black">no posts yet bestie</p>
                <p className="text-gray-400 text-sm mt-1">be the main character and post first!</p>
                <button onClick={()=>setPage('post')} className="mt-4 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-sm font-black hover:opacity-90 transition">create post 🔥</button>
              </div>
            ):feedPosts.map((post,idx)=>(
              <InlinePostCard
                key={post.id||idx} post={post} user={user} profileSrc={profileSrc}
                updateNotificationCount={updateNotificationCount}
                onShare={p=>setShare(p)} onReshareClick={p=>setReshare(p)}
                onSaveToggle={onSavePost} isSaved={savedPosts?.includes(post.id)}
                onDelete={onDeletePost} onFollow={onFollow} isFollowing={following?.includes(post.userEmail)}
                onBlock={onBlock} isBlocked={blockedUsers?.includes(post.userEmail)}
                onViewUserProfile={onViewUserProfile} onViewBookDetails={b=>setSel(b)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// POST PAGE
// ══════════════════════════════════════════════════════════════════════════════
const PostPage = memo(({ user, onPost, setPage }) => {
  const [content,   setContent] = useState('');
  const [bookName,  setBook]    = useState('');
  const [author,    setAuthor]  = useState('');
  const [image,     setImage]   = useState(null);
  const [isPublic,  setPublic]  = useState(true);
  const [uploading, setUpload]  = useState(false);
  const fileRef = useRef();
  const ph = useMemo(()=>GEN_Z_PLACEHOLDERS[Math.floor(Math.random()*GEN_Z_PLACEHOLDERS.length)],[]);

  const submit = async () => {
    if (!content.trim()) return;
    setUpload(true);
    const post = { id:generateId(), content:sanitizeText(content.trim()), bookName:bookName.trim()||undefined, author:author.trim()||undefined, image, isPublic, userName:user.name, userEmail:user.email, userPhoto:user.profileImage, userInitials:user.name.slice(0,2).toUpperCase(), createdAt:new Date().toISOString(), likes:0, comments:0, reshareCount:0 };
    saveGlobalPost(post);
    try { await axios.post(`${API_URL}/api/social/posts`,post,{timeout:8000}); } catch {}
    onPost(post);
    setUpload(false);
    setPage('home');
  };

  const uploadImg = (e) => {
    const f=e.target.files[0]; if(!f) return;
    if(f.size>5*1024*1024){alert('max 5MB bestie 😭');return;}
    const r=new FileReader(); r.onload=ev=>setImage(ev.target.result); r.readAsDataURL(f);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white z-[55] overflow-hidden" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={()=>setPage('home')} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-600"/></button>
        <h2 className="font-black text-gray-900">create post</h2>
        <button onClick={submit} disabled={!content.trim()||uploading} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-sm font-black disabled:opacity-40 hover:opacity-90 transition">
          {uploading?<LoadingSpinner size="sm" color="white"/>:'slay 🔥'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex gap-3 mb-4">
          <Avatar initials={user?.name} size="md" src={user?.profileImage}/>
          <div className="flex-1">
            <textarea value={content} onChange={e=>setContent(e.target.value)} className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-base resize-none leading-relaxed" placeholder={ph} rows={7} maxLength={1000} autoFocus/>
            <p className={`text-right text-xs ${content.length>900?'text-orange-500':'text-gray-400'}`}>{content.length}/1000</p>
          </div>
        </div>
        {image&&<div className="relative mb-4"><img src={image} alt="" className="w-full rounded-2xl max-h-64 object-cover"/><button onClick={()=>setImage(null)} className="absolute top-2 right-2 bg-black/50 rounded-full p-1"><X className="w-4 h-4 text-white"/></button></div>}
        <div className="space-y-3 mb-4">
          <input value={bookName} onChange={e=>setBook(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300 transition" placeholder="📖 book name (optional)"/>
          <input value={author}   onChange={e=>setAuthor(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300 transition" placeholder="✍️ author (optional)"/>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={()=>fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-black text-gray-700 hover:bg-gray-200 transition"><Camera className="w-4 h-4"/>add pic</button>
          <button onClick={()=>setPublic(!isPublic)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition ${isPublic?'bg-gray-100 text-gray-700 hover:bg-gray-200':'bg-gray-800 text-white'}`}>
            {isPublic?<Globe className="w-4 h-4"/>:<Lock className="w-4 h-4"/>}{isPublic?'public':'private'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadImg}/>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// REVIEWS PAGE — GLOBAL, working submission
// ══════════════════════════════════════════════════════════════════════════════
const ReviewsPage = memo(({ user, setPage, updateNotificationCount, onViewUserProfile }) => {
  const [reviews,   setReviews]  = useState(()=>getGlobalReviews());
  const [loading,   setLoading]  = useState(true);
  const [showForm,  setShowForm] = useState(false);
  const [likedRevs, setLiked]    = useState(()=>getLS(`rcreww_liked_reviews_${user.email}`,[]));
  const [newReview, setNew]      = useState({bookName:'',author:'',rating:5,review:'',sentiment:'positive'});
  const [search,    setSearch]   = useState('');
  const [sortBy,    setSort]     = useState('newest');
  const [selBook,   setSel]      = useState(null);
  const [submitting,setSubmitting]= useState(false);

  useEffect(()=>{
    const load = async () => {
      setLoading(true);
      // Always load from global localStorage first (global)
      const localRevs = getGlobalReviews();
      setReviews(localRevs);
      try {
        const res = await axios.get(`${API_URL}/api/social/reviews`,{timeout:8000});
        if(res.data?.success) {
          const serverRevs = res.data.reviews||[];
          // Merge: local + server, deduplicated
          const merged = [...localRevs];
          serverRevs.forEach(sr=>{ if(!merged.find(lr=>lr.id===sr.id)) merged.push(sr); });
          setLS(GLOBAL_REVIEWS_KEY, merged);
          setReviews(merged);
        }
      } catch {}
      setLoading(false);
    };
    load();
    const h=(e)=>{ if(e.data?.type==='reviews_updated') setReviews(getGlobalReviews()); };
    bc?.addEventListener('message',h);
    return()=>bc?.removeEventListener('message',h);
  },[]);

  const handleLike=(id,rev)=>{
    if(likedRevs.includes(id)) return;
    const ul=[...likedRevs,id]; setLiked(ul); setLS(`rcreww_liked_reviews_${user.email}`,ul);
    const all=getGlobalReviews().map(r=>r.id===id?{...r,likes:(r.likes||0)+1}:r);
    setLS(GLOBAL_REVIEWS_KEY,all); setReviews(all);
    if(rev.userEmail!==user.email){pushNotification(rev.userEmail,{type:'review',fromUser:user.name,fromUserEmail:user.email,message:`${user.name} liked your review of "${rev.bookName}" ⭐`});updateNotificationCount?.();}
  };

  // FIXED: Always save to global localStorage + server
  const submitReview = async () => {
    if(!newReview.bookName.trim()||!newReview.author.trim()||!newReview.review.trim()){
      alert('fill all fields bestie 👀'); return;
    }
    setSubmitting(true);
    const rv = {
      ...newReview,
      id: generateId(),
      bookName: newReview.bookName.trim(),
      author: newReview.author.trim(),
      review: newReview.review.trim(),
      userName: user.name,
      userEmail: user.email,
      userPhoto: user.profileImage,
      likes: 0,
      createdAt: new Date().toISOString()
    };
    // Save globally immediately
    saveGlobalReview(rv);
    setReviews(getGlobalReviews());
    // Update stats
    const st=getLS(`rcreww_stats_${user.email}`,{}); st.reviewsGiven=(st.reviewsGiven||0)+1; setLS(`rcreww_stats_${user.email}`,st);
    // Try server sync
    try { await axios.post(`${API_URL}/api/social/reviews`,rv,{timeout:8000}); } catch {}
    setShowForm(false);
    setNew({bookName:'',author:'',rating:5,review:'',sentiment:'positive'});
    setSubmitting(false);
  };

  const filtered = reviews
    .filter(r=>(r.bookName||'').toLowerCase().includes(search.toLowerCase())||(r.author||'').toLowerCase().includes(search.toLowerCase())||(r.userName||'').toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>sortBy==='newest'?new Date(b.createdAt)-new Date(a.createdAt):sortBy==='popular'?(b.likes||0)-(a.likes||0):b.rating-a.rating);

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      {selBook&&<BookDetailsModal book={selBook} onClose={()=>setSel(null)} onCreateCrew={()=>{}} currentUser={user}/>}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
        <button onClick={()=>setPage('home')} className="p-1 hover:bg-gray-100 rounded-xl"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
        <h2 className="font-black text-gray-900 flex items-center gap-2"><Star className="w-5 h-5 text-orange-500"/>book reviews</h2>
        <button onClick={()=>setShowForm(!showForm)} className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-sm font-black hover:opacity-90 transition">{showForm?'cancel':'+ write'}</button>
      </div>
      <div className="px-4 py-4 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="search reviews..." className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"/>
            {search&&<button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400"/></button>}
          </div>
          <select value={sortBy} onChange={e=>setSort(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 font-semibold">
            <option value="newest">newest</option>
            <option value="popular">popular</option>
            <option value="rating">top rated</option>
          </select>
        </div>

        {showForm&&(
          <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm">
            <h3 className="font-black mb-3">drop your review bestie 📝</h3>
            <div className="space-y-3 mb-4">
              <input value={newReview.bookName} onChange={e=>setNew({...newReview,bookName:e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300" placeholder="book title *"/>
              <input value={newReview.author}   onChange={e=>setNew({...newReview,author:e.target.value})}   className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300" placeholder="author *"/>
              <div><label className="text-xs text-gray-600 mb-1 block font-black">your rating</label><StarRating rating={newReview.rating} onChange={r=>setNew({...newReview,rating:r})} size="md"/></div>
              <textarea value={newReview.review} onChange={e=>setNew({...newReview,review:e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300 resize-none" rows={4} placeholder="spill the tea on this book bestie... *"/>
              <div className="flex gap-2">
                {['positive','negative'].map(s=>(
                  <button key={s} onClick={()=>setNew({...newReview,sentiment:s})} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition ${newReview.sentiment===s?(s==='positive'?'bg-green-500 text-white':'bg-red-500 text-white'):'bg-gray-100 text-gray-600'}`}>
                    {s==='positive'?'👍 slay':'👎 flop'}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={submitReview} disabled={submitting||!newReview.bookName.trim()||!newReview.author.trim()||!newReview.review.trim()} className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-2">
              {submitting?<><LoadingSpinner size="sm" color="white"/>posting...</>:'drop it 🔥'}
            </button>
          </div>
        )}

        {loading?<div className="flex justify-center py-12"><LoadingSpinner size="lg"/></div>
         : filtered.length===0?<div className="text-center py-12"><Star className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500 font-black">{search?`no reviews for "${search}" bestie`:'no reviews yet bestie. be first!'}</p></div>
         : (
          <div className="space-y-4">
            {filtered.map(review=>{
              const isLiked=likedRevs.includes(review.id);
              return (
                <div key={review.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start gap-3 mb-3">
                    <DynamicBookCover title={review.bookName} author={review.author} size="sm" onClick={()=>setSel({title:review.bookName,author:review.author})}/>
                    <div className="flex-1">
                      <h3 className="font-black text-gray-900 text-sm">{review.bookName}</h3>
                      <p className="text-xs text-gray-500">by {review.author}</p>
                      <StarRating rating={review.rating} size="xs" readonly/>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-black ${review.sentiment==='positive'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{review.sentiment==='positive'?'👍 slay':'👎 flop'}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">{review.review}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    {/* Clicking reviewer name → profile */}
                    <button onClick={()=>onViewUserProfile(review.userEmail,review.userName)} className="flex items-center gap-2 hover:opacity-75 transition">
                      <Avatar initials={review.userName} size="xs" src={review.userPhoto}/>
                      <span className="text-xs text-gray-600 font-black hover:underline hover:text-orange-500 transition">{review.userName}</span>
                    </button>
                    <div className="flex items-center gap-3">
                      <button onClick={()=>handleLike(review.id,review)} disabled={isLiked} className={`flex items-center gap-1 text-xs font-black transition ${isLiked?'text-red-500':'text-gray-400 hover:text-red-400'}`}>
                        <Heart className={`w-3.5 h-3.5 ${isLiked?'fill-red-500':''}`}/>{review.likes||0}
                      </button>
                      <span className="text-xs text-gray-400">{formatTimeAgo(review.createdAt)}</span>
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
});


// ══════════════════════════════════════════════════════════════════════════════
// CREW CHAT VIEW — Global chat, orange wallpaper, mic + image + video
// ══════════════════════════════════════════════════════════════════════════════
const CrewChatView = memo(({ crew, user, crewMembers, onBack, updateNotificationCount, onViewUserProfile, isJoined, joinCrew }) => {
  const [messages,      setMsgs]        = useState([]);
  const [newMsg,        setNewMsg]       = useState('');
  const [selBook,       setSel]          = useState(null);
  const [showShare,     setShare]        = useState(false);
  const [isRecording,   setIsRecording]  = useState(false);
  const [mediaRecorder, setMR]           = useState(null);
  const [recordingTime, setRecTime]      = useState(0);
  const endRef   = useRef();
  const fileRef  = useRef();
  const videoRef = useRef();
  const recTimerRef = useRef(null);
  const { onlineCount }                          = useCrewPresence(crew.id,user.id||user.email,user.name);
  const { typingUsers, broadcastTyping, stopTyping } = useTypingIndicator(crew.id,user.id||user.email,user.name);
  const hasJoined = isJoined(crew.id);

  useEffect(()=>{
    const chatKey = `rcreww_chat_${crew.id}`;
    setMsgs(getLS(chatKey,[]).map(m=>({...m,timestamp:new Date(m.timestamp)})));
    socket.emit('join_crew_room',crew.id);
    socket.on('new_crew_message',d=>{
      if(String(d.crewId)===String(crew.id)) setMsgs(p=>[...p,{...d.message,timestamp:new Date(d.message.timestamp)}]);
    });
    const handler=(e)=>{ if(e.data?.type===`chat_${crew.id}`) setMsgs(getLS(chatKey,[]).map(m=>({...m,timestamp:new Date(m.timestamp)})));};
    bc?.addEventListener('message',handler);
    return()=>{ socket.emit('leave_crew_room',crew.id); socket.off('new_crew_message'); bc?.removeEventListener('message',handler); };
  },[crew.id]);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); },[messages]);
  useEffect(()=>{ if(messages.length) setLS(`crew_${crew.id}_lastRead_${user.id||user.email}`,Date.now().toString()); },[messages.length]);

  const saveAndBroadcast = (msg) => {
    const chatKey = `rcreww_chat_${crew.id}`;
    const existing = getLS(chatKey,[]);
    existing.push(msg);
    if(existing.length>500) existing.splice(0,existing.length-500);
    setLS(chatKey,existing);
    broadcastMsg(`chat_${crew.id}`,null);
    setMsgs(p=>[...p,{...msg,timestamp:new Date()}]);
    crewMembers.filter(m=>m.email!==user.email).forEach(m=>{ pushNotification(m.email,{type:'message',fromUser:user.name,fromUserEmail:user.email,message:`${user.name} sent a message in "${crew.name}"`,crewId:crew.id,crewName:crew.name}); });
    updateNotificationCount?.();
  };

  const sendMsg = async () => {
    if(!newMsg.trim()||!hasJoined) return;
    stopTyping();
    const msg = { id:generateId(), userId:user.id||user.email, userName:user.name, userEmail:user.email, userInitials:user.name?.slice(0,2).toUpperCase(), content:newMsg.trim(), type:'text', timestamp:new Date().toISOString() };
    setNewMsg('');
    saveAndBroadcast(msg);
    try{ await axios.post(`${API_URL}/api/social/crews/${crew.id}/messages`,msg,{timeout:8000}); }catch{}
  };

  const sendFile = (e, type='image') => {
    const f=e.target.files[0]; if(!f||!hasJoined) return;
    if(f.size>10*1024*1024){alert('max 10MB bestie');return;}
    const r=new FileReader();
    r.onload=ev=>{
      const msg={id:generateId(),userId:user.id||user.email,userName:user.name,userEmail:user.email,userInitials:user.name?.slice(0,2).toUpperCase(),content:ev.target.result,timestamp:new Date().toISOString(),type};
      saveAndBroadcast(msg);
    };
    r.readAsDataURL(f);
  };

  const startRecording = async () => {
    if (!hasJoined) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = ev => {
          const msg = { id:generateId(), userId:user.id||user.email, userName:user.name, userEmail:user.email, userInitials:user.name?.slice(0,2).toUpperCase(), content:ev.target.result, timestamp:new Date().toISOString(), type:'audio', duration: recordingTime };
          saveAndBroadcast(msg);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
        clearInterval(recTimerRef.current);
        setRecTime(0);
      };
      mr.start();
      setMR(mr);
      setIsRecording(true);
      setRecTime(0);
      recTimerRef.current = setInterval(()=>setRecTime(t=>t+1), 1000);
    } catch { alert('mic access denied bestie 😭'); }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setMR(null);
      setIsRecording(false);
    }
  };

  const fmt=(ts)=>{ const m=Math.floor((Date.now()-new Date(ts))/60000),h=Math.floor(m/60); if(m<1)return'just now';if(m<60)return`${m}m`;if(h<24)return`${h}h`;return new Date(ts).toLocaleDateString(); };
  const fmtSecs = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  const grouped = messages.reduce((acc,msg)=>{const d=new Date(msg.timestamp).toDateString();if(!acc[d])acc[d]=[];acc[d].push(msg);return acc;},{});

  if (!hasJoined) return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%',background:'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 50%, #ffcc80 100%)'}}>
      <div className="flex-shrink-0 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5"/></button>
        <DynamicBookCover title={crew.name} author={crew.author} size="xs"/>
        <div><p className="font-black text-gray-900 text-sm">{crew.name}</p><p className="text-xs text-gray-500">{crewMembers.length} members</p></div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🔒</p>
          <p className="text-gray-600 font-black mb-2">join this crew to chat bestie</p>
          <p className="text-gray-400 text-sm mb-5">it's giving exclusive vibes ✨</p>
          <button onClick={()=>joinCrew(crew)} className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black hover:opacity-90 transition">Join to Chat 🔥</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col z-[60] overflow-hidden" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      {/* Orange themed wallpaper */}
      <div className="absolute inset-0" style={{background:'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 30%, #ffcc80 60%, #ffb74d 100%)',opacity:0.85}}/>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle, #f97316 1px, transparent 1px)',backgroundSize:'24px 24px'}}/>

      {/* Header */}
      <div className="relative flex-shrink-0 bg-white/90 backdrop-blur border-b px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
          <DynamicBookCover title={crew.name} author={crew.author} size="xs" onClick={()=>setSel({title:crew.name,author:crew.author})}/>
          <div>
            <p className="font-black text-gray-900 text-sm">{crew.name}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">{crewMembers.length} members</p>
              {onlineCount>0&&<span className="flex items-center gap-1 text-xs text-green-600 font-black"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block"/>{onlineCount} online</span>}
            </div>
          </div>
        </div>
        <button onClick={()=>setShare(true)} className="p-2 hover:bg-gray-100 rounded-full"><Share2 className="w-5 h-5 text-gray-600"/></button>
      </div>

      {/* Messages */}
      <div className="relative flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length===0&&<div className="flex flex-col items-center justify-center h-full text-center py-16"><p className="text-5xl mb-3">💬</p><p className="text-gray-600 font-black">no messages yet bestie</p><p className="text-xs text-gray-500 mt-1">be the first to say something!</p></div>}
        {Object.entries(grouped).map(([date,msgs])=>(
          <div key={date}>
            <div className="flex justify-center my-4"><span className="bg-orange-200/80 text-orange-800 text-xs px-3 py-1 rounded-full font-semibold">{new Date(date).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</span></div>
            {msgs.map(msg=>{
              const isOwn=msg.userId===(user.id||user.email)||msg.userEmail===user.email;
              return (
                <div key={msg.id||msg.timestamp} className={`flex mb-2 ${isOwn?'justify-end':'justify-start'}`}>
                  <div className={`flex max-w-[78%] items-end gap-1.5 ${isOwn?'flex-row-reverse':''}`}>
                    {!isOwn&&<button onClick={()=>onViewUserProfile(msg.userEmail,msg.userName)} className="w-7 h-7 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 hover:opacity-80 transition">{msg.userInitials||'??'}</button>}
                    <div className={`rounded-2xl px-3.5 py-2 shadow-sm ${isOwn?'bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-br-sm':'bg-white rounded-bl-sm border border-orange-100'}`}>
                      {!isOwn&&<p className="text-[10px] font-black text-orange-600 mb-0.5">{msg.userName}</p>}
                      {msg.type==='image'&&<img src={msg.content} alt="shared" className="max-w-full rounded-xl max-h-60 cursor-pointer" onClick={()=>window.open(msg.content,'_blank')} loading="lazy"/>}
                      {msg.type==='video'&&<video src={msg.content} controls className="max-w-full rounded-xl max-h-60"/>}
                      {msg.type==='audio'&&(
                        <div className="flex items-center gap-2">
                          <audio controls src={msg.content} className="h-8" style={{maxWidth:'180px'}}/>
                          {msg.duration&&<span className="text-xs opacity-70">{fmtSecs(msg.duration)}</span>}
                        </div>
                      )}
                      {msg.type==='text'&&<p className={`text-sm leading-relaxed break-words ${isOwn?'text-white':'text-gray-900'}`}>{msg.content}</p>}
                      <p className={`text-[10px] text-right mt-0.5 ${isOwn?'text-orange-100':'text-gray-400'}`}>{fmt(msg.timestamp)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={endRef}/>
      </div>

      {/* Typing indicator */}
      {typingUsers.length>0&&<div className="relative px-4 py-1 text-xs text-orange-700 italic bg-orange-50/80">{typingUsers.length===1?`${typingUsers[0]} is typing...`:`${typingUsers.length} people are typing...`}</div>}

      {/* Recording indicator */}
      {isRecording&&(
        <div className="relative px-4 py-2 bg-red-50 border-t border-red-100 flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"/>
          <span className="text-sm font-black text-red-600">Recording... {fmtSecs(recordingTime)}</span>
          <button onClick={stopRecording} className="ml-auto px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-black">Stop & Send</button>
        </div>
      )}

      {/* Input area */}
      <div className="relative flex-shrink-0 bg-white/90 backdrop-blur border-t border-orange-100 px-3 py-2.5">
        <div className="flex items-center gap-2">
          {/* Media buttons */}
          <button onClick={()=>fileRef.current?.click()} className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-orange-500 hover:bg-orange-50 rounded-full transition" title="Send image">
            <Image className="w-5 h-5"/>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e=>sendFile(e,'image')}/>

          <button onClick={()=>videoRef.current?.click()} className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-orange-500 hover:bg-orange-50 rounded-full transition" title="Send video">
            <Video className="w-5 h-5"/>
          </button>
          <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e=>sendFile(e,'video')}/>

          <button onClick={isRecording?stopRecording:startRecording} className={`w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-full transition ${isRecording?'bg-red-500 text-white':'text-orange-500 hover:bg-orange-50'}`} title="Voice message">
            {isRecording?<MicOff className="w-5 h-5"/>:<Mic className="w-5 h-5"/>}
          </button>

          {/* Text input */}
          <div className="flex-1 flex items-center bg-white rounded-full border border-orange-200 px-4 py-2 focus-within:border-orange-400 focus-within:shadow-sm transition">
            <input type="text" value={newMsg} onChange={e=>{setNewMsg(e.target.value);broadcastTyping();}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();stopTyping();sendMsg();}}} onBlur={stopTyping} className="flex-1 py-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent" placeholder="say something bestie..."/>
          </div>

          <button onClick={()=>{stopTyping();sendMsg();}} disabled={!newMsg.trim()} className={`w-9 h-9 flex items-center justify-center rounded-full transition flex-shrink-0 ${newMsg.trim()?'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow':'bg-gray-200 text-gray-400'}`}>
            <Send className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {selBook&&<BookDetailsModal book={selBook} onClose={()=>setSel(null)} onCreateCrew={()=>{}} currentUser={user}/>}
      {showShare&&<ShareModal crewInvite={crew} onClose={()=>setShare(false)}/>}
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// CREWS PAGE — Global crews, one book = one crew, leave option
// ══════════════════════════════════════════════════════════════════════════════
const CrewsPage = memo(({ user, initialCrews, setPage, updateNotificationCount, onViewUserProfile, deepLinkCrewId, onDeepLinkHandled }) => {
  const [view,         setView]    = useState('list');
  const [selectedCrew, setSel]     = useState(null);
  const [crews,        setCrews]   = useState([]);
  const [joinedCrews,  setJoined]  = useState(()=>getLS(`rcreww_joined_${user.email}`,[]));
  const [crewMembers,  setMembers] = useState([]);
  const [showForm,     setShowForm]= useState(false);
  const [newCrew,      setNewCrew] = useState({name:'',author:'',genre:''});
  const [toast,        setToast]   = useState('');
  const [search,       setSearch]  = useState('');
  const [selBook,      setSelBook] = useState(null);
  const [unread,       setUnread]  = useState({});
  const [shareModal,   setShareM]  = useState(null);
  const [loading,      setLoading] = useState(true);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''),3000); };

  const loadCrews = useCallback(async()=>{
    setLoading(true);
    initGlobalCrews();
    let all = getGlobalCrews();
    (initialCrews||[]).forEach(ic=>{ if(!all.find(c=>String(c.id)===String(ic.id))) all.push({...ic,createdAt:'2024-01-01T00:00:00Z',joinedEmails:[]}); });
    try {
      const res = await axios.get(`${API_URL}/api/social/crews`,{timeout:8000});
      if(res.data?.success) {
        const sc=res.data.crews||[];
        sc.forEach(sv=>{ if(!all.find(c=>String(c.id)===String(sv.id))) all.push(sv); });
        all = all.map(c=>{ const sv=sc.find(s=>String(s.id)===String(c.id)); return sv?{...c,members:Math.max(c.members||0,sv.members||0)}:c; });
      }
    } catch {}
    setLS(GLOBAL_CREWS_KEY,all);
    setCrews(all);
    setLoading(false);
  },[initialCrews]);

  useEffect(()=>{
    loadCrews();
    const notifs=getLS(`rcreww_notifs_${user.email}`,[]);
    const cmsgs=notifs.filter(n=>n.type==='message'&&!n.read);
    const counts={}; cmsgs.forEach(n=>{if(n.crewId)counts[n.crewId]=(counts[n.crewId]||0)+1;}); setUnread(counts);
    const handler=(e)=>{ if(e.data?.type==='crews_updated') loadCrews(); };
    bc?.addEventListener('message',handler);
    return()=>bc?.removeEventListener('message',handler);
  },[user.email,loadCrews]);

  useEffect(()=>{
    if(!deepLinkCrewId||crews.length===0) return;
    const t=crews.find(c=>String(c.id)===String(deepLinkCrewId)||c.slug===deepLinkCrewId);
    if(t){setSel(t);setView('detail');onDeepLinkHandled?.();}
  },[deepLinkCrewId,crews]);

  const isJoined = (id) => joinedCrews.includes(id)||joinedCrews.includes(String(id));

  const joinCrew = (crew) => {
    if(isJoined(crew.id)) return;
    const u=[...joinedCrews,crew.id]; setJoined(u); setLS(`rcreww_joined_${user.email}`,u);
    const all=getGlobalCrews().map(c=>c.id===crew.id?{...c,members:(c.members||1)+1,joinedEmails:[...(c.joinedEmails||[]),user.email]}:c);
    saveGlobalCrews(all); setCrews(all);
    const st=getLS(`rcreww_stats_${user.email}`,{}); st.crewsJoined=(st.crewsJoined||0)+1; setLS(`rcreww_stats_${user.email}`,st);
    showToast(`🎉 joined "${crew.name}" bestie!`);
    if(crew.createdBy!==user.email) { pushNotification(crew.createdBy,{type:'join',fromUser:user.name,fromUserEmail:user.email,message:`${user.name} joined your crew "${crew.name}"`,crewId:crew.id}); updateNotificationCount?.(); }
    try { axios.post(`${API_URL}/api/social/crews/${crew.id}/join`,{userEmail:user.email,userName:user.name},{timeout:5000}); } catch {}
  };

  // LEAVE CREW
  const leaveCrew = (crew) => {
    if(!window.confirm(`leave "${crew.name}" fr bestie?`)) return;
    const u=joinedCrews.filter(id=>id!==crew.id&&id!==String(crew.id)); setJoined(u); setLS(`rcreww_joined_${user.email}`,u);
    const all=getGlobalCrews().map(c=>c.id===crew.id?{...c,members:Math.max(0,(c.members||1)-1),joinedEmails:(c.joinedEmails||[]).filter(e=>e!==user.email)}:c);
    saveGlobalCrews(all); setCrews(all);
    if(selectedCrew?.id===crew.id){setView('list');setSel(null);}
    showToast(`left "${crew.name}" — see you on the other side bestie 👋`);
    const st=getLS(`rcreww_stats_${user.email}`,{}); st.crewsJoined=Math.max(0,(st.crewsJoined||1)-1); setLS(`rcreww_stats_${user.email}`,st);
  };

  const createCrew = async () => {
    if(!newCrew.name||!newCrew.author){showToast('need book name + author bestie 👀');return;}
    const {crew:c,created} = getOrCreateCrew(newCrew.name,newCrew.author,newCrew.genre,user.email,user.name);
    if(!created) { showToast(`crew already exists! taking you there bestie 📚`); if(!isJoined(c.id))joinCrew(c); setSel(c); setView('detail'); setShowForm(false); return; }
    setCrews(getGlobalCrews());
    const u=[...joinedCrews,c.id]; setJoined(u); setLS(`rcreww_joined_${user.email}`,u);
    const st=getLS(`rcreww_stats_${user.email}`,{}); st.crewsJoined=(st.crewsJoined||0)+1; setLS(`rcreww_stats_${user.email}`,st);
    setShowForm(false); setNewCrew({name:'',author:'',genre:''});
    try { await axios.post(`${API_URL}/api/social/crews`,c,{timeout:8000}); } catch {}
    showToast(`🔥 created "${c.name}" bestie!`);
  };

  useEffect(()=>{
    if(!selectedCrew) return;
    const users=getLS('rcreww_users',[]);
    const members = (selectedCrew.joinedEmails||[]).map(email=>{
      const u=users.find(x=>x.email===email);
      return {id:email,name:u?.name||email.split('@')[0],email,initials:(u?.name||email).slice(0,2),isCreator:email===selectedCrew.createdBy};
    });
    if(!members.find(m=>m.email===selectedCrew.createdBy)) members.unshift({id:selectedCrew.createdBy,name:selectedCrew.createdByName||'Creator',email:selectedCrew.createdBy,initials:(selectedCrew.createdByName||'CR').slice(0,2),isCreator:true});
    setMembers(members);
  },[selectedCrew]);

  const filtered = crews.filter(c=>(c.name||'').toLowerCase().includes(search.toLowerCase())||(c.author||'').toLowerCase().includes(search.toLowerCase())||(c.genre||'').toLowerCase().includes(search.toLowerCase()));
  const joined_  = filtered.filter(c=>isJoined(c.id));
  const discover = filtered.filter(c=>!isJoined(c.id));

  const ToastBar = () => toast ? <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-3 rounded-2xl shadow-lg z-[100] text-center font-black animate-slideDown">{toast}</div> : null;

  if (view==='chat'&&selectedCrew) return <CrewChatView crew={selectedCrew} user={user} crewMembers={crewMembers} onBack={()=>setView('detail')} updateNotificationCount={updateNotificationCount} onViewUserProfile={onViewUserProfile} isJoined={isJoined} joinCrew={joinCrew}/>;

  if (view==='detail'&&selectedCrew) {
    const jd = isJoined(selectedCrew.id);
    return (
      <div className="h-screen flex flex-col bg-white overflow-hidden" style={{maxWidth:'448px',margin:'0 auto'}}>
        <ToastBar/>
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3 z-10 flex-shrink-0">
          <button onClick={()=>setView('list')} className="p-1 hover:bg-gray-100 rounded-xl"><ChevronLeft className="w-5 h-5"/></button>
          <span className="font-black flex-1 text-gray-900">crew info</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="bg-gradient-to-b from-orange-50 to-white px-4 pt-6 pb-4">
            <div className="flex flex-col items-center text-center">
              <DynamicBookCover title={selectedCrew.name} author={selectedCrew.author} size="xl" onClick={()=>setSelBook({title:selectedCrew.name,author:selectedCrew.author})}/>
              <h1 className="text-2xl font-black text-gray-900 mt-4">{selectedCrew.name}</h1>
              <p className="text-gray-500">by {selectedCrew.author}</p>
              {selectedCrew.genre&&<span className="mt-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-black">{selectedCrew.genre}</span>}
              <div className="mt-4 flex gap-8">
                <div className="text-center"><p className="text-2xl font-black">{crewMembers.length}</p><p className="text-xs text-gray-500">members</p></div>
              </div>
              <div className="flex gap-3 mt-5 w-full">
                {!jd?<button onClick={()=>joinCrew(selectedCrew)} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black hover:opacity-90 transition">join the crew 🔥</button>
                     :<button onClick={()=>setView('chat')} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 transition"><MessageCircle className="w-4 h-4"/>open chat</button>}
                <button onClick={()=>setShareM(selectedCrew)} className="px-4 py-3 border border-gray-200 rounded-2xl hover:bg-gray-50 transition flex items-center gap-1.5 text-gray-600 text-sm font-black"><Share2 className="w-4 h-4"/>invite</button>
              </div>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-black text-gray-900 mb-3">members ({crewMembers.length})</h3>
            <div className="space-y-3">
              {crewMembers.map(m=>(
                <div key={m.id} className="flex items-center gap-3">
                  {/* Clicking member name → profile */}
                  <button onClick={()=>onViewUserProfile(m.email,m.name)} className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center text-white font-black hover:opacity-80 transition">{m.initials}</button>
                  <div className="flex-1">
                    <button onClick={()=>onViewUserProfile(m.email,m.name)} className="font-black hover:underline hover:text-orange-500 transition text-sm">{m.name}</button>
                    <p className="text-xs text-gray-500">{m.isCreator?'👑 creator':'member'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* LEAVE CREW button */}
          {jd&&(
            <div className="p-4 pt-0 space-y-2">
              {view==='detail'&&<button onClick={()=>setView('chat')} className="w-full py-3 bg-orange-50 border border-orange-200 text-orange-600 rounded-2xl font-black hover:bg-orange-100 transition flex items-center justify-center gap-2"><MessageCircle className="w-4 h-4"/>open chat</button>}
              <button onClick={()=>leaveCrew(selectedCrew)} className="w-full py-3 border border-red-200 text-red-500 rounded-2xl font-black hover:bg-red-50 transition flex items-center justify-center gap-2">
                🚪 leave crew
              </button>
            </div>
          )}
        </div>
        {selBook&&<BookDetailsModal book={selBook} onClose={()=>setSelBook(null)} onCreateCrew={()=>{}} currentUser={user}/>}
        {shareModal&&<ShareModal crewInvite={shareModal} onClose={()=>setShareM(null)}/>}
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <ToastBar/>
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-pink-500 rounded-md flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-white"/></div>
          <span className="font-black text-gray-900" style={{fontFamily:'Georgia,serif'}}>reading crews</span>
        </div>
        <button onClick={()=>setShowForm(true)} className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-sm font-black hover:opacity-90 transition">+ create</button>
      </div>
      <div className="px-4 py-4 space-y-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="search global crews bestie 🌍..." className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"/>
          {search&&<button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400"/></button>}
        </div>

        {showForm&&(
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h3 className="font-black mb-1">start a new crew 🔥</h3>
            <p className="text-xs text-gray-400 mb-3">one book = one crew globally — we'll redirect you if it exists bestie!</p>
            {newCrew.name&&<div className="flex justify-center mb-4"><DynamicBookCover title={newCrew.name} author={newCrew.author} size="md"/></div>}
            <div className="space-y-3">
              <input value={newCrew.name}   onChange={e=>setNewCrew({...newCrew,name:e.target.value})}   className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300" placeholder="book title *"/>
              <input value={newCrew.author} onChange={e=>setNewCrew({...newCrew,author:e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300" placeholder="author *"/>
              <input value={newCrew.genre}  onChange={e=>setNewCrew({...newCrew,genre:e.target.value})}  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300" placeholder="genre (optional)"/>
              <div className="flex gap-2">
                <button onClick={createCrew} className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-sm font-black hover:opacity-90 transition">create/join crew 🚀</button>
                <button onClick={()=>setShowForm(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-black">nah</button>
              </div>
            </div>
          </div>
        )}

        {/* My Crews */}
        <div>
          <h2 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-orange-500"/>my crews ({joined_.length})</h2>
          {joined_.length===0?<div className="bg-white rounded-2xl p-6 text-center border border-gray-100"><p className="text-gray-400 text-sm font-semibold">join a crew below bestie!</p></div>
           : joined_.map(crew=>(
            <div key={crew.id} className="bg-white rounded-2xl border border-green-200 shadow-sm mb-3 overflow-hidden">
              <div className="flex items-center px-4 gap-3 py-3 cursor-pointer" onClick={()=>{setSel(crew);setView('detail');}}>
                <DynamicBookCover title={crew.name} author={crew.author} size="sm"/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-gray-900 text-sm truncate">{crew.name}</p>
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-black flex-shrink-0">joined</span>
                    {unread[crew.id]>0&&<span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-black">{unread[crew.id]}</span>}
                  </div>
                  <p className="text-xs text-gray-500">by {crew.author}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {crew.genre&&<span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full font-semibold">{crew.genre}</span>}
                    <span className="text-xs text-gray-400 flex items-center gap-0.5"><Users className="w-3 h-3"/>{crew.members||1}</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2.5 flex gap-2 justify-end border-t border-gray-50">
                <button onClick={e=>{e.stopPropagation();setSel(crew);setView('chat');}} className="px-3 py-1.5 bg-orange-100 text-orange-600 rounded-xl text-xs font-black hover:bg-orange-200 transition flex items-center gap-1"><MessageCircle className="w-3 h-3"/>chat</button>
                <button onClick={e=>{e.stopPropagation();setShareM(crew);}} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-black hover:bg-gray-200 transition flex items-center gap-1"><Share2 className="w-3 h-3"/>invite</button>
                <button onClick={e=>{e.stopPropagation();leaveCrew(crew);}} className="px-3 py-1.5 bg-red-50 text-red-500 rounded-xl text-xs font-black hover:bg-red-100 transition">leave</button>
              </div>
            </div>
          ))}
        </div>

        {/* Discover Crews */}
        <div>
          <h2 className="text-lg font-black text-gray-900 mb-3">discover crews 🌍 <span className="text-sm text-gray-400 font-semibold">({discover.length} global)</span></h2>
          {loading?<div className="flex justify-center py-8"><LoadingSpinner/></div>
           : discover.length===0?<div className="bg-white rounded-2xl p-6 text-center border border-gray-100"><p className="text-gray-400 text-sm font-semibold">no crews to discover rn bestie</p></div>
           : discover.map(crew=>(
            <div key={crew.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-3 overflow-hidden cursor-pointer hover:shadow-md transition" onClick={()=>{setSel(crew);setView('detail');}}>
              <div className="flex items-center px-4 gap-3 py-3">
                <DynamicBookCover title={crew.name} author={crew.author} size="sm"/>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 text-sm truncate">{crew.name}</p>
                  <p className="text-xs text-gray-500">by {crew.author}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {crew.genre&&<span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full font-semibold">{crew.genre}</span>}
                    <span className="text-xs text-gray-400 flex items-center gap-0.5"><Users className="w-3 h-3"/>{crew.members||1}</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-gray-50 flex justify-end">
                <button onClick={e=>{e.stopPropagation();joinCrew(crew);}} className="px-5 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-xs font-black hover:opacity-90 transition">join fr 🔥</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selBook&&<BookDetailsModal book={selBook} onClose={()=>setSelBook(null)} onCreateCrew={()=>{}} currentUser={user}/>}
      {shareModal&&<ShareModal crewInvite={shareModal} onClose={()=>setShareM(null)}/>}
    </div>
  );
});


// ══════════════════════════════════════════════════════════════════════════════
// PROFILE PAGE — Book Status Ring (Instagram/WhatsApp style), private tabs
// ══════════════════════════════════════════════════════════════════════════════
const ProfilePage = memo(({ user, posts, setPage, onLogout, onUpdateUser, profileSrc, setProfileSrc, savedPosts, following, followers }) => {
  const [activeTab,    setActiveTab]  = useState('Posts');
  const [stats,        setStats]      = useState(()=>getLS(`rcreww_stats_${user.email}`,{}));
  const [readingGoal,  setRG]         = useState(user?.readingGoal||{yearly:0,monthly:0});
  const [showGoalEdit, setGoalEdit]   = useState(false);
  const [editGoal,     setEG]         = useState(readingGoal);
  const [books,        setBooks]      = useState(()=>getLS(`rcreww_reading_${user.email}`,[]));
  const [showAddBook,  setShowAdd]    = useState(false);
  const [newBook,      setNewBook]    = useState({title:'',author:'',rating:5,notes:''});
  const [editProfile,  setEditProf]   = useState(false);
  const [editName,     setEN]         = useState(user?.name||'');
  const [editBio,      setEB]         = useState(user?.bio||'');
  const [editLocation, setEL]         = useState(user?.location||'');
  const [editWebsite,  setEW]         = useState(user?.website||'');
  const [showFollowers,setShowFwers]  = useState(false);
  const [showFollowing,setShowFwing]  = useState(false);
  // Book status (reading status ring)
  const [currentStatus,setStatus]     = useState(()=>getLS(`rcreww_status_${user.email}`,null));
  const [showStatusModal,setShowSM]   = useState(false);
  const [statusBookTitle,setSBT]      = useState('');
  const [statusBookAuthor,setSBA]     = useState('');
  const fileRef = useRef();

  const myPosts   = posts.filter(p=>p.userEmail===user?.email);
  const myReviews = getGlobalReviews().filter(r=>r.userEmail===user?.email);
  // PRIVATE: saved posts only visible to self
  const savedList = posts.filter(p=>savedPosts?.includes(p.id));
  // PRIVATE: crews only visible to self
  const joinedIds = getLS(`rcreww_joined_${user.email}`,[]);
  const allCrews  = getGlobalCrews();
  const myCrews   = allCrews.filter(c=>joinedIds.includes(c.id)||joinedIds.includes(String(c.id)));

  useEffect(()=>{
    const st=getLS(`rcreww_stats_${user.email}`,{}); setStats(st);
  },[user.email]);

  const uploadPic = (e) => {
    const f=e.target.files[0]; if(!f) return;
    if(f.size>5*1024*1024){alert('max 5MB bestie');return;}
    const r=new FileReader();
    r.onload=ev=>{
      const img=ev.target.result;
      setProfileSrc(img);
      setLS(`rcreww_pic_${user.email}`,img);
      const users=getLS('rcreww_users',[]);
      setLS('rcreww_users',users.map(u=>u.email===user.email?{...u,profileImage:img}:u));
      const cu=getLS('rcreww_current',{});
      setLS('rcreww_current',{...cu,profileImage:img});
      onUpdateUser?.({...user,profileImage:img});
    };
    r.readAsDataURL(f);
  };

  const saveProfile = () => {
    const updated={...user,name:editName,bio:editBio,location:editLocation,website:editWebsite};
    setLS('rcreww_current',updated);
    const users=getLS('rcreww_users',[]);
    setLS('rcreww_users',users.map(u=>u.email===user.email?updated:u));
    onUpdateUser?.(updated); setEditProf(false);
  };

  const saveGoal = () => {
    const updated={...user,readingGoal:editGoal};
    setLS('rcreww_current',updated);
    setRG(editGoal); setGoalEdit(false); onUpdateUser?.(updated);
  };

  const addBook = () => {
    if(!newBook.title){alert('drop the book name bestie');return;}
    const book={id:generateId(),...newBook,addedAt:new Date().toISOString()};
    const updated=[book,...books]; setBooks(updated);
    setLS(`rcreww_reading_${user.email}`,updated);
    const st={...stats,booksRead:updated.length}; setStats(st); setLS(`rcreww_stats_${user.email}`,st);
    setNewBook({title:'',author:'',rating:5,notes:''}); setShowAdd(false);
  };

  const delBook = (id) => {
    if(!window.confirm('remove this book fr?')) return;
    const updated=books.filter(b=>b.id!==id); setBooks(updated);
    setLS(`rcreww_reading_${user.email}`,updated);
    const st={...stats,booksRead:updated.length}; setStats(st); setLS(`rcreww_stats_${user.email}`,st);
  };

  // Set book status (reading ring)
  const saveStatus = () => {
    if(!statusBookTitle.trim()){alert('enter what you\'re reading bestie!');return;}
    const status={title:statusBookTitle.trim(),author:statusBookAuthor.trim(),setAt:new Date().toISOString()};
    setLS(`rcreww_status_${user.email}`,status);
    setStatus(status); setShowSM(false); setSBT(''); setSBA('');
  };
  const clearStatus = () => { localStorage.removeItem(`rcreww_status_${user.email}`); setStatus(null); };

  // Follower/Following modal — clicking name → profile
  const FollowerModal = ({ title, emailList, onClose:closeM }) => {
    const users = getLS('rcreww_users',[]);
    return (
      <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
        <div className="bg-white rounded-3xl w-full max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-3xl">
            <h3 className="font-black">{title} ({emailList.length})</h3>
            <button onClick={closeM} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
          </div>
          <div className="p-4 space-y-2">
            {emailList.length===0
              ? <p className="text-center text-gray-400 py-4 font-semibold">no one here yet bestie</p>
              : emailList.map(email=>{
                const u=users.find(x=>x.email===email);
                const pic=getLS(`rcreww_pic_${email}`,null);
                return (
                  // Clicking name in followers/following → goes to their profile
                  <button key={email} onClick={()=>{closeM();setPage('profile_'+email);}} className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition">
                    <Avatar initials={u?.name||email} size="sm" src={u?.profileImage||pic}/>
                    <div className="flex-1 text-left">
                      <p className="font-black text-gray-900 text-sm">{u?.name||email.split('@')[0]}</p>
                      <p className="text-xs text-gray-500">@{email.split('@')[0]}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300"/>
                  </button>
                );
              })
            }
          </div>
        </div>
      </div>
    );
  };

  // Book status modal
  const StatusModal = () => (
    <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="bg-white rounded-3xl w-full max-w-sm mx-auto shadow-2xl">
        <div className="bg-gradient-to-br from-orange-500 to-pink-500 p-5 rounded-t-3xl text-white">
          <div className="flex items-center justify-between">
            <div><h3 className="font-black text-lg">set reading status 📚</h3><p className="text-orange-100 text-sm mt-0.5">show your crew what you're reading rn</p></div>
            <button onClick={()=>setShowSM(false)} className="p-1 bg-white/20 rounded-full hover:bg-white/30 transition"><X className="w-5 h-5"/></button>
          </div>
        </div>
        <div className="p-5 space-y-3">
          {currentStatus&&(
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 flex items-center justify-between">
              <div><p className="text-xs text-orange-600 font-black">currently showing</p><p className="text-sm font-black text-gray-900">{currentStatus.title}</p>{currentStatus.author&&<p className="text-xs text-gray-500">by {currentStatus.author}</p>}</div>
              <button onClick={clearStatus} className="text-xs text-red-400 font-black hover:text-red-500">clear</button>
            </div>
          )}
          <input value={statusBookTitle} onChange={e=>setSBT(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-400" placeholder="what are you reading rn? *"/>
          <input value={statusBookAuthor} onChange={e=>setSBA(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-400" placeholder="author (optional)"/>
          <p className="text-xs text-gray-400 text-center">your ring will glow on your profile — bestie energy ✨</p>
          <button onClick={saveStatus} disabled={!statusBookTitle.trim()} className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl font-black hover:opacity-90 transition disabled:opacity-40">set status 🔥</button>
        </div>
      </div>
    </div>
  );

  const tabs = ['Posts','Reviews','Books Read','Crews','Saved'];
  const progress = readingGoal.yearly>0 ? Math.min((stats.booksRead||0)/readingGoal.yearly*100,100) : 0;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      {showFollowers&&<FollowerModal title="Followers" emailList={followers||[]} onClose={()=>setShowFwers(false)}/>}
      {showFollowing&&<FollowerModal title="Following" emailList={following||[]} onClose={()=>setShowFwing(false)}/>}
      {showStatusModal&&<StatusModal/>}

      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-pink-500 rounded-md flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-white"/></div>
          <span className="font-black text-gray-900" style={{fontFamily:'Georgia,serif'}}>my profile</span>
        </div>
        <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-xl"><LogOut className="w-5 h-5 text-gray-600"/></button>
      </div>

      <div className="px-4 py-5">
        {/* Avatar with reading status RING */}
        <div className="flex items-start gap-4 mb-5">
          <div className="relative flex-shrink-0">
            {/* Story ring if status is set */}
            <div className={`p-0.5 rounded-full ${currentStatus ? 'bg-gradient-to-tr from-orange-400 via-pink-400 to-purple-500' : 'bg-transparent'}`}>
              <div className="p-0.5 bg-white rounded-full">
                <div className="relative">
                  {profileSrc
                    ? <img src={profileSrc} alt={user?.name} className="w-20 h-20 rounded-full object-cover cursor-pointer" onClick={()=>setShowSM(true)}/>
                    : <div className="w-20 h-20 cursor-pointer" onClick={()=>setShowSM(true)}><Avatar initials={user?.name} size="xl"/></div>
                  }
                  {/* Camera button */}
                  <button onClick={()=>fileRef.current?.click()} className="absolute bottom-0 right-0 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow hover:bg-orange-600 transition">
                    <Camera className="w-3 h-3 text-white"/>
                  </button>
                </div>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPic}/>
            {/* Status indicator dot */}
            {currentStatus&&<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full border-2 border-white flex items-center justify-center"><BookOpen className="w-2.5 h-2.5 text-white"/></div>}
          </div>

          <div className="flex-1 min-w-0">
            {editProfile ? (
              <div className="space-y-2">
                <input value={editName} onChange={e=>setEN(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300" placeholder="name"/>
                <input value={editLocation} onChange={e=>setEL(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300" placeholder="location"/>
                <input value={editWebsite} onChange={e=>setEW(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300" placeholder="website"/>
                <textarea value={editBio} onChange={e=>setEB(e.target.value)} rows={2} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300 resize-none" placeholder="bio..."/>
                <div className="flex gap-2">
                  <button onClick={saveProfile} className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-sm font-black hover:opacity-90 transition">save</button>
                  <button onClick={()=>setEditProf(false)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-black hover:bg-gray-50">cancel</button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-black text-gray-900 truncate">{user?.name}</h2>
                <p className="text-sm text-gray-400">@{user?.name?.toLowerCase().replace(/\s/g,'')}</p>
                {user?.location&&<p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3"/>{user.location}</p>}
                {user?.website&&<a href={user.website.startsWith('http')?user.website:`https://${user.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-500 mt-0.5 flex items-center gap-1 hover:underline"><ExternalLink className="w-3 h-3"/>{user.website.replace(/^https?:\/\//,'')}</a>}
                <p className="text-sm text-gray-600 mt-1.5 italic">"{user?.bio||'living my best bookish era 📚'}"</p>
                {/* Current reading status */}
                {currentStatus&&(
                  <div className="mt-2 bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-100 rounded-xl px-3 py-2 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-orange-500 flex-shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-orange-600 font-black">📖 currently reading</p>
                      <p className="text-xs text-gray-800 font-black truncate">{currentStatus.title}</p>
                      {currentStatus.author&&<p className="text-xs text-gray-500">by {currentStatus.author}</p>}
                    </div>
                    <button onClick={()=>setShowSM(true)} className="text-xs text-orange-400 font-black hover:text-orange-500">edit</button>
                  </div>
                )}
                <div className="flex gap-4 mt-2">
                  {/* Clicking followers → modal with clickable names */}
                  <button onClick={()=>setShowFwers(true)} className="text-center hover:opacity-75 transition">
                    <p className="font-black text-gray-900">{followers?.length||0}</p>
                    <p className="text-xs text-gray-500">followers</p>
                  </button>
                  <button onClick={()=>setShowFwing(true)} className="text-center hover:opacity-75 transition">
                    <p className="font-black text-gray-900">{following?.length||0}</p>
                    <p className="text-xs text-gray-500">following</p>
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={()=>setEditProf(true)} className="px-4 py-1.5 border border-orange-200 text-orange-600 rounded-xl text-sm font-black hover:bg-orange-50 flex items-center gap-1.5 transition">
                    <Edit className="w-3.5 h-3.5"/>edit profile
                  </button>
                  <button onClick={()=>setShowSM(true)} className={`px-3 py-1.5 rounded-xl text-sm font-black transition flex items-center gap-1.5 ${currentStatus?'bg-gradient-to-r from-orange-500 to-pink-500 text-white':'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <BookOpen className="w-3.5 h-3.5"/>status
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reading goal */}
        <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-4 border border-orange-100 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><Target className="w-4 h-4 text-orange-500"/><h3 className="font-black text-sm">reading goal {new Date().getFullYear()}</h3></div>
            <button onClick={()=>setGoalEdit(!showGoalEdit)} className="text-sm text-orange-500 font-black">{showGoalEdit?'cancel':'edit'}</button>
          </div>
          {showGoalEdit?(
            <div className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 mb-1 block font-black">yearly</label><input type="number" value={editGoal.yearly} onChange={e=>setEG({...editGoal,yearly:parseInt(e.target.value)||0})} className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-400 focus:outline-none text-sm" min="0" max="365"/></div>
                <div><label className="text-xs text-gray-600 mb-1 block font-black">monthly</label><input type="number" value={editGoal.monthly} onChange={e=>setEG({...editGoal,monthly:parseInt(e.target.value)||0})} className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-400 focus:outline-none text-sm" min="0" max="31"/></div>
              </div>
              <button onClick={saveGoal} className="w-full py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-sm font-black hover:opacity-90 transition">save goal</button>
            </div>
          ):(
            <>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 font-semibold">progress</span>
                <span className="font-black">{readingGoal.yearly>0?`${stats.booksRead||0}/${readingGoal.yearly} books`:'no goal set'}</span>
              </div>
              {readingGoal.yearly>0&&<div className="h-2 bg-orange-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all duration-500" style={{width:`${progress}%`}}/></div>}
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 bg-white rounded-2xl p-3 border border-gray-100 mb-5">
          {[{l:'Books',v:stats.booksRead||0,I:BookOpen,c:'text-blue-600'},{l:'Reviews',v:stats.reviewsGiven||0,I:Star,c:'text-purple-600'},{l:'Posts',v:stats.postsCreated||0,I:Edit3,c:'text-green-600'},{l:'Crews',v:stats.crewsJoined||0,I:Users,c:'text-orange-600'}].map(({l,v,I,c},i)=>(
            <div key={i} className="text-center"><I className={`w-5 h-5 ${c} mx-auto mb-1`}/><p className="text-lg font-black text-gray-900">{v}</p><p className="text-xs text-gray-500 font-semibold">{l}</p></div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4 overflow-x-auto" style={{scrollbarWidth:'none'}}>
          {tabs.map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)} className={`flex-shrink-0 text-sm pb-2.5 px-3 font-black border-b-2 transition whitespace-nowrap ${activeTab===tab?'text-orange-500 border-orange-500':'text-gray-400 border-transparent hover:text-gray-600'}`}>{tab}</button>
          ))}
        </div>

        {/* Posts tab */}
        {activeTab==='Posts'&&(
          <div className="space-y-4">
            {myPosts.length===0?<div className="text-center py-8"><Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-400 font-black">no posts yet bestie — start your era 📸</p><button onClick={()=>setPage('post')} className="mt-3 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-sm font-black">create first post</button></div>
             : myPosts.map(post=>(
              <div key={post.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-700 mb-2 leading-relaxed" style={{fontFamily:'Georgia,serif'}}>{post.content}</p>
                {post.bookName&&<p className="text-xs text-orange-500 font-black">📖 {post.bookName}</p>}
                {post.image&&<img src={post.image} alt="" className="w-full rounded-xl mt-2 max-h-40 object-cover" loading="lazy"/>}
                <div className="flex items-center gap-4 pt-2 border-t border-gray-50 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1 font-semibold"><Heart className="w-3.5 h-3.5"/>{getLikeCount(post.id)||post.likes||0}</span>
                  <span className="flex items-center gap-1 font-semibold"><MessageCircle className="w-3.5 h-3.5"/>{getPostComments(post.id).filter(c=>!c.parentId).length||post.comments||0}</span>
                  <span>{formatTimeAgo(post.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reviews tab */}
        {activeTab==='Reviews'&&(
          <div className="space-y-4">
            {myReviews.length===0?<div className="text-center py-8"><Star className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-400 font-black">no reviews yet bestie — spill the tea ☕</p><button onClick={()=>setPage('reviews')} className="mt-3 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-sm font-black">write a review</button></div>
             : myReviews.map(rev=>(
              <div key={rev.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-start gap-3 mb-2">
                  <DynamicBookCover title={rev.bookName} author={rev.author} size="sm"/>
                  <div className="flex-1"><h3 className="font-black text-sm">{rev.bookName}</h3><p className="text-xs text-gray-500">by {rev.author}</p><StarRating rating={rev.rating} size="xs" readonly/></div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{rev.review}</p>
                <p className="text-xs text-gray-400 mt-2">{formatTimeAgo(rev.createdAt)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Books Read tab — PRIVATE */}
        {activeTab==='Books Read'&&(
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-gray-400"/><p className="text-xs text-gray-400 font-semibold">private — only you can see this</p></div>
              <button onClick={()=>setShowAdd(!showAddBook)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-sm font-black hover:opacity-90 transition"><Plus className="w-4 h-4"/>{showAddBook?'cancel':'add'}</button>
            </div>
            {showAddBook&&(
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="space-y-3">
                  <input value={newBook.title}  onChange={e=>setNewBook({...newBook,title:e.target.value})}  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300" placeholder="book title *"/>
                  <input value={newBook.author} onChange={e=>setNewBook({...newBook,author:e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300" placeholder="author"/>
                  <div><label className="text-xs text-gray-600 mb-1 block font-black">your rating</label><StarRating rating={newBook.rating} onChange={r=>setNewBook({...newBook,rating:r})} size="md"/></div>
                  <textarea value={newBook.notes} onChange={e=>setNewBook({...newBook,notes:e.target.value})} rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-300 resize-none" placeholder="notes..."/>
                  <button onClick={addBook} className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-black text-sm hover:opacity-90 transition">add to my list ✅</button>
                </div>
              </div>
            )}
            {books.length===0?<div className="text-center py-8"><BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-400 font-black text-sm">no books logged yet bestie</p></div>
             : books.map(book=>(
              <div key={book.id} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex items-start gap-3">
                <DynamicBookCover title={book.title} author={book.author} size="sm"/>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-sm text-gray-900">{book.title}</h3>
                  <p className="text-xs text-gray-500">{book.author}</p>
                  <StarRating rating={book.rating} size="xs" readonly/>
                  {book.notes&&<p className="text-xs text-gray-500 mt-1 italic">"{book.notes}"</p>}
                  <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(book.addedAt)}</p>
                </div>
                <button onClick={()=>delBook(book.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4 text-red-300 hover:text-red-500"/></button>
              </div>
            ))}
          </div>
        )}

        {/* Crews tab — PRIVATE */}
        {activeTab==='Crews'&&(
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2"><Lock className="w-4 h-4 text-gray-400"/><p className="text-xs text-gray-400 font-semibold">private — only you can see this</p></div>
            {myCrews.length===0?<div className="text-center py-8"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-400 font-black text-sm">no crews yet bestie</p><button onClick={()=>setPage('crews')} className="mt-3 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-sm font-black">browse crews</button></div>
             : myCrews.map(crew=>(
              <div key={crew.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center px-4 gap-3 py-3">
                  <DynamicBookCover title={crew.name} author={crew.author} size="sm"/>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-sm truncate">{crew.name}</p>
                    <p className="text-xs text-gray-500">by {crew.author}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {crew.genre&&<span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full font-semibold">{crew.genre}</span>}
                      <span className="text-xs text-gray-400">{crew.members||1} members</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Saved tab — PRIVATE */}
        {activeTab==='Saved'&&(
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2"><Lock className="w-4 h-4 text-gray-400"/><p className="text-xs text-gray-400 font-semibold">private — only you can see this</p></div>
            {savedList.length===0?<div className="text-center py-8"><Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-400 font-black text-sm">no saved posts yet bestie</p></div>
             : savedList.map(post=>(
              <div key={post.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar initials={post.userName} size="xs" src={post.userPhoto}/>
                  <span className="text-xs font-black text-gray-700">{post.userName}</span>
                </div>
                <p className="text-sm text-gray-700">{post.content}</p>
                {post.bookName&&<p className="text-xs text-orange-500 mt-1 font-black">📖 {post.bookName}</p>}
                <p className="text-xs text-gray-400 mt-2">{formatTimeAgo(post.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS PAGE
// ══════════════════════════════════════════════════════════════════════════════
const NotificationsPage = memo(({ user, onClose, updateNotificationCount }) => {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(()=>{
    const raw=getLS(`rcreww_notifs_${user.email}`,[]);
    const social=raw.filter(n=>n.type!=='message');
    setNotifs(social.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)));
    setLoading(false);
  },[user.email]);

  useEffect(()=>{
    load();
    const h=(e)=>{ if(e.data?.type==='notif'&&e.data.payload?.targetEmail===user.email) load(); };
    const hc=(e)=>{ if(e.detail?.targetEmail===user.email) load(); };
    bc?.addEventListener('message',h);
    window.addEventListener('rc:notif',hc);
    return()=>{ bc?.removeEventListener('message',h); window.removeEventListener('rc:notif',hc); };
  },[user.email,load]);

  const markAll = () => {
    const raw=getLS(`rcreww_notifs_${user.email}`,[]);
    const updated=raw.map(n=>({...n,read:true}));
    updated.forEach(n=>_shownToastIds.add(n.id));
    setLS(`rcreww_notifs_${user.email}`,updated);
    setNotifs(prev=>prev.map(n=>({...n,read:true})));
    updateNotificationCount?.();
  };
  const markOne = (id) => {
    _shownToastIds.add(id);
    const raw=getLS(`rcreww_notifs_${user.email}`,[]);
    setLS(`rcreww_notifs_${user.email}`,raw.map(n=>n.id===id?{...n,read:true}:n));
    setNotifs(p=>p.map(n=>n.id===id?{...n,read:true}:n));
    updateNotificationCount?.();
  };
  const delOne = (id) => {
    const raw=getLS(`rcreww_notifs_${user.email}`,[]);
    setLS(`rcreww_notifs_${user.email}`,raw.filter(n=>n.id!==id));
    setNotifs(p=>p.filter(n=>n.id!==id));
    updateNotificationCount?.();
  };

  const icons={like:<Heart className="w-4 h-4 text-red-500"/>,comment:<MessageCircle className="w-4 h-4 text-blue-500"/>,mention:<AtSign className="w-4 h-4 text-amber-500"/>,reshare:<Repeat className="w-4 h-4 text-indigo-500"/>,follow:<UserCheck className="w-4 h-4 text-green-500"/>,join:<Users className="w-4 h-4 text-blue-500"/>,review:<Star className="w-4 h-4 text-yellow-500"/>,success:<CheckCircle className="w-4 h-4 text-green-500"/>,info:<Info className="w-4 h-4 text-orange-500"/>,warning:<AlertCircle className="w-4 h-4 text-orange-500"/>};
  const ibgs={like:'bg-red-100',comment:'bg-blue-100',mention:'bg-amber-100',reshare:'bg-indigo-100',follow:'bg-green-100',join:'bg-blue-100',review:'bg-yellow-100',success:'bg-green-100',info:'bg-orange-100',warning:'bg-amber-100'};
  const unread=notifs.filter(n=>!n.read).length;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-xl"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
        <div className="flex items-center gap-2">
          <h2 className="font-black text-gray-900">notifications</h2>
          {unread>0&&<span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-black">{unread}</span>}
        </div>
        <button onClick={markAll} disabled={unread===0} className={`text-sm font-black transition ${unread>0?'text-orange-500 hover:text-orange-600':'text-gray-300 cursor-not-allowed'}`}>mark all read</button>
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        {loading?<div className="flex justify-center py-12"><LoadingSpinner/></div>
         : notifs.length===0?(
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Bell className="w-10 h-10 text-gray-300"/></div>
            <p className="text-gray-500 font-black">all caught up bestie 🎉</p>
            <p className="text-gray-400 text-sm mt-1">your hype squad will slide in here 📬</p>
          </div>
         ):(
          <div className="divide-y divide-gray-50">
            {notifs.map(n=>(
              <div key={n.id} onClick={()=>!n.read&&markOne(n.id)} className={`p-4 transition cursor-pointer hover:bg-gray-50 ${n.read?'bg-white':'bg-orange-50'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${ibgs[n.type]||'bg-gray-100'}`}>{icons[n.type]||<Bell className="w-4 h-4 text-gray-500"/>}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 leading-relaxed font-semibold">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(n.timestamp)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!n.read&&<div className="w-2.5 h-2.5 bg-orange-500 rounded-full flex-shrink-0"/>}
                    <button onClick={e=>{e.stopPropagation();delOne(n.id);}} className="p-1 text-gray-200 hover:text-red-400 transition"><X className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// FULL USER PROFILE PAGE — Shows public content only, private tabs HIDDEN
// Clicking followers/following names → navigate to their profile
// ══════════════════════════════════════════════════════════════════════════════
const FullUserProfilePage = memo(({ viewedEmail, viewedName, currentUser, onBack, onFollow, isFollowing, onBlock, isBlocked, onViewUserProfile }) => {
  const [userData,  setData]    = useState(null);
  const [userPosts, setPosts]   = useState([]);
  const [userRevs,  setRevs]    = useState([]);
  const [stats,     setStats]   = useState({posts:0,reviews:0,followers:0,following:0,crewsJoined:0,booksRead:0});
  const [activeTab, setActiveTab]=useState('Posts');
  const [selBook,   setSel]     = useState(null);
  const [showFwers, setShowFwers]=useState(false);
  const [showFwing, setShowFwing]=useState(false);
  const profilePic = getLS(`rcreww_pic_${viewedEmail}`,null);
  // Book status
  const status = getLS(`rcreww_status_${viewedEmail}`,null);

  useEffect(()=>{
    const users=getLS('rcreww_users',[]);
    const found=users.find(u=>u.email===viewedEmail);
    if(found) setData(found);
    const fwers=getLS(`rcreww_followers_${viewedEmail}`,[]);
    const fwing=getLS(`rcreww_following_${viewedEmail}`,[]);
    const allPosts=getGlobalPosts();
    const posts=allPosts.filter(p=>p.userEmail===viewedEmail);
    setPosts(posts);
    const revs=getGlobalReviews().filter(r=>r.userEmail===viewedEmail);
    setRevs(revs);
    const st=getLS(`rcreww_stats_${viewedEmail}`,{});
    setStats({posts:posts.length,reviews:revs.length,followers:fwers.length,following:fwing.length,crewsJoined:st.crewsJoined||0,booksRead:st.booksRead||0});
  },[viewedEmail]);

  // Follower/Following modal — clicking name → profile
  const FollowerModal2 = ({ title, emailList, onClose:closeM }) => {
    const users=getLS('rcreww_users',[]);
    return (
      <div className="fixed inset-0 bg-black/50 z-[85] flex items-center justify-center p-4" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
        <div className="bg-white rounded-3xl w-full max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-3xl">
            <h3 className="font-black">{title} ({emailList.length})</h3>
            <button onClick={closeM} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
          </div>
          <div className="p-4 space-y-2">
            {emailList.length===0?<p className="text-center text-gray-400 py-4 font-semibold">no one here yet bestie</p>
             : emailList.map(email=>{
              const u=users.find(x=>x.email===email);
              const pic=getLS(`rcreww_pic_${email}`,null);
              return (
                <button key={email} onClick={()=>{closeM();onViewUserProfile(email,u?.name||email.split('@')[0]);}} className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition">
                  <Avatar initials={u?.name||email} size="sm" src={u?.profileImage||pic}/>
                  <div className="flex-1 text-left">
                    <p className="font-black text-gray-900 text-sm">{u?.name||email.split('@')[0]}</p>
                    <p className="text-xs text-gray-500">@{email.split('@')[0]}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300"/>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // PUBLIC tabs only — Books Read, Crews, Saved = PRIVATE (hidden)
  const tabs = ['Posts','Reviews'];

  return (
    <div className="min-h-screen bg-gray-50 pb-24 overflow-y-auto">
      {showFwers&&<FollowerModal2 title="Followers" emailList={getLS(`rcreww_followers_${viewedEmail}`,[])} onClose={()=>setShowFwers(false)}/>}
      {showFwing&&<FollowerModal2 title="Following" emailList={getLS(`rcreww_following_${viewedEmail}`,[])} onClose={()=>setShowFwing(false)}/>}
      {selBook&&<BookDetailsModal book={selBook} onClose={()=>setSel(null)} onCreateCrew={()=>{}} currentUser={currentUser}/>}

      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-xl"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
        <h2 className="font-black text-gray-900 flex-1 truncate">{viewedName}'s profile</h2>
        <div className="w-6"/>
      </div>

      <div className="px-4 py-5">
        <div className="flex items-start gap-4 mb-5">
          {/* Status ring on other user's profile */}
          <div className={`p-0.5 rounded-full ${status?'bg-gradient-to-tr from-orange-400 via-pink-400 to-purple-500':'bg-transparent'} flex-shrink-0`}>
            <div className="p-0.5 bg-white rounded-full">
              <Avatar initials={viewedName} size="xl" src={userData?.profileImage||profilePic}/>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-gray-900 truncate">{viewedName}</h2>
            <p className="text-sm text-gray-400">@{viewedName?.toLowerCase().replace(/\s/g,'')}</p>
            {userData?.bio&&<p className="text-sm text-gray-600 mt-1 italic">"{userData.bio}"</p>}
            {userData?.location&&<p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3"/>{userData.location}</p>}
            {/* Status display */}
            {status&&(
              <div className="mt-2 bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-100 rounded-xl px-3 py-2 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-orange-500 flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-orange-600 font-black">📖 currently reading</p>
                  <p className="text-xs text-gray-800 font-black truncate">{status.title}</p>
                  {status.author&&<p className="text-xs text-gray-500">by {status.author}</p>}
                </div>
              </div>
            )}
            {/* Clickable followers/following */}
            <div className="flex gap-4 mt-2">
              <button onClick={()=>setShowFwers(true)} className="text-center hover:opacity-75 transition">
                <p className="font-black text-gray-900">{stats.followers}</p>
                <p className="text-xs text-gray-500">followers</p>
              </button>
              <button onClick={()=>setShowFwing(true)} className="text-center hover:opacity-75 transition">
                <p className="font-black text-gray-900">{stats.following}</p>
                <p className="text-xs text-gray-500">following</p>
              </button>
            </div>
            {viewedEmail!==currentUser.email&&(
              <div className="flex gap-2 mt-3">
                <button onClick={()=>onFollow(viewedEmail,viewedName)} className={`flex-1 py-2 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition ${isFollowing?'bg-gray-200 text-gray-700':'bg-gradient-to-r from-orange-500 to-pink-500 text-white'}`}>
                  {isFollowing?<><UserMinus className="w-4 h-4"/>unfollow</>:<><UserPlus className="w-4 h-4"/>follow</>}
                </button>
                <button onClick={()=>onBlock(viewedEmail,viewedName)} className={`px-4 py-2 rounded-2xl font-black text-sm transition ${isBlocked?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                  {isBlocked?'unblock':'block'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats — public only */}
        <div className="grid grid-cols-4 gap-2 bg-white rounded-2xl p-3 border border-gray-100 mb-5">
          {[{l:'Posts',v:stats.posts,I:Edit3,c:'text-green-600'},{l:'Reviews',v:stats.reviews,I:Star,c:'text-purple-600'},{l:'Followers',v:stats.followers,I:Users,c:'text-blue-600'},{l:'Following',v:stats.following,I:UserCheck,c:'text-orange-600'}].map(({l,v,I,c},i)=>(
            <div key={i} className="text-center"><I className={`w-5 h-5 ${c} mx-auto mb-1`}/><p className="text-lg font-black text-gray-900">{v}</p><p className="text-xs text-gray-500 font-semibold">{l}</p></div>
          ))}
        </div>

        {/* PUBLIC tabs only — Books Read/Crews/Saved = private, NOT shown */}
        <div className="flex border-b border-gray-200 mb-4">
          {tabs.map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)} className={`flex-1 text-sm pb-2.5 px-3 font-black border-b-2 transition ${activeTab===tab?'text-orange-500 border-orange-500':'text-gray-400 border-transparent'}`}>{tab}</button>
          ))}
        </div>

        {activeTab==='Posts'&&(
          <div className="space-y-4">
            {userPosts.length===0?<div className="text-center py-8"><Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-400 font-black text-sm">no posts yet bestie</p></div>
             : userPosts.map(post=>(
              <div key={post.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-700 mb-2 leading-relaxed" style={{fontFamily:'Georgia,serif'}}>{post.content}</p>
                {post.bookName&&<p className="text-xs text-orange-500 font-black">📖 {post.bookName}</p>}
                {post.image&&<img src={post.image} alt="" className="w-full rounded-xl mt-2 max-h-40 object-cover" loading="lazy"/>}
                <div className="flex items-center gap-4 pt-2 border-t border-gray-50 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1 font-semibold"><Heart className="w-3.5 h-3.5"/>{getLikeCount(post.id)||post.likes||0}</span>
                  <span className="flex items-center gap-1 font-semibold"><Repeat className="w-3.5 h-3.5"/>{post.reshareCount||0}</span>
                  <span>{formatTimeAgo(post.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab==='Reviews'&&(
          <div className="space-y-4">
            {userRevs.length===0?<div className="text-center py-8"><Star className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-400 font-black text-sm">no reviews yet bestie</p></div>
             : userRevs.map(rev=>(
              <div key={rev.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-start gap-3 mb-2">
                  <DynamicBookCover title={rev.bookName} author={rev.author} size="sm" onClick={()=>setSel({title:rev.bookName,author:rev.author})}/>
                  <div className="flex-1"><h3 className="font-black text-sm">{rev.bookName}</h3><p className="text-xs text-gray-500">by {rev.author}</p><StarRating rating={rev.rating} size="xs" readonly/></div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{rev.review}</p>
                <p className="text-xs text-gray-400 mt-2">{formatTimeAgo(rev.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});


// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [isLoggedIn,    setLoggedIn]   = useState(false);
  const [currentUser,   setUser]       = useState(null);
  const [profileSrc,    setProfileSrc] = useState(null);
  const [currentPage,   setCurrentPage]= useState('home');
  const [showBottomNav, setShowNav]    = useState(true);
  const [posts,         setPosts]      = useState([]);
  const [savedPosts,    setSaved]      = useState([]);
  const [following,     setFollowing]  = useState([]);
  const [followers,     setFollowers]  = useState([]);
  const [blockedUsers,  setBlocked]    = useState([]);
  const [notifCount,    setNotifCount] = useState(0);
  const [unreadMsgs,    setUnreadMsgs] = useState(0);
  const [currentToast,  setToast]      = useState(null);
  const [selectedUser,  setSelUser]    = useState(null);
  const [showUserModal, setShowUM]     = useState(false);
  // Full profile stack — can stack multiple profile views
  const [profileStack,  setProfileStack]=useState([]);
  const [isOnline,      setOnline]     = useState(navigator.onLine);
  const [loading,       setLoading]    = useState(true);
  const [deepLinkPostId,setDLPost]     = useState(null);
  const [deepLinkCrewId,setDLCrew]     = useState(null);
  const prevNotifRef = useRef(0);

  // Handle page routing including dynamic profile pages
  const setPage = useCallback((page) => {
    if (typeof page === 'string' && page.startsWith('profile_')) {
      const email = page.replace('profile_','');
      const users = getLS('rcreww_users',[]);
      const u = users.find(x=>x.email===email);
      setProfileStack(prev=>[...prev,{email,name:u?.name||email.split('@')[0]}]);
    } else {
      setCurrentPage(page);
    }
  },[]);

  useEffect(()=>{
    window.addEventListener('online', ()=>setOnline(true));
    window.addEventListener('offline',()=>setOnline(false));
    return()=>{window.removeEventListener('online',()=>setOnline(true));window.removeEventListener('offline',()=>setOnline(false));};
  },[]);

  useEffect(()=>{
    setShowNav(currentPage!=='post' && profileStack.length===0 && !showUserModal);
  },[currentPage,profileStack.length,showUserModal]);

  useEffect(()=>{
    const init = async () => {
      initGlobalCrews();
      const stored = getLS('rcreww_current',null);
      if (stored) {
        setUser(stored); setLoggedIn(true);
        setFollowing(getLS(`rcreww_following_${stored.email}`,[]));
        setFollowers(getLS(`rcreww_followers_${stored.email}`,[]));
        setBlocked(getLS(`rcreww_blocked_${stored.email}`,[]));
        setSaved(getLS(`rcreww_saved_${stored.email}`,[]));
        const pic=getLS(`rcreww_pic_${stored.email}`,null); if(pic) setProfileSrc(pic);
      }
      // Load global posts
      const local=getGlobalPosts(); setPosts(local);
      try {
        const res=await axios.get(`${API_URL}/api/social/posts`,{timeout:8000});
        if(res.data?.success){
          const sp=res.data.posts||[];
          const merged=[...local];
          sp.forEach(s=>{if(!merged.find(l=>(l.id||l._id)===(s.id||s._id)))merged.push(s);});
          setLS(GLOBAL_POSTS_KEY,merged); setPosts(merged);
        }
      } catch {}
      const dl=parseDeepLink();
      if(dl){if(dl.type==='post'){setDLPost(dl.id);setCurrentPage('home');}if(dl.type==='crew'){setDLCrew(dl.id);setCurrentPage('crews');}window.history.replaceState({},'',window.location.pathname);}
      setLoading(false);
    };
    init();
  },[]);

  const checkNotifications = useCallback(()=>{
    if(!currentUser) return;
    const raw=getLS(`rcreww_notifs_${currentUser.email}`,[]);
    const social=raw.filter(n=>n.type!=='message');
    const msgs=raw.filter(n=>n.type==='message');
    const unreadSocial=social.filter(n=>!n.read).length;
    const unreadMsgCount=msgs.filter(n=>!n.read).length;
    if(unreadSocial>prevNotifRef.current){
      const newest=social.find(n=>!n.read&&!_shownToastIds.has(n.id));
      if(newest){_shownToastIds.add(newest.id);setToast(newest);setTimeout(()=>setToast(null),5000);}
    }
    setNotifCount(unreadSocial); setUnreadMsgs(unreadMsgCount); prevNotifRef.current=unreadSocial;
  },[currentUser]);

  useEffect(()=>{
    if(!currentUser) return;
    checkNotifications();
    const pollInterval = setInterval(async()=>{
      try { const res=await axios.get(`${API_URL}/api/social/notifications/${encodeURIComponent(currentUser.email)}`,{timeout:8000}); if(res.data?.success){const fresh=res.data.notifications||[];const old=getLS(`rcreww_notifs_${currentUser.email}`,[]);const merged=[...fresh];old.forEach(o=>{if(!merged.find(f=>f.id===o.id))merged.push(o);});merged.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));setLS(`rcreww_notifs_${currentUser.email}`,merged);checkNotifications();} } catch {}
    },15000);
    const hc=(e)=>{ if(e.detail?.targetEmail===currentUser.email) checkNotifications(); };
    const hs=(e)=>{ if(e.key?.includes('_notifs')) checkNotifications(); };
    const hbc=(e)=>{ if(e.data?.type==='notif') checkNotifications(); };
    window.addEventListener('rc:notif',hc);
    window.addEventListener('storage',hs);
    bc?.addEventListener('message',hbc);
    socket.emit('join_user_room',currentUser.email);
    socket.on('new_notification',n=>{ if(n.toEmail===currentUser.email){pushNotification(currentUser.email,n);checkNotifications();} });
    return()=>{clearInterval(pollInterval);window.removeEventListener('rc:notif',hc);window.removeEventListener('storage',hs);bc?.removeEventListener('message',hbc);socket.off('new_notification');};
  },[currentUser,checkNotifications]);

  const handleLogin=(userData)=>{
    setUser(userData); setLoggedIn(true); setLS('rcreww_current',userData);
    const users=getLS('rcreww_users',[]); const idx=users.findIndex(u=>u.email===userData.email);
    if(idx>=0) users[idx]={...users[idx],...userData}; else users.push(userData);
    setLS('rcreww_users',users);
    ['followers','following','blocked','notifications'].forEach(k=>{ if(!localStorage.getItem(`rcreww_${k}_${userData.email}`)) setLS(`rcreww_${k}_${userData.email}`,[]);});
    if(!localStorage.getItem(`rcreww_stats_${userData.email}`)) setLS(`rcreww_stats_${userData.email}`,{booksRead:0,reviewsGiven:0,postsCreated:0,crewsJoined:0});
    setFollowing(getLS(`rcreww_following_${userData.email}`,[]));
    setFollowers(getLS(`rcreww_followers_${userData.email}`,[]));
    setBlocked(getLS(`rcreww_blocked_${userData.email}`,[]));
    setSaved(getLS(`rcreww_saved_${userData.email}`,[]));
    const pic=getLS(`rcreww_pic_${userData.email}`,null); if(pic) setProfileSrc(pic);
    setCurrentPage('home');
  };

  const handleLogout=()=>{ setLoggedIn(false); setUser(null); setProfileSrc(null); setCurrentPage('home'); localStorage.removeItem('rcreww_current'); };
  const handleUpdateUser=(updated)=>{ setUser(updated); setLS('rcreww_current',updated); };

  const handlePost=(postData)=>{
    const p={...postData,id:postData.id||generateId(),createdAt:postData.createdAt||new Date().toISOString(),likes:0,comments:0,reshareCount:0};
    if(!getGlobalPosts().find(x=>x.id===p.id)) saveGlobalPost(p);
    setPosts(getGlobalPosts());
    const st=getLS(`rcreww_stats_${currentUser.email}`,{}); st.postsCreated=(st.postsCreated||0)+1; setLS(`rcreww_stats_${currentUser.email}`,st);
  };

  const handleDeletePost=(post)=>{
    const all=getGlobalPosts().filter(p=>p.id!==post.id);
    setLS(GLOBAL_POSTS_KEY,all); setPosts(all);
    const st=getLS(`rcreww_stats_${currentUser.email}`,{}); st.postsCreated=Math.max((st.postsCreated||0)-1,0); setLS(`rcreww_stats_${currentUser.email}`,st);
  };

  const handleSavePost=(post)=>{
    const curr=getLS(`rcreww_saved_${currentUser.email}`,[]);
    const updated=curr.includes(post.id)?curr.filter(id=>id!==post.id):[...curr,post.id];
    setLS(`rcreww_saved_${currentUser.email}`,updated); setSaved(updated);
  };

  const handleReshare=(originalPost,comment,isPublic=true)=>{
    incrementReshareCount(originalPost.id);
    if(originalPost.userEmail!==currentUser.email){ pushNotification(originalPost.userEmail,{type:'reshare',fromUser:currentUser.name,fromUserEmail:currentUser.email,message:`${currentUser.name} reshared your post 🔁`,postId:originalPost.id}); checkNotifications(); }
    const reshared={id:generateId(),content:originalPost.content||originalPost.story||'',bookName:originalPost.bookName,author:originalPost.author,image:originalPost.image,isPublic,isReshare:true,reshareComment:comment||null,userName:currentUser.name,userEmail:currentUser.email,userPhoto:currentUser.profileImage,userInitials:currentUser.name.slice(0,2).toUpperCase(),createdAt:new Date().toISOString(),likes:0,comments:0,reshareCount:0,originalPost:{id:originalPost.id,userName:originalPost.userName,userEmail:originalPost.userEmail,content:originalPost.content||originalPost.story||''}};
    handlePost(reshared);
    setToast({type:'success',message:'post reshared bestie! 🔁 slay',timestamp:new Date().toISOString()}); setTimeout(()=>setToast(null),3000);
  };

  const handleFollow=useCallback((targetEmail,targetName)=>{
    const curr=getLS(`rcreww_following_${currentUser.email}`,[]);
    if(curr.includes(targetEmail)){
      const upd=curr.filter(e=>e!==targetEmail); setLS(`rcreww_following_${currentUser.email}`,upd); setFollowing(upd);
      const tf=getLS(`rcreww_followers_${targetEmail}`,[]).filter(e=>e!==currentUser.email); setLS(`rcreww_followers_${targetEmail}`,tf);
    } else {
      const upd=[...curr,targetEmail]; setLS(`rcreww_following_${currentUser.email}`,upd); setFollowing(upd);
      const tf=getLS(`rcreww_followers_${targetEmail}`,[]);
      if(!tf.includes(currentUser.email)){setLS(`rcreww_followers_${targetEmail}`,[...tf,currentUser.email]);pushNotification(targetEmail,{type:'follow',fromUser:currentUser.name,fromUserEmail:currentUser.email,message:`${currentUser.name} started following you 🫶`});checkNotifications();}
      setToast({type:'success',message:`following ${targetName}! 🎉`,timestamp:new Date().toISOString()}); setTimeout(()=>setToast(null),3000);
    }
  },[currentUser,checkNotifications]);

  const handleBlock=useCallback((targetEmail,targetName)=>{
    const curr=getLS(`rcreww_blocked_${currentUser.email}`,[]);
    const isBlocked=curr.includes(targetEmail);
    const upd=isBlocked?curr.filter(e=>e!==targetEmail):[...curr,targetEmail];
    setLS(`rcreww_blocked_${currentUser.email}`,upd); setBlocked(upd);
    if(!isBlocked){const fwing=getLS(`rcreww_following_${currentUser.email}`,[]).filter(e=>e!==targetEmail);setLS(`rcreww_following_${currentUser.email}`,fwing);setFollowing(fwing);}
  },[currentUser]);

  const handleViewUserProfile=(email,name)=>{
    if(email===currentUser?.email){setCurrentPage('profile');return;}
    setSelUser({email,name}); setShowUM(true);
  };

  const handleViewFullProfile=(email,name)=>{
    setShowUM(false); setSelUser(null);
    setProfileStack(prev=>[...prev,{email,name}]);
  };

  const handleCreateCrew=(book)=>{
    const{crew}=getOrCreateCrew(book.title,book.author,book.genre||'General',currentUser.email,currentUser.name);
    const joined=getLS(`rcreww_joined_${currentUser.email}`,[]);
    if(!joined.includes(crew.id)){setLS(`rcreww_joined_${currentUser.email}`,[...joined,crew.id]);const st=getLS(`rcreww_stats_${currentUser.email}`,{});st.crewsJoined=(st.crewsJoined||0)+1;setLS(`rcreww_stats_${currentUser.email}`,st);}
    setCurrentPage('crews');
  };

  const filteredPosts=useMemo(()=>posts.filter(p=>!blockedUsers.includes(p.userEmail)),[posts,blockedUsers]);

  if(loading) return <LoadingSpinner size="xl" fullScreen/>;
  if(!isLoggedIn) return <LoginPage onLogin={handleLogin}/>;

  const commonProps={
    user:currentUser, posts:filteredPosts, setPage,
    updateNotificationCount:checkNotifications,
    profileSrc, savedPosts, onSavePost:handleSavePost,
    onFollow:handleFollow, following, onBlock:handleBlock, blockedUsers,
    onViewUserProfile:handleViewUserProfile,
  };

  return (
    <div className="flex justify-center min-h-screen bg-gray-200">
      {currentToast&&<NotificationToast notification={currentToast} onClose={()=>setToast(null)}/>}
      {!isOnline&&(
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-1.5 text-xs z-[200] flex items-center justify-center gap-2">
          <WifiOff className="w-3 h-3"/>you're offline bestie — some features limited
        </div>
      )}
      <div className="w-full max-w-md relative bg-white min-h-screen overflow-hidden shadow-xl">

        {/* User Profile Quick Modal */}
        {showUserModal&&selectedUser&&(
          <UserProfileModal
            userEmail={selectedUser.email} userName={selectedUser.name}
            currentUser={currentUser}
            onClose={()=>{setShowUM(false);setSelUser(null);}}
            onFollow={handleFollow} isFollowing={following.includes(selectedUser.email)}
            onBlock={handleBlock}   isBlocked={blockedUsers.includes(selectedUser.email)}
            onViewFullProfile={handleViewFullProfile}
          />
        )}

        {/* Full profile stack overlay */}
        {profileStack.length>0&&(
          <div className="absolute inset-0 z-50 bg-white overflow-y-auto">
            <FullUserProfilePage
              viewedEmail={profileStack[profileStack.length-1].email}
              viewedName={profileStack[profileStack.length-1].name}
              currentUser={currentUser}
              onBack={()=>setProfileStack(prev=>prev.slice(0,-1))}
              onFollow={handleFollow}
              isFollowing={following.includes(profileStack[profileStack.length-1].email)}
              onBlock={handleBlock}
              isBlocked={blockedUsers.includes(profileStack[profileStack.length-1].email)}
              onViewUserProfile={(email,name)=>setProfileStack(prev=>[...prev,{email,name}])}
            />
          </div>
        )}

        {/* Pages */}
        {profileStack.length===0&&(
          <>
            {currentPage==='home'&&(
              <HomePage
                {...commonProps}
                crews={getGlobalCrews()}
                onResharePost={handleReshare}
                onDeletePost={handleDeletePost}
                onViewBookDetails={()=>{}}
                onCreateCrew={handleCreateCrew}
                deepLinkPostId={deepLinkPostId}
                onDeepLinkHandled={()=>setDLPost(null)}
              />
            )}
            {currentPage==='post'&&<PostPage user={currentUser} onPost={handlePost} setPage={setCurrentPage}/>}
            {currentPage==='reviews'&&<ReviewsPage user={currentUser} setPage={setCurrentPage} updateNotificationCount={checkNotifications} onViewUserProfile={handleViewUserProfile}/>}
            {currentPage==='explore'&&<ExplorePage user={currentUser} setPage={setCurrentPage} onCreateCrew={handleCreateCrew}/>}
            {currentPage==='crews'&&(
              <CrewsPage
                user={currentUser} initialCrews={getGlobalCrews()} setPage={setCurrentPage}
                updateNotificationCount={checkNotifications} onViewUserProfile={handleViewUserProfile}
                deepLinkCrewId={deepLinkCrewId} onDeepLinkHandled={()=>setDLCrew(null)}
              />
            )}
            {currentPage==='profile'&&(
              <ProfilePage
                user={currentUser} posts={filteredPosts} setPage={setPage}
                onLogout={handleLogout} onUpdateUser={handleUpdateUser}
                profileSrc={profileSrc} setProfileSrc={setProfileSrc}
                savedPosts={savedPosts} following={following} followers={followers}
              />
            )}
            {currentPage==='notifications'&&(
              <NotificationsPage
                user={currentUser}
                onClose={()=>{setCurrentPage('home');checkNotifications();}}
                updateNotificationCount={checkNotifications}
              />
            )}
            <BottomNav active={currentPage} setPage={setCurrentPage} unreadCount={unreadMsgs} show={showBottomNav}/>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GLOBAL STYLES
// ══════════════════════════════════════════════════════════════════════════════
if (typeof document!=='undefined'&&!document.querySelector('style[data-rcreww]')) {
  const s=document.createElement('style'); s.setAttribute('data-rcreww','1');
  s.textContent=`
    @keyframes slideDown { from{transform:translate(-50%,-110%);opacity:0} to{transform:translate(-50%,0);opacity:1} }
    .animate-slideDown { animation:slideDown 0.3s ease-out; }
    @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
    .animate-bounce { animation:bounce 1s infinite; }
    @keyframes spin { to{transform:rotate(360deg)} }
    .animate-spin { animation:spin 1s linear infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    .animate-pulse { animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
    .scrollbar-hide::-webkit-scrollbar { display:none; }
    .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
    .line-clamp-1 { overflow:hidden; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:1; }
    .line-clamp-2 { overflow:hidden; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; }
    .line-clamp-3 { overflow:hidden; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:3; }
    * { -webkit-tap-highlight-color: transparent; }
    html,body { overscroll-behavior:none; }
  `;
  document.head.appendChild(s);
}