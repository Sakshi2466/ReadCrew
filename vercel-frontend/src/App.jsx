import React, { useState, useEffect } from 'react';
import axios from 'axios'; // ✅ MUST BE AT THE TOP
import { BookOpen, Heart, Star, Sparkles, Menu, X, Upload, Search, ThumbsUp, ThumbsDown, Share2, Bookmark, ChevronLeft, LogOut, Users, TrendingUp, Trash2, Edit, Target, Plus, Check, ArrowLeft, Clock, Gift } from 'lucide-react';

// ✅ Import API functions
import { donationAPI, reviewAPI, otpAPI, checkBackendConnection, getBookRecommendations, getTrendingBooks } from './services/api';

// ✅ Define API_URL for axios calls
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

// Book recommendations database
const BOOK_RECOMMENDATIONS = [
  {
    id: 1,
    category: 'Fantasy',
    emoji: '📚',
    description: 'Imaginative worlds, magic, mythical creatures',
    books: [
      { title: 'The Hobbit', author: 'J.R.R. Tolkien', rating: 4.7 },
      { title: 'Harry Potter Series', author: 'J.K. Rowling', rating: 4.8 },
      { title: 'The Name of the Wind', author: 'Patrick Rothfuss', rating: 4.5 },
      { title: 'A Song of Ice and Fire', author: 'George R.R. Martin', rating: 4.6 }
    ]
  },
  {
    id: 2,
    category: 'Science Fiction',
    emoji: '🚀',
    description: 'Future tech, space exploration, aliens',
    books: [
      { title: 'Dune', author: 'Frank Herbert', rating: 4.5 },
      { title: '1984', author: 'George Orwell', rating: 4.4 },
      { title: 'The Martian', author: 'Andy Weir', rating: 4.7 },
      { title: 'Foundation', author: 'Isaac Asimov', rating: 4.3 }
    ]
  },
  {
    id: 3,
    category: 'Mystery/Thriller',
    emoji: '🔍',
    description: 'Suspense, crime solving, plot twists',
    books: [
      { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', rating: 4.2 },
      { title: 'Gone Girl', author: 'Gillian Flynn', rating: 4.1 },
      { title: 'The Silent Patient', author: 'Alex Michaelides', rating: 4.5 },
      { title: 'The Da Vinci Code', author: 'Dan Brown', rating: 4.0 }
    ]
  },
  {
    id: 4,
    category: 'Romance',
    emoji: '❤️',
    description: 'Love stories, relationships, emotional journeys',
    books: [
      { title: 'Pride and Prejudice', author: 'Jane Austen', rating: 4.8 },
      { title: 'The Notebook', author: 'Nicholas Sparks', rating: 4.3 },
      { title: 'Normal People', author: 'Sally Rooney', rating: 4.0 },
      { title: 'Red, White & Royal Blue', author: 'Casey McQuiston', rating: 4.6 }
    ]
  },
  {
    id: 5,
    category: 'Biography/Autobiography',
    emoji: '📖',
    description: 'Real-life stories, memoirs, historical figures',
    books: [
      { title: 'The Diary of a Young Girl', author: 'Anne Frank', rating: 4.8 },
      { title: 'Becoming', author: 'Michelle Obama', rating: 4.8 },
      { title: 'Educated', author: 'Tara Westover', rating: 4.7 },
      { title: 'Steve Jobs', author: 'Walter Isaacson', rating: 4.6 }
    ]
  },
  {
    id: 6,
    category: 'Self-Help/Motivational',
    emoji: '💪',
    description: 'Personal growth, productivity, mindset',
    books: [
      { title: 'Atomic Habits', author: 'James Clear', rating: 4.8 },
      { title: 'The 7 Habits of Highly Effective People', author: 'Stephen R. Covey', rating: 4.7 },
      { title: 'The Power of Now', author: 'Eckhart Tolle', rating: 4.3 },
      { title: 'Think and Grow Rich', author: 'Napoleon Hill', rating: 4.2 }
    ]
  },
  {
    id: 7,
    category: 'Historical Fiction',
    emoji: '🏛️',
    description: 'Historical events, period settings',
    books: [
      { title: 'The Book Thief', author: 'Markus Zusak', rating: 4.7 },
      { title: 'All the Light We Cannot See', author: 'Anthony Doerr', rating: 4.6 },
      { title: 'The Nightingale', author: 'Kristin Hannah', rating: 4.8 },
      { title: 'Wolf Hall', author: 'Hilary Mantel', rating: 4.5 }
    ]
  },
  {
    id: 8,
    category: 'Horror',
    emoji: '👻',
    description: 'Fear, supernatural, psychological terror',
    books: [
      { title: 'It', author: 'Stephen King', rating: 4.6 },
      { title: 'Dracula', author: 'Bram Stoker', rating: 4.2 },
      { title: 'The Shining', author: 'Stephen King', rating: 4.7 },
      { title: 'Frankenstein', author: 'Mary Shelley', rating: 4.1 }
    ]
  },
  {
    id: 9,
    category: 'Literary Fiction',
    emoji: '✍️',
    description: 'Character-driven, artistic prose, social commentary',
    books: [
      { title: 'To Kill a Mockingbird', author: 'Harper Lee', rating: 4.8 },
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', rating: 4.3 },
      { title: 'Beloved', author: 'Toni Morrison', rating: 4.4 },
      { title: 'The Catcher in the Rye', author: 'J.D. Salinger', rating: 4.1 }
    ]
  },
  {
    id: 10,
    category: 'Young Adult',
    emoji: '🌟',
    description: 'Teen protagonists, coming-of-age',
    books: [
      { title: 'The Fault in Our Stars', author: 'John Green', rating: 4.7 },
      { title: 'The Hunger Games', author: 'Suzanne Collins', rating: 4.7 },
      { title: 'Divergent', author: 'Veronica Roth', rating: 4.2 },
      { title: 'Twilight', author: 'Stephenie Meyer', rating: 3.8 }
    ]
  },
  {
    id: 11,
    category: 'Adventure',
    emoji: '🗺️',
    description: 'Exploration, survival, action',
    books: [
      { title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', rating: 4.9 },
      { title: 'Treasure Island', author: 'Robert Louis Stevenson', rating: 4.0 },
      { title: 'Life of Pi', author: 'Yann Martel', rating: 4.2 },
      { title: 'The Alchemist', author: 'Paulo Coelho', rating: 4.3 }
    ]
  },
  {
    id: 12,
    category: 'Philosophy',
    emoji: '🤔',
    description: 'Existential questions, ethics, consciousness',
    books: [
      { title: 'Meditations', author: 'Marcus Aurelius', rating: 4.5 },
      { title: 'Thus Spoke Zarathustra', author: 'Friedrich Nietzsche', rating: 4.0 },
      { title: 'The Republic', author: 'Plato', rating: 4.2 },
      { title: 'Sophie\'s World', author: 'Jostein Gaarder', rating: 4.3 }
    ]
  }
];

// Validation functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);
const validateName = (name) => name && name.trim().length >= 2;

// Helper function to parse AI response into structured book data
const parseAIBooksResponse = (text) => {
  const books = [];
  const lines = text.split('\n\n');
  
  for (const line of lines) {
    // Match **Title by Author** pattern
    const titleMatch = line.match(/\*\*(.+?)\s+by\s+(.+?)\*\*/);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      const author = titleMatch[2].trim();
      // Get description (text after the title line)
      const description = line.replace(/\*\*.*?\*\*/, '').trim();
      
      books.push({ title, author, description });
    }
  }
  
  return books;
};

// ReviewCard Component - FIXED: Using global API_URL
const ReviewCard = ({ review, currentUserEmail, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bookName: review.bookName,
    author: review.author,
    review: review.review,
    sentiment: review.sentiment
  });
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/api/reviews/${review._id}`);
      onDelete(review._id);
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const response = await axios.put(`${API_URL}/api/reviews/${review._id}`, editForm);
      if (response.data.success) {
        onUpdate();
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Failed to update review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 hover:shadow-xl transition">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editForm.bookName}
                onChange={(e) => setEditForm({...editForm, bookName: e.target.value})}
                className="text-xl font-bold mb-1 w-full px-3 py-2 border rounded-lg"
                placeholder="Book Name"
              />
            ) : (
              <h3 className="text-xl font-bold text-gray-900">{review.bookName}</h3>
            )}
            {isEditing ? (
              <input
                type="text"
                value={editForm.author}
                onChange={(e) => setEditForm({...editForm, author: e.target.value})}
                className="text-gray-600 mb-2 w-full px-3 py-2 border rounded-lg"
                placeholder="Author"
              />
            ) : (
              <p className="text-gray-600 mb-2">by {review.author}</p>
            )}
          </div>
          {review.userEmail === currentUserEmail && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleUpdate}
                    disabled={loading}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <textarea
            value={editForm.review}
            onChange={(e) => setEditForm({...editForm, review: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg mb-3"
            rows="3"
            placeholder="Your review"
          />
        ) : (
          <p className="text-gray-700 mb-4">{review.review}</p>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <select
                value={editForm.sentiment}
                onChange={(e) => setEditForm({...editForm, sentiment: e.target.value})}
                className="px-3 py-1 border rounded-lg"
              >
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
              </select>
            ) : (
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                review.sentiment === 'positive' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {review.sentiment === 'positive' ? '👍 Positive' : '👎 Negative'}
              </span>
            )}
            <span className="text-gray-500 text-sm">
              Reviewed by {review.userName}
            </span>
          </div>
          <span className="text-gray-400 text-sm">
            {new Date(review.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

// CreateReviewForm Component - FIXED: Using global API_URL
const CreateReviewForm = ({ currentUser, onReviewCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    bookName: '',
    author: '',
    review: '',
    sentiment: 'positive'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.bookName || !formData.author || !formData.review) {
      alert('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      const reviewData = {
        userName: currentUser.name,
        userEmail: currentUser.email,
        bookName: formData.bookName,
        author: formData.author,
        review: formData.review,
        sentiment: formData.sentiment
      };

      const response = await axios.post(`${API_URL}/api/reviews`, reviewData);
      
      if (response.data.success) {
        onReviewCreated(response.data.review);
        setFormData({ bookName: '', author: '', review: '', sentiment: 'positive' });
      }
    } catch (error) {
      console.error('Error creating review:', error);
      alert('Failed to create review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Write a New Review</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Book Name *</label>
            <input
              type="text"
              value={formData.bookName}
              onChange={(e) => setFormData({...formData, bookName: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition"
              placeholder="Enter book name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Author *</label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({...formData, author: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition"
              placeholder="Enter author name"
              required
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Your Review *</label>
          <textarea
            value={formData.review}
            onChange={(e) => setFormData({...formData, review: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition"
            rows="4"
            placeholder="Share your thoughts about the book..."
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Sentiment</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormData({...formData, sentiment: 'positive'})}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition ${
                formData.sentiment === 'positive'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ThumbsUp className="w-4 h-4" /> Positive
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, sentiment: 'negative'})}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition ${
                formData.sentiment === 'negative'
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ThumbsDown className="w-4 h-4" /> Negative
            </button>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Posting Review...' : 'Post Review'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const App = () => {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [verificationData, setVerificationData] = useState({});
  const [otpInput, setOtpInput] = useState('');
  const [loginForm, setLoginForm] = useState({ name: '', email: '', phone: '' });

  // App states
  const [currentPage, setCurrentPage] = useState('home');
  const [showProfile, setShowProfile] = useState(false);
  const [showSavedPosts, setShowSavedPosts] = useState(false);
  const [showLikedPosts, setShowLikedPosts] = useState(false);
  const [showSharedPosts, setShowSharedPosts] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showPostDetail, setShowPostDetail] = useState(false);
  
  // Book Reviews App states
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showCreateReviewForm, setShowCreateReviewForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);
  const [filteredReviews, setFilteredReviews] = useState([]);
  
  // Backend connection states
  const [backendConnected, setBackendConnected] = useState(false);
  const [backendChecking, setBackendChecking] = useState(true);
  
  // Data states
  const [donations, setDonations] = useState([]);
  const [userActivity, setUserActivity] = useState({
    savedPosts: [],
    likedPosts: [],
    sharedPosts: []
  });
  
  // Form states
  const [donationForm, setDonationForm] = useState({ bookName: '', story: '', image: null, imagePreview: null });
  const [reviewForm, setReviewForm] = useState({ bookName: '', author: '', review: '', sentiment: 'positive' });
  const [recommendKeywords, setRecommendKeywords] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  
  // ✅ AI streaming states
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // ✅ Trending books states
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  
  const [readingGoal, setReadingGoal] = useState({ monthly: 0, books: [] });
  const [newBook, setNewBook] = useState('');
  
  // Selected post for detail view
  const [selectedPost, setSelectedPost] = useState(null);

  // ✅ Check backend connection on startup (silently)
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const status = await checkBackendConnection();
        setBackendConnected(status.connected);
        setBackendChecking(false);
      } catch (error) {
        console.error('Error checking backend connection:', error);
        setBackendConnected(false);
        setBackendChecking(false);
      }
    };
    
    checkConnection();
  }, []);

  // Initialize data from localStorage on mount
  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setCurrentUser(parsed);
        setIsLoggedIn(true);
        setReadingGoal(parsed.readingGoal || { monthly: 0, books: [] });
        
        // Load user activity
        if (parsed?.email) {
          try {
            const saved = localStorage.getItem(`user_${parsed.email}_activity`);
            if (saved) {
              setUserActivity(JSON.parse(saved));
            }
          } catch (error) {
            console.error('Error loading user activity:', error);
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Load from backend
    loadDonationsFromBackend();
    loadReviewsFromBackend();
  }, []);

  // ✅ Fetch trending books on mount
  useEffect(() => {
    if (isLoggedIn) {
      fetchTrendingBooks();
    }
  }, [isLoggedIn]);

  // ✅ Function to fetch trending books
  const fetchTrendingBooks = async () => {
    setTrendingLoading(true);
    let response = '';
    
    try {
      await getTrendingBooks(
        (token) => { response += token; },
        () => {
          // Parse the AI response to extract books
          const books = parseAIBooksResponse(response);
          setTrendingBooks(books.slice(0, 5)); // Top 5
          setTrendingLoading(false);
        }
      );
    } catch (error) {
      console.error('Error fetching trending books:', error);
      setTrendingLoading(false);
      // Fallback to static data
      setTrendingBooks([
        { title: 'Atomic Habits', author: 'James Clear', description: 'Transform your life with tiny changes' },
        { title: 'The Hobbit', author: 'J.R.R. Tolkien', description: 'Epic fantasy adventure' },
        { title: 'Educated', author: 'Tara Westover', description: 'Powerful memoir of transformation' },
        { title: '1984', author: 'George Orwell', description: 'Dystopian masterpiece' },
        { title: 'The Alchemist', author: 'Paulo Coelho', description: 'Journey of self-discovery' }
      ]);
    }
  };

  // ========== BOOK REVIEWS FUNCTIONS ==========
  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await axios.get(`${API_URL}/api/reviews`, {
        params: { userEmail: currentUser?.email || '' }
      });

      if (response.data.success) {
        setReviews(response.data.reviews);
        setFilteredReviews(response.data.reviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      showNotification('Error loading reviews', 'error');
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSearchReviews = async () => {
    if (!searchQuery.trim()) {
      fetchReviews();
      return;
    }

    try {
      setReviewsLoading(true);
      const response = await axios.get(`${API_URL}/api/reviews/search`, {
        params: { 
          query: searchQuery,
          userEmail: currentUser?.email || ''
        }
      });

      if (response.data.success) {
        setFilteredReviews(response.data.reviews);
      }
    } catch (error) {
      console.error('Error searching reviews:', error);
      showNotification('Error searching reviews', 'error');
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleReviewCreated = (newReview) => {
    setReviews([newReview, ...reviews]);
    setFilteredReviews([newReview, ...filteredReviews]);
    setShowCreateReviewForm(false);
    showNotification('Review posted successfully!', 'success');
  };

  const handleReviewDeleted = (deletedReviewId) => {
    setReviews(reviews.filter(review => review._id !== deletedReviewId));
    setFilteredReviews(filteredReviews.filter(review => review._id !== deletedReviewId));
    showNotification('Review deleted successfully', 'success');
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchReviews();
    }
  };

  // ========== DONATION FUNCTIONS ==========
  const loadDonationsFromBackend = async () => {
    try {
      const result = await donationAPI.getAll();
      
      if (result.success && Array.isArray(result.donations)) {
        setDonations(result.donations);
      } else {
        setDonations([]);
      }
    } catch (error) {
      console.error('Backend connection failed:', error.message);
      setDonations([]);
    }
  };

  const loadReviewsFromBackend = async () => {
    try {
      const result = await reviewAPI.getAll();
      
      if (result.success && Array.isArray(result.reviews)) {
        setReviews(result.reviews);
        setFilteredReviews(result.reviews);
      } else {
        setReviews([]);
        setFilteredReviews([]);
      }
    } catch (error) {
      console.error('Backend connection failed:', error.message);
      setReviews([]);
      setFilteredReviews([]);
    }
  };

  // ========== AUTHENTICATION FUNCTIONS ==========
  
  const handleSendOTP = async () => {
    if (!validateName(loginForm.name) || !validateEmail(loginForm.email) || !validatePhone(loginForm.phone)) {
      alert('Please fill all fields correctly');
      return;
    }
    
    setLoading(true);
    try {
      const result = await otpAPI.sendOTP(loginForm);
      
      if (result.success) {
        setVerificationData(loginForm);
        setShowOTP(true);
        alert('OTP sent to your email! Check your inbox.');
        if (result.otp) {
          console.log(`🔐 DEVELOPMENT OTP: ${result.otp}`);
        }
      } else {
        alert(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP via API:', error);
      
      // Fallback to mock OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('devOTP', otp);
      localStorage.setItem('devUser', JSON.stringify(loginForm));
      
      setVerificationData(loginForm);
      setShowOTP(true);
      alert(`Development mode OTP: ${otp}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpInput.length !== 6) {
      alert('Enter 6-digit OTP');
      return;
    }
    
    setLoading(true);
    try {
      const result = await otpAPI.verifyOTP({ email: verificationData.email, otp: otpInput });
      
      if (result.success) {
        const userData = {
          id: Date.now().toString(),
          name: verificationData.name,
          email: verificationData.email,
          phone: verificationData.phone,
          isVerified: true,
          createdAt: new Date().toISOString(),
          readingGoal: { monthly: 0, books: [] }
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setCurrentUser(userData);
        setIsLoggedIn(true);
        setShowOTP(false);
        setLoginForm({ name: '', email: '', phone: '' });
        setOtpInput('');
        alert('✅ Account verified! Welcome to ReadCrew!');
        
        // Load data from backend
        await loadDonationsFromBackend();
        await loadReviewsFromBackend();
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Error verifying OTP via API:', error);
      
      // Fallback to mock verification
      const devOTP = localStorage.getItem('devOTP');
      const devUser = JSON.parse(localStorage.getItem('devUser') || '{}');
      
      if (devOTP && otpInput === devOTP && devUser.email === verificationData.email) {
        const userData = {
          id: Date.now().toString(),
          name: devUser.name,
          email: devUser.email,
          phone: devUser.phone,
          isVerified: true,
          createdAt: new Date().toISOString(),
          readingGoal: { monthly: 0, books: [] }
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setCurrentUser(userData);
        setIsLoggedIn(true);
        setShowOTP(false);
        setLoginForm({ name: '', email: '', phone: '' });
        setOtpInput('');
        
        localStorage.removeItem('devOTP');
        localStorage.removeItem('devUser');
        alert('✅ Account verified! Welcome to ReadCrew!');
        
        // Load data from backend
        await loadDonationsFromBackend();
        await loadReviewsFromBackend();
      } else {
        alert('❌ Invalid OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPostDetail = (post) => {
    setSelectedPost(post);
    setShowPostDetail(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setDonationForm(prev => ({ ...prev, image: reader.result, imagePreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDonationSubmit = async () => {
    if (!donationForm.bookName || !donationForm.story || !donationForm.image) {
      alert('Please fill all fields');
      return;
    }
    
    if (!isLoggedIn) {
      alert('Please login to share a story');
      return;
    }
    
    setLoading(true);
    
    try {
      const donationData = {
        userName: currentUser.name,
        userEmail: currentUser.email,
        bookName: donationForm.bookName,
        story: donationForm.story,
        image: donationForm.image,
      };
      
      const result = await donationAPI.create(donationData);
      
      if (result.success) {
        await loadDonationsFromBackend();
        setDonationForm({ bookName: '', story: '', image: null, imagePreview: null });
        alert('✅ Story shared successfully! Everyone can now see it!');
        setLoading(false);
        return;
      } else {
        throw new Error(result.message || 'Failed to create donation');
      }
    } catch (error) {
      console.error('Error submitting donation to backend:', error);
    }
    
    alert('❌ Failed to share story. Please try again.');
    setLoading(false);
  };

  const handleDeleteDonation = async (id) => {
    if (!confirm('Are you sure you want to delete this story?')) return;
    
    try {
      await donationAPI.delete(id);
    } catch (error) {
      console.error('Error deleting donation from backend:', error);
    }
    
    await loadDonationsFromBackend();
    
    alert('Story deleted successfully');
    if (showPostDetail) setShowPostDetail(false);
  };

  const handleLikeDonation = async (id) => {
    try {
      await donationAPI.like(id);
    } catch (error) {
      console.error('Error liking donation on backend:', error);
    }
    
    await loadDonationsFromBackend();
    
    if (currentUser?.email) {
      const activityKey = `user_${currentUser.email}_activity`;
      const saved = JSON.parse(localStorage.getItem(activityKey) || '{}');
      if (!saved.likedPosts) saved.likedPosts = [];
      if (!saved.likedPosts.includes(id)) {
        saved.likedPosts.push(id);
        setUserActivity(prev => ({ ...prev, likedPosts: saved.likedPosts }));
        localStorage.setItem(activityKey, JSON.stringify(saved));
      }
    }
  };

  const handleSaveDonation = async (id) => {
    try {
      await donationAPI.save(id);
    } catch (error) {
      console.error('Error saving donation on backend:', error);
    }
    
    await loadDonationsFromBackend();
    
    if (currentUser?.email) {
      const activityKey = `user_${currentUser.email}_activity`;
      const saved = JSON.parse(localStorage.getItem(activityKey) || '{}');
      if (!saved.savedPosts) saved.savedPosts = [];
      if (!saved.savedPosts.includes(id)) {
        saved.savedPosts.push(id);
        setUserActivity(prev => ({ ...prev, savedPosts: saved.savedPosts }));
        localStorage.setItem(activityKey, JSON.stringify(saved));
        alert('✅ Saved to your collection!');
      }
    }
  };

  // ========== REVIEW SUBMIT FUNCTION ==========
  const handleReviewSubmit = async () => {
    if (!reviewForm.bookName || !reviewForm.author || !reviewForm.review) {
      alert('Please fill all fields');
      return;
    }
    
    if (reviewForm.review.trim().length < 20) {
      alert('Review must be at least 20 characters long');
      return;
    }
    
    if (!isLoggedIn) {
      alert('Please login to post a review');
      return;
    }
    
    setLoading(true);
    
    try {
      const reviewData = {
        userName: currentUser.name,
        userEmail: currentUser.email,
        bookName: reviewForm.bookName,
        author: reviewForm.author,
        review: reviewForm.review,
        sentiment: reviewForm.sentiment,
        rating: 5
      };
      
      const result = await reviewAPI.create(reviewData);
      
      if (result.success) {
        await loadReviewsFromBackend();
        setReviewForm({ bookName: '', author: '', review: '', sentiment: 'positive' });
        alert('✅ Review posted successfully! Everyone can now see it!');
        setLoading(false);
        return;
      } else {
        throw new Error(result.message || 'Failed to create review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(`❌ Failed to post review: ${error.message}`);
    }
    
    setLoading(false);
  };

  // ========== RECOMMENDATION FUNCTIONS - WITH AI STREAMING ==========

  const handleRecommendation = async () => {
    if (!recommendKeywords.trim()) {
      alert('Please enter what you want to read about');
      return;
    }

    // Clear previous results and start streaming
    setRecommendations([]);
    setAiResponse('');
    setAiLoading(true);

    try {
      await getBookRecommendations(
        recommendKeywords,
        (token) => setAiResponse(prev => prev + token),  // stream tokens in
        () => setAiLoading(false)                        // done streaming
      );
    } catch (error) {
      console.error('AI recommendation error:', error);
      setAiLoading(false);
      
      // Fallback to static logic if AI fails
      const keywords = recommendKeywords.toLowerCase().trim();
      const matchingCategories = BOOK_RECOMMENDATIONS.filter(category => {
        const categoryText = `${category.category} ${category.description} ${category.emoji}`.toLowerCase();
        return categoryText.includes(keywords) || 
               category.books.some(book => 
                 book.title.toLowerCase().includes(keywords) || 
                 book.author.toLowerCase().includes(keywords)
               );
      });

      if (matchingCategories.length > 0) {
        const results = [];
        matchingCategories.forEach(category => {
          results.push({
            type: 'category',
            category: category.category,
            emoji: category.emoji,
            description: category.description,
            books: category.books
          });
        });
        setRecommendations(results);
      } else {
        const allBooks = BOOK_RECOMMENDATIONS.flatMap(category => 
          category.books.map(book => ({
            ...book,
            category: category.category,
            emoji: category.emoji
          }))
        );

        const filteredBooks = allBooks.filter(book => 
          book.title.toLowerCase().includes(keywords) || 
          book.author.toLowerCase().includes(keywords)
        );

        if (filteredBooks.length > 0) {
          setRecommendations([
            {
              type: 'keyword',
              keyword: keywords,
              books: filteredBooks.slice(0, 10)
            }
          ]);
        } else {
          setRecommendations([
            {
              type: 'popular',
              title: 'Most Popular Books',
              books: [
                { title: 'Atomic Habits', author: 'James Clear', category: 'Motivational / Self-Help', rating: 4.8 },
                { title: 'The Hobbit', author: 'J.R.R. Tolkien', category: 'Fantasy', rating: 4.7 },
                { title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Literary Fiction', rating: 4.8 },
                { title: 'The Diary of a Young Girl', author: 'Anne Frank', category: 'Biography', rating: 4.8 },
                { title: 'The Power of Now', author: 'Eckhart Tolle', category: 'Philosophy', rating: 4.3 }
              ]
            }
          ]);
        }
      }
    }
  };

  const handleBrowseCategories = () => {
    setRecommendations(
      BOOK_RECOMMENDATIONS.map(category => ({
        type: 'category',
        category: category.category,
        emoji: category.emoji,
        description: category.description,
        books: category.books.slice(0, 3)
      }))
    );
  };

  // ========== READING GOAL FUNCTIONS ==========
  
  const handleUpdateGoal = () => {
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, readingGoal };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setShowGoalModal(false);
    alert('✅ Reading goal updated!');
  };

  const handleAddBook = () => {
    if (newBook.trim()) {
      setReadingGoal(prev => ({
        ...prev,
        books: [...prev.books, { title: newBook.trim(), completed: false }]
      }));
      setNewBook('');
    }
  };

  const handleToggleBook = (idx) => {
    setReadingGoal(prev => ({
      ...prev,
      books: prev.books.map((b, i) => 
        i === idx ? { ...b, completed: !b.completed } : b
      )
    }));
  };

  const handleShareDonation = (id) => {
    if (currentUser?.email) {
      const activityKey = `user_${currentUser.email}_activity`;
      const saved = JSON.parse(localStorage.getItem(activityKey) || '{}');
      if (!saved.sharedPosts) saved.sharedPosts = [];
      if (!saved.sharedPosts.includes(id)) {
        saved.sharedPosts.push(id);
        setUserActivity(prev => ({ ...prev, sharedPosts: saved.sharedPosts }));
        localStorage.setItem(activityKey, JSON.stringify(saved));
        alert('✅ Post marked as shared!');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentPage('home');
    alert('Logged out successfully');
  };

  // ========== RENDER: LOGIN PAGE ==========
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23f97316' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full grid md:grid-cols-2">
            <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-10 h-10 text-orange-500" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold">ReadCrew</h1>
                    <p className="text-orange-100">Share • Inspire • Discover</p>
                  </div>
                </div>

                <h2 className="text-3xl font-bold mb-4">Let's make reading a habit</h2>
                <p className="text-orange-100 mb-8 leading-relaxed">
                  Join thousands of book lovers sharing their reading journeys, discovering new favorites, and building a vibrant reading community.
                </p>

                <div className="space-y-4">
                  {[
                    { icon: Gift, text: 'Share your reading stories' },
                    { icon: Star, text: 'Read & write book reviews' },
                    { icon: Sparkles, text: 'Get personalized recommendations' }
                  ].map(({ icon: Icon, text }, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-12">
              {!showOTP ? (
                <>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                  <p className="text-gray-600 mb-8">Enter your details to get started</p>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        value={loginForm.name}
                        onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition"
                        placeholder="Neha Sharma"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                      <input
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition"
                        placeholder="neha.sharma@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        value={loginForm.phone}
                        onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition"
                        placeholder="9876543210"
                        maxLength="10"
                      />
                    </div>

                    <button
                      onClick={handleSendOTP}
                      disabled={loading || !validateName(loginForm.name) || !validateEmail(loginForm.email) || !validatePhone(loginForm.phone)}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50"
                    >
                      {loading ? 'Sending OTP...' : 'Get Started →'}
                    </button>
                    
                    <div className="text-center text-sm text-gray-500 mt-4">
                      
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Verify OTP</h2>
                  <p className="text-gray-600 mb-8">Enter the code sent to {verificationData.email}</p>

                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none text-center text-3xl tracking-widest mb-6"
                    placeholder="000000"
                    maxLength="6"
                    autoFocus
                  />

                  <button
                    onClick={handleVerifyOTP}
                    disabled={loading || otpInput.length !== 6}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </button>

                  <button
                    onClick={() => { setShowOTP(false); setOtpInput(''); }}
                    className="w-full mt-4 text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== RENDER: MAIN APP ==========
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`notification fixed top-4 right-4 px-6 py-3 rounded-xl font-medium text-white shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'error' ? 'bg-red-500' :
          'bg-blue-500'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">ReadCrew</h1>
              <p className="text-xs text-gray-500">Let's make reading a habit</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { name: 'Home', page: 'home', icon: BookOpen },
              { name: 'Shared Stories', page: 'donation', icon: Gift },
              { name: 'Book Reviews', page: 'reviews', icon: Star },
              { name: 'Recommendations', page: 'recommend', icon: Sparkles }
            ].map(({ name, page, icon: Icon }) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {name}
                </span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 rounded-xl transition"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {currentUser?.name?.charAt(0)}
              </div>
              <span className="hidden md:block font-medium text-gray-700">{currentUser?.name}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Home Page - NEW DESIGN */}
      {currentPage === 'home' && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl mb-12 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white p-12">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-orange-500" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold">ReadCrew</h1>
                  <p className="text-orange-100">Let's make reading a habit</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            <button
              onClick={() => setCurrentPage('donation')}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition text-center border-2 border-transparent hover:border-blue-300"
            >
              <Gift className="w-10 h-10 text-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900">Shared Stories</h3>
            </button>
            <button
              onClick={() => setCurrentPage('reviews')}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition text-center border-2 border-transparent hover:border-purple-300"
            >
              <Star className="w-10 h-10 text-purple-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900">Book Reviews</h3>
            </button>
            <button
              onClick={() => setCurrentPage('recommend')}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition text-center border-2 border-transparent hover:border-orange-300"
            >
              <Sparkles className="w-10 h-10 text-orange-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900">AI Books Recommendations</h3>
            </button>
          </div>

          {/* Top Trending Books Section */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-12 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-orange-600" />
                <h2 className="text-3xl font-bold text-gray-900">Top Trending Books</h2>
              </div>
              <button
                onClick={fetchTrendingBooks}
                disabled={trendingLoading}
                className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition disabled:opacity-50 flex items-center gap-2"
              >
                {trendingLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Refresh
                  </>
                )}
              </button>
            </div>

            {trendingLoading && trendingBooks.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold">
                      {i}
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {trendingBooks.map((book, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedBook(book);
                      setShowBookModal(true);
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 rounded-xl transition-all hover:shadow-md text-left group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg group-hover:text-orange-600 transition truncate">
                        {book.title}
                      </h3>
                      <p className="text-gray-600 text-sm">by {book.author}</p>
                    </div>
                    <Search className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition shrink-0" />
                  </button>
                ))}
              </div>
            )}

            <p className="text-sm text-gray-500 text-center mt-6">
              <Sparkles className="w-4 h-4 inline mr-1" />
              Powered by Groq AI · Updated in real-time
            </p>
          </div>

          {/* Featured Stories Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Gift className="w-6 h-6 text-blue-600" />
              Featured Stories
            </h2>
            {donations.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No stories yet. Be the first to share!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {donations.slice(0, 3).map((donation) => (
                  <div
                    key={donation._id}
                    onClick={() => handleOpenPostDetail(donation)}
                    className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition cursor-pointer group"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={donation.image}
                        alt={donation.bookName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-bold text-lg">{donation.bookName}</h3>
                        <p className="text-white/80 text-sm">by {donation.userName}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-700 text-sm line-clamp-2">{donation.story}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* About Us Link Section */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-3xl p-8 border border-orange-100">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">About ReadCrew</h2>
                  <p className="text-gray-600">Discover our story and mission</p>
                </div>
              </div>
              <a
                href="/about"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage('about');
                }}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition transform hover:scale-105 flex items-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Learn About Us
              </a>
            </div>
          </div>
        </div>
      )}

      {/* About Us Page */}
      {currentPage === 'about' && (
        <div className="max-w-4xl mx-auto px-6 py-12">
          <button
            onClick={() => setCurrentPage('home')}
            className="mb-8 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold"
          >
            <ChevronLeft className="w-5 h-5" /> Back to Home
          </button>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-12 text-white">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-orange-500" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">About ReadCrew</h1>
                  <p className="text-orange-100 text-lg">Share • Inspire • Discover</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 md:p-12">
              <div className="prose prose-lg max-w-none">
                <p className="text-xl text-gray-700 leading-relaxed mb-8">
                  ReadCrew was born from a simple yet powerful belief — reading can transform lives.
                </p>

                <p className="text-gray-700 leading-relaxed mb-6">
                  In a fast-moving digital world where attention is constantly divided, ReadCrew stands as a space that encourages people to slow down, reflect, and reconnect with the timeless habit of reading. We are a growing community committed to nurturing curiosity, critical thinking, empathy, and imagination through books.
                </p>

                <p className="text-gray-700 leading-relaxed mb-6">
                  At ReadCrew, we believe that reading is not just a hobby — it is a lifelong skill that shapes perspectives, builds confidence, and expands possibilities. Whether it's fiction that deepens emotional intelligence, non-fiction that sharpens knowledge, or poetry that touches the soul, every page holds the power to change someone's life.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-6">Our Mission</h2>
                
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  {[
                    "Inculcate a consistent reading habit",
                    "Create a supportive and inspiring reading community",
                    "Encourage meaningful discussions around books",
                    "Make reading accessible, enjoyable, and rewarding"
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 bg-orange-50 p-4 rounded-xl">
                      <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>

                <p className="text-gray-700 leading-relaxed mb-6">
                  ReadCrew is not just a website — it is a movement towards mindful growth. We aim to bring together readers from different backgrounds who share one common goal: becoming better thinkers, better communicators, and better humans through the habit of reading.
                </p>

                <p className="text-gray-700 leading-relaxed mb-6">
                  We are building a space where stories are shared, ideas are exchanged, and readers grow — together.
                </p>

                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-8 rounded-2xl text-center mt-10">
                  <h3 className="text-2xl font-bold mb-4">Join the Crew</h3>
                  <p className="text-xl mb-6">Share • Inspire • Discover</p>
                  <button
                    onClick={() => setCurrentPage('home')}
                    className="px-8 py-3 bg-white text-orange-600 rounded-xl font-semibold hover:shadow-lg transition transform hover:scale-105"
                  >
                    Start Reading Today
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Detail Modal */}
      {showBookModal && selectedBook && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedBook.title}</h2>
                <p className="text-xl text-gray-600">by {selectedBook.author}</p>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                Why This Book?
              </h3>
              <p className="text-gray-700 leading-relaxed">{selectedBook.description}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBookModal(false);
                  setRecommendKeywords(selectedBook.title);
                  setCurrentPage('recommend');
                  setTimeout(() => handleRecommendation(), 500);
                }}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition"
              >
                Find Similar Books
              </button>
              <button
                onClick={() => setShowBookModal(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Stories Page */}
      {currentPage === 'donation' && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button
            onClick={() => setCurrentPage('home')}
            className="mb-6 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold"
          >
            <ChevronLeft className="w-5 h-5" /> Back to Home
          </button>

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Shared Stories</h1>
             
            </div>
            <button
              onClick={() => setShowSavedPosts(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition flex items-center gap-2"
            >
              <Bookmark className="w-5 h-5" />
              Saved ({userActivity.savedPosts.length})
            </button>
          </div>

          {/* Upload Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Share Your Reading Journey</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Book Name *</label>
                <input
                  type="text"
                  value={donationForm.bookName}
                  onChange={(e) => setDonationForm({ ...donationForm, bookName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition"
                  placeholder="Enter book name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Photo *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer transition bg-gray-50 hover:bg-blue-50"
                >
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Choose Image (max 2MB)</span>
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Story *</label>
                <textarea
                  value={donationForm.story}
                  onChange={(e) => setDonationForm({ ...donationForm, story: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition"
                  rows="4"
                  placeholder="Share the special moment..."
                />
              </div>
              {donationForm.imagePreview && (
                <div className="md:col-span-2">
                  <img src={donationForm.imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-xl shadow-lg" />
                  <button
                    onClick={() => setDonationForm({ ...donationForm, image: null, imagePreview: null })}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove Image
                  </button>
                </div>
              )}
              <div className="md:col-span-2">
                <button
                  onClick={handleDonationSubmit}
                  disabled={!donationForm.bookName || !donationForm.story || !donationForm.image || loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {loading ? 'Sharing...' : 'Share My Story'}
                </button>
              </div>
            </div>
          </div>

          {/* Stories Grid */}
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Community Stories</h2>
          {donations.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl">
              <Gift className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No stories yet. Be the first to share!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {donations.map(donation => (
                <div 
                  key={donation._id} 
                  id={`post-${donation._id}`}
                  onClick={() => handleOpenPostDetail(donation)}
                  className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
                >
                  <div className="relative overflow-hidden h-48">
                    <img 
                      src={donation.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c'} 
                      alt={donation.bookName} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {donation.userEmail === currentUser?.email && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDonation(donation._id);
                        }}
                        className="absolute top-3 right-3 w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-bold text-xl mb-1">{donation.bookName}</h3>
                      <p className="text-white/80 text-sm">by {donation.userName}</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-700 line-clamp-3 mb-4">{donation.story}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeDonation(donation._id);
                        }}
                        className={`flex items-center gap-2 transition ${
                          userActivity.likedPosts.includes(donation._id) ? 'text-pink-600' : 'text-gray-400 hover:text-pink-600'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${userActivity.likedPosts.includes(donation._id) ? 'fill-current' : ''}`} />
                        <span className="font-semibold">{donation.likes || 0}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveDonation(donation._id);
                        }}
                        className={`flex items-center gap-2 transition ${
                          userActivity.savedPosts.includes(donation._id) ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'
                        }`}
                      >
                        <Bookmark className={`w-5 h-5 ${userActivity.savedPosts.includes(donation._id) ? 'fill-current' : ''}`} />
                        <span className="font-semibold">{donation.saves || 0}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareDonation(donation._id);
                        }}
                        className="flex items-center gap-2 text-gray-400 hover:text-green-600 transition"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                      <span className="text-sm text-gray-500">{new Date(donation.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Book Reviews Page */}
      {currentPage === 'reviews' && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button onClick={() => setCurrentPage('home')} className="mb-6 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold">
            <ChevronLeft className="w-5 h-5" /> Back to Home
          </button>

          <div className="mb-8 rounded-2xl overflow-hidden bg-gradient-to-r from-purple-900 to-pink-900 p-12">
            <h1 className="text-4xl font-bold text-white mb-2">Book Reviews</h1>
            <p className="text-purple-100">Discover what others are reading</p>
          </div>

          {/* Search and Actions */}
          <div className="flex gap-3 items-center mb-8">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Search by book, author, or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
              />
              <button 
                onClick={handleSearchReviews}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition font-medium"
              >
                <Search className="w-5 h-5" />
              </button>
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    fetchReviews();
                  }}
                  className="bg-gray-500 text-white px-4 py-3 rounded-xl hover:bg-gray-600 transition"
                >
                  Clear
                </button>
              )}
            </div>

            <button 
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition font-medium flex items-center gap-2"
              onClick={() => setShowCreateReviewForm(!showCreateReviewForm)}
            >
              {showCreateReviewForm ? 'Cancel' : 'Write Review'}
            </button>
          </div>

          {/* Create Review Form */}
          {showCreateReviewForm && (
            <CreateReviewForm
              currentUser={currentUser}
              onReviewCreated={handleReviewCreated}
              onCancel={() => setShowCreateReviewForm(false)}
            />
          )}

          {/* Reviews List */}
          <div className="mt-8">
            {reviewsLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading reviews...</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
                <p className="text-2xl text-gray-700 mb-2">No reviews found</p>
                {searchQuery && <p className="text-gray-500">Try a different search term</p>}
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-4 py-3 rounded-xl mb-6">
                  {filteredReviews.length} {filteredReviews.length === 1 ? 'review' : 'reviews'} found
                </div>
                {filteredReviews.map((review) => (
                  <ReviewCard
                    key={review._id}
                    review={review}
                    currentUserEmail={currentUser?.email}
                    onUpdate={fetchReviews}
                    onDelete={handleReviewDeleted}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Recommendations Page */}
      {currentPage === 'recommend' && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button onClick={() => setCurrentPage('home')} className="mb-6 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold">
            <ChevronLeft className="w-5 h-5" /> Back to Home
          </button>

          <div className="mb-8 rounded-2xl overflow-hidden bg-gradient-to-r from-orange-900 to-red-900 p-12">
            <h1 className="text-4xl font-bold text-white mb-2">Book Recommendations</h1>
            <p className="text-orange-100">AI-powered suggestions from 24+ genres</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Find Your Next Read</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="relative mb-6">
                  <Sparkles className="absolute left-4 top-4 text-orange-500" />
                  <input
                    type="text"
                    value={recommendKeywords}
                    onChange={(e) => setRecommendKeywords(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleRecommendation()}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition"
                    placeholder="fantasy, mystery, self-help, romance..."
                    disabled={aiLoading}
                  />
                </div>
                <button
                  onClick={handleRecommendation}
                  disabled={!recommendKeywords || aiLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 mb-4"
                >
                  {aiLoading ? 'Getting AI Suggestions...' : 'Get AI Recommendations'}
                </button>
                <button
                  onClick={handleBrowseCategories}
                  disabled={aiLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  Browse All Categories
                </button>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900">AI Search Tips:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500 mt-1" />
                    <span>Ask about topics: "books about space exploration"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500 mt-1" />
                    <span>Describe your mood: "lighthearted romance novels"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500 mt-1" />
                    <span>Compare authors: "books similar to Stephen King"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500 mt-1" />
                    <span>Powered by Groq Llama 3.3 · 70B</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* AI Streaming Response */}
          {(aiLoading || aiResponse) && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">AI Recommendations</h2>
                  <p className="text-sm text-gray-500">Powered by Groq · Llama 3.3</p>
                </div>
                {!aiLoading && (
                  <button
                    onClick={() => setAiResponse('')}
                    className="ml-auto text-gray-400 hover:text-gray-600 transition"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100 min-h-32">
                {aiLoading && !aiResponse && (
                  <div className="flex items-center gap-3 text-orange-600">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-sm font-medium">Finding perfect books for you...</span>
                  </div>
                )}

                <div
                  className="text-gray-800 leading-relaxed text-base"
                  dangerouslySetInnerHTML={{
                    __html: aiResponse
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-orange-700">$1</strong>')
                      .replace(/\n\n/g, '</p><p class="mt-4">')
                      .replace(/\n/g, '<br/>')
                  }}
                />

                {/* Blinking cursor while streaming */}
                {aiLoading && aiResponse && (
                  <span className="inline-block w-0.5 h-5 bg-orange-500 animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            </div>
          )}

          {/* Static recommendations (fallback) */}
          {recommendations.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {recommendations[0].type === 'category' ? 'Recommended Categories' : 
                   recommendations[0].type === 'keyword' ? `Results for "${recommendations[0].keyword}"` : 
                   'Popular Recommendations'}
                </h2>
                <button
                  onClick={() => setRecommendations([])}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear Results
                </button>
              </div>

              <div className="space-y-8">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-2xl overflow-hidden">
                    {rec.type === 'category' ? (
                      <div>
                        <div className="bg-gradient-to-r from-orange-100 to-red-100 p-6">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{rec.emoji}</span>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{rec.category}</h3>
                              <p className="text-gray-600">{rec.description}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <h4 className="font-semibold text-gray-700 mb-4">Recommended Books:</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {rec.books.map((book, bookIdx) => (
                              <div key={bookIdx} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h5 className="font-bold text-gray-900">{book.title}</h5>
                                    <p className="text-sm text-gray-600">by {book.author}</p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span className="text-sm font-semibold">{book.rating}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : rec.type === 'keyword' ? (
                      <div>
                        <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-6">
                          <h3 className="text-xl font-bold text-gray-900">Books matching "{rec.keyword}"</h3>
                        </div>
                        <div className="p-6">
                          <div className="grid md:grid-cols-2 gap-4">
                            {rec.books.map((book, bookIdx) => (
                              <div key={bookIdx} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h5 className="font-bold text-gray-900">{book.title}</h5>
                                    <p className="text-sm text-gray-600">by {book.author}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                        {book.category}
                                      </span>
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span className="text-sm font-semibold">{book.rating}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="bg-gradient-to-r from-green-100 to-teal-100 p-6">
                          <h3 className="text-xl font-bold text-gray-900">{rec.title}</h3>
                        </div>
                        <div className="p-6">
                          <div className="grid md:grid-cols-2 gap-4">
                            {rec.books.map((book, bookIdx) => (
                              <div key={bookIdx} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h5 className="font-bold text-gray-900">{book.title}</h5>
                                    <p className="text-sm text-gray-600">by {book.author}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                        {book.category}
                                      </span>
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span className="text-sm font-semibold">{book.rating}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Category Grid */}
          {recommendations.length === 0 && !aiResponse && !aiLoading && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Popular Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {BOOK_RECOMMENDATIONS.slice(0, 12).map(category => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setRecommendKeywords(category.category.toLowerCase());
                      setTimeout(() => handleRecommendation(), 100);
                    }}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition text-center border border-gray-200 hover:border-orange-300"
                  >
                    <div className="text-2xl mb-2">{category.emoji}</div>
                    <p className="text-sm font-medium text-gray-700 truncate">{category.category}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-orange-500 text-2xl font-bold">
                    {currentUser?.name?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{currentUser?.name}</h2>
                    <p className="text-orange-100">{currentUser?.email}</p>
                  </div>
                </div>
                <button onClick={() => setShowProfile(false)} className="text-white hover:text-orange-100 p-2">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Reading Goal Section */}
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">Reading Goal</h3>
                  </div>
                  <button
                    onClick={() => setShowGoalModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" /> Edit Goal
                  </button>
                </div>
                <p className="text-gray-700">
                  <span className="text-3xl font-bold text-blue-600">{readingGoal.monthly}</span> books this month
                </p>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Books to Read:</p>
                  {readingGoal.books.length === 0 ? (
                    <p className="text-gray-500 text-sm">No books added yet</p>
                  ) : (
                    <div className="space-y-2">
                      {readingGoal.books.map((book, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <button
                            onClick={() => handleToggleBook(idx)}
                            className={`w-5 h-5 rounded flex items-center justify-center ${book.completed ? 'bg-green-500' : 'bg-gray-200'}`}
                          >
                            {book.completed && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <span className={book.completed ? 'line-through text-gray-500' : 'text-gray-700'}>{book.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => { setShowProfile(false); setShowLikedPosts(true); }}
                  className="bg-gradient-to-br from-pink-50 to-white p-4 rounded-xl border border-pink-100 hover:border-pink-300 transition cursor-pointer text-center"
                >
                  <Heart className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{userActivity.likedPosts.length}</p>
                  <p className="text-sm text-gray-600">Liked</p>
                </button>
                <button
                  onClick={() => { setShowProfile(false); setShowSavedPosts(true); }}
                  className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100 hover:border-blue-300 transition cursor-pointer text-center"
                >
                  <Bookmark className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{userActivity.savedPosts.length}</p>
                  <p className="text-sm text-gray-600">Saved</p>
                </button>
                <button
                  onClick={() => { setShowProfile(false); setShowSharedPosts(true); }}
                  className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl border border-green-100 hover:border-green-300 transition cursor-pointer text-center"
                >
                  <Share2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{userActivity.sharedPosts.length}</p>
                  <p className="text-sm text-gray-600">Shared</p>
                </button>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-xl transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-6">Set Reading Goal</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Books to read this month</label>
                <input
                  type="number"
                  value={readingGoal.monthly}
                  onChange={(e) => setReadingGoal({ ...readingGoal, monthly: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Books you want to read</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newBook}
                    onChange={(e) => setNewBook(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddBook()}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                    placeholder="Add a book..."
                  />
                  <button
                    onClick={handleAddBook}
                    className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {readingGoal.books.map((book, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <button
                        onClick={() => handleToggleBook(idx)}
                        className={`w-6 h-6 rounded flex items-center justify-center ${book.completed ? 'bg-green-500' : 'bg-gray-200'}`}
                      >
                        {book.completed && <Check className="w-4 h-4 text-white" />}
                      </button>
                      <span className={`flex-1 ${book.completed ? 'line-through text-gray-500' : ''}`}>{book.title}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateGoal}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg"
                >
                  Save Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Posts Modal */}
      {showSavedPosts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Bookmark className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Saved Posts</h2>
                    <p className="text-blue-100">{donations.filter(d => userActivity.savedPosts.includes(d._id)).length} posts saved</p>
                  </div>
                </div>
                <button onClick={() => setShowSavedPosts(false)} className="text-white hover:text-blue-100">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {donations.filter(d => userActivity.savedPosts.includes(d._id)).length === 0 ? (
                <div className="text-center py-12">
                  <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No saved posts yet</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {donations.filter(d => userActivity.savedPosts.includes(d._id)).map(donation => (
                    <div 
                      key={donation._id} 
                      className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-100 hover:border-blue-300 transition cursor-pointer" 
                      onClick={() => { setShowSavedPosts(false); handleOpenPostDetail(donation); }}
                    >
                      <h3 className="font-bold text-lg mb-2">{donation.bookName}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{donation.story}</p>
                      <img src={donation.image} alt={donation.bookName} className="w-full h-32 object-cover rounded-lg" />
                      <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                        <span>by {donation.userName}</span>
                        <span className="text-blue-600 font-semibold">View Post →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Liked Posts Modal */}
      {showLikedPosts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-pink-500 to-red-500 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Heart className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Liked Posts</h2>
                    <p className="text-pink-100">{donations.filter(d => userActivity.likedPosts.includes(d._id)).length} posts liked</p>
                  </div>
                </div>
                <button onClick={() => setShowLikedPosts(false)} className="text-white hover:text-pink-100">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {donations.filter(d => userActivity.likedPosts.includes(d._id)).length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No liked posts yet</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {donations.filter(d => userActivity.likedPosts.includes(d._id)).map(donation => (
                    <div 
                      key={donation._id} 
                      className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-4 border border-pink-100 hover:border-pink-300 transition cursor-pointer" 
                      onClick={() => { setShowLikedPosts(false); handleOpenPostDetail(donation); }}
                    >
                      <h3 className="font-bold text-lg mb-2">{donation.bookName}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{donation.story}</p>
                      <img src={donation.image} alt={donation.bookName} className="w-full h-32 object-cover rounded-lg" />
                      <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                        <span>by {donation.userName}</span>
                        <span className="text-pink-600 font-semibold">View Post →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shared Posts Modal */}
      {showSharedPosts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Share2 className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Shared Posts</h2>
                    <p className="text-green-100">{donations.filter(d => userActivity.sharedPosts.includes(d._id)).length} posts shared</p>
                  </div>
                </div>
                <button onClick={() => setShowSharedPosts(false)} className="text-white hover:text-green-100">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {donations.filter(d => userActivity.sharedPosts.includes(d._id)).length === 0 ? (
                <div className="text-center py-12">
                  <Share2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No shared posts yet</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {donations.filter(d => userActivity.sharedPosts.includes(d._id)).map(donation => (
                    <div 
                      key={donation._id} 
                      className="bg-gradient-to-br from-green-50 to-white rounded-xl p-4 border border-green-100 hover:border-green-300 transition cursor-pointer" 
                      onClick={() => { setShowSharedPosts(false); handleOpenPostDetail(donation); }}
                    >
                      <h3 className="font-bold text-lg mb-2">{donation.bookName}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{donation.story}</p>
                      <img src={donation.image} alt={donation.bookName} className="w-full h-32 object-cover rounded-lg" />
                      <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                        <span>by {donation.userName}</span>
                        <span className="text-green-600 font-semibold">View Post →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {showPostDetail && selectedPost && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <button
                onClick={() => setShowPostDetail(false)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={() => setShowPostDetail(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Image Section */}
              <div className="relative rounded-2xl overflow-hidden mb-6">
                <img 
                  src={selectedPost.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c'} 
                  alt={selectedPost.bookName}
                  className="w-full h-96 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <h1 className="text-3xl font-bold text-white mb-2">{selectedPost.bookName}</h1>
                  <p className="text-white/80">Shared by {selectedPost.userName}</p>
                </div>
                
                {selectedPost.userEmail === currentUser?.email && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this story?')) {
                        handleDeleteDonation(selectedPost._id);
                        setShowPostDetail(false);
                      }
                    }}
                    className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {/* Story Content */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">The Story</h2>
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                    {selectedPost.story}
                  </p>
                </div>
              </div>
              
              {/* Stats and Actions */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(selectedPost.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLikeDonation(selectedPost._id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      userActivity.likedPosts.includes(selectedPost._id) 
                        ? 'bg-pink-50 text-pink-600 border border-pink-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${userActivity.likedPosts.includes(selectedPost._id) ? 'fill-current' : ''}`} />
                    <span className="font-semibold">{selectedPost.likes || 0}</span>
                  </button>
                  
                  <button
                    onClick={() => handleSaveDonation(selectedPost._id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      userActivity.savedPosts.includes(selectedPost._id)
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Bookmark className={`w-5 h-5 ${userActivity.savedPosts.includes(selectedPost._id) ? 'fill-current' : ''}`} />
                    <span className="font-semibold">{selectedPost.saves || 0}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleShareDonation(selectedPost._id);
                      if (navigator.share) {
                        navigator.share({
                          title: `Check out this story about ${selectedPost.bookName}`,
                          text: selectedPost.story.substring(0, 100) + '...',
                          url: window.location.href,
                        });
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">ReadCrew</h3>
                <p className="text-gray-400">Let's make reading a habit</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400">© {new Date().getFullYear()} ReadCrew Community</p>
              <p className="text-gray-500 text-sm mt-1">Made with love for book lovers</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;