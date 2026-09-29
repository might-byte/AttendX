/**
 * Local Storage Encryption for Offline Student Data Sync using Web Crypto API.
 * Uses AES-GCM 256-bit with PBKDF2 key derivation and unique 12-byte IVs.
 */

// Application master salt for local PBKDF2 derivation
const KDF_SALT = new TextEncoder().encode('AttendX-PWA-Offline-Storage-Salt-v1');
const PASS_SEED = 'attendx_secure_local_student_device_secret_2026';

let cachedKey: CryptoKey | null = null;

async function getEncryptionKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(PASS_SEED),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  cachedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: KDF_SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return cachedKey;
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypts an arbitrary object using AES-GCM 256
 */
export async function encryptData<T>(data: T): Promise<{ ciphertext: string; iv: string }> {
  try {
    const key = await getEncryptionKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedPayload = new TextEncoder().encode(JSON.stringify(data));

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encodedPayload
    );

    return {
      ciphertext: bufferToBase64(encrypted),
      iv: bufferToBase64(iv.buffer),
    };
  } catch (err) {
    console.error('Encryption failed:', err);
    throw new Error('Unable to encrypt offline payload');
  }
}

/**
 * Decrypts AES-GCM 256 ciphertext
 */
export async function decryptData<T>(ciphertext: string, ivBase64: string): Promise<T> {
  try {
    const key = await getEncryptionKey();
    const iv = new Uint8Array(base64ToBuffer(ivBase64));
    const encryptedBytes = base64ToBuffer(ciphertext);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encryptedBytes
    );

    const decoded = new TextDecoder().decode(decrypted);
    return JSON.parse(decoded) as T;
  } catch (err) {
    console.error('Decryption failed:', err);
    throw new Error('Unable to decrypt offline record. Key mismatch or data corrupted.');
  }
}
