# Social Publisher

A Firebase Cloud Functions project for automatically publishing AI-generated content to social media platforms.

Currently supported:

- LinkedIn
- Facebook
- Instagram

The project uses separate API clients for LinkedIn and Meta and a central publishing service to coordinate content publishing.

## Project Structure

```text
social-publisher/
│
├── functions/
│   │
│   ├── clients/
│   │   ├── LinkedInClient.js
│   │   └── MetaClient.js
│   │
│   ├── services/
│   │   └── SocialPublisherService.js
│   │
│   ├── index.js
│   ├── package.json
│   ├── package-lock.json
│   └── .gitignore
│
├── .firebaserc
├── firebase.json
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Project Architecture

```text
Firebase Cloud Functions
        │
        ▼
SocialPublisherService
        │
 ┌──────┴──────┐
 ▼             ▼
LinkedInClient  MetaClient
                    │
              ┌─────┴─────┐
              ▼           ▼
          Facebook     Instagram
```

# Prerequisites

Before starting, make sure you have:

- Node.js installed
- Firebase CLI installed
- A Firebase project
- A LinkedIn account
- A LinkedIn Developer application
- A Facebook account
- A Facebook Page
- A Meta Developer account
- A Meta Developer application
- An Instagram Professional account if publishing to Instagram

## Installation

Clone the repository:

```bash
git clone https://github.com/Zahid4372/social-publisher.git
```

Go to the project:

```bash
cd social-publisher
```

Install root dependencies:

```bash
npm install
```

Go to the Firebase Functions directory:

```bash
cd functions
```

Install dependencies:

```bash
npm install
```

Install Axios:

```bash
npm install axios
```

# Firebase Setup

Install Firebase CLI if needed:

```bash
npm install -g firebase-tools
```

Login to Firebase:

```bash
firebase login
```

Check available Firebase projects:

```bash
firebase projects:list
```

Select your Firebase project:

```bash
firebase use YOUR_PROJECT_ID
```

Check the currently selected project:

```bash
firebase use
```

# LinkedIn Setup

## 1. Create a LinkedIn Developer Application

Go to the LinkedIn Developer Portal.

Create a new application and complete the required information.

You will receive:

- Client ID
- Client Secret

Keep the Client Secret private.

## 2. Add LinkedIn Posting Access

Inside your LinkedIn Developer application, add the product that allows your application to publish content.

Your application needs the following permission:

```text
w_member_social
```

This permission allows publishing content on behalf of the authenticated LinkedIn member.

## 3. Generate a LinkedIn Access Token

LinkedIn uses OAuth 2.0.

The authorization flow is:

```text
LinkedIn User
      │
      ▼
Authorization
      │
      ▼
Authorization Code
      │
      ▼
Access Token
      │
      ▼
Publish LinkedIn Posts
```

Request the following scope:

```text
w_member_social
```

After authorization, LinkedIn returns an access token.

You also need your LinkedIn member URN.

Example:

```text
urn:li:person:YOUR_PERSON_ID
```

## 4. Configure LinkedIn in Firebase

Store your LinkedIn configuration:

```bash
firebase functions:config:set \
linkedin.version="202607" \
linkedin.author_urn="YOUR_LINKEDIN_AUTHOR_URN" \
linkedin.access_token="YOUR_LINKEDIN_ACCESS_TOKEN"
```

Example:

```bash
firebase functions:config:set \
linkedin.version="202607" \
linkedin.author_urn="urn:li:person:YOUR_PERSON_ID" \
linkedin.access_token="YOUR_ACCESS_TOKEN"
```

Check the configuration:

```bash
firebase functions:config:get
```

## 5. Use LinkedIn Configuration

Inside `functions/clients/LinkedInClient.js`:

```js
const functions = require("firebase-functions");

const LINKEDIN_VERSION =
  functions.config().linkedin.version;

const AUTHOR_URN =
  functions.config().linkedin.author_urn;

