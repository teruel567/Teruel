// ================= SUPABASE SETUP =================
const supabaseUrl = "https://twnphrrfcbzbuovcxujg.supabase.co"; // <-- replace if needed
const supabaseKey = "sb_publishable_K4oguvLu8U5cti-YP32yHw_DkF6LqEB"; // <-- paste your key

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ================= STATE =================
let isLoading = false;

// ================= ELEMENTS =================
const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const authModal = document.getElementById("authModal");

// ================= INIT =================
  userInput.focus();
window.onload = async () => {
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    authModal.style.display = "flex";
  } else {
    authModal.style.display = "none";
  }

  addMessage("bot", "👋 Welcome to Omega AI Assistant.");
};

// ================= AUTH =================
async function handleSignUp() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    alert(error.message);
  } else {
    alert("Signup successful! You can now log in.");
  }
}

async function handleSignIn() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
  } else {
    authModal.style.display = "none";
  }
}

// 🔄 Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    authModal.style.display = "none";
  } else {
    authModal.style.display = "flex";
  }
});

// ================= ADD MESSAGE =================
function addMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = role === "user" ? "msg user" : "msg bot";
  msg.textContent = text;

  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  return msg;
}

// ================= SEND MESSAGE =================
async function sendMessage() {
  const message = userInput.value.trim();

  if (!message || isLoading) return;

  isLoading = true;
  sendBtn.disabled = true;

  addMessage("user", message);
  userInput.value = "";

  const botMsg = addMessage("bot", "Typing...");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    if (!res.ok) {
      throw new Error("Server error");
    }

    const data = await res.json();

    botMsg.textContent = data.reply || "⚠️ No response from AI";

  } catch (error) {
    console.error(error);
    botMsg.textContent = "⚠️ Error connecting to AI";
  }

  isLoading = false;
  sendBtn.disabled = false;
}

// ================= CLEAR CHAT =================
clearBtn.addEventListener("click", () => {
  if (isLoading) return;

  const confirmClear = confirm("Clear all chat?");
  if (confirmClear) {
    chatContainer.innerHTML = "";
    addMessage("bot", "🧹 Chat cleared.");
  }
});

// ================= EVENTS =================
sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
