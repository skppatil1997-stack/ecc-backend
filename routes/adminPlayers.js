const express = require("express");
const router = express.Router();
const User = require("../models/User");

/**
 * ================================
 * GET ALL SIGNED-UP USERS
 * (Admin uses this to view players)
 * ================================
 */
router.get("/users", async (req, res) => {
  try {
    const users = await User.find(
      {},
      "name email role isAuctionEligible profilePhoto"
    ).sort({ createdAt: 1 });

    res.json(users);
  } catch (err) {
    console.error("FETCH USERS ERROR:", err);
    res.status(500).json({ msg: "Failed to fetch users" });
  }
});

/**
 * ======================================
 * TOGGLE AUCTION ELIGIBILITY FOR A PLAYER
 * ======================================
 * Body: { userId, isAuctionEligible }
 */
router.post("/auction-eligibility", async (req, res) => {
  try {
    const { userId, isAuctionEligible } = req.body;

    if (!userId || typeof isAuctionEligible !== "boolean") {
      return res
        .status(400)
        .json({ msg: "userId and isAuctionEligible are required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.isAuctionEligible = isAuctionEligible;
    await user.save();

    res.json({
      msg: "Auction eligibility updated",
      user: {
        id: user._id,
        name: user.name,
        isAuctionEligible: user.isAuctionEligible
      }
    });
  } catch (err) {
    console.error("UPDATE AUCTION ELIGIBILITY ERROR:", err);
    res.status(500).json({ msg: "Failed to update auction eligibility" });
  }
});

module.exports = router;
