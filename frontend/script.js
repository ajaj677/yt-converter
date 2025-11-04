//=== Elements ===

videoBtn = document.getElementById("video");
musicBtn = document.getElementById("music");


const url = document.getElementById('yt-url').value;


//=== Function to handle download ===

async function handleDownload(type) {
    const url = document.getElementById("yt-url").value.trim();

    if (!url) {
        alert("Please enter a valid url");
        return;
    }

    alert("Started downloading...");

    try{
        const response = await fetch(`http://localhost:5000/download/${type}`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            alert("Download failed");
            return;
        };

        //Get file as blob
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = type === 'video' ? "video.mp4" : "audio.mp3";

    } catch (error){
        console.error("Error : ", error);
        alert("Error downloading file!");
    }
}

//=== Event Listner ===

videoBtn.addEventListener("click", () => handleDownload("video"));
musicBtn.addEventListener("click", () => handleDownload("music"));
