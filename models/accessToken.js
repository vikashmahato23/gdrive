const mongoose = require("mongoose");

const accessTokenSchema = new mongoose.Schema({
  userId: String,
  accessToken: String,
});

const AccessToken = mongoose.model("AccessToken", accessTokenSchema);

module.exports = AccessToken;
