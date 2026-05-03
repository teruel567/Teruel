export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // ✅ NOW includes businessData
    const { messages, businessData } = req.body;

    if (!process.env.GROQ_API_KEY) {
      res.write(`data: ${JSON.stringify({ content: "Server error: Missing API key" })}\n\n`);
      return res.end();
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are a professional AI customer support assistant for a business.

Use the business information below to answer user questions accurately.

Business Information:
${businessData || "No business data provided."}

Instructions:
- Always base your answers on the business info if available
- Be clear, professional, and helpful
- Help users with services, pricing, and support questions
- If information is missing, say so politely`
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true
      })
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.json().catch(() => ({}));
      res.write(`data: ${JSON.stringify({ content: "Error: " + (error.error?.message || "Failed to connect") })}\n\n`);
      return res.end();
    }

    const reader = groqResponse.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices?.[0]?.delta?.content || '';
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {}
        }
      }
    }

    res.end();

  } catch (error) {
    console.error(error);
    res.write(`data: ${JSON.stringify({ content: "⚠️ Something went wrong during streaming." })}\n\n`);
    res.end();
  }
      }
