import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { DesignatedGroup } from '../types';
import {
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  FileCheck,
  Search,
  BookOpen
} from 'lucide-react';

interface DesignatedGroupsPageProps {
  currentAdminId: string;
}

export default function DesignatedGroupsPage({ currentAdminId }: DesignatedGroupsPageProps) {
  const [designatedGroups, setDesignatedGroups] = useState<DesignatedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DesignatedGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form fields
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [description, setDescription] = useState('');
  const [isManualCode, setIsManualCode] = useState(false);
  
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const generateGroupCode = (name: string): string => {
    if (!name) return '';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    
    let initials = words
      .map(word => {
        const firstChar = word.replace(/[^A-Za-z0-9]/g, '').slice(0, 1);
        return firstChar;
      })
      .join('')
      .toUpperCase();

    if (initials.length < 2 && name.trim().length >= 3) {
      initials = name.trim().replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
    }

    const prefix = initials || 'GRP';
    let maxNum = 0;
    for (const dg of designatedGroups) {
      if (editingItem && dg.DesignatedID === editingItem.DesignatedID) continue;
      const match = dg.GroupCode.match(new RegExp(`^${prefix}-(\\d+)`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNum = maxNum + 1;
    const suffix = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    return `${prefix}-${suffix}`;
  };

  const handleGroupNameChange = (val: string) => {
    setGroupName(val);
    if (!isManualCode && !editingItem) {
      setGroupCode(generateGroupCode(val));
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getDesignatedGroups();
      setDesignatedGroups(data);
    } catch (e) {
      console.error('Error loading designated groups:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setGroupName('');
    setGroupCode('');
    setDescription('');
    setIsManualCode(false);
    setFormError(null);
    setAttemptedSubmit(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item: DesignatedGroup) => {
    setEditingItem(item);
    setGroupName(item.GroupName);
    setGroupCode(item.GroupCode);
    setDescription(item.Description || '');
    setIsManualCode(true);
    setFormError(null);
    setAttemptedSubmit(false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    if (!groupName.trim() || !groupCode.trim()) {
      setFormError('Group Name and Group Code are required fields.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingItem) {
        const res = await api.updateDesignatedGroup(
          editingItem.DesignatedID,
          {
            GroupName: groupName,
            GroupCode: groupCode,
            Description: description
          },
          currentAdminId
        );
        if (res.success) {
          setIsModalOpen(false);
          loadData();
        } else {
          setFormError(res.message || 'Failed to update template.');
        }
      } else {
        const res = await api.createDesignatedGroup(
          {
            GroupName: groupName,
            GroupCode: groupCode,
            Description: description
          },
          currentAdminId
        );
        if (res.success) {
          setIsModalOpen(false);
          loadData();
        } else {
          setFormError(res.message || 'Failed to create template.');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'A network error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: DesignatedGroup) => {
    if (!confirm(`Are you sure you want to delete the designated group template "${item.GroupName}"? Groups active in field surveys with this template will not be impacted, but new assignments will no longer find this template.`)) {
      return;
    }
    try {
      const res = await api.deleteDesignatedGroup(item.DesignatedID, currentAdminId);
      if (res.success) {
        loadData();
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting template.');
    }
  };

  const filteredGroups = designatedGroups.filter(
    (g) =>
      g.GroupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.GroupCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.Description && g.Description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-clinic-blue-600" />
            Designated Group Pre-sets
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure approved barangay and sector field groups. These pre-sets determine the options available when establishing active field groups.
          </p>
        </div>
        <button
          onClick={openAddModal}
          id="btn-add-designated"
          className="px-4 py-2 bg-clinic-blue-600 hover:bg-clinic-blue-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-clinic-blue-500/10 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Pre-set Group</span>
        </button>
      </div>

      {/* Search and Metadata Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xs">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute left-3 top-2.5 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search pre-sets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
          />
        </div>
        <div className="text-[11px] font-medium text-slate-500">
          Total Pre-sets: <span className="font-bold text-slate-700 dark:text-slate-200">{filteredGroups.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-clinic-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.DesignatedID}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="bg-sky-50 dark:bg-sky-950/40 text-clinic-blue-700 dark:text-clinic-blue-300 font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded">
                    {group.GroupCode}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Added: {group.CreatedDate}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mb-1.5 font-heading">
                  {group.GroupName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
                  {group.Description || 'No description provided. This is a default survey segment template.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-end space-x-1.5">
                <button
                  onClick={() => openEditModal(group)}
                  className="p-1 px-3 bg-slate-55 dark:bg-slate-800 hover:bg-slate-100/10 text-slate-600 dark:text-slate-350 font-bold text-[10px] rounded-lg border border-slate-205 dark:border-slate-705 flex items-center space-x-1 cursor-pointer"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(group)}
                  className="p-1 px-3 bg-red-50 hover:bg-red-105 text-red-650 font-bold text-[10px] rounded-lg border border-red-200 flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}

          {filteredGroups.length === 0 && (
            <div className="col-span-full text-center p-12 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl">
              <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-bold">No designated pre-set groups found matching that name or code.</p>
            </div>
          )}
        </div>
      )}

      {/* Dialog Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150-all">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <FileCheck className="text-clinic-blue-600 h-5 w-5" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-heading">
                  {editingItem ? 'Edit Pre-set Group Template' : 'Add Pre-set Group Template'}
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
            <form noValidate onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-xs border border-red-100 dark:border-red-900 rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${attemptedSubmit && !groupName.trim() ? 'text-red-500' : 'text-slate-500'}`}>
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Barangay San Juan Field Team"
                  value={groupName}
                  onChange={(e) => handleGroupNameChange(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none ${
                    attemptedSubmit && !groupName.trim()
                      ? 'border-red-500 focus:ring-1.5 focus:ring-red-500 ring-red-500'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-1.5 focus:ring-clinic-blue-500'
                  }`}
                />
                {attemptedSubmit && !groupName.trim() && (
                  <p className="text-[10px] text-red-500 mt-1 font-medium">Please enter a group name.</p>
                )}
              </div>

              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${attemptedSubmit && !groupCode.trim() ? 'text-red-500' : 'text-slate-500'}`}>
                  Group Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BSJ-01"
                  value={groupCode}
                  onChange={(e) => {
                    setGroupCode(e.target.value);
                    setIsManualCode(true);
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl text-xs text-slate-800 dark:text-white uppercase focus:outline-none ${
                    attemptedSubmit && !groupCode.trim()
                      ? 'border-red-500 focus:ring-1.5 focus:ring-red-500 ring-red-500'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-1.5 focus:ring-clinic-blue-500'
                  }`}
                />
                {attemptedSubmit && !groupCode.trim() && (
                  <p className="text-[10px] text-red-500 mt-1 font-medium">Please enter a group code.</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Description / Location Details</label>
                <textarea
                  placeholder="Add details about coverage, survey boundary, landmark bounds..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none resize-none"
                />
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
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 bg-clinic-blue-600 hover:bg-clinic-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md shadow-clinic-blue-500/10 cursor-pointer"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <span>Save Preset</span>
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
