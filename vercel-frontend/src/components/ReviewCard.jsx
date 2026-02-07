import React, { useState } from 'react';
import axios from 'axios';
import './ReviewCard.css';

const ReviewCard = ({ review, currentUserEmail, onUpdate, onDelete }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Handle like review
  const handleLike = async () => {
    if (!currentUserEmail) {
      alert('Please log in to like reviews');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/reviews/${review._id}/like`, {
        userEmail: currentUserEmail
      });

      if (response.data.success) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error liking review:', error);
      alert(error.response?.data?.message || 'Error liking review');
    }
  };

  // Handle dislike review
  const handleDislike = async () => {
    if (!currentUserEmail) {
      alert('Please log in to dislike reviews');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/reviews/${review._id}/dislike`, {
        userEmail: currentUserEmail
      });

      if (response.data.success) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error disliking review:', error);
      alert(error.response?.data?.message || 'Error disliking review');
    }
  };

  // Handle share review
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/reviews/${review._id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Review of ${review.bookName}`,
          text: `Check out this review of ${review.bookName} by ${review.author}`,
          url: shareUrl
        });
        
        // Increment share count
        await axios.post(`${API_URL}/reviews/${review._id}/share`);
        onUpdate();
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
      
      // Increment share count
      await axios.post(`${API_URL}/reviews/${review._id}/share`);
      onUpdate();
    }
  };

  // Handle delete review
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        const response = await axios.delete(`${API_URL}/reviews/${review._id}`, {
          data: { userEmail: currentUserEmail }
        });

        if (response.data.success) {
          alert('Review deleted successfully');
          onDelete(review._id);
        }
      } catch (error) {
        console.error('Error deleting review:', error);
        alert(error.response?.data?.message || 'Error deleting review');
      }
    }
  };

  // Handle add comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!currentUserEmail) {
      alert('Please log in to comment');
      return;
    }

    if (commentText.trim().length < 3) {
      alert('Comment must be at least 3 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/reviews/${review._id}/comments`, {
        userName: 'Current User', // Replace with actual user name
        userEmail: currentUserEmail,
        comment: commentText
      });

      if (response.data.success) {
        setCommentText('');
        onUpdate();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert(error.response?.data?.message || 'Error adding comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle like comment
  const handleLikeComment = async (commentId) => {
    if (!currentUserEmail) {
      alert('Please log in to like comments');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/reviews/${review._id}/comments/${commentId}/like`,
        { userEmail: currentUserEmail }
      );

      if (response.data.success) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      alert(error.response?.data?.message || 'Error liking comment');
    }
  };

  // Handle dislike comment
  const handleDislikeComment = async (commentId) => {
    if (!currentUserEmail) {
      alert('Please log in to dislike comments');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/reviews/${review._id}/comments/${commentId}/dislike`,
        { userEmail: currentUserEmail }
      );

      if (response.data.success) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error disliking comment:', error);
      alert(error.response?.data?.message || 'Error disliking comment');
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        const response = await axios.delete(
          `${API_URL}/reviews/${review._id}/comments/${commentId}`,
          { data: { userEmail: currentUserEmail } }
        );

        if (response.data.success) {
          onUpdate();
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert(error.response?.data?.message || 'Error deleting comment');
      }
    }
  };

  // Handle add reply
  const handleAddReply = async (commentId) => {
    if (!currentUserEmail) {
      alert('Please log in to reply');
      return;
    }

    if (replyText.trim().length < 3) {
      alert('Reply must be at least 3 characters long');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/reviews/${review._id}/comments/${commentId}/replies`,
        {
          userName: 'Current User', // Replace with actual user name
          userEmail: currentUserEmail,
          comment: replyText
        }
      );

      if (response.data.success) {
        setReplyText('');
        setReplyTo(null);
        onUpdate();
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      alert(error.response?.data?.message || 'Error adding reply');
    }
  };

  return (
    <div className="review-card">
      {/* Review Header */}
      <div className="review-header">
        <div className="review-user-info">
          <h3>{review.userName}</h3>
          <span className="review-date">
            {new Date(review.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        {review.isAuthor && (
          <button className="delete-btn" onClick={handleDelete}>
            🗑️ Delete
          </button>
        )}
      </div>

      {/* Book Info */}
      <div className="book-info">
        <h2>{review.bookName}</h2>
        <p className="author">by {review.author}</p>
        <div className="rating">
          {'⭐'.repeat(review.rating)}
        </div>
      </div>

      {/* Review Content */}
      <div className="review-content">
        <p>{review.review}</p>
      </div>

      {/* Review Actions */}
      <div className="review-actions">
        <button 
          className={`action-btn ${review.userLiked ? 'active' : ''}`}
          onClick={handleLike}
          disabled={review.isAuthor}
        >
          👍 Like ({review.likes || 0})
        </button>

        <button 
          className={`action-btn ${review.userDisliked ? 'active' : ''}`}
          onClick={handleDislike}
          disabled={review.isAuthor}
        >
          👎 Dislike ({review.dislikes || 0})
        </button>

        <button className="action-btn" onClick={handleShare}>
          📤 Share ({review.shares || 0})
        </button>

        <button 
          className="action-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 Comments ({review.comments?.length || 0})
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="comments-section">
          {/* Add Comment Form */}
          {currentUserEmail && (
            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows="3"
              />
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          )}

          {/* Display Comments */}
          <div className="comments-list">
            {review.comments?.map((comment) => (
              <div key={comment._id} className="comment">
                <div className="comment-header">
                  <strong>{comment.userName}</strong>
                  <span className="comment-date">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                  
                  {comment.isAuthor && (
                    <button 
                      className="delete-comment-btn"
                      onClick={() => handleDeleteComment(comment._id)}
                    >
                      🗑️
                    </button>
                  )}
                </div>

                <p className="comment-text">{comment.comment}</p>

                <div className="comment-actions">
                  <button 
                    className={`mini-btn ${comment.userLiked ? 'active' : ''}`}
                    onClick={() => handleLikeComment(comment._id)}
                    disabled={comment.isAuthor}
                  >
                    👍 {comment.likes || 0}
                  </button>

                  <button 
                    className={`mini-btn ${comment.userDisliked ? 'active' : ''}`}
                    onClick={() => handleDislikeComment(comment._id)}
                    disabled={comment.isAuthor}
                  >
                    👎 {comment.dislikes || 0}
                  </button>

                  <button 
                    className="mini-btn"
                    onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
                  >
                    💬 Reply
                  </button>
                </div>

                {/* Reply Form */}
                {replyTo === comment._id && (
                  <div className="reply-form">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      rows="2"
                    />
                    <div className="reply-actions">
                      <button onClick={() => handleAddReply(comment._id)}>
                        Post Reply
                      </button>
                      <button onClick={() => setReplyTo(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Display Replies */}
                {comment.replies?.length > 0 && (
                  <div className="replies-list">
                    {comment.replies.map((reply) => (
                      <div key={reply._id} className="reply">
                        <div className="reply-header">
                          <strong>{reply.userName}</strong>
                          <span className="reply-date">
                            {new Date(reply.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="reply-text">{reply.comment}</p>
                        <div className="reply-actions-inline">
                          <button className="mini-btn">
                            👍 {reply.likes || 0}
                          </button>
                          <button className="mini-btn">
                            👎 {reply.dislikes || 0}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;