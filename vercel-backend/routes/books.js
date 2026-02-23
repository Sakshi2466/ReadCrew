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
    sessions.set(id, {
      messages: [],
      exchangeCount: 0,
      recommendedBooks: [],
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

// ─── CONVERSATIONAL AI PROMPT ──────────────────────────────────────────────────
const BOOK_COMPANION_PROMPT = `You are "Page Turner" — a warm, enthusiastic AI book companion who loves talking about books.

YOUR PERSONALITY:
- Conversational and friendly like a best friend
- Use emojis naturally but not excessively 📚✨
- Ask follow-up questions to understand readers
- Share opinions on books authentically
- Remember conversation context

YOUR CAPABILITIES:
1. **Recommendations** - Suggest books based on mood, genre, themes
2. **Book Discussions** - Talk about plots, themes, characters
3. **Quotes** - Share memorable lines from books
4. **Character Analysis** - Discuss why characters are compelling
5. **Similar Books** - Find books with similar vibes

CONVERSATION STYLE:
- Exchange 1-2: Chat naturally, ask ONE clarifying question if needed
- Exchange 3+: Can recommend books OR continue discussing
- When discussing a book: Share plot, themes, your take on it
- When asked for quotes: Share 2-3 lines with context
- When asked about characters: Analyze deeply

RECOMMENDATION FORMAT (when giving recommendations):
Use this EXACT format:

<!--REC_START-->
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "genre": "Genre",
    "description": "2-3 sentences",
    "reason": "Why this matches their request",
    "rating": 4.6
  }
]
<!--REC_END-->

RULES:
- Don't force recommendations - chat naturally
- If discussing a specific book, go deep before suggesting similar ones
- Remember books mentioned to avoid repetition
- If asked "more", give DIFFERENT books
- Keep responses warm and conversational

EXAMPLES:

User: "Tell me about The Alchemist"
You: "The Alchemist! 📚 It's this beautiful story about Santiago, a shepherd who has a recurring dream about treasure near the pyramids. So he sells everything and goes on this incredible journey.

But here's the magic — it's not really about finding treasure. It's about following your 'Personal Legend' (your life's purpose) and trusting that the universe helps those who truly want something.

Paulo Coelho writes it simply but poetically. One of my favorites: 'When you want something, all the universe conspires in helping you to achieve it.'

It's short (about 200 pages) but profound. People either love it for its wisdom or find it too simple. Have you read it?"

User: "I want something sad but beautiful"
You: "I love that mood 🥺 Sad books can be so cathartic!

Quick question: Are you thinking contemporary realistic fiction that hits close to home? Or more poetic, bittersweet stories?

Also — do you want 'sad but hopeful ending' or 'beautifully devastating'?"

Be genuine, warm, and conversational!`;

// ─── MAIN CHAT ENDPOINT (REGULAR JSON, NO SSE) ────────────────────────────────
router.post('/chat', async (req, res) => {
  const { message, sessionId = 'default' } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: 'Message required' });
  }

  const session = getSession(sessionId);
  const userMsg = message.trim();
  
  const historyForLLM = [...session.messages.slice(-12), { role: 'user', content: userMsg }];
  session.messages.push({ role: 'user', content: userMsg });
  session.exchangeCount++;

  let contextPrompt = BOOK_COMPANION_PROMPT;
  if (session.recommendedBooks.length > 0) {
    contextPrompt += `\n\nBOOKS ALREADY RECOMMENDED:\n${session.recommendedBooks.map(b => `- ${b.title} by ${b.author}`).join('\n')}\n\nDon't recommend these again.`;
  }

  try {
    const rawReply = await callLLM(contextPrompt, historyForLLM, { temperature: 0.85, maxTokens: 2000 });

    let reply = rawReply;
    let recommendations = [];
    let hasRecommendations = false;

    // Extract recommendations
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
    
    const fallbackReply = "I'm having a bit of trouble connecting 😅 But I'm here! What kind of books are you in the mood for?";
    session.messages.push({ role: 'assistant', content: fallbackReply });
    
    return res.json({
      success: true,
      reply: fallbackReply,
      hasRecommendations: false,
      recommendations: [],
      sessionId,
      exchangeCount: session.exchangeCount
    });
  }
});

