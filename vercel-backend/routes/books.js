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
else console.warn('⚠️  GEMINI_API_KEY missing');

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
      lastBook: null,
      recommendedBooks: [],
      created: Date.now()
    });
  }
  return sessions.get(id);
}

// Clean old sessions every hour
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, s] of sessions) {
    if (s.created < cutoff) sessions.delete(id);
  }
}, 60 * 60 * 1000);

// ─── ENHANCED CONVERSATIONAL SYSTEM PROMPT ─────────────────────────────────────
const BOOK_COMPANION_PROMPT = `You are "Page Turner" — an enthusiastic, knowledgeable book companion who LOVES talking about books like a best friend would.

YOUR PERSONALITY:
- Warm, conversational, and genuinely excited about books
- Use emojis naturally (but not excessively) 📚✨
- Ask follow-up questions to understand what readers truly want
- Share your "opinions" on books like a real person would
- Remember the conversation context

YOUR CAPABILITIES:
1. **Book Recommendations** - Suggest books based on mood, genre, themes
2. **Plot Summaries** - Tell the story of any book without spoilers (or with if they ask!)
3. **Famous Quotes** - Share memorable lines from books
4. **Character Discussions** - Deep dive into character analysis
5. **Similar Books** - Find books with similar vibes/themes/characters
6. **Book Trivia** - Fun facts, behind-the-scenes, author info
7. **Reading Advice** - Help choose what to read next

CONVERSATION STYLE:
- Exchange 1-2: Chat naturally, understand what they want. Ask ONE clarifying question if needed.
- Exchange 3+: You can recommend books OR continue the conversation based on context
- When discussing a specific book: Share plot, themes, quotes, character insights
- When asked "tell me about [book]": Give a 2-3 paragraph summary with your take on it
- When asked for quotes: Share 2-3 memorable lines with context
- When asked about characters: Analyze them deeply, discuss their arc
- When asked for similar books: Explain WHY each book is similar

RECOMMENDATION FORMAT (only when giving recommendations):
When you recommend books, use this EXACT format:

<!--REC_START-->
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "genre": "Genre",
    "description": "2-3 sentences about the book",
    "reason": "Why this matches what they asked for",
    "rating": 4.6
  }
]
<!--REC_END-->

Add a personal note before and after the recommendations!

IMPORTANT RULES:
- Don't force recommendations - chat about books naturally
- If they ask about a specific book, discuss it deeply before suggesting similar ones
- Use quotes when relevant to the conversation
- Remember books you've mentioned to avoid repetition
- If asked "more" or "another", give DIFFERENT books
- Keep responses conversational, not robotic
- Show genuine enthusiasm for great books

EXAMPLE CONVERSATIONS:

User: "Tell me about The Alchemist"
You: "Oh, The Alchemist! 📚 It's this beautiful, almost fable-like story about Santiago, a young shepherd from Spain who has this recurring dream about treasure near the Egyptian pyramids. So he sells his flock and goes on this incredible journey across the desert.

But here's the thing — it's not really about the treasure. It's about following your 'Personal Legend' (basically your life's purpose) and how the universe conspires to help you when you truly want something. Paulo Coelho writes it in this simple, poetic way that makes it feel like an old wise story being passed down.

One of my favorite quotes: 'When you want something, all the universe conspires in helping you to achieve it.' 

The book is pretty short (about 200 pages) but people either absolutely love it for its wisdom or find it too simplistic. I think it depends what stage of life you're in when you read it. Have you read it, or are you thinking about picking it up?"

User: "I want something sad but beautiful"
You: "Ooh, I love that mood 🥺 There's something cathartic about books that make you cry, right? 

Are you thinking:
- Contemporary/realistic fiction that hits close to home?
- Or more like poetic, bittersweet stories?
- Also, do you want 'sad but hopeful' or 'beautifully devastating'?

Just want to make sure I nail the vibe for you!"

User: "Who's your favorite character from Harry Potter?"
You: "Okay, this is tough! 🤔 But I think I'd have to go with Luna Lovegood. 

She's just so authentically herself in a world where everyone's trying to fit in. She's weird, she's spacey, she believes in things others mock — but she never pretends to be someone else. And beneath that dreamy exterior, she's incredibly brave and loyal.

Plus that quote: 'You're just as sane as I am' — it's both funny and profound. She sees Harry when he's invisible to everyone else.

Who's yours? Or are you team Hermione? 😄"

Remember: You're having a CONVERSATION about books, not just a recommendation machine. Be real, be enthusiastic, and genuinely engage with what they're saying!`;

