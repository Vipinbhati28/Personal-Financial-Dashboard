const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();
require("dotenv").config();

// Middleware to verify JWT token
const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization");

    if (!token) {
        return res.status(401).json({ error: "Access Denied, No Token Provided" });
    }

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        req.user = decoded; // Attach user to request
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid Token" });
    }
};

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Register Route
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ name, email, password: hashedPassword });
        await user.save();

        console.log("User registered:", user.email);
        res.json({ message: "Registration successful", redirect: "/login" });
    } catch (error) {
        console.error("Error in user registration:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Login Route (JWT-Based)
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" } // Token valid for 1 hour
        );

        res.cookie("token", token, {
            httpOnly: true,  // Prevents JavaScript access (XSS protection)
            secure: false,   // Set to true if using HTTPS in production
            sameSite: "Lax", // Helps with CORS issues
        });

        res.json({ message: "Login successful", token });
    } catch (error) {
        console.error("Error in user login:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Removed `/logout` because JWT does not require a server-side logout

// Check Authentication Route (JWT-Based)
router.get("/check-auth", authMiddleware, (req, res) => {
    res.json({ isAuthenticated: true });
});

// Protected Route Example
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password"); // Remove password field
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;