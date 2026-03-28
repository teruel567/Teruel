// Debug to confirm new version is deployed
console.log("NEW VERSION LOADED 🚀");

const messages = document.getElementById("messages");
const input = document.getElementById("input");

const API_URL = "/api/chat";

function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  addMessage("Typing...", "bot");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

    // 🔥 Handle API errors properly
    if (!res.ok) {
      messages.lastChild.textContent =
        "API Error: " + (data.error || data.reply || "Unknown");
      return;
    }

    messages.lastChild.textContent = data.reply || "No response";

  } catch (error) {
    messages.lastChild.textContent = "Failed to connect ❌";
  }
}

// Send on Enter key
input.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});
