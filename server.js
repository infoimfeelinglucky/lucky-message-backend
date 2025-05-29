import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { OpenAI } from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.static('public'));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Paths for JSON file storage
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usedMessagesFile = path.join(__dirname, 'usedMessages.json');

// Load used messages from file
let usedMessages = [];
try {
  const data = fs.readFileSync(usedMessagesFile, 'utf8');
  usedMessages = JSON.parse(data);
} catch (err) {
  console.error('Error reading usedMessages.json:', err);
}

async function generateUniqueMessage() {
  let attempts = 0;
  let message;

  const prompt = `Give me only ONE message that is either:
- A joke (funny, can be old or new)
- A fortune (like a fortune cookie)
- A motivational message (inspiring, thought-provoking, or a famous quote)

Do not repeat any previous messages until all possibilities are exhausted.
Respond with ONLY the message, no explanations, no categories.`;

  while (attempts < 10) {
    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4',
    });

    message = response.choices[0].message.content.trim();

    if (!usedMessages.includes(message)) {
      usedMessages.push(message);
      fs.writeFileSync(usedMessagesFile, JSON.stringify(usedMessages, null, 2));
      return message;
    }

    attempts++;
  }

  return "Here's a new message for you!";
}

let currentMessage = null;

app.get('/get-ai-message', async (req, res) => {
  try {
    if (!currentMessage) {
      currentMessage = await generateUniqueMessage();
    }
    res.json({ message: currentMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error generating message' });
  }
});

app.get('/reset-message', (req, res) => {
  currentMessage = null;
  res.json({ status: 'Message reset' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'thank-you.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
