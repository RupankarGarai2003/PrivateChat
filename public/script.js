const socket = io();

let currentRoom = "";

const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const roomID = document.getElementById("roomID");
const joinInput = document.getElementById("joinInput");
const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");

createBtn.onclick = () => {

    socket.emit("create-room");

};

joinBtn.onclick = () => {

    socket.emit("join-room", joinInput.value.toUpperCase());

};

socket.on("room-created", (room) => {

    currentRoom = room;

    roomID.innerHTML = "Room ID : <b>" + room + "</b>";

    chatBox.style.display = "block";

});

socket.on("joined-room", (room) => {

    currentRoom = room;

    roomID.innerHTML = "Joined Room : <b>" + room + "</b>";

    chatBox.style.display = "block";

});

socket.on("error-message", (msg) => {

    alert(msg);

});

sendBtn.onclick = () => {

    const text = messageInput.value.trim();

    if (text === "") return;

    socket.emit("chat-message", text);

    messageInput.value = "";

};

socket.on("chat-message", (data) => {

    const div = document.createElement("div");

    div.className = "message";

    div.innerHTML = "<b>" + data.sender + ":</b> " + data.message;

    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;

});

socket.on("system-message", (msg) => {

    const div = document.createElement("div");

    div.className = "system";

    div.innerHTML = msg;

    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;

});