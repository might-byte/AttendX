import React, { useState } from 'react';
import {
  Shield,
  UserCheck,
  UserX,
  Download,
  BookOpen,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
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
  exportAttendanceCSV,
} from '../../services/storageService';

interface AdminViewProps {
  admin: UserProfile;
  users: UserProfile[];
  courses: Course[];
  enrollments: Enrollment[];
  attendanceRecords: AttendanceRecord[];
  onDataChange: () => void;
  onSelectStudent?: (student: UserProfile) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  admin,
  users,
  courses,
  enrollments,
  attendanceRecords,
  onDataChange,
  onSelectStudent,
}) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'courses' | 'records'>('approvals');
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newRoom, setNewRoom] = useState('Hall 101');
  const [newTime, setNewTime] = useState('Mon, Wed 10:00 - 11:30 AM');

  const pendingStudents = users.filter((u) => u.status === 'pending');
  const approvedStudents = users.filter((u) => u.role === 'student' && u.status === 'approved');

  const handleApprove = (user: UserProfile) => {
    const updated: UserProfile = { ...user, status: 'approved' };
    saveUser(updated);
    onDataChange();
  };

  const handleReject = (user: UserProfile) => {
    const updated: UserProfile = { ...user, status: 'rejected' };
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
      department: 'Computer Science',
      teacherId: teacher.id,
      teacherName: teacher.name,
      roomName: newRoom,
      scheduleTime: newTime,
      days: ['Mon', 'Wed'],
      startTime: '10:00',
      endTime: '11:30',
      defaultLat: 37.7749,
      defaultLng: -122.4194,
      defaultRadiusMeters: 100,
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
    link.setAttribute('download', `attendance_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Admin Approvals &amp; Management
          </h1>
          <p className="text-xs text-zinc-500">
            Dean {admin.name} &bull; Review student registrations and approvals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 text-xs font-semibold border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-2 px-1 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'approvals'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <span>Pending Approvals</span>
          {pendingStudents.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {pendingStudents.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-2 px-1 border-b-2 transition ${
            activeTab === 'courses'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Courses ({courses.length})
        </button>

        <button
          onClick={() => setActiveTab('records')}
          className={`pb-2 px-1 border-b-2 transition ${
            activeTab === 'records'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Attendance Log ({attendanceRecords.length})
        </button>
      </div>

      {/* Tab 1: Pending Approvals */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {pendingStudents.length === 0 ? (
            <div className="py-12 text-center bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                No students waiting for approval
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                All signed up students have been reviewed.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-zinc-500 font-medium">
                The following students cannot view their dashboard until approved:
              </div>

              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {pendingStudents.map((st) => (
                  <div
                    key={st.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                          {st.name}
                        </span>
                        <span className="font-mono text-zinc-500 text-[11px]">
                          ({st.sid || st.id})
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          Pending
                        </span>
                      </div>
                      <div className="text-zinc-500 text-[11px] mt-0.5">
                        {st.email} &bull; {st.program || 'Department TBA'}
                      </div>
                      <div className="text-zinc-400 text-[11px]">
                        Face Verification:{' '}
                        {st.faceTemplate?.submissionType === 'live_video'
                          ? 'Live Video Scan'
                          : '3 Face Images Submitted'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:justify-end">
                      <button
                        onClick={() => handleReject(st)}
                        className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium transition cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          handleApprove(st);
                          onSelectStudent?.(st);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition cursor-pointer shadow-xs"
                      >
                        Approve Student
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved Students List */}
          {approvedStudents.length > 0 && (
            <div className="pt-4 space-y-2">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Approved Students ({approvedStudents.length})
              </h3>
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                {approvedStudents.map((st) => (
                  <div key={st.id} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {st.name}
                      </span>
                      <span className="text-zinc-400 font-mono ml-2 text-[11px]">
                        {st.sid}
                      </span>
                    </div>
                    <span className="text-emerald-600 text-[11px] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approved
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Courses */}
      {activeTab === 'courses' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase">Course Catalog</h3>
            <button
              onClick={() => setIsAddingCourse(!isAddingCourse)}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Course</span>
            </button>
          </div>

          {isAddingCourse && (
            <form onSubmit={handleCreateCourse} className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Code (e.g. CS 405)"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
                <input
                  type="text"
                  placeholder="Course Title"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Room (e.g. Hall 202)"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
                <input
                  type="text"
                  placeholder="Schedule Time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingCourse(false)}
                  className="px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-blue-600 text-white font-medium"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {courses.map((c) => (
              <div
                key={c.id}
                className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs"
              >
                <div className="font-bold text-zinc-900 dark:text-zinc-100">
                  {c.code} - {c.name}
                </div>
                <div className="text-zinc-500">
                  {c.scheduleTime} &bull; {c.roomName}
                </div>
                <div className="text-zinc-400 text-[11px]">Instructor: {c.teacherName}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Records */}
      {activeTab === 'records' && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Course</th>
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Distance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              {attendanceRecords.map((r) => (
                <tr key={r.id}>
                  <td className="py-2.5 px-3 text-zinc-500">
                    {new Date(r.timestamp).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                    {r.courseCode}
                  </td>
                  <td className="py-2.5 px-3">
                    {r.studentName} ({r.studentSid})
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        r.status === 'present'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 capitalize">{r.method}</td>
                  <td className="py-2.5 px-3 text-zinc-500">
                    {r.distanceMeters !== undefined ? `${r.distanceMeters}m` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
