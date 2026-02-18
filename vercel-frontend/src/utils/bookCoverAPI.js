// src/utils/bookCoverAPI.js
// Free book cover images from Open Library (Internet Archive)
// No API key required!

/**
 * Get book cover URL from Open Library
 * @param {string} isbn - ISBN-10 or ISBN-13
 * @param {string} size - 'S' (small), 'M' (medium), 'L' (large)
 * @returns {string} Cover image URL
 */
export const getCoverByISBN = (isbn, size = 'M') => {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`;
};

/**
 * Get book cover by title (search and get first result)
 * @param {string} title - Book title
 * @param {string} author - Author name (optional, improves accuracy)
 * @returns {Promise<string>} Cover image URL
 */
export const getCoverByTitle = async (title, author = '') => {
  try {
    const query = author ? `${title} ${author}` : title;
    const response = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=1`
    );
    const data = await response.json();
    
    if (data.docs && data.docs.length > 0) {
      const book = data.docs[0];
      
      // Try cover_i (most reliable)
      if (book.cover_i) {
        return `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
      }
      
      // Try ISBN
      if (book.isbn && book.isbn.length > 0) {
        return getCoverByISBN(book.isbn[0], 'L');
      }
    }
    
    // Fallback to placeholder
    return null;
  } catch (error) {
    console.error('Error fetching cover:', error);
    return null;
  }
};

/**
 * Get detailed book information including cover
 * @param {string} title - Book title
 * @param {string} author - Author name
 * @returns {Promise<object>} Book data with cover URL
 */
export const getBookDetails = async (title, author = '') => {
  try {
    const query = author ? `${title} ${author}` : title;
    const response = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=5`
    );
    const data = await response.json();
    
    if (data.docs && data.docs.length > 0) {
      // Find best match (prefer exact title match)
      const book = data.docs.find(b => 
        b.title?.toLowerCase() === title.toLowerCase()
      ) || data.docs[0];
      
      return {
        title: book.title || title,
        author: book.author_name?.[0] || author,
        coverUrl: book.cover_i 
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
          : null,
        isbn: book.isbn?.[0],
        publishYear: book.first_publish_year,
        subjects: book.subject?.slice(0, 5) || [],
        description: book.first_sentence?.[0] || '',
      };
    }
    
    return {
      title,
      author,
      coverUrl: null,
      isbn: null,
      publishYear: null,
      subjects: [],
      description: '',
    };
  } catch (error) {
    console.error('Error fetching book details:', error);
    return {
      title,
      author,
      coverUrl: null,
      isbn: null,
      publishYear: null,
      subjects: [],
      description: '',
    };
  }
};

/**
 * Generate placeholder gradient for books without covers
 * @param {string} title - Book title
 * @returns {string} CSS gradient
 */
export const getPlaceholderGradient = (title = '') => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
  ];
  
  const index = title.charCodeAt(0) % gradients.length;
  return gradients[index];
};

/**
 * Batch fetch covers for multiple books
 * @param {Array<{title: string, author: string}>} books - Array of books
 * @returns {Promise<Array>} Books with cover URLs
 */
export const batchFetchCovers = async (books) => {
  const promises = books.map(book => getBookDetails(book.title, book.author));
  return Promise.all(promises);
};

// ===== ALTERNATIVE FREE APIs (if needed) =====

/**
 * Google Books API (free, 1000 requests/day, requires API key)
 * Get API key: https://console.cloud.google.com/apis/credentials
 */
export const getGoogleBooksCover = async (title, author, apiKey) => {
  try {
    const query = `${title} ${author}`.trim();
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${apiKey}`
    );
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const book = data.items[0];
      return {
        coverUrl: book.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
        title: book.volumeInfo.title,
        author: book.volumeInfo.authors?.[0],
        description: book.volumeInfo.description,
        isbn: book.volumeInfo.industryIdentifiers?.[0]?.identifier,
      };
    }
    return null;
  } catch (error) {
    console.error('Google Books API error:', error);
    return null;
  }
};

/**
 * Fallback: Use a generated book cover with title/author text
 */
export const generateTextCover = (title, author, gradient) => {
  // This would return a data URL for a canvas-generated cover
  // For simplicity, we'll just return the gradient
  return gradient;
};

export default {
  getCoverByISBN,
  getCoverByTitle,
  getBookDetails,
  getPlaceholderGradient,
  batchFetchCovers,
  getGoogleBooksCover,
};