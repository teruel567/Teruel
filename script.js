// script.js - Clean Chatbot Frontend

let messageCount = 0;

const messagesDiv = document.getElementById('messages');
const inputField = document.getElementById('input');
const msgCountSpan = document.getElementById('msgCount');
const modeSelect = document.getElementById('mode');

function addMessage(role, content) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `msg ${role}`;
  msgDiv.textContent = content;
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function clearChat() {
  if (confirm("Clear all messages?")) {
    messagesDiv.innerHTML = '';
    messageCount = 0;
    msgCountSpan.textContent = '0';
  }
}

async function sendMessage() {
  const userText = inputField.value.trim();
  if (!userText) return;

  addMessage('user', userText);
  inputField.value = '';

  messageCount++;
  msgCountSpan.textContent = messageCount;

  const thinkingDiv = document.createElement('div');
  thinkingDiv.className = 'msg bot';
  thinkingDiv.textContent = 'Thinking...';
  messagesDiv.appendChild(thinkingDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: userText }],
        mode: modeSelect.value
      })
    });

    const data = await response.json();
    const botReply = data.reply || "Sorry, I couldn't generate a response.";

    thinkingDiv.remove();
    addMessage('bot', botReply);

  } catch (error) {
    console.error(error);
    thinkingDiv.textContent = "❌ Could not connect to AI. Please try again.";
  }
}

inputField.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

document.getElementById('imageInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    alert(`📸 Image selected: ${file.name}\n\nImage analysis support coming soon!`);
    e.target.value = '';
  }
});

window.onload = () => {
  setTimeout(() => {
    addMessage('bot', "Hey! 👋 I'm your AI Assistant.\nHow can I help you today?");
  }, 600);
};
