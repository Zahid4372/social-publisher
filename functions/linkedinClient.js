// linkedinClient.js
const fetch = require("node-fetch");
const functions = require("firebase-functions");

const LINKEDIN_ACCESS_TOKEN = functions.config().linkedin.access_token;

async function registerImageUpload() {
  const url = "https://api.linkedin.com/rest/images?action=initializeUpload";
  const payload = { initializeUploadRequest: { owner: "urn:li:person:O5dqzrHQ1e" } };
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202502",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) return null;
  return await response.json();
}

async function uploadImageFromUrl(imageUrl, uploadUrl) {
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/png" },
    body: Buffer.from(imageBuffer),
  });
  return true;
}

async function postToLinkedIn(content, slug = null, imageUrl = null, webUrl = false) {
  let imageURN = null;
  if (imageUrl) {
    const uploadInit = await registerImageUpload();
    const uploadUrl = uploadInit?.value?.uploadUrl;
    imageURN = uploadInit?.value?.image;
    if (uploadUrl && imageURN) await uploadImageFromUrl(imageUrl, uploadUrl);
    else imageURN = null;
  }

  let commentary = content;
  if (webUrl) commentary += `\n\nExplore more at https://softybytes.com`;
  if (slug) commentary += `\n\n🔗 Read more: https://softybytes.com/blogs/${slug}`;

  const postData = {
     author: "urn:li:person:O5dqzrHQ1e",
    commentary: commentary || undefined,
    visibility: "PUBLIC",
    distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: "PUBLISHED",
  };
  if (imageURN) postData.content = { media: { id: imageURN } };

  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": "202502",
    },
    body: JSON.stringify(postData),
  });

  const resultText = await response.text();
  try { return JSON.parse(resultText); } catch { return { raw: resultText }; }
}

module.exports = postToLinkedIn;
