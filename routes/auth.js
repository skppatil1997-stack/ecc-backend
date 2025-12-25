const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * =========================
 * SIGNUP (ADMIN & PLAYER)
 * =========================
 */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, isAdmin, adminKey } = req.body;

    /* =========================
       BASIC VALIDATION
       ========================= */
    if (!name || !email || !password) {
      return res.status(400).json({
        msg: "Name, email and password are required"
      });
    }

    /* =========================
       ADMIN ENV SAFETY CHECK
       ========================= */
    if (isAdmin && !process.env.ADMIN_SECRET_KEY) {
      return res.status(500).json({
        msg: "Admin signup is not configured on server"
      });
    }

    /* =========================
       CHECK EXISTING USER
       ========================= */
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        msg: "User already exists"
      });
    }

    /* =========================
       DETERMINE ROLE
       ========================= */
    let role = "PLAYER";

    if (isAdmin) {
      if (adminKey !== process.env.ADMIN_SECRET_KEY) {
        return res.status(403).json({
          msg: "Invalid admin secret key"
        });
      }

      const adminExists = await User.findOne({ role: "ADMIN" });
      if (adminExists) {
        return res.status(403).json({
          msg: "Admin already exists"
        });
      }

      role = "ADMIN";
    }

    /* =========================
       HASH PASSWORD
       ========================= */
    const hashedPassword = await bcrypt.hash(password, 10);

    /* =========================
       CREATE USER
       ========================= */
    await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    res.json({
      msg: "Signup successful",
      role
    });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({
      msg: "Server error"
    });
  }
});

/**
 * =========================
 * LOGIN (ADMIN & PLAYER)
 * =========================
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        msg: "Email and password are required"
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        msg: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        msg: "Invalid email or password"
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        msg: "JWT is not configured on server"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      msg: "Server error"
    });
  }
});

module.exports = router;