const ACCESS_TOKEN =
  functions.config().linkedin.access_token;
```

## LinkedIn Client

Location:

```text
functions/clients/LinkedInClient.js
```

Responsibilities:

- Connect to the LinkedIn API
- Authenticate using the access token
- Publish AI-generated content
- Handle LinkedIn API responses
- Handle LinkedIn API errors

# Meta Setup

Meta is used for:

- Facebook Page publishing
- Instagram publishing

The basic Meta architecture is:

```text
Meta Developer App
        │
        ▼
Facebook Login
        │
        ▼
User Access Token
        │
        ▼
Facebook Page Access Token
        │
        ├──────────────► Facebook Page
        │
        ▼
Instagram Professional Account
        │
        ▼
Instagram Publishing
```

# Facebook Setup

## 1. Create a Facebook Page

You need a Facebook Page to publish content through the Meta Graph API.

Your personal Facebook profile is used to manage the Page, but publishing is performed through the Facebook Page.

Keep your:

```text
Facebook Page ID
```

You will need it later.

## 2. Create a Meta Developer Application

Go to the Meta for Developers dashboard.

Create a new application.

Choose the application type that supports your Facebook and Instagram API use case.

After creating the application, you will receive:

```text
App ID
App Secret
```

Keep the App Secret private.

## 3. Add Facebook Login

Inside your Meta application, add the Facebook Login product if you are using the Facebook Login authorization flow.

Your application will use Facebook Login to request permissions from the Facebook user who manages the Page.

## 4. Request Facebook Permissions

For Facebook Page publishing, commonly required permissions include:

```text
pages_show_list
pages_read_engagement
pages_manage_posts
```

Depending on your application's features and Meta configuration, additional permissions may be required.

The authorization flow is:

```text
Facebook User
      │
      ▼
Facebook Login
      │
      ▼
User Access Token
      │
      ▼
Get Managed Facebook Pages
      │
      ▼
Page Access Token
      │
      ▼
Publish Facebook Content
```

## 5. Generate a User Access Token

After logging in through your Meta application and approving the required permissions, Meta returns a User Access Token.

This token is used to access Facebook Pages managed by that user.

Example permissions:

```text
pages_show_list
pages_read_engagement
pages_manage_posts
```

## 6. Get Your Facebook Page ID

Use the User Access Token to retrieve Pages managed by the authenticated user.

The request returns Page information including:

```text
Page ID
Page Name
Page Access Token
```

Store the following values:

```text
FACEBOOK_PAGE_ID
FACEBOOK_PAGE_ACCESS_TOKEN
```

The Page Access Token is the token used for publishing to the Facebook Page.

## 7. Facebook Publishing Endpoint

To publish a text post:

```text
POST /{PAGE_ID}/feed
```

Example request:

```js
await axios.post(
  `https://graph.facebook.com/vXX.X/${PAGE_ID}/feed`,
  {
    message: content,
    access_token: PAGE_ACCESS_TOKEN,
  }
);
```

Replace:

```text
vXX.X
```

with a currently supported Meta Graph API version.

# Instagram Setup

## 1. Convert Instagram to a Professional Account

To publish through the Instagram API, the Instagram account must be a Professional account.

Supported professional account types include:

```text
Business
Creator
```

A normal personal Instagram account cannot use the professional publishing APIs.

## 2. Connect Instagram to Facebook

Connect your Instagram Professional account to your Facebook Page.

The relationship should look like:

```text
Facebook Page
      │
      ▼
Instagram Professional Account
```

This connection allows the Meta API to retrieve the Instagram account information.

## 3. Add Instagram Permissions

For the Facebook Login-based Instagram API flow, commonly required permissions include:

```text
instagram_basic
instagram_content_publish
pages_show_list
pages_read_engagement
```

If your application uses other Instagram features such as comments or insights, additional permissions may be required.

## 4. Get the Instagram Account ID

Once the Instagram Professional account is connected to the Facebook Page, retrieve the Instagram account information from the Page.

The response contains the Instagram account ID.

Store:

```text
INSTAGRAM_USER_ID
```

The flow is:

```text
Facebook Page ID
        │
        ▼
