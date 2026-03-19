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

async function sendMessage() {
  const message = input.value;

  if (!message) return;

  addMessage(message, "user");
  input.value = "";

  // Typing indicator
  const typing = document.createElement("div");
  typing.classList.add("message", "bot");
  typing.innerText = "Typing...";
  messages.appendChild(typing);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    typing.remove();
    addMessage(data.reply, "bot");

  } catch (error) {
    console.error(error);
    typing.remove();
    addMessage("Error connecting to AI 😢", "bot");
  }
}

input.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});
