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
  userInput.focus(); // better UX
};

// ================= ADD MESSAGE =================
function addMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = role === "user" ? "msg user" : "msg bot";
  msg.textContent = text;

  chatContainer.appendChild(msg);

  // smooth scroll
  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: "smooth"
  });

  return msg;
}

// ================= TYPING =================
function showTyping() {
  const typing = document.createElement("div");
  typing.className = "msg bot typing";
  typing.innerHTML = `<span></span><span></span><span></span>`;
  chatContainer.appendChild(typing);

  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: "smooth"
  });

  return typing;
}

// ================= SEND MESSAGE =================
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isLoading) return;

  isLoading = true;
  sendBtn.disabled = true;
  userInput.disabled = true;
  clearBtn.disabled = true;

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

    if (!res.ok) {
      addMessage("bot", `⚠️ ${data.error || "Server error"}`);
    } else {
      addMessage("bot", data.reply || "⚠️ No response.");
    }

  } catch (err) {
    typing.remove();
    addMessage("bot", "⚠️ Network error. Check your connection.");
  }

  isLoading = false;
  sendBtn.disabled = false;
  userInput.disabled = false;
  clearBtn.disabled = false;
  userInput.focus();
}

// ================= CLEAR CHAT =================
clearBtn.addEventListener("click", () => {
  if (isLoading) return;

  const confirmClear = confirm("Clear all chat?");
  if (confirmClear) {
    chatContainer.innerHTML = "";
    addMessage("bot", "🧹 Chat cleared. How can I help you?");
  }
});

// ================= EVENTS =================
sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
