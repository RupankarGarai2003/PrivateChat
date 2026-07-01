const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

const rooms = {};

function generateRoomID() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";

    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return id;
}

io.on("connection", (socket) => {

    console.log("Connected:", socket.id);

    socket.on("create-room", () => {

        let roomID;

        do {
            roomID = generateRoomID();
        } while (rooms[roomID]);

        rooms[roomID] = [];

        socket.join(roomID);

        rooms[roomID].push(socket.id);

        socket.roomID = roomID;

        socket.emit("room-created", roomID);

        console.log("Room Created:", roomID);

    });

    socket.on("join-room", (roomID) => {

        if (!rooms[roomID]) {
            socket.emit("error-message", "Room does not exist.");
            return;
        }

        if (rooms[roomID].length >= 2) {
            socket.emit("error-message", "Room is full.");
            return;
        }

        socket.join(roomID);

        rooms[roomID].push(socket.id);

        socket.roomID = roomID;

        socket.emit("joined-room", roomID);

        io.to(roomID).emit("system-message", "A user joined.");
    });

    socket.on("chat-message", (message) => {

        if (!socket.roomID) return;

        io.to(socket.roomID).emit("chat-message", {
            sender: socket.id.substring(0, 5),
            message: message
        });

    });

    socket.on("disconnect", () => {

        const roomID = socket.roomID;

        if (!roomID) return;

        if (rooms[roomID]) {

            rooms[roomID] = rooms[roomID].filter(id => id !== socket.id);

            if (rooms[roomID].length === 0) {

                delete rooms[roomID];

                console.log("Room Deleted:", roomID);

            } else {

                io.to(roomID).emit("system-message", "User left the room.");

            }

        }

    });

});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});