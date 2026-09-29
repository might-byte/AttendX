import React from 'react';
import { Clock, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';
import { UserProfile } from '../../types';

interface StudentPendingApprovalViewProps {
  student: UserProfile;
  onSwitchToAdmin: () => void;
  onRefresh: () => void;
}

export const StudentPendingApprovalView: React.FC<StudentPendingApprovalViewProps> = ({
  student,
  onSwitchToAdmin,
  onRefresh,
}) => {
  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center space-y-5">
      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
        <Clock className="w-6 h-6 animate-pulse" />
      </div>

      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          Account Pending Approval
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Registration Under Review
        </h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Your details and face verification have been recorded. A university administrator must approve your account before you can access courses and mark attendance.
        </p>
      </div>

      {/* Submission Details Card */}
      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-700/60 space-y-2">
        <div className="flex justify-between pb-1.5">
          <span className="text-zinc-500">Student Name:</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{student.name}</span>
        </div>
        <div className="flex justify-between py-1.5">
          <span className="text-zinc-500">Student ID:</span>
          <span className="font-mono text-zinc-800 dark:text-zinc-200">{student.sid || student.id}</span>
        </div>
        <div className="flex justify-between py-1.5">
          <span className="text-zinc-500">Department:</span>
          <span className="text-zinc-800 dark:text-zinc-200">{student.program || 'General'}</span>
        </div>
        <div className="flex justify-between pt-1.5">
          <span className="text-zinc-500">Face Verification:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Submitted ({student.faceTemplate?.submissionType === 'live_video' ? 'Live Video' : '3 Photos'})
          </span>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <button
          onClick={onRefresh}
          className="w-full py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold transition"
        >
          Check Status
        </button>

        <button
          onClick={onSwitchToAdmin}
          className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
        >
          <UserCheck className="w-4 h-4" />
          <span>Switch to Admin to Approve</span>
        </button>
      </div>
    </div>
  );
};
