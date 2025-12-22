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

/* Routes */
app.use("/auth", require("./routes/auth"));
app.use("/admin", require("./routes/admin"));
app.use("/public", require("./routes/public"));
app.use("/teams", require("./routes/team"));

/* Health check */
app.get("/", (req, res) => {
  res.send("ECC Backend is running 🚀");
});

/* =========================
   AUCTION STATE (IN-MEMORY)
   ========================= */

let auctionState = {
  isLive: false,
  currentPlayer: null,
  currentBid: 0,
  highestBidder: null,
  increment: 100
};

/* =========================
   SOCKET.IO CONNECTION
   ========================= */

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Send current auction state to new user
  socket.emit("auction:update", auctionState);

  // Admin starts auction
  socket.on("auction:start", ({ player, basePrice }) => {
    auctionState = {
      isLive: true,
      currentPlayer: player,
      currentBid: basePrice,
      highestBidder: null,
      increment: auctionState.increment
    };

    io.emit("auction:update", auctionState);
  });

  // Bid event
  socket.on("auction:bid", ({ bidder, amount }) => {
    if (!auctionState.isLive) return;

    if (amount <= auctionState.currentBid) return;

    auctionState.currentBid = amount;
    auctionState.highestBidder = bidder;

    io.emit("auction:update", auctionState);
  });

  // Admin stops auction
  socket.on("auction:stop", () => {
    auctionState.isLive = false;
    io.emit("auction:update", auctionState);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

/* ❗ Keep fallback LAST */
app.use((req, res) => {
  res.status(404).json({ msg: "Path not found!" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("ECC Backend + Socket.IO running 🚀");
});
