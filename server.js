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
app.use("/public", require("./routes/public"));
app.use("/teams", require("./routes/team"));

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
  console.log("User connected:", socket.id);

  // Send current auction state to newly connected user
  socket.emit("auction:update", auctionState);

  /**
   * ADMIN STARTS AUCTION
   */
  socket.on("auction:start", ({ basePrice }) => {
    auctionState.isLive = true;
    auctionState.currentBid = basePrice || 0;
    auctionState.highestBidder = null;

    io.emit("auction:update", auctionState);
  });

  /**
   * ADMIN REQUESTS NEXT RANDOM PLAYER
   * players = array of auction-eligible players
   */
  socket.on("auction:next-player", ({ players }) => {
    if (!auctionState.isLive) return;
    if (!players || players.length === 0) return;

    // Filter out already used players
    const availablePlayers = players.filter(
      (p) => !auctionState.usedPlayers.includes(p._id)
    );

    if (availablePlayers.length === 0) {
      io.emit("auction:end", {
        msg: "No players left in auction pool"
      });
      return;
    }

    // Pick random player
    const randomPlayer =
      availablePlayers[Math.floor(Math.random() * availablePlayers.length)];

    auctionState.currentPlayer = randomPlayer;
    auctionState.currentBid = 0;
    auctionState.highestBidder = null;
    auctionState.usedPlayers.push(randomPlayer._id);

    io.emit("auction:update", auctionState);
  });

  /**
   * BID EVENT (ADMIN + CAPTAINS)
   */
  socket.on("auction:bid", ({ bidder, amount }) => {
    if (!auctionState.isLive) return;
    if (!auctionState.currentPlayer) return;
    if (amount <= auctionState.currentBid) return;

    auctionState.currentBid = amount;
    auctionState.highestBidder = bidder;

    io.emit("auction:update", auctionState);
  });

  /**
   * ADMIN STOPS AUCTION
   */
  socket.on("auction:stop", () => {
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
    console.log("User disconnected:", socket.id);
  });
});

/* =========================
   FALLBACK (KEEP LAST)
   ========================= */
app.use((req, res) => {
  res.status(404).json({ msg: "Path not found!" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("ECC Backend + Socket.IO running 🚀");
});
