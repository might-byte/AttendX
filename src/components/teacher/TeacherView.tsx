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
  UserX,
  FileText,
  Lock,
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
  const [newRoomName, setNewRoomName] = useState('Turing Hall - Room 302');
  const [newRadius, setNewRadius] = useState<number>(120);
  const [newLat, setNewLat] = useState<number>(37.7749);
  const [newLng, setNewLng] = useState<number>(-122.4194);
  const [isFetchingGps, setIsFetchingGps] = useState(false);

  // Manual fallback override modal state
  const [manualModalStudent, setManualModalStudent] = useState<UserProfile | null>(null);
  const [manualSession, setManualSession] = useState<ClassSession | null>(null);
  const [manualStatus, setManualStatus] = useState<'present' | 'absent'>('present');
  const [manualReason, setManualReason] = useState<string>('Phone battery dead in lecture hall');

  // Teacher's courses
  const myCourses = courses.filter((c) => c.teacherId === teacher.id || !c.teacherId);
  const selectedCourse = myCourses.find((c) => c.id === selectedCourseId) || myCourses[0];

  // Sessions for this teacher
  const mySessions = sessions.filter(
    (s) => s.teacherId === teacher.id || s.courseId === selectedCourseId
  );
  const activeSession = mySessions.find((s) => s.status === 'open');

  // Students enrolled in selected course
  const enrolledStudentIds = enrollments
    .filter((e) => e.courseId === (selectedCourse?.id || ''))
    .map((e) => e.studentId);

  const enrolledStudents = students.filter((s) =>
    enrolledStudentIds.includes(s.id)
  );

  // Use teacher's live device coordinates for classroom geofence
  const handleUseCurrentGPS = async () => {
    setIsFetchingGps(true);
    try {
      const coords = await getCurrentCoordinates();
      setNewLat(coords.lat);
      setNewLng(coords.lng);
    } catch (err) {
      console.warn(err);
      alert('Could not retrieve GPS coordinates. Using default coordinates.');
    } finally {
      setIsFetchingGps(false);
    }
  };

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    const now = new Date();
    const end = new Date(now.getTime() + 90 * 60 * 1000); // 90 min class

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
      method: 'manual', // Fallback manual override
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
    <div className="space-y-6">
      {/* Teacher Header and Course Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Teacher Class Portal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instructor: {teacher.name} ({teacher.program || 'Faculty'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium hidden sm:inline">
              Course:
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {myCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsCreatingSession(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Session Geofence Banner */}
      {activeSession ? (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl text-white p-5 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/30 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                SESSION ACTIVE NOW
              </div>
              <h3 className="text-xl font-bold">
                {activeSession.courseCode}: {activeSession.courseName}
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-100">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {activeSession.roomName} (Radius: {activeSession.geofence.radiusMeters}m)
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  Live Nonce: <code className="font-mono bg-emerald-800/60 px-1 rounded">{activeSession.nonce}</code>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Started {new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleSessionStatus(activeSession.id, 'open')}
                className="flex items-center gap-1.5 bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>End Session</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>No live class session active currently for {selectedCourse?.code}.</span>
          <button
            onClick={() => setIsCreatingSession(true)}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            Start a Session Now &rarr;
          </button>
        </div>
      )}

      {/* Roster & Live Attendance Roster with Teacher Fallback */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Enrolled Class Roster ({enrolledStudents.length} Students)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Live attendance status &amp; teacher manual fallback override
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Student ID</th>
                <th className="py-2.5 px-3">Face Enrolled</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Match &amp; Distance</th>
                <th className="py-2.5 px-3 text-right">Teacher Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {enrolledStudents.map((st) => {
                const sessionToAudit = activeSession || mySessions[0];
                const rec = attendanceRecords.find(
                  (r) =>
                    r.studentId === st.id &&
                    (sessionToAudit ? r.sessionId === sessionToAudit.id : true)
                );

                const hasFace = !!st.faceTemplate?.embedding;

                return (
                  <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {st.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{st.email}</div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {st.sid || st.id}
                    </td>

                    <td className="py-3 px-3">
                      {hasFace ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                        </span>
                      ) : (
                        <span className="text-amber-500 text-[11px] font-medium">
                          Missing
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {rec ? (
                        <div className="space-y-0.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              rec.status === 'present'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200'
                            }`}
                          >
                            {rec.status === 'present' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <AlertTriangle className="w-3 h-3" />
                            )}
                            {rec.status.toUpperCase()}
                          </span>
                          {rec.method === 'manual' && (
                            <div className="text-[10px] text-purple-600 font-semibold">
                              Teacher Override
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          Not Marked
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-[11px] text-slate-500">
                      {rec ? (
                        <div>
                          {rec.faceScore ? `Face: ${(rec.faceScore * 100).toFixed(0)}%` : 'Manual'} &bull;{' '}
                          {rec.distanceMeters !== undefined ? `${rec.distanceMeters}m` : 'N/A'}
                          {rec.offlineSynced && (
                            <span className="ml-1 text-[10px] text-blue-500 font-semibold">
                              [Encrypted Sync]
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {/* Teacher Fallback button */}
                      <button
                        onClick={() => {
                          setManualModalStudent(st);
                          setManualSession(activeSession || mySessions[0] || null);
                          setManualStatus('present');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        title="Fallback manual marking for students with dead battery or no phone"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Manual Fallback</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Session Modal */}
      {isCreatingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Launch Class Session &amp; Geofence
            </h3>
            <form onSubmit={handleStartSession} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Classroom / Lecture Hall Name
                </label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newLat}
                    onChange={(e) => setNewLat(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newLng}
                    onChange={(e) => setNewLng(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">
                    Geofence Radius (Meters)
                  </label>
                  <span className="font-bold text-indigo-600">{newRadius} meters</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="300"
                  step="10"
                  value={newRadius}
                  onChange={(e) => setNewRadius(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600"
                />
                <span className="text-[10px] text-slate-400">
                  Recommended: 100-150m for indoor lecture halls to accommodate natural GPS fluctuation.
                </span>
              </div>

              <button
                type="button"
                onClick={handleUseCurrentGPS}
                disabled={isFetchingGps}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Compass className={`w-3.5 h-3.5 ${isFetchingGps ? 'animate-spin' : ''}`} />
                <span>{isFetchingGps ? 'Fetching GPS...' : 'Set Coordinates to My Current GPS'}</span>
              </button>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingSession(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium cursor-pointer shadow-sm"
                >
                  Open Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Fallback Modal (Section 6 of requirements) */}
      {manualModalStudent && manualSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
                Audit Logged Teacher Override
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Manual Attendance Fallback
              </h3>
              <p className="text-xs text-slate-500">
                Student: <strong>{manualModalStudent.name}</strong> ({manualModalStudent.sid || manualModalStudent.id})
              </p>
            </div>

            <form onSubmit={handleSaveManualAttendance} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Mark Attendance As
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualStatus('present')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      manualStatus === 'present'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'border-slate-200 text-slate-600 dark:border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualStatus('absent')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      manualStatus === 'absent'
                        ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'border-slate-200 text-slate-600 dark:border-slate-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Absent
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Audit Reason / Teacher Note
                </label>
                <select
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white mb-2"
                >
                  <option value="Phone battery dead in lecture hall">Phone battery dead in lecture hall</option>
                  <option value="Student device camera hardware damaged">Student device camera hardware damaged</option>
                  <option value="Physical student ID badge verified in person">Physical student ID badge verified in person</option>
                  <option value="Left phone at dorm / forgot device">Left phone at dorm / forgot device</option>
                  <option value="Poor indoor GPS signal verified by teacher">Poor indoor GPS signal verified by teacher</option>
                </select>

                <input
                  type="text"
                  placeholder="Or enter custom reason..."
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-[11px] text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                This record will be permanently saved as <code>method = manual</code> with your instructor ID for audit inspection.
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setManualModalStudent(null);
                    setManualSession(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium cursor-pointer shadow-sm"
                >
                  Confirm Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
