import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { ClinicRecord, Employee, Group } from '../types';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  Printer,
  Edit,
  Trash2,
  Calendar,
  Layers,
  AlertCircle,
  Clock,
  UserCheck,
  RefreshCw,
  X,
  FileText,
  Coins,
  CheckCircle,
  PlusCircle
} from 'lucide-react';

interface RecordsPageProps {
  user: Omit<Employee, 'PINCode'>;
  isPaidView?: boolean;
}

export default function RecordsPage({ user, isPaidView }: RecordsPageProps) {
  const isAdmin = user.Position === 'Admin';
  const isLeader = user.Position === 'Leader';
  const isPaid = isPaidView ?? false;

  const [records, setRecords] = useState<ClinicRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Bulk Payment States
  const [payFromDate, setPayFromDate] = useState('');
  const [payToDate, setPayToDate] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Editing state for Leader
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ClinicRecord | null>(null);
  const [editHouseNo, setEditHouseNo] = useState('');
  const [editPersonCount, setEditPersonCount] = useState<number>(1);
  const [editRemarks, setEditRemarks] = useState('');
  const [updating, setUpdating] = useState(false);

  // Admin add survey states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSelectedGroupId, setAddSelectedGroupId] = useState('');
  const [addPersonCount, setAddPersonCount] = useState<number>(1);
  const [addRemarks, setAddRemarks] = useState('');
  const [addingSurveyError, setAddingSurveyError] = useState<string | null>(null);
  const [addingSurvey, setAddingSurvey] = useState(false);

  // Submit new survey (Admins)
  const handleAddSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSelectedGroupId) return;

    const chosenGroup = groups.find(g => g.GroupID === addSelectedGroupId);
    if (!chosenGroup) return;

    setAddingSurvey(true);
    setAddingSurveyError(null);
    try {
      const res = await api.createRecord({
        GroupID: addSelectedGroupId,
        LeaderID: chosenGroup.LeaderID, // Default Leader assigned to the group is the assigned staff
        HouseNumber: 'Admin Survey',
        PersonCount: addPersonCount,
        Remarks: addRemarks.trim() || 'Admin added survey'
      }, user.EmployeeID);

      if (res.success) {
        setIsAddModalOpen(false);
        setAddSelectedGroupId('');
        setAddPersonCount(1);
        setAddRemarks('');
        loadData();
      }
    } catch (err: any) {
      console.error(err);
      setAddingSurveyError(err.message || 'An error occurred while adding the survey.');
    } finally {
      setAddingSurvey(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const allRecords = await api.getRecords(user.EmployeeID);
      const allEmps = await api.getEmployees();
      const allGroups = await api.getGroups(user.EmployeeID);

      // Enforce Role boundaries for viewing
      if (isAdmin) {
        setEmployees(allEmps);
        setGroups(allGroups);
        const matchesPaidTarget = allRecords.filter((r: ClinicRecord) => {
          return isPaid ? !!r.IsPaid : !r.IsPaid;
        });
        setRecords(matchesPaidTarget);
      } else {
        // Find user assigned groups (either as leader or co-leader)
        const myGroups = allGroups.filter((g: Group) => 
          g.LeaderID === user.EmployeeID || g.CoLeaderIDs.includes(user.EmployeeID)
        );
        setGroups(myGroups);
        const myGroupIds = myGroups.map((g: Group) => g.GroupID);
        
        // Filter records strictly to assigned groups and the designated payment view (Active vs. Paid)
        const filtered = allRecords.filter((r: ClinicRecord) => 
          myGroupIds.includes(r.GroupID) && (isPaid ? !!r.IsPaid : !r.IsPaid)
        );
        setRecords(filtered);

        // Filter employees to only those assigned to their groups
        const myGroupStaffIds = new Set<string>();
        myGroups.forEach(g => {
          myGroupStaffIds.add(g.LeaderID);
          g.CoLeaderIDs.forEach(id => myGroupStaffIds.add(id));
        });
        const myEmployees = allEmps.filter(e => myGroupStaffIds.has(e.EmployeeID));
        setEmployees(myEmployees);
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

  // Handle Edit Trigger
  const handleOpenEdit = (rec: ClinicRecord) => {
    setSelectedRecord(rec);
    setEditHouseNo(rec.HouseNumber);
    setEditPersonCount(rec.PersonCount);
    setEditRemarks(rec.Remarks);
    setIsEditModalOpen(true);
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setUpdating(true);
    try {
      const res = await api.updateRecord(selectedRecord.RecordID, {
        HouseNumber: editHouseNo,
        PersonCount: editPersonCount,
        Remarks: editRemarks
      }, user.EmployeeID);

      if (res.success) {
        setIsEditModalOpen(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  // Handle Delete Trigger
  const handleDeleteRecord = async (recId: string) => {
    if (!confirm('Are you sure you want to delete this field record permanently? This will reconcile automatically in Google Sheets.')) {
      return;
    }
    try {
      const res = await api.deleteRecord(recId, user.EmployeeID);
      if (res.success) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcessPayment = async () => {
    if (!payFromDate || !payToDate) return;
    
    const confirmMsg = `Are you sure you want to process settlement ("Payed") for all survey records covering the dates ${payFromDate} to ${payToDate}?\n\nThis will permanently migrate them to the Paid Registry ledger and clear them from active registries.`;
    if (!confirm(confirmMsg)) return;

    setIsPaying(true);
    setPaymentSuccessMsg(null);
    try {
      const res = await api.payRecords(payFromDate, payToDate, user.EmployeeID);
      if (res.success) {
        if (res.count > 0) {
          setPaymentSuccessMsg(`Success! Settled ${res.count} surveys between ${payFromDate} and ${payToDate}. Total payout value: ₱${res.totalPaid.toLocaleString()}.`);
        } else {
          setPaymentSuccessMsg(`No unpaid records found matching the target dates ${payFromDate} to ${payToDate}.`);
        }
        setPayFromDate('');
        setPayToDate('');
        loadData();
      } else {
        alert(res.message || 'Payment reconciliation failed.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'An error occurred during payment processing.');
    } finally {
      setIsPaying(false);
    }
  };

  // Filter lists based on inputs
  const filteredRecords = records.filter(rec => {
    // Group mapping
    const group = groups.find(g => g.GroupID === rec.GroupID);
    const groupName = group ? group.GroupName : '';
    const groupCode = group ? group.GroupCode : '';

    // Search query matches date, house number, or group name/code
    const matchesSearch = 
      rec.HouseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      groupCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.CreatedDate.split('T')[0].includes(searchQuery);

    // Filter selects matches
    const matchesGroup = filterGroup === '' || rec.GroupID === filterGroup;
    const matchesEmployee = filterEmployee === '' || rec.LeaderID === filterEmployee;
    
    // Date Range matches
    let matchesDate = true;
    const recordDateStr = rec.CreatedDate.split('T')[0];
    if (filterStartDate) {
      matchesDate = matchesDate && recordDateStr >= filterStartDate;
    }
    if (filterEndDate) {
      matchesDate = matchesDate && recordDateStr <= filterEndDate;
    }

    return matchesSearch && matchesGroup && matchesEmployee && matchesDate;
  });

  // Export functions
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "RecordID,GroupID,GroupCode,LeaderName,HouseNumber,PersonCount,PayoutRate,TotalPayout,CreatedDate,Remarks,IsPaid,PaidDate\n";
    
    filteredRecords.forEach(rec => {
      const g = groups.find(grp => grp.GroupID === rec.GroupID);
      const groupCode = g ? g.GroupCode : '';
      const leader = employees.find(e => e.EmployeeID === rec.LeaderID);
      const leaderName = leader ? leader.FullName : 'Unknown';
      const cleanRemarks = rec.Remarks.replace(/"/g, '""');
      const isPaidFlag = rec.IsPaid ? 'TRUE' : 'FALSE';
      const paidDateVal = rec.PaidDate || '';

      csvContent += `"${rec.RecordID}","${rec.GroupID}","${groupCode}","${leaderName}","${rec.HouseNumber}",${rec.PersonCount},${rec.PayoutRate},${rec.TotalPayout},"${rec.CreatedDate}","${cleanRemarks}","${isPaidFlag}","${paidDateVal}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const prefix = isPaid ? 'Paid_Ledger' : 'Active_Registry';
    link.setAttribute("download", `Saint_Francis_${prefix}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const getLeaderName = (id: string) => {
    const leader = employees.find(e => e.EmployeeID === id);
    return leader ? leader.FullName : 'Unknown';
  };

  const getGroupName = (id: string) => {
    const g = groups.find(grp => grp.GroupID === id);
    return g ? `${g.GroupName} (${g.GroupCode})` : 'Unknown Group';
  };

  const selectedGroupObj = groups.find(g => g.GroupID === addSelectedGroupId);
  const currentRate = selectedGroupObj ? selectedGroupObj.PayoutRate : 0;
  const computedPayout = currentRate * addPersonCount;
  
  const assignedStaffObj = selectedGroupObj 
    ? employees.find(e => e.EmployeeID === selectedGroupObj.LeaderID)
    : null;
  const assignedStaffName = assignedStaffObj ? assignedStaffObj.FullName : 'No Leader Assigned';

  return (
    <div className="space-y-6">
      {/* Top Notification Banner */}
      {paymentSuccessMsg && (
        <div className="bg-emerald-600 dark:bg-emerald-900 border border-emerald-500 text-white rounded-2xl p-4 flex items-start justify-between shadow-xl text-xs leading-relaxed animate-in slide-in-from-top-4 duration-305 no-print">
          <div className="flex items-center space-x-2.5">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-200 animate-bounce" />
            <div>
              <p className="font-bold tracking-wide uppercase text-[10px] text-emerald-200">Reconciliation Action</p>
              <p className="font-semibold">{paymentSuccessMsg}</p>
            </div>
          </div>
          <button onClick={() => setPaymentSuccessMsg(null)} className="hover:bg-emerald-700/50 p-1 rounded-lg cursor-pointer">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-800 dark:text-slate-100 uppercase tracking-tight">
            {isPaid 
              ? (isAdmin ? 'Paid Surveys Registry' : 'Group Paid Surveys') 
              : (isAdmin ? 'All Field Survey Registry' : 'Active Group Surveys')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isPaid 
              ? 'Archived logbook of fully processed clinic survey submissions and settlements.' 
              : 'Browse active survey entry records, search by house index ranges, and reconcile payout rates.'}
          </p>
        </div>

        {/* Exports Panel */}
        <div className="flex gap-2.5">
          {isAdmin && !isPaid && (
            <button
              onClick={() => {
                setAddSelectedGroupId('');
                setAddPersonCount(1);
                setAddRemarks('');
                setAddingSurveyError(null);
                setIsAddModalOpen(true);
              }}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:brightness-105 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-500/15 cursor-pointer no-print"
              id="admin-btn-add-survey"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Survey</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 border border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-clinic-blue-600 hover:bg-clinic-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-clinic-blue-500/15 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Sheet PDF</span>
          </button>
        </div>
      </div>

      {/* Admin Payout Tool (Active View Only) */}
      {isAdmin && !isPaid && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-500/20 dark:border-emerald-800 p-5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs no-print">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-emerald-850 dark:text-emerald-450 flex items-center gap-1.5 font-heading uppercase tracking-wide">
              <Coins className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              Process Payout Settlement
            </h4>
            <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400/80">
              Select a calendar range. Click the "**Payed**" button to migrate active clinic surveys to the **Paid Registry** ledger.
            </p>
          </div>
          
          <div className="flex flex-wrap items-end gap-3 font-mono">
            <div>
              <label className="block text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1.5">From Date</label>
              <input
                type="date"
                value={payFromDate}
                onChange={(e) => setPayFromDate(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-805 text-xs text-slate-800 dark:text-white rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1.5">To Date</label>
              <input
                type="date"
                value={payToDate}
                onChange={(e) => setPayToDate(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-805 text-xs text-slate-800 dark:text-white rounded-xl"
              />
            </div>
            <button
              onClick={handleProcessPayment}
              disabled={isPaying || !payFromDate || !payToDate}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 disabled:pointer-events-none text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
            >
              {isPaying ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
              <span>Payed</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4 no-print">
        {/* Row 1: Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-slate-400 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder={isPaid ? "Search paid record logs by group code, barangay name, or date..." : "Search active surveys by group leader, or date (YYYY-MM-DD)..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-804 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500"
          />
        </div>

        {/* Row 2: Advanced filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1.5">
          {/* Select Group */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Barangay Group</label>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-755 dark:text-white rounded-xl focus:outline-none"
            >
              <option value="">-- All Active Groups --</option>
              {groups.map(g => (
                <option key={g.GroupID} value={g.GroupID}>{g.GroupName} ({g.GroupCode})</option>
              ))}
            </select>
          </div>

          {/* Select Employee Leader */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Survey Leader</label>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-755 dark:text-white rounded-xl focus:outline-none"
            >
              <option value="">-- All Field Staff --</option>
              {employees.filter(e => e.Position === 'Leader').map(emp => (
                <option key={emp.EmployeeID} value={emp.EmployeeID}>{emp.FullName}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Date Range Start</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-755 dark:text-white font-mono rounded-xl focus:outline-none"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Date Range End</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-755 dark:text-white font-mono rounded-xl focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Records Table Print Container */}
      {loading ? (
        <div className="flex justify-center items-center h-48 no-print">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-clinic-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden print-card">
          <div className="hidden print:block p-6 border-b border-slate-200 mb-4">
            <h2 className="text-xl font-bold uppercase font-heading text-slate-900">Saint Francis Clinic Systems Report</h2>
            <p className="text-xs text-slate-500 mt-1">Generated: {new Date().toLocaleString()} | Staff: {user.FullName} ({user.Position})</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/45 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 no-print">Survey Code ID</th>
                  <th className="px-6 py-4 uppercase">
                    <span className="print:hidden">Group/Barangay Name</span>
                    <span className="hidden print:inline-block">Group Name</span>
                  </th>
                  <th className="px-6 py-4 text-center uppercase">Population Count</th>
                  <th className="px-6 py-4 text-center uppercase">Current Rate</th>
                  <th className="px-6 py-4 text-right uppercase">Computed Payout</th>
                  <th className="px-6 py-4 uppercase">Assigned Staff</th>
                  <th className="px-6 py-4 no-print">Created Date</th>
                  <th className="px-6 py-4 no-print text-right uppercase">{isPaid ? 'Settlement Status' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((rec) => {
                  const g = groups.find(grp => grp.GroupID === rec.GroupID);
                  const isOwnRecord = rec.LeaderID === user.EmployeeID;
                  return (
                    <tr key={rec.RecordID} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20">
                      <td className="px-6 py-4 font-mono font-bold text-clinic-blue-600 no-print">{rec.RecordID}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-250 truncate max-w-sm">
                        {getGroupName(rec.GroupID)}
                        {rec.Remarks && (
                          <div className="text-[10px] font-normal text-slate-400 mt-0.5 max-w-xs truncate no-print" title={rec.Remarks}>
                            {rec.Remarks}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-805 dark:text-white">{rec.PersonCount} person(s)</td>
                      <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-455">₱{rec.PayoutRate}</td>
                      <td className="px-6 py-4 text-right font-black text-clinic-green-600">₱{rec.TotalPayout.toLocaleString()}</td>
                      <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">{getLeaderName(rec.LeaderID)}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-450 font-mono text-[10px] no-print">
                        {new Date(rec.CreatedDate).toISOString().replace('T', ' ').slice(0, 19)}
                      </td>
                      <td className="px-6 py-4 no-print text-right">
                        {isPaid ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40">
                            PAYED ({new Date(rec.PaidDate || rec.CreatedDate).toLocaleDateString()})
                          </span>
                        ) : (
                          <div className="flex items-center justify-end space-x-2">
                            {/* Leader can update/delete their OWN records. Admins also can edit any block */}
                            {(isAdmin || (isLeader && isOwnRecord)) && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(rec)}
                                  className="p-1 text-clinic-blue-600 hover:bg-clinic-blue-50 dark:hover:bg-slate-800 rounded transition-all cursor-pointer"
                                  title="Edit Record values"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteRecord(rec.RecordID)}
                                  className="p-1 text-red-650 hover:bg-red-50 dark:hover:bg-slate-850 rounded transition-all cursor-pointer"
                                  title="Delete Record permanently"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                      No matching field survey records found inside specified filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Simple printable page summary stats */}
          <div className="px-6 py-5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-655 dark:text-slate-400">
            <div>
              Showing <span className="text-slate-900 dark:text-white font-bold">{filteredRecords.length}</span> recorded rows.
            </div>
            <div className="flex gap-4">
              <div>Total Population Surveyed: <span className="text-slate-900 dark:text-white font-extrabold">{filteredRecords.reduce((sum, r) => sum + r.PersonCount, 0)}</span></div>
              <div className="text-clinic-green-600 font-bold">Total Payouts: ₱{filteredRecords.reduce((sum, r) => sum + r.TotalPayout, 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Editing Modal for authorized users */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="text-clinic-blue-600 h-5 w-5" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-heading">
                  Edit Survey Entry Rec #{selectedRecord?.RecordID}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateRecord} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Population Count *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editPersonCount}
                  onChange={(e) => setEditPersonCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-705 font-bold rounded-xl text-xs border border-slate-150 transition-colors focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2.5 px-4 bg-clinic-blue-600 hover:bg-clinic-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md shadow-clinic-blue-500/10 cursor-pointer"
                >
                  {updating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Survey Modal for Admins */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <PlusCircle className="text-emerald-600 h-5 w-5" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-heading uppercase tracking-wide">
                  Record New Field Survey
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddSurvey} className="p-6 space-y-4">
              {addingSurveyError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-655 dark:text-red-450 border border-red-100 dark:border-red-900/50 rounded-xl text-xs flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{addingSurveyError}</span>
                </div>
              )}

              {/* Group Name Select */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Group Name *</label>
                <select
                  required
                  value={addSelectedGroupId}
                  onChange={(e) => setAddSelectedGroupId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-clinic-blue-500 focus:outline-none dark:text-slate-200"
                >
                  <option value="" disabled>-- Select Survey Group --</option>
                  {groups.filter(g => g.Status === 'Active').map(g => (
                    <option key={g.GroupID} value={g.GroupID}>
                      {g.GroupName} ({g.GroupCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Population Count */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Population Count *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={addPersonCount}
                  onChange={(e) => setAddPersonCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black dark:text-slate-200"
                />
              </div>

              {/* Auto-fetched and displayed fields (Current Rate, Computed Payout, Assigned Staff) */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-100 dark:border-slate-800/85 rounded-2xl space-y-2.5 text-xs">
                <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Group Details (Auto-fetched)</span>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-405 dark:text-slate-500">Assigned Staff:</span>
                  <span className="font-bold text-slate-705 dark:text-slate-300">
                    {addSelectedGroupId ? assignedStaffName : 'Select a group...'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-405 dark:text-slate-500">Current Rate:</span>
                  <span className="font-bold text-slate-750 dark:text-slate-300 font-mono">
                    {addSelectedGroupId ? `₱${currentRate} / person` : 'Select a group...'}
                  </span>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800/50 my-1" />

                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-600 dark:text-slate-400">Computed Payout:</span>
                  <span className="text-emerald-600 dark:text-emerald-450 font-extrabold text-sm font-mono">
                    {addSelectedGroupId ? `₱${computedPayout.toLocaleString()}` : '₱0'}
                  </span>
                </div>
              </div>

              {/* Optional Remarks */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Additional batch, consolidated survey update"
                  value={addRemarks}
                  onChange={(e) => setAddRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-clinic-blue-500 focus:outline-none dark:text-slate-200"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-705 dark:text-slate-350 font-bold rounded-xl text-xs border border-slate-150 dark:border-slate-800 transition-colors focus:outline-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSurvey || !addSelectedGroupId}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  {addingSurvey ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      <span>Submit Survey</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
