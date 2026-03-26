// ============================================
// features/spotlightSearch.js
// Alt/Option+Space spotlight-style search overlay for Scaler
// ============================================

(function () {
  // ── State ─────────────────────────────────────────────────────────────────
  let spotlightOpen = false;
  let searchDebounceTimer = null;
  let selectedIndex = -1;
  let allResults = [];

  // AbortController for the in-flight fetch (so we can cancel on close)
  let searchAbortController = null;

  // ── Constants ─────────────────────────────────────────────────────────────
  const SEARCH_API = "https://www.scaler.com/academy/mentee/search-with-query";
  const DEBOUNCE_MS = 300;

  // ── Styles ────────────────────────────────────────────────────────────────
  function injectSpotlightStyles() {
    if (document.getElementById("scaler-spotlight-styles")) return;

    const style = document.createElement("style");
    style.id = "scaler-spotlight-styles";
    style.textContent = `
      /* ── Overlay backdrop ── */
      #scaler-spotlight-overlay {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 12vh;
        background: rgba(0, 0, 0, 0.55);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        animation: spo-fade-in 0.18s ease;
      }

      @keyframes spo-fade-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }

      /* ── Main panel ── */
      #scaler-spotlight-panel {
        width: 680px;
        max-width: calc(100vw - 32px);
        background: rgba(28, 28, 30, 0.92);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 18px;
        box-shadow:
          0 8px 40px rgba(0,0,0,0.55),
          0 0 0 0.5px rgba(255,255,255,0.06) inset;
        overflow: hidden;
        animation: spo-slide-in 0.22s cubic-bezier(.22,1,.36,1);
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
      }

      @keyframes spo-slide-in {
        from { transform: scale(0.96) translateY(-12px); opacity: 0; }
        to   { transform: scale(1)    translateY(0);     opacity: 1; }
      }

      /* ── Search header ── */
      #scaler-spotlight-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }

      #scaler-spotlight-search-icon {
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        color: rgba(255,255,255,0.5);
      }

      #scaler-spotlight-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: #ffffff;
        font-size: 20px;
        font-weight: 400;
        letter-spacing: -0.2px;
        caret-color: #ff6b35;
      }

      #scaler-spotlight-input::placeholder {
        color: rgba(255,255,255,0.3);
      }

      #scaler-spotlight-shortcut-hint {
        color: rgba(255,255,255,0.25);
        font-size: 11px;
        letter-spacing: 0.3px;
        white-space: nowrap;
        flex-shrink: 0;
      }

      /* ── Results body ── */
      #scaler-spotlight-results {
        max-height: 480px;
        overflow-y: auto;
        padding: 8px 0 12px;
        scroll-behavior: smooth;
      }

      #scaler-spotlight-results::-webkit-scrollbar {
        width: 6px;
      }

      #scaler-spotlight-results::-webkit-scrollbar-track {
        background: transparent;
      }

      #scaler-spotlight-results::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.15);
        border-radius: 3px;
      }

      /* ── Section header ── */
      .spo-section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px 6px;
        color: rgba(255,255,255,0.38);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        user-select: none;
      }

      /* ── Result item ── */
      .spo-result-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 10px 20px;
        cursor: pointer;
        transition: background 0.1s ease;
        border-radius: 0;
        text-decoration: none;
        color: inherit;
        position: relative;
      }

      .spo-result-item:hover,
      .spo-result-item.spo-selected {
        background: rgba(255,255,255,0.1);
      }

      .spo-result-item.spo-selected::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 60%;
        background: #ff6b35;
        border-radius: 0 2px 2px 0;
      }

      /* ── Icon bubble ── */
      .spo-icon-bubble {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }

      .spo-icon-bubble.classroom { background: linear-gradient(135deg, #1e6fe8, #6637d6); }
      .spo-icon-bubble.problem   { background: linear-gradient(135deg, #16a34a, #15803d); }
      .spo-icon-bubble.event     { background: linear-gradient(135deg, #ea580c, #c2410c); }

      /* ── Text block ── */
      .spo-result-text {
        flex: 1;
        min-width: 0;
      }

      .spo-result-title {
        color: #f1f1f1;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.3;
      }

      .spo-result-subtitle {
        color: rgba(255,255,255,0.42);
        font-size: 12px;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .spo-badge {
        display: inline-flex;
        align-items: center;
        padding: 1px 7px;
        border-radius: 20px;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.2px;
        flex-shrink: 0;
      }

      .spo-badge.solved   { background: rgba(22,163,74,0.25); color: #4ade80; }
      .spo-badge.active   { background: rgba(37,99,235,0.25); color: #60a5fa; }
      .spo-badge.upcoming { background: rgba(234,88,12,0.25); color: #fb923c; }

      /* ── Arrow icon ── */
      .spo-arrow {
        flex-shrink: 0;
        color: rgba(255,255,255,0.2);
        font-size: 14px;
        transition: color 0.15s;
      }

      .spo-result-item:hover .spo-arrow,
      .spo-result-item.spo-selected .spo-arrow {
        color: rgba(255,255,255,0.6);
      }

      /* ── Empty / loading / error states ── */
      #scaler-spotlight-empty,
      #scaler-spotlight-loading {
        padding: 40px 20px;
        text-align: center;
        color: rgba(255,255,255,0.3);
        font-size: 14px;
      }

      #scaler-spotlight-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }

      .spo-spinner {
        width: 28px;
        height: 28px;
        border: 2.5px solid rgba(255,255,255,0.12);
        border-top-color: #ff6b35;
        border-radius: 50%;
        animation: spo-spin 0.7s linear infinite;
      }

      @keyframes spo-spin {
        to { transform: rotate(360deg); }
      }

      /* ── Footer hint ── */
      #scaler-spotlight-footer {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 10px 20px;
        border-top: 1px solid rgba(255,255,255,0.07);
        background: rgba(255,255,255,0.03);
      }

      .spo-footer-hint {
        display: flex;
        align-items: center;
        gap: 5px;
        color: rgba(255,255,255,0.28);
        font-size: 11px;
      }

      .spo-footer-hint kbd {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 4px;
        padding: 1px 5px;
        font-family: inherit;
        font-size: 10px;
        color: rgba(255,255,255,0.5);
      }

      .spo-footer-hint + .spo-footer-hint {
        margin-left: 0;
      }

      /* Powered by label */
      #scaler-spotlight-footer .spo-powered {
        margin-left: auto;
        color: rgba(255,255,255,0.18);
        font-size: 11px;
        letter-spacing: 0.2px;
      }
    `;
    document.head.appendChild(style);
  }

  // ── Build DOM ─────────────────────────────────────────────────────────────
  function buildSpotlightDOM() {
    if (document.getElementById("scaler-spotlight-overlay")) return;

    injectSpotlightStyles();

    const overlay = document.createElement("div");
    overlay.id = "scaler-spotlight-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Scaler Spotlight Search");

    overlay.innerHTML = `
      <div id="scaler-spotlight-panel">
        <div id="scaler-spotlight-header">
          <svg id="scaler-spotlight-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            id="scaler-spotlight-input"
            placeholder="Search classrooms, problems, events…"
            autocomplete="off"
            spellcheck="false"
          />
          <span id="scaler-spotlight-shortcut-hint">Opt/Alt + Space</span>
        </div>

        <div id="scaler-spotlight-results">
          <div id="scaler-spotlight-empty" style="display:none">
            No results found
          </div>
          <div id="scaler-spotlight-loading" style="display:none">
            <div class="spo-spinner"></div>
            <span>Searching…</span>
          </div>
        </div>

        <div id="scaler-spotlight-footer">
          <span class="spo-footer-hint">
            <kbd>↑</kbd><kbd>↓</kbd> navigate
          </span>
          <span class="spo-footer-hint">
            <kbd>↵</kbd> open
          </span>
          <span class="spo-footer-hint">
            <kbd>Esc</kbd> close
          </span>
          <span class="spo-powered">Scaler++</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Dismiss on backdrop click (not on panel itself)
    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) closeSpotlight();
    });

    // Input listeners — stored on the element, removed automatically when
    // the overlay is removed from the DOM, so no manual cleanup needed.
    const input = document.getElementById("scaler-spotlight-input");
    input.addEventListener("input", onSearchInput);
    input.addEventListener("keydown", onKeyDown);
  }

  // ── Open / Close ──────────────────────────────────────────────────────────
  function openSpotlight() {
    if (spotlightOpen) return;
    spotlightOpen = true;

    buildSpotlightDOM();

    // Focus input immediately
    setTimeout(() => {
      const input = document.getElementById("scaler-spotlight-input");
      if (input) input.focus();
    }, 50);
  }

  function closeSpotlight() {
    if (!spotlightOpen) return;
    spotlightOpen = false;

    // Cancel any in-flight search request
    if (searchAbortController) {
      searchAbortController.abort();
      searchAbortController = null;
    }

    // Clear pending debounce timer
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = null;

    // Reset result state — drop element references so the GC can reclaim them
    allResults = [];
    selectedIndex = -1;

    const overlay = document.getElementById("scaler-spotlight-overlay");
    if (overlay) {
      overlay.style.animation = "spo-fade-in 0.15s ease reverse";
      setTimeout(() => {
        // Re-check: still in the DOM? (Guard against double-close race)
        if (overlay.parentNode) overlay.remove();
      }, 150);
    }
  }

  // ── Keyboard shortcut ─────────────────────────────────────────────────────
  // Standardized to Alt/Option + Space for all platforms to avoid macOS
  // Ctrl+Space conflicts.
  window.addEventListener(
    "keydown",
    (e) => {
      const isAltSpace = e.altKey && !e.metaKey && e.code === "Space";

      if (isAltSpace) {
        // Check if feature is enabled
        const isEnabled =
          typeof currentSettings !== "undefined" &&
          currentSettings["spotlight-search"] !== false;
        if (!isEnabled) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (spotlightOpen) {
          closeSpotlight();
        } else {
          openSpotlight();
        }
        return;
      }

      // Close on Escape if open
      if (e.key === "Escape" && spotlightOpen) {
        e.preventDefault();
        closeSpotlight();
      }
    },
    true,
  );

  // ── Search input handling ─────────────────────────────────────────────────
  function onSearchInput(e) {
    const query = e.target.value.trim();

    // Cancel previous in-flight request
    if (searchAbortController) {
      searchAbortController.abort();
      searchAbortController = null;
    }

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = null;
    selectedIndex = -1;
    allResults = [];

    if (query.length === 0) {
      showEmpty(false);
      showLoading(false);
      clearResults();
      return;
    }

    if (query.length < 2) return;

    showLoading(true);
    showEmpty(false);
    clearResults();

    searchDebounceTimer = setTimeout(() => doSearch(query), DEBOUNCE_MS);
  }

  // ── API call ───────────────────────────────────────────────────────────────
  async function doSearch(query) {
    // Create a fresh AbortController for this request
    searchAbortController = new AbortController();
    const signal = searchAbortController.signal;

    try {
      const url = `${SEARCH_API}?q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        credentials: "include",
        signal,
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      showLoading(false);
      renderResults(data);
    } catch (err) {
      // AbortError is expected when user types quickly — don't show error
      if (err.name === "AbortError") return;
      showLoading(false);
      showEmpty(true, "Could not reach Scaler. Are you logged in?");
      console.warn("[Scaler++] Spotlight search error:", err);
    } finally {
      searchAbortController = null;
    }
  }

  // ── Render results ────────────────────────────────────────────────────────
  function renderResults(data) {
    const container = document.getElementById("scaler-spotlight-results");
    if (!container) return;

    clearResults();
    allResults = [];

    const classrooms = data.classroom || [];
    const problems = data.problems || [];
    const events = data.events || [];

    if (
      classrooms.length === 0 &&
      problems.length === 0 &&
      events.length === 0
    ) {
      showEmpty(true);
      return;
    }

    const fragment = document.createDocumentFragment();

    function makeSection(label, emoji, items, type) {
      if (items.length === 0) return;

      const header = document.createElement("div");
      header.className = "spo-section-header";
      header.textContent = `${emoji}  ${label}`;
      fragment.appendChild(header);

      items.forEach((item) => {
        const el = makeResultItem(item, type);
        allResults.push({ el, url: resolveUrl(item, type) });
        fragment.appendChild(el);
      });
    }

    makeSection("Classrooms", "🎓", classrooms, "classroom");
    makeSection("Problems", "💡", problems, "problem");
    makeSection("Events", "📅", events, "event");

    container.appendChild(fragment);
  }

  // ── Build a single result item ────────────────────────────────────────────
  function makeResultItem(item, type) {
    const el = document.createElement("a");
    el.className = "spo-result-item";
    el.href = resolveUrl(item, type) || "#";
    el.target = "_blank";
    el.rel = "noopener noreferrer";

    // Index for keyboard nav (set after push so the index is stable)
    const itemIndex = allResults.length;
    el.dataset.spoIndex = itemIndex;

    // Icon
    const iconEmoji =
      type === "classroom" ? "🎓" : type === "problem" ? "💡" : "📅";
    const iconBubble = `<div class="spo-icon-bubble ${type}">${iconEmoji}</div>`;

    // Subtitle
    let subtitle = item.item_type || "";
    let badgeHtml = "";

    if (type === "classroom" && item.date) {
      const d = new Date(item.date);
      subtitle += ` • ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
    }

    if (type === "problem") {
      if (item.status === "solved") {
        badgeHtml = `<span class="spo-badge solved">✓ Solved</span>`;
      } else if (item.status === "active") {
        badgeHtml = `<span class="spo-badge active">Active</span>`;
      }
    }

    if (type === "event" && item.date) {
      const d = new Date(item.date);
      const now = new Date();
      const isPast = d < now;
      subtitle += ` • ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`;
      if (!isPast)
        badgeHtml = `<span class="spo-badge upcoming">Upcoming</span>`;
    }

    el.innerHTML = `
      ${iconBubble}
      <div class="spo-result-text">
        <div class="spo-result-title">${escapeHtml(item.text || "")}</div>
        <div class="spo-result-subtitle">
          <span>${escapeHtml(subtitle)}</span>
          ${badgeHtml}
        </div>
      </div>
      <span class="spo-arrow">›</span>
    `;

    // Mouse hover selection — use index captured at creation time, not from dataset,
    // to avoid the cost of a parse on every hover.
    el.addEventListener("mouseenter", () => {
      setSelected(itemIndex);
    });

    // Click handler
    el.addEventListener("click", (ev) => {
      ev.preventDefault();
      const href = resolveUrl(item, type);
      if (href) window.open(href, "_blank", "noopener,noreferrer");
      closeSpotlight();
    });

    return el;
  }

  // ── Keyboard navigation inside the panel ──────────────────────────────────
  function onKeyDown(e) {
    if (e.key === "Escape") {
      closeSpotlight();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected(selectedIndex + 1);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected(selectedIndex - 1);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && allResults[selectedIndex]) {
        const url = allResults[selectedIndex].url;
        if (url) window.open(url, "_blank", "noopener,noreferrer");
        closeSpotlight();
      }
    }
  }

  function setSelected(idx) {
    if (allResults.length === 0) return;

    // Wrap around
    if (idx < 0) idx = allResults.length - 1;
    if (idx >= allResults.length) idx = 0;

    // Remove old selection
    if (selectedIndex >= 0 && allResults[selectedIndex]) {
      allResults[selectedIndex].el.classList.remove("spo-selected");
    }

    selectedIndex = idx;
    allResults[idx].el.classList.add("spo-selected");
    allResults[idx].el.scrollIntoView({ block: "nearest" });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  // ── URL resolver ──────────────────────────────────────────────────────────
  // For problems we build a canonical URL from sbat_id + problem id to avoid
  // the messy slug-based URLs returned by the API.
  //
  // URL format:
  //   /academy/mentee-dashboard/class/{sbat_id}/assignment/problems/{id}  (lecture / assignment)
  //   /academy/mentee-dashboard/class/{sbat_id}/homework/problems/{id}    (homework)
  function resolveUrl(item, type) {
    if (type === "problem") {
      const sbatId = item.sbat_id;
      const problemId = item.id;
      if (sbatId && problemId) {
        // event_type "homework" → homework segment; everything else → assignment
        const segment = item.event_type === "homework" ? "homework" : "assignment";
        return `https://www.scaler.com/academy/mentee-dashboard/class/${sbatId}/${segment}/problems/${problemId}`;
      }
    }
    // Classrooms and events: use the API-supplied URL as-is
    if (!item.url) return null;
    if (item.url.startsWith("/")) return `https://www.scaler.com${item.url}`;
    return item.url;
  }

  function clearResults() {
    const container = document.getElementById("scaler-spotlight-results");
    if (!container) return;
    // Remove all children except the static empty/loading placeholders
    [...container.children].forEach((child) => {
      if (
        child.id !== "scaler-spotlight-empty" &&
        child.id !== "scaler-spotlight-loading"
      ) {
        child.remove();
      }
    });
  }

  function showLoading(show) {
    const el = document.getElementById("scaler-spotlight-loading");
    if (el) el.style.display = show ? "flex" : "none";
  }

  function showEmpty(show, msg = "No results found") {
    const el = document.getElementById("scaler-spotlight-empty");
    if (el) {
      el.style.display = show ? "block" : "none";
      if (show) el.textContent = msg;
    }
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ── Expose for content.js init ────────────────────────────────────────────
  window.initSpotlightSearch = function () {
    injectSpotlightStyles();
    // The keyboard listener is already registered at module load time.
  };

  window.closeSpotlight = closeSpotlight;
})();
