// linkedinClient.js
const fetch = require("node-fetch");
const functions = require("firebase-functions");

const LINKEDIN_ACCESS_TOKEN = functions.config().linkedin.access_token;

// keep version in one place
const LINKEDIN_VERSION = functions.config().linkedin.version;

const AUTHOR_URN = functions.config().linkedin.author_urn;

function safeJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return { raw: s };
  }
}

async function readResponse(response) {
  const text = await response.text(); // can be ""
  return {
    ok: response.ok,
    status: response.status,
    restliId: response.headers.get("x-restli-id"),
    location: response.headers.get("location"),
    body: text ? safeJson(text) : null,
  };
}

async function registerImageUpload() {
  const url = "https://api.linkedin.com/rest/images?action=initializeUpload";
  const payload = {
    initializeUploadRequest: { owner: AUTHOR_URN },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "Linkedin-Version": LINKEDIN_VERSION,
    },
    body: JSON.stringify(payload),
  });

  const out = await readResponse(response);
  if (!out.ok) return out; // return details for debugging

  // LinkedIn usually returns JSON here
  // common fields: { value: { uploadUrl, image } }
  return { ...out, data: out.body };
}

async function uploadImageFromUrl(imageUrl, uploadUrl) {
  // fetch image
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    const details = await readResponse(imageResponse);
    return { ok: false, step: "fetch_image", ...details };
  }

  // get content-type from source (png/jpg/etc)
  const contentType = imageResponse.headers.get("content-type") || "application/octet-stream";
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

  // upload to LinkedIn
  const uploadResp = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: imageBuffer,
  });

  const details = await readResponse(uploadResp);
  return { ...details, step: "upload_image", contentType };
}

/**
 * Post to LinkedIn
 * @param {string} content
 * @param {string|null} slug
 * @param {string|null} imageUrl
 * @param {boolean} webUrl
 */
async function postToLinkedIn(content, slug = null, imageUrl = null, webUrl = false) {
  if (typeof content !== "string" || !content.trim()) {
    return { ok: false, status: 400, error: "content must be a non-empty string" };
  }

  // ---- optional image flow ----
  let imageURN = null;

  if (imageUrl) {
    const init = await registerImageUpload();

    // if init failed, return the full error details
    if (!init.ok) return { ok: false, step: "initializeUpload", ...init };

    const uploadUrl = init?.data?.value?.uploadUrl;
    imageURN = init?.data?.value?.image;

    if (!uploadUrl || !imageURN) {
      return {
        ok: false,
        status: 500,
        step: "initializeUpload",
        error: "Missing uploadUrl or image URN in initializeUpload response",
        init,
      };
    }

    const upload = await uploadImageFromUrl(imageUrl, uploadUrl);
    if (!upload.ok) return { ok: false, step: "uploadImage", ...upload };
  }

  // ---- build commentary ----
  let commentary = content.trim();
  if (webUrl) commentary += `\n\nExplore more at https://softybytes.com`;
  if (slug) commentary += `\n\n🔗 Read more: https://softybytes.com/blogs/${slug}`;

  // ---- LinkedIn post payload ----
  const postData = {
    author: AUTHOR_URN,
    commentary,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
  };

  if (imageURN) {
    // keep your original structure; if LinkedIn rejects it,
    // the response details below will show the validation error.
    postData.content = { media: { id: imageURN } };
  }

  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "Linkedin-Version": LINKEDIN_VERSION,
    },
    body: JSON.stringify(postData),
  });

  const out = await readResponse(response);

  // return everything useful for debugging/success confirmation
  return {
    ...out,
    step: "createPost",
    sent: { hasImage: !!imageURN, author: AUTHOR_URN },
  };
}

module.exports = postToLinkedIn;