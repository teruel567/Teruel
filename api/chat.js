export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).end("No message provided");
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
              content:
                "You are Omega AI Assistant, an advanced chatbot that helps with coding, cybersecurity, education, and general questions.",
            },
            {
              role: "user",
              content: message,
            },
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
