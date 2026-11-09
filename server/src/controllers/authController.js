
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const EmailOTP = require("../models/EmailOTP");

const sendEmail = require("../services/emailService");

const {
    generateOTP,
    hashOTP,
    getOTPExpiry
} = require("../services/otpService");


// ========================================
// REGISTER USER
// ========================================

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address"
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check existing user
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists with this email"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "student",
            isEmailVerified: false
        });

        // Generate OTP
        const otp = generateOTP();
        const otpHash = hashOTP(otp);

        // Delete previous verification OTP
        await EmailOTP.deleteMany({
            email: normalizedEmail,
            purpose: "email_verification"
        });

        // Save OTP
        await EmailOTP.create({
            email: normalizedEmail,
            otpHash,
            purpose: "email_verification",
            expiresAt: getOTPExpiry()
        });

        // Send OTP email
        let emailSent = false;

        try {
            await sendEmail(
                normalizedEmail,
                "CampusOS - Verify Your Email",
                `Hello ${name},

Welcome to CampusOS!

Your email verification OTP is: ${otp}

This OTP is valid for 5 minutes.

Please do not share this OTP with anyone.

Regards,
CampusOS Team`
            );

            emailSent = true;

        } catch (emailError) {
            console.error("Registration OTP email failed:", emailError.message);
        }

        return res.status(201).json({
            success: true,
            message: emailSent
                ? "Registration successful. Please verify your email using the OTP sent."
                : "Account created, but OTP email could not be sent. Please request a new OTP.",
            emailVerificationRequired: true,
            emailSent,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            }
        });

    } catch (error) {
        console.error("Registration Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during registration"
        });
    }
};


// ========================================
// LOGIN USER
// ========================================

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Find user and include password
        const user = await User.findOne({
            email: normalizedEmail
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check account status
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated"
            });
        }

        // Check password
        if (!user.password) {
            return res.status(401).json({
                success: false,
                message: "Please use Google login for this account"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check email verification
        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in",
                emailVerificationRequired: true
            });
        }

        // Generate access token
        const accessToken = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_ACCESS_SECRET,
            {
                expiresIn: "15m"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture
            }
        });

    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during login"
        });
    }
};


// ========================================
// SEND / RESEND EMAIL VERIFICATION OTP
// ========================================

const sendVerificationOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({
            email: normalizedEmail
        });

        // Generic response for missing or already verified accounts
        if (!user || user.isEmailVerified) {
            return res.status(200).json({
                success: true,
                message: "If the account requires verification, an OTP will be sent."
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is deactivated"
            });
        }
        // Check 60-second resend cooldown
const existingOTP = await EmailOTP.findOne({
    email: normalizedEmail,
    purpose: "email_verification"
});

if (existingOTP) {
    const timeDifference =
        Date.now() - existingOTP.createdAt.getTime();

    const cooldownTime = 60 * 1000;

    if (timeDifference < cooldownTime) {
        const remainingSeconds = Math.ceil(
            (cooldownTime - timeDifference) / 1000
        );

        return res.status(429).json({
            success: false,
            message: `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
            remainingSeconds
        });
    }
}

        // Generate new OTP
        const otp = generateOTP();
        const otpHash = hashOTP(otp);

        // Delete previous OTP
        await EmailOTP.deleteMany({
            email: normalizedEmail,
            purpose: "email_verification"
        });

        // Save new OTP
        await EmailOTP.create({
            email: normalizedEmail,
            otpHash,
            purpose: "email_verification",
            expiresAt: getOTPExpiry()
        });

        try {
            await sendEmail(
                normalizedEmail,
                "CampusOS - Email Verification OTP",
                `Hello ${user.name},

Your CampusOS email verification OTP is: ${otp}

This OTP is valid for 5 minutes.

Do not share this OTP with anyone.

Regards,
CampusOS Team`
            );

        } catch (emailError) {
            // Delete OTP if email delivery fails
            await EmailOTP.deleteMany({
                email: normalizedEmail,
                purpose: "email_verification"
            });

            throw emailError;
        }

        return res.status(200).json({
            success: true,
            message: "Verification OTP sent successfully"
        });

    } catch (error) {
        console.error("Send OTP Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to send OTP. Please try again later."
        });
    }
};


// ========================================
// VERIFY EMAIL OTP
// ========================================

const verifyEmailOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Validate six-digit OTP
        if (!/^\d{6}$/.test(String(otp))) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid 6-digit OTP"
            });
        }

        // Find OTP record
        const otpRecord = await EmailOTP.findOne({
            email: normalizedEmail,
            purpose: "email_verification"
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "OTP not found. Please request a new OTP."
            });
        }

        // Check expiration
        if (otpRecord.expiresAt < new Date()) {
            await EmailOTP.deleteOne({
                _id: otpRecord._id
            });

            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        // Maximum five attempts
        if (otpRecord.attempts >= 5) {
            await EmailOTP.deleteOne({
                _id: otpRecord._id
            });

            return res.status(429).json({
                success: false,
                message: "Maximum OTP attempts exceeded. Please request a new OTP."
            });
        }

        // Hash entered OTP
        const enteredOTPHash = hashOTP(String(otp));

        const storedHashBuffer = Buffer.from(
            otpRecord.otpHash,
            "hex"
        );

        const enteredHashBuffer = Buffer.from(
            enteredOTPHash,
            "hex"
        );

        // Compare hashes safely
        const isOTPValid =
            storedHashBuffer.length === enteredHashBuffer.length &&
            crypto.timingSafeEqual(
                storedHashBuffer,
                enteredHashBuffer
            );

        if (!isOTPValid) {
            otpRecord.attempts += 1;
            await otpRecord.save();

            return res.status(400).json({
                success: false,
                message: "Incorrect OTP",
                attemptsRemaining: 5 - otpRecord.attempts
            });
        }

        // Find user
        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            await EmailOTP.deleteOne({
                _id: otpRecord._id
            });

            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isEmailVerified) {
            await EmailOTP.deleteOne({
                _id: otpRecord._id
            });

            return res.status(200).json({
                success: true,
                message: "Email is already verified"
            });
        }

        // Mark email as verified
        user.isEmailVerified = true;
        await user.save();

        // Delete used OTP
        await EmailOTP.deleteOne({
            _id: otpRecord._id
        });

        return res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now log in."
        });

    } catch (error) {
        console.error("Verify OTP Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during OTP verification"
        });
    }
};


// ========================================
// GET LOGGED-IN USER
// ========================================

const getMe = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            user: req.user
        });

    } catch (error) {
        console.error("Get Me Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// ========================================
// UPDATE USER ROLE
// ========================================

const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const { id } = req.params;

        const allowedRoles = [
            "student",
            "faculty",
            "club_admin",
            "admin"
        ];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Never allow changing an existing super admin
        if (user.role === "super_admin") {
            return res.status(403).json({
                success: false,
                message: "Super Admin role cannot be changed through this endpoint"
            });
        }

        user.role = role;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "User role updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Update Role Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating role"
        });
    }
};


// ========================================
// EXPORT CONTROLLERS
// ========================================

module.exports = {
    registerUser,
    loginUser,
    sendVerificationOTP,
    verifyEmailOTP,
    getMe,
    updateUserRole
};
