import React from 'react';
import {
  Shield,
  GraduationCap,
  Briefcase,
  UserCheck,
  Smartphone,
  RotateCcw,
  LogOut,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { PWAInstallButton } from './PWAInstallButton';
import { getOrCreateDeviceId } from '../../services/deviceService';

interface HeaderProps {
  currentUser: UserProfile | null;
  onSelectRole: (role: 'student' | 'teacher' | 'admin' | 'pending') => void;
  onOpenProfile: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSelectRole,
  onOpenProfile,
  onResetData,
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = React.useState(false);
  const deviceId = getOrCreateDeviceId();

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'teacher':
        return <Briefcase className="w-4 h-4 text-indigo-600" />;
      default:
        return <GraduationCap className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending Approval
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <UserCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                Attend<span className="text-blue-600">X</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 px-1.5 py-0.5 rounded">
                Biometric PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Face & Geofence Verified Attendance
            </p>
          </div>
        </div>

        {/* Right side controls: Role switch, PWA install, User menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* In-App PWA Install Button */}
          <PWAInstallButton />

          {/* Quick Demo Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              {getRoleIcon(currentUser?.role)}
              <span className="capitalize hidden md:inline font-semibold">
                {currentUser?.role || 'Guest'}
              </span>
              <span className="md:hidden font-semibold">
                {currentUser?.role === 'admin' ? 'Admin' : currentUser?.role === 'teacher' ? 'Teach' : 'Student'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setRoleMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 p-2 z-50 text-xs divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                    Switch Test Account
                  </div>
                  <div className="py-1 space-y-1">
                    <button
                      onClick={() => {
                        onSelectRole('student');
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${
                        currentUser?.role === 'student' && currentUser?.status === 'approved'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <div>
                          <div>Alex Rivera</div>
                          <div className="text-[10px] text-slate-400">Student (Approved)</div>
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </button>

                    <button
                      onClick={() => {
                        onSelectRole('teacher');
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${
                        currentUser?.role === 'teacher'
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-indigo-600" />
                        <div>
                          <div>Dr. Sarah Lin</div>
                          <div className="text-[10px] text-slate-400">Teacher (CS Dept)</div>
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </button>

                    <button
                      onClick={() => {
                        onSelectRole('admin');
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${
                        currentUser?.role === 'admin'
                          ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-600" />
                        <div>
                          <div>Dean Marcus Vance</div>
                          <div className="text-[10px] text-slate-400">Admin Approver</div>
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                    </button>

                    <button
                      onClick={() => {
                        onSelectRole('pending');
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${
                        currentUser?.status === 'pending'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-500" />
                        <div>
                          <div>Jordan Chen</div>
                          <div className="text-[10px] text-slate-400">Pending Student</div>
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        if (confirm('Reset application data back to initial seeds?')) {
                          onResetData();
                          setRoleMenuOpen(false);
                        }
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer text-left"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Sample Data</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Pill */}
          {currentUser && (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer text-left"
              title="View Profile & Biometric Settings"
            >
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs uppercase">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                  {currentUser.name}
                </div>
                <div>{getStatusBadge(currentUser.status)}</div>
              </div>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
