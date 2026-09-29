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
} from './services/storageService';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/common/Header';
import { AuthPage } from './components/auth/AuthPage';
import { FaceOnboardingPage } from './components/student/FaceOnboardingPage';
import { StudentView } from './components/student/StudentView';
import { StudentPendingApprovalView } from './components/student/StudentPendingApprovalView';
import { TeacherView } from './components/teacher/TeacherView';
import { AdminView } from './components/admin/AdminView';
import { OfflineIndicator } from './components/common/OfflineIndicator';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  const [currentUser, setUser] = useState<UserProfile | null>(null);
  const [isAuthPage, setIsAuthPage] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

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

  const handleSelectRole = (roleType: 'student' | 'teacher' | 'admin') => {
    setIsAuthPage(false);
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

  const handleAuthSuccess = (user: UserProfile, isNewSignup: boolean) => {
    setUser(user);
    setIsAuthPage(false);
    loadData();
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
    loadData();
  };

  const handleSignOut = () => {
    setIsAuthPage(true);
  };

  const studentUsers = users.filter((u) => u.role === 'student');

  // If Auth Page is active or no user logged in
  if (isAuthPage || !currentUser) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex justify-center text-zinc-900 dark:text-zinc-100 transition-colors">
        <div className="w-full max-w-md min-h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col shadow-sm border-x border-zinc-200 dark:border-zinc-800">
          <AuthPage
            theme={theme}
            onToggleTheme={toggleTheme}
            onAuthSuccess={handleAuthSuccess}
            onSelectRole={(role) => handleSelectRole(role)}
          />
        </div>
      </div>
    );
  }

  // If student needs to complete Face Verification (First-time onboarding page)
  if (currentUser.role === 'student' && !currentUser.faceSubmitted) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex justify-center text-zinc-900 dark:text-zinc-100 transition-colors">
        <div className="w-full max-w-md min-h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col shadow-sm border-x border-zinc-200 dark:border-zinc-800">
          <FaceOnboardingPage
            student={currentUser}
            onComplete={handleFaceOnboardingComplete}
            onCancel={handleSignOut}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex justify-center text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="w-full max-w-md min-h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col shadow-sm border-x border-zinc-200 dark:border-zinc-800 relative">
        {/* Top Header */}
        <Header
          currentUser={currentUser}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSelectRole={handleSelectRole}
          onOpenAuth={handleSignOut}
        />

        {/* Mobile Page Content Area */}
        <main className="flex-1 p-4 overflow-y-auto">
          {/* STUDENT FLOW */}
          {currentUser.role === 'student' && (
            <>
              {/* If pending admin approval, do NOT show student dashboard */}
              {currentUser.status === 'pending' ? (
                <StudentPendingApprovalView
                  student={currentUser}
                  onSwitchToAdmin={() => handleSelectRole('admin')}
                  onRefresh={loadData}
                  onSignOut={handleSignOut}
                />
              ) : (
                /* Approved Student Dashboard */
                <StudentView
                  student={currentUser}
                  courses={courses}
                  sessions={sessions}
                  attendanceRecords={attendanceRecords}
                  onDataChange={loadData}
                  onSignOut={handleSignOut}
                />
              )}
            </>
          )}

          {/* TEACHER FLOW */}
          {currentUser.role === 'teacher' && (
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
          {currentUser.role === 'admin' && (
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

        {/* Offline & Encrypted Sync Indicator */}
        <OfflineIndicator onSyncComplete={loadData} />
      </div>
    </div>
  );
}
