export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ content: "Server configuration error: Missing API key" });
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: "You are Teruel Omega AI, a friendly and helpful assistant." },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      return res.status(500).json({ 
        content: `Groq Error: ${data.error?.message || "Failed to connect"}` 
      });
    }

    const reply = data.choices?.[0]?.message?.content || "No response received.";
    return res.status(200).json({ content: reply });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ content: "Internal server error. Please try again." });
  }
}
