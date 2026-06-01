import React, { useState, useEffect } from 'react';
import { Employee, Notification, SystemSettings } from './types';
import { api } from './api';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import EmployeesPage from './components/EmployeesPage';
import GroupsPage from './components/GroupsPage';
import DesignatedGroupsPage from './components/DesignatedGroupsPage';
import BarangaysPage from './components/BarangaysPage';
import RecordsPage from './components/RecordsPage';
import ActivityLogsPage from './components/ActivityLogsPage';
import {
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  Shield,
  Activity,
  CheckCircle,
  Menu,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<Omit<Employee, 'PINCode'> | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Dynamic branding configuration settings
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  // Restore authenticated session
  useEffect(() => {
    const cachedUser = localStorage.getItem('sfc_user_session');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) {
        console.error('Error recovering cached session:', e);
      }
    }
    setLoading(false);

    // Initial Light/Dark Theme Restore
    const isDark = localStorage.getItem('sfc_dark_theme') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Load and apply system branding/SEO settings dynamically
  useEffect(() => {
    const applySystemSettings = async () => {
      try {
        const res = await api.getSystemSettings();
        if (res) {
          setSettings(res);
          // 1. Update document title
          if (res.FaviconTitle) {
            document.title = res.FaviconTitle;
          }
          // 2. Set favicon links
          if (res.FaviconLogo) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = res.FaviconLogo;
          }
          // 3. Set SEO meta description and keywords
          let descriptionMeta: HTMLMetaElement | null = document.querySelector("meta[name='description']");
          if (!descriptionMeta) {
            descriptionMeta = document.createElement('meta');
            descriptionMeta.name = 'description';
            document.getElementsByTagName('head')[0].appendChild(descriptionMeta);
          }
          if (res.SEODescription) {
            descriptionMeta.content = res.SEODescription;
          }

          let keywordsMeta: HTMLMetaElement | null = document.querySelector("meta[name='keywords']");
          if (!keywordsMeta) {
            keywordsMeta = document.createElement('meta');
            keywordsMeta.name = 'keywords';
            document.getElementsByTagName('head')[0].appendChild(keywordsMeta);
          }
          if (res.SEOKeywords) {
            keywordsMeta.content = res.SEOKeywords;
          }
        }
      } catch (err) {
        console.error('Error fetching and applying system style config settings:', err);
      }
    };
    applySystemSettings();

    const handleSettingsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<SystemSettings>;
      setSettings(customEvent.detail);
      
      if (customEvent.detail.FaviconTitle) {
        document.title = customEvent.detail.FaviconTitle;
      }
      if (customEvent.detail.FaviconLogo) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (link) {
          link.href = customEvent.detail.FaviconLogo;
        }
      }
      let descriptionMeta: HTMLMetaElement | null = document.querySelector("meta[name='description']");
      if (descriptionMeta && customEvent.detail.SEODescription) {
        descriptionMeta.content = customEvent.detail.SEODescription;
      }
      let keywordsMeta: HTMLMetaElement | null = document.querySelector("meta[name='keywords']");
      if (keywordsMeta && customEvent.detail.SEOKeywords) {
        keywordsMeta.content = customEvent.detail.SEOKeywords;
      }
    };

    window.addEventListener('systemSettingsUpdated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('systemSettingsUpdated', handleSettingsUpdate);
    };
  }, []);

  // Sync theme changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sfc_dark_theme', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sfc_dark_theme', 'false');
    }
  }, [darkMode]);

  // Load and refresh notifications periodically
  useEffect(() => {
    if (!user) return;
    const loadNotifications = async () => {
      try {
        const res = await api.getNotifications(user.Username);
        setNotifications(res);
      } catch (err) {
        console.error(err);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 10000); // Poll notifications every 10s
    return () => clearInterval(interval);
  }, [user]);

  const handleLoginSuccess = (validatedUser: Omit<Employee, 'PINCode'>) => {
    setUser(validatedUser);
    localStorage.setItem('sfc_user_session', JSON.stringify(validatedUser));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('sfc_user_session');
    setUser(null);
  };

  const handleMarkNotifRead = async (id: string) => {
    try {
      const res = await api.markNotificationRead(id);
      if (res.success) {
        setNotifications(prev => prev.map(n => n.NotificationID === id ? { ...n, IsRead: true } : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-700 to-lime-650">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
          <p className="text-xs text-white font-black tracking-widest font-heading uppercase">Saint Francis Clinic</p>
        </div>
      </div>
    );
  }

  // Not logged in: Show Login Screen
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const unreadNotifCount = notifications.filter(n => !n.IsRead).length;

  return (
    <div className="h-screen overflow-hidden flex w-full bg-slate-50/25 dark:bg-slate-950/35 backdrop-blur-md transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        settings={settings}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Workspace Portal Header */}
        <header className="h-16 flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between z-20 no-print transition-colors duration-300">
          <div className="flex items-center space-x-2.5">
            {/* Hamburger Button for mobile */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-1.5 text-slate-500 hover:text-slate-705 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              title="Open Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono hidden xs:inline-block">WORKSPACE LEVEL</span>
            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700 hidden xs:inline-block" />
            <span className="text-xs font-bold text-clinic-blue-600 capitalize bg-clinic-blue-50 dark:bg-slate-800 px-2.5 py-0.5 rounded">
              {activeTab}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications panel dropdown trigger */}
            <div className="relative">
              <button
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl transition-all relative cursor-pointer"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900" />
                )}
              </button>

              <AnimatePresence>
                {isNotifDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsNotifDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-30"
                    >
                      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-750 dark:text-slate-300 font-heading">Recent Broadcasts</span>
                        {unreadNotifCount > 0 && (
                          <span className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/20 text-[10px] font-bold text-rose-600 dark:text-rose-450 rounded-full">
                            {unreadNotifCount} new
                          </span>
                        )}
                      </div>

                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/80">
                        {notifications.map((notif) => (
                          <div
                            key={notif.NotificationID}
                            onClick={() => handleMarkNotifRead(notif.NotificationID)}
                            className={`p-3 text-xs leading-normal transition-colors cursor-pointer ${
                              notif.IsRead 
                                ? 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-950' 
                                : 'bg-clinic-blue-50/40 dark:bg-sky-950/20 hover:bg-clinic-blue-50/70'
                            }`}
                          >
                            <div className="font-semibold text-slate-805 dark:text-slate-200">
                              {notif.Title}
                            </div>
                            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {notif.Message}
                            </p>
                            <span className="text-[9px] font-mono text-slate-400 block mt-1.5">
                              {new Date(notif.CreatedDate).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}

                        {notifications.length === 0 && (
                          <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs text-medium">
                            No notifications received currently.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown with name */}
            <div className="flex items-center space-x-2 border-l border-slate-250 dark:border-slate-800 pl-3">
              <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-clinic-blue-600 font-bold text-xs uppercase leading-none">
                {user.FullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-350 leading-none">{user.FullName}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">{user.Position}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic activeTab viewport contents */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="max-w-7xl mx-auto"
            >
              {activeTab === 'dashboard' && (
                user.Position === 'Admin' ? <AdminDashboard /> : (
                  <EmployeeDashboard
                    user={user}
                    onUserUpdate={(updatedUser) => {
                      setUser(updatedUser);
                      localStorage.setItem('sfc_user_session', JSON.stringify(updatedUser));
                    }}
                  />
                )
              )}
              {activeTab === 'records' && (
                <RecordsPage user={user} isPaidView={false} />
              )}
              {activeTab === 'paid-records' && (
                <RecordsPage user={user} isPaidView={true} />
              )}
              {activeTab === 'employees' && user.Position === 'Admin' && (
                <EmployeesPage currentAdminId={user.EmployeeID} />
              )}
              {activeTab === 'designated-groups' && user.Position === 'Admin' && (
                <DesignatedGroupsPage currentAdminId={user.EmployeeID} />
              )}
              {activeTab === 'barangays' && user.Position === 'Admin' && (
                <BarangaysPage currentAdminId={user.EmployeeID} />
              )}
              {activeTab === 'groups' && user.Position === 'Admin' && (
                <GroupsPage currentAdminId={user.EmployeeID} />
              )}
              {activeTab === 'logs' && user.Position === 'Admin' && (
                <ActivityLogsPage />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer Info Bar */}
        <footer className="h-10 flex-shrink-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-805 flex items-center px-8 justify-between text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold no-print transition-colors duration-300">
          <div>G-Sheets API: <span className="text-emerald-500 font-semibold uppercase">Synchronized</span></div>
          <div className="hidden sm:block">Session status: <span className="text-clinic-blue-600 font-semibold uppercase">Active</span></div>
          <div>© 2026 Saint Francis Clinic CRM • Build 2.1.0</div>
        </footer>
      </div>
    </div>
  );
}
