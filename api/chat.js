// api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, stream = false } = req.body;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "system",
            content: `You are a fun, witty AI assistant inspired by Grok. 
Respond like a sharp, playful friend from Lagos. Use light humor, emojis, and Naija vibe when it fits. 
Keep replies natural and not too long. You are very good at analyzing images.`
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: stream   // ← Support streaming
      })
    });

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.status}`);
    }

    // If streaming, forward the stream directly
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = groqResponse.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value));
      }
      res.end();
      return;
    }

    // Fallback for non-streaming
    const data = await groqResponse.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't respond.";
    res.status(200).json({ content: reply });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      content: "Sorry, something went wrong 😓 Try again!" 
    });
  }
        }
