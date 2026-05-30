import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Barangay } from '../types';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Search,
  Building,
  ChevronDown
} from 'lucide-react';

interface BarangaysPageProps {
  currentAdminId: string;
}

export default function BarangaysPage({ currentAdminId }: BarangaysPageProps) {
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Barangay | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Custom center-screen deletion confirmation modal state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    criticalWarning?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

  // Form fields
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getBarangays();
      setBarangays(data || []);
    } catch (e) {
      console.error('Error loading approved barangays:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setCity('Metro Manila');
    setDescription('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Barangay) => {
    setEditingItem(item);
    setName(item.Name);
    setCity(item.City);
    setDescription(item.Description || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim()) {
      setFormError('Barangay Name and Location/City are required fields.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingItem) {
        const res = await api.updateBarangay(
          editingItem.BarangayID,
          {
            Name: name.trim(),
            City: city.trim(),
            Description: description.trim()
          },
          currentAdminId
        );
        if (res.success) {
          setIsModalOpen(false);
          loadData();
        } else {
          setFormError(res.message || 'Failed to update approved Barangay.');
        }
      } else {
        const res = await api.createBarangay(
          {
            Name: name.trim(),
            City: city.trim(),
            Description: description.trim()
          },
          currentAdminId
        );
        if (res.success) {
          setIsModalOpen(false);
          loadData();
        } else {
          setFormError(res.message || 'Failed to register approved Barangay.');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'A network error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: Barangay) => {
    setDeleteDialog({
      isOpen: true,
      title: 'Delete Approved Barangay Address',
      description: `Are you sure you want to delete the approved Barangay "${item.Name}"? Any employee profiles already registered under this Barangay address will remain, but new employee registrations will no longer see this option in the address dropdown.`,
      criticalWarning: 'This area will be permanently removed from selection templates.',
      onConfirm: async () => {
        try {
          const res = await api.deleteBarangay(item.BarangayID, currentAdminId);
          if (res.success) {
            loadData();
          }
        } catch (e: any) {
          alert(e.message || 'Error deleting Barangay sector.');
        }
      }
    });
  };

  const filteredItems = barangays.filter(
    (b) =>
      b.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.City.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.Description && b.Description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-clinic-blue-600" />
            Approved Barangay Sectors
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure dynamic local addresses and barangays. Sourced automatically as approved address choices in staff registrations.
          </p>
        </div>
        <button
          onClick={openAddModal}
          id="btn-add-barangay"
          className="px-4 py-2 bg-clinic-blue-600 hover:bg-clinic-blue-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-clinic-blue-500/10 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Register Barangay</span>
        </button>
      </div>

      {/* Options Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search approved Barangays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500"
          />
        </div>
        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">
          Total Loaded: {barangays.length} Areas
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-clinic-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Barangay ID</th>
                  <th className="px-6 py-4">Sector Name</th>
                  <th className="px-6 py-4">City / Province</th>
                  <th className="px-6 py-4">Boundaries & Details</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.map((b) => (
                  <tr
                    key={b.BarangayID}
                    className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-clinic-blue-700">
                      {b.BarangayID}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-800 dark:text-slate-100 font-heading">
                      {b.Name}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-350">
                      {b.City}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs truncate">
                      {b.Description || 'No description listed.'}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">
                      {b.CreatedDate}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(b)}
                          title="Modify Barangay details"
                          className="p-1.5 bg-slate-55 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-350 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(b)}
                          title="Remove from approved registration list"
                          className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-404">
                      No approved Barangays found matching search parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Registration/Edit Form Overlay Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Building className="text-clinic-blue-600 h-5 w-5" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-heading">
                  {editingItem ? 'Edit Approved Barangay details' : 'Register New Approved Barangay'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-650"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-750 dark:text-red-300 text-xs border border-red-100 dark:border-red-900 rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Barangay Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Barangay San Juan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">City / Municipality *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Manila"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Sector Boundaries / Details</label>
                <textarea
                  placeholder="Specify geographical boundaries, key streets, or community descriptions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-55 hover:bg-slate-100 text-slate-750 font-bold rounded-xl text-xs border border-slate-150 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-barangay"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 bg-clinic-blue-600 hover:bg-clinic-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md shadow-clinic-blue-500/10 cursor-pointer"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>Save Barangay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Center-screen deletion confirmation modal */}
      {deleteDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print animate-in fade-in duration-250">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-650 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-650" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-heading mb-2">
                {deleteDialog.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                {deleteDialog.description}
              </p>
              {deleteDialog.criticalWarning && (
                <div className="p-2.5 bg-red-50 dark:bg-red-955/20 text-[10px] font-bold text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/50 rounded-xl mb-5 leading-normal">
                  ⚠️ {deleteDialog.criticalWarning}
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setDeleteDialog(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs border border-slate-150 dark:border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteDialog.onConfirm();
                    setDeleteDialog(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md shadow-red-500/10 cursor-pointer animate-pulse"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
