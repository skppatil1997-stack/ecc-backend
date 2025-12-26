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

/* =========================
   ROUTES
   ========================= */
app.use("/auth", require("./routes/auth"));
app.use("/admin", require("./routes/admin"));
app.use("/teams", require("./routes/team"));

/* =========================
   HEALTH CHECK
   ========================= */
app.get("/", (req, res) => {
  res.send("ECC Backend + Socket.IO running 🚀");
});

/* =========================
   SOCKET.IO SETUP
   ========================= */
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

/* =========================
   AUCTION STATE (LOCKED)
   ========================= */
let auctionState = {
  isLive: false,
  basePrice: 0,
  currentPlayer: null,
  currentBid: 0,
  highestBidder: null
};

/* =========================
   SOCKET EVENTS
   ========================= */
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.emit("auction:update", auctionState);

  /* ADMIN: START AUCTION */
  socket.on("auction:start", ({ basePrice }) => {
    console.log("🚀 Auction started with base price:", basePrice);

    auctionState.isLive = true;
    auctionState.basePrice = basePrice;
    auctionState.currentBid = basePrice;
    auctionState.highestBidder = null;

    io.emit("auction:update", auctionState);
  });

  /* ADMIN: NEXT PLAYER */
  socket.on("auction:next-player", ({ player }) => {
    if (!auctionState.isLive) return;

    console.log("🎯 New player:", player.name);

    auctionState.currentPlayer = player;
    auctionState.currentBid = auctionState.basePrice;
    auctionState.highestBidder = null;

    io.emit("auction:update", auctionState);
  });

  /* CAPTAIN: BID */
  socket.on("auction:bid", ({ bidder, increment }) => {
    if (!auctionState.isLive) return;
    if (!auctionState.currentPlayer) return;

    const newBid = auctionState.currentBid + increment;

    console.log(
      `💰 BID: ${bidder.name} bid ₹${newBid}`
    );

    auctionState.currentBid = newBid;
    auctionState.highestBidder = bidder;

    io.emit("auction:update", auctionState);
  });

  /* ADMIN: STOP AUCTION */
  socket.on("auction:stop", () => {
    console.log("🛑 Auction stopped");

    auctionState = {
      isLive: false,
      basePrice: 0,
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
