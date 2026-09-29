import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Camera,
  BookOpen,
  ArrowUpRight,
  TrendingUp,
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
}

export const StudentView: React.FC<StudentViewProps> = ({
  student,
  courses,
  sessions,
  attendanceRecords,
  onDataChange,
}) => {
  const [activeTab, setActiveTab] = useState<'courses' | 'schedule' | 'history'>('courses');
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);

  // Student's personal attendance records
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

    // Sort by startTime ('09:00' < '11:00')
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  return (
    <div className="space-y-6">
      {/* Top Minimal Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Overall Attendance</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {overallPercentage}%
            </span>
            <span className="text-xs text-zinc-500">
              ({presentCount}/{totalMarked} classes)
            </span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                overallPercentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Active Sessions Now</span>
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {activeSessions.length}
            </span>
            <span className="text-xs text-zinc-500 ml-2">
              {activeSessions.length > 0 ? 'Ready to mark' : 'No active class'}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Enrolled Courses</span>
            <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {courses.length}
            </span>
            <span className="text-xs text-zinc-500 ml-2">Current Semester</span>
          </div>
        </div>
      </div>

      {/* Clean Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-2.5 px-1 border-b-2 transition ${
            activeTab === 'courses'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Courses &amp; Attendance
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-2.5 px-1 border-b-2 transition ${
            activeTab === 'schedule'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Class Schedule
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 px-1 border-b-2 transition ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Attendance History
        </button>
      </div>

      {/* Tab 1: Courses & Current Course Pinned to Top */}
      {activeTab === 'courses' && (
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
                className={`p-4 rounded-xl bg-white dark:bg-zinc-900 border transition shadow-xs ${
                  liveSession
                    ? 'border-emerald-500/80 ring-1 ring-emerald-500/20'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {course.code}
                      </span>
                      <span className="text-zinc-400">&bull;</span>
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {course.name}
                      </span>

                      {liveSession && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Class in Session Now
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {course.scheduleTime || 'Schedule TBA'}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {course.roomName}
                      </span>
                      <span>&bull;</span>
                      <span>Instructor: {course.teacherName}</span>
                    </div>
                  </div>

                  {/* Attendance Stats & Mark Button */}
                  <div className="flex items-center gap-4 sm:justify-end">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {coursePercent}% Attended
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {coursePresent} of {courseAttendance.length} classes
                      </div>
                    </div>

                    {liveSession && (
                      <div>
                        {alreadyMarked ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Marked Present
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedSession(liveSession)}
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Mark Attendance</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Class Schedule Timetable */}
      {activeTab === 'schedule' && (
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Weekly Class Schedule
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium">
                  <th className="py-2.5 px-3">Course</th>
                  <th className="py-2.5 px-3">Days</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Room</th>
                  <th className="py-2.5 px-3">Teacher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                {sortedCourses.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      {c.code} - {c.name}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[11px]">
                        {c.days?.join(', ') || 'Mon, Wed'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium">
                      {c.startTime} - {c.endTime}
                    </td>
                    <td className="py-3 px-3">{c.roomName}</td>
                    <td className="py-3 px-3 text-zinc-500">{c.teacherName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Attendance History Log */}
      {activeTab === 'history' && (
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Personal Attendance Records ({myAttendance.length})
            </h3>
          </div>

          {myAttendance.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No attendance records recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium">
                    <th className="py-2.5 px-3">Date &amp; Time</th>
                    <th className="py-2.5 px-3">Course</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Distance</th>
                    <th className="py-2.5 px-3">Face Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                  {myAttendance.map((rec) => (
                    <tr key={rec.id}>
                      <td className="py-3 px-3 text-zinc-500">
                        {new Date(rec.timestamp).toLocaleDateString()}{' '}
                        {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        {rec.courseCode}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            rec.status === 'present'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {rec.status === 'present' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {rec.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 capitalize">
                        {rec.method === 'manual' ? (
                          <span className="text-zinc-500 font-medium">Teacher Override</span>
                        ) : (
                          'Self (App)'
                        )}
                      </td>
                      <td className="py-3 px-3 text-zinc-500">
                        {rec.distanceMeters !== undefined ? `${rec.distanceMeters}m away` : '-'}
                      </td>
                      <td className="py-3 px-3 text-zinc-500">
                        {rec.faceScore ? `${Math.round(rec.faceScore * 100)}% match` : 'Verified'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Attendance Camera & Geofence Modal */}
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
