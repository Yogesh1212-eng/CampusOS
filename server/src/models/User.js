
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            default: null,
            select: false
        },

        googleId: {
            type: String,
            default: null,
            sparse: true
        },

        profilePicture: {
            type: String,
            default: ""
        },

        role: {
            type: String,
            enum: [
                "student",
                "faculty",
                "club_admin",
                "admin",
                "super_admin"
            ],
            default: "student"
        },

        isActive: {
            type: Boolean,
            default: true
        },

        isEmailVerified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
