import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, ImagePlus, LoaderCircle, RefreshCw, Sparkles, X } from 'lucide-react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

type Mode = 'photo' | 'live';

interface VirtualFittingRoomProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  productImage: string;
  variantLabel?: string;
}

const MAX_IMAGE_EDGE = 1280;

function fileToOptimizedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const source = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(source);
        reject(new Error('Your browser could not prepare this image.'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(source);
      resolve(canvas.toDataURL('image/jpeg', 0.86));
    };
    image.onerror = () => {
      URL.revokeObjectURL(source);
      reject(new Error('The selected image could not be opened.'));
    };
    image.src = source;
  });
}

function remoteImageToDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Your browser could not prepare the product image.'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      try {
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch {
        reject(new Error('This product image cannot be securely read by the browser. Please try another product photo.'));
      }
    };
    image.onerror = () => reject(new Error('The product image could not be loaded for the fitting room.'));
    image.src = url;
  });
}

export const VirtualFittingRoom: React.FC<VirtualFittingRoomProps> = ({
  open, onClose, productName, productImage, variantLabel,
}) => {
  const [mode, setMode] = useState<Mode>('photo');
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState('');
  const [resultImage, setResultImage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [poseReady, setPoseReady] = useState(false);
  const [poseLoading, setPoseLoading] = useState(false);
  const [liveHint, setLiveHint] = useState('Position yourself in the centre of the frame.');
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const frameRef = useRef<number | null>(null);
  const garmentRef = useRef<HTMLImageElement | null>(null);
  const lastVideoTimeRef = useRef(-1);

  const stopCamera = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setPoseReady(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }
    return () => stopCamera();
  }, [open, stopCamera]);

  useEffect(() => {
    if (!open || !productImage) return;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => { garmentRef.current = image; };
    image.src = productImage;
    return () => { garmentRef.current = null; };
  }, [open, productImage]);

  const startCamera = async () => {
    setCameraError('');
    setError('');
    setPoseLoading(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is unavailable. Use a recent browser over HTTPS.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (!landmarkerRef.current) {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm',
        );
        landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
      }
      setCameraActive(true);
      setPoseReady(true);
      setLiveHint('Keep your shoulders and waist visible. The live overlay is an approximate visual preview.');
      const drawFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const landmarker = landmarkerRef.current;
        if (!video || !canvas || !landmarker || video.readyState < 2) {
          frameRef.current = requestAnimationFrame(drawFrame);
          return;
        }
        const width = video.videoWidth || 720;
        const height = video.videoHeight || 960;
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        const context = canvas.getContext('2d');
        if (!context) return;
        context.clearRect(0, 0, width, height);
        const now = performance.now();
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          const result = landmarker.detectForVideo(video, now);
          const landmarks = result.landmarks?.[0];
          if (landmarks && landmarks.length > 24) {
            const leftShoulder = landmarks[11];
            const rightShoulder = landmarks[12];
            const leftHip = landmarks[23];
            const rightHip = landmarks[24];
            const shoulderX = (1 - leftShoulder.x + 1 - rightShoulder.x) * 0.5 * width;
            const shoulderY = (leftShoulder.y + rightShoulder.y) * 0.5 * height;
            const hipY = (leftHip.y + rightHip.y) * 0.5 * height;
            const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x) * width;
            const torsoHeight = Math.max(80, hipY - shoulderY);
            const garmentWidth = Math.max(shoulderWidth * 2.2, torsoHeight * 1.05);
            const garmentHeight = Math.max(torsoHeight * 1.55, garmentWidth * 0.9);
            const angle = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x);
            const garment = garmentRef.current;
            if (garment && garment.complete) {
              context.save();
              context.translate(shoulderX, shoulderY + torsoHeight * 0.52);
              context.rotate(-angle);
              context.globalAlpha = 0.82;
              context.drawImage(garment, -garmentWidth / 2, -garmentHeight * 0.43, garmentWidth, garmentHeight);
              context.restore();
            }
          } else {
            setLiveHint('Step back slightly so your shoulders and waist are visible.');
          }
        }
        frameRef.current = requestAnimationFrame(drawFrame);
      };
      frameRef.current = requestAnimationFrame(drawFrame);
    } catch (err: any) {
      stopCamera();
      setCameraError(err?.message || 'The camera could not be started.');
    } finally {
      setPoseLoading(false);
    }
  };

  const generateTryOn = async () => {
    if (!personFile || !productImage) return;
    setGenerating(true);
    setError('');
    setResultImage('');
    try {
      const [personImage, garmentImage] = await Promise.all([
        fileToOptimizedDataUrl(personFile),
        remoteImageToDataUrl(productImage),
      ]);
      const response = await fetch('/api/virtual-try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personImage, garmentImage, productName }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'The virtual fitting could not be generated.');
      if (!payload?.image) throw new Error('The AI did not return a fitting image. Please try again.');
      setResultImage(payload.image);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong while creating your fitting.');
    } finally {
      setGenerating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="aveart-fitting-title">
      <div className="relative w-full max-w-5xl max-h-[94vh] overflow-y-auto bg-white text-slate-900 rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-5 sm:px-7 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-slate-500">AVEART / STYLE EDITION</p>
            <h2 id="aveart-fitting-title" className="text-xl sm:text-2xl font-semibold tracking-tight">Virtual Fitting Room</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close fitting room" className="w-10 h-10 rounded-full border border-slate-200 grid place-items-center hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 sm:px-7 pt-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{productName}</p>
              <p className="text-xs text-slate-500">{variantLabel || 'Selected product variant'}</p>
            </div>
            <div className="inline-flex p-1 rounded-full bg-slate-100 border border-slate-200 self-start">
              <button type="button" onClick={() => { setMode('photo'); stopCamera(); setError(''); }} className={`px-4 py-2 rounded-full text-xs font-bold transition ${mode === 'photo' ? 'bg-black text-white' : 'text-slate-600 hover:text-black'}`}>
                <span className="inline-flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> AI Photo</span>
              </button>
              <button type="button" onClick={() => { setMode('live'); setError(''); }} className={`px-4 py-2 rounded-full text-xs font-bold transition ${mode === 'live' ? 'bg-black text-white' : 'text-slate-600 hover:text-black'}`}>
                <span className="inline-flex items-center gap-2"><Camera className="w-3.5 h-3.5" /> Live Camera</span>
              </button>
            </div>
          </div>
        </div>

        {mode === 'photo' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 sm:p-7">
            <div className="space-y-3">
              <div className="aspect-[3/4] bg-slate-100 border border-slate-200 rounded-xl overflow-hidden grid place-items-center">
                {personPreview ? <img src={personPreview} alt="Your selected photo" className="w-full h-full object-contain" /> : (
                  <div className="text-center px-8 space-y-3 text-slate-500">
                    <ImagePlus className="w-8 h-8 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">Add a full-body photo</p>
                    <p className="text-xs">Use a clear, front-facing photo with good lighting and your full outfit visible.</p>
                  </div>
                )}
              </div>
              <label className="flex items-center justify-center gap-2 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold cursor-pointer hover:bg-slate-50">
                <ImagePlus className="w-4 h-4" /> Choose your photo
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > 12 * 1024 * 1024) { setError('Please choose a photo smaller than 12 MB.'); return; }
                  setPersonFile(file);
                  setResultImage('');
                  setError('');
                  try { setPersonPreview(await fileToOptimizedDataUrl(file)); } catch (err: any) { setError(err.message); }
                }} />
              </label>
            </div>
            <div className="space-y-3">
              <div className="aspect-[3/4] bg-slate-100 border border-slate-200 rounded-xl overflow-hidden grid place-items-center">
                {resultImage ? <img src={resultImage} alt="AI virtual fitting result" className="w-full h-full object-contain" /> : (
                  <div className="text-center px-8 space-y-3 text-slate-500">
                    <Sparkles className="w-8 h-8 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">Your fitting preview</p>
                    <p className="text-xs">Your photo and the selected AVEART product will be combined here.</p>
                  </div>
                )}
              </div>
              <button type="button" onClick={generateTryOn} disabled={!personFile || generating} className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-xl px-5 py-3.5 text-sm font-bold disabled:opacity-40 hover:bg-slate-800 transition">
                {generating ? <><LoaderCircle className="w-4 h-4 animate-spin" /> Creating your preview…</> : <><Sparkles className="w-4 h-4" /> Generate virtual fitting</>}
              </button>
              <p className="text-[11px] leading-relaxed text-slate-500">AI previews are visual simulations and do not guarantee garment fit, fabric feel or exact sizing.</p>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-7 grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6">
            <div className="relative aspect-[3/4] max-h-[65vh] bg-slate-950 rounded-xl overflow-hidden">
              <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-8 gap-3">
                  <Camera className="w-10 h-10" />
                  <p className="font-semibold">Live fitting preview</p>
                  <p className="text-xs text-white/70">Allow camera access to see a tracked clothing overlay.</p>
                </div>
              )}
              {cameraActive && <div className="absolute bottom-3 left-3 right-3 text-center text-[11px] text-white bg-black/50 rounded-full py-2 px-3">{liveHint}</div>}
            </div>
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <p className="font-semibold text-sm">Live camera</p>
                <p className="text-xs text-slate-500 leading-relaxed">Your camera stays in this browser. Pose tracking runs on your device; the live video is not uploaded.</p>
                <button type="button" onClick={cameraActive ? stopCamera : startCamera} disabled={poseLoading} className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-40">
                  {poseLoading ? <><LoaderCircle className="w-4 h-4 animate-spin" /> Starting camera…</> : cameraActive ? <><CameraOff className="w-4 h-4" /> Stop camera</> : <><Camera className="w-4 h-4" /> Start camera</>}
                </button>
                {poseReady && <p className="text-[11px] text-emerald-700">Body tracking active</p>}
                {cameraError && <p className="text-xs text-rose-700">{cameraError}</p>}
              </div>
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <p className="font-semibold text-sm">Selected garment</p>
                <img src={productImage} alt={productName} className="w-24 h-28 object-contain bg-slate-50 rounded-lg border border-slate-100" />
                <p className="text-xs text-slate-500">The live overlay follows your shoulder and torso position. It is an approximate preview, not a size or fit measurement.</p>
              </div>
              <button type="button" onClick={() => { stopCamera(); setMode('photo'); }} className="w-full flex items-center justify-center gap-2 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-slate-50">
                <RefreshCw className="w-4 h-4" /> Switch to AI photo fitting
              </button>
            </div>
          </div>
        )}

        {error && <div role="alert" className="mx-5 sm:mx-7 mb-5 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800">{error}</div>}
        <div className="border-t border-slate-200 px-5 sm:px-7 py-4 text-[11px] text-slate-500 leading-relaxed">
          Privacy: your uploaded photo is processed only to create the fitting result and is not saved by AVEART. Live camera video is processed on your device and is not sent to AVEART.
        </div>
      </div>
    </div>
  );
};
