const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./middleware/authMiddleware"); // Import JWT Middleware

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Set EJS as the template engine
app.set("views", path.join(__dirname, "../personal-finance-dashboard-frontend/views"));
console.log("Views path:", path.join(__dirname, "../personal-finance-dashboard-frontend/views"));
app.set("view engine", "ejs");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "http://localhost:3001", credentials: true }));
app.use(cookieParser());

// Serve Static Files
app.use(express.static(path.join(__dirname, "../personal-finance-dashboard-frontend/public")));

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected...");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

// Connect to DB before setting up routes
connectDB().then(() => {
    // Import Routes
    const transactionRoutes = require("./routes/transactionRoutes");
    const authRoutes = require("./routes/authRoutes");
    const transactionController = require("./controllers/transactionController");
    const budgetRoutes = require("./routes/budgetRoutes");

    // Use Routes
    app.use("/api/transactions", transactionRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/budget", budgetRoutes);

    
    app.get("/login", (req, res) => res.render("login"));
    app.get("/signup", (req, res) => res.render("signup"));

    // Home Route (Redirect Unauthorized Users to Login)
    app.get("/home", authMiddleware, (req, res) => {
        console.log("Authenticated User:", req.user);
        res.render("home", { userId: req.user.id });
    });

    app.get("/transactions", authMiddleware, (req, res) => {
        res.render("transactions", { user: req.user });
    });

    app.get("/budget", authMiddleware, (req, res) => {
        res.render("budget", { userId: req.user.id });
    });

    app.get("/reports", authMiddleware, (req, res) => {
        res.render("reports", { userId: req.user.id });
    });

    // Logout: Clears JWT Token from Cookies
    app.get("/logout", (req, res) => {
        res.clearCookie("token"); // Clear JWT token
        res.redirect("/login");
    });

    // Root Route - Redirect to Home if Authenticated, Otherwise to Login
    app.get("/", (req, res) => {
        const token = req.cookies.token;
        if (token) {
            try {
                jwt.verify(token, process.env.JWT_SECRET);
                return res.redirect("/home");
            } catch (error) {
                res.clearCookie("token");
            }
        }
        return res.redirect("/login");
    });

    // Analytics API (Supports Date Filters)
    app.get("/api/analytics", authMiddleware, transactionController.getAnalytics);


    app.use((err, req, res, next) => {
        if (err.status === 401) {
            return res.redirect("/login");
        }
        next(err);
    });

    // Start Server After DB Connection
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
});
