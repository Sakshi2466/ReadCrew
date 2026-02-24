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

// ─── UNIFIED LLM CALLER ───────────────────────────────────────────────────────
async function callLLM(systemPrompt, messages, opts = {}) {
  const { temperature = 0.75, maxTokens = 2000 } = opts;

  if (groq) {
    try {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature,
        max_tokens: maxTokens,
        messages: [{ role: 'system', content: systemPrompt }, ...messages]
      });
      const text = res.choices[0]?.message?.content;
      if (!text) throw new Error('Empty Groq response');
      console.log(`✅ Groq responded (${text.length} chars)`);
      return text;
    } catch (err) {
      console.warn('⚠️  Groq failed:', err.message);
    }
  }

  if (GEMINI_KEY) {
    try {
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature, maxOutputTokens: maxTokens }
        }),
        signal: AbortSignal.timeout(20000)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty Gemini response');
      console.log(`✅ Gemini responded (${text.length} chars)`);
      return text;
    } catch (err) {
      console.warn('⚠️  Gemini failed:', err.message);
    }
  }

  throw new Error('All LLMs unavailable');
}

// ─── CONVERSATION SESSIONS ────────────────────────────────────────────────────
const sessions = new Map();

function getSession(id) {
  if (!sessions.has(id)) {
    sessions.set(id, { messages: [], exchangeCount: 0, recommendedBooks: [], created: Date.now() });
  }
  return sessions.get(id);
}

setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, s] of sessions) { if (s.created < cutoff) sessions.delete(id); }
}, 60 * 60 * 1000);

// ─── SYSTEM PROMPT — BOOKS FIRST, ALWAYS ─────────────────────────────────────
const BOOK_COMPANION_PROMPT = `You are "Page Turner" — a warm, knowledgeable AI book companion. Your #1 job is to give great book recommendations as fast as possible.

═══════════════════════════════════════
 THE GOLDEN RULE: ALWAYS GIVE BOOKS FIRST
═══════════════════════════════════════

ANY mood, emotion, genre, vibe, or keyword = give 5 book recommendations IMMEDIATELY.

• "I am feeling sad" → give 5 emotional/literary books NOW
• "I want something fun" → give 5 light/funny books NOW  
• "romance" → give 5 romance books NOW
• "sci-fi" → give 5 sci-fi books NOW
• "I can't sleep" → give 5 page-turners NOW
• "stressed" → give 5 calming/escapist books NOW
• "happy" → give 5 joyful/celebratory books NOW
• ANY emotion + ANY genre + ANY mood = books NOW

ONLY skip giving books if the message is purely: "hi", "hello", "hey", or "what can you do?" — for these, give a warm 1-sentence welcome and ask what they want.

For EVERYTHING else: books first, question second (if at all).

═══════════════════════════════════════
 FORMAT — USE THIS EXACTLY
═══════════════════════════════════════

[Short warm intro — 1 sentence about why these books fit their request]

<!--REC_START-->
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "genre": "Genre",
    "description": "2-3 engaging sentences about the book. What makes it special.",
    "reason": "Exactly why this fits what they said",
    "rating": 4.6
  }
]
<!--REC_END-->

[1 brief optional follow-up question or comment — max 1 sentence]

═══════════════════════════════════════
 FOLLOW-UP RULES
═══════════════════════════════════════

• "more" or "different" → Give 5 completely NEW books, no repeats, no questions
• "more like [title]" → Give books similar to that specific one
• User mentions a book title → Acknowledge it briefly (1 sentence), then give similar books
• Exchange 2+ → ALWAYS include 5 books. You may ask 1 question AFTER the book list.
• NEVER ask more than 1 question per message
• NEVER ask for clarification before giving books — you always have enough info

═══════════════════════════════════════
 PERSONALITY
═══════════════════════════════════════
• Warm and enthusiastic without being over-the-top
• Use 1-2 emojis max per message
• Sound like a knowledgeable friend, not a librarian
• Your recommendations feel personal and specific, not generic

═══════════════════════════════════════
 EXAMPLE — THIS IS HOW IT SHOULD WORK
═══════════════════════════════════════

User: "i am feeling sad"

Response:
Sad moods deserve books that make you feel beautifully understood 🥺

<!--REC_START-->
[
  {"title":"A Little Life","author":"Hanya Yanagihara","genre":"Literary Fiction","description":"Four friends navigate life, trauma, and love over decades. Devastating, beautiful, and one of the most emotionally intense novels ever written.","reason":"Perfectly captures that deep, aching sadness — you'll feel profoundly seen","rating":4.6},
  {"title":"The Fault in Our Stars","author":"John Green","genre":"YA Fiction","description":"Two teenagers with cancer fall in love. Simple premise, devastating execution with wit and heart.","reason":"Cathartic sad — you'll cry but feel somehow better after","rating":4.7},
  {"title":"The Midnight Library","author":"Matt Haig","genre":"Fiction","description":"Between life and death exists a library of every life you could have lived. A beautiful meditation on regret and second chances.","reason":"Starts sad but blooms into something hopeful — perfect for this mood","rating":4.5},
  {"title":"Me Before You","author":"Jojo Moyes","genre":"Romance","description":"A young woman becomes caretaker to a paralyzed man. Their bond changes everything.","reason":"Beautifully bittersweet — exactly the kind of sad that feels meaningful","rating":4.6},
  {"title":"The Book Thief","author":"Markus Zusak","genre":"Historical Fiction","description":"A girl in Nazi Germany steals books to survive. Narrated by Death. Hauntingly, gloriously written.","reason":"Devastatingly sad and one of the most beautifully written books ever made","rating":4.8}
]
<!--REC_END-->

Would you prefer something more hopeful, or lean further into the beautiful devastation?`;

