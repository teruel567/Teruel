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
        model: "llama3-8b-8192", // ✅ FIXED MODEL
        messages: [
          {
            role: "system",
            content: `You are a helpful, professional AI assistant.
Provide clear, accurate, and concise responses.`
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1024, // ✅ SAFER
        stream: true
      })
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(`Groq API error: ${groqResponse.status} - ${errorText}`);
    }

    // ✅ STREAM RESPONSE
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

  } catch (error) {
    console.error("FULL ERROR:", error);

    res.status(500).json({ 
      content: "⚠️ Server error: " + error.message 
    });
  }
          }
