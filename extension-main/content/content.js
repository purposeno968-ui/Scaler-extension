// ============================================
// content.js — Entry point & message handler
// All logic is split across:
//   cleaner/  → selectors, cleanerEngine, modalHandler, sidebarHandler
//   core/     → settings, styleInjector, urlObserver
//   features/ → problemSearch, practiceMode, leetcodeLink, joinClassButton
//   utils/    → domUtils, stringUtils
// ============================================

/**
 * Listen for messages from popup - INSTANT UPDATES
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "settingsUpdated") {
    currentSettings = { ...DEFAULT_SETTINGS, ...message.settings };
    applyAllSettings();
    sendResponse({ success: true });
  } else if (message.action === "toggleSetting") {
    // Handle individual toggle change
    const { key, value } = message;
    currentSettings[key] = value;

    // Special handling for different feature types
    if (key === "core-curriculum") {
      handleCoreCurriculumVisibility();
    } else if (key === "referral-popup") {
      if (value) {
        hideReferralPopup();
      } else {
        // Show the popup (remove hidden class)
        const elements = document.querySelectorAll(
          `[${CLEANER_ATTR}="referral-popup"]`,
        );
        elements.forEach((el) => el.classList.remove(HIDDEN_CLASS));
      }
    } else if (key === "auto-close-modals") {
      if (value) {
        autoCloseReferralModals();
      }
    } else if (key === "problem-search") {
      // Toggle problem search bar
      if (value) {
        initProblemsSearch();
      } else {
        removeSearchBar();
      }
    } else if (key === "practice-mode") {
      if (value) {
        handlePracticeMode();
      }
    } else if (key === "leetcode-link") {
      // Toggle LeetCode link
      if (value) {
        initLeetCodeLink();
      } else {
        // Remove existing link
        const existingLink = document.querySelector(".scaler-leetcode-link");
        if (existingLink) {
          existingLink.remove();
        }
      }
    } else if (key === "join-session") {
      // Toggle Join Session buttons
      if (value) {
        initJoinSessionButtons();
      } else {
        // Remove any injected buttons and restore "View Details" text
        document.querySelectorAll(".scaler-join-session-btn").forEach((btn) => {
          // Recreate the original "View Details" span
          const span = document.createElement("span");
          span.className = "_3cg2nc-UIVR1CzIB7nNQ8Z";
          span.textContent = "View Details";
          btn.replaceWith(span);
        });
        // Reset injection guards so they can be re-injected if re-enabled
        document
          .querySelectorAll('[data-join-session-injected="true"]')
          .forEach((card) => {
            delete card.dataset.joinSessionInjected;
          });
        // Disconnect observer so it stops watching
        if (window._joinSessionObserver) {
          window._joinSessionObserver.disconnect();
          window._joinSessionObserver = null;
        }
      }
    } else if (key === "subject-sort") {
      if (value) {
        initSubjectSort();
      } else {
        restoreSubjectSort();
      }
    } else if (key === "contest-leaderboard") {
      if (value) {
        initContestLeaderboard();
      } else {
        // Remove injected leaderboard links by reloading the page
        // or simply disconnect the observer
        if (window._leaderboardObserver) {
          window._leaderboardObserver.disconnect();
          window._leaderboardObserver = null;
        }
      }
    } else {
      updateVisibilityForKey(key, value);
    }

    sendResponse({ success: true });
  }
  return true;
});

// ============================================
// Initialize
// ============================================

window.addEventListener("load", async () => {
  await loadSettings();
  injectStyles();
  setupUrlChangeDetection();
  setupModalObserver();
  setTimeout(runCleanup, 1000);
  setTimeout(runCleanup, 2500);
  setTimeout(runCleanup, 5000);

  // Initialize problems search if on problems page
  setTimeout(initProblemsSearch, 1500);

  // Initialize LeetCode link
  setTimeout(initLeetCodeLink, 2000);

  // Initialize Join Session buttons on dashboard
  setTimeout(initJoinSessionButtons, 1500);

  // Initialize Contest Leaderboard on contest pages
  setTimeout(initContestLeaderboard, 2000);

  // Initialize custom message checking
  setTimeout(initCustomMessages, 1000);
});

document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  injectStyles();
  setupModalObserver();
  setTimeout(runCleanup, 500);

  // Initialize problems search if on problems page
  setTimeout(initProblemsSearch, 1000);
});

// ============================================
// URL change hooks for features
// ============================================

// Extend handleUrlChange to support problemSearch + leetcodeLink + practiceMode
const _baseHandleUrlChange = handleUrlChange;
handleUrlChange = function () {
  _baseHandleUrlChange();

  // Reset search bar state on navigation
  searchBarInjected = false;
  isSearchActive = false;

  // Re-initialize search if on problems page
  if (isProblemsPage()) {
    setTimeout(initProblemsSearch, 1500);
  }

  // Handle practice mode on URL change
  setTimeout(handlePracticeMode, 2000);

  // Check for assignment problem pages (LeetCode link)
  if (isAssignmentProblemPage()) {
    setTimeout(initLeetCodeLink, 2000);
  }

  // Re-inject Join Session buttons on any dashboard navigation
  setTimeout(initJoinSessionButtons, 1500);

  // Re-initialize Subject Sort on curriculum navigation
  if (window.location.href.includes("/core-curriculum")) {
    setTimeout(initSubjectSort, 1500);
  }

  // Re-initialize Contest Leaderboard on contest navigation
  if (isContestPage()) {
    setTimeout(initContestLeaderboard, 2000);
  }
};
