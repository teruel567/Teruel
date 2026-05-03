document.addEventListener("DOMContentLoaded", () => {

  const chatContainer = document.getElementById("chatContainer");
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const clearBtn = document.getElementById("clearBtn");

  let messages = [];

  const BUSINESS_INFO = {
    name: "Omega Mobile Store",
    products: ["smartphones", "accessories"],
    policies: {
      refund: "7-day refund policy"
    }
  };

  // ================= ADD MESSAGE =================
  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = `message ${role}`;
    div.textContent = text;

    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    messages.push({ role, content: text });

    return div;
  }

  // ================= SEND =================
  async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage("user", text);
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
          businessData: BUSINESS_INFO
        })
      });

      const data = await res.json();

      typing.textContent = data.reply || "No response";

      messages.push({
        role: "assistant",
        content: data.reply
      });

    } catch (err) {
      typing.textContent = "⚠️ Error connecting to server";
      console.error(err);
    }
  }

  // ================= CLEAR =================
  function clearChat() {
    messages = [];
    chatContainer.innerHTML = "";
  }

  // ================= EVENTS =================
  sendBtn.onclick = sendMessage;

  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  clearBtn.onclick = clearChat;

  // ================= START =================
  addMessage("assistant", "👋 Welcome! Ask about products, delivery, or refunds.");

});
