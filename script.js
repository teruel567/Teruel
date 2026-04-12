// script.js - Streaming Version
let selectedImages = [];

const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatContainer = document.getElementById('chatContainer');

// Welcome message
function addWelcome() {
  const welcome = document.createElement('div');
  welcome.className = 'message assistant';
  welcome.innerHTML = `<p>Hey! 👋 I'm your AI assistant from Lagos. How can I help you today? Send a message or upload an image 📸</p>`;
  chatContainer.appendChild(welcome);
  scrollToBottom();
}
addWelcome();

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Image upload + preview
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
      <img src="${base64}" style="height:85px; border-radius:10px; object-fit:cover; border:2px solid #555;">
      <button style="position:absolute; top:-8px; right:-8px; background:#ef4444; color:white; border:none; border-radius:50%; width:24px; height:24px; font-size:14px; cursor:pointer;">×</button>
    `;
    div.querySelector('button').onclick = () => {
      selectedImages.splice(index, 1);
      renderPreviews();
    };
    imagePreview.appendChild(div);
  });
}

// Add message (for user and final assistant)
function addMessage(role, text, images = []) {
  const bubble = document.createElement('div');
  bubble.className = `message ${role}`;
  
  let html = `<p style="margin: 0 0 10px 0;">${text}</p>`;
  if (images && images.length > 0) {
    images.forEach(src => {
      html += `<img src="${src}" style="max-width:100%; border-radius:12px; margin-top:8px;">`;
    });
  }
  bubble.innerHTML = html;
  chatContainer.appendChild(bubble);
  scrollToBottom();
}

// Create a streaming assistant bubble
function createStreamingBubble() {
  const bubble = document.createElement('div');
  bubble.className = 'message assistant';
  bubble.innerHTML = `<p id="streaming-text"></p>`;
  chatContainer.appendChild(bubble);
  scrollToBottom();
  return bubble.querySelector('#streaming-text');
}

// Send message with streaming
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text && selectedImages.length === 0) return;

  // Show user message
  addMessage('user', text || '📸 Image(s) sent', selectedImages);

  const currentImages = [...selectedImages];
  userInput.value = '';
  selectedImages = [];
  renderPreviews();

  // Create streaming bubble
  const streamingTextEl = createStreamingBubble();
  let fullResponse = '';

  try {
    const content = [];
    content.push({ type: "text", text: text || "Please analyze these images and describe what you see in detail." });

    currentImages.forEach(base64 => {
      content.push({ type: "image_url", image_url: { url: base64 } });
    });

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content }],
        stream: true   // ← Enable streaming
      })
    });

    if (!response.ok) throw new Error('API error');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullResponse += delta;
              streamingTextEl.textContent = fullResponse;
              scrollToBottom();
            }
          } catch (e) {
            // Ignore parsing errors for incomplete chunks
          }
        }
      }
    }

  } catch (err) {
    console.error(err);
    streamingTextEl.textContent = "Sorry, something went wrong 😓 Try again!";
  }
}

// Events
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});
