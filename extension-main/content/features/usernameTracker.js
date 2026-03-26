// ============================================================
// usernameTracker.js — Fetches and synchronizes user profile
// ============================================================

// Bump this number whenever new fields are added to the payload.
// All existing users will automatically re-sync on next page load.
const SYNC_VERSION = 2;

function initUsernameTracker() {
  if (typeof chrome === "undefined" || !chrome.runtime?.id) return;

  // To force a re-sync during dev, uncomment:
  // chrome.storage.sync.remove("scaler_sync_version");

  chrome.storage.sync.get(["scaler_sync_version"], (result) => {
    if (chrome.runtime.lastError || !chrome.runtime?.id) return;
    // Only skip if the stored version matches the current schema version
    if (result?.scaler_sync_version === SYNC_VERSION) return;

    fetchAndSyncUser();
  });
}

function fetchAndSyncUser() {
  if (!chrome.runtime?.id) return;

  const BASE = "https://www.scaler.com";
  const opts = { credentials: "include" };

  Promise.all([
    fetch(`${BASE}/analytics/`, opts).then((r) => (r.ok ? r.json() : null)),
    fetch(`${BASE}/academy/mentee/performance-stats/`, opts).then((r) =>
      r.ok ? r.json() : null,
    ),
    fetch(`${BASE}/academy/mentee-dashboard/initial-load-data/`, opts).then(
      (r) => (r.ok ? r.json() : null),
    ),
  ])
    .then(([analyticsJson, perfJson, loadJson]) => {
      if (!chrome.runtime?.id) return;

      // ── /analytics/ ─────────────────────────────────────
      const attr = analyticsJson?.data?.attributes;
      if (!attr) return;

      // ── /performance-stats/ ──────────────────────────────
      const perf = perfJson?.performance;

      // ── /initial-load-data/ ──────────────────────────────
      const currentUser = loadJson?.user_data?.current_user;
      const role = loadJson?.user_data?.role;
      const country = loadJson?.user_data?.super_batch?.country;

      const user = {
        // from /analytics/
        scaler_id: attr.id,
        name: attr.name,
        gender: attr.gender,
        email: attr.email,
        orgyear: attr.orgyear,
        cohort: attr.cohort,

        // from /initial-load-data/
        linkedin_profile: currentUser?.linkedin_profile ?? null,
        slug: currentUser?.slug ?? null,
        role: role ?? null,
        country: country ?? null,
        avatar_file_name: currentUser?.avatar_file_name ?? null,

        // from /performance-stats/
        cgr_score: perf?.cgrScore ?? null,
      };

      chrome.runtime.sendMessage(
        { action: "syncUserProfile", user },
        (response) => {
          if (response && response.success) {
            chrome.storage.sync.set({
              scaler_sync_version: SYNC_VERSION,
              scaler_user: {
                name: user.name,
                gender: user.gender,
                email: user.email,
              },
            });
          }
        },
      );
    })
    .catch(() => {
      /* fail silently */
    });
}
