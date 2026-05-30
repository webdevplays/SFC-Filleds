import { Employee, Group, ClinicRecord, ActivityLog, Notification, DesignatedGroup, Barangay } from './types';

const BASE_URL = '';

export async function apiRequest(endpoint: string, method: string = 'GET', body?: any, userId?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (userId) {
    headers['x-user-id'] = userId;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `API error: ${response.status}`);
  }
  return response.json();
}

/**
 * ==========================================
 * HIGH-FIDELITY CLIENT-SIDE FALLBACK SYSTEM
 * ==========================================
 * This acts as a complete in-browser database (backed by localStorage)
 * identical to the Node-Express backend database. It intercepts and
 * processes requests dynamically if the hosting context is static (like Netlify).
 */

const DEFAULT_EMPLOYEES: Employee[] = [
  {
    EmployeeID: 'EMP001',
    FullName: 'Admin Director',
    Username: 'admin',
    PINCode: '1234',
    Position: 'Admin',
    Status: 'Active',
    ContactNumber: '+63 917 123 4567',
    CreatedDate: '2026-01-01'
  },
  {
    EmployeeID: 'EMP002',
    FullName: 'Dr. Maria Santos',
    Username: 'msantos',
    PINCode: '2222',
    Position: 'Leader',
    Status: 'Active',
    ContactNumber: '+63 920 987 6543',
    CreatedDate: '2026-02-15'
  },
  {
    EmployeeID: 'EMP003',
    FullName: 'Nurse James Reyes',
    Username: 'jreyes',
    PINCode: '3333',
    Position: 'Co-Leader',
    Status: 'Active',
    ContactNumber: '+63 918 555 7788',
    CreatedDate: '2026-03-01'
  },
  {
    EmployeeID: 'EMP004',
    FullName: 'Nurse Sarah Alcantara',
    Username: 'salcantara',
    PINCode: '4444',
    Position: 'Co-Leader',
    Status: 'Active',
    ContactNumber: '+63 915 222 3344',
    CreatedDate: '2026-03-05'
  }
];

const DEFAULT_GROUPS: Group[] = [
  {
    GroupID: 'GRP001',
    GroupName: 'Barangay San Juan Field Team',
    GroupCode: 'BSJ-01',
    LeaderID: 'EMP002',
    CoLeaderIDs: ['EMP003', 'EMP004'],
    PayoutRate: 50,
    StartDate: '2026-02-15',
    Status: 'Active'
  },
  {
    GroupID: 'GRP002',
    GroupName: 'Barangay Santa Lucia Field Team',
    GroupCode: 'BSL-02',
    LeaderID: 'EMP002',
    CoLeaderIDs: ['EMP003'],
    PayoutRate: 75,
    StartDate: '2026-04-01',
    Status: 'Active'
  }
];

const DEFAULT_RECORDS: ClinicRecord[] = [
  {
    RecordID: 'REC001',
    GroupID: 'GRP001',
    LeaderID: 'EMP002',
    HouseNumber: '5',
    PersonCount: 5,
    PayoutRate: 50,
    TotalPayout: 250,
    Remarks: 'Standard household survey. All healthy.',
    CreatedDate: '2026-05-28T09:15:00Z'
  },
  {
    RecordID: 'REC002',
    GroupID: 'GRP001',
    LeaderID: 'EMP002',
    HouseNumber: '4',
    PersonCount: 4,
    PayoutRate: 50,
    TotalPayout: 200,
    Remarks: 'Two elderly residents, provided vitamins.',
    CreatedDate: '2026-05-29T10:30:00Z'
  },
  {
    RecordID: 'REC003',
    GroupID: 'GRP002',
    LeaderID: 'EMP002',
    HouseNumber: '6',
    PersonCount: 6,
    PayoutRate: 75,
    TotalPayout: 450,
    Remarks: 'High count, multiple children, scheduling ped visit.',
    CreatedDate: '2026-05-30T08:00:00Z'
  }
];

