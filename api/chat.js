export default async function handler(req, res) {

  // 🔥 Check if API key exists
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ reply: "API KEY MISSING ❌" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
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
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
console.log("Groq response:", data);
    return res.status(200).json({
      reply: data?.choices?.[0]?.message?.content || "No response"
    });

  } catch (error) {
    return res.status(500).json({ error: "Server error ❌" });
  }
}
