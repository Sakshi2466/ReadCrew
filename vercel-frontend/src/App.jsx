// App.jsx - ReadCrew - Fixed: Crew chat hooks, global posts, profile photos everywhere
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
import axios from 'axios';

const API_URL = 'https://versal-book-app.onrender.com';

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL HELPERS - consistent localStorage keys + profile photo lookup
// ─────────────────────────────────────────────────────────────────────────────

// All posts live under one key so every user sees the same feed
const POSTS_KEY = 'readcrew_global_posts';
const CREWS_KEY = 'readcrew_global_crews';
const REVIEWS_KEY = 'readcrew_global_reviews';

const getAllPosts   = ()    => JSON.parse(localStorage.getItem(POSTS_KEY)  || '[]');
const saveAllPosts = (arr) => localStorage.setItem(POSTS_KEY, JSON.stringify(arr));

const getAllCrews   = ()    => JSON.parse(localStorage.getItem(CREWS_KEY)  || '[]');
const saveAllCrews = (arr) => localStorage.setItem(CREWS_KEY, JSON.stringify(arr));

const getAllReviews   = ()    => JSON.parse(localStorage.getItem(REVIEWS_KEY)  || '[]');
const saveAllReviews = (arr) => localStorage.setItem(REVIEWS_KEY, JSON.stringify(arr));

