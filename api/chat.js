export default async function handler(req, res) {
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
        model: "llama3-70b-8192", // 🔥 upgraded model
        messages: [
          {
            role: "system",
            content: "You are a smart, helpful AI assistant like JARVIS. Keep answers clear and useful."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    // 🔍 DEBUG (VERY IMPORTANT)
    console.log("Groq full response:", JSON.stringify(data, null, 2));

    // ⚠️ Handle API errors properly
    if (!response.ok) {
      return res.status(500).json({
        reply: "⚠️ AI Error: " + (data.error?.message || "Unknown error")
      });
    }

    // ✅ Send back AI reply
    return res.status(200).json({
      reply: data?.choices?.[0]?.message?.content || "No response from AI"
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      reply: "⚠️ Server error. Check logs."
    });
  }
  }
