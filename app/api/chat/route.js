// app/api/chat/route.js
export async function POST(request) {
  try {
    const { messages } = await request.json();

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.2-11b-vision-preview",   // or a current vision model if available
        messages: [
          {
            role: "system",
            content: "You are a fun, witty AI assistant inspired by Grok. Respond like a clever friend from Lagos with light humor and emojis."
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't respond.";

    return Response.json({ content: reply });
  } catch (error) {
    console.error(error);
    return Response.json({ content: "Sorry, something went wrong 😓" }, { status: 500 });
  }
          }
