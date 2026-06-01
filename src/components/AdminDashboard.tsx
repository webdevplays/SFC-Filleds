import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
  Users,
  Briefcase,
  FileSpreadsheet,
  Coins,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  Activity,
  Calendar,
  Layers,
  ArrowUpRight,
  PieChart as PieIcon,
  RefreshCw,
  Settings as SettingsIcon
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { SystemSettings } from '../types';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  // Website Branding & SEO Form States
  const [settings, setSettings] = useState<SystemSettings>({
    WebsiteTitle: '',
    WebsiteLogo: '',
    FaviconTitle: '',
    FaviconLogo: '',
    SEODescription: '',
    SEOKeywords: ''
  });
  const [attemptedSubmitSettings, setAttemptedSubmitSettings] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccessMessage, setSettingsSuccessMessage] = useState('');
  const [settingsErrorMessage, setSettingsErrorMessage] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalytics();
      setData(res);
      const activityLogs = await api.getLogs();
      setLogs(activityLogs.slice(0, 5)); // Keep latest 5

      const sysSettings = await api.getSystemSettings();
      if (sysSettings) {
        setSettings(sysSettings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmitSettings(true);
    setSettingsSuccessMessage('');
    setSettingsErrorMessage('');

    // Validation
    if (
      !settings.WebsiteTitle.trim() ||
      !settings.WebsiteLogo.trim() ||
      !settings.FaviconTitle.trim() ||
      !settings.FaviconLogo.trim() ||
      !settings.SEODescription.trim() ||
      !settings.SEOKeywords.trim()
    ) {
      setSettingsErrorMessage('All settings fields are required. Please check highlighted inputs.');
      return;
    }

    setSettingsSaving(true);
    try {
      const sessionUser = localStorage.getItem('sfc_user_session');
      const modifierId = sessionUser ? JSON.parse(sessionUser).EmployeeID : 'Admin';
      
      const res = await api.updateSystemSettings(settings, modifierId);
      if (res.success) {
        setSettingsSuccessMessage('Branding and SEO configurations successfully updated! Reloading dynamic preferences...');
        setAttemptedSubmitSettings(false);
        
        // Dynamically update page title, favicon links, and metas immediately!
        document.title = settings.FaviconTitle;
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (link) {
          link.href = settings.FaviconLogo;
        }

        let descriptionMeta: HTMLMetaElement | null = document.querySelector("meta[name='description']");
        if (descriptionMeta) {
          descriptionMeta.content = settings.SEODescription;
        }

        let keywordsMeta: HTMLMetaElement | null = document.querySelector("meta[name='keywords']");
        if (keywordsMeta) {
          keywordsMeta.content = settings.SEOKeywords;
        }

        // Emit dynamic event
        window.dispatchEvent(new CustomEvent('systemSettingsUpdated', { detail: settings }));
      }
    } catch (err: any) {
      console.error(err);
      setSettingsErrorMessage(err.message || 'Error occurred while saving settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-10 w-10 text-clinic-blue-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Asynchronous calculation in progress...</p>
        </div>
      </div>
    );
  }

  const { summary, groupPerformance, dailyChartData } = data || {
    summary: { totalEmployees: 0, activeEmployees: 0, suspendedEmployees: 0, totalGroups: 0, totalRecords: 0, totalPayouts: 0 },
    groupPerformance: [],
    dailyChartData: []
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-800 dark:text-slate-100">
            Clinic Control Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time status overview of Saint Francis Clinic administrative indicators.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-slate-600 dark:text-slate-400 transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Analytics Info Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Employees */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Staff</span>
            <div className="p-2 bg-clinic-blue-50 dark:bg-slate-800 rounded-lg text-clinic-blue-600">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold font-heading text-slate-800 dark:text-slate-100">{summary.totalEmployees}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Registered accounts</p>
          </div>
        </div>

        {/* Active Staff */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Staff</span>
            <div className="p-2 bg-emerald-50 dark:bg-slate-800 rounded-lg text-emerald-600">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold font-heading text-emerald-600">{summary.activeEmployees}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Authorized access</p>
          </div>
        </div>

        {/* Suspended Staff */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Suspended</span>
            <div className="p-2 bg-amber-50 dark:bg-slate-800 rounded-lg text-amber-600">
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold font-heading text-amber-600">{summary.suspendedEmployees}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Blocked survey submissions</p>
          </div>
        </div>

        {/* Total Groups */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Groups</span>
            <div className="p-2 bg-purple-50 dark:bg-slate-800 rounded-lg text-purple-600">
              <Briefcase className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold font-heading text-slate-800 dark:text-slate-100">{summary.totalGroups}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Field teams active</p>
          </div>
        </div>

        {/* Records Submitted */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Surveys</span>
            <div className="p-2 bg-indigo-50 dark:bg-slate-800 rounded-lg text-indigo-600">
              <FileSpreadsheet className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold font-heading text-slate-800 dark:text-slate-100">{summary.totalRecords}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Recorded submissions</p>
          </div>
        </div>

        {/* Total Payouts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Payouts</span>
            <div className="p-2 bg-clinic-green-50 dark:bg-slate-800 rounded-lg text-clinic-green-600">
              <Coins className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-extrabold font-heading text-clinic-green-600">₱{summary.totalPayouts.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Total calculated PHP</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Submissions Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-heading">Survey Entry Volatility</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Surveys recorded during current dates</p>
            </div>
            <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-clinic-blue-600 bg-clinic-blue-50 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" />
              <span>Daily Rate</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData}>
                <defs>
                  <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fontSize: 9}} stroke="#94a3b8" />
                <YAxis tick={{fontSize: 9}} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
                <Area type="monotone" dataKey="submissions" name="Submissions" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorSubmissions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Group Performance comparison */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-heading">Field Group Payout Comparison</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Comparing total payout requirements between segments</p>
            </div>
            <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-clinic-green-600 bg-clinic-green-50 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              <Layers className="h-3 w-3" />
              <span>By Group IP</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="GroupCode" tick={{fontSize: 9}} stroke="#94a3b8" />
                <YAxis tick={{fontSize: 9}} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="PeopleCount" name="Surveyed Population" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PayoutSum" name="Total Payouts (₱)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row - Group Performance Details & Quick Logs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Performance details table */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-heading mb-4">Leader & Group Performance Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3">Group Code</th>
                  <th className="pb-3">Group Name</th>
                  <th className="pb-3 text-center">Submissions</th>
                  <th className="pb-3 text-center">People Surveyed</th>
                  <th className="pb-3 text-right">Total Payouts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {groupPerformance.map((gp: any) => (
                  <tr key={gp.GroupID} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                    <td className="py-3 font-mono font-semibold text-clinic-blue-600">{gp.GroupCode}</td>
                    <td className="py-3 font-medium text-slate-700 dark:text-slate-300">{gp.GroupName}</td>
                    <td className="py-3 text-center text-slate-600 dark:text-slate-400">{gp.RecordsCount}</td>
                    <td className="py-3 text-center font-bold text-slate-800 dark:text-slate-250">{gp.PeopleCount}</td>
                    <td className="py-3 text-right font-bold text-clinic-green-600">₱{gp.PayoutSum.toLocaleString()}</td>
                  </tr>
                ))}
                {groupPerformance.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">No active groups found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log timeline wrapper */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-heading mb-4">Recent Audit Actions</h2>
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.LogID} className="flex space-x-3 text-xs">
                <span className="h-2 w-2 rounded-full bg-clinic-blue-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-300">{log.Activity}</p>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                    <span className="font-mono bg-slate-50 dark:bg-slate-950 px-1 py-0.5 rounded uppercase">{log.UserID}</span>
                    <span>•</span>
                    <span>{new Date(log.DateTime).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-xs text-center text-slate-400 py-8">No logging actions recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Website Customization & SEO Control Panel */}
      <div id="website-branding-settings" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 md:p-8 rounded-2xl shadow-sm transition-colors duration-200">
        <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
          <div className="p-3 bg-clinic-blue-50 dark:bg-slate-850 rounded-xl text-clinic-blue-600 dark:text-clinic-blue-400">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-heading">
              Website Customization & SEO Configurations
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Live edit system branding labels, asset paths, header logos, tab favicons, and global search engine visibility parameters.
            </p>
          </div>
        </div>

        {settingsSuccessMessage && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold animate-in fade-in duration-200">
            {settingsSuccessMessage}
          </div>
        )}

        {settingsErrorMessage && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-950 text-rose-700 dark:text-rose-400 rounded-xl text-xs font-semibold animate-in fade-in duration-200">
            {settingsErrorMessage}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Website Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wide mb-2.5">
                Website Brand Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={settings.WebsiteTitle}
                onChange={e => setSettings(prev => ({ ...prev, WebsiteTitle: e.target.value }))}
                className={`w-full text-xs font-medium bg-slate-50 dark:bg-slate-950 border ${
                  attemptedSubmitSettings && !settings.WebsiteTitle.trim()
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-800/80'
                } rounded-xl px-4 py-3.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-clinic-blue-500/20 focus:border-clinic-blue-500 transition-all`}
                placeholder="e.g. Saint Francis Clinic"
              />
              {attemptedSubmitSettings && !settings.WebsiteTitle.trim() && (
                <p className="text-[10px] text-rose-500 mt-1.5 font-bold uppercase tracking-wide">Website Title is required and cannot be empty!</p>
              )}
            </div>

            {/* Favicon Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wide mb-2.5">
                Favicon / Tab Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={settings.FaviconTitle}
                onChange={e => setSettings(prev => ({ ...prev, FaviconTitle: e.target.value }))}
                className={`w-full text-xs font-medium bg-slate-50 dark:bg-slate-950 border ${
                  attemptedSubmitSettings && !settings.FaviconTitle.trim()
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-800/80'
                } rounded-xl px-4 py-3.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-clinic-blue-500/20 focus:border-clinic-blue-500 transition-all`}
                placeholder="e.g. St. Francis Portal"
              />
              {attemptedSubmitSettings && !settings.FaviconTitle.trim() && (
                <p className="text-[10px] text-rose-500 mt-1.5 font-bold uppercase tracking-wide">Favicon Title is required and cannot be empty!</p>
              )}
            </div>

            {/* Website Logo URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wide mb-2.5">
                Website Logo Link / URL <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={settings.WebsiteLogo}
                  onChange={e => setSettings(prev => ({ ...prev, WebsiteLogo: e.target.value }))}
                  className={`flex-1 text-xs font-medium bg-slate-50 dark:bg-slate-950 border ${
                    attemptedSubmitSettings && !settings.WebsiteLogo.trim()
                      ? 'border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800/80'
                  } rounded-xl px-4 py-3.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-clinic-blue-500/20 focus:border-clinic-blue-500 transition-all`}
                  placeholder="https://example.com/logo.png"
                />
                {settings.WebsiteLogo.trim() && (
                  <div className="h-11 w-11 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center p-1.5 flex-shrink-0">
                    <img src={settings.WebsiteLogo} alt="Logo Preview" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
              {attemptedSubmitSettings && !settings.WebsiteLogo.trim() && (
                <p className="text-[10px] text-rose-500 mt-1.5 font-bold uppercase tracking-wide">Website Logo is required and cannot be empty!</p>
              )}
            </div>

            {/* Favicon Logo URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wide mb-2.5">
                Favicon / Icon Link / URL <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={settings.FaviconLogo}
                  onChange={e => setSettings(prev => ({ ...prev, FaviconLogo: e.target.value }))}
                  className={`flex-1 text-xs font-medium bg-slate-50 dark:bg-slate-950 border ${
                    attemptedSubmitSettings && !settings.FaviconLogo.trim()
                      ? 'border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800/80'
                  } rounded-xl px-4 py-3.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-clinic-blue-500/20 focus:border-clinic-blue-500 transition-all`}
                  placeholder="https://example.com/favicon.png"
                />
                {settings.FaviconLogo.trim() && (
                  <div className="h-11 w-11 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center p-1.5 flex-shrink-0">
                    <img src={settings.FaviconLogo} alt="Favicon Preview" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
              {attemptedSubmitSettings && !settings.FaviconLogo.trim() && (
                <p className="text-[10px] text-rose-500 mt-1.5 font-bold uppercase tracking-wide">Favicon Logo URL is required and cannot be empty!</p>
              )}
            </div>

            {/* SEO Meta Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wide mb-2.5">
                SEO Search Engine Meta Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={settings.SEODescription}
                onChange={e => setSettings(prev => ({ ...prev, SEODescription: e.target.value }))}
                rows={3}
                className={`w-full text-xs font-medium bg-slate-50 dark:bg-slate-950 border ${
                  attemptedSubmitSettings && !settings.SEODescription.trim()
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-800/80'
                } rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-clinic-blue-500/20 focus:border-clinic-blue-500 transition-all`}
                placeholder="Summarize structural portal index descriptors for search engines..."
              />
              {attemptedSubmitSettings && !settings.SEODescription.trim() && (
                <p className="text-[10px] text-rose-500 mt-1.5 font-bold uppercase tracking-wide">SEO Description is required and cannot be empty!</p>
              )}
            </div>

            {/* SEO Meta Keywords */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wide mb-2.5">
                SEO Meta Keywords (comma separated) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={settings.SEOKeywords}
                onChange={e => setSettings(prev => ({ ...prev, SEOKeywords: e.target.value }))}
                className={`w-full text-xs font-medium bg-slate-50 dark:bg-slate-950 border ${
                  attemptedSubmitSettings && !settings.SEOKeywords.trim()
                     ? 'border-rose-500 ring-2 ring-rose-500/20'
                     : 'border-slate-200 dark:border-slate-800/80'
                } rounded-xl px-4 py-3.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-clinic-blue-500/20 focus:border-clinic-blue-500 transition-all`}
                placeholder="clinic, audit, database, records, google sheets"
              />
              {attemptedSubmitSettings && !settings.SEOKeywords.trim() && (
                <p className="text-[10px] text-rose-500 mt-1.5 font-bold uppercase tracking-wide">SEO Keywords are required and cannot be empty!</p>
              )}
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-5">
            <button
              type="submit"
              disabled={settingsSaving}
              className="px-6 py-3 bg-clinic-blue-600 hover:bg-clinic-blue-700 disabled:bg-clinic-blue-400 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              {settingsSaving ? 'Saving Changes...' : 'Save Branding & SEO Configurations'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
