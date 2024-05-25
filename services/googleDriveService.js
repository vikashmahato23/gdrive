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

    // Helper function to list files with a query
    const listFiles = async (query) => {
      const response = await drive.files.list({
        q: query,
        pageSize: 1000,
        fields:
          "files(id, name, mimeType, size, webViewLink, owners, sharedWithMeTime, shared)",
      });

      const files = response.data.files.map((file) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        webViewLink: file.webViewLink,
        createdByUser: file.owners && file.owners.find((owner) => owner.me),
        isShared: file.shared,
      }));

      // Fetch additional metadata for pictures (image/* MIME type)
      const pictureFiles = files.filter((file) =>
        file.mimeType.startsWith("image/")
      );
      await Promise.all(
        pictureFiles.map(async (file) => {
          const metadata = await drive.files.get({
            fileId: file.id,
            fields: "imageMediaMetadata",
          });
          if (metadata.data && metadata.data.imageMediaMetadata) {
            file.imageMetadata = metadata.data.imageMediaMetadata;
          }
        })
      );

      return files;
    };

    // Retrieve files
    const files = await listFiles("'me' in owners");

    // Calculate analytics
    const categorizeFiles = (files) => {
      const categories = {
        images: [],
        videos: [],
        pdfs: [],
        others: [],
      };

      files.forEach((file) => {
        if (file.mimeType.startsWith("image/")) {
          categories.images.push(file);
        } else if (file.mimeType.startsWith("video/")) {
          categories.videos.push(file);
        } else if (file.mimeType === "application/pdf") {
          categories.pdfs.push(file);
        } else {
          categories.others.push(file);
        }
      });

      return categories;
    };

    const calculateAnalytics = (files) => {
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

      return {
        fileCount,
        storageUsage: totalSize,
        fileTypeDistribution,
        filesWithDetails: files,
        riskCounter,
      };
    };

    const categories = categorizeFiles(files);
    const analytics = {
      images: calculateAnalytics(categories.images),
      videos: calculateAnalytics(categories.videos),
      pdfs: calculateAnalytics(categories.pdfs),
      others: calculateAnalytics(categories.others),
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error retrieving analytics:", error);
    res.status(500).send("Internal Server Error");
  }
};
