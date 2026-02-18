import React, { useState, useEffect, useRef } from 'react';
import { Users, MessageCircle, Send, Image, Video, BookOpen, Sparkles, ChevronLeft, Search, UserPlus, LogOut as Leave, Clock, Check, Book, Star, Heart, Share2, MoreHorizontal } from 'lucide-react';
import io from 'socket.io-client';
import { bookCrewAPI, getBookRecommendations } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

// Parse AI response to extract book suggestions
const parseAIBooksResponse = (text) => {
  const books = [];
  const lines = text.split('\n\n');
  
  for (const line of lines) {
    const titleMatch = line.match(/\*\*(.+?)\s+by\s+(.+?)\*\*/);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      const author = titleMatch[2].trim();
      const description = line.replace(/\*\*.*?\*\*/, '').trim();
      books.push({ title, author, description });
    }
  }
  
  return books;
};

// Avatar Component
const Avatar = ({ initials, size = 'md', color = '#C8956C' }) => {
  const sizes = { 
    xs: 'w-8 h-8 text-xs', 
    sm: 'w-10 h-10 text-sm', 
    md: 'w-12 h-12 text-base', 
    lg: 'w-16 h-16 text-xl' 
  };
  
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
      style={{ backgroundColor: color }}>
      {initials?.slice(0, 2)}
    </div>
  );
};

