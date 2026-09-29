import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  TrendingUp,
  User,
  LogOut,
  XCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import {
  UserProfile,
  Course,
  ClassSession,
  AttendanceRecord,
} from '../../types';
import { MarkAttendanceModal } from './MarkAttendanceModal';

interface StudentViewProps {
  student: UserProfile;
  courses: Course[];
  sessions: ClassSession[];
  attendanceRecords: AttendanceRecord[];
  onDataChange: () => void;
  onSignOut: () => void;
}

export const StudentView: React.FC<StudentViewProps> = ({
  student,
  courses,
  sessions,
  attendanceRecords,
  onDataChange,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'schedule' | 'attendance' | 'account'>('classes');
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);

  // Filter attendance for this student
  const myAttendance = attendanceRecords.filter((r) => r.studentId === student.id);
  const totalMarked = myAttendance.length;
  const presentCount = myAttendance.filter((r) => r.status === 'present').length;
  const overallPercentage = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 100;

  // Active open sessions
  const activeSessions = sessions.filter((s) => s.status === 'open');

  // Sort courses: Active session course first, then sorted by class start time
  const sortedCourses = [...courses].sort((a, b) => {
    const aIsActive = activeSessions.some((s) => s.courseId === a.id);
    const bIsActive = activeSessions.some((s) => s.courseId === b.id);

    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;

    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  return (
    <div className="flex flex-col pb-20">
      {/* ----------------- TAB 1: CLASSES ----------------- */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          {/* Welcome / Attendance Summary Card */}
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400 font-medium">Student Dashboard</span>
                <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {student.name}
                </h1>
                <p className="text-[11px] text-zinc-500 font-mono">{student.sid}</p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {overallPercentage}%
                </span>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                  Attendance
                </div>
              </div>
            </div>

            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  overallPercentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>

          {/* Section Title */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              My Courses ({courses.length})
            </span>
            <span className="text-[11px] text-zinc-500">Sorted by class time</span>
          </div>

          {/* Course Cards List */}
          <div className="space-y-3">
            {sortedCourses.map((course) => {
              const courseAttendance = myAttendance.filter((r) => r.courseId === course.id);
              const coursePresent = courseAttendance.filter((r) => r.status === 'present').length;
              const coursePercent =
                courseAttendance.length > 0
                  ? Math.round((coursePresent / courseAttendance.length) * 100)
                  : 100;

              const liveSession = activeSessions.find((s) => s.courseId === course.id);
              const alreadyMarked = liveSession
                ? courseAttendance.some((a) => a.sessionId === liveSession.id)
                : false;

              return (
                <div
                  key={course.id}
                  className={`p-4 rounded-2xl bg-white dark:bg-zinc-900 border transition shadow-xs space-y-3 ${
                    liveSession
                      ? 'border-emerald-500/80 ring-1 ring-emerald-500/20'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {course.code}
                        </span>
                        {liveSession && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Class
                          </span>
                        )}
                      </div>
                      <h2 className="text-xs font-medium text-zinc-600 dark:text-zinc-300 mt-0.5">
                        {course.name}
                      </h2>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {coursePercent}%
                      </span>
                      <div className="text-[10px] text-zinc-400">
                        {coursePresent}/{courseAttendance.length} Attended
                      </div>
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-zinc-500 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {course.scheduleTime}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      {course.roomName}
                    </span>
                  </div>

                  {/* Active Session Button */}
                  {liveSession && (
                    <div className="pt-1">
                      {alreadyMarked ? (
                        <div className="w-full py-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Attendance Recorded (Present)</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedSession(liveSession)}
                          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Mark Attendance Now</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: SCHEDULE ----------------- */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="px-1">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Weekly Class Timetable
            </h2>
            <p className="text-xs text-zinc-500">Days, times, and lecture rooms</p>
          </div>

          <div className="space-y-2.5">
            {sortedCourses.map((c) => (
              <div
                key={c.id}
                className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {c.code}
                    </span>
                    <span className="text-zinc-500 truncate max-w-[150px]">
                      {c.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <span>{c.roomName}</span>
                    <span>&bull;</span>
                    <span>{c.teacherName}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="font-semibold text-blue-600 dark:text-blue-400 block font-mono text-xs">
                    {c.startTime} - {c.endTime}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {c.days?.join(', ') || 'Mon, Wed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB 3: ATTENDANCE BREAKDOWN ----------------- */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="px-1">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Attendance Records
            </h2>
            <p className="text-xs text-zinc-500">
              {presentCount} of {totalMarked} total classes attended
            </p>
          </div>

          {/* Breakdown cards */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Per-Course Attendance
            </h3>
            <div className="space-y-2 text-xs">
              {courses.map((c) => {
                const recs = myAttendance.filter((r) => r.courseId === c.id);
                const attended = recs.filter((r) => r.status === 'present').length;
                const pct = recs.length > 0 ? Math.round((attended / recs.length) * 100) : 100;

                return (
                  <div key={c.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {c.code} ({attended}/{recs.length})
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pct >= 75 ? 'bg-blue-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* History List */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
              History Log ({myAttendance.length})
            </h3>
            {myAttendance.length === 0 ? (
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
                No past attendance records yet.
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs">
                {myAttendance.map((r) => (
                  <div key={r.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {r.courseCode}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            r.status === 'present'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {r.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {new Date(r.timestamp).toLocaleDateString()}{' '}
                        {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-zinc-400">
                      {r.method === 'manual' ? 'Teacher Fallback' : `${r.distanceMeters ?? 0}m GPS`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB 4: ACCOUNT / PROFILE ----------------- */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs shadow-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                {student.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {student.name}
                </h2>
                <p className="text-zinc-500 font-mono text-[11px]">{student.sid}</p>
                <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Approved Student
                </span>
              </div>
            </div>

            <div className="space-y-2 text-zinc-600 dark:text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-400">Email:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{student.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Department:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{student.program || 'Computer Science'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Face Verification:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="w-full h-11 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out / Switch Account</span>
          </button>
        </div>
      )}

      {/* ----------------- FIXED MOBILE BOTTOM NAVIGATION BAR ----------------- */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-md mx-auto grid grid-cols-4 h-15">
          <button
            onClick={() => setActiveTab('classes')}
            className={`flex flex-col items-center justify-center gap-1 transition ${
              activeTab === 'classes'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px]">Classes</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex flex-col items-center justify-center gap-1 transition ${
              activeTab === 'schedule'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[10px]">Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex flex-col items-center justify-center gap-1 transition ${
              activeTab === 'attendance'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-[10px]">Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center justify-center gap-1 transition ${
              activeTab === 'account'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-[10px]">Profile</span>
          </button>
        </div>
      </nav>

      {/* Attendance Modal */}
      {selectedSession && (
        <MarkAttendanceModal
          session={selectedSession}
          student={student}
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          onSuccess={() => {
            setSelectedSession(null);
            onDataChange();
          }}
        />
      )}
    </div>
  );
};
