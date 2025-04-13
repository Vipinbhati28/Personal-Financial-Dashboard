// importing mongoose
const mongoose = require("mongoose");

//Defining schemas
// type specifies whether transaction is income , expense or investmenst like this...
const transactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Link transaction to a user
    type: { type: String, enum: ["income", "expense", "investment"], required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: function() { return this.type === "expense"; } }, // Category for expenses
    investmentType: { type: String, enum: ["profit", "loss"], required: function() { return this.type === "investment"; } }, // Profit or Loss for investment
    date: { type: Date, default: Date.now },
    description: { type: String }
});

// creating models 
// this creates a mongodb collection called "transactions", based on transaction schema.
// transaction models allows creates, read, update and delete transactions in DB. 
const Transaction = mongoose.model("Transaction", transactionSchema);


// Exporing models so we can use it in other parts of projects.
module.exports = Transaction;