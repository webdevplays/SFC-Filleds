import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  getEmployees,
  saveEmployees,
  getGroups,
  saveGroups,
  getRecords,
  saveRecords,
  getLogs,
  addLog,
  getNotifications,
  saveNotifications,
  addNotification,
  getDesignatedGroups,
  saveDesignatedGroups,
  getBarangays,
  saveBarangays
} from './server/db';
import { Employee, Group, ClinicRecord, DesignatedGroup, Barangay } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Helper or middleware to log API requests if needed
  app.use((req, res, next) => {
    // Enable CORS for testing
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
  });

  /**
   * ==========================================
   * AUTHENTICATION API ROUTES (TWO-STEP LOGIN)
   * ==========================================
   */

  // Step 1: Verify Username
  app.post('/api/auth/verify-username', async (req, res) => {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ success: false, message: 'Username is required.' });
      }

      const employees = await getEmployees();
      const employee = employees.find(
        (e) => e.Username.toLowerCase() === username.trim().toLowerCase()
      );

      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee username not found.' });
      }

      if (employee.Status === 'Suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended. Please contact the administrator.'
        });
      }

      if (employee.Status === 'Revoked') {
        return res.status(403).json({
          success: false,
          message: 'Your account access has been revoked.'
        });
      }

      // Hide the PIN for Step 1
      const { PINCode, ...safeEmployee } = employee;
      res.json({ success: true, employee: safeEmployee });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Step 2: Verify PIN
  app.post('/api/auth/verify-pin', async (req, res) => {
    try {
      const { username, pinCode } = req.body;
      if (!username || !pinCode) {
        return res.status(400).json({ success: false, message: 'Username and PIN are required.' });
      }

      const employees = await getEmployees();
      const employee = employees.find(
        (e) => e.Username.toLowerCase() === username.trim().toLowerCase()
      );

      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found.' });
      }

      if (employee.Status !== 'Active') {
        return res.status(403).json({ success: false, message: `Account is current: ${employee.Status}` });
      }

      if (employee.PINCode !== pinCode.trim()) {
        return res.status(401).json({ success: false, message: 'Invalid PIN Code code.' });
      }

      // Record Activity Log
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      await addLog(employee.Username, `Dashboard Login successful (Session Created)`, ip);

      // Return user profile
      const { PINCode, ...safeEmployee } = employee;
      res.json({
        success: true,
        user: safeEmployee,
        token: `token-${employee.EmployeeID}-${Date.now().toString().slice(-4)}`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * ==========================================
   * EMPLOYEE MANAGEMENT API ROUTES (ADMIN ONLY)
   * ==========================================
   */

  // Fetch all employees
  app.get('/api/employees', async (req, res) => {
    try {
      const employees = await getEmployees();
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Create standard employee
  app.post('/api/employees', async (req, res) => {
    try {
      const { FullName, Username, PINCode, Position, ContactNumber, Address } = req.body;
      const creator = req.headers['x-user-id'] as string || 'Admin';

      if (!FullName || !Username || !PINCode || !Position) {
        return res.status(400).json({ success: false, message: 'Required fields missing: FullName, Username, PINCode, Position.' });
      }

      const employees = await getEmployees();

      // Check username collision
      if (employees.some(e => e.Username.toLowerCase() === Username.trim().toLowerCase())) {
        return res.status(400).json({ success: false, message: 'Username is already taken by another employee.' });
      }

      // Generate next EmployeeID
      const maxIdNum = employees.reduce((max, e) => {
        const num = parseInt(e.EmployeeID.slice(3) || '0', 10);
        return num > max ? num : max;
      }, 0);
      const EmployeeID = 'EMP' + String(maxIdNum + 1).padStart(3, '0');

      const newEmployee: Employee = {
        EmployeeID,
        FullName: FullName.trim(),
        Username: Username.trim(),
        PINCode: PINCode.trim(),
        Position: Position as any,
        Status: 'Active',
        ContactNumber: ContactNumber || '',
        Address: Address || '',
        CreatedDate: new Date().toISOString().split('T')[0]
      };

      employees.push(newEmployee);
      await saveEmployees(employees);

      // Log & Notify
      await addLog(creator, `Added security profile for Employee: ${newEmployee.FullName} (${EmployeeID})`);
      await addNotification(
        creator,
        'New Profile Created',
        `Employee profile ${newEmployee.FullName} (${EmployeeID}) successfully registered.`,
        'success'
      );

      res.status(201).json({ success: true, employee: newEmployee });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Edit employee
  app.put('/api/employees/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { FullName, Username, PINCode, Position, ContactNumber, Status, Address } = req.body;
      const modifier = req.headers['x-user-id'] as string || 'Admin';

      const employees = await getEmployees();
      const idx = employees.findIndex(e => e.EmployeeID === id);

      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Employee not found.' });
      }

      const existing = employees[idx];

      // Username duplicate check
      if (Username && Username.trim().toLowerCase() !== existing.Username.toLowerCase()) {
        if (employees.some(e => e.Username.toLowerCase() === Username.trim().toLowerCase())) {
          return res.status(400).json({ success: false, message: 'Username is already taken.' });
        }
      }

      if (Status && Status !== existing.Status) {
        if (Status === 'Suspended') {
          await addNotification('admin', 'Employee Suspended', `Account for ${existing.FullName} has been suspended.`, 'warning');
        }
      }

      employees[idx] = {
        ...existing,
        FullName: FullName !== undefined ? FullName.trim() : existing.FullName,
        Username: Username !== undefined ? Username.trim() : existing.Username,
        PINCode: PINCode !== undefined ? PINCode.trim() : existing.PINCode,
        Position: Position !== undefined ? Position : existing.Position,
        ContactNumber: ContactNumber !== undefined ? ContactNumber : existing.ContactNumber,
        Status: Status !== undefined ? Status : existing.Status,
        Address: Address !== undefined ? Address : existing.Address
      };

      await saveEmployees(employees);
      await addLog(modifier, `Updated profile for Employee ID: ${id}`);

      res.json({ success: true, employee: employees[idx] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Delete employee (permanently delete)
  app.delete('/api/employees/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const modifier = req.headers['x-user-id'] as string || 'Admin';

      const employees = await getEmployees();
      const idx = employees.findIndex(e => e.EmployeeID === id);

      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Employee not found.' });
      }

      const employee = employees[idx];
      const deletedName = employee.FullName;
      employees.splice(idx, 1);
      await saveEmployees(employees);

      await addLog(modifier, `Permanently deleted employee: ${deletedName} (ID: ${id})`);
      await addNotification(modifier, 'Employee Deleted Permanently', `Employee profile ${deletedName} was permanently deleted by Admin.`, 'error');

      res.json({ success: true, message: 'Employee profile permanently deleted.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * ==========================================
   * GROUP ASSIGNMENT API ROUTES (ADMIN ONLY)
   * ==========================================
   */

  // Fetch groups
  app.get('/api/groups', async (req, res) => {
    try {
      const requesterId = req.headers['x-user-id'] as string;
      const groups = await getGroups();
      
      if (requesterId) {
        const employees = await getEmployees();
        const requester = employees.find(e => e.EmployeeID === requesterId);
        if (requester && requester.Position !== 'Admin') {
          const myGroups = groups.filter(g => 
            g.LeaderID === requesterId || g.CoLeaderIDs.includes(requesterId)
          );
          return res.json(myGroups);
        }
      }
      
      res.json(groups);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Create Group
  app.post('/api/groups', async (req, res) => {
    try {
      const { GroupName, GroupCode, PayoutRate, LeaderID, CoLeaderIDs, StartDate } = req.body;
      const creator = req.headers['x-user-id'] as string || 'Admin';

      if (!GroupName || !GroupCode || PayoutRate === undefined || !LeaderID) {
        return res.status(400).json({ success: false, message: 'Required fields missing: GroupName, GroupCode, PayoutRate, LeaderID.' });
      }

      const groups = await getGroups();

      // Check group code collision
      if (groups.some(g => g.GroupCode.toLowerCase() === GroupCode.trim().toLowerCase())) {
        return res.status(400).json({ success: false, message: 'A group with this Group Code already exists.' });
      }

      const maxIdNum = groups.reduce((max, g) => {
        const num = parseInt(g.GroupID.slice(3) || '0', 10);
        return num > max ? num : max;
      }, 0);
      const GroupID = 'GRP' + String(maxIdNum + 1).padStart(3, '0');

      const newGroup: Group = {
        GroupID,
        GroupName: GroupName.trim(),
        GroupCode: GroupCode.trim().toUpperCase(),
        LeaderID,
        CoLeaderIDs: CoLeaderIDs || [],
        PayoutRate: Number(PayoutRate),
        StartDate: StartDate || new Date().toISOString().split('T')[0],
        Status: 'Active'
      };

      groups.push(newGroup);
      await saveGroups(groups);

      await addLog(creator, `Created field group ${newGroup.GroupName} (${GroupID}) with rate PHP ${newGroup.PayoutRate}`);
      await addNotification(
        creator,
        'Group Created',
        `Group ${newGroup.GroupName} established. Payout Rate: PHP ${newGroup.PayoutRate}/person.`,
        'success'
      );

      res.status(201).json({ success: true, group: newGroup });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Update Group
  app.put('/api/groups/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { GroupName, GroupCode, PayoutRate, LeaderID, CoLeaderIDs, StartDate, Status } = req.body;
      const modifier = req.headers['x-user-id'] as string || 'Admin';

      const groups = await getGroups();
      const idx = groups.findIndex(g => g.GroupID === id);

      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Group not found.' });
      }

      const existing = groups[idx];

      // Rate change notify trigger
      const rateChanged = PayoutRate !== undefined && Number(PayoutRate) !== existing.PayoutRate;

      groups[idx] = {
        ...existing,
        GroupName: GroupName !== undefined ? GroupName.trim() : existing.GroupName,
        GroupCode: GroupCode !== undefined ? GroupCode.trim().toUpperCase() : existing.GroupCode,
        PayoutRate: PayoutRate !== undefined ? Number(PayoutRate) : existing.PayoutRate,
        LeaderID: LeaderID !== undefined ? LeaderID : existing.LeaderID,
        CoLeaderIDs: CoLeaderIDs !== undefined ? CoLeaderIDs : existing.CoLeaderIDs,
        StartDate: StartDate !== undefined ? StartDate : existing.StartDate,
        Status: Status !== undefined ? Status : existing.Status
      };

      await saveGroups(groups);
      await addLog(modifier, `Updated group properties for Group ID: ${id}`);

      if (rateChanged) {
        await addNotification(
          modifier,
          'Payout Rate Updated',
          `Payout rate for group ${groups[idx].GroupName} has changed to PHP ${groups[idx].PayoutRate} per person.`,
          'info'
        );
      }

      res.json({ success: true, group: groups[idx] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Delete/Retire Group
  app.delete('/api/groups/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const modifier = req.headers['x-user-id'] as string || 'Admin';

      const groups = await getGroups();
      const idx = groups.findIndex(g => g.GroupID === id);

      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Group not found.' });
      }

      const group = groups[idx];
      group.Status = 'Retired';
      await saveGroups(groups);

      await addLog(modifier, `Retired/Soft-deleted group ID: ${id}`);
      await addNotification(modifier, 'Group Retired', `Group ${group.GroupName} is now inactive.`, 'warning');

      res.json({ success: true, message: 'Group retired successfully.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Permanently Hard Delete Group
  app.delete('/api/groups/:id/permanent', async (req, res) => {
    try {
      const { id } = req.params;
      const modifier = req.headers['x-user-id'] as string || 'Admin';

      const groups = await getGroups();
      const idx = groups.findIndex(g => g.GroupID === id);

      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Group not found.' });
      }

      const deletedGroupName = groups[idx].GroupName;
      groups.splice(idx, 1);
      await saveGroups(groups);

      await addLog(modifier, `Permanently deleted group: ${deletedGroupName}`);
      await addNotification(modifier, 'Group Deleted Permanently', `Group ${deletedGroupName} was deleted by Admin.`, 'error');

      res.json({ success: true, message: 'Group deleted permanently.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * ==========================================
   * DESIGNATED GROUP PRESETS (ADMIN TEMPLATES)
   * ==========================================
   */

  // Fetch Designated Groups
  app.get('/api/designated-groups', async (req, res) => {
    try {
      const list = await getDesignatedGroups();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Create Designated Group
  app.post('/api/designated-groups', async (req, res) => {
    try {
      const { GroupName, GroupCode, Description } = req.body;
      const creator = req.headers['x-user-id'] as string || 'Admin';

      if (!GroupName || !GroupCode) {
        return res.status(400).json({ success: false, message: 'Required fields missing: GroupName, GroupCode.' });
      }

      const list = await getDesignatedGroups();

      const maxIdNum = list.reduce((max, d) => {
        const num = parseInt(d.DesignatedID.replace(/[^0-9]/g, '') || '0', 10);
        return num > max ? num : max;
      }, 0);
      const DesignatedID = 'DSG' + String(maxIdNum + 1).padStart(3, '0');

      const newItem: DesignatedGroup = {
        DesignatedID,
        GroupName: GroupName.trim(),
        GroupCode: GroupCode.trim().toUpperCase(),
        Description: Description ? Description.trim() : '',
        CreatedDate: new Date().toISOString().split('T')[0]
      };

      list.push(newItem);
      await saveDesignatedGroups(list);

      await addLog(creator, `Created designated group template: ${GroupName.trim()}`);
      res.json({ success: true, designatedGroup: newItem });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Update Designated Group
  app.put('/api/designated-groups/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { GroupName, GroupCode, Description } = req.body;
      const modifier = req.headers['x-user-id'] as string || 'Admin';

      const list = await getDesignatedGroups();
      const idx = list.findIndex(d => d.DesignatedID === id);

      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Designated group template not found.' });
      }

      list[idx] = {
        ...list[idx],
        GroupName: GroupName ? GroupName.trim() : list[idx].GroupName,
        GroupCode: GroupCode ? GroupCode.trim().toUpperCase() : list[idx].GroupCode,
        Description: Description !== undefined ? Description.trim() : list[idx].Description
      };

      await saveDesignatedGroups(list);
      await addLog(modifier, `Updated designated group template details for ID: ${id}`);

      res.json({ success: true, designatedGroup: list[idx] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Delete Designated Group
  app.delete('/api/designated-groups/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const modifier = req.headers['x-user-id'] as string || 'Admin';

      const list = await getDesignatedGroups();
      const idx = list.findIndex(d => d.DesignatedID === id);

      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Designated group template not found.' });
      }

      const deletedName = list[idx].GroupName;
      list.splice(idx, 1);
      await saveDesignatedGroups(list);

      await addLog(modifier, `Deleted designated group template: ${deletedName}`);
      res.json({ success: true, message: 'Designated group template deleted successfully.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * ==========================================
   * APPROVED BARANGAY SETTINGS (ADMIN CONFIGURATION)
   * ==========================================
   */

  // Fetch all Barangays
  app.get('/api/barangays', async (req, res) => {
    try {
      const list = await getBarangays();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Create Barangay
  app.post('/api/barangays', async (req, res) => {
    try {
      const { Name, City, Description } = req.body;
      const creator = req.headers['x-user-id'] as string || 'Admin';

      if (!Name || !City) {
        return res.status(400).json({ success: false, message: 'Required fields missing: Name, City.' });
      }

      const list = await getBarangays();

      const maxIdNum = list.reduce((max, b) => {
        const num = parseInt(b.BarangayID.replace(/[^0-9]/g, '') || '0', 10);
        return num > max ? num : max;
      }, 0);
      const BarangayID = 'BGY' + String(maxIdNum + 1).padStart(3, '0');

      const newItem: Barangay = {
        BarangayID,
        Name: Name.trim(),
        City: City.trim(),
        Description: Description ? Description.trim() : '',
        CreatedDate: new Date().toISOString().split('T')[0]
      };

      list.push(newItem);
      await saveBarangays(list);

      await addLog(creator, `Created approved barangay sector: ${Name.trim()}`);
      res.json({ success: true, barangay: newItem });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Update Barangay
  app.put('/api/barangays/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { Name, City, Description } = req.body;
      const modifier = req.headers['x-user-id'] as string || 'Admin';

      const list = await getBarangays();
      const idx = list.findIndex(b => b.BarangayID === id);

      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Barangay not found.' });
      }

      list[idx] = {
        ...list[idx],
        Name: Name ? Name.trim() : list[idx].Name,
        City: City ? City.trim() : list[idx].City,
        Description: Description !== undefined ? Description.trim() : list[idx].Description
      };

      await saveBarangays(list);
      await addLog(modifier, `Updated details for Barangay ID: ${id}`);

      res.json({ success: true, barangay: list[idx] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Delete Barangay
  app.delete('/api/barangays/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const modifier = req.headers['x-user-id'] as string || 'Admin';

      const list = await getBarangays();
      const idx = list.findIndex(b => b.BarangayID === id);

      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Barangay not found.' });
      }

      const deletedName = list[idx].Name;
      list.splice(idx, 1);
      await saveBarangays(list);

      await addLog(modifier, `Deleted approved barangay: ${deletedName}`);
      res.json({ success: true, message: 'Barangay deleted successfully.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * ==========================================
   * CLINIC FIELD SURVEY RECORD MANAGEMENT API
   * ==========================================
   */

  // Fetch all records
  app.get('/api/records', async (req, res) => {
    try {
      const requesterId = req.headers['x-user-id'] as string;
      const records = await getRecords();
      
      if (requesterId) {
        const employees = await getEmployees();
        const requester = employees.find(e => e.EmployeeID === requesterId);
        if (requester && requester.Position !== 'Admin') {
          const groups = await getGroups();
          const myGroupIds = groups
            .filter(g => g.LeaderID === requesterId || g.CoLeaderIDs.includes(requesterId))
            .map(g => g.GroupID);
            
          const myRecords = records.filter(r => myGroupIds.includes(r.GroupID));
          return res.json(myRecords);
        }
      }
      
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Submit survey record (Only Leaders)
  app.post('/api/records', async (req, res) => {
    try {
      const { GroupID, LeaderID, HouseNumber, PersonCount, Remarks } = req.body;
      const creator = req.headers['x-user-id'] as string || LeaderID || 'Employee';

      if (!GroupID || !LeaderID || !HouseNumber || PersonCount === undefined) {
        return res.status(400).json({ success: false, message: 'Required fields missing: GroupID, LeaderID, HouseNumber, PersonCount.' });
      }

      // Check that Leader is assigning correctly
      const employees = await getEmployees();
      const leader = employees.find(e => e.EmployeeID === LeaderID);
      if (!leader || leader.Position !== 'Leader') {
        return res.status(403).json({ success: false, message: 'Only Employee Leaders are authorized to submit records.' });
      }

      // Fetch group rate
      const groups = await getGroups();
      const group = groups.find(g => g.GroupID === GroupID);
      if (!group) {
        return res.status(404).json({ success: false, message: 'Assigned field survey group not found.' });
      }

      const records = await getRecords();
      const maxIdNum = records.reduce((max, r) => {
        const num = Array.isArray(r.RecordID.split('-')) ? parseInt(r.RecordID.split('-')[0].slice(3) || '0', 10) : parseInt(r.RecordID.slice(3) || '0', 10);
        return num > max ? num : max;
      }, 0);
      const RecordID = 'REC' + String(maxIdNum + 1).padStart(3, '0') + '-' + Date.now().toString().slice(-3);

      const PayoutRate = group.PayoutRate;
      const count = Number(PersonCount);
      const TotalPayout = count * PayoutRate;

      const newRecord: ClinicRecord = {
        RecordID,
        GroupID,
        LeaderID,
        HouseNumber: HouseNumber.trim(),
        PersonCount: count,
        PayoutRate,
        TotalPayout,
        Remarks: Remarks || '',
        CreatedDate: new Date().toISOString()
      };

      records.push(newRecord);
      await saveRecords(records);

      // Audit Log
      await addLog(
        leader.Username,
        `Submitted survey record ${RecordID}: Group ${group.GroupName}, House #${HouseNumber}, People Count ${count}, Payout PHP ${TotalPayout}`
      );

      // Broadcast Notification
      await addNotification(
        leader.EmployeeID,
        'New Survey Submitted',
        `Leader ${leader.FullName} recorded House #${HouseNumber} for ${group.GroupName} (${count} count, PHP ${TotalPayout} payout).`,
        'success'
      );

      res.status(201).json({ success: true, record: newRecord });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Edit record (Only leader can edit)
  app.put('/api/records/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { HouseNumber, PersonCount, Remarks } = req.body;
      const modifier = req.headers['x-user-id'] as string || 'Employee';

      const records = await getRecords();
      const idx = records.findIndex(r => r.RecordID === id);

      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Record not found.' });
      }

      const existing = records[idx];

      const count = PersonCount !== undefined ? Number(PersonCount) : existing.PersonCount;
      const TotalPayout = count * existing.PayoutRate;

      records[idx] = {
        ...existing,
        HouseNumber: HouseNumber !== undefined ? HouseNumber.trim() : existing.HouseNumber,
        PersonCount: count,
        TotalPayout: TotalPayout,
        Remarks: Remarks !== undefined ? Remarks : existing.Remarks
      };

      await saveRecords(records);
      await addLog(modifier, `Modified survey record ${id}: House #${records[idx].HouseNumber}, People ${count}`);

      res.json({ success: true, record: records[idx] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Delete record (Only leader can delete)
  app.delete('/api/records/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const modifier = req.headers['x-user-id'] as string || 'Employee';

      const records = await getRecords();
      const idx = records.findIndex(r => r.RecordID === id);

      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Record not found.' });
      }

      const recordToDelete = records[idx];
      records.splice(idx, 1);
      await saveRecords(records);

      await addLog(modifier, `Deleted survey record: ${id} (House Group #${recordToDelete.HouseNumber})`);
      res.json({ success: true, message: 'Survey record deleted.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Bulk payout processing for date ranges
  app.post('/api/records/pay', async (req, res) => {
    try {
      const { fromDate, toDate } = req.body;
      const adminId = req.headers['x-user-id'] as string || 'admin';
      
      if (!fromDate || !toDate) {
        return res.status(400).json({ success: false, message: 'Please provide both From Date and To Date.' });
      }

      const records = await getRecords();
      let countUpdated = 0;
      let totalPayoutPaid = 0;

      const updatedRecords = records.map(r => {
        const recordDateStr = r.CreatedDate.split('T')[0];
        if (recordDateStr >= fromDate && recordDateStr <= toDate && !r.IsPaid) {
          countUpdated++;
          totalPayoutPaid += r.TotalPayout;
          return {
            ...r,
            IsPaid: true,
            PaidDate: new Date().toISOString()
          };
        }
        return r;
      });

      if (countUpdated > 0) {
        await saveRecords(updatedRecords);
        await addLog(adminId, `Processed payment reconciliation for ${countUpdated} surveys between ${fromDate} and ${toDate}. Total Paid: PHP ${totalPayoutPaid}`);
        await addNotification(adminId, 'Payment Reconciliation Completed', `Reconciled payments for ${countUpdated} surveys from ${fromDate} to ${toDate}. Total paid value: PHP ${totalPayoutPaid}`, 'success');
      }

      res.json({ success: true, count: countUpdated, totalPaid: totalPayoutPaid });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * ==========================================
   * REAL-TIME REPORTING & STATISTICS API (ADMIN)
   * ==========================================
   */
  app.get('/api/admin/analytics', async (req, res) => {
    try {
      const employees = await getEmployees();
      const groups = await getGroups();
      const records = await getRecords();

      const totalEmployees = employees.filter(e => e.Status !== 'Revoked').length;
      const activeEmployees = employees.filter(e => e.Status === 'Active').length;
      const suspendedEmployees = employees.filter(e => e.Status === 'Suspended').length;
      const totalGroups = groups.filter(g => g.Status === 'Active').length;
      const totalRecords = records.length;
      const totalPayouts = records.reduce((sum, r) => sum + r.TotalPayout, 0);

      // Group Performance Analytics
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
          PayoutSum: totalPayout
        };
      });

      // Daily Submission totals (last 14 days)
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
        people: dailySubmissions[date].people
      }));

      res.json({
        summary: {
          totalEmployees,
          activeEmployees,
          suspendedEmployees,
          totalGroups,
          totalRecords,
          totalPayouts
        },
        groupPerformance,
        dailyChartData
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * ==========================================
   * NOTIFICATIONS AND VIEW CHANNELS
   * ==========================================
   */
  app.get('/api/notifications', async (req, res) => {
    try {
      const userParam = req.query.username as string || '';
      const notifs = await getNotifications();

      // Show notifications meant for the user or general broadcast
      const filtered = notifs.filter(
        n => !n.TargetUserID || n.TargetUserID === 'admin' || n.TargetUserID === userParam
      );
      res.json(filtered.slice(0, 50));
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/notifications/:id/read', async (req, res) => {
    try {
      const { id } = req.params;
      const notifs = await getNotifications();
      const idx = notifs.findIndex(n => n.NotificationID === id);

      if (idx !== -1) {
        notifs[idx].IsRead = true;
        await saveNotifications(notifs);
        return res.json({ success: true });
      }
      res.status(404).json({ success: false, message: 'Notification not found' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Get Activity Logs
  app.get('/api/logs', async (req, res) => {
    try {
      const logs = await getLogs();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * ==========================================
   * VITE OR STATIC BUILD MIDDLEWARE Setup
   * ==========================================
   */
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Saint Francis Clinic active server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