const DEFAULT_LOGS: ActivityLog[] = [
  {
    LogID: 'LOG001',
    UserID: 'admin',
    Activity: 'System Database Initialized with Default Profiles',
    DateTime: '2026-05-30T00:00:00Z',
    IPAddress: '127.0.0.1'
  }
];

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    NotificationID: 'NOT001',
    TargetUserID: 'admin',
    SourceUserID: 'EMP002',
    Title: 'New Field Survey Recorded',
    Message: 'Dr. Maria Santos submitted a field entry for Barangay Santa Lucia Field Team (6 people, Total PHP 450).',
    Type: 'success',
    CreatedDate: '2026-05-30T08:00:00Z',
    IsRead: false
  }
];

const DEFAULT_DESIGNATED_GROUPS: DesignatedGroup[] = [
  {
    DesignatedID: 'DSG001',
    GroupName: 'Barangay San Juan Field Team',
    GroupCode: 'BSJ-01',
    Description: 'Covering the coastal residential blocks of Barangay San Juan',
    CreatedDate: '2026-05-30'
  },
  {
    DesignatedID: 'DSG002',
    GroupName: 'Barangay Santa Lucia Field Team',
    GroupCode: 'BSL-02',
    Description: 'Covering the commercial zones of Barangay Santa Lucia',
    CreatedDate: '2026-05-30'
  },
  {
    DesignatedID: 'DSG003',
    GroupName: 'Barangay Santo Cristo Mobile Clinic',
    GroupCode: 'BSC-03',
    Description: 'Dedicated to inner hillside sub-sectors of Santo Cristo',
    CreatedDate: '2026-05-30'
  }
];

const STORAGE_KEYS = {
  EMPLOYEES: 'st_francis_employees',
  GROUPS: 'st_francis_groups',
  RECORDS: 'st_francis_records',
  LOGS: 'st_francis_logs',
  NOTIFICATIONS: 'st_francis_notifications',
  DESIGNATED_GROUPS: 'st_francis_designated_groups',
  BARANGAYS: 'st_francis_barangays',
};

const DEFAULT_BARANGAYS: Barangay[] = [
  { BarangayID: 'BGY001', Name: 'Barangay San Juan', City: 'Metro Manila', Description: 'Coastal residential sector', CreatedDate: '2026-05-30' },
  { BarangayID: 'BGY002', Name: 'Barangay Santa Lucia', City: 'Metro Manila', Description: 'Commercial downtown sector', CreatedDate: '2026-05-30' },
  { BarangayID: 'BGY003', Name: 'Barangay Santo Cristo', City: 'Metro Manila', Description: 'Inner hillside sub-sector', CreatedDate: '2026-05-30' }
];

// Client-side state configurations
let useLocalDB = false;
if (typeof window !== 'undefined') {
  const host = window.location.hostname;
  if (
    host.includes('netlify.app') || 
    host.includes('netlify') || 
    host.includes('github.io') || 
    host.includes('vercel.app') ||
    localStorage.getItem('force_local_db') === 'true'
  ) {
    useLocalDB = true;
  }
}

function getLocalItem<T>(key: string, defaults: T[]): T[] {
  if (typeof window === 'undefined') return defaults;
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }
  try {
    return JSON.parse(item);
  } catch {
    return defaults;
  }
}

