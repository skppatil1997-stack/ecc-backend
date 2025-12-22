const express = require("express");
const router = express.Router();
const Team = require("../models/Team");
const User = require("../models/User");

/**
 * =========================
 * CREATE TEAM
 * =========================
 * Admin creates a team with purse
 */
router.post("/create", async (req, res) => {
  try {
    const { name, purse } = req.body;

    if (!name || !purse) {
      return res.status(400).json({ msg: "Team name and purse are required" });
    }

    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return res.status(400).json({ msg: "Team already exists" });
    }

    const team = await Team.create({
      name,
      purse,
      captain: null
    });

    res.status(201).json({
      msg: "Team created successfully",
      team
    });
  } catch (err) {
    console.error("CREATE TEAM ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * =========================
 * GET ALL TEAMS
 * =========================
 */
router.get("/", async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("captain", "name email");

    res.json(teams);
  } catch (err) {
    console.error("GET TEAMS ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * =========================
 * ASSIGN CAPTAIN TO TEAM
 * =========================
 * Admin only
 */
router.post("/assign-captain", async (req, res) => {
  try {
    const { teamId, userId } = req.body;

    if (!teamId || !userId) {
      return res.status(400).json({
        msg: "Team ID and User ID are required"
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ msg: "Team not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!user.isAuctionEligible) {
      return res.status(400).json({
        msg: "User is not eligible for auction"
      });
    }

    // Ensure user is not already captain
    const existingCaptain = await Team.findOne({
      captain: userId
    });

    if (existingCaptain) {
      return res.status(400).json({
        msg: "Player is already captain of another team"
      });
    }

    // Assign captain to team
    team.captain = userId;
    await team.save();

    // Mark user as captain
    user.isCaptain = true;
    await user.save();

    res.json({
      msg: "Captain assigned successfully",
      team: {
        name: team.name,
        captain: user.name
      }
    });
  } catch (err) {
    console.error("ASSIGN CAPTAIN ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
