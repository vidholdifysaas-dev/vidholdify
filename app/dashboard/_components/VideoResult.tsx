"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Share2, Video, Sparkles, RotateCcw, Loader2, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useVideoCreator } from "../../context/VideoCreatorContext";
import { useCredits } from "@/app/context/CreditContext";

import LoadingMessages from "./LoadingMessages";

export default function VideoResult() {
  const { workflowData, setWorkflowData, resetWorkflow, goToStep } = useVideoCreator();
  const { refreshCredits } = useCredits();

  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoUrl = workflowData.finishedVideoUrl;
  const taskId = workflowData.videoTaskId;
  const videoRecordId = workflowData.videoRecordId;

  const pollForVideoCompletion = useCallback(async (taskIdToPoll: string) => {
    const maxAttempts = 400; // 10 minutes max
    let attempts = 0;

    // Fake progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return 90;
        const increment = prev < 50 ? 2 : prev < 80 ? 1 : 0.5;
        return prev + increment;
      });
    }, 800);

    const poll = async () => {
      try {
        console.log(`🔍 Polling video status (attempt ${attempts + 1}/${maxAttempts})...`);
        const response = await fetch(`/api/topview/generate-video/status?taskId=${taskIdToPoll}`);
        const data = await response.json();

        if (data.status === "success" && data.finishedVideoUrl) {
          clearInterval(progressInterval);
          setProgress(100);

          setWorkflowData({
            finishedVideoUrl: data.finishedVideoUrl,
            videoRecordId: videoRecordId
          });
          setStatus("success");
          toast.success("Video generated successfully!");
          refreshCredits();
        } else if (data.status === "failed" || data.status === "error") {
          clearInterval(progressInterval);
          // Go back to step 3 directly with toast
          toast.error(data.message || "Video generation failed. Please try again.");
          goToStep(3);
        } else {
          // Still processing
          if (attempts < maxAttempts) {
            attempts++;
            setTimeout(poll, 5000);
          } else {
            clearInterval(progressInterval);
            toast.error("Video generation timed out. Please try again.");
            goToStep(3);
          }
        }
      } catch (err) {
        // Continue polling on network error unless max attempts reached
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 5000);
        } else {
          clearInterval(progressInterval);
          toast.error("Failed to check video status due to network error.");
          goToStep(3);
        }
      }
    };

    poll();

    return () => clearInterval(progressInterval);
  }, [setWorkflowData, refreshCredits, videoRecordId]);

  // Initialize status based on whether we already have the URL
  useEffect(() => {
    if (videoUrl) {
      setStatus("success");
      setProgress(100);
    } else if (taskId) {
      setStatus("loading");
      setProgress(0);
      pollForVideoCompletion(taskId);
    } else {
      setStatus("failed");
      setErrorMsg("No video generation task found.");
    }
  }, [videoUrl, taskId, pollForVideoCompletion]);

  const handleDownload = async () => {
    if (!videoUrl) return;
    setDownloading(true);
    try {
      // Try fetching as blob first to give it a nice filename
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `product-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Video downloaded successfully!");
    } catch (error) {
      console.error("Download failed, trying direct link:", error);
      // Fallback: Just open the URL in a new tab which triggers download in most browsers
      // for video files or plays them (user can then right click -> save as)
      const a = document.createElement("a");
      a.href = videoUrl;
      a.target = "_blank";
      a.download = `product-video-${Date.now()}.mp4`; // Hint to browser, might be ignored for cross-origin
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Download started (opening in new tab)");
    } finally {
      setDownloading(false);
    }
  };

  const handleTryAgain = () => {
    // Go back to step 3
    goToStep(3);
  };



  // Loading View
  if (status === "loading") {
    return (
      <div className="bg-card border border-border rounded-xl p-8 sm:p-16 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-300">
        {/* Circular Progress */}
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-border/30"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#gradient-step4)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.83} 283`}
              className="transition-all duration-300 ease-out"
            />
            <defs>
              <linearGradient id="gradient-step4" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="white" />
                <stop offset="100%" stopColor="white" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="text-center space-y-3">
          <h3 className="text-xl font-semibold text-foreground flex items-center justify-center gap-2">
            <Video className="w-5 h-5 text-brand-primary animate-pulse" />
            Generating Video
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            AI is creating your UGC video. This may take a few minutes.
          </p>
        </div>

        <LoadingMessages />
      </div>
    );
  }

  // Failed View
  if (status === "failed") {
    return (
      <div className="bg-card border border-border rounded-xl p-8 sm:p-16 flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <X className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-foreground">Generation Failed</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {errorMsg || "Something went wrong. Please try again."}
          </p>
        </div>
        <button
          onClick={handleTryAgain}
          className="px-6 py-2.5 rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Video Ready! 🎉
        </h2>
        <p className="text-muted-foreground">
          Your AI-powered UGC video has been generated successfully
        </p>
      </div>

      {/* Video Player */}
      <div className="mb-8">
        <div className="aspect-video bg-sidebar rounded-xl overflow-hidden border border-border max-w-4xl mx-auto shadow-2xl">
          <video
            src={videoUrl}
            controls
            className="w-full h-full"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-4xl mx-auto">
        <button
          onClick={handleDownload}
          disabled={!videoUrl || downloading}
          className="flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-brand-primary text-white rounded-lg font-semibold hover:bg-brand-primary/90 transition-all disabled:opacity-50"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 sm:w-5 sm:h-5" />}
          {downloading ? "Downloading..." : "Download"}
        </button>

        <button
          onClick={resetWorkflow}
          className="flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-sidebar border border-border text-foreground rounded-lg font-semibold hover:border-brand-primary/50 transition-all"
        >
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          New Video
        </button>
      </div>

      {/* Stats/Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <div className="p-4 bg-sidebar border border-sidebar-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-primary/20 flex items-center justify-center">
              <Video className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Format</p>
              <p className="text-sm font-semibold text-foreground">MP4 Video</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-sidebar border border-sidebar-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Credits Used</p>
              <p className="text-sm font-semibold text-foreground">5 Credit</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-sidebar border border-sidebar-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-primary/20 flex items-center justify-center">
              <Video className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Quality</p>
              <p className="text-sm font-semibold text-foreground">Pro Mode</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tip */}
      <div className="p-3 sm:p-4 mt-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg max-w-4xl mx-auto">
        <p className="text-xs sm:text-sm text-foreground text-center">
          💡 <strong>Tip:</strong> Share this video on your social media or use it
          in your marketing campaigns to boost engagement!
        </p>
      </div>
    </div>
  );
}
