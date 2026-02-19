const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});

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
  ]
};

// Fetch daily trending books from AI
async function fetchDailyTrendingBooks() {
  console.log('🔥 Fetching daily trending books from Groq AI...');
  
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a book expert. Generate a list of 5 trending books for ${new Date().toDateString()}.

Return ONLY a JSON array with this exact structure:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "genre": "Genre",
    "description": "Brief 1-2 sentence description",
    "rating": 4.5,
    "readers": 15000
  }
]

Focus on currently popular books, bestsellers, and highly-rated recent releases.`
        },
        {
          role: "user",
          content: `What are the top 5 trending books today (${new Date().toDateString()})? Return only the JSON array, no markdown, no extra text.`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1500
    });

    let responseText = completion.choices[0].message.content;
    
    // Clean response
    responseText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const trendingBooks = JSON.parse(responseText);
    
    // Update cache
    trendingBooksCache.data = trendingBooks;
    trendingBooksCache.lastUpdated = new Date();
    
    console.log(`✅ Daily trending books updated: ${trendingBooks.length} books cached`);
    return trendingBooks;
    
  } catch (error) {
    console.error('❌ Error fetching trending books:', error);
    return getMockTrendingBooks();
  }
}

// Get mock trending books as fallback
function getMockTrendingBooks() {
  return [
    {
      title: 'Atomic Habits',
      author: 'James Clear',
      genre: 'Self-Help',
      description: 'Tiny changes, remarkable results. A proven framework for improving your habits.',
      rating: 4.8,
      readers: 25000
    },
    {
      title: 'The Psychology of Money',
      author: 'Morgan Housel',
      genre: 'Finance',
      description: 'Timeless lessons on wealth, greed, and happiness from a financial expert.',
      rating: 4.7,
      readers: 18000
    },
    {
      title: 'Project Hail Mary',
      author: 'Andy Weir',
      genre: 'Sci-Fi',
      description: 'A lone astronaut must save Earth. From the author of The Martian.',
      rating: 4.8,
      readers: 22000
    },
    {
      title: 'The Midnight Library',
      author: 'Matt Haig',
      genre: 'Fiction',
      description: 'Between life and death there is a library of infinite possibilities.',
      rating: 4.6,
      readers: 19000
    },
    {
      title: 'Sapiens',
      author: 'Yuval Noah Harari',
      genre: 'History',
      description: 'A brief history of humankind from the Stone Age to the modern age.',
      rating: 4.7,
      readers: 30000
    }
  ];
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
        lastUpdated: trendingBooksCache.lastUpdated
      });
    }
    
    // Fetch fresh data
    const trendingBooks = await fetchDailyTrendingBooks();
    
    res.json({
      success: true,
      books: trendingBooks,
      cached: false,
      lastUpdated: trendingBooksCache.lastUpdated
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      books: getMockTrendingBooks()
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

    console.log('🤖 AI Recommendation request:', query);

    // Check if Groq API key is available
    if (!process.env.GROQ_API_KEY) {
      console.warn('⚠️ GROQ_API_KEY not found, using fallback');
      return useFallbackRecommendations(query, res);
    }

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an enthusiastic book recommender AI. Recommend books based on user queries.

Format your response as a JSON array:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "genre": "Genre",
    "description": "Brief 1-2 sentence description",
    "reason": "Why they would enjoy it (1 sentence)",
    "rating": 4.5
  }
]

Return ONLY the JSON array, no markdown, no extra text.`
          },
          {
            role: "user",
            content: `Recommend 5 books based on: ${query}`
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 1500
      });

      let responseText = completion.choices[0].message.content;
      
      // Clean response
      responseText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const recommendations = JSON.parse(responseText);

      console.log('✅ AI generated', recommendations.length, 'recommendations');

      res.json({
        success: true,
        query: query,
        recommendations: recommendations,
        source: 'AI (Groq - Llama 3.3)',
        isAI: true
      });

    } catch (aiError) {
      console.error('❌ AI Error:', aiError.message);
      return useFallbackRecommendations(query, res);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Fallback recommendation function
function useFallbackRecommendations(query, res) {
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
      { title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', rating: 4.7, description: 'A shepherd\'s journey to find his personal legend', reason: 'Inspiring story about following your dreams' },
      { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8, description: 'Build better habits step by step', reason: 'Practical advice for personal growth' },
      { title: 'Harry Potter', author: 'J.K. Rowling', genre: 'Fantasy', rating: 4.8, description: 'Magical adventure at Hogwarts', reason: 'Perfect blend of fantasy and adventure' },
      { title: '1984', author: 'George Orwell', genre: 'Fiction', rating: 4.6, description: 'Dystopian masterpiece', reason: 'Thought-provoking and relevant' },
      { title: 'The Hobbit', author: 'J.R.R. Tolkien', genre: 'Fantasy', rating: 4.7, description: 'Epic adventure in Middle Earth', reason: 'Classic fantasy adventure' }
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
  console.log('🚀 Initializing trending books cache...');
  await fetchDailyTrendingBooks();
})();

// Refresh trending books daily at midnight
setInterval(async () => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    console.log('🔄 Daily refresh: Updating trending books...');
    await fetchDailyTrendingBooks();
  }
}, 60 * 1000); // Check every minute

module.exports = router;