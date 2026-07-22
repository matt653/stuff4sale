import React, { useRef, useState, useEffect } from "react";
import { Camera, Image as ImageIcon, RefreshCw, X, Check, AlertCircle, Video, Plus, Star, Trash2 } from "lucide-react";

interface CameraCaptureProps {
  onPhotoCaptured?: (base64Photo: string) => void;
  onPhotosCaptured?: (photos: string[]) => void;
  onVideoCaptured?: (base64Video: string) => void;
  onClose?: () => void;
  initialPhotoUrl?: string | null;
  initialPhotos?: string[];
  initialVideoUrl?: string | null;
}

export default function CameraCapture({ 
  onPhotoCaptured,
  onPhotosCaptured, 
  onVideoCaptured, 
  onClose, 
  initialPhotoUrl, 
  initialPhotos,
  initialVideoUrl 
}: CameraCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  
  // Multiple photos state
  const [photos, setPhotos] = useState<string[]>(
    initialPhotos && initialPhotos.length > 0
      ? initialPhotos
      : initialPhotoUrl
      ? [initialPhotoUrl]
      : []
  );
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(initialVideoUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Re-sync photos state when initialPhotos or initialPhotoUrl prop changes (e.g. when editing item)
  useEffect(() => {
    if (initialPhotos && initialPhotos.length > 0) {
      setPhotos(initialPhotos);
    } else if (initialPhotoUrl) {
      setPhotos([initialPhotoUrl]);
    } else {
      setPhotos([]);
    }
  }, [initialPhotos, initialPhotoUrl]);

  // Sync state changes with parent component
  const updatePhotos = (newPhotos: string[]) => {
    setPhotos(newPhotos);
    if (newPhotos.length > 0) {
      if (activePhotoIndex >= newPhotos.length) {
        setActivePhotoIndex(newPhotos.length - 1);
      }
    } else {
      setActivePhotoIndex(0);
    }

    if (onPhotosCaptured) {
      onPhotosCaptured(newPhotos);
    }
    if (onPhotoCaptured) {
      onPhotoCaptured(newPhotos[0] || "");
    }
  };

  // Enumerate cameras on component mount
  useEffect(() => {
    async function getCameras() {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devs.filter((d) => d.kind === "videoinput");
        setDevices(videoDevs);
        
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

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
      setError("Unable to access camera. Please check permissions or upload images instead.");
      setIsCameraActive(false);
    }
  };

  const handleDeviceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedDeviceId(deviceId);
    if (isCameraActive) {
      await startCamera(deviceId);
    }
  };

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

  // Capture photo from canvas and append to array
  const capturePhoto = () => {
    if (!videoRef.current) return;

    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    
    const targetWidth = 600;
    const aspectRatio = video.videoWidth / video.videoHeight;
    const targetHeight = Math.round(targetWidth / aspectRatio);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
      
      const newPhotosList = [...photos, compressedBase64];
      updatePhotos(newPhotosList);
      setActivePhotoIndex(newPhotosList.length - 1);
      
      // Stop camera after capture so user can preview/add more
      stopCamera();
    }
  };

  // Handle uploading single or multiple image files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newUploadedPhotos: string[] = [];
    let processedCount = 0;

    (files as File[]).forEach((file: File) => {
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
            newUploadedPhotos.push(compressedBase64);
          }

          processedCount++;
          if (processedCount === files.length) {
            const combined = [...photos, ...newUploadedPhotos];
            updatePhotos(combined);
            setActivePhotoIndex(combined.length - 1);
            setVideoPreviewUrl(null);
            if (onVideoCaptured) onVideoCaptured("");
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    // Reset input value so same files can be re-selected if needed
    e.target.value = "";
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.2 * 1024 * 1024) {
      setError("Video file is too large (max 1.2MB for Firestore database). Try uploading a shorter clip.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Video = event.target?.result as string;
      setVideoPreviewUrl(base64Video);
      if (onVideoCaptured) onVideoCaptured(base64Video);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (indexToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = photos.filter((_, idx) => idx !== indexToRemove);
    updatePhotos(updated);
  };

  const handleSetPrimaryPhoto = (indexToPrimary: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (indexToPrimary === 0) return;
    const itemToMove = photos[indexToPrimary];
    const remaining = photos.filter((_, idx) => idx !== indexToPrimary);
    const updated = [itemToMove, ...remaining];
    updatePhotos(updated);
    setActivePhotoIndex(0);
  };

  const handleMovePhotoLeft = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index <= 0) return;
    const copy = [...photos];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    updatePhotos(copy);
    setActivePhotoIndex(index - 1);
  };

  const handleMovePhotoRight = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index >= photos.length - 1) return;
    const copy = [...photos];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    updatePhotos(copy);
    setActivePhotoIndex(index + 1);
  };

  const handleClearAllMedia = () => {
    updatePhotos([]);
    setVideoPreviewUrl(null);
    if (onVideoCaptured) onVideoCaptured("");
  };

  const currentPreviewPhoto = photos[activePhotoIndex] || null;

  return (
    <div className="w-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-4 relative" id="camera-capture-container">
      {/* Title / Header Bar */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Camera size={16} className="text-indigo-600" />
            Listing Pictures ({photos.length}) {videoPreviewUrl ? "+ Video" : ""}
          </span>
          {photos.length > 0 && (
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
              Multi-Photo Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {photos.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => startCamera(selectedDeviceId)}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition active:scale-95"
                title="Take another photo"
              >
                <Camera size={12} /> Snap Photo
              </button>

              <label className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition active:scale-95">
                <Plus size={12} /> Add Pictures
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </>
          )}

          {(photos.length > 0 || videoPreviewUrl) && (
            <button
              type="button"
              onClick={handleClearAllMedia}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 transition ml-1"
              id="btn-remove-all-media"
            >
              <X size={12} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Main Large Preview Area */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-200 shadow-inner">
        {flash && (
          <div className="absolute inset-0 bg-white z-20 animate-fade" />
        )}

        {currentPreviewPhoto ? (
          /* Stored Photo Preview */
          <div className="relative w-full h-full flex items-center justify-center group">
            <img
              src={currentPreviewPhoto}
              alt={`Photo ${activePhotoIndex + 1}`}
              referrerPolicy="no-referrer"
              className="object-contain w-full h-full"
            />
            <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
              {activePhotoIndex === 0 ? (
                <span className="text-amber-400 font-extrabold flex items-center gap-1">
                  <Star size={12} className="fill-amber-400" /> Main Cover Photo
                </span>
              ) : (
                <span>Photo {activePhotoIndex + 1} of {photos.length}</span>
              )}
            </div>

            {/* Floating Overlay Add Picture Button */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              <label className="px-3 py-1.5 bg-slate-900/85 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md backdrop-blur-sm transition active:scale-95 border border-slate-700">
                <Plus size={14} className="text-indigo-400" /> Add More Pictures
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="absolute bottom-2 right-2 bg-emerald-600 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
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
            <div className="absolute bottom-2 right-2 bg-indigo-600 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md z-10">
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
            
            <div className="absolute inset-0 border border-white/20 grid grid-cols-3 grid-rows-3 pointer-events-none">
              <div className="border-r border-b border-white/10"></div>
              <div className="border-r border-b border-white/10"></div>
              <div className="border-b border-white/10"></div>
              <div className="border-r border-b border-white/10"></div>
              <div className="border-r border-b border-white/10"></div>
              <div className="border-b border-white/10"></div>
            </div>

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
                title="Snap Photo"
                id="btn-trigger-capture"
              >
                <div className="w-10 h-10 bg-indigo-500 rounded-full hover:bg-indigo-600 transition flex items-center justify-center text-white">
                  <Plus size={20} />
                </div>
              </button>

              <button
                type="button"
                onClick={stopCamera}
                className="p-2.5 bg-rose-600/80 hover:bg-rose-700 backdrop-blur-md rounded-full text-white transition shadow-md"
                title="Done with Camera"
                id="btn-stop-camera"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* Empty Initial State */
          <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center text-indigo-400 mb-3 shadow-md">
              <Camera size={26} />
            </div>
            
            <p className="text-sm font-medium text-slate-300 mb-4">No media captured yet</p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => startCamera(selectedDeviceId)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow active:scale-95"
                id="btn-activate-camera"
              >
                <Camera size={14} /> Open Camera
              </button>

              <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow active:scale-95">
                <ImageIcon size={14} /> Add Pictures
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="input-file-upload"
                />
              </label>

              <label className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow active:scale-95">
                <Video size={14} /> Add Video
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

      {/* Multi-Photo Thumbnail Strip Gallery & Ordering Controls */}
      {photos.length > 0 && (
        <div className="mt-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5 shadow-xs" id="photo-ordering-gallery">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-800 text-xs">
                📸 Photo Gallery Order ({photos.length})
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-2 py-0.5 rounded-full">
                First Pic = Primary Cover
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Use arrows to re-order sequence</span>
          </div>

          <div className="flex items-start gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {photos.map((imgSrc, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-1 shrink-0 group"
              >
                {/* Thumbnail Image Box */}
                <div
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition cursor-pointer shadow-xs ${
                    idx === 0
                      ? "border-amber-500 ring-2 ring-amber-300 shadow-md"
                      : activePhotoIndex === idx
                      ? "border-indigo-600 ring-2 ring-indigo-200"
                      : "border-slate-200 hover:border-indigo-400 opacity-90 hover:opacity-100"
                  }`}
                >
                  <img
                    src={imgSrc}
                    alt={`Photo ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />

                  {/* Explicit Order Number Badge */}
                  <div
                    className={`absolute top-1 left-1 px-1.5 py-0.5 rounded-md text-[9px] font-black shadow-sm flex items-center gap-0.5 ${
                      idx === 0
                        ? "bg-amber-500 text-white"
                        : "bg-slate-900/80 text-white backdrop-blur-xs"
                    }`}
                  >
                    {idx === 0 ? <Star size={9} className="fill-white" /> : null}
                    #{idx + 1} {idx === 0 ? "COVER" : ""}
                  </div>

                  {/* Delete Button Badge */}
                  <button
                    type="button"
                    onClick={(e) => handleRemovePhoto(idx, e)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow transition opacity-80 hover:opacity-100"
                    title="Remove Photo"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>

                {/* 1-Tap Ordering Control Buttons */}
                <div className="flex items-center gap-1 mt-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={(e) => handleMovePhotoLeft(idx, e)}
                    className="w-6 h-6 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-600 disabled:opacity-30 rounded-lg flex items-center justify-center text-xs font-black transition shadow-2xs cursor-pointer disabled:cursor-not-allowed"
                    title="Move Left (Earlier in Order)"
                  >
                    ‹
                  </button>

                  {idx !== 0 ? (
                    <button
                      type="button"
                      onClick={(e) => handleSetPrimaryPhoto(idx, e)}
                      className="px-1.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[9px] font-extrabold flex items-center gap-0.5 transition shadow-2xs cursor-pointer"
                      title="Make Photo #1 Primary Cover"
                    >
                      <Star size={9} className="fill-white" />
                      Set #1
                    </button>
                  ) : (
                    <span className="px-1.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[9px] font-extrabold flex items-center gap-0.5">
                      <Star size={9} className="fill-amber-600 stroke-none" />
                      Cover
                    </span>
                  )}

                  <button
                    type="button"
                    disabled={idx === photos.length - 1}
                    onClick={(e) => handleMovePhotoRight(idx, e)}
                    className="w-6 h-6 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-600 disabled:opacity-30 rounded-lg flex items-center justify-center text-xs font-black transition shadow-2xs cursor-pointer disabled:cursor-not-allowed"
                    title="Move Right (Later in Order)"
                  >
                    ›
                  </button>
                </div>
              </div>
            ))}

            {/* Quick Add Photo Button */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <button
                type="button"
                onClick={() => startCamera(selectedDeviceId)}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/50 flex flex-col items-center justify-center text-indigo-600 text-[10px] font-bold gap-1 transition shadow-2xs cursor-pointer"
                title="Take another photo"
              >
                <Camera size={18} />
                <span>+ Camera</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Selection & Controls */}
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
