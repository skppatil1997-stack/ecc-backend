const express = require("express");
const router = express.Router();
const Team = require("../models/Team");
const User = require("../models/User");

/**
 * =========================
 * CREATE TEAM
 * =========================
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
    const teams = await Team.find().populate("captain", "name email");
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

    const newCaptain = await User.findById(userId);
    if (!newCaptain) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!newCaptain.isAuctionEligible) {
      return res.status(400).json({
        msg: "User is not auction eligible"
      });
    }

    /* 🔥 FIX PART — REMOVE OLD CAPTAIN */
    if (team.captain) {
      await User.findByIdAndUpdate(team.captain, {
        isCaptain: false
      });
    }

    /* 🔥 ENSURE USER IS NOT CAPTAIN ELSEWHERE */
    const alreadyCaptain = await Team.findOne({
      captain: userId
    });

    if (alreadyCaptain) {
      return res.status(400).json({
        msg: "User is already captain of another team"
      });
    }

    /* ASSIGN NEW CAPTAIN */
    team.captain = userId;
    await team.save();

    newCaptain.isCaptain = true;
    await newCaptain.save();

    res.json({
      msg: "Captain updated successfully",
      team: {
        name: team.name,
        captain: newCaptain.name
      }
    });
  } catch (err) {
    console.error("ASSIGN CAPTAIN ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


/**
 * =========================
 * DELETE TEAM
 * =========================
 * Admin only
 */
router.delete("/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ msg: "Team not found" });
    }

    // If team had a captain, reset captain flag
    if (team.captain) {
      await User.findByIdAndUpdate(team.captain, {
        isCaptain: false
      });
    }

    await team.deleteOne();

    res.json({ msg: "Team deleted successfully" });
  } catch (err) {
    console.error("DELETE TEAM ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * =========================
 * REMOVE CAPTAIN FROM TEAM
 * =========================
 * Admin only
 */
router.post("/remove-captain", async (req, res) => {
  try {
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({ msg: "Team ID is required" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ msg: "Team not found" });
    }

    if (!team.captain) {
      return res.status(400).json({ msg: "Team has no captain" });
    }

    // Reset captain flag on user
    await User.findByIdAndUpdate(team.captain, {
      isCaptain: false
    });

    // Remove captain from team
    team.captain = null;
    await team.save();

    res.json({ msg: "Captain removed successfully" });
  } catch (err) {
    console.error("REMOVE CAPTAIN ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * =========================
 * UPDATE TEAM PURSE
 * =========================
 * Admin only
 */
router.put("/update-purse", async (req, res) => {
  try {
    const { teamId, purse } = req.body;

    if (!teamId || purse === undefined) {
      return res.status(400).json({
        msg: "Team ID and new purse are required"
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ msg: "Team not found" });
    }

    team.purse = purse;
    await team.save();

    res.json({
      msg: "Team purse updated successfully",
      team
    });
  } catch (err) {
    console.error("UPDATE PURSE ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


module.exports = router;