// ─── MAIN CHAT ENDPOINT WITH SSE ──────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { message, sessionId = 'default' } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message required' });

  const session = getSession(sessionId);
  const userMsg = message.trim();
  
  // Build conversation history
  const historyForLLM = [...session.messages.slice(-12), { role: 'user', content: userMsg }];
  session.messages.push({ role: 'user', content: userMsg });
  session.exchangeCount++;

  // ── SSE setup to prevent Render 30s timeout ──
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const keepalive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 8000);

  const sendFinal = (payload) => {
    clearInterval(keepalive);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    res.end();
  };

  // Add context about previously recommended books to system prompt
  let contextPrompt = BOOK_COMPANION_PROMPT;
  if (session.recommendedBooks.length > 0) {
    contextPrompt += `\n\nBOOKS YOU'VE ALREADY RECOMMENDED IN THIS CONVERSATION:\n${session.recommendedBooks.map(b => `- ${b.title} by ${b.author}`).join('\n')}\n\nDon't recommend these again unless specifically asked about them.`;
  }

  try {
    const rawReply = await callLLM(
      contextPrompt,
      historyForLLM,
      { temperature: 0.85, maxTokens: 2000 }
    );

    let reply = rawReply;
    let recommendations = [];
    let hasRecommendations = false;

    // Extract recommendations if present
    const recMatch = reply.match(/<!--REC_START-->([\s\S]*?)<!--REC_END-->/);
    if (recMatch) {
      try {
        const cleaned = recMatch[1].trim()
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          recommendations = parsed;
          hasRecommendations = true;
          
          // Track recommended books
          recommendations.forEach(book => {
            if (!session.recommendedBooks.find(b => b.title === book.title)) {
              session.recommendedBooks.push({ title: book.title, author: book.author });
            }
          });
        }
      } catch (e) {
        console.error('Rec JSON parse error:', e.message);
      }
      // Remove the hidden markers from the reply
      reply = reply.replace(/<!--REC_START-->[\s\S]*?<!--REC_END-->/, '').trim();
    }

    session.messages.push({ role: 'assistant', content: reply });
    
    sendFinal({
      success: true,
      reply,
      hasRecommendations,
      recommendations,
      sessionId,
      exchangeCount: session.exchangeCount
    });

  } catch (err) {
    console.error('LLM chat error:', err.message);
    
    // Friendly fallback
    const fallbackReply = "I'm having a bit of trouble connecting right now 😅 But I'm here! What kind of books are you in the mood for? Or is there a specific book you'd like to talk about?";
    
    session.messages.push({ role: 'assistant', content: fallbackReply });
    
    sendFinal({
      success: true,
      reply: fallbackReply,
      hasRecommendations: false,
      recommendations: [],
      sessionId,
      exchangeCount: session.exchangeCount
    });
  }
});

