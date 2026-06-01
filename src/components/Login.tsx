import React, { useState } from 'react';
import { api } from '../api';
import { Employee } from '../types';
import { ShieldCheck, UserCheck, Key, Lock, Activity, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (user: Omit<Employee, 'PINCode'>) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchedUser, setMatchedUser] = useState<Omit<Employee, 'PINCode'> | null>(null);
  const [showPin, setShowPin] = useState(false);

  // Step 1: Username Check
  async function handleVerifyUsername(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.verifyUsername(username);
      if (res.success) {
        setMatchedUser(res.employee);
        setStep(2);
      } else {
        setError(res.message || 'Username verification failed.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. User not found.');
    } finally {
      setLoading(false);
    }
  }

  // Step 2: PIN Check
  async function handleVerifyPin(e: React.FormEvent) {
    e.preventDefault();
    if (!pinCode.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.verifyPin(username, pinCode);
      if (res.success) {
        // Save to local state and trigger callback
        onLoginSuccess(res.user || res.employee);
      } else {
        setError(res.message || 'Invalid PIN Code entered.');
      }
    } catch (err: any) {
      setError(err.message || 'PIN validation failed. Try again.');
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
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 text-xs rounded-r-lg font-medium"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step1"
              id="username-form"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              onSubmit={handleVerifyUsername}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Confirm Username
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your system username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-blue-500 dark:text-slate-200"
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-confirm-username"
                disabled={loading || !username.trim()}
                className="w-full py-3 px-4 bg-gradient-to-r from-clinic-blue-600 to-clinic-blue-800 hover:brightness-105 active:scale-[0.98] text-white font-semibold rounded-xl text-sm flex items-center justify-center space-x-2 transition-all shadow-md group disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Confirm Username</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="step2"
              id="pin-form"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              onSubmit={handleVerifyPin}
              className="space-y-4"
            >
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center space-x-3 mb-2">
                <div className="h-9 w-9 flex items-center justify-center bg-clinic-blue-500 text-white font-bold rounded-lg text-xs tracking-wider">
                  {matchedUser?.FullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">
                    {matchedUser?.FullName}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Position: <span className="text-clinic-blue-600 font-medium">{matchedUser?.Position}</span>
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-change-username"
                  onClick={() => {
                    setStep(1);
                    setPinCode('');
                    setError(null);
                  }}
                  className="ml-auto text-[10px] text-clinic-blue-600 hover:underline hover:text-clinic-blue-700"
                >
                  Change User
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Secure PIN Verification
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    placeholder="Enter Secret PIN"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-blue-500 dark:text-slate-200 tracking-widest font-mono"
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-login"
                disabled={loading || pinCode.length < 1}
                className="w-full py-3 px-4 bg-gradient-to-r from-clinic-blue-600 to-clinic-blue-800 hover:brightness-105 active:scale-[0.98] text-white font-semibold rounded-xl text-sm flex items-center justify-center space-x-2 transition-all shadow-md group disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    <span>Authorize & Login</span>
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Authorized Personnel Only • IP Address and Access Audited Securly
          </p>
        </div>
      </div>
    </div>
  );
}
