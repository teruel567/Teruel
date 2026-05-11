// ====================== SUPABASE ======================

const SUPABASE_URL = "https://twnphrrfcbzbuovcxujg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_K4oguvLu8U5cti-YP32yHw_DkF6LqEB";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ====================== ELEMENTS ======================

// Sidebar
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const newChatBtn = document.getElementById("newChatBtn");
const chatList = document.getElementById("chatList");

// Chat area
const chatBox = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Auth
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authModal = document.getElementById("authModal");

// ====================== STATE ======================

let chats = JSON.parse(localStorage.getItem("omega_chats_v2")) || {};
let currentChatId =
  localStorage.getItem("omega_current_chat") || null;

// ====================== HELPERS ======================

function generateId() {
  return (
    Date.now().toString() +
    Math.random().toString(36).substring(2, 9)
  );
}

function saveLocal() {
  localStorage.setItem(
    "omega_chats_v2",
    JSON.stringify(chats)
  );
  localStorage.setItem(
    "omega_current_chat",
    currentChatId || ""
  );
}

function getCurrentMessages() {
  if (!currentChatId || !chats[currentChatId]) return [];
  return chats[currentChatId].messages;
}

function setCurrentMessages(messages) {
  if (!currentChatId || !chats[currentChatId]) return;

  chats[currentChatId].messages = messages;
  chats[currentChatId].updated_at =
    new Date().toISOString();

  saveLocal();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ====================== SIDEBAR TOGGLE ======================
// Fixed version: safely checks if elements exist

if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    sidebar.classList.toggle("open");
  });
}

// Close sidebar when tapping outside on mobile
document.addEventListener("click", function (e) {
  if (
    window.innerWidth <= 768 &&
    sidebar &&
    sidebar.classList.contains("open") &&
    !sidebar.contains(e.target) &&
    sidebarToggle &&
    !sidebarToggle.contains(e.target)
  ) {
    sidebar.classList.remove("open");
  }
});

// ====================== CHAT MANAGEMENT ======================

function createNewChat() {
  const id = generateId();

  chats[id] = {
    id: id,
    title: "New Chat",
    messages: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  currentChatId = id;

  saveLocal();
  renderChatList();
  renderMessages();
  syncCurrentChatToCloud();

  // Close sidebar on mobile
  if (window.innerWidth <= 768 && sidebar) {
    sidebar.classList.remove("open");
  }
}

function selectChat(chatId) {
  currentChatId = chatId;

  saveLocal();
  renderChatList();
  renderMessages();

  // Close sidebar on mobile
  if (window.innerWidth <= 768 && sidebar) {
    sidebar.classList.remove("open");
  }
}

function renameChat(chatId) {
  const currentTitle = chats[chatId].title;
  const newTitle = prompt("Rename chat:", currentTitle);

  if (!newTitle || !newTitle.trim()) return;

  chats[chatId].title = newTitle.trim();
  chats[chatId].updated_at =
    new Date().toISOString();

  saveLocal();
  renderChatList();
  syncCurrentChatToCloud();
}

function deleteChat(chatId) {
  if (!confirm("Delete this chat?")) return;

  delete chats[chatId];

  if (currentChatId === chatId) {
    const remaining = Object.keys(chats);
    currentChatId =
      remaining.length > 0 ? remaining[0] : null;
  }

  saveLocal();
  renderChatList();
  renderMessages();

  if (!currentChatId) {
    createNewChat();
  }
}

// Make functions available globally
window.renameChat = renameChat;
window.deleteChat = deleteChat;

// ====================== RENDER CHAT LIST ======================

function renderChatList() {
  if (!chatList) return;

  chatList.innerHTML = "";

  const sortedChats = Object.values(chats).sort(
    function (a, b) {
      return (
        new Date(b.updated_at) -
        new Date(a.updated_at)
      );
    }
  );

  sortedChats.forEach(function (chat) {
    const item = document.createElement("div");

    item.className =
      "chat-item" +
      (chat.id === currentChatId ? " active" : "");

    item.innerHTML = `
      <span class="chat-title">${escapeHtml(
        chat.title
      )}</span>
      <div class="chat-actions">
        <button onclick="renameChat('${chat.id}')">✏️</button>
        <button onclick="deleteChat('${chat.id}')">🗑️</button>
      </div>
    `;

    item.addEventListener("click", function (e) {
      if (e.target.tagName === "BUTTON") return;
      selectChat(chat.id);
    });

    chatList.appendChild(item);
  });
}

// ====================== RENDER MESSAGES ======================
function renderMessages() {
  if (!chatBox) return;

  chatBox.innerHTML = "";

  if (!currentChatId || !chats[currentChatId]) {
    return;
  }

  const messages = chats[currentChatId].messages;

  messages.forEach((msg) => {
    const div = document.createElement("div");
    div.className =
      "msg " +
      (msg.role === "user" ? "user" : "bot");

    if (msg.role === "assistant") {
      // Render markdown
      div.innerHTML = marked.parse(msg.content || "");

      // Highlight code blocks
      div.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightElement(block);

        // Create copy button
        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-code-btn";
        copyBtn.textContent = "Copy";

        copyBtn.addEventListener("click", async () => {
          const code = block.textContent;

          try {
            await navigator.clipboard.writeText(code);
            copyBtn.textContent = "Copied!";
            setTimeout(() => {
              copyBtn.textContent = "Copy";
            }, 2000);
          } catch (err) {
            alert("Failed to copy code");
          }
        });

        // Wrap pre element so button can be positioned
        const pre = block.parentElement;
        pre.style.position = "relative";
        pre.appendChild(copyBtn);
      });
    } else {
      // User messages remain plain text
      div.textContent = msg.content;
    }

    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}



// ====================== TYPING INDICATOR ======================

function showTypingIndicator() {
  const div = document.createElement("div");
  div.className = "msg bot";
  div.id = "typingIndicator";
  div.textContent = "Typing...";

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTypingIndicator() {
  const typing =
    document.getElementById("typingIndicator");

  if (typing) typing.remove();
}

// ====================== CLOUD SYNC ======================

async function syncCurrentChatToCloud() {
  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (
      !session ||
      !currentChatId ||
      !chats[currentChatId]
    ) {
      return;
    }

    const chat = chats[currentChatId];

    await supabaseClient.from("chats").upsert({
      id: chat.id,
      user_id: session.user.id,
      title: chat.title,
      messages: chat.messages,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cloud sync error:", error);
  }
}

async function loadChatsFromCloud() {
  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) return;

    const { data, error } = await supabaseClient
      .from("chats")
      .select("*")
      .order("updated_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }

    if (data && data.length > 0) {
      data.forEach(function (chat) {
        chats[chat.id] = {
          id: chat.id,
          title: chat.title,
          messages: chat.messages || [],
          created_at:
            chat.created_at ||
            new Date().toISOString(),
          updated_at:
            chat.updated_at ||
            new Date().toISOString(),
        };
      });

      if (!currentChatId) {
        currentChatId = data[0].id;
      }

      saveLocal();
    }
  } catch (error) {
    console.error("Load chats error:", error);
  }
}

// ====================== SEND MESSAGE ======================

async function sendMessage() {
  const text = userInput.value.trim();

  if (!text) return;

  if (!currentChatId || !chats[currentChatId]) {
    createNewChat();
  }

  const messages = getCurrentMessages();

  messages.push({
    role: "user",
    content: text,
  });

  // Auto title from first message
  if (
    chats[currentChatId].title === "New Chat" &&
    messages.length === 1
  ) {
    chats[currentChatId].title =
      text.substring(0, 30);
  }

  setCurrentMessages(messages);

  renderChatList();
  renderMessages();

  userInput.value = "";

  showTypingIndicator();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        message: text,
      }),
    });

    const data = await response.json();

    removeTypingIndicator();

    messages.push({
      role: "assistant",
      content:
        data.reply || "No response",
    });

    setCurrentMessages(messages);

    renderMessages();
    renderChatList();

    await syncCurrentChatToCloud();
  } catch (error) {
    console.error(error);

    removeTypingIndicator();

    messages.push({
      role: "assistant",
      content:
        "Error connecting to AI",
    });

    setCurrentMessages(messages);

    renderMessages();
    renderChatList();

    await syncCurrentChatToCloud();
  }
}

