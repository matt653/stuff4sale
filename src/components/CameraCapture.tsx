import React, { useRef, useState, useEffect } from "react";
import { Camera, Image as ImageIcon, RefreshCw, X, Check, AlertCircle, Video } from "lucide-react";

interface CameraCaptureProps {
  onPhotoCaptured: (base64Photo: string) => void;
  onVideoCaptured?: (base64Video: string) => void;
  onClose?: () => void;
  initialPhotoUrl?: string | null;
  initialVideoUrl?: string | null;
}

export default function CameraCapture({ 
  onPhotoCaptured, 
  onVideoCaptured, 
  onClose, 
  initialPhotoUrl, 
  initialVideoUrl 
}: CameraCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPhotoUrl || null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(initialVideoUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Enumerate cameras on component mount
  useEffect(() => {
    async function getCameras() {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devs.filter((d) => d.kind === "videoinput");
        setDevices(videoDevs);
        
        // Prefer rear camera by default for inventory taking
        const backCamera = videoDevs.find(
          (d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("environment")
        );
        if (backCamera) {
          setSelectedDeviceId(backCamera.deviceId);
        } else if (videoDevs.length > 0) {
          setSelectedDeviceId(videoDevs[0].deviceId);
        }
      } catch (err: any) {
        console.warn("Failed to enumerate camera devices:", err);
      }
    }
    getCameras();
  }, []);

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start video stream
  const startCamera = async (deviceId?: string) => {
    setError(null);
    stopCamera();
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "environment" },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.error("Error playing camera stream:", err);
        });
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setError("Unable to access camera. Please check permissions or upload an image instead.");
      setIsCameraActive(false);
    }
  };

  // Toggle active camera
  const handleDeviceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedDeviceId(deviceId);
    if (isCameraActive) {
      await startCamera(deviceId);
    }
  };

  // Switch between front/back
  const handleSwitchCamera = async () => {
    if (devices.length <= 1) return;
    const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    setSelectedDeviceId(nextDevice.deviceId);
    if (isCameraActive) {
      await startCamera(nextDevice.deviceId);
    }
  };

  // Capture photo from canvas
  const capturePhoto = () => {
    if (!videoRef.current) return;

    // Trigger visual flash
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    
    // Resize target dimensions to keep file sizes very low (e.g., max 600px width)
    const targetWidth = 600;
    const aspectRatio = video.videoWidth / video.videoHeight;
    const targetHeight = Math.round(targetWidth / aspectRatio);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Draw frame to canvas
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      // Compress to high-quality lightweight JPEG base64
      const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
      
      setPreviewUrl(compressedBase64);
      onPhotoCaptured(compressedBase64);
      stopCamera();
    }
  };

  // File Upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const targetWidth = 600;
        const aspectRatio = img.width / img.height;
        const targetHeight = Math.round(targetWidth / aspectRatio);

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
          setPreviewUrl(compressedBase64);
          onPhotoCaptured(compressedBase64);
          // Clear video if image uploaded
          setVideoPreviewUrl(null);
          if (onVideoCaptured) onVideoCaptured("");
        };
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size - warn if > 1.2MB for Firestore limit
    if (file.size > 1.2 * 1024 * 1024) {
      setError("Video file is too large (max 1.2MB for Firestore database). Try uploading a shorter 2-3 second video clip or a smaller file.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Video = event.target?.result as string;
      setVideoPreviewUrl(base64Video);
      if (onVideoCaptured) onVideoCaptured(base64Video);
      // Clear photo if video uploaded
      setPreviewUrl(null);
      onPhotoCaptured("");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-4 relative" id="camera-capture-container">
      {/* Title / Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <Camera size={16} className="text-indigo-600" />
          Item Media (Photo/Video)
        </span>
        {(previewUrl || videoPreviewUrl) && (
          <button
            type="button"
            onClick={() => {
              setPreviewUrl(null);
              setVideoPreviewUrl(null);
              onPhotoCaptured("");
              if (onVideoCaptured) onVideoCaptured("");
            }}
            className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1"
            id="btn-remove-media"
          >
            <X size={12} /> Clear Media
          </button>
        )}
      </div>

      {/* Main Preview/Video Area */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-200 shadow-inner">
        {flash && (
          <div className="absolute inset-0 bg-white z-20 animate-fade" />
        )}

        {previewUrl ? (
          /* Stored Photo Preview */
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Item capture preview"
              referrerPolicy="no-referrer"
              className="object-contain w-full h-full"
            />
            <div className="absolute bottom-2 right-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Check size={12} /> Photo Ready
            </div>
          </div>
        ) : videoPreviewUrl ? (
          /* Stored Video Preview */
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <video
              src={videoPreviewUrl}
              controls
              playsInline
              className="object-contain w-full h-full"
            />
            <div className="absolute bottom-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-md z-10">
              <Check size={12} /> Video Ready
            </div>
          </div>
        ) : isCameraActive ? (
          /* Live Camera View */
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover scale-x-1"
            />
            
            {/* Guide Grid Overlay */}
            <div className="absolute inset-0 border border-white/20 grid grid-cols-3 grid-rows-3 pointer-events-none">
              <div className="border-r border-b border-white/10"></div>
              <div className="border-r border-b border-white/10"></div>
              <div className="border-b border-white/10"></div>
              <div className="border-r border-b border-white/10"></div>
              <div className="border-r border-b border-white/10"></div>
              <div className="border-b border-white/10"></div>
            </div>

            {/* Bottom Camera Toolbar */}
            <div className="absolute bottom-3 inset-x-0 flex items-center justify-between px-4 z-10 bg-gradient-to-t from-black/80 to-transparent pt-6">
              {devices.length > 1 ? (
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition shadow-md"
                  title="Switch Camera"
                  id="btn-switch-camera"
                >
                  <RefreshCw size={18} />
                </button>
              ) : (
                <div className="w-10" />
              )}

              <button
                type="button"
                onClick={capturePhoto}
                className="w-14 h-14 bg-white hover:bg-slate-100 rounded-full border-4 border-indigo-600 flex items-center justify-center transition-all shadow-lg active:scale-95 transform"
                title="Capture Photo"
                id="btn-trigger-capture"
              >
                <div className="w-10 h-10 bg-indigo-500 rounded-full hover:bg-indigo-600 transition" />
              </button>

              <button
                type="button"
                onClick={stopCamera}
                className="p-2.5 bg-rose-600/80 hover:bg-rose-700 backdrop-blur-md rounded-full text-white transition shadow-md"
                title="Cancel Camera"
                id="btn-stop-camera"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* Upload/Prompt Selection State */
          <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center text-indigo-400 mb-3 shadow-md">
              <Camera size={26} />
            </div>
            
            <p className="text-sm font-medium text-slate-300 mb-4">No media captured yet</p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => startCamera(selectedDeviceId)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow active:scale-95"
                id="btn-activate-camera"
              >
                <Camera size={14} /> Open Camera
              </button>

              <label className="px-4 py-2 bg-slate-850 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow active:scale-95">
                <ImageIcon size={14} /> Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="input-file-upload"
                />
              </label>

              <label className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow active:scale-95">
                <Video size={14} /> Upload Video
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="input-video-upload"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Device Selection / Error Feedback */}
      {isCameraActive && devices.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 shrink-0">Camera Device:</label>
          <select
            value={selectedDeviceId}
            onChange={handleDeviceChange}
            className="text-xs bg-white border border-slate-200 rounded px-2 py-1 flex-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            id="select-camera-device"
          >
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${devices.indexOf(device) + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="mt-2.5 bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-lg text-xs flex items-start gap-1.5">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
