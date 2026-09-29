/**
 * AttendX - Biometric Face & Geofence Attendance PWA
 * Features:
 * - PWA Installability (manifest, service worker, beforeinstallprompt & iOS Safari flow)
 * - 3-Pose Still Face Enrollment (Front, Left, Right) with 128-d embedding extraction
 * - Randomized Liveness Challenge (Blink, Turn Left/Right, Smile, Tilt Up)
 * - High-Accuracy GPS Geofencing (Haversine distance, accuracy filter, spoofing anomaly check)
 * - AES-GCM 256-bit Local Storage Encryption for Offline Student Sync
 * - Role-Based Workflows: Student, Teacher (Session launch & manual fallback), Admin (Approvals, Courses, CSV Export)
 */

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Briefcase,
  Shield,
  UserPlus,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  UserProfile,
  Course,
  Enrollment,
  ClassSession,
  AttendanceRecord,
} from './types';
import {
  getUsers,
  getCurrentUser,
  setCurrentUser,
  getCourses,
  getEnrollments,
  getSessions,
  getAttendanceRecords,
  resetDemoData,
} from './services/storageService';
import { Header } from './components/common/Header';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { StudentView } from './components/student/StudentView';
import { TeacherView } from './components/teacher/TeacherView';
import { AdminView } from './components/admin/AdminView';
import { ProfileModal } from './components/common/ProfileModal';
import { RegisterModal } from './components/auth/RegisterModal';

export default function App() {
  const [currentUser, setUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Load all app data from persistent storage
  const loadData = () => {
    const allUsers = getUsers();
    setUsers(allUsers);

    let current = getCurrentUser();
    if (!current && allUsers.length > 0) {
      current = allUsers.find((u) => u.role === 'student') || allUsers[0];
      setCurrentUser(current);
    }
    setUser(current);

    setCourses(getCourses());
    setEnrollments(getEnrollments());
    setSessions(getSessions());
    setAttendanceRecords(getAttendanceRecords());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectRole = (roleType: 'student' | 'teacher' | 'admin' | 'pending') => {
    let targetUser: UserProfile | undefined;

    if (roleType === 'pending') {
      targetUser = users.find((u) => u.status === 'pending');
    } else {
      targetUser = users.find((u) => u.role === roleType && u.status === 'approved');
    }

    if (targetUser) {
      setCurrentUser(targetUser);
      setUser(targetUser);
    }
  };

  const handleResetData = () => {
    resetDemoData();
    loadData();
  };

  // Extract enrolled students list
  const studentUsers = users.filter((u) => u.role === 'student');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onSelectRole={handleSelectRole}
        onOpenProfile={() => setIsProfileOpen(true)}
        onResetData={handleResetData}
      />

      {/* Quick Role Navigation Bar for testing & evaluation */}
      <div className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-slate-400 font-semibold uppercase text-[10px] mr-1 hidden sm:inline">
              Testing Mode:
            </span>

            <button
              onClick={() => handleSelectRole('student')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                currentUser?.role === 'student' && currentUser?.status === 'approved'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student (Alex)</span>
            </button>

            <button
              onClick={() => handleSelectRole('teacher')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                currentUser?.role === 'teacher'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Teacher (Dr. Lin)</span>
            </button>

            <button
              onClick={() => handleSelectRole('admin')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                currentUser?.role === 'admin'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin (Dean Vance)</span>
            </button>

            <button
              onClick={() => handleSelectRole('pending')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                currentUser?.status === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Pending User</span>
            </button>
          </div>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register New User</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentUser?.role === 'student' && (
          <StudentView
            student={currentUser}
            courses={courses}
            sessions={sessions}
            attendanceRecords={attendanceRecords}
            onDataChange={loadData}
          />
        )}

        {currentUser?.role === 'teacher' && (
          <TeacherView
            teacher={currentUser}
            courses={courses}
            enrollments={enrollments}
            students={studentUsers}
            sessions={sessions}
            attendanceRecords={attendanceRecords}
            onDataChange={loadData}
          />
        )}

        {currentUser?.role === 'admin' && (
          <AdminView
            admin={currentUser}
            users={users}
            courses={courses}
            enrollments={enrollments}
            attendanceRecords={attendanceRecords}
            onDataChange={loadData}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-4 px-6 text-center text-xs text-slate-400 space-y-1">
        <div>
          AttendX Attendance PWA &bull; Client-side Face Feature Embeddings &bull; Haversine GPS Geofencing &bull; AES-GCM Encrypted Offline Sync
        </div>
        <div className="text-[11px] text-slate-500">
          Designed with biometric privacy by design: video is never recorded or stored.
        </div>
      </footer>

      {/* Non-intrusive Offline Mode & AES-GCM Encrypted Queue Tray */}
      <OfflineIndicator onSyncComplete={loadData} />

      {/* Modals */}
      {currentUser && (
        <ProfileModal
          user={currentUser}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onDataChange={loadData}
        />
      )}

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={(newUser) => {
          loadData();
        }}
      />
    </div>
  );
}
