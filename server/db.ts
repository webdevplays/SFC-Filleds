import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { Employee, Group, ClinicRecord, ActivityLog, Notification, DesignatedGroup, Barangay } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const EMPLOYEES_FILE = path.join(DATA_DIR, 'employees.json');
const GROUPS_FILE = path.join(DATA_DIR, 'groups.json');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');
const LOGS_FILE = path.join(DATA_DIR, 'activity_logs.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');
const DESIGNATED_GROUPS_FILE = path.join(DATA_DIR, 'designated_groups.json');
const BARANGAYS_FILE = path.join(DATA_DIR, 'barangays.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default Admin and Sample Data for immediate visual polish and complete utility out-of-the-box
const DEFAULT_EMPLOYEES: Employee[] = [
  {
    EmployeeID: 'EMP001',
    FullName: 'Admin Director',
    Username: 'admin',
    PINCode: '1234', // For PIN verification
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
    PayoutRate: 50, // PHP 50 per person
    StartDate: '2026-02-15',
    Status: 'Active'
  },
  {
    GroupID: 'GRP002',
    GroupName: 'Barangay Santa Lucia Field Team',
    GroupCode: 'BSL-02',
    LeaderID: 'EMP002',
    CoLeaderIDs: ['EMP003'],
    PayoutRate: 75, // PHP 75 per person
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

// Helper to write file safely
function writeJSON(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper to read file safely
function readJSON(filePath: string, defaultData: any) {
  if (!fs.existsSync(filePath)) {
    writeJSON(filePath, defaultData);
    return defaultData;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`Error reading ${filePath}, restoring defaults`, e);
    writeJSON(filePath, defaultData);
    return defaultData;
  }
}

// Initial Local Load of files (acting as immediate fallback database)
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

let localEmployees: Employee[] = readJSON(EMPLOYEES_FILE, DEFAULT_EMPLOYEES);
let localGroups: Group[] = readJSON(GROUPS_FILE, DEFAULT_GROUPS);
let localRecords: ClinicRecord[] = readJSON(RECORDS_FILE, DEFAULT_RECORDS);
let localLogs: ActivityLog[] = readJSON(LOGS_FILE, DEFAULT_LOGS);
let localNotifications: Notification[] = readJSON(NOTIFICATIONS_FILE, DEFAULT_NOTIFICATIONS);
let localDesignatedGroups: DesignatedGroup[] = readJSON(DESIGNATED_GROUPS_FILE, DEFAULT_DESIGNATED_GROUPS);

const DEFAULT_BARANGAYS: Barangay[] = [
  { BarangayID: 'BGY001', Name: 'Barangay San Juan', City: 'Metro Manila', Description: 'Coastal residential sector', CreatedDate: '2026-05-30' },
  { BarangayID: 'BGY002', Name: 'Barangay Santa Lucia', City: 'Metro Manila', Description: 'Commercial downtown sector', CreatedDate: '2026-05-30' },
  { BarangayID: 'BGY003', Name: 'Barangay Santo Cristo', City: 'Metro Manila', Description: 'Inner hillside sub-sector', CreatedDate: '2026-05-30' }
];
let localBarangays: Barangay[] = readJSON(BARANGAYS_FILE, DEFAULT_BARANGAYS);

/**
 * GOOGLE SHEETS API CONFIGURATION
 */
function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!email || !privateKey || !spreadsheetId) {
    return null;
  }

  try {
    // If private key is base64 encoded, decode it.
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      const decoded = Buffer.from(privateKey, 'base64').toString('utf8');
      if (decoded.includes('-----BEGIN PRIVATE KEY-----')) {
        privateKey = decoded;
      }
    }
    // Clean up escaped newlines
    const formattedKey = privateKey.replace(/\\n/g, '\n');

    const auth = new google.auth.JWT({
      email: email,
      key: formattedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return {
      sheets: google.sheets({ version: 'v4', auth }),
      spreadsheetId,
    };
  } catch (error) {
    console.error('Failed to initialize Google Sheets Google Auth client:', error);
    return null;
  }
}

/**
 * Ensuring Sheets exist and are structured inside the SpreadSheet.
 */
async function ensureSheetsAndHeaders() {
  const client = getSheetsClient();
  if (!client) {
    console.log('Using robust locally persistent JSON file storage (No Google Sheets credentials provided).');
    return;
  }

  const { sheets, spreadsheetId } = client;
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = meta.data.sheets?.map(s => s.properties?.title) || [];

    const sheetsToCreate = [
      { name: 'Employees', headers: ['EmployeeID', 'FullName', 'Username', 'PINCode', 'Position', 'Status', 'ContactNumber', 'CreatedDate'] },
      { name: 'Groups', headers: ['GroupID', 'GroupName', 'GroupCode', 'LeaderID', 'CoLeaderIDs', 'PayoutRate', 'StartDate', 'Status'] },
      { name: 'Records', headers: ['RecordID', 'GroupID', 'LeaderID', 'HouseNumber', 'PersonCount', 'PayoutRate', 'TotalPayout', 'Remarks', 'CreatedDate', 'IsPaid', 'PaidDate'] },
      { name: 'ActivityLogs', headers: ['LogID', 'UserID', 'Activity', 'DateTime', 'IPAddress'] },
      { name: 'Notifications', headers: ['NotificationID', 'TargetUserID', 'SourceUserID', 'Title', 'Message', 'Type', 'CreatedDate', 'IsRead'] }
    ];

    for (const item of sheetsToCreate) {
      if (!existingSheets.includes(item.name)) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: { properties: { title: item.name } }
            }]
          }
        });
        // Write headers
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${item.name}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [item.headers]
          }
        });
        // Populate default data for brand new sheet to avoid empty screen
        if (item.name === 'Employees') {
          await syncEmployeesToSheets(DEFAULT_EMPLOYEES, sheets, spreadsheetId);
        } else if (item.name === 'Groups') {
          await syncGroupsToSheets(DEFAULT_GROUPS, sheets, spreadsheetId);
        } else if (item.name === 'Records') {
          await syncRecordsToSheets(DEFAULT_RECORDS, sheets, spreadsheetId);
        } else if (item.name === 'ActivityLogs') {
          await syncLogsToSheets(DEFAULT_LOGS, sheets, spreadsheetId);
        } else if (item.name === 'Notifications') {
          await syncNotificationsToSheets(DEFAULT_NOTIFICATIONS, sheets, spreadsheetId);
        }
      }
    }
    console.log('Google Sheets structure and authorization successfully validated!');
  } catch (error) {
    console.error('Error establishing connection / validation against Google Sheets:', error);
  }
}

