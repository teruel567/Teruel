export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const { messages } = req.body;

if (
  !messages ||
  !Array.isArray(messages) ||
  messages.length === 0
) {
  return res.status(400).end("No messages provided");
}

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res
        .status(500)
        .end("GROQ_API_KEY is missing in Vercel");
    }

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          stream: true,
          temperature: 0.7,
          max_tokens: 2048,
          messages: [
  {
    role: "system",
    content: `
You are Omega AI Assistant, a highly capable AI assistant.

Core behavior:
- Be accurate, helpful, and professional.
- Remember and use relevant information from earlier messages in the conversation.
- Answer directly and clearly.
- If the user's request is unclear, ask a concise clarifying question.
- Do not make up facts when uncertain. State uncertainty honestly.

Specializations:
- Software development
- Debugging and code review
- Cybersecurity
- Education and tutoring
- Research assistance
- Business and productivity

Response guidelines:
- Use markdown formatting when helpful.
- Use headings, bullet points, and numbered steps when appropriate.
- For coding tasks:
  - Provide complete working examples when possible.
  - Explain important parts of the code.
  - Mention potential errors or edge cases.
- For troubleshooting:
  - Identify the likely cause.
  - Provide step-by-step solutions.
- For educational topics:
  - Explain concepts clearly and progressively.
  - Include examples when useful.

Conversation memory:
- Use relevant details previously shared by the user.
- Maintain context throughout the chat.
- Do not repeatedly ask for information already provided.

Tone:
- Friendly, professional, and confident.
- Avoid unnecessary filler text.
- Focus on practical and actionable answers.
`,
  },

  ...messages.slice(-20),
],
        }),
      }
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      return res.status(500).end(errorText);
    }

    // Streaming headers
    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );
    res.setHeader(
      "Cache-Control",
      "no-cache, no-transform"
    );
    res.setHeader(
      "Transfer-Encoding",
      "chunked"
    );

    const reader = groqResponse.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
      const { value, done } =
        await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true,
      });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed.startsWith("data:")) {
          continue;
        }

        const data = trimmed.replace(
          /^data:\s*/,
          ""
        );

        if (data === "[DONE]") {
          res.end();
          return;
        }

        try {
          const json = JSON.parse(data);

          const token =
            json.choices?.[0]?.delta
              ?.content;

          if (token) {
            res.write(token);
          }
        } catch {
          // Ignore malformed chunks
        }
      }
    }

    res.end();
  } catch (error) {
    console.error("Groq Streaming Error:", error);
    res.status(500).end("Server Error");
  }
    }