// Profile photos stored globally so any component can resolve a photo by email
const PHOTO_MAP_KEY = 'readcrew_profile_photos';
const getPhotoMap   = ()              => JSON.parse(localStorage.getItem(PHOTO_MAP_KEY) || '{}');
const setUserPhoto  = (email, data)   => {
  const map = getPhotoMap();
  map[email] = data;
  localStorage.setItem(PHOTO_MAP_KEY, JSON.stringify(map));
};
const getUserPhoto  = (email)         => getPhotoMap()[email] || null;

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR - shows real profile photo when available
// ─────────────────────────────────────────────────────────────────────────────
const UserAvatar = ({ email, name, size = 'md', online, className = '' }) => {
  const sizes = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-9 h-9 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };
  const photo = email ? getUserPhoto(email) : null;
  const initials = (name || email || 'U').slice(0, 2).toUpperCase();

  return (
    <div className={`relative shrink-0 ${className}`}>
      {photo
        ? <img src={photo} alt={name} className={`${sizes[size]} rounded-full object-cover`} />
        : <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold`}>{initials}</div>
      }
      {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION TOAST
// ─────────────────────────────────────────────────────────────────────────────
const NotificationToast = ({ notification, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  const icons = {
    like: <Heart className="w-5 h-5 text-red-500" />,
    comment: <MessageCircle className="w-5 h-5 text-blue-500" />,
    mention: <AtSign className="w-5 h-5 text-amber-500" />,
    reshare: <Repeat className="w-5 h-5 text-indigo-500" />,
    follow: <UserCheck className="w-5 h-5 text-green-500" />,
    invite: <UserPlus className="w-5 h-5 text-purple-500" />,
    message: <MessageSquare className="w-5 h-5 text-emerald-500" />
  };
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
          {icons[notification.type] || <Bell className="w-5 h-5 text-gray-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 font-medium leading-snug">{notification.message}</p>
          <p className="text-xs text-gray-500 mt-1">{new Date(notification.timestamp).toLocaleTimeString()}</p>
        </div>
        <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC BOOK COVER
// ─────────────────────────────────────────────────────────────────────────────
const DynamicBookCover = ({ title, author, size = 'md', onClick }) => {
  const [coverUrl, setCoverUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const sizeMap = { xs:'w-12 h-16', sm:'w-16 h-20', md:'w-24 h-32', lg:'w-32 h-40', xl:'w-40 h-48' };
  const cls = sizeMap[size] || 'w-24 h-32';

  useEffect(() => {
    if (!title) { setError(true); setIsLoading(false); return; }
    fetchCover();
  }, [title, author]);

  const fetchCover = async () => {
    setIsLoading(true); setError(false);
    const q = encodeURIComponent(author ? `${title} ${author}` : title);
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&projection=lite`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        const links = data.items?.[0]?.volumeInfo?.imageLinks;
        if (links) {
          const raw = links.extraLarge || links.large || links.medium || links.thumbnail || links.smallThumbnail;
          if (raw) { setCoverUrl(raw.replace('http:','https:').replace('&edge=curl','').replace(/zoom=\d/,'zoom=3')); setIsLoading(false); return; }
        }
      }
    } catch {}
    try {
      const res = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=1`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        const book = data.docs?.[0];
        if (book?.cover_i) { setCoverUrl(`https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`); setIsLoading(false); return; }
      }
    } catch {}
    setError(true); setIsLoading(false);
  };

  const getFallbackColor = () => {
    const colors = ['#7B9EA6','#C8622A','#8B5E3C','#E8A87C','#C4A882','#2C3E50','#E74C3C','#3498DB','#9B59B6','#1ABC9C'];
    const hash = (title||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0);
    return colors[hash % colors.length];
  };

  if (isLoading) return <div className={`${cls} bg-gray-200 rounded-xl flex items-center justify-center animate-pulse`}><BookOpen className="w-6 h-6 text-gray-400"/></div>;
  if (error || !coverUrl) return (
    <div className={`${cls} rounded-xl flex flex-col items-center justify-center text-white font-bold shadow cursor-pointer`} style={{backgroundColor:getFallbackColor()}} onClick={onClick}>
      <span className="text-xl">{(title||'BK').slice(0,2).toUpperCase()}</span>
      <BookOpen className="w-4 h-4 mt-1 opacity-60"/>
    </div>
  );
  return (
    <div className={`${cls} relative rounded-xl overflow-hidden bg-gray-100 cursor-pointer`} onClick={onClick}>
      <img src={coverUrl} alt="" className="w-full h-full object-cover" onError={()=>{setCoverUrl(null);setError(true);}} loading="lazy" referrerPolicy="no-referrer"/>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STAR RATING
// ─────────────────────────────────────────────────────────────────────────────
const StarRating = ({ rating=0, onChange, size='sm' }) => {
  const sz = size==='sm'?'w-4 h-4':size==='xs'?'w-3 h-3':'w-6 h-6';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i=>(
        <Star key={i} className={`${sz} ${i<=rating?'fill-amber-400 text-amber-400':'text-gray-300'} ${onChange?'cursor-pointer':''}`} onClick={()=>onChange?.(i)}/>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LOADING SPINNER
// ─────────────────────────────────────────────────────────────────────────────
const LoadingSpinner = ({ size='md' }) => {
  const sizes = { sm:'w-4 h-4', md:'w-8 h-8', lg:'w-12 h-12' };
  return <div className={`${sizes[size]} border-4 border-t-transparent border-orange-500 rounded-full animate-spin`}/>;
};

// ─────────────────────────────────────────────────────────────────────────────
// PRESENCE HOOK
// ─────────────────────────────────────────────────────────────────────────────
const useCrewPresence = (crewId, userId, userName) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const hbRef = useRef(null);
  const TTL = 30000; const HB = 15000;

  const mark = useCallback(()=>{
    if (!crewId||!userId) return;
    localStorage.setItem(`crew_${crewId}_presence_${userId}`, JSON.stringify({userId,userName,ts:Date.now()}));
  },[crewId,userId,userName]);

  const unmark = useCallback(()=>{
    if (!crewId||!userId) return;
    localStorage.removeItem(`crew_${crewId}_presence_${userId}`);
  },[crewId,userId]);

  const getOnline = useCallback(()=>{
    if (!crewId) return [];
    const now = Date.now(); const list=[];
    for (let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k?.startsWith(`crew_${crewId}_presence_`)){
        try{ const d=JSON.parse(localStorage.getItem(k)); if(d&&(now-d.ts)<TTL) list.push(d); else localStorage.removeItem(k); }catch{}
      }
    }
    return list;
  },[crewId]);

  useEffect(()=>{
    if(!crewId||!userId) return;
    mark(); setOnlineUsers(getOnline());
    hbRef.current = setInterval(()=>{ mark(); setOnlineUsers(getOnline()); }, HB);
    return ()=>{ clearInterval(hbRef.current); unmark(); };
  },[crewId,userId]);

  return { onlineUsers, onlineCount: onlineUsers.length };
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPING HOOK
// ─────────────────────────────────────────────────────────────────────────────
const useTypingIndicator = (crewId, userId, userName) => {
  const [typingUsers, setTypingUsers] = useState([]);
  const tRef = useRef(null);
  const TTL = 3000;

  const broadcastTyping = useCallback(()=>{
    if(!crewId||!userId) return;
    localStorage.setItem(`crew_${crewId}_typing_${userId}`, JSON.stringify({userId,userName,ts:Date.now()}));
    clearTimeout(tRef.current);
    tRef.current = setTimeout(()=>localStorage.removeItem(`crew_${crewId}_typing_${userId}`), TTL);
  },[crewId,userId,userName]);

  const stopTyping = useCallback(()=>{
    if(!crewId||!userId) return;
    clearTimeout(tRef.current);
    localStorage.removeItem(`crew_${crewId}_typing_${userId}`);
  },[crewId,userId]);

  useEffect(()=>{
    if(!crewId) return;
    const iv = setInterval(()=>{
      const now=Date.now(); const list=[];
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i);
        if(k?.startsWith(`crew_${crewId}_typing_`)&&!k.includes(`_${userId}`)){
          try{ const d=JSON.parse(localStorage.getItem(k)); if(d&&(now-d.ts)<TTL) list.push(d.userName); else localStorage.removeItem(k); }catch{}
        }
      }
      setTypingUsers(list);
    },1500);
    return ()=>{ clearInterval(iv); stopTyping(); };
  },[crewId,userId]);

  return { typingUsers, broadcastTyping, stopTyping };
};

// Read receipt helpers
const markCrewMessagesRead = (crewId, userId) => {
  if(!crewId||!userId) return;
  localStorage.setItem(`crew_${crewId}_lastRead_${userId}`, Date.now().toString());
};
const getReadStatus = (msgTimestamp, crewId, onlineCount) => {
  const msgTime = new Date(msgTimestamp).getTime();
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k?.startsWith(`crew_${crewId}_lastRead_`)){
      const lr=parseInt(localStorage.getItem(k)||'0');
      if(lr>=msgTime) return 'read';
    }
  }
  return onlineCount>1?'delivered':'sent';
};

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM NAV
// ─────────────────────────────────────────────────────────────────────────────
const BottomNav = ({ active, setPage, unreadCount=0, show=true }) => {
  if(!show) return null;
  const items=[
    {id:'home',icon:BookOpen,label:'Home'},
    {id:'explore',icon:Sparkles,label:'Explore'},
    {id:'post',icon:Edit3,label:'Post'},
    {id:'crews',icon:Users,label:'Crews'},
    {id:'reviews',icon:Star,label:'Reviews'},
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 max-w-md mx-auto shadow-lg">
      <div className="flex items-center justify-around py-2 px-2">
        {items.map(({id,icon:Icon,label})=>(
          <button key={id} onClick={()=>setPage(id)} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative ${active===id?'text-[#C8622A]':'text-gray-400 hover:text-gray-600'}`}>
            {id==='post'
              ? <div className={`w-10 h-10 rounded-full flex items-center justify-center -mt-5 shadow-lg ${active===id?'bg-[#C8622A]':'bg-gray-800'}`}><Icon className="w-5 h-5 text-white"/></div>
              : <Icon className="w-5 h-5" strokeWidth={active===id?2.5:1.8}/>}
            {id==='crews'&&unreadCount>0&&<span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{unreadCount}</span>}
            <span className={`text-[10px] font-medium ${id==='post'?'mt-1':''}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TOP BAR
// ─────────────────────────────────────────────────────────────────────────────
const TopBar = ({ user, setPage, title, showBack=false, onBack, showProfile=true, onNotificationClick, notificationCount=0 }) => (
  <header className="sticky top-0 bg-white/95 backdrop-blur-sm z-40 px-4 py-3 flex items-center justify-between border-b border-gray-200">
    <div className="flex items-center gap-3">
      {showBack&&<button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-md"><BookOpen className="w-4 h-4 text-white" strokeWidth={2.5}/></div>
        <span className="font-bold text-gray-900 text-lg" style={{fontFamily:'Georgia,serif'}}>{title||'ReadCrew'}</span>
      </div>
    </div>
    {showProfile&&(
      <div className="flex items-center gap-3">
        <button onClick={onNotificationClick} className="relative p-1 hover:bg-gray-100 rounded-lg transition">
          <Bell className="w-5 h-5 text-gray-600"/>
          {notificationCount>0&&<span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{notificationCount>9?'9+':notificationCount}</span>}
        </button>
        <button onClick={()=>setPage('profile')} className="hover:opacity-80 transition">
          <UserAvatar email={user?.email} name={user?.name} size="sm"/>
        </button>
      </div>
    )}
  </header>
);

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS PAGE
// ─────────────────────────────────────────────────────────────────────────────
const NotificationsPage = ({ user, onClose, updateNotificationCount }) => {
  const [notifications, setNotifications] = useState([]);
  useEffect(()=>{ setNotifications(JSON.parse(localStorage.getItem(`user_${user.email}_notifications`)||'[]')); },[user.email]);
  const markAllRead = ()=>{
    const updated = notifications.map(n=>({...n,read:true}));
    setNotifications(updated);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
    updateNotificationCount?.();
  };
  const icons={like:<Heart className="w-4 h-4 text-red-500"/>,comment:<MessageCircle className="w-4 h-4 text-blue-500"/>,message:<MessageSquare className="w-4 h-4 text-emerald-500"/>,invite:<UserPlus className="w-4 h-4 text-purple-500"/>,follow:<UserCheck className="w-4 h-4 text-orange-500"/>,reshare:<Repeat className="w-4 h-4 text-indigo-500"/>,mention:<AtIcon className="w-4 h-4 text-amber-500"/>};
  const bgColors={like:'bg-red-100',comment:'bg-blue-100',message:'bg-emerald-100',invite:'bg-purple-100',follow:'bg-orange-100',reshare:'bg-indigo-100',mention:'bg-amber-100'};
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
        <h2 className="font-semibold">Notifications</h2>
        <button onClick={markAllRead} className="text-sm text-orange-500 font-medium">Mark all read</button>
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        {notifications.length===0
          ? <div className="text-center py-12"><Bell className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No notifications yet</p></div>
          : <div className="divide-y divide-gray-100">
              {[...notifications].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)).map(n=>(
                <div key={n.id} className={`p-4 ${n.read?'bg-white':'bg-orange-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${bgColors[n.type]||'bg-gray-100'}`}>{icons[n.type]||<Bell className="w-4 h-4 text-gray-500"/>}</div>
                    <div className="flex-1"><p className="text-sm text-gray-900">{n.message}</p><p className="text-xs text-gray-500 mt-1">{new Date(n.timestamp).toLocaleString()}</p></div>
                    {!n.read&&<div className="w-2 h-2 bg-orange-500 rounded-full mt-2"/>}
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARE / RESHARE MODALS
// ─────────────────────────────────────────────────────────────────────────────
const ShareModal = ({ post, onClose }) => {
  const url = window.location.href;
  const text = `Check out this post by ${post.userName}: "${(post.content||'').substring(0,50)}..."`;
  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="border-b p-4 flex justify-between"><h3 className="font-semibold">Share Post</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-3 gap-4">
            {[['WhatsApp','#25D366',()=>window.open(`https://wa.me/?text=${encodeURIComponent(text+' '+url)}`)],
              ['Facebook','#1877F2',()=>window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)],
              ['Twitter','#1DA1F2',()=>window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`)]
            ].map(([label,color,fn])=>(
              <button key={label} onClick={fn} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{backgroundColor:color}}>{label[0]}</div>
                <span className="text-xs text-gray-600">{label}</span>
              </button>
            ))}
          </div>
          <button onClick={()=>{navigator.clipboard.writeText(url);alert('Link copied!');}} className="w-full py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50">
            <Link2 className="w-5 h-5 text-orange-500"/><span className="font-medium">Copy Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ReshareModal = ({ post, onClose, onReshare }) => {
  const [comment, setComment] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="border-b p-4 flex justify-between"><h3 className="font-semibold">Reshare Post</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div>
        <div className="p-5 space-y-4">
          <textarea value={comment} onChange={e=>setComment(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 resize-none" placeholder="Add a comment..." rows={3}/>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Original by <span className="font-semibold">{post.userName}</span></p>
            <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
          </div>
          <button onClick={()=>{onReshare(post,comment);onClose();}} className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium flex items-center justify-center gap-2">
            <Repeat className="w-4 h-4"/>Reshare
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// POST OPTIONS MODAL
// ─────────────────────────────────────────────────────────────────────────────
const PostOptionsModal = ({ post, user, onClose, onReshare, onSave, isSaved, onDelete, isOwner, onFollow, isFollowing, onBlock, isBlocked }) => {
  const options = [
    {id:'reshare',icon:Repeat,label:'Reshare',color:'text-blue-600',action:()=>onReshare(post)},
    {id:'save',icon:Bookmark,label:isSaved?'Unsave':'Save',color:isSaved?'text-orange-500':'text-gray-700',action:()=>onSave(post)},
  ];
  if(!isOwner) options.push({id:'follow',icon:isFollowing?UserMinus:UserPlus,label:isFollowing?'Unfollow':'Follow',color:isFollowing?'text-red-500':'text-green-600',action:()=>onFollow(post.userEmail,post.userName)});
  if(isOwner) options.push({id:'delete',icon:Trash2,label:'Delete',color:'text-red-500',action:()=>onDelete(post)});
  else options.push({id:'block',icon:isBlocked?UserCheck:UserMinus,label:isBlocked?'Unblock':'Block User',color:isBlocked?'text-green-600':'text-red-500',action:()=>onBlock(post.userEmail,post.userName)});
  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="p-4 border-b text-center font-semibold">Post Options</div>
        <div className="divide-y divide-gray-100">
          {options.map(o=>(
            <button key={o.id} onClick={()=>{o.action();onClose();}} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
              <o.icon className={`w-5 h-5 ${o.color}`}/><span className={`text-sm font-medium ${o.color}`}>{o.label}</span>
            </button>
          ))}
          <button onClick={onClose} className="w-full px-4 py-3 text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// INLINE POST CARD
// ─────────────────────────────────────────────────────────────────────────────
const InlinePostCard = ({ post, user, updateNotificationCount, onShare, onReshareClick, onSaveToggle, isSaved, onDelete, onFollow, isFollowing, onBlock, isBlocked, onViewUserProfile }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likedComments, setLikedComments] = useState(new Set());
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes||0);
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [showOptions, setShowOptions] = useState(false);
  const inputRef = useRef();

  useEffect(()=>{
    const saved = JSON.parse(localStorage.getItem(`post_${post.id}_comments`)||'[]');
    setComments(saved);
    const liked = JSON.parse(localStorage.getItem(`user_${user.id}_likedComments`)||'[]');
    setLikedComments(new Set(liked));
    const likedPosts = JSON.parse(localStorage.getItem(`user_${user.email}_likedPosts`)||'[]');
    setIsLiked(likedPosts.includes(post.id));
  },[post.id,user.id,user.email]);

  const fmtTime = ts=>{
    const diff=Date.now()-new Date(ts); const m=Math.floor(diff/60000),h=Math.floor(diff/3600000),d=Math.floor(diff/86400000);
    if(m<1) return 'Just now'; if(m<60) return `${m}m ago`; if(h<24) return `${h}h ago`; if(d<7) return `${d}d ago`; return `${Math.floor(d/7)}w ago`;
  };

  const handleLike = ()=>{
    if(isLiked) return;
    setIsLiked(true); setLikeCount(p=>p+1);
    const likedPosts=JSON.parse(localStorage.getItem(`user_${user.email}_likedPosts`)||'[]');
    likedPosts.push(post.id);
    localStorage.setItem(`user_${user.email}_likedPosts`, JSON.stringify(likedPosts));
    const all=getAllPosts();
    saveAllPosts(all.map(p=>p.id===post.id?{...p,likes:(p.likes||0)+1}:p));
    if(post.userEmail!==user.email){
      const notif={id:Date.now(),type:'like',fromUser:user.name,message:`${user.name} liked your post`,timestamp:new Date().toISOString(),read:false};
      const notifs=JSON.parse(localStorage.getItem(`user_${post.userEmail}_notifications`)||'[]');
      notifs.unshift(notif); localStorage.setItem(`user_${post.userEmail}_notifications`, JSON.stringify(notifs));
      window.dispatchEvent(new StorageEvent('storage',{key:`user_${post.userEmail}_notifications`}));
      updateNotificationCount?.();
    }
  };

  const handleComment = ()=>{
    if(!newComment.trim()) return;
    const comment={id:Date.now(),postId:post.id,userId:user.id,userName:user.name,userEmail:user.email,userInitials:user.name.slice(0,2).toUpperCase(),content:newComment.trim(),timestamp:new Date().toISOString(),parentId:replyTo?.id||null,likes:0};
    const updated=[...comments,comment];
    localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(updated));
    setComments(updated); setNewComment(''); setReplyTo(null);
    if(post.userEmail!==user.email){
      const notif={id:Date.now(),type:'comment',fromUser:user.name,message:`${user.name} commented: "${newComment.substring(0,40)}"`,timestamp:new Date().toISOString(),read:false};
      const notifs=JSON.parse(localStorage.getItem(`user_${post.userEmail}_notifications`)||'[]');
      notifs.unshift(notif); localStorage.setItem(`user_${post.userEmail}_notifications`, JSON.stringify(notifs));
      window.dispatchEvent(new StorageEvent('storage',{key:`user_${post.userEmail}_notifications`}));
      updateNotificationCount?.();
    }
  };

  const handleLikeComment = cid=>{
    if(likedComments.has(cid)) return;
    const updated=comments.map(c=>c.id===cid?{...c,likes:(c.likes||0)+1}:c);
    setComments(updated); localStorage.setItem(`post_${post.id}_comments`, JSON.stringify(updated));
    const nl=new Set(likedComments); nl.add(cid); setLikedComments(nl);
    localStorage.setItem(`user_${user.id}_likedComments`, JSON.stringify([...nl]));
  };

  const topLevel=comments.filter(c=>!c.parentId);
  const visible=showAllComments?topLevel:topLevel.slice(0,3);
  const isOwner=user.email===post.userEmail;

  const CommentRow = ({comment, isReply=false})=>{
    const replies=comments.filter(c=>c.parentId===comment.id);
    const liked=likedComments.has(comment.id);
    const isOwn=comment.userId===user.id;
    return (
      <div className={`flex gap-3 ${isReply?'mt-2':''}`}>
        <div className="flex flex-col items-center flex-shrink-0" style={{width:36}}>
          <button onClick={()=>onViewUserProfile(comment.userEmail,comment.userName)}>
            <UserAvatar email={comment.userEmail} name={comment.userName} size="sm"/>
          </button>
          {replies.length>0&&showReplies[comment.id]&&<div className="w-0.5 flex-1 bg-orange-200 mt-1 rounded-full min-h-[20px]"/>}
        </div>
        <div className="flex-1 min-w-0 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={()=>onViewUserProfile(comment.userEmail,comment.userName)} className="font-semibold text-gray-900 text-sm hover:underline">{comment.userName}</button>
            <span className="text-xs text-gray-400 ml-auto">{fmtTime(comment.timestamp)}</span>
          </div>
          <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{comment.content}</p>
          <div className="flex items-center gap-4 mt-1.5">
            <button onClick={()=>handleLikeComment(comment.id)} disabled={liked} className={`flex items-center gap-1.5 text-xs font-medium ${liked?'text-red-500':'text-gray-400 hover:text-red-400'}`}>
              <Heart className={`w-3.5 h-3.5 ${liked?'fill-red-500':''}`}/>{comment.likes||0}
            </button>
            <button onClick={()=>{setReplyTo(comment);setTimeout(()=>inputRef.current?.focus(),100);}} className="text-xs text-gray-400 hover:text-orange-500 font-semibold">Reply</button>
            {isOwn&&<button onClick={()=>{const f=comments.filter(c=>c.id!==comment.id&&c.parentId!==comment.id);setComments(f);localStorage.setItem(`post_${post.id}_comments`,JSON.stringify(f));}} className="ml-auto text-gray-200 hover:text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>}
          </div>
          {replies.length>0&&(
            <div className="mt-2">
              {!showReplies[comment.id]&&<button onClick={()=>setShowReplies(p=>({...p,[comment.id]:true}))} className="text-xs text-orange-500 font-semibold mb-2">↳ View {replies.length} replies</button>}
              {showReplies[comment.id]&&<div className="space-y-2 pl-3 border-l-2 border-orange-100">{replies.map(r=><CommentRow key={r.id} comment={r} isReply/>)}</div>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {showOptions&&<PostOptionsModal post={post} user={user} onClose={()=>setShowOptions(false)} onReshare={onReshareClick} onSave={onSaveToggle} isSaved={isSaved} onDelete={onDelete} isOwner={isOwner} onFollow={onFollow} isFollowing={isFollowing} onBlock={onBlock} isBlocked={isBlocked}/>}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <button onClick={()=>onViewUserProfile(post.userEmail,post.userName)}>
              <UserAvatar email={post.userEmail} name={post.userName} size="md"/>
            </button>
            <div className="flex-1 min-w-0">
              <button onClick={()=>onViewUserProfile(post.userEmail,post.userName)} className="flex items-center gap-2 hover:underline flex-wrap">
                <span className="font-bold text-gray-900 text-sm">{post.userName||'Anonymous'}</span>
                <span className="text-xs text-gray-400">{fmtTime(post.createdAt||Date.now())}</span>
              </button>
              {post.bookName&&<div className="flex items-center gap-1.5 mt-0.5"><BookOpen className="w-3 h-3 text-orange-400"/><span className="text-xs text-gray-500 font-medium">{post.bookName}{post.author?` · ${post.author}`:''}</span></div>}
            </div>
            <button onClick={()=>setShowOptions(true)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400"><MoreHorizontal className="w-4 h-4"/></button>
          </div>
        </div>
        <div className="px-4 pb-3">
          {post.image&&<img src={post.image} alt="" className="w-full rounded-xl mb-3 max-h-56 object-cover"/>}
          {post.isReshare&&post.originalPost&&<div className="flex items-center gap-1 text-xs text-gray-500 mb-2"><Repeat className="w-3 h-3"/><span>Reshared from <span className="font-semibold">{post.originalPost.userName}</span></span></div>}
          <p className="text-gray-800 text-base leading-relaxed" style={{fontFamily:'Georgia,serif'}}>{post.story||post.content}</p>
          {post.reshareComment&&<div className="mt-3 bg-orange-50 rounded-lg p-3 border border-orange-100"><p className="text-sm text-orange-800 italic">"{post.reshareComment}"</p></div>}
          {post.isReshare&&post.originalPost&&<div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-200"><p className="text-xs text-gray-500 mb-1">Original post:</p><p className="text-sm text-gray-600">{post.originalPost.content}</p></div>}
        </div>
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-5">
          <button onClick={handleLike} disabled={isLiked} className={`flex items-center gap-1.5 text-sm font-semibold transition ${isLiked?'text-red-500':'text-gray-500 hover:text-red-500'}`}>
            <Heart className={`w-5 h-5 ${isLiked?'fill-red-500 text-red-500':''}`}/><span>{likeCount}</span>
          </button>
          <button onClick={()=>inputRef.current?.focus()} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-orange-500">
            <MessageCircle className="w-5 h-5"/><span>{comments.length}</span>
          </button>
          <button onClick={()=>onSaveToggle(post)} className={`flex items-center gap-1.5 text-sm font-semibold transition ${isSaved?'text-orange-500':'text-gray-500 hover:text-orange-400'}`}>
            <Bookmark className={`w-5 h-5 ${isSaved?'fill-orange-500':''}`}/><span>Save</span>
          </button>
          <button onClick={()=>onShare(post)} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-orange-500 ml-auto">
            <Share2 className="w-4 h-4"/><span>{post.reshareCount||0}</span>
          </button>
        </div>
        <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/60">
          {replyTo&&(
            <div className="flex items-center gap-2 mb-2 pl-2 border-l-2 border-orange-400">
              <p className="text-xs text-orange-600 font-medium flex-1">Replying to <span className="font-bold">{replyTo.userName}</span></p>
              <button onClick={()=>setReplyTo(null)}><X className="w-3.5 h-3.5 text-gray-400"/></button>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <UserAvatar email={user.email} name={user.name} size="sm"/>
            <div className="flex-1 flex items-center gap-2 bg-white rounded-full border border-gray-200 px-4 py-2 focus-within:border-orange-400 transition">
              <input ref={inputRef} type="text" value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleComment();}}} className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none" placeholder={replyTo?`Reply to @${replyTo.userName}...`:"Write a comment..."}/>
            </div>
            <button onClick={handleComment} disabled={!newComment.trim()} className={`px-4 py-2 rounded-full text-sm font-bold transition ${newComment.trim()?'bg-orange-500 text-white':'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Post</button>
          </div>
        </div>
        {comments.length>0&&(
          <div className="px-4 py-3 border-t border-gray-100 space-y-1">
            {visible.map(c=><CommentRow key={c.id} comment={c}/>)}
            {topLevel.length>3&&(
              <button onClick={()=>setShowAllComments(p=>!p)} className="text-xs text-orange-500 font-semibold mt-1 flex items-center gap-1">
                {showAllComments?<><ChevronDown className="w-3.5 h-3.5 rotate-180"/>Show less</>:<><ChevronDown className="w-3.5 h-3.5"/>View all {topLevel.length} comments</>}
              </button>
            )}
          </div>
        )}
        {comments.length===0&&<div className="px-4 pb-4"><p className="text-xs text-gray-400 text-center">Be the first to comment 💬</p></div>}
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const LoginPage = ({ onLogin }) => {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [showPass,setShowPass]=useState(false);
  const [isLogin,setIsLogin]=useState(true); const [name,setName]=useState(''); const [showOTP,setShowOTP]=useState(false);
  const [otpInput,setOtpInput]=useState(''); const [loading,setLoading]=useState(false); const [errorMsg,setErrorMsg]=useState('');
  const [devOtp,setDevOtp]=useState(''); const [readingGoal,setReadingGoal]=useState({yearly:20,monthly:5});
  const validateEmail=e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const saveLocalUser=userData=>{
    const users=JSON.parse(localStorage.getItem('users')||'[]');
    const idx=users.findIndex(u=>u.email===userData.email);
    if(idx>=0) users[idx]={...users[idx],...userData}; else users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(userData));
    ['followers','following','blocked'].forEach(k=>{ if(!localStorage.getItem(`user_${userData.email}_${k}`)) localStorage.setItem(`user_${userData.email}_${k}`, '[]'); });
    if(!localStorage.getItem(`user_${userData.email}_stats`)) localStorage.setItem(`user_${userData.email}_stats`, JSON.stringify({booksRead:0,reviewsGiven:0,postsCreated:0,crewsJoined:0}));
    return userData;
  };

  const handleSendOTP=async()=>{
    setErrorMsg('');
    if(name.trim().length<2){setErrorMsg('Please enter your full name (at least 2 characters)');return;}
    if(!validateEmail(email)){setErrorMsg('Please enter a valid email address');return;}
    setLoading(true);
    const otp=Math.floor(100000+Math.random()*900000).toString();
    localStorage.setItem('devOTP',otp); setDevOtp(otp); setShowOTP(true); setLoading(false);
  };

  const handleVerifyOTP=()=>{
    setErrorMsg('');
    if(otpInput.length!==6){setErrorMsg('Please enter the 6-digit code');return;}
    const devOTPSaved=localStorage.getItem('devOTP');
    if(otpInput!==devOTPSaved){setErrorMsg('❌ Incorrect code. Please try again.');return;}
    localStorage.removeItem('devOTP');
    const userData=saveLocalUser({id:Date.now().toString(),name,email,password,readingGoal,isVerified:true,createdAt:new Date().toISOString(),stats:{booksRead:0,reviewsGiven:0,postsCreated:0,crewsJoined:0},joinedCrews:[],bio:'Reading is my superpower'});
    setShowOTP(false); onLogin(userData);
  };

  const handleLogin=()=>{
    setErrorMsg('');
    if(!validateEmail(email)){setErrorMsg('Please enter a valid email address');return;}
    if(!password.trim()){setErrorMsg('Please enter your password');return;}
    const users=JSON.parse(localStorage.getItem('users')||'[]');
    const found=users.find(u=>u.email.toLowerCase()===email.toLowerCase());
    if(found&&(found.password===password||!found.password)){localStorage.setItem('currentUser',JSON.stringify(found));onLogin(found);return;}
    setErrorMsg(found?'Incorrect password.':'No account found. Please sign up first.');
  };

  if(showOTP) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-7 border border-gray-200">
        <div className="text-center mb-6"><Mail className="w-12 h-12 text-orange-500 mx-auto mb-3"/><h2 className="text-2xl font-bold">Check your email</h2><p className="text-gray-500 text-sm">Sent to <strong>{email}</strong></p></div>
        {devOtp&&<div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-4 text-center"><p className="text-xs text-amber-700 mb-2">📧 Use this code:</p><p className="text-4xl font-bold text-amber-800 tracking-widest">{devOtp}</p></div>}
        {errorMsg&&<div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">{errorMsg}</div>}
        <input type="text" inputMode="numeric" value={otpInput} onChange={e=>{setOtpInput(e.target.value.replace(/\D/g,'').slice(0,6));setErrorMsg('');}} className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none text-center text-3xl tracking-widest mb-4 font-mono" placeholder="000000" maxLength="6" autoFocus/>
        <button onClick={handleVerifyOTP} disabled={otpInput.length!==6} className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-50 mb-3">Verify & Continue</button>
        <button onClick={()=>{setShowOTP(false);setErrorMsg('');setDevOtp('');}} className="text-gray-500 text-sm flex items-center gap-1"><ArrowLeft className="w-4 h-4"/>Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-3"><BookOpen className="w-10 h-10 text-white"/></div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent" style={{fontFamily:'Georgia,serif'}}>ReadCrew</h1>
          <p className="text-gray-500 text-sm mt-2">Read together, grow together.</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-7 border border-gray-200">
          <h2 className="text-2xl font-bold text-center mb-5">{isLogin?'Welcome Back!':'Join the Crew'}</h2>
          {errorMsg&&<div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">{errorMsg}</div>}
          <div className="space-y-3">
            {!isLogin&&<>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5"><User className="w-5 h-5 text-gray-400"/><input value={name} onChange={e=>{setName(e.target.value);setErrorMsg('');}} className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm" placeholder="Full Name *"/></div>
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm"><Target className="w-4 h-4 text-orange-500"/>Reading Goals</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-gray-600 mb-1 block">Yearly</label><input type="number" value={readingGoal.yearly} onChange={e=>setReadingGoal({...readingGoal,yearly:parseInt(e.target.value)||0})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm" min="0" max="100"/></div>
                  <div><label className="text-xs text-gray-600 mb-1 block">Monthly</label><input type="number" value={readingGoal.monthly} onChange={e=>setReadingGoal({...readingGoal,monthly:parseInt(e.target.value)||0})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm" min="0" max="20"/></div>
                </div>
              </div>
            </>}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5"><Mail className="w-5 h-5 text-gray-400"/><input value={email} onChange={e=>{setEmail(e.target.value);setErrorMsg('');}} className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm" placeholder="Email address *" type="email"/></div>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5"><Lock className="w-5 h-5 text-gray-400"/><input value={password} onChange={e=>{setPassword(e.target.value);setErrorMsg('');}} type={showPass?'text':'password'} className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm" placeholder={isLogin?'Password *':'Create a password *'}/><button onClick={()=>setShowPass(!showPass)} type="button">{showPass?<EyeOff className="w-4 h-4 text-gray-400"/>:<Eye className="w-4 h-4 text-gray-400"/>}</button></div>
          </div>
          <button onClick={isLogin?handleLogin:handleSendOTP} disabled={loading} className="w-full mt-5 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
            {loading?<><LoadingSpinner size="sm"/><span>Please wait...</span></>:isLogin?'Log In':'Create Account →'}
          </button>
          <p className="text-center text-sm text-gray-500 mt-4">{isLogin?"Don't have an account? ":"Already have an account? "}
            <button onClick={()=>{setIsLogin(!isLogin);setErrorMsg('');setEmail('');setPassword('');setName('');}} className="text-orange-500 font-semibold">{isLogin?'Sign Up':'Log In'}</button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AI BOOK DATABASE
// ─────────────────────────────────────────────────────────────────────────────
const BOOK_DB = {
  thriller:[{title:'Gone Girl',author:'Gillian Flynn',genre:'Thriller',description:'A woman vanishes on her anniversary.',reason:'Twisty, addictive, impossible to put down',rating:4.6,pages:422,year:2012},{title:'The Silent Patient',author:'Alex Michaelides',genre:'Thriller',description:'A famous painter shoots her husband and never speaks again.',reason:'Jaw-dropping twist',rating:4.5,pages:336,year:2019},{title:'Verity',author:'Colleen Hoover',genre:'Thriller',description:'A writer discovers a disturbing manuscript.',reason:'You will NOT see the ending coming',rating:4.6,pages:336,year:2018}],
  fantasy:[{title:'The Name of the Wind',author:'Patrick Rothfuss',genre:'Fantasy',description:'The legendary Kvothe tells his own story.',reason:'Stunning prose and world-building',rating:4.7,pages:662,year:2007},{title:'Mistborn',author:'Brandon Sanderson',genre:'Fantasy',description:'A crew of thieves plots to rob an immortal emperor.',reason:'Inventive magic system',rating:4.7,pages:541,year:2006},{title:'Fourth Wing',author:'Rebecca Yarros',genre:'Fantasy',description:'A war college for dragon riders.',reason:'Fast-paced and absolutely addictive',rating:4.6,pages:528,year:2023}],
  romance:[{title:'Beach Read',author:'Emily Henry',genre:'Romance',description:'Two rival authors swap genres and fall in love.',reason:'Witty, heartfelt and genuinely funny',rating:4.6,pages:361,year:2020},{title:'It Ends with Us',author:'Colleen Hoover',genre:'Romance',description:'A powerful story about love and resilience.',reason:'Emotional and beautifully written',rating:4.6,pages:368,year:2016}],
  scifi:[{title:'Project Hail Mary',author:'Andy Weir',genre:'Sci-Fi',description:'A lone astronaut must save Earth from extinction.',reason:'Most fun sci-fi in years',rating:4.8,pages:476,year:2021},{title:'Dune',author:'Frank Herbert',genre:'Sci-Fi',description:'A young nobleman navigates a desert planet.',reason:'Foundation of modern sci-fi',rating:4.8,pages:688,year:1965}],
  selfhelp:[{title:'Atomic Habits',author:'James Clear',genre:'Self-Help',description:'How tiny changes lead to remarkable results.',reason:'Most practical habit book ever written',rating:4.8,pages:320,year:2018},{title:'The Psychology of Money',author:'Morgan Housel',genre:'Finance',description:'Timeless lessons on wealth and happiness.',reason:'Will change how you think about money',rating:4.7,pages:256,year:2020}],
  literary:[{title:'The Midnight Library',author:'Matt Haig',genre:'Fiction',description:'Between life and death lies a library.',reason:'Beautiful, philosophical and hopeful',rating:4.6,pages:288,year:2020},{title:'The Alchemist',author:'Paulo Coelho',genre:'Inspirational',description:'A shepherd pursues his personal legend.',reason:'Short, profound and re-readable',rating:4.7,pages:197,year:1988}],
  mystery:[{title:'And Then There Were None',author:'Agatha Christie',genre:'Mystery',description:'Ten strangers on an island begin dying.',reason:'The bestselling mystery novel of all time',rating:4.7,pages:264,year:1939},{title:'The Seven Husbands of Evelyn Hugo',author:'Taylor Jenkins Reid',genre:'Mystery',description:'A Hollywood legend reveals her story.',reason:'Glamorous and utterly unforgettable',rating:4.7,pages:400,year:2017}],
  historical:[{title:'All the Light We Cannot See',author:'Anthony Doerr',genre:'Historical Fiction',description:'A blind French girl and a German boy in WWII.',reason:'Pulitzer Prize winner — exquisitely written',rating:4.7,pages:531,year:2014},{title:'The Nightingale',author:'Kristin Hannah',genre:'Historical Fiction',description:'Two French sisters resist Nazi occupation.',reason:'Devastating and triumphant',rating:4.8,pages:440,year:2015}],
};

const generateClientResponse = (userText, previousBooks=[]) => {
  const text=userText.toLowerCase();
  const detect=()=>{
    if(/thrille|suspens|crime|murder|dark|creepy/i.test(text)) return 'thriller';
    if(/fantasy|magic|dragon|wizard/i.test(text)) return 'fantasy';
    if(/romance|love|swoony|kiss/i.test(text)) return 'romance';
    if(/sci.?fi|space|future|robot|alien/i.test(text)) return 'scifi';
    if(/self.?help|habit|product|motivat|finance/i.test(text)) return 'selfhelp';
    if(/mystery|whodun|clue|agatha/i.test(text)) return 'mystery';
    if(/histor|war|wwii|world war/i.test(text)) return 'historical';
    return 'literary';
  };
  const cat=detect();
  const bookList=BOOK_DB[cat]||BOOK_DB.literary;
  const prevTitles=new Set(previousBooks.map(b=>b.title));
  const fresh=bookList.filter(b=>!prevTitles.has(b.title));
  const recs=(fresh.length>=2?fresh:bookList).slice(0,5);
  const intros={thriller:"Here are 5 gripping thrillers you won't put down! 🔪",fantasy:"5 magical worlds waiting for you ✨",romance:"5 romance reads for all the feels ❤️",scifi:"5 sci-fi journeys that'll blow your mind 🚀",selfhelp:"5 books that will change how you think 💡",mystery:"5 mysteries to keep you guessing 🔍",historical:"5 historical novels that transport you 🏰",literary:"5 beautifully written books 📚"};
  return { reply:intros[cat]||"Here are 5 great picks! 📚", books:recs };
};

// ─────────────────────────────────────────────────────────────────────────────
// BOOK CARD
// ─────────────────────────────────────────────────────────────────────────────
const BookCard = ({ book, onCreateCrew }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
    <div className="flex gap-4">
      <DynamicBookCover title={book.title} author={book.author} size="md"/>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 text-sm leading-tight">{book.title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">by {book.author}</p>
        {book.genre&&<span className="inline-block mt-1.5 text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{book.genre}</span>}
        {book.description&&<p className="text-xs text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">{book.description}</p>}
        {book.reason&&<p className="text-xs text-orange-700 mt-1 italic line-clamp-2">"{book.reason}"</p>}
        <div className="flex items-center gap-2 mt-2"><StarRating rating={Math.round(book.rating||4)} size="xs"/><span className="text-xs font-semibold text-gray-700">{book.rating||4.0}</span>{book.pages&&<span className="text-xs text-gray-400">· {book.pages}p</span>}</div>
      </div>
    </div>
    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
      <button onClick={onCreateCrew} className="flex-1 py-2.5 bg-[#C8622A] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"><Users className="w-4 h-4"/>Create Crew</button>
      <button onClick={()=>navigator.clipboard.writeText(`"${book.title}" by ${book.author}`)} className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50"><Share2 className="w-4 h-4 text-gray-500"/></button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// USER PROFILE MODAL
// ─────────────────────────────────────────────────────────────────────────────
const UserProfileModal = ({ userEmail, userName, currentUser, onClose, onFollow, isFollowing, onViewFullProfile, onBlock, isBlocked }) => {
  const [userPosts,setUserPosts]=useState([]);
  const [userReviews,setUserReviews]=useState([]);
  const [followers,setFollowers]=useState([]);
  const [following,setFollowing]=useState([]);

  useEffect(()=>{
    const followers=JSON.parse(localStorage.getItem(`user_${userEmail}_followers`)||'[]');
    const following=JSON.parse(localStorage.getItem(`user_${userEmail}_following`)||'[]');
    setFollowers(followers); setFollowing(following);
    setUserPosts(getAllPosts().filter(p=>p.userEmail===userEmail).slice(0,5));
    setUserReviews(getAllReviews().filter(r=>r.userEmail===userEmail).slice(0,3));
  },[userEmail]);

  const fmtTime=ts=>{const diff=Date.now()-new Date(ts);const m=Math.floor(diff/60000),h=Math.floor(diff/3600000),d=Math.floor(diff/86400000);if(m<1)return 'Just now';if(m<60)return `${m}m ago`;if(h<24)return `${h}h ago`;if(d<7)return `${d}d ago`;return new Date(ts).toLocaleDateString();};

  return (
    <div className="fixed inset-0 bg-black/50 z-[75] flex items-center justify-center p-4 overflow-y-auto" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between"><h3 className="font-bold">User Profile</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-6">
            <UserAvatar email={userEmail} name={userName} size="lg"/>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">{userName}</h2>
              <p className="text-sm text-gray-500">@{userName?.toLowerCase().replace(/\s/g,'')}</p>
              <div className="flex gap-4 mt-2">
                <div className="text-center"><p className="font-bold text-gray-900">{followers.length}</p><p className="text-xs text-gray-500">Followers</p></div>
                <div className="text-center"><p className="font-bold text-gray-900">{following.length}</p><p className="text-xs text-gray-500">Following</p></div>
              </div>
            </div>
          </div>
          {userEmail!==currentUser.email&&(
            <div className="flex gap-2 mb-6">
              <button onClick={()=>onFollow(userEmail,userName)} className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${isFollowing?'bg-gray-200 text-gray-700':'bg-gradient-to-r from-orange-500 to-red-500 text-white'}`}>
                {isFollowing?<><UserMinus className="w-4 h-4"/>Unfollow</>:<><UserPlus className="w-4 h-4"/>Follow</>}
              </button>
              <button onClick={()=>onBlock(userEmail,userName)} className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${isBlocked?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                {isBlocked?<><UserCheck className="w-4 h-4"/>Unblock</>:<><UserMinus className="w-4 h-4"/>Block</>}
              </button>
            </div>
          )}
          {userPosts.length>0&&(
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Recent Posts</h3>
              <div className="space-y-3">
                {userPosts.map(post=>(
                  <div key={post.id} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">{fmtTime(post.createdAt)}</p>
                      <span className="flex items-center gap-1 text-xs text-gray-500"><Heart className="w-3 h-3"/>{post.likes||0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={()=>{onClose();onViewFullProfile(userEmail,userName);}} className="w-full py-3 border border-orange-200 text-orange-600 rounded-xl font-medium hover:bg-orange-50">View Full Profile</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FULL USER PROFILE PAGE
// ─────────────────────────────────────────────────────────────────────────────
const FullUserProfilePage = ({ viewedUserEmail, viewedUserName, currentUser, onBack, onFollow, isFollowing, onBlock, isBlocked }) => {
  const [userData,setUserData]=useState(null);
  const [userPosts,setUserPosts]=useState([]);
  const [userReviews,setUserReviews]=useState([]);
  const [userBooks,setUserBooks]=useState([]);
  const [userCrews,setUserCrews]=useState([]);
  const [followers,setFollowers]=useState([]);
  const [following,setFollowing]=useState([]);
  const [activeTab,setActiveTab]=useState('Posts');
  const [userStats,setUserStats]=useState({booksRead:0,reviewsGiven:0,postsCreated:0,crewsJoined:0});

  useEffect(()=>{
    const users=JSON.parse(localStorage.getItem('users')||'[]');
    setUserData(users.find(u=>u.email===viewedUserEmail)||null);
    setUserStats(JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_stats`)||'{}'));
    setFollowers(JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_followers`)||'[]'));
    setFollowing(JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_following`)||'[]'));
    setUserPosts(getAllPosts().filter(p=>p.userEmail===viewedUserEmail));
    setUserReviews(getAllReviews().filter(r=>r.userEmail===viewedUserEmail));
    setUserBooks(JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_booksRead`)||'[]'));
    const jc=JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_joinedCrews`)||'[]');
    setUserCrews(getAllCrews().filter(c=>jc.includes(c.id)||jc.includes(String(c.id))));
  },[viewedUserEmail]);

  const tabs=['Posts','Reviews','Books Read','Crews'];
  return (
    <div className="min-h-screen bg-gray-50 pb-24 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
        <h2 className="font-semibold">{viewedUserName}'s Profile</h2>
        <div className="w-6"/>
      </div>
      <div className="px-4 py-5">
        <div className="flex items-start gap-4 mb-5">
          <UserAvatar email={viewedUserEmail} name={viewedUserName} size="xl"/>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">{viewedUserName}</h2>
            <p className="text-sm text-gray-500">@{viewedUserName?.toLowerCase().replace(/\s/g,'')}</p>
            <p className="text-sm text-gray-600 mt-1 italic">"{userData?.bio||'Reading is my superpower'}"</p>
            <div className="flex gap-4 mt-2">
              <div className="text-center"><p className="font-bold text-gray-900">{followers.length}</p><p className="text-xs text-gray-500">Followers</p></div>
              <div className="text-center"><p className="font-bold text-gray-900">{following.length}</p><p className="text-xs text-gray-500">Following</p></div>
            </div>
            {viewedUserEmail!==currentUser.email&&(
              <div className="flex gap-2 mt-3">
                <button onClick={()=>onFollow(viewedUserEmail,viewedUserName)} className={`flex-1 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 ${isFollowing?'bg-gray-200 text-gray-700':'bg-gradient-to-r from-orange-500 to-red-500 text-white'}`}>
                  {isFollowing?<><UserMinus className="w-4 h-4"/>Unfollow</>:<><UserPlus className="w-4 h-4"/>Follow</>}
                </button>
                <button onClick={()=>onBlock(viewedUserEmail,viewedUserName)} className={`px-4 py-2 rounded-xl font-semibold text-sm ${isBlocked?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{isBlocked?'Unblock':'Block'}</button>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 bg-white rounded-xl p-3 border border-gray-200 mb-5">
          {[{label:'Books',value:userStats.booksRead,icon:BookOpen,color:'text-blue-600'},{label:'Reviews',value:userStats.reviewsGiven,icon:Star,color:'text-purple-600'},{label:'Posts',value:userStats.postsCreated,icon:Edit3,color:'text-green-600'},{label:'Crews',value:userStats.crewsJoined,icon:Users,color:'text-orange-600'}].map(({label,value,icon:Icon,color},idx)=>(
            <div key={idx} className="text-center"><Icon className={`w-5 h-5 ${color} mx-auto mb-1`}/><p className="text-lg font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
          ))}
        </div>
        <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
          {tabs.map(tab=><button key={tab} onClick={()=>setActiveTab(tab)} className={`flex-shrink-0 text-sm pb-2.5 px-3 font-medium border-b-2 transition ${activeTab===tab?'text-orange-500 border-orange-500':'text-gray-500 border-transparent'}`}>{tab}</button>)}
        </div>
        {activeTab==='Posts'&&(userPosts.length===0?<div className="text-center py-8"><Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No posts yet</p></div>:userPosts.map(post=>(
          <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-3">
            <p className="text-sm text-gray-700 mb-2">{post.content}</p>
            {post.bookName&&<p className="text-xs text-orange-500">📖 {post.bookName}</p>}
            <div className="flex items-center gap-4 pt-2 border-t border-gray-100 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5"/>{post.likes||0}</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        )))}
        {activeTab==='Reviews'&&(userReviews.length===0?<div className="text-center py-8"><Star className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No reviews yet</p></div>:userReviews.map(r=>(
          <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-3">
            <div className="flex items-start gap-3 mb-2"><DynamicBookCover title={r.bookName} author={r.author} size="sm"/><div><h3 className="font-semibold text-sm">{r.bookName}</h3><p className="text-xs text-gray-500">by {r.author}</p><StarRating rating={r.rating} size="xs"/></div></div>
            <p className="text-sm text-gray-700">{r.review}</p>
          </div>
        )))}
        {activeTab==='Books Read'&&(userBooks.length===0?<div className="text-center py-8"><BookMarked className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No books tracked</p></div>:userBooks.map(b=>(
          <div key={b.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-start gap-3 mb-3"><DynamicBookCover title={b.title} author={b.author} size="sm"/><div><h3 className="font-semibold text-sm">{b.title}</h3><p className="text-xs text-gray-500">{b.author}</p><StarRating rating={b.rating} size="xs"/>{b.notes&&<p className="text-xs text-gray-600 mt-1 italic">"{b.notes}"</p>}</div></div>
        )))}
        {activeTab==='Crews'&&(userCrews.length===0?<div className="text-center py-8"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No crews joined</p></div>:userCrews.map(crew=>(
          <div key={crew.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-start gap-3 mb-3"><DynamicBookCover title={crew.name} author={crew.author} size="sm"/><div><p className="font-bold text-sm">{crew.name}</p><p className="text-xs text-gray-500">by {crew.author}</p><span className="text-xs text-gray-400">{crew.members||1} members</span></div></div>
        )))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CREW CHAT VIEW - SEPARATE COMPONENT (fixes React Hooks violation)
// ─────────────────────────────────────────────────────────────────────────────
const CrewChatView = ({ selectedCrew, user, crewMembers, isJoined, joinCrew, setView, onViewUserProfile, updateNotificationCount }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Hooks called unconditionally at top level of this component ✓
  const { onlineUsers, onlineCount } = useCrewPresence(selectedCrew.id, user.id, user.name);
  const { typingUsers, broadcastTyping, stopTyping } = useTypingIndicator(selectedCrew.id, user.id, user.name);

  useEffect(()=>{
    const msgs=JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`)||'[]');
    setMessages(msgs.map(m=>({...m,timestamp:new Date(m.timestamp)})));
    markCrewMessagesRead(selectedCrew.id, user.id);
  },[selectedCrew.id]);

  useEffect(()=>{ messagesEndRef.current?.scrollIntoView({behavior:'smooth'}); },[messages]);

  useEffect(()=>{
    if(isJoined) markCrewMessagesRead(selectedCrew.id, user.id);
  },[messages.length, isJoined]);

  const sendMessage = ()=>{
    if(!newMessage.trim()||!isJoined) return;
    const msg={id:`msg_${Date.now()}`,userId:user.id,userName:user.name,userEmail:user.email,userInitials:user.name?.slice(0,2).toUpperCase(),content:newMessage.trim(),timestamp:new Date().toISOString(),type:'text'};
    const existing=JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`)||'[]');
    existing.push(msg);
    localStorage.setItem(`crew_${selectedCrew.id}_messages`, JSON.stringify(existing));
    setMessages(prev=>[...prev,{...msg,timestamp:new Date(msg.timestamp)}]);
    crewMembers.filter(m=>m.email!==user.email).forEach(member=>{
      const notif={id:Date.now()+Math.random(),type:'message',fromUser:user.name,fromUserEmail:user.email,message:`${user.name} sent a message in "${selectedCrew.name}"`,timestamp:new Date().toISOString(),read:false,crewId:selectedCrew.id};
      const notifs=JSON.parse(localStorage.getItem(`user_${member.email}_notifications`)||'[]');
      notifs.unshift(notif); localStorage.setItem(`user_${member.email}_notifications`,JSON.stringify(notifs));
    });
    window.dispatchEvent(new StorageEvent('storage',{key:`user_${user.email}_notifications`}));
    updateNotificationCount?.(); stopTyping(); setNewMessage('');
  };

  const sendImage = e=>{
    const file=e.target.files[0];
    if(!file||!isJoined) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const msg={id:Date.now(),userId:user.id,userName:user.name,userEmail:user.email,userInitials:user.name?.slice(0,2).toUpperCase(),content:ev.target.result,timestamp:new Date().toISOString(),type:'image'};
      const existing=JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`)||'[]');
      existing.push(msg); localStorage.setItem(`crew_${selectedCrew.id}_messages`,JSON.stringify(existing));
      setMessages(prev=>[...prev,{...msg,timestamp:new Date(msg.timestamp)}]);
    };
    reader.readAsDataURL(file);
  };

  const fmtTime=ts=>{
    const diff=Date.now()-new Date(ts); const m=Math.floor(diff/60000),h=Math.floor(diff/3600000),d=Math.floor(diff/86400000);
    if(m<1)return 'Just now';if(m<60)return `${m}m`;if(h<24)return `${h}h`;if(d<7)return `${d}d`;return new Date(ts).toLocaleDateString();
  };

  const groupsByDate=messages.reduce((acc,msg)=>{
    const date=new Date(msg.timestamp).toDateString();
    if(!acc[date]) acc[date]=[];
    acc[date].push(msg);
    return acc;
  },{});

  return (
    <div className="fixed inset-0 flex flex-col z-[60] bg-[#e5ddd5] overflow-hidden" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="flex-shrink-0 bg-white border-b px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={()=>setView('detail')} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
          <DynamicBookCover title={selectedCrew.name} author={selectedCrew.author} size="xs"/>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{selectedCrew.name}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">{crewMembers.length} members</p>
              {onlineCount>0&&<span className="flex items-center gap-1 text-xs text-green-600 font-medium"><span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse"/>{onlineCount} online</span>}
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full"><MoreHorizontal className="w-5 h-5 text-gray-600"/></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {!isJoined?(
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Lock className="w-16 h-16 text-gray-300 mb-4"/>
            <p className="text-gray-600 font-medium mb-2">Join to see messages</p>
            <button onClick={()=>joinCrew(selectedCrew)} className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium">Join Crew</button>
          </div>
        ):(
          <>
            {Object.entries(groupsByDate).map(([date,msgs])=>(
              <div key={date}>
                <div className="flex justify-center my-4"><span className="bg-gray-300/80 text-gray-700 text-xs px-3 py-1 rounded-full">{new Date(date).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</span></div>
                {msgs.map(msg=>{
                  const isOwn=msg.userId===user.id;
                  return (
                    <div key={msg.id} className={`flex mb-2 ${isOwn?'justify-end':'justify-start'}`}>
                      <div className={`flex max-w-[78%] items-end gap-1.5 ${isOwn?'flex-row-reverse':''}`}>
                        {!isOwn&&(
                          <button onClick={()=>onViewUserProfile(msg.userEmail,msg.userName)}>
                            <UserAvatar email={msg.userEmail} name={msg.userName} size="xs" online={onlineUsers.some(u=>u.userId===msg.userId)}/>
                          </button>
                        )}
                        <div className={`rounded-2xl px-3.5 py-2 shadow-sm ${isOwn?'bg-[#dcf8c6] rounded-br-sm':'bg-white rounded-bl-sm'}`}>
                          {!isOwn&&<p className="text-xs font-semibold text-orange-600 mb-0.5">{msg.userName}</p>}
                          {msg.type==='image'?<img src={msg.content} alt="Shared" className="max-w-full rounded-xl max-h-60"/>:<p className="text-sm leading-relaxed break-words text-gray-900">{msg.content}</p>}
                          <p className="text-[10px] text-gray-400 text-right mt-0.5">
                            {fmtTime(msg.timestamp)}
                            {isOwn&&(()=>{
                              const s=getReadStatus(msg.timestamp,selectedCrew.id,onlineCount);
                              if(s==='read') return <span className="ml-1 text-blue-400">✓✓</span>;
                              if(s==='delivered') return <span className="ml-1 text-gray-400">✓✓</span>;
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
            {messages.length===0&&<div className="flex flex-col items-center justify-center h-full text-center py-16"><MessageCircle className="w-12 h-12 text-gray-300 mb-3"/><p className="text-gray-500">No messages yet. Say something!</p></div>}
            <div ref={messagesEndRef}/>
          </>
        )}
      </div>

      {isJoined&&(
        <div className="flex-shrink-0 bg-gray-50 border-t px-3 py-2.5" style={{paddingBottom:'max(10px, env(safe-area-inset-bottom))'}}>
          {typingUsers.length>0&&(
            <div className="flex items-center gap-2 px-2 pb-1.5">
              <div className="flex gap-0.5">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
              </div>
              <p className="text-xs text-gray-500 italic">{typingUsers.length===1?`${typingUsers[0]} is typing...`:`${typingUsers.length} people are typing...`}</p>
            </div>
          )}
          <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow border border-gray-100">
            <button onClick={()=>fileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center flex-shrink-0"><Plus className="w-5 h-5 text-orange-500"/></button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={sendImage}/>
            <input type="text" value={newMessage} onChange={e=>{setNewMessage(e.target.value);broadcastTyping();}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}} onBlur={stopTyping} className="flex-1 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent" placeholder="Type a message..."/>
            <button onClick={sendMessage} disabled={!newMessage.trim()} className={`w-8 h-8 flex items-center justify-center rounded-full transition ${newMessage.trim()?'bg-orange-500 text-white':'bg-gray-200 text-gray-400'}`}><Send className="w-4 h-4"/></button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────────────────────────────────────
const HomePage = ({ user, posts, setPosts, crews, setPage, updateNotificationCount, savedPosts, onSavePost, onResharePost, onDeletePost, onFollow, following, onBlock, blockedUsers, onViewUserProfile }) => {
  const [showShare,setShowShare]=useState(null);
  const [showReshare,setShowReshare]=useState(null);
  const [userStats,setUserStats]=useState({booksRead:0,reviewsGiven:0,postsCreated:0,crewsJoined:0});
  const [readingProgress,setReadingProgress]=useState(0);

  const TRENDING_DB=[
    {title:'Atomic Habits',author:'James Clear',genre:'Self-Help',rating:4.8,readers:25000},
    {title:'The Psychology of Money',author:'Morgan Housel',genre:'Finance',rating:4.7,readers:18000},
    {title:'Project Hail Mary',author:'Andy Weir',genre:'Sci-Fi',rating:4.8,readers:22000},
    {title:'Fourth Wing',author:'Rebecca Yarros',genre:'Fantasy',rating:4.6,readers:35000},
    {title:'The Midnight Library',author:'Matt Haig',genre:'Fiction',rating:4.6,readers:19000},
  ];

  useEffect(()=>{
    const stats=JSON.parse(localStorage.getItem(`user_${user.email}_stats`)||'{}');
    setUserStats({booksRead:stats.booksRead||0,reviewsGiven:stats.reviewsGiven||0,postsCreated:stats.postsCreated||0,crewsJoined:stats.crewsJoined||0});
    if(user?.readingGoal?.yearly>0){
      setReadingProgress(Math.min(((stats.booksRead||0)/user.readingGoal.yearly)*100,100));
    }
  },[user.email]);

  const handleReshare=(post,comment)=>{onResharePost(post,comment);setShowReshare(null);};
  const userCrews=crews.filter(c=>user?.joinedCrews?.includes(c.id));
  const hasReadingGoal=user?.readingGoal?.yearly>0||user?.readingGoal?.monthly>0;
  const notifCount=JSON.parse(localStorage.getItem(`user_${user.email}_notifications`)||'[]').filter(n=>!n.read).length;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <TopBar user={user} setPage={setPage} title="ReadCrew" onNotificationClick={()=>setPage('notifications')} notificationCount={notifCount}/>
      {showShare&&<ShareModal post={showShare} onClose={()=>setShowShare(null)}/>}
      {showReshare&&<ReshareModal post={showReshare} onClose={()=>setShowReshare(null)} onReshare={handleReshare}/>}
      <div className="px-4 py-4 space-y-5">
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div><h2 className="text-xl font-bold">Welcome, {user?.name?.split(' ')[0]}! 📚</h2><p className="text-orange-100 text-sm mt-1">Ready for your next reading adventure?</p></div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"><BookOpen className="w-6 h-6 text-white"/></div>
          </div>
          {hasReadingGoal&&(
            <div className="mt-4 bg-white/20 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm mb-2"><span>Yearly Goal</span><span className="font-semibold">{userStats.booksRead}/{user?.readingGoal?.yearly} books</span></div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden"><div className="h-full bg-white rounded-full" style={{width:`${readingProgress}%`}}/></div>
            </div>
          )}
          {!hasReadingGoal&&<button onClick={()=>setPage('profile')} className="mt-3 w-full bg-white/20 hover:bg-white/30 rounded-xl py-2 text-sm font-medium">Set Reading Goals →</button>}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[{label:'Books',value:userStats.booksRead,icon:BookOpen,color:'text-blue-600',bg:'bg-blue-100',page:'profile'},{label:'Reviews',value:userStats.reviewsGiven,icon:Star,color:'text-purple-600',bg:'bg-purple-100',page:'reviews'},{label:'Posts',value:userStats.postsCreated,icon:Edit3,color:'text-green-600',bg:'bg-green-100',page:'post'},{label:'Crews',value:userStats.crewsJoined,icon:Users,color:'text-orange-600',bg:'bg-orange-100',page:'crews'}].map(({label,value,icon:Icon,color,bg,page},idx)=>(
            <div key={idx} className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md" onClick={()=>setPage(page)}>
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}><Icon className={`w-4 h-4 ${color}`}/></div>
              <p className="text-lg font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-orange-500"/>Trending Books</h2><button onClick={()=>setPage('explore')} className="text-sm text-orange-500 font-semibold">Explore All</button></div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {TRENDING_DB.map((book,i)=>(
              <div key={i} className="shrink-0 w-28">
                <DynamicBookCover title={book.title} author={book.author} size="md"/>
                <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 mt-1">{book.title}</p>
                <p className="text-xs text-gray-500 truncate">{book.author}</p>
                <div className="flex items-center gap-1 mt-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400"/><span className="text-xs font-medium">{book.rating}</span></div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-orange-500"/>Your Crews</h2><button onClick={()=>setPage('crews')} className="text-sm text-orange-500 font-semibold">View All</button></div>
          <div className="grid grid-cols-2 gap-3">
            {userCrews.slice(0,2).map(crew=>(
              <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer" onClick={()=>setPage('crews')}>
                <div className="h-16 flex items-center justify-center p-2 bg-gray-50"><DynamicBookCover title={crew.name} author={crew.author} size="xs"/></div>
                <div className="p-3"><h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{crew.name}</h3><p className="text-xs text-gray-500 mt-0.5">{crew.genre}</p><div className="flex items-center justify-between mt-2"><span className="flex items-center gap-1 text-xs text-gray-500"><Users className="w-3 h-3"/>{crew.members||1}</span><span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-lg text-xs">Joined</span></div></div>
              </div>
            ))}
            {userCrews.length===0&&<div className="col-span-2 bg-white rounded-xl p-6 text-center border border-gray-200"><p className="text-gray-500 text-sm">No crews joined yet</p><button onClick={()=>setPage('crews')} className="mt-2 text-orange-500 text-sm font-medium">Browse Crews →</button></div>}
          </div>
        </div>
        <button onClick={()=>setPage('post')} className="w-full bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-center gap-3 hover:shadow-md">
          <UserAvatar email={user.email} name={user.name} size="sm"/>
          <span className="text-gray-400 text-sm flex-1 text-left">Share your reading journey...</span>
          <span className="text-xs text-orange-500 font-medium bg-orange-50 px-3 py-1 rounded-full">Post</span>
        </button>
        <div>
          <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-orange-500"/>Community Feed</h2></div>
          <div className="space-y-4">
            {posts.length===0?(
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                <p className="text-gray-500">No posts yet. Be the first to share!</p>
                <button onClick={()=>setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Create Post</button>
              </div>
            ):posts.slice(0,15).map((post,idx)=>(
              <InlinePostCard key={post.id||idx} post={post} user={user} updateNotificationCount={updateNotificationCount} onShare={p=>setShowShare(p)} onReshareClick={p=>setShowReshare(p)} onSaveToggle={onSavePost} isSaved={savedPosts?.includes(post.id)} onDelete={onDeletePost} onFollow={onFollow} isFollowing={following?.includes(post.userEmail)} onBlock={onBlock} isBlocked={blockedUsers?.includes(post.userEmail)} onViewUserProfile={onViewUserProfile}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPLORE PAGE
// ─────────────────────────────────────────────────────────────────────────────
const ExplorePage = ({ user, setPage, onCreateCrew }) => {
  const [chatMessages,setChatMessages]=useState([{role:'assistant',content:"Hey! 👋 I'm Page Turner, your AI book guide. Tell me what you're in the mood for — a genre, a vibe, or the last book you loved. Let's find your next great read!",timestamp:new Date()}]);
  const [input,setInput]=useState(''); const [loading,setLoading]=useState(false); const [allBooks,setAllBooks]=useState([]);
  const [lastQuery,setLastQuery]=useState(''); const [sessionId]=useState(()=>`session_${Date.now()}`);
  const [mode,setMode]=useState('chat');
  const chatEndRef=useRef(null); const inputRef=useRef(null);

  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:'smooth'}); },[chatMessages]);

  const sendMessage=async()=>{
    if(!input.trim()||loading) return;
    const userText=input.trim(); setInput('');
    setChatMessages(prev=>[...prev,{role:'user',content:userText,timestamp:new Date()}]);
    setLastQuery(userText); setLoading(true);
    let used=false;
    try {
      const res=await fetch(`${API_URL}/api/books/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:userText,sessionId}),signal:AbortSignal.timeout(35000)});
      if(res.ok){const data=await res.json();if(data.success&&data.reply){setChatMessages(prev=>[...prev,{role:'assistant',content:data.reply,timestamp:new Date()}]);if(data.recommendations?.length>0){setAllBooks(data.recommendations);}used=true;}}
    }catch{}
    if(!used){
      const{reply,books}=generateClientResponse(userText,allBooks);
      setChatMessages(prev=>[...prev,{role:'assistant',content:reply,timestamp:new Date()}]);
      if(books.length>0) setAllBooks(books);
    }
    setLoading(false);
  };

  const fmtTime=ts=>{if(!ts)return '';return new Date(ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});};

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] to-[#FAF6F1] pb-24 overflow-y-auto">
      <div className="px-5 pt-8 pb-4"><h1 className="text-2xl font-bold text-[#2D1F14] mb-1" style={{fontFamily:'Georgia,serif'}}>What to read next?</h1><p className="text-sm text-[#8B7968]">Chat with your AI book guide</p></div>
      <div className="mx-4 space-y-3">
        {chatMessages.map((msg,i)=>(
          <div key={i} className={`flex ${msg.role==='user'?'justify-end':'justify-start'} items-end gap-2`}>
            {msg.role==='assistant'&&<div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0 mb-1"><BookOpen className="w-4 h-4 text-white"/></div>}
            <div className={`max-w-[78%] flex flex-col ${msg.role==='user'?'items-end':'items-start'}`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role==='user'?'bg-[#C8622A] text-white rounded-br-sm':'bg-white text-[#3A2C25] rounded-bl-sm shadow-sm border border-gray-100'}`}>{msg.content}</div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">{fmtTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}
        {loading&&<div className="flex justify-start items-end gap-2"><div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0"><BookOpen className="w-4 h-4 text-white"/></div><div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100"><div className="flex gap-1.5 items-center"><div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/><div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/><div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/></div></div></div>}
        {allBooks.length>0&&(
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 px-1"><div className="h-px flex-1 bg-orange-200"/><span className="text-xs text-orange-500 font-semibold">📚 RECOMMENDATIONS</span><div className="h-px flex-1 bg-orange-200"/></div>
            {allBooks.map((book,i)=><BookCard key={`${i}-${book.title}`} book={book} onCreateCrew={()=>{onCreateCrew(book);setPage('crews');}}/>)}
          </div>
        )}
        <div ref={chatEndRef}/>
      </div>
      <div className="sticky bottom-20 mx-4 mt-4 bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-gray-200 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="Tell me what you're in the mood for..." className="flex-1 bg-transparent text-sm text-[#2D1F14] outline-none placeholder-gray-400"/>
          <button onClick={sendMessage} disabled={!input.trim()||loading} className={`w-9 h-9 rounded-full flex items-center justify-center transition flex-shrink-0 ${input.trim()&&!loading?'bg-[#C8622A] text-white':'bg-gray-100 text-gray-400'}`}><Send className="w-4 h-4"/></button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// POST PAGE
// ─────────────────────────────────────────────────────────────────────────────
const PostPage = ({ user, onPost, setPage }) => {
  const [content,setContent]=useState(''); const [bookName,setBookName]=useState(''); const [author,setAuthor]=useState('');
  const [image,setImage]=useState(null); const [isPublic,setIsPublic]=useState(true); const fileRef=useRef();

  const handleSubmit=()=>{
    if(!content.trim()) return;
    onPost({id:Date.now(),content,bookName,author,image,isPublic,type:'post',userName:user.name,userEmail:user.email,createdAt:new Date().toISOString(),likes:0,comments:0,shares:0,reshareCount:0});
    setPage('home');
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white z-[55] overflow-hidden" style={{maxWidth:'448px',left:'50%',transform:'translateX(-50%)',width:'100%'}}>
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={()=>setPage('home')} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-600"/></button>
        <h2 className="font-semibold">Create Post</h2>
        <button onClick={handleSubmit} disabled={!content.trim()} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">Share</button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex gap-3 mb-4">
          <UserAvatar email={user.email} name={user.name} size="md"/>
          <textarea value={content} onChange={e=>setContent(e.target.value)} className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-base resize-none" placeholder="What are you reading?" rows={5} autoFocus/>
        </div>
        <div className="space-y-3 mb-4">
          <input value={bookName} onChange={e=>setBookName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300" placeholder="Book name (optional)"/>
          <input value={author} onChange={e=>setAuthor(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300" placeholder="Author (optional)"/>
        </div>
        {image&&<div className="relative mb-4"><img src={image} alt="preview" className="w-full rounded-xl max-h-56 object-cover"/><button onClick={()=>setImage(null)} className="absolute top-2 right-2 bg-black/50 rounded-full p-1"><X className="w-4 h-4 text-white"/></button></div>}
        <div className="flex flex-wrap gap-3">
          <button onClick={()=>fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 hover:bg-gray-200"><Camera className="w-4 h-4"/>Add Photo</button>
          <button onClick={()=>setIsPublic(!isPublic)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${!isPublic?'bg-gray-800 text-white':'bg-gray-100 text-gray-700'}`}>{isPublic?<Globe className="w-4 h-4"/>:<Lock className="w-4 h-4"/>}{isPublic?'Public':'Private'}</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=ev=>setImage(ev.target.result);r.readAsDataURL(f);}}}/>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS PAGE
// ─────────────────────────────────────────────────────────────────────────────
const ReviewsPage = ({ user, setPage, updateNotificationCount, onViewUserProfile }) => {
  const [reviews,setReviews]=useState([]); const [loading,setLoading]=useState(true); const [showForm,setShowForm]=useState(false);
  const [likedReviews,setLikedReviews]=useState([]); const [searchQuery,setSearchQuery]=useState('');
  const [newReview,setNewReview]=useState({bookName:'',author:'',rating:5,review:'',sentiment:'positive'});

  useEffect(()=>{
    setReviews(getAllReviews()); setLoading(false);
    setLikedReviews(JSON.parse(localStorage.getItem(`user_${user.email}_likedReviews`)||'[]'));
  },[user.email]);

  const handleLike=(reviewId,review)=>{
    if(likedReviews.includes(reviewId)) return;
    const updated=[...likedReviews,reviewId]; setLikedReviews(updated);
    localStorage.setItem(`user_${user.email}_likedReviews`, JSON.stringify(updated));
    const updatedReviews=reviews.map(r=>r.id===reviewId?{...r,likes:(r.likes||0)+1}:r);
    setReviews(updatedReviews); saveAllReviews(updatedReviews);
    if(review.userEmail!==user.email){
      const notif={id:Date.now(),type:'like',fromUser:user.name,message:`${user.name} liked your review of "${review.bookName}"`,timestamp:new Date().toISOString(),read:false};
      const notifs=JSON.parse(localStorage.getItem(`user_${review.userEmail}_notifications`)||'[]');
      notifs.unshift(notif); localStorage.setItem(`user_${review.userEmail}_notifications`,JSON.stringify(notifs));
      window.dispatchEvent(new StorageEvent('storage',{key:`user_${review.userEmail}_notifications`}));
      updateNotificationCount?.();
    }
  };

  const handleCreate=()=>{
    if(!newReview.bookName||!newReview.author||!newReview.review){alert('Please fill all fields');return;}
    const reviewData={id:Date.now().toString(),...newReview,userName:user.name,userEmail:user.email,createdAt:new Date().toISOString(),likes:0};
    const saved=getAllReviews(); saved.unshift(reviewData); saveAllReviews(saved);
    setReviews([reviewData,...reviews]); setShowForm(false);
    setNewReview({bookName:'',author:'',rating:5,review:'',sentiment:'positive'});
    const stats=JSON.parse(localStorage.getItem(`user_${user.email}_stats`)||'{}');
    stats.reviewsGiven=(stats.reviewsGiven||0)+1;
    localStorage.setItem(`user_${user.email}_stats`,JSON.stringify(stats));
  };

  const filtered=reviews.filter(r=>r.bookName.toLowerCase().includes(searchQuery.toLowerCase())||r.author.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <button onClick={()=>setPage('home')} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
        <h2 className="font-semibold">Book Reviews</h2>
        <button onClick={()=>setShowForm(!showForm)} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium">{showForm?'Cancel':'Write Review'}</button>
      </div>
      <div className="px-4 py-4">
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search by title or author..." className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"/>{searchQuery&&<button onClick={()=>setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400"/></button>}</div>
        {showForm&&(
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
            <h3 className="font-semibold mb-3">Write a Review</h3>
            <div className="space-y-3 mb-4">
              <input type="text" value={newReview.bookName} onChange={e=>setNewReview({...newReview,bookName:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Book name"/>
              <input type="text" value={newReview.author} onChange={e=>setNewReview({...newReview,author:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Author"/>
              <div><label className="text-xs text-gray-600 mb-1 block">Rating</label><StarRating rating={newReview.rating} onChange={r=>setNewReview({...newReview,rating:r})} size="md"/></div>
              <textarea value={newReview.review} onChange={e=>setNewReview({...newReview,review:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300 resize-none" placeholder="Write your review..." rows={4}/>
              <div className="flex gap-2">{['positive','negative'].map(s=><button key={s} type="button" onClick={()=>setNewReview({...newReview,sentiment:s})} className={`flex-1 py-2 rounded-lg text-sm font-medium ${newReview.sentiment===s?(s==='positive'?'bg-green-500 text-white':'bg-red-500 text-white'):'bg-gray-100 text-gray-600'}`}>{s==='positive'?'👍 Positive':'👎 Negative'}</button>)}</div>
            </div>
            <button onClick={handleCreate} className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium">Submit Review</button>
          </div>
        )}
        {loading?<div className="flex justify-center py-8"><LoadingSpinner/></div>:filtered.length===0?(
          <div className="text-center py-12"><Star className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">{searchQuery?`No reviews found for "${searchQuery}"`:'No reviews yet. Be the first!'}</p></div>
        ):(
          <div className="space-y-4">
            {filtered.map((review,idx)=>{
              const isLiked=likedReviews.includes(review.id);
              return (
                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-3 mb-2"><DynamicBookCover title={review.bookName} author={review.author} size="sm"/><div className="flex-1"><h3 className="font-semibold text-gray-900 text-sm">{review.bookName}</h3><p className="text-xs text-gray-500">by {review.author}</p><StarRating rating={review.rating} size="xs"/></div></div>
                  <p className="text-sm text-gray-700 mb-3">{review.review}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button onClick={()=>onViewUserProfile(review.userEmail,review.userName)} className="flex items-center gap-2 hover:opacity-75">
                      <UserAvatar email={review.userEmail} name={review.userName} size="xs"/>
                      <span className="text-xs text-gray-600 hover:underline">{review.userName}</span>
                    </button>
                    <div className="flex items-center gap-3">
                      <button onClick={()=>handleLike(review.id,review)} disabled={isLiked} className={`flex items-center gap-1 text-xs ${isLiked?'text-red-500':'text-gray-400 hover:text-red-400'}`}><Heart className={`w-3.5 h-3.5 ${isLiked?'fill-red-500':''}`}/>{review.likes||0}</button>
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

// ─────────────────────────────────────────────────────────────────────────────
// CREWS PAGE
// ─────────────────────────────────────────────────────────────────────────────
const CrewsPage = ({ user, crews: initialCrews, setPage, updateNotificationCount, onViewUserProfile }) => {
  const [view,setView]=useState('list');
  const [selectedCrew,setSelectedCrew]=useState(null);
  const [crewMembers,setCrewMembers]=useState([]);
  const [crews,setCrews]=useState([]);
  const [joinedCrews,setJoinedCrews]=useState([]);
  const [showJoinMsg,setShowJoinMsg]=useState('');
  const [showCreateForm,setShowCreateCrewForm]=useState(false);
  const [newCrewData,setNewCrewData]=useState({name:'',author:'',genre:''});
  const [selectedTab,setSelectedTab]=useState('chat');
  const [searchQuery,setSearchQuery]=useState('');

  useEffect(()=>{
    const saved=getAllCrews();
    setCrews(saved.length>0?saved:initialCrews);
    const jc=JSON.parse(localStorage.getItem(`user_${user.email}_joinedCrews`)||'[]');
    setJoinedCrews(jc);
  },[user.email]);

  useEffect(()=>{
    if(selectedCrew){
      const allUsers=JSON.parse(localStorage.getItem('users')||'[]');
      const members=allUsers.filter(u=>u.joinedCrews?.includes(selectedCrew.id)||u.joinedCrews?.includes(String(selectedCrew.id))).map(u=>({id:u.id,name:u.name,email:u.email,initials:u.name?.slice(0,2)}));
      if(!members.find(m=>m.email===selectedCrew.createdBy)) members.push({id:selectedCrew.createdBy,name:selectedCrew.createdByName||'Creator',email:selectedCrew.createdBy,initials:(selectedCrew.createdByName||'CR').slice(0,2),isCreator:true});
      setCrewMembers(members);
    }
  },[selectedCrew]);

  const isJoined=crewId=>joinedCrews.includes(crewId);

  const joinCrew=crew=>{
    const updated=[...joinedCrews,crew.id]; setJoinedCrews(updated);
    localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updated));
    const updatedCrews=crews.map(c=>c.id===crew.id?{...c,members:(c.members||1)+1}:c);
    setCrews(updatedCrews); saveAllCrews(updatedCrews);
    const users=JSON.parse(localStorage.getItem('users')||'[]');
    localStorage.setItem('users', JSON.stringify(users.map(u=>u.email===user.email?{...u,joinedCrews:updated}:u)));
    const stats=JSON.parse(localStorage.getItem(`user_${user.email}_stats`)||'{}');
    stats.crewsJoined=(stats.crewsJoined||0)+1;
    localStorage.setItem(`user_${user.email}_stats`, JSON.stringify(stats));
    const cu=JSON.parse(localStorage.getItem('currentUser')||'{}');
    localStorage.setItem('currentUser', JSON.stringify({...cu,joinedCrews:updated,stats}));
    setShowJoinMsg(`🎉 Joined "${crew.name}"!`);
    setTimeout(()=>setShowJoinMsg(''),3000);
  };

  const leaveCrew=crew=>{
    if(!window.confirm(`Leave ${crew.name}?`)) return;
    const updated=joinedCrews.filter(id=>id!==crew.id); setJoinedCrews(updated);
    localStorage.setItem(`user_${user.email}_joinedCrews`, JSON.stringify(updated));
    const updatedCrews=crews.map(c=>c.id===crew.id?{...c,members:Math.max(0,(c.members||1)-1)}:c);
    setCrews(updatedCrews); saveAllCrews(updatedCrews);
    if(selectedCrew?.id===crew.id){setView('list');setSelectedCrew(null);}
  };

  const createCrew=()=>{
    if(!newCrewData.name||!newCrewData.author){alert('Please fill book name and author');return;}
    if(crews.some(c=>c.name.toLowerCase()===newCrewData.name.toLowerCase()&&c.author.toLowerCase()===newCrewData.author.toLowerCase())){alert('A crew for this book already exists!');return;}
    const newCrew={id:Date.now(),...newCrewData,members:1,chats:0,createdBy:user.email,createdByName:user.name,createdAt:new Date().toISOString()};
    const updatedCrews=[newCrew,...crews]; setCrews(updatedCrews); saveAllCrews(updatedCrews);
    joinCrew(newCrew); setShowCreateCrewForm(false); setNewCrewData({name:'',author:'',genre:''});
  };

  const filtered=crews.filter(c=>c.name.toLowerCase().includes(searchQuery.toLowerCase())||c.author.toLowerCase().includes(searchQuery.toLowerCase())||(c.genre&&c.genre.toLowerCase().includes(searchQuery.toLowerCase())));
  const Toast=()=>showJoinMsg?<div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg z-[100] text-center">{showJoinMsg}</div>:null;

  // ── CREW CHAT - rendered as proper component (no hook violations) ──
  if(view==='chat'&&selectedCrew){
    return (
      <>
        <Toast/>
        <CrewChatView
          selectedCrew={selectedCrew}
          user={user}
          crewMembers={crewMembers}
          isJoined={isJoined(selectedCrew.id)}
          joinCrew={joinCrew}
          setView={setView}
          onViewUserProfile={onViewUserProfile}
          updateNotificationCount={updateNotificationCount}
        />
      </>
    );
  }

  if(view==='detail'&&selectedCrew){
    const hasJoined=isJoined(selectedCrew.id);
    const msgs=JSON.parse(localStorage.getItem(`crew_${selectedCrew.id}_messages`)||'[]');
    return (
      <div className="h-screen flex flex-col bg-white overflow-hidden" style={{maxWidth:'448px',margin:'0 auto'}}>
        <Toast/>
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3 z-10 flex-shrink-0">
          <button onClick={()=>setView('list')} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5"/></button>
          <span className="font-semibold flex-1">Crew Info</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="bg-gradient-to-b from-orange-50 to-white px-4 pt-6 pb-4">
            <div className="flex flex-col items-center text-center">
              <DynamicBookCover title={selectedCrew.name} author={selectedCrew.author} size="xl"/>
              <h1 className="text-2xl font-bold text-gray-900 mt-3">{selectedCrew.name}</h1>
              <p className="text-gray-500">by {selectedCrew.author}</p>
              {selectedCrew.genre&&<span className="mt-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">{selectedCrew.genre}</span>}
              <div className="flex gap-8 mt-4">
                <div className="text-center"><p className="text-xl font-bold">{crewMembers.length}</p><p className="text-xs text-gray-500">Members</p></div>
                <div className="text-center"><p className="text-xl font-bold">{msgs.length}</p><p className="text-xs text-gray-500">Messages</p></div>
              </div>
              <div className="flex gap-3 mt-5 w-full">
                {!hasJoined?<button onClick={()=>joinCrew(selectedCrew)} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold">Join Crew</button>:<button onClick={()=>setView('chat')} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold">Go to Chat</button>}
                <button onClick={()=>{const e=prompt("Friend's email to invite:");if(e){const n={id:Date.now(),type:'invite',fromUser:user.name,message:`${user.name} invited you to join "${selectedCrew.name}"!`,timestamp:new Date().toISOString(),read:false};const ns=JSON.parse(localStorage.getItem(`user_${e}_notifications`)||'[]');ns.unshift(n);localStorage.setItem(`user_${e}_notifications`,JSON.stringify(ns));alert(`Invited ${e}!`);}}} className="px-4 py-3 border border-gray-200 rounded-xl"><UserPlus className="w-5 h-5"/></button>
              </div>
            </div>
          </div>
          <div className="flex border-b border-gray-200 px-4">{['Chat','Members','About'].map(tab=><button key={tab} onClick={()=>setSelectedTab(tab.toLowerCase())} className={`flex-1 py-3 text-sm font-medium border-b-2 ${selectedTab===tab.toLowerCase()?'text-orange-500 border-orange-500':'text-gray-500 border-transparent'}`}>{tab}</button>)}</div>
          <div className="p-4 pb-24">
            {selectedTab==='chat'&&(hasJoined?(
              <div className="space-y-3">
                <button onClick={()=>setView('chat')} className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"><MessageCircle className="w-5 h-5"/>Open Chat</button>
                {msgs.slice(-3).reverse().map(m=>(
                  <div key={m.id} className="flex items-start gap-3 py-2">
                    <UserAvatar email={m.userEmail} name={m.userName} size="sm"/>
                    <div className="flex-1 min-w-0"><span className="font-semibold text-sm">{m.userName}</span><p className="text-sm text-gray-600 truncate">{m.type==='image'?'📷 Image':m.content}</p></div>
                  </div>
                ))}
              </div>
            ):<div className="text-center py-8"><Lock className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">Join to see messages</p></div>)}
            {selectedTab==='members'&&<div className="space-y-4">{crewMembers.map(member=>(
              <div key={member.id} className="flex items-center gap-3">
                <button onClick={()=>onViewUserProfile(member.email,member.name)}>
                  <UserAvatar email={member.email} name={member.name} size="md"/>
                </button>
                <div className="flex-1 min-w-0">
                  <button onClick={()=>onViewUserProfile(member.email,member.name)} className="font-semibold hover:underline">{member.name}</button>
                  <p className="text-xs text-gray-500">{member.isCreator?'👑 Creator':'Member'}</p>
                </div>
              </div>
            ))}</div>}
            {selectedTab==='about'&&<div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4"><h3 className="font-semibold mb-2">About this Crew</h3><p className="text-sm text-gray-600">A crew for readers of "{selectedCrew.name}" by {selectedCrew.author}.</p></div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm"><div className="flex justify-between"><span className="text-gray-500">Created</span><span>{new Date(selectedCrew.createdAt).toLocaleDateString()}</span></div><div className="flex justify-between"><span className="text-gray-500">By</span><span>{selectedCrew.createdByName||'Creator'}</span></div>{selectedCrew.genre&&<div className="flex justify-between"><span className="text-gray-500">Genre</span><span>{selectedCrew.genre}</span></div>}</div>
              {hasJoined&&<button onClick={()=>leaveCrew(selectedCrew)} className="w-full py-3 border border-red-200 text-red-500 rounded-xl font-medium">Leave Crew</button>}
            </div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <Toast/>
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2"><div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-white"/></div><span className="font-bold" style={{fontFamily:'Georgia,serif'}}>Reading Crews</span></div>
        <button onClick={()=>setShowCreateCrewForm(true)} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium">Create Crew</button>
      </div>
      <div className="px-4 py-4">
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search crews..." className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"/>{searchQuery&&<button onClick={()=>setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400"/></button>}</div>
        {showCreateForm&&(
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
            <h3 className="font-semibold mb-3">Create New Crew</h3>
            {newCrewData.name&&<div className="flex justify-center mb-4"><DynamicBookCover title={newCrewData.name} author={newCrewData.author} size="lg"/></div>}
            <div className="space-y-3">
              <input value={newCrewData.name} onChange={e=>setNewCrewData({...newCrewData,name:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Book title"/>
              <input value={newCrewData.author} onChange={e=>setNewCrewData({...newCrewData,author:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Author"/>
              <input value={newCrewData.genre} onChange={e=>setNewCrewData({...newCrewData,genre:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Genre"/>
              <div className="flex gap-2"><button onClick={createCrew} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">Create</button><button onClick={()=>setShowCreateCrewForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button></div>
            </div>
          </div>
        )}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-orange-500"/>My Crews</h2>
          {filtered.filter(c=>isJoined(c.id)).length===0?<div className="bg-white rounded-xl p-6 text-center border border-gray-200"><p className="text-gray-500 text-sm">No crews joined yet.</p></div>:filtered.filter(c=>isJoined(c.id)).map(crew=>(
            <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-green-200 shadow-sm cursor-pointer mb-3" onClick={()=>{setSelectedCrew(crew);setView('detail');}}>
              <div className="flex items-center px-4 gap-4 py-3"><DynamicBookCover title={crew.name} author={crew.author} size="sm"/><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="font-bold text-gray-900 truncate">{crew.name}</p><span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full flex-shrink-0">Joined</span></div><p className="text-xs text-gray-500">by {crew.author}</p><div className="flex items-center gap-3 mt-1">{crew.genre&&<span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre}</span>}<span className="text-xs text-gray-400">{crew.members||1} members</span></div></div></div>
              <div className="px-4 py-2 flex justify-end gap-2 border-t border-gray-100"><button onClick={e=>{e.stopPropagation();setSelectedCrew(crew);setView('chat');}} className="px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-xs font-medium">Chat</button></div>
            </div>
          ))}
        </div>
        <div>
          <h2 className="text-lg font-bold mb-3">Discover Crews</h2>
          <div className="space-y-3">
            {filtered.filter(c=>!isJoined(c.id)).length===0?<div className="bg-white rounded-xl p-6 text-center border border-gray-200"><p className="text-gray-500 text-sm">No crews to discover</p></div>:filtered.filter(c=>!isJoined(c.id)).map(crew=>(
              <div key={crew.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer" onClick={()=>{setSelectedCrew(crew);setView('detail');}}>
                <div className="flex items-center px-4 gap-4 py-3"><DynamicBookCover title={crew.name} author={crew.author} size="sm"/><div className="flex-1 min-w-0"><p className="font-bold text-gray-900 truncate">{crew.name}</p><p className="text-xs text-gray-500">by {crew.author}</p><div className="flex items-center gap-2 mt-1">{crew.genre&&<span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{crew.genre}</span>}<span className="text-xs text-gray-400">{crew.members||1} members</span></div></div></div>
                <div className="px-4 py-3 flex justify-end border-t border-gray-100"><button onClick={e=>{e.stopPropagation();joinCrew(crew);}} className="px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold">Join</button></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE PAGE
// ─────────────────────────────────────────────────────────────────────────────
const ProfilePage = ({ user, posts, setPage, onLogout, onUpdateUser, savedPosts, following, followers, onFollow }) => {
  const [activeTab,setActiveTab]=useState('Posts');
  const [userStats,setUserStats]=useState(user?.stats||{booksRead:0,reviewsGiven:0,postsCreated:0,crewsJoined:0});
  const [readingGoal,setReadingGoal]=useState(user?.readingGoal||{yearly:0,monthly:0});
  const [showEditGoal,setShowEditGoal]=useState(false); const [editGoal,setEditGoal]=useState(readingGoal);
  const [myBooks,setMyBooks]=useState([]); const [showAddBook,setShowAddBook]=useState(false);
  const [newBook,setNewBook]=useState({title:'',author:'',rating:5,notes:''});
  const [editingProfile,setEditingProfile]=useState(false); const [editName,setEditName]=useState(user?.name||''); const [editBio,setEditBio]=useState(user?.bio||'');
  const [profilePhoto,setProfilePhoto]=useState(null);
  const fileRef=useRef();

  const myPosts=posts.filter(p=>p.userEmail===user?.email);
  const myReviews=getAllReviews().filter(r=>r.userEmail===user?.email);
  const savedPostsList=posts.filter(p=>savedPosts?.includes(p.id));

  useEffect(()=>{
    const stats=JSON.parse(localStorage.getItem(`user_${user.email}_stats`)||'{}');
    setUserStats({booksRead:stats.booksRead||0,reviewsGiven:stats.reviewsGiven||0,postsCreated:stats.postsCreated||0,crewsJoined:stats.crewsJoined||0});
    setMyBooks(JSON.parse(localStorage.getItem(`user_${user.email}_booksRead`)||'[]'));
    const photo=getUserPhoto(user.email);
    if(photo) setProfilePhoto(photo);
  },[user.email]);

  const handleImageUpload=e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const imgData=ev.target.result;
      setProfilePhoto(imgData);
      // Store in global photo map so ALL components can see it
      setUserPhoto(user.email, imgData);
      localStorage.setItem(`user_${user.email}_profile_image`, imgData);
      const users=JSON.parse(localStorage.getItem('users')||'[]');
      localStorage.setItem('users', JSON.stringify(users.map(u=>u.email===user.email?{...u,profileImage:imgData}:u)));
      const cu=JSON.parse(localStorage.getItem('currentUser')||'{}');
      localStorage.setItem('currentUser', JSON.stringify({...cu,profileImage:imgData}));
      onUpdateUser?.({...user,profileImage:imgData});
      // Force re-render across app by dispatching storage event
      window.dispatchEvent(new StorageEvent('storage',{key:PHOTO_MAP_KEY}));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveGoal=()=>{
    const updatedUser={...user,readingGoal:editGoal};
    localStorage.setItem('currentUser',JSON.stringify(updatedUser));
    setReadingGoal(editGoal); setShowEditGoal(false); onUpdateUser?.(updatedUser);
  };

  const handleSaveProfile=()=>{
    const updatedUser={...user,name:editName,bio:editBio};
    localStorage.setItem('currentUser',JSON.stringify(updatedUser));
    const users=JSON.parse(localStorage.getItem('users')||'[]');
    localStorage.setItem('users', JSON.stringify(users.map(u=>u.email===user.email?updatedUser:u)));
    onUpdateUser?.(updatedUser); setEditingProfile(false);
  };

  const handleAddBook=()=>{
    if(!newBook.title){alert('Enter book title');return;}
    const book={id:Date.now(),...newBook,addedAt:new Date().toISOString()};
    const updated=[book,...myBooks]; setMyBooks(updated);
    localStorage.setItem(`user_${user.email}_booksRead`, JSON.stringify(updated));
    const stats=JSON.parse(localStorage.getItem(`user_${user.email}_stats`)||'{}');
    stats.booksRead=updated.length; localStorage.setItem(`user_${user.email}_stats`,JSON.stringify(stats));
    setUserStats(prev=>({...prev,booksRead:updated.length}));
    setNewBook({title:'',author:'',rating:5,notes:''}); setShowAddBook(false);
  };

  const tabs=['Posts','Reviews','Books Read','Crews','Saved Posts'];

  return (
    <div className="pb-24 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2"><div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-md flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-white"/></div><span className="font-bold" style={{fontFamily:'Georgia,serif'}}>Profile</span></div>
        <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-lg"><LogOut className="w-5 h-5 text-gray-600"/></button>
      </div>
      <div className="px-4 py-5">
        <div className="flex items-start gap-4 mb-5">
          <div className="relative flex-shrink-0">
            {profilePhoto
              ?<img src={profilePhoto} alt={user?.name} className="w-20 h-20 rounded-full object-cover border-2 border-orange-200"/>
              :<div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">{user?.name?.slice(0,2).toUpperCase()}</div>
            }
            <button onClick={()=>fileRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow"><Camera className="w-3.5 h-3.5 text-white"/></button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
          </div>
          <div className="flex-1 min-w-0">
            {editingProfile?(
              <div className="space-y-2">
                <input value={editName} onChange={e=>setEditName(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Your name"/>
                <input value={editBio} onChange={e=>setEditBio(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Your bio..."/>
                <div className="flex gap-2"><button onClick={handleSaveProfile} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">Save</button><button onClick={()=>setEditingProfile(false)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button></div>
              </div>
            ):(
              <>
                <h2 className="text-xl font-bold text-gray-900 truncate">{user?.name}</h2>
                <p className="text-sm text-gray-500">@{user?.name?.toLowerCase().replace(/\s/g,'')}</p>
                <p className="text-sm text-gray-600 mt-1 italic">"{user?.bio||'Reading is my superpower'}"</p>
                <div className="flex gap-4 mt-2">
                  <div className="text-center"><p className="font-bold text-gray-900">{followers?.length||0}</p><p className="text-xs text-gray-500">Followers</p></div>
                  <div className="text-center"><p className="font-bold text-gray-900">{following?.length||0}</p><p className="text-xs text-gray-500">Following</p></div>
                </div>
                <button onClick={()=>setEditingProfile(true)} className="mt-3 px-4 py-1.5 border border-orange-200 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 flex items-center gap-1.5"><Edit className="w-3.5 h-3.5"/>Edit Profile</button>
              </>
            )}
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100 mb-5">
          <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Target className="w-4 h-4 text-orange-500"/><h3 className="font-semibold">Reading Goal {new Date().getFullYear()}</h3></div><button onClick={()=>setShowEditGoal(!showEditGoal)} className="text-sm text-orange-500 font-medium">{showEditGoal?'Cancel':'Edit'}</button></div>
          {showEditGoal?(
            <div className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 mb-1 block">Yearly Goal</label><input type="number" value={editGoal.yearly} onChange={e=>setEditGoal({...editGoal,yearly:parseInt(e.target.value)||0})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm"/></div>
                <div><label className="text-xs text-gray-600 mb-1 block">Monthly Goal</label><input type="number" value={editGoal.monthly} onChange={e=>setEditGoal({...editGoal,monthly:parseInt(e.target.value)||0})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none text-sm"/></div>
              </div>
              <button onClick={handleSaveGoal} className="w-full py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">Save Goal</button>
            </div>
          ):(
            <>
              <div className="flex items-center justify-between text-sm mb-1"><span className="text-gray-600">Progress</span><span className="font-semibold">{readingGoal.yearly>0?`${userStats.booksRead}/${readingGoal.yearly} books`:'No goal set'}</span></div>
              {readingGoal.yearly>0&&<div className="h-2 bg-orange-200 rounded-full overflow-hidden"><div className="h-full bg-orange-500 rounded-full" style={{width:`${Math.min((userStats.booksRead/readingGoal.yearly)*100,100)}%`}}/></div>}
            </>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2 bg-white rounded-xl p-3 border border-gray-200 mb-5">
          {[{label:'Books',value:userStats.booksRead,icon:BookOpen,color:'text-blue-600'},{label:'Reviews',value:userStats.reviewsGiven,icon:Star,color:'text-purple-600'},{label:'Posts',value:userStats.postsCreated,icon:Edit3,color:'text-green-600'},{label:'Crews',value:userStats.crewsJoined,icon:Users,color:'text-orange-600'}].map(({label,value,icon:Icon,color},idx)=>(
            <div key={idx} className="text-center"><Icon className={`w-5 h-5 ${color} mx-auto mb-1`}/><p className="text-lg font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
          ))}
        </div>
        <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">{tabs.map(tab=><button key={tab} onClick={()=>setActiveTab(tab)} className={`flex-shrink-0 text-sm pb-2.5 px-3 font-medium border-b-2 transition ${activeTab===tab?'text-orange-500 border-orange-500':'text-gray-500 border-transparent'}`}>{tab}</button>)}</div>
        {activeTab==='Posts'&&(myPosts.length===0?<div className="text-center py-8"><Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No posts yet</p><button onClick={()=>setPage('post')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Create First Post</button></div>:myPosts.map(post=>(
          <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-3">
            <p className="text-sm text-gray-700 mb-2">{post.content}</p>
            {post.bookName&&<p className="text-xs text-orange-500">📖 {post.bookName}</p>}
            {post.image&&<img src={post.image} alt="" className="w-full rounded-xl mt-2"/>}
            <div className="flex items-center gap-4 pt-2 border-t border-gray-100 mt-2 text-xs text-gray-400"><span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5"/>{post.likes||0}</span><span>{new Date(post.createdAt).toLocaleDateString()}</span></div>
          </div>
        )))}
        {activeTab==='Reviews'&&(myReviews.length===0?<div className="text-center py-8"><Star className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No reviews yet</p><button onClick={()=>setPage('reviews')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Write a Review</button></div>:myReviews.map(review=>(
          <div key={review.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-3">
            <div className="flex items-start gap-3 mb-2"><DynamicBookCover title={review.bookName} author={review.author} size="sm"/><div className="flex-1"><h3 className="font-semibold text-sm">{review.bookName}</h3><p className="text-xs text-gray-500">by {review.author}</p><StarRating rating={review.rating} size="xs"/></div></div>
            <p className="text-sm text-gray-700">{review.review}</p>
          </div>
        )))}
        {activeTab==='Books Read'&&(
          <div>
            <div className="flex items-center justify-between mb-3"><p className="text-sm font-semibold text-gray-700">{myBooks.length} books read</p><button onClick={()=>setShowAddBook(!showAddBook)} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium"><Plus className="w-4 h-4"/>{showAddBook?'Cancel':'Add Book'}</button></div>
            {showAddBook&&(
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
                {newBook.title&&<div className="flex justify-center mb-3"><DynamicBookCover title={newBook.title} author={newBook.author} size="md"/></div>}
                <div className="space-y-3">
                  <input value={newBook.title} onChange={e=>setNewBook({...newBook,title:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Book title *"/>
                  <input value={newBook.author} onChange={e=>setNewBook({...newBook,author:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300" placeholder="Author"/>
                  <div><label className="text-xs text-gray-600 mb-1 block">Rating</label><StarRating rating={newBook.rating} onChange={r=>setNewBook({...newBook,rating:r})} size="md"/></div>
                  <textarea value={newBook.notes} onChange={e=>setNewBook({...newBook,notes:e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300 resize-none" placeholder="Notes (optional)" rows={2}/>
                  <button onClick={handleAddBook} className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium">Add to My Books</button>
                </div>
              </div>
            )}
            {myBooks.length===0?<div className="text-center py-8"><BookMarked className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500 text-sm">No books tracked yet</p></div>:myBooks.map(book=>(
              <div key={book.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-start gap-3 mb-3">
                <DynamicBookCover title={book.title} author={book.author} size="sm"/>
                <div className="flex-1 min-w-0"><h3 className="font-semibold text-sm">{book.title}</h3><p className="text-xs text-gray-500">{book.author}</p><StarRating rating={book.rating} size="xs"/>{book.notes&&<p className="text-xs text-gray-600 mt-1 italic">"{book.notes}"</p>}<p className="text-xs text-gray-400 mt-1">{new Date(book.addedAt).toLocaleDateString()}</p></div>
                <button onClick={()=>{const u=myBooks.filter(b=>b.id!==book.id);setMyBooks(u);localStorage.setItem(`user_${user.email}_booksRead`,JSON.stringify(u));const s=JSON.parse(localStorage.getItem(`user_${user.email}_stats`)||'{}');s.booksRead=u.length;localStorage.setItem(`user_${user.email}_stats`,JSON.stringify(s));setUserStats(p=>({...p,booksRead:u.length}));}} className="p-1 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400"/></button>
              </div>
            ))}
          </div>
        )}
        {activeTab==='Crews'&&<div className="text-center py-8"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3"/><button onClick={()=>setPage('crews')} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">View My Crews</button></div>}
        {activeTab==='Saved Posts'&&(savedPostsList.length===0?<div className="text-center py-8"><Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No saved posts yet</p></div>:savedPostsList.map(post=>(
          <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-3">
            <p className="text-sm text-gray-700 mb-2">{post.content}</p>
            {post.bookName&&<p className="text-xs text-orange-500">📖 {post.bookName}</p>}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
              <span className="text-xs text-gray-400">by {post.userName}</span>
              <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        )))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn,setIsLoggedIn]=useState(false);
  const [currentUser,setCurrentUser]=useState(null);
  const [currentPage,setCurrentPage]=useState('home');
  const [showBottomNav,setShowBottomNav]=useState(true);
  const [posts,setPosts]=useState([]);
  const [crews,setCrews]=useState([
    {id:1,name:'Atomic Habits',author:'James Clear',genre:'Self Improvement',members:1,chats:0,createdBy:'system',createdByName:'ReadCrew',createdAt:new Date().toISOString()},
    {id:2,name:'Tuesdays with Morrie',author:'Mitch Albom',genre:'Inspiration',members:1,chats:0,createdBy:'system',createdByName:'ReadCrew',createdAt:new Date().toISOString()},
    {id:3,name:'The Alchemist',author:'Paulo Coelho',genre:'Fiction',members:1,chats:0,createdBy:'system',createdByName:'ReadCrew',createdAt:new Date().toISOString()},
  ]);
  const [savedPosts,setSavedPosts]=useState([]);
  const [following,setFollowing]=useState([]);
  const [followers,setFollowers]=useState([]);
  const [blockedUsers,setBlockedUsers]=useState([]);
  const [unreadMessages,setUnreadMessages]=useState(0);
  const [currentToast,setCurrentToast]=useState(null);
  const [selectedUserProfile,setSelectedUserProfile]=useState(null);
  const [showUserProfile,setShowUserProfile]=useState(false);
  const [viewingFullProfile,setViewingFullProfile]=useState(null);
  // Photo map state to trigger re-renders when photo changes
  const [photoVersion,setPhotoVersion]=useState(0);

  useEffect(()=>{
    if(currentPage==='post'||viewingFullProfile) setShowBottomNav(false);
    else setShowBottomNav(true);
  },[currentPage,viewingFullProfile]);

  useEffect(()=>{
    const storedUser=localStorage.getItem('currentUser');
    if(storedUser){
      const user=JSON.parse(storedUser);
      setCurrentUser(user); setIsLoggedIn(true);
      setFollowing(JSON.parse(localStorage.getItem(`user_${user.email}_following`)||'[]'));
      setFollowers(JSON.parse(localStorage.getItem(`user_${user.email}_followers`)||'[]'));
      setBlockedUsers(JSON.parse(localStorage.getItem(`user_${user.email}_blocked`)||'[]'));
      setSavedPosts(JSON.parse(localStorage.getItem(`user_${user.email}_savedPosts`)||'[]'));
      // Load photo into global map on startup
      const photo=localStorage.getItem(`user_${user.email}_profile_image`);
      if(photo) setUserPhoto(user.email, photo);
    }
    // Migrate old posts to new global key
    const oldPosts=JSON.parse(localStorage.getItem('allPosts')||'[]');
    const newPosts=getAllPosts();
    if(oldPosts.length>0&&newPosts.length===0){
      saveAllPosts(oldPosts);
    }
    setPosts(getAllPosts());
    // Migrate old crews
    const oldCrews=JSON.parse(localStorage.getItem('crews')||'[]');
    const newCrews=getAllCrews();
    if(oldCrews.length>0&&newCrews.length===0){ saveAllCrews(oldCrews); }
    // Migrate old reviews
    const oldReviews=JSON.parse(localStorage.getItem('reviews')||'[]');
    const newReviews=getAllReviews();
    if(oldReviews.length>0&&newReviews.length===0){ saveAllReviews(oldReviews); }

    // Listen for photo map changes
    const onStorage=e=>{
      if(e.key===PHOTO_MAP_KEY) setPhotoVersion(v=>v+1);
    };
    window.addEventListener('storage',onStorage);
    return ()=>window.removeEventListener('storage',onStorage);
  },[]);

  const checkNotifications=useCallback(()=>{
    if(!currentUser) return;
    const notifs=JSON.parse(localStorage.getItem(`user_${currentUser.email}_notifications`)||'[]');
    const count=notifs.filter(n=>!n.read).length;
    setUnreadMessages(count);
    const latest=notifs.find(n=>!n.read);
    if(latest&&!currentToast) setCurrentToast(latest);
  },[currentUser,currentToast]);

  useEffect(()=>{
    if(!currentUser) return;
    checkNotifications();
    const iv=setInterval(checkNotifications,30000);
    const onStorage=e=>{ if(e.key?.includes('_notifications')) checkNotifications(); };
    window.addEventListener('storage',onStorage);
    return ()=>{ clearInterval(iv); window.removeEventListener('storage',onStorage); };
  },[currentUser,checkNotifications]);

  const handleLogin=userData=>{
    setCurrentUser(userData); setIsLoggedIn(true);
    localStorage.setItem('currentUser',JSON.stringify(userData));
    ['following','followers','blocked'].forEach(k=>{ if(!localStorage.getItem(`user_${userData.email}_${k}`)) localStorage.setItem(`user_${userData.email}_${k}`,'[]'); });
    if(!localStorage.getItem(`user_${userData.email}_stats`)) localStorage.setItem(`user_${userData.email}_stats`,JSON.stringify({booksRead:0,reviewsGiven:0,postsCreated:0,crewsJoined:0}));
    // Load existing photo
    const photo=localStorage.getItem(`user_${userData.email}_profile_image`);
    if(photo) setUserPhoto(userData.email, photo);
    setCurrentPage('home');
  };

  const handleLogout=()=>{setIsLoggedIn(false);setCurrentUser(null);setCurrentPage('home');localStorage.removeItem('currentUser');};

  const handleUpdateUser=updatedUser=>{setCurrentUser(updatedUser);localStorage.setItem('currentUser',JSON.stringify(updatedUser));};

  const handlePost=postData=>{
    const all=getAllPosts();
    const newPost={...postData,id:postData.id||Date.now(),createdAt:postData.createdAt||new Date().toISOString(),likes:postData.likes||0,comments:0,shares:0,reshareCount:postData.reshareCount||0};
    all.unshift(newPost); saveAllPosts(all); setPosts([...all]);
    const stats=JSON.parse(localStorage.getItem(`user_${currentUser.email}_stats`)||'{}');
    stats.postsCreated=(stats.postsCreated||0)+1;
    localStorage.setItem(`user_${currentUser.email}_stats`,JSON.stringify(stats));
    handleUpdateUser({...currentUser,stats});
  };

  const handleDeletePost=post=>{
    const filtered=getAllPosts().filter(p=>p.id!==post.id);
    saveAllPosts(filtered); setPosts([...filtered]);
    const stats=JSON.parse(localStorage.getItem(`user_${currentUser.email}_stats`)||'{}');
    stats.postsCreated=Math.max((stats.postsCreated||0)-1,0);
    localStorage.setItem(`user_${currentUser.email}_stats`,JSON.stringify(stats));
  };

  const handleSavePost=post=>{
    const saved=JSON.parse(localStorage.getItem(`user_${currentUser.email}_savedPosts`)||'[]');
    const updated=saved.includes(post.id)?saved.filter(id=>id!==post.id):[...saved,post.id];
    localStorage.setItem(`user_${currentUser.email}_savedPosts`,JSON.stringify(updated));
    setSavedPosts(updated);
  };

  const handleReshare=(originalPost,comment)=>{
    const all=getAllPosts();
    saveAllPosts(all.map(p=>p.id===originalPost.id?{...p,reshareCount:(p.reshareCount||0)+1}:p));
    if(originalPost.userEmail!==currentUser.email){
      const notif={id:Date.now(),type:'reshare',fromUser:currentUser.name,message:`${currentUser.name} reshared your post`,timestamp:new Date().toISOString(),read:false};
      const notifs=JSON.parse(localStorage.getItem(`user_${originalPost.userEmail}_notifications`)||'[]');
      notifs.unshift(notif); localStorage.setItem(`user_${originalPost.userEmail}_notifications`,JSON.stringify(notifs));
      window.dispatchEvent(new StorageEvent('storage',{key:`user_${originalPost.userEmail}_notifications`}));
      checkNotifications();
    }
    handlePost({content:originalPost.content,bookName:originalPost.bookName,author:originalPost.author,image:originalPost.image,type:'reshare',isReshare:true,originalPost:{id:originalPost.id,userName:originalPost.userName,userEmail:originalPost.userEmail,content:originalPost.content},reshareComment:comment,reshareCount:0});
  };

  const handleFollow=targetEmail=>{
    const curr=JSON.parse(localStorage.getItem(`user_${currentUser.email}_following`)||'[]');
    if(curr.includes(targetEmail)){
      const upd=curr.filter(e=>e!==targetEmail); localStorage.setItem(`user_${currentUser.email}_following`,JSON.stringify(upd)); setFollowing(upd);
      const tf=JSON.parse(localStorage.getItem(`user_${targetEmail}_followers`)||'[]');
      localStorage.setItem(`user_${targetEmail}_followers`,JSON.stringify(tf.filter(e=>e!==currentUser.email)));
    } else {
      curr.push(targetEmail); localStorage.setItem(`user_${currentUser.email}_following`,JSON.stringify(curr)); setFollowing(curr);
      const tf=JSON.parse(localStorage.getItem(`user_${targetEmail}_followers`)||'[]');
      if(!tf.includes(currentUser.email)){ tf.push(currentUser.email); localStorage.setItem(`user_${targetEmail}_followers`,JSON.stringify(tf)); }
      const notif={id:Date.now(),type:'follow',fromUser:currentUser.name,message:`${currentUser.name} started following you`,timestamp:new Date().toISOString(),read:false};
      const notifs=JSON.parse(localStorage.getItem(`user_${targetEmail}_notifications`)||'[]');
      notifs.unshift(notif); localStorage.setItem(`user_${targetEmail}_notifications`,JSON.stringify(notifs));
      window.dispatchEvent(new StorageEvent('storage',{key:`user_${targetEmail}_notifications`}));
      checkNotifications();
    }
  };

  const handleBlock=targetEmail=>{
    const curr=JSON.parse(localStorage.getItem(`user_${currentUser.email}_blocked`)||'[]');
    if(curr.includes(targetEmail)){
      const upd=curr.filter(e=>e!==targetEmail); localStorage.setItem(`user_${currentUser.email}_blocked`,JSON.stringify(upd)); setBlockedUsers(upd);
    } else {
      curr.push(targetEmail); localStorage.setItem(`user_${currentUser.email}_blocked`,JSON.stringify(curr)); setBlockedUsers(curr);
      const following2=JSON.parse(localStorage.getItem(`user_${currentUser.email}_following`)||'[]');
      const upd=following2.filter(e=>e!==targetEmail); localStorage.setItem(`user_${currentUser.email}_following`,JSON.stringify(upd)); setFollowing(upd);
    }
  };

  const handleViewUserProfile=(userEmail,userName)=>{ setSelectedUserProfile({email:userEmail,name:userName}); setShowUserProfile(true); };
  const handleViewFullProfile=(userEmail,userName)=>{ setShowUserProfile(false); setSelectedUserProfile(null); setViewingFullProfile({email:userEmail,name:userName}); };

  const filteredPosts=posts.filter(p=>!blockedUsers.includes(p.userEmail));

  if(!isLoggedIn) return <LoginPage onLogin={handleLogin}/>;

  return (
    <div className="flex justify-center min-h-screen bg-gray-200">
      {currentToast&&<NotificationToast notification={currentToast} onClose={()=>setCurrentToast(null)}/>}
      <div className="w-full max-w-md relative bg-white min-h-screen overflow-hidden shadow-xl">
        {showUserProfile&&selectedUserProfile&&(
          <UserProfileModal userEmail={selectedUserProfile.email} userName={selectedUserProfile.name} currentUser={currentUser} onClose={()=>{setShowUserProfile(false);setSelectedUserProfile(null);}} onFollow={handleFollow} isFollowing={following.includes(selectedUserProfile.email)} onBlock={handleBlock} isBlocked={blockedUsers.includes(selectedUserProfile.email)} onViewFullProfile={handleViewFullProfile}/>
        )}
        {viewingFullProfile&&(
          <FullUserProfilePage viewedUserEmail={viewingFullProfile.email} viewedUserName={viewingFullProfile.name} currentUser={currentUser} onBack={()=>setViewingFullProfile(null)} onFollow={handleFollow} isFollowing={following.includes(viewingFullProfile.email)} onBlock={handleBlock} isBlocked={blockedUsers.includes(viewingFullProfile.email)}/>
        )}
        {!viewingFullProfile&&(
          <>
            {currentPage==='home'&&<HomePage user={currentUser} posts={filteredPosts} setPosts={setPosts} crews={getAllCrews().length>0?getAllCrews():crews} setPage={setCurrentPage} updateNotificationCount={checkNotifications} savedPosts={savedPosts} onSavePost={handleSavePost} onResharePost={handleReshare} onDeletePost={handleDeletePost} onFollow={handleFollow} following={following} onBlock={handleBlock} blockedUsers={blockedUsers} onViewUserProfile={handleViewUserProfile}/>}
            {currentPage==='post'&&<PostPage user={currentUser} onPost={handlePost} setPage={setCurrentPage}/>}
            {currentPage==='reviews'&&<ReviewsPage user={currentUser} setPage={setCurrentPage} updateNotificationCount={checkNotifications} onViewUserProfile={handleViewUserProfile}/>}
            {currentPage==='explore'&&<ExplorePage user={currentUser} setPage={setCurrentPage} onCreateCrew={book=>{const nc={id:Date.now(),name:book.title,author:book.author,genre:book.genre||'General',members:1,chats:0,createdBy:currentUser.email,createdByName:currentUser.name,createdAt:new Date().toISOString()};const all=getAllCrews();if(!all.some(c=>c.name===nc.name&&c.author===nc.author)){all.unshift(nc);saveAllCrews(all);}setCurrentPage('crews');}}/>}
            {currentPage==='crews'&&<CrewsPage user={currentUser} crews={getAllCrews().length>0?getAllCrews():crews} setPage={setCurrentPage} updateNotificationCount={checkNotifications} onViewUserProfile={handleViewUserProfile}/>}
            {currentPage==='profile'&&<ProfilePage user={currentUser} posts={filteredPosts} setPage={setCurrentPage} onLogout={handleLogout} onUpdateUser={handleUpdateUser} savedPosts={savedPosts} following={following} followers={followers} onFollow={handleFollow}/>}
            {currentPage==='notifications'&&<NotificationsPage user={currentUser} onClose={()=>{setCurrentPage('home');checkNotifications();}} updateNotificationCount={checkNotifications}/>}
            <BottomNav active={currentPage} setPage={setCurrentPage} unreadCount={unreadMessages} show={showBottomNav}/>
          </>
        )}
      </div>
    </div>
  );
}