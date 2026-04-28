// api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

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
            content: `You are a helpful, intelligent, and professional AI assistant.

Provide clear, accurate, and well-structured answers.
Be polite, neutral, and easy to understand.
Avoid slang and overly casual language.

For images:
Describe what is visible, identify key elements, and explain context clearly.
If unsure, state uncertainty instead of guessing.

Keep responses concise but informative.`
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 4000,
        stream: true   // ✅ ALWAYS ENABLE STREAMING
      })
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(`Groq API error: ${groqResponse.status} - ${errorText}`);
    }

    // ✅ STREAM RESPONSE PROPERLY
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = groqResponse.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      res.write(chunk);
    }

    res.end();

  } catch (error) {
    console.error("Error:", error);

    res.status(500).json({ 
      content: "⚠️ Server error. Check your API key or request format." 
    });
  }
        }
