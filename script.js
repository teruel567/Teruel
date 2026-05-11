// ====================== SUPABASE ======================

const SUPABASE_URL = "https://twnphrrfcbzbuovcxujg.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"; // Replace with your real key

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ====================== ELEMENTS ======================

const chatBox = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const logoutBtn = document.getElementById("logoutBtn");

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authModal = document.getElementById("authModal");

const chatList = document.getElementById("chatList");
const newChatBtn = document.getElementById("newChatBtn");

// ====================== STATE ======================

let chats = {};
let currentChatId = null;
let typingIndicator = null;

// ====================== HELPERS ======================

function generateId() {
  return "chat_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

function getCurrentMessages() {
  if (!currentChatId || !chats[currentChatId]) return [];
  return chats[currentChatId].messages || [];
}

function saveLocal() {
  localStorage.setItem("omega_chats", JSON.stringify(chats));
  localStorage.setItem("omega_current_chat", currentChatId || "");
}

function loadLocal() {
  chats = JSON.parse(localStorage.getItem("omega_chats")) || {};
  currentChatId = localStorage.getItem("omega_current_chat");

  if (currentChatId && !chats[currentChatId]) {
    currentChatId = null;
  }

  if (!currentChatId && Object.keys(chats).length > 0) {
    currentChatId = Object.keys(chats)[0];
  }

  if (!currentChatId) {
    createNewChat();
  }
}

// ====================== RENDER CHAT LIST ======================

function renderChatList() {
  if (!chatList) return;

  chatList.innerHTML = "";

  const chatIds = Object.keys(chats);

  chatIds.sort((a, b) => {
    return new Date(chats[b].updated_at || 0) - new Date(chats[a].updated_at || 0);
  });

  chatIds.forEach((chatId) => {
    const chat = chats[chatId];

    const item = document.createElement("div");
    item.className = "chat-item" + (chatId === currentChatId ? " active" : "");

    const title = document.createElement("span");
    title.textContent = chat.title || "New Chat";
    title.onclick = () => {
      currentChatId = chatId;
      saveLocal();
      renderChatList();
      renderChats();
    };

    const actions = document.createElement("div");
    actions.className = "chat-actions";

    const renameBtn = document.createElement("button");
    renameBtn.textContent = "✏️";
    renameBtn.onclick = (e) => {
      e.stopPropagation();
      renameChat(chatId);
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.onclick = async (e) => {
      e.stopPropagation();
      await deleteChat(chatId);
    };

    actions.appendChild(renameBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(title);
    item.appendChild(actions);

    chatList.appendChild(item);
  });
}

// ====================== RENDER CHATS ======================

function renderChats() {
  if (!chatBox) return;

  chatBox.innerHTML = "";

  const messages = getCurrentMessages();

  messages.forEach((msg) => {
    const div = document.createElement("div");
    div.className =
      "msg " + (msg.role === "user" ? "user" : "bot");
    div.textContent = msg.content;
    chatBox.appendChild(div);
  });

  if (typingIndicator) {
    chatBox.appendChild(typingIndicator);
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

// ====================== TYPING INDICATOR ======================

function showTypingIndicator() {
  typingIndicator = document.createElement("div");
  typingIndicator.className = "msg bot";
  typingIndicator.textContent = "Typing...";
  renderChats();
}

function hideTypingIndicator() {
  typingIndicator = null;
  renderChats();
}

// ====================== CHAT MANAGEMENT ======================

function createNewChat() {
  const id = generateId();

  chats[id] = {
    id,
    title: "New Chat",
    messages: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  currentChatId = id;

  saveLocal();
  renderChatList();
  renderChats();

  return id;
}

function renameChat(chatId) {
  const currentTitle = chats[chatId]?.title || "New Chat";
  const newTitle = prompt("Enter new chat name:", currentTitle);

  if (!newTitle) return;

  chats[chatId].title = newTitle.trim();
  chats[chatId].updated_at = new Date().toISOString();

  saveLocal();
  renderChatList();
  syncChatsToCloud();
}

async function deleteChat(chatId) {
  if (!confirm("Delete this chat?")) return;

  delete chats[chatId];

  if (currentChatId === chatId) {
    const remaining = Object.keys(chats);
    currentChatId = remaining.length ? remaining[0] : null;
  }

  if (!currentChatId) {
    createNewChat();
  }

  saveLocal();
  renderChatList();
  renderChats();

  await syncChatsToCloud();
}

// ====================== SAVE CURRENT CHAT ======================

function saveCurrentChat() {
  if (!currentChatId || !chats[currentChatId]) return;

  chats[currentChatId].updated_at = new Date().toISOString();

  // Auto-set title from first user message
  if (
    chats[currentChatId].title === "New Chat" &&
    chats[currentChatId].messages.length > 0
  ) {
    const firstUser = chats[currentChatId].messages.find(
      (m) => m.role === "user"
    );

    if (firstUser) {
      chats[currentChatId].title =
        firstUser.content.substring(0, 30);
    }
  }

  saveLocal();
  renderChatList();
}

// ====================== SEND MESSAGE ======================

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  if (!currentChatId) {
    createNewChat();
  }

  chats[currentChatId].messages.push({
    role: "user",
    content: text
  });

  saveCurrentChat();
  renderChats();

  userInput.value = "";

  showTypingIndicator();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text
      })
    });

    const data = await response.json();

    hideTypingIndicator();

    chats[currentChatId].messages.push({
      role: "assistant",
      content: data.reply || "No response"
    });

    saveCurrentChat();
    renderChats();

    await syncChatsToCloud();
  } catch (error) {
    console.error(error);

    hideTypingIndicator();

    chats[currentChatId].messages.push({
      role: "assistant",
      content: "Error connecting to AI"
    });

    saveCurrentChat();
    renderChats();
  }
}

