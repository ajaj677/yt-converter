import { useState } from "react";
import "./App.css";

function isValidUrl(str: string) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function getYouTubeId(urlStr: string): string | null {
  try {
    const url = new URL(urlStr);
    const host = url.hostname.toLowerCase();
    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split(/[?&/]/)[0];
      return id || null;
    }
    if (host.endsWith("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v) return v;
      const m = url.pathname.match(/\/(?:embed|v|shorts)\/([^/?&]+)/);
      if (m && m[1]) return m[1];
    }
    return null;
  } catch {
    return null;
  }
}

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  // helper to mark invalid input visually
  const isInvalidInput = Boolean(status && /URL|YouTube|missing|valid|missing video/i.test(status));

  const handleDownload = async (type: "video" | "music") => {
    setStatus(null);

    if (!url || !isValidUrl(url)) {
      setStatus("Please provide a valid URL");
      return;
    }

    const videoId = getYouTubeId(url);
    if (!videoId) {
      setStatus("This does not look like a YouTube link (missing video ID). Paste e.g. https://youtu.be/ID or https://www.youtube.com/watch?v=ID");
      return;
    }

    setLoading(true);
    setProgress(null);
    setStatus("Preparing...");

    const controller = new AbortController();
    const TIMEOUT_MS = 60000; // 60s
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`http://localhost:5000/download/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });

      if (!response.ok) {
        // try to read a meaningful server message
        let serverMsg = null;
        try {
          const json = await response.json();
          serverMsg = json?.error || json?.message || JSON.stringify(json);
        } catch {
          // not JSON, fallback
        }
        setStatus(serverMsg ? `Server error: ${serverMsg}` : `Server error: ${response.status} ${response.statusText}`);
        setLoading(false);
        return;
      }

      const contentLength = Number(response.headers.get("Content-Length")) || 0;
      const cd = response.headers.get("Content-Disposition") || "";
      let filename = type === "video" ? "video.mp4" : "audio.mp3";
      const match = cd.match(/filename\*=UTF-8''(.+)$|filename="?(.*?)"?$/i);
      if (match) {
        try {
          filename = decodeURIComponent(match[1] || match[2] || filename);
        } catch (err) {
          // ignore decode errors and keep default filename
          console.warn("Failed to decode filename from Content-Disposition:", err);
        }
      }

      if (
        response.body &&
        contentLength > 0 &&
        (response.body as ReadableStream<Uint8Array>).getReader
      ) {
        const reader = (response.body as ReadableStream<Uint8Array>).getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;
        setStatus("Downloading... 0%");
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.length;
            const pct = Math.min(100, Math.round((received / contentLength) * 100));
            setProgress(pct);
            setStatus(`Downloading... ${pct}%`);
          }
        }
        const blob = new Blob(chunks.map((c) => Uint8Array.from(c).buffer));
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setStatus("Download complete");
      } else {
        // fallback
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setStatus("Download complete");
      }
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "name" in err && (err as { name?: string }).name === "AbortError") {
        setStatus("Operation aborted (timeout). Try again or check your connection.");
      } else {
        const message =
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message?: string }).message
            : String(err);
        setStatus(`Error during download: ${message || String(err)}`);
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      setTimeout(() => setProgress(null), 800);
    }
  };

  return (
    <div className="wrapper">
      <h2 className="title">YouTube Converter</h2>

      <label className="sr-only" htmlFor="urlInput">Video URL</label>
      <input
        id="urlInput"
        className={`url-input ${isInvalidInput ? "invalid" : ""}`}
        type="url"
        placeholder="Paste YouTube link"
        value={url}
        onChange={(e) => setUrl(e.target.value.trim())}
        aria-label="YouTube URL"
        aria-invalid={isInvalidInput}
      />

      {/* helpful hint */}
      {isInvalidInput ? (
        <div className="help error">Please paste a valid YouTube link</div>
      ) : (
        <div className="help">Supported: youtube.com, youtu.be, shorts, embed</div>
      )}

      <div className="cta-btn">
        <button
          className="button"
          onClick={() => handleDownload("video")}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? <span className="spinner" aria-hidden="true" /> : "Download Video"}
        </button>

        <button
          className="button alt"
          onClick={() => handleDownload("music")}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? <span className="spinner" aria-hidden="true" /> : "Download Audio"}
        </button>
      </div>

      {progress !== null && (
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="progress-inner" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="status" role="status" aria-live="polite">
        {status}
      </div>
    </div>
  );
}

export default App;
