import React, { useState, useEffect, useRef } from 'react';
import { Users, MessageCircle, Send, Image, Video, BookOpen, Sparkles, ChevronLeft, Search, UserPlus, LogOut as Leave, Clock, Check, Book } from 'lucide-react';
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

const ReadCrewPage = ({ currentUser, onBack }) => {
  const [view, setView] = useState('search'); // 'search', 'crews', 'chat'
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
      const result = await bookCrewAPI.getAll();
      if (result.success) {
        setAllCrews(result.crews);
        setMyCrews(result.crews.filter(c => 
          c.members.some(m => m.userEmail === currentUser.email)
        ));
      }
    } catch (error) {
      console.error('Error loading crews:', error);
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
          setAiSuggestions(books.slice(0, 10));
          setAiLoading(false);
        }
      );
    } catch (error) {
      console.error('AI suggestion error:', error);
      setAiLoading(false);
      alert('Failed to get suggestions. Please try again.');
    }
  };

  const handleJoinCrew = async (book) => {
    try {
      const result = await bookCrewAPI.join({
        bookName: book.title,
        author: book.author,
        userName: currentUser.name,
        userEmail: currentUser.email,
        description: book.description
      });

      if (result.success) {
        alert(result.message);
        await loadCrews();
        setView('crews');
      }
    } catch (error) {
      console.error('Error joining crew:', error);
      alert('Failed to join crew');
    }
  };

  const handleOpenChat = async (crew) => {
    setSelectedCrew(crew);
    setView('chat');
    
    // Join socket room
    if (socket) {
      socket.emit('join-crew', crew.bookName);
    }
    
    // Load messages
    try {
      const result = await bookCrewAPI.getMessages(crew.bookName);
      if (result.success) {
        setMessages(result.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleLeaveCrew = async () => {
    if (!confirm(`Are you sure you want to leave ${selectedCrew.bookName} Crew?`)) return;
    
    try {
      await bookCrewAPI.leave(selectedCrew.bookName, currentUser.email);
      
      if (socket) {
        socket.emit('leave-crew', selectedCrew.bookName);
      }
      
      alert('Left the crew');
      await loadCrews();
      setView('crews');
      setSelectedCrew(null);
    } catch (error) {
      console.error('Error leaving crew:', error);
      alert('Failed to leave crew');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    const message = {
      bookName: selectedCrew.bookName,
      userName: currentUser.name,
      userEmail: currentUser.email,
      messageType: 'text',
      content: newMessage,
      createdAt: new Date().toISOString()
    };
    
    try {
      const result = await bookCrewAPI.sendMessage(message);
      
      if (result.success && socket) {
        socket.emit('send-message', {
          bookName: selectedCrew.bookName,
          message: result.message
        });
      }
      
      setNewMessage('');
      handleStopTyping();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = () => {
    if (!isTyping && socket) {
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
    if (isTyping && socket) {
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
      const message = {
        bookName: selectedCrew.bookName,
        userName: currentUser.name,
        userEmail: currentUser.email,
        messageType: file.type.startsWith('video') ? 'video' : 'image',
        content: file.name,
        mediaUrl: reader.result
      };
      
      try {
        const result = await bookCrewAPI.sendMessage(message);
        
        if (result.success && socket) {
          socket.emit('send-message', {
            bookName: selectedCrew.bookName,
            message: result.message
          });
        }
      } catch (error) {
        console.error('Error sending media:', error);
      }
    };
    
    reader.readAsDataURL(file);
  };

  // SEARCH VIEW
  if (view === 'search') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold"
        >
          <ChevronLeft className="w-5 h-5" /> Back to Home
        </button>

        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-3xl p-8 sm:p-12 text-white mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Users className="w-12 h-12" />
            <div>
              <h1 className="text-4xl font-bold">ReadCrew</h1>
              <p className="text-orange-100">Find books. Join crews. Read together.</p>
            </div>
          </div>
          
          <button
            onClick={() => setView('crews')}
            className="px-6 py-3 bg-white text-orange-600 rounded-xl font-semibold hover:shadow-lg transition"
          >
            View My Crews ({myCrews.length})
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Find Your Reading Crew</h2>
          
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Sparkles className="absolute left-4 top-4 text-orange-500" />
              <input
                type="text"
                value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGetSuggestions()}
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none"
                placeholder="fantasy adventure, self-help, romance..."
                disabled={aiLoading}
              />
            </div>
            <button
              onClick={handleGetSuggestions}
              disabled={!searchKeywords || aiLoading}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-xl transition disabled:opacity-50"
            >
              {aiLoading ? 'Loading...' : 'Get Suggestions'}
            </button>
          </div>

          {aiLoading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Finding perfect books for you...</p>
            </div>
          )}

          {aiSuggestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Choose a book to join its crew:</h3>
              {aiSuggestions.map((book, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{book.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">by {book.author}</p>
                      <p className="text-gray-700">{book.description}</p>
                    </div>
                    <button
                      onClick={() => handleJoinCrew(book)}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2 shrink-0"
                    >
                      <UserPlus className="w-5 h-5" />
                      Join Crew
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Popular Reading Crews</h2>
          
          {allCrews.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No crews yet. Be the first to create one!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allCrews.map((crew) => (
                <div
                  key={crew._id}
                  className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100 hover:border-blue-300 transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <Book className="w-10 h-10 text-blue-600" />
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      {crew.totalMembers}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2 text-gray-900">{crew.bookName}</h3>
                  <p className="text-sm text-gray-600 mb-4">by {crew.author}</p>
                  
                  {crew.members.some(m => m.userEmail === currentUser.email) ? (
                    <button
                      onClick={() => handleOpenChat(crew)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Open Chat
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinCrew(crew)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-5 h-5" />
                      Join Crew
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // CREWS LIST VIEW
  if (view === 'crews') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => setView('search')}
          className="mb-6 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold"
        >
          <ChevronLeft className="w-5 h-5" /> Back to Search
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">My Reading Crews</h2>
          
          {myCrews.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">You haven't joined any crews yet</p>
              <button
                onClick={() => setView('search')}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition"
              >
                Find Crews
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCrews.map((crew) => (
                <div
                  key={crew._id}
                  onClick={() => handleOpenChat(crew)}
                  className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100 hover:border-blue-300 transition cursor-pointer hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <Book className="w-10 h-10 text-blue-600" />
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      {crew.totalMembers} members
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2 text-gray-900">{crew.bookName}</h3>
                  <p className="text-sm text-gray-600 mb-4">by {crew.author}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-xs text-gray-500">
                      Joined {new Date(crew.members.find(m => m.userEmail === currentUser.email)?.joinedAt).toLocaleDateString()}
                    </span>
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // CHAT VIEW
  if (view === 'chat' && selectedCrew) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Chat Header */}
        <div className="bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (socket) socket.emit('leave-crew', selectedCrew.bookName);
                setView('crews');
                setSelectedCrew(null);
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <Book className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="font-bold text-lg text-gray-900">{selectedCrew.bookName} Crew</h2>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {selectedCrew.totalMembers} members
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLeaveCrew}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2"
          >
            <Leave className="w-4 h-4" />
            Leave
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => {
            const isOwn = msg.userEmail === currentUser.email;
            
            return (
              <div
                key={index}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                  {!isOwn && (
                    <p className="text-xs text-gray-600 mb-1 px-3">{msg.userName}</p>
                  )}
                  
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      isOwn
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {msg.messageType === 'text' ? (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    ) : msg.messageType === 'image' ? (
                      <div>
                        <img
                          src={msg.mediaUrl}
                          alt={msg.content}
                          className="rounded-lg max-w-full h-auto mb-2"
                        />
                        <p className="text-xs opacity-75">{msg.content}</p>
                      </div>
                    ) : msg.messageType === 'video' ? (
                      <div>
                        <video
                          src={msg.mediaUrl}
                          controls
                          className="rounded-lg max-w-full h-auto mb-2"
                        />
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
          })}
          
          {typingUsers.length > 0 && (
            <div className="text-sm text-gray-500 italic px-3">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t p-4">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*,video/*"
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <Image className="w-5 h-5" />
            </button>
            
            <textarea
              value={newMessage}
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
              rows="1"
              style={{ maxHeight: '120px' }}
            />
            
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default ReadCrewPage;