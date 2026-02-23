const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

// ─── LLM SETUP ───────────────────────────────────────────────────────────────
let groq = null;
try {
  if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('✅ Groq initialized');
  } else {
    console.warn('⚠️  GROQ_API_KEY missing');
  }
} catch (err) {
  console.error('❌ Groq init failed:', err.message);
}

const GEMINI_KEY = process.env.GEMINI_API_KEY || null;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
if (GEMINI_KEY) console.log('✅ Gemini fallback ready');
else console.warn('⚠️  GEMINI_API_KEY missing — Gemini fallback disabled');

// ─── DEBUG ENDPOINT ───────────────────────────────────────────────────────────
router.get('/debug', async (req, res) => {
  const results = { groqKey: !!process.env.GROQ_API_KEY, geminiKey: !!GEMINI_KEY, groq: 'untested', gemini: 'untested' };
  if (groq) {
    try {
      const r = await groq.chat.completions.create({ model: 'llama-3.3-70b-versatile', max_tokens: 50, messages: [{ role: 'user', content: 'Say "Groq works" and nothing else.' }] });
      results.groq = r.choices[0].message.content;
    } catch (e) { results.groq = `FAILED: ${e.message}`; }
  } else { results.groq = 'no key'; }
  if (GEMINI_KEY) {
    try {
      const r = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Say "Gemini works" and nothing else.' }] }] }), signal: AbortSignal.timeout(10000) });
      const d = await r.json();
      results.gemini = r.ok ? (d.candidates?.[0]?.content?.parts?.[0]?.text || 'empty') : `HTTP ${r.status}`;
    } catch (e) { results.gemini = `FAILED: ${e.message}`; }
  } else { results.gemini = 'no key'; }
  res.json(results);
});

// ─── UNIFIED LLM CALLER ───────────────────────────────────────────────────────
async function callLLM(systemPrompt, messages, opts = {}) {
  const { temperature = 0.75, maxTokens = 2000 } = opts;

  if (groq) {
    try {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile', temperature, max_tokens: maxTokens,
        messages: [{ role: 'system', content: systemPrompt }, ...messages]
      });
      const text = res.choices[0]?.message?.content;
      if (!text) throw new Error('Empty Groq response');
      console.log(`✅ Groq responded (${text.length} chars)`);
      return text;
    } catch (err) { console.warn('⚠️  Groq failed:', err.message); }
  }

  if (GEMINI_KEY) {
    try {
      const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_instruction: { parts: [{ text: systemPrompt }] }, contents, generationConfig: { temperature, maxOutputTokens: maxTokens } }),
        signal: AbortSignal.timeout(20000)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty Gemini response');
      console.log(`✅ Gemini responded (${text.length} chars)`);
      return text;
    } catch (err) { console.warn('⚠️  Gemini failed:', err.message); }
  }

  throw new Error('All LLMs unavailable');
}

// ─── TRENDING CACHE ───────────────────────────────────────────────────────────
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
    { title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi', description: 'Epic interstellar saga.', trendReason: 'Part 3 film announced', rating: 4.8, readers: 31000 },
    { title: 'It Ends with Us', author: 'Colleen Hoover', genre: 'Romance', description: 'A powerful story of resilience.', trendReason: 'Now a major motion picture', rating: 4.6, readers: 33000 },
    { title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', genre: 'Fiction', description: 'A love story about creativity.', trendReason: 'Pulitzer Prize finalist', rating: 4.5, readers: 15000 },
  ];
  const s = ((page - 1) % 2) * 5;
  return all.slice(s, s + 5);
}

