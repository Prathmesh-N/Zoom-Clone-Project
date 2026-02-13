import "dotenv/config";
import express from "express";
import { createServer } from "node:http";

import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.js";

const app = express();
const server = createServer(app);
connectToSocket(server);

const allowedOrigin = process.env.CLIENT_URL || "http://localhost:3000";

app.set("port", process.env.PORT || 8000);
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ limit: "50kb", extended: true }));

app.use("/api/v1/users", userRoutes);

app.get("/home", (req, res) => {
  return res.json("hello world");
});

const start = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }

  const connectionDb = await mongoose.connect(mongoUri);

  console.log(`MongoDB Connected DB Host : ${connectionDb.connection.host}`);
  server.listen(app.get("port"), () => {
    console.log(`Listening on PORT ${app.get("port")}`);
  });
};

start();
