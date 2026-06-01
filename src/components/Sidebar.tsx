import React, { useState } from 'react';
import { Employee, SystemSettings } from '../types';
import {
  BarChart4,
  Users,
  Briefcase,
  FileSpreadsheet,
  History,
  LogOut,
  Moon,
  Sun,
  Activity,
  User,
  Shield,
  BookOpen,
  MapPin,
  Coins,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  user: Omit<Employee, 'PINCode'>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  settings?: SystemSettings | null;
}

export default function Sidebar({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  darkMode,
  setDarkMode,
  isOpenMobile,
  onCloseMobile,
  settings
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sfc_sidebar_collapsed') === 'true';
  });
  const isAdmin = user.Position === 'Admin';
  const isLeader = user.Position === 'Leader';

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const menuItems = [
    // Client view tabs
    {
      id: 'dashboard',
      label: isAdmin ? 'Admin Metrics' : 'My Dashboard',
      icon: BarChart4,
      allowed: ['Admin', 'Leader', 'Co-Leader'],
    },
    {
      id: 'records',
      label: isAdmin ? 'All Survey Records' : 'Group Survey Data',
      icon: FileSpreadsheet,
      allowed: ['Admin', 'Leader', 'Co-Leader'],
    },
    {
      id: 'paid-records',
      label: isAdmin ? 'Paid Surveys Registry' : 'Group Paid Surveys',
      icon: Coins,
      allowed: ['Admin', 'Leader', 'Co-Leader'],
    },
    // Admin Only tabs
    {
      id: 'employees',
      label: 'Add Employee List',
      icon: Users,
      allowed: ['Admin'],
    },
    {
      id: 'designated-groups',
      label: 'Designated Groups',
      icon: BookOpen,
      allowed: ['Admin'],
    },
    {
      id: 'barangays',
      label: 'Manage Barangays',
      icon: MapPin,
      allowed: ['Admin'],
    },
    {
      id: 'groups',
      label: 'Manage Groups',
      icon: Briefcase,
      allowed: ['Admin'],
    },
    {
      id: 'logs',
      label: 'System Audit Logs',
      icon: History,
      allowed: ['Admin'],
    }
  ];

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 md:hidden animate-in fade-in duration-200"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen no-print transition-all duration-300 ease-in-out md:translate-x-0 md:static ${
          isCollapsed ? 'md:w-20 w-64' : 'w-64'
        } ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className={`p-4.5 flex items-center border-b border-slate-100 dark:border-slate-800 transition-all ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden flex-shrink-0">
            <img src={settings?.WebsiteLogo || "https://www.image2url.com/r2/default/images/1779782151932-e0fcc309-3ed7-4c15-a3fa-1859006492a3.png"} alt="Website Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in duration-200 truncate flex-1 min-w-0">
              <h1 className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">
                {settings?.WebsiteTitle ? settings.WebsiteTitle.split(' ')[0] : 'Saint Francis'}
              </h1>
              <p className="text-sm font-bold text-clinic-blue-905 dark:text-clinic-blue-100 leading-tight truncate">
                {settings?.WebsiteTitle ? settings.WebsiteTitle.substring(settings.WebsiteTitle.split(' ')[0].length).trim() || 'Clinic RMS' : 'Clinic RMS'}
              </p>
            </div>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} py-4 space-y-1 overflow-y-auto`}>
          {isCollapsed ? (
            <div className="h-px bg-slate-100 dark:bg-slate-800/60 my-2 mx-1" />
          ) : (
            <span className="block px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Workspace Navigation
            </span>
          )}
          {menuItems
            .filter((item) => item.allowed.includes(user.Position))
            .map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleTabClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isCollapsed ? 'justify-center p-3 h-12 mx-auto' : 'px-4 py-3'
                  } ${
                    active
                      ? 'bg-clinic-blue-50 text-clinic-blue-700 dark:bg-slate-850 dark:text-clinic-blue-300'
                      : 'text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 hover:text-slate-900 dark:hover:text-slate-250'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} flex-shrink-0 ${active ? 'text-clinic-blue-700 dark:text-clinic-blue-300' : 'text-slate-400 dark:text-slate-500'}`} />
                  {!isCollapsed && <span className="animate-in fade-in duration-200">{item.label}</span>}
                </button>
              );
            })}
        </nav>

        {/* Option Toggles & User Status block */}
        <div className={`p-4 border-t border-slate-100 dark:border-slate-800 ${isCollapsed ? 'space-y-4' : 'space-y-3'}`}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-1">
              <div className="relative w-11 h-11 rounded-xl bg-slate-900 dark:bg-slate-950 flex items-center justify-center text-white text-xs font-bold border border-slate-800 shadow-sm" title={`Logged in as ${user.FullName}`}>
                {user.FullName.slice(0, 2).toUpperCase()}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900" />
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-4 text-white animate-in fade-in duration-200">
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Logged in as</p>
              <p className="font-semibold text-sm truncate mt-0.5">{user.FullName}</p>
              <div className="mt-3 flex items-center text-[11px] text-emerald-400 font-medium font-sans">
                <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                System Active
              </div>
            </div>
          )}

          {/* Minimize / Expand Toggle Button on desktop */}
          <div className="hidden md:block">
            <button
              onClick={() => {
                const newVal = !isCollapsed;
                setIsCollapsed(newVal);
                localStorage.setItem('sfc_sidebar_collapsed', String(newVal));
              }}
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black tracking-widest text-slate-500 hover:text-slate-750 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl cursor-pointer ${
                isCollapsed ? 'px-0 h-11' : 'px-3'
              }`}
              title={isCollapsed ? "Expand Sidebar Navigation" : "Minimize Sidebar Navigation"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4.5 w-4.5" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  <span>MINIMIZE PANELS</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={onLogout}
              id="btn-logout"
              title={isCollapsed ? "Exit Account Log" : undefined}
              className={`w-full flex items-center rounded-xl text-xs font-semibold text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer ${
                isCollapsed ? 'justify-center p-3 h-11 mx-auto' : 'space-x-2.5 px-3 py-2'
              }`}
            >
              <LogOut className={`h-4.5 w-4.5 text-red-500 flex-shrink-0 ${isCollapsed ? '' : 'mr-1'}`} />
              {!isCollapsed && <span className="animate-in fade-in duration-200">Exit Account Log</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