async function getTrending(page = 1, force = false) {
  const stale = !trendingCache.data || (Date.now() - trendingCache.lastUpdated) >= trendingCache.TTL;
  if (!stale && !force && page === 1) return { books: trendingCache.data, cached: true };

  const today = new Date().toISOString().split('T')[0];
  const offset = (page - 1) * 5;
  const systemPrompt = `You are a book trend analyst. Today is ${today}. Return ONLY a valid JSON array, no markdown.\n[{"title":"","author":"","genre":"","description":"1-2 sentences","trendReason":"why trending now","rating":4.5,"readers":15000}]`;
  const userPrompt = `Give me 5 currently trending books (items ${offset+1}-${offset+5}). Real published books only. Return ONLY the JSON array.`;

  try {
    const text = await callLLM(systemPrompt, [{ role: 'user', content: userPrompt }], { temperature: 0.8, maxTokens: 1500 });
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array found');
    const books = JSON.parse(match[0]);
    if (!Array.isArray(books) || books.length === 0) throw new Error('Empty books array');
    if (page === 1) { trendingCache.data = books; trendingCache.lastUpdated = Date.now(); }
    return { books, cached: false };
  } catch (err) {
    console.error('Trending LLM error, using mock:', err.message);
    return { books: mockTrending(page), cached: false };
  }
}

// ─── CONVERSATION SESSIONS ────────────────────────────────────────────────────
const sessions = new Map();

function getSession(id) {
  if (!sessions.has(id)) {
    sessions.set(id, { messages: [], exchangeCount: 0, hasRecommended: false, created: Date.now() });
  }
  return sessions.get(id);
}

setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, s] of sessions) { if (s.created < cutoff) sessions.delete(id); }
}, 60 * 60 * 1000);

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// GET /api/books/trending
router.get('/trending', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  try {
    const { books, cached } = await getTrending(page);
    res.json({ success: true, books, page, hasMore: page < 6, cached, source: groq ? 'groq' : GEMINI_KEY ? 'gemini' : 'fallback' });
  } catch (err) {
    res.json({ success: true, books: mockTrending(page), page, hasMore: false, source: 'fallback' });
  }
});

