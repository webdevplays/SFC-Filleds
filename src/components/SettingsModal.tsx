import React, { useState, useEffect } from 'react';
import { SystemSettings } from '../types';
import { api } from '../api';
import { X, Settings, Database, Sparkles, Globe, KeyRound, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsModalProps {
  settings: SystemSettings | null;
  onClose: () => void;
  onSave: (updated: SystemSettings) => void;
}

export default function SettingsModal({ settings, onClose, onSave }: SettingsModalProps) {
  const [websiteTitle, setWebsiteTitle] = useState('');
  const [websiteLogo, setWebsiteLogo] = useState('');
  const [faviconTitle, setFaviconTitle] = useState('');
  const [faviconLogo, setFaviconLogo] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  
  // Custom API Connection states
  const [apiServerUrl, setApiServerUrl] = useState('');
  const [forceLocalDb, setForceLocalDb] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (settings) {
      setWebsiteTitle(settings.WebsiteTitle || '');
      setWebsiteLogo(settings.WebsiteLogo || '');
      setFaviconTitle(settings.FaviconTitle || '');
      setFaviconLogo(settings.FaviconLogo || '');
      setSeoDescription(settings.SEODescription || '');
      setSeoKeywords(settings.SEOKeywords || '');
    }
    
    // Load local storage API url connection overrides
    setApiServerUrl(localStorage.getItem('sfc_api_server_url') || '');
    setForceLocalDb(localStorage.getItem('force_local_db') === 'true');
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    setError(null);
    setSuccess(null);

    if (
      !websiteTitle.trim() ||
      !websiteLogo.trim() ||
      !faviconTitle.trim() ||
      !faviconLogo.trim() ||
      !seoDescription.trim() ||
      !seoKeywords.trim()
    ) {
      setError('Please fill in all standard Branding & SEO parameters.');
      return;
    }

    setSaving(true);
    try {
      const payload: SystemSettings = {
        WebsiteTitle: websiteTitle.trim(),
        WebsiteLogo: websiteLogo.trim(),
        FaviconTitle: faviconTitle.trim(),
        FaviconLogo: faviconLogo.trim(),
        SEODescription: seoDescription.trim(),
        SEOKeywords: seoKeywords.trim()
      };

      // 1. Save dynamic connection details locally BEFORE saving settings to target endpoint
      localStorage.setItem('sfc_api_server_url', apiServerUrl.trim());
      localStorage.setItem('force_local_db', forceLocalDb ? 'true' : 'false');

      // 2. Clear force_local_db if a clean server URL is configured
      if (apiServerUrl.trim()) {
        localStorage.setItem('force_local_db', 'false');
      }

      // 3. Save branding config to database (G-Sheets)
      let modifierId = 'Admin';
      const userCached = localStorage.getItem('sfc_user_session');
      if (userCached) {
        modifierId = JSON.parse(userCached).EmployeeID || 'Admin';
      }

      const res = await api.updateSystemSettings(payload, modifierId);
      if (res.success) {
        setSuccess('Branding configurations and connection settings successfully synchronized!');
        setAttemptedSubmit(false);
        
        // Apply instantly to document DOM
        document.title = faviconTitle.trim();
        const link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (link) {
          link.href = faviconLogo.trim();
        }
        
        const descMeta: HTMLMetaElement | null = document.querySelector("meta[name='description']");
        if (descMeta) {
          descMeta.content = seoDescription.trim();
        }

        const keywordsMeta: HTMLMetaElement | null = document.querySelector("meta[name='keywords']");
        if (keywordsMeta) {
          keywordsMeta.content = seoKeywords.trim();
        }

        // Notify parent context
        setTimeout(() => {
          onSave(payload);
          window.dispatchEvent(new CustomEvent('systemSettingsUpdated', { detail: payload }));
          // Reload page to re-build api client with new BASE_URL
          window.location.reload();
        }, 1200);
      } else {
        setError(res.message || 'Verification of settings failed.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving connections.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-clinic-blue-50 dark:bg-slate-800 text-clinic-blue-600 rounded-xl">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-heading">
                System Preferences & Deployment Settings
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Configure branding, search metadata and live Google Sheets server parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scroll Container */}
        <form noValidate onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-xs border border-rose-105 rounded-xl flex items-start gap-2 animate-shake">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-500 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/25 text-emerald-800 dark:text-emerald-350 text-xs border border-emerald-100 rounded-xl flex items-start gap-2">
              <Sparkles className="h-4.5 w-4.5 text-emerald-500 mt-0.5 flex-shrink-0 animate-pulse" />
              <span>{success}</span>
            </div>
          )}

          {/* Section 1: Google Sheet Backend / Deployment Connection */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <Database className="h-4 w-4 text-clinic-blue-600" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-heading">
                Deploy Connections (GitHub / Netlify Live Linking)
              </h4>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              When launching this client-side application on platforms like <strong>Netlify</strong> or <strong>GitHub Pages</strong>, specify your dedicated Node/Express proxy backend location below to allow direct, secure Read/Write synchronizations with your <strong>Google Sheet</strong> database.
            </p>

            <div className="space-y-3.5 bg-slate-50 dark:bg-slate-950/55 p-4 rounded-xl border border-slate-150 dark:border-slate-800/85">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Live API Server URL
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://saint-francis-backend.a.run.app"
                  value={apiServerUrl}
                  onChange={(e) => setApiServerUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block leading-normal">
                  📌 Specify the root domain of your hosted Express Server that holds credentials. Leave blank to run in isolated simulated database mode.
                </span>
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="chk-force-simulated-db"
                  checked={forceLocalDb}
                  onChange={(e) => setForceLocalDb(e.target.checked)}
                  className="mt-1 h-3.5 w-3.5 text-clinic-blue-600 rounded border-slate-300 focus:ring-clinic-blue-500 cursor-pointer"
                />
                <div>
                  <label htmlFor="chk-force-simulated-db" className="text-xs font-bold text-slate-705 dark:text-slate-300 cursor-pointer">
                    Force Sandbox Simulation Mode
                  </label>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-normal">
                    Check this option to bypass the remote API connection completely and work offline using high-fidelity in-browser local storage database testing keys.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Visual Branding Details */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <Globe className="h-4 w-4 text-clinic-blue-600" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-heading">
                Dynamic Branding & SEO Preferences
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-[10.5px] font-semibold uppercase tracking-wider mb-1 ${attemptedSubmit && !websiteTitle.trim() ? 'text-red-500' : 'text-slate-500'}`}>
                  System Brand Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saint Francis Clinic"
                  value={websiteTitle}
                  onChange={(e) => setWebsiteTitle(e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border rounded-xl text-xs text-slate-850 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500 ${
                    attemptedSubmit && !websiteTitle.trim() ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[10.5px] font-semibold uppercase tracking-wider mb-1 ${attemptedSubmit && !faviconTitle.trim() ? 'text-red-500' : 'text-slate-500'}`}>
                  Document Tab Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saint Francis Clinic"
                  value={faviconTitle}
                  onChange={(e) => setFaviconTitle(e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border rounded-xl text-xs text-slate-850 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500 ${
                    attemptedSubmit && !faviconTitle.trim() ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-[10.5px] font-semibold uppercase tracking-wider mb-1 ${attemptedSubmit && !websiteLogo.trim() ? 'text-red-500' : 'text-slate-500'}`}>
                  Dynamic Logomark URL (SVG/PNG) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://image-url"
                    value={websiteLogo}
                    onChange={(e) => setWebsiteLogo(e.target.value)}
                    className={`flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border rounded-xl text-xs text-slate-850 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500 ${
                      attemptedSubmit && !websiteLogo.trim() ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                  {websiteLogo.trim() && (
                    <div className="w-9 h-9 border border-slate-200 bg-slate-50 p-1 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                      <img src={websiteLogo} alt="Logo" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-[10.5px] font-semibold uppercase tracking-wider mb-1 ${attemptedSubmit && !faviconLogo.trim() ? 'text-red-500' : 'text-slate-500'}`}>
                  Page Tab Icon (Favicon URL) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://image-url"
                    value={faviconLogo}
                    onChange={(e) => setFaviconLogo(e.target.value)}
                    className={`flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border rounded-xl text-xs text-slate-850 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500 ${
                      attemptedSubmit && !faviconLogo.trim() ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                  {faviconLogo.trim() && (
                    <div className="w-9 h-9 border border-slate-200 bg-slate-50 p-1 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                      <img src={faviconLogo} alt="Favicon" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-[10.5px] font-semibold uppercase tracking-wider mb-1 ${attemptedSubmit && !seoDescription.trim() ? 'text-red-500' : 'text-slate-500'}`}>
                SEO Search Description Header Metadata *
              </label>
              <textarea
                rows={2}
                required
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border rounded-xl text-xs text-slate-850 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500 leading-normal ${
                  attemptedSubmit && !seoDescription.trim() ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                }`}
                placeholder="Write system short summary description to optimize metadata indexing pools..."
              />
            </div>

            <div>
              <label className={`block text-[10.5px] font-semibold uppercase tracking-wider mb-1 ${attemptedSubmit && !seoKeywords.trim() ? 'text-red-500' : 'text-slate-500'}`}>
                SEO Search Crawler Keyword Pool *
              </label>
              <input
                type="text"
                required
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border rounded-xl text-xs text-slate-850 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-clinic-blue-500 ${
                  attemptedSubmit && !seoKeywords.trim() ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                }`}
                placeholder="e.g. clinic, field survey, records management system"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 dark:border-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs border border-slate-150 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-clinic-blue-600 hover:bg-clinic-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md shadow-clinic-blue-500/10 cursor-pointer"
          >
            {saving ? (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <KeyRound className="h-3.5 w-3.5" />
                <span>Save Connections & Reload</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
