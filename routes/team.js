const express = require("express");
const router = express.Router();
const Team = require("../models/Team");

/**
 * =========================
 * CREATE TEAM (ADMIN ONLY)
 * =========================
 * Body: { name, purse }
 */
router.post("/", async (req, res) => {
  try {
    const { name, purse } = req.body;

    if (!name || purse === undefined) {
      return res.status(400).json({ msg: "Team name and purse are required" });
    }

    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return res.status(400).json({ msg: "Team already exists" });
    }

    const team = await Team.create({
      name,
      purse
    });

    res.status(201).json(team);
  } catch (err) {
    console.error("CREATE TEAM ERROR:", err);
    res.status(500).json({ msg: "Server error while creating team" });
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
      .populate("captain", "name email")
      .populate("players", "name email");

    res.json(teams);
  } catch (err) {
    console.error("GET TEAMS ERROR:", err);
    res.status(500).json({ msg: "Server error while fetching teams" });
  }
});

module.exports = router;
