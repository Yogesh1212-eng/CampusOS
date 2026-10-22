
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        // Step 1: Get token from request headers
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access token is required"
            });
        }

        // Step 2: Extract token
        const token = authHeader.split(" ")[1];

        // Step 3: Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET
        );

        // Step 4: Find the user in database
        const user = await User.findById(decoded.userId);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Invalid or inactive user"
            });
        }

        // Step 5: Attach current user details to request
        req.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role
        };

        // Step 6: Allow the request to continue
        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Access token has expired"
            });
        }

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TypeError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid access token"
            });
        }

        console.error("Authentication middleware error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Authentication error"
        });
    }
};

module.exports = { protect };
