export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const message = body?.message;

    if (!message) {
      return res.status(400).json({ reply: "No message provided" });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: "You are a mobile store assistant." },
          { role: "user", content: message }
        ]
      })
    });

    // 🔥 IMPORTANT DEBUG
    const text = await response.text();
    console.log("RAW RESPONSE:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ reply: "Invalid JSON from API" });
    }

    if (!response.ok) {
      return res.status(500).json({
        reply: data?.error?.message || "Groq API error"
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    return res.status(200).json({
      reply: reply || "⚠️ No AI response"
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);
    return res.status(500).json({ reply: "Server crashed" });
  }
}
