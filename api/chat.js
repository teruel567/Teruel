export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ content: "Invalid messages format" });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is missing in environment variables");
      return res.status(500).json({ 
        content: "⚠️ Server configuration error: Missing API key" 
      });
    }

    // Clean and prepare messages for Groq
    const cleanedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content || msg.display || ""
    }));

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",        // You can change to "llama-3.1-8b-instant" if available
        messages: [
          {
            role: "system",
            content: "You are Teruel Omega AI, a friendly, helpful, and intelligent assistant."
          },
          ...cleanedMessages
        ],
        temperature: 0.75,
        max_tokens: 800,
        stream: false
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API Error:", data);
      return res.status(500).json({
        content: `⚠️ Groq Error: ${data.error?.message || "Failed to get response"}`
      });
    }

    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return res.status(200).json({ content: reply });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      content: "⚠️ Something went wrong on the server. Please try again."
    });
  }
      }
