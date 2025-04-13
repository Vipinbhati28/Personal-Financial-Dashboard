document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Fetch data from backend
        const response = await fetch("http://localhost:5000/home");
        
        if (!response.ok) {
            throw new Error("Failed to fetch home data");
        }

        const data = await response.json();

        // Update Total Profit & Loss
        document.getElementById("totalProfit").textContent = `₹${data.totalProfit}`;
        document.getElementById("totalLoss").textContent = `₹${data.totalLoss}`;

        // Update Budget Overview
        document.getElementById("totalBudget").textContent = `₹${data.totalBudget}`;
        document.getElementById("spendingPercentage").textContent = `${data.spendingPercentage}%`;

        // Update Pie Chart Data (Budget Allocation)
        const pieChartList = document.getElementById("pieChartList");
        pieChartList.innerHTML = ""; // Clear previous data
        data.pieChartData.forEach(category => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `<strong>${category.category}:</strong> ₹${category.amount}`;
            pieChartList.appendChild(listItem);
        });

        // Update Bar Chart Data (Income vs Expense)
        document.getElementById("incomeValue").textContent = `₹${data.barChartData.income}`;
        document.getElementById("expenseValue").textContent = `₹${data.barChartData.expenses}`;

        // Update Recent Transactions
        const transactionsList = document.getElementById("transactionsList");
        transactionsList.innerHTML = ""; // Clear previous data
        data.recentTransactions.forEach(transaction => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `<strong>${transaction.type}:</strong> ₹${transaction.amount} - ${new Date(transaction.date).toDateString()}`;
            transactionsList.appendChild(listItem);
        });

    } catch (error) {
        console.error("Error fetching home data:", error);
    }
});