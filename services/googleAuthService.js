const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const AccessToken = require("../models/accessToken");
const { google } = require("googleapis");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URL;
const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const SCOPES = [
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/userinfo.profile",
];

exports.redirectToGoogleAuth = (req, res) => {
  console.log("Redirecting to Google authentication...");
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  res.send(authUrl);
};

exports.handleGoogleAuthCallback = async (req, res) => {
  try {
    console.log("Received callback from Google authentication...");
    const { code } = req.query;
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Fetch user info from Google
    const { data } = await axios.get(
      "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    const userId = data.id; // Google's unique user ID

    // Save access token to MongoDB
    await AccessToken.findOneAndUpdate(
      { userId },
      { accessToken: tokens.access_token },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log("Access token and user ID saved to MongoDB.");
const frontendUrl = `${process.env.FRONTEND_URL}${userId}`;
    // Redirect to a route that displays analytics/
    res.redirect(frontendUrl);
    // res.redirect(`/analytics?userId=${userId}`);
  } catch (error) {
    console.error("Error during Google authentication callback:", error);
    res.status(500).send("Internal Server Error");
  }
};


exports.revokeGoogleAccess = async (req, res) => {
  try {
    console.log("Revoking Google Drive access...");

    const { userId } = req.body; // Get user ID from request body
    console.log("Received userId:", userId); // Check if userId is received

    if (!userId) {
      return res.status(400).send("User ID is required");
    }

    // Retrieve the access token from MongoDB
    const tokenDoc = await AccessToken.findOne({ userId });
    if (!tokenDoc) {
      return res.status(404).send("Access token not found for the user.");
    }

    // Initialize OAuth2 client
    const oAuth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    oAuth2Client.setCredentials({ access_token: tokenDoc.accessToken });

    // Revoke the token
    await oAuth2Client.revokeToken(tokenDoc.accessToken);

    // Delete the access token from MongoDB
    await AccessToken.findOneAndDelete({ userId });

    console.log("Google Drive access revoked.");

    res.send("Google Drive access revoked successfully.");
  } catch (error) {
    console.error("Error revoking Google Drive access:", error);
    res.status(500).send("Internal Server Error");
  }
};