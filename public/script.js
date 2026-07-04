const socket = io();

const nameInput = document.getElementById("nameInput");
const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");

const roomID = document.getElementById("roomID");
const joinInput = document.getElementById("joinInput");

const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");

// Optional (add these in HTML later)
const userCount = document.getElementById("userCount");
const copyRoomBtn = document.getElementById("copyRoomBtn");

let currentRoom = "";

// ----------------------------
// Validation
// ----------------------------

function validUsername(name) {
    return /^[A-Za-z0-9_-]{3,20}$/.test(name.trim());
}

function validRoom(room) {
    return /^[A-Z0-9]{6}$/.test(room.trim().toUpperCase());
}

// ----------------------------
// Helpers
// ----------------------------

function scrollBottom() {
    messages.scrollTop = messages.scrollHeight;
}

function addMessage(sender, text) {

    const div = document.createElement("div");
    div.className = "message";

    const name = document.createElement("strong");
    name.textContent = sender;

    const br = document.createElement("br");

    const msg = document.createElement("span");
    msg.textContent = text;

    div.appendChild(name);
    div.appendChild(br);
    div.appendChild(msg);

    messages.appendChild(div);

    scrollBottom();

}

function addSystemMessage(text) {

    const div = document.createElement("div");
    div.className = "system";

    div.textContent = text;

    messages.appendChild(div);

    scrollBottom();

}

// ----------------------------
// Create Room
// ----------------------------

createBtn.onclick = () => {

    const username = nameInput.value.trim();

    if (!validUsername(username)) {

        alert("Username must be 3-20 characters.\nOnly letters, numbers, _ and - are allowed.");

        return;

    }

    socket.emit("create-room", username);

};

// ----------------------------
// Join Room
// ----------------------------

joinBtn.onclick = () => {

    const username = nameInput.value.trim();
    const room = joinInput.value.trim().toUpperCase();

    if (!validUsername(username)) {

        alert("Invalid username.");

        return;

    }

    if (!validRoom(room)) {

        alert("Room ID must contain exactly 6 letters/numbers.");

        return;

    }

    socket.emit("join-room", {

        roomID: room,
        username

    });

};

// ----------------------------
// Room Created
// ----------------------------

socket.on("room-created", (room) => {

    currentRoom = room;

    roomID.textContent = "Room ID : " + room;

    chatBox.style.display = "block";

    messageInput.focus();

});

// ----------------------------
// Joined Room
// ----------------------------

socket.on("joined-room", (room) => {

    currentRoom = room;

    roomID.textContent = "Joined Room : " + room;

    chatBox.style.display = "block";

    messageInput.focus();

});

// ----------------------------
// Copy Room
// ----------------------------

if (copyRoomBtn) {

    copyRoomBtn.onclick = async () => {

        if (!currentRoom) return;

        try {

            await navigator.clipboard.writeText(currentRoom);

            alert("Room ID copied!");

        } catch {

            alert("Unable to copy Room ID.");

        }

    };

}

// ----------------------------
// Errors
// ----------------------------

socket.on("error-message", (msg) => {

    alert(msg);

});

// ----------------------------
// Send Message
// ----------------------------

sendBtn.onclick = () => {

    const text = messageInput.value.trim();

    if (text.length === 0)
        return;

    if (text.length > 500) {

        alert("Maximum message length is 500 characters.");

        return;

    }

    socket.emit("chat-message", text);

    messageInput.value = "";

    messageInput.focus();

};

// ----------------------------
// Enter Key
// ----------------------------

messageInput.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

        e.preventDefault();

        sendBtn.click();

    }

});

// ----------------------------
// Incoming Chat
// ----------------------------

socket.on("chat-message", (data) => {

    addMessage(data.sender, data.message);

});

// ----------------------------
// System Messages
// ----------------------------

socket.on("system-message", (msg) => {

    addSystemMessage(msg);

});

// ----------------------------
// Live User Count
// ----------------------------

socket.on("user-count", (count) => {

    if (!userCount)
        return;

    userCount.textContent = "Users Online : " + count;

});