import express from "express";
import User, { IUser } from "../models/user";
import { AuthRequest } from "../middleware/auth";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = express.Router();

// Register
router.post("/register", async (req: AuthRequest, res: express.Response) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      res.status(400).json({ message: "Username or email already exists" });
      return;
    }

    const user = new User({ username, email, password });
    await user.save();
    res
      .status(201)
      .json({
        message: "User registered",
        user: { username: user.username, email: user.email },
      });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
});

// Login
router.post("/login", async (req: AuthRequest, res: express.Response) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });
    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
});

export default router;