// ─── CHARACTER-BASED BOOK SEARCH ──────────────────────────────────────────────
router.post('/character-search', async (req, res) => {
  const { character, fromBook } = req.body;
  if (!character) {
    return res.status(400).json({ success: false, message: 'Character name required' });
  }

  const systemPrompt = `You are a character analysis expert. Return ONLY valid JSON, no markdown.

Format:
{
  "characterAnalysis": "3-4 sentences analyzing why readers love this character and what makes them compelling",
  "recommendations": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "genre": "Genre",
      "description": "2 sentences about the book",
      "reason": "Why this book has a similar character or will appeal to fans of the original character",
      "rating": 4.5,
      "similarCharacter": "Name of the similar character in this book"
    }
  ]
}`;

  const userPrompt = fromBook
    ? `Analyze why readers love the character "${character}" from "${fromBook}". Then recommend 5 books with similarly compelling characters. Focus on character traits, arcs, and appeal. Return ONLY the JSON object.`
    : `Analyze why readers love the character "${character}". Then recommend 5 books with similarly compelling characters. Focus on character traits, arcs, and appeal. Return ONLY the JSON object.`;

  try {
    const text = await callLLM(
      systemPrompt,
      [{ role: 'user', content: userPrompt }],
      { temperature: 0.7, maxTokens: 2000 }
    );

    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found');

    const result = JSON.parse(match[0]);
    
    res.json({
      success: true,
      character,
      fromBook: fromBook || null,
      ...result,
      source: 'ai'
    });

  } catch (err) {
    console.error('Character search error:', err.message);
    
    // Fallback response
    res.json({
      success: true,
      character,
      fromBook: fromBook || null,
      characterAnalysis: `Readers who love "${character}" are drawn to complex, layered characters with emotional depth and compelling personal journeys. They appreciate characters who grow, struggle, and ultimately transform in meaningful ways.`,
      recommendations: [
        {
          title: 'The Name of the Wind',
          author: 'Patrick Rothfuss',
          genre: 'Fantasy',
          description: 'A legendary figure tells his own story of magic, love, and tragedy.',
          reason: 'Features Kvothe, a brilliantly complex protagonist with extraordinary talents and deep flaws',
          rating: 4.7,
          similarCharacter: 'Kvothe'
        },
        {
          title: 'The Secret History',
          author: 'Donna Tartt',
          genre: 'Mystery',
          description: 'A group of classics students become entangled in a murder.',
          reason: 'Morally complex characters you cannot stop thinking about',
          rating: 4.6,
          similarCharacter: 'Richard Papen'
        },
        {
          title: 'A Little Life',
          author: 'Hanya Yanagihara',
          genre: 'Literary Fiction',
          description: 'An intimate portrait of four friends over decades.',
          reason: 'Profoundly deep character study with extraordinary emotional complexity',
          rating: 4.4,
          similarCharacter: 'Jude St. Francis'
        },
        {
          title: 'The Song of Achilles',
          author: 'Madeline Miller',
          genre: 'Historical Fiction',
          description: 'A retelling of the Trojan War through Patroclus\'s eyes.',
          reason: 'Beautifully drawn characters with achingly human emotions',
          rating: 4.8,
          similarCharacter: 'Patroclus'
        },
        {
          title: 'Circe',
          author: 'Madeline Miller',
          genre: 'Fantasy',
          description: 'The witch-goddess Circe tells her own story of exile and magic.',
          reason: 'A powerful character finding her own voice and strength',
          rating: 4.7,
          similarCharacter: 'Circe'
        }
      ],
      source: 'fallback'
    });
  }
});

// ─── GET BOOK STORY/SUMMARY ────────────────────────────────────────────────────
router.post('/book-story', async (req, res) => {
  const { bookName, author, includeSpoilers = false } = req.body;
  if (!bookName) {
    return res.status(400).json({ success: false, message: 'Book name required' });
  }

  const systemPrompt = `You are a passionate book reviewer who tells engaging stories. Write in a warm, conversational tone like you're telling a friend about a book you love.

Return ONLY valid JSON:
{
  "summary": "3-4 engaging paragraphs about the plot, themes, and why it matters${includeSpoilers ? ' (include major plot points and ending)' : ' (NO spoilers for ending)'}",
  "themes": ["theme1", "theme2", "theme3"],
  "writing_style": "Description of the author's style",
  "who_should_read": "Who would love this book and why",
  "memorable_moment": "A scene or moment that stays with readers"
}`;

  const userPrompt = author
    ? `Tell me the story of "${bookName}" by ${author}. ${includeSpoilers ? 'Include all major plot points and the ending.' : 'Avoid spoiling the ending.'} Make it engaging and personal. Return ONLY JSON.`
    : `Tell me the story of "${bookName}". ${includeSpoilers ? 'Include all major plot points and the ending.' : 'Avoid spoiling the ending.'} Make it engaging and personal. Return ONLY JSON.`;

  try {
    const text = await callLLM(
      systemPrompt,
      [{ role: 'user', content: userPrompt }],
      { temperature: 0.75, maxTokens: 1500 }
    );

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found');

    const result = JSON.parse(match[0]);
    
    res.json({
      success: true,
      bookName,
      author: author || null,
      ...result,
      source: 'ai'
    });

  } catch (err) {
    console.error('Book story error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate book story',
      error: err.message
    });
  }
});