// ─── CHAT ENDPOINT ────────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { message, sessionId = 'default' } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message required' });

  const session = getSession(sessionId);
  const userMsg = message.trim();

  const historyForLLM = [...session.messages.slice(-10), { role: 'user', content: userMsg }];
  session.messages.push({ role: 'user', content: userMsg });
  session.exchangeCount++;

  let contextPrompt = BOOK_COMPANION_PROMPT;
  if (session.recommendedBooks.length > 0) {
    contextPrompt += `\n\n⛔ ALREADY RECOMMENDED — DO NOT SUGGEST THESE AGAIN:\n${session.recommendedBooks.map(b => `- "${b.title}" by ${b.author}`).join('\n')}`;
  }
  if (session.exchangeCount >= 2) {
    contextPrompt += `\n\n⚠️ MANDATORY: This is exchange ${session.exchangeCount}. You MUST include 5 book recommendations in your response.`;
  }

  try {
    const rawReply = await callLLM(contextPrompt, historyForLLM, { temperature: 0.82, maxTokens: 2200 });

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
          recommendations.forEach(book => {
            if (!session.recommendedBooks.find(b => b.title === book.title)) {
              session.recommendedBooks.push({ title: book.title, author: book.author });
            }
          });
        }
      } catch (e) {
        console.error('Rec JSON parse error:', e.message);
      }
      reply = reply.replace(/<!--REC_START-->[\s\S]*?<!--REC_END-->/, '').trim();
      reply = reply.replace(/\n{3,}/g, '\n\n').trim();
    }

    session.messages.push({ role: 'assistant', content: reply });

    return res.json({
      success: true,
      reply,
      hasRecommendations,
      recommendations,
      sessionId,
      exchangeCount: session.exchangeCount
    });

  } catch (err) {
    console.error('Chat error:', err.message);
    const fallbackReply = "Having a moment of trouble connecting 😅 Try again — I'm here! What kind of books are you in the mood for?";
    session.messages.push({ role: 'assistant', content: fallbackReply });
    return res.json({ success: true, reply: fallbackReply, hasRecommendations: false, recommendations: [], sessionId, exchangeCount: session.exchangeCount });
  }
});