function setLocalItem<T>(key: string, data: T[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

function addLocalLog(userId: string, activity: string) {
  const logs = getLocalItem<ActivityLog>(STORAGE_KEYS.LOGS, DEFAULT_LOGS);
  const newLog: ActivityLog = {
    LogID: `LOG${String(logs.length + 1).padStart(3, '0')}`,
    UserID: userId || 'system',
    Activity: activity,
    DateTime: new Date().toISOString(),
    IPAddress: '127.0.0.1',
  };
  logs.unshift(newLog);
  setLocalItem(STORAGE_KEYS.LOGS, logs);
}

function addLocalNotification(targetUserId: string, sourceUserId: string, title: string, message: string, type: 'success' | 'info' | 'warning') {
  const notifs = getLocalItem<Notification>(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
  const newNotif: Notification = {
    NotificationID: `NOT${String(Date.now())}`,
    TargetUserID: targetUserId,
    SourceUserID: sourceUserId,
    Title: title,
    Message: message,
    Type: type,
    CreatedDate: new Date().toISOString(),
    IsRead: false,
  };
  notifs.unshift(newNotif);
  setLocalItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
}

const simulatedApi = {
  verifyUsername: async (username: string) => {
    const employees = getLocalItem<Employee>(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
    const employee = employees.find(
      (e) => e.Username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!employee) {
      throw new Error('Employee username not found.');
    }

    if (employee.Status === 'Suspended') {
      throw new Error('Your account has been suspended. Please contact the administrator.');
    }

    if (employee.Status === 'Revoked') {
      throw new Error('Your account access has been revoked.');
    }

    const { PINCode, ...safeEmployee } = employee;
    return { success: true, employee: safeEmployee };
  },

  verifyPin: async (username: string, pinCode: string) => {
    const employees = getLocalItem<Employee>(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
    const employee = employees.find(
      (e) => e.Username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!employee) {
      throw new Error('Employee not found.');
    }

    if (employee.PINCode !== pinCode) {
      throw new Error('Invalid PIN Code. Please check the credentials and try again.');
    }

    if (employee.Status !== 'Active') {
      throw new Error(`Account status details: ${employee.Status}`);
    }

    const { PINCode: _pin, ...safeEmployee } = employee;
    return { success: true, user: safeEmployee, employee: safeEmployee };
  },

  getEmployees: async () => {
    return getLocalItem<Employee>(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
  },

  createEmployee: async (data: Partial<Employee>, creatorId: string) => {
    const employees = getLocalItem<Employee>(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
    const newId = `EMP${String(employees.length + 1).padStart(3, '0')}`;
    const newEmp: Employee = {
      EmployeeID: newId,
      FullName: data.FullName || '',
      Username: data.Username || '',
      PINCode: data.PINCode || '1234',
      Position: data.Position || 'Co-Leader',
      Status: 'Active',
      ContactNumber: data.ContactNumber || '',
      CreatedDate: new Date().toISOString().split('T')[0],
    };
    employees.push(newEmp);
    setLocalItem(STORAGE_KEYS.EMPLOYEES, employees);
    
    addLocalLog(creatorId, `Created Employee Profile for ID: ${newId}`);
    return { success: true, employee: newEmp };
  },

  updateEmployee: async (id: string, data: Partial<Employee>, modifierId: string) => {
    const employees = getLocalItem<Employee>(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
    const idx = employees.findIndex(e => e.EmployeeID === id);
    if (idx !== -1) {
      employees[idx] = { ...employees[idx], ...data };
      setLocalItem(STORAGE_KEYS.EMPLOYEES, employees);
      addLocalLog(modifierId, `Updated Employee Profile ID: ${id}`);
      return { success: true, employee: employees[idx] };
    }
    throw new Error('Employee profile not found.');
  },

  deleteEmployee: async (id: string, modifierId: string) => {
    const employees = getLocalItem<Employee>(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
    const idx = employees.findIndex(e => e.EmployeeID === id);
    if (idx !== -1) {
      employees[idx].Status = 'Revoked';
      setLocalItem(STORAGE_KEYS.EMPLOYEES, employees);
      addLocalLog(modifierId, `Soft deleted (Profile Revoked) Employee ID: ${id}`);
      return { success: true };
    }
    throw new Error('Employee profile not found.');
  },

  getGroups: async (userId?: string) => {
    const groups = getLocalItem<Group>(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS);
    if (userId) {
      const employees = getLocalItem<Employee>(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
      const requester = employees.find(e => e.EmployeeID === userId);
      if (requester && requester.Position !== 'Admin') {
        return groups.filter(g => g.LeaderID === userId || g.CoLeaderIDs.includes(userId));
      }
    }
    return groups;
  },

  createGroup: async (data: Partial<Group>, creatorId: string) => {
    const groups = getLocalItem<Group>(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS);
    const newId = `GRP${String(groups.length + 1).padStart(3, '0')}`;
    const newGroup: Group = {
      GroupID: newId,
      GroupName: data.GroupName || '',
      GroupCode: data.GroupCode || '',
      LeaderID: data.LeaderID || '',
      CoLeaderIDs: data.CoLeaderIDs || [],
      PayoutRate: data.PayoutRate || 50,
      StartDate: data.StartDate || new Date().toISOString().split('T')[0],
      Status: 'Active',
    };
    groups.push(newGroup);
    setLocalItem(STORAGE_KEYS.GROUPS, groups);
    
    addLocalLog(creatorId, `Created field team group ID: ${newId}`);
    return { success: true, group: newGroup };
  },

  updateGroup: async (id: string, data: Partial<Group>, modifierId: string) => {
    const groups = getLocalItem<Group>(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS);
    const idx = groups.findIndex(g => g.GroupID === id);
    if (idx !== -1) {
      groups[idx] = { ...groups[idx], ...data };
      setLocalItem(STORAGE_KEYS.GROUPS, groups);
      addLocalLog(modifierId, `Updated field team group ID: ${id}`);
      return { success: true, group: groups[idx] };
    }
    throw new Error('Group not found.');
  },

  deleteGroup: async (id: string, modifierId: string) => {
    const groups = getLocalItem<Group>(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS);
    const idx = groups.findIndex(g => g.GroupID === id);
    if (idx !== -1) {
      groups[idx].Status = 'Retired';
      setLocalItem(STORAGE_KEYS.GROUPS, groups);
      addLocalLog(modifierId, `Retired/Soft-deleted group ID: ${id}`);
      return { success: true };
    }
    throw new Error('Group not found.');
  },

  hardDeleteGroup: async (id: string, modifierId: string) => {
    const groups = getLocalItem<Group>(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS);
    const idx = groups.findIndex(g => g.GroupID === id);
    if (idx !== -1) {
      const deletedName = groups[idx].GroupName;
      groups.splice(idx, 1);
      setLocalItem(STORAGE_KEYS.GROUPS, groups);
      addLocalLog(modifierId, `Permanently hard deleted group: ${deletedName}`);
      return { success: true };
    }
    throw new Error('Group not found.');
  },

  getRecords: async (userId?: string) => {
    const records = getLocalItem<ClinicRecord>(STORAGE_KEYS.RECORDS, DEFAULT_RECORDS);
    if (userId) {
      const employees = getLocalItem<Employee>(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
      const requester = employees.find(e => e.EmployeeID === userId);
      if (requester && requester.Position !== 'Admin') {
        const groups = getLocalItem<Group>(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS);
        const myGroupIds = groups
          .filter(g => g.LeaderID === userId || g.CoLeaderIDs.includes(userId))
          .map(g => g.GroupID);
        return records.filter(r => myGroupIds.includes(r.GroupID));
      }
    }
    return records;
  },

  createRecord: async (data: Partial<ClinicRecord>, creatorId: string) => {
    const records = getLocalItem<ClinicRecord>(STORAGE_KEYS.RECORDS, DEFAULT_RECORDS);
    const newId = `REC${String(records.length + 1).padStart(3, '0')}`;
    
    const groups = getLocalItem<Group>(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS);
    const group = groups.find(g => g.GroupID === data.GroupID);
    const payoutRate = group ? group.PayoutRate : (data.PayoutRate || 50);
    const personCount = data.PersonCount || 1;
    const computedPayout = personCount * payoutRate;

    const newRec: ClinicRecord = {
      RecordID: newId,
      GroupID: data.GroupID || '',
      LeaderID: creatorId || '',
      HouseNumber: data.HouseNumber || '',
      PersonCount: personCount,
      PayoutRate: payoutRate,
      TotalPayout: computedPayout,
      Remarks: data.Remarks || '',
      CreatedDate: new Date().toISOString(),
    };
    records.push(newRec);
    setLocalItem(STORAGE_KEYS.RECORDS, records);
    
    addLocalLog(creatorId, `Submitted survey record ID: ${newId} (payout: PHP ${computedPayout})`);
    
    const employees = getLocalItem<Employee>(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
    const creator = employees.find(e => e.EmployeeID === creatorId);
    const creatorName = creator ? creator.FullName : 'Field Specialist';
    const groupName = group ? group.GroupName : 'Field Team';
    const msg = `${creatorName} submitted a field entry for ${groupName} (${personCount} people, Total PHP ${computedPayout}).`;
    addLocalNotification('admin', creatorId, 'New Field Survey Recorded', msg, 'success');

    return { success: true, record: newRec };
  },

  updateRecord: async (id: string, data: Partial<ClinicRecord>, modifierId: string) => {
    const records = getLocalItem<ClinicRecord>(STORAGE_KEYS.RECORDS, DEFAULT_RECORDS);
    const idx = records.findIndex(r => r.RecordID === id);
    if (idx !== -1) {
      const updated = { ...records[idx], ...data };
      if (data.PersonCount !== undefined || data.PayoutRate !== undefined) {
        updated.TotalPayout = updated.PersonCount * updated.PayoutRate;
      }
      records[idx] = updated;
      setLocalItem(STORAGE_KEYS.RECORDS, records);
      addLocalLog(modifierId, `Updated survey record ID: ${id}`);
      return { success: true, record: updated };
    }
    throw new Error('Survey record not found.');
  },

  deleteRecord: async (id: string, modifierId: string) => {
    const records = getLocalItem<ClinicRecord>(STORAGE_KEYS.RECORDS, DEFAULT_RECORDS);
    const idx = records.findIndex(r => r.RecordID === id);
    if (idx !== -1) {
      records.splice(idx, 1);
      setLocalItem(STORAGE_KEYS.RECORDS, records);
      addLocalLog(modifierId, `Physical deletion of survey record ID: ${id}`);
      return { success: true };
    }
    throw new Error('Survey record not found.');
  },

  getAnalytics: async () => {
    const employees = getLocalItem<Employee>(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
    const groups = getLocalItem<Group>(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS);
    const records = getLocalItem<ClinicRecord>(STORAGE_KEYS.RECORDS, DEFAULT_RECORDS);

    const totalEmployees = employees.filter(e => e.Status !== 'Revoked').length;
    const activeEmployees = employees.filter(e => e.Status === 'Active').length;
    const suspendedEmployees = employees.filter(e => e.Status === 'Suspended').length;
    const totalGroups = groups.filter(g => g.Status === 'Active').length;
    const totalRecords = records.length;
    const totalPayouts = records.reduce((sum, r) => sum + r.TotalPayout, 0);

    const groupPerformance = groups.map(g => {
      const groupRecs = records.filter(r => r.GroupID === g.GroupID);
      const totalPeople = groupRecs.reduce((sum, r) => sum + r.PersonCount, 0);
      const totalPayout = groupRecs.reduce((sum, r) => sum + r.TotalPayout, 0);
      return {
        GroupID: g.GroupID,
        GroupName: g.GroupName,
        GroupCode: g.GroupCode,
        RecordsCount: groupRecs.length,
        PeopleCount: totalPeople,
        PayoutSum: totalPayout,
      };
    });

    const dailySubmissions: { [key: string]: { count: number; payout: number; people: number } } = {};
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailySubmissions[dateStr] = { count: 0, payout: 0, people: 0 };
    }

    records.forEach(r => {
      const dateStr = r.CreatedDate.split('T')[0];
      if (dailySubmissions[dateStr]) {
        dailySubmissions[dateStr].count += 1;
        dailySubmissions[dateStr].payout += r.TotalPayout;
        dailySubmissions[dateStr].people += r.PersonCount;
      }
    });

    const dailyChartData = Object.keys(dailySubmissions).map(date => ({
      date,
      submissions: dailySubmissions[date].count,
      payout: dailySubmissions[date].payout,
      people: dailySubmissions[date].people,
    }));

    return {
      summary: {
        totalEmployees,
        activeEmployees,
        suspendedEmployees,
        totalGroups,
        totalRecords,
        totalPayouts,
      },
      groupPerformance,
      dailyChartData,
    };
  },

  getNotifications: async (username?: string) => {
    const notifs = getLocalItem<Notification>(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    const filtered = notifs.filter(
      n => !n.TargetUserID || n.TargetUserID === 'admin' || n.TargetUserID === username
    );
    return filtered.slice(0, 50);
  },

  markNotificationRead: async (id: string) => {
    const notifs = getLocalItem<Notification>(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    const idx = notifs.findIndex(n => n.NotificationID === id);
    if (idx !== -1) {
      notifs[idx].IsRead = true;
      setLocalItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
      return { success: true };
    }
    throw new Error('Notification not found.');
  },

  getLogs: async () => {
    return getLocalItem<ActivityLog>(STORAGE_KEYS.LOGS, DEFAULT_LOGS);
  },

  getDesignatedGroups: async () => {
    return getLocalItem<DesignatedGroup>(STORAGE_KEYS.DESIGNATED_GROUPS, DEFAULT_DESIGNATED_GROUPS);
  },

  createDesignatedGroup: async (data: Partial<DesignatedGroup>, creatorId: string) => {
    const list = getLocalItem<DesignatedGroup>(STORAGE_KEYS.DESIGNATED_GROUPS, DEFAULT_DESIGNATED_GROUPS);
    const maxIdNum = list.reduce((max, d) => {
      const num = parseInt(d.DesignatedID.replace(/[^0-9]/g, '') || '0', 10);
      return num > max ? num : max;
    }, 0);
    const DesignatedID = 'DSG' + String(maxIdNum + 1).padStart(3, '0');

    const newItem: DesignatedGroup = {
      DesignatedID,
      GroupName: data.GroupName || 'Unnamed Preset Group',
      GroupCode: (data.GroupCode || 'GEN-01').toUpperCase(),
      Description: data.Description || '',
      CreatedDate: new Date().toISOString().split('T')[0]
    };

    list.push(newItem);
    setLocalItem(STORAGE_KEYS.DESIGNATED_GROUPS, list);
    addLocalLog(creatorId, `Created designated group template: ${newItem.GroupName}`);
    return { success: true, designatedGroup: newItem };
  },

  updateDesignatedGroup: async (id: string, data: Partial<DesignatedGroup>, modifierId: string) => {
    const list = getLocalItem<DesignatedGroup>(STORAGE_KEYS.DESIGNATED_GROUPS, DEFAULT_DESIGNATED_GROUPS);
    const idx = list.findIndex(d => d.DesignatedID === id);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        GroupName: data.GroupName || list[idx].GroupName,
        GroupCode: (data.GroupCode || list[idx].GroupCode).toUpperCase(),
        Description: data.Description !== undefined ? data.Description : list[idx].Description
      };
      setLocalItem(STORAGE_KEYS.DESIGNATED_GROUPS, list);
      addLocalLog(modifierId, `Updated designated group template details for ID: ${id}`);
      return { success: true, designatedGroup: list[idx] };
    }
    throw new Error('Designated group template not found.');
  },

  deleteDesignatedGroup: async (id: string, modifierId: string) => {
    const list = getLocalItem<DesignatedGroup>(STORAGE_KEYS.DESIGNATED_GROUPS, DEFAULT_DESIGNATED_GROUPS);
    const idx = list.findIndex(d => d.DesignatedID === id);
    if (idx !== -1) {
      const deletedName = list[idx].GroupName;
      list.splice(idx, 1);
      setLocalItem(STORAGE_KEYS.DESIGNATED_GROUPS, list);
      addLocalLog(modifierId, `Deleted designated group template: ${deletedName}`);
      return { success: true };
    }
    throw new Error('Designated group template not found.');
  },

  getBarangays: async () => {
    return getLocalItem<Barangay>(STORAGE_KEYS.BARANGAYS, DEFAULT_BARANGAYS);
  },

  createBarangay: async (data: Partial<Barangay>, creatorId: string) => {
    const list = getLocalItem<Barangay>(STORAGE_KEYS.BARANGAYS, DEFAULT_BARANGAYS);
    const maxIdNum = list.reduce((max, b) => {
      const num = parseInt(b.BarangayID.replace(/[^0-9]/g, '') || '0', 10);
      return num > max ? num : max;
    }, 0);
    const BarangayID = 'BGY' + String(maxIdNum + 1).padStart(3, '0');

    const newItem: Barangay = {
      BarangayID,
      Name: data.Name || 'Unnamed Barangay',
      City: data.City || 'Metro Manila',
      Description: data.Description || '',
      CreatedDate: new Date().toISOString().split('T')[0]
    };

    list.push(newItem);
    setLocalItem(STORAGE_KEYS.BARANGAYS, list);
    addLocalLog(creatorId, `Created approved barangay: ${newItem.Name}`);
    return { success: true, barangay: newItem };
  },

  updateBarangay: async (id: string, data: Partial<Barangay>, modifierId: string) => {
    const list = getLocalItem<Barangay>(STORAGE_KEYS.BARANGAYS, DEFAULT_BARANGAYS);
    const idx = list.findIndex(b => b.BarangayID === id);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        Name: data.Name || list[idx].Name,
        City: data.City || list[idx].City,
        Description: data.Description !== undefined ? data.Description : list[idx].Description
      };
      setLocalItem(STORAGE_KEYS.BARANGAYS, list);
      addLocalLog(modifierId, `Updated approved barangay: ${list[idx].Name}`);
      return { success: true, barangay: list[idx] };
    }
    throw new Error('Barangay not found.');
  },

  deleteBarangay: async (id: string, modifierId: string) => {
    const list = getLocalItem<Barangay>(STORAGE_KEYS.BARANGAYS, DEFAULT_BARANGAYS);
    const idx = list.findIndex(b => b.BarangayID === id);
    if (idx !== -1) {
      const deletedName = list[idx].Name;
      list.splice(idx, 1);
      setLocalItem(STORAGE_KEYS.BARANGAYS, list);
      addLocalLog(modifierId, `Deleted approved barangay: ${deletedName}`);
      return { success: true };
    }
    throw new Error('Barangay not found.');
  },
};

function isStaticError(error: any): boolean {
  const msg = error?.message || '';
  return (
    msg.includes('API error: 404') ||
    msg.includes('Unexpected token') ||
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError')
  );
}

async function withFallback<T>(apiCall: () => Promise<T>, fallbackCall: () => Promise<T>): Promise<T> {
  if (useLocalDB) {
    return fallbackCall();
  }
  try {
    return await apiCall();
  } catch (err: any) {
    if (isStaticError(err)) {
      console.warn('Backend server not detected (Static hosting like Netlify). Activating client-side localStorage database fallback.');
      useLocalDB = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('force_local_db', 'true');
      }
      return fallbackCall();
    }
    throw err;
  }
}

export const api = {
  // Auth
  verifyUsername: (username: string) => 
    withFallback(
      () => apiRequest('/api/auth/verify-username', 'POST', { username }),
      () => simulatedApi.verifyUsername(username)
    ),
    
  verifyPin: (username: string, pinCode: string) => 
    withFallback(
      () => apiRequest('/api/auth/verify-pin', 'POST', { username, pinCode }),
      () => simulatedApi.verifyPin(username, pinCode)
    ),

  // Employees
  getEmployees: () => 
    withFallback(
      () => apiRequest('/api/employees'),
      () => simulatedApi.getEmployees()
    ),
    
  createEmployee: (data: Partial<Employee>, creatorId: string) => 
    withFallback(
      () => apiRequest('/api/employees', 'POST', data, creatorId),
      () => simulatedApi.createEmployee(data, creatorId)
    ),
    
  updateEmployee: (id: string, data: Partial<Employee>, modifierId: string) => 
    withFallback(
      () => apiRequest(`/api/employees/${id}`, 'PUT', data, modifierId),
      () => simulatedApi.updateEmployee(id, data, modifierId)
    ),
    
  deleteEmployee: (id: string, modifierId: string) => 
    withFallback(
      () => apiRequest(`/api/employees/${id}`, 'DELETE', undefined, modifierId),
      () => simulatedApi.deleteEmployee(id, modifierId)
    ),

  // Groups
  getGroups: (userId?: string) => 
    withFallback(
      () => apiRequest('/api/groups', 'GET', undefined, userId),
      () => simulatedApi.getGroups(userId)
    ),
    
  createGroup: (data: Partial<Group>, creatorId: string) => 
    withFallback(
      () => apiRequest('/api/groups', 'POST', data, creatorId),
      () => simulatedApi.createGroup(data, creatorId)
    ),
    
  updateGroup: (id: string, data: Partial<Group>, modifierId: string) => 
    withFallback(
      () => apiRequest(`/api/groups/${id}`, 'PUT', data, modifierId),
      () => simulatedApi.updateGroup(id, data, modifierId)
    ),
    
  deleteGroup: (id: string, modifierId: string) => 
    withFallback(
      () => apiRequest(`/api/groups/${id}`, 'DELETE', undefined, modifierId),
      () => simulatedApi.deleteGroup(id, modifierId)
    ),

  hardDeleteGroup: (id: string, modifierId: string) => 
    withFallback(
      () => apiRequest(`/api/groups/${id}/permanent`, 'DELETE', undefined, modifierId),
      () => simulatedApi.hardDeleteGroup(id, modifierId)
    ),

  // Records
  getRecords: (userId?: string) => 
    withFallback(
      () => apiRequest('/api/records', 'GET', undefined, userId),
      () => simulatedApi.getRecords(userId)
    ),
    
  createRecord: (data: Partial<ClinicRecord>, creatorId: string) => 
    withFallback(
      () => apiRequest('/api/records', 'POST', data, creatorId),
      () => simulatedApi.createRecord(data, creatorId)
    ),
    
  updateRecord: (id: string, data: Partial<ClinicRecord>, modifierId: string) => 
    withFallback(
      () => apiRequest(`/api/records/${id}`, 'PUT', data, modifierId),
      () => simulatedApi.updateRecord(id, data, modifierId)
    ),
    
  deleteRecord: (id: string, modifierId: string) => 
    withFallback(
      () => apiRequest(`/api/records/${id}`, 'DELETE', undefined, modifierId),
      () => simulatedApi.deleteRecord(id, modifierId)
    ),

  // Admin Analytics
  getAnalytics: () => 
    withFallback(
      () => apiRequest('/api/admin/analytics'),
      () => simulatedApi.getAnalytics()
    ),

  // Notifications
  getNotifications: (username?: string) => 
    withFallback(
      () => apiRequest(`/api/notifications${username ? `?username=${username}` : ''}`),
      () => simulatedApi.getNotifications(username)
    ),
    
  markNotificationRead: (id: string) => 
    withFallback(
      () => apiRequest(`/api/notifications/${id}/read`, 'POST'),
      () => simulatedApi.markNotificationRead(id)
    ),

  // Logs
  getLogs: () => 
    withFallback(
      () => apiRequest('/api/logs'),
      () => simulatedApi.getLogs()
    ),

  // Designated Groups
  getDesignatedGroups: () =>
    withFallback(
      () => apiRequest('/api/designated-groups'),
      () => simulatedApi.getDesignatedGroups()
    ),

  createDesignatedGroup: (data: Partial<DesignatedGroup>, creatorId: string) =>
    withFallback(
      () => apiRequest('/api/designated-groups', 'POST', data, creatorId),
      () => simulatedApi.createDesignatedGroup(data, creatorId)
    ),

  updateDesignatedGroup: (id: string, data: Partial<DesignatedGroup>, modifierId: string) =>
    withFallback(
      () => apiRequest(`/api/designated-groups/${id}`, 'PUT', data, modifierId),
      () => simulatedApi.updateDesignatedGroup(id, data, modifierId)
    ),

  deleteDesignatedGroup: (id: string, modifierId: string) =>
    withFallback(
      () => apiRequest(`/api/designated-groups/${id}`, 'DELETE', undefined, modifierId),
      () => simulatedApi.deleteDesignatedGroup(id, modifierId)
    ),

  // Barangays Settings API
  getBarangays: () =>
    withFallback(
      () => apiRequest('/api/barangays'),
      () => simulatedApi.getBarangays()
    ),

  createBarangay: (data: Partial<Barangay>, creatorId: string) =>
    withFallback(
      () => apiRequest('/api/barangays', 'POST', data, creatorId),
      () => simulatedApi.createBarangay(data, creatorId)
    ),

  updateBarangay: (id: string, data: Partial<Barangay>, modifierId: string) =>
    withFallback(
      () => apiRequest(`/api/barangays/${id}`, 'PUT', data, modifierId),
      () => simulatedApi.updateBarangay(id, data, modifierId)
    ),

  deleteBarangay: (id: string, modifierId: string) =>
    withFallback(
      () => apiRequest(`/api/barangays/${id}`, 'DELETE', undefined, modifierId),
      () => simulatedApi.deleteBarangay(id, modifierId)
    )
};
