// ================= STATE =================
let isLoading = false;

// ================= ELEMENTS =================
const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");

// ================= INIT =================
window.onload = () => {
  addMessage("bot", "👋 Welcome to Omega AI Assistant. How can I help you?");
};

// ================= ADD MESSAGE =================
function addMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = role === "user" ? "msg user" : "msg bot";
  msg.textContent = text;

  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  return msg;
}

// ================= TYPING INDICATOR =================
function showTyping() {
  const typing = document.createElement("div");
  typing.className = "msg bot typing";
  typing.innerHTML = `<span></span><span></span><span></span>`;
  chatContainer.appendChild(typing);

  chatContainer.scrollTop = chatContainer.scrollHeight;
  return typing;
}

// ================= SEND MESSAGE =================
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isLoading) return;

  isLoading = true;
  sendBtn.disabled = true;
  userInput.disabled = true;

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

    if (!data.reply) {
      addMessage("bot", "⚠️ No response from server.");
    } else {
      addMessage("bot", data.reply);
    }

  } catch (err) {
    typing.remove();
    addMessage("bot", "⚠️ Error connecting to server.");
  }

  isLoading = false;
  sendBtn.disabled = false;
  userInput.disabled = false;
  userInput.focus();
}

// ================= CLEAR CHAT =================
clearBtn.addEventListener("click", () => {
  const confirmClear = confirm("Clear all chat?");
  if (confirmClear) {
    chatContainer.innerHTML = "";
    addMessage("bot", "🧹 Chat cleared. How can I help you?");
  }
});

// ================= EVENTS =================
sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