// Perform sheets check on startup
ensureSheetsAndHeaders().catch(console.error);

/**
 * PRIVATE SYNCHRONIZATION UTILITIES FOR GOOGLE SHEETS FOR EACH COLLECTION (WRITE ONLY)
 */
async function syncEmployeesToSheets(employees: Employee[], sheets: any, spreadsheetId: string) {
  const values = [
    ['EmployeeID', 'FullName', 'Username', 'PINCode', 'Position', 'Status', 'ContactNumber', 'CreatedDate'],
    ...employees.map(e => [e.EmployeeID, e.FullName, e.Username, e.PINCode, e.Position, e.Status, e.ContactNumber, e.CreatedDate])
  ];
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Employees!A1:H1000',
    valueInputOption: 'RAW',
    requestBody: { values }
  });
}

async function syncGroupsToSheets(groups: Group[], sheets: any, spreadsheetId: string) {
  const values = [
    ['GroupID', 'GroupName', 'GroupCode', 'LeaderID', 'CoLeaderIDs', 'PayoutRate', 'StartDate', 'Status'],
    ...groups.map(g => [g.GroupID, g.GroupName, g.GroupCode, g.LeaderID, g.CoLeaderIDs.join(','), g.PayoutRate.toString(), g.StartDate, g.Status])
  ];
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Groups!A1:H1000',
    valueInputOption: 'RAW',
    requestBody: { values }
  });
}

async function syncRecordsToSheets(records: ClinicRecord[], sheets: any, spreadsheetId: string) {
  const values = [
    ['RecordID', 'GroupID', 'LeaderID', 'HouseNumber', 'PersonCount', 'PayoutRate', 'TotalPayout', 'Remarks', 'CreatedDate', 'IsPaid', 'PaidDate'],
    ...records.map(r => [
      r.RecordID,
      r.GroupID,
      r.LeaderID,
      r.HouseNumber,
      r.PersonCount.toString(),
      r.PayoutRate.toString(),
      r.TotalPayout.toString(),
      r.Remarks,
      r.CreatedDate,
      r.IsPaid ? 'TRUE' : 'FALSE',
      r.PaidDate || ''
    ])
  ];
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Records!A1:K10000',
    valueInputOption: 'RAW',
    requestBody: { values }
  });
}

async function syncLogsToSheets(logs: ActivityLog[], sheets: any, spreadsheetId: string) {
  const values = [
    ['LogID', 'UserID', 'Activity', 'DateTime', 'IPAddress'],
    ...logs.map(l => [l.LogID, l.UserID, l.Activity, l.DateTime, l.IPAddress])
  ];
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'ActivityLogs!A1:E10000',
    valueInputOption: 'RAW',
    requestBody: { values }
  });
}

