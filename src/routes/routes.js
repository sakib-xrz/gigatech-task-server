const express = require("express");

const authRoutes = require("../api/auth/index.js");
const userRoutes = require("../api/users/index.js");
const appointmentRoutes = require("../api/appointments/index.js");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/appointments", appointmentRoutes);

module.exports = router;
