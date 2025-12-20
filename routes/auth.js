router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, isAdmin, adminKey } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "User already exists" });
    }

    let role = "PLAYER";

    // ADMIN creation logic
    if (isAdmin) {
      // 🔐 Secret key check
      if (adminKey !== process.env.ADMIN_SECRET_KEY) {
        return res.status(403).json({ msg: "Invalid admin secret key" });
      }

      // Allow only ONE admin
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
