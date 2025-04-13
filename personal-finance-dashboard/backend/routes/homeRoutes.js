const express = require("express");
const router = express.Router();
const axios = require("axios"); // Import axios for API calls
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // Get user ID from token

        // Fetch Transactions Data
        const transactionsResponse = await axios.get("http://localhost:3001/api/transactions/get", {
            headers: { Authorization: `Bearer ${req.session.token}` }
        });
        const transactions = transactionsResponse.data;

        // Fetch Budget Data
        const budgetResponse = await axios.get("http://localhost:3001/api/budget/get", {
            headers: { Authorization: `Bearer ${req.session.token}` }
        });
        const budgets = budgetResponse.data;

        // Calculate Total Profit and Total Loss
        let totalProfit = 0;
        let totalLoss = 0;
        let income = 0;
        let expenses = 0;
        let totalBudget = 0;
        let totalSpending = 0;
        let budgetCategoryData = {}; // For Pie Chart

        transactions.forEach(transaction => {
            if (transaction.type === "investment" && transaction.subType === "profit") {
                totalProfit += transaction.amount;
            } else if (transaction.type === "investment" && transaction.subType === "loss") {
                totalLoss += transaction.amount;
            } else if (transaction.type === "income") {
                income += transaction.amount;
            } else if (transaction.type === "expense") {
                expenses += transaction.amount;
            }
        });

        // Calculate Total Budget & Spending
        budgets.forEach(budget => {
            totalBudget += budget.amount;
            budgetCategoryData[budget.category] = (budgetCategoryData[budget.category] || 0) + budget.amount;
        });

        transactions.forEach(transaction => {
            if (transaction.type === "expense") {
                totalSpending += transaction.amount;
            }
        });

        let spendingPercentage = totalBudget ? ((totalSpending / totalBudget) * 100).toFixed(2) : 0;

        // Format Pie Chart Data
        let pieChartData = Object.entries(budgetCategoryData).map(([category, amount]) => ({
            category,
            amount
        }));

        // Prepare Bar Chart Data
        let barChartData = { income, expenses };

        // Get Recent Transactions (Last 10)
        const recentTransactions = transactions.slice(-10).reverse();

        res.render("home", {
            totalProfit,
            totalLoss,
            totalBudget,
            spendingPercentage,
            pieChartData,
            barChartData,
            recentTransactions
        });

    } catch (err) {
        console.error("Error fetching Home Page data:", err);
        res.status(500).send("Error fetching data");
    }
});

module.exports = router;