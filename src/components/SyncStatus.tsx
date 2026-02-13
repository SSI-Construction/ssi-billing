import React from 'react';
import { useObservable } from 'dexie-react-hooks';
import { Cloud, CloudOff, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { db, isCloudEnabled } from '../store/db';

export const SyncStatus: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  if (!isCloudEnabled) return null;

  const syncState = useObservable(db.cloud.syncState);
  const wsStatus = useObservable(db.cloud.webSocketStatus);

  const phase = syncState?.phase;
  const isOnline = wsStatus === 'connected';

  let icon: React.ReactNode;
  let label: string;
  let colorClass: string;

  if (phase === 'pushing' || phase === 'pulling') {
    icon = <RefreshCw size={14} className="animate-spin" />;
    label = 'Syncing...';
    colorClass = 'text-blue-300';
  } else if (phase === 'error') {
    icon = <CloudOff size={14} />;
    label = 'Sync error';
    colorClass = 'text-red-400';
  } else if (!isOnline) {
    icon = <WifiOff size={14} />;
    label = 'Offline';
    colorClass = 'text-yellow-400';
  } else if (phase === 'in-sync') {
    icon = <Cloud size={14} />;
    label = 'Synced';
    colorClass = 'text-green-400';
  } else {
    icon = <Wifi size={14} />;
    label = 'Connected';
    colorClass = 'text-green-400';
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 ${colorClass}`}
      title={label}
    >
      {icon}
      {!collapsed && <span className="text-xs">{label}</span>}
    </div>
  );
};
