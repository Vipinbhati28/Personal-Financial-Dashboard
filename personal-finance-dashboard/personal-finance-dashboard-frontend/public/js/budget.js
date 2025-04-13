document.addEventListener("DOMContentLoaded", () => {
    const budgetForm = document.getElementById("budgetForm");
    const budgetList = document.getElementById("budgetList");

    // Function to get current month and year dynamically
    const getCurrentMonthYear = () => {
        const now = new Date();
        return { month: now.getMonth() + 1, year: now.getFullYear() };
    };

    // Function to fetch and display budget
    const fetchBudget = async () => {
        const { month, year } = getCurrentMonthYear();

        try {
            const response = await fetch(`/api/budget/${month}/${year}`); // Corrected API endpoint
            const budgets = await response.json();

            budgetList.innerHTML = ""; // Clear previous data

            if (!Array.isArray(budgets) || budgets.length === 0) {
                budgetList.innerHTML = `<tr><td colspan="4">No budget data available.</td></tr>`;
                return;
            }

            budgets.forEach(budget => {
                const progress = (budget.spent / budget.limit) * 100;
                const progressBarColor = progress > 100 ? "red" : "green";

                budgetList.innerHTML += `
                    <tr>
                        <td>${budget.category}</td>  <!-- Changed 'name' to 'category' -->
                        <td>₹${budget.limit.toFixed(2)}</td>
                        <td>₹${budget.spent.toFixed(2)}</td>
                        <td>
                            <div class="progress-container">
                                <div class="progress-bar" 
                                     style="width: ${Math.min(progress, 100)}%; background-color: ${progressBarColor};">
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            });
        } catch (error) {
            console.error("Error fetching budget:", error);
            budgetList.innerHTML = `<tr><td colspan="4">Failed to load budget data.</td></tr>`;
        }
    };

    // Handle Budget Form Submission
    budgetForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const category = document.getElementById("category").value;
        const limit = parseFloat(document.getElementById("limit").value);
        const { month, year } = getCurrentMonthYear();

        if (!category || isNaN(limit) || limit <= 0) {
            alert("Please enter a valid category and budget limit.");
            return;
        }

        try {
            const response = await fetch("/api/budget/set", {  // Corrected API endpoint
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category, limit, month, year })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Budget set successfully!");
                budgetForm.reset();
                fetchBudget();
            } else {
                alert(`Error: ${data.message || "Failed to set budget"}`);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong. Please try again.");
        }
    });

    fetchBudget(); // Load budget on page load
});