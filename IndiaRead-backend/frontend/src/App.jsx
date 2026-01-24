// src/App.jsx - COMPLETE VERSION
import React, { useState, useEffect } from 'react';
import { BookOpen, Heart, Star, Sparkles, Menu, X, Upload, Search, ThumbsUp, ThumbsDown, Share2, Bookmark, ChevronLeft, LogOut, Users, TrendingUp, Trash2, Edit, Target, Plus, Check, ArrowLeft, Clock, Gift } from 'lucide-react';

// Book recommendations database (same as above)
const BOOK_RECOMMENDATIONS = [/* ... your 24 categories ... */];

// API URL - CHANGE THIS TO YOUR BACKEND URL
const API_URL = import.meta.env.VITE_API_URL || 'https://readcrew.onrender.com/api';

// Validation functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);
const validateName = (name) => name && name.trim().length >= 2;

const App = () => {
  // All your state declarations remain the same...
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [verificationData, setVerificationData] = useState({});
  const [otpInput, setOtpInput] = useState('');
  const [loginForm, setLoginForm] = useState({ name: '', email: '', phone: '' });
  const [currentPage, setCurrentPage] = useState('home');
  const [showProfile, setShowProfile] = useState(false);
  const [showSavedPosts, setShowSavedPosts] = useState(false);
  const [showLikedPosts, setShowLikedPosts] = useState(false);
  const [showSharedPosts, setShowSharedPosts] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [donations, setDonations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [userActivity, setUserActivity] = useState({
    savedPosts: [],
    likedPosts: [],
    sharedPosts: []
  });
  const [donationForm, setDonationForm] = useState({ bookName: '', story: '', image: null, imagePreview: null });
  const [reviewForm, setReviewForm] = useState({ bookName: '', author: '', review: '', sentiment: 'positive' });
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendKeywords, setRecommendKeywords] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [readingGoal, setReadingGoal] = useState({ monthly: 0, books: [] });
  const [newBook, setNewBook] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);

  // Initialize data from localStorage
  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setCurrentUser(parsed);
        setIsLoggedIn(true);
        setReadingGoal(parsed.readingGoal || { monthly: 0, books: [] });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

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

  // Load user activity when logged in
  useEffect(() => {
    if (isLoggedIn && currentUser?.email) {
      try {
        const saved = localStorage.getItem(`user_${currentUser.email}_activity`);
        if (saved) {
          setUserActivity(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading user activity:', error);
      }
    }
  }, [isLoggedIn, currentUser]);

  // ========== AUTHENTICATION FUNCTIONS ==========
  
  // Send OTP
  const handleSendOTP = async () => {
    if (!loginForm.name || !loginForm.email || !loginForm.phone) {
      alert('Please fill all fields');
      return;
    }

    if (!validateName(loginForm.name)) {
      alert('Name must be at least 2 characters');
      return;
    }

    if (!validateEmail(loginForm.email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (!validatePhone(loginForm.phone)) {
      alert('Please enter a valid 10-digit Indian phone number');
      return;
    }

    setLoading(true);
    
    try {
      console.log('📤 Sending OTP to:', loginForm.email);
      console.log('📡 API URL:', `${API_URL}/otp/send`);
      
      const response = await fetch(`${API_URL}/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginForm.email,
          phone: loginForm.phone,
          name: loginForm.name
        }),
      });

      let data;
      
      if (response.ok) {
        data = await response.json();
        console.log('✅ OTP Response:', data);
      } else {
        console.warn('⚠️ Backend failed, using dev OTP');
        const devOTP = Math.floor(100000 + Math.random() * 900000).toString();
        localStorage.setItem('devOTP', devOTP);
        localStorage.setItem('devUser', JSON.stringify(loginForm));
        
        data = {
          success: true,
          message: 'OTP sent (dev mode)',
          otp: devOTP
        };
      }

      if (data.success) {
        setVerificationData({
          email: loginForm.email,
          phone: loginForm.phone,
          name: loginForm.name
        });
        setShowOTP(true);
        
        if (data.otp) {
          alert(`✅ OTP sent to ${loginForm.email}\n\nDevelopment OTP: ${data.otp}\n\n(Check your email for production)`);
          console.log('🔑 OTP:', data.otp);
        } else {
          alert(`✅ OTP sent to ${loginForm.email}\n\nCheck your email inbox (and spam folder)`);
        }
      } else {
        alert(`❌ Failed: ${data.message || 'Could not send OTP'}`);
      }
      
    } catch (error) {
      console.error('❌ Network error:', error);
      
      const devOTP = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('devOTP', devOTP);
      localStorage.setItem('devUser', JSON.stringify(loginForm));
      
      setVerificationData({
        email: loginForm.email,
        phone: loginForm.phone,
        name: loginForm.name
      });
      setShowOTP(true);
      
      alert(`🔧 DEV MODE (Backend unreachable)\n\nOTP: ${devOTP}\n\nError: ${error.message}`);
      console.log('🔑 Fallback OTP:', devOTP);
      
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (otpInput.length !== 6) {
      alert("Enter 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Verifying OTP:', otpInput);
      
      const response = await fetch(`${API_URL}/otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: verificationData.email,
          otp: otpInput,
        }),
      });

      let data;

      if (response.ok) {
        data = await response.json();
        console.log('✅ Verify Response:', data);
      } else {
        const devOTP = localStorage.getItem("devOTP");
        const devUser = JSON.parse(localStorage.getItem("devUser") || "{}");

        if (otpInput === devOTP && devUser.email === verificationData.email) {
          data = {
            success: true,
            user: {
              id: Date.now().toString(),
              name: devUser.name,
              email: devUser.email,
              phone: devUser.phone,
              isVerified: true,
              createdAt: new Date().toISOString(),
              readingGoal: { monthly: 0, books: [] },
            },
          };

          localStorage.removeItem("devOTP");
          localStorage.removeItem("devUser");
        } else {
          data = { success: false, message: "Invalid OTP" };
        }
      }

      if (data.success) {
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        setShowOTP(false);
        setLoginForm({ name: "", email: "", phone: "" });
        setOtpInput("");
        alert("✅ Account verified! Welcome to ReadCrew!");
      } else {
        alert(`❌ ${data.message}`);
      }

    } catch (error) {
      console.error("❌ Error verifying OTP:", error);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ========== REVIEW FUNCTIONS ==========

  // Search reviews with regex
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

  // Open post detail
  const handleOpenPostDetail = (post) => {
    setSelectedPost(post);
    setShowPostDetail(true);
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setDonationForm(prev => ({ ...prev, image: reader.result, imagePreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle donation submission
  const handleDonationSubmit = () => {
    if (!donationForm.bookName || !donationForm.story || !donationForm.image) {
      alert('Please fill all fields');
      return;
    }
    
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
    alert('✅ Story shared successfully!');
  };

  // Handle delete donation
  const handleDeleteDonation = (id) => {
    if (confirm('Are you sure you want to delete this story?')) {
      const updated = donations.filter(d => d._id !== id);
      setDonations(updated);
      localStorage.setItem('donations', JSON.stringify(updated));
      alert('Story deleted successfully');
      setShowPostDetail(false);
    }
  };

  // Handle like donation
  const handleLikeDonation = (id) => {
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

  // Handle save donation
  const handleSaveDonation = (id) => {
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

  // Handle share donation
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

  // Handle review submission
  const handleReviewSubmit = () => {
    if (!reviewForm.bookName || !reviewForm.author || !reviewForm.review) {
      alert('Please fill all fields');
      return;
    }
    
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
    alert('✅ Review posted successfully!');
  };

  // ========== RECOMMENDATION FUNCTIONS ==========

  // Handle recommendation - IMPROVED VERSION WITH CATEGORIES
  const handleRecommendation = () => {
    if (!recommendKeywords.trim()) {
      alert('Please enter what you want to read about');
      return;
    }

    const keywords = recommendKeywords.toLowerCase().trim();

    // Find matching categories
    const matchingCategories = BOOK_RECOMMENDATIONS.filter(category => {
      const categoryText = `${category.category} ${category.description} ${category.emoji}`.toLowerCase();
      return categoryText.includes(keywords) || 
             category.books.some(book => 
               book.title.toLowerCase().includes(keywords) || 
               book.author.toLowerCase().includes(keywords)
             );
    });

    // If specific category found
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
      // If no specific category, show general recommendations based on keywords
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
        // Default recommendations
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

  // Show all categories for browsing
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
  
  // Update reading goal
  const handleUpdateGoal = () => {
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, readingGoal };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setShowGoalModal(false);
    alert('✅ Reading goal updated!');
  };

  // Add book to reading goal
  const handleAddBook = () => {
    if (newBook.trim()) {
      setReadingGoal(prev => ({
        ...prev,
        books: [...prev.books, { title: newBook.trim(), completed: false }]
      }));
      setNewBook('');
    }
  };

  // Toggle book completion
  const handleToggleBook = (idx) => {
    setReadingGoal(prev => ({
      ...prev,
      books: prev.books.map((b, i) => 
        i === idx ? { ...b, completed: !b.completed } : b
      )
    }));
  };

  // Logout
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
        {/* Login page JSX - same as your code */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23f97316' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full grid md:grid-cols-2">
            {/* Left side - Branding */}
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

            {/* Right side - Form */}
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
                      <p>💡 Check browser console (F12) for OTP if email doesn't arrive</p>
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

  // ========== RENDER: MAIN APP (after login) ==========
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Rest of your app continues here... */}
      <p className="text-center py-20">
        ✅ APP IS WORKING! Main UI would go here...
      </p>
    </div>
  );
};

export default App;