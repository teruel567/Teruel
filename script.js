// ===============================
// BUSINESS DATA (EDIT THIS FOR CLIENTS)
// ===============================
const businessData = {
  name: "SmartBiz Assistant",
  services: "We offer website development, chatbot creation, and automation services.",
  pricing: "Our pricing starts from $50 depending on your needs.",
  contact: "You can contact us at: smartbiz@email.com"
};

// ===============================
// DOM ELEMENTS
// ===============================
const messages = document.getElementById("messages");
const input = document.getElementById("input");

// ===============================
// ADD MESSAGE FUNCTION
// ===============================
function addMessage(text, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);

  messageDiv.textContent = text;
  messages.appendChild(messageDiv);

  messages.scrollTop = messages.scrollHeight;
}

// ===============================
// BOT RESPONSE LOGIC
// ===============================
function botReply(inputText) {
  const text = inputText.toLowerCase();

  if (text.includes("hello") || text.includes("hi")) {
    addMessage("Hello 👋 How can I help you today?", "bot");
  }

  else if (text.includes("service")) {
    addMessage(businessData.services, "bot");
  }

  else if (text.includes("price") || text.includes("cost")) {
    addMessage(businessData.pricing, "bot");
  }

  else if (text.includes("contact") || text.includes("email")) {
    addMessage(businessData.contact, "bot");
  }

  else if (text.includes("about")) {
    addMessage("We provide professional chatbot solutions for businesses.", "bot");
  }

  else if (text.includes("help")) {
    addMessage("I can help you with services, pricing, or contact info 😊", "bot");
  }

  else if (text.includes("what")) {
    addMessage("I focus on business-related questions like services, pricing, or contact info.", "bot");
  }

  else {
    addMessage("I can help with services, pricing, or contact. Please choose an option below 👇", "bot");
  }
}

// ===============================
// SEND MESSAGE FUNCTION
// ===============================
function sendMessage() {
  const text = input.value.trim();

  if (text === "") return;

  addMessage(text, "user");
  input.value = "";

  setTimeout(() => {
    botReply(text);
  }, 500);
}

// ===============================
// ENTER KEY SUPPORT
// ===============================
input.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// ===============================
// BUTTON ACTIONS (OPTION BUTTONS)
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
// INITIAL WELCOME MESSAGE
// ===============================
window.onload = function () {
  addMessage(
    `Hi 👋 Welcome to ${businessData.name}! I can help you with services, pricing, or contact info.`,
    "bot"
  );
};
