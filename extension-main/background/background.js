// ============================================================
// background.js — Scaler++ Service Worker Entry Point
// ─────────────────────────────────────────────────────────────
// All feature logic lives in separate modules loaded below.
// importScripts() runs each file in the same global scope, so
// all their functions and listeners are immediately active.
// ============================================================

importScripts("./companionBypass.js"); // Smart Companion Mode Bypass
importScripts("./leetcodeLink.js"); // LeetCode Problem Search & Verification
importScripts("./videoTracker.js"); // Capture media streams
importScripts("./config.js");       // oAuth config not committed, see config.example.js for ref
importScripts("./calendarSync.js"); // Syncing classes directly into Google Calendar