const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to MongoDB");

    // Fetch the updated user
    const user = await User.findOne({ email: "test@example.com" });

    if (!user) {
        console.log("User not found");
        return;
    }

    console.log("Stored Hashed Password:", user.password);

    const enteredPassword = "Test@123"; // The password I set for testing user login
    const isMatch = await bcrypt.compare(enteredPassword, user.password);

    console.log("Password Match:", isMatch);
    mongoose.connection.close();
});