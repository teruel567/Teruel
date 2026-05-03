// ===================== STATE =====================
let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

// ===================== ELEMENTS =====================
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
  if (!text) return;

  addMessage('user', text);

  chatHistory.push({
    role: "user",
    content: text,
    display: text
  });

  userInput.value = '';

  const streamingEl = createStreamingBubble();
  let fullResponse = '';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatHistory,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error("API error: " + response.status);
    }

    const data = await response.json();
    const reply = data.content || "No response from AI";

    streamingEl.innerHTML = window.marked ? marked.parse(reply) : reply;
    scrollToBottom();

    fullResponse = reply;

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
