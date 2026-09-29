import React, { useState } from 'react';
import {
  UserPlus,
  LogIn,
  Sun,
  Moon,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { saveUser, setCurrentUser, getUsers } from '../../services/storageService';
import { getOrCreateDeviceId } from '../../services/deviceService';
import { Theme } from '../../hooks/useTheme';

interface AuthPageProps {
  theme: Theme;
  onToggleTheme: () => void;
  onAuthSuccess: (user: UserProfile, isNewSignup: boolean) => void;
  onSelectRole: (role: 'teacher' | 'admin') => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  theme,
  onToggleTheme,
  onAuthSuccess,
  onSelectRole,
}) => {
  const [tab, setTab] = useState<'signup' | 'login'>('signup');

  // Signup fields
  const [name, setName] = useState('');
  const [sid, setSid] = useState('');
  const [email, setEmail] = useState('');
  const [program, setProgram] = useState('Computer Science');

  // Login
  const registeredStudents = getUsers().filter((u) => u.role === 'student');
  const [selectedStudentId, setSelectedStudentId] = useState(
    registeredStudents[0]?.id || ''
  );

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
      status: 'pending', // Requires admin approval
      registeredDeviceId: deviceId,
      biometricConsent: true,
      biometricConsentDate: new Date().toISOString(),
      faceSubmitted: false, // Needs to complete face onboarding
      createdAt: new Date().toISOString(),
    };

    saveUser(newUser);
    setCurrentUser(newUser);
    onAuthSuccess(newUser, true);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = registeredStudents.find((u) => u.id === selectedStudentId);
    if (!user) return;

    setCurrentUser(user);
    onAuthSuccess(user, false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between p-4 sm:p-6 transition-colors">
      {/* Top Mobile Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              AttendX
            </div>
            <div className="text-[10px] text-zinc-400">Mobile Attendance</div>
          </div>
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-zinc-700" />
          ) : (
            <Sun className="w-4 h-4 text-zinc-300" />
          )}
        </button>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-sm mx-auto my-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-5">
        <div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {tab === 'signup' ? 'Student Registration' : 'Student Sign In'}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {tab === 'signup'
              ? 'Enter your details to create your mobile student profile'
              : 'Sign in to access your classes and attendance'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('signup')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              tab === 'signup'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              tab === 'login'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>

        {/* Form */}
        {tab === 'signup' ? (
          <form onSubmit={handleSignup} className="space-y-3.5 text-xs">
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
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                Program / Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Computer Science"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed pt-1">
              Next step: Submit 3 face photos or live video verification. An administrator will review your account before dashboard access.
            </p>

            <button
              type="submit"
              className="w-full h-12 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition"
            >
              <span>Continue to Face Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                Select Your Student Profile
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-medium"
              >
                {registeredStudents.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.sid}) - {u.status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition"
            >
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Role Switcher Shortcuts for Evaluators/Faculty */}
      <div className="w-full max-w-sm mx-auto text-center space-y-2 pb-2">
        <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block">
          Faculty / Admin Quick Access
        </span>
        <div className="flex justify-center gap-2">
          <button
            onClick={() => onSelectRole('teacher')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium transition"
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
            <span>Teacher Portal</span>
          </button>
          <button
            onClick={() => onSelectRole('admin')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium transition"
          >
            <Shield className="w-3.5 h-3.5 text-purple-500" />
            <span>Admin Approvals</span>
          </button>
        </div>
      </div>
    </div>
  );
};
