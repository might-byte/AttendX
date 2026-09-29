import React, { useState } from 'react';
import {
  Briefcase,
  Play,
  Square,
  Users,
  MapPin,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Compass,
} from 'lucide-react';
import {
  UserProfile,
  Course,
  Enrollment,
  ClassSession,
  AttendanceRecord,
} from '../../types';
import {
  saveSession,
  updateSessionStatus,
  saveAttendanceRecord,
} from '../../services/storageService';
import { getCurrentCoordinates } from '../../services/geoService';

interface TeacherViewProps {
  teacher: UserProfile;
  courses: Course[];
  enrollments: Enrollment[];
  students: UserProfile[];
  sessions: ClassSession[];
  attendanceRecords: AttendanceRecord[];
  onDataChange: () => void;
}

export const TeacherView: React.FC<TeacherViewProps> = ({
  teacher,
  courses,
  enrollments,
  students,
  sessions,
  attendanceRecords,
  onDataChange,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || ''
  );
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newRoomName, setNewRoomName] = useState('Hall 302');
  const [newRadius, setNewRadius] = useState<number>(100);
  const [newLat, setNewLat] = useState<number>(37.7749);
  const [newLng, setNewLng] = useState<number>(-122.4194);
  const [isFetchingGps, setIsFetchingGps] = useState(false);

  // Manual fallback override modal state
  const [manualModalStudent, setManualModalStudent] = useState<UserProfile | null>(null);
  const [manualSession, setManualSession] = useState<ClassSession | null>(null);
  const [manualStatus, setManualStatus] = useState<'present' | 'absent'>('present');
  const [manualReason, setManualReason] = useState<string>('Phone battery dead in class');

  const myCourses = courses.filter((c) => c.teacherId === teacher.id || !c.teacherId);
  const selectedCourse = myCourses.find((c) => c.id === selectedCourseId) || myCourses[0];

  const mySessions = sessions.filter(
    (s) => s.teacherId === teacher.id || s.courseId === selectedCourseId
  );
  const activeSession = mySessions.find((s) => s.status === 'open');

  const enrolledStudentIds = enrollments
    .filter((e) => e.courseId === (selectedCourse?.id || ''))
    .map((e) => e.studentId);

  const enrolledStudents = students.filter((s) =>
    enrolledStudentIds.includes(s.id)
  );

  const handleUseCurrentGPS = async () => {
    setIsFetchingGps(true);
    try {
      const coords = await getCurrentCoordinates();
      setNewLat(coords.lat);
      setNewLng(coords.lng);
    } catch {
      alert('Could not retrieve GPS coordinates. Using default coordinates.');
    } finally {
      setIsFetchingGps(false);
    }
  };

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    const now = new Date();
    const end = new Date(now.getTime() + 90 * 60 * 1000);

    const session: ClassSession = {
      id: `sess_${Date.now()}`,
      courseId: selectedCourse.id,
      courseCode: selectedCourse.code,
      courseName: selectedCourse.name,
      teacherId: teacher.id,
      teacherName: teacher.name,
      roomName: newRoomName,
      startTime: now.toISOString(),
      endTime: end.toISOString(),
      geofence: {
        lat: newLat,
        lng: newLng,
        radiusMeters: newRadius,
      },
      status: 'open',
      nonce: Math.random().toString(36).substring(2, 10).toUpperCase(),
      nonceExpiresAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
      createdAt: now.toISOString(),
    };

    saveSession(session);
    setIsCreatingSession(false);
    onDataChange();
  };

  const handleToggleSessionStatus = (sessionId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'open' ? 'closed' : 'open';
    updateSessionStatus(sessionId, nextStatus);
    onDataChange();
  };

  const handleSaveManualAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualModalStudent || !manualSession) return;

    const record: AttendanceRecord = {
      id: `manual_att_${Date.now()}`,
      sessionId: manualSession.id,
      courseId: manualSession.courseId,
      courseCode: manualSession.courseCode,
      studentId: manualModalStudent.id,
      studentName: manualModalStudent.name,
      studentSid: manualModalStudent.sid || manualModalStudent.id,
      status: manualStatus,
      method: 'manual',
      markedBy: teacher.id,
      markedByName: teacher.name,
      timestamp: new Date().toISOString(),
      note: manualReason,
      flagReason: `Teacher Override: ${manualReason}`,
    };

    saveAttendanceRecord(record);
    setManualModalStudent(null);
    setManualSession(null);
    onDataChange();
  };

  return (
    <div className="space-y-5">
      {/* Teacher Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Instructor Portal &bull; {teacher.name}
          </h1>
          <p className="text-xs text-zinc-500">
            Manage attendance sessions &amp; manual overrides
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
          >
            {myCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsCreatingSession(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Launch Class</span>
          </button>
        </div>
      </div>

      {/* Active Session Card */}
      {activeSession ? (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-emerald-900 dark:text-emerald-200">
                CLASS IN SESSION: {activeSession.courseCode}
              </span>
            </div>
            <div className="text-emerald-700 dark:text-emerald-300">
              Room: {activeSession.roomName} &bull; Geofence: {activeSession.geofence.radiusMeters}m radius &bull; Nonce:{' '}
              <code className="font-mono bg-white dark:bg-zinc-900 px-1 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                {activeSession.nonce}
              </code>
            </div>
          </div>

          <button
            onClick={() => handleToggleSessionStatus(activeSession.id, 'open')}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition"
          >
            End Session
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 flex items-center justify-between">
          <span>No session active currently for {selectedCourse?.code}.</span>
          <button
            onClick={() => setIsCreatingSession(true)}
            className="text-blue-600 hover:underline font-semibold"
          >
            Start Session &rarr;
          </button>
        </div>
      )}

      {/* Class Roster & Manual Fallback */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Enrolled Students ({enrolledStudents.length})
          </h2>
          <span className="text-[11px] text-zinc-400">
            Use "Manual Fallback" if student has dead phone
          </span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 font-medium">
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Face Verification</th>
                <th className="py-2.5 px-3">Attendance</th>
                <th className="py-2.5 px-3 text-right">Fallback Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              {enrolledStudents.map((st) => {
                const sessionToAudit = activeSession || mySessions[0];
                const rec = attendanceRecords.find(
                  (r) =>
                    r.studentId === st.id &&
                    (sessionToAudit ? r.sessionId === sessionToAudit.id : true)
                );

                const hasFace = !!(st.faceTemplate?.embedding || st.faceTemplate?.images?.length);

                return (
                  <tr key={st.id}>
                    <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      {st.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-500">{st.sid || st.id}</td>
                    <td className="py-2.5 px-3">
                      {hasFace ? (
                        <span className="text-emerald-600 font-medium">Verified</span>
                      ) : (
                        <span className="text-zinc-400">Missing</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {rec ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            rec.status === 'present'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {rec.status.toUpperCase()}
                          {rec.method === 'manual' && ' (Override)'}
                        </span>
                      ) : (
                        <span className="text-zinc-400">Not Marked</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setManualModalStudent(st);
                          setManualSession(activeSession || mySessions[0] || null);
                        }}
                        className="px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
                      >
                        Manual Mark
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Start Session Modal */}
      {isCreatingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Launch Class Session
            </h3>
            <form onSubmit={handleStartSession} className="space-y-2.5">
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Geofence Radius: {newRadius}m
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="10"
                  value={newRadius}
                  onChange={(e) => setNewRadius(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>

              <button
                type="button"
                onClick={handleUseCurrentGPS}
                disabled={isFetchingGps}
                className="w-full py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <Compass className={`w-3.5 h-3.5 ${isFetchingGps ? 'animate-spin' : ''}`} />
                <span>Set to My Current GPS</span>
              </button>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingSession(false)}
                  className="flex-1 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                >
                  Open Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Fallback Modal */}
      {manualModalStudent && manualSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Manual Attendance Fallback
            </h3>
            <p className="text-zinc-500">
              Student: <strong>{manualModalStudent.name}</strong> ({manualModalStudent.sid})
            </p>

            <form onSubmit={handleSaveManualAttendance} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setManualStatus('present')}
                  className={`py-1.5 rounded-lg font-bold border transition ${
                    manualStatus === 'present'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'border-zinc-200 text-zinc-600 dark:border-zinc-700'
                  }`}
                >
                  Present
                </button>
                <button
                  type="button"
                  onClick={() => setManualStatus('absent')}
                  className={`py-1.5 rounded-lg font-bold border transition ${
                    manualStatus === 'absent'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'border-zinc-200 text-zinc-600 dark:border-zinc-700'
                  }`}
                >
                  Absent
                </button>
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Reason for Override
                </label>
                <input
                  type="text"
                  required
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setManualModalStudent(null);
                    setManualSession(null);
                  }}
                  className="flex-1 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
