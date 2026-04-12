// script.js - Image upload + sending logic

let selectedImages = []; // base64 strings

const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatContainer = document.getElementById('chatContainer'); // ← Change this to your actual chat messages container ID

// Image Upload
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
    div.style.display = 'inline-block';
    
    div.innerHTML = `
      <img src="${base64}" style="height: 85px; border-radius: 10px; object-fit: cover; border: 2px solid #444;">
      <button style="position: absolute; top: -8px; right: -8px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 14px; cursor: pointer;">×</button>
    `;
    
    div.querySelector('button').addEventListener('click', () => {
      selectedImages.splice(index, 1);
      renderPreviews();
    });
    
    imagePreview.appendChild(div);
  });
}

// Send Message
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text && selectedImages.length === 0) return;

  let content = [];
  if (text) content.push({ type: "text", text: text });
  else content.push({ type: "text", text: "Please analyze these images!" });

  selectedImages.forEach(base64 => {
    content.push({ 
      type: "image_url", 
      image_url: { url: base64 } 
    });
  });

  // Show user message
  addMessageToChat('user', text || '📸 Images sent', selectedImages);

  const imagesToSend = [...selectedImages];
  userInput.value = '';
  selectedImages = [];
  renderPreviews();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: "user", content }] })
    });

    const data = await response.json(); // For non-streaming fallback if needed
    addMessageToChat('assistant', data.content || "Thinking...");
  } catch (err) {
    console.error(err);
    addMessageToChat('assistant', "Sorry, something went wrong 😓");
  }
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// Helper to display messages (adapt to your existing chat UI)
function addMessageToChat(role, text, images = []) {
  if (!chatContainer) return; // Safety check

  const bubble = document.createElement('div');
  bubble.style.margin = '15px 0';
  bubble.style.padding = '14px 18px';
  bubble.style.borderRadius = '18px';
  bubble.style.maxWidth = '80%';
  bubble.style.background = role === 'user' ? '#f97316' : '#333';
  bubble.style.color = 'white';
  bubble.style.alignSelf = role === 'user' ? 'flex-end' : 'flex-start';
  bubble.style.display = 'inline-block';

  let html = `<p style="margin: 0 0 8px 0;">${text}</p>`;
  
  if (images && images.length > 0) {
    images.forEach(src => {
      html += `<img src="${src}" style="max-width: 100%; border-radius: 10px; margin-top: 8px;">`;
    });
  }
  
  bubble.innerHTML = html;
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
      }
