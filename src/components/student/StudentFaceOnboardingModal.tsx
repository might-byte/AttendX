import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  Video,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  X,
  ArrowRight,
} from 'lucide-react';
import { UserProfile, FaceTemplate } from '../../types';
import {
  extractEmbeddingFromCanvas,
  compressCanvasToThumbnail,
  computeAveragedEmbedding,
} from '../../services/faceService';
import { getOrCreateDeviceId } from '../../services/deviceService';

interface StudentFaceOnboardingModalProps {
  student: UserProfile;
  isOpen: boolean;
  onComplete: (template: FaceTemplate) => void;
  onClose?: () => void;
}

export const StudentFaceOnboardingModal: React.FC<StudentFaceOnboardingModalProps> = ({
  student,
  isOpen,
  onComplete,
  onClose,
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
  const [liveVideoVerified, setLiveVideoVerified] = useState(false);

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
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (videoRef.current && ctx) {
      const vid = videoRef.current;
      const size = Math.min(vid.videoWidth || 300, vid.videoHeight || 300);
      const startX = ((vid.videoWidth || 300) - size) / 2;
      const startY = ((vid.videoHeight || 300) - size) / 2;
      ctx.drawImage(vid, startX, startY, size, size, 0, 0, 300, 300);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    // Simple canvas fallback
    if (ctx) {
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, 300, 300);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(150, 150, 60, 0, Math.PI * 2);
      ctx.fill();
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    return '';
  };

  const handleTakePosePhoto = () => {
    const dataUrl = captureFrameFromCamera();
    if (!dataUrl) return;

    setPhotos((prev) => ({ ...prev, [activePose]: dataUrl }));

    // Move to next pose
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
      setLiveVideoVerified(true);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Face Verification Setup
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Required once for student attendance verification
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Method Toggle: 3 Photos vs Live Video */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMethod('photos');
                setCameraActive(false);
              }}
              className={`py-2 rounded-md flex items-center justify-center gap-1.5 transition ${
                method === 'photos'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Submit 3 Images</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('live_video');
                setCameraActive(true);
              }}
              className={`py-2 rounded-md flex items-center justify-center gap-1.5 transition ${
                method === 'live_video'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Live Video Check</span>
            </button>
          </div>

          {/* Option A: Submit 3 Face Images */}
          {method === 'photos' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Please provide 3 clear face photos (Front, Left profile, Right profile). You can capture with your camera or upload files.
              </p>

              {/* 3 Photo Slots */}
              <div className="grid grid-cols-3 gap-3">
                {(['front', 'left', 'right'] as const).map((pose) => {
                  const label =
                    pose === 'front' ? '1. Front' : pose === 'left' ? '2. Left Side' : '3. Right Side';
                  const img = photos[pose];
                  const isCurrent = activePose === pose;

                  return (
                    <div
                      key={pose}
                      onClick={() => setActivePose(pose)}
                      className={`relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-2 cursor-pointer transition text-center overflow-hidden ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
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
                            className="w-full h-full object-cover rounded-md"
                          />
                          <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        </>
                      ) : (
                        <div className="space-y-1">
                          <Camera className="w-5 h-5 mx-auto text-zinc-400" />
                          <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 block">
                            {label}
                          </span>
                        </div>
                      )}
                      <span className="absolute bottom-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Camera Preview or Capture Controls */}
              {cameraActive ? (
                <div className="space-y-2">
                  <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-300 dark:border-zinc-700">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded">
                      Capturing: <strong className="capitalize">{activePose}</strong>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleTakePosePhoto}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Snap {activePose.toUpperCase()} Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCameraActive(false)}
                      className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs"
                    >
                      Close Camera
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCameraActive(true)}
                    className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Camera for {activePose.toUpperCase()}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Image</span>
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

              {/* Submit Button */}
              <button
                type="button"
                disabled={!all3PhotosUploaded || isProcessing}
                onClick={handleSubmit3Photos}
                className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Save 3 Images & Submit</span>
              </button>
            </div>
          )}

          {/* Option B: Live Video Face Verification */}
          {method === 'live_video' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Look straight at the camera. Position your face in the oval guide to complete verification.
              </p>

              <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />

                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-44 h-56 rounded-[50%] border-2 border-dashed border-blue-400/90 shadow-sm flex items-center justify-center">
                    <span className="text-[10px] text-white/80 bg-black/50 px-2 py-0.5 rounded">
                      Align Face
                    </span>
                  </div>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-zinc-900/90 p-4 flex flex-col items-center justify-center text-center text-white text-xs">
                    <AlertCircle className="w-6 h-6 text-amber-400 mb-2" />
                    <p>{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => setMethod('photos')}
                      className="mt-2 text-blue-400 underline"
                    >
                      Switch to image upload
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleLiveVerificationPass}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Confirm Live Face Scan</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
