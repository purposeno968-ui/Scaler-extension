class LiveStreamRecorder {
    constructor() {
        this.enabled = true;
        this.isActive = false;
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

    activate() {
        if (this.isActive) return;
        this.isActive = true;
        console.log("[Scaler++] Activating Live Stream Recorder UI...");
        this.prepareUI();
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
                    </div>
                </div>
            </div>
        `;
        streamsLayout.parentNode.insertBefore(container, streamsLayout.nextSibling);
    }

    deactivate() {
        this.isActive = false;
        const container = document.getElementById("scaler-stream-recorder-container");
        if (container) container.remove();
        const streamsLayout = document.querySelector(".streams-layout");
        if (streamsLayout) streamsLayout.style.display = "";
    }
}
window.ScalerLiveStreamRecorder = new LiveStreamRecorder();
