// script.js
let selectedImages = [];

const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatContainer = document.getElementById('chatContainer');

// Handle image upload
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
      <img src="${base64}">
      <button style="position:absolute; top:-8px; right:-8px; background:#ef4444; color:white; border:none; border-radius:50%; width:24px; height:24px; font-size:14px; cursor:pointer;">×</button>
    `;
    div.querySelector('button').onclick = () => {
      selectedImages.splice(index, 1);
      renderPreviews();
    };
    imagePreview.appendChild(div);
  });
}

// Send message
async function sendMessage() {
  const text = userInput.value.trim();

  if (!text && selectedImages.length === 0) return;

  // Build content for Groq (text + images)
  const content = [];
  content.push({ type: "text", text: text || "Please analyze these images!" });

  selectedImages.forEach(base64 => {
    content.push({
      type: "image_url",
      image_url: { url: base64 }
    });
  });

  // Show user message
  addMessage('user', text || '📸 Image sent', selectedImages);

  // Clear input
  const imagesToSend = [...selectedImages];
  userInput.value = '';
  selectedImages = [];
  renderPreviews();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content }]
      })
    });

    if (!response.ok) throw new Error('API error');

    const data = await response.json();
    addMessage('assistant', data.content || "I couldn't process that.");
  } catch (err) {
    console.error(err);
    addMessage('assistant', "Sorry, something went wrong 😓 Try again!");
  }
}

function addMessage(role, text, images = []) {
  const bubble = document.createElement('div');
  bubble.className = `message ${role}`;
  
  let html = `<p style="margin: 0 0 10px 0;">${text}</p>`;
  
  if (images && images.length > 0) {
    images.forEach(src => {
      html += `<img src="${src}">`;
    });
  }
  
  bubble.innerHTML = html;
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Attach events
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});
