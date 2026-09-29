/**
 * Central storage and state persistence service.
 * Manages accounts, sessions, courses, attendance, and encrypted offline queues.
 */

import {
  UserProfile,
  Course,
  Enrollment,
  ClassSession,
  AttendanceRecord,
  EncryptedOfflineRecord,
} from '../types';
import { encryptData, decryptData } from './cryptoService';
import { getOrCreateDeviceId } from './deviceService';

const USERS_KEY = 'attendx_users_v1';
const CURRENT_USER_KEY = 'attendx_current_user_v1';
const COURSES_KEY = 'attendx_courses_v1';
const ENROLLMENTS_KEY = 'attendx_enrollments_v1';
const SESSIONS_KEY = 'attendx_sessions_v1';
const ATTENDANCE_KEY = 'attendx_attendance_v1';
const OFFLINE_QUEUE_KEY = 'attendx_offline_encrypted_queue_v1';

// Seed initial realistic data
function seedInitialData() {
  const currentDeviceId = getOrCreateDeviceId();

  const seedUsers: UserProfile[] = [
    {
      id: 'admin_1',
      name: 'Dean Marcus Vance',
      email: 'm.vance@university.edu',
      role: 'admin',
      status: 'approved',
      sid: 'ADM-9021',
      phone: '+1 (555) 234-8890',
      program: 'Academic Administration',
      biometricConsent: true,
      createdAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'teacher_1',
      name: 'Dr. Sarah Lin',
      email: 's.lin@university.edu',
      role: 'teacher',
      status: 'approved',
      sid: 'FAC-4108',
      phone: '+1 (555) 890-1234',
      program: 'Computer Science Dept',
      biometricConsent: true,
      createdAt: '2026-09-05T09:30:00Z',
    },
    {
      id: 'student_1',
      name: 'Alex Rivera',
      email: 'alex.rivera@student.university.edu',
      role: 'student',
      status: 'approved',
      sid: 'STU-2026-88',
      phone: '+1 (555) 345-6789',
      program: 'Computer Science (B.S.)',
      registeredDeviceId: currentDeviceId,
      biometricConsent: true,
      biometricConsentDate: '2026-09-10T10:00:00Z',
      faceTemplate: {
        // Pre-seeded normalized 128-d biometric baseline
        embedding: new Array(128).fill(0).map((_, i) => parseFloat((Math.sin(i * 0.15) * 0.1 + 0.08).toFixed(6))),
        photoPreviewUrl: '',
        enrolledAt: '2026-09-10T10:05:00Z',
        sampleCount: 3,
      },
      createdAt: '2026-09-10T10:00:00Z',
    },
    {
      id: 'student_2',
      name: 'Priya Sharma',
      email: 'priya.s@student.university.edu',
      role: 'student',
      status: 'approved',
      sid: 'STU-2026-42',
      phone: '+1 (555) 456-7890',
      program: 'Data Science (B.S.)',
      registeredDeviceId: 'DEV-ALT-PHONE-882',
      biometricConsent: true,
      biometricConsentDate: '2026-09-11T11:20:00Z',
      createdAt: '2026-09-11T11:20:00Z',
    },
    {
      id: 'student_3',
      name: 'Jordan Chen',
      email: 'jordan.c@student.university.edu',
      role: 'student',
      status: 'pending', // Pending admin approval test case
      sid: 'STU-2026-103',
      phone: '+1 (555) 789-0123',
      program: 'Computer Engineering (B.S.)',
      biometricConsent: true,
      createdAt: '2026-09-27T14:15:00Z',
    },
  ];

  const seedCourses: Course[] = [
    {
      id: 'course_1',
      code: 'CS 304',
      name: 'Distributed Systems & Cloud',
      department: 'Computer Science',
      teacherId: 'teacher_1',
      teacherName: 'Dr. Sarah Lin',
      roomName: 'Turing Hall - Room 302',
      defaultLat: 37.7749, // Reference coordinate (can be synced to real GPS with one click)
      defaultLng: -122.4194,
      defaultRadiusMeters: 120,
    },
    {
      id: 'course_2',
      code: 'CS 101',
      name: 'Algorithms & Data Structures',
      department: 'Computer Science',
      teacherId: 'teacher_1',
      teacherName: 'Dr. Sarah Lin',
      roomName: 'Hopper Science Center 104',
      defaultLat: 37.7752,
      defaultLng: -122.4188,
      defaultRadiusMeters: 100,
    },
  ];

  const seedEnrollments: Enrollment[] = [
    { id: 'enr_1', courseId: 'course_1', studentId: 'student_1' },
    { id: 'enr_2', courseId: 'course_1', studentId: 'student_2' },
    { id: 'enr_3', courseId: 'course_1', studentId: 'student_3' },
    { id: 'enr_4', courseId: 'course_2', studentId: 'student_1' },
  ];

  // Active open class session ready for attendance test
  const now = new Date();
  const endTime = new Date(now.getTime() + 90 * 60 * 1000); // 90 min from now
  const seedSessions: ClassSession[] = [
    {
      id: 'session_demo_1',
      courseId: 'course_1',
      courseCode: 'CS 304',
      courseName: 'Distributed Systems & Cloud',
      teacherId: 'teacher_1',
      teacherName: 'Dr. Sarah Lin',
      roomName: 'Turing Hall - Room 302',
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
      geofence: {
        lat: 37.7749,
        lng: -122.4194,
        radiusMeters: 120,
      },
      status: 'open',
      nonce: Math.random().toString(36).substring(2, 10).toUpperCase(),
      nonceExpiresAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
      createdAt: now.toISOString(),
    },
  ];

  localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
  localStorage.setItem(COURSES_KEY, JSON.stringify(seedCourses));
  localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(seedEnrollments));
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(seedSessions));
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([]));
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(seedUsers[2])); // Default to Alex Rivera (Student)
}

