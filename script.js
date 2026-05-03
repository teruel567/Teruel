let isLoading = false;

const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");

window.onload = () => {
  addMessage("bot", "👋 Welcome to Omega AI. How can I help?");
};

// ADD MESSAGE
function addMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = `msg ${role}`;
  msg.textContent = text;
  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return msg;
}

// STREAM TEXT
async function typeText(element, text) {
  element.textContent = "";
  for (let i = 0; i < text.length; i++) {
    element.textContent += text[i];
    await new Promise(r => setTimeout(r, 15));
  }
}

// TYPING DOTS
function showTyping() {
  const typing = document.createElement("div");
  typing.className = "msg bot typing";
  typing.innerHTML = `<span></span><span></span><span></span>`;
  chatContainer.appendChild(typing);
  return typing;
}

// SEND
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isLoading) return;

  isLoading = true;
  sendBtn.disabled = true;

  addMessage("user", text);
  userInput.value = "";

  const typing = showTyping();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();
    typing.remove();

    const botMsg = addMessage("bot", "");
    await typeText(botMsg, data.reply || "No response");

  } catch {
    typing.remove();
    addMessage("bot", "⚠️ Error connecting to server.");
  }

  isLoading = false;
  sendBtn.disabled = false;
}

// CLEAR
clearBtn.onclick = () => {
  chatContainer.innerHTML = "";
  addMessage("bot", "🧹 Chat cleared.");
};

// EVENTS
sendBtn.onclick = sendMessage;

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