// ====================== CLEAR CHAT ======================

async function clearCurrentChat() {
  if (!currentChatId || !chats[currentChatId]) return;

  if (!confirm("Clear this chat?")) return;

  chats[currentChatId].messages = [];
  chats[currentChatId].updated_at = new Date().toISOString();

  saveCurrentChat();
  renderChats();

  await syncChatsToCloud();
}

// ====================== AUTH - SIGN UP ======================

signupBtn?.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  const { error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Signup successful! Check your email if confirmation is enabled.");
});

// ====================== AUTH - LOGIN ======================

loginBtn?.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  authModal.style.display = "none";

  await loadChatsFromCloud();

  renderChatList();
  renderChats();

  alert("Login successful!");
});

// ====================== AUTH - LOGOUT ======================

async function logout() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  location.reload();
}

logoutBtn?.addEventListener("click", logout);

// ====================== CHECK USER ======================

async function checkUser() {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session) {
    authModal.style.display = "none";
    await loadChatsFromCloud();
  } else {
    authModal.style.display = "flex";
    loadLocal();
  }

  renderChatList();
  renderChats();
}

// ====================== CLOUD SYNC ======================

async function syncChatsToCloud() {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (!session) return;

  const userId = session.user.id;

  for (const chatId in chats) {
    const chat = chats[chatId];

    const { error } = await supabaseClient
      .from("chats")
      .upsert({
        id: chat.id,
        user_id: userId,
        title: chat.title,
        messages: chat.messages,
        created_at: chat.created_at,
        updated_at: chat.updated_at
      });

    if (error) {
      console.error("Sync error:", error);
    }
  }
}

// ====================== LOAD CHATS FROM CLOUD ======================

async function loadChatsFromCloud() {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (!session) {
    loadLocal();
    return;
  }

  const { data, error } = await supabaseClient
    .from("chats")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Load cloud error:", error);
    loadLocal();
    return;
  }

  chats = {};

  data.forEach((chat) => {
    chats[chat.id] = {
      id: chat.id,
      title: chat.title,
      messages: chat.messages || [],
      created_at: chat.created_at,
      updated_at: chat.updated_at
    };
  });

  if (Object.keys(chats).length === 0) {
    createNewChat();
  } else {
    currentChatId = Object.keys(chats)[0];
  }

  saveLocal();
}

// ====================== EVENT LISTENERS ======================

sendBtn?.addEventListener("click", sendMessage);

userInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

clearBtn?.addEventListener("click", clearCurrentChat);

newChatBtn?.addEventListener("click", async () => {
  createNewChat();
  await syncChatsToCloud();
});

// ====================== START APP ======================

checkUser();
