import React, { useEffect, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ShieldCheck, Calendar, RefreshCw } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit-logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">System Audit Trail</h1>
          <p className="text-sm text-zinc-500 mt-1">Immutable administrative action history and security telemetry</p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-3.5 py-1.5 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-lg border border-zinc-200 shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        {logs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={ShieldCheck}
              title="No audit events recorded yet"
              description="Actions performed by administrators (creating users, publishing problems, reassigning mentors) will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Actor</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Target</th>
                  <th className="px-6 py-3.5">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-6 py-4 text-zinc-400 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-zinc-900">
                      {log.actor_email}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-[#EE3124] border border-red-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {log.target_type} {log.target_id && `(${log.target_id.slice(0, 8)}...)`}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 text-[11px] max-w-xs truncate">
                      {JSON.stringify(log.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
