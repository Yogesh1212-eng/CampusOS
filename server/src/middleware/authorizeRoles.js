
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // Check whether authentication ran first
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Please login to access this resource"
            });
        }

        // Check the user's current role
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to perform this action"
            });
        }

        // User has the required role
        next();
    };
};

module.exports = authorizeRoles;
