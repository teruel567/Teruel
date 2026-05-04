// ================= SUPABASE =================
const supabaseUrl = "https://twnphrrfcbzbuovcxujg.supabase.co";
const supabaseKey = "sb_publishable_K4oguvLu8U5cti-YP32yHw_DkF6LqEB";

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ================= ELEMENTS =================
const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const authModal = document.getElementById("authModal");

// ================= INIT =================
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

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) return alert(error.message);
  alert("Signup successful! Check your email.");
}

async function handleSignIn() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return alert(error.message);

  authModal.style.display = "none";
}

// ================= AUTH LISTENER =================
supabase.auth.onAuthStateChange((event, session) => {
  authModal.style.display = session ? "none" : "flex";
});

// ================= MESSAGE UI =================
function addMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = role === "user" ? "msg user" : "msg bot";
  msg.textContent = text;

  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ================= SEND MESSAGE =================
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage("user", message);
  userInput.value = "";

  const botMsg = document.createElement("div");
  botMsg.className = "msg bot";
  botMsg.textContent = "Typing...";
  chatContainer.appendChild(botMsg);

  try {
    const res = await fetch("/api/chat", {
      method: "POST", // 🔥 FIXED
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await res.json();

    botMsg.textContent = data.reply || "⚠️ No response";

  } catch (err) {
    console.error(err);
    botMsg.textContent = "⚠️ Error connecting to AI";
  }
}

// ================= EVENTS =================
sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

clearBtn.addEventListener("click", () => {
  chatContainer.innerHTML = "";
  addMessage("bot", "🧹 Chat cleared.");
});
