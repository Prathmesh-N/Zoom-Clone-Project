import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
  const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Something Connected");

    socket.on("join-call", (roomId) => {
      if (!roomId || typeof roomId !== "string") {
        return;
      }

      if (connections[roomId] === undefined) {
        connections[roomId] = [];
      }

      if (!connections[roomId].includes(socket.id)) {
        connections[roomId].push(socket.id);
      }

      timeOnline[socket.id] = Date.now();

      for (let a = 0; a < connections[roomId].length; a++) {
        io.to(connections[roomId][a]).emit(
          "user-joined",
          socket.id,
          connections[roomId],
        );
      }

      if (messages[roomId] !== undefined) {
        for (let a = 0; a < messages[roomId].length; ++a) {
          io.to(socket.id).emit(
            "chat-messages",
            messages[roomId][a]["data"],
            messages[roomId][a]["sender"],
            messages[roomId][a]["socket-id-sender"],
          );
        }
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      const [meetingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }
          return [room, isFound];
        },
        ["", false],
      );

      if (found === true) {
        if (messages[meetingRoom] === undefined) {
          messages[meetingRoom] = [];
        }
        messages[meetingRoom].push({
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
        });
        console.log("message", meetingRoom, ":", sender, data);
        connections[meetingRoom].forEach((element) => {
          io.to(element).emit("chat-messages", data, sender, socket.id);
        });
      }
    });

    socket.on("disconnect", () => {
      delete timeOnline[socket.id];

      for (const [roomId, participants] of Object.entries(connections)) {
        const index = participants.indexOf(socket.id);
        if (index === -1) {
          continue;
        }

        participants.splice(index, 1);

        participants.forEach((participantId) => {
          io.to(participantId).emit("user-left", socket.id);
        });

        if (participants.length === 0) {
          delete connections[roomId];
          delete messages[roomId];
        }

        break;
      }
    });
  });

  return io;
};
