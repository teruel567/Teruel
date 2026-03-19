const messages = document.getElementById("messages");
const input = document.getElementById("input");

const API_URL = "https://teruel.onrender.com/api/chat";

function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerText = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function quickMsg(text) {
  input.value = text;
  sendMessage();
}

async function getAIResponse(message) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    return data.reply;

  } catch (error) {
    return "Error connecting to server.";
  }
}

async function sendMessage() {
  const msg = input.value.trim();
  if (!msg) return;

  addMessage(msg, "user");
  input.value = "";

  const typing = document.createElement("div");
  typing.classList.add("message", "bot");
  typing.innerText = "Typing...";
  messages.appendChild(typing);

  const reply = await getAIResponse(msg);

  typing.remove();
  addMessage(reply, "bot");
}

input.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});
