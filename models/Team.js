const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },

    purse: {
      type: Number,
      required: true,
      min: 0
    },

    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Team", TeamSchema);
