document.addEventListener('DOMContentLoaded', () => {
  const messagesDiv = document.getElementById('messages');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const countEl = document.getElementById('message-count');

  function showWelcome() {
    messagesDiv.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center text-center px-4 py-12">
        <div class="text-6xl mb-6">👋</div>
        <p class="text-2xl font-light">Hey! I'm your AI Assistant.</p>
        <p class="text-gray-400 mt-3 text-lg">How can I help you today?</p>
      </div>
    `;
  }

  showWelcome();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userMessage = input.value.trim();
    if (!userMessage) return;

    addMessage(userMessage, 'user');
    input.value = '';
    sendBtn.disabled = true;
    sendBtn.textContent = '...';

    try {
      const response = await fetch('api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }]
        })
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      const aiReply = data.reply || "Sorry, I couldn't generate a response.";

      addMessage(aiReply, 'assistant');

    } catch (error) {
      console.error(error);
      addMessage("Error: Could not connect to AI. Please check your Groq API key on Vercel.", 'assistant');
    }

    sendBtn.disabled = false;
    sendBtn.textContent = 'Send';
    countEl.textContent = `Messages sent: ${Math.floor(messagesDiv.children.length / 2)}`;
  });

  function addMessage(text, role) {
    const isUser = role === 'user';
    const html = `
      <div class="flex ${isUser ? 'justify-end' : 'justify-start'}">
        <div class="max-w-[80%] rounded-3xl px-5 py-4 ${
          isUser 
            ? 'bg-orange-600 text-white' 
            : 'bg-gray-800 text-gray-100'
        }">
          ${text}
        </div>
      </div>
    `;
    messagesDiv.innerHTML += html;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
});
