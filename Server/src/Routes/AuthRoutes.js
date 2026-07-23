const express = require("express");
const router = express.Router();
const { login, createPassword } = require("../Controllers/AuthController");

router.post("/login", login);
router.post("/create-password", createPassword);

module.exports = router;
