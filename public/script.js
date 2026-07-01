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

let currentRoom = "";

createBtn.onclick = () => {

    const username = nameInput.value.trim();

    if(username===""){
        alert("Enter your name");
        return;
    }

    socket.emit("create-room", username);

}

joinBtn.onclick = () => {

    const username=nameInput.value.trim();

    if(username===""){
        alert("Enter your name");
        return;
    }

    socket.emit("join-room",{
        roomID:joinInput.value.toUpperCase(),
        username
    });

}

socket.on("room-created",(room)=>{

    currentRoom=room;

    roomID.innerHTML="Room ID : <b>"+room+"</b>";

    chatBox.style.display="block";

});

socket.on("joined-room",(room)=>{

    currentRoom=room;

    roomID.innerHTML="Joined Room : <b>"+room+"</b>";

    chatBox.style.display="block";

});

socket.on("error-message",(msg)=>{

    alert(msg);

});

sendBtn.onclick=()=>{

    const text=messageInput.value.trim();

    if(text==="") return;

    socket.emit("chat-message",text);

    messageInput.value="";

}

messageInput.addEventListener("keypress",(e)=>{

    if(e.key==="Enter") sendBtn.click();

});

socket.on("chat-message",(data)=>{

    const div=document.createElement("div");

    div.className="message";

    div.innerHTML="<b>"+data.sender+"</b><br>"+data.message;

    messages.appendChild(div);

    messages.scrollTop=messages.scrollHeight;

});

socket.on("system-message",(msg)=>{

    const div=document.createElement("div");

    div.className="system";

    div.innerHTML=msg;

    messages.appendChild(div);

    messages.scrollTop=messages.scrollHeight;

});
