// ====================== SUPABASE ======================

const SUPABASE_URL = "https://twnphrrfcbzbuovcxujg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_K4oguvLu8U5cti-YP32yHw_DkF6LqEB";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ====================== ELEMENTS ======================

const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const newChatBtn = document.getElementById("newChatBtn");
const chatList = document.getElementById("chatList");
const chatTitle = document.getElementById("chatTitle");

const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const logoutBtn = document.getElementById("logoutBtn");

const authModal = document.getElementById("authModal");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

// ====================== STATE ======================

let chats =
  JSON.parse(localStorage.getItem("omega_multi_chats")) || {};

let currentChatId =
  localStorage.getItem("omega_current_chat_id") || null;

// ====================== HELPERS ======================

function generateChatId() {
  return "chat_" + Date.now();
}

function getChatTitle(messages) {
  const firstUserMessage = messages.find(
    (msg) => msg.role === "user"
  );

  if (!firstUserMessage) {
    return "New Chat";
  }

  return firstUserMessage.content.slice(0, 30);
}

function saveChats() {
  localStorage.setItem(
    "omega_multi_chats",
    JSON.stringify(chats)
  );

  localStorage.setItem(
    "omega_current_chat_id",
    currentChatId
  );
}

function createNewChat() {
  const chatId = generateChatId();

  chats[chatId] = {
    id: chatId,
    title: "New Chat",
    messages: [],
    createdAt: Date.now(),
  };

  currentChatId = chatId;

  saveChats();
  renderChatList();
  renderCurrentChat();

  userInput.focus();
}

function getCurrentChat() {
  if (!currentChatId || !chats[currentChatId]) {
    createNewChat();
  }

  return chats[currentChatId];
}

// ====================== RENAME CHAT ======================

function renameChat(chatId) {
  const chat = chats[chatId];

  if (!chat) return;

  const newTitle = prompt(
    "Enter a new chat name:",
    chat.title
  );

  if (!newTitle) return;

  const trimmedTitle = newTitle.trim();

  if (!trimmedTitle) return;

  chat.title = trimmedTitle;

  saveChats();
  renderChatList();
  renderCurrentChat();
}

// ====================== DELETE CHAT ======================

function deleteChat(chatId) {
  const chat = chats[chatId];

  if (!chat) return;

  const confirmed = confirm(
    `Delete "${chat.title}"?`
  );

  if (!confirmed) return;

  delete chats[chatId];

  const remainingChats = Object.keys(chats);

  if (remainingChats.length === 0) {
    createNewChat();
    return;
  }

  if (currentChatId === chatId) {
    currentChatId = remainingChats[0];
  }

  saveChats();
  renderChatList();
  renderCurrentChat();
}

// ====================== RENDER CHAT LIST ======================

function renderChatList() {
  chatList.innerHTML = "";

  const sortedChats = Object.values(chats).sort(
    (a, b) => b.createdAt - a.createdAt
  );

  sortedChats.forEach((chat) => {
    const item = document.createElement("div");

    item.className =
      "chat-item" +
      (chat.id === currentChatId ? " active" : "");

    // Title
    const title = document.createElement("span");
    title.textContent = chat.title || "New Chat";

    // Actions
    const actions = document.createElement("div");
    actions.className = "chat-actions-mini";

    // Rename
    const renameBtn =
      document.createElement("button");
    renameBtn.className = "chat-action-mini";
    renameBtn.textContent = "✏️";
    renameBtn.title = "Rename chat";

    renameBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      renameChat(chat.id);
    });

    // Delete
    const deleteBtn =
      document.createElement("button");
    deleteBtn.className = "chat-action-mini";
    deleteBtn.textContent = "🗑️";
    deleteBtn.title = "Delete chat";

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
    });

    actions.appendChild(renameBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(title);
    item.appendChild(actions);

    // Select chat
    item.addEventListener("click", () => {
      currentChatId = chat.id;

      saveChats();
      renderChatList();
      renderCurrentChat();

      if (window.innerWidth <= 768) {
        sidebar.classList.remove("open");
      }
    });

    chatList.appendChild(item);
  });
}

// ====================== RENDER CURRENT CHAT ======================

function renderCurrentChat() {
  const chat = getCurrentChat();

  chatContainer.innerHTML = "";

  chatTitle.textContent = chat.title || "New Chat";

  chat.messages.forEach((msg) => {
    const div = document.createElement("div");

    const isTyping =
      msg.role === "assistant" &&
      msg.content === "Omega AI is typing...";

    div.className =
      "msg " +
      (msg.role === "user" ? "user" : "bot") +
      (isTyping ? " typing" : "");

    div.textContent = msg.content;

    chatContainer.appendChild(div);
  });

  chatContainer.scrollTop =
    chatContainer.scrollHeight;
}

// ====================== SEND MESSAGE ======================

async function sendMessage() {
  const text = userInput.value.trim();

  if (!text) return;

  const chat = getCurrentChat();

  // Add user message
  chat.messages.push({
    role: "user",
    content: text,
  });

  // Set title from first user message
  if (
    chat.messages.filter(
      (msg) => msg.role === "user"
    ).length === 1
  ) {
    chat.title = getChatTitle(chat.messages);
  }

  // Add typing indicator
  chat.messages.push({
    role: "assistant",
    content: "Omega AI is typing...",
  });

  saveChats();
  renderChatList();
  renderCurrentChat();

  userInput.value = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: text,
      }),
    });

    const data = await response.json();

    // Replace typing indicator
    chat.messages[
      chat.messages.length - 1
    ].content =
      data.reply || "No response";

    saveChats();
    renderCurrentChat();
  } catch (error) {
    console.error(error);

    // Replace typing indicator
    chat.messages[
      chat.messages.length - 1
    ].content =
      "Error connecting to AI";

    saveChats();
    renderCurrentChat();
  }
}

// ====================== CLEAR CURRENT CHAT ======================

function clearCurrentChat() {
  const chat = getCurrentChat();

  chat.messages = [];
  chat.title = "New Chat";

  saveChats();
  renderChatList();
  renderCurrentChat();
}

// ====================== SIGN UP ======================

signupBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password =
    passwordInput.value.trim();

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  const { error } =
    await supabaseClient.auth.signUp({
      email,
      password,
    });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Signup successful!");
});

// ====================== LOGIN ======================

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password =
    passwordInput.value.trim();

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  const { error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    alert(error.message);
    return;
  }

  authModal.style.display = "none";
});

// ====================== CHECK LOGIN ======================

async function checkUser() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (session) {
    authModal.style.display = "none";
  } else {
    authModal.style.display = "flex";
  }
}

// ====================== LOGOUT ======================

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

sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

clearBtn.addEventListener(
  "click",
  clearCurrentChat
);

logoutBtn.addEventListener("click", logout);

newChatBtn.addEventListener(
  "click",
  createNewChat
);

menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// ====================== INITIALIZATION ======================

if (
  !currentChatId ||
  !chats[currentChatId]
) {
  createNewChat();
} else {
  renderChatList();
  renderCurrentChat();
}

checkUser();
