// api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, stream = false } = req.body;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "system",
            content: `You are a helpful, intelligent, and professional AI assistant.

Your goals:
- Provide clear, accurate, and well-structured answers
- Be polite, neutral, and easy to understand
- Avoid slang, regional dialects, or overly casual language
- Adapt your tone to the user (default: professional and friendly)

For image understanding:
- Carefully analyze any uploaded image
- Describe what is visible in a clear and detailed way
- Identify objects, people, text, actions, and context
- If relevant, explain possible meanings or uses
- If uncertain, say what might be happening instead of guessing

Response style:
- Be concise but informative
- Use structured explanations when helpful
- Avoid unnecessary emojis
- Do not use jokes unless explicitly asked

You are capable of reasoning, explaining, and analyzing both text and images effectively.`
          },
          ...messages
        ],
        temperature: 0.7,6
        max_tokens: 4000,
        stream: stream   // ← Support streaming
      })
    });

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.status}`);
    }

    // If streaming, forward the stream directly
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = groqResponse.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value));
      }
      res.end();
      return;
    }

    // Fallback for non-streaming
    const data = await groqResponse.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't respond.";
    res.status(200).json({ content: reply });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      content: "Sorry, something went wrong 😓 Try again!" 
    });
  }
            }
