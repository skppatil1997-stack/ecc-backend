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

    console.log("LOGIN ATTEMPT:", email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log("USER NOT FOUND");
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("PASSWORD MISMATCH");
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("LOGIN SUCCESS:", user.role);

    res.json({
      token,
      role: user.role,
      name: user.name
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


/**
 * =========================
 * SIGNUP (Admin & Player)
 * =========================
 */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, isAdmin, adminKey } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "User already exists" });
    }

    let role = "PLAYER";

    if (isAdmin) {
      if (adminKey !== process.env.ADMIN_SECRET_KEY) {
        return res.status(403).json({ msg: "Invalid admin secret key" });
      }

      const adminExists = await User.findOne({ role: "ADMIN" });
      if (adminExists) {
        return res.status(403).json({ msg: "Admin already exists" });
      }

      role = "ADMIN";
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    return res.json({ msg: "Signup successful", role });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
