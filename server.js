require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

connectDB();

const app = express();
const server = http.createServer(app);

/* =========================
   SOCKET.IO SETUP
   ========================= */
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

/* =========================
   ROUTES
   ========================= */
app.use("/auth", require("./routes/auth"));
app.use("/admin", require("./routes/admin"));
app.use("/teams", require("./routes/team"));
app.use("/auction", require("./routes/auction"));

/* =========================
   HEALTH CHECK
   ========================= */
app.get("/", (req, res) => {
  res.send("ECC Backend + Socket.IO running 🚀");
});

/* =========================
   AUCTION STATE (IN-MEMORY)
   ========================= */
let auctionState = {
  isLive: false,
  currentPlayer: null,
  currentBid: 0,
  highestBidder: null,
  increment: 100,
  usedPlayers: []
};

/* =========================
   SOCKET.IO EVENTS
   ========================= */
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // Send current state on connect
  socket.emit("auction:update", auctionState);

  socket.on("auction:start", ({ basePrice }) => {
    console.log("🚀 Auction started");
    auctionState.isLive = true;
    auctionState.currentBid = basePrice || 0;
    auctionState.highestBidder = null;
    io.emit("auction:update", auctionState);
  });

  socket.on("auction:next-player", ({ players }) => {
    if (!auctionState.isLive) return;

    const available = players.filter(
      (p) => !auctionState.usedPlayers.includes(p._id)
    );

    if (available.length === 0) {
      io.emit("auction:end", { msg: "No players left" });
      return;
    }

    const random =
      available[Math.floor(Math.random() * available.length)];

    auctionState.currentPlayer = random;
    auctionState.currentBid = 0;
    auctionState.highestBidder = null;
    auctionState.usedPlayers.push(random._id);

    console.log("🎯 New player:", random.name);
    io.emit("auction:update", auctionState);
  });

  socket.on("auction:bid", ({ bidder, amount }) => {
    console.log("💰 BID RECEIVED:", bidder, amount);

    if (!auctionState.isLive) return;
    if (!auctionState.currentPlayer) return;
    if (amount <= auctionState.currentBid) return;

    auctionState.currentBid = amount;
    auctionState.highestBidder = bidder;

    io.emit("auction:update", auctionState);
  });

  socket.on("auction:stop", () => {
    console.log("🛑 Auction stopped");
    auctionState = {
      isLive: false,
      currentPlayer: null,
      currentBid: 0,
      highestBidder: null,
      increment: 100,
      usedPlayers: []
    };
    io.emit("auction:update", auctionState);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("ECC Backend + Socket.IO running 🚀");
});
