const router = require("express").Router();
const Auction = require("../models/Auction");
const Team = require("../models/Team");
const Player = require("../models/Player");

router.get("/auction", async (req, res) => {
  res.json(await Auction.findOne().populate("currentPlayer currentTeam"));
});

router.get("/teams", async (req, res) => {
  res.json(await Team.find());
});

router.get("/players", async (req, res) => {
  res.json(await Player.find());
});

module.exports = router;
