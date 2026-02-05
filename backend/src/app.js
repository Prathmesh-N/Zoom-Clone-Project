import express from "express";
import { createServer } from "node:http";

import { Server } from "socket.io";

import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ limit: "50kb", extended: true }));

app.use("/api/v1/users", userRoutes);

app.get("/home", (req, res) => {
  return res.json("hello world");
});

const start = async () => {
  const connsctiondb = await mongoose.connect(
    "mongodb+srv://prathmeshZoom:qwertyuiop0987@zoomclonecluster.ujpwk0r.mongodb.net/?appName=ZoomCloneCluster",
  );

  console.log(`MongoDB Connected DB Host : ${connsctiondb.connection.host}`);
  server.listen(app.get("port"), () => {
    console.log("Listening on PORT 8000");
  });
};

start();
