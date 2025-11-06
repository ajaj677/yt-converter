const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const ytdlp = require("yt-dlp-exec");

const app = express();
const PORT = process.env.PORT || 5000;

// === Middleware ===
app.use(cors());
app.use(express.json());

// === Setup download folder ===
const downloadPath = path.join(__dirname, "download");
if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

// === Root route ===
app.get("/", (req, res) => {
  res.send("YouTube Downloader Backend is Running 🚀");
});

// === Unified Download Route (audio / video) ===
app.post("/download", async (req, res) => {
  try {
    const { url, format } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const now = new Date();
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const DD = String(now.getDate()).padStart(2, "0");
    const MIN = String(now.getMilliseconds()).padStart(2, "0");

    const isAudio = format === "audio";
    const fileName = `${isAudio ? "audio" : "video"}_${MM}${DD}${MIN}.${isAudio ? "mp3" : "mp4"}`;
    const output = path.join(downloadPath, fileName);

    // Run yt-dlp
    if (isAudio) {
      await ytdlp(url, {
        extractAudio: true,
        audioFormat: "mp3",
        output,
      });
    } else {
      await ytdlp(url, {
        format: "mp4",
        output,
      });
    }

    console.log(`✅ ${isAudio ? "Audio" : "Video"} downloaded:`, output);

    // Send file as download
    res.download(output, fileName, (err) => {
      if (err) console.error("Error sending file:", err);
      // Optionally delete after sending
      // fs.unlinkSync(output);
    });
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: error.message || "Download failed" });
  }
});

// === Start Server ===
app.listen(PORT, () => {
  console.log(`🚀 Server running at PORT : ${PORT}`);
});
