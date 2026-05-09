export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "No message provided",
      });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GROQ_API_KEY is missing in Vercel",
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are Omega AI Assistant, an advanced chatbot that helps with coding, cybersecurity, education, and general questions.",
            },
            {
              role: "user",
              content: message,
            },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API Error:", data);

      return res.status(response.status).json({
        error: data.error?.message || "Groq API error",
      });
    }

    const reply =
      data.choices?.[0]?.message?.content ||
      "Sorry, I could not generate a response.";

    return res.status(200).json({
      reply,
    });
  } catch (error) {
    console.error("Server Error:", error);

    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
  }
