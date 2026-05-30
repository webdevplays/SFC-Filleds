import { Employee } from '../types';
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
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  user: Omit<Employee, 'PINCode'>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

export default function Sidebar({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  darkMode,
  setDarkMode
}: SidebarProps) {
  const isAdmin = user.Position === 'Admin';
  const isLeader = user.Position === 'Leader';

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
    // Admin Only tabs
    {
      id: 'employees',
      label: 'Employee Logins',
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
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen no-print transition-colors duration-300">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
          <img src="https://www.image2url.com/r2/default/images/1779782151932-e0fcc309-3ed7-4c15-a3fa-1859006492a3.png" alt="St. Francis Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Saint Francis</h1>
          <p className="text-sm font-bold text-clinic-blue-905 dark:text-clinic-blue-100 leading-tight">Clinic RMS</p>
        </div>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <span className="block px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          Workspace Navigation
        </span>
        {menuItems
          .filter((item) => item.allowed.includes(user.Position))
          .map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
                  active
                    ? 'bg-clinic-blue-50 text-clinic-blue-700 dark:bg-slate-850 dark:text-clinic-blue-300'
                    : 'text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 hover:text-slate-900 dark:hover:text-slate-250'
                }`}
              >
                <Icon className={`h-5 w-5 mr-3 ${active ? 'text-clinic-blue-700 dark:text-clinic-blue-300' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
      </nav>

      {/* Option Toggles & User Status block */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-4 text-white">
          <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Logged in as</p>
          <p className="font-semibold text-sm truncate mt-0.5">{user.FullName}</p>
          <div className="mt-3 flex items-center text-[11px] text-emerald-400 font-medium">
            <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
            System Active
          </div>
        </div>

        <div className="space-y-1.5">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
          >
            <div className="flex items-center space-x-2">
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-clinic-blue-600" />}
              <span>{darkMode ? 'Light Theme' : 'Night Mode'}</span>
            </div>
            <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ${darkMode ? 'bg-clinic-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${darkMode ? 'translate-x-3.5' : 'translate-x-0'}`} />
            </div>
          </button>

          <button
            onClick={onLogout}
            id="btn-logout"
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5 text-red-500" />
            <span>Exit Account Log</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
