import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
if (!message) {
  return res.status(400).json({
    reply: "No message provided"
  });
}
  try {
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
            content: "You are a smart AI assistant like JARVIS. Be helpful, clear, and friendly."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();
console.log("GROQ RESPONSE:", JSON.stringify(data, null, 2));

res.json({
  reply: data?.choices?.[0]?.message?.content || "No response from AI"
});

  } catch (error) {
    console.error(error);
    res.status(500).json({
      reply: "Server error. Please try again."
    });
  }
});

app.get("/", (req, res) => {
  res.send("AI Backend Running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
