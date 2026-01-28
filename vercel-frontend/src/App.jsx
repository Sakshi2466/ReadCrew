import React, { useState, useEffect } from 'react';
import { BookOpen, Heart, Star, Sparkles, Menu, X, Upload, Search, ThumbsUp, ThumbsDown, Share2, Bookmark, ChevronLeft, LogOut, Users, TrendingUp, Trash2, Edit, Target, Plus, Check, ArrowLeft, Clock, Gift } from 'lucide-react';

/// ✅ CORRECT
import { donationAPI, reviewAPI, otpAPI, healthCheck } from './services/api';

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
    emoji: '📘',
    description: 'Futuristic science, technology, space, time travel',
    books: [
      { title: 'Dune', author: 'Frank Herbert', rating: 4.5 },
      { title: 'Neuromancer', author: 'William Gibson', rating: 4.2 },
      { title: 'Foundation', author: 'Isaac Asimov', rating: 4.4 },
      { title: 'The Martian', author: 'Andy Weir', rating: 4.6 }
    ]
  },
  {
    id: 3,
    category: 'Romance',
    emoji: '❤️',
    description: 'Love and relationships at the core',
    books: [
      { title: 'Pride and Prejudice', author: 'Jane Austen', rating: 4.7 },
      { title: 'Me Before You', author: 'Jojo Moyes', rating: 4.3 },
      { title: 'Outlander', author: 'Diana Gabaldon', rating: 4.4 },
      { title: 'The Notebook', author: 'Nicholas Sparks', rating: 4.2 }
    ]
  },
  {
    id: 4,
    category: 'Motivational / Self-Help',
    emoji: '🧠',
    description: 'Inspiration, personal growth, mindset',
    books: [
      { title: 'The Power of Habit', author: 'Charles Duhigg', rating: 4.6 },
      { title: 'Atomic Habits', author: 'James Clear', rating: 4.8 },
      { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', rating: 4.5 },
      { title: 'You Are a Badass', author: 'Jen Sincero', rating: 4.3 }
    ]
  },
  {
    id: 5,
    category: 'Contemporary Fiction',
    emoji: '🫀',
    description: 'Modern life and real-world issues',
    books: [
      { title: 'The Goldfinch', author: 'Donna Tartt', rating: 4.1 },
      { title: 'Normal People', author: 'Sally Rooney', rating: 4.0 },
      { title: 'Little Fires Everywhere', author: 'Celeste Ng', rating: 4.2 }
    ]
  },
  {
    id: 6,
    category: 'Literary Fiction',
    emoji: '⭐',
    description: 'Quality, style, character-driven',
    books: [
      { title: 'To Kill a Mockingbird', author: 'Harper Lee', rating: 4.8 },
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', rating: 4.5 },
      { title: '1984', author: 'George Orwell', rating: 4.7 }
    ]
  },
  {
    id: 7,
    category: 'Historical Fiction',
    emoji: '🧪',
    description: 'Made-up stories based on real past events',
    books: [
      { title: 'The Book Thief', author: 'Markus Zusak', rating: 4.6 },
      { title: 'All the Light We Cannot See', author: 'Anthony Doerr', rating: 4.5 },
      { title: 'The Nightingale', author: 'Kristin Hannah', rating: 4.7 }
    ]
  },
  {
    id: 8,
    category: 'Mystery / Thriller',
    emoji: '🕵️',
    description: 'Suspense, investigation, twists',
    books: [
      { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', rating: 4.3 },
      { title: 'Gone Girl', author: 'Gillian Flynn', rating: 4.2 },
      { title: 'Sherlock Holmes', author: 'Arthur Conan Doyle', rating: 4.8 },
      { title: 'The Da Vinci Code', author: 'Dan Brown', rating: 4.1 }
    ]
  },
  {
    id: 9,
    category: 'Horror',
    emoji: '🧟',
    description: 'Scary, supernatural, creepy',
    books: [
      { title: 'It', author: 'Stephen King', rating: 4.4 },
      { title: 'The Haunting of Hill House', author: 'Shirley Jackson', rating: 4.3 },
      { title: 'Bird Box', author: 'Josh Malerman', rating: 4.0 }
    ]
  },
  {
    id: 10,
    category: 'Political Fiction',
    emoji: '🏛️',
    description: 'Politics, power, society',
    books: [
      { title: 'Animal Farm', author: 'George Orwell', rating: 4.5 },
      { title: 'The Handmaid\'s Tale', author: 'Margaret Atwood', rating: 4.4 },
      { title: '1984', author: 'George Orwell', rating: 4.7 }
    ]
  },
  {
    id: 11,
    category: 'Dystopian',
    emoji: '🧬',
    description: 'Dark future, oppressive worlds',
    books: [
      { title: 'The Hunger Games', author: 'Suzanne Collins', rating: 4.6 },
      { title: 'Divergent', author: 'Veronica Roth', rating: 4.2 },
      { title: 'Fahrenheit 451', author: 'Ray Bradbury', rating: 4.4 }
    ]
  },
  {
    id: 12,
    category: 'Young Adult (YA)',
    emoji: '🧒',
    description: 'Teen protagonists, coming-of-age',
    books: [
      { title: 'The Fault in Our Stars', author: 'John Green', rating: 4.5 },
      { title: 'The Maze Runner', author: 'James Dashner', rating: 4.1 },
      { title: 'Twilight', author: 'Stephenie Meyer', rating: 4.0 }
    ]
  },
  {
    id: 13,
    category: 'Children\'s',
    emoji: '👶',
    description: 'For young readers',
    books: [
      { title: 'Charlotte\'s Web', author: 'E.B. White', rating: 4.8 },
      { title: 'Where the Wild Things Are', author: 'Maurice Sendak', rating: 4.6 },
      { title: 'The Little Prince', author: 'Antoine de Saint-Exupéry', rating: 4.7 }
    ]
  },
  {
    id: 14,
    category: 'Biography / Autobiography',
    emoji: '🧠',
    description: 'True life stories',
    books: [
      { title: 'The Diary of a Young Girl', author: 'Anne Frank', rating: 4.8 },
      { title: 'Long Walk to Freedom', author: 'Nelson Mandela', rating: 4.7 },
      { title: 'Steve Jobs', author: 'Walter Isaacson', rating: 4.6 }
    ]
  },
  {
    id: 15,
    category: 'Memoir',
    emoji: '📖',
    description: 'Personal life memories',
    books: [
      { title: 'Educated', author: 'Tara Westover', rating: 4.7 },
      { title: 'Becoming', author: 'Michelle Obama', rating: 4.8 }
    ]
  },
  {
    id: 16,
    category: 'Business / Finance',
    emoji: '💼',
    description: 'Work, money, leadership',
    books: [
      { title: 'Rich Dad Poor Dad', author: 'Robert Kiyosaki', rating: 4.2 },
      { title: 'The Intelligent Investor', author: 'Benjamin Graham', rating: 4.5 },
      { title: 'Good to Great', author: 'Jim Collins', rating: 4.4 }
    ]
  },
  {
    id: 17,
    category: 'Drama / Literary Classic',
    emoji: '🎭',
    description: 'Emotion, tragedy, depth',
    books: [
      { title: 'Hamlet', author: 'Shakespeare', rating: 4.8 },
      { title: 'Of Mice and Men', author: 'John Steinbeck', rating: 4.6 },
      { title: 'The Catcher in the Rye', author: 'J.D. Salinger', rating: 4.3 }
    ]
  },
  {
    id: 18,
    category: 'Humor',
    emoji: '😂',
    description: 'Funny, entertaining',
    books: [
      { title: 'The Hitchhiker\'s Guide to the Galaxy', author: 'Douglas Adams', rating: 4.6 },
      { title: 'Bossypants', author: 'Tina Fey', rating: 4.3 }
    ]
  },
  {
    id: 19,
    category: 'Adventure',
    emoji: '🧩',
    description: 'Action-packed journeys',
    books: [
      { title: 'The Count of Monte Cristo', author: 'Alexandre Dumas', rating: 4.7 },
      { title: 'Treasure Island', author: 'Robert Louis Stevenson', rating: 4.5 }
    ]
  },
  {
    id: 20,
    category: 'Philosophy / Psychology',
    emoji: '💡',
    description: 'Deep thought, mind, existence',
    books: [
      { title: 'Man\'s Search for Meaning', author: 'Viktor Frankl', rating: 4.8 },
      { title: 'Meditations', author: 'Marcus Aurelius', rating: 4.6 },
      { title: 'The Power of Now', author: 'Eckhart Tolle', rating: 4.3 }
    ]
  },
  {
    id: 21,
    category: 'Epic / High Fantasy',
    emoji: '⚔️',
    description: 'Large cast, world-building',
    books: [
      { title: 'The Wheel of Time', author: 'Robert Jordan', rating: 4.5 },
      { title: 'The Stormlight Archive', author: 'Brandon Sanderson', rating: 4.8 }
    ]
  },
  {
    id: 22,
    category: 'Speculative Fiction',
    emoji: '🧠',
    description: 'What-if scenarios beyond ordinary sci-fi/fantasy',
    books: [
      { title: 'The Left Hand of Darkness', author: 'Ursula Le Guin', rating: 4.4 },
      { title: 'Never Let Me Go', author: 'Kazuo Ishiguro', rating: 4.3 }
    ]
  },
  {
    id: 23,
    category: 'Graphic Novels / Comics',
    emoji: '🎨',
    description: 'Story told with art + text',
    books: [
      { title: 'Watchmen', author: 'Alan Moore', rating: 4.7 },
      { title: 'Maus', author: 'Art Spiegelman', rating: 4.8 },
      { title: 'Persepolis', author: 'Marjane Satrapi', rating: 4.5 }
    ]
  },
  {
    id: 24,
    category: 'Classics',
    emoji: '📘',
    description: 'Time-tested masterpieces',
    books: [
      { title: 'Jane Eyre', author: 'Charlotte Brontë', rating: 4.6 },
      { title: 'War and Peace', author: 'Leo Tolstoy', rating: 4.7 },
      { title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', rating: 4.8 }
    ]
  }
];

// Validation functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);
const validateName = (name) => name && name.trim().length >= 2;

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
  
  // Backend connection states
  const [backendConnected, setBackendConnected] = useState(false);
  const [backendChecking, setBackendChecking] = useState(true);
  
  // Data states
  const [donations, setDonations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [userActivity, setUserActivity] = useState({
    savedPosts: [],
    likedPosts: [],
    sharedPosts: []
  });
  
  // Form states
  const [donationForm, setDonationForm] = useState({ bookName: '', story: '', image: null, imagePreview: null });
  const [reviewForm, setReviewForm] = useState({ bookName: '', author: '', review: '', sentiment: 'positive' });
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendKeywords, setRecommendKeywords] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [readingGoal, setReadingGoal] = useState({ monthly: 0, books: [] });
  const [newBook, setNewBook] = useState('');
  
  // Selected post for detail view
  const [selectedPost, setSelectedPost] = useState(null);

  // ✅ CORRECTED: Check backend connection on startup
  useEffect(() => {
    const checkConnection = async () => {
      console.log('🔌 Checking backend connection...');
      try {
        const status = await checkBackendConnection();
        setBackendConnected(status.connected);
        setBackendChecking(false);
        
        if (status.connected) {
          console.log('✅ Backend connected successfully');
          console.log('Backend status:', status.data);
        } else {
          console.warn('⚠️ Backend connection failed, using localStorage fallback');
        }
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

    // Load donations and reviews from localStorage as fallback
    try {
      const savedDonations = localStorage.getItem('donations');
      const savedReviews = localStorage.getItem('reviews');
      
      if (savedDonations) {
        setDonations(JSON.parse(savedDonations));
      }
      if (savedReviews) {
        const parsedReviews = JSON.parse(savedReviews);
        setReviews(parsedReviews);
        setFilteredReviews(parsedReviews);
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Load data from backend when logged in
  useEffect(() => {
    if (isLoggedIn && backendConnected) {
      loadDonationsFromBackend();
      loadReviewsFromBackend();
    }
  }, [isLoggedIn, backendConnected]);

  // Load donations from backend
  const loadDonationsFromBackend = async () => {
    try {
      console.log('📥 Loading donations from backend...');
      const result = await donationAPI.getAll();
      
      if (result.success && result.donations) {
        setDonations(result.donations);
        console.log('✅ Loaded donations from backend:', result.donations.length);
      } else {
        console.log('⚠️ No donations found in backend');
        // Keep localStorage data
      }
    } catch (error) {
      console.error('❌ Error loading donations from backend:', error);
      // Keep localStorage data
    }
  };

  // Load reviews from backend
  const loadReviewsFromBackend = async () => {
    try {
      console.log('📥 Loading reviews from backend...');
      const result = await reviewAPI.getAll();
      
      if (result.success && result.reviews) {
        setReviews(result.reviews);
        setFilteredReviews(result.reviews);
        console.log('✅ Loaded reviews from backend:', result.reviews.length);
      } else {
        console.log('⚠️ No reviews found in backend');
        // Keep localStorage data
      }
    } catch (error) {
      console.error('❌ Error loading reviews from backend:', error);
      // Keep localStorage data
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
      console.log('📤 Sending OTP to:', loginForm.email);
      
      const result = await otpAPI.sendOTP(loginForm);
      
      if (result.success) {
        setVerificationData(loginForm);
        setShowOTP(true);
        alert('OTP sent to your email! Check your inbox.');
        console.log('✅ OTP Sent Successfully!');
        if (result.otp) {
          console.log(`🔐 DEVELOPMENT OTP: ${result.otp}`);
        }
      } else {
        alert(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('❌ Error sending OTP via API:', error);
      
      // Fallback to mock OTP
      console.log('🔄 Using mock OTP as fallback...');
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('devOTP', otp);
      localStorage.setItem('devUser', JSON.stringify(loginForm));
      
      setVerificationData(loginForm);
      setShowOTP(true);
      alert(`Development mode OTP: ${otp}`);
      console.log(`🔐 MOCK OTP: ${otp}`);
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
      console.log('🔐 Verifying OTP:', otpInput);
      
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
        if (backendConnected) {
          await loadDonationsFromBackend();
          await loadReviewsFromBackend();
        }
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error verifying OTP via API:', error);
      
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
      } else {
        alert('❌ Invalid OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  // ========== REVIEW FUNCTIONS ==========

  const handleSearchReviews = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredReviews(reviews);
      return;
    }
    
    try {
      const regex = new RegExp(query, 'i');
      const filtered = reviews.filter(review => 
        regex.test(review.bookName) || 
        regex.test(review.author) || 
        regex.test(review.review) ||
        regex.test(review.userName)
      );
      
      const sorted = filtered.sort((a, b) => {
        const aBookExact = a.bookName.toLowerCase() === query.toLowerCase();
        const bBookExact = b.bookName.toLowerCase() === query.toLowerCase();
        const aAuthorExact = a.author.toLowerCase() === query.toLowerCase();
        const bAuthorExact = b.author.toLowerCase() === query.toLowerCase();
        
        if (aBookExact && !bBookExact) return -1;
        if (!aBookExact && bBookExact) return 1;
        if (aAuthorExact && !bAuthorExact) return -1;
        if (!aAuthorExact && bAuthorExact) return 1;
        
        return 0;
      });
      
      setFilteredReviews(sorted);
    } catch (error) {
      const filtered = reviews.filter(review => 
        review.bookName.toLowerCase().includes(query.toLowerCase()) ||
        review.author.toLowerCase().includes(query.toLowerCase()) ||
        review.review.toLowerCase().includes(query.toLowerCase()) ||
        review.userName.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredReviews(filtered);
    }
  };

  // ========== DONATION FUNCTIONS ==========

  const handleOpenPostDetail = (post) => {
    setSelectedPost(post);
    setShowPostDetail(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Reduced to 2MB
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
      if (backendConnected) {
        console.log('📤 Submitting donation to backend...');
        
        const donationData = {
          userName: currentUser.name,
          userEmail: currentUser.email,
          bookName: donationForm.bookName,
          story: donationForm.story,
          image: donationForm.image,
        };
        
        const result = await donationAPI.create(donationData);
        
        if (result.success) {
          console.log('✅ Donation created on backend:', result.donation);
          await loadDonationsFromBackend();
          setDonationForm({ bookName: '', story: '', image: null, imagePreview: null });
          alert('✅ Story shared successfully! Everyone can now see it!');
          setLoading(false);
          return;
        } else {
          throw new Error(result.message || 'Failed to create donation');
        }
      }
    } catch (error) {
      console.error('❌ Error submitting donation to backend:', error);
    }
    
    // Fallback to localStorage
    console.log('🔄 Saving donation locally...');
    const newDonation = {
      _id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      ...donationForm,
      likes: 0,
      saves: 0,
      shares: 0,
      createdAt: new Date().toISOString()
    };
    
    const updatedDonations = [newDonation, ...donations];
    setDonations(updatedDonations);
    localStorage.setItem('donations', JSON.stringify(updatedDonations));
    
    setDonationForm({ bookName: '', story: '', image: null, imagePreview: null });
    alert(backendConnected ? '⚠️ Saved locally (backend error)' : '✅ Story saved locally!');
    setLoading(false);
  };

  const handleDeleteDonation = async (id) => {
    if (!confirm('Are you sure you want to delete this story?')) return;
    
    try {
      if (backendConnected) {
        await donationAPI.delete(id);
        console.log('✅ Deleted donation from backend:', id);
      }
    } catch (error) {
      console.error('❌ Error deleting donation from backend:', error);
    }
    
    const updated = donations.filter(d => d._id !== id);
    setDonations(updated);
    localStorage.setItem('donations', JSON.stringify(updated));
    
    alert('Story deleted successfully');
    if (showPostDetail) setShowPostDetail(false);
  };

  const handleLikeDonation = async (id) => {
    try {
      if (backendConnected) {
        await donationAPI.like(id);
      }
    } catch (error) {
      console.error('❌ Error liking donation on backend:', error);
    }
    
    const updated = donations.map(d => 
      d._id === id ? { ...d, likes: (d.likes || 0) + 1 } : d
    );
    setDonations(updated);
    localStorage.setItem('donations', JSON.stringify(updated));
    
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
      if (backendConnected) {
        await donationAPI.save(id);
      }
    } catch (error) {
      console.error('❌ Error saving donation on backend:', error);
    }
    
    const updated = donations.map(d => 
      d._id === id ? { ...d, saves: (d.saves || 0) + 1 } : d
    );
    setDonations(updated);
    localStorage.setItem('donations', JSON.stringify(updated));
    
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

  const handleReviewSubmit = async () => {
    if (!reviewForm.bookName || !reviewForm.author || !reviewForm.review) {
      alert('Please fill all fields');
      return;
    }
    
    if (!isLoggedIn) {
      alert('Please login to post a review');
      return;
    }
    
    setLoading(true);
    
    try {
      if (backendConnected) {
        console.log('📤 Submitting review to backend...');
        
        const reviewData = {
          userName: currentUser.name,
          userEmail: currentUser.email,
          bookName: reviewForm.bookName,
          author: reviewForm.author,
          review: reviewForm.review,
          sentiment: reviewForm.sentiment,
        };
        
        const result = await reviewAPI.create(reviewData);
        
        if (result.success) {
          console.log('✅ Review created on backend:', result.review);
          await loadReviewsFromBackend();
          setReviewForm({ bookName: '', author: '', review: '', sentiment: 'positive' });
          alert('✅ Review posted successfully! Everyone can now see it!');
          setLoading(false);
          return;
        } else {
          throw new Error(result.message || 'Failed to create review');
        }
      }
    } catch (error) {
      console.error('❌ Error submitting review to backend:', error);
    }
    
    // Fallback to localStorage
    console.log('🔄 Saving review locally...');
    const newReview = {
      _id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      ...reviewForm,
      createdAt: new Date().toISOString()
    };
    
    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    setFilteredReviews(updatedReviews);
    localStorage.setItem('reviews', JSON.stringify(updatedReviews));
    
    setReviewForm({ bookName: '', author: '', review: '', sentiment: 'positive' });
    alert(backendConnected ? '⚠️ Saved locally (backend error)' : '✅ Review saved locally!');
    setLoading(false);
  };

  // ========== RECOMMENDATION FUNCTIONS ==========

  const handleRecommendation = () => {
    if (!recommendKeywords.trim()) {
      alert('Please enter what you want to read about');
      return;
    }

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

  // ========== DEBUG FUNCTION ==========
  
  const testBackendManually = async () => {
    console.log('🧪 Testing backend manually...');
    
    const endpoints = [
      'https://versal-book-app.onrender.com/api/health',
      'https://versal-book-app.onrender.com/api/donations',
      'https://versal-book-app.onrender.com/api/reviews'
    ];
    
    for (const url of endpoints) {
      try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(`✅ ${url}:`, data);
      } catch (error) {
        console.error(`❌ ${url}:`, error.message);
      }
    }
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
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                      <input
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition"
                        placeholder="john@example.com"
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
                      <p>Note: Check console for OTP if email doesn't work</p>
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
      {/* Backend Status Indicator */}
      {!backendChecking && (
        <div className={`px-4 py-2 text-center text-sm font-medium ${backendConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {backendConnected ? '✅ Connected to backend - Data saved globally' : '⚠️ Backend offline - Data saved locally only'}
        </div>
      )}

      {/* Debug Button */}
      <button
        onClick={testBackendManually}
        className="fixed bottom-4 right-4 bg-purple-500 text-white px-4 py-2 rounded-lg z-50 shadow-lg hover:bg-purple-600"
      >
        Test Backend
      </button>

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
              { name: 'Reviews', page: 'reviews', icon: Star },
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

      {/* Home Page */}
      {currentPage === 'home' && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl mb-12 text-white">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-900/90 via-red-900/85 to-pink-900/90" />
            <div className="relative z-10 p-12">
              <div className="max-w-2xl">
                <h2 className="text-5xl font-bold mb-4">Let's make reading a habit</h2>
                <p className="text-xl text-orange-100 mb-8">
                  Join our vibrant community of book lovers. Share stories, discover reviews, and find your next favorite book.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                    <Users className="w-5 h-5" />
                    <span>{donations.length + reviews.length}+ Stories</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                    <TrendingUp className="w-5 h-5" />
                    <span>Growing Daily</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { page: 'donation', gradient: 'from-blue-500 to-cyan-500', icon: Gift, title: 'Shared Stories', desc: 'Moments of reading, gifting, and sharing books' },
              { page: 'reviews', gradient: 'from-purple-500 to-pink-500', icon: Star, title: 'Book Reviews', desc: 'Read and share honest book reviews' },
              { page: 'recommend', gradient: 'from-amber-500 to-orange-500', icon: Sparkles, title: 'Recommendations', desc: 'Get personalized book suggestions' }
            ].map(({ page, gradient, icon: Icon, title, desc }, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentPage(page)}
                className="group relative overflow-hidden rounded-2xl cursor-pointer hover:shadow-2xl transform hover:scale-105 transition-all duration-300 h-64 bg-gradient-to-br from-gray-900 to-black"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 group-hover:opacity-95 transition`} />
                <div className="relative z-10 p-8 h-full flex flex-col justify-end text-white">
                  <Icon className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-2xl font-bold mb-3">{title}</h3>
                  <p className="text-white/90 mb-4">{desc}</p>
                  <div className="flex items-center text-sm font-semibold">
                    Explore Now
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { label: 'Stories Shared', value: donations.length, icon: Gift, gradient: 'from-blue-100 to-cyan-100', color: 'text-blue-600' },
              { label: 'Reviews Written', value: reviews.length, icon: Star, gradient: 'from-purple-100 to-pink-100', color: 'text-purple-600' },
              { label: 'Your Activity', value: userActivity.savedPosts.length + userActivity.likedPosts.length, icon: Heart, gradient: 'from-orange-100 to-red-100', color: 'text-orange-600' }
            ].map(({ label, value, icon: Icon, gradient, color }, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 mb-1">{label}</p>
                    <p className={`text-4xl font-bold ${color}`}>{value}</p>
                  </div>
                  <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center`}>
                    <Icon className={`w-8 h-8 ${color}`} />
                  </div>
                </div>
              </div>
            ))}
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
              <p className="text-gray-600">Moments of reading, gifting, donating, and sharing books</p>
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
            {!backendConnected && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  ⚠️ Backend offline - stories will be saved locally only
                </p>
              </div>
            )}
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

      {/* Reviews Page */}
      {currentPage === 'reviews' && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button onClick={() => setCurrentPage('home')} className="mb-6 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold">
            <ChevronLeft className="w-5 h-5" /> Back to Home
          </button>

          <div className="mb-8 rounded-2xl overflow-hidden bg-gradient-to-r from-purple-900 to-pink-900 p-12">
            <h1 className="text-4xl font-bold text-white mb-2">Book Reviews</h1>
            <p className="text-purple-100">Discover what others are reading</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Write a Review</h2>
              {!backendConnected && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    ⚠️ Backend offline - reviews will be saved locally only
                  </p>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Book Name *</label>
                  <input
                    type="text"
                    value={reviewForm.bookName}
                    onChange={(e) => setReviewForm({ ...reviewForm, bookName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition"
                    placeholder="Enter book name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Author *</label>
                  <input
                    type="text"
                    value={reviewForm.author}
                    onChange={(e) => setReviewForm({ ...reviewForm, author: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition"
                    placeholder="Enter author name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your Review *</label>
                  <textarea
                    value={reviewForm.review}
                    onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition"
                    rows="4"
                    placeholder="Share your thoughts..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sentiment</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setReviewForm({ ...reviewForm, sentiment: 'positive' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition ${
                        reviewForm.sentiment === 'positive'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" /> Positive
                    </button>
                    <button
                      onClick={() => setReviewForm({ ...reviewForm, sentiment: 'negative' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition ${
                        reviewForm.sentiment === 'negative'
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" /> Negative
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleReviewSubmit}
                  disabled={!reviewForm.bookName || !reviewForm.author || !reviewForm.review || loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {loading ? 'Posting...' : 'Post Review'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Search Reviews</h2>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchReviews(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition"
                  placeholder="Search books, authors, reviews..."
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchReviews('')}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {searchQuery && (
                <div className="mb-4 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span className="text-sm">
                    Showing {filteredReviews.length} result{filteredReviews.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </span>
                </div>
              )}
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {searchQuery ? 'No reviews found for your search' : 'No reviews yet'}
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => handleSearchReviews('')}
                        className="mt-2 text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  filteredReviews.map(review => (
                    <div key={review._id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 hover:border-purple-300 transition">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {searchQuery && review.bookName.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                              <span className="bg-yellow-200 px-1">
                                {review.bookName}
                              </span>
                            ) : (
                              review.bookName
                            )}
                          </h3>
                          <p className="text-sm text-gray-600">
                            by {searchQuery && review.author.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                              <span className="bg-yellow-200 px-1">
                                {review.author}
                              </span>
                            ) : (
                              review.author
                            )}
                          </p>
                        </div>
                        {review.sentiment === 'positive' ? (
                          <ThumbsUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <ThumbsDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <p className="text-gray-700 text-sm mb-2">
                        {searchQuery && review.review.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                          <>
                            {review.review.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => 
                              part.toLowerCase() === searchQuery.toLowerCase() ? (
                                <span key={i} className="bg-yellow-200">{part}</span>
                              ) : (
                                part
                              )
                            )}
                          </>
                        ) : (
                          review.review
                        )}
                      </p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">by {review.userName}</span>
                        <span className="text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
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
            <p className="text-orange-100">Find your next favorite book from 24+ genres</p>
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
                  />
                </div>
                <button
                  onClick={handleRecommendation}
                  disabled={!recommendKeywords}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 mb-4"
                >
                  Get Recommendations
                </button>
                <button
                  onClick={handleBrowseCategories}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all"
                >
                  Browse All Categories
                </button>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Search Tips:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500 mt-1" />
                    <span>Search by genre: "fantasy", "sci-fi", "romance"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500 mt-1" />
                    <span>Search by mood: "adventure", "mystery", "inspiration"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500 mt-1" />
                    <span>Search by author: "Stephen King", "J.K. Rowling"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500 mt-1" />
                    <span>Click "Browse All Categories" to see all genres</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Recommendations Display */}
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
          {recommendations.length === 0 && (
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
              <p className="text-gray-500 text-sm mt-1">Made with ❤️ for book lovers</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;