// ─── KEY FIX: SSE keepalive on /api/books/chat ────────────────────────────────
// Render free tier kills HTTP after 30s. We use Server-Sent Events (SSE) to keep
// the connection alive, then send the final response as a single JSON event.
// The frontend reads the last 'data:' line.
router.post('/chat', async (req, res) => {
  const { message, sessionId = 'default' } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message required' });

  const session = getSession(sessionId);
  const userMsg = message.trim();
  const historyForLLM = [...session.messages.slice(-12), { role: 'user', content: userMsg }];
  session.messages.push({ role: 'user', content: userMsg });
  session.exchangeCount++;

  const wantsMore = /\b(more|another|again|next|else|different|other|continue)\b/i.test(userMsg);
  const isEmotional = /\b(sad|depress|lonely|anxious|stress|grief|heartbreak|lost|empty|numb|overwhelm|down|cry|hurt|broken|unhappy|exhausted|upset|worried|miss|mourn)\b/i.test(userMsg);

  // ── SSE setup: prevents Render 30s timeout by sending keepalive pings ──
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering on Render
  res.flushHeaders();

  // Send keepalive every 8 seconds to prevent Render from closing the connection
  const keepalive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 8000);

  // Helper to send final response and close
  const sendFinal = (payload) => {
    clearInterval(keepalive);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    res.end();
  };

  // ── IMPROVED SYSTEM PROMPT: Give books faster ──────────────────────────────
  const systemPrompt = `You are "Page Turner" — a warm, caring AI book companion. Like a best friend who has read every book.

PERSONALITY: Warm, empathetic, conversational. Occasional emojis. Never robotic.

EMOTIONAL INTELLIGENCE:
When someone shares ANY feeling (sad, stressed, bored, happy, heartbroken):
1. FIRST acknowledge their emotion warmly (1-2 sentences)
2. Bridge to books gently
3. Then ask ONE follow-up question OR go straight to recommendations if mood is clear

CONVERSATION FLOW — GIVE BOOKS FASTER:
- Exchange 1 with clear genre/mood: Ask ONE warm question + hint at your picks
- Exchange 1 with vague request: Ask ONE clarifying question (what genre/mood?)
- Exchange 2+: ALWAYS recommend 5 books — no more questions unless truly needed
- "more"/"another": Give 5 COMPLETELY DIFFERENT books, never repeat titles

GOOD EXCHANGE 1 EXAMPLE:
User: "I want a thriller"
You: "Ooh great taste! 🔪 Are you in the mood for psychological mind-games (think Gone Girl), or fast-paced action? I've got amazing picks for both!"

GOOD EXCHANGE 2 EXAMPLE (always give books):
User: "psychological stuff please"
You: "Perfect choice! Here are 5 psychological thrillers that will mess with your mind in the best way 😈" [then the recommendation block]

RECOMMENDATION FORMAT (use this EXACT format when recommending):
<!--REC_START-->
[
  {
    "title": "Exact Book Title",
    "author": "Real Author Name",
    "genre": "Genre",
    "description": "2 sentences about the book",
    "reason": "Tie this to the user's specific mood/request",
    "rating": 4.6
  }
]
<!--REC_END-->

Before the block: 1-2 warm sentences.
After the block: "Say 'more' for 5 completely different picks!"
Never mention the hidden markers to the user.

CURRENT STATE:
Exchange: ${session.exchangeCount}
Has recommended before: ${session.hasRecommended}
User wants more books: ${wantsMore}
Emotional message: ${isEmotional}

RULES:
- If exchange >= 2, you MUST give book recommendations. No exceptions.
- If "more" or "another", give 5 completely different books immediately.`;

  try {
    const rawReply = await callLLM(systemPrompt, historyForLLM, { temperature: 0.8, maxTokens: 2000 });

    let reply = rawReply;
    let recommendations = [];
    let hasRecommendations = false;

    const recMatch = reply.match(/<!--REC_START-->([\s\S]*?)<!--REC_END-->/);
    if (recMatch) {
      try {
        const cleaned = recMatch[1].trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          recommendations = parsed;
          hasRecommendations = true;
          session.hasRecommended = true;
        }
      } catch (e) {
        console.error('Rec JSON parse error:', e.message);
      }
      reply = reply.replace(/<!--REC_START-->[\s\S]*?<!--REC_END-->/, '').trim();
    }

    // Force recs at exchange 2+ if AI forgot to include them
    if (session.exchangeCount >= 2 && !hasRecommendations) {
      recommendations = getVariedFallbackRecs(session.exchangeCount);
      hasRecommendations = true;
      session.hasRecommended = true;
      if (!reply.includes('book')) reply += '\n\nHere are some great picks for you! 📚 Say **"more"** for different recommendations.';
    }

    session.messages.push({ role: 'assistant', content: reply });
    sendFinal({ success: true, reply, hasRecommendations, recommendations, sessionId, exchangeCount: session.exchangeCount });

  } catch (err) {
    console.error('All LLMs failed:', err.message);

    const canRec = session.exchangeCount >= 2;
    let fallbackReply;

    if (isEmotional) {
      fallbackReply = canRec
        ? "I'm sorry you're going through a tough time 💙 Here are some books that many readers find comforting and healing."
        : "I'm really sorry you're feeling that way 💙 Would you like something hopeful, or a story that lets you sit with your feelings?";
    } else if (wantsMore) {
      fallbackReply = "Here are 5 more great picks! 📚";
    } else {
      fallbackReply = canRec
        ? "Here are some wonderful books I think you'll love! 📚 Say 'more' for different picks."
        : "I'd love to help! Tell me how you're feeling or what kind of story sounds good 😊";
    }

    const recs = canRec ? getVariedFallbackRecs(session.exchangeCount) : [];
    session.messages.push({ role: 'assistant', content: fallbackReply });
    sendFinal({ success: true, reply: fallbackReply, hasRecommendations: canRec, recommendations: recs, sessionId, exchangeCount: session.exchangeCount });
  }
});

