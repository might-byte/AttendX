import React from 'react';
import {
  X,
  User,
  ShieldCheck,
  Smartphone,
  Camera,
  Trash2,
  Lock,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { saveUser } from '../../services/storageService';
import { getOrCreateDeviceId } from '../../services/deviceService';

interface ProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onDataChange: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onDataChange,
}) => {
  if (!isOpen) return null;

  const currentDeviceId = getOrCreateDeviceId();
  const hasFace = !!user.faceTemplate?.embedding;

  const handleDeleteBiometric = () => {
    if (
      confirm(
        'Delete your face biometric template from this device? This will erase your 128-dimensional embedding and reference photo in accordance with biometric privacy rights.'
      )
    ) {
      const updated: UserProfile = {
        ...user,
        faceTemplate: undefined,
        biometricConsent: false,
      };
      saveUser(updated);
      onDataChange();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                User Profile &amp; Biometric Privacy
              </h3>
              <p className="text-xs text-slate-500 capitalize">{user.role} Account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Full Name</span>
            <span className="font-semibold text-slate-900 dark:text-white">{user.name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">ID / SID</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{user.sid || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Email</span>
            <span className="font-semibold text-slate-900 dark:text-white">{user.email}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Program / Dept</span>
            <span className="font-semibold text-slate-900 dark:text-white">{user.program || 'General'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Account Status</span>
            <span
              className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                user.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {user.status}
            </span>
          </div>
        </div>

        {/* Biometric & Device Binding Details */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-3 text-xs border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Biometric Security &amp; Device Binding</span>
          </div>

          <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                Face Biometrics:
              </span>
              <span className="font-semibold">
                {hasFace ? 'Enrolled (128-d Vector)' : 'Not Enrolled'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                Registered Device:
              </span>
              <span className="font-mono text-[10px]">
                {user.registeredDeviceId?.substring(0, 14) || 'Pending First Mark'}...
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Local Storage Encryption:
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                AES-GCM 256 Active
              </span>
            </div>
          </div>

          {hasFace && (
            <button
              onClick={handleDeleteBiometric}
              className="w-full mt-2 py-2 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Revoke &amp; Delete Biometric Data</span>
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs transition cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
