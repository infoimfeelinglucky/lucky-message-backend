import 'dotenv/config'; // Loads .env automatically
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public')); // Serves your thank-you.html from /public

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const messagesById = {};        // orderId => { message, createdAt }
const usedMessages = new Set(); // Tracks unique messages already sent

// Categorized prompts: Jokes, Fortunes, Motivation
const promptOptions = [
  // 🤡 Jokes
  "Tell me a very short, clever, and original joke.",
  "Make up a one-line joke that would confuse a robot.",
  "Write a surreal joke that doesn’t follow normal logic, but is still funny.",
  "Give me a one-sentence pun that would make someone groan and laugh.",
  "Invent a completely new joke that feels like a tweet from a time traveler.",

  // 🔮 Fortunes
  "Give me a one-sentence fortune that sounds mysterious and ancient.",
  "Write a strange and poetic prophecy in a single sentence.",
  "Invent a one-liner you might find inside a magical fortune cookie.",
  "Say something that feels like a cryptic message from the stars.",
  "Create a sentence that sounds like it came from a forgotten oracle.",

  // 💬 Motivation
  "Give me a one-sentence motivational quote that feels personal and oddly specific.",
  "Say something encouraging like a wizard trying to cheer someone up.",
  "Write a weirdly inspiring line you’d find carved into a tree in the forest.",
  "Tell me a line of motivation that sounds made up, but works.",
  "Invent a short piece of advice that feels cosmic but still helpful."
];

// Generate a unique AI message that hasn't been used before
async function generateUniqueMessage(retryCount = 0) {
  if (retryCount > 5) {
    return "🔁 All lucky messages have been used. Please check back later.";
  }

  const prompt = promptOptions[Math.floor(Math.random() * promptOptions.length)];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // You can switch to "gpt-3.5-turbo" for cheaper use
      messages: [{ role: "user", content: prompt }],
      max_tokens: 60,
      temperature: 0.9,
    });

    const message = completion.choices[0].message.content.trim();

    if (!usedMessages.has(message)) {
      usedMessages.add(message);
      return message;
    } else {
      return await generateUniqueMessage(retryCount + 1);
    }
  } catch (error) {
    console.error("OpenAI Error:", error);
    return "⚠️ Could not generate message. Try again later.";
  }
}

// Main endpoint: gets or generates a unique message per ID
app.get('/message', async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  if (!messagesById[id]) {
    const newMessage = await generateUniqueMessage();
    messagesById[id] = {
      message: newMessage,
      createdAt: new Date().toISOString()
    };
  }

  res.json(messagesById[id]);
});

// Alias endpoint for flexibility
app.get('/api/generate-message', async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  if (!messagesById[id]) {
    const newMessage = await generateUniqueMessage();
    messagesById[id] = {
      message: newMessage,
      createdAt: new Date().toISOString()
    };
  }

  res.json(messagesById[id]);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
