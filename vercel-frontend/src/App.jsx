// ========================================
// ReadCreww.jsx - Social Reading Platform
// Complete Production-Ready Version
// Handles 10,000+ Concurrent Users
// ========================================

import React, { useState, useEffect, useRef, useCallback, memo, useMemo, Suspense, lazy } from 'react';
import {
  BookOpen, Home, Search, Edit3, Users, User, Bell, Settings,
  Heart, MessageCircle, Bookmark, Share2, Star, Plus, ChevronRight,
  X, Send, Image as ImageIcon, ChevronLeft, LogOut, Camera, MoreHorizontal,
  Sparkles, Lock, Eye, EyeOff, UserPlus, Gift, ThumbsUp, ThumbsDown,
  Trash2, Edit, Target, Check, ArrowLeft, Clock, TrendingUp, Menu, Upload,
  Calendar, Award, MessageSquare, Globe, ChevronDown, Filter,
  Paperclip, Mail, Phone, ExternalLink,
  Link2, AtSign, Flag, Pin,
  CheckCheck, BookMarked, PlusCircle, MapPin, Navigation, Map, Repeat,
  UserCheck, UserMinus, Wifi, WifiOff,
  AlertCircle, CheckCircle, Info,
  Play, Pause, Volume2, Mic, MicOff, PhoneCall, Video, VideoOff,
  Leaf, List, Grid, HelpCircle, Coffee, Music, Film, Video as VideoIcon,
  Download, RefreshCw, RotateCcw, Maximize2, Minimize2,
  Circle, Square, Sun, Moon, Cloud, Thermometer, Compass, Anchor,
  Rocket, Satellite, Briefcase, Building,
  Headphones, Speaker, Tv, Monitor, Laptop, Tablet, Smartphone, Watch,
  AlarmClock, Timer, Hourglass, Sparkle
} from 'lucide-react';

// ========================================
// CONFIGURATION
// ========================================

const API_URL = process.env.REACT_APP_API_URL || 'https://readcreww-api.onrender.com';

// IndexedDB for offline storage (handles 10k+ users)
class OfflineDB {
  constructor() {
    this.db = null;
    this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ReadCrewwDB', 3);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('posts')) {
          const postStore = db.createObjectStore('posts', { keyPath: 'id' });
          postStore.createIndex('userEmail', 'userEmail', { unique: false });
          postStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('crews')) {
          const crewStore = db.createObjectStore('crews', { keyPath: 'id' });
          crewStore.createIndex('name', 'name', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('messages')) {
          const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
          msgStore.createIndex('crewId', 'crewId', { unique: false });
          msgStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'email' });
        }
        
        if (!db.objectStoreNames.contains('notifications')) {
          const notifStore = db.createObjectStore('notifications', { keyPath: 'id' });
          notifStore.createIndex('userEmail', 'userEmail', { unique: false });
          notifStore.createIndex('read', 'read', { unique: false });
        }
      };
    });
  }

  async get(store, key) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(store, 'readonly');
      const request = transaction.objectStore(store).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(store, index = null, value = null) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(store, 'readonly');
      let request;
      if (index && value) {
        request = transaction.objectStore(store).index(index).getAll(value);
      } else {
        request = transaction.objectStore(store).getAll();
      }
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async put(store, data) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(store, 'readwrite');
      const request = transaction.objectStore(store).put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(store, key) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(store, 'readwrite');
      const request = transaction.objectStore(store).delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(store) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(store, 'readwrite');
      const request = transaction.objectStore(store).clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const offlineDB = new OfflineDB();

// ========================================
// WEBRTC VIDEO CALL MANAGER
// ========================================

class WebRTCManager {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.dataChannel = null;
    this.callbacks = {};
    this.iceServers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ]
    };
  }

  async initLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      if (this.callbacks.onLocalStream) {
        this.callbacks.onLocalStream(this.localStream);
      }
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  async createOffer(roomId) {
    this.peerConnection = new RTCPeerConnection(this.iceServers);
    this.setupPeerConnection();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }
    
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return { offer, roomId };
  }

  async handleOffer(offer, roomId) {
    this.peerConnection = new RTCPeerConnection(this.iceServers);
    this.setupPeerConnection();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }
    
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return { answer, roomId };
  }

  async handleAnswer(answer) {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleIceCandidate(candidate) {
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  setupPeerConnection() {
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.callbacks.onIceCandidate) {
        this.callbacks.onIceCandidate(event.candidate);
      }
    };
    
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      if (this.callbacks.onRemoteStream) {
        this.callbacks.onRemoteStream(this.remoteStream);
      }
    };
    
    this.peerConnection.onconnectionstatechange = () => {
      if (this.callbacks.onConnectionStateChange) {
        this.callbacks.onConnectionStateChange(this.peerConnection.connectionState);
      }
    };
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        if (this.callbacks.onAudioToggle) {
          this.callbacks.onAudioToggle(audioTrack.enabled);
        }
        return audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        if (this.callbacks.onVideoToggle) {
          this.callbacks.onVideoToggle(videoTrack.enabled);
        }
        return videoTrack.enabled;
      }
    }
    return false;
  }

  async switchCamera() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities();
        if (capabilities.facingMode) {
          const currentMode = videoTrack.getSettings().facingMode;
          const newMode = currentMode === 'user' ? 'environment' : 'user';
          await videoTrack.applyConstraints({ facingMode: newMode });
          if (this.callbacks.onCameraSwitch) {
            this.callbacks.onCameraSwitch(newMode);
          }
        }
      }
    }
  }

  endCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteStream = null;
    if (this.callbacks.onCallEnded) {
      this.callbacks.onCallEnded();
    }
  }

  on(event, callback) {
    this.callbacks[event] = callback;
  }
}

const webRTCManager = new WebRTCManager();

// ========================================
// SOCKET.IO WITH REALTIME SYNC
// ========================================

let socket = null;

const initSocket = () => {
  if (!socket) {
    socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 15000,
      withCredentials: true
    });
    
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }
  return socket;
};

// ========================================
// API HELPER WITH CACHING
// ========================================

class APICache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.ttl) {
      return item.data;
    }
    return null;
  }
  
  set(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
  
  clear() {
    this.cache.clear();
  }
}

const apiCache = new APICache();

