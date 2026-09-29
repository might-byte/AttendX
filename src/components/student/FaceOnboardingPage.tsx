import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  Video,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { UserProfile, FaceTemplate } from '../../types';

interface FaceOnboardingPageProps {
  student: UserProfile;
  onComplete: (template: FaceTemplate) => void;
  onCancel?: () => void;
}

export const FaceOnboardingPage: React.FC<FaceOnboardingPageProps> = ({
  student,
  onComplete,
  onCancel,
}) => {
  const [method, setMethod] = useState<'photos' | 'live_video'>('photos');
  const [photos, setPhotos] = useState<{ [key: string]: string }>({
    front: '',
    left: '',
    right: '',
  });
  const [activePose, setActivePose] = useState<'front' | 'left' | 'right'>('front');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [cameraActive, method]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError('Camera access unavailable. You can upload photos directly.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const captureFrameFromCamera = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (videoRef.current && ctx) {
      const vid = videoRef.current;
      const size = Math.min(vid.videoWidth || 320, vid.videoHeight || 320);
      const startX = ((vid.videoWidth || 320) - size) / 2;
      const startY = ((vid.videoHeight || 320) - size) / 2;
      ctx.drawImage(vid, startX, startY, size, size, 0, 0, 320, 320);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    if (ctx) {
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(0, 0, 320, 320);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(160, 160, 60, 0, Math.PI * 2);
      ctx.fill();
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    return '';
  };

  const handleTakePosePhoto = () => {
    const dataUrl = captureFrameFromCamera();
    if (!dataUrl) return;

    setPhotos((prev) => ({ ...prev, [activePose]: dataUrl }));

    if (activePose === 'front') {
      setActivePose('left');
    } else if (activePose === 'left') {
      setActivePose('right');
    } else {
      setCameraActive(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotos((prev) => ({ ...prev, [activePose]: result }));
      if (activePose === 'front') setActivePose('left');
      else if (activePose === 'left') setActivePose('right');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleLiveVerificationPass = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const snapshot = captureFrameFromCamera();
      setIsProcessing(false);
      stopCamera();

      const template: FaceTemplate = {
        submissionType: 'live_video',
        photoPreviewUrl: snapshot,
        images: [snapshot],
        sampleCount: 1,
        enrolledAt: new Date().toISOString(),
        embedding: new Array(128).fill(0).map((_, i) => Math.sin(i * 0.2) * 0.1),
      };
      onComplete(template);
    }, 1200);
  };

  const handleSubmit3Photos = () => {
    if (!photos.front || !photos.left || !photos.right) return;
    setIsProcessing(true);

    const images = [photos.front, photos.left, photos.right];
    const template: FaceTemplate = {
      submissionType: 'photos',
      photoPreviewUrl: photos.front,
      images,
      sampleCount: 3,
      enrolledAt: new Date().toISOString(),
      embedding: new Array(128).fill(0).map((_, i) => Math.cos(i * 0.18) * 0.1),
    };

    setTimeout(() => {
      setIsProcessing(false);
      onComplete(template);
    }, 600);
  };

  const all3PhotosUploaded = !!(photos.front && photos.left && photos.right);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 flex flex-col justify-between max-w-md mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
            Step 2 of 2
          </span>
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Face Verification Setup
          </h1>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="my-auto py-4 space-y-4">
        {/* Method Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMethod('photos');
              setCameraActive(false);
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              method === 'photos'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                : 'text-zinc-500'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Submit 3 Images</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod('live_video');
              setCameraActive(true);
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              method === 'live_video'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                : 'text-zinc-500'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Live Video Scan</span>
          </button>
        </div>

        {/* Method A: Submit 3 Images */}
        {method === 'photos' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Provide 3 clear photos of your face from different angles for attendance verification.
            </p>

            {/* 3 Photo Boxes */}
            <div className="grid grid-cols-3 gap-2.5">
              {(['front', 'left', 'right'] as const).map((pose) => {
                const label =
                  pose === 'front' ? '1. Front' : pose === 'left' ? '2. Left' : '3. Right';
                const img = photos[pose];
                const isCurrent = activePose === pose;

                return (
                  <div
                    key={pose}
                    onClick={() => setActivePose(pose)}
                    className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-1.5 cursor-pointer relative overflow-hidden transition ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                        : img
                        ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40'
                        : 'border-dashed border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {img ? (
                      <>
                        <img
                          src={img}
                          alt={label}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center space-y-1">
                        <Camera className="w-4 h-4 mx-auto text-zinc-400" />
                        <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 block">
                          {label}
                        </span>
                      </div>
                    )}
                    <span className="absolute bottom-1 text-[9px] bg-black/60 text-white px-1 rounded">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Camera View or Trigger */}
            {cameraActive ? (
              <div className="space-y-2">
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-300 dark:border-zinc-700">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                    Capturing: <strong className="capitalize">{activePose}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCameraActive(false)}
                    className="h-11 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleTakePosePhoto}
                    className="h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Snap Photo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCameraActive(true)}
                  className="h-11 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>Camera for {activePose.toUpperCase()}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-11 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1.5 transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload File</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}

            <button
              type="button"
              disabled={!all3PhotosUploaded || isProcessing}
              onClick={handleSubmit3Photos}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Complete & Submit for Approval</span>
            </button>
          </div>
        )}

        {/* Method B: Live Video Check */}
        {method === 'live_video' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Center your face in the oval guide and tap confirm.
            </p>

            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-40 h-52 rounded-[50%] border-2 border-dashed border-blue-400/90 flex items-center justify-center">
                  <span className="text-[10px] text-white/80 bg-black/50 px-2 py-0.5 rounded">
                    Position Face
                  </span>
                </div>
              </div>

              {cameraError && (
                <div className="absolute inset-0 bg-zinc-900/90 p-4 flex flex-col items-center justify-center text-center text-white text-xs">
                  <AlertCircle className="w-6 h-6 text-amber-400 mb-2" />
                  <p>{cameraError}</p>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleLiveVerificationPass}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Verify & Submit Profile</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="text-center text-[11px] text-zinc-400">
        Face data is stored locally for attendance check comparison
      </div>
    </div>
  );
};
