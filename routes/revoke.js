const express = require("express");
const router = express.Router();
const revokeController = require("../controllers/revokeController");

router.post("/google/revoke", revokeController.revokeGoogleAccess);

module.exports = router;
