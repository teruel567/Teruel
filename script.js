// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {

  // ===================== STATE =====================
  let chats = JSON.parse(localStorage.getItem("chats")) || {};
  let currentChatId = localStorage.getItem("currentChatId");
  let isLoading = false;

  // ===================== BUSINESS DATA =====================
  const BUSINESS_INFO = {
    name: "Omega Mobile Store",
    products: ["smartphones", "accessories"],
    policies: {
      refund: "7-day refund policy"
    }
  };

  // ===================== ELEMENTS =====================
  const chatContainer = document.getElementById("chatContainer");
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const clearBtn = document.getElementById("clearBtn");
  const exportBtn = document.getElementById("exportBtn");
  const newChatBtn = document.getElementById("newChatBtn");
  const chatList = document.getElementById("chatList");
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");

  // ===================== INIT CHAT =====================
  function initChat() {
    if (!currentChatId || !chats[currentChatId]) {
      currentChatId = Date.now().toString();
      chats[currentChatId] = {
        title: "New Chat",
        messages: []
      };
      save();
    }
  }

  // ===================== SAVE =====================
  function save() {
    localStorage.setItem("chats", JSON.stringify(chats));
    localStorage.setItem("currentChatId", currentChatId);
  }

  // ===================== RENDER CHAT =====================
  function renderChat() {
    chatContainer.innerHTML = "";

    const messages = chats[currentChatId].messages;

    if (messages.length === 0) {
      addMessage("assistant", "👋 Welcome! Ask about products, delivery, or refunds.");
      return;
    }

    messages.forEach(msg => {
      addMessage(msg.role, msg.content, false);
    });
  }

  // ===================== ADD MESSAGE =====================
  function addMessage(role, text, saveMessage = true) {
    const div = document.createElement("div");
    div.className = `message ${role}`;
    div.textContent = text;
    chatContainer.appendChild(div);

    chatContainer.scrollTop = chatContainer.scrollHeight;

    if (saveMessage) {
      chats[currentChatId].messages.push({ role, content: text });

      // auto title from first message
      if (chats[currentChatId].messages.length === 1) {
        chats[currentChatId].title = text.slice(0, 25);
      }

      save();
      renderChatList();
    }

    return div;
  }

  // ===================== SEND MESSAGE =====================
  async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || isLoading) return;

    addMessage("user", text);
    userInput.value = "";

    isLoading = true;
    sendBtn.disabled = true;

    const typing = addMessage("assistant", "Typing...", false);

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

      const data = await res.json();

      typing.textContent = data.reply || "No response";

      chats[currentChatId].messages.push({
        role: "assistant",
        content: data.reply
      });

      save();

    } catch (err) {
      typing.textContent = "⚠️ Error connecting to server.";
      console.error(err);
    }

    isLoading = false;
    sendBtn.disabled = false;
  }

  // ===================== CLEAR CHAT =====================
  function clearChat() {
    chats[currentChatId].messages = [];
    save();
    renderChat();
  }

  // ===================== EXPORT CHAT =====================
  function exportChat() {
    const data = chats[currentChatId].messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const blob = new Blob([data], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "chat.txt";
    a.click();
  }

  // ===================== NEW CHAT =====================
  function newChat() {
    currentChatId = Date.now().toString();
    chats[currentChatId] = {
      title: "New Chat",
      messages: []
    };
    save();
    renderChat();
    renderChatList();
  }

  // ===================== RENDER CHAT LIST =====================
  function renderChatList() {
    if (!chatList) return;

    chatList.innerHTML = "";

    Object.keys(chats).forEach(id => {
      const item = document.createElement("div");
      item.className = "chat-item";
      item.textContent = chats[id].title || "New Chat";

      if (id === currentChatId) {
        item.classList.add("active");
      }

      item.onclick = () => {
        currentChatId = id;
        save();
        renderChat();
        renderChatList();
        sidebar.classList.remove("open");
      };

      chatList.appendChild(item);
    });
  }

  // ===================== SIDEBAR TOGGLE =====================
  if (menuToggle && sidebar) {
    menuToggle.onclick = () => {
      sidebar.classList.toggle("open");
    };
  }

  // ===================== EVENTS =====================
  sendBtn.onclick = sendMessage;

  userInput.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });

  if (clearBtn) clearBtn.onclick = clearChat;
  if (exportBtn) exportBtn.onclick = exportChat;
  if (newChatBtn) newChatBtn.onclick = newChat;

  // ===================== START =====================
  initChat();
  renderChat();
  renderChatList();

});
