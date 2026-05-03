let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatContainer = document.getElementById('chatContainer');
const clearBtn = document.getElementById('clearBtn');

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addMessage(role, content = '') {
  const bubble = document.createElement('div');
  bubble.className = `message ${role}`;
  bubble.innerHTML = `<p></p>`;
  chatContainer.appendChild(bubble);
  return bubble.querySelector('p');
}

function addWelcome() {
  const p = addMessage("assistant");
  p.textContent = "Hello! I’m your AI assistant. How can I help you today?";
}

function restoreChat() {
  chatContainer.innerHTML = '';
  if (chatHistory.length === 0) {
    addWelcome();
    return;
  }
  chatHistory.forEach(msg => {
    const p = addMessage(msg.role);
    p.textContent = msg.content;
  });
  scrollToBottom();
}

// ===================== STREAMING =====================
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  // Add user message
  addMessage('user').textContent = text;
  chatHistory.push({ role: "user", content: text });
  userInput.value = '';

  // Create assistant message bubble
  const assistantText = addMessage('assistant');
  scrollToBottom();

  let fullResponse = '';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              fullResponse += data.content;
              assistantText.textContent = fullResponse;
              scrollToBottom();
            }
          } catch (e) {}
        }
      }
    }

    // Save to history
    chatHistory.push({ role: "assistant", content: fullResponse });
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));

  } catch (err) {
    console.error(err);
    assistantText.textContent = "⚠️ Error occurred while getting response.";
  }
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

clearBtn.addEventListener('click', () => {
  if (confirm("Clear chat history?")) {
    chatHistory = [];
    localStorage.removeItem("chatHistory");
    restoreChat();
  }
});

// Initialize
restoreChat();
