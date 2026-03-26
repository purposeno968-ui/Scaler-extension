// ============================================================
// audioTranscriber.js
// Uses Lemonfox API for transcription
// ============================================================

class AudioTranscriber {
  constructor(logFn) {
    this.log = logFn || (() => {});
  }

  /**
   * Initialize transcriber. Checks if Backend API is active.
   */
  async init() {
    this.log("Checking Backend API availability...");
    try {
      // For testing use http://localhost:3000/
      const res = await fetch("https://scalerbackend.vercel.app/", {
        method: "GET",
      });

      if (res.ok) {
        this.log(
          "✅ Backend API is active. Will use remote API for fast transcription.",
        );
        return;
      }
    } catch (e) {
      this.log(`⚠ Backend ping failed: ${e.message}`);
      throw new Error("Backend API is unavailable");
    }
    throw new Error("Backend API is unavailable");
  }

  // ── Anti-hallucination helpers ──

  _removeRepetitions(text) {
    if (!text || text.length < 20) return text;

    const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
    if (sentences.length < 3) return text;

    const cleaned = [sentences[0]];
    let repeatCount = 0;
    const MAX_REPEATS = 2;

    for (let i = 1; i < sentences.length; i++) {
      const prev = cleaned[cleaned.length - 1].trim().toLowerCase();
      const curr = sentences[i].trim().toLowerCase();

      if (curr === prev) {
        repeatCount++;
        if (repeatCount < MAX_REPEATS) {
          cleaned.push(sentences[i]);
        }
      } else {
        repeatCount = 0;
        cleaned.push(sentences[i]);
      }
    }

    let result = cleaned.join(" ");
    result = result.replace(/\b(\w+(?:\s+\w+){0,3})(?:\s+\1){2,}/gi, "$1");
    result = result.replace(/(\b\w+(?:\s+\w+){0,4},)(?:\s*\1){2,}/gi, "$1");

    return result.trim();
  }

  // ── Main Entry ──
  async transcribe(audioBuffer, onProgress) {
    return await this.transcribeRemote(audioBuffer, onProgress);
  }

  // ── Remote Transcription ── //
  async transcribeRemote(audioBuffer, onProgress) {
    this.log("Uploading chunks to Lemonfox Whisper API...");

    // Keep chunks well under Lemonfox's limit to avoid 413 errors.
    // 4 MB per chunk is a safe ceiling (Lemonfox rejects ~10 MB+).
    const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB
    const MAX_RETRIES = 3;
    const INTER_CHUNK_DELAY_MS = 800; // avoid hammering the API

    const totalChunks = Math.ceil(audioBuffer.byteLength / CHUNK_SIZE);
    const transcriptParts = [];

    this.log(
      `Audio size: ${(audioBuffer.byteLength / 1024 / 1024).toFixed(1)} MB → ${totalChunks} chunk(s)`,
    );

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, audioBuffer.byteLength);
      const chunk = audioBuffer.slice(start, end);

      // Use audio/mpeg (.mp3) — matches the audio output format
      const blob = new Blob([chunk], { type: "audio/mpeg" });
      const file = new File([blob], `audio_chunk_${i}.mp3`, {
        type: "audio/mpeg",
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", "whisper-1");

      let success = false;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const response = await fetch(
            // For testing use http://localhost:3000/api/transcribe
            "https://scalerbackend.vercel.app/api/transcribe",
            {
              method: "POST",
              headers: {
                Authorization:
                  "Bearer Ritesh-Prajapati-created-started-this-extension-super-secret-key-12345",
              },
              body: formData,
            },
          );

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
          }

          const data = await response.json();
          if (data && data.text) {
            transcriptParts.push(data.text.trim());
          }
          success = true;
          break; // success — no more retries needed
        } catch (err) {
          this.log(
            `⚠ Chunk ${i + 1} attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`,
          );
          if (attempt < MAX_RETRIES) {
            // Exponential back-off: 2s, 4s
            await new Promise((r) => setTimeout(r, 2000 * attempt));
          }
        }
      }

      if (!success) {
        this.log(
          `❌ Chunk ${i + 1} could not be transcribed after ${MAX_RETRIES} attempts. Skipping.`,
        );
      }

      const pct = (((i + 1) / totalChunks) * 100).toFixed(1);
      if (onProgress) {
        onProgress(parseFloat(pct), i + 1, totalChunks);
      }
      this.log(`Transcribed API Chunk: ${i + 1}/${totalChunks} (${pct}%)`);

      // Small pause between chunks to avoid rate-limiting
      if (i < totalChunks - 1) {
        await new Promise((r) => setTimeout(r, INTER_CHUNK_DELAY_MS));
      }
    }

    let fullText = transcriptParts.join(" ");
    return this._removeRepetitions(fullText);
  }
}