// ====================== CLEAR CHAT ======================

function clearCurrentChat() {
  if (
    !currentChatId ||
    !chats[currentChatId]
  ) {
    return;
  }

  if (
    !confirm(
      "Clear all messages in this chat?"
    )
  ) {
    return;
  }

  chats[currentChatId].messages = [];
  chats[currentChatId].updated_at =
    new Date().toISOString();

  saveLocal();
  renderMessages();
  renderChatList();
  syncCurrentChatToCloud();
}

// ====================== AUTH ======================

signupBtn.addEventListener(
  "click",
  async function () {
    const email =
      emailInput.value.trim();
    const password =
      passwordInput.value.trim();

    if (!email || !password) {
      alert(
        "Enter email and password"
      );
      return;
    }

    const { error } =
      await supabaseClient.auth.signUp({
        email: email,
        password: password,
      });

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      "Signup successful! You can now log in."
    );
  }
);

loginBtn.addEventListener(
  "click",
  async function () {
    const email =
      emailInput.value.trim();
    const password =
      passwordInput.value.trim();

    if (!email || !password) {
      alert(
        "Enter email and password"
      );
      return;
    }

    const { error } =
      await supabaseClient.auth.signInWithPassword(
        {
          email: email,
          password: password,
        }
      );

    if (error) {
      alert(error.message);
      return;
    }

    authModal.style.display =
      "none";

    await loadChatsFromCloud();

    if (!currentChatId) {
      createNewChat();
    }

    renderChatList();
    renderMessages();
  }
);

async function checkUser() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (session) {
    authModal.style.display =
      "none";

    await loadChatsFromCloud();

    if (!currentChatId) {
      createNewChat();
    }
  } else {
    authModal.style.display =
      "flex";
  }

  renderChatList();
  renderMessages();
}

async function logout() {
  const { error } =
    await supabaseClient.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  location.reload();
}

// ====================== EVENT LISTENERS ======================

if (sendBtn) {
  sendBtn.addEventListener(
    "click",
    sendMessage
  );
}

if (userInput) {
  userInput.addEventListener(
    "keydown",
    function (e) {
      if (e.key === "Enter") {
        sendMessage();
      }
    }
  );
}

if (clearBtn) {
  clearBtn.addEventListener(
    "click",
    clearCurrentChat
  );
}

if (logoutBtn) {
  logoutBtn.addEventListener(
    "click",
    logout
  );
}

if (newChatBtn) {
  newChatBtn.addEventListener(
    "click",
    createNewChat
  );
}

// ====================== INITIALIZE ======================

checkUser();
