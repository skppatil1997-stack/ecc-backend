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

/* ================= ROUTES ================= */
app.use("/auth", require("./routes/auth"));
app.use("/admin", require("./routes/admin"));
app.use("/teams", require("./routes/team"));

/* ================= HEALTH ================= */
app.get("/", (req, res) => {
  res.send("ECC Backend + Socket.IO running 🚀");
});

/* ================= AUCTION STATE ================= */
let auctionState = {
  isLive: false,
  currentPlayer: null,
  basePrice: 0,
  currentBid: 0,
  highestBidder: null
};

/* ================= SOCKET ================= */
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("🔌 Connected:", socket.id);

  socket.emit("auction:update", auctionState);

  /* ADMIN START AUCTION */
  socket.on("auction:start", ({ basePrice }) => {
    auctionState.isLive = true;
    auctionState.basePrice = basePrice;
    auctionState.currentBid = basePrice;
    auctionState.highestBidder = null;

    io.emit("auction:update", auctionState);
  });

  /* ADMIN LOAD NEXT PLAYER */
  socket.on("auction:next-player", ({ player }) => {
    auctionState.currentPlayer = player;
    auctionState.currentBid = auctionState.basePrice;
    auctionState.highestBidder = null;

    io.emit("auction:update", auctionState);
  });

  /* CAPTAIN BID */
  socket.on("auction:bid", ({ bidderName, increment }) => {
    if (!auctionState.isLive) return;
    if (!auctionState.currentPlayer) return;

    auctionState.currentBid += increment;
    auctionState.highestBidder = bidderName;

    io.emit("auction:update", auctionState);
  });

  /* ADMIN STOP */
  socket.on("auction:stop", () => {
    auctionState = {
      isLive: false,
      currentPlayer: null,
      basePrice: 0,
      currentBid: 0,
      highestBidder: null
    };

    io.emit("auction:update", auctionState);
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log("ECC Backend + Socket.IO running 🚀")
);
