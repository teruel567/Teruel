export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, businessData } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
    }

    const systemPrompt = `
You are Omega Mobile Store AI assistant.

Store Info:
${businessData}

Rules:
- Only answer store-related questions
- Max 2 sentences
- Be direct
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ]
      })
    });

    // 🔥 IMPORTANT: check if API failed
    if (!response.ok) {
      const text = await response.text();
      console.error("Groq API error:", text);
      return res.status(500).json({ error: "Groq API failed" });
    }

    const data = await response.json();

    return res.status(200).json({
      reply: data?.choices?.[0]?.message?.content || "No response"
    });

  } catch (error) {
    console.error("SERVER ERROR:", error); // 🔥 now you see real error
    return res.status(500).json({ error: error.message });
  }
        }
