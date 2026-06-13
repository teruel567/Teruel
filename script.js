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
const sidebarToggle =
  document.getElementById("sidebarToggle");
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

let chats = {};
let currentChatId = null;

// ====================== HELPERS ======================

function generateId() {
  return (
    Date.now().toString() +
    Math.random().toString(36).substring(2, 9)
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

  renderChatList();
  syncCurrentChatToCloud();
}
async function deleteChat(chatId) {
  if (!confirm("Delete this chat?")) return;

  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    // DELETE FROM SUPABASE
    if (session) {
      const { error } = await supabaseClient
        .from("chats")
        .delete()
        .eq("id", chatId)
        .eq("user_id", session.user.id);

      if (error) {
        console.error(error);
        alert("Failed to delete chat");
        return;
      }
    }

    // DELETE FROM LOCAL MEMORY
    delete chats[chatId];

    // FIX CURRENT CHAT
    if (currentChatId === chatId) {
      const remaining = Object.keys(chats);

      currentChatId =
        remaining.length > 0
          ? remaining[0]
          : null;
    }

    // UPDATE UI
    renderChatList();
    renderMessages();

    // CREATE NEW CHAT IF NONE LEFT
    if (!currentChatId) {
      createNewChat();
    }

  } catch (error) {
    console.error("Delete error:", error);
  }
}

// Make functions available globally
window.renameChat = renameChat;
window.deleteChat = deleteChat;

// ====================== RENDER CHAT LIST ======================

let selectedChatId = null;

function openChatSheet(chatId) {
  selectedChatId = chatId;

  document
    .getElementById("chatSheetOverlay")
    .classList.add("show");

  document
    .getElementById("chatSheet")
    .classList.add("show");
}

function closeChatSheet() {
  document
    .getElementById("chatSheetOverlay")
    .classList.remove("show");

  document
    .getElementById("chatSheet")
    .classList.remove("show");
}

function renameSelectedChat() {
  closeChatSheet();

  if (selectedChatId) {
    renameChat(selectedChatId);
  }
}

function deleteSelectedChat() {
  closeChatSheet();

  if (selectedChatId) {
    deleteChat(selectedChatId);
  }
}

window.renameSelectedChat =
  renameSelectedChat;

window.deleteSelectedChat =
  deleteSelectedChat;

window.openChatSheet =
  openChatSheet;

window.closeChatSheet =
  closeChatSheet;

function renderChatList() {
  if (!chatList) return;

  chatList.innerHTML = "";

  const sortedChats = Object.values(chats).sort(
    (a, b) =>
      new Date(b.updated_at) -
      new Date(a.updated_at)
  );

  sortedChats.forEach((chat) => {
    const item =
      document.createElement("div");

    item.className =
      "chat-item" +
      (chat.id === currentChatId
        ? " active"
        : "");

    item.innerHTML = `
      <span class="chat-title">
        ${escapeHtml(chat.title)}
      </span>

      <button
        class="chat-menu-btn"
        onclick="event.stopPropagation(); openChatSheet('${chat.id}')"
      >
        ⋮
      </button>
    `;

    item.addEventListener(
      "click",
      () => selectChat(chat.id)
    );

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
      div.innerHTML = DOMPurify.sanitize(
  marked.parse(msg.content || "")
);

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

    const { error } = await supabaseClient
      .from("chats")
      .upsert({
        id: chat.id,
        user_id: session.user.id,
        title: chat.title,
        messages: chat.messages,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error(error);
    }

  } catch (error) {
    console.error("Cloud sync error:", error);
  }
}

async function loadChatsFromCloud() {
  try {
    const { data: { session } } =
      await supabaseClient.auth.getSession();

    if (!session) return;

    const { data, error } = await supabaseClient
      .from("chats")
      .select("*")
      .eq("user_id", session.user.id);

    if (error) {
      console.error(error);
      return;
    }

    const cloudChats = {};

    data.forEach(chat => {
      // SKIP ANY DELETED CHAT
      if (chat.deleted) return;

      cloudChats[chat.id] = {
        id: chat.id,
        title: chat.title,
        messages: chat.messages || [],
        created_at: chat.created_at,
        updated_at: chat.updated_at
      };
    });

    // REPLACE local chats with cloud chats
chats = cloudChats;

// Fix invalid current chat
if (!chats[currentChatId]) {
  currentChatId = Object.keys(chats)[0] || null;
}

    renderChatList();
    renderMessages();

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
text.substring(0, 30) + (text.length > 30 ? "..." : "");
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
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messages: getCurrentMessages(),
  }),
});

if (!response.ok) {
  throw new Error("Failed to get AI response");
}

removeTypingIndicator();

// Create empty assistant message
const assistantMessage = {
  role: "assistant",
  content: "",
};

messages.push(assistantMessage);

renderMessages();

if (!response.body) {
  throw new Error("No response body");
}

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();

  if (done) break;

  const chunk = decoder.decode(value, {
  stream: true,
});

  if (chunk) {
  assistantMessage.content += chunk;
}

  setCurrentMessages(messages);

  renderMessages();
}

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

  renderMessages();
  renderChatList();
  syncCurrentChatToCloud();
}

// ====================== AUTH ======================

if (signupBtn) {
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
}

if (loginBtn) {
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

createNewChat();

renderChatList();
renderMessages();
    }
  );
}

async function checkUser() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (session) {
    authModal.style.display =
      "none";

    await loadChatsFromCloud();

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
      if (e.key === "Enter" && !e.shiftKey) {
  e.preventDefault();
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
