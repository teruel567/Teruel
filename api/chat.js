// api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ content: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant. Give clear and helpful answers."
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1024,
        stream: false   // ❗ IMPORTANT (NO STREAMING)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API Error:", data);
      return res.status(500).json({
        content: "Groq API error"
      });
    }

    return res.status(200).json({
      content: data.choices?.[0]?.message?.content || "No response from AI"
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      content: "Server error: " + error.message
    });
  }
          }