// ─── CHARACTER SEARCH ──────────────────────────────────────────────────────────
router.post('/character-search', async (req, res) => {
  const { character, fromBook } = req.body;
  if (!character) {
    return res.status(400).json({ success: false, message: 'Character name required' });
  }

  const systemPrompt = `You are a character analysis expert. Return ONLY valid JSON.

{
  "characterAnalysis": "3-4 sentences analyzing why readers love this character",
  "recommendations": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "genre": "Genre",
      "description": "2 sentences",
      "reason": "Why this has a similar character",
      "rating": 4.5,
      "similarCharacter": "Character name in this book"
    }
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
      success: true,
      character,
      fromBook: fromBook || null,
      characterAnalysis: `Readers who love "${character}" enjoy complex, layered characters with emotional depth and compelling journeys.`,
      recommendations: [
        { title: 'The Name of the Wind', author: 'Patrick Rothfuss', genre: 'Fantasy', description: 'Kvothe tells his story of magic and tragedy.', reason: 'Features a brilliantly complex protagonist', rating: 4.7, similarCharacter: 'Kvothe' },
        { title: 'The Secret History', author: 'Donna Tartt', genre: 'Mystery', description: 'Classics students entangled in murder.', reason: 'Morally complex characters', rating: 4.6, similarCharacter: 'Richard Papen' },
        { title: 'Circe', author: 'Madeline Miller', genre: 'Fantasy', description: 'The witch-goddess finds her voice.', reason: 'Powerful character finding strength', rating: 4.7, similarCharacter: 'Circe' }
      ],
      source: 'fallback'
    });
  }
});

// ─── BOOK DETAILS (for Crews page) ────────────────────────────────────────────
router.post('/book-details', async (req, res) => {
  const { bookName, author } = req.body;
  if (!bookName) {
    return res.status(400).json({ success: false, message: 'Book name required' });
  }

  const systemPrompt = `You are a book expert. Return ONLY valid JSON.

{
  "summary": "2-3 engaging paragraphs about the book - plot, themes, why it matters. NO spoilers.",
  "themes": ["theme1", "theme2", "theme3"],
  "quotes": [
    {"quote": "actual quote", "context": "when it appears"}
  ],
  "similarBooks": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "genre": "Genre",
      "description": "2 sentences",
      "reason": "Why it's similar",
      "rating": 4.5
    }
  ]
}`;

  const userPrompt = author
    ? `Give complete details about "${bookName}" by ${author}. Include summary, themes, 3 famous quotes, and 5 similar books. Return ONLY JSON.`
    : `Give complete details about "${bookName}". Include summary, themes, 3 famous quotes, and 5 similar books. Return ONLY JSON.`;

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
      success: true,
      bookName,
      author: author || null,
      summary: `"${bookName}"${author ? ` by ${author}` : ''} is a compelling read that has captivated readers worldwide. The book explores universal themes of human experience through rich storytelling and memorable characters.\n\nReaders are drawn to this book for its emotional depth and thought-provoking narrative. It offers insights into the human condition while entertaining with its engaging plot.`,
      themes: ['Human Nature', 'Resilience', 'Transformation'],
      quotes: [
        { quote: 'A meaningful quote from the book', context: 'This appears during a pivotal moment' }
      ],
      similarBooks: [
        { title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', description: 'A journey of self-discovery.', reason: 'Similar themes of personal growth', rating: 4.7 }
      ],
      source: 'fallback'
    });
  }
});

// ─── TRENDING BOOKS ────────────────────────────────────────────────────────────
router.get('/trending', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const mockBooks = [
    { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8, readers: 25000 },
    { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', rating: 4.8, readers: 22000 },
    { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', rating: 4.6, readers: 19000 },
    { title: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', rating: 4.6, readers: 28000 },
    { title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', rating: 4.7, readers: 27000 }
  ];
  res.json({ success: true, books: mockBooks, page, hasMore: false });
});

module.exports = router;