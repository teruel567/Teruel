// ===============================
// BUSINESS DATA
// ===============================
const businessData = {
  name: "SmartBiz Assistant",
  services: "We offer website development, chatbot creation, and automation services.",
  pricing: "Our pricing starts from $50 depending on your needs.",
  contact: "Contact us at: smartbiz@email.com"
};

// ===============================
// DOM
// ===============================
const messages = document.getElementById("messages");
const input = document.getElementById("input");

// ===============================
// ADD MESSAGE
// ===============================
function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;

  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

// ===============================
// BOT LOGIC (FIXED)
// ===============================
function botReply(userText) {
  const text = userText.toLowerCase();

  // Greeting
  if (text.includes("hello") || text.includes("hi")) {
    addMessage("Hello 👋 How can I help you today?", "bot");
  }

  // 🔥 IMPORTANT: specific answers FIRST
  else if (text.includes("english")) {
    addMessage("English is a global language used for communication, business, and education.", "bot");
  }

  // Services
  else if (text.includes("service")) {
    addMessage(businessData.services, "bot");
  }

  // Pricing
  else if (text.includes("price") || text.includes("cost")) {
    addMessage(businessData.pricing, "bot");
  }

  // Contact
  else if (text.includes("contact") || text.includes("email")) {
    addMessage(businessData.contact, "bot");
  }

  // General questions
  else if (text.includes("what is") || text.includes("who is")) {
    addMessage("I'm a business chatbot 🤖. I mainly help with services, pricing, and contact info.", "bot");
  }

  // Help
  else if (text.includes("help")) {
    addMessage("I can help with services, pricing, or contact info 😊", "bot");
  }

  // Default fallback
  else {
    addMessage("I didn’t understand that 😅. Try asking about services, pricing, or contact.", "bot");
  }
}

// ===============================
// SEND MESSAGE
// ===============================
function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  setTimeout(() => {
    botReply(text);
  }, 400);
}

// ===============================
// ENTER KEY
// ===============================
input.addEventListener("keypress", function (e) {
  if (e.key === "Enter") sendMessage();
});

// ===============================
// BUTTONS
// ===============================
function showServices() {
  addMessage(businessData.services, "bot");
}

function showPricing() {
  addMessage(businessData.pricing, "bot");
}

function showContact() {
  addMessage(businessData.contact, "bot");
}

// ===============================
// WELCOME MESSAGE
// ===============================
window.onload = () => {
  addMessage(
    `Hi 👋 Welcome to ${businessData.name}! Ask about services, pricing, or contact.`,
    "bot"
  );
};
