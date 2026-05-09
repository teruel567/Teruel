// ====================== SUPABASE ======================

const SUPABASE_URL = "https://twnphrrfcbzbuovcxujg.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_K4oguvLu8U5cti-YP32yHw_DkF6LqEB";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ====================== ELEMENTS ======================

const chatBox = document.getElementById("chatContainer");

const userInput = document.getElementById("userInput");

const sendBtn = document.getElementById("sendBtn");

const loginBtn = document.getElementById("loginBtn");

const signupBtn = document.getElementById("signupBtn");

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const clearBtn = document.getElementById("clearBtn");

const authModal = document.getElementById("authModal");

// ====================== CHAT STORAGE ======================

let messages =
  JSON.parse(localStorage.getItem("omega_chats")) || [];

// ====================== SAVE CHATS ======================

function saveChats() {
  localStorage.setItem(
    "omega_chats",
    JSON.stringify(messages)
  );
}

// ====================== RENDER CHATS ======================

function renderChats() {

  chatBox.innerHTML = "";

  messages.forEach((msg) => {

    const div = document.createElement("div");

    div.className =
      "msg " +
      (msg.role === "user" ? "user" : "bot");

    div.textContent = msg.content;

    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

renderChats();

// ====================== SIGN UP ======================

signupBtn.addEventListener("click", async () => {

  const email = emailInput.value.trim();

  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  try {

    const { data, error } =
      await supabaseClient.auth.signUp({
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

// ====================== LOGIN ======================

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

    authModal.style.display = "none";

    alert("Login successful!");

    console.log(data);

  } catch (err) {

    console.error(err);

    alert("Login failed");
  }
});

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

sendBtn.addEventListener(
  "click",
  sendMessage
);

// ====================== ENTER KEY ======================

userInput.addEventListener(
  "keydown",
  (e) => {

    if (e.key === "Enter") {
      sendMessage();
    }
  }
);

// ====================== CLEAR CHAT ======================

clearBtn.addEventListener(
  "click",
  () => {

    messages = [];

    localStorage.removeItem(
      "omega_chats"
    );

    renderChats();
  }
);

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

checkUser();