// POST /api/books/recommend
router.post('/recommend', async (req, res) => {
  const { query, page = 1 } = req.body;
  if (!query) return res.status(400).json({ success: false, message: 'Query required' });

  const offset = (page - 1) * 5;
  const systemPrompt = 'You are a book recommendation expert. Return ONLY a valid JSON array, no markdown, no extra text.\n[{"title":"","author":"","genre":"","description":"2 sentences","reason":"why they would love it","rating":4.5,"pages":300,"year":2020}]';
  const userMsg = `Recommend 5 books for: "${query}". ${offset > 0 ? `Skip the first ${offset} most obvious choices.` : ''} Return ONLY the JSON array.`;

  try {
    const text = await callLLM(systemPrompt, [{ role: 'user', content: userMsg }], { temperature: 0.85, maxTokens: 2000 });
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    const books = match ? JSON.parse(match[0]) : getVariedFallbackRecs(page);
    res.json({ success: true, query, recommendations: books, page, hasMore: page < 5, source: 'ai' });
  } catch (err) {
    res.json({ success: true, recommendations: getVariedFallbackRecs(page), page, hasMore: false, source: 'fallback' });
  }
});

// POST /api/books/character-search
router.post('/character-search', async (req, res) => {
  const { character, fromBook } = req.body;
  if (!character) return res.status(400).json({ success: false, message: 'Character name required' });

  const systemPrompt = 'Return ONLY a valid JSON object, no markdown.\n{"characterAnalysis":"2-3 sentences","recommendations":[{"title":"","author":"","genre":"","description":"","reason":"","rating":4.5,"similarCharacter":""}]}';
  const userMsg = `Find 5 books for readers who love "${character}"${fromBook ? ` from "${fromBook}"` : ''}. Return ONLY JSON.`;

  try {
    const text = await callLLM(systemPrompt, [{ role: 'user', content: userMsg }], { temperature: 0.7, maxTokens: 2000 });
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    const result = match ? JSON.parse(match[0]) : { characterAnalysis: `Readers who love "${character}" enjoy complex, compelling protagonists.`, recommendations: getVariedFallbackRecs(1) };
    res.json({ success: true, character, fromBook, ...result, source: 'ai' });
  } catch (err) {
    res.json({ success: true, character, fromBook, characterAnalysis: `Readers who love "${character}" tend to enjoy books with layered, memorable characters.`, recommendations: getVariedFallbackRecs(1), source: 'fallback' });
  }
});

// POST /api/books/book-details
router.post('/book-details', async (req, res) => {
  const { bookName, author } = req.body;
  if (!bookName || !author) return res.status(400).json({ success: false, message: 'bookName and author required' });

  const systemPrompt = 'Return ONLY valid JSON, no markdown.\n{"description":"2-3 paragraphs","pages":0,"published":"year","genres":[""],"themes":[""],"awards":[""]}';
  try {
    const text = await callLLM(systemPrompt, [{ role: 'user', content: `Give details about "${bookName}" by ${author}. Return ONLY JSON.` }], { temperature: 0.3, maxTokens: 1000 });
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    const details = match ? JSON.parse(match[0]) : { description: `"${bookName}" by ${author} is a must-read.` };
    res.json({ success: true, details, source: 'ai' });
  } catch (err) {
    res.json({ success: true, details: { description: `"${bookName}" by ${author} is a compelling read.`, pages: 280, published: '2020' }, source: 'fallback' });
  }
});

