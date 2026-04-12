// api/chat.js
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
        model: "meta-llama/llama-4-scout-17b-16e-instruct",   // Current best vision model
        messages: [
          {
            role: "system",
            content: `You are a fun, witty AI assistant inspired by Grok. 
Respond like a clever friend from Lagos. Use light humor, emojis, and Naija vibe when it fits. 
You can analyze uploaded images very well. Be helpful and playful.`
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("Groq error:", errorText);
      throw new Error(`Groq API returned ${groqResponse.status}`);
    }

    const data = await groqResponse.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't respond.";

    res.status(200).json({ content: reply });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      content: "Sorry, something went wrong on my side 😓 Please try again!" 
    });
  }
          }
