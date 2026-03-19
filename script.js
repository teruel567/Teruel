const messages = document.getElementById("messages");
const input = document.getElementById("input");

// BUSINESS DATA (clients can edit this easily)
const businessData = {
  name: "SmartBiz Assistant",
  services: "We offer web design, chatbot development, and automation.",
  pricing: "Our pricing starts from $10 depending on your needs.",
  contact: "Email us at example@email.com"
};

// SEND MESSAGE
function sendMessage() {
  const text = input.value.trim();
  if (text === "") return;

  addMessage(text, "user");
  input.value = "";

  setTimeout(() => {
    botReply(text);
  }, 500);
}

// ADD MESSAGE TO CHAT
function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  messages.appendChild(msg);

  if (sender === "bot") {
    typeMessage(text, msg);
  } else {
    msg.textContent = text;
  }

  messages.scrollTop = messages.scrollHeight;
}

// TYPING EFFECT
function typeMessage(text, element) {
  let i = 0;
  let interval = setInterval(() => {
    element.textContent += text[i];
    i++;
    if (i === text.length) clearInterval(interval);
  }, 20);
}

// BOT RESPONSE LOGIC
function botReply(inputText) {
  let text = inputText.toLowerCase();

  if (text.includes("hello") || text.includes("hi")) {
    addMessage("Hello 👋 How can I help you today?", "bot");
  }
  else if (text.includes("service")) {
    addMessage(businessData.services, "bot");
  }
  else if (text.includes("price")) {
    addMessage(businessData.pricing, "bot");
  }
  else if (text.includes("contact")) {
    addMessage(businessData.contact, "bot");
  }
  else {
    addMessage("I'm not sure about that 🤔. Please choose an option below or ask something else!", "bot");
  }
}

// QUICK REPLIES
function quickReply(type) {
  if (type === "services") {
    addMessage("Services", "user");
    addMessage(businessData.services, "bot");
  }
  if (type === "pricing") {
    addMessage("Pricing", "user");
    addMessage(businessData.pricing, "bot");
  }
  if (type === "contact") {
    addMessage("Contact", "user");
    addMessage(businessData.contact, "bot");
  }
}

// ENTER KEY SEND
input.addEventListener("keypress", function(e) {
  if (e.key === "Enter") sendMessage();
});

// WELCOME MESSAGE
window.onload = () => {
  setTimeout(() => {
    addMessage("Hi 👋 Welcome! How can I help you today?", "bot");
  }, 500);
};
