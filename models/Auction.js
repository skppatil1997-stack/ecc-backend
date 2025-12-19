const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema({
  currentPlayer: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
  currentBid: Number,
  currentTeam: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
  status: String,
  increments: [Number]
});

module.exports = mongoose.model("Auction", auctionSchema);
