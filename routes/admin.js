const router = require("express").Router();
const { auth } = require("../middleware/auth");
const Player = require("../models/Player");
const Team = require("../models/Team");
const Auction = require("../models/Auction");

router.post("/player", auth("ADMIN"), async (req, res) => {
  res.json(await Player.create(req.body));
});

router.post("/team", auth("ADMIN"), async (req, res) => {
  const team = await Team.create({
    ...req.body,
    remainingBudget: req.body.totalBudget
  });
  res.json(team);
});

router.post("/auction/start", auth("ADMIN"), async (req, res) => {
  const unsold = await Player.find({ status: "UNSOLD" });
  const random = unsold[Math.floor(Math.random() * unsold.length)];

  const auction = await Auction.findOneAndUpdate(
    {},
    {
      currentPlayer: random._id,
      currentBid: random.basePrice,
      status: "RUNNING",
      increments: [100, 500, 1000, 5000]
    },
    { upsert: true, new: true }
  );

  res.json(auction);
});

module.exports = router;
