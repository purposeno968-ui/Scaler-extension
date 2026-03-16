/**
 * Checks for custom messages from Scaler++ backend and injects them into the header.
 */

async function initCustomMessages() {
  try {
    chrome.runtime.sendMessage(
      { action: "fetchCustomMessages" },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Scaler++: Error connecting to background script",
            chrome.runtime.lastError,
          );
          return;
        }

        if (
          response &&
          response.success &&
          response.data &&
          response.data.length > 0
        ) {
          processMessages(response.data);
        }
      },
    );
  } catch (error) {
    console.error("Scaler++: Error initializing custom messages fetch", error);
  }
}

function processMessages(messages) {
  chrome.storage.local.get(["dismissed_message_ids"], (result) => {
    let dismissedIds = result.dismissed_message_ids || {};

    for (let msg of messages) {
      // If it's a one-time message and already clicked/dismissed, skip it
      if (msg.one_time && dismissedIds[msg.id]) {
        continue;
      }

      // We found the highest priority valid message to show.
      injectCustomMessage(msg, dismissedIds);
      break;
    }
  });
}

function injectCustomMessage(msgData, dismissedIds) {
  // Wait for the header to be ready
  const checkInterval = setInterval(() => {
    // The logo section
    const logoArea = document.querySelector(
      "._3waiogKHpNpMjAh8o5lc2v > .e7ge61UPj54Me37pqU2Rd",
    );

    if (logoArea && logoArea.parentNode) {
      clearInterval(checkInterval);

      // Check if we already injected
      if (document.getElementById("scaler-custom-msg-container")) return;

      const msgContainer = document.createElement("div");
      msgContainer.id = "scaler-custom-msg-container";

      msgContainer.style.display = "flex";
      msgContainer.style.alignItems = "center";
      msgContainer.style.justifyContent = "center";
      msgContainer.style.padding = "4px 12px";
      msgContainer.style.fontSize = "20px";
      msgContainer.style.position = "relative";

      msgContainer.innerHTML = msgData.msg;

      // Insert between Logo Area and Stats Area
      // The parent is `._3waiogKHpNpMjAh8o5lc2v`
      logoArea.parentNode.insertBefore(msgContainer, logoArea.nextSibling);

      // Handle interactions
      const markAsDismissed = () => {
        msgContainer.style.display = "none";
        if (msgData.one_time) {
          dismissedIds[msgData.id] = true;
          chrome.storage.local.set({ dismissed_message_ids: dismissedIds });
        }
      };

      // If user clicks a link inside the injected HTML, mark as interactive
      const links = msgContainer.querySelectorAll("a");
      links.forEach((link) => {
        link.addEventListener("click", markAsDismissed);
      });
    }
  }, 500);

  // Stop checking after 10 seconds if header never loads
  setTimeout(() => clearInterval(checkInterval), 10000);
}
