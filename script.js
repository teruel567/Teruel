// ===================== ELEMENTS =====================
const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// ===================== STATE =====================
let messages = [];

// ===================== ADD MESSAGE =====================
function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = "message " + (role === "user" ? "user" : "assistant");
  div.textContent = text;

  chatContainer.appendChild(div);
  scrollToBottom();

  return div;
}

// ===================== SCROLL =====================
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ===================== SEND =====================
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  // show user message
  addMessage("user", text);

  // save to messages
  messages.push({ role: "user", content: text });

  userInput.value = "";

  // typing
  const typing = addMessage("assistant", "Typing...");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: messages,
        businessData: `
Store Name: Omega Mobile Store
We sell phones, accessories, and offer refunds within 14 days.
`
      })
    });

    const data = await res.json();

    const reply = data.reply || "No response";

    typing.textContent = reply;

    // save bot reply
    messages.push({ role: "assistant", content: reply });

  } catch (err) {
    console.error(err);
    typing.textContent = "⚠️ Error connecting to server.";
  }

  scrollToBottom();
}

// ===================== EVENTS =====================
sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
