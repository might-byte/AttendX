import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  CheckCircle,
  AlertCircle,
  X,
  Shield,
  RefreshCw,
  Sparkles,
  Lock,
} from 'lucide-react';
import { UserProfile, FaceTemplate } from '../../types';
import {
  extractEmbeddingFromCanvas,
  computeAveragedEmbedding,
  compressCanvasToThumbnail,
} from '../../services/faceService';
import { getOrCreateDeviceId } from '../../services/deviceService';

interface FaceEnrollmentModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onEnrollmentComplete: (template: FaceTemplate, deviceId: string) => void;
}

type EnrollmentStep = 'consent' | 'capturing' | 'complete';

const POSE_INSTRUCTIONS = [
  { step: 1, title: 'Front Facing', subtitle: 'Look directly into the camera with a neutral expression' },
  { step: 2, title: 'Slightly Left', subtitle: 'Turn your head slightly to your left (~15°)' },
  { step: 3, title: 'Slightly Right', subtitle: 'Turn your head slightly to your right (~15°)' },
];

export const FaceEnrollmentModal: React.FC<FaceEnrollmentModalProps> = ({
  user,
  isOpen,
  onClose,
  onEnrollmentComplete,
}) => {
  const [step, setStep] = useState<EnrollmentStep>(user.biometricConsent ? 'capturing' : 'consent');
  const [consentGiven, setConsentGiven] = useState<boolean>(user.biometricConsent);
  const [currentPoseIdx, setCurrentPoseIdx] = useState<number>(0);
  const [capturedEmbeddings, setCapturedEmbeddings] = useState<number[][]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera when entering capturing step
  useEffect(() => {
    if (isOpen && step === 'capturing') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, step]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: unknown) {
      console.warn('Camera access issue:', err);
      setCameraError(
        'Unable to access camera. Please allow camera permissions, or use Simulated Photo for testing.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapturePhoto = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    if (videoRef.current && streamRef.current && ctx) {
      // Crop center square
      const vid = videoRef.current;
      const size = Math.min(vid.videoWidth || 320, vid.videoHeight || 320);
      const startX = ((vid.videoWidth || 320) - size) / 2;
      const startY = ((vid.videoHeight || 320) - size) / 2;

      ctx.drawImage(vid, startX, startY, size, size, 0, 0, 320, 320);
    } else {
      // Fallback synthetic face canvas for testing/no-hardware devices
      generateSimulatedFaceCanvas(canvas, currentPoseIdx);
    }

    const embedding = extractEmbeddingFromCanvas(canvas);
    const newEmbeddings = [...capturedEmbeddings, embedding];
    setCapturedEmbeddings(newEmbeddings);

    // Save first pose as compressed thumbnail
    if (currentPoseIdx === 0) {
      setThumbnailPreview(compressCanvasToThumbnail(canvas));
    }

    if (currentPoseIdx < POSE_INSTRUCTIONS.length - 1) {
      setCurrentPoseIdx(currentPoseIdx + 1);
      setIsProcessing(false);
    } else {
      // Completed all 3 samples! Compute average vector
      finishEnrollment(newEmbeddings);
    }
  };

  const generateSimulatedFaceCanvas = (canvas: HTMLCanvasElement, poseIndex: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 320, 320);

    // Draw face silhouette
    ctx.fillStyle = '#f8fafc';
    const offsetX = poseIndex === 1 ? -20 : poseIndex === 2 ? 20 : 0;
    ctx.beginPath();
    ctx.ellipse(160 + offsetX, 150, 60, 75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(140 + offsetX, 140, 7, 0, Math.PI * 2);
    ctx.arc(180 + offsetX, 140, 7, 0, Math.PI * 2);
    ctx.fill();

    // Smile/chin
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(160 + offsetX, 175, 25, 0.2, Math.PI - 0.2);
    ctx.stroke();
  };

  const finishEnrollment = (allEmbeddings: number[][]) => {
    const averagedEmbedding = computeAveragedEmbedding(allEmbeddings);
    const boundDeviceId = getOrCreateDeviceId();

    const template: FaceTemplate = {
      embedding: averagedEmbedding,
      photoPreviewUrl: thumbnailPreview,
      enrolledAt: new Date().toISOString(),
      sampleCount: allEmbeddings.length,
    };

    setIsProcessing(false);
    setStep('complete');
    stopCamera();
    onEnrollmentComplete(template, boundDeviceId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Biometric Face Enrollment
              </h2>
              <p className="text-xs text-slate-500">Student ID: {user.sid || user.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {step === 'consent' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-slate-700 dark:text-slate-300 text-xs leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300 text-sm">
                  <Shield className="w-4 h-4" />
                  Biometric Privacy & Consent Policy
                </div>
                <p>
                  In compliance with biometric privacy regulations (including GDPR and student data protection standards):
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                  <li>We <strong>do not store video recordings</strong> or uncompressed high-resolution photos.</li>
                  <li>Your face is converted into an encrypted 128-dimensional numeric embedding vector.</li>
                  <li>Biometric embeddings are used exclusively for verification in authorized class sessions.</li>
                  <li>Your account will be bound to this device to prevent proxy attendance.</li>
                  <li>You may delete your biometric template at any time from your profile.</li>
                </ul>
              </div>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  I give explicit consent for AttendX to process my biometric facial features and bind this device for class attendance verification.
                </span>
              </label>

              <button
                disabled={!consentGiven}
                onClick={() => setStep('capturing')}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm transition cursor-pointer shadow-sm"
              >
                Proceed to Camera Capture
              </button>
            </div>
          )}

          {step === 'capturing' && (
            <div className="space-y-4">
              {/* Step indicator */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Step {currentPoseIdx + 1} of 3
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {POSE_INSTRUCTIONS[currentPoseIdx].title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {POSE_INSTRUCTIONS[currentPoseIdx].subtitle}
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {POSE_INSTRUCTIONS.map((_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-2 rounded-full ${
                        i < currentPoseIdx
                          ? 'bg-emerald-500'
                          : i === currentPoseIdx
                          ? 'bg-blue-600'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Camera Frame with Oval Guide */}
              <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border-2 border-slate-200 dark:border-slate-700">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />

                {/* Face Alignment Oval Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-60 rounded-[50%] border-2 border-dashed border-blue-400/90 shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center">
                    <span className="text-[11px] text-white/80 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                      Align Face in Oval
                    </span>
                  </div>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-slate-900/90 p-4 flex flex-col items-center justify-center text-center text-white">
                    <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                    <p className="text-xs text-slate-200 mb-3">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-3 py-1.5 bg-blue-600 rounded-lg text-xs font-medium hover:bg-blue-700 cursor-pointer"
                    >
                      Retry Camera
                    </button>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleCapturePhoto}
                  disabled={isProcessing}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer transition"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  <span>
                    Capture Sample ({currentPoseIdx + 1}/3)
                  </span>
                </button>

                {cameraError && (
                  <button
                    onClick={handleCapturePhoto}
                    className="py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-200 cursor-pointer"
                  >
                    Use Test Sample
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Biometric Template Enrolled!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                3 pose samples were processed and averaged into a 128-dimensional biometric embedding. Your student account is now bound to this device.
              </p>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>Device Binding Signature: {getOrCreateDeviceId()}</span>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
