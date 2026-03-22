// ============================================
// cleaner/modalHandler.js
// MutationObserver for referral modal detection
// ============================================

/**
 * Setup observer to watch for new modals appearing
 */
function setupModalObserver() {
  if (modalObserverSetup) return;

  // Debounce timer to batch rapid modal-related mutations.
  let _modalDebounceTimer = null;

  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;

    mutations.forEach((mutation) => {
      // Check for added nodes that might be modals
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (
            node.classList?.contains("sr-modal") ||
            node.classList?.contains("sr-backdrop") ||
            node.querySelector?.(".sr-modal")
          ) {
            shouldCheck = true;
          }
        }
      });
    });

    if (shouldCheck) {
      // Debounce to let the modal fully render before acting
      clearTimeout(_modalDebounceTimer);
      _modalDebounceTimer = setTimeout(() => {
        hideReferralPopup();
        if (shouldHide("auto-close-modals")) {
          autoCloseReferralModals();
        }
      }, 150);
    }
  });

  // childList + subtree is enough: we only need to know when modal
  // nodes are *added* to the DOM. Watching attributes on every element
  // is expensive and not needed here.
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  modalObserverSetup = true;
}
