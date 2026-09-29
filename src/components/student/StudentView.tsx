import React, { useState } from 'react';
import {
  GraduationCap,
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  Smartphone,
  Lock,
  Trash2,
  Calendar,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  UserProfile,
  Course,
  ClassSession,
  AttendanceRecord,
  FaceTemplate,
} from '../../types';
import { FaceEnrollmentModal } from './FaceEnrollmentModal';
import { MarkAttendanceModal } from './MarkAttendanceModal';
import { saveUser, saveAttendanceRecord } from '../../services/storageService';
import { getOrCreateDeviceId } from '../../services/deviceService';

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
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);

  const isPending = student.status === 'pending';
  const isApproved = student.status === 'approved';
  const hasFaceEnrolled = !!student.faceTemplate?.embedding;
  const currentDeviceId = getOrCreateDeviceId();
  const isDeviceBound = student.registeredDeviceId === currentDeviceId;

  // Active open sessions for student's enrolled courses
  const openSessions = sessions.filter((s) => s.status === 'open');

  // Attendance history for this student
  const myAttendance = attendanceRecords.filter((r) => r.studentId === student.id);

  const handleEnrollmentComplete = (template: FaceTemplate, boundDeviceId: string) => {
    const updatedUser: UserProfile = {
      ...student,
      faceTemplate: template,
      registeredDeviceId: boundDeviceId,
      biometricConsent: true,
      biometricConsentDate: new Date().toISOString(),
    };
    saveUser(updatedUser);
    onDataChange();
  };

  const handleDeleteBiometric = () => {
    if (confirm('Delete your enrolled face biometric data? You will need to re-enroll before marking attendance.')) {
      const updatedUser: UserProfile = {
        ...student,
        faceTemplate: undefined,
        biometricConsent: false,
      };
      saveUser(updatedUser);
      onDataChange();
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Account Notice */}
      {isPending && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200">
            <span className="font-bold">Account Pending Approval: </span>
            Your registration is currently under review by the university administrator. You will be able to mark attendance once approved.
          </div>
        </div>
      )}

      {/* Student Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {student.faceTemplate?.photoPreviewUrl ? (
                <img
                  src={student.faceTemplate.photoPreviewUrl}
                  alt={student.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                  {student.name.charAt(0)}
                </div>
              )}
              {hasFaceEnrolled && (
                <div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-900"
                  title="Biometric Template Active"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {student.name}
                </h2>
                <span className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                  {student.sid || 'STU-ID'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {student.program || 'Undergraduate Degree'} &bull; {student.email}
              </p>
            </div>
          </div>

          {/* Quick Biometrics & Device Status Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                hasFaceEnrolled
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{hasFaceEnrolled ? 'Face Enrolled (3 poses)' : 'Face Not Enrolled'}</span>
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                isDeviceBound
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title={`Device: ${currentDeviceId}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isDeviceBound ? 'Device Bound' : 'Device Not Bound'}</span>
            </div>

            {!hasFaceEnrolled && isApproved && (
              <button
                onClick={() => setIsEnrollmentOpen(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Enroll Biometrics</span>
              </button>
            )}

            {hasFaceEnrolled && (
              <button
                onClick={handleDeleteBiometric}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                title="Delete Face Biometric Data (Privacy / GDPR)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Class Sessions Ready for Attendance */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Live Class Sessions ({openSessions.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            High-accuracy GPS & Liveness Challenge Required
          </span>
        </div>

        {openSessions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No Open Class Sessions Right Now
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Your instructor will launch a session when class begins. You can switch to the <strong>Teacher</strong> tab above to launch a test session anytime!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openSessions.map((session) => {
              const alreadyMarked = myAttendance.find((a) => a.sessionId === session.id);

              return (
                <div
                  key={session.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                        {session.courseCode}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Session Open
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {session.courseName}
                    </h4>

                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>{session.roomName} ({session.geofence.radiusMeters}m geofence)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        <span>Instructor: {session.teacherName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-[11px] text-slate-400">
                      Nonce: <code className="font-mono text-slate-600 dark:text-slate-300">{session.nonce}</code>
                    </div>

                    {alreadyMarked ? (
                      <span
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
                          alreadyMarked.status === 'present'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Marked {alreadyMarked.status.toUpperCase()}
                      </span>
                    ) : (
                      <button
                        disabled={isPending || !hasFaceEnrolled}
                        onClick={() => setSelectedSession(session)}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Mark Attendance</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attendance History Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              My Attendance History ({myAttendance.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Audit-Logged Records
          </span>
        </div>

        {myAttendance.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No attendance records yet. Mark attendance when a session is active!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {myAttendance.map((rec) => (
              <div key={rec.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {rec.courseCode}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        rec.status === 'present'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {rec.status.toUpperCase()}
                    </span>
                    {rec.method === 'manual' && (
                      <span className="text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.5 rounded">
                        Teacher Override
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {new Date(rec.timestamp).toLocaleString()} &bull;{' '}
                    {rec.distanceMeters !== undefined ? `${rec.distanceMeters}m away` : 'Manual mark'}
                    {rec.faceScore && ` &bull; Face match: ${(rec.faceScore * 100).toFixed(0)}%`}
                  </div>

                  {(rec.note || rec.flagReason) && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 italic">
                      Note: {rec.note || rec.flagReason}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {rec.deviceId ? `${rec.deviceId.substring(0, 10)}...` : 'ID-VERIFIED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Face Enrollment Modal */}
      <FaceEnrollmentModal
        user={student}
        isOpen={isEnrollmentOpen}
        onClose={() => setIsEnrollmentOpen(false)}
        onEnrollmentComplete={handleEnrollmentComplete}
      />

      {/* Mark Attendance Modal */}
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
