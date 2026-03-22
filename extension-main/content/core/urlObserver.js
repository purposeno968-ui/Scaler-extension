// ============================================
// core/urlObserver.js
// SPA URL change detection and routing hooks
// ============================================

// Debounce timer for URL change handler — prevents thundering-herd of
// callbacks when the SPA fires many mutations in a short burst.
let _urlChangeDebounceTimer = null;

/**
 * Handle URL changes (SPA navigation).
 * Debounced — multiple rapid calls collapse into a single execution.
 */
function handleUrlChange() {
  clearTimeout(_urlChangeDebounceTimer);
  _urlChangeDebounceTimer = setTimeout(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(runCleanup, 1500);
      setTimeout(runCleanup, 3000);
    }
  }, 300);
}

/**
 * Setup URL change detection
 */
function setupUrlChangeDetection() {
  window.addEventListener("popstate", () => handleUrlChange());

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    handleUrlChange();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    handleUrlChange();
  };

  // Watch for SPA-driven DOM changes that update the URL without
  // pushState (e.g. hash changes, framework routers).
  // The debounce on handleUrlChange makes this safe to fire frequently.
  let _mutationDebounceTimer = null;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      clearTimeout(_mutationDebounceTimer);
      _mutationDebounceTimer = setTimeout(handleUrlChange, 150);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // NOTE: The setInterval(handleUrlChange, 2000) has been intentionally
  // removed. The combination of popstate + history patches + MutationObserver
  // already covers all SPA navigation cases without polling.
}
