
const rateLimit = require("express-rate-limit");

const otpRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes

    max: 5, // Maximum 5 requests

    message: {
        success: false,
        message: "Too many OTP requests. Please try again after 15 minutes."
    },

    standardHeaders: true,
    legacyHeaders: false
});

module.exports = otpRateLimiter;