// ─── CHARACTER SEARCH ─────────────────────────────────────────────────────────
router.post('/character-search', async (req, res) => {
  const { character, fromBook } = req.body;
  if (!character) return res.status(400).json({ success: false, message: 'Character name required' });

  const systemPrompt = `You are a book expert. Return ONLY valid JSON.
{
  "characterAnalysis": "3-4 sentences about why readers love this character and what makes them compelling",
  "recommendations": [
    {"title":"","author":"","genre":"","description":"2 sentences","reason":"Why this has a similar character","rating":4.5,"similarCharacter":"Character name in this book"}
  ]
}`;

  const userPrompt = fromBook
    ? `Analyze "${character}" from "${fromBook}". Recommend 5 books with similarly compelling characters. Return ONLY JSON.`
    : `Analyze character "${character}". Recommend 5 books with similar characters. Return ONLY JSON.`;

  try {
    const text = await callLLM(systemPrompt, [{ role: 'user', content: userPrompt }], { temperature: 0.7, maxTokens: 2000 });
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found');
    const result = JSON.parse(match[0]);
    res.json({ success: true, character, fromBook: fromBook || null, ...result, source: 'ai' });
  } catch (err) {
    console.error('Character search error:', err.message);
    res.json({
      success: true, character, fromBook: fromBook || null,
      characterAnalysis: `Readers who love "${character}" are drawn to complex, layered characters with emotional depth and compelling growth arcs.`,
      recommendations: [
        { title: 'The Name of the Wind', author: 'Patrick Rothfuss', genre: 'Fantasy', description: 'Kvothe tells his legendary story of magic and tragedy.', reason: 'A brilliantly complex, gifted protagonist', rating: 4.7, similarCharacter: 'Kvothe' },
        { title: 'The Secret History', author: 'Donna Tartt', genre: 'Mystery', description: 'Classics students spiral into moral darkness.', reason: 'Morally complex characters you cannot stop reading', rating: 4.6, similarCharacter: 'Richard Papen' },
        { title: 'Circe', author: 'Madeline Miller', genre: 'Fantasy', description: 'A witch-goddess discovers her power.', reason: 'Powerful character transformation and self-discovery', rating: 4.7, similarCharacter: 'Circe' },
        { title: 'Pachinko', author: 'Min Jin Lee', genre: 'Historical Fiction', description: 'Four generations of a Korean family fight to survive.', reason: 'Deeply human characters with extraordinary resilience', rating: 4.7, similarCharacter: 'Sunja' },
        { title: 'A Little Life', author: 'Hanya Yanagihara', genre: 'Literary Fiction', description: 'Four friends shaped by trauma over decades.', reason: 'Characters written with unmatched psychological depth', rating: 4.6, similarCharacter: 'Jude St. Francis' }
      ],
      source: 'fallback'
    });
  }
});

// ─── BOOK DETAILS ─────────────────────────────────────────────────────────────
router.post('/book-details', async (req, res) => {
  const { bookName, author } = req.body;
  if (!bookName) return res.status(400).json({ success: false, message: 'Book name required' });

  const systemPrompt = `You are a book expert. Return ONLY valid JSON.
{
  "summary": "2-3 engaging paragraphs about the book — plot, themes, why it matters. No spoilers.",
  "themes": ["theme1", "theme2", "theme3"],
  "quotes": [{"quote": "actual memorable quote", "context": "brief context"}],
  "similarBooks": [{"title":"","author":"","genre":"","description":"2 sentences","reason":"Why similar","rating":4.5}]
}`;

  const userPrompt = author
    ? `Details for "${bookName}" by ${author}: summary, 3 themes, 2 famous quotes, 4 similar books. ONLY JSON.`
    : `Details for "${bookName}": summary, 3 themes, 2 famous quotes, 4 similar books. ONLY JSON.`;

  try {
    const text = await callLLM(systemPrompt, [{ role: 'user', content: userPrompt }], { temperature: 0.7, maxTokens: 2500 });
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found');
    const result = JSON.parse(match[0]);
    res.json({ success: true, bookName, author: author || null, ...result, source: 'ai' });
  } catch (err) {
    console.error('Book details error:', err.message);
    res.json({
      success: true, bookName, author: author || null,
      summary: `"${bookName}"${author ? ` by ${author}` : ''} is a celebrated book loved by readers worldwide. It explores universal themes through compelling storytelling and memorable characters.`,
      themes: ['Human Connection', 'Resilience', 'Identity'],
      quotes: [{ quote: 'A meaningful line from this book', context: 'A pivotal moment in the story' }],
      similarBooks: [{ title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', description: 'A shepherd follows his dreams across continents.', reason: 'Similar themes of purpose and self-discovery', rating: 4.7 }],
      source: 'fallback'
    });
  }
});

// ─── TRENDING (health check / wake endpoint) ──────────────────────────────────
router.get('/trending', async (req, res) => {
  res.json({
    success: true,
    books: [
      { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8, readers: 25000 },
      { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.8, readers: 22000 },
      { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', rating: 4.6, readers: 19000 },
      { title: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', rating: 4.6, readers: 28000 },
      { title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', rating: 4.7, readers: 27000 }
    ],
    page: 1, hasMore: false
  });
});

module.exports = router;