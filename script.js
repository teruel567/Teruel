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
let currentChatId = localStorage.getItem("currentChatId") || null;
let isLoading = false;

// ================= ELEMENTS =================
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatContainer = document.getElementById('chatContainer');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const chatList = document.getElementById('chatList');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.querySelector('.sidebar');

// ================= STORAGE =================
function saveChats() {
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
  saveChats();
  renderChatList();
  renderChat();
}

function switchChat(id) {
  currentChatId = id;
  saveChats();
  renderChatList();
  renderChat();

  if (window.innerWidth < 768) {
    sidebar.classList.remove("open");
  }
}

function deleteChat(id) {
  delete chats[id];
  currentChatId = Object.keys(chats)[0] || null;
  saveChats();
  renderChatList();
  renderChat();
}

function renameChat(id) {
  const newName = prompt("Rename chat:");
  if (!newName) return;

  chats[id].title = newName;
  saveChats();
  renderChatList();
}

// ================= UI =================
function renderChatList() {
  chatList.innerHTML = "";

  Object.keys(chats).forEach(id => {
    const item = document.createElement("div");
    item.className = "chat-item" + (id === currentChatId ? " active" : "");
    item.textContent = chats[id].title || "Chat";

    item.onclick = () => switchChat(id);

    item.oncontextmenu = (e) => {
      e.preventDefault();
      const action = prompt("Type 'delete' or 'rename'");

      if (action === "delete") deleteChat(id);
      if (action === "rename") renameChat(id);
    };

    chatList.appendChild(item);
  });
}

function renderChat() {
  chatContainer.innerHTML = "";
  const chat = chats[currentChatId]?.messages || [];

  if (chat.length === 0) {
    addMessage("assistant").textContent =
      "👋 Welcome! Ask about products, delivery, or refunds.";
    return;
  }

  chat.forEach(msg => {
    addMessage(msg.role).textContent = msg.content;
  });

  scrollToBottom();
}

function addMessage(role) {
  const bubble = document.createElement("div");
  bubble.className = `message ${role}`;
  bubble.innerHTML = `<p></p>`;
  chatContainer.appendChild(bubble);
  return bubble.querySelector("p");
}

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ================= SEND =================
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isLoading || !currentChatId) return;

  isLoading = true;
  sendBtn.disabled = true;

  addMessage("user").textContent = text;
  chats[currentChatId].messages.push({ role: "user", content: text });

  // Auto title from first message
  if (chats[currentChatId].messages.length === 1) {
    chats[currentChatId].title = text.slice(0, 20);
  }

  userInput.value = "";

  const typing = document.createElement("div");
  typing.className = "message assistant";
  typing.innerHTML = `<p class="typing">● ● ●</p>`;
  chatContainer.appendChild(typing);
  scrollToBottom();

  let fullResponse = "";
  let assistantText = null;

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
              if (!assistantText) {
                typing.remove();
                assistantText = addMessage("assistant");
              }

              fullResponse += data.content;
              assistantText.textContent = fullResponse;
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

    saveChats();

  } catch {
    typing.remove();
    addMessage("assistant").textContent = "⚠️ Network error.";
  }

  isLoading = false;
  sendBtn.disabled = false;
}

// ================= EVENTS =================
sendBtn.onclick = sendMessage;

userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

clearBtn.onclick = () => {
  chats[currentChatId].messages = [];
  saveChats();
  renderChat();
};

downloadBtn.onclick = () => {
  const chat = chats[currentChatId]?.messages || [];
  let text = "";

  chat.forEach(m => {
    text += `${m.role}: ${m.content}\n\n`;
  });

  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "chat.txt";
  a.click();
};

// Mobile toggle
if (menuBtn) {
  menuBtn.onclick = () => {
    sidebar.classList.toggle("open");
  };
}

// ================= INIT =================
if (!currentChatId) createNewChat();
renderChatList();
renderChat();
