const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const authMiddleware = require("../middleware/authMiddleware");
const { route } = require("./authRoutes");
const protect = require("../middleware/authMiddleware");

// Adding authentication middleware before adding a transaction
router.post("/add", authMiddleware,  transactionController.addTransaction);

// get all transaction by ID
router.get("/", authMiddleware, transactionController.getTransaction);

// Updating all transaction by ID
router.put("/:id", authMiddleware, transactionController.updateTransaction);

// delete transaction by ID
router.delete("/:id", authMiddleware, transactionController.deleteTransaction);

// Provide user with analytic about transactions like total income, expences, monthly summaries etc.
// authMiddleware and protect are same
router.get("/analytics", protect, transactionController.getAnalytics);

// get total profit and loss for last 30 days and ongoing month
router.get("/profit-summary", authMiddleware, transactionController.getProfitSummary);

router.get("/reports", authMiddleware, transactionController.getReports);

module.exports = router;