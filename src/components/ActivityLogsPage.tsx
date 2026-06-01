import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { ActivityLog } from '../types';
import { History, Shield, Clock, Search, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getLogs();
      setLogs(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.Activity.toLowerCase().includes(search.toLowerCase()) ||
      l.UserID.toLowerCase().includes(search.toLowerCase()) ||
      l.IPAddress.includes(search) ||
      l.LogID.toLowerCase().includes(search.toLowerCase())
  );

  const handleClearLogs = async () => {
    const confirmClear = window.confirm(
      "Are you sure you want to permanently delete all system audit logs? This action is irreversible."
    );
    if (!confirmClear) return;

    try {
      setLoading(true);
      await api.clearLogs();
      await fetchLogs();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to clear logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-800 dark:text-slate-100">
            System Audit Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse cryptographic tracking hashes for system actions, employee logins, and survey edits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-105 active:scale-[0.98] dark:bg-red-950/20 dark:hover:bg-red-950/45 text-red-650 dark:text-red-400 border border-red-100 dark:border-red-900/40 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
              id="clear-logs-btn"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Audit Trail</span>
            </button>
          )}
          <button
            onClick={fetchLogs}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-slate-600 dark:text-slate-400 transition-all shadow-sm cursor-pointer"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder="Search audit trail by action keywords, specific Employee IDs, or IP locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500"
          />
        </div>

        {/* Audit Log Table */}
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-clinic-blue-600 border-t-transparent" />
          </div>
        ) : (
          <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs bg-white dark:bg-slate-900 min-w-[600px]">
              <thead className="bg-slate-50 dark:bg-slate-950/45 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Track ID</th>
                  <th className="px-6 py-4">Recorded Action / Event</th>
                  <th className="px-6 py-4">IP Node</th>
                  <th className="px-6 py-4">Execution Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredLogs.map((log) => (
                  <tr key={log.LogID} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20">
                    <td className="px-6 py-4 font-mono text-clinic-blue-600 font-semibold">{log.LogID}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">{log.Activity}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{log.IPAddress}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">
                      {new Date(log.DateTime).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                      No security audit records match specified searches.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
