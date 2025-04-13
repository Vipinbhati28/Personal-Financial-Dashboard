const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs"); // Hash passwords
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });

const app = express();
const PORT = 3001;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.log("MongoDB Connection Error:", err));

// User Schema & Model
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
});
const User = mongoose.model("User", UserSchema);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Set EJS as the Template Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve Static Files
app.use(express.static(path.join(__dirname, "public")));

// Authentication Middleware (JWT)
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.clearCookie("token");
        return res.redirect("/login");
    }
};

// Public Routes
app.get("/", (req, res) => {
    if (req.cookies.token) return res.redirect("/home");
    res.render("login", { error: null });
});

app.get("/signup", (res) => res.render("signup", { error: null }));
app.get("/login", (res) => res.render("login", { error: null }));

// ** Signup Route **
app.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        const token = jwt.sign({ id: newUser._id, name: newUser.name }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "Lax",
            secure: false, // Set to true in production with HTTPS
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        res.status(200).json({ success: true, redirect: "/home" });
    } catch (error) {
        console.log("Signup Error:", error);
        res.status(500).json({ success: false, message: "Signup Failed" });
    }
});

// ** Login Route **
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "Lax",
            secure: false, // Set to true in production with HTTPS
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        res.status(200).json({ success: true, redirect: "/home" });
    } catch (error) {
        console.log("Login Error:", error);
        res.status(500).json({ success: false, message: "Login Failed" });
    }
});

// ** Logout Route **
app.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});

// Protected Routes
app.get("/home", authMiddleware, (req, res) => {
    res.render("home", { user: req.user });
});

app.get("/home/transactions", authMiddleware, (req, res) => res.render("transactions", { user: req.user }));
app.get("/home/budget", authMiddleware, (req, res) => res.render("budget", { user: req.user }));
app.get("/home/analytics", authMiddleware, (req, res) => res.render("analytics", { user: req.user }));

// Route for Reports Page
app.get("/reports", (res) => { res.render("reports"); });

// Start the Server
app.listen(PORT, () => {
    console.log(`Frontend server is running on http://localhost:${PORT}`);
});