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

// ================= STORAGE =================
function saveChats() {
  localStorage.setItem("chats", JSON.stringify(chats));
  localStorage.setItem("currentChatId", currentChatId);
}

// ================= CHAT SYSTEM =================
function createNewChat() {
  const id = Date.now().toString();
  chats[id] = [];
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
}

function deleteChat(id) {
  delete chats[id];
  currentChatId = Object.keys(chats)[0] || null;
  saveChats();
  renderChatList();
  renderChat();
}

// ================= UI =================
function renderChatList() {
  if (!chatList) return;
  chatList.innerHTML = "";

  Object.keys(chats).forEach(id => {
    const item = document.createElement("div");
    item.className = "chat-item" + (id === currentChatId ? " active" : "");
    item.textContent = "Chat " + id.slice(-4);

    item.onclick = () => switchChat(id);

    item.oncontextmenu = (e) => {
      e.preventDefault();
      if (confirm("Delete this chat?")) deleteChat(id);
    };

    chatList.appendChild(item);
  });
}

function renderChat() {
  chatContainer.innerHTML = "";
  const chat = chats[currentChatId] || [];

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
  chats[currentChatId].push({ role: "user", content: text });

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
        messages: chats[currentChatId],
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

    if (!fullResponse) {
      typing.remove();
      assistantText = addMessage("assistant");
      fullResponse = "⚠️ No response. Try again.";
      assistantText.textContent = fullResponse;
    }

    chats[currentChatId].push({
      role: "assistant",
      content: fullResponse
    });

    saveChats();

  } catch (err) {
    typing.remove();
    addMessage("assistant").textContent =
      "⚠️ Network issue. Please try again.";
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
  if (confirm("Clear this chat?")) {
    chats[currentChatId] = [];
    saveChats();
    renderChat();
  }
};

downloadBtn.onclick = () => {
  const chat = chats[currentChatId] || [];
  let text = "";

  chat.forEach(m => {
    text += `${m.role.toUpperCase()}: ${m.content}\n\n`;
  });

  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "chat.txt";
  a.click();
};

// ================= INIT =================
if (!currentChatId) createNewChat();
renderChatList();
renderChat();
