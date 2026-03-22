// ============================================================
// usernameTracker.js — Fetches and synchronizes user profile
// ============================================================

function initUsernameTracker() {
  if (typeof chrome === "undefined" || !chrome.runtime?.id) {
    return;
  }

  // Clear existing sync flag for testing if you want to force it
  // chrome.storage.sync.remove("scaler_user_synced");

  chrome.storage.sync.get(["scaler_user_synced"], (result) => {
    if (chrome.runtime.lastError || !chrome.runtime?.id) return;

    if (result?.scaler_user_synced) {
      return;
    }

    fetchAndSyncUser();
  });
}

function fetchAndSyncUser() {
  if (!chrome.runtime?.id) return;

  fetch("https://www.scaler.com/analytics/", {
    credentials: "include",
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((json) => {
      if (!json?.data?.attributes || !chrome.runtime?.id) {
        console.error("Scaler++: Analytics fetch failed or session invalid");
        return;
      }

      const attr = json.data.attributes;
      const user = {
        scaler_id: attr.id,
        name: attr.name,
        gender: attr.gender,
        email: attr.email,
        orgyear: attr.orgyear,
        cohort: attr.cohort,
      };

      chrome.runtime.sendMessage(
        { action: "syncUserProfile", user },
        (response) => {
          if (response && response.success) {
            chrome.storage.sync.set({
              scaler_user_synced: true,
              scaler_user: user,
            });
            console.log("Scaler++: Registration complete for", user.email);
          }
        },
      );
    })
    .catch((err) => {
      console.error("Scaler++: Connection error in sync", err);
    });
}
