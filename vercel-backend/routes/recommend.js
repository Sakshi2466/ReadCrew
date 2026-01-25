const express = require('express');

const router = express.Router();

// Book recommendation
router.post('/', async (req, res) => {
  try {
    const { keywords } = req.body;
    
    if (!keywords) {
      return res.status(400).json({
        success: false,
        message: 'Please provide keywords'
      });
    }

    const bookDatabase = {
      'fantasy': [
        { title: 'Harry Potter', author: 'J.K. Rowling', genre: 'Fantasy' },
        { title: 'Lord of the Rings', author: 'J.R.R. Tolkien', genre: 'Fantasy' },
        { title: 'Percy Jackson', author: 'Rick ', genre: 'Fantasy' }
      ],
      'mystery': [
        { title: 'Sherlock Holmes', author: 'Arthur Conan Doyle', genre: 'Mystery' },
        { title: 'Murder on the Orient Express', author: 'Agatha Christie', genre: 'Mystery' }
      ],
      'science': [
        { title: 'A Brief History of Time', author: 'Stephen Hawking', genre: 'Science' },
        { title: 'Cosmos', author: 'Carl Sagan', genre: 'Science' }
      ],
      'fiction': [
        { title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction' },
        { title: '1984', author: 'George Orwell', genre: 'Fiction' }
      ],
      'self-help': [
        { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help' },
        { title: 'Think and Grow Rich', author: 'Napoleon Hill', genre: 'Self-Help' }
      ],
      'children': [
        { title: 'The Cat in the Hat', author: 'Dr. Seuss', genre: 'Children' },
        { title: 'Charlotte\'s Web', author: 'E.B. White', genre: 'Children' }
      ],
      'romance': [
        { title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Romance' },
        { title: 'The Notebook', author: 'Nicholas Sparks', genre: 'Romance' }
      ],
      'thriller': [
        { title: 'Gone Girl', author: 'Gillian Flynn', genre: 'Thriller' },
        { title: 'The Girl on the Train', author: 'Paula Hawkins', genre: 'Thriller' }
      ],
      'biography': [
        { title: 'Steve Jobs', author: 'Walter', genre: 'Biography' },
        { title: 'Becoming', author: 'Michelle Obama', genre: 'Biography' }
      ]
    };

    const keywordsLower = keywords.toLowerCase();
    let suggestions = [];

    Object.keys(bookDatabase).forEach(genre => {
      if (keywordsLower.includes(genre)) {
        suggestions = [...suggestions, ...bookDatabase[genre]];
      }
    });

    // Default recommendations if no match
    if (suggestions.length === 0) {
      suggestions = [
        { title: 'The Alchemist', author: 'Paulo ', genre: 'Inspirational' },
        { title: 'The Secret', author: 'Rhonda ', genre: 'Self-Help' },
        { title: 'Rich Dad Poor Dad', author: 'Robert ', genre: 'Finance' }
      ];
    }

    // Shuffle and limit to 5 recommendations
    suggestions = suggestions
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      recommendations: suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;