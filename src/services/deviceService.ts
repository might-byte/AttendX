/**
 * Device binding service:
 * Binds student accounts to a registered device token / fingerprint
 * to prevent proxy attendance where one device is passed around to mark for multiple students.
 */

const DEVICE_ID_KEY = 'attendx_device_binding_token';

export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    // Generate high-entropy hardware & device signature
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const cores = navigator.hardwareConcurrency || 4;
    const randomSalt = Math.random().toString(36).substring(2, 10);
    
    deviceId = `DEV-${btoa(`${screenInfo}|${tz}|${cores}`).substring(0, 10)}-${randomSalt}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function checkDeviceBinding(studentRegisteredDeviceId?: string): {
  isMatch: boolean;
  currentDeviceId: string;
  expectedDeviceId?: string;
} {
  const currentDeviceId = getOrCreateDeviceId();
  if (!studentRegisteredDeviceId) {
    // Not bound yet; will be bound on first enrollment
    return { isMatch: true, currentDeviceId };
  }

  const isMatch = studentRegisteredDeviceId === currentDeviceId;
  return {
    isMatch,
    currentDeviceId,
    expectedDeviceId: studentRegisteredDeviceId,
  };
}
