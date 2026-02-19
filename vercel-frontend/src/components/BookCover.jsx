// src/components/BookCover.jsx
import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { getPlaceholderData, preloadCover } from '../utils/bookCoverAPI';

const BookCover = ({ 
  title, 
  author, 
  coverUrl, 
  size = 'md',
  onLoad,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [placeholder, setPlaceholder] = useState(null);

  const sizes = {
    xs: 'w-16 h-20',
    sm: 'w-20 h-28',
    md: 'w-24 h-32',
    lg: 'w-32 h-40',
    xl: 'w-40 h-52'
  };

  useEffect(() => {
    setPlaceholder(getPlaceholderData(title, author));
  }, [title, author]);

  useEffect(() => {
    if (coverUrl) {
      preloadCover(coverUrl).then(success => {
        if (!success) {
          setImageError(true);
        }
      });
    }
  }, [coverUrl]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  // If we have a cover URL and no error, show the image
  if (coverUrl && !imageError) {
    return (
      <div className={`${sizes[size]} relative rounded-xl overflow-hidden shadow-lg ${className}`}>
        <img
          src={coverUrl}
          alt={title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>
    );
  }

  // Show placeholder with gradient or solid color
  return (
    <div 
      className={`${sizes[size]} rounded-xl shadow-lg flex flex-col items-center justify-center p-2 ${className}`}
      style={{ backgroundColor: placeholder?.backgroundColor }}
    >
      {placeholder?.initials ? (
        <>
          <span className="text-2xl font-bold text-white mb-1">
            {placeholder.initials}
          </span>
          <BookOpen className="w-6 h-6 text-white opacity-50" />
        </>
      ) : (
        <BookOpen className="w-8 h-8 text-white opacity-50" />
      )}
      <span className="text-xs text-white opacity-70 text-center mt-1 line-clamp-2">
        {title}
      </span>
    </div>
  );
};

// Simple loading spinner component
const LoadingSpinner = ({ size = 'sm' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`${sizes[size]} border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin`} />
  );
};

export default BookCover;