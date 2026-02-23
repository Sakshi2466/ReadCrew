const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

let groq = null;
try {
  if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('✅ Nearby: Groq initialized');
  }
} catch (err) {
  console.error('❌ Nearby Groq init failed:', err.message);
}

// ─── Fallback events generator ────────────────────────────────────────────────
function getFallbackEvents(city) {
  const cityEnc = encodeURIComponent(city || 'your city');
  const now = new Date();

  const addDays = (d) => {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return [
    {
      title: 'Book Club Meetup',
      type: 'Book Club',
      description: `Monthly book club gathering in ${city}. Discuss the latest reads with fellow book lovers over coffee.`,
      date: addDays(7),
      venue: `${city} Community Library`,
      link: `https://www.meetup.com/find/?keywords=book+club&location=${cityEnc}`,
      source: 'Meetup',
      free: true,
      emoji: '📚'
    },
    {
      title: 'Author Talk & Book Signing',
      type: 'Author Event',
      description: `Local and national authors visit ${city} bookstores for readings, Q&A sessions, and signings.`,
      date: addDays(14),
      venue: 'Local Bookstore',
      link: `https://www.eventbrite.com/d/${cityEnc}/book-author/`,
      source: 'Eventbrite',
      free: false,
      emoji: '✍️'
    },
    {
      title: 'Literary Festival',
      type: 'Festival',
      description: `Annual celebration of literature in ${city} featuring panels, workshops, poetry, and author meet-greets.`,
      date: addDays(30),
      venue: `${city} Cultural Center`,
      link: `https://www.eventbrite.com/d/${cityEnc}/literary-festival/`,
      source: 'Eventbrite',
      free: false,
      emoji: '🎪'
    },
    {
      title: 'Poetry & Spoken Word Night',
      type: 'Open Mic',
      description: 'Open mic for poetry lovers and spoken word artists. All skill levels welcome — just bring your words!',
      date: addDays(10),
      venue: 'Local Café',
      link: `https://www.meetup.com/find/?keywords=poetry+night&location=${cityEnc}`,
      source: 'Meetup',
      free: true,
      emoji: '🎤'
    },
    {
      title: "Children's Storytelling Hour",
      type: 'Kids Event',
      description: 'Free weekly storytelling sessions at public libraries — perfect for families with young readers aged 3–10.',
      date: 'Every Saturday Morning',
      venue: `${city} Public Library`,
      link: `https://www.eventbrite.com/d/${cityEnc}/storytelling/`,
      source: 'Library',
      free: true,
      emoji: '🧒'
    },
    {
      title: 'Creative Writing Workshop',
      type: 'Workshop',
      description: 'Sharpen your craft with experienced writers. Covers fiction, non-fiction, and creative non-fiction techniques.',
      date: addDays(21),
      venue: `${city} Arts Centre`,
      link: `https://www.eventbrite.com/d/${cityEnc}/writing-workshop/`,
      source: 'Eventbrite',
      free: false,
      emoji: '🖊️'
    },
  ];
}

// ─── POST /api/nearby/events ──────────────────────────────────────────────────
// Uses Groq to generate realistic, city-specific book events
router.post('/events', async (req, res) => {
  const { city, lat, lng } = req.body;
  if (!city) return res.status(400).json({ success: false, message: 'city is required' });

  if (!groq) {
    return res.json({ success: true, events: getFallbackEvents(city), source: 'fallback' });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.75,
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: `You are a local events curator specializing in book and literary events. Return ONLY a valid JSON array, no markdown, no backticks, no extra text.

JSON format:
[
  {
    "title": "Event Name",
    "type": "Book Club|Author Event|Festival|Workshop|Open Mic|Kids Event|Other",
    "description": "2-3 sentences describing the event. Make it feel real and specific to the city.",
    "date": "Human readable date like 'Sat, Mar 15' or 'Every Friday Evening'",
    "venue": "Venue Name or Type",
    "link": "https://www.eventbrite.com/d/${encodeURIComponent(city)}/books/ or https://www.meetup.com/find/?keywords=book+club&location=${encodeURIComponent(city)}",
    "source": "Eventbrite|Meetup|Library|Bookstore",
    "free": true,
    "emoji": "📚"
  }
]

Use these real links:
- Eventbrite city page: https://www.eventbrite.com/d/${encodeURIComponent(city)}/books/
- Meetup: https://www.meetup.com/find/?keywords=book+club&location=${encodeURIComponent(city)}
- For kids: https://www.eventbrite.com/d/${encodeURIComponent(city)}/storytelling/`
        },
        {
          role: 'user',
          content: `Generate 6 diverse, realistic book-related events that would typically happen in ${city}, India. Include a mix of free and paid events, different types (book club, author talk, festival, workshop, kids events, poetry). Make them feel genuinely local and relevant to ${city}. Return ONLY the JSON array.`
        }
      ]
    });

    const text = completion.choices[0].message.content
      .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array found');

    const events = JSON.parse(match[0]);
    if (!Array.isArray(events) || events.length === 0) throw new Error('Empty events');

    res.json({ success: true, events, city, source: 'groq-ai' });

  } catch (err) {
    console.error('Events AI error:', err.message);
    res.json({ success: true, events: getFallbackEvents(city), source: 'fallback' });
  }
});

// ─── GET /api/nearby/ping ─────────────────────────────────────────────────────
router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'Nearby API is alive', groqReady: !!groq });
});

module.exports = router;