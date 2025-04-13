const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

// Add a new transaction
const addTransaction = async (req, res) => {  // Ensureing save all transaction in loggedIn user's Id
    try {
        const { type, amount, category, date, description } = req.body;
        const userId = req.user.id; // Get user ID from JWT

        if (!type || !amount || !category){
            return res.status(400).json({ error: "All fields (type, amount, category) are required."});
        }

        const newTransaction = new Transaction({ 
            user: userId,
            type, 
            amount, 
            category, 
            date, 
            description 
        });

        await newTransaction.save();
        res.status(201).json( {message: "Transaction added successfully!", transaction: newTransaction });
    } catch (error) {
        res.status(500).json({ message: "Error adding transaction", error: error.message });
    }
};

// Get all transactions with filtering and sorting
const getTransaction = async(req, res) => {
    try {
        const userId = req.user.id; // Get user ID from JWT

        // Extract query paramaters for filtering and sorting
        const { type, category, startDate, endDate, sortBy, sortOrder , page = 1, limit = 10 } = req.query;

        // Build the query object
        const query = { user: userId };

        if (type) {
            query.type = type; // Filter by type(income, expense, etc)
        }

        if (category) {
            query.category = category; // Filter by category
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate); // Filter by start date
            if (endDate) query.date.$lte = new Date(endDate); // Filter by end date
        }

        // Calculate skip and limit for pagination
        const skip = (page - 1) * limit;

        // Fetch transactions with filters, sorting, and pagination
        const transaction = await Transaction.find(query)
            .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 }) // Sort order
            .skip(skip) // Skip for pagination
            .limit(parseInt(limit)); // Limit results per page

        // Count total document for pagination metadata
        const total = await Transaction.countDocuments(query);
        
        res.status(200).json({
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            limit: parseInt(limit),
            transaction,
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching transactions", error });
    }
};

// Update a transaction
const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params; // transaction id from URL
        const userId = req.user.id; // user id from jwt

        // Find the transaction and ensure it belongs to logged-in user 
        const transaction = await Transaction.findOne({_id: id, user: userId });

        if (!transaction) {
            return res.status(400).json({ error: "Transaction not found or unauthorized0" });
        }

        // Update the transaction with new data
        const updatedTransaction = await Transaction.findByIdAndUpdate({ _id: id, user: req.user.id }, req.body, { new: true });
        res.status(200).json({ message: "Transaction updated successfully", transaction: updatedTransaction });
    } catch (error) {
        res.status(500).json({ message: "Error updating transaction", error: error.message });
    }
};

// Delete a transaction
const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find the transaction and ensure it belongs to the logged-in user
        const transaction = await Transaction.findOne({_id: id, user: userId });

        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found or unauthorized "});
        }

        // Delete the transaction
        await Transaction.findByIdAndDelete(id);
        res.status(200).json({ message: "Transaction deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting transaction", error });
    }
};

// Analytics logic 
const getAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;
        let startDate = req.query.start;
        let endDate = req.query.end;
        let range = parseInt(req.query.range);

        let query = { user: userId };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        } else if (range) {
            const today = new Date();
            const pastDate = new Date();
            pastDate.setDate(today.getDate() - range);
            query.date = {
                $gte: pastDate,
                $lte: today,
            };
        }

        const transactions = await Transaction.find(query);

        let earnings = {};
        let spending = {};
        let dates = [];

        transactions.forEach((txn) => {
            const date = txn.date.toISOString().split("T")[0];
            if (!dates.includes(date)) {
                dates.push(date);
            }
            if (txn.type === "income") {
                earnings[date] = (earnings[date] || 0) + txn.amount;
            } else if (txn.type === "expense") {
                spending[date] = (spending[date] || 0) + txn.amount;
            }
        });

        dates.sort();

        const earningsData = dates.map((date) => earnings[date] || 0);
        const spendingData = dates.map((date) => spending[date] || 0);

        res.status(200).json({ dates, earnings: earningsData, spending: spendingData });
    } catch (error) {
        res.status(500).json({ message: "Error fetching analytics", error: error.message });
    }
};

// Get total profit for last 30 days and ongoing month
const getProfitSummary = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get today's date
        const today = new Date();

        // Get the start of the ongoing month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Get the date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // Fetch transactions for the last 30 days and ongoing month
        const transactions = await Transaction.find({
            user: userId,
            type: "investment", // Only considering investments
            createdAt: { $gte: thirtyDaysAgo } // Transactions within the last 30 days
        });

        let last30DaysProfit = 0;
        let ongoingMonthProfit = 0;

        transactions.forEach(txn => {
            if (txn.subType === "profit") {
                if (txn.createdAt >= startOfMonth) {
                    ongoingMonthProfit += txn.amount;
                }
                last30DaysProfit += txn.amount;
            }
        });

        res.status(200).json({
            last30DaysProfit,
            ongoingMonthProfit
        });

    } catch (error) {
        console.error("Error fetching profit summary:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// fetching reports for last month and ongoing month
const getReports = async (req, res) => {
    try {
        // Ensure user is authenticated
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: Please log in" });
        }

        // Get today's date
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Get first and last dates of the current and last month
        const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
        const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
        const endOfLastMonth = new Date(currentYear, currentMonth, 0);

        // Fetch transactions for last and ongoing month
        const transactions = await Transaction.find({
            user: userId,
            date: { $gte: startOfLastMonth } // Fetch transactions from last month onwards
        });

        // Initialize report structure
        let report = {
            lastMonth: {
                totalBudget: 0,
                categoryBudget: {},
                totalIncome: 0,
                totalExpenses: 0,
                totalInvestment: 0,
                profit: 0,
                loss: 0,
            },
            ongoingMonth: {
                totalBudget: 0,
                categoryBudget: {},
                totalIncome: 0,
                totalExpenses: 0,
                totalInvestment: 0,
                profit: 0,
                loss: 0,
            }
        };

        // Process Transactions
        transactions.forEach(txn => {
            const txnDate = new Date(txn.date);
            const txnMonth = txnDate.getMonth();
            const txnYear = txnDate.getFullYear();

            // Determine if transaction belongs to last month or current month
            const isLastMonth = txnMonth === currentMonth - 1 && txnYear === currentYear;
            const isOngoingMonth = txnMonth === currentMonth && txnYear === currentYear;

            if (isLastMonth || isOngoingMonth) {
                const target = isLastMonth ? report.lastMonth : report.ongoingMonth;

                // Add budget allocation for the category
                if (!target.categoryBudget[txn.category]) {
                    target.categoryBudget[txn.category] = 0;
                }
                target.categoryBudget[txn.category] += txn.amount;
                target.totalBudget += txn.amount;

                // Categorize transactions
                if (txn.type === "income") {
                    target.totalIncome += txn.amount;
                } else if (txn.type === "expense") {
                    target.totalExpenses += txn.amount;
                } else if (txn.type === "investment") {
                    target.totalInvestment += txn.amount;
                    if (txn.subType === "profit") {
                        target.profit += txn.amount;
                    } else if (txn.subType === "loss") {
                        target.loss += txn.amount;
                    }
                }
            }
        });

        res.status(200).json(report);
    } catch (error) {
        console.error("Error generating reports:", error);
        res.status(500).json({ message: "Error generating reports", error: error.message });
    }
};

module.exports = { getReports };


module.exports = { addTransaction, getTransaction, updateTransaction, deleteTransaction, getAnalytics, getProfitSummary, getReports };