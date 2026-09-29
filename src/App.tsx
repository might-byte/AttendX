import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  Course,
  Enrollment,
  ClassSession,
  AttendanceRecord,
  FaceTemplate,
} from './types';
import {
  getUsers,
  getCurrentUser,
  setCurrentUser,
  saveUser,
  getCourses,
  getEnrollments,
  getSessions,
  getAttendanceRecords,
  resetDemoData,
} from './services/storageService';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/common/Header';
import { StudentView } from './components/student/StudentView';
import { StudentPendingApprovalView } from './components/student/StudentPendingApprovalView';
import { StudentFaceOnboardingModal } from './components/student/StudentFaceOnboardingModal';
import { StudentAuthModal } from './components/auth/StudentAuthModal';
import { TeacherView } from './components/teacher/TeacherView';
import { AdminView } from './components/admin/AdminView';
import { OfflineIndicator } from './components/common/OfflineIndicator';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  const [currentUser, setUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  const loadData = () => {
    const allUsers = getUsers();
    setUsers(allUsers);

    let current = getCurrentUser();
    if (!current && allUsers.length > 0) {
      current = allUsers.find((u) => u.role === 'student' && u.status === 'approved') || allUsers[0];
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

  // When current student changes or signs up, check if face onboarding is needed
  useEffect(() => {
    if (currentUser?.role === 'student' && !currentUser.faceSubmitted) {
      setIsOnboardingModalOpen(true);
    } else {
      setIsOnboardingModalOpen(false);
    }
  }, [currentUser]);

  const handleSelectRole = (roleType: 'student' | 'teacher' | 'admin') => {
    let targetUser: UserProfile | undefined;

    if (roleType === 'student') {
      targetUser = users.find((u) => u.role === 'student' && u.status === 'approved') || users.find((u) => u.role === 'student');
    } else if (roleType === 'teacher') {
      targetUser = users.find((u) => u.role === 'teacher');
    } else if (roleType === 'admin') {
      targetUser = users.find((u) => u.role === 'admin');
    }

    if (targetUser) {
      setCurrentUser(targetUser);
      setUser(targetUser);
    }
  };

  const handleFaceOnboardingComplete = (template: FaceTemplate) => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      faceSubmitted: true,
      faceTemplate: template,
    };
    saveUser(updated);
    setUser(updated);
    setIsOnboardingModalOpen(false);
    loadData();
  };

  const handleAuthSuccess = (user: UserProfile, isNewSignup: boolean) => {
    setUser(user);
    loadData();
    if (isNewSignup || !user.faceSubmitted) {
      setIsOnboardingModalOpen(true);
    }
  };

  const studentUsers = users.filter((u) => u.role === 'student');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Simple Header with Theme Switch */}
      <Header
        currentUser={currentUser}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSelectRole={handleSelectRole}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {/* STUDENT FLOW */}
        {currentUser?.role === 'student' && (
          <>
            {/* If pending admin approval, do NOT show dashboard as requested */}
            {currentUser.status === 'pending' ? (
              <StudentPendingApprovalView
                student={currentUser}
                onSwitchToAdmin={() => handleSelectRole('admin')}
                onRefresh={loadData}
              />
            ) : (
              /* Approved Student Dashboard */
              <StudentView
                student={currentUser}
                courses={courses}
                sessions={sessions}
                attendanceRecords={attendanceRecords}
                onDataChange={loadData}
              />
            )}
          </>
        )}

        {/* TEACHER FLOW */}
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

        {/* ADMIN FLOW */}
        {currentUser?.role === 'admin' && (
          <AdminView
            admin={currentUser}
            users={users}
            courses={courses}
            enrollments={enrollments}
            attendanceRecords={attendanceRecords}
            onDataChange={loadData}
            onSelectStudent={(approvedStudent) => {
              setCurrentUser(approvedStudent);
              setUser(approvedStudent);
            }}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-4 text-center text-xs text-zinc-400">
        Attendance Portal &bull; Biometric Face Verification &amp; Classroom Geofencing
      </footer>

      {/* Student Signup / Login Modal */}
      <StudentAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* First-time Face Submission Modal (3 Photos or Live Video) */}
      {currentUser && currentUser.role === 'student' && isOnboardingModalOpen && (
        <StudentFaceOnboardingModal
          student={currentUser}
          isOpen={isOnboardingModalOpen}
          onComplete={handleFaceOnboardingComplete}
          onClose={currentUser.faceSubmitted ? () => setIsOnboardingModalOpen(false) : undefined}
        />
      )}

      {/* Non-intrusive Offline Indicator */}
      <OfflineIndicator onSyncComplete={loadData} />
    </div>
  );
}