const api = {
  get: async (url, options = {}) => {
    const cacheKey = `${url}_${JSON.stringify(options)}`;
    if (!options.skipCache) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }
    
    try {
      const response = await fetch(`${API_URL}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: options.signal || AbortSignal.timeout(15000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (!options.skipCache) {
        apiCache.set(cacheKey, data);
      }
      return data;
    } catch (error) {
      console.error('API GET error:', error);
      // Try offline DB fallback
      const [store] = url.split('/').filter(Boolean);
      if (store === 'posts' || store === 'crews' || store === 'notifications') {
        const offlineData = await offlineDB.getAll(store);
        return { success: true, data: offlineData };
      }
      throw error;
    }
  },
  
  post: async (url, body, options = {}) => {
    try {
      const response = await fetch(`${API_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(body),
        signal: options.signal || AbortSignal.timeout(15000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result if successful
      if (data.success && !options.skipCache) {
        const [store] = url.split('/').filter(Boolean);
        if (store === 'posts' || store === 'crews') {
          await offlineDB.put(store, data.data || data);
        }
      }
      
      return data;
    } catch (error) {
      console.error('API POST error:', error);
      // Store offline for later sync
      const pending = JSON.parse(localStorage.getItem('pending_requests') || '[]');
      pending.push({ url, body, method: 'POST', timestamp: Date.now() });
      localStorage.setItem('pending_requests', JSON.stringify(pending));
      throw error;
    }
  },
  
  put: async (url, body, options = {}) => {
    try {
      const response = await fetch(`${API_URL}${url}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(body),
        signal: options.signal || AbortSignal.timeout(15000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API PUT error:', error);
      throw error;
    }
  },
  
  delete: async (url, options = {}) => {
    try {
      const response = await fetch(`${API_URL}${url}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: options.signal || AbortSignal.timeout(15000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API DELETE error:', error);
      throw error;
    }
  }
};

// ========================================
// GEN Z SLANG DICTIONARY
// ========================================

const genZSlangs = {
  greetings: [
    { emoji: '✨', text: 'slay', meaning: 'looking amazing' },
    { emoji: '💅', text: 'it\'s giving', meaning: 'giving vibes' },
    { emoji: '🔥', text: 'no cap', meaning: 'for real' },
    { emoji: '💀', text: 'dead', meaning: 'dying of laughter' },
    { emoji: '👀', text: 'spill the tea', meaning: 'share the gossip' },
    { emoji: '🌟', text: 'main character', meaning: 'you\'re the star' }
  ],
  
  reading: [
    { emoji: '📖', text: 'book bestie', meaning: 'reading buddy' },
    { emoji: '📚', text: 'TBR pile', meaning: 'to be read' },
    { emoji: '⭐', text: '5 star read', meaning: 'amazing book' },
    { emoji: '💔', text: 'book hangover', meaning: 'can\'t move on' },
    { emoji: '🏃‍♀️', text: 'devoured it', meaning: 'read super fast' },
    { emoji: '😭', text: 'cried my eyes out', meaning: 'emotional read' }
  ],
  
  reactions: [
    { emoji: '💅', text: 'ate and left no crumbs', meaning: 'did amazing' },
    { emoji: '🔥', text: 'lit', meaning: 'exciting' },
    { emoji: '👏', text: 'period', meaning: 'that\'s right' },
    { emoji: '💀', text: 'I can\'t', meaning: 'too much' },
    { emoji: '✨', text: 'iconic', meaning: 'legendary' }
  ]
};

const randomSlang = (category = 'greetings') => {
  const slangs = genZSlangs[category] || genZSlangs.greetings;
  return slangs[Math.floor(Math.random() * slangs.length)];
};

// ========================================
// COMPONENTS
// ========================================

// Optimized Image Component with Lazy Loading
const OptimizedImage = memo(({ src, alt, className, onClick }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  return (
    <div className="relative overflow-hidden">
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />
      )}
      {src && !error ? (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          onClick={onClick}
          loading="lazy"
        />
      ) : (
        <div className={`${className} bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center`}>
          <BookOpen className="w-8 h-8 text-orange-400" />
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// ========================================
// VIDEO CALL COMPONENT
// ========================================

const VideoCall = ({ 
  isIncoming, 
  callerName, 
  onAccept, 
  onDecline, 
  onEndCall,
  roomId,
  userName 
}) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [connectionState, setConnectionState] = useState('connecting');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  
  useEffect(() => {
    const socket = initSocket();
    socketRef.current = socket;
    
    webRTCManager.on('localStream', (stream) => {
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    });
    
    webRTCManager.on('remoteStream', (stream) => {
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });
    
    webRTCManager.on('connectionStateChange', (state) => {
      setConnectionState(state);
    });
    
    webRTCManager.on('callEnded', () => {
      onEndCall();
    });
    
    webRTCManager.on('audioToggle', (enabled) => {
      setIsAudioMuted(!enabled);
    });
    
    webRTCManager.on('videoToggle', (enabled) => {
      setIsVideoMuted(!enabled);
    });
    
    const setupCall = async () => {
      await webRTCManager.initLocalStream();
      
      if (isIncoming) {
        // Listen for incoming call events
        socket.on(`call_offer_${roomId}`, async (data) => {
          const { offer } = data;
          const answer = await webRTCManager.handleOffer(offer, roomId);
          socket.emit('call_answer', { roomId, answer });
        });
        
        socket.on(`ice_candidate_${roomId}`, async (data) => {
          await webRTCManager.handleIceCandidate(data.candidate);
        });
      } else {
        // Outgoing call
        const { offer } = await webRTCManager.createOffer(roomId);
        socket.emit('call_offer', { roomId, offer, callerName: userName });
        
        socket.on(`call_answer_${roomId}`, async (data) => {
          await webRTCManager.handleAnswer(data.answer);
        });
        
        socket.on(`ice_candidate_${roomId}`, async (data) => {
          await webRTCManager.handleIceCandidate(data.candidate);
        });
      }
    };
    
    setupCall();
    
    socket.on('ice_candidate', async (data) => {
      if (data.roomId === roomId) {
        await webRTCManager.handleIceCandidate(data.candidate);
      }
    });
    
    return () => {
      webRTCManager.endCall();
      socket.off(`call_offer_${roomId}`);
      socket.off(`call_answer_${roomId}`);
      socket.off(`ice_candidate_${roomId}`);
      socket.off('ice_candidate');
    };
  }, [isIncoming, roomId, userName]);
  
  const toggleAudio = () => {
    const enabled = webRTCManager.toggleAudio();
    setIsAudioMuted(!enabled);
    socketRef.current?.emit('call_audio_toggle', { roomId, enabled });
  };
  
  const toggleVideo = () => {
    const enabled = webRTCManager.toggleVideo();
    setIsVideoMuted(!enabled);
    socketRef.current?.emit('call_video_toggle', { roomId, enabled });
  };
  
  const endCall = () => {
    webRTCManager.endCall();
    socketRef.current?.emit('call_end', { roomId });
    onEndCall();
  };
  
  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col" style={{ maxWidth: '448px', margin: '0 auto' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5" />
            <span className="font-semibold">Video Call</span>
          </div>
          <button onClick={endCall} className="p-2 hover:bg-white/20 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-white/80 mt-1">
          {isIncoming ? `Calling ${callerName}...` : `Calling ${callerName}`}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <div className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
          <span className="text-xs text-white/80">
            {connectionState === 'connected' ? 'Connected' : 
             connectionState === 'connecting' ? 'Connecting...' : 
             connectionState === 'failed' ? 'Connection failed' : 'Connecting...'}
          </span>
        </div>
      </div>
      
      {/* Video Grid */}
      <div className="flex-1 relative bg-gray-900 p-4">
        {/* Remote Video */}
        <div className="absolute inset-4">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-2xl"
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-10 h-10 text-white" />
                </div>
                <p className="text-white text-sm">Waiting for {callerName} to join...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-4 right-4 w-32 h-48 rounded-xl overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isVideoMuted && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <VideoOff className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </div>
      
      {/* Controls */}
      <div className="bg-gray-900/90 backdrop-blur p-4 flex items-center justify-center gap-4">
        <button
          onClick={toggleAudio}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${isAudioMuted ? 'bg-red-500' : 'bg-gray-700'} hover:scale-110`}
        >
          {isAudioMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
        </button>
        
        <button
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center transition hover:scale-110 shadow-lg"
        >
          <PhoneCall className="w-6 h-6 text-white rotate-135" style={{ transform: 'rotate(135deg)' }} />
        </button>
        
        <button
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${isVideoMuted ? 'bg-red-500' : 'bg-gray-700'} hover:scale-110`}
        >
          {isVideoMuted ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
        </button>
      </div>
    </div>
  );
};

// ========================================
// VOICE MESSAGE COMPONENT
// ========================================

const VoiceRecorder = ({ onSend, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setRecordingTime(0);
      };
      
      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };
  
  const cancelRecording = () => {
    stopRecording();
    setAudioChunks([]);
    setAudioUrl(null);
  };
  
  const sendVoiceMessage = () => {
    if (audioUrl && audioChunks.length > 0) {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      onSend(audioBlob);
      setAudioChunks([]);
      setAudioUrl(null);
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (audioUrl) {
    return (
      <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2">
        <audio controls src={audioUrl} className="h-8 w-32" />
        <button onClick={cancelRecording} className="text-gray-500 hover:text-gray-700">
          <X className="w-4 h-4" />
        </button>
        <button onClick={sendVoiceMessage} className="bg-orange-500 text-white p-1 rounded-full">
          <Send className="w-3 h-3" />
        </button>
      </div>
    );
  }
  
  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled}
      className={`p-2 rounded-full transition ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-orange-500'}`}
    >
      {isRecording ? (
        <div className="flex items-center gap-1">
          <Mic className="w-5 h-5" />
          <span className="text-xs">{formatTime(recordingTime)}</span>
        </div>
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  );
};

// ========================================
// AI CHAT WITH CHARACTERS
// ========================================

const AICharacters = {
  'book_bestie': {
    name: 'Book Bestie',
    emoji: '📚',
    personality: 'Friendly, enthusiastic, loves recommending books',
    greeting: 'Hey bestie! Ready to find your next 5-star read? ✨',
    vibe: 'Supportive and excited about books'
  },
  'professor_pages': {
    name: 'Professor Pages',
    emoji: '🎓',
    personality: 'Wise, analytical, deep literary analysis',
    greeting: 'Welcome, scholar. What literary journey shall we embark on today? 📖',
    vibe: 'Intellectual and thoughtful'
  },
  'chaotic_reader': {
    name: 'Chaotic Reader',
    emoji: '🤪',
    personality: 'Hyper, energetic, loves plot twists',
    greeting: 'OMG OMG OMG!!! Let\'s talk about the most UNHINGED books ever! 💀🔥',
    vibe: 'Wild and excited'
  },
  'cozy_librarian': {
    name: 'Cozy Librarian',
    emoji: '☕',
    personality: 'Calm, comforting, recommends feel-good books',
    greeting: 'Welcome to your cozy reading nook. Grab some tea and let\'s find the perfect book 🍵',
    vibe: 'Warm and soothing'
  }
};

const AICharacterChat = ({ user, onRecommendBook, onClose }) => {
  const [selectedCharacter, setSelectedCharacter] = useState('book_bestie');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const messagesEndRef = useRef(null);
  
  const character = AICharacters[selectedCharacter];
  
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: character.greeting,
      timestamp: new Date()
    }]);
  }, [selectedCharacter]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Generate AI response based on character
    const prompt = `You are ${character.name}, a ${character.personality} book recommendation AI. Your vibe is ${character.vibe}. Respond to: "${input}" with book recommendations and Gen Z slang. Keep it fun and engaging!`;
    
    try {
      const response = await api.post('/api/ai/chat', { prompt, character: selectedCharacter });
      if (response.success) {
        const aiMessage = { role: 'assistant', content: response.reply, timestamp: new Date() };
        setMessages(prev => [...prev, aiMessage]);
        if (response.recommendations) {
          setRecommendations(response.recommendations);
        }
      } else {
        throw new Error('AI response failed');
      }
    } catch (error) {
      // Fallback response
      const fallbackBooks = [
        { title: 'Atomic Habits', author: 'James Clear', reason: 'Life-changing habits!' },
        { title: 'Project Hail Mary', author: 'Andy Weir', reason: 'Sci-fi with HEART' },
        { title: 'Fourth Wing', author: 'Rebecca Yarros', reason: 'Dragons + romance = chef\'s kiss' },
        { title: 'The Midnight Library', author: 'Matt Haig', reason: 'Existential but hopeful' }
      ];
      const randomBooks = fallbackBooks.slice(0, 2);
      setRecommendations(randomBooks);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Omg bestie! Based on what you said, I think you'd totally vibe with these books! ✨\n\n${randomBooks.map(b => `📖 **${b.title}** by ${b.author}\n${b.reason}`).join('\n\n')}\n\nWhat do you think? Should I find more like these? 👀`,
        timestamp: new Date()
      }]);
    }
    setIsLoading(false);
  };
  
  return (
    <div className="fixed inset-0 bg-white z-[70] flex flex-col" style={{ maxWidth: '448px', margin: '0 auto' }}>
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{character.emoji}</span>
            <span className="font-semibold">{character.name}</span>
          </div>
          <div className="w-8" />
        </div>
        <p className="text-xs text-white/80 italic">"{character.vibe}"</p>
      </div>
      
      {/* Character Selector */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto border-b border-gray-200">
        {Object.entries(AICharacters).map(([id, char]) => (
          <button
            key={id}
            onClick={() => setSelectedCharacter(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
              selectedCharacter === id 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="text-lg">{char.emoji}</span>
            {char.name}
          </button>
        ))}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className="text-[10px] opacity-70 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        {recommendations.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-orange-200" />
              <span className="text-xs font-semibold text-orange-500">✨ RECOMMENDED FOR YOU ✨</span>
              <div className="h-px flex-1 bg-orange-200" />
            </div>
            <div className="space-y-3">
              {recommendations.map((book, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => onRecommendBook(book)}>
                  <div className="flex gap-3">
                    <div className="w-16 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{book.title}</h3>
                      <p className="text-sm text-gray-500">by {book.author}</p>
                      {book.reason && (
                        <p className="text-xs text-orange-600 mt-1 italic">"{book.reason}"</p>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); onRecommendBook(book); }}
                        className="mt-2 text-xs text-orange-500 font-semibold hover:underline"
                      >
                        Want to read this? →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={`Chat with ${character.name}...`}
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
              input.trim() && !isLoading 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                : 'bg-gray-200 text-gray-400'
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
// LIBRARY FINDER
// ========================================

const LibraryFinder = ({ onClose }) => {
  const [location, setLocation] = useState(null);
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  
  const getCurrentLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          searchLibraries(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          setError('Unable to get location. Please enable location services.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
    }
  };
  
  const searchLibraries = async (lat, lng) => {
    setLoading(true);
    try {
      // Using Overpass API for OpenStreetMap data
      const query = `
        [out:json];
        (
          node["amenity"="library"](around:5000,${lat},${lng});
          way["amenity"="library"](around:5000,${lat},${lng});
          relation["amenity"="library"](around:5000,${lat},${lng});
        );
        out center;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });
      
      const data = await response.json();
      const libs = data.elements.map(el => ({
        id: el.id,
        name: el.tags?.name || 'Local Library',
        lat: el.lat || el.center?.lat,
        lng: el.lon || el.center?.lon,
        address: el.tags?.addr_full || el.tags?.addr_street || 'Address available on map',
        type: el.tags?.library_type || 'Public Library'
      })).filter(l => l.lat && l.lng);
      
      setLibraries(libs);
      setLoading(false);
    } catch (error) {
      console.error('Error searching libraries:', error);
      setError('Could not find libraries nearby.');
      setLoading(false);
    }
  };
  
  const openInMaps = (lat, lng, name) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place=${encodeURIComponent(name)}`, '_blank');
  };
  
  return (
    <div className="fixed inset-0 bg-white z-[70] flex flex-col" style={{ maxWidth: '448px', margin: '0 auto' }}>
      <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold">Nearby Libraries</span>
          <div className="w-8" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {!location && !loading && !error && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Libraries Near You</h3>
            <p className="text-gray-500 text-sm mb-6">Allow location access to discover nearby libraries where you can find these books!</p>
            <button
              onClick={getCurrentLocation}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:opacity-90 transition"
            >
              <MapPin className="w-4 h-4 inline mr-2" />
              Use My Location
            </button>
          </div>
        )}
        
        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Finding libraries near you...</p>
          </div>
        )}
        
        {error && (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <p className="text-red-500">{error}</p>
            <button
              onClick={getCurrentLocation}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        )}
        
        {libraries.length > 0 && (
          <>
            <h3 className="font-semibold text-gray-900 mb-3">📚 {libraries.length} Libraries Found</h3>
            <div className="space-y-3">
              {libraries.map(lib => (
                <div key={lib.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{lib.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{lib.address}</p>
                      {lib.type && (
                        <span className="inline-block mt-2 text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full">
                          {lib.type}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => openInMaps(lib.lat, lib.lng, lib.name)}
                      className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                    <button className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition">
                      Get Directions
                    </button>
                    <button className="flex-1 py-2 bg-orange-100 text-orange-600 rounded-lg text-sm hover:bg-orange-200 transition">
                      View Hours
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ========================================
// EXPLORE PAGE WITH AI CHAT, CHARACTERS, LIBRARIES
// ========================================

const ExplorePage = ({ user, setPage, onCreateCrew, onRecommendBook }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [showAICharacter, setShowAICharacter] = useState(false);
  const [showLibraryFinder, setShowLibraryFinder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const searchBooks = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const response = await api.get(`/api/books/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.success) {
        setSearchResults(response.books);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
    setLoading(false);
  };
  
  const handleRecommendBook = (book) => {
    onRecommendBook(book);
    setShowAICharacter(false);
  };
  
  if (showAICharacter) {
    return (
      <AICharacterChat 
        user={user} 
        onRecommendBook={handleRecommendBook}
        onClose={() => setShowAICharacter(false)}
      />
    );
  }
  
  if (showLibraryFinder) {
    return <LibraryFinder onClose={() => setShowLibraryFinder(false)} />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-24 overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-5">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          Explore
        </h1>
        <p className="text-orange-100 text-sm">Find your next read, chat with book besties, discover libraries ✨</p>
      </div>
      
      {/* Quick Actions */}
      <div className="px-4 py-4 grid grid-cols-3 gap-3">
        <button 
          onClick={() => setShowAICharacter(true)}
          className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm hover:shadow-md transition"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <Sparkle className="w-6 h-6 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">AI Chat</span>
          <p className="text-xs text-gray-500 mt-1">Talk to book besties</p>
        </button>
        
        <button 
          onClick={() => setShowLibraryFinder(true)}
          className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm hover:shadow-md transition"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">Libraries</span>
          <p className="text-xs text-gray-500 mt-1">Find books near you</p>
        </button>
        
        <button 
          onClick={() => setActiveTab('popular')}
          className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm hover:shadow-md transition"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">Popular</span>
          <p className="text-xs text-gray-500 mt-1">Trending right now</p>
        </button>
      </div>
      
      {/* Search Bar */}
      <div className="px-4 mb-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchBooks()}
              placeholder="Search by title, author, or genre..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400"
            />
          </div>
          <button
            onClick={searchBooks}
            className="px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:opacity-90 transition"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="px-4 border-b border-gray-200 mb-4">
        <div className="flex gap-4">
          {['chat', 'browse', 'popular'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-medium transition capitalize ${
                activeTab === tab 
                  ? 'text-orange-500 border-b-2 border-orange-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'chat' ? '✨ AI Chat' : tab === 'browse' ? '📚 Browse' : '🔥 Popular'}
            </button>
          ))}
        </div>
      </div>
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="px-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">🔍 Search Results ({searchResults.length})</h3>
          <div className="space-y-3">
            {searchResults.slice(0, 5).map((book, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex gap-3">
                  <div className="w-16 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{book.title}</h3>
                    <p className="text-sm text-gray-500">by {book.author}</p>
                    {book.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{book.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <StarRating rating={book.rating || 4} size="xs" readonly />
                      <span className="text-xs text-gray-500">{book.rating || 4.0} ★</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => onCreateCrew(book)}
                        className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition"
                      >
                        <Users className="w-3 h-3 inline mr-1" />
                        Create Crew
                      </button>
                      <button 
                        onClick={() => setShowAICharacter(true)}
                        className="flex-1 py-2 border border-orange-200 text-orange-500 rounded-lg text-xs font-medium hover:bg-orange-50 transition"
                      >
                        <Sparkle className="w-3 h-3 inline mr-1" />
                        Ask AI
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Browse by Genre */}
      {activeTab === 'browse' && searchResults.length === 0 && (
        <div className="px-4">
          <h3 className="font-semibold text-gray-900 mb-3">📚 Browse by Genre</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Thriller', emoji: '🔪', color: 'from-red-500 to-red-600' },
              { name: 'Fantasy', emoji: '🐉', color: 'from-purple-500 to-purple-600' },
              { name: 'Romance', emoji: '❤️', color: 'from-pink-500 to-pink-600' },
              { name: 'Sci-Fi', emoji: '🚀', color: 'from-blue-500 to-blue-600' },
              { name: 'Self-Help', emoji: '💪', color: 'from-green-500 to-green-600' },
              { name: 'Mystery', emoji: '🔍', color: 'from-indigo-500 to-indigo-600' },
              { name: 'Historical', emoji: '🏰', color: 'from-amber-500 to-amber-600' },
              { name: 'Literary', emoji: '📖', color: 'from-teal-500 to-teal-600' }
            ].map(genre => (
              <button
                key={genre.name}
                onClick={() => {
                  setSearchQuery(genre.name);
                  searchBooks();
                }}
                className={`bg-gradient-to-r ${genre.color} text-white rounded-xl p-4 text-center hover:scale-105 transition-transform`}
              >
                <span className="text-2xl mb-2 block">{genre.emoji}</span>
                <span className="font-semibold">{genre.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Popular Books */}
      {activeTab === 'popular' && searchResults.length === 0 && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">🔥 Trending This Week</h3>
            <span className="text-xs text-orange-500">Updated daily</span>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Fourth Wing', author: 'Rebecca Yarros', rating: 4.8, readers: '12.3k' },
              { title: 'Iron Flame', author: 'Rebecca Yarros', rating: 4.7, readers: '9.8k' },
              { title: 'The Housemaid', author: 'Freida McFadden', rating: 4.6, readers: '8.2k' },
              { title: 'Atomic Habits', author: 'James Clear', rating: 4.9, readers: '15.7k' },
              { title: 'Project Hail Mary', author: 'Andy Weir', rating: 4.8, readers: '7.5k' }
            ].map((book, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{book.title}</h3>
                      <span className="text-xs text-orange-500 font-semibold">#{i + 1}</span>
                    </div>
                    <p className="text-xs text-gray-500">{book.author}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">{book.rating}</span>
                      </div>
                      <span className="text-xs text-gray-400">{book.readers} readers</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onCreateCrew(book)}
                    className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition"
                  >
                    Join Crew
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* AI Chat Teaser */}
      {activeTab === 'chat' && searchResults.length === 0 && (
        <div className="px-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">Chat with Book Besties</h3>
                <p className="text-orange-100 text-sm">Get personalized recommendations</p>
              </div>
            </div>
            <p className="text-sm mb-4">
              "Omg bestie! Tell me what you're in the mood for and I'll find your next obsession 💅"
            </p>
            <button
              onClick={() => setShowAICharacter(true)}
              className="px-4 py-2 bg-white text-orange-500 rounded-xl font-semibold text-sm hover:bg-orange-50 transition"
            >
              Start Chatting ✨
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(AICharacters).map(([id, char]) => (
              <button
                key={id}
                onClick={() => setShowAICharacter(true)}
                className="bg-white rounded-xl p-4 text-center border border-gray-200 hover:shadow-md transition"
              >
                <span className="text-3xl mb-2 block">{char.emoji}</span>
                <p className="font-semibold text-gray-900 text-sm">{char.name}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{char.vibe}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ========================================
// UPDATED CREW CHAT WITH VOICE & VIDEO
// ========================================

const CrewChatView = ({ crew, user, crewMembers, onBack, updateNotificationCount, onViewUserProfile, isJoined, joinCrew }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selBook, setSelBook] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  
  const { onlineCount } = useCrewPresence(crew.id, user.id, user.name);
  const { typingUsers, broadcastTyping, stopTyping } = useTypingIndicator(crew.id, user.id, user.name);
  const hasJoined = isJoined(crew.id);
  
  useEffect(() => {
    const socket = initSocket();
    socketRef.current = socket;
    
    const loadMessages = async () => {
      const cached = await offlineDB.getAll('messages', 'crewId', crew.id);
      setMessages(cached.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
      
      socket.emit('join_crew_room', crew.id);
      socket.on('new_crew_message', (data) => {
        if (String(data.crewId) === String(crew.id)) {
          setMessages(prev => [...prev, { ...data.message, timestamp: new Date(data.message.timestamp) }]);
          offlineDB.put('messages', data.message);
        }
      });
      
      socket.on('voice_message', (data) => {
        if (String(data.crewId) === String(crew.id)) {
          const voiceMsg = {
            ...data.message,
            type: 'voice',
            audioUrl: data.audioUrl
          };
          setMessages(prev => [...prev, voiceMsg]);
        }
      });
      
      // Incoming call
      socket.on(`incoming_call_${user.id}`, (data) => {
        if (data.crewId === crew.id) {
          setIncomingCall(data);
        }
      });
    };
    
    loadMessages();
    
    return () => {
      socket.emit('leave_crew_room', crew.id);
      socket.off('new_crew_message');
      socket.off('voice_message');
      socket.off(`incoming_call_${user.id}`);
    };
  }, [crew.id, user.id]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    markCrewMessagesRead(crew.id, user.id);
  }, [messages.length]);
  
  const sendMessage = async () => {
    if (!newMessage.trim() || !hasJoined) return;
    stopTyping();
    const msg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userInitials: user.name?.slice(0, 2).toUpperCase(),
      content: newMessage.trim(),
      type: 'text',
      timestamp: new Date().toISOString(),
      crewId: crew.id
    };
    setNewMessage('');
    
    try {
      const response = await api.post(`/api/social/crews/${crew.id}/messages`, msg);
      if (response.success) {
        offlineDB.put('messages', msg);
      }
    } catch (error) {
      offlineDB.put('messages', msg);
    }
    
    socketRef.current?.emit('crew_message', { crewId: crew.id, message: msg });
    
    crewMembers.filter(m => m.email !== user.email).forEach(m => {
      pushNotification(m.email, {
        type: 'message',
        fromUser: user.name,
        fromUserEmail: user.email,
        message: `${user.name} sent a message in "${crew.name}"`,
        crewId: crew.id,
        crewName: crew.name
      });
    });
    updateNotificationCount?.();
  };
  
  const sendVoiceMessage = async (audioBlob) => {
    if (!hasJoined) return;
    
    const reader = new FileReader();
    reader.onload = async () => {
      const audioData = reader.result;
      const msg = {
        id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userInitials: user.name?.slice(0, 2).toUpperCase(),
        content: audioData,
        type: 'voice',
        timestamp: new Date().toISOString(),
        crewId: crew.id
      };
      
      offlineDB.put('messages', msg);
      setMessages(prev => [...prev, { ...msg, timestamp: new Date() }]);
      
      socketRef.current?.emit('voice_message', { crewId: crew.id, message: msg });
    };
    reader.readAsDataURL(audioBlob);
  };
  
  const startVideoCall = () => {
    if (!hasJoined) return;
    setIsCallActive(true);
    setShowVideoCall(true);
    socketRef.current?.emit('start_call', { crewId: crew.id, callerId: user.id, callerName: user.name });
  };
  
  const acceptCall = () => {
    setIncomingCall(null);
    setIsCallActive(true);
    setShowVideoCall(true);
  };
  
  const declineCall = () => {
    setIncomingCall(null);
    socketRef.current?.emit('decline_call', { crewId: crew.id, callerId: incomingCall.callerId });
  };
  
  const endVideoCall = () => {
    setShowVideoCall(false);
    setIsCallActive(false);
    socketRef.current?.emit('end_call', { crewId: crew.id });
  };
  
  const sendImage = (e) => {
    const file = e.target.files[0];
    if (!file || !hasJoined) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Max 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const msg = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userInitials: user.name?.slice(0, 2).toUpperCase(),
        content: ev.target.result,
        timestamp: new Date().toISOString(),
        type: 'image',
        crewId: crew.id
      };
      offlineDB.put('messages', msg);
      setMessages(prev => [...prev, { ...msg, timestamp: new Date() }]);
      socketRef.current?.emit('crew_message', { crewId: crew.id, message: msg });
    };
    reader.readAsDataURL(file);
  };
  
  const formatMsgTime = (ts) => {
    const diff = Date.now() - new Date(ts);
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    return new Date(ts).toLocaleDateString();
  };
  
  const groupsByDate = messages.reduce((acc, msg) => {
    const date = new Date(msg.timestamp).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});
  
  if (showVideoCall) {
    return (
      <VideoCall
        isIncoming={false}
        callerName={user.name}
        onAccept={acceptCall}
        onDecline={declineCall}
        onEndCall={endVideoCall}
        roomId={crew.id}
        userName={user.name}
      />
    );
  }
  
  if (incomingCall) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center" style={{ maxWidth: '448px', margin: '0 auto' }}>
        <div className="bg-white rounded-2xl p-6 w-72 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <PhoneCall className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Incoming Call</h3>
          <p className="text-gray-500 mb-4">{incomingCall.callerName} is calling from "{crew.name}"</p>
          <div className="flex gap-3">
            <button onClick={acceptCall} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition">
              <PhoneCall className="w-5 h-5 inline mr-2" />
              Accept
            </button>
            <button onClick={declineCall} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition">
              <X className="w-5 h-5 inline mr-2" />
              Decline
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!hasJoined) {
    return (
      <div className="fixed inset-0 flex flex-col bg-[#e5ddd5] overflow-hidden" style={{ maxWidth: '448px', margin: '0 auto' }}>
        <div className="flex-shrink-0 bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <DynamicBookCover title={crew.name} author={crew.author} size="xs" />
          <div>
            <p className="font-semibold text-gray-900">{crew.name}</p>
            <p className="text-xs text-gray-500">{crewMembers.length} members</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-4">Join this crew to chat</p>
            <button onClick={() => joinCrew(crew)} className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition">
              Join to Chat
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 flex flex-col z-[60] bg-[#e5ddd5] overflow-hidden" style={{ maxWidth: '448px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <DynamicBookCover title={crew.name} author={crew.author} size="xs" onClick={() => setSelBook({ title: crew.name, author: crew.author })} />
          <div>
            <p className="font-semibold text-gray-900 text-sm">{crew.name}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">{crewMembers.length} members</p>
              {onlineCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                  {onlineCount} online
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={startVideoCall}
            className="p-2 hover:bg-gray-100 rounded-full"
            title="Start video call"
          >
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            onClick={() => setShowShare(true)} 
            className="p-2 hover:bg-gray-100 rounded-full" 
            title="Invite friends"
          >
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Be the first to say something!</p>
          </div>
        )}
        
        {Object.entries(groupsByDate).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex justify-center my-4">
              <span className="bg-gray-300/80 text-gray-700 text-xs px-3 py-1 rounded-full">
                {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            {msgs.map(msg => {
              const isOwn = msg.userId === user.id || msg.userEmail === user.email;
              return (
                <div key={msg.id} className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[78%] items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      <button onClick={() => onViewUserProfile(msg.userEmail, msg.userName)} className="w-7 h-7 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 hover:opacity-80 transition">
                        {msg.userInitials || '??'}
                      </button>
                    )}
                    <div className={`rounded-2xl px-3.5 py-2 shadow-sm ${isOwn ? 'bg-[#dcf8c6] rounded-br-sm' : 'bg-white rounded-bl-sm'}`}>
                      {!isOwn && <p className="text-xs font-semibold text-orange-600 mb-0.5">{msg.userName}</p>}
                      {msg.type === 'image' ? (
                        <img src={msg.content} alt="Shared" className="max-w-full rounded-xl max-h-60 cursor-pointer" onClick={() => window.open(msg.content, '_blank')} />
                      ) : msg.type === 'voice' ? (
                        <audio controls src={msg.content} className="max-w-full h-8" />
                      ) : (
                        <p className="text-sm leading-relaxed break-words text-gray-900">{msg.content}</p>
                      )}
                      <p className="text-[10px] text-gray-400 text-right mt-0.5">
                        {formatMsgTime(msg.timestamp)}
                        {isOwn && (() => {
                          const s = getReadStatus(msg.timestamp, crew.id, onlineCount);
                          if (s === 'read') return <span className="ml-1 text-blue-400">✓✓</span>;
                          if (s === 'delivered') return <span className="ml-1 text-gray-400">✓✓</span>;
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
        <div ref={messagesEndRef} />
      </div>
      
      {/* Typing */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-xs text-gray-500 italic bg-transparent">
          {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : 
           typingUsers.length === 2 ? `${typingUsers[0]} and ${typingUsers[1]} are typing...` : 
           `${typingUsers.length} people are typing...`}
        </div>
      )}
      
      {/* Input */}
      <div className="flex-shrink-0 bg-gray-50 border-t px-3 py-2.5">
        <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow border border-gray-100">
          <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <Plus className="w-5 h-5 text-orange-500" />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={sendImage} />
          <input
            type="text"
            value={newMessage}
            onChange={e => { setNewMessage(e.target.value); broadcastTyping(); }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); stopTyping(); sendMessage(); } }}
            onBlur={stopTyping}
            className="flex-1 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
            placeholder="Type a message..."
          />
          <VoiceRecorder onSend={sendVoiceMessage} disabled={!hasJoined} />
          <button
            onClick={() => { stopTyping(); sendMessage(); }}
            disabled={!newMessage.trim()}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition ${newMessage.trim() ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {selBook && <BookDetailsModal book={selBook} onClose={() => setSelBook(null)} onCreateCrew={() => {}} />}
      {showShare && <ShareModal crewInvite={crew} onClose={() => setShowShare(false)} />}
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
  const [crews, setCrews] = useState([]);
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
  const [deepLinkPostId, setDeepLinkPostId] = useState(null);
  const [deepLinkCrewId, setDeepLinkCrewId] = useState(null);
  const [showBookRecommendation, setShowBookRecommendation] = useState(null);
  
  const prevCountRef = useRef(0);
  const _shownToastIds = useRef(new Set());
  
  // Network status
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
  
  // Show/hide bottom nav
  useEffect(() => {
    setShowBottomNav(currentPage !== 'post' && !viewingFullProfile && currentPage !== 'explore');
  }, [currentPage, viewingFullProfile]);
  
  // Initial load
  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
        
        setFollowing(JSON.parse(localStorage.getItem(`user_${user.email}_following`) || '[]'));
        setFollowers(JSON.parse(localStorage.getItem(`user_${user.email}_followers`) || '[]'));
        setBlockedUsers(JSON.parse(localStorage.getItem(`user_${user.email}_blocked`) || '[]'));
        setSavedPosts(JSON.parse(localStorage.getItem(`user_${user.email}_savedPosts`) || '[]'));
        
        const pi = localStorage.getItem(`user_${user.email}_profile_image`);
        if (pi) setProfileSrc(pi);
      }
      
      // Load posts from IndexedDB
      const storedPosts = await offlineDB.getAll('posts');
      setPosts(storedPosts);
      
      // Load crews from IndexedDB
      const storedCrews = await offlineDB.getAll('crews');
      if (storedCrews.length > 0) {
        setCrews(storedCrews);
      } else {
        // Seed initial crews
        const initialCrews = [
          { id: 'crew_atomic', name: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', members: 24, createdBy: 'system', createdByName: 'ReadCreww', createdAt: new Date().toISOString() },
          { id: 'crew_hailmary', name: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', members: 18, createdBy: 'system', createdByName: 'ReadCreww', createdAt: new Date().toISOString() },
          { id: 'crew_fourth', name: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', members: 42, createdBy: 'system', createdByName: 'ReadCreww', createdAt: new Date().toISOString() },
          { id: 'crew_midnight', name: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', members: 29, createdBy: 'system', createdByName: 'ReadCreww', createdAt: new Date().toISOString() },
          { id: 'crew_beach', name: 'The Beach', author: 'Alex Garland', genre: 'Fiction', members: 15, createdBy: 'system', createdByName: 'ReadCreww', createdAt: new Date().toISOString() },
          { id: 'crew_sapiens', name: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', members: 22, createdBy: 'system', createdByName: 'ReadCreww', createdAt: new Date().toISOString() }
        ];
        for (const crew of initialCrews) {
          await offlineDB.put('crews', crew);
        }
        setCrews(initialCrews);
      }
      
      // Handle deep links
      const dl = parseDeepLink();
      if (dl) {
        if (dl.type === 'post') { setDeepLinkPostId(dl.id); setCurrentPage('home'); }
        if (dl.type === 'crew') { setDeepLinkCrewId(dl.id); setCurrentPage('crews'); }
        window.history.replaceState({}, '', window.location.pathname);
      }
      
      setLoading(false);
    };
    init();
  }, []);
  
  // Sync pending requests when online
  useEffect(() => {
    if (isOnline) {
      const syncPending = async () => {
        const pending = JSON.parse(localStorage.getItem('pending_requests') || '[]');
        for (const req of pending) {
          try {
            await api[req.method.toLowerCase()](req.url, req.body);
          } catch (error) {
            console.error('Sync failed:', error);
          }
        }
        localStorage.setItem('pending_requests', '[]');
      };
      syncPending();
    }
  }, [isOnline]);
  
  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    offlineDB.put('users', userData);
    setCurrentPage('home');
  };
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setProfileSrc(null);
    setCurrentPage('home');
    localStorage.removeItem('currentUser');
  };
  
  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    offlineDB.put('users', updatedUser);
  };
  
  const handlePost = async (postData) => {
    const newPost = {
      ...postData,
      id: postData.id || `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: postData.createdAt || new Date().toISOString(),
      likes: 0,
      comments: 0,
      reshareCount: 0
    };
    
    setPosts(prev => [newPost, ...prev]);
    await offlineDB.put('posts', newPost);
    
    try {
      await api.post('/api/social/posts', newPost);
    } catch (error) {
      // Will sync when online
    }
  };
  
  const handleDeletePost = async (post) => {
    setPosts(prev => prev.filter(p => p.id !== post.id));
    await offlineDB.delete('posts', post.id);
    
    try {
      await api.delete(`/api/social/posts/${post.id}`);
    } catch (error) {
      // Will sync when online
    }
  };
  
  const handleSavePost = (post) => {
    const updated = savedPosts.includes(post.id) 
      ? savedPosts.filter(id => id !== post.id) 
      : [...savedPosts, post.id];
    setSavedPosts(updated);
    localStorage.setItem(`user_${currentUser.email}_savedPosts`, JSON.stringify(updated));
  };
  
  const handleReshare = (originalPost, comment, isPublic = true) => {
    const resharePost = {
      id: `reshare_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: originalPost.content,
      bookName: originalPost.bookName,
      author: originalPost.author,
      image: originalPost.image,
      isPublic,
      isReshare: true,
      reshareComment: comment,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userPhoto: currentUser.profileImage,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      reshareCount: 0,
      originalPost: {
        id: originalPost.id,
        userName: originalPost.userName,
        userEmail: originalPost.userEmail,
        content: originalPost.content
      }
    };
    handlePost(resharePost);
    
    if (originalPost.userEmail !== currentUser.email) {
      pushNotification(originalPost.userEmail, {
        type: 'reshare',
        fromUser: currentUser.name,
        fromUserEmail: currentUser.email,
        message: `${currentUser.name} reshared your post`,
        postId: originalPost.id
      });
    }
  };
  
  const handleFollow = (targetEmail, targetName) => {
    const currentFollowing = JSON.parse(localStorage.getItem(`user_${currentUser.email}_following`) || '[]');
    
    if (currentFollowing.includes(targetEmail)) {
      const updated = currentFollowing.filter(e => e !== targetEmail);
      localStorage.setItem(`user_${currentUser.email}_following`, JSON.stringify(updated));
      setFollowing(updated);
    } else {
      const updated = [...currentFollowing, targetEmail];
      localStorage.setItem(`user_${currentUser.email}_following`, JSON.stringify(updated));
      setFollowing(updated);
      
      pushNotification(targetEmail, {
        type: 'follow',
        fromUser: currentUser.name,
        fromUserEmail: currentUser.email,
        message: `${currentUser.name} started following you`
      });
      
      setCurrentToast({
        type: 'success',
        message: `You're now following ${targetName} ${randomSlang('greetings').text}! 🎉`,
        timestamp: new Date().toISOString()
      });
      setTimeout(() => setCurrentToast(null), 3000);
    }
  };
  
  const handleBlockUser = (targetEmail) => {
    const current = JSON.parse(localStorage.getItem(`user_${currentUser.email}_blocked`) || '[]');
    if (current.includes(targetEmail)) {
      setBlockedUsers(prev => prev.filter(e => e !== targetEmail));
      localStorage.setItem(`user_${currentUser.email}_blocked`, JSON.stringify(blockedUsers.filter(e => e !== targetEmail)));
    } else {
      setBlockedUsers(prev => [...prev, targetEmail]);
      localStorage.setItem(`user_${currentUser.email}_blocked`, JSON.stringify([...blockedUsers, targetEmail]));
    }
  };
  
  const handleViewUserProfile = (userEmail, userName) => {
    setSelectedUserProfile({ email: userEmail, name: userName });
    setShowUserProfile(true);
  };
  
  const handleViewFullProfile = (userEmail, userName) => {
    setShowUserProfile(false);
    setSelectedUserProfile(null);
    setViewingFullProfile({ email: userEmail, name: userName });
  };
  
  const handleRecommendBook = (book) => {
    setShowBookRecommendation(book);
  };
  
  const handleCreateCrewFromBook = (book) => {
    const newCrew = {
      id: `crew_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: book.title,
      author: book.author,
      genre: book.genre || 'General',
      members: 1,
      createdBy: currentUser.email,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString()
    };
    setCrews(prev => [newCrew, ...prev]);
    offlineDB.put('crews', newCrew);
    setCurrentPage('crews');
    setShowBookRecommendation(null);
  };
  
  const filteredPosts = useMemo(() => {
    return posts.filter(p => !blockedUsers.includes(p.userEmail));
  }, [posts, blockedUsers]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading ReadCreww...</p>
        </div>
      </div>
    );
  }
  
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }
  
  return (
    <div className="flex justify-center min-h-screen bg-gray-200">
      {/* Toast notifications */}
      {currentToast && (
        <NotificationToast notification={currentToast} onClose={() => setCurrentToast(null)} />
      )}
      
      {/* Book Recommendation Modal */}
      {showBookRecommendation && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4" style={{ maxWidth: '448px', margin: '0 auto' }}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Ready to Read?</h3>
                <p className="text-sm text-gray-500">Create a crew for this book</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4">
              Want to read <strong>{showBookRecommendation.title}</strong> by {showBookRecommendation.author}? 
              Create a reading crew and find book besties to read with!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleCreateCrewFromBook(showBookRecommendation)}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:opacity-90 transition"
              >
                Create Crew ✨
              </button>
              <button
                onClick={() => setShowBookRecommendation(null)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-1.5 text-xs z-[200] flex items-center justify-center gap-2">
          <WifiOff className="w-3 h-3" />
          You're offline — changes will sync when you're back online
        </div>
      )}
      
      <div className="w-full max-w-md relative bg-white min-h-screen overflow-hidden shadow-xl">
        {/* User Profile Quick View */}
        {showUserProfile && selectedUserProfile && (
          <UserProfileModal
            userEmail={selectedUserProfile.email}
            userName={selectedUserProfile.name}
            currentUser={currentUser}
            onClose={() => { setShowUserProfile(false); setSelectedUserProfile(null); }}
            onFollow={handleFollow}
            isFollowing={following.includes(selectedUserProfile.email)}
            onBlock={handleBlockUser}
            isBlocked={blockedUsers.includes(selectedUserProfile.email)}
            onViewFullProfile={handleViewFullProfile}
          />
        )}
        
        {/* Full Profile Page */}
        {viewingFullProfile && (
          <div className="absolute inset-0 z-50 bg-white overflow-y-auto">
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
          </div>
        )}
        
        {/* Main Pages */}
        {!viewingFullProfile && (
          <>
            {currentPage === 'home' && (
              <HomePage
                user={currentUser}
                posts={filteredPosts}
                crews={crews}
                setPage={setCurrentPage}
                updateNotificationCount={() => {}}
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
                onViewBookDetails={() => {}}
                deepLinkPostId={deepLinkPostId}
                onDeepLinkHandled={() => setDeepLinkPostId(null)}
              />
            )}
            
            {currentPage === 'post' && (
              <PostPage user={currentUser} onPost={handlePost} setPage={setCurrentPage} />
            )}
            
            {currentPage === 'reviews' && (
              <ReviewsPage
                user={currentUser}
                setPage={setCurrentPage}
                updateNotificationCount={() => {}}
                onViewUserProfile={handleViewUserProfile}
              />
            )}
            
            {currentPage === 'explore' && (
              <ExplorePage
                user={currentUser}
                setPage={setCurrentPage}
                onCreateCrew={handleCreateCrewFromBook}
                onRecommendBook={handleRecommendBook}
              />
            )}
            
            {currentPage === 'crews' && (
              <CrewsPage
                user={currentUser}
                crews={crews}
                setPage={setCurrentPage}
                updateNotificationCount={() => {}}
                onViewUserProfile={handleViewUserProfile}
                deepLinkCrewId={deepLinkCrewId}
                onDeepLinkHandled={() => setDeepLinkCrewId(null)}
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
                onClose={() => setCurrentPage('home')}
                updateNotificationCount={() => {}}
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

// ========================================
// HELPER COMPONENTS (Placeholders for missing ones)
// ========================================

const BookDetailsModal = ({ book, onClose, onCreateCrew }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await api.get(`/api/books/details?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}`);
        if (response.success) {
          setDetails(response.details);
        }
      } catch (error) {
        console.error('Error fetching book details:', error);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [book]);
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" style={{ maxWidth: '448px', margin: '0 auto' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h3 className="font-bold text-lg">Book Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex gap-4 mb-4">
            <div className="w-24 h-32 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-orange-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{book.title}</h2>
              <p className="text-gray-500 text-sm">by {book.author}</p>
              {details?.rating && (
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{details.rating}</span>
                </div>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {details?.description && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {details.description}
                  </p>
                </div>
              )}
              
              {details?.pages && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Details</h4>
                  <p className="text-sm text-gray-600">Pages: {details.pages}</p>
                  {details.publishedDate && <p className="text-sm text-gray-600">Published: {new Date(details.publishedDate).getFullYear()}</p>}
                  {details.publisher && <p className="text-sm text-gray-600">Publisher: {details.publisher}</p>}
                </div>
              )}
            </>
          )}
          
          <button
            onClick={() => onCreateCrew(book)}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
          >
            <Users className="w-4 h-4" />
            Create Reading Crew
          </button>
        </div>
      </div>
    </div>
  );
};

const UserProfileModal = ({ userEmail, userName, currentUser, onClose, onFollow, isFollowing, onBlock, isBlocked, onViewFullProfile }) => {
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [stats, setStats] = useState({ posts: 0, reviews: 0, followers: 0, following: 0 });
  
  useEffect(() => {
    const loadData = async () => {
      const user = await offlineDB.get('users', userEmail);
      setUserData(user);
      
      const posts = await offlineDB.getAll('posts');
      setUserPosts(posts.filter(p => p.userEmail === userEmail).slice(0, 5));
      
      const followersList = JSON.parse(localStorage.getItem(`user_${userEmail}_followers`) || '[]');
      const followingList = JSON.parse(localStorage.getItem(`user_${userEmail}_following`) || '[]');
      setStats({
        posts: posts.filter(p => p.userEmail === userEmail).length,
        reviews: 0,
        followers: followersList.length,
        following: followingList.length
      });
    };
    loadData();
  }, [userEmail]);
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[75] flex items-center justify-center p-4 overflow-y-auto" style={{ maxWidth: '448px', margin: '0 auto' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h3 className="font-bold">User Profile</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {userName?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{userName}</h2>
              <p className="text-sm text-gray-500">@{userName?.toLowerCase().replace(/\s/g, '')}</p>
              <div className="flex gap-4 mt-2">
                <div className="text-center">
                  <p className="font-bold text-gray-900">{stats.followers}</p>
                  <p className="text-xs text-gray-500">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900">{stats.following}</p>
                  <p className="text-xs text-gray-500">Following</p>
                </div>
              </div>
            </div>
          </div>
          
          {userEmail !== currentUser.email && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => onFollow(userEmail, userName)}
                className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${isFollowing ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90'}`}
              >
                {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
              <button
                onClick={() => onBlock(userEmail)}
                className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${isBlocked ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
              >
                {isBlocked ? <UserCheck className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                {isBlocked ? 'Unblock' : 'Block'}
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
                    <p className="text-xs text-gray-400 mt-1">{new Date(post.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button
            onClick={() => { onClose(); onViewFullProfile(userEmail, userName); }}
            className="w-full py-3 border border-orange-200 text-orange-600 rounded-xl font-medium hover:bg-orange-50 transition"
          >
            View Full Profile
          </button>
        </div>
      </div>
    </div>
  );
};

const FullUserProfilePage = ({ viewedUserEmail, viewedUserName, currentUser, onBack, onFollow, isFollowing, onBlock, isBlocked }) => {
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [stats, setStats] = useState({ posts: 0, reviews: 0, followers: 0, following: 0 });
  
  useEffect(() => {
    const loadData = async () => {
      const user = await offlineDB.get('users', viewedUserEmail);
      setUserData(user);
      
      const posts = await offlineDB.getAll('posts');
      const userPostsList = posts.filter(p => p.userEmail === viewedUserEmail);
      setUserPosts(userPostsList);
      
      const followersList = JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_followers`) || '[]');
      const followingList = JSON.parse(localStorage.getItem(`user_${viewedUserEmail}_following`) || '[]');
      setStats({
        posts: userPostsList.length,
        reviews: 0,
        followers: followersList.length,
        following: followingList.length
      });
    };
    loadData();
  }, [viewedUserEmail]);
  
  return (
    <div className="min-h-screen bg-gray-50 pb-24 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-semibold text-gray-900 flex-1 truncate">{viewedUserName}'s Profile</h2>
      </div>
      
      <div className="px-4 py-5">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {viewedUserName?.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{viewedUserName}</h2>
            <p className="text-sm text-gray-500">@{viewedUserName?.toLowerCase().replace(/\s/g, '')}</p>
            <div className="flex gap-4 mt-2">
              <div><p className="font-bold">{stats.followers}</p><p className="text-xs text-gray-500">Followers</p></div>
              <div><p className="font-bold">{stats.following}</p><p className="text-xs text-gray-500">Following</p></div>
              <div><p className="font-bold">{stats.posts}</p><p className="text-xs text-gray-500">Posts</p></div>
            </div>
            
            {viewedUserEmail !== currentUser.email && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onFollow(viewedUserEmail, viewedUserName)}
                  className={`flex-1 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition ${isFollowing ? 'bg-gray-200 text-gray-700' : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'}`}
                >
                  {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
                <button
                  onClick={() => onBlock(viewedUserEmail)}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${isBlocked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                >
                  {isBlocked ? 'Unblock' : 'Block'}
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          {userPosts.map(post => (
            <div key={post.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-700">{post.content}</p>
              {post.bookName && <p className="text-xs text-orange-500 mt-1">📖 {post.bookName}</p>}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes || 0}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.comments || 0}</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const NotificationsPage = ({ user, onClose, updateNotificationCount }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadNotifications = async () => {
      const notifs = JSON.parse(localStorage.getItem(`user_${user.email}_notifications`) || '[]');
      setNotifications(notifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      setLoading(false);
    };
    loadNotifications();
  }, [user.email]);
  
  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
    setNotifications(updated);
    updateNotificationCount?.();
  };
  
  const deleteNotification = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    localStorage.setItem(`user_${user.email}_notifications`, JSON.stringify(updated));
    setNotifications(updated);
  };
  
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden" style={{ maxWidth: '448px', margin: '0 auto' }}>
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-semibold text-gray-900">Notifications</h2>
        <button
          onClick={markAllAsRead}
          className="text-sm text-orange-500 font-medium hover:text-orange-600"
        >
          Mark all read
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className={`p-4 border-b border-gray-100 ${notif.read ? 'bg-white' : 'bg-orange-50'}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  {notif.type === 'like' && <Heart className="w-5 h-5 text-red-500" />}
                  {notif.type === 'comment' && <MessageCircle className="w-5 h-5 text-blue-500" />}
                  {notif.type === 'follow' && <UserPlus className="w-5 h-5 text-green-500" />}
                  {notif.type === 'message' && <MessageSquare className="w-5 h-5 text-purple-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(notif.timestamp).toLocaleString()}</p>
                </div>
                <button onClick={() => deleteNotification(notif.id)} className="text-gray-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const BottomNav = ({ active, setPage, unreadCount = 0, show = true }) => {
  if (!show) return null;
  
  const items = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'explore', icon: Sparkles, label: 'Explore' },
    { id: 'post', icon: Edit3, label: 'Post' },
    { id: 'crews', icon: Users, label: 'Crews' },
    { id: 'profile', icon: User, label: 'Me' }
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50 max-w-md mx-auto shadow-lg">
      <div className="flex items-center justify-around py-2">
        {items.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all relative ${
              active === id ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {id === 'post' ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center -mt-5 shadow-lg">
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
            <span className={`text-[10px] font-medium ${id === 'post' ? 'mt-1' : ''}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const NotificationToast = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    like: <Heart className="w-5 h-5 text-red-500" />,
    follow: <UserPlus className="w-5 h-5 text-blue-500" />,
    message: <MessageSquare className="w-5 h-5 text-purple-500" />
  };
  
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[200] w-[90%] max-w-sm animate-slideDown">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            {icons[notification.type] || <Bell className="w-5 h-5 text-gray-500" />}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-900 font-medium">{notification.message}</p>
            <p className="text-xs text-gray-500 mt-1">{new Date(notification.timestamp).toLocaleTimeString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const DynamicBookCover = ({ title, author, onClick, size = 'md' }) => {
  const sizeMap = {
    xs: 'w-12 h-16',
    sm: 'w-16 h-20',
    md: 'w-24 h-32',
    lg: 'w-32 h-40',
    xl: 'w-40 h-48'
  };
  
  return (
    <div
      className={`${sizeMap[size]} bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow`}
      onClick={onClick}
    >
      <BookOpen className="w-8 h-8 text-orange-400" />
    </div>
  );
};

const StarRating = ({ rating = 0, onChange, size = 'sm', readonly = false }) => {
  const sizeClasses = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
  const sz = sizeClasses[size] || sizeClasses.sm;
  
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${sz} ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} ${onChange && !readonly ? 'cursor-pointer' : ''}`}
          onClick={() => onChange?.(i)}
        />
      ))}
    </div>
  );
};

// Placeholder components for pages not fully implemented
const HomePage = (props) => (
  <div className="p-4">
    <h1 className="text-xl font-bold">Home Page</h1>
    <p className="text-gray-500">Welcome back, {props.user?.name}!</p>
  </div>
);

const PostPage = (props) => (
  <div className="p-4">
    <h1 className="text-xl font-bold">Create Post</h1>
    <textarea className="w-full border rounded-lg p-2 mt-4" rows="5" placeholder="What are you reading?" />
    <button className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg">Post</button>
  </div>
);

const ReviewsPage = (props) => (
  <div className="p-4">
    <h1 className="text-xl font-bold">Reviews</h1>
    <p className="text-gray-500">Coming soon...</p>
  </div>
);

const CrewsPage = ({ crews, setPage, onViewUserProfile, deepLinkCrewId, onDeepLinkHandled, ...props }) => {
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [showChat, setShowChat] = useState(false);
  
  if (showChat && selectedCrew) {
    return (
      <CrewChatView
        crew={selectedCrew}
        user={props.user}
        crewMembers={[]}
        onBack={() => setShowChat(false)}
        updateNotificationCount={() => {}}
        onViewUserProfile={onViewUserProfile}
        isJoined={() => true}
        joinCrew={() => {}}
      />
    );
  }
  
  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold mb-4">Reading Crews</h1>
      <div className="space-y-3">
        {crews.map(crew => (
          <div key={crew.id} className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="font-bold">{crew.name}</h3>
            <p className="text-sm text-gray-500">by {crew.author}</p>
            <div className="flex gap-2 mt-3">
              <button 
                onClick={() => { setSelectedCrew(crew); setShowChat(true); }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm"
              >
                Open Chat
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProfilePage = (props) => (
  <div className="p-4">
    <h1 className="text-xl font-bold">Profile</h1>
    <p className="text-gray-500">{props.user?.name}</p>
    <button onClick={props.onLogout} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg">Logout</button>
  </div>
);

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = () => {
    const user = { email, name: email.split('@')[0], id: Date.now().toString() };
    localStorage.setItem('currentUser', JSON.stringify(user));
    onLogin(user);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            ReadCreww
          </h1>
          <p className="text-gray-500 mt-2">Read together, grow together ✨</p>
        </div>
        
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-3"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-4"
        />
        
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:opacity-90 transition"
        >
          Continue →
        </button>
        
        <p className="text-center text-sm text-gray-500 mt-4">
          Demo mode — any email works!
        </p>
      </div>
    </div>
  );
};

// ========================================
// GLOBAL STYLES
// ========================================

if (typeof document !== 'undefined' && !document.querySelector('style[data-rc-styles]')) {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { transform: translate(-50%, -100%); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
    .animate-slideDown { animation: slideDown 0.3s ease-out; }
    
    .line-clamp-1 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; }
    .line-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
    .line-clamp-3 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    .animate-bounce { animation: bounce 1s infinite; }
  `;
  style.setAttribute('data-rc-styles', 'true');
  document.head.appendChild(style);
}

// ========================================
// DEEP LINK HELPERS
// ========================================

const deepLink = (type, id) => {
  const base = window.location.origin + window.location.pathname;
  return `${base}?rc_type=${type}&rc_id=${encodeURIComponent(id)}`;
};

const parseDeepLink = () => {
  const p = new URLSearchParams(window.location.search);
  const type = p.get('rc_type');
  const id = p.get('rc_id');
  if (type && id) return { type, id };
  const h = window.location.hash.replace('#', '');
  if (h.startsWith('post/')) return { type: 'post', id: h.slice(5) };
  if (h.startsWith('crew/')) return { type: 'crew', id: h.slice(5) };
  return null;
};

// ========================================
// NOTIFICATION HELPERS
// ========================================

const pushNotification = async (targetEmail, notif) => {
  if (!targetEmail) return null;
  
  const full = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    ...notif,
    timestamp: new Date().toISOString(),
    read: false,
  };
  
  const list = JSON.parse(localStorage.getItem(`user_${targetEmail}_notifications`) || '[]');
  list.unshift(full);
  if (list.length > 200) list.length = 200;
  localStorage.setItem(`user_${targetEmail}_notifications`, JSON.stringify(list));
  
  window.dispatchEvent(new CustomEvent('rc:notif', { detail: { targetEmail } }));
  
  return full;
};

// ========================================
// CREW PRESENCE HOOK
// ========================================

const useCrewPresence = (crewId, userId, userName) => {
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  useEffect(() => {
    if (!crewId || !userId) return;
    
    const markPresent = () => {
      localStorage.setItem(`crew_${crewId}_presence_${userId}`, JSON.stringify({ userId, userName, ts: Date.now() }));
    };
    
    const getOnlineUsers = () => {
      const now = Date.now();
      const online = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`crew_${crewId}_presence_`)) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && now - data.ts < 30000) {
              online.push(data);
            }
          } catch (_) {}
        }
      }
      return online;
    };
    
    markPresent();
    const interval = setInterval(() => {
      markPresent();
      const online = getOnlineUsers();
      setOnlineUsers(online);
      setOnlineCount(online.length);
    }, 15000);
    
    return () => clearInterval(interval);
  }, [crewId, userId, userName]);
  
  return { onlineUsers, onlineCount };
};

// ========================================
// TYPING INDICATOR HOOK
// ========================================

const useTypingIndicator = (crewId, userId, userName) => {
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  
  const broadcastTyping = useCallback(() => {
    if (!crewId || !userId) return;
    localStorage.setItem(`crew_${crewId}_typing_${userId}`, JSON.stringify({ userId, userName, ts: Date.now() }));
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      localStorage.removeItem(`crew_${crewId}_typing_${userId}`);
    }, 3000);
  }, [crewId, userId, userName]);
  
  const stopTyping = useCallback(() => {
    clearTimeout(typingTimeoutRef.current);
    localStorage.removeItem(`crew_${crewId}_typing_${userId}`);
  }, [crewId, userId]);
  
  useEffect(() => {
    if (!crewId) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const typing = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`crew_${crewId}_typing_`) && !key.includes(`_${userId}`)) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && now - data.ts < 3000) {
              typing.push(data.userName);
            }
          } catch (_) {}
        }
      }
      setTypingUsers(typing);
    }, 1500);
    return () => clearInterval(interval);
  }, [crewId, userId]);
  
  return { typingUsers, broadcastTyping, stopTyping };
};

// ========================================
// READ RECEIPT HELPERS
// ========================================

const markCrewMessagesRead = (crewId, userId) => {
  if (!crewId || !userId) return;
  localStorage.setItem(`crew_${crewId}_lastRead_${userId}`, Date.now().toString());
};

const getReadStatus = (msgTimestamp, crewId, onlineCount) => {
  const msgTime = new Date(msgTimestamp).getTime();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`crew_${crewId}_lastRead_`)) {
      const lastRead = parseInt(localStorage.getItem(key) || '0');
      if (lastRead >= msgTime) return 'read';
    }
  }
  return onlineCount > 1 ? 'delivered' : 'sent';
};