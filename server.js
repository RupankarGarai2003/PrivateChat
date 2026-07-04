const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = {};

// =========================
// CONFIG
// =========================

const MAX_USERNAME_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 500;
const MESSAGE_COOLDOWN = 300; // milliseconds

// =========================
// HELPERS
// =========================

function generateRoomID() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let id = "";

    for (let i = 0; i < 6; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }

    return id;
}

function validUsername(username) {
    username = username.trim();

    return /^[A-Za-z0-9_-]{3,20}$/.test(username);
}

function validRoomID(roomID) {
    return /^[A-Z0-9]{6}$/.test(roomID);
}

function sanitizeMessage(message) {
    return message.trim();
}

function emitUserCount(room) {
    if (!rooms[room]) return;

    io.to(room).emit("user-count", Object.keys(rooms[room]).length);
}

// =========================
// SOCKET
// =========================

io.on("connection", (socket) => {

    console.log(`[CONNECT] ${socket.id}`);

    socket.lastMessageTime = 0;

    // =========================
    // CREATE ROOM
    // =========================

    socket.on("create-room", (username) => {

        username = username.trim();

        if (!validUsername(username)) {
            socket.emit(
                "error-message",
                "Username must be 3-20 characters and contain only letters, numbers, _ or -."
            );
            return;
        }

        let room;

        do {
            room = generateRoomID();
        } while (rooms[room]);

        rooms[room] = {};

        socket.join(room);

        rooms[room][socket.id] = username;

        socket.roomID = room;
        socket.username = username;

        console.log(`[CREATE] ${username} created room ${room}`);

        socket.emit("room-created", room);

        io.to(room).emit(
            "system-message",
            "🔒 Temporary private room created. Messages are never stored."
        );

        io.to(room).emit(
            "system-message",
            `${username} created the room.`
        );

        emitUserCount(room);
    });

    // =========================
    // JOIN ROOM
    // =========================

    socket.on("join-room", (data) => {

        const room = data.roomID.trim().toUpperCase();
        const username = data.username.trim();

        if (!validUsername(username)) {
            socket.emit(
                "error-message",
                "Invalid username."
            );
            return;
        }

        if (!validRoomID(room)) {
            socket.emit(
                "error-message",
                "Invalid Room ID."
            );
            return;
        }

        if (!rooms[room]) {
            socket.emit(
                "error-message",
                "Room does not exist."
            );
            return;
        }

        socket.join(room);

        rooms[room][socket.id] = username;

        socket.roomID = room;
        socket.username = username;

        console.log(`[JOIN] ${username} joined ${room}`);

        socket.emit("joined-room", room);

        io.to(room).emit(
            "system-message",
            `${username} joined the room.`
        );

        io.to(room).emit(
            "system-message",
            "🔒 This conversation is temporary. Refreshing or leaving permanently removes chat."
        );

        emitUserCount(room);

    });

    // =========================
    // CHAT
    // =========================

    socket.on("chat-message", (message) => {

        if (!socket.roomID) return;

        if (typeof message !== "string") return;

        const now = Date.now();

        if (now - socket.lastMessageTime < MESSAGE_COOLDOWN) {
            return;
        }

        socket.lastMessageTime = now;

        message = sanitizeMessage(message);

        if (message.length === 0) return;

        if (message.length > MAX_MESSAGE_LENGTH) {

            socket.emit(
                "error-message",
                `Maximum message length is ${MAX_MESSAGE_LENGTH} characters.`
            );

            return;
        }

        io.to(socket.roomID).emit("chat-message", {

            sender: socket.username,

            message

        });

    });

    // =========================
    // DISCONNECT
    // =========================

    socket.on("disconnect", () => {

        const room = socket.roomID;

        if (!room) {

            console.log(`[DISCONNECT] ${socket.id}`);

            return;
        }

        if (rooms[room]) {

            delete rooms[room][socket.id];

            console.log(`[LEAVE] ${socket.username} left ${room}`);

            io.to(room).emit(
                "system-message",
                `${socket.username} left the room.`
            );

            emitUserCount(room);

            if (Object.keys(rooms[room]).length === 0) {

                delete rooms[room];

                console.log(`[DELETE] Room ${room} destroyed`);

            }

        }

    });

});

// =========================
// SERVER
// =========================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log(`🚀 Private Chat running on port ${PORT}`);

});