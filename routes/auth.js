const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * =========================
 * LOGIN (Admin & Player)
 * =========================
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    // Create token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Success
    return res.json({
      token,
      role: user.role,
      name: user.name
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

/**
 * =========================
 * SIGNUP (Players only)
 * =========================
 */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // Check existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create player user
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "PLAYER"
    });

    return res.json({ msg: "Signup successful" });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
