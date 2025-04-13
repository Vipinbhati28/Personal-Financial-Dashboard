document.addEventListener("DOMContentLoaded", function () {
    const chartCanvas = document.getElementById("analyticsChart");
    let analyticsChart;

    const filterButtons = document.querySelectorAll(".filter-btn");
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const applyButton = document.getElementById("applyFilter");

    // Function to fetch analytics data
    function fetchAnalytics(range = 30, startDate = "", endDate = "") {
        let url = `/api/transactions/analytics?range=${range}`;
        if (startDate && endDate) {
            url = `/api/transactions/analytics?range=custom&start=${startDate}&end=${endDate}`;
        }

        // Get the token from cookies
        const token = getCookie("token");
        if (!token) {
            console.error("Authorization token not found.");
            return;
        }

        fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(response => response.json())
            .then(data => {
                updateChart(data.dates, data.earnings, data.spending);
            })
            .catch(error => console.error("Error fetching analytics data:", error));
    }

    // Function to get cookie value
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    // Function to update the chart
    function updateChart(labels, earnings, spending) {
        if (analyticsChart) {
            analyticsChart.destroy();
        }

        analyticsChart = new Chart(chartCanvas, {
            type: "line",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Earnings",
                        data: earnings,
                        borderColor: "green",
                        backgroundColor: "rgba(0, 128, 0, 0.2)",
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: "Spending",
                        data: spending,
                        borderColor: "red",
                        backgroundColor: "rgba(255, 0, 0, 0.2)",
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: "top" }
                },
                scales: {
                    x: {
                        title: { display: true, text: "Date" },
                        ticks: { autoSkip: true, maxTicksLimit: 10 }
                    },
                    y: {
                        title: { display: true, text: "Amount (₹)" },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Handle filter button clicks
    filterButtons.forEach(button => {
        button.addEventListener("click", function () {
            const range = this.getAttribute("data-range");

            filterButtons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");

            // Hide custom date inputs when a predefined filter is selected
            startDateInput.style.display = "none";
            endDateInput.style.display = "none";
            applyButton.style.display = "none";

            fetchAnalytics(range);
        });
    });

    // Show custom date inputs when "Custom" is selected
    document.getElementById("customRange").addEventListener("click", function () {
        startDateInput.style.display = "inline-block";
        endDateInput.style.display = "inline-block";
        applyButton.style.display = "inline-block";

        // Remove active class from other buttons and activate "Custom"
        filterButtons.forEach(btn => btn.classList.remove("active"));
        this.classList.add("active");
    });

    // Apply custom date range
    applyButton.addEventListener("click", function () {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (startDate && endDate) {
            fetchAnalytics("custom", startDate, endDate);
        } else {
            console.error("Start and end dates are required for custom filter.");
        }
    });

    // Initial fetch (Last 30 days by default)
    fetchAnalytics(30);
});