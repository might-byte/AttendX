import React, { useState } from 'react';
import { User, X, CheckCircle2, LogIn, UserPlus } from 'lucide-react';
import { UserProfile } from '../../types';
import { saveUser, setCurrentUser, getUsers } from '../../services/storageService';
import { getOrCreateDeviceId } from '../../services/deviceService';

interface StudentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile, isNewSignup: boolean) => void;
}

export const StudentAuthModal: React.FC<StudentAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');

  // Signup form fields
  const [name, setName] = useState('');
  const [sid, setSid] = useState('');
  const [email, setEmail] = useState('');
  const [program, setProgram] = useState('Computer Science');

  // Login selection
  const existingUsers = getUsers().filter((u) => u.role === 'student');
  const [selectedUserId, setSelectedUserId] = useState(existingUsers[0]?.id || '');

  if (!isOpen) return null;

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sid.trim() || !email.trim() || !program.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    const deviceId = getOrCreateDeviceId();
    const newUser: UserProfile = {
      id: `stu_${Date.now()}`,
      name: name.trim(),
      sid: sid.trim(),
      email: email.trim(),
      program: program.trim(),
      role: 'student',
      status: 'pending', // Requires admin approval!
      registeredDeviceId: deviceId,
      biometricConsent: true,
      biometricConsentDate: new Date().toISOString(),
      faceSubmitted: false, // Needs to complete face onboarding
      createdAt: new Date().toISOString(),
    };

    saveUser(newUser);
    setCurrentUser(newUser);
    onAuthSuccess(newUser, true);
    onClose();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = existingUsers.find((u) => u.id === selectedUserId);
    if (!user) return;

    setCurrentUser(user);
    onAuthSuccess(user, false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {mode === 'signup' ? 'Student Registration' : 'Student Sign In'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch between signup and login */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition ${
              mode === 'signup'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
                : 'text-zinc-500'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition ${
              mode === 'login'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
                : 'text-zinc-500'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>

        {mode === 'signup' ? (
          <form onSubmit={handleSignup} className="space-y-3 text-xs">
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jordan Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                Student ID (SID) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. STU-2026-92"
                value={sid}
                onChange={(e) => setSid(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                University Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="jordan.chen@student.university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                Program / Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Computer Science (B.S.)"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <p className="text-[11px] text-zinc-500">
              After signing up, you will submit face photos or complete live video check. An admin must then approve your profile before your dashboard is unlocked.
            </p>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition cursor-pointer"
            >
              Continue to Face Verification
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3 text-xs">
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                Select Student Profile
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
              >
                {existingUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.sid || u.id}) - {u.status}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white rounded-lg font-semibold transition cursor-pointer"
            >
              Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
