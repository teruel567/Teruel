// ===================== STATE =====================
let selectedImages = [];
let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

// ===================== ELEMENTS =====================
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatContainer = document.getElementById('chatContainer');
const clearBtn = document.getElementById('clearBtn');

// ===================== SCROLL =====================
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ===================== WELCOME =====================
function addWelcome() {
  addMessage("assistant", "Hello! I’m your AI assistant. How can I help you today?");
}

function restoreChat() {
  if (chatHistory.length === 0) {
    addWelcome();
    return;
  }

  chatHistory.forEach(msg => {
    addMessage(msg.role, msg.content);
  });
}

// ===================== IMAGE HANDLING =====================
imageUpload.addEventListener('change', (e) => {
  const files = Array.from(e.target.files || []);
  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        selectedImages.push(ev.target.result);
        renderPreviews();
      };
      reader.readAsDataURL(file);
    }
  });
});

function renderPreviews() {
  imagePreview.innerHTML = '';
  selectedImages.forEach((base64, index) => {
    const div = document.createElement('div');
    div.style.position = 'relative';

    div.innerHTML = `
      <img src="${base64}" style="height:85px;border-radius:10px;border:2px solid #555;">
      <button style="position:absolute;top:-8px;right:-8px;background:red;color:white;border:none;border-radius:50%;width:22px;height:22px;">×</button>
    `;

    div.querySelector('button').onclick = () => {
      selectedImages.splice(index, 1);
      renderPreviews();
    };

    imagePreview.appendChild(div);
  });
}

// ===================== MESSAGE =====================
function addMessage(role, text) {
  const bubble = document.createElement('div');
  bubble.className = `message ${role}`;

  bubble.innerHTML = role === "assistant" && window.marked
    ? marked.parse(text)
    : `<p>${text}</p>`;

  chatContainer.appendChild(bubble);
  scrollToBottom();
}

// ===================== SEND MESSAGE =====================
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text && selectedImages.length === 0) return;

  addMessage('user', text || '📸 Image sent');

  // Only send text (safe for your current backend)
  chatHistory.push({
    role: "user",
    content: text || "User sent an image"
  });

  userInput.value = '';
  selectedImages = [];
  renderPreviews();

  // Show temporary loading message
  const loadingBubble = addMessage('assistant', '...');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory })
    });

    if (!response.ok) {
      throw new Error("API error: " + response.status);
    }

    const data = await response.json();

    // Replace loading text with real response
    loadingBubble.innerHTML = window.marked
      ? marked.parse(data.content)
      : `<p>${data.content}</p>`;

    // Save response
    chatHistory.push({
      role: "assistant",
      content: data.content
    });

    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));

    scrollToBottom();

  } catch (err) {
    console.error(err);
    loadingBubble.innerHTML = `<p>⚠️ Error: ${err.message}</p>`;
  }
}

// ===================== EVENTS =====================
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

clearBtn.addEventListener('click', () => {
  if (confirm("Clear chat?")) {
    chatHistory = [];
    localStorage.removeItem("chatHistory");
    chatContainer.innerHTML = '';
    addWelcome();
  }
});

// ===================== INIT =====================
restoreChat();