async function syncNotificationsToSheets(notifs: Notification[], sheets: any, spreadsheetId: string) {
  const values = [
    ['NotificationID', 'TargetUserID', 'SourceUserID', 'Title', 'Message', 'Type', 'CreatedDate', 'IsRead'],
    ...notifs.map(n => [n.NotificationID, n.TargetUserID || '', n.SourceUserID, n.Title, n.Message, n.Type, n.CreatedDate, n.IsRead ? 'TRUE' : 'FALSE'])
  ];
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Notifications!A1:H10000',
    valueInputOption: 'RAW',
    requestBody: { values }
  });
}

/**
 * PUBLIC API TO ACCESS DB IN FULL MUTATIONAL MODE WITH FALLBACKS
 */
export async function getEmployees(): Promise<Employee[]> {
  const client = getSheetsClient();
  if (!client) {
    return localEmployees;
  }
  const { sheets, spreadsheetId } = client;
  try {
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Employees!A2:H1000' });
    const rows = response.data.values || [];
    const employees: Employee[] = rows.map(r => ({
      EmployeeID: r[0] || '',
      FullName: r[1] || '',
      Username: r[2] || '',
      PINCode: r[3] || '',
      Position: (r[4] || 'Co-Leader') as any,
      Status: (r[5] || 'Active') as any,
      ContactNumber: r[6] || '',
      CreatedDate: r[7] || ''
    })).filter(e => e.EmployeeID);

    // Save locally for cache / immediate response if Sheet fails next time
    if (employees.length > 0) {
      localEmployees = employees;
      writeJSON(EMPLOYEES_FILE, localEmployees);
    }
    return localEmployees;
  } catch (error) {
    console.error('Google Sheets read failed for Employees, falling back to local database.', error);
    return localEmployees;
  }
}

export async function saveEmployees(employees: Employee[]): Promise<void> {
  localEmployees = employees;
  writeJSON(EMPLOYEES_FILE, localEmployees);

  const client = getSheetsClient();
  if (client) {
    const { sheets, spreadsheetId } = client;
    try {
      await syncEmployeesToSheets(employees, sheets, spreadsheetId);
    } catch (e) {
      console.error('Sync to Google Sheets failed for Employees.', e);
    }
  }
}

export async function getGroups(): Promise<Group[]> {
  const client = getSheetsClient();
  if (!client) {
    return localGroups;
  }
  const { sheets, spreadsheetId } = client;
  try {
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Groups!A2:H1000' });
    const rows = response.data.values || [];
    const groups: Group[] = rows.map(r => ({
      GroupID: r[0] || '',
      GroupName: r[1] || '',
      GroupCode: r[2] || '',
      LeaderID: r[3] || '',
      CoLeaderIDs: r[4] ? r[4].split(',').map((id: string) => id.trim()).filter((id: string) => id) : [],
      PayoutRate: parseFloat(r[5] || '0'),
      StartDate: r[6] || '',
      Status: (r[7] || 'Active') as any
    })).filter(g => g.GroupID);

    if (groups.length > 0) {
      localGroups = groups;
      writeJSON(GROUPS_FILE, localGroups);
    }
    return localGroups;
  } catch (error) {
    console.error('Google Sheets read failed for Groups, falling back to local database.', error);
    return localGroups;
  }
}

export async function saveGroups(groups: Group[]): Promise<void> {
  localGroups = groups;
  writeJSON(GROUPS_FILE, localGroups);

  const client = getSheetsClient();
  if (client) {
    const { sheets, spreadsheetId } = client;
    try {
      await syncGroupsToSheets(groups, sheets, spreadsheetId);
    } catch (e) {
      console.error('Sync to Google Sheets failed for Groups.', e);
    }
  }
}

export async function getRecords(): Promise<ClinicRecord[]> {
  const client = getSheetsClient();
  if (!client) {
    return localRecords;
  }
  const { sheets, spreadsheetId } = client;
  try {
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Records!A2:K10000' });
    const rows = response.data.values || [];
    const records: ClinicRecord[] = rows.map(r => ({
      RecordID: r[0] || '',
      GroupID: r[1] || '',
      LeaderID: r[2] || '',
      HouseNumber: r[3] || '',
      PersonCount: parseInt(r[4] || '0', 10),
      PayoutRate: parseFloat(r[5] || '0'),
      TotalPayout: parseFloat(r[6] || '0'),
      Remarks: r[7] || '',
      CreatedDate: r[8] || '',
      IsPaid: r[9] === 'TRUE',
      PaidDate: r[10] || ''
    })).filter(rec => rec.RecordID);

    if (records.length > 0) {
      localRecords = records;
      writeJSON(RECORDS_FILE, localRecords);
    }
    return localRecords;
  } catch (error) {
    console.error('Google Sheets read failed for Records, falling back to local database.', error);
    return localRecords;
  }
}

