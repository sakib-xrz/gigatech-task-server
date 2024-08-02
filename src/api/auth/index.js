const express = require("express");
const AuthController = require("../../controllers/auth.controller.js");

const router = express.Router();

router.route("/register").post(AuthController.register);

router.route("/login").post(AuthController.login);

module.exports = router;
