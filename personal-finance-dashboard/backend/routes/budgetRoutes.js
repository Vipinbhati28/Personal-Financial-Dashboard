const express = require("express");
const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Set budget for a category
router.post("/set", authMiddleware, async (req, res) => {
    try {
        console.log("Received budget set request:", req.body); // Debugging
        const { category, limit, month, year } = req.body;
        const userId = req.user.id;

        // Check if budget for this month/year already exists
        let budget = await Budget.findOne({ user: userId, month, year });

        if (!budget) {
            console.log("Creating a new budget entry...");
            budget = new Budget({ user: userId, month, year, categories: [] });
        }

        // Check if category exists in the budget
        const existingCategory = budget.categories.find(cat => cat.name === category);
        if (existingCategory) {
            return res.status(400).json({ message: "Category already exists" });
        }

        budget.categories.push({ name: category, limit, spent: 0 });

        await budget.save();
        console.log("Budget saved successfully:", budget); // Debugging
        res.status(201).json({ message: "Budget set successfully", budget });
    } catch (error) {
        console.error("Error setting budget:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get budget details for a user
router.get("/:month/:year", authMiddleware, async (req, res) => {
    try {
        const { month, year } = req.params;
        console.log("Received budget set request:", req.body);
        const userId = req.user.id; // Get user ID from authMiddleware
        console.log(userId);

        const budgets = await Budget.find({ user: userId, month, year }).populate("user", "name email");

        if (!budgets.length) {
            return res.status(404).json({ message: "No budgets found for this month and year" });
        }
        
        res.status(200).json(budgets);

    } catch (error) {
        console.error("Error fetching budgets:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Update spent amount for each category
router.put("/update-spent", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        // Construct date range for the current month
        const startDate = new Date(year, month - 1, 1); // First day of the month
        const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month

        // Fetch transactions within the current month
        const transactions = await Transaction.find({
            user: userId,
            date: {
                $gte: startDate,
                $lte: endDate,
            },
            type: "expense",
        });

        // Group transactions by category and calculate total spent
        let categorySpending = {};
        transactions.forEach((txn) => {
            categorySpending[txn.category] =
                (categorySpending[txn.category] || 0) + txn.amount;
        });

        // Update each budget entry with the spent amount
        const budget = await Budget.findOne({ user: userId, month, year });

        if (!budget) {
            return res.status(200).json({ message: "No budget found for this month", budget: [] });
        }

        budget.categories.forEach((category) => {
            category.spent = categorySpending[category.name] || 0;
        });

        await budget.save();
        res.status(200).json({ message: "Budget updated successfully", budget });
    } catch (error) {
        console.error("Error updating budget spent amount:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Update budget whenever a transaction happens
router.post("/update", authMiddleware, async (req, res) => {
    try {
        const { category, amount } = req.body;
        const userId = req.user.id;

        const budget = await Budget.findOne({ 
            user: userId, 
            categories: { $elemMatch: { name: category } } // Corrected field reference
        });

        if (!budget) {
            return res.status(404).json({ error: "Budget not found" });
        }

        // Find and update the correct category
        budget.categories.forEach(cat => {
            if (cat.name === category) {
                cat.spent += amount;
            }
        });

        await budget.save();

        res.status(200).json({ message: "Budget updated", budget });

    } catch (error) {
        console.error("Error updating budget:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch budget with progress calculation
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const budget = await Budget.findOne({ user: userId, month, year });

        if (budget){
            res.status(200).json(budget.categories);
        } else {
            res.status(200).json([]);
        }

    } catch (error) {
        console.error("Error fetching budget:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch user's custom budget categories
router.get("/categories", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const categories = await Budget.distinct("categories.name", { user: userId }); // Corrected query
        res.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
});

module.exports = router;