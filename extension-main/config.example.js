const SCALER_PLUS_CONFIG = {
  // Web Application OAuth Client ID from Google Cloud Console.
  // Required for Brave / Edge / Arc support via launchWebAuthFlow.
  // Chrome users are handled automatically via manifest.json oauth2.
  //
  // Setup:
  //   1. Go to console.cloud.google.com → APIs & Services → Credentials
  //   2. Create Credentials → OAuth 2.0 Client ID → Web application
  //   3. Add chrome.identity.getRedirectURL() output as redirect URI
  //   4. Paste the generated client ID below in config.js
  WEB_OAUTH_CLIENT_ID: "YOUR_WEB_APP_CLIENT_ID.apps.googleusercontent.com",
};