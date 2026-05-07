// ====================== SUPABASE ======================
;const SUPABASE_URL = "https://abcxyz.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOi...";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ====================== ELEMENTS ======================
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const clearBtn = document.getElementById("clearBtn");

// ====================== CHAT HISTORY ======================
let messages = JSON.parse(localStorage.getItem("omega_chats")) || [];

function saveChats() {
  localStorage.setItem("omega_chats", JSON.stringify(messages));
}

function renderChats() {
  if (!chatBox) return;

  chatBox.innerHTML = "";

  messages.forEach((msg) => {
    const div = document.createElement("div");
    div.className = msg.role;

    div.innerHTML = `
      <div class="message ${msg.role}">
        ${msg.content}
      </div>
    `;

    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

renderChats();

// ====================== SIGN UP ======================
if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        console.error(error);
        return;
      }

      alert("Signup successful!");

      console.log(data);
    } catch (err) {
      console.error(err);
      alert("Signup failed");
    }
  });
}

// ====================== LOGIN ======================
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    try {
      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        alert(error.message);
        console.error(error);
        return;
      }

      alert("Login successful!");

      console.log(data);
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  });
}

// ====================== SEND MESSAGE ======================
async function sendMessage() {
  const text = userInput.value.trim();

  if (!text) return;

  messages.push({
    role: "user",
    content: text,
  });

  renderChats();
  saveChats();

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

    messages.push({
      role: "assistant",
      content: data.reply || "No response",
    });

    renderChats();
    saveChats();
  } catch (error) {
    console.error(error);

    messages.push({
      role: "assistant",
      content: "Error connecting to AI",
    });

    renderChats();
  }
}

// ====================== SEND BUTTON ======================
if (sendBtn) {
  sendBtn.addEventListener("click", sendMessage);
}

// ====================== ENTER KEY ======================
if (userInput) {
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
}

// ====================== CLEAR CHAT ======================
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    messages = [];
    localStorage.removeItem("omega_chats");
    renderChats();
  });
}