const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    /* =========================
       BASIC INFO
       ========================= */
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["ADMIN", "PLAYER"],
      default: "PLAYER"
    },

    /* =========================
       AUCTION FLAGS
       ========================= */
    isAuctionEligible: {
      type: Boolean,
      default: false
    },

    isCaptain: {
      type: Boolean,
      default: false
    },

    /* =========================
       PLAYER SOLD FLOW (NEW)
       ========================= */
    isSold: {
      type: Boolean,
      default: false
    },

    soldPrice: {
      type: Number,
      default: 0
    },

    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null
    },

    /* =========================
       OPTIONAL (FUTURE READY)
       ========================= */
    profilePhoto: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", UserSchema);
