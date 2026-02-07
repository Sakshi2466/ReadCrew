import React, { useState } from 'react';
import axios from 'axios';
import './CreateReviewForm.css';

const CreateReviewForm = ({ currentUser, onReviewCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    bookName: '',
    author: '',
    review: '',
    rating: 5,
    sentiment: 'positive'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.bookName.trim() || !formData.author.trim() || !formData.review.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.review.trim().length < 20) {
      setError('Review must be at least 20 characters long');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/reviews`, {
        userName: currentUser.name,
        userEmail: currentUser.email,
        bookName: formData.bookName.trim(),
        author: formData.author.trim(),
        review: formData.review.trim(),
        rating: parseInt(formData.rating),
        sentiment: formData.sentiment
      });

      if (response.data.success) {
        onReviewCreated(response.data.review);
        
        // Reset form
        setFormData({
          bookName: '',
          author: '',
          review: '',
          rating: 5,
          sentiment: 'positive'
        });
      }
    } catch (error) {
      console.error('Error creating review:', error);
      setError(error.response?.data?.message || 'Failed to post review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-review-form-container">
      <div className="form-card">
        <h2>✍️ Write a Review</h2>
        
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="bookName">
              Book Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="bookName"
              name="bookName"
              value={formData.bookName}
              onChange={handleChange}
              placeholder="Enter the book title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="author">
              Author <span className="required">*</span>
            </label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              placeholder="Enter the author's name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="rating">
              Rating <span className="required">*</span>
            </label>
            <div className="rating-input">
              <input
                type="range"
                id="rating"
                name="rating"
                min="1"
                max="5"
                value={formData.rating}
                onChange={handleChange}
              />
              <span className="rating-display">
                {'⭐'.repeat(formData.rating)} ({formData.rating}/5)
              </span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="sentiment">Sentiment</label>
            <select
              id="sentiment"
              name="sentiment"
              value={formData.sentiment}
              onChange={handleChange}
            >
              <option value="positive">😊 Positive</option>
              <option value="neutral">😐 Neutral</option>
              <option value="negative">😞 Negative</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="review">
              Your Review <span className="required">*</span>
            </label>
            <textarea
              id="review"
              name="review"
              value={formData.review}
              onChange={handleChange}
              placeholder="Share your thoughts about the book... (minimum 20 characters)"
              rows="6"
              required
            />
            <div className="character-count">
              {formData.review.length} characters
              {formData.review.length > 0 && formData.review.length < 20 && (
                <span className="warning"> (need {20 - formData.review.length} more)</span>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={onCancel}
              className="cancel-btn"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Posting...' : 'Post Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReviewForm;