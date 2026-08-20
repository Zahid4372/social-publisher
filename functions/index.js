const functions = require("firebase-functions");
const  postToLinkedIn  = require("./clients/linkedinClient");
const { postToInstagram, postToFacebook } = require('./clients/MetaClient');




// API to post on Instagram
exports.createInstagramPost = functions.https.onRequest(async (req, res) => {
  try {
    const { content, slug, imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Instagram post requires an image" });
    }

    const result = await postToInstagram(content, slug, imageUrl);
    res.json(result);
  } catch (error) {
    console.error("Error creating Instagram post:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// API to post on Facebook
exports.createFacebookPost = functions.https.onRequest(async (req, res) => {
  try {
    const { content, slug, imageUrl } = req.body;

    const result = await postToFacebook(content, slug, imageUrl);
    res.json(result);
  } catch (error) {
    console.error("Error creating Facebook post:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});


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
