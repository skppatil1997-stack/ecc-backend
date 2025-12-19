require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const Chat = require("./models/Chat");

connectDB();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use("/auth", require("./routes/auth"));
app.use("/admin", require("./routes/admin"));
app.use("/public", require("./routes/public"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL }
});

io.on("connection", (socket) => {
  socket.on("chat", async (msg) => {
    const saved = await Chat.create(msg);
    io.emit("chat", saved);
  });
});

app.get("/", (req, res) => {
  res.send("ECC Backend is running 🚀");
});

server.listen(process.env.PORT, () =>
  console.log("ECC Backend Running 🚀")
);
