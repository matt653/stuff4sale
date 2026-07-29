import React, { useState, useRef, useEffect } from "react";
import { 
  X, Check, Crop, Type, EyeOff, RotateCw, Sun, Sliders, 
  Sparkles, Undo, Download, Trash2, ArrowLeft, Layers
} from "lucide-react";

interface PhotoEditorModalProps {
  photoUrl: string;
  onSave: (editedPhotoUrl: string) => void;
  onClose: () => void;
}

export default function PhotoEditorModal({ photoUrl, onSave, onClose }: PhotoEditorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<"adjust" | "crop" | "text" | "blur">("adjust");

  // Adjustment states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270

  // Text Overlay states
  const [overlayText, setOverlayText] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [bgColor, setBgColor] = useState("#000000");
  const [textPosition, setTextPosition] = useState<"top" | "center" | "bottom">("bottom");
  const [textBanner, setTextBanner] = useState(true);

  // Blur Box states
  const [blurBoxes, setBlurBoxes] = useState<Array<{ x: number; y: number; width: number; height: number }>>([]);
  const [isDrawingBlur, setIsDrawingBlur] = useState(false);
  const [blurStart, setBlurStart] = useState<{ x: number; y: number } | null>(null);
  const [currentBlurBox, setCurrentBlurBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Crop states
  const [cropAspectRatio, setCropAspectRatio] = useState<"free" | "1:1" | "4:3" | "16:9">("1:1");
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Load image object
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImageObj(img);
    };
    img.src = photoUrl;
  }, [photoUrl]);

  // Draw canvas whenever adjustments change
  useEffect(() => {
    if (!imageObj || !canvasRef.current) return;
    renderCanvas();
  }, [imageObj, brightness, contrast, saturation, rotation, overlayText, textColor, bgColor, textPosition, textBanner, blurBoxes, currentBlurBox, cropBox]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle rotation dimensions
    const isRotatedQuarter = rotation === 90 || rotation === 270;
    const origWidth = imageObj.naturalWidth || imageObj.width;
    const origHeight = imageObj.naturalHeight || imageObj.height;

    canvas.width = isRotatedQuarter ? origHeight : origWidth;
    canvas.height = isRotatedQuarter ? origWidth : origHeight;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply CSS filters for brightness, contrast, saturation
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    // Rotate around center
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(imageObj, -origWidth / 2, -origHeight / 2, origWidth, origHeight);
    ctx.restore();

    // Reset filter for overlays
    ctx.filter = "none";

    // Draw Blur Privacy Boxes
    const allBlurBoxes = [...blurBoxes, ...(currentBlurBox ? [currentBlurBox] : [])];
    allBlurBoxes.forEach((box) => {
      ctx.save();
      // Apply pixelated blur effect to box area
      const imageData = ctx.getImageData(box.x, box.y, box.width, box.height);
      const data = imageData.data;
      const pixelSize = 12;

      for (let y = 0; y < box.height; y += pixelSize) {
        for (let x = 0; x < box.width; x += pixelSize) {
          const redIndex = (y * box.width + x) * 4;
          const r = data[redIndex];
          const g = data[redIndex + 1];
          const b = data[redIndex + 2];

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(box.x + x, box.y + y, pixelSize, pixelSize);
        }
      }
      ctx.restore();
    });

    // Draw Text Overlay
    if (overlayText.trim()) {
      ctx.save();
      const fontSize = Math.max(24, Math.round(canvas.width * 0.05));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = "center";

      let textY = canvas.height * 0.9; // bottom default
      if (textPosition === "top") textY = canvas.height * 0.15;
      if (textPosition === "center") textY = canvas.height * 0.5;

      const padding = fontSize * 0.6;
      const textMetrics = ctx.measureText(overlayText.toUpperCase());
      const textWidth = textMetrics.width;

      if (textBanner) {
        // Draw banner bar across canvas
        ctx.fillStyle = bgColor;
        ctx.globalAlpha = 0.75;
        ctx.fillRect(0, textY - fontSize, canvas.width, fontSize + padding * 1.2);
        ctx.globalAlpha = 1.0;
      }

      ctx.fillStyle = textColor;
      ctx.fillText(overlayText.toUpperCase(), canvas.width / 2, textY);
      ctx.restore();
    }
  };

  // Handle Mouse / Touch for Blur Box drawing
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab !== "blur") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const startX = (e.clientX - rect.left) * scaleX;
    const startY = (e.clientY - rect.top) * scaleY;

    setIsDrawingBlur(true);
    setBlurStart({ x: startX, y: startY });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingBlur || !blurStart || activeTab !== "blur") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    setCurrentBlurBox({
      x: Math.min(blurStart.x, currentX),
      y: Math.min(blurStart.y, currentY),
      width: Math.abs(currentX - blurStart.x),
      height: Math.abs(currentY - blurStart.y),
    });
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawingBlur || activeTab !== "blur") return;
    setIsDrawingBlur(false);
    if (currentBlurBox && currentBlurBox.width > 5 && currentBlurBox.height > 5) {
      setBlurBoxes([...blurBoxes, currentBlurBox]);
    }
    setCurrentBlurBox(null);
    setBlurStart(null);
  };

  // Apply Crop
  const handleApplyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cropW = canvas.width;
    let cropH = canvas.height;
    let cropX = 0;
    let cropY = 0;

    if (cropAspectRatio === "1:1") {
      const minDim = Math.min(canvas.width, canvas.height);
      cropW = minDim;
      cropH = minDim;
      cropX = (canvas.width - minDim) / 2;
      cropY = (canvas.height - minDim) / 2;
    } else if (cropAspectRatio === "4:3") {
      if (canvas.width / canvas.height > 4 / 3) {
        cropH = canvas.height;
        cropW = cropH * (4 / 3);
        cropX = (canvas.width - cropW) / 2;
      } else {
        cropW = canvas.width;
        cropH = cropW * (3 / 4);
        cropY = (canvas.height - cropH) / 2;
      }
    } else if (cropAspectRatio === "16:9") {
      if (canvas.width / canvas.height > 16 / 9) {
        cropH = canvas.height;
        cropW = cropH * (16 / 9);
        cropX = (canvas.width - cropW) / 2;
      } else {
        cropW = canvas.width;
        cropH = cropW * (9 / 16);
        cropY = (canvas.height - cropH) / 2;
      }
    }

    const croppedData = ctx.getImageData(cropX, cropY, cropW, cropH);
    canvas.width = cropW;
    canvas.height = cropH;
    ctx.putImageData(croppedData, 0, 0);

    // Load cropped canvas back as imageObj so further edits apply on top
    const newImg = new Image();
    newImg.onload = () => {
      setImageObj(newImg);
      setRotation(0);
    };
    newImg.src = canvas.toDataURL("image/jpeg", 0.85);
  };

  // Save Final Edited Base64 Photo
  const handleSaveFinal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const finalDataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onSave(finalDataUrl);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto" id="photo-editor-modal">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full text-white shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Crop size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100">Photo Studio & Editor</h3>
              <p className="text-[10px] text-slate-400">Crop, enhance, add text overlays & blur background details</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              id="btn-cancel-photo-editor"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveFinal}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              id="btn-save-photo-editor"
            >
              <Check size={14} />
              Save Photo
            </button>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-0 min-h-[350px]">
          
          {/* Canvas Display Viewport */}
          <div className="lg:col-span-2 bg-slate-950 p-4 flex items-center justify-center relative overflow-hidden select-none min-h-[300px]">
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              className={`max-w-full max-h-[60vh] object-contain rounded-xl shadow-2xl border border-slate-800 ${
                activeTab === "blur" ? "cursor-crosshair" : "cursor-default"
              }`}
              id="photo-editor-canvas"
            />

            {activeTab === "blur" && (
              <div className="absolute top-3 left-3 bg-amber-500/90 text-slate-950 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                <EyeOff size={12} />
                Click & drag to draw blur box over private info
              </div>
            )}
          </div>

          {/* Tools Panel */}
          <div className="bg-slate-900/90 border-l border-slate-800 p-4 flex flex-col justify-between space-y-4 overflow-y-auto max-h-[60vh] lg:max-h-full">
            
            {/* Tool Category Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("adjust")}
                className={`py-2 rounded-lg flex flex-col items-center gap-1 transition ${
                  activeTab === "adjust" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
                }`}
                id="tab-photo-adjust"
              >
                <Sliders size={14} />
                <span>Adjust</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("crop")}
                className={`py-2 rounded-lg flex flex-col items-center gap-1 transition ${
                  activeTab === "crop" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
                }`}
                id="tab-photo-crop"
              >
                <Crop size={14} />
                <span>Crop</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("text")}
                className={`py-2 rounded-lg flex flex-col items-center gap-1 transition ${
                  activeTab === "text" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
                }`}
                id="tab-photo-text"
              >
                <Type size={14} />
                <span>Text</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("blur")}
                className={`py-2 rounded-lg flex flex-col items-center gap-1 transition ${
                  activeTab === "blur" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
                }`}
                id="tab-photo-blur"
              >
                <EyeOff size={14} />
                <span>Blur</span>
              </button>
            </div>

            {/* TAB CONTENTS */}

            {/* ADJUST TAB */}
            {activeTab === "adjust" && (
              <div className="space-y-4 text-xs">
                {/* Rotate Controls */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Rotation</label>
                  <button
                    type="button"
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition"
                    id="btn-rotate-photo"
                  >
                    <RotateCw size={14} />
                    Rotate 90° ({rotation}°)
                  </button>
                </div>

                {/* Brightness */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-300">
                    <span>Brightness</span>
                    <span className="text-indigo-400">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                    id="slider-brightness"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-300">
                    <span>Contrast</span>
                    <span className="text-indigo-400">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                    id="slider-contrast"
                  />
                </div>

                {/* Saturation */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-300">
                    <span>Color Saturation</span>
                    <span className="text-indigo-400">{saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                    id="slider-saturation"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBrightness(100);
                    setContrast(100);
                    setSaturation(100);
                    setRotation(0);
                  }}
                  className="w-full py-2 bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl border border-slate-800 transition flex items-center justify-center gap-1.5"
                  id="btn-reset-adjustments"
                >
                  <Undo size={12} /> Reset Adjustments
                </button>
              </div>
            )}

            {/* CROP TAB */}
            {activeTab === "crop" && (
              <div className="space-y-4 text-xs">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "1:1 Square", val: "1:1" },
                    { label: "4:3 Standard", val: "4:3" },
                    { label: "16:9 Wide", val: "16:9" },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setCropAspectRatio(preset.val as any)}
                      className={`py-2 px-2 rounded-xl border font-bold text-xs transition ${
                        cropAspectRatio === preset.val
                          ? "bg-indigo-600 border-indigo-400 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                      id={`btn-crop-preset-${preset.val}`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  id="btn-apply-crop"
                >
                  <Crop size={14} /> Apply Crop Ratio ({cropAspectRatio})
                </button>
              </div>
            )}

            {/* TEXT OVERLAY TAB */}
            {activeTab === "text" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Overlay Banner Text</label>
                  <input
                    type="text"
                    placeholder="e.g. LOCAL PICKUP ONLY, $50 FIRM..."
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    className="w-full text-xs border border-slate-700 bg-slate-950 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    id="input-overlay-text"
                  />
                </div>

                {/* Quick Preset Badges */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Quick Presets:</label>
                  <div className="flex flex-wrap gap-1">
                    {["LOCAL PICKUP ONLY", "$50 FIRM", "RARE VINTAGE", "TESTED & WORKS", "BUNDLE DEAL"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setOverlayText(preset)}
                        className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 px-2 py-1 rounded-lg border border-slate-700"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Position */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Text Position</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["top", "center", "bottom"] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setTextPosition(pos)}
                        className={`py-1.5 capitalize font-bold text-xs rounded-lg border ${
                          textPosition === pos ? "bg-indigo-600 border-indigo-400 text-white" : "bg-slate-800 border-slate-700 text-slate-300"
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Text Color</label>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-full h-8 bg-slate-950 border border-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Banner Background</label>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full h-8 bg-slate-950 border border-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={textBanner}
                    onChange={(e) => setTextBanner(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>Show solid banner bar behind text</span>
                </label>
              </div>
            )}

            {/* BLUR TAB */}
            {activeTab === "blur" && (
              <div className="space-y-3 text-xs">
                <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                  🔒 Drag your mouse or finger over the canvas to draw pixelated privacy blur boxes over license plates, address numbers, or personal background details.
                </p>

                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>Active Blur Boxes:</span>
                  <span className="text-indigo-400">{blurBoxes.length}</span>
                </div>

                {blurBoxes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setBlurBoxes([])}
                    className="w-full py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-bold rounded-xl border border-rose-800 transition flex items-center justify-center gap-1.5"
                    id="btn-clear-blurs"
                  >
                    <Trash2 size={12} /> Clear All Blur Boxes
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
