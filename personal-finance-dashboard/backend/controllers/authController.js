const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// User Registration
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Hashed Password:", hashedPassword);

        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        // Auto-login after signup
        const token = generateToken(user._id);
        req.session.userId = user._id; // Store in session
        console.log("Session after registration:", req.session);

        // Set token as cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Set to true in production
            maxAge: 3600000, // 1 hour (in milliseconds)
        });

        res.status(201).json({ success: true, redirect: "/home" }); // Removed token from json response.
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error: error.message });
    }
};

// User Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login request for email:", email);

        const user = await User.findOne({ email });

        if (!user) {
            console.log("User not found in database");
            return res.status(400).json({ message: "Invalid credentials" });
        }

        console.log("User found:", user.email);
        console.log("Entered Password:", password);
        console.log("Stored Hashed Password:", user.password);

        // Manually compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Bcrypt compare result:", isMatch);

        if (!isMatch) {
            console.log("Passwords do not match");
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate Token & Save Session
        const token = generateToken(user._id);
        req.session.userId = user._id; // Store user session
        console.log("Session after login:", req.session);

        console.log("Login successful! Token:", token);

        // Set token as cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Set to true in production
            maxAge: 3600000, // 1 hour (in milliseconds)
        });

        res.status(200).json({ success: true, redirect: "/home" }); // Removed token from json response.
    } catch (error) {
        console.error("Error in login:", error);
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
};

exports.logout = (req, res) => {
    res.clearCookie("token"); // Clear the cookie
    req.session.destroy(); // Destroy the session
    res.json({ success: true, message: "Logged out" });
};