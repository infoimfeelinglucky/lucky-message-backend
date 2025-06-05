import 'dotenv/config'; // Loads .env automatically
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const messagesById = {};
const usedMessages = new Set();

async function generateUniqueMessage(retryCount = 0) {
  if (retryCount > 5) {
    return "🔁 All lucky messages have been used. Please check back later.";
  }

  const promptOptions = [
    "Give me a mysterious-sounding one-sentence fortune.",
    "Tell me a very short, clever, and original joke.",
    "Give me a one-sentence motivational quote that feels personal."
  ];
  const prompt = promptOptions[Math.floor(Math.random() * promptOptions.length)];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // or "gpt-3.5-turbo"
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
