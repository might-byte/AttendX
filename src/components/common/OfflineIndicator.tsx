import React, { useState, useEffect } from 'react';
import { WifiOff, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { getOfflineEncryptedQueue, processOfflineEncryptedSync } from '../../services/storageService';

interface OfflineIndicatorProps {
  onSyncComplete?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onSyncComplete }) => {
  const isOnline = useOnlineStatus();
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const refreshQueue = () => {
    const queue = getOfflineEncryptedQueue();
    setQueueCount(queue.length);
  };

  useEffect(() => {
    refreshQueue();
    const interval = setInterval(refreshQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  // When connection switches back to online, automatically prompt or attempt sync
  useEffect(() => {
    if (isOnline && queueCount > 0) {
      handleSync();
    }
  }, [isOnline]);

  const handleSync = async () => {
    if (queueCount === 0 || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await processOfflineEncryptedSync();
      refreshQueue();
      if (res.syncedCount > 0) {
        setSyncFeedback(`Decrypted & synced ${res.syncedCount} attendance record${res.syncedCount > 1 ? 's' : ''}`);
        onSyncComplete?.();
        setTimeout(() => setSyncFeedback(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setSyncFeedback('Sync error. Will retry.');
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  // If online and nothing queued and no feedback, do not clutter UI (KISS)
  if (isOnline && queueCount === 0 && !syncFeedback) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center justify-between sm:justify-start gap-3 rounded-xl bg-slate-900/95 text-white px-4 py-2.5 shadow-xl backdrop-blur-md border border-slate-700/80 text-xs sm:text-sm animate-in slide-in-from-bottom-3">
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <span className="flex items-center gap-1.5 text-amber-400 font-medium">
            <WifiOff className="w-4 h-4 animate-pulse" />
            Offline Mode
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Back Online
          </span>
        )}

        {queueCount > 0 && (
          <span className="inline-flex items-center gap-1 bg-blue-950/80 text-blue-300 px-2 py-0.5 rounded-full text-xs border border-blue-800">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            {queueCount} AES-GCM Encrypted
          </span>
        )}
      </div>

      {syncFeedback && (
        <span className="text-emerald-300 text-xs hidden sm:inline">
          {syncFeedback}
        </span>
      )}

      {queueCount > 0 && isOnline && (
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-2.5 py-1 rounded-lg text-xs cursor-pointer transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Decrypting...' : 'Sync Now'}
        </button>
      )}
    </div>
  );
};
