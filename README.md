# ✨ Scaler++

Bypass companion-mode on campus WiFi, download lecture recordings as audio/video, transcribe lectures locally with AI, get LeetCode links on assignments & declutter your Scaler dashboard — all in one lightweight, privacy-first Chrome extension.

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-green?logo=googlechrome)](https://chromewebstore.google.com/detail/scaler-dom-cleaner/fpnleckmeeahiognlpphbadchogfjgcg)
[![Version](https://img.shields.io/badge/Version-1.7.0-blue)]()
[![License](https://img.shields.io/badge/License-MIT-yellow)]()

---

## 🚀 ENHANCEMENTS

### 🛡️ Smart Companion Bypass

Bypass Scaler's companion-mode restrictions **only when you need to** — with zero impact on everyday browser performance.

- **⚡ On-Demand** — Activates IP-spoofing headers the instant you navigate to a join-session URL (`/session?joinSession=1`), then **automatically removes them after 5 seconds**.
- **🚀 Zero Slowdown** — Unlike always-on VPNs or proxy extensions, rules are active for ≈5 s per session join. The browser runs at full speed the rest of the time.
- **🔀 Random IP Pool** — Picks a random spoofed IP from a pool of 8 addresses on every activation.
- **🎛️ Toggle Control** — Enable/disable from the popup settings at any time.
- **Credits** - [PHATWalrus](https://github.com/PHATWalrus)

### 🚀 Direct Join Session

Replaces the "View Details" text on live class cards with a direct **"Join Session"** button.

- **Time-Gated** - Only appears when the class is currently live.
- **Frictionless** - One click to join the session directly from your dashboard.
- **Dynamic Updates** - Automatically detects new class cards loaded after navigation.

### 📚 Subject Sort

Automatically organizes your curriculum subjects into **Core** and **Other** categories for a cleaner learning experience.

- **🧠 Smart Categorization** - Reads subject titles and automatically segregates clubs, miscellaneous, and SST components.
- **🏷️ Visual Badges** - Adds sleek "Core" and "Other" tags next to subject numbers for instant recognition.
- **🔢 Auto-Sequencing** - Corrects the "Subject - N" numbers dynamically based on the new sorted order.
- **🔌 Native Compatibility** - Seamlessly integrates with Scaler's native React framework without breaking semester switching.

### 🔗 LeetCode Integration for Assignments

Automatically detects assignment problems and adds a **direct link** to the corresponding LeetCode problem with **intelligent caching** for instant results.

- **⚡ Smart Caching** - First search takes 2-5 s, subsequent visits are instant (~100 ms).
- **🧠 Intelligent Matching** - LeetCode GraphQL API with Google Search fallback.
- **💾 Persistent Cache** - 30-day cache with auto-expiration.
- **🎨 Beautiful UI** - Elegant link with LeetCode icon and smooth hover effects.
- **🔄 Seamless** - Opens in a new tab for an uninterrupted workflow.
- **Credits** - Siddhanth kapoor

### 🎯 Practice Mode

Automatically resets the code editor in assignments if not touched for 5+ hours. Includes a customizable auto-disable timer (1–30 days) and tracks manual resets to prevent accidental spoilers.

### 🔍 Instant Problem Search

Search 1000+ problems instantly by name, topic, type, or day.

- Press `/` to focus instantly.
- Real-time filtering as you type.
- Smart highlighting for matches.

### ⬇️ Lecture Downloader & 📝 AI Transcription _(Updated in v1.8.0)_

Download recorded lectures directly from the Scaler recordings page as **audio**, **video**, or **AI-generated transcript** — no external tools or API keys needed.

- **🎵 Audio-First** — Extracts pure audio from HLS streams using a built-in MPEG-TS demuxer. A 2-hour lecture becomes a ~25 MB `.aac` file instead of a 200+ MB video.
- **🎬 Video Too** — Full video downloads available as `.mp4` when you need visuals.
- **📝 AI Transcript** — Generates a `.txt` transcript of the entire lecture using **Whisper AI running 100% locally in your browser** via Transformers.js + ONNX Runtime WASM. No API keys, no cost, fully offline after first model download (~75 MB, cached automatically).
- **🧠 Anti-Hallucination** — Silence detection, repetition filtering, and deduplication ensure clean transcripts even with whisper-tiny.
- **⚡ 6× Parallel Downloads** — Concurrent chunk fetching with ordered disk writes. Downloads a 2-hour lecture in ~4 minutes instead of ~25 minutes.
- **💾 Stream-to-Disk** — Uses the File System Access API to write directly to disk, so even long lectures won't crash your browser's memory.
- **📊 Progress UI** — Opens a dedicated download tab with real-time progress bar, chunk counter, ETA, and activity logs. Progress bar resets between download and transcription phases.
- **🎛️ Toggle Control** — Enable/disable from the popup settings.

---

## 🧹 CLEANER DASHBOARD

### 🌍 Global Elements (All Pages)

- **Refer & Earn** - Hide the ₹ referral button in the header.
- **Scaler Coins** - Remove the coin counter and store link.
- **Popups & Widgets** - Auto-hide referral modals and floating notebook buttons.
- **Auto-Close** - Automatically dismisses referral/NSET popups as they appear.

### 📋 Dashboard (Todos) & Sidebar

- **Promotional Cards** - Hide "2025 Revisited", referral banners, and promo cards.
- **Counters & Stats** - Hide live referral counters and recording carousels.
- **Smart Mess Fee** - Hidden by default, auto-shows only in the last 10 days of the month.
- **Clean Sidebar** - Remove store links and "Refer Friends" badges.

---

## ✨ KEY BENEFITS

- ✅ **Instant Apply** - Settings take effect immediately without a page reload.
- ✅ **Smart Bypass** - Companion mode bypassed on-demand with zero permanent overhead.
- ✅ **Lecture Downloads** - Download 2-hour recordings as lightweight audio, full video, or AI transcript.
- ✅ **Smart Caching** - LeetCode links load instantly on revisits (20-50× faster).
- ✅ **Lightweight & Fast** - Native performance with no external dependencies.
- ✅ **Privacy Centric** - No data collection; works entirely via local storage.
- ✅ **Sync Support** - Your preferences are saved automatically across devices.

---

## 🛠️ Installation & Usage

1. **Install** from the Chrome Web Store or load unpacked in Developer Mode.
2. Click the **extension icon** to toggle features ON/OFF.
3. Use `/` on the problems page to start searching.
4. Click **Join Session** on a live class card — the bypass activates automatically.
5. On a recording page, click the **⬇️ download icon** → pick Audio, Video, or 📝 Transcript.

---

## 🏗️ Architecture

```
extension-main/
├── manifest.json
├── popup.html / popup.css / popup.js
├── background/
│   ├── background.js        ← Service worker entry point (importScripts only)
│   ├── companionBypass.js   ← Smart Companion Bypass logic
│   ├── leetcodeLink.js      ← LeetCode search & verification
    ├── calendarSync.js      ← Sync classes directly into Google Calendar
│   └── videoTracker.js      ← M3U8 stream capture & download initiation
└── content/
    ├── content.js           ← Entry point & message handler
    ├── core/                ← settings, styleInjector, urlObserver
    ├── cleaner/             ← selectors, cleanerEngine, modalHandler, sidebarHandler
    ├── features/
    │   ├── videoDownloader/  ← Lecture download & transcript module
    │   │   ├── videoDownloader.js    ← Button injection & recording detection
    │   │   ├── videoProcessor.html   ← Download/transcript progress UI
    │   │   ├── videoProcessor.js     ← Concurrent HLS downloader engine
    │   │   ├── whisperTranscriber.js ← Local Whisper AI transcription engine
    │   │   ├── transformers.min.js   ← Bundled Transformers.js (HuggingFace)
    │   │   ├── ort-*.wasm/mjs        ← ONNX Runtime WASM backend files
    │   │   ├── tsAudioExtractor.js   ← Pure-JS MPEG-TS audio demuxer
    │   │   └── modeBadge.js          ← Audio/Video/Transcript mode badge
    │   ├── problemSearch, practiceMode, leetcodeLink,
    │   │   joinClassButton, companionBypass, subjectSort
    └── utils/               ← domUtils, stringUtils
```

---

## 📝 Changelog

### v1.9.0 📅 Google Calendar Sync

Automatically adds your upcoming Scaler classes directly to your Google
Calendar — no manual entry needed.

- **🔄 Rolling 7-Day Window** — Fetches and syncs the next 7 days of classes
  every time a sync runs, so your calendar always stays a week ahead.
- **⏰ Daily Auto-Sync** — A background alarm fires once every 24 hours to
  pick up any newly scheduled or rescheduled classes without you lifting a
  finger.
- **🚫 No Duplicates** — Before adding any class, the sync checks your
  calendar first. If the event already exists it skips it — running Sync Now
  multiple times is completely safe.
- **🎛️ Toggle Control** — Enable or disable from the popup. Turning it OFF
  clears the background alarm entirely so zero API calls are made while
  disabled.
- **🚀 Sync Now** — A manual button appears beneath the toggle for an
  on-demand sync whenever you need it, even if auto-sync is already on.
- **🌐 Cross-Browser** — Works on Chrome, Brave, Edge, and Arc.

### v1.8.0 📝 AI Lecture Transcription Edition
### v1.7.0 ⬇️ Lecture Downloader & 📝 AI Transcription Edition

- **⬇️ Lecture Downloader**: Download recorded lectures as audio (`.aac`), video (`.mp4`), or AI-generated transcript directly from Scaler's recordings page.
- **📝 AI Transcript**: Generates `.txt` transcripts of lectures using Whisper AI (Transformers.js + ONNX Runtime WASM) running 100% locally in your browser.
- **🎵 Audio Extraction**: Built-in MPEG-TS demuxer strips video tracks, outputting lightweight ~25 MB audio files from 200+ MB streams.
- **⚡ 6× Parallel Downloads**: Concurrent chunk-fetching with ordered disk writes via the File System Access API for 500% faster downloads.
- **🧠 Anti-Hallucination**: Silence detection, in-chunk repetition removal, and cross-chunk deduplication ensure clean transcripts.
- **📊 Progress UI**: Dedicated download tab with phase-separated progress bars (Download vs. Transcription), chunk counter, and ETA.
- **💾 Auto-Save**: Transcripts and media files save automatically to disk — no manual file picker needed.
- **🏗️ CSP Compliance**: All ONNX/WASM files bundled locally to satisfy MV3's strict `script-src 'self'` policy.

### v1.6.2 🛡️ Smart Companion Bypass Edition

- **🛡️ Smart Companion Bypass**: Activates IP-spoofing headers for ~5 s when joining a session, then removes them automatically — zero impact on normal browsing speed.
- **⚡ On-Demand Trigger**: Detects `/session?joinSession=1` URL in the background via `chrome.tabs.onUpdated` — no content-script involvement needed.
- **🔀 Random IP Pool**: Rotates across 8 spoofed IPs on every activation.
- **🏗️ Modular Background**: Background service worker split into `companionBypass.js` and `leetcodeLink.js` for cleaner separation of concerns.
- **🎛️ Toggle Control**: Enable/disable Companion Bypass independently from the popup.

### v1.6.0 🚀 Direct Join Session Edition

- **🚀 Direct Join Session**: Replaces the "View Details" button with an actionable "Join Session" button for live classes directly on the dashboard.
- **⏱️ Time-Gating**: Smartly displays the button only when the class is currently active.
- **🎛️ Toggle Control**: Enable/disable Join Session buttons from the popup settings.

### v1.5.0 🔗 LeetCode Integration Edition

- **🔗 LeetCode Integration**: Automatically finds and links to corresponding LeetCode problems on assignment pages.
- **⚡ Smart Caching System**: Instant results for previously searched problems (100 ms vs 2-5 s).
- **💾 Persistent Cache**: 30-day cache with auto-expiration and intelligent cleanup.
- **🎛️ Toggle Control**: Enable/disable LeetCode links from the popup settings.
- **🧠 Intelligent Matching**: Uses LeetCode GraphQL API with Google Search fallback.
- **♻️ Rebranded to Scaler++**: Updated extension name to reflect enhanced feature set.

### v1.4.0

- **Added Practice Mode**: Auto-reset code in assignments with customizable expiration.
- **Added Storage Cleanup**: Automatically clears reset history when Practice Mode is disabled.
- **Improved UI**: New sub-options for Practice Mode with sleek dark-themed inputs.
- **Bug Fixes**: Resolved "Extension context invalidated" errors and improved modal reliability.

### v1.3.0

- Added Problem Search Bar with keyboard shortcut (`/`).
- Moved Core Curriculum to header and updated UI icons.

---

Made with ❤️ by **Scaler community** for the Scaler community.
_Focus on what matters — your learning journey!_
