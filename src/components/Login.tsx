import React, { useState } from 'react';
import { api } from '../api';
import { Employee } from '../types';
import { ShieldCheck, UserCheck, Key, Lock, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (user: Omit<Employee, 'PINCode'>) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [uniqueId, setUniqueId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Single Step Login: Unique ID
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!uniqueId.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.verifyUsername(uniqueId.trim());
      if (res.success) {
        // Since verifyUsername now handles complete verification in a single step,
        // it returns the fully validated user profile. Bypassing PIN Code check checks out.
        onLoginSuccess(res.user || res.employee);
      } else {
        setError(res.message || 'Login verification failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid Unique ID. User profile not found.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-700 to-lime-650 px-4 transition-colors duration-300">
      <div className="absolute top-4 left-4 flex items-center space-x-2 text-white no-print">
        <img src="https://www.image2url.com/r2/default/images/1779782151932-e0fcc309-3ed7-4c15-a3fa-1859006492a3.png" alt="St. Francis Logo" className="h-6 w-6 object-contain" referrerPolicy="no-referrer" />
        <span className="font-sans font-bold text-lg tracking-tight text-white dropdown-shadow-sm">SAINT FRANCIS CLINIC</span>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 transition-all relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-clinic-blue-600 via-clinic-blue-400 to-clinic-blue-800" />

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl mb-3 border border-slate-100 dark:border-slate-700 shadow-xs">
            <img src="https://www.image2url.com/r2/default/images/1779782151932-e0fcc309-3ed7-4c15-a3fa-1859006492a3.png" alt="St. Francis Logo" className="h-16 w-16 object-contain" referrerPolicy="no-referrer" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-slate-800 dark:text-slate-100">
            Employee Web Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Group Records & Survey Management System
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            initial-y={0}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 text-xs rounded-r-lg font-medium"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.form
            key="loginForm"
            id="login-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleLogin}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Unique Login ID
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter Username or Employee ID"
                  value={uniqueId}
                  onChange={(e) => setUniqueId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-blue-500 dark:text-slate-200"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              disabled={loading || !uniqueId.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-clinic-blue-600 to-clinic-blue-800 hover:brightness-105 active:scale-[0.98] text-white font-semibold rounded-xl text-sm flex items-center justify-center space-x-2 transition-all shadow-md group disabled:opacity-50 cursor-pointer text-center"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Authorize & Login</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </button>
          </motion.form>
        </AnimatePresence>

        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Authorized Personnel Only • IP Address and Access Audited Securely
          </p>
        </div>
      </div>
    </div>
  );
}
