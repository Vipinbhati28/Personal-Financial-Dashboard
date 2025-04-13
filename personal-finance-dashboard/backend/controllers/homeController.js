const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const moment = require("moment");

exports.getHomeData = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.redirect("/login");

        const startOfMonth = moment().startOf("month").toDate();
        const endOfMonth = moment().endOf("month").toDate();

        // Fetch Transactions for Ongoing Month
        const transactions = await Transaction.find({
            userId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // Calculate Total Profit & Loss
        let totalProfit = 0, totalLoss = 0;
        transactions.forEach(txn => {
            if (txn.type === "investment" && txn.subType === "profit") totalProfit += txn.amount;
            if (txn.type === "investment" && txn.subType === "loss") totalLoss += txn.amount;
        });

        // Calculate Total Budget & Pie Chart Data
        const budgets = await Budget.find({ userId });
        let totalBudget = 0, budgetCategoryData = {};
        budgets.forEach(budget => {
            totalBudget += budget.amount;
            budgetCategoryData[budget.category] = (budgetCategoryData[budget.category] || 0) + budget.amount;
        });

        // Calculate Total Spending in Percentage
        let totalSpending = transactions
            .filter(txn => txn.type === "expense")
            .reduce((sum, txn) => sum + txn.amount, 0);
        let spendingPercentage = totalBudget ? ((totalSpending / totalBudget) * 100).toFixed(2) : 0;

        // Prepare Pie Chart Data
        let pieChartData = Object.entries(budgetCategoryData).map(([category, amount]) => ({ category, amount }));

        // Prepare Income vs. Expense Bar Chart Data
        let income = 0, expenses = 0;
        transactions.forEach(txn => {
            if (txn.type === "income") income += txn.amount;
            if (txn.type === "expense") expenses += txn.amount;
        });
        let barChartData = { income, expenses };

        // Fetch Recent Transactions (Last 10)
        const recentTransactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(10);

        // Render Home Page with Data
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
};