// ─── GET FAMOUS QUOTES FROM BOOKS ──────────────────────────────────────────────
router.post('/book-quotes', async (req, res) => {
  const { bookName, author, count = 5 } = req.body;
  if (!bookName) {
    return res.status(400).json({ success: false, message: 'Book name required' });
  }

  const systemPrompt = `You are a literary quotes expert. Return ONLY valid JSON array of actual famous quotes from the book, no markdown.

Format:
[
  {
    "quote": "The actual quote from the book",
    "context": "Brief context about when/why this line appears",
    "significance": "Why this quote is memorable or important"
  }
]`;

  const userPrompt = author
    ? `Give me ${count} of the most famous, memorable quotes from "${bookName}" by ${author}. Include actual quotes from the book. Return ONLY JSON array.`
    : `Give me ${count} of the most famous, memorable quotes from "${bookName}". Include actual quotes from the book. Return ONLY JSON array.`;

  try {
    const text = await callLLM(
      systemPrompt,
      [{ role: 'user', content: userPrompt }],
      { temperature: 0.6, maxTokens: 1500 }
    );

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array found');

    const quotes = JSON.parse(match[0]);
    
    res.json({
      success: true,
      bookName,
      author: author || null,
      quotes,
      source: 'ai'
    });

  } catch (err) {
    console.error('Book quotes error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve quotes',
      error: err.message
    });
  }
});

// ─── TRENDING BOOKS (keeping your existing endpoint) ──────────────────────────
let trendingCache = { data: null, lastUpdated: null, TTL: 24 * 60 * 60 * 1000 };

function mockTrending(page = 1) {
  const all = [
    { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', description: 'Tiny changes, remarkable results.', trendReason: '#1 on bestseller lists globally', rating: 4.8, readers: 25000 },
    { title: 'The Psychology of Money', author: 'Morgan Housel', genre: 'Finance', description: 'Timeless lessons on wealth and happiness.', trendReason: 'Still topping business charts', rating: 4.7, readers: 18000 },
    { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', description: 'A lone astronaut must save Earth.', trendReason: 'Beloved by readers worldwide', rating: 4.8, readers: 22000 },
    { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', description: 'Between life and death lies possibility.', trendReason: "Reese's Book Club pick", rating: 4.6, readers: 19000 },
    { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', description: 'A brief history of humankind.', trendReason: '25+ million copies sold', rating: 4.7, readers: 30000 },
    { title: 'Fourth Wing', author: 'Rebecca Yarros', genre: 'Fantasy', description: 'Dragons and war college.', trendReason: 'Fastest-selling fantasy debut', rating: 4.6, readers: 28000 },
    { title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Inspirational', description: "A shepherd's journey.", trendReason: '65M+ copies sold', rating: 4.7, readers: 27000 },
    { title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi', description: 'Epic interstellar saga.', trendReason: 'Part 3 film announced', rating: 4.8, readers: 31000 },
    { title: 'It Ends with Us', author: 'Colleen Hoover', genre: 'Romance', description: 'A story of resilience.', trendReason: 'Now a major film', rating: 4.6, readers: 33000 },
    { title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', genre: 'Fiction', description: 'Love and creativity.', trendReason: 'Pulitzer finalist', rating: 4.5, readers: 15000 },
  ];
  const start = ((page - 1) % 2) * 5;
  return all.slice(start, start + 5);
}

router.get('/trending', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  try {
    res.json({
      success: true,
      books: mockTrending(page),
      page,
      hasMore: page < 6,
      source: 'fallback'
    });
  } catch (err) {
    res.json({
      success: true,
      books: mockTrending(page),
      page,
      hasMore: false,
      source: 'fallback'
    });
  }
});

module.exports = router;