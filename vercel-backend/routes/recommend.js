const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

// ─── LLM SETUP: Groq (primary) + Gemini (fallback) ──────────────────────────

let groq = null;
try {
  if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('✅ Groq initialized');
  } else {
    console.warn('⚠️  GROQ_API_KEY missing — Groq disabled');
  }
} catch (err) {
  console.error('❌ Groq init failed:', err.message);
}

// Gemini is called via REST — no extra npm package needed!
const GEMINI_KEY = process.env.GEMINI_API_KEY || null;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

if (GEMINI_KEY) console.log('✅ Gemini fallback initialized');
else console.warn('⚠️  GEMINI_API_KEY missing — Gemini fallback disabled');

/**
 * Unified LLM call: tries Groq first, falls back to Gemini, then throws.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {Array}  history       - [{role:'user'|'assistant', content:'...'}]
 * @param {object} opts          - { temperature, maxTokens }
 * @returns {Promise<string>}    - raw text from whichever LLM responded
 */
async function callLLM(systemPrompt, userPrompt, history = [], opts = {}) {
  const { temperature = 0.75, maxTokens = 2000 } = opts;

  // ── 1. Try Groq ──────────────────────────────────────────────────────────
  if (groq) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-14),
        { role: 'user', content: userPrompt }
      ];

      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature,
        max_tokens: maxTokens,
        messages
      });

      return res.choices[0].message.content;
    } catch (err) {
      console.warn('⚠️  Groq failed, trying Gemini:', err.message);
    }
  }

  // ── 2. Try Gemini (free tier — 15 RPM, 1M tokens/day) ───────────────────
  if (GEMINI_KEY) {
    try {
      // Build Gemini contents array from history
      const contents = [];
      for (const msg of history.slice(-10)) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
      contents.push({ role: 'user', parts: [{ text: userPrompt }] });

      const body = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature, maxOutputTokens: maxTokens, candidateCount: 1 }
      };

      const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000)
      });

      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty Gemini response');

      console.log('✅ Gemini fallback used successfully');
      return text;
    } catch (err) {
      console.warn('⚠️  Gemini also failed:', err.message);
    }
  }

  // ── 3. Both LLMs failed — throw so caller can use local mock ─────────────
  throw new Error('All LLMs unavailable');
}

// ─── TRENDING CACHE ──────────────────────────────────────────────────────────
let trendingCache = { data: null, lastUpdated: null, TTL: 24 * 60 * 60 * 1000 };

