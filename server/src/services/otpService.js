
const crypto = require("crypto");

// Generate a secure 6-digit OTP
const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

// Hash OTP using SHA-256
const hashOTP = (otp) => {
    return crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");
};

// OTP expiry: 5 minutes
const getOTPExpiry = () => {
    return new Date(Date.now() + 5 * 60 * 1000);
};

module.exports = {
    generateOTP,
    hashOTP,
    getOTPExpiry
};
