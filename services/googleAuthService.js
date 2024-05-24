const { OAuth2Client } = require("google-auth-library");
const AccessToken = require("../gdrive/models/accessToken");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URL;
const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const SCOPES = ["https://www.googleapis.com/auth/drive.metadata.readonly"];

exports.redirectToGoogleAuth = (req, res) => {
  console.log("Redirecting to Google authentication...");
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  res.redirect(authUrl);
};

exports.handleGoogleAuthCallback = async (req, res) => {
  console.log("Received callback from Google authentication...");
  const { code } = req.query;
  const { tokens } = await oAuth2Client.getToken(code);
  console.log("Tokens received:", tokens);
  // Save tokens to MongoDB or perform any other necessary actions
  res.redirect("/analytics");
};

exports.revokeGoogleAccess = async (req, res) => {
  console.log("Revoking Google Drive access...");
  const userId = "user_id"; // Replace with actual user ID

  // Find and delete the access token from MongoDB
  await AccessToken.findOneAndDelete({ userId });

  console.log("Google Drive access revoked.");

  res.send("Google Drive access revoked successfully.");
};
