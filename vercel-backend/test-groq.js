require('dotenv').config();
const Groq = require('groq-sdk');

async function test() {
  console.log('Testing Groq API...');
  console.log('API Key:', process.env.GROQ_API_KEY ? 'Found' : 'Missing');
  
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ No API key found');
    return;
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Say hello in 5 words" }],
      model: "llama-3.3-70b-versatile",
      max_tokens: 50,
    });
    
    console.log('✅ Success:', completion.choices[0].message.content);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();