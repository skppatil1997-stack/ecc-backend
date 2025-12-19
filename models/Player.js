const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: String,
  role: String,
  basePrice: Number,
  status: { type: String, default: "UNSOLD" },
  soldPrice: Number,
  soldToTeam: { type: mongoose.Schema.Types.ObjectId, ref: "Team" }
});

module.exports = mongoose.model("Player", playerSchema);
