// ============================================
// cleaner/sidebarHandler.js
// MutationObserver for sidebar open/close events
// ============================================

/**
 * Setup observer to watch for sidebar open/close
 */
function setupSidebarObserver(retries = 0) {
  if (sidebarObserverSetup) return;

  const sidebarContainer = document.querySelector(
    ".ug-sidebar.sidebar.mentee-sidebar",
  );
  if (!sidebarContainer) {
    // Give up after 10 attempts (~10 seconds) to prevent an infinite
    // retry chain on pages where the sidebar never renders.
    if (retries < 10) {
      setTimeout(() => setupSidebarObserver(retries + 1), 1000);
    }
    return;
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "class") {
        const target = mutation.target;
        if (target.classList.contains("sidebar__open")) {
          setTimeout(cleanupSidebar, 100);
          setTimeout(cleanupSidebar, 500);
        }
      }
    });
  });

  observer.observe(sidebarContainer, {
    attributes: true,
    attributeFilter: ["class"],
  });
  sidebarObserverSetup = true;

  if (sidebarContainer.classList.contains("sidebar__open")) {
    cleanupSidebar();
  }
}
