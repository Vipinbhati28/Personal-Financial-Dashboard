const mongoose = require("mongoose");
const Transaction = require("./models/Transaction");
const connectDB = require("./config/db"); 

// Connect to the database
connectDB();

const fixTransactions = async () => {
    try {
        // Replace this with a valid user ID from your users collection
        const userId = "678a395c9d39db9a6a9c524e"; 

        if (!userId) {
            throw new Error("Please provide a valid user ID.");
        }

        // Update transactions that don't have a user field
        const updatedTransactions = await Transaction.updateMany(
            { user: { $exists: false } }, // Find transactions without a user field
            { $set: { user: userId } }    // Assign the user ID
        );

        console.log("Transactions updated:", updatedTransactions);
        process.exit(0); // Exit the script successfully
    } catch (error) {
        console.error("Error updating transactions:", error);
        process.exit(1); // Exit the script with an error
    }
};

// Call the function to fix transactions
fixTransactions();