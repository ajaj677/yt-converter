import React, { useState } from 'react';
import { Download, Video, Music, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function YouTubeConverter() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('video');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [urlError, setUrlError] = useState(false);

  const isValidYouTubeUrl = (url) => {
    const patterns = [
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?.*v=[\w-]{11}/
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const showError = (message) => {
    setError(message);
    setSuccess('');
    setUrlError(true);
    setTimeout(() => setUrlError(false), 300);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setError('');
  };

  const hideMessages = () => {
    setError('');
    setSuccess('');
  };

  const simulateProgress = () => {
    const steps = [
      { percent: 20, text: 'Fetching video info...' },
      { percent: 40, text: 'Downloading...' },
      { percent: 70, text: 'Processing...' },
      { percent: 90, text: 'Almost done...' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].percent);
        setProgressText(steps[currentStep].text);
        currentStep++;
      }
    }, 800);

    return interval;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    hideMessages();

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      showError('Please enter a YouTube URL');
      return;
    }

    if (!isValidYouTubeUrl(trimmedUrl)) {
      showError('Invalid YouTube URL. Please enter a valid URL (e.g., https://youtube.com/watch?v=...)');
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setProgressText('Starting download...');

    const progressInterval = simulateProgress();

    try {
      const response = await fetch('/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: trimmedUrl, format })
      });

      clearInterval(progressInterval);

      /*if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }*/
     if (!response.ok) {
  let errorMessage = "Download failed";
  try {
    const errorData = await response.json();
    errorMessage = errorData.error || errorMessage;
  } catch {
    // fallback if response is not JSON
    const text = await response.text();
    errorMessage = text || errorMessage;
  }
  throw new Error(errorMessage);
}


      setProgress(100);
      setProgressText('Complete! Preparing file...');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `download.${format === 'audio' ? 'mp3' : 'mp4'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      showSuccess('✓ Download completed successfully!');
      
      setTimeout(() => {
        setProgress(0);
        setProgressText('');
        setUrl('');
      }, 2000);

    } catch (err) {
      clearInterval(progressInterval);
      showError(err.message || 'Failed to download. Please try again.');
      setProgress(0);
      setProgressText('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center p-5">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-10 animate-slideUp">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl inline-flex items-center justify-center mb-4 shadow-lg">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">YouTube Converter</h1>
          <p className="text-gray-600 text-sm">Download videos and audio in high quality</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL Input */}
          <div>
            <label htmlFor="videoUrl" className="block text-sm font-semibold text-gray-700 mb-2">
              YouTube URL
            </label>
            <input
              type="text"
              id="videoUrl"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                hideMessages();
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              className={`w-full px-4 py-3.5 border-2 rounded-xl text-base transition-all outline-none
                ${urlError ? 'border-red-500 animate-shake' : 'border-gray-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100'}`}
              required
            />
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Format
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Video Option */}
              <div className="relative">
                <input
                  type="radio"
                  id="video"
                  name="format"
                  value="video"
                  checked={format === 'video'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="sr-only"
                />
                <label
                  htmlFor="video"
                  className={`flex flex-col items-center p-5 rounded-xl cursor-pointer transition-all border-2
                    ${format === 'video' 
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-700 border-purple-600 text-white shadow-lg scale-105' 
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-purple-300'}`}
                >
                  <Video className="w-8 h-8 mb-2" />
                  <span className="font-semibold text-base">Video</span>
                  <span className="text-xs opacity-80 mt-1">MP4 with audio</span>
                </label>
              </div>

              {/* Audio Option */}
              <div className="relative">
                <input
                  type="radio"
                  id="audio"
                  name="format"
                  value="audio"
                  checked={format === 'audio'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="sr-only"
                />
                <label
                  htmlFor="audio"
                  className={`flex flex-col items-center p-5 rounded-xl cursor-pointer transition-all border-2
                    ${format === 'audio' 
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-700 border-purple-600 text-white shadow-lg scale-105' 
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-purple-300'}`}
                >
                  <Music className="w-8 h-8 mb-2" />
                  <span className="font-semibold text-base">Audio</span>
                  <span className="text-xs opacity-80 mt-1">MP3 only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-semibold rounded-xl 
              transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed 
              disabled:transform-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download</span>
              </>
            )}
          </button>
        </form>

        {/* Progress Bar */}
        {(isLoading || progress > 0) && (
          <div className="mt-6 p-5 bg-gray-50 rounded-xl animate-slideDown">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-700 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-gray-700 text-sm font-medium">{progressText}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3 animate-slideDown">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-start gap-3 animate-slideDown">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{success}</span>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .animate-slideUp {
          animation: slideUp 0.5s ease;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease;
        }

        .animate-shake {
          animation: shake 0.3s;
        }
      `}</style>
    </div>
  );
}