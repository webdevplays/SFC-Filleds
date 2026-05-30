import { Employee, Group, ClinicRecord, ActivityLog, Notification } from './types';

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

export const api = {
  // Auth
  verifyUsername: (username: string) => 
    apiRequest('/api/auth/verify-username', 'POST', { username }),
    
  verifyPin: (username: string, pinCode: string) => 
    apiRequest('/api/auth/verify-pin', 'POST', { username, pinCode }),

  // Employees
  getEmployees: () => 
    apiRequest('/api/employees'),
    
  createEmployee: (data: Partial<Employee>, creatorId: string) => 
    apiRequest('/api/employees', 'POST', data, creatorId),
    
  updateEmployee: (id: string, data: Partial<Employee>, modifierId: string) => 
    apiRequest(`/api/employees/${id}`, 'PUT', data, modifierId),
    
  deleteEmployee: (id: string, modifierId: string) => 
    apiRequest(`/api/employees/${id}`, 'DELETE', undefined, modifierId),

  // Groups
  getGroups: (userId?: string) => 
    apiRequest('/api/groups', 'GET', undefined, userId),
    
  createGroup: (data: Partial<Group>, creatorId: string) => 
    apiRequest('/api/groups', 'POST', data, creatorId),
    
  updateGroup: (id: string, data: Partial<Group>, modifierId: string) => 
    apiRequest(`/api/groups/${id}`, 'PUT', data, modifierId),
    
  deleteGroup: (id: string, modifierId: string) => 
    apiRequest(`/api/groups/${id}`, 'DELETE', undefined, modifierId),

  // Records
  getRecords: (userId?: string) => 
    apiRequest('/api/records', 'GET', undefined, userId),
    
  createRecord: (data: Partial<ClinicRecord>, creatorId: string) => 
    apiRequest('/api/records', 'POST', data, creatorId),
    
  updateRecord: (id: string, data: Partial<ClinicRecord>, modifierId: string) => 
    apiRequest(`/api/records/${id}`, 'PUT', data, modifierId),
    
  deleteRecord: (id: string, modifierId: string) => 
    apiRequest(`/api/records/${id}`, 'DELETE', undefined, modifierId),

  // Admin Analytics
  getAnalytics: () => 
    apiRequest('/api/admin/analytics'),

  // Notifications
  getNotifications: (username?: string) => 
    apiRequest(`/api/notifications${username ? `?username=${username}` : ''}`),
    
  markNotificationRead: (id: string) => 
    apiRequest(`/api/notifications/${id}/read`, 'POST'),

  // Logs
  getLogs: () => 
    apiRequest('/api/logs')
};
