const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: Number, required: true }, // Store the month for budget tracking
    year: { type: Number, required: true }, // Store the year for budget tracking
    categories: [
        {
            name: { type: String, required: true }, // Category name
            limit: { type: Number, required: true }, // Budget limit for the category
            spent: { type: Number, default: 0 } // Track how much is spent
        }
    ]
});

// Function to update spent amount when a transaction occurs
budgetSchema.methods.updateSpent = async function (categoryName, amount) {
    const category = this.categories.find(cat => cat.name === categoryName);
    if (category) {
        category.spent += amount;
        await this.save();
    }
};

const Budget = mongoose.model("Budget", budgetSchema);
module.exports = Budget;