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
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
          <div className="flex-1 w-full">
            {isEditing ? (
              <input
                type="text"
                value={editForm.bookName}
                onChange={(e) => setEditForm({...editForm, bookName: e.target.value})}
                className="text-xl font-bold mb-1 w-full px-3 py-2 border rounded-lg"
                placeholder="Book Name"
              />
            ) : (
              <h3 className="text-xl font-bold text-gray-900 break-words">{review.bookName}</h3>
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
              <p className="text-gray-600 mb-2 break-words">by {review.author}</p>
            )}
          </div>
          {review.userEmail === currentUserEmail && (
            <div className="flex gap-2 w-full sm:w-auto">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleUpdate}
                    disabled={loading}
                    className="flex-1 sm:flex-none px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex-1 sm:flex-none px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-sm"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 sm:flex-none px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 text-sm"
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
          <p className="text-gray-700 mb-4 break-words">{review.review}</p>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            {isEditing ? (
              <select
                value={editForm.sentiment}
                onChange={(e) => setEditForm({...editForm, sentiment: e.target.value})}
                className="px-3 py-1 border rounded-lg text-sm"
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
              by {review.userName}
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
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 mb-8 border border-gray-100">
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
          <div className="flex flex-col sm:flex-row gap-3">
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
        
        <div className="flex flex-col sm:flex-row gap-3">
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
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
      // Check file size - increased to 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB');
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
    if (!donationForm.bookName || !donationForm.story) {
      alert('Please fill all required fields');
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
        image: donationForm.image, // This can be null (no image uploaded)
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
            <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-8 sm:p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-10 h-10 text-orange-500" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold">ReadCrew</h1>
                    <p className="text-orange-100 text-sm sm:text-base">Share • Inspire • Discover</p>
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold mb-4">Let's make reading a habit</h2>
                <p className="text-orange-100 mb-8 leading-relaxed text-sm sm:text-base">
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
                      <span className="text-sm sm:text-base">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 sm:p-12">
              {!showOTP ? (
                <>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                  <p className="text-gray-600 mb-8 text-sm sm:text-base">Enter your details to get started</p>

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
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Verify OTP</h2>
                  <p className="text-gray-600 mb-8 text-sm sm:text-base">Enter the code sent to {verificationData.email}</p>

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
        <div className={`notification fixed top-4 right-4 left-4 sm:left-auto sm:right-4 px-4 sm:px-6 py-3 rounded-xl font-medium text-white shadow-lg z-50 text-sm sm:text-base ${
          notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'error' ? 'bg-red-500' :
          'bg-blue-500'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">ReadCrew</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Let's make reading a habit</p>
            </div>
          </div>

          {/* Desktop Navigation */}
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
                  <span className="hidden lg:inline">{name}</span>
                </span>
              </button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 rounded-xl transition"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {currentUser?.name?.charAt(0)}
              </div>
              <span className="hidden lg:block font-medium text-gray-700">{currentUser?.name?.split(' ')[0]}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-4">
            <div className="flex flex-col space-y-2">
              {[
                { name: 'Home', page: 'home', icon: BookOpen },
                { name: 'Shared Stories', page: 'donation', icon: Gift },
                { name: 'Book Reviews', page: 'reviews', icon: Star },
                { name: 'Recommendations', page: 'recommend', icon: Sparkles }
              ].map(({ name, page, icon: Icon }) => (
                <button
                  key={page}
                  onClick={() => {
                    setCurrentPage(page);
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all w-full ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {name}
                </button>
              ))}
              <button
                onClick={() => {
                  setShowProfile(true);
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 w-full"
              >
                <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {currentUser?.name?.charAt(0)}
                </div>
                Profile
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Home Page - Removed duplicate header text */}
      {currentPage === 'home' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Navigation Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-12">
            <button
              onClick={() => setCurrentPage('donation')}
              className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition text-center border-2 border-transparent hover:border-blue-300"
            >
              <Gift className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 mx-auto mb-2 sm:mb-3" />
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Shared Stories</h3>
            </button>
            <button
              onClick={() => setCurrentPage('reviews')}
              className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition text-center border-2 border-transparent hover:border-purple-300"
            >
              <Star className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 mx-auto mb-2 sm:mb-3" />
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Book Reviews</h3>
            </button>
            <button
              onClick={() => setCurrentPage('recommend')}
              className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition text-center border-2 border-transparent hover:border-orange-300"
            >
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600 mx-auto mb-2 sm:mb-3" />
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">AI Recommendations</h3>
            </button>
          </div>

          {/* Top Trending Books Section */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-8 mb-8 sm:mb-12 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                <h2 className="text-xl sm:text-3xl font-bold text-gray-900">Trending Books</h2>
              </div>
              <button
                onClick={fetchTrendingBooks}
                disabled={trendingLoading}
                className="w-full sm:w-auto px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
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
              <div className="space-y-2 sm:space-y-3">
                {trendingBooks.map((book, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedBook(book);
                      setShowBookModal(true);
                    }}
                    className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 rounded-xl transition-all hover:shadow-md text-left group"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-lg group-hover:text-orange-600 transition truncate">
                        {book.title}
                      </h3>
                      <p className="text-gray-600 text-xs sm:text-sm truncate">by {book.author}</p>
                    </div>
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-orange-500 transition shrink-0" />
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs sm:text-sm text-gray-500 text-center mt-4 sm:mt-6">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
              Powered by Groq AI
            </p>
          </div>

          {/* Featured Stories Section */}
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              Featured Stories
            </h2>
            {donations.length === 0 ? (
              <div className="bg-white rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center">
                <Gift className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">No stories yet. Be the first to share!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {donations.slice(0, 3).map((donation) => (
                  <div
                    key={donation._id}
                    onClick={() => handleOpenPostDetail(donation)}
                    className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition cursor-pointer group"
                  >
                    <div className="relative h-40 sm:h-48 overflow-hidden">
                      {donation.image ? (
                        <img
                          src={donation.image}
                          alt={donation.bookName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                        <h3 className="text-white font-bold text-base sm:text-lg truncate">{donation.bookName}</h3>
                        <p className="text-white/80 text-xs sm:text-sm truncate">by {donation.userName}</p>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4">
                      <p className="text-gray-700 text-xs sm:text-sm line-clamp-2">{donation.story}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* About Us Link Section */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-orange-100">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900">About ReadCrew</h2>
                  <p className="text-gray-600 text-sm sm:text-base">Discover our story and mission</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentPage('about')}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                Learn About Us
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Us Page */}
      {currentPage === 'about' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <button
            onClick={() => setCurrentPage('home')}
            className="mb-6 sm:mb-8 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold text-sm sm:text-base"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back to Home
          </button>

          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-6 sm:p-12 text-white">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-orange-500" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-4xl font-bold">About ReadCrew</h1>
                  <p className="text-orange-100 text-sm sm:text-lg">Share • Inspire • Discover</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-8 md:p-12">
              <div className="prose prose-sm sm:prose-lg max-w-none">
                <p className="text-base sm:text-xl text-gray-700 leading-relaxed mb-6 sm:mb-8">
                  ReadCrew was born from a simple yet powerful belief — reading can transform lives.
                </p>

                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 sm:mb-6">
                  In a fast-moving digital world where attention is constantly divided, ReadCrew stands as a space that encourages people to slow down, reflect, and reconnect with the timeless habit of reading. We are a growing community committed to nurturing curiosity, critical thinking, empathy, and imagination through books.
                </p>

                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-4 sm:mb-6">Our Mission</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  {[
                    "Inculcate a consistent reading habit",
                    "Create a supportive and inspiring reading community",
                    "Encourage meaningful discussions around books",
                    "Make reading accessible, enjoyable, and rewarding"
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-2 sm:gap-3 bg-orange-50 p-3 sm:p-4 rounded-xl">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold mt-0.5 shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-sm sm:text-base text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 sm:p-8 rounded-xl sm:rounded-2xl text-center mt-8 sm:mt-10">
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Join the Crew</h3>
                  <p className="text-base sm:text-xl mb-4 sm:mb-6">Share • Inspire • Discover</p>
                  <button
                    onClick={() => setCurrentPage('home')}
                    className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-white text-orange-600 rounded-xl font-semibold hover:shadow-lg transition transform hover:scale-105 text-sm sm:text-base"
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
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full p-4 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-4 mb-4 sm:mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 break-words">{selectedBook.title}</h2>
                <p className="text-lg sm:text-xl text-gray-600 break-words">by {selectedBook.author}</p>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-base sm:text-lg">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                Why This Book?
              </h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{selectedBook.description}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowBookModal(false);
                  setRecommendKeywords(selectedBook.title);
                  setCurrentPage('recommend');
                  setTimeout(() => handleRecommendation(), 500);
                }}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 sm:px-6 rounded-xl font-semibold hover:shadow-lg transition text-sm sm:text-base"
              >
                Find Similar Books
              </button>
              <button
                onClick={() => setShowBookModal(false)}
                className="px-4 sm:px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Stories Page */}
      {currentPage === 'donation' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <button
            onClick={() => setCurrentPage('home')}
            className="mb-4 sm:mb-6 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold text-sm sm:text-base"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back to Home
          </button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Shared Stories</h1>
            </div>
            <button
              onClick={() => setShowSavedPosts(true)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 text-sm"
            >
              <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
              Saved ({userActivity.savedPosts.length})
            </button>
          </div>

          {/* Upload Form */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8 mb-8 sm:mb-12 border border-gray-100">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Share Your Reading Journey</h2>
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Book Name *</label>
                <input
                  type="text"
                  value={donationForm.bookName}
                  onChange={(e) => setDonationForm({ ...donationForm, bookName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition text-sm"
                  placeholder="Enter book name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Photo (Optional, max 10MB)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer transition bg-gray-50 hover:bg-blue-50 text-sm"
                >
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <span className="text-gray-600">{donationForm.image ? 'Change Image' : 'Choose Image (optional)'}</span>
                </label>
                {donationForm.image && (
                  <button
                    onClick={() => setDonationForm({ ...donationForm, image: null, imagePreview: null })}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove Image
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Story *</label>
                <textarea
                  value={donationForm.story}
                  onChange={(e) => setDonationForm({ ...donationForm, story: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition text-sm"
                  rows="4"
                  placeholder="Share the special moment..."
                />
              </div>
              {donationForm.imagePreview && (
                <div>
                  <img src={donationForm.imagePreview} alt="Preview" className="w-full h-48 sm:h-64 object-cover rounded-xl shadow-lg" />
                </div>
              )}
              <div>
                <button
                  onClick={handleDonationSubmit}
                  disabled={!donationForm.bookName || !donationForm.story || loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {loading ? 'Sharing...' : 'Share My Story'}
                </button>
              </div>
            </div>
          </div>

          {/* Stories Grid */}
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Community Stories</h2>
          {donations.length === 0 ? (
            <div className="text-center py-12 sm:py-20 bg-white rounded-xl sm:rounded-2xl">
              <Gift className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm sm:text-lg">No stories yet. Be the first to share!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {donations.map(donation => (
                <div 
                  key={donation._id} 
                  id={`post-${donation._id}`}
                  onClick={() => handleOpenPostDetail(donation)}
                  className="group bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
                >
                  <div className="relative overflow-hidden h-40 sm:h-48">
                    {donation.image ? (
                      <img 
                        src={donation.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c'} 
                        alt={donation.bookName} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {donation.userEmail === currentUser?.email && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDonation(donation._id);
                        }}
                        className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                    <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4">
                      <h3 className="text-white font-bold text-base sm:text-xl mb-1 truncate">{donation.bookName}</h3>
                      <p className="text-white/80 text-xs sm:text-sm truncate">by {donation.userName}</p>
                    </div>
                  </div>
                  <div className="p-3 sm:p-5">
                    <p className="text-gray-700 text-xs sm:text-sm line-clamp-3 mb-3 sm:mb-4">{donation.story}</p>
                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100 text-xs sm:text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeDonation(donation._id);
                        }}
                        className={`flex items-center gap-1 sm:gap-2 transition ${
                          userActivity.likedPosts.includes(donation._id) ? 'text-pink-600' : 'text-gray-400 hover:text-pink-600'
                        }`}
                      >
                        <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${userActivity.likedPosts.includes(donation._id) ? 'fill-current' : ''}`} />
                        <span className="font-semibold text-xs sm:text-sm">{donation.likes || 0}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveDonation(donation._id);
                        }}
                        className={`flex items-center gap-1 sm:gap-2 transition ${
                          userActivity.savedPosts.includes(donation._id) ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'
                        }`}
                      >
                        <Bookmark className={`w-3 h-3 sm:w-4 sm:h-4 ${userActivity.savedPosts.includes(donation._id) ? 'fill-current' : ''}`} />
                        <span className="font-semibold text-xs sm:text-sm">{donation.saves || 0}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareDonation(donation._id);
                        }}
                        className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-green-600 transition"
                      >
                        <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <span className="text-gray-400 text-xs">{new Date(donation.createdAt).toLocaleDateString().slice(0,5)}</span>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <button onClick={() => setCurrentPage('home')} className="mb-4 sm:mb-6 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold text-sm sm:text-base">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back to Home
          </button>

          <div className="mb-6 sm:mb-8 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-r from-purple-900 to-pink-900 p-6 sm:p-12">
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">Book Reviews</h1>
            <p className="text-purple-100 text-sm sm:text-base">Discover what others are reading</p>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6 sm:mb-8">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-sm"
              />
              <button 
                onClick={handleSearchReviews}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:shadow-lg transition font-medium"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    fetchReviews();
                  }}
                  className="bg-gray-500 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl hover:bg-gray-600 transition text-sm"
                >
                  Clear
                </button>
              )}
            </div>

            <button 
              className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:shadow-lg transition font-medium flex items-center justify-center gap-2 text-sm"
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
          <div className="mt-6 sm:mt-8">
            {reviewsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 text-sm sm:text-base">Loading reviews...</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-12 sm:py-20 bg-white rounded-xl sm:rounded-2xl shadow-lg">
                <p className="text-xl sm:text-2xl text-gray-700 mb-2">No reviews found</p>
                {searchQuery && <p className="text-gray-500 text-sm">Try a different search term</p>}
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-3 sm:px-4 py-2 sm:py-3 rounded-xl mb-4 sm:mb-6 text-sm">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <button onClick={() => setCurrentPage('home')} className="mb-4 sm:mb-6 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold text-sm sm:text-base">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back to Home
          </button>

          <div className="mb-6 sm:mb-8 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-r from-orange-900 to-red-900 p-6 sm:p-12">
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">Book Recommendations</h1>
            <p className="text-orange-100 text-sm sm:text-base">AI-powered suggestions</p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8 border border-gray-100 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Find Your Next Read</h2>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
              <div>
                <div className="relative mb-4">
                  <Sparkles className="absolute left-3 sm:left-4 top-3 sm:top-4 text-orange-500 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    value={recommendKeywords}
                    onChange={(e) => setRecommendKeywords(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleRecommendation()}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition text-sm"
                    placeholder="fantasy, mystery, self-help..."
                    disabled={aiLoading}
                  />
                </div>
                <button
                  onClick={handleRecommendation}
                  disabled={!recommendKeywords || aiLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-xl transition-all disabled:opacity-50 mb-3"
                >
                  {aiLoading ? 'Getting AI Suggestions...' : 'Get AI Recommendations'}
                </button>
                <button
                  onClick={handleBrowseCategories}
                  disabled={aiLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  Browse Categories
                </button>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">AI Tips:</h3>
                <ul className="space-y-2 text-gray-700 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 mt-1 shrink-0" />
                    <span>Ask about topics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 mt-1 shrink-0" />
                    <span>Describe your mood</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 mt-1 shrink-0" />
                    <span>Compare authors</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* AI Streaming Response - Fixed overflow */}
          {(aiLoading || aiResponse) && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8 border border-gray-100 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900">AI Recommendations</h2>
                    <p className="text-xs text-gray-500">Powered by Groq</p>
                  </div>
                </div>
                {!aiLoading && (
                  <button
                    onClick={() => setAiResponse('')}
                    className="sm:ml-auto text-gray-400 hover:text-gray-600 transition text-sm"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 sm:p-6 border border-orange-100 min-h-24 sm:min-h-32 overflow-x-auto">
                {aiLoading && !aiResponse && (
                  <div className="flex items-center gap-2 sm:gap-3 text-orange-600">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-xs sm:text-sm font-medium">Finding books...</span>
                  </div>
                )}

                <div
                  className="text-gray-800 leading-relaxed text-xs sm:text-base break-words"
                  dangerouslySetInnerHTML={{
                    __html: aiResponse
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-orange-700">$1</strong>')
                      .replace(/\n\n/g, '</p><p class="mt-3 sm:mt-4">')
                      .replace(/\n/g, '<br/>')
                  }}
                />

                {aiLoading && aiResponse && (
                  <span className="inline-block w-0.5 h-3 sm:h-5 bg-orange-500 animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            </div>
          )}

          {/* Quick Category Grid */}
          {recommendations.length === 0 && !aiResponse && !aiLoading && (
            <div className="mt-6 sm:mt-8">
              <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Popular Categories</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
                {BOOK_RECOMMENDATIONS.slice(0, 12).map(category => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setRecommendKeywords(category.category.toLowerCase());
                      setTimeout(() => handleRecommendation(), 100);
                    }}
                    className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-sm hover:shadow-md transition text-center border border-gray-200 hover:border-orange-300"
                  >
                    <div className="text-xl sm:text-2xl mb-1 sm:mb-2">{category.emoji}</div>
                    <p className="text-xs sm:text-sm font-medium text-gray-700 truncate">{category.category}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All other pages and modals remain the same but with responsive classes added */}
      {/* ... (remaining code for modals and footer) ... */}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-8 sm:py-12 mt-12 sm:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-2xl font-bold">ReadCrew</h3>
                <p className="text-gray-400 text-xs sm:text-sm hidden sm:block">Let's make reading a habit</p>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-gray-400 text-xs sm:text-sm">© {new Date().getFullYear()} ReadCrew</p>
              <p className="text-gray-500 text-xs mt-1">Made for book lovers</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;