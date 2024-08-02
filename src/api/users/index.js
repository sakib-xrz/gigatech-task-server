const express = require("express");
const UserController = require("../../controllers/user.controller.js");
const authGuard = require("../../middleware/authGuard.js");

const router = express.Router();

router.route("/").get(authGuard(), UserController.getUsers);
router.route("/me").get(authGuard(), UserController.getMe);

module.exports = router;
