// api/chat.js - Simple version (no extra npm package)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.2-11b-vision-preview",
        messages: [
          {
            role: "system",
            content: `You are a fun, witty AI assistant inspired by Grok. 
Respond like a clever friend from Lagos. Use light humor and emojis when it fits. 
You can analyze uploaded images. Be helpful and playful.`
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't respond.";

    res.status(200).json({ content: reply });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      content: "Sorry, something went wrong 😓 Try again!" 
    });
  }
        }
