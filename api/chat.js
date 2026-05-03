export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ 
        content: "Server error: Missing Groq API Key" 
      });
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",     // ← Updated to working model
        messages: [
          {
            role: "system",
            content: "You are Teruel Omega AI, a friendly, helpful, and intelligent assistant."
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error("Groq Error:", data);
      return res.status(500).json({ 
        content: data.error?.message || "Failed to get response from Groq" 
      });
    }

    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
    return res.status(200).json({ content: reply });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ 
      content: "⚠️ Internal server error. Please try again." 
    });
  }
}
