import React, { useState } from 'react';
import {
  Shield,
  UserCheck,
  UserX,
  AlertTriangle,
  Download,
  BookOpen,
  CheckCircle2,
  Clock,
  Smartphone,
  Plus,
  Trash2,
  Search,
  Filter,
} from 'lucide-react';
import {
  UserProfile,
  Course,
  Enrollment,
  AttendanceRecord,
} from '../../types';
import {
  saveUser,
  saveCourse,
  saveEnrollment,
  removeEnrollment,
  updateAttendanceRecordStatus,
  exportAttendanceCSV,
} from '../../services/storageService';

interface AdminViewProps {
  admin: UserProfile;
  users: UserProfile[];
  courses: Course[];
  enrollments: Enrollment[];
  attendanceRecords: AttendanceRecord[];
  onDataChange: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  admin,
  users,
  courses,
  enrollments,
  attendanceRecords,
  onDataChange,
}) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'anomalies' | 'courses' | 'all_records'>('approvals');
  const [searchQuery, setSearchQuery] = useState('');

  // Course creation state
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('Computer Science');
  const [newRoom, setNewRoom] = useState('Turing Hall 101');

  // Filtered pending users
  const pendingUsers = users.filter((u) => u.status === 'pending');
  const approvedUsers = users.filter((u) => u.status === 'approved');

  // Flagged attendance records (anomaly audit)
  const flaggedRecords = attendanceRecords.filter((r) => r.status === 'flagged');

  const handleUpdateStatus = (user: UserProfile, status: 'approved' | 'rejected') => {
    const updated: UserProfile = { ...user, status };
    saveUser(updated);
    onDataChange();
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;

    const teacher = users.find((u) => u.role === 'teacher') || admin;
    const course: Course = {
      id: `crs_${Date.now()}`,
      code: newCode.toUpperCase(),
      name: newName,
      department: newDept,
      teacherId: teacher.id,
      teacherName: teacher.name,
      roomName: newRoom,
      defaultLat: 37.7749,
      defaultLng: -122.4194,
      defaultRadiusMeters: 120,
    };

    saveCourse(course);
    setIsAddingCourse(false);
    setNewCode('');
    setNewName('');
    onDataChange();
  };

  const handleExportCSV = () => {
    const csvContent = exportAttendanceCSV(attendanceRecords);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendx_attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResolveAnomaly = (recordId: string, resolution: 'present' | 'absent') => {
    updateAttendanceRecordStatus(
      recordId,
      resolution,
      `Resolved by Administrator ${admin.name} on ${new Date().toLocaleDateString()}`
    );
    onDataChange();
  };

  return (
    <div className="space-y-6">
      {/* Admin Title Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                University Administration Portal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Approvals, Geofence Course Management &amp; Biometric Audit Logs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-semibold px-3.5 py-2 rounded-xl transition cursor-pointer shadow-sm"
              title="Download CSV Attendance Report"
            >
              <Download className="w-4 h-4" />
              <span>Export Audit CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Pending Approvals</span>
            {pendingUsers.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('anomalies')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'anomalies'
                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Flagged Anomalies</span>
            {flaggedRecords.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {flaggedRecords.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Courses &amp; Geofences ({courses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all_records')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'all_records'
                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Master Logs ({attendanceRecords.length})</span>
          </button>
        </div>
      </div>

      {/* Tab: Pending Approvals */}
      {activeTab === 'approvals' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Registration Approval Queue
              </h3>
              <p className="text-xs text-slate-500">
                Students and teachers cannot access attendance marking until approved
              </p>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              {pendingUsers.length} Pending User{pendingUsers.length === 1 ? '' : 's'}
            </span>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              All registration requests have been reviewed and approved!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingUsers.map((user) => (
                <div key={user.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {user.name}
                      </span>
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {user.role}
                      </span>
                      <span className="text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded text-[10px] font-semibold">
                        Pending
                      </span>
                    </div>

                    <div className="text-slate-500 text-[11px]">
                      ID: {user.sid || 'N/A'} &bull; {user.email} &bull; {user.program || 'No dept'}
                    </div>

                    <div className="text-slate-400 text-[10px]">
                      Registered: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(user, 'rejected')}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 font-medium transition cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(user, 'approved')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition cursor-pointer shadow-sm"
                    >
                      Approve User
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Flagged Anomalies */}
      {activeTab === 'anomalies' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Attendance Anomaly &amp; Cheating Review
            </h3>
            <p className="text-xs text-slate-500">
              Flags generated for GPS geofence breaches, duplicate coordinates, or device mismatches
            </p>
          </div>

          {flaggedRecords.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              No flagged anomalies. All attendance records are verified!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {flaggedRecords.map((r) => (
                <div key={r.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {r.studentName} ({r.studentSid})
                      </span>
                      <span className="font-semibold text-blue-600">
                        {r.courseCode}
                      </span>
                      <span className="bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded font-bold text-[10px]">
                        FLAGGED
                      </span>
                    </div>

                    <div className="text-rose-600 dark:text-rose-400 font-medium text-[11px]">
                      Reason: {r.flagReason || 'Geofence or device signature mismatch'}
                    </div>

                    <div className="text-slate-400 text-[10px]">
                      Distance: {r.distanceMeters ?? 'N/A'}m &bull; Face match: {r.faceScore ? `${(r.faceScore * 100).toFixed(0)}%` : 'N/A'} &bull; GPS accuracy: ±{r.accuracy ?? 'N/A'}m
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResolveAnomaly(r.id, 'absent')}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Confirm Absent
                    </button>
                    <button
                      onClick={() => handleResolveAnomaly(r.id, 'present')}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition cursor-pointer shadow-sm"
                    >
                      Clear &amp; Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Courses & Geofence Management */}
      {activeTab === 'courses' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Courses &amp; Classroom Geofences
              </h3>
              <p className="text-xs text-slate-500">
                Setup lecture rooms and default radius parameters
              </p>
            </div>
            <button
              onClick={() => setIsAddingCourse(true)}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Course</span>
            </button>
          </div>

          {isAddingCourse && (
            <form onSubmit={handleCreateCourse} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-3 text-xs border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white">Create New Course</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Code (e.g. CS 405)"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  placeholder="Course Title"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  placeholder="Department"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  placeholder="Room Name"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddingCourse(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-purple-600 text-white font-semibold"
                >
                  Save Course
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {courses.map((c) => {
              const enrolledCount = enrollments.filter((e) => e.courseId === c.id).length;
              return (
                <div key={c.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-bold text-purple-600 uppercase">
                        {c.code}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {c.name}
                      </h4>
                    </div>
                    <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                      {enrolledCount} Students
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-0.5">
                    <div>Room: {c.roomName}</div>
                    <div>Default Geofence: {c.defaultRadiusMeters}m radius</div>
                    <div>Faculty: {c.teacherName}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Master Audit Logs */}
      {activeTab === 'all_records' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Full University Attendance Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Detailed audit trail including face match scores, GPS accuracy, and device tokens
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              Download All as CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-2">Time</th>
                  <th className="py-2 px-2">Course</th>
                  <th className="py-2 px-2">Student</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2">Method</th>
                  <th className="py-2 px-2">Face Score</th>
                  <th className="py-2 px-2">Distance</th>
                  <th className="py-2 px-2">Device ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">
                      No attendance records in system yet.
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-2 text-[11px] text-slate-400">
                        {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-2 font-bold">{r.courseCode}</td>
                      <td className="py-2.5 px-2">
                        {r.studentName}
                        <div className="text-[10px] text-slate-400">{r.studentSid}</div>
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            r.status === 'present'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 capitalize">{r.method}</td>
                      <td className="py-2.5 px-2">
                        {r.faceScore !== undefined ? `${(r.faceScore * 100).toFixed(0)}%` : '-'}
                      </td>
                      <td className="py-2.5 px-2">
                        {r.distanceMeters !== undefined ? `${r.distanceMeters}m` : '-'}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-[10px] text-slate-400">
                        {r.deviceId ? `${r.deviceId.substring(0, 10)}...` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
