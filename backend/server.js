const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const ytdlp = require("yt-dlp-exec");

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Folder for downloads
const downloadPath = path.join(__dirname, "download");
if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

// Serve frontend (optional)
app.use(express.static(path.join(__dirname, "..", "frontend")));

// === Routes ===

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

// Download video (MP4)
app.post("/download/video", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const output = path.join(downloadPath, "video.mp4");

    await ytdlp(url, {
      output,
      format: "mp4",
    });

    console.log("✅ Video downloaded:", output);

    res.download(output, "video.mp4", () => {
    //   fs.unlinkSync(output); // delete after sending
    });
  } catch (err) {
    console.error("❌ Error downloading video:", err);
    res.status(500).json({ error: "Download failed" });
  }
});

// Download audio (MP3)
app.post("/download/music", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const output = path.join(downloadPath, "audio.mp3");

    await ytdlp(url, {
      extractAudio: true,
      audioFormat: "mp3",
      output,
    });

    console.log("✅ Audio downloaded:", output);

    res.download(output, "audio.mp3", () => {
    //   fs.unlinkSync(output);
    });
  } catch (err) {
    console.error("❌ Error downloading audio:", err);
    res.status(500).json({ error: "Download failed" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
