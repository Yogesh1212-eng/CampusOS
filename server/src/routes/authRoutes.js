
const express = require("express");
const router = express.Router();

const { registerUser, loginUser,getMe } = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/authorizeRoles");

// POST /api/auth/register
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);

// Temporary Admin-only testing route
router.get(
    "/admin-test",
    protect,
    authorizeRoles("admin", "super_admin"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Admin access granted",
            user: req.user
        });
    }
);

module.exports = router;
