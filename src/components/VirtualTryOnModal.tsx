import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, ImagePlus, LoaderCircle, RefreshCw, Sparkles, X } from 'lucide-react';

type TryOnMode = 'photo' | 'camera';

interface VirtualTryOnModalProps {
  open: boolean;
  onClose: () => void;
  productTitle: string;
  productImage: string;
  selectedColor?: string;
  selectedSize?: string;
}

async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Choose an image smaller than 12 MB.');

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const scale = Math.min(1, 1440 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not prepare this photo.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.84);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}


export const VirtualTryOnModal: React.FC<VirtualTryOnModalProps> = ({
  open,
  onClose,
  productTitle,
  productImage,
  selectedColor,
  selectedSize,
}) => {
  const [mode, setMode] = useState<TryOnMode>('photo');
  const [personImage, setPersonImage] = useState('');
  const [resultImage, setResultImage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setCameraStarting(false);
  };

  useEffect(() => {
    if (!open || mode !== 'camera') stopCamera();
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [open, mode]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setPersonImage('');
      setResultImage('');
      setError('');
      setProgress('');
      setIsGenerating(false);
      setMode('photo');
    }
  }, [open]);

  const startCamera = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is unavailable. Open AVEART over HTTPS and use a browser that supports camera access.');
      return;
    }
    setCameraStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1600 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (cameraError: any) {
      setError(cameraError?.name === 'NotAllowedError'
        ? 'Camera permission was not granted. Allow camera access in your browser settings and try again.'
        : 'The camera could not be started. Check that it is available and not being used by another app.');
    } finally {
      setCameraStarting(false);
    }
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError('');
    setResultImage('');
    try {
      setPersonImage(await compressImage(file));
    } catch (imageError: any) {
      setError(imageError?.message || 'The selected photo could not be read.');
    }
  };

  const captureCamera = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError('Wait until the camera image is visible, then capture again.');
      return;
    }
    const scale = Math.min(1, 1440 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) {
      setError('The camera image could not be captured.');
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPersonImage(canvas.toDataURL('image/jpeg', 0.84));
    setResultImage('');
    stopCamera();
  };

  const generateTryOn = async () => {
    if (!personImage || !productImage || isGenerating) return;
    setError('');
    setResultImage('');
    setIsGenerating(true);
    setProgress('Preparing your photo…');
    try {
      const response = await fetch('/api/virtual-try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImage,
          garmentImage: productImage.startsWith('data:image/') ? productImage : undefined,
          garmentImageUrl: productImage.startsWith('data:image/') ? undefined : productImage,
          productName: productTitle,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.image) {
        throw new Error(payload.error || 'The virtual fitting service is not ready yet.');
      }
      setResultImage(payload.image);
      setProgress('');
    } catch (generationError: any) {
      setError(generationError?.message || 'The virtual fitting could not be completed.');
      setProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="aveart-tryon-title">
      <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">AVEART fitting room</p>
            <h2 id="aveart-tryon-title" className="mt-1 text-2xl font-semibold text-black">Try it on</h2>
            <p className="mt-1 text-xs text-slate-500">{productTitle}{selectedColor ? ' · ' + selectedColor : ''}{selectedSize ? ' · ' + selectedSize : ''}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close virtual fitting room" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
          <div className="space-y-4 bg-[#F7F7F5] p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-white p-1">
              <button type="button" onClick={() => { stopCamera(); setMode('photo'); setError(''); }} className={'flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs font-bold transition ' + (mode === 'photo' ? 'bg-black text-white' : 'text-slate-600 hover:bg-slate-100')}>
                <ImagePlus className="h-4 w-4" /> Photo Try-On
              </button>
              <button type="button" onClick={() => { setMode('camera'); setPersonImage(''); setError(''); }} className={'flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs font-bold transition ' + (mode === 'camera' ? 'bg-black text-white' : 'text-slate-600 hover:bg-slate-100')}>
                <Camera className="h-4 w-4" /> Live Camera
              </button>
            </div>

            {mode === 'photo' && (
              <div className="space-y-3">
                {personImage ? (
                  <div className="relative mx-auto max-h-[48vh] overflow-hidden rounded-xl bg-white">
                    <img src={personImage} alt="Your selected photo" className="mx-auto max-h-[48vh] w-full object-contain" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-bold text-black shadow-lg">Change photo</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex min-h-[300px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-6 text-center hover:border-black">
                    <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-slate-100"><ImagePlus className="h-6 w-6 text-slate-700" /></span>
                    <span className="text-sm font-bold text-slate-900">Upload a full-body photo</span>
                    <span className="mt-2 max-w-xs text-xs leading-5 text-slate-500">Stand facing the camera, keep your full outfit visible and use clear, even lighting.</span>
                    <span className="mt-4 rounded-full bg-black px-5 py-2.5 text-xs font-bold text-white">Choose photo</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
              </div>
            )}

            {mode === 'camera' && (
              <div className="space-y-3">
                {personImage ? (
                  <div className="relative overflow-hidden rounded-xl bg-white">
                    <img src={personImage} alt="Captured camera photo" className="mx-auto max-h-[48vh] w-full object-contain" />
                    <button type="button" onClick={() => { setPersonImage(''); setResultImage(''); window.setTimeout(() => startCamera(), 120); }} className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-bold text-black shadow-lg">Retake photo</button>
                  </div>
                ) : (
                  <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-xl bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="max-h-[52vh] w-full object-contain" />
                    {!cameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
                        <Camera className="h-10 w-10" />
                        <p className="text-sm font-semibold">Use your camera to take a fitting photo</p>
                        <button type="button" disabled={cameraStarting} onClick={startCamera} className="rounded-full bg-white px-5 py-3 text-xs font-bold text-black disabled:opacity-50">{cameraStarting ? 'Opening camera…' : 'Open camera'}</button>
                      </div>
                    )}
                  </div>
                )}
                {cameraActive && !personImage && (
                  <button type="button" onClick={captureCamera} className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800">
                    <Camera className="h-4 w-4" /> Capture photo
                  </button>
                )}
                <p className="text-[11px] leading-5 text-slate-500">The camera preview is live. After capture, the AI creates the realistic clothing simulation.</p>
              </div>
            )}

            {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700">{error}</div>}
            {isGenerating && (
              <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 text-xs text-slate-700">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                <span>{progress}</span>
              </div>
            )}
            {personImage && !resultImage && !isGenerating && (
              <button type="button" onClick={generateTryOn} className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800">
                <Sparkles className="h-4 w-4" /> Generate my try-on
              </button>
            )}
            {resultImage && (
              <button type="button" onClick={generateTryOn} className="flex w-full items-center justify-center gap-2 rounded-xl border border-black px-5 py-3 text-xs font-bold uppercase tracking-wider text-black hover:bg-slate-100">
                <RefreshCw className="h-4 w-4" /> Generate another result
              </button>
            )}
          </div>

          <div className="space-y-5 p-4 sm:p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Selected piece</p>
              <div className="mt-3 flex gap-3">
                <img src={productImage} alt={productTitle} className="h-28 w-24 rounded-lg bg-slate-100 object-contain" />
                <div className="min-w-0 pt-1">
                  <p className="text-sm font-semibold text-slate-900">{productTitle}</p>
                  {selectedColor && <p className="mt-1 text-xs text-slate-500">Colour: {selectedColor}</p>}
                  {selectedSize && <p className="mt-1 text-xs text-slate-500">Size selected: {selectedSize}</p>}
                  <p className="mt-3 text-[11px] leading-5 text-slate-500">The selected colour's product photo is used as the garment reference.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Your result</p>
              {resultImage ? (
                <div className="mt-3 space-y-3">
                  <img src={resultImage} alt="AI virtual try-on result" className="max-h-[52vh] w-full rounded-xl bg-slate-100 object-contain" />
                  <div className="flex items-center gap-2 text-xs font-semibold text-green-700"><CheckCircle2 className="h-4 w-4" /> Your virtual fitting is ready</div>
                  <a href={resultImage} download="aveart-virtual-try-on.jpg" className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50">Save image</a>
                </div>
              ) : (
                <div className="mt-3 flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
                  <Sparkles className="h-7 w-7 text-slate-300" />
                  <p className="mt-3 text-xs font-semibold text-slate-500">Your fitting result will appear here</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-400">The AI preview is illustrative and does not guarantee the physical fit or exact size.</p>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-[10px] leading-5 text-slate-500">
              <strong className="text-slate-700">Privacy:</strong> Your photo is sent to Google's AI service to create this fitting. AVEART does not save it to your customer account. Close this window to clear the photo and result from this fitting session.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
