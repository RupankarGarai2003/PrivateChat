const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = {};

function generateRoomID(){

    const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let id="";

    for(let i=0;i<6;i++){

        id+=chars[Math.floor(Math.random()*chars.length)];

    }

    return id;

}

io.on("connection",(socket)=>{

    console.log("Connected:",socket.id);

    socket.on("create-room",(username)=>{

        let room;

        do{

            room=generateRoomID();

        }while(rooms[room]);

        rooms[room]={};

        socket.join(room);

        rooms[room][socket.id]=username;

        socket.roomID=room;

        socket.username=username;

        socket.emit("room-created",room);

        io.to(room).emit("system-message",`${username} created the room.`);

    });

    socket.on("join-room",(data)=>{

        const room=data.roomID;

        const username=data.username;

        if(!rooms[room]){

            socket.emit("error-message","Room does not exist.");

            return;

        }

        socket.join(room);

        rooms[room][socket.id]=username;

        socket.roomID=room;

        socket.username=username;

        socket.emit("joined-room",room);

        io.to(room).emit("system-message",`${username} joined the room.`);

    });

    socket.on("chat-message",(message)=>{

        if(!socket.roomID) return;

        io.to(socket.roomID).emit("chat-message",{

            sender:socket.username,

            message

        });

    });

    socket.on("disconnect",()=>{

        const room=socket.roomID;

        if(!room) return;

        if(rooms[room]){

            delete rooms[room][socket.id];

            io.to(room).emit("system-message",`${socket.username} left the room.`);

            if(Object.keys(rooms[room]).length===0){

                delete rooms[room];

                console.log("Deleted Room:",room);

            }

        }

    });

});

const PORT=process.env.PORT||3000;

server.listen(PORT,()=>{

    console.log("Server running on port",PORT);

});
