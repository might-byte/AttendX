import React from 'react';
import {
  Sun,
  Moon,
  User,
  GraduationCap,
  Briefcase,
  Shield,
  Download,
  LogOut,
  UserPlus,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { Theme } from '../../hooks/useTheme';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface HeaderProps {
  currentUser: UserProfile | null;
  theme: Theme;
  onToggleTheme: () => void;
  onSelectRole: (role: 'student' | 'teacher' | 'admin') => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  theme,
  onToggleTheme,
  onSelectRole,
  onOpenAuth,
}) => {
  const { isInstallable, install } = usePWAInstall();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Logo / Simple App Title */}
        <div className="flex items-center gap-3">
          <div className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Attendance Portal</span>
          </div>

          {/* Minimal Role Tabs */}
          <div className="hidden sm:flex items-center gap-1 ml-4 text-xs font-medium text-zinc-500">
            <button
              onClick={() => onSelectRole('student')}
              className={`px-2.5 py-1 rounded-md transition ${
                currentUser?.role === 'student'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => onSelectRole('teacher')}
              className={`px-2.5 py-1 rounded-md transition ${
                currentUser?.role === 'teacher'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Teacher
            </button>
            <button
              onClick={() => onSelectRole('admin')}
              className={`px-2.5 py-1 rounded-md transition ${
                currentUser?.role === 'admin'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Light / Dark Mode Switch */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-zinc-700" />
            ) : (
              <Sun className="w-4 h-4 text-zinc-300" />
            )}
          </button>

          {/* PWA Install */}
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              title="Install app"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install</span>
            </button>
          )}

          {/* Student Signup / Switch Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white text-xs font-medium transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Student Signup / Login</span>
            <span className="sm:hidden">Account</span>
          </button>
        </div>
      </div>
    </header>
  );
};
