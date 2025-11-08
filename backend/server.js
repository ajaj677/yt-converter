const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const ytdlp = require("yt-dlp-exec");

const now = new Date()
const MM = String(now.getMonth()+1).padStart(2, "0");
const DD = String(now.getDate()).padStart(2, "0");
const MIN = String(now.getMilliseconds()).padStart(2, "0");
// const fileName = `video_${MM}${DD}${MIN}`;

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Folder for downloads
const downloadPath = path.join(__dirname, "download");
if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

// == Serve react frontend (vita build) ===
const frontendPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendPath));

// === Routes ===

// Root route
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Download video (MP4)
app.post("/download/video", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const output = path.join(downloadPath, `video_${MM}${DD}${MIN}.mp4`);

    await ytdlp(url, {
      output,
      format: "mp4",
    });

    console.log(" Video downloaded:", output);

    res.download(output, () => {
    //   fs.unlinkSync(output); // delete after sending (for cloud)
    });
  } catch (err) {
    console.error("Error downloading video:", err);
    res.status(500).json({ error: "Download failed" });
  }
});

// Download audio (MP3)
app.post("/download/music", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const output = path.join(downloadPath, `audio_${MM}${DD}${MIN}.mp3`);

    await ytdlp(url, {
      extractAudio: true,
      audioFormat: "mp3",
      output,
    });

    console.log("Audio downloaded:", output);

    res.download(output, () => {
    //   fs.unlinkSync(output); (for cloud)
    });
  } catch (err) {
    console.error("Error downloading audio:", err);
    res.status(500).json({ error: "Download failed" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at PORT : ${port}`);
});
