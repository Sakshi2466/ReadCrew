const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  console.log('🎯 Recommend endpoint hit');
  console.log('📦 Request body:', req.body);
  
  try {
    const { keywords, requestType } = req.body;

    // Validate keywords
    if (!keywords || typeof keywords !== 'string' || keywords.trim() === '') {
      console.log('❌ Invalid keywords');
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide valid keywords' 
      });
    }

    console.log('🔍 Keywords received:', keywords);
    console.log('📌 Request type:', requestType || 'regular');

    // Load Groq SDK
    let Groq;
    try {
      Groq = require('groq-sdk');
      console.log('✅ groq-sdk loaded');
    } catch(e) {
      console.error('❌ groq-sdk not found:', e.message);
      return res.status(500).json({ 
        success: false, 
        message: 'groq-sdk not installed. Run: npm install groq-sdk' 
      });
    }

    // Check API key
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY not found');
      return res.status(500).json({ 
        success: false, 
        message: 'GROQ_API_KEY not configured' 
      });
    }

    console.log('✅ API key found');

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Set SSE (Server-Sent Events) headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Different prompts based on request type
    let systemPrompt, userPrompt;

    if (requestType === 'trending') {
      console.log('🔥 Fetching TRENDING books');
      systemPrompt = `You are a book trend expert and literary analyst. 

Provide EXACTLY 5 current trending/bestselling books from 2024-2026. Focus on books that are:
- Currently popular and widely discussed
- Recent releases or enduring bestsellers
- Diverse across genres (mix of fiction, non-fiction, different categories)

For each book, format EXACTLY as:
**Book Title by Author Name**
One concise sentence (15-25 words) explaining why it's trending and what makes it special.

Be direct and factual. No introductory text, just the 5 books.`;

      userPrompt = "What are the top 5 trending/bestselling books right now? Give me current popular titles.";
    } else {
      console.log('📚 Regular recommendation request');
      systemPrompt = `You are an enthusiastic and knowledgeable book recommendation expert. 

When someone tells you their reading interests, respond in a warm, conversational way.

Provide exactly 5 personalized book recommendations. For each book:
1. Format the title as: **Book Title by Author Name**
2. Write 2-3 engaging sentences explaining why this book perfectly matches their interests
3. Be specific about what makes each book special

End with a brief, encouraging note about their reading journey.

Keep your tone friendly, enthusiastic, and natural - like talking to a friend about books you love.`;

      userPrompt = `I'm interested in reading about: ${keywords}. Can you recommend some great books for me?`;
    }

    console.log('🚀 Starting Groq stream for:', keywords);

    // Create streaming chat completion
    const stream = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: requestType === 'trending' ? 0.5 : 0.7,
      max_tokens: requestType === 'trending' ? 800 : 1024,
      top_p: 1,
      stream: true
    });

    let tokenCount = 0;

    // Stream the response
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        tokenCount++;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }

    console.log(`✅ Stream complete. Sent ${tokenCount} tokens`);
    
    // Send done signal
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (error) {
    console.error('❌ Recommend route error:', error);
    console.error('Error details:', error.message);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: error.message,
        error: error.toString()
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;