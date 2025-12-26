const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

/**
 * =========================
 * GET ALL USERS (ADMIN)
 * =========================
 */
router.get("/players/users", auth, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ msg: "Admin access required" });
    }

    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * =========================
 * TOGGLE AUCTION ELIGIBILITY
 * =========================
 */
router.put("/players/eligibility", auth, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ msg: "Admin access required" });
    }

    const { userId, isAuctionEligible } = req.body;

    await User.findByIdAndUpdate(userId, {
      isAuctionEligible
    });

    res.json({ msg: "Eligibility updated" });
  } catch (err) {
    console.error("UPDATE ELIGIBILITY ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * =========================
 * GET AUCTION PLAYER POOL
 * =========================
 */
router.get("/auction/players", auth, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ msg: "Admin access required" });
    }

    const players = await User.find({
      isAuctionEligible: true
    }).select("name email isCaptain");

    res.json(players);
  } catch (err) {
    console.error("GET AUCTION PLAYERS ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
