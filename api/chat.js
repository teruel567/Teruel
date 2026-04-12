// api/chat.js
import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    const result = streamText({
      model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),   // Best vision model on Groq right now

      system: `You are a fun, witty, and helpful AI assistant inspired by Grok, powered by Groq.
      Respond like a clever friend from Lagos — use light humor, emojis when it fits, and keep replies engaging and natural.
      You're chatting with someone in Nigeria, so feel free to add Naija flavor (jollof, traffic, "my guy", etc.) when it makes sense.
      You can perfectly see and analyze uploaded images. Describe what you see clearly, answer questions about them, and be playful.
      Be maximally helpful and truthful. No boring corporate tone.`,

      messages,                    // Automatically handles text + images
      temperature: 0.75,
      maxTokens: 1200,
    });

    return result.pipeDataStreamToResponse(res);

  } catch (error) {
    console.error('Groq Error:', error);
    return res.status(500).json({ 
      error: 'Failed to get response from Groq. Try again!' 
    });
  }
      }
