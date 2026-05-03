let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatContainer = document.getElementById('chatContainer');
const clearBtn = document.getElementById('clearBtn');

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addMessage(role, text) {
  const bubble = document.createElement('div');
  bubble.className = `message ${role}`;
  bubble.innerHTML = `<p>${text}</p>`;
  chatContainer.appendChild(bubble);
  scrollToBottom();
}

function addWelcome() {
  addMessage("assistant", "Hello! I’m your AI assistant. How can I help you today?");
}

function restoreChat() {
  chatContainer.innerHTML = '';
  if (chatHistory.length === 0) {
    addWelcome();
    return;
  }
  chatHistory.forEach(msg => addMessage(msg.role, msg.content));
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage('user', text);
  
  chatHistory.push({ role: "user", content: text });
  userInput.value = '';

  const loadingBubble = document.createElement('div');
  loadingBubble.className = 'message assistant';
  loadingBubble.innerHTML = `<p>Thinking...</p>`;
  chatContainer.appendChild(loadingBubble);
  scrollToBottom();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory })
    });

    const data = await response.json();

    loadingBubble.remove();

    if (response.ok) {
      addMessage('assistant', data.content);
      chatHistory.push({ role: "assistant", content: data.content });
    } else {
      addMessage('assistant', data.content || "Sorry, something went wrong.");
    }

    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));

  } catch (err) {
    loadingBubble.remove();
    addMessage('assistant', "⚠️ Connection error. Please check your internet.");
    console.error(err);
  }
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

clearBtn.addEventListener('click', () => {
  if (confirm("Clear entire chat history?")) {
    chatHistory = [];
    localStorage.removeItem("chatHistory");
    restoreChat();
  }
});

// Initialize
restoreChat();
