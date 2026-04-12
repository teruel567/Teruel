// script.js
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
  chatContainer.scrollTop = chatContainer.scrollHeight;
}
addWelcome();

// Image upload handling
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

// Add message to chat
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
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Send message
async function sendMessage() {
  const text = userInput.value.trim();

  if (!text && selectedImages.length === 0) return;

  // Show user message
  addMessage('user', text || '📸 Image(s) sent', selectedImages);

  const currentImages = [...selectedImages];
  userInput.value = '';
  selectedImages = [];
  renderPreviews();

  // Show thinking indicator
  const thinking = document.createElement('div');
  thinking.className = 'message assistant';
  thinking.textContent = 'Thinking... 🤔';
  chatContainer.appendChild(thinking);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    const content = [];
    content.push({ type: "text", text: text || "Please analyze these images and describe what you see." });

    currentImages.forEach(base64 => {
      content.push({ type: "image_url", image_url: { url: base64 } });
    });

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content }]
      })
    });

    if (!response.ok) throw new Error('API error');

    const data = await response.json();
    thinking.remove();
    addMessage('assistant', data.content || "I couldn't process that.");
  } catch (err) {
    console.error(err);
    thinking.remove();
    addMessage('assistant', "Sorry, something went wrong 😓 Try again!");
  }
}

// Events
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});
