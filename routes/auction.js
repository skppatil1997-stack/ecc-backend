const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Team = require("../models/Team");
const auth = require("../middleware/auth");

/**
 * =========================
 * SELL PLAYER (ADMIN ONLY)
 * =========================
 * Finalizes auction for current player
 */
router.post("/sell", auth, async (req, res) => {
  try {
    /* =========================
       ADMIN CHECK
       ========================= */
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        msg: "Admin access required"
      });
    }

    const { playerId, teamId, price } = req.body;

    if (!playerId || !teamId || !price) {
      return res.status(400).json({
        msg: "Player ID, Team ID and price are required"
      });
    }

    /* =========================
       FETCH PLAYER
       ========================= */
    const player = await User.findById(playerId);
    if (!player) {
      return res.status(404).json({
        msg: "Player not found"
      });
    }

    if (!player.isAuctionEligible) {
      return res.status(400).json({
        msg: "Player is not auction eligible"
      });
    }

    if (player.isSold) {
      return res.status(400).json({
        msg: "Player already sold"
      });
    }

    /* =========================
       FETCH TEAM
       ========================= */
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        msg: "Team not found"
      });
    }

    if (team.purse < price) {
      return res.status(400).json({
        msg: "Team does not have enough purse"
      });
    }

    /* =========================
       UPDATE TEAM
       ========================= */
    team.purse -= price;

    if (!team.players.includes(player._id)) {
      team.players.push(player._id);
    }

    await team.save();

    /* =========================
       UPDATE PLAYER
       ========================= */
    player.isSold = true;
    player.soldPrice = price;
    player.team = team._id;
    player.isAuctionEligible = false;
    player.isCaptain = false;

    await player.save();

    /* =========================
       SOCKET EVENT
       ========================= */
    const io = req.app.get("io");

    io.emit("auction:sold", {
      player: {
        id: player._id,
        name: player.name
      },
      team: {
        id: team._id,
        name: team.name
      },
      price
    });

    /* =========================
       RESPONSE
       ========================= */
    res.json({
      msg: "Player sold successfully"
    });
  } catch (err) {
    console.error("SELL PLAYER ERROR:", err);
    res.status(500).json({
      msg: "Server error"
    });
  }
});

module.exports = router;
