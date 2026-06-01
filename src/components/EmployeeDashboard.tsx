import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Employee, Group, ClinicRecord } from '../types';
import {
  FileSpreadsheet,
  Coins,
  PlusCircle,
  HelpCircle,
  ClipboardCheck,
  Shield,
  Activity,
  AlertTriangle,
  FileCheck,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmployeeDashboardProps {
  user: Omit<Employee, 'PINCode'>;
  onRecordAdded?: () => void;
}

export default function EmployeeDashboard({ user, onRecordAdded }: EmployeeDashboardProps) {
  const isLeader = user.Position === 'Leader';

  const [assignedGroups, setAssignedGroups] = useState<Group[]>([]);
  const [records, setRecords] = useState<ClinicRecord[]>([]);
  const [lastSettlementDate, setLastSettlementDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State for Record Entry Module (Only for Leaders)
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [houseNumber, setHouseNumber] = useState('1');
  const [personCount, setPersonCount] = useState<number>(1);
  const [remarks, setRemarks] = useState('');
  
  const [submissionStatus, setSubmissionStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load user data
  const loadData = async () => {
    setLoading(true);
    try {
      const allGroups = await api.getGroups(user.EmployeeID);
      const allRecords = await api.getRecords(user.EmployeeID);

      // Find groups where this user is either Leader or listed in CoLeaderIDs
      const myGroups = allGroups.filter((g: Group) => 
        g.LeaderID === user.EmployeeID || g.CoLeaderIDs.includes(user.EmployeeID)
      );
      setAssignedGroups(myGroups);

      if (myGroups.length > 0) {
        setSelectedGroupId(myGroups[0].GroupID);
      }

      // Filter records relevant to this user's groups to keep only Unpaid (Active) ones
      const myGroupIds = myGroups.map((g: Group) => g.GroupID);
      const activeUnpaid = allRecords.filter((r: ClinicRecord) => 
        myGroupIds.includes(r.GroupID) && !r.IsPaid
      );
      setRecords(activeUnpaid);

      // Find the latest settlement/coverage date from paid records in our assigned groups
      const paidRecords = allRecords.filter((r: ClinicRecord) => 
        myGroupIds.includes(r.GroupID) && !!r.IsPaid
      );
      if (paidRecords.length > 0) {
        const dates = paidRecords.map(r => r.CreatedDate.split('T')[0]);
        dates.sort();
        setLastSettlementDate(dates[dates.length - 1]);
      } else {
        setLastSettlementDate(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.EmployeeID]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-clinic-blue-600 border-t-transparent" />
      </div>
    );
  }

  // Active group variables
  const currentActiveGroup = assignedGroups.find(g => g.GroupID === selectedGroupId) || assignedGroups[0];
  const payoutRate = currentActiveGroup?.PayoutRate || 0;
  const calculatedPayout = personCount * payoutRate;

  // Stats cards
  const totalSubmissions = records.filter(r => r.GroupID === currentActiveGroup?.GroupID).length;
  const totalPayoutFormatted = records
    .filter(r => r.GroupID === currentActiveGroup?.GroupID)
    .reduce((sum, r) => sum + r.TotalPayout, 0)
    .toLocaleString();

  // Handle Form Submission
  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !houseNumber.trim() || personCount < 1) {
      setSubmissionStatus({ type: 'error', message: 'Please complete all required entries.' });
      return;
    }

    setSubmitting(true);
    setSubmissionStatus(null);
    try {
      const res = await api.createRecord({
        GroupID: selectedGroupId,
        LeaderID: user.EmployeeID,
        HouseNumber: houseNumber,
        PersonCount: personCount,
        Remarks: remarks
      }, user.EmployeeID);

      if (res.success) {
        setSubmissionStatus({
          type: 'success',
          message: `House survey saved successfully! Total Payout generated: ₱${calculatedPayout.toLocaleString()}`
        });
        
        // Reset inputs
        setHouseNumber('1');
        setPersonCount(1);
        setRemarks('');
        
        // Reload data
        loadData();
        if (onRecordAdded) onRecordAdded();
      } else {
        setSubmissionStatus({ type: 'error', message: res.message || 'Failed to record entry.' });
      }
    } catch (err: any) {
      setSubmissionStatus({ type: 'error', message: err.message || 'Failed to submit.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome header with dynamic status tags */}
      <div className="bg-gradient-to-r from-clinic-blue-600 to-clinic-blue-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute right-0 top-0 h-32 w-32 bg-white/5 rounded-full -mr-8 -mt-8" />
        <div className="absolute left-1/3 bottom-0 h-24 w-24 bg-white/5 rounded-full -ml-8 -mb-8" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold tracking-wider mb-2.5 uppercase border border-white/5">
              <Shield className="h-3.5 w-3.5" />
              <span>ST. FRANCIS PORTAL • {user.Position} ACCESS</span>
            </div>
            <h1 className="text-2xl font-black font-heading tracking-tight">
              Welcome Back, {user.FullName}
            </h1>
            <p className="text-xs text-clinic-blue-100 mt-1 max-w-xl">
              Survey data registered inside your active session is securely stored and synchronized natively with administrative panels.
            </p>
          </div>

          <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/5 flex flex-col md:items-end justify-center min-w-[200px]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-clinic-blue-200">Account Health</span>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-clinic-green-500 animate-ping" />
              <span className="text-sm font-bold text-clinic-green-50">Operational (Active)</span>
            </div>
            <span className="text-[9px] text-clinic-blue-100 font-mono mt-1">{user.ContactNumber}</span>
          </div>
        </div>
      </div>

      {assignedGroups.length === 0 ? (
        <div className="p-8 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-heading">No Group Assigned</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            You are currently not assigned to any active clinic survey groups. Please contact Admin Director to request a field team allocation.
          </p>
        </div>
      ) : (
        <>
          {/* Active survey team selectors & summary cards */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Select Active Survey Team</h2>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="mt-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-clinic-blue-500"
              >
                {assignedGroups.map(g => (
                  <option key={g.GroupID} value={g.GroupID}>
                    {g.GroupName} ({g.GroupCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Assigned Group */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Registered Team</span>
              <h3 className="text-sm font-bold text-slate-850 dark:text-white font-heading mt-2 truncate">{currentActiveGroup?.GroupName}</h3>
              <p className="text-[10px] text-clinic-blue-600 font-mono font-bold uppercase mt-1">{currentActiveGroup?.GroupCode}</p>
            </div>

            {/* Cycle Start Display */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm opacity-95">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Current Cycle Started On</span>
              <h3 className="text-sm font-bold text-clinic-blue-600 dark:text-clinic-blue-400 font-heading mt-2 font-mono">
                {lastSettlementDate 
                  ? new Date(new Date(lastSettlementDate).getTime() + 24*60*60*1000).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'Initial Launch Date'}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                {lastSettlementDate 
                  ? `Cycle resumed after settlement on ${new Date(lastSettlementDate).toLocaleDateString()}`
                  : 'All registered entries are active for payout'}
              </p>
            </div>

            {/* Total Records Submitted */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Records Saved</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">{totalSubmissions}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Surveys recorded in active group</p>
            </div>

            {/* Current Payout Rate */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Payout Value</span>
              <h3 className="text-2xl font-black text-clinic-green-600 mt-2">₱{payoutRate} <span className="text-xs font-normal text-slate-400">/ person</span></h3>
              <p className="text-[10px] text-slate-400 mt-1">Calculated: ₱{totalPayoutFormatted} total</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Record Entry Module (Only Leader can edit) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-sm p-6 relative">
                <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-slate-50 dark:border-slate-800">
                  <PlusCircle className="text-clinic-blue-600 h-5 w-5" />
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-heading">Record Entry Module</h2>
                  {!isLeader && (
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-amber-50 dark:bg-slate-800 text-amber-600 border border-amber-100 dark:border-slate-800 rounded uppercase">
                      Co-Leader Locked
                    </span>
                  )}
                </div>

                {!isLeader ? (
                  <div className="py-8 text-center bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-150 dark:border-slate-800">
                    <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Submission Blocked</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                      Only the designated Employee Leader is authorized to submit new survey records. Co-Leaders have strictly read-only authorization.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitSurvey} className="space-y-4">
                    {submissionStatus && (
                      <div className={`p-3.5 rounded-xl border text-xs font-medium ${
                        submissionStatus.type === 'success' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900' 
                          : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-900'
                      }`}>
                        {submissionStatus.message}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Auto generated info */}
                      <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Auto Group Information</span>
                        
                        <div>
                          <span className="block text-[10px] text-slate-500">Group Name</span>
                          <span className="text-slate-800 dark:text-slate-200 text-xs font-semibold">{currentActiveGroup?.GroupName}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500">Assignee Leader</span>
                          <span className="text-slate-800 dark:text-slate-200 text-xs font-semibold">{user.FullName}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500">Submission Date</span>
                          <span className="text-slate-800 dark:text-slate-200 text-xs font-semibold font-mono">{new Date().toISOString().split('T')[0]}</span>
                        </div>
                      </div>

                      {/* Entry info fields */}
                      <div className="space-y-3.5">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Entry Information</span>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">Population Count *</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={personCount}
                            onChange={(e) => setPersonCount(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500 dark:text-white font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Remarks / Survey Description</label>
                      <textarea
                        rows={2}
                        placeholder="Add secondary comments regarding age, clinic needs, or medication requests here..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500 dark:text-white"
                      />
                    </div>

                    {/* Auto Calculation Panel */}
                    <div className="p-4 bg-clinic-green-50/50 dark:bg-emerald-950/10 border border-clinic-green-500/20 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium">Automatic Payout Calculation</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {personCount} Person(s) × ₱{payoutRate} Payout Rate Value
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-mono">Grand Total</span>
                        <span className="text-lg font-black text-clinic-green-600 font-heading">
                          ₱{calculatedPayout.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      id="btn-submit-record"
                      disabled={submitting}
                      className="w-full py-2.5 px-4 bg-clinic-blue-600 hover:bg-clinic-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
                    >
                      {submitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <ClipboardCheck className="h-4.5 w-4.5" />
                          <span>Submit Field Record to Sheets</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Side guidance card */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <Activity className="h-4 w-4 text-clinic-green-600" />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 font-heading">Secure Survey Practices</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Always inspect the complete physical household prior to submitting survey person counts.
                </p>
                <div className="mt-4 space-y-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Assigned Payout</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">₱{payoutRate} per person</span>
                  </div>
                  <div className="flex justify-between text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-900">
                    <span className="text-slate-400">Verification</span>
                    <span className="font-bold text-clinic-green-600">Secure (PID Authed)</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Authorized Duty Code</span>
                <p className="text-xs font-mono font-semibold text-clinic-blue-600 uppercase mt-1 leading-none">
                  {currentActiveGroup?.GroupCode || 'STF-MAIN'}
                </p>
                <p className="text-[10px] text-slate-400 mt-2">
                  Use this group designation code to verify physical forms.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
