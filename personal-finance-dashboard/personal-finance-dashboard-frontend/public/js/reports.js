const API_BASE_URL = "http://localhost:5000"; // Backend URL

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${API_BASE_URL}/api/transactions/reports`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const reportData = await response.json();
        console.log("Fetched Report Data:", reportData); // Debugging

        // Function to safely set innerText
        const setInnerText = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.innerText = value;
            }
        };

        // Update budget, income, expenses, investment, profit, and loss
        setInnerText("lastMonthBudget", reportData.lastMonth.totalBudget);
        setInnerText("ongoingMonthBudget", reportData.ongoingMonth.totalBudget);

        setInnerText("lastMonthIncome", reportData.lastMonth.totalIncome);
        setInnerText("ongoingMonthIncome", reportData.ongoingMonth.totalIncome);

        setInnerText("lastMonthExpenses", reportData.lastMonth.totalExpenses);
        setInnerText("ongoingMonthExpenses", reportData.ongoingMonth.totalExpenses);

        setInnerText("lastMonthInvestment", reportData.lastMonth.totalInvestment);
        setInnerText("ongoingMonthInvestment", reportData.ongoingMonth.totalInvestment);

        setInnerText("lastMonthProfit", reportData.lastMonth.profit);
        setInnerText("ongoingMonthProfit", reportData.ongoingMonth.profit);

        setInnerText("lastMonthLoss", reportData.lastMonth.loss);
        setInnerText("ongoingMonthLoss", reportData.ongoingMonth.loss);

        // Populate Category-Wise Budget Table
        const categoryTable = document.getElementById("categoryBudgetTable");
        if (categoryTable) {
            categoryTable.innerHTML = `<tr><th>Category</th><th>Last Month</th><th>Ongoing Month</th></tr>`;

            // Get unique category names from both months
            const categories = new Set([
                ...Object.keys(reportData.lastMonth.categoryBudget),
                ...Object.keys(reportData.ongoingMonth.categoryBudget),
            ]);

            categories.forEach(category => {
                const lastMonthAmount = reportData.lastMonth.categoryBudget[category] || 0;
                const ongoingMonthAmount = reportData.ongoingMonth.categoryBudget[category] || 0;

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${category}</td>
                    <td>${lastMonthAmount}</td>
                    <td>${ongoingMonthAmount}</td>
                `;
                categoryTable.appendChild(row);
            });
        }

    } catch (error) {
        console.error("Error loading reports:", error);
        alert("Error loading reports.");
    }
});