const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");

let messages = [];

// ADD MESSAGE
function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = "message " + (role === "user" ? "user" : "assistant");
  div.textContent = text;

  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  return div;
}

// TYPE EFFECT (🔥 NEW)
function typeText(el, text) {
  let i = 0;
  el.textContent = "";

  function typing() {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
      setTimeout(typing, 15);
    }
  }

  typing();
}

// SEND MESSAGE
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage("user", text);
  messages.push({ role: "user", content: text });

  userInput.value = "";

  const typing = addMessage("assistant", "Typing...");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages,
        businessData: `
Store Name: Omega Mobile Store
We sell phones, accessories, and offer refunds within 14 days.
`
      })
    });

    const data = await res.json();
    const reply = data.reply || "No response";

    // 🔥 smooth typing
    typeText(typing, reply);

    messages.push({ role: "assistant", content: reply });

  } catch (err) {
    typing.textContent = "⚠️ Error connecting to server.";
  }
}

// EVENTS
sendBtn.onclick = sendMessage;

userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

clearBtn.onclick = () => {
  chatContainer.innerHTML = "";
  messages = [];
};

// WELCOME
addMessage("assistant", "Welcome to Omega AI. How can I help you?");
