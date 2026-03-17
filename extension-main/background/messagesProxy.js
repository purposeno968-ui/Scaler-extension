// ============================================================
// messagesProxy.js — Proxy for fetching messages from backend
// Bypasses content script CORS restrictions by making the
// fetch request from the background service worker context.
// ============================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchCustomMessages") {
    // You can update this URL when deploying to production
    fetch("https://scalerbackend.vercel.app/api/messages/active")
      .then((res) => res.json())
      .then((data) => {
        sendResponse(data);
      })
      .catch((error) => {
        console.error("Scaler++: Error fetching from backend", error);
        sendResponse({ success: false, error: error.toString() });
      });

    // Return true to indicate we wish to send a response asynchronously
    return true;
  }
});
