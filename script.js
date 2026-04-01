  const messages = document.getElementById("messages");
const input = document.getElementById("input");
const imageUpload = document.getElementById("imageInput");
const msgCount = document.getElementById("msgCount");

let conversationHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
let stats = JSON.parse(localStorage.getItem("chatStats")) || { messages: 0 };

msgCount.innerText = stats.messages;

// ✅ Load previous messages (TEXT + IMAGE SUPPORT)
conversationHistory.forEach(msg => {
  const div = document.createElement("div");
  div.className = "msg " + (msg.role === "user" ? "user" : "bot");

  msg.content.forEach(item => {
    if (item.type === "text") {
      const span = document.createElement("span");
      span.innerHTML = item.text.replace(/```([\s\S]*?)```/g, "<pre>$1</pre>");
      div.appendChild(span);
    }

    if (item.type === "image_url") {
      const img = document.createElement("img");
      img.src = item.image_url.url;
      img.style.maxWidth = "200px";
      div.appendChild(img);
    }
  });

  messages.appendChild(div);
});

messages.scrollTop = messages.scrollHeight;

// ✅ Send Message
async function sendMessage() {
  let text = input.value.trim();
  const file = imageUpload.files[0];
  const mode = document.getElementById("mode");

  // Mode logic
  if (mode && mode.value === "code") {
    text = "Write clean, working code for: " + text;
  }

  if (mode && mode.value === "debug") {
    text = "Fix this code and explain the error: " + text;
  }

  if (!text && !file) return;

  let imageData = null;

  if (file) {
    imageData = await convertImage(file);
  }

  // ✅ Create user message (TEXT + IMAGE TOGETHER)
  const div = document.createElement("div");
  div.className = "msg user";

  if (text) {
    const span = document.createElement("span");
    span.textContent = text;
    div.appendChild(span);
  }

  if (imageData) {
    const img = document.createElement("img");
    img.src = imageData;
    img.style.maxWidth = "200px";
    div.appendChild(img);
  }

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;

  // ✅ Save message properly
  let userContent = [];

  if (text) {
    userContent.push({ type: "text", text: text });
  }

  if (imageData) {
    userContent.push({
      type: "image_url",
      image_url: { url: imageData }
    });
  }

  conversationHistory.push({
    role: "user",
    content: userContent
  });

  input.value = "";
  imageUpload.value = "";

  // Update stats
  stats.messages++;
  localStorage.setItem("chatStats", JSON.stringify(stats));
  msgCount.innerText = stats.messages;

  // Typing indicator
  const typingDiv = document.createElement("div");
  typingDiv.className = "msg bot";
  typingDiv.innerText = "AI is typing...";
  messages.appendChild(typingDiv);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        history: conversationHistory,
        image: imageData
      })
    });

    const data = await res.json();
    typingDiv.remove();

    typeMessage(data.reply);

    // Save bot reply
    conversationHistory.push({
      role: "assistant",
      content: [
        { type: "text", text: data.reply }
      ]
    });

    localStorage.setItem("chatHistory", JSON.stringify(conversationHistory));

  } catch (err) {
    typingDiv.remove();
    addMessage("Server error. Try again.", "bot");
  }
}

// ✅ Typing effect
function typeMessage(text) {
  const div = document.createElement("div");
  div.className = "msg bot";
  messages.appendChild(div);

  let i = 0;

  const interval = setInterval(() => {
    div.textContent += text.charAt(i);
    i++;

    messages.scrollTop = messages.scrollHeight;

    if (i >= text.length) {
      clearInterval(interval);
    }
  }, 20);
}

// ✅ Convert image to base64
function convertImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

// ✅ Clear chat
function clearChat() {
  localStorage.removeItem("chatHistory");
  conversationHistory = [];
  messages.innerHTML = "";
}

// Enter key support
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// Fallback message function
function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = "msg " + type;
  div.innerHTML = text;
  messages.appendChild(div);
}
