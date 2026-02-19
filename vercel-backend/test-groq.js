require('dotenv').config();
const Groq = require('groq-sdk');

async function testGroqAPI() {
  console.log('='.repeat(60));
  console.log('🧪 Testing Groq API Configuration');
  console.log('='.repeat(60));
  
  // 1. Check if API key exists
  console.log('\n1️⃣ Checking API Key...');
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY not found in environment variables');
    console.log('\nℹ️  To fix this:');
    console.log('   1. Create a .env file in your backend folder');
    console.log('   2. Add this line: GROQ_API_KEY=your_actual_api_key');
    console.log('   3. Restart your server');
    return;
  }
  
  const keyPreview = process.env.GROQ_API_KEY.substring(0, 10) + '...';
  console.log(`✅ API Key found: ${keyPreview}`);
  
  // 2. Initialize Groq client
  console.log('\n2️⃣ Initializing Groq Client...');
  let groq;
  try {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('✅ Groq client initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Groq:', error.message);
    return;
  }
  
  // 3. Test simple API call
  console.log('\n3️⃣ Testing Simple API Call...');
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: "Say 'Hello from Groq!' in exactly 3 words"
        }
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 50,
      temperature: 0.5
    });
    
    const response = completion.choices[0].message.content;
    console.log('✅ API call successful!');
    console.log(`📝 Response: "${response}"`);
  } catch (error) {
    console.error('❌ API call failed:', error.message);
    if (error.message.includes('401')) {
      console.log('\n⚠️  This looks like an authentication error.');
      console.log('   Your API key might be invalid or expired.');
      console.log('   Get a new key from: https://console.groq.com/keys');
    }
    return;
  }
  
  // 4. Test book recommendations (JSON response)
  console.log('\n4️⃣ Testing Book Recommendations...');
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Return ONLY a JSON array of 3 books. No markdown, no explanation.
Format: [{"title":"Book","author":"Author","genre":"Genre","rating":4.5}]`
        },
        {
          role: "user",
          content: "Recommend 3 sci-fi books. Return ONLY the JSON array."
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 500
    });
    
    let responseText = completion.choices[0].message.content;
    console.log('📥 Raw response:', responseText.substring(0, 100) + '...');
    
    // Clean and parse
    responseText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/`/g, '')
      .trim();
    
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found');
    }
    
    const books = JSON.parse(jsonMatch[0]);
    console.log('✅ Successfully parsed book recommendations!');
    console.log(`📚 Got ${books.length} books:`);
    books.forEach((book, i) => {
      console.log(`   ${i + 1}. "${book.title}" by ${book.author}`);
    });
  } catch (error) {
    console.error('❌ Book recommendations test failed:', error.message);
    return;
  }
  
  // 5. Success summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 ALL TESTS PASSED!');
  console.log('='.repeat(60));
  console.log('\n✅ Your Groq API is working correctly');
  console.log('✅ Book recommendations will use Groq AI');
  console.log('✅ Trending books will be fetched from Groq');
  console.log('\nℹ️  Make sure to restart your server for changes to take effect.');
  console.log('');
}

// Run the test
testGroqAPI().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});