function mockTrending(page = 1) {
  const all = [
    { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', description: 'Tiny changes, remarkable results.', trendReason: '#1 on bestseller lists globally', rating: 4.8, readers: 25000 },
    { title: 'The Psychology of Money', author: 'Morgan Housel', genre: 'Finance', description: 'Timeless lessons on wealth and happiness.', trendReason: 'Still topping business charts', rating: 4.7, readers: 18000 },
    { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', description: 'A lone astronaut must save Earth from extinction.', trendReason: 'Beloved by readers worldwide', rating: 4.8, readers: 22000 },
    { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', description: 'Between life and death lies infinite possibility.', trendReason: "Reese's Book Club favorite", rating: 4.6, readers: 19000 },
    { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', description: 'A brief history of humankind.', trendReason: 'Over 25 million copies sold', rating: 4.7, readers: 30000 },
    { title: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', description: 'Dragons and forbidden romance at a war college.', trendReason: 'Fastest-selling fantasy debut ever', rating: 4.6, readers: 28000 },
    { title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', description: "A shepherd's journey to his personal legend.", trendReason: '65M+ copies sold', rating: 4.7, readers: 27000 },
    { title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi', description: 'Epic interstellar saga of politics, religion, and destiny.', trendReason: 'Part 3 film announced', rating: 4.8, readers: 31000 },
    { title: 'It Ends with Us', author: 'Colleen Hoover', genre: 'Romance', description: 'A powerful story of resilience and hard choices.', trendReason: 'Now a major motion picture', rating: 4.6, readers: 33000 },
    { title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', genre: 'Fiction', description: 'A love story about creativity, not romance.', trendReason: 'Pulitzer Prize finalist', rating: 4.5, readers: 15000 },
  ];
  const pageSize = 5;
  const start = ((page - 1) % Math.ceil(all.length / pageSize)) * pageSize;
  return all.slice(start, start + pageSize);
}

async function getTrending(page = 1, force = false) {
  const stale = !trendingCache.data || (Date.now() - trendingCache.lastUpdated) >= trendingCache.TTL;
  if (!stale && !force && page === 1) return { books: trendingCache.data, cached: true };

  const today = new Date().toISOString().split('T')[0];
  const offset = (page - 1) * 5;

  const systemPrompt = `You are a book trend analyst. Today is ${today}. Return ONLY a valid JSON array, no markdown, no extra text.

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
]`;

  const userPrompt = `Give me 5 currently trending books as of ${today} (items ${offset + 1}–${offset + 5}). Real books only. Return ONLY the JSON array.`;

  try {
    const text = await callLLM(systemPrompt, userPrompt, [], { temperature: 0.8, maxTokens: 1800 });
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array in response');
    const books = JSON.parse(match[0]);
    if (page === 1) { trendingCache.data = books; trendingCache.lastUpdated = Date.now(); }
    return { books, cached: false };
  } catch (err) {
    console.error('Trending error, using mock:', err.message);
    return { books: mockTrending(page), cached: false };
  }
}

// ─── CONVERSATION SESSIONS ───────────────────────────────────────────────────
const sessions = new Map();

function getSession(id) {
  if (!sessions.has(id)) {
    sessions.set(id, { messages: [], exchangeCount: 0, hasRecommended: false, created: Date.now() });
  }
  return sessions.get(id);
}

// Cleanup stale sessions every hour
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
    const source = groq ? 'groq-ai' : (GEMINI_KEY ? 'gemini-ai' : 'fallback');
    res.json({ success: true, books, page, hasMore: page < 6, cached, source });
  } catch (err) {
    res.json({ success: true, books: mockTrending(page), page, hasMore: false, source: 'fallback' });
  }
});

/**
 * POST /api/books/chat
 *
 * Flow:
 * - Exchange 1: Ask ONE clarifying question
 * - Exchange 2-3: Recommend if enough info
 * - "more"/"another": Give 5 DIFFERENT books
 * - Exchange 3+: Force recommendations even with partial info
 */
router.post('/chat', async (req, res) => {
  const { message, sessionId = 'default' } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message required' });

  const session = getSession(sessionId);
  const userMsg = message.trim();
  session.messages.push({ role: 'user', content: userMsg });
  session.exchangeCount++;

  const wantsMore = /\b(more|another|again|next|else|different|other|add|continue)\b/i.test(userMsg);

  const systemPrompt = `You are "Page Turner" — a warm, enthusiastic AI book guide for ReadCrew.

## Your Job
Help users find their perfect next book through natural conversation, then recommend 5 books.

## Conversation Strategy
- Exchange 1 (first message): Ask ONE good question to understand what they want. Be specific: genre + mood, e.g. "Are you more into fast-paced thrillers or slow-burn literary fiction?" or "What's the last book you loved?"
- Exchange 2-3: If you have enough info, RECOMMEND. If not, ask one more question.
- Always recommend by exchange 3 (even with partial info).
- After recommending, tell them to say "more" for different picks.

## When User Says "more" / "another"
Give 5 COMPLETELY DIFFERENT books from last time. Never repeat titles.

## Recommendation Format (MANDATORY when recommending)
Always include this exact block — the app parses it to display beautiful book cards:

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

## Response Text
- Before the block: Short enthusiastic intro ("Based on your love of fantasy, here are 5 magical reads! ✨")
- After: "Say **'more'** for 5 different picks, or tell me more about what you're in the mood for!"
- Keep text SHORT — the book cards do the heavy lifting.
- Never mention the JSON block or hidden formatting to the user.

Current exchange: ${session.exchangeCount}
Already recommended before: ${session.hasRecommended}
User wants more/different books: ${wantsMore}`;

  try {
    const rawReply = await callLLM(systemPrompt, userMsg, session.messages.slice(-14), {
      temperature: 0.75,
      maxTokens: 2000
    });

    let reply = rawReply;
    let recommendations = [];
    let hasRecommendations = false;

    // Extract recommendation JSON block
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
        console.error('Rec parse error, using fallback recs:', e.message);
        recommendations = getFallbackRecs();
        hasRecommendations = true;
      }
      reply = reply.replace(/<!--REC_START-->[\s\S]*?<!--REC_END-->/, '').trim();
    }

    // Force recommendations at exchange 3+ if none parsed
    if (session.exchangeCount >= 3 && !hasRecommendations) {
      recommendations = getFallbackRecs();
      hasRecommendations = true;
      reply += '\n\nHere are some great picks based on our conversation! 📚 Say **"more"** for different recommendations.';
      session.hasRecommended = true;
    }

    session.messages.push({ role: 'assistant', content: reply });

    res.json({ success: true, reply, hasRecommendations, recommendations, sessionId, exchangeCount: session.exchangeCount });

  } catch (err) {
    // Both Groq and Gemini failed — smart local fallback
    console.error('All LLMs failed for chat:', err.message);
    const canRec = session.exchangeCount >= 2;
    const fallbackReply = canRec
      ? "Based on what you've shared, here are some great picks! 📚 Say 'more' for different recommendations."
      : "I'd love to help find your next read! What genres do you enjoy? Or tell me a book you've recently loved! 😊";
    const recs = canRec ? getFallbackRecs() : [];
    session.messages.push({ role: 'assistant', content: fallbackReply });
    res.json({ success: true, reply: fallbackReply, hasRecommendations: canRec, recommendations: recs, sessionId, exchangeCount: session.exchangeCount });
  }
});

// POST /api/books/recommend — direct query with pagination
router.post('/recommend', async (req, res) => {
  const { query, page = 1 } = req.body;
  if (!query) return res.status(400).json({ success: false, message: 'Query required' });

  const offset = (page - 1) * 5;
  const systemPrompt = 'Return ONLY a valid JSON array, no markdown.\n[{"title":"","author":"","genre":"","description":"2 sentences","reason":"why they\'d love it","rating":4.5,"pages":300,"year":2020}]';
  const userPrompt = `Recommend 5 books for: "${query}". ${offset > 0 ? `These are picks ${offset + 1}–${offset + 5}, DIFFERENT from the first ${offset}.` : ''} Return ONLY the JSON array.`;

  try {
    const text = await callLLM(systemPrompt, userPrompt, [], { temperature: 0.8, maxTokens: 2000 });
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    const books = match ? JSON.parse(match[0]) : getFallbackRecs();
    res.json({ success: true, query, recommendations: books, page, hasMore: page < 5, source: 'ai' });
  } catch (err) {
    res.json({ success: true, recommendations: getFallbackRecs(), page, hasMore: false, source: 'fallback' });
  }
});

// POST /api/books/character-search
router.post('/character-search', async (req, res) => {
  const { character, fromBook } = req.body;
  if (!character) return res.status(400).json({ success: false, message: 'Character name required' });

  const systemPrompt = 'Return ONLY a valid JSON object, no markdown.\n{"characterAnalysis":"What makes this character compelling and what readers who love them tend to enjoy","recommendations":[{"title":"","author":"","genre":"","description":"","reason":"why fans of this character will love it","rating":4.5,"similarCharacter":"character in this book"}]}';
  const userPrompt = `Find 5 books for readers who love "${character}"${fromBook ? ` from "${fromBook}"` : ''}. Return ONLY the JSON object.`;

  try {
    const text = await callLLM(systemPrompt, userPrompt, [], { temperature: 0.7, maxTokens: 2000 });
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    const result = match
      ? JSON.parse(match[0])
      : { characterAnalysis: `Great character choice! Here are books with similarly compelling protagonists.`, recommendations: getFallbackRecs() };
    res.json({ success: true, character, fromBook, ...result, source: 'ai' });
  } catch (err) {
    res.json({
      success: true, character, fromBook,
      characterAnalysis: `Readers who love "${character}" tend to enjoy books with complex, layered characters who undergo meaningful transformations.`,
      recommendations: getFallbackRecs(),
      source: 'fallback'
    });
  }
});

// POST /api/books/book-details
router.post('/book-details', async (req, res) => {
  const { bookName, author } = req.body;
  if (!bookName || !author) return res.status(400).json({ success: false, message: 'bookName and author required' });

  const systemPrompt = 'Return ONLY valid JSON, no markdown.\n{"description":"2-3 paragraphs","pages":0,"published":"year","publisher":"name","genres":[""],"themes":[""],"awards":[""]}';
  const userPrompt = `Provide details for "${bookName}" by ${author}. Return ONLY JSON.`;

  try {
    const text = await callLLM(systemPrompt, userPrompt, [], { temperature: 0.4, maxTokens: 1000 });
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    const details = match ? JSON.parse(match[0]) : { description: `${bookName} by ${author} is a remarkable book worth exploring.` };
    res.json({ success: true, details, source: 'ai' });
  } catch (err) {
    res.json({ success: true, details: { description: `${bookName} by ${author} is a remarkable book worth exploring.`, pages: 280, published: '2020' }, source: 'fallback' });
  }
});

// POST /api/books/similar-books
router.post('/similar-books', async (req, res) => {
  const { bookName, author, genre } = req.body;
  if (!bookName || !author) return res.status(400).json({ success: false, message: 'bookName and author required' });

  const systemPrompt = 'Return ONLY a valid JSON array, no markdown.\n[{"title":"","author":"","genre":"","rating":4.5,"similarity":"why similar to the requested book"}]';
  const userPrompt = `List 5 books similar to "${bookName}" by ${author}${genre ? ` (Genre: ${genre})` : ''}. Return ONLY the JSON array.`;

  try {
    const text = await callLLM(systemPrompt, userPrompt, [], { temperature: 0.7, maxTokens: 1500 });
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    const books = match ? JSON.parse(match[0]) : getFallbackRecs();
    res.json({ success: true, books, source: 'ai' });
  } catch (err) {
    res.json({ success: true, books: getFallbackRecs(), source: 'fallback' });
  }
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getFallbackRecs() {
  return [
    { title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', rating: 4.7, description: "A shepherd's journey to his personal legend.", reason: 'Timeless and inspiring', pages: 197, year: 1988 },
    { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8, description: 'Build better habits with tiny changes.', reason: 'Practical and genuinely life-changing', pages: 320, year: 2018 },
    { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.8, description: 'A lone astronaut must save Earth from extinction.', reason: 'Gripping, emotional, and impossible to put down', pages: 476, year: 2021 },
    { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', rating: 4.6, description: 'Between life and death lies infinite possibility.', reason: 'Beautiful, philosophical and profoundly hopeful', pages: 288, year: 2020 },
    { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', rating: 4.7, description: 'A brief history of humankind.', reason: 'Will fundamentally change how you see the human story', pages: 443, year: 2011 },
  ];
}

// ─── STARTUP ─────────────────────────────────────────────────────────────────
(async () => {
  console.log('🚀 Pre-loading trending books...');
  try { await getTrending(1, true); console.log('✅ Cache ready'); }
  catch (err) { console.error('Cache init failed:', err.message); }
})();

// Refresh cache at midnight every day
setInterval(async () => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    console.log('🔄 Midnight cache refresh...');
    await getTrending(1, true);
  }
}, 60 * 1000);

module.exports = router;