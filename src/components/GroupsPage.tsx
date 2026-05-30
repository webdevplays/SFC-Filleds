import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Group, Employee, DesignatedGroup } from '../types';
import {
  Briefcase,
  Plus,
  Users,
  Shield,
  Coins,
  Calendar,
  AlertTriangle,
  X,
  Edit2,
  Trash2,
  Layers,
  UserCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface GroupsPageProps {
  currentAdminId: string;
}

export default function GroupsPage({ currentAdminId }: GroupsPageProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [designatedGroups, setDesignatedGroups] = useState<DesignatedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  // Form Fields
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [payoutRate, setPayoutRate] = useState<number>(50);
  const [leaderId, setLeaderId] = useState('');
  const [selectedCoLeaders, setSelectedCoLeaders] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [groupStatus, setGroupStatus] = useState<'Active' | 'Retired'>('Active');

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const allGroups = await api.getGroups();
      const allEmps = await api.getEmployees();
      const allPresets = await api.getDesignatedGroups();
      setGroups(allGroups);
      setEmployees(allEmps.filter((e: Employee) => e.Status === 'Active'));
      setDesignatedGroups(allPresets);

      // Pre-select first leader if available
      const leadersList = allEmps.filter((e: Employee) => e.Position === 'Leader' && e.Status === 'Active');
      if (leadersList.length > 0) {
        setLeaderId(leadersList[0].EmployeeID);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingGroup(null);
    setGroupName('');
    setGroupCode('');
    setPayoutRate(50);
    
    const leadersList = employees.filter(e => e.Position === 'Leader');
    if (leadersList.length > 0) {
      setLeaderId(leadersList[0].EmployeeID);
    } else {
      setLeaderId('');
    }
    
    setSelectedCoLeaders([]);
    setStartDate(new Date().toISOString().split('T')[0]);
    setGroupStatus('Active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (grp: Group) => {
    setEditingGroup(grp);
    setGroupName(grp.GroupName);
    setGroupCode(grp.GroupCode);
    setPayoutRate(grp.PayoutRate);
    setLeaderId(grp.LeaderID);
    setSelectedCoLeaders(grp.CoLeaderIDs);
    setStartDate(grp.StartDate);
    setGroupStatus(grp.Status);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Co-Leader checkbox toggle
  const toggleCoLeaderSelection = (id: string) => {
    if (selectedCoLeaders.includes(id)) {
      setSelectedCoLeaders(selectedCoLeaders.filter(co => co !== id));
    } else {
      setSelectedCoLeaders([...selectedCoLeaders, id]);
    }
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !groupCode.trim() || payoutRate === undefined || !leaderId) {
      setFormError('Required fields are Group Name, Group Code, Payout Rate and Leader Assignment.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingGroup) {
        // Edit group API
        const res = await api.updateGroup(
          editingGroup.GroupID,
          {
            GroupName: groupName,
            GroupCode: groupCode,
            PayoutRate: Number(payoutRate),
            LeaderID: leaderId,
            CoLeaderIDs: selectedCoLeaders,
            StartDate: startDate,
            Status: groupStatus
          },
          currentAdminId
        );
        if (res.success) {
          setIsModalOpen(false);
          loadData();
        } else {
          setFormError(res.message || 'Verification of group inputs failed.');
        }
      } else {
        // New Group API
        const res = await api.createGroup(
          {
            GroupName: groupName,
            GroupCode: groupCode,
            PayoutRate: Number(payoutRate),
            LeaderID: leaderId,
            CoLeaderIDs: selectedCoLeaders,
            StartDate: startDate,
            Status: 'Active'
          },
          currentAdminId
        );
        if (res.success) {
          setIsModalOpen(false);
          loadData();
        } else {
          setFormError(res.message || 'Creation failed.');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'A network error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleRetireGroup = async (grp: Group) => {
    if (!confirm(`Are you sure you want to retire group ${grp.GroupName}? This will soft-delete their administrative status.`)) {
      return;
    }
    try {
      const res = await api.deleteGroup(grp.GroupID, currentAdminId);
      if (res.success) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleHardDeleteGroup = async (grp: Group) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete group "${grp.GroupName}"? All survey information associated with this group will remain, but this group itself will be completely erased from the system selection. This action is irreversible.`)) {
      return;
    }
    try {
      const res = await api.hardDeleteGroup(grp.GroupID, currentAdminId);
      if (res.success) {
        loadData();
      }
    } catch (e: any) {
      alert(e.message || 'Error occurred while permanently deleting group.');
    }
  };

  // Helpers to get Names
  const getLeaderName = (id: string) => {
    const leader = employees.find(e => e.EmployeeID === id);
    return leader ? leader.FullName : 'Not Assigned';
  };

  const getCoLeadersList = (ids: string[]) => {
    return ids.map(id => {
      const emp = employees.find(e => e.EmployeeID === id);
      return emp ? emp.FullName : null;
    }).filter(n => n !== null).join(', ') || 'No Co-Leaders assigned';
  };

  // Filter staff by designation Role
  const leadersList = employees.filter(e => e.Position === 'Leader');
  const coLeadersList = employees.filter(e => e.Position === 'Co-Leader');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-800 dark:text-slate-100">
            Field Group Setup & Assignment
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Delegate survey groups, configure custom per-person payouts, and nominate clinic leaders.
          </p>
        </div>
        <button
          onClick={openAddModal}
          id="btn-add-group"
          className="px-4 py-2 bg-clinic-blue-600 hover:bg-clinic-blue-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-clinic-blue-500/10 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Establish Group</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-clinic-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
          {groups.map((group) => {
            const isActive = group.Status === 'Active';
            const isExpanded = expandedGroupId === group.GroupID;
            const leaderName = getLeaderName(group.LeaderID);

            return (
              <div
                key={group.GroupID}
                className="transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-950/20"
              >
                {/* Header Row Click Trigger */}
                <div
                  onClick={() => setExpandedGroupId(isExpanded ? null : group.GroupID)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center space-x-4 min-w-0 flex-1">
                    {/* Expand Chevron Icon */}
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-804/80 text-slate-400">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="bg-clinic-blue-50 dark:bg-sky-950/40 text-clinic-blue-700 dark:text-clinic-blue-300 font-mono font-bold text-[9px] uppercase px-1.5 py-0.5 rounded">
                          {group.GroupCode}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-655'
                        }`}>
                          {group.Status}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-heading mt-1.5">
                        {group.GroupName}
                      </h3>
                    </div>
                  </div>

                  {/* Leader and Rate block display */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-right flex-shrink-0">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Delegated Leader</span>
                      <span className="font-semibold text-slate-705 dark:text-slate-200">
                        {leaderName}
                      </span>
                    </div>

                    <div className="sm:text-right min-w-[100px]">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Payout Rate</span>
                      <span className="font-black text-clinic-green-600 font-heading text-sm">
                        ₱{group.PayoutRate} <span className="text-[10px] font-semibold text-slate-450">/ person</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dropdown details content */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1.5 border-t border-slate-50 dark:border-slate-805/40 bg-slate-50/50 dark:bg-slate-950/10 space-y-4 animate-in slide-in-from-top-2 duration-150-all">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                      <div className="flex items-start space-x-3">
                        <Users className="h-4.5 w-4.5 text-clinic-green-650 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Assigned Co-Leaders</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-350 leading-relaxed block">
                            {getCoLeadersList(group.CoLeaderIDs)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Calendar className="h-4.5 w-4.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Commission Start Date</span>
                          <span className="font-medium text-slate-600 dark:text-slate-400 block pb-1">
                            {group.StartDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons list */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-805/60 flex justify-end space-x-2 animate-in fade-in duration-200">
                      <button
                        onClick={() => openEditModal(group)}
                        title="Update parameters or rates"
                        className="p-1 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-350 font-bold text-[11px] rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Update Assignment</span>
                      </button>

                      {isActive && (
                        <button
                          onClick={() => handleRetireGroup(group)}
                          title="Decommission Group"
                          className="p-1 px-3.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] rounded-lg border border-amber-200 flex items-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Retire Group</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleHardDeleteGroup(group)}
                        title="Permanently Delete Group"
                        className="p-1 px-3.5 bg-red-50 hover:bg-red-100/80 text-red-655 font-bold text-[11px] rounded-lg border border-red-200 flex items-center space-x-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete Group</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {groups.length === 0 && (
            <div className="text-center p-12 bg-slate-50 dark:bg-slate-900 border-none w-full">
              <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-bold">No clinic segments setup. Create a group above.</p>
            </div>
          )}
        </div>
      )}

      {/* Form Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Briefcase className="text-clinic-blue-600 h-5 w-5" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-heading">
                  {editingGroup ? 'Update Assigned Group Properties' : 'Establish New Field Survey Group'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveGroup} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-xs border border-red-100 dark:border-red-900 rounded-xl">
                  {formError}
                </div>
              )}

              {/* Dropdown preset template selector */}
              {!editingGroup && (
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <label className="block text-[10px] font-bold text-clinic-blue-600 dark:text-clinic-blue-400 uppercase tracking-wider mb-1">
                    Select Approved Designated Group *
                  </label>
                  <select
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const found = designatedGroups.find(dg => dg.DesignatedID === selectedId);
                      if (found) {
                        setGroupName(found.GroupName);
                        setGroupCode(found.GroupCode);
                      }
                    }}
                    value={designatedGroups.find(dg => dg.GroupName === groupName && dg.GroupCode === groupCode)?.DesignatedID || ''}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-xs text-slate-850 dark:text-white focus:outline-none"
                  >
                    <option value="">-- Choose Approved Pre-set Group Template --</option>
                    {designatedGroups.map(dg => (
                      <option key={dg.DesignatedID} value={dg.DesignatedID}>
                        {dg.GroupName} ({dg.GroupCode})
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-slate-400">
                    Sourced from the "Designated Groups" templates configured by admins.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Group Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Barangay San Jose B"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Group Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BSJ-02"
                    value={groupCode}
                    onChange={(e) => setGroupCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white uppercase focus:outline-none"
                    disabled={editingGroup !== null}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Assigned Payout Rate (PHP per person) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">₱</span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 50"
                      value={payoutRate}
                      onChange={(e) => setPayoutRate(Math.max(1, parseFloat(e.target.value) || 0))}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-850 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Nominated Leader *</label>
                  <select
                    required
                    value={leaderId}
                    onChange={(e) => setLeaderId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="" disabled>-- Nominate Survey Leader --</option>
                    {leadersList.map(l => (
                      <option key={l.EmployeeID} value={l.EmployeeID}>{l.FullName}</option>
                    ))}
                    {leadersList.length === 0 && (
                      <option disabled>No active staff qualified as Leader</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Commission Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                {editingGroup && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Operation Status</label>
                    <select
                      value={groupStatus}
                      onChange={(e) => setGroupStatus(e.target.value as 'Active' | 'Retired')}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Multi-select Co-Leaders Checkbox Checklist */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Assign Co-Leaders (View Authorization)
                </label>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 max-h-32 overflow-y-auto space-y-2 text-xs">
                  {coLeadersList.map(co => (
                    <label key={co.EmployeeID} className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-350 font-medium select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCoLeaders.includes(co.EmployeeID)}
                        onChange={() => toggleCoLeaderSelection(co.EmployeeID)}
                        className="rounded border-slate-300 dark:border-slate-800 text-clinic-blue-600 focus:ring-clinic-blue-500"
                      />
                      <span>{co.FullName}</span>
                    </label>
                  ))}
                  {coLeadersList.length === 0 && (
                    <p className="text-[10px] text-slate-400 text-center py-4">No active staff designated as Co-Leader.</p>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 block">Co-leaders assigned here will have read-only permissions to this group's survey records.</span>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-150 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-group"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 bg-clinic-blue-600 hover:bg-clinic-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md shadow-clinic-blue-500/10 cursor-pointer"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>Save Assignment</span>
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
