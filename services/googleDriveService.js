const { google } = require("googleapis");
const AccessToken = require("../models/accessToken");

exports.getAnalytics = async (req, res) => {
  try {
    console.log("Retrieving analytics from Google Drive...");
    const { userId } = req.query; // Get user ID from query parameters

    // Retrieve access token from MongoDB
    const accessTokenDoc = await AccessToken.findOne({ userId });
    if (!accessTokenDoc) {
      console.error("Access token not found for the user.");
      return res.status(404).send("Access token not found for the user.");
    }

    // Set access token for OAuth2 client
    const oAuth2Client = new google.auth.OAuth2();
    oAuth2Client.setCredentials({ access_token: accessTokenDoc.accessToken });

    // Access user's files metadata using Google Drive API
    const drive = google.drive({ version: "v3", auth: oAuth2Client });
    drive.files.list(
      {
        pageSize: 1000, // Increase the page size if needed
        fields: "files(id, name, mimeType, size, webViewLink)",
      },
      (err, response) => {
        if (err) {
          console.error("Error retrieving files:", err);
          return res
            .status(500)
            .send("Error retrieving files from Google Drive.");
        }
        const files = response.data.files;

        // Calculate analytics
        let fileCount = 0;
        let totalSize = 0;
        const fileTypeDistribution = {};
        const riskCounter = {}; // Assuming some arbitrary risk calculation

        files.forEach((file) => {
          fileCount++;
          totalSize += parseInt(file.size || 0); // Handle potential undefined size
          const fileType = file.mimeType.split("/")[0];
          fileTypeDistribution[fileType] = fileTypeDistribution[fileType]
            ? fileTypeDistribution[fileType] + 1
            : 1;
          riskCounter[file.name] = Math.random(); // Assigning random risk
        });

        const analytics = {
          fileCount,
          storageUsage: totalSize,
          fileTypeDistribution,
          filesWithLinks: files.map((file) => ({
            name: file.name,
            webViewLink: file.webViewLink,
          })),
          riskCounter,
        };

        res.json(analytics);
      }
    );
  } catch (error) {
    console.error("Error retrieving analytics:", error);
    res.status(500).send("Internal Server Error");
  }
};