export async function saveRecords(records: ClinicRecord[]): Promise<void> {
  localRecords = records;
  writeJSON(RECORDS_FILE, localRecords);

  const client = getSheetsClient();
  if (client) {
    const { sheets, spreadsheetId } = client;
    try {
      await syncRecordsToSheets(records, sheets, spreadsheetId);
    } catch (e) {
      console.error('Sync to Google Sheets failed for Records.', e);
    }
  }
}

export async function getLogs(): Promise<ActivityLog[]> {
  const client = getSheetsClient();
  if (!client) {
    return localLogs;
  }
  const { sheets, spreadsheetId } = client;
  try {
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'ActivityLogs!A2:E10000' });
    const rows = response.data.values || [];
    const logs: ActivityLog[] = rows.map(r => ({
      LogID: r[0] || '',
      UserID: r[1] || '',
      Activity: r[2] || '',
      DateTime: r[3] || '',
      IPAddress: r[4] || ''
    })).filter(l => l.LogID);

    if (logs.length > 0) {
      localLogs = logs;
      writeJSON(LOGS_FILE, localLogs);
    }
    return localLogs;
  } catch (error) {
    console.error('Google Sheets read failed for ActivityLogs, falling back to local database.', error);
    return localLogs;
  }
}

export async function saveLogs(logs: ActivityLog[]): Promise<void> {
  localLogs = logs;
  writeJSON(LOGS_FILE, localLogs);

  const client = getSheetsClient();
  if (client) {
    const { sheets, spreadsheetId } = client;
    try {
      await syncLogsToSheets(logs, sheets, spreadsheetId);
    } catch (e) {
      console.error('Sync to Google Sheets failed for ActivityLogs.', e);
    }
  }
}

export async function addLog(userId: string, activity: string, ip: string = '127.0.0.1'): Promise<void> {
  const logs = await getLogs();
  const nextId = 'LOG' + String(logs.length + 1).padStart(3, '0') + '-' + Date.now().toString().slice(-4);
  const newLog: ActivityLog = {
    LogID: nextId,
    UserID: userId,
    Activity: activity,
    DateTime: new Date().toISOString(),
    IPAddress: ip
  };
  logs.unshift(newLog); // Put new logs first
  await saveLogs(logs);
}

export async function getNotifications(): Promise<Notification[]> {
  const client = getSheetsClient();
  if (!client) {
    return localNotifications;
  }
  const { sheets, spreadsheetId } = client;
  try {
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Notifications!A2:H10000' });
    const rows = response.data.values || [];
    const notifs: Notification[] = rows.map(r => ({
      NotificationID: r[0] || '',
      TargetUserID: r[1] || undefined,
      SourceUserID: r[2] || '',
      Title: r[3] || '',
      Message: r[4] || '',
      Type: (r[5] || 'info') as any,
      CreatedDate: r[6] || '',
      IsRead: r[7] === 'TRUE'
    })).filter(n => n.NotificationID);

    if (notifs.length > 0) {
      localNotifications = notifs;
      writeJSON(NOTIFICATIONS_FILE, localNotifications);
    }
    return localNotifications;
  } catch (error) {
    console.error('Google Sheets read failed for Notifications, falling back to local database.', error);
    return localNotifications;
  }
}

export async function saveNotifications(notifs: Notification[]): Promise<void> {
  localNotifications = notifs;
  writeJSON(NOTIFICATIONS_FILE, localNotifications);

  const client = getSheetsClient();
  if (client) {
    const { sheets, spreadsheetId } = client;
    try {
      await syncNotificationsToSheets(notifs, sheets, spreadsheetId);
    } catch (e) {
      console.error('Sync to Google Sheets failed for Notifications.', e);
    }
  }
}

export async function addNotification(
  sourceUserId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error',
  targetUserId?: string
): Promise<void> {
  const notifs = await getNotifications();
  const nextId = 'NOT' + String(notifs.length + 1).padStart(3, '0') + '-' + Date.now().toString().slice(-4);
  const newNotif: Notification = {
    NotificationID: nextId,
    TargetUserID: targetUserId,
    SourceUserID: sourceUserId,
    Title: title,
    Message: message,
    Type: type,
    CreatedDate: new Date().toISOString(),
    IsRead: false
  };
  notifs.unshift(newNotif);
  await saveNotifications(notifs);
}

export async function getDesignatedGroups(): Promise<DesignatedGroup[]> {
  return localDesignatedGroups;
}

export async function saveDesignatedGroups(groups: DesignatedGroup[]): Promise<void> {
  localDesignatedGroups = groups;
  writeJSON(DESIGNATED_GROUPS_FILE, localDesignatedGroups);
}

export async function getBarangays(): Promise<Barangay[]> {
  return localBarangays;
}

export async function saveBarangays(list: Barangay[]): Promise<void> {
  localBarangays = list;
  writeJSON(BARANGAYS_FILE, localBarangays);
}