// Ensure seeded
if (!localStorage.getItem(USERS_KEY)) {
  seedInitialData();
}

export function getUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUser(user: UserProfile): void {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    users[idx] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // If modifying current logged in user, update current user too
  const current = getCurrentUser();
  if (current && current.id === user.id) {
    setCurrentUser(user);
  }
}

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserProfile | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function getCourses(): Course[] {
  try {
    const raw = localStorage.getItem(COURSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCourse(course: Course): void {
  const courses = getCourses();
  const idx = courses.findIndex((c) => c.id === course.id);
  if (idx >= 0) {
    courses[idx] = course;
  } else {
    courses.push(course);
  }
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
}

export function getEnrollments(): Enrollment[] {
  try {
    const raw = localStorage.getItem(ENROLLMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEnrollment(enrollment: Enrollment): void {
  const enrollments = getEnrollments();
  if (!enrollments.some((e) => e.courseId === enrollment.courseId && e.studentId === enrollment.studentId)) {
    enrollments.push(enrollment);
    localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(enrollments));
  }
}

export function removeEnrollment(courseId: string, studentId: string): void {
  const enrollments = getEnrollments().filter(
    (e) => !(e.courseId === courseId && e.studentId === studentId)
  );
  localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(enrollments));
}

export function getSessions(): ClassSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: ClassSession): void {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session);
  }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function updateSessionStatus(sessionId: string, status: 'open' | 'closed'): ClassSession | null {
  const sessions = getSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (session) {
    session.status = status;
    if (status === 'open') {
      session.nonce = Math.random().toString(36).substring(2, 10).toUpperCase();
      session.nonceExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }
    saveSession(session);
    return session;
  }
  return null;
}

export function getAttendanceRecords(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAttendanceRecord(record: AttendanceRecord): void {
  const records = getAttendanceRecords();
  // Check if student already marked for this session
  const existingIdx = records.findIndex(
    (r) => r.sessionId === record.sessionId && r.studentId === record.studentId
  );
  if (existingIdx >= 0) {
    records[existingIdx] = record;
  } else {
    records.unshift(record);
  }
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
}

export function updateAttendanceRecordStatus(
  recordId: string,
  status: 'present' | 'absent' | 'flagged',
  note?: string
): void {
  const records = getAttendanceRecords();
  const record = records.find((r) => r.id === recordId);
  if (record) {
    record.status = status;
    if (note) record.note = note;
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
  }
}

// -------------------------------------------------------------
// Encrypted Offline Sync Queue Management
// -------------------------------------------------------------

export function getOfflineEncryptedQueue(): EncryptedOfflineRecord[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function queueOfflineAttendance(
  payload: AttendanceRecord
): Promise<EncryptedOfflineRecord> {
  const { ciphertext, iv } = await encryptData(payload);
  const queue = getOfflineEncryptedQueue();

  const record: EncryptedOfflineRecord = {
    id: `enc_sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    studentId: payload.studentId,
    sessionId: payload.sessionId,
    encryptedData: ciphertext,
    iv,
    timestamp: new Date().toISOString(),
  };

  queue.push(record);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  return record;
}

export async function processOfflineEncryptedSync(): Promise<{
  syncedCount: number;
  failedCount: number;
  records: AttendanceRecord[];
}> {
  const queue = getOfflineEncryptedQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, failedCount: 0, records: [] };
  }

  const decryptedRecords: AttendanceRecord[] = [];
  const remainingQueue: EncryptedOfflineRecord[] = [];
  let failedCount = 0;

  for (const item of queue) {
    try {
      const record = await decryptData<AttendanceRecord>(item.encryptedData, item.iv);
      record.offlineSynced = true;
      saveAttendanceRecord(record);
      decryptedRecords.push(record);
    } catch (err) {
      console.error('Failed to decrypt and sync item:', err);
      failedCount++;
      remainingQueue.push(item);
    }
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
  return {
    syncedCount: decryptedRecords.length,
    failedCount,
    records: decryptedRecords,
  };
}

// -------------------------------------------------------------
// CSV Export for Administrators and Audits
// -------------------------------------------------------------

export function exportAttendanceCSV(records: AttendanceRecord[]): string {
  const headers = [
    'Attendance ID',
    'Session ID',
    'Course Code',
    'Student ID',
    'Student Name',
    'Status',
    'Method',
    'Distance (m)',
    'Face Match Score',
    'GPS Accuracy (m)',
    'Device ID',
    'Marked By',
    'Marked At',
    'Offline Synced',
    'Audit Note / Flag Reason',
  ];

  const rows = records.map((r) => [
    `"${r.id}"`,
    `"${r.sessionId}"`,
    `"${r.courseCode}"`,
    `"${r.studentSid}"`,
    `"${r.studentName}"`,
    `"${r.status.toUpperCase()}"`,
    `"${r.method}"`,
    r.distanceMeters ?? 'N/A',
    r.faceScore !== undefined ? `${(r.faceScore * 100).toFixed(1)}%` : 'N/A',
    r.accuracy ?? 'N/A',
    `"${r.deviceId || 'N/A'}"`,
    `"${r.markedByName}"`,
    `"${new Date(r.timestamp).toLocaleString()}"`,
    r.offlineSynced ? 'YES' : 'NO',
    `"${(r.note || r.flagReason || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function resetDemoData(): void {
  localStorage.clear();
  seedInitialData();
}
