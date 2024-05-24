const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/google", authController.redirectToGoogleAuth);
router.get("/google/callback", authController.handleGoogleAuthCallback);

module.exports = router;
