document.addEventListener("DOMContentLoaded", async function() {
    const typeSelect = document.getElementById("type");
    const categorySelect = document.getElementById("category");
    const transactionForm = document.getElementById("transaction-form");
    const transactionList = document.getElementById("transaction-list");

    // Fetch categories for expenses from backend
    async function fetchBudgetCategories() {
        try {
            const response = await fetch("/api/budget/categories");
            const categories = await response.json();
            return categories;
        } catch (error) {
            console.error("Error fetching categories:", error);
            return [];
        }
    }

    // Update dropdown with categories
    function updateCategoryDropdown(categories) {
        categorySelect.innerHTML = ""; 
        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    // Handle dropdown change
    typeSelect.addEventListener("change", async function () {
        categorySelect.innerHTML = ""; 

        if (typeSelect.value === "expense") {
            const budgetCategories = await fetchBudgetCategories();
            updateCategoryDropdown(budgetCategories);
        } else if (typeSelect.value === "investment") {
            categorySelect.innerHTML = `
                <option value="profit">Profit</option>
                <option value="loss">Loss</option>
            `;
        } else {
            categorySelect.innerHTML = `
                <option value="salary">Salary</option>
                <option value="bonus">Bonus</option>
            `;
        }
    });

    typeSelect.dispatchEvent(new Event("change"));

    // Function to fetch transactions from backend
    async function fetchTransactions() {
        try {
            const response = await fetch("/api/transactions"); // Adjust if needed
            const transactions = await response.json();

            transactionList.innerHTML = ""; // Clear table before adding new rows
            transactions.forEach(txn => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${txn.type}</td>
                    <td>${txn.category}</td>
                    <td>₹${txn.amount}</td>
                    <td>${new Date(txn.date).toLocaleDateString()}</td>
                `;
                transactionList.appendChild(row);
            });
        } catch (error) {
            console.error("Error fetching transactions:", error);
        }
    }

    // Form submission to add a transaction
    transactionForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const newTransaction = {
            type: typeSelect.value,
            category: categorySelect.value,
            amount: document.getElementById("amount").value,
            date: document.getElementById("date").value
        };

        try {
            const response = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTransaction)
            });

            if (response.ok) {
                alert("Transaction added successfully!");
                fetchTransactions(); // Refresh transaction list
                transactionForm.reset(); // Clear form
            } else {
                console.error("Failed to add transaction");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    });

    fetchTransactions(); // Load transactions when page loads
});