// metapost.js
const axios = require('axios');
const functions = require('firebase-functions');

// Read keys from Firebase config
const INSTAGRAM_ACCOUNT_ID = functions.config().instagram.account_id;
const FACEBOOK_PAGE_ID = functions.config().facebook.account_id;
const ACCESS_TOKEN = functions.config().meta.access_token;

/**
 * Create an Instagram media container for an image post
 * Returns creation_id if successful, null otherwise
 */
async function createMediaContainer(imageUrl, caption) {
  if (!imageUrl) return null;

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${INSTAGRAM_ACCOUNT_ID}/media`,
      null,
      {
        params: {
          image_url: imageUrl,
          caption,
          access_token: ACCESS_TOKEN
        }
      }
    );
    return response.data.id;
  } catch (error) {
    console.error("❌ Error creating Instagram media container:", error?.response?.data || error.message);
    return null;
  }
}

/**
 * Publish an Instagram post
 */
async function postToInstagram(content, slug = '', imageUrl) {
  if (!imageUrl) {
    console.warn("⚠️ Instagram posts require an image.");
    return null;
  }

  const caption = `${content}${slug ? `\n\nRead more: https://softybytes.com/blogs/${slug}` : ''}\n\n#SoftyBytes #TechBlog`;
  const creationId = await createMediaContainer(imageUrl, caption);
  if (!creationId) return null;

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${INSTAGRAM_ACCOUNT_ID}/media_publish`,
      null,
      {
        params: {
          creation_id: creationId,
          access_token: ACCESS_TOKEN
        }
      }
    );
    console.log("✅ Instagram post published:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error publishing Instagram post:", error?.response?.data || error.message);
    return null;
  }
}

/**
 * Publish a Facebook post
 * Automatically chooses between text post or image post
 */
async function postToFacebook(content, slug = '', imageUrl) {
  try {
    let response;

    const fullMessage = `${content}${slug ? `\n\nRead more: https://softybytes.com/blogs/${slug}` : ''}`;

    if (imageUrl) {
      // Post an image to Facebook
      response = await axios.post(
        `https://graph.facebook.com/v22.0/${FACEBOOK_PAGE_ID}/photos`,
        null,
        {
          params: {
            url: imageUrl,
            caption: fullMessage,
            access_token: ACCESS_TOKEN
          }
        }
      );
    } else {
      // Text-only post
      response = await axios.post(
        `https://graph.facebook.com/v22.0/${FACEBOOK_PAGE_ID}/feed`,
        null,
        {
          params: {
            message: fullMessage,
            access_token: ACCESS_TOKEN
          }
        }
      );
    }

    console.log("✅ Facebook post published:", response.data);
    return response.data;

  } catch (error) {
    console.error("❌ Error posting to Facebook:", error?.response?.data || error.message);
    return null;
  }
}

module.exports = { postToInstagram, postToFacebook };
