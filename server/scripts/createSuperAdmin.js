
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../src/models/User");

const createSuperAdmin = async () => {
    try {
        const adminEmail = process.env.SUPER_ADMIN_EMAIL;

        if (!adminEmail) {
            throw new Error("SUPER_ADMIN_EMAIL is missing in .env");
        }

        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing in .env");
        }

        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "campusos"
        });

        console.log("MongoDB connected");

        const user = await User.findOne({
            email: adminEmail.trim().toLowerCase()
        });

        if (!user) {
            console.log(
                "No account found for this email. Register this email first, then run this script again."
            );
            return;
        }

        if (user.role === "super_admin") {
            console.log("This user is already a Super Admin.");
            return;
        }

        user.role = "super_admin";
        await user.save();

        console.log("Super Admin role assigned successfully.");
        console.log("Email:", user.email);
    } catch (error) {
        console.error("Super Admin setup failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

createSuperAdmin();
