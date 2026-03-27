// ============================================================
// liveStreamRecorder.js
// Integrates live stream recording and DVR into Scaler++
// ============================================================

class LiveStreamRecorder {
    constructor() {
        this.enabled = true;
        this.isActive = false;
        this.recordedChunks = [];
        this.recordingStartTime = 0;
        this.config = null;
        this.init();
    }

    async init() {
        try {
            const result = await chrome.storage.sync.get("cleanerSettings");
            if (result.cleanerSettings && result.cleanerSettings["live-stream-recorder"] === false) {
                this.enabled = false;
            }
        } catch (e) {}

        chrome.runtime.onMessage.addListener((msg) => {
            if (msg.action === "toggleSetting" && msg.key === "live-stream-recorder") {
                this.enabled = msg.value;
                if (!msg.value && this.isActive) {
                    this.deactivate();
                } else if (msg.value) {
                    this.checkAndInject();
                }
            }
        });

        if (this.enabled) {
            this.checkAndInject();
        }

        const observer = new MutationObserver(() => {
            if (this.enabled && !this.isActive) this.checkAndInject();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    checkAndInject() {
        const agoraPlayer = document.querySelector(".agora_video_player");
        const headerActions = document.querySelectorAll(".m-header__actions")[1];
        if (!agoraPlayer || !headerActions || document.getElementById("scaler-live-recorder-btn")) return;
        this.injectButton(headerActions);
    }

    injectButton(headerActions) {
        const container = document.createElement("div");
        container.id = "scaler-live-recorder-btn-container";
        container.className = "m-header__action";
        container.style.display = "inline-block";
        container.style.marginRight = "8px";

        const button = document.createElement("a");
        button.id = "scaler-live-recorder-btn";
        button.className = "tappable btn btn-icon m-btn btn-large m-btn--default";
        button.title = "Record Live Stream";
        button.style.color = "#ef4444";
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
            </svg>
        `;
        button.onclick = (e) => {
            e.preventDefault();
            this.activate();
        };
        container.appendChild(button);
        headerActions.insertBefore(container, headerActions.firstChild);
    }

    async activate() {
        if (this.isActive) return;
        this.isActive = true;
        console.log("[Scaler++] Activating Live Stream Recorder...");

        try {
            const config = await this.autoConfigure();
            if (!config) throw new Error("Could not fetch stream credentials");
            this.config = config;
        } catch (err) {
            console.error("[Scaler++] Configuration failed:", err);
            alert("⚠️ Failed to fetch stream credentials. Make sure you are in a live class.");
            this.isActive = false;
            return;
        }

        this.prepareUI();
        this.injectAgoraAndInit();
    }

    async autoConfigure() {
        try {
            const eventsRes = await fetch('https://www.scaler.com/academy/mentee/events');
            const eventsData = await eventsRes.json();
            const slug = eventsData.futureEvents?.[0]?.meeting_slug || eventsData.topCardEvent?.meeting_slug;
            if (!slug) throw new Error("No active meeting found");

            const sessionRes = await fetch(`https://www.scaler.com/meetings/${slug}/live-session`);
            const sessionData = await sessionRes.json();
            const rawChannel = sessionData.data?.feedback_forms?.[0]?.item_id;
            const channel = rawChannel ? String(rawChannel) : null;
            const token = sessionData.tokens?.video_broadcasting;
            const participants = sessionData.participants || [];
            let uid = null;
            if (participants.length > 0) {
                const lastId = participants[participants.length - 1].user_id;
                uid = parseInt(`1${lastId}`);
            }
            if (!channel || !token || !uid) throw new Error("Incomplete credentials");
            return { appId: "03d2d4319a52428ea2e5068d87f3bca9", channel, token, uid };
        } catch (err) {
            console.error("[Scaler++] autoConfigure error:", err);
            return null;
        }
    }

    prepareUI() {
        const streamsLayout = document.querySelector(".streams-layout");
        if (!streamsLayout) return;
        streamsLayout.style.display = "none";

        const container = document.createElement("div");
        container.id = "scaler-stream-recorder-container";
        container.innerHTML = `
            <div id="live-video-container"></div>
            <div class="video-controls-overlay">
                <div class="controls-row">
                    <div class="left-controls">
                        <button class="play-btn" id="recorder-play-pause-btn">⏸</button>
                        <span class="time-display" id="recorder-time-display">00:00</span>
                    </div>
                    <div class="right-controls">
                        <button id="recorder-download-btn" class="live-badge-btn" style="background: rgba(59, 130, 246, 0.2); color: #3b82f6;" disabled>
                            ⬇ DOWNLOAD
                        </button>
                    </div>
                </div>
            </div>
        `;
        streamsLayout.parentNode.insertBefore(container, streamsLayout.nextSibling);

        this.ui = {
            btnDownload: container.querySelector('#recorder-download-btn'),
            timeDisplay: container.querySelector('#recorder-time-display')
        };
        this.ui.btnDownload.onclick = () => this.downloadRecording();
        
        this.uiUpdateInterval = setInterval(() => this.updateUI(), 1000);
    }

    injectAgoraAndInit() {
        const bridgeScriptId = "scaler-recorder-bridge-script";
        if (document.getElementById(bridgeScriptId)) {
            this.sendCommand("init", { config: this.config });
            return;
        }

        const sdkScript = document.createElement("script");
        sdkScript.src = chrome.runtime.getURL("libs/agora-sdk.js");
        sdkScript.onload = () => {
            const bridgeScript = document.createElement("script");
            bridgeScript.id = bridgeScriptId;
            bridgeScript.src = chrome.runtime.getURL("content/features/liveStreamRecorder/recorderBridge.js");
            bridgeScript.onload = () => {
                this.sendCommand("init", { config: this.config });
            };
            document.body.appendChild(bridgeScript);
        };
        document.body.appendChild(sdkScript);

        window.addEventListener("scaler-stream-event", (e) => {
            const { type, data } = e.detail;
            this.handleBridgeEvent(type, data);
        });
    }

    handleBridgeEvent(type, data) {
        switch (type) {
            case "recording-status":
                if (data.startTime) this.recordingStartTime = data.startTime;
                if (this.ui.btnDownload) this.ui.btnDownload.disabled = false;
                break;
            case "chunk-available":
                this.recordedChunks.push(data.blob);
                break;
            case "download-ready":
                this.performDownload();
                break;
        }
    }

    sendCommand(type, data = {}) {
        window.dispatchEvent(new CustomEvent("scaler-stream-command", { detail: { type, data } }));
    }

    updateUI() {
        if (!this.isActive || !this.recordingStartTime) return;
        const duration = (Date.now() - this.recordingStartTime) / 1000;
        if (this.ui.timeDisplay) this.ui.timeDisplay.textContent = this.formatTime(duration);
    }

    downloadRecording() {
        this.sendCommand("request-download");
    }

    performDownload() {
        const blob = new Blob(this.recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `scaler_recording_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    deactivate() {
        this.isActive = false;
        if (this.uiUpdateInterval) clearInterval(this.uiUpdateInterval);
        this.sendCommand("cleanup");
        
        const container = document.getElementById("scaler-stream-recorder-container");
        if (container) container.remove();
        
        const streamsLayout = document.querySelector(".streams-layout");
        if (streamsLayout) streamsLayout.style.display = "";
    }
}
window.ScalerLiveStreamRecorder = new LiveStreamRecorder();
