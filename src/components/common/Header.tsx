import React from 'react';
import {
  Sun,
  Moon,
  Download,
  LogOut,
  User,
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
      <div className="max-w-md mx-auto px-4 h-13 flex items-center justify-between gap-2">
        {/* Mobile Title & Current Role Switcher */}
        <div className="flex items-center gap-2">
          <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>AttendX</span>
          </div>

          {currentUser && (
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
              <button
                onClick={() => onSelectRole('student')}
                className={`px-2 py-0.5 rounded-md transition ${
                  currentUser.role === 'student'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Student
              </button>
              <button
                onClick={() => onSelectRole('teacher')}
                className={`px-2 py-0.5 rounded-md transition ${
                  currentUser.role === 'teacher'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Teacher
              </button>
              <button
                onClick={() => onSelectRole('admin')}
                className={`px-2 py-0.5 rounded-md transition ${
                  currentUser.role === 'admin'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Admin
              </button>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1">
          {/* PWA Install Button */}
          {isInstallable && (
            <button
              onClick={install}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title="Install app on mobile"
            >
              <Download className="w-4 h-4 text-blue-600" />
            </button>
          )}

          {/* Theme Switch */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            aria-label="Toggle light and dark mode"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-zinc-700" />
            ) : (
              <Sun className="w-4 h-4 text-zinc-300" />
            )}
          </button>

          {/* Sign Out / Account Button */}
          <button
            onClick={onOpenAuth}
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            title="Switch Account / Sign In"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
