document.addEventListener("DOMContentLoaded", function () {
    const togglePassword = document.getElementById("togglePassword");
    const passwordField = document.getElementById("password");
    const authForm = document.getElementById("authForm");

    // Toggle password visibility
    if (togglePassword && passwordField) {
        togglePassword.addEventListener("change", function () {
            passwordField.type = this.checked ? "text" : "password";
        });
    }

    // Handle form submission (Login / Signup)
    if (authForm) {
        authForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // Prevent default form submission

            const formType = authForm.dataset.type; // "login" or "signup"
            const url = formType === "signup"
                ? "http://localhost:5000/api/auth/register"
                : "http://localhost:5000/api/auth/login";

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const nameField = document.getElementById("name");
            const name = nameField ? nameField.value : "";

            const requestBody = formType === "signup"
                ? { name, email, password }
                : { email, password };

            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody),
                    credentials: "include",
                });

                const data = await response.json();
                console.log("Server response:", data); // Debugging line

                if (response.ok) {
                    setTimeout(() => {
                        window.location.href = "/home";
                    }, 100);
                } else {
                    alert(data.message || "Authentication failed");
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Something went wrong!");
            }
        });
    }
});