// src/utils/bookCoverAPI.js

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
      `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=5`
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
      
      // Try OCLC
      if (book.oclc && book.oclc.length > 0) {
        return `https://covers.openlibrary.org/b/oclc/${book.oclc[0]}-L.jpg`;
      }
      
      // Try LCCN
      if (book.lccn && book.lccn.length > 0) {
        return `https://covers.openlibrary.org/b/lccn/${book.lccn[0]}-L.jpg`;
      }
    }
    
    // Return null if no cover found
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
      
      let coverUrl = null;
      
      if (book.cover_i) {
        coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
      } else if (book.isbn && book.isbn.length > 0) {
        coverUrl = getCoverByISBN(book.isbn[0], 'L');
      } else if (book.oclc && book.oclc.length > 0) {
        coverUrl = `https://covers.openlibrary.org/b/oclc/${book.oclc[0]}-L.jpg`;
      } else if (book.lccn && book.lccn.length > 0) {
        coverUrl = `https://covers.openlibrary.org/b/lccn/${book.lccn[0]}-L.jpg`;
      }
      
      return {
        title: book.title || title,
        author: book.author_name?.[0] || author,
        coverUrl: coverUrl,
        isbn: book.isbn?.[0],
        publishYear: book.first_publish_year,
        subjects: book.subject?.slice(0, 5) || [],
        description: book.first_sentence?.[0] || 'No description available',
        ratings_average: book.ratings_average,
        ratings_count: book.ratings_count,
        number_of_pages: book.number_of_pages_median,
        publishers: book.publisher?.[0],
      };
    }
    
    return {
      title,
      author,
      coverUrl: null,
      isbn: null,
      publishYear: null,
      subjects: [],
      description: 'Book details not found',
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
      description: 'Error fetching book details',
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
    'linear-gradient(135deg, #C8622A 0%, #A0481E 100%)',
    'linear-gradient(135deg, #7B9EA6 0%, #5D7E86 100%)',
  ];
  
  const index = (title.charCodeAt(0) || 0) % gradients.length;
  return gradients[index];
};

/**
 * Generate a colored placeholder with initials
 * @param {string} title - Book title
 * @param {string} author - Book author
 * @returns {object} Placeholder data
 */
export const getPlaceholderData = (title, author) => {
  const colors = [
    { bg: '#E8A87C', text: '#FFFFFF' },
    { bg: '#7B9EA6', text: '#FFFFFF' },
    { bg: '#C8622A', text: '#FFFFFF' },
    { bg: '#C4A882', text: '#FFFFFF' },
    { bg: '#8B5E3C', text: '#FFFFFF' },
    { bg: '#C8956C', text: '#FFFFFF' },
    { bg: '#2D2D2D', text: '#FFFFFF' },
    { bg: '#4A4A4A', text: '#FFFFFF' },
  ];
  
  const index = (title.charCodeAt(0) || 0) % colors.length;
  const initials = title.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
  
  return {
    backgroundColor: colors[index].bg,
    textColor: colors[index].text,
    initials: initials
  };
};

/**
 * Batch fetch covers for multiple books
 * @param {Array<{title: string, author: string}>} books - Array of books
 * @returns {Promise<Array>} Books with cover URLs
 */
export const batchFetchCovers = async (books) => {
  const promises = books.map(book => getBookDetails(book.title, book.author));
  const results = await Promise.all(promises);
  
  return books.map((book, index) => ({
    ...book,
    coverUrl: results[index].coverUrl,
    details: results[index]
  }));
};

/**
 * Preload book cover
 * @param {string} coverUrl - URL of the cover image
 * @returns {Promise<boolean>} Whether the image loaded successfully
 */
export const preloadCover = (coverUrl) => {
  return new Promise((resolve) => {
    if (!coverUrl) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = coverUrl;
  });
};

export default {
  getCoverByISBN,
  getCoverByTitle,
  getBookDetails,
  getPlaceholderGradient,
  getPlaceholderData,
  batchFetchCovers,
  preloadCover,
};