const ReadCrewPage = ({ currentUser, onBack }) => {
  const [view, setView] = useState('search'); // 'search', 'crews', 'about', 'chat', 'similar'
  const [searchKeywords, setSearchKeywords] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [allCrews, setAllCrews] = useState([]);
  const [myCrews, setMyCrews] = useState([]);
  
  // Chat states
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // About/Similar states
  const [activeTab, setActiveTab] = useState('About');
  const [similarCrews, setSimilarCrews] = useState([]);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize Socket.IO
  useEffect(() => {
    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling']
    });
    
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
    });
    
    newSocket.on('new-message', (message) => {
      console.log('📨 New message received:', message);
      setMessages(prev => [...prev, message]);
    });
    
    newSocket.on('user-typing', (data) => {
      if (data.userName !== currentUser.name) {
        setTypingUsers(prev => [...new Set([...prev, data.userName])]);
      }
    });
    
    newSocket.on('user-stop-typing', (data) => {
      setTypingUsers(prev => prev.filter(u => u !== data.userName));
    });
    
    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });
    
    return () => {
      newSocket.disconnect();
    };
  }, [currentUser.name]);

  // Load crews
  useEffect(() => {
    loadCrews();
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadCrews = async () => {
    try {
      console.log('🔄 Loading crews...');
      const result = await bookCrewAPI.getAll();
      console.log('📚 Crews loaded:', result);
      
      if (result.success) {
        setAllCrews(result.crews);
        setMyCrews(result.crews.filter(c => 
          c.members.some(m => m.userEmail === currentUser.email)
        ));
      }
    } catch (error) {
      console.error('❌ Error loading crews:', error);
    }
  };

  const handleGetSuggestions = async () => {
    if (!searchKeywords.trim()) {
      alert('Please enter what you want to read about');
      return;
    }

    setAiLoading(true);
    setAiSuggestions([]);
    let response = '';

    try {
      await getBookRecommendations(
        searchKeywords,
        (token) => { response += token; },
        () => {
          const books = parseAIBooksResponse(response);
          console.log('📖 AI Suggestions:', books);
          setAiSuggestions(books.slice(0, 10));
          setAiLoading(false);
        }
      );
    } catch (error) {
      console.error('❌ AI suggestion error:', error);
      setAiLoading(false);
      alert('Failed to get suggestions. Please try again.');
    }
  };

  const handleJoinCrew = async (book) => {
    try {
      console.log('🚀 Joining crew:', book.title);
      
      const joinData = {
        bookName: book.title,
        author: book.author,
        userName: currentUser.name,
        userEmail: currentUser.email,
        description: book.description || ''
      };
      
      const result = await bookCrewAPI.join(joinData);

      if (result.success) {
        alert(result.message);
        await loadCrews();
        
        if (!result.alreadyMember) {
          const updatedCrews = await bookCrewAPI.getAll();
          if (updatedCrews.success) {
            const joinedCrew = updatedCrews.crews.find(c => 
              c.bookName.toLowerCase() === book.title.toLowerCase()
            );
            
            if (joinedCrew) {
              handleOpenAbout(joinedCrew);
            }
          }
        } else {
          const crew = allCrews.find(c => c.bookName.toLowerCase() === book.title.toLowerCase());
          if (crew) handleOpenAbout(crew);
        }
      }
    } catch (error) {
      console.error('❌ Error joining crew:', error);
      alert(`Failed to join crew: ${error.message}`);
    }
  };

  const handleOpenAbout = async (crew) => {
    console.log('📖 Opening About page for:', crew.bookName);
    
    setSelectedCrew(crew);
    setView('about');
    
    // Load similar crews based on genre/author
    const similar = allCrews.filter(c => 
      c._id !== crew._id && 
      (c.author === crew.author || c.genre === crew.genre)
    ).slice(0, 3);
    
    setSimilarCrews(similar);
  };

  const handleOpenChat = async (crew) => {
    console.log('💬 Opening chat for:', crew.bookName);
    
    setSelectedCrew(crew);
    setView('chat');
    
    if (socket && socket.connected) {
      socket.emit('join-crew', crew.bookName);
    }
    
    try {
      const result = await bookCrewAPI.getMessages(crew.bookName);
      if (result.success) {
        setMessages(result.messages);
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
    }
  };

  const handleLeaveCrew = async () => {
    if (!confirm(`Are you sure you want to leave ${selectedCrew.bookName} Crew?`)) return;
    
    try {
      await bookCrewAPI.leave(selectedCrew.bookName, currentUser.email);
      
      if (socket && socket.connected) {
        socket.emit('leave-crew', selectedCrew.bookName);
      }
      
      alert('Left the crew');
      await loadCrews();
      setView('crews');
      setSelectedCrew(null);
    } catch (error) {
      console.error('❌ Error leaving crew:', error);
      alert('Failed to leave crew');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    const messageData = {
      bookName: selectedCrew.bookName,
      userName: currentUser.name,
      userEmail: currentUser.email,
      messageType: 'text',
      content: newMessage.trim()
    };
    
    try {
      const result = await bookCrewAPI.sendMessage(messageData);
      
      if (result.success) {
        if (socket && socket.connected) {
          socket.emit('send-message', {
            bookName: selectedCrew.bookName,
            message: result.message
          });
        }
        
        setMessages(prev => [...prev, result.message]);
        setNewMessage('');
        handleStopTyping();
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert(`Failed to send message: ${error.message}`);
    }
  };

  const handleTyping = () => {
    if (!isTyping && socket && socket.connected && selectedCrew) {
      setIsTyping(true);
      socket.emit('typing', {
        bookName: selectedCrew.bookName,
        userName: currentUser.name
      });
    }
    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(handleStopTyping, 3000);
  };

  const handleStopTyping = () => {
    if (isTyping && socket && socket.connected && selectedCrew) {
      setIsTyping(false);
      socket.emit('stop-typing', {
        bookName: selectedCrew.bookName,
        userName: currentUser.name
      });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const messageData = {
        bookName: selectedCrew.bookName,
        userName: currentUser.name,
        userEmail: currentUser.email,
        messageType: file.type.startsWith('video') ? 'video' : 'image',
        content: file.name,
        mediaUrl: reader.result
      };
      
      try {
        const result = await bookCrewAPI.sendMessage(messageData);
        
        if (result.success) {
          if (socket && socket.connected) {
            socket.emit('send-message', {
              bookName: selectedCrew.bookName,
              message: result.message
            });
          }
          
          setMessages(prev => [...prev, result.message]);
        }
      } catch (error) {
        console.error('❌ Error sending media:', error);
        alert('Failed to send media');
      }
    };
    
    reader.readAsDataURL(file);
  };

  // ABOUT PAGE VIEW
  if (view === 'about' && selectedCrew) {
    return (
      <div className="pb-24 bg-[#FAF6F1] min-h-screen">
        {/* Header */}
        <div className="sticky top-0 bg-[#FAF6F1] z-40 px-4 py-3 flex items-center gap-3 border-b border-[#EDE8E3]">
          <button onClick={() => setView('crews')}>
            <ChevronLeft className="w-6 h-6 text-[#6B5D52]" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-16 rounded-lg shadow-md flex items-center justify-center" style={{ backgroundColor: '#C8622A' }}>
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-[#2D2419]">{selectedCrew.bookName}</h1>
              <p className="text-xs text-[#9B8E84]">{selectedCrew.totalMembers} members — currently reading</p>
            </div>
          </div>
          <button><MoreHorizontal className="w-5 h-5 text-[#9B8E84]" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-[#EDE8E3] px-4 bg-white">
          {['Chat', 'About', 'Resources', 'More'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'Chat') handleOpenChat(selectedCrew);
              }}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab 
                  ? 'text-[#C8622A] border-[#C8622A]' 
                  : 'text-[#9B8E84] border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Finished reading prompt */}
          <div className="bg-white rounded-2xl p-4 border border-[#EDE8E3] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium text-[#2D2419]">Finished the book?</span>
              <span className="text-sm text-[#9B8E84]">4.7 ⭐⭐⭐⭐⭐</span>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white rounded-2xl p-5 border border-[#EDE8E3]">
            <h2 className="text-xl font-bold text-[#2D2419] mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              About {selectedCrew.bookName} Crew
            </h2>
            <p className="text-sm text-[#6B5D52] leading-relaxed mb-4">
              {selectedCrew.description || `Welcome to the ${selectedCrew.bookName} Crew! We are a supportive community focused on discussing this amazing book by ${selectedCrew.author}.`}
            </p>

            <h3 className="font-bold text-[#2D2419] mb-2">What we'll do here:</h3>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2 text-sm text-[#6B5D52]">
                <span>💡</span>
                <span>Weekly insights and discussions on key themes</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#6B5D52]">
                <span>📚</span>
                <span>Share personal experiences and takeaways</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#6B5D52]">
                <span>🎯</span>
                <span>Motivate and hold each other accountable with challenges</span>
              </li>
            </ul>

            <div className="border-t border-[#EDE8E3] pt-4">
              <h3 className="font-bold text-[#2D2419] mb-2">Join our reading goals!</h3>
              <div className="bg-[#FAF6F1] rounded-xl p-3">
                <p className="text-sm text-[#6B5D52] mb-2">
                  <strong>Read {selectedCrew.bookName}</strong> by May 31st 🎯
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9B8E84]">154 / 384 reading</span>
                  <button className="px-4 py-1.5 bg-[#C8622A] text-white rounded-lg text-xs font-semibold">
                    I'm in!
                  </button>
                </div>
                <div className="mt-2 h-2 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-[#C8622A] rounded-full" style={{ width: '40%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Crew Leader */}
          <div className="bg-white rounded-2xl p-4 border border-[#EDE8E3]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[#2D2419]">Crew Leader</h3>
              <ChevronLeft className="w-4 h-4 text-[#9B8E84] rotate-180" />
            </div>
            <div className="flex items-center gap-3">
              <Avatar initials="AL" size="md" color="#7B9EA6" />
              <div className="flex-1">
                <p className="font-semibold text-[#2D2419]">Alex</p>
                <p className="text-xs text-[#9B8E84]">Admin</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-[#EDE8E3]">
              <div className="text-center">
                <p className="text-sm font-bold text-[#2D2419]">{selectedCrew.totalMembers}</p>
                <p className="text-xs text-[#9B8E84]">members</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[#2D2419]">563</p>
                <p className="text-xs text-[#9B8E84]">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[#2D2419]">96</p>
                <p className="text-xs text-[#9B8E84]">Reviews</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 py-2 border border-[#EDE8E3] rounded-xl text-sm font-medium text-[#2D2419] flex items-center justify-center gap-1">
                <UserPlus className="w-4 h-4" /> Invite members
              </button>
              <button className="flex-1 py-2 bg-[#C8622A] text-white rounded-xl text-sm font-semibold">
                Invite crew
              </button>
            </div>
          </div>

          {/* Similar Crews */}
          <div className="bg-white rounded-2xl p-4 border border-[#EDE8E3]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[#2D2419]">Similar Crews</h3>
              <button onClick={() => setView('similar')} className="text-xs text-[#C8622A] font-semibold">
                See all
              </button>
            </div>
            {similarCrews.length === 0 ? (
              <p className="text-sm text-[#9B8E84] text-center py-4">No similar crews yet</p>
            ) : (
              <div className="space-y-3">
                {similarCrews.slice(0, 2).map((crew) => (
                  <div key={crew._id} 
                    onClick={() => handleOpenAbout(crew)}
                    className="flex items-center gap-3 p-3 bg-[#FAF6F1] rounded-xl cursor-pointer hover:bg-[#F5EDE3]">
                    <div className="w-10 h-14 rounded-lg shadow-sm flex items-center justify-center" 
                      style={{ backgroundColor: '#8B5E3C' }}>
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#2D2419] text-sm">{crew.bookName}</p>
                      <p className="text-xs text-[#9B8E84]">{crew.totalMembers} members</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinCrew({ title: crew.bookName, author: crew.author });
                      }}
                      className="px-3 py-1.5 bg-[#C8622A] text-white rounded-lg text-xs font-semibold">
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button 
              onClick={() => handleOpenChat(selectedCrew)}
              className="w-full py-3 bg-[#C8622A] text-white rounded-xl font-semibold flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Open Chat
            </button>
            <button onClick={handleLeaveCrew}
              className="w-full py-3 border border-red-200 text-red-500 rounded-xl font-medium flex items-center justify-center gap-2">
              <Leave className="w-4 h-4" />
              Leave Crew
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SIMILAR CREWS VIEW
  if (view === 'similar' && selectedCrew) {
    return (
      <div className="pb-24 bg-[#FAF6F1] min-h-screen">
        <div className="sticky top-0 bg-[#FAF6F1] z-40 px-4 py-3 flex items-center gap-3 border-b border-[#EDE8E3]">
          <button onClick={() => setView('about')}>
            <ChevronLeft className="w-6 h-6 text-[#6B5D52]" />
          </button>
          <h1 className="font-bold text-[#2D2419] text-lg">Similar Crews</h1>
        </div>

        <div className="px-4 py-4">
          <p className="text-sm text-[#9B8E84] mb-4">Explore other groups that share a similar vibe.</p>
          
          <div className="mb-4">
            <div className="flex items-center gap-2 bg-white border border-[#EDE8E3] rounded-xl px-3 py-2.5">
              <Search className="w-4 h-4 text-[#9B8E84]" />
              <input className="flex-1 bg-transparent text-sm text-[#2D2419] placeholder-[#B8AEA8] outline-none"
                placeholder="Search Crews..." />
            </div>
          </div>

          <div className="space-y-3">
            {allCrews.filter(c => c._id !== selectedCrew._id).map((crew) => (
              <div key={crew._id} className="bg-white rounded-2xl p-4 border border-[#EDE8E3]">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-16 rounded-lg shadow-md flex items-center justify-center" 
                    style={{ backgroundColor: '#8B5E3C' }}>
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#2D2419]">{crew.bookName}</h3>
                    <p className="text-xs text-[#9B8E84] mb-2">{crew.totalMembers} members</p>
                    <p className="text-xs text-[#6B5D52] line-clamp-2">
                      {crew.description || `Join the crew reading ${crew.bookName} by ${crew.author}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenAbout(crew)}
                    className="flex-1 py-2 border border-[#EDE8E3] rounded-xl text-sm font-medium text-[#2D2419]">
                    View
                  </button>
                  <button 
                    onClick={() => handleJoinCrew({ title: crew.bookName, author: crew.author })}
                    className="flex-1 py-2 bg-[#C8622A] text-white rounded-xl text-sm font-semibold">
                    Join →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // CHAT VIEW
  if (view === 'chat' && selectedCrew) {
    return (
      <div className="h-screen flex flex-col bg-[#FAF6F1]">
        {/* Chat Header */}
        <div className="bg-white border-b border-[#EDE8E3] px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <button onClick={() => setView('about')} className="text-[#6B5D52]">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 flex-1 mx-3">
            <div className="w-8 h-8 rounded-lg shadow-sm flex items-center justify-center"
              style={{ backgroundColor: '#C8622A' }}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-[#2D2419] text-sm">{selectedCrew.bookName}</p>
              <p className="text-xs text-[#9B8E84]">{selectedCrew.totalMembers} members</p>
            </div>
          </div>
          <button><MoreHorizontal className="w-5 h-5 text-[#9B8E84]" /></button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isOwn = msg.userEmail === currentUser.email;
              const isBot = msg.userEmail === 'bot@readcrew.com';
              
              if (isBot) {
                return (
                  <div key={index} className="flex justify-center">
                    <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm max-w-md text-center">
                      {msg.content}
                    </div>
                  </div>
                );
              }
              
              return (
                <div key={index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    {!isOwn && (
                      <p className="text-xs text-gray-600 mb-1 px-3">{msg.userName}</p>
                    )}
                    
                    <div className={`rounded-2xl px-4 py-3 ${
                      isOwn
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                        : 'bg-white border border-gray-200'
                    }`}>
                      {msg.messageType === 'text' ? (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      ) : msg.messageType === 'image' ? (
                        <div>
                          <img src={msg.mediaUrl} alt={msg.content} className="rounded-lg max-w-full h-auto mb-2" />
                          <p className="text-xs opacity-75">{msg.content}</p>
                        </div>
                      ) : msg.messageType === 'video' ? (
                        <div>
                          <video src={msg.mediaUrl} controls className="rounded-lg max-w-full h-auto mb-2" />
                          <p className="text-xs opacity-75">{msg.content}</p>
                        </div>
                      ) : null}
                    </div>
                    
                    <p className={`text-xs text-gray-500 mt-1 px-3 ${isOwn ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          
          {typingUsers.length > 0 && (
            <div className="text-sm text-gray-500 italic px-3">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-[#EDE8E3] p-4">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload}
              accept="image/*,video/*" className="hidden" />
            
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <Image className="w-5 h-5" />
            </button>
            
            <textarea value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none resize-none"
              rows="1" style={{ maxHeight: '120px' }} />
            
            <button type="submit" disabled={!newMessage.trim()}
              className="p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50">
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // CREWS LIST VIEW (My Crews)
  if (view === 'crews') {
    return (
      <div className="pb-24 bg-[#FAF6F1] min-h-screen">
        <div className="sticky top-0 bg-[#FAF6F1] z-40 px-4 py-3 flex items-center gap-3 border-b border-[#EDE8E3]">
          <button onClick={() => setView('search')}>
            <ChevronLeft className="w-6 h-6 text-[#6B5D52]" />
          </button>
          <h1 className="font-bold text-[#2D2419] text-lg">My Reading Crews</h1>
        </div>

        <div className="px-4 py-4">
          {myCrews.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">You haven't joined any crews yet</p>
              <button onClick={() => setView('search')}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold">
                Find Crews
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myCrews.map((crew) => (
                <div key={crew._id}
                  onClick={() => handleOpenAbout(crew)}
                  className="bg-white rounded-2xl p-4 border border-[#EDE8E3] cursor-pointer hover:shadow-md transition">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-16 rounded-lg shadow-md flex items-center justify-center"
                      style={{ backgroundColor: '#C8622A' }}>
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#2D2419]">{crew.bookName}</h3>
                      <p className="text-xs text-[#9B8E84]">by {crew.author}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="w-3 h-3 text-[#9B8E84]" />
                        <span className="text-xs text-[#9B8E84]">{crew.totalMembers} members</span>
                      </div>
                    </div>
                    <MessageCircle className="w-5 h-5 text-[#C8622A]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // SEARCH VIEW (Default)
  return (
    <div className="pb-24 bg-[#FAF6F1] min-h-screen">
      <div className="sticky top-0 bg-[#FAF6F1] z-40 px-4 py-3 flex items-center justify-between border-b border-[#EDE8E3]">
        <button onClick={onBack} className="flex items-center gap-2 text-[#C8622A] font-semibold">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <button onClick={() => setView('crews')}
          className="px-4 py-2 bg-[#C8622A] text-white rounded-xl text-sm font-semibold">
          My Crews ({myCrews.length})
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold">ReadCrew</h1>
              <p className="text-sm opacity-90">Find books. Join crews. Read together.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#EDE8E3]">
          <h2 className="text-lg font-bold mb-3 text-[#2D2419]">Find Your Reading Crew</h2>
          
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Sparkles className="absolute left-3 top-3.5 text-[#C8622A] w-5 h-5" />
              <input type="text" value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGetSuggestions()}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-[#EDE8E3] focus:border-[#C8622A] focus:outline-none text-sm"
                placeholder="fantasy, self-help, romance..." disabled={aiLoading} />
            </div>
            <button onClick={handleGetSuggestions} disabled={!searchKeywords || aiLoading}
              className="px-6 py-3.5 bg-[#C8622A] text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 text-sm whitespace-nowrap">
              {aiLoading ? 'Loading...' : 'Get Suggestions'}
            </button>
          </div>

          {aiLoading && (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[#9B8E84] text-sm">Finding perfect books for you...</p>
            </div>
          )}

          {aiSuggestions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-[#2D2419]">AI Suggestions:</h3>
              {aiSuggestions.map((book, index) => (
                <div key={index}
                  className="bg-[#FAF6F1] rounded-xl p-4 border border-[#EDE8E3]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-[#2D2419]">{book.title}</h4>
                      <p className="text-xs text-[#9B8E84] mb-2">by {book.author}</p>
                      <p className="text-sm text-[#6B5D52]">{book.description}</p>
                    </div>
                    <button onClick={() => handleJoinCrew(book)}
                      className="px-4 py-2 bg-[#C8622A] text-white rounded-xl text-sm font-semibold whitespace-nowrap">
                      Join Crew
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#EDE8E3]">
          <h2 className="text-lg font-bold mb-3 text-[#2D2419]">🔥 Popular Crews 🔥</h2>
          
          {allCrews.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No crews yet. Be the first to create one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allCrews.map((crew) => (
                <div key={crew._id}
                  className="bg-[#FAF6F1] rounded-xl p-4 border border-[#EDE8E3]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-16 rounded-lg shadow-md flex items-center justify-center"
                      style={{ backgroundColor: '#8B5E3C' }}>
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#2D2419] text-sm">{crew.bookName}</h3>
                      <p className="text-xs text-[#9B8E84]">by {crew.author}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="w-3 h-3 text-[#9B8E84]" />
                        <span className="text-xs text-[#9B8E84]">{crew.totalMembers} members</span>
                      </div>
                    </div>
                    {crew.members.some(m => m.userEmail === currentUser.email) ? (
                      <button onClick={() => handleOpenAbout(crew)}
                        className="px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-semibold">
                        Open
                      </button>
                    ) : (
                      <button onClick={() => handleJoinCrew({ title: crew.bookName, author: crew.author })}
                        className="px-4 py-2 bg-[#C8622A] text-white rounded-xl text-xs font-semibold">
                        Join
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReadCrewPage;