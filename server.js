const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateAIMessage() {
  const messageType = ['joke', 'fortune', 'motivation'][Math.floor(Math.random() * 3)];
  const prompt = `Give me a unique, never repeated ${messageType}.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4', // or 'gpt-3.5-turbo' if you're using that
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
    frequency_penalty: 0.6,
  });

  return response.choices[0].message.content.trim();
}

app.get('/get-ai-message', async (req, res) => {
  try {
    const aiMessage = await generateAIMessage();
    res.json({ message: aiMessage });
  } catch (error) {
    console.error('Error fetching AI message:', error);
    res.status(500).json({ error: 'Failed to fetch AI message' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
