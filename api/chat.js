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
        model: "llama3-8b-8192",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false   // 🔥 IMPORTANT
      })
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      throw new Error(JSON.stringify(data));
    }

    const reply = data.choices?.[0]?.message?.content || "No response";

    res.status(200).json({ content: reply });

  } catch (error) {
    console.error("REAL ERROR:", error);
    res.status(500).json({ 
      content: "⚠️ " + error.message 
    });
  }
                                     }
