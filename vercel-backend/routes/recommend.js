const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

// Initialize Groq client with error handling
let groq = null;
try {
  if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('✅ Groq client initialized');
  } else {
    console.warn('⚠️ GROQ_API_KEY not found in environment');
  }
} catch (error) {
  console.error('❌ Failed to initialize Groq:', error.message);
}

// Cache for trending books (refreshes daily)
let trendingBooksCache = {
  data: null,
  lastUpdated: null,
  expiresIn: 24 * 60 * 60 * 1000 // 24 hours
};

// Fallback book database
const bookDatabase = {
  'fantasy': [
    { title: 'Harry Potter', author: 'J.K. Rowling', genre: 'Fantasy', rating: 4.8 },
    { title: 'Lord of the Rings', author: 'J.R.R. Tolkien', genre: 'Fantasy', rating: 4.9 }
  ],
  'self-help': [
    { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8 },
    { title: 'Think and Grow Rich', author: 'Napoleon Hill', genre: 'Self-Help', rating: 4.5 }
  ],
  'space': [
    { title: 'The Martian', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.7 },
    { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.8 }
  ],
  'love': [
    { title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Romance', rating: 4.8 },
    { title: 'The Notebook', author: 'Nicholas Sparks', genre: 'Romance', rating: 4.3 }
  ],
  'motivation': [
    { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8 },
    { title: 'The 7 Habits of Highly Effective People', author: 'Stephen Covey', genre: 'Self-Help', rating: 4.7 }
  ]
};

// Get mock trending books as fallback
function getMockTrendingBooks() {
  console.log('📚 Using mock trending books (fallback)');
  return [
    {
      title: 'Atomic Habits',
      author: 'James Clear',
      genre: 'Self-Help',
      description: 'Tiny changes, remarkable results. A proven framework for improving your habits.',
      rating: 4.8,
      readers: 25000,
      cover: '#E8A87C'
    },
    {
      title: 'The Psychology of Money',
      author: 'Morgan Housel',
      genre: 'Finance',
      description: 'Timeless lessons on wealth, greed, and happiness from a financial expert.',
      rating: 4.7,
      readers: 18000,
      cover: '#7B9EA6'
    },
    {
      title: 'Project Hail Mary',
      author: 'Andy Weir',
      genre: 'Sci-Fi',
      description: 'A lone astronaut must save Earth. From the author of The Martian.',
      rating: 4.8,
      readers: 22000,
      cover: '#C8622A'
    },
    {
      title: 'The Midnight Library',
      author: 'Matt Haig',
      genre: 'Fiction',
      description: 'Between life and death there is a library of infinite possibilities.',
      rating: 4.6,
      readers: 19000,
      cover: '#C8956C'
    },
    {
      title: 'Sapiens',
      author: 'Yuval Noah Harari',
      genre: 'History',
      description: 'A brief history of humankind from the Stone Age to the modern age.',
      rating: 4.7,
      readers: 30000,
      cover: '#C4A882'
    }
  ];
}

// Fetch daily trending books from AI
async function fetchDailyTrendingBooks() {
  console.log('🔥 Attempting to fetch daily trending books from Groq AI...');
  
  if (!groq) {
    console.warn('⚠️ Groq client not initialized, using mock data');
    return getMockTrendingBooks();
  }

  try {
    console.log('📡 Making Groq API call...');
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a book expert. Generate exactly 5 trending books for today.

CRITICAL: Return ONLY a valid JSON array, nothing else. No markdown, no explanation, no code blocks.

Format:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "genre": "Genre",
    "description": "Brief description in 1-2 sentences",
    "rating": 4.5,
    "readers": 15000
  }
]

Focus on currently popular books, bestsellers, and highly-rated recent releases.`
        },
        {
          role: "user",
          content: `What are the top 5 trending books today? Return ONLY the JSON array.`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 2000
    });

    let responseText = completion.choices[0].message.content;
    console.log('📥 Raw Groq response:', responseText.substring(0, 200));
    
    // Clean response - remove ANY markdown or code blocks
    responseText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/`/g, '')
      .trim();
    
    // Find JSON array in response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }
    
    const trendingBooks = JSON.parse(jsonMatch[0]);
    
    // Validate response
    if (!Array.isArray(trendingBooks) || trendingBooks.length === 0) {
      throw new Error('Invalid response format');
    }

    // Add color codes to books
    const colors = ['#E8A87C', '#7B9EA6', '#C8622A', '#C8956C', '#C4A882'];
    trendingBooks.forEach((book, idx) => {
      book.cover = colors[idx % colors.length];
      book.readers = book.readers || Math.floor(Math.random() * 20000) + 10000;
    });
    
    // Update cache
    trendingBooksCache.data = trendingBooks;
    trendingBooksCache.lastUpdated = new Date();
    
    console.log(`✅ Daily trending books updated: ${trendingBooks.length} books from Groq AI`);
    return trendingBooks;
    
  } catch (error) {
    console.error('❌ Error fetching trending books from Groq:', error.message);
    console.error('Stack:', error.stack);
    return getMockTrendingBooks();
  }
}

