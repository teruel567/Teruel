// ====================== SUPABASE ======================

const SUPABASE_URL = "https://twnphrrfcbzbuovcxujg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_K4oguvLu8U5cti-YP32yHw_DkF6LqEB";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ====================== ELEMENTS ======================

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const newChatBtn = document.getElementById("newChatBtn");
const chatList = document.getElementById("chatList");

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

// ====================== STATE ======================

let chats = JSON.parse(localStorage.getItem("omega_chats_v2")) || {};
let currentChatId = localStorage.getItem("omega_current_chat") || null;
let realtimeChannel = null;

// ====================== HELPERS ======================

function generateId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

function saveLocal() {
  localStorage.setItem("omega_chats_v2", JSON.stringify(chats));
  localStorage.setItem("omega_current_chat", currentChatId || "");
}

function getCurrentMessages() {
  if (!currentChatId || !chats[currentChatId]) return [];
  return chats[currentChatId].messages;
}

function setCurrentMessages(messages) {
  if (!currentChatId || !chats[currentChatId]) return;

  chats[currentChatId].messages = messages;
  chats[currentChatId].updated_at = new Date().toISOString();

  saveLocal();
}

// ====================== UI ======================

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ====================== SIDEBAR ======================

if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.toggle("open");
  });
}

document.addEventListener("click", (e) => {
  if (
    window.innerWidth <= 768 &&
    sidebar &&
    sidebar.classList.contains("open") &&
    !sidebar.contains(e.target) &&
    !sidebarToggle.contains(e.target)
  ) {
    sidebar.classList.remove("open");
  }
});

// ====================== CHAT CORE ======================

function createNewChat() {
  const id = generateId();

  chats[id] = {
    id,
    title: "New Chat",
    messages: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted: false,
  };

  currentChatId = id;

  saveLocal();
  renderChatList();
  renderMessages();
  syncCurrentChatToCloud();
}

function selectChat(id) {
  currentChatId = id;

  saveLocal();
  renderChatList();
  renderMessages();
}

function renameChat(id) {
  const newTitle = prompt("Rename chat:", chats[id].title);
  if (!newTitle) return;

  chats[id].title = newTitle.trim();
  chats[id].updated_at = new Date().toISOString();

  saveLocal();
  renderChatList();
  syncCurrentChatToCloud();
}

async function deleteChat(id) {
  if (!confirm("Delete this chat?")) return;

  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session) {
    await supabaseClient
      .from("chats")
      .update({ deleted: true })
      .eq("id", id)
      .eq("user_id", session.user.id);
  }

  delete chats[id];

  if (currentChatId === id) {
    const remaining = Object.keys(chats);
    currentChatId = remaining.length ? remaining[0] : null;
  }

  saveLocal();
  renderChatList();
  renderMessages();

  if (!currentChatId) createNewChat();
}

window.renameChat = renameChat;
window.deleteChat = deleteChat;

// ====================== RENDER ======================

function renderChatList() {
  if (!chatList) return;

  chatList.innerHTML = "";

  Object.values(chats)
    .filter(c => !c.deleted)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .forEach(chat => {
      const div = document.createElement("div");

      div.className = "chat-item" + (chat.id === currentChatId ? " active" : "");

      div.innerHTML = `
        <span>${escapeHtml(chat.title)}</span>
        <div>
          <button onclick="renameChat('${chat.id}')">✏️</button>
          <button onclick="deleteChat('${chat.id}')">🗑️</button>
        </div>
      `;

      div.addEventListener("click", (e) => {
        if (e.target.tagName === "BUTTON") return;
        selectChat(chat.id);
      });

      chatList.appendChild(div);
    });
}

function renderMessages() {
  if (!chatBox) return;

  chatBox.innerHTML = "";

  if (!currentChatId || !chats[currentChatId]) return;

  chats[currentChatId].messages.forEach(msg => {
    const div = document.createElement("div");
    div.className = "msg " + (msg.role === "user" ? "user" : "bot");

    div.textContent = msg.content;
    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

// ====================== CLOUD ======================

async function syncCurrentChatToCloud() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session || !currentChatId || !chats[currentChatId]) return;

  const chat = chats[currentChatId];

  await supabaseClient.from("chats").upsert({
    id: chat.id,
    user_id: session.user.id,
    title: chat.title,
    messages: chat.messages,
    updated_at: new Date().toISOString(),
    deleted: false,
  });
}

async function loadChatsFromCloud() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;

  const { data } = await supabaseClient
    .from("chats")
    .select("*")
    .eq("user_id", session.user.id);

  const cloud = {};

  data.forEach(chat => {
    if (chat.deleted) return;

    cloud[chat.id] = chat;
  });

  chats = { ...chats, ...cloud };

  saveLocal();
  renderChatList();
  renderMessages();
}

// ====================== REALTIME ======================

function startRealtimeSync(session) {
  if (!session) return;

  if (realtimeChannel) {
    supabaseClient.removeChannel(realtimeChannel);
  }

  realtimeChannel = supabaseClient
    .channel("chats-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "chats",
        filter: `user_id=eq.${session.user.id}`,
      },
      (payload) => {
        const chat = payload.new;
        if (!chat) return;

        if (chat.deleted) {
          delete chats[chat.id];
        } else {
          chats[chat.id] = chat;
        }

        saveLocal();
        renderChatList();
        renderMessages();
      }
    )
    .subscribe();
}

// ====================== SEND ======================

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  if (!currentChatId) createNewChat();

  const messages = getCurrentMessages();

  messages.push({ role: "user", content: text });

  setCurrentMessages(messages);

  renderChatList();
  renderMessages();

  userInput.value = "";

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text }),
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  const assistantMessage = { role: "assistant", content: "" };
  messages.push(assistantMessage);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    assistantMessage.content += decoder.decode(value);
    setCurrentMessages(messages);
    renderMessages();
  }

  renderChatList();
  syncCurrentChatToCloud();
}

// ====================== CLEAR ======================

function clearCurrentChat() {
  if (!currentChatId) return;

  chats[currentChatId].messages = [];
  saveLocal();

  renderMessages();
  renderChatList();
  syncCurrentChatToCloud();
}

// ====================== AUTH ======================

async function checkUser() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session) {
    authModal.style.display = "none";

    await loadChatsFromCloud();
    startRealtimeSync(session);

    if (!currentChatId) createNewChat();
  } else {
    authModal.style.display = "flex";
  }

  renderChatList();
  renderMessages();
}

// ====================== EVENTS ======================

sendBtn?.addEventListener("click", sendMessage);
userInput?.addEventListener("keydown", e => e.key === "Enter" && sendMessage());
clearBtn?.addEventListener("click", clearCurrentChat);
newChatBtn?.addEventListener("click", createNewChat);

logoutBtn?.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  location.reload();
});

// ====================== INIT ======================

checkUser();
