const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

let groq = null;
try {
  if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('✅ Groq initialized');
  } else {
    console.warn('⚠️ GROQ_API_KEY missing');
  }
} catch (err) {
  console.error('❌ Groq init failed:', err.message);
}

// ─── TRENDING CACHE ──────────────────────────────────────────────────────────
let trendingCache = { data: null, lastUpdated: null, TTL: 24 * 60 * 60 * 1000 };

function mockTrending(page = 1) {
  const all = [
    { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', description: 'Tiny changes, remarkable results.', rating: 4.8, readers: 25000 },
    { title: 'The Psychology of Money', author: 'Morgan Housel', genre: 'Finance', description: 'Timeless lessons on wealth.', rating: 4.7, readers: 18000 },
    { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', description: 'A lone astronaut must save Earth.', rating: 4.8, readers: 22000 },
    { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', description: 'Between life and death lies infinite possibility.', rating: 4.6, readers: 19000 },
    { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', description: 'A brief history of humankind.', rating: 4.7, readers: 30000 },
    { title: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', description: 'Dragons and forbidden romance at a war college.', rating: 4.6, readers: 28000 },
    { title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', description: "A shepherd's journey to his personal legend.", rating: 4.7, readers: 27000 },
    { title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi', description: 'Epic desert planet saga.', rating: 4.8, readers: 31000 },
    { title: 'It Ends with Us', author: 'Colleen Hoover', genre: 'Romance', description: 'A powerful story of resilience.', rating: 4.6, readers: 33000 },
    { title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', genre: 'Fiction', description: 'A love story about video games.', rating: 4.5, readers: 15000 },
  ];
  const pageSize = 5;
  const start = ((page - 1) % Math.ceil(all.length / pageSize)) * pageSize;
  return all.slice(start, start + pageSize);
}

async function getTrending(page = 1, force = false) {
  const stale = !trendingCache.data || (Date.now() - trendingCache.lastUpdated) >= trendingCache.TTL;

  if (!stale && !force && page === 1) {
    return { books: trendingCache.data, cached: true };
  }

  if (!groq) return { books: mockTrending(page), cached: false };

  try {
    const today = new Date().toISOString().split('T')[0];
    const offset = (page - 1) * 5;

    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 1800,
      messages: [
        {
          role: 'system',
          content: `You are a book trend analyst. Today is ${today}. Return ONLY a valid JSON array, no markdown, no extra text.

Format:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "genre": "Genre",
    "description": "1-2 sentences",
    "trendReason": "Why trending now",
    "rating": 4.5,
    "readers": 15000
  }
]`
        },
        {
          role: 'user',
          content: `Give me 5 trending books as of ${today} (items ${offset + 1}-${offset + 5}). Return ONLY the JSON array.`
        }
      ]
    });

    const text = res.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON');

    const books = JSON.parse(match[0]);

    if (page === 1) {
      trendingCache.data = books;
      trendingCache.lastUpdated = Date.now();
    }

    return { books, cached: false };
  } catch (err) {
    console.error('Trending AI error:', err.message);
    return { books: mockTrending(page), cached: false };
  }
}

// ─── CONVERSATION SESSIONS ───────────────────────────────────────────────────
const sessions = new Map();

function getSession(id) {
  if (!sessions.has(id)) {
    sessions.set(id, {
      messages: [],
      exchangeCount: 0,
      hasRecommended: false,
      created: Date.now()
    });
  }
  return sessions.get(id);
}

setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, s] of sessions) {
    if (s.created < cutoff) sessions.delete(id);
  }
}, 60 * 60 * 1000);

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// GET /api/books/trending?page=1
router.get('/trending', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  try {
    const { books, cached } = await getTrending(page);
    res.json({ success: true, books, page, hasMore: page < 6, cached, source: groq ? 'groq-ai' : 'fallback' });
  } catch (err) {
    res.json({ success: true, books: mockTrending(page), page, hasMore: false, source: 'fallback' });
  }
});

/**
 * POST /api/books/chat
 *
 * BEHAVIOR:
 * - Messages 1: Ask clarifying question (learn preferences)
 * - Message 2-3: More chat OR recommend if enough info
 * - Any time user says "more" or "another": show 5 NEW different books
 * - After recommending, still invite for more
 */
router.post('/chat', async (req, res) => {
  const { message, sessionId = 'default' } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message required' });

  const session = getSession(sessionId);
  const userMsg = message.trim();
  session.messages.push({ role: 'user', content: userMsg });
  session.exchangeCount++;

  if (!groq) {
    const canRec = session.exchangeCount >= 2;
    const reply = canRec
      ? "Based on what you've shared, here are some great picks! 📖 Say 'more' for different recommendations."
      : "I'd love to help! What genres do you enjoy, or tell me about a book you loved recently? 😊";
    session.messages.push({ role: 'assistant', content: reply });
    const recs = canRec ? getFallbackRecs() : [];
    return res.json({ success: true, reply, hasRecommendations: canRec, recommendations: recs, sessionId });
  }

  const wantsMore = /\b(more|another|again|next|else|different|other|add|continue)\b/i.test(userMsg);
  const alreadyRecommended = session.hasRecommended;

  const systemPrompt = `You are "Page Turner" — a warm, enthusiastic AI book guide for ReadCrew.

## Your Job
Help users find their perfect next book through natural conversation, then recommend 5 books.

## Conversation Strategy
- Exchange 1 (first message): Ask ONE good question to understand what they want. Be specific: ask about genre + mood ("Are you more into fast-paced thrillers or slow-burn literary fiction?" or "What's the last book you loved?")
- Exchange 2-3: If you have enough info, RECOMMEND. If not, one more question.
- Always recommend by exchange 3 (even with partial info).
- After recommending, tell them to say "more" for different picks.

## When User Says "more" / "another"
Give 5 COMPLETELY DIFFERENT books from last time. Never repeat.

## Recommendation Format (MANDATORY when recommending)
Always include this exact block when recommending:

<!--REC_START-->
[
  {
    "title": "Exact Book Title",
    "author": "Real Author Name",
    "genre": "Genre",
    "description": "2 sentences about the book",
    "reason": "Personalized: why this specific user will love it based on their stated preferences",
    "rating": 4.6
  }
]
<!--REC_END-->

## Reply Text (before/after the hidden block)
- Before: Brief enthusiastic intro ("Based on your love of fantasy, here are 5 magical reads! ✨")
- After: "Say **'more'** for 5 different picks, or tell me more about what you're in the mood for!"
- Keep text SHORT — the books are the star.
- Never mention the JSON block to the user.

Current exchange: ${session.exchangeCount}
Already recommended before: ${alreadyRecommended}
User wants more different books: ${wantsMore}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.75,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        ...session.messages.slice(-14)
      ]
    });

    let reply = completion.choices[0].message.content;

    // Extract recommendations
    let recommendations = [];
    let hasRecommendations = false;
    const match = reply.match(/<!--REC_START-->([\s\S]*?)<!--REC_END-->/);

    if (match) {
      try {
        const cleaned = match[1].trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          recommendations = parsed;
          hasRecommendations = true;
          session.hasRecommended = true;
        }
      } catch (e) {
        console.error('Rec parse error:', e.message);
        // Try fallback recommendations
        recommendations = getFallbackRecs();
        hasRecommendations = true;
      }
      reply = reply.replace(/<!--REC_START-->[\s\S]*?<!--REC_END-->/, '').trim();
    }

    // If exchange 3+ and still no recommendations, force them
    if (session.exchangeCount >= 3 && !hasRecommendations) {
      recommendations = getFallbackRecs();
      hasRecommendations = true;
      reply = reply + '\n\nHere are some great picks based on our conversation! 📚 Say **"more"** for different recommendations.';
      session.hasRecommended = true;
    }

    session.messages.push({ role: 'assistant', content: reply });

    res.json({
      success: true,
      reply,
      hasRecommendations,
      recommendations,
      sessionId,
      exchangeCount: session.exchangeCount
    });

  } catch (err) {
    console.error('Chat error:', err.message);

    const fallbackReply = session.exchangeCount >= 2
      ? "Here are some great book picks for you! 📚 Say 'more' for different recommendations."
      : "I'd love to help find your next read! What genres do you enjoy? Or tell me a book you've recently loved! 😊";

    const recs = session.exchangeCount >= 2 ? getFallbackRecs() : [];
    session.messages.push({ role: 'assistant', content: fallbackReply });

    res.json({
      success: true,
      reply: fallbackReply,
      hasRecommendations: recs.length > 0,
      recommendations: recs,
      sessionId
    });
  }
});

// POST /api/books/recommend — direct search with pagination
router.post('/recommend', async (req, res) => {
  const { query, page = 1 } = req.body;
  if (!query) return res.status(400).json({ success: false, message: 'Query required' });

  if (!groq) return res.json({ success: true, recommendations: getFallbackRecs(), page, hasMore: false, source: 'fallback' });

  const offset = (page - 1) * 5;
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: 'Return ONLY valid JSON array, no markdown.\n[{"title":"","author":"","genre":"","description":"2 sentences","reason":"why they\'d love it","rating":4.5,"pages":300,"year":2020}]'
        },
        {
          role: 'user',
          content: `Recommend 5 books for: "${query}". ${offset > 0 ? `These are picks ${offset+1}-${offset+5}, DIFFERENT from the first ${offset}.` : ''} Return ONLY JSON array.`
        }
      ]
    });

    const text = completion.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = text.match(/\[[\s\S]*\]/);
    const books = match ? JSON.parse(match[0]) : getFallbackRecs();
    res.json({ success: true, query, recommendations: books, page, hasMore: page < 5, source: 'groq-ai' });

  } catch (err) {
    console.error('Recommend error:', err.message);
    res.json({ success: true, recommendations: getFallbackRecs(), page, hasMore: false, source: 'fallback' });
  }
});

// POST /api/books/character-search
router.post('/character-search', async (req, res) => {
  const { character, fromBook } = req.body;
  if (!character) return res.status(400).json({ success: false, message: 'Character name required' });

  if (!groq) {
    return res.json({
      success: true, character, fromBook,
      characterAnalysis: `Fans of "${character}" will enjoy books with similarly compelling characters.`,
      recommendations: getFallbackRecs()
    });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: 'Return ONLY valid JSON object, no markdown.\n{"characterAnalysis":"What makes this character compelling","recommendations":[{"title":"","author":"","genre":"","description":"","reason":"why fans of [character] will love","rating":4.5,"similarCharacter":"similar character name in this book"}]}'
        },
        {
          role: 'user',
          content: `Find 5 books for readers who love "${character}"${fromBook ? ` from "${fromBook}"` : ''}. Return ONLY JSON object.`
        }
      ]
    });

    const text = completion.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = text.match(/\{[\s\S]*\}/);
    const result = match ? JSON.parse(match[0]) : { characterAnalysis: `Great character choice! Here are similar reads.`, recommendations: getFallbackRecs() };
    res.json({ success: true, character, fromBook, ...result, source: 'groq-ai' });

  } catch (err) {
    console.error('Character search error:', err.message);
    res.json({ success: true, character, fromBook, characterAnalysis: `Great choice! These books have similarly compelling characters.`, recommendations: getFallbackRecs(), source: 'fallback' });
  }
});

// POST /api/books/book-details
router.post('/book-details', async (req, res) => {
  const { bookName, author } = req.body;
  if (!bookName || !author) return res.status(400).json({ success: false, message: 'bookName and author required' });

  if (!groq) return res.json({ success: true, details: { description: `${bookName} by ${author} is a compelling read.`, pages: 280, published: '2020' }, source: 'fallback' });

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: 'Return ONLY valid JSON, no markdown.\n{"description":"2-3 paragraphs","pages":0,"published":"year","publisher":"name","genres":[""],"themes":[""],"awards":[""]}' },
        { role: 'user', content: `Details for "${bookName}" by ${author}. Return ONLY JSON.` }
      ]
    });

    const text = completion.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = text.match(/\{[\s\S]*\}/);
    const details = match ? JSON.parse(match[0]) : { description: `${bookName} by ${author} is a remarkable book.` };
    res.json({ success: true, details, source: 'groq-ai' });

  } catch (err) {
    res.json({ success: true, details: { description: `${bookName} by ${author} is a remarkable book.`, pages: 280, published: '2020' }, source: 'fallback' });
  }
});

// POST /api/books/similar-books
router.post('/similar-books', async (req, res) => {
  const { bookName, author, genre } = req.body;
  if (!bookName || !author) return res.status(400).json({ success: false, message: 'bookName and author required' });

  if (!groq) return res.json({ success: true, books: getFallbackRecs(), source: 'fallback' });

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        { role: 'system', content: 'Return ONLY valid JSON array.\n[{"title":"","author":"","genre":"","rating":4.5,"similarity":"why similar"}]' },
        { role: 'user', content: `5 books similar to "${bookName}" by ${author}${genre ? ` (Genre: ${genre})` : ''}.` }
      ]
    });

    const text = completion.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = text.match(/\[[\s\S]*\]/);
    const books = match ? JSON.parse(match[0]) : getFallbackRecs();
    res.json({ success: true, books, source: 'groq-ai' });

  } catch (err) {
    res.json({ success: true, books: getFallbackRecs(), source: 'fallback' });
  }
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getFallbackRecs() {
  return [
    { title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', rating: 4.7, description: "A shepherd's journey to his personal legend.", reason: 'Timeless and inspiring', pages: 197, year: 1988 },
    { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8, description: 'Build better habits with tiny changes.', reason: 'Practical and life-changing', pages: 320, year: 2018 },
    { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.8, description: 'A lone astronaut must save Earth.', reason: 'Gripping and emotional', pages: 476, year: 2021 },
    { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', rating: 4.6, description: 'Between life and death lies infinite possibility.', reason: 'Beautiful and philosophical', pages: 288, year: 2020 },
    { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', rating: 4.7, description: 'A brief history of humankind.', reason: 'Eye-opening and fascinating', pages: 443, year: 2011 },
  ];
}

// ─── STARTUP ─────────────────────────────────────────────────────────────────
(async () => {
  console.log('🚀 Pre-loading trending books...');
  try { await getTrending(1, true); console.log('✅ Cache ready'); }
  catch (err) { console.error('Cache init failed:', err.message); }
})();

setInterval(async () => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    console.log('🔄 Midnight refresh...');
    await getTrending(1, true);
  }
}, 60 * 1000);

module.exports = router;