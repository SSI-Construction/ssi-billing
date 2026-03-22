import React from 'react';
import { Cloud } from 'lucide-react';

export const SyncStatus: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 text-green-400"
      title="Connected to Supabase"
    >
      <Cloud size={14} />
      {!collapsed && <span className="text-xs">Connected</span>}
    </div>
  );
};
