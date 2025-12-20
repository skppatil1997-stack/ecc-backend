require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

/* 🔴 AUTH ROUTE — MUST EXIST */
app.use("/auth", require("./routes/auth"));

/* 🟢 TEAM ROUTES (Stage 2) */
app.use("/teams", require("./routes/team"));

/* Existing routes */
app.use("/admin", require("./routes/admin"));
app.use("/public", require("./routes/public"));

/* Health check */
app.get("/", (req, res) => {
  res.send("ECC Backend is running 🚀");
});

/* ❗ Keep fallback LAST */
app.use((req, res) => {
  res.status(404).json({ msg: "Path not found!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("ECC Backend Running 🚀");
});
