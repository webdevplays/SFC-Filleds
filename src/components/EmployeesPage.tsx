import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Employee, EmployeePosition, EmployeeStatus, Barangay } from '../types';
import {
  Users,
  UserPlus,
  UserCheck,
  Edit2,
  Trash2,
  Lock,
  UserX,
  Phone,
  LayoutGrid,
  Shield,
  Key,
  Calendar,
  AlertTriangle,
  X,
  Plus
} from 'lucide-react';

interface EmployeesPageProps {
  currentAdminId: string;
}

export default function EmployeesPage({ currentAdminId }: EmployeesPageProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [position, setPosition] = useState<EmployeePosition>('Leader');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<EmployeeStatus>('Active');
  
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.getEmployees();
      // Filter out hard revoked if needed, but the prompt says: Allow Admin to see everyone, and Soft Delete (Status becomes Revoked)
      setEmployees(res);
      const bgys = await api.getBarangays();
      setBarangays(bgys || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const openAddModal = () => {
    setEditingEmployee(null);
    setFullName('');
    setUsername('');
    setPinCode('');
    setPosition('Leader');
    setContactNumber('');
    setAddress('');
    setStatus('Active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFullName(emp.FullName);
    setUsername(emp.Username);
    setPinCode(emp.PINCode);
    setPosition(emp.Position);
    setContactNumber(emp.ContactNumber);
    setAddress(emp.Address || '');
    setStatus(emp.Status);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Create / Update handler
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !pinCode.trim()) {
      setFormError('FullName, Username, and secure PIN Code are mandatory fields.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingEmployee) {
        // Edit Profile
        const res = await api.updateEmployee(
          editingEmployee.EmployeeID,
          {
            FullName: fullName,
            Username: username,
            PINCode: pinCode,
            Position: position,
            ContactNumber: contactNumber,
            Status: status,
            Address: address
          },
          currentAdminId
        );
        if (res.success) {
          setIsModalOpen(false);
          loadEmployees();
        } else {
          setFormError(res.message || 'Operation failed.');
        }
      } else {
        // Add Profile
        const res = await api.createEmployee(
          {
            FullName: fullName,
            Username: username,
            PINCode: pinCode,
            Position: position,
            ContactNumber: contactNumber,
            Status: 'Active', // Default to active on creation
            Address: address
          },
          currentAdminId
        );
        if (res.success) {
          setIsModalOpen(false);
          loadEmployees();
        } else {
          setFormError(res.message || 'Verification of profile inputs failed.');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'A network error occurred.');
    } finally {
      setSaving(false);
    }
  };

  // Suspend employee quickly
  const handleSuspendToggle = async (emp: Employee) => {
    const nextStatus = emp.Status === 'Suspended' ? 'Active' : 'Suspended';
    try {
      const res = await api.updateEmployee(emp.EmployeeID, { Status: nextStatus }, currentAdminId);
      if (res.success) {
        loadEmployees();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Soft Delete (Revoke Profile Access)
  const handleRevokeProfile = async (emp: Employee) => {
    if (!confirm(`Are you absolutely sure you want to revoke clinic systems access for ${emp.FullName}? This will prevent them from logging in entirely. (Soft Delete Only)`)) {
      return;
    }
    try {
      const res = await api.deleteEmployee(emp.EmployeeID, currentAdminId);
      if (res.success) {
        loadEmployees();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-800 dark:text-slate-100">
            Account Management & Verification
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Register clinic field representatives, verify authorization PIN codes, or suspend system access.
          </p>
        </div>
        <button
          onClick={openAddModal}
          id="btn-add-employee"
          className="px-4 py-2 bg-clinic-blue-600 hover:bg-clinic-blue-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-clinic-blue-500/10 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-clinic-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">PIN Code</th>
                  <th className="px-6 py-4">Position</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.map((emp) => (
                  <tr
                    key={emp.EmployeeID}
                    className={`hover:bg-slate-50/40 dark:hover:bg-slate-950/20 ${
                      emp.Status === 'Suspended' ? 'bg-amber-50/20 dark:bg-amber-950/5' : ''
                    } ${emp.Status === 'Revoked' ? 'opacity-50 line-through bg-rose-50/10 dark:bg-rose-950/5' : ''}`}
                  >
                    <td className="px-6 py-4 font-mono font-bold text-clinic-blue-600">{emp.EmployeeID}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{emp.FullName}</div>
                      {emp.Address && (
                        <div className="text-[10px] text-clinic-blue-600 dark:text-clinic-blue-400 font-bold uppercase tracking-wide mt-0.5">
                          📍 {emp.Address}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1">Registered: {emp.CreatedDate}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-[11px] text-slate-600 dark:text-slate-350">
                        {emp.Username}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono select-all">
                      <span className="flex items-center space-x-1 font-bold text-slate-700 dark:text-slate-300">
                        <Key className="h-3 w-3 text-slate-400" />
                        <span>{emp.PINCode}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        emp.Position === 'Admin'
                          ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                          : emp.Position === 'Leader'
                          ? 'bg-clinic-blue-50 dark:bg-sky-950/40 text-clinic-blue-750 dark:text-clinic-blue-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {emp.Position}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-450">{emp.ContactNumber || 'None'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        emp.Status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                          : emp.Status === 'Suspended'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300'
                      }`}>
                        {emp.Status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {emp.Status !== 'Revoked' && (
                          <>
                            {/* Toggle Suspend */}
                            <button
                              onClick={() => handleSuspendToggle(emp)}
                              title={emp.Status === 'Suspended' ? 'Re-activate Account' : 'Suspend Account'}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                emp.Status === 'Suspended'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                  : 'bg-amber-50 border-amber-250 text-amber-600 hover:bg-amber-100'
                              }`}
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => openEditModal(emp)}
                              title="Edit Employee details"
                              className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            {/* Soft Delete / Revoke */}
                            <button
                              onClick={() => handleRevokeProfile(emp)}
                              title="Revoke System Access (Soft Delete)"
                              className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-slate-400">
                      No staff accounts found. Register above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over Form Overlay Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="text-clinic-blue-600 h-5 w-5" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-heading">
                  {editingEmployee ? 'Edit Staff Profile' : 'Register New Staff Profile'}
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
            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-xs border border-red-100 dark:border-red-900 rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. jdoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500"
                  disabled={editingEmployee !== null} // Lock username for consistency
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Authorization PIN (Passcode) *</label>
                <input
                  type="text"
                  required
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="e.g. 1234, 5555"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white tracking-widest font-bold focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Specify numeric code used during login security validation check.</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Position Duty *</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as EmployeePosition)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500"
                  >
                    <option value="Leader">Leader</option>
                    <option value="Co-Leader">Co-Leader</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Session Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Revoked">Revoked</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Contact Number</label>
                <input
                  type="text"
                  placeholder="e.g. +63 900 123 4567"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-5-0 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Resident Address (Barangay) *</label>
                <select
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500 font-medium"
                >
                  <option value="" disabled>-- Select Approved Barangay Address --</option>
                  {barangays.map(b => (
                    <option key={b.BarangayID} value={b.Name}>
                      {b.Name} ({b.City})
                    </option>
                  ))}
                  {barangays.length === 0 && (
                    <option disabled>No approved Barangays found. Go configure under "Manage Barangays".</option>
                  )}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">Specify pre-set authorized clinic sector location.</span>
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
                  id="btn-save-employee"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 bg-clinic-blue-600 hover:bg-clinic-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md shadow-clinic-blue-500/10 cursor-pointer"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>Save Employee</span>
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
