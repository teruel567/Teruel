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
    addMessage(msg.role, msg.display || msg.content);
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

// ===================== STREAMING =====================
function createStreamingBubble() {
  const bubble = document.createElement('div');
  bubble.className = 'message assistant';
  bubble.innerHTML = `<p class="streaming-text">...</p>`;
  chatContainer.appendChild(bubble);
  scrollToBottom();
  return bubble.querySelector('.streaming-text');
}

// ===================== SEND MESSAGE =====================
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text && selectedImages.length === 0) return;

  addMessage('user', text || '📸 Image sent');

  // ⚠️ Only send TEXT to backend (safe for your model)
  chatHistory.push({
    role: "user",
    content: text || "User sent an image",
    display: text || "📸 Image sent"
  });

  userInput.value = '';
  selectedImages = [];
  renderPreviews();

  const streamingEl = createStreamingBubble();
  let fullResponse = '';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatHistory,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error("API error: " + response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (let line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.replace('data: ', '');

          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;

            if (typeof delta === "string") {
              fullResponse += delta;
              streamingEl.innerHTML = marked.parse(fullResponse);
              scrollToBottom();
            }
          } catch {}
        }
      }
    }

    chatHistory.push({
      role: "assistant",
      content: fullResponse,
      display: fullResponse
    });

    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));

  } catch (err) {
    console.error(err);
    streamingEl.textContent = "⚠️ Error: " + err.message;
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
