const mongoose = require("mongoose");

const accessTokenSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  accessToken: { type: String, required: true },
});

const AccessToken = mongoose.model("AccessToken", accessTokenSchema);

module.exports = AccessToken;