// Get trending books (with daily cache)
router.get('/trending', async (req, res) => {
  try {
    console.log('📊 Trending books requested');
    
    // Check if cache is valid
    const now = new Date();
    const cacheAge = trendingBooksCache.lastUpdated 
      ? now - trendingBooksCache.lastUpdated 
      : Infinity;
    
    if (trendingBooksCache.data && cacheAge < trendingBooksCache.expiresIn) {
      console.log(`✅ Returning cached trending books (age: ${Math.floor(cacheAge / 1000 / 60)} minutes)`);
      return res.json({
        success: true,
        books: trendingBooksCache.data,
        cached: true,
        lastUpdated: trendingBooksCache.lastUpdated,
        source: 'cache'
      });
    }
    
    // Fetch fresh data
    console.log('🔄 Cache expired or empty, fetching fresh data...');
    const trendingBooks = await fetchDailyTrendingBooks();
    
    res.json({
      success: true,
      books: trendingBooks,
      cached: false,
      lastUpdated: trendingBooksCache.lastUpdated,
      source: groq ? 'groq-ai' : 'fallback'
    });
    
  } catch (error) {
    console.error('❌ Error in /trending endpoint:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      books: getMockTrendingBooks(),
      source: 'error-fallback'
    });
  }
});

// AI-powered recommendation endpoint
router.post('/ai', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a query'
      });
    }

    console.log('🤖 AI Recommendation request for:', query);

    // Check if Groq is available
    if (!groq) {
      console.warn('⚠️ Groq client not initialized, using fallback');
      return useFallbackRecommendations(query, res);
    }

    try {
      console.log('📡 Making Groq API call for recommendations...');
      
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an enthusiastic book recommender AI. Recommend books based on user queries.

CRITICAL: Return ONLY a valid JSON array, nothing else. No markdown, no explanation, no code blocks.

Format:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "genre": "Genre",
    "description": "Brief description in 1-2 sentences",
    "reason": "Why they would enjoy it in 1 sentence",
    "rating": 4.5
  }
]

Return exactly 5 book recommendations.`
          },
          {
            role: "user",
            content: `Recommend 5 books based on: ${query}. Return ONLY the JSON array.`
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 2000
      });

      let responseText = completion.choices[0].message.content;
      console.log('📥 Raw Groq recommendation response:', responseText.substring(0, 200));
      
      // Clean response
      responseText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/`/g, '')
        .trim();
      
      // Find JSON array
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in AI response');
      }
      
      const recommendations = JSON.parse(jsonMatch[0]);

      // Validate
      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        throw new Error('Invalid recommendations format');
      }

      console.log(`✅ AI generated ${recommendations.length} recommendations`);

      res.json({
        success: true,
        query: query,
        recommendations: recommendations,
        source: 'Groq AI (Llama 3.3)',
        isAI: true
      });

    } catch (aiError) {
      console.error('❌ Groq AI Error:', aiError.message);
      console.error('Stack:', aiError.stack);
      return useFallbackRecommendations(query, res);
    }

  } catch (error) {
    console.error('❌ Error in /ai endpoint:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Fallback recommendation function
function useFallbackRecommendations(query, res) {
  console.log('📚 Using fallback recommendations for:', query);
  
  const keywordsLower = query.toLowerCase();
  let suggestions = [];

  // Search in database
  Object.keys(bookDatabase).forEach(genre => {
    if (keywordsLower.includes(genre)) {
      suggestions = [...suggestions, ...bookDatabase[genre]];
    }
  });

  // Default recommendations
  if (suggestions.length === 0) {
    suggestions = [
      { 
        title: 'The Alchemist', 
        author: 'Paulo Coelho', 
        genre: 'Inspirational', 
        rating: 4.7, 
        description: 'A shepherd\'s journey to find his personal legend', 
        reason: 'Inspiring story about following your dreams' 
      },
      { 
        title: 'Atomic Habits', 
        author: 'James Clear', 
        genre: 'Self-Help', 
        rating: 4.8, 
        description: 'Build better habits step by step', 
        reason: 'Practical advice for personal growth' 
      },
      { 
        title: 'Harry Potter', 
        author: 'J.K. Rowling', 
        genre: 'Fantasy', 
        rating: 4.8, 
        description: 'Magical adventure at Hogwarts', 
        reason: 'Perfect blend of fantasy and adventure' 
      },
      { 
        title: '1984', 
        author: 'George Orwell', 
        genre: 'Fiction', 
        rating: 4.6, 
        description: 'Dystopian masterpiece', 
        reason: 'Thought-provoking and relevant' 
      },
      { 
        title: 'The Hobbit', 
        author: 'J.R.R. Tolkien', 
        genre: 'Fantasy', 
        rating: 4.7, 
        description: 'Epic adventure in Middle Earth', 
        reason: 'Classic fantasy adventure' 
      }
    ];
  }

  // Shuffle and limit to 5
  suggestions = suggestions
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  res.json({
    success: true,
    query: query,
    recommendations: suggestions,
    source: 'Curated Database',
    isAI: false
  });
}

// Initialize trending books cache on server start
(async () => {
  console.log('🚀 Initializing trending books cache on startup...');
  try {
    await fetchDailyTrendingBooks();
    console.log('✅ Trending books cache initialized');
  } catch (error) {
    console.error('❌ Failed to initialize trending books cache:', error.message);
  }
})();

// Refresh trending books daily at midnight
setInterval(async () => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    console.log('🔄 Midnight refresh: Updating trending books...');
    await fetchDailyTrendingBooks();
  }
}, 60 * 1000); // Check every minute

module.exports = router;