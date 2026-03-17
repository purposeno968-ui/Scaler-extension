// ============================================
// core/styleInjector.js
// CSS injection for hiding/showing elements
// ============================================

/**
 * Inject CSS for hiding elements
 */
function injectStyles() {
  if (styleInjected) return;

  const style = document.createElement("style");
  style.id = "scaler-cleaner-styles";
  style.textContent = `
    .${HIDDEN_CLASS} {
      display: none !important;
    }

    /* ---- Join Session button ---- */
    a.scaler-join-session-btn {
      display: inline-block;
      padding: 5px 14px;
      border-radius: 20px;
      background: linear-gradient(135deg, #4285f4, #1a73e8);
      color: #fff !important;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.3px;
      text-decoration: none !important;
      transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
      box-shadow: 0 2px 6px rgba(26, 115, 232, 0.35);
      white-space: nowrap;
    }
    a.scaler-join-session-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(26, 115, 232, 0.5);
      opacity: 0.92;
    }
    a.scaler-join-session-btn:active {
      transform: translateY(0);
      box-shadow: 0 1px 4px rgba(26, 115, 232, 0.3);
    }

    /* ---- Pick Random button ---- */
    .scaler-pick-random-btn {
      display: inline-flex;
      align-items: center;
      padding: 6px 14px;
      margin-left: 15px;
      border-radius: 20px;
      background: linear-gradient(135deg, #4285f4, #1a73e8);
      color: #fff !important;
      font-size: 13px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 6px rgba(26, 115, 232, 0.35);
      white-space: nowrap;
      height: 32px;
    }
    .scaler-pick-random-btn:hover {
      opacity: 0.92;
      box-shadow: 0 4px 12px rgba(26, 115, 232, 0.5);
      transform: translateY(-1px);
    }
    .scaler-pick-random-btn:active {
      transform: translateY(0);
      box-shadow: 0 1px 4px rgba(26, 115, 232, 0.3);
    }
    .scaler-pick-random-btn:disabled {
      background: #8e8e8e;
      box-shadow: none;
      cursor: not-allowed;
      transform: none;
    }
  `;
  document.head.appendChild(style);
  styleInjected = true;
}