Connected Instagram Account
        │
        ▼
Instagram User ID
```

## 5. Instagram Publishing Flow

Instagram publishing uses a two-step process.

```text
AI Generated Content
        │
        ▼
Create Media Container
        │
        ▼
Creation ID
        │
        ▼
Publish Media Container
        │
        ▼
Instagram Post Published
```

### Step 1: Create a Media Container

```text
POST /{INSTAGRAM_USER_ID}/media
```

For an image post, you provide:

```text
image_url
caption
```

The image URL must be publicly accessible because Meta's servers need to retrieve the media.

Example:

```js
const containerResponse = await axios.post(
  `https://graph.facebook.com/vXX.X/${INSTAGRAM_USER_ID}/media`,
  {
    image_url: imageUrl,
    caption: content,
    access_token: ACCESS_TOKEN,
  }
);

const creationId = containerResponse.data.id;
```

### Step 2: Publish the Media Container

```text
POST /{INSTAGRAM_USER_ID}/media_publish
```

Example:

```js
const publishResponse = await axios.post(
  `https://graph.facebook.com/vXX.X/${INSTAGRAM_USER_ID}/media_publish`,
  {
    creation_id: creationId,
    access_token: ACCESS_TOKEN,
  }
);
```

The response contains the ID of the published Instagram media.

# Meta Firebase Configuration

Store the Meta configuration in Firebase Functions config.

Example:

```bash
firebase functions:config:set \
meta.app_id="YOUR_META_APP_ID" \
meta.app_secret="YOUR_META_APP_SECRET" \
facebook.page_id="YOUR_FACEBOOK_PAGE_ID" \
facebook.access_token="YOUR_FACEBOOK_PAGE_ACCESS_TOKEN" \
instagram.user_id="YOUR_INSTAGRAM_USER_ID" \
instagram.access_token="YOUR_INSTAGRAM_ACCESS_TOKEN"
```

Check the configuration:

```bash
firebase functions:config:get
```

# Using Meta Configuration

Inside `functions/clients/MetaClient.js`:

```js
const functions = require("firebase-functions");

const FACEBOOK_PAGE_ID =
  functions.config().facebook.page_id;

const FACEBOOK_ACCESS_TOKEN =
  functions.config().facebook.access_token;

const INSTAGRAM_USER_ID =
  functions.config().instagram.user_id;

const INSTAGRAM_ACCESS_TOKEN =
  functions.config().instagram.access_token;
```

# Meta Client

Location:

```text
functions/clients/MetaClient.js
```

Responsibilities:

- Connect to the Meta Graph API
- Publish content to Facebook Pages
- Publish content to Instagram
- Handle Facebook Page Access Tokens
- Handle Instagram publishing
- Handle API responses and errors

The client can contain methods such as:

```js
class MetaClient {
  async publishToFacebook(content) {
    // Facebook publishing logic
  }

  async publishToInstagram({
    imageUrl,
    caption,
  }) {
    // Instagram publishing logic
  }
}

module.exports = MetaClient;
```

# Social Publisher Service

Location:

```text
functions/services/SocialPublisherService.js
```

This service coordinates publishing content across all platforms.

Example:

```text
AI Generated Content
        │
        ▼
SocialPublisherService
        │
 ┌──────┴─────────┐
 ▼                ▼
LinkedInClient    MetaClient
                     │
              ┌──────┴──────┐
              ▼             ▼
          Facebook       Instagram
```

Example implementation:

```js
const LinkedInClient =
  require("../clients/LinkedInClient");

const MetaClient =
  require("../clients/MetaClient");

class SocialPublisherService {
  constructor() {
    this.linkedInClient =
      new LinkedInClient();

    this.metaClient =
      new MetaClient();
  }

