const functions = require("firebase-functions");
const  postToLinkedIn  = require("./linkedinClient");

// HTTP callable function
exports.createLinkedInPost = functions.https.onRequest(async (req, res) => {
  try {
    const { content, slug, imageUrl, webUrl } = req.body;

    if (!content) return res.status(400).json({ error: "Content is required" });

    const result = await postToLinkedIn(content, slug, imageUrl, webUrl);
    res.json(result);
  } catch (error) {
    console.error("Error in createLinkedInPost:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});
