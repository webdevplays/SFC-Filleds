/**
 * Saint Francis Clinic - Employee Group Records Management System Shared Types
 */

export type EmployeePosition = 'Admin' | 'Leader' | 'Co-Leader';
export type EmployeeStatus = 'Active' | 'Suspended' | 'Revoked';

export interface Employee {
  EmployeeID: string;
  FullName: string;
  Username: string;
  PINCode: string; // Enforce PIN verification
  Position: EmployeePosition;
  Status: EmployeeStatus;
  ContactNumber: string;
  CreatedDate: string;
  Address?: string; // Approved Barangay address or other configured address
}

export interface Group {
  GroupID: string;
  GroupName: string;
  GroupCode: string;
  LeaderID: string; // EmployeeID of Leader
  CoLeaderIDs: string[]; // List of EmployeeIDs for Co-Leaders
  PayoutRate: number; // Decimal/Float or integer PHP per person
  StartDate: string; // YYYY-MM-DD
  Status: 'Active' | 'Retired';
}

export interface ClinicRecord {
  RecordID: string;
  GroupID: string;
  LeaderID: string; // Submitted by Leader
  HouseNumber: string;
  PersonCount: number;
  PayoutRate: number; // Value at the time of submission
  TotalPayout: number; // PersonCount * PayoutRate
  Remarks: string;
  CreatedDate: string; // ISO / YYYY-MM-DD T HH:mm:ss
  IsPaid?: boolean;
  PaidDate?: string;
}

export interface ActivityLog {
  LogID: string;
  UserID: string; // Username or EmployeeID or 'System'
  Activity: string;
  DateTime: string;
  IPAddress: string;
}

export interface Notification {
  NotificationID: string;
  TargetUserID?: string; // If empty, visible to all Admins or general broadcast
  SourceUserID: string;
  Title: string;
  Message: string;
  Type: 'info' | 'success' | 'warning' | 'error';
  CreatedDate: string;
  IsRead: boolean;
}

export interface SessionData {
  user: {
    EmployeeID: string;
    FullName: string;
    Username: string;
    Position: EmployeePosition;
    Status: EmployeeStatus;
  } | null;
}

export interface DesignatedGroup {
  DesignatedID: string;
  GroupName: string;
  GroupCode: string;
  Description?: string;
  CreatedDate: string;
}

export interface Barangay {
  BarangayID: string;
  Name: string;
  City: string;
  Description?: string;
  CreatedDate: string;
}

