import React, { useState } from 'react';
import { UserPlus, Shield, X, CheckCircle2 } from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { saveUser, setCurrentUser } from '../../services/storageService';
import { getOrCreateDeviceId } from '../../services/deviceService';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [sid, setSid] = useState('');
  const [program, setProgram] = useState('Computer Science');
  const [biometricConsent, setBiometricConsent] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const deviceId = getOrCreateDeviceId();
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name,
      email,
      role,
      status: 'pending', // Requires admin approval!
      sid: sid || (role === 'student' ? `STU-${Math.floor(1000 + Math.random() * 9000)}` : `FAC-${Math.floor(100 + Math.random() * 900)}`),
      program,
      registeredDeviceId: deviceId,
      biometricConsent,
      biometricConsentDate: biometricConsent ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };

    saveUser(newUser);
    setCurrentUser(newUser);
    onSuccess(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                New User Registration
              </h3>
              <p className="text-xs text-slate-500">Sign up for AttendX portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Select Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-2 rounded-xl font-bold border transition cursor-pointer ${
                  role === 'student'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'border-slate-200 text-slate-600 dark:border-slate-700'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`py-2 rounded-xl font-bold border transition cursor-pointer ${
                  role === 'teacher'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'border-slate-200 text-slate-600 dark:border-slate-700'
                }`}
              >
                Teacher / Faculty
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Maya Patel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              University Email
            </label>
            <input
              type="email"
              required
              placeholder="e.g. maya.patel@student.university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {role === 'student' ? 'Student ID' : 'Faculty ID'}
              </label>
              <input
                type="text"
                placeholder="STU-2026-99"
                value={sid}
                onChange={(e) => setSid(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Program / Dept
              </label>
              <input
                type="text"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
            <input
              type="checkbox"
              checked={biometricConsent}
              onChange={(e) => setBiometricConsent(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
              I agree to biometric face verification and GPS location geofencing for attendance validation.
            </span>
          </label>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
            Note: New accounts are submitted with status: <strong>Pending</strong> and require approval from the administrator before attendance can be marked.
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
            >
              Register Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
