export type UserRole = 'student' | 'teacher' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface FaceTemplate {
  embedding?: number[]; // Biometric vector
  photoPreviewUrl?: string; // Preview thumbnail
  images?: string[]; // 3 face images if submitted
  submissionType?: 'photos' | 'live_video';
  enrolledAt: string;
  sampleCount: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  sid?: string; // Student ID or Faculty ID
  phone?: string;
  program?: string; // e.g. Computer Science, Mechanical Eng.
  registeredDeviceId?: string; // Bound device fingerprint
  biometricConsent: boolean;
  biometricConsentDate?: string;
  faceSubmitted?: boolean;
  faceTemplate?: FaceTemplate;
  createdAt: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  teacherId: string;
  teacherName: string;
  roomName: string;
  scheduleTime: string; // e.g. 'Mon, Wed 09:00 - 10:30 AM'
  days: string[]; // e.g. ['Mon', 'Wed']
  startTime: string; // '09:00'
  endTime: string; // '10:30'
  defaultLat: number;
  defaultLng: number;
  defaultRadiusMeters: number;
}

export interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
}

export interface GeofenceConfig {
  lat: number;
  lng: number;
  radiusMeters: number; // typically 50 - 150m for indoor classrooms
}

export type SessionStatus = 'open' | 'closed' | 'scheduled';

export interface ClassSession {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  roomName: string;
  startTime: string;
  endTime: string;
  geofence: GeofenceConfig;
  status: SessionStatus;
  nonce: string; // short-lived random token
  nonceExpiresAt: string;
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'flagged';
export type AttendanceMethod = 'self' | 'manual';

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  courseId: string;
  courseCode: string;
  studentId: string;
  studentName: string;
  studentSid: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  lat?: number;
  lng?: number;
  accuracy?: number; // GPS accuracy in meters
  distanceMeters?: number; // Distance from classroom center
  faceScore?: number; // Similarity match score (0.0 to 1.0)
  markedBy: string; // 'self' or teacher user id
  markedByName: string;
  timestamp: string;
  note?: string; // Audit reason if manual override
  flagReason?: string; // Reason if flagged (e.g. device mismatch, suspicious location)
  deviceId?: string;
  offlineSynced?: boolean;
}

export interface EncryptedOfflineRecord {
  id: string;
  studentId: string;
  sessionId: string;
  encryptedData: string; // AES-GCM ciphertext
  iv: string; // Base64 Initialization Vector
  timestamp: string;
}

export type LivenessChallengeType = 
  | 'blink'
  | 'turn_left'
  | 'turn_right'
  | 'smile'
  | 'tilt_up';

export interface LivenessChallenge {
  id: string;
  type: LivenessChallengeType;
  prompt: string;
  iconName: string;
}