  async publishLinkedIn(content) {
    return this.linkedInClient.publish(content);
  }

  async publishFacebook(content) {
    return this.metaClient.publishToFacebook(content);
  }

  async publishInstagram({
    imageUrl,
    caption,
  }) {
    return this.metaClient.publishToInstagram({
      imageUrl,
      caption,
    });
  }
}

module.exports = SocialPublisherService;
```

# Firebase Functions

The main Firebase Functions entry point is:

```text
functions/index.js
```

The Firebase Function receives a request and sends the publishing task to:

```text
SocialPublisherService
```

Example architecture:

```text
Firebase Function
       │
       ▼
SocialPublisherService
       │
 ┌─────┼─────────────┐
 ▼     ▼             ▼
LinkedIn Facebook Instagram
```

# Deploy

Deploy all Firebase Functions:

```bash
firebase deploy --only functions
```

Deploy a specific function:

```bash
firebase deploy --only functions:FUNCTION_NAME
```

# Check Firebase Configuration

Check all configured values:

```bash
firebase functions:config:get
```

To view a specific configuration section:

```bash
firebase functions:config:get linkedin
```

```bash
firebase functions:config:get facebook
```

```bash
firebase functions:config:get instagram
```

# Security

Never commit API keys, access tokens, or secrets to GitHub.

Do not hardcode:

```text
LINKEDIN_CLIENT_SECRET
LINKEDIN_ACCESS_TOKEN
META_APP_SECRET
FACEBOOK_PAGE_ACCESS_TOKEN
INSTAGRAM_ACCESS_TOKEN
OPENAI_API_KEY
```

Bad:

```js
const ACCESS_TOKEN =
  "your-real-access-token";
```

Good:

```js
const ACCESS_TOKEN =
  functions.config().facebook.access_token;
```

Example `.gitignore`:

```gitignore
node_modules/
.env
.env.*
firebase-debug.log
```

# Required Configuration Summary

Your Firebase configuration may contain:

```text
linkedin.version
linkedin.author_urn
linkedin.access_token

meta.app_id
meta.app_secret

facebook.page_id
facebook.access_token

instagram.user_id
instagram.access_token
```

Set everything together:

```bash
firebase functions:config:set \
linkedin.version="202607" \
linkedin.author_urn="YOUR_LINKEDIN_AUTHOR_URN" \
linkedin.access_token="YOUR_LINKEDIN_ACCESS_TOKEN" \
meta.app_id="YOUR_META_APP_ID" \
meta.app_secret="YOUR_META_APP_SECRET" \
facebook.page_id="YOUR_FACEBOOK_PAGE_ID" \
facebook.access_token="YOUR_FACEBOOK_PAGE_ACCESS_TOKEN" \
instagram.user_id="YOUR_INSTAGRAM_USER_ID" \
instagram.access_token="YOUR_INSTAGRAM_ACCESS_TOKEN"
```

Then deploy:

```bash
firebase deploy --only functions
```

# Important Notes

- LinkedIn requires a valid access token with `w_member_social`.
- Facebook publishing is performed using a Facebook Page and Page Access Token.
- Instagram publishing requires a Professional account.
- For the Facebook Login-based Instagram API flow, the Instagram Professional account must be connected to a Facebook Page.
- Instagram publishing generally uses a two-step process: create a media container, then publish it.
- Media URLs used for server-side publishing must be accessible to Meta's servers.
- API access tokens can expire and should be managed securely.
- Required permissions may depend on the Meta products and features enabled in your application.
- Meta may require App Review or additional access levels before your application can be used by people outside your app's development/test roles.

# Supported Platforms

Current project structure supports:

- LinkedIn
- Facebook
- Instagram

Future platforms can easily be added:

```text
clients/
├── LinkedInClient.js
├── MetaClient.js
├── XClient.js
├── TikTokClient.js
└── YouTubeClient.js
```

# License

MIT