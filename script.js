// ================= BUSINESS DATA =================
const BUSINESS_INFO = `
Business Name: Omega Mobile Store

We sell smartphones and accessories.
We offer a 7-day refund policy.
We provide free nationwide delivery.
Customer support is available 24/7.
`;

// ================= STATE =================
let chats = JSON.parse(localStorage.getItem("chats")) || {};
let currentChatId = localStorage.getItem("currentChatId");
let isLoading = false;

// ================= ELEMENTS =================
const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const chatList = document.getElementById("chatList");
const sendBtn = document.getElementById("sendBtn");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.querySelector(".sidebar");
const overlay = document.getElementById("overlay");

// ================= STORAGE =================
function save() {
  localStorage.setItem("chats", JSON.stringify(chats));
  localStorage.setItem("currentChatId", currentChatId);
}

// ================= CHAT SYSTEM =================
function createNewChat() {
  const id = Date.now().toString();

  chats[id] = {
    title: "New Chat",
    messages: []
  };

  currentChatId = id;
  save();
  renderChats();
  renderMessages();
}

function renderChats() {
  chatList.innerHTML = "";

  Object.keys(chats).forEach(id => {
    const div = document.createElement("div");
    div.className = "chat-item" + (id === currentChatId ? " active" : "");
    div.textContent = chats[id].title;

    div.onclick = () => {
      currentChatId = id;
      save();
      renderChats();
      renderMessages();

      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    };

    div.oncontextmenu = (e) => {
      e.preventDefault();
      const action = prompt("rename/delete");

      if (action === "delete") {
        delete chats[id];
      }

      if (action === "rename") {
        const name = prompt("New name:");
        if (name) chats[id].title = name;
      }

      save();
      renderChats();
    };

    chatList.appendChild(div);
  });
}

function renderMessages() {
  chatContainer.innerHTML = "";
  const messages = chats[currentChatId]?.messages || [];

  if (messages.length === 0) {
    addMessage("assistant", "👋 Welcome! Ask about products, delivery, or refunds.");
    return;
  }

  messages.forEach(msg => {
    addMessage(msg.role, msg.content);
  });

  scrollToBottom();
}

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = "message " + role;
  div.textContent = text;
  chatContainer.appendChild(div);
  return div;
}

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ================= SEND MESSAGE (REAL API STREAM) =================
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isLoading) return;

  isLoading = true;
  sendBtn.disabled = true;

  addMessage("user", text);
  chats[currentChatId].messages.push({ role: "user", content: text });

  // Auto title
  if (chats[currentChatId].messages.length === 1) {
    chats[currentChatId].title = text.slice(0, 25);
  }

  userInput.value = "";

  // Typing indicator
  const typing = addMessage("assistant", "...");
  let fullResponse = "";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: chats[currentChatId].messages,
        businessData: BUSINESS_INFO
      })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.content) {
              fullResponse += data.content;
              typing.textContent = fullResponse;
              scrollToBottom();
            }
          } catch {}
        }
      }
    }

    chats[currentChatId].messages.push({
      role: "assistant",
      content: fullResponse
    });

    save();

  } catch (err) {
    typing.textContent = "⚠️ Error connecting to server.";
  }

  isLoading = false;
  sendBtn.disabled = false;
}

// ================= EVENTS =================
sendBtn.onclick = sendMessage;

userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Sidebar toggle
menuBtn.onclick = () => {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
};

overlay.onclick = () => {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
};

// ================= INIT =================
if (!currentChatId) {
  createNewChat();
} else {
  renderChats();
  renderMessages();
}
