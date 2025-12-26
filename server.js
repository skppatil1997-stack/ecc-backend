require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

connectDB();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

/* ROUTES */
app.use("/auth", require("./routes/auth"));
app.use("/admin", require("./routes/admin"));
app.use("/teams", require("./routes/team"));

app.get("/", (req, res) => {
  res.send("ECC Backend running 🚀");
});

/* =========================
   SOCKET.IO – WORKING BASELINE
   ========================= */
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

/* IN-MEMORY AUCTION STATE */
let auctionState = {
  isLive: false,
  currentPlayer: null,
  currentBid: 0,
  highestBidder: null
};

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.emit("auction:update", auctionState);

  socket.on("auction:start", () => {
    console.log("🚀 Auction started");
    auctionState.isLive = true;
    auctionState.currentBid = 0;
    auctionState.highestBidder = null;
    io.emit("auction:update", auctionState);
  });

  socket.on("auction:set-player", (player) => {
    console.log("🎯 Player set:", player.name);
    auctionState.currentPlayer = player;
    auctionState.currentBid = 0;
    auctionState.highestBidder = null;
    io.emit("auction:update", auctionState);
  });

  socket.on("auction:bid", ({ bidder, amount }) => {
    console.log("💰 BID:", bidder, amount);

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
      highestBidder: null
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
