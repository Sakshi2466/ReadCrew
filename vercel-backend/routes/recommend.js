const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});

// Fallback book database for when AI is unavailable
const bookDatabase = {
  'fantasy': [
    { title: 'Harry Potter', author: 'J.K. Rowling', genre: 'Fantasy', rating: 4.8 },
    { title: 'Lord of the Rings', author: 'J.R.R. Tolkien', genre: 'Fantasy', rating: 4.9 },
    { title: 'Percy Jackson', author: 'Rick Riordan', genre: 'Fantasy', rating: 4.5 }
  ],
  'mystery': [
    { title: 'Sherlock Holmes', author: 'Arthur Conan Doyle', genre: 'Mystery', rating: 4.6 },
    { title: 'Murder on the Orient Express', author: 'Agatha Christie', genre: 'Mystery', rating: 4.5 }
  ],
  'science': [
    { title: 'A Brief History of Time', author: 'Stephen Hawking', genre: 'Science', rating: 4.7 },
    { title: 'Cosmos', author: 'Carl Sagan', genre: 'Science', rating: 4.8 }
  ],
  'fiction': [
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction', rating: 4.8 },
    { title: '1984', author: 'George Orwell', genre: 'Fiction', rating: 4.6 }
  ],
  'self-help': [
    { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8 },
    { title: 'Think and Grow Rich', author: 'Napoleon Hill', genre: 'Self-Help', rating: 4.5 }
  ]
};

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
            content: `You are an enthusiastic book recommender AI assistant. When users ask for book recommendations:

1. Understand their preferences and reading mood
2. Recommend 5 excellent books that match their interests
3. For each book, provide:
   - Title
   - Author
   - Brief description (1-2 sentences)
   - Why they would enjoy it
   - Rating (out of 5)

Format your response as a JSON array with this structure:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "genre": "Genre",
    "description": "Brief description",
    "reason": "Why you'd like it",
    "rating": 4.5
  }
]

IMPORTANT: Return ONLY the JSON array, no additional text, no markdown formatting, no explanations.`
          },
          {
            role: "user",
            content: `I'm looking for: ${query}\n\nRecommend 5 books. Return only the JSON array.`
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 1500
      });

      let responseText = completion.choices[0].message.content;
      
      // Clean the response (remove markdown if present)
      responseText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      // Parse JSON
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
      
      // Fallback to basic recommendations
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

  // Default recommendations if no match
  if (suggestions.length === 0) {
    suggestions = [
      { title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', rating: 4.7, description: 'A shepherd\'s journey to find his personal legend', reason: 'Inspiring story about following your dreams' },
      { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8, description: 'Build better habits step by step', reason: 'Practical advice for personal growth' },
      { title: 'Harry Potter', author: 'J.K. Rowling', genre: 'Fantasy', rating: 4.8, description: 'Magical adventure at Hogwarts', reason: 'Perfect blend of fantasy and adventure' },
      { title: '1984', author: 'George Orwell', genre: 'Fiction', rating: 4.6, description: 'Dystopian masterpiece about surveillance', reason: 'Thought-provoking and relevant' },
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

// Original basic recommendation endpoint (keeping for backward compatibility)
router.post('/', async (req, res) => {
  try {
    const { keywords } = req.body;
    
    if (!keywords) {
      return res.status(400).json({
        success: false,
        message: 'Please provide keywords'
      });
    }

    useFallbackRecommendations(keywords, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;