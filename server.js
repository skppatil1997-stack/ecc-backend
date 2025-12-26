require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.use("/auth", require("./routes/auth"));
app.use("/admin", require("./routes/admin"));
app.use("/teams", require("./routes/team"));
app.use("/auction", require("./routes/auction"));

app.get("/", (req, res) => {
  res.send("ECC Backend + Socket.IO running 🚀");
});

/* =========================
   AUCTION STATE
   ========================= */
let auctionState = {
  isLive: false,
  currentPlayer: null,
  currentBid: 0,
  highestBidder: null,
  usedPlayers: []
};

/* =========================
   SOCKET.IO
   ========================= */
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.emit("auction:update", auctionState);

  socket.on("auction:start", ({ basePrice }) => {
    console.log("▶️ Auction started");
    auctionState.isLive = true;
    auctionState.currentBid = basePrice || 0;
    auctionState.highestBidder = null;
    io.emit("auction:update", auctionState);
  });

  socket.on("auction:next-player", ({ players }) => {
    console.log("⏭ Next player requested");

    if (!auctionState.isLive) return;
    if (!players || players.length === 0) return;

    const remaining = players.filter(
      (p) => !auctionState.usedPlayers.includes(p._id)
    );

    if (!remaining.length) return;

    const player = remaining[Math.floor(Math.random() * remaining.length)];
    auctionState.currentPlayer = player;
    auctionState.currentBid = 0;
    auctionState.highestBidder = null;
    auctionState.usedPlayers.push(player._id);

    io.emit("auction:update", auctionState);
  });

  socket.on("auction:bid", ({ bidder, amount }) => {
    console.log("💰 BID RECEIVED:", bidder, amount);

    if (!auctionState.isLive) return;
    if (!auctionState.currentPlayer) return;
    if (!amount || amount <= auctionState.currentBid) return;

    auctionState.currentBid = amount;
    auctionState.highestBidder = bidder;

    io.emit("auction:update", auctionState);
  });

  socket.on("auction:stop", () => {
    console.log("⛔ Auction stopped");
    auctionState = {
      isLive: false,
      currentPlayer: null,
      currentBid: 0,
      highestBidder: null,
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
