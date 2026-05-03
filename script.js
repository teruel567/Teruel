// ================= BUSINESS DATA =================
const BUSINESS_INFO = `
Business Name: Omega Mobile Store

We sell smartphones and accessories.
We offer a 7-day refund policy.
We provide free nationwide delivery.
Customer support is available 24/7.
`;

// ================= STATE =================
let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
let isLoading = false;

// ================= ELEMENTS =================
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatContainer = document.getElementById('chatContainer');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');

// ================= DOWNLOAD =================
downloadBtn.addEventListener('click', () => {
  let text = "Chat History:\n\n";

  chatHistory.forEach(msg => {
    text += `${msg.role.toUpperCase()}: ${msg.content}\n\n`;
  });

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = "chat.txt";
  a.click();
});

// ================= FUNCTIONS =================
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addMessage(role) {
  const bubble = document.createElement('div');
  bubble.className = `message ${role}`;
  bubble.innerHTML = `<p></p>`;
  chatContainer.appendChild(bubble);
  return bubble.querySelector('p');
}

function addWelcome() {
  const p = addMessage("assistant");
  p.textContent = "👋 Welcome! Ask about products, delivery, or refunds.";
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

// ================= QUICK ASK =================
function quickAsk(text) {
  if (isLoading) return;
  userInput.value = text;
  sendMessage();
}

// ================= SEND MESSAGE =================
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || text.length < 2 || isLoading) return;

  isLoading = true;
  sendBtn.disabled = true;

  addMessage('user').textContent = text;
  chatHistory.push({ role: "user", content: text });

  userInput.value = '';
  userInput.focus();

  // Typing indicator
  const typingBubble = document.createElement('div');
  typingBubble.className = 'message assistant';
  typingBubble.innerHTML = '<p class="typing">Typing...</p>';
  chatContainer.appendChild(typingBubble);
  scrollToBottom();

  let fullResponse = '';
  let assistantText = null;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatHistory,
        businessData: BUSINESS_INFO
      })
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
              if (!assistantText) {
                typingBubble.remove();
                assistantText = addMessage('assistant');
              }

              fullResponse += data.content;
              assistantText.textContent = fullResponse;
              scrollToBottom();
            }
          } catch (e) {}
        }
      }
    }

    if (!fullResponse) {
      typingBubble.remove();
      assistantText = addMessage('assistant');
      assistantText.textContent = "⚠️ No response. Try again.";
    }

    chatHistory.push({ role: "assistant", content: fullResponse });
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));

  } catch (err) {
    console.error(err);
    typingBubble.remove();
    addMessage('assistant').textContent = "⚠️ Error. Try again.";
  }

  isLoading = false;
  sendBtn.disabled = false;
}

// ================= EVENTS =================
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

clearBtn.addEventListener('click', () => {
  if (confirm("Clear chat?")) {
    chatHistory = [];
    localStorage.removeItem("chatHistory");
    restoreChat();
  }
});

// ================= INIT =================
restoreChat();
