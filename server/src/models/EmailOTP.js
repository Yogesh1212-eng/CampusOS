
const mongoose = require("mongoose");

const emailOTPSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        otpHash: {
            type: String,
            required: true
        },

        purpose: {
            type: String,
            enum: ["email_verification", "password_reset"],
            required: true
        },

        expiresAt: {
            type: Date,
            required: true
        },

        attempts: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Automatically remove expired OTP documents
emailOTPSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

const EmailOTP = mongoose.model("EmailOTP", emailOTPSchema);

module.exports = EmailOTP;