// POST /api/books/similar-books
router.post('/similar-books', async (req, res) => {
  const { bookName, author, genre } = req.body;
  if (!bookName || !author) return res.status(400).json({ success: false, message: 'bookName and author required' });

  const systemPrompt = 'Return ONLY a valid JSON array, no markdown.\n[{"title":"","author":"","genre":"","rating":4.5,"similarity":"why similar"}]';
  try {
    const text = await callLLM(systemPrompt, [{ role: 'user', content: `List 5 books similar to "${bookName}" by ${author}${genre ? ` (Genre: ${genre})` : ''}. Return ONLY JSON array.` }], { temperature: 0.7, maxTokens: 1500 });
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    const books = match ? JSON.parse(match[0]) : getVariedFallbackRecs(1);
    res.json({ success: true, books, source: 'ai' });
  } catch (err) {
    res.json({ success: true, books: getVariedFallbackRecs(1), source: 'fallback' });
  }
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getVariedFallbackRecs(seed = 1) {
  const sets = [
    [
      { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', rating: 4.6, description: 'Between life and death lies a library full of second chances.', reason: 'Beautiful and hopeful — perfect when you need a reminder life can get better', pages: 288, year: 2020 },
      { title: 'Eleanor Oliphant is Completely Fine', author: 'Gail Honeyman', genre: 'Fiction', rating: 4.6, description: 'A quirky, lonely woman slowly opens up to the world.', reason: 'Warm, funny, quietly healing', pages: 383, year: 2017 },
      { title: 'The House in the Cerulean Sea', author: 'TJ Klune', genre: 'Fantasy', rating: 4.7, description: 'A cozy fantasy about found family and belonging.', reason: 'Gentle, whimsical and wonderfully comforting', pages: 396, year: 2020 },
      { title: 'A Man Called Ove', author: 'Fredrik Backman', genre: 'Fiction', rating: 4.7, description: 'A grumpy old man is changed by his new neighbors.', reason: 'Unexpectedly moving — you will laugh and cry', pages: 337, year: 2012 },
      { title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', rating: 4.7, description: "A shepherd's journey toward his personal legend.", reason: 'Timeless, gentle, and quietly inspiring', pages: 197, year: 1988 },
    ],
    [
      { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8, description: 'How tiny changes lead to remarkable results.', reason: 'Practical and genuinely life-changing', pages: 320, year: 2018 },
      { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.8, description: 'A lone astronaut must save Earth from extinction.', reason: 'Gripping, emotional, impossible to put down', pages: 476, year: 2021 },
      { title: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', rating: 4.6, description: 'A war college for dragon riders with forbidden romance.', reason: 'Fast-paced, romantic, totally addictive', pages: 528, year: 2023 },
      { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', rating: 4.7, description: 'A brief history of all of humankind.', reason: 'Will change how you see the human story', pages: 443, year: 2011 },
      { title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', genre: 'Fiction', rating: 4.7, description: 'A reclusive Hollywood legend tells her scandalous life.', reason: 'Glamorous, emotional, utterly unforgettable', pages: 400, year: 2017 },
    ],
    [
      { title: 'Gone Girl', author: 'Gillian Flynn', genre: 'Thriller', rating: 4.6, description: 'A woman vanishes on her anniversary. Her husband is suspect.', reason: 'Twisty and addictive — impossible to put down', pages: 422, year: 2012 },
      { title: 'The Name of the Wind', author: 'Patrick Rothfuss', genre: 'Fantasy', rating: 4.7, description: 'A legendary figure tells his own extraordinary story.', reason: 'Stunning prose and world-building', pages: 662, year: 2007 },
      { title: 'Beach Read', author: 'Emily Henry', genre: 'Romance', rating: 4.6, description: 'Two rival authors swap genres and fall in love.', reason: 'Witty, heartfelt and genuinely funny', pages: 361, year: 2020 },
      { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', genre: 'Psychology', rating: 4.6, description: 'How two thinking systems shape our decisions.', reason: 'Changes how you understand your own mind', pages: 499, year: 2011 },
      { title: 'The Nightingale', author: 'Kristin Hannah', genre: 'Historical Fiction', rating: 4.8, description: 'Two French sisters resist Nazi occupation.', reason: 'Devastating and triumphant — you will cry', pages: 440, year: 2015 },
    ],
  ];
  return sets[seed % sets.length];
}

// ─── STARTUP ──────────────────────────────────────────────────────────────────
(async () => {
  console.log('🚀 Pre-loading trending books...');
  try { await getTrending(1, true); console.log('✅ Cache ready'); }
  catch (e) { console.error('Cache failed:', e.message); }
})();

setInterval(async () => {
  if (new Date().getHours() === 0 && new Date().getMinutes() === 0) {
    await getTrending(1, true).catch(console.error);
  }
}, 60000);

module.exports = router;