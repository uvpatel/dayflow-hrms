# Dayflow HRMS — Production API Inventory & Target Endpoints

**Last Updated:** 2026-08-22  
**Architecture Standard:** `/api/v1/...` REST Architecture with Session-Based Multi-Tenancy  

---

## 1. Authentication & Platform Endpoints

| Domain | Method | Endpoint | Status | Auth Required | Permission | Description |
|---|---|---|---|---|---|---|
| Auth | `ALL` | `/api/auth/[...all]` | Implemented | No | Public | Better Auth handler (sign-in, sign-up, session, OAuth) |

---

## 2. Organization Management

| Domain | Method | Endpoint | Status | Auth Required | Permission | Description |
|---|---|---|---|---|---|---|
| Organization | `GET` | `/api/v1/organizations` | Target | Yes | `org:read` | List organization details |
| Organization | `POST` | `/api/v1/organizations` | Target | Yes | `org:manage` | Create new organization |
| Organization | `GET` | `/api/v1/organizations/:id` | Target | Yes | `org:read` | Get organization details |
| Organization | `PATCH`| `/api/v1/organizations/:id` | Target | Yes | `org:manage` | Update organization details |
| Departments | `GET` | `/api/v1/departments` | Target | Yes | `department:read` | List all organization departments |
| Departments | `POST` | `/api/v1/departments` | Target | Yes | `department:manage` | Create a department |
| Departments | `GET` | `/api/v1/departments/:id` | Target | Yes | `department:read` | Get department details |
| Departments | `PATCH`| `/api/v1/departments/:id` | Target | Yes | `department:manage` | Update department details |
| Departments | `DELETE`| `/api/v1/departments/:id` | Target | Yes | `department:manage` | Delete department |
| Designations | `GET` | `/api/v1/designations` | Target | Yes | `designation:read` | List all designations |
| Designations | `POST` | `/api/v1/designations` | Target | Yes | `designation:manage` | Create a designation |
| Designations | `GET` | `/api/v1/designations/:id` | Target | Yes | `designation:read` | Get designation details |
| Designations | `PATCH`| `/api/v1/designations/:id` | Target | Yes | `designation:manage` | Update designation |
| Designations | `DELETE`| `/api/v1/designations/:id` | Target | Yes | `designation:manage` | Delete designation |
| Locations | `GET` | `/api/v1/locations` | Target | Yes | `location:read` | List office locations |
| Locations | `POST` | `/api/v1/locations` | Target | Yes | `location:manage` | Create office location |
| Locations | `GET` | `/api/v1/locations/:id` | Target | Yes | `location:read` | Get location details |
| Locations | `PATCH`| `/api/v1/locations/:id` | Target | Yes | `location:manage` | Update location |
| Locations | `DELETE`| `/api/v1/locations/:id` | Target | Yes | `location:manage` | Delete location |
| Holidays | `GET` | `/api/v1/holidays` | Target | Yes | `holiday:read` | List organization holidays |
| Holidays | `POST` | `/api/v1/holidays` | Target | Yes | `holiday:manage` | Create holiday |
| Holidays | `GET` | `/api/v1/holidays/:id` | Target | Yes | `holiday:read` | Get holiday details |
| Holidays | `PATCH`| `/api/v1/holidays/:id` | Target | Yes | `holiday:manage` | Update holiday |
| Holidays | `DELETE`| `/api/v1/holidays/:id` | Target | Yes | `holiday:manage` | Delete holiday |
| Work Schedules | `GET` | `/api/v1/work-schedules` | Target | Yes | `schedule:read` | List work schedules |
| Work Schedules | `POST` | `/api/v1/work-schedules` | Target | Yes | `schedule:manage` | Create work schedule |
| Work Schedules | `GET` | `/api/v1/work-schedules/:id`| Target | Yes | `schedule:read` | Get work schedule details |
| Work Schedules | `PATCH`| `/api/v1/work-schedules/:id`| Target | Yes | `schedule:manage` | Update work schedule |
| Work Schedules | `DELETE`| `/api/v1/work-schedules/:id`| Target | Yes | `schedule:manage` | Delete work schedule |

---

## 3. Employee Management & Self-Service

| Domain | Method | Endpoint | Status | Auth Required | Permission | Description |
|---|---|---|---|---|---|---|
| Employees | `GET` | `/api/v1/employees` | Target | Yes | `employee:read:any` | Paginated employee list & search |
| Employees | `POST` | `/api/v1/employees` | Target | Yes | `employee:create` | Onboard new employee |
| Employees | `GET` | `/api/v1/employees/:id` | Target | Yes | `employee:read` | Get employee profile & relations |
| Employees | `PATCH`| `/api/v1/employees/:id` | Target | Yes | `employee:update` | Update employee profile |
| Employees | `DELETE`| `/api/v1/employees/:id` | Target | Yes | `employee:delete` | Archive/deactivate employee |
| Employees | `GET` | `/api/v1/employees/:id/attendance` | Target | Yes | `attendance:read:any` | Employee attendance history |
| Employees | `GET` | `/api/v1/employees/:id/time-off` | Target | Yes | `leave:read:any` | Employee leave allocations & requests |
| Employees | `GET` | `/api/v1/employees/:id/payslips` | Target | Yes | `payroll:read:any` | Employee payslip history |
| Self-Service | `GET` | `/api/v1/me` | Target | Yes | `self:read` | Current authenticated profile |
| Self-Service | `PATCH`| `/api/v1/me` | Target | Yes | `self:update` | Update self profile |
| Self-Service | `GET` | `/api/v1/me/attendance` | Target | Yes | `self:read` | Current employee attendance logs |
| Self-Service | `GET` | `/api/v1/me/time-off` | Target | Yes | `self:read` | Current employee leave balance/requests |
| Self-Service | `GET` | `/api/v1/me/payslips` | Target | Yes | `self:read` | Current employee payslips |
| Self-Service | `GET` | `/api/v1/me/notifications` | Target | Yes | `self:read` | Current user notifications |

---

## 4. Attendance & Time Tracking

| Domain | Method | Endpoint | Status | Auth Required | Permission | Description |
|---|---|---|---|---|---|---|
| Attendance | `GET` | `/api/v1/attendance` | Target | Yes | `attendance:read:any` | Query attendance logs across org |
| Attendance | `POST` | `/api/v1/attendance` | Target | Yes | `attendance:manage` | Manually log attendance record |
| Attendance | `GET` | `/api/v1/attendance/:id` | Target | Yes | `attendance:read` | Get specific attendance log |
| Attendance | `PATCH`| `/api/v1/attendance/:id` | Target | Yes | `attendance:manage` | Update attendance log |
| Attendance | `DELETE`| `/api/v1/attendance/:id` | Target | Yes | `attendance:manage` | Delete attendance record |
| Attendance | `POST` | `/api/v1/attendance/check-in` | Target | Yes | `attendance:self` | Record punch-in with concurrency guard |
| Attendance | `POST` | `/api/v1/attendance/check-out`| Target | Yes | `attendance:self` | Record punch-out with duration calc |
| Attendance | `GET` | `/api/v1/attendance/corrections` | Target | Yes | `attendance:read` | List correction requests |
| Attendance | `POST` | `/api/v1/attendance/corrections` | Target | Yes | `attendance:self` | Submit attendance correction request |
| Attendance | `GET` | `/api/v1/attendance/corrections/:id` | Target | Yes | `attendance:read` | Get correction request details |
| Attendance | `PATCH`| `/api/v1/attendance/corrections/:id` | Target | Yes | `attendance:manage` | Edit correction request |
| Attendance | `DELETE`| `/api/v1/attendance/corrections/:id` | Target | Yes | `attendance:manage` | Cancel correction request |

---

## 5. Time Off & Leave Management

| Domain | Method | Endpoint | Status | Auth Required | Permission | Description |
|---|---|---|---|---|---|---|
| Leave Types | `GET` | `/api/v1/leave-types` | Target | Yes | `leave:read` | List leave types |
| Leave Types | `POST` | `/api/v1/leave-types` | Target | Yes | `leave:manage` | Create leave type |
| Leave Types | `GET` | `/api/v1/leave-types/:id` | Target | Yes | `leave:read` | Get leave type details |
| Leave Types | `PATCH`| `/api/v1/leave-types/:id` | Target | Yes | `leave:manage` | Update leave type |
| Leave Types | `DELETE`| `/api/v1/leave-types/:id` | Target | Yes | `leave:manage` | Delete leave type |
| Leave Policies | `GET` | `/api/v1/leave-policies` | Target | Yes | `leave:read` | List leave policies |
| Leave Policies | `POST` | `/api/v1/leave-policies` | Target | Yes | `leave:manage` | Create leave policy |
| Leave Policies | `GET` | `/api/v1/leave-policies/:id`| Target | Yes | `leave:read` | Get leave policy details |
| Leave Policies | `PATCH`| `/api/v1/leave-policies/:id`| Target | Yes | `leave:manage` | Update leave policy |
| Leave Policies | `DELETE`| `/api/v1/leave-policies/:id`| Target | Yes | `leave:manage` | Delete leave policy |
| Leave Allocations| `GET` | `/api/v1/leave-allocations` | Target | Yes | `leave:read` | List employee leave balances |
| Leave Allocations| `POST` | `/api/v1/leave-allocations` | Target | Yes | `leave:manage` | Allocate leave days to employee |
| Leave Allocations| `GET` | `/api/v1/leave-allocations/:id` | Target | Yes | `leave:read` | Get allocation record |
| Leave Allocations| `PATCH`| `/api/v1/leave-allocations/:id` | Target | Yes | `leave:manage` | Adjust allocation days |
| Leave Allocations| `DELETE`| `/api/v1/leave-allocations/:id` | Target | Yes | `leave:manage` | Remove allocation record |
| Leave Requests | `GET` | `/api/v1/leave-requests` | Target | Yes | `leave:read` | List leave requests with filters |
| Leave Requests | `POST` | `/api/v1/leave-requests` | Target | Yes | `leave:create` | Submit leave request with balance validation |
| Leave Requests | `GET` | `/api/v1/leave-requests/:id`| Target | Yes | `leave:read` | Get leave request details |
| Leave Requests | `PATCH`| `/api/v1/leave-requests/:id`| Target | Yes | `leave:update` | Update pending leave request |
| Leave Requests | `DELETE`| `/api/v1/leave-requests/:id`| Target | Yes | `leave:delete` | Cancel pending leave request |
| Leave Requests | `POST` | `/api/v1/leave-requests/:id/approve` | Target | Yes | `leave:approve` | Approve leave and deduct balance atomically |
| Leave Requests | `POST` | `/api/v1/leave-requests/:id/reject` | Target | Yes | `leave:approve` | Reject leave request |

---

## 6. Approvals Workflow

| Domain | Method | Endpoint | Status | Auth Required | Permission | Description |
|---|---|---|---|---|---|---|
| Approvals | `GET` | `/api/v1/approvals` | Target | Yes | `approval:read` | List pending approval requests |
| Approvals | `GET` | `/api/v1/approvals/:id` | Target | Yes | `approval:read` | Get approval request details |
| Approvals | `POST` | `/api/v1/approvals/:id/approve` | Target | Yes | `approval:action` | Approve workflow request atomically |
| Approvals | `POST` | `/api/v1/approvals/:id/reject` | Target | Yes | `approval:action` | Reject workflow request |

---

## 7. Payroll & Compensation

| Domain | Method | Endpoint | Status | Auth Required | Permission | Description |
|---|---|---|---|---|---|---|
| Payroll Periods | `GET` | `/api/v1/payroll/periods` | Target | Yes | `payroll:read:any` | List payroll periods |
| Payroll Periods | `POST` | `/api/v1/payroll/periods` | Target | Yes | `payroll:manage` | Create new payroll period |
| Payroll Periods | `GET` | `/api/v1/payroll/periods/:id` | Target | Yes | `payroll:read:any` | Get payroll period details |
| Payroll Periods | `POST` | `/api/v1/payroll/periods/:id/calculate` | Target | Yes | `payroll:manage` | Calculate payroll for all active employees |
| Payroll Periods | `POST` | `/api/v1/payroll/periods/:id/finalize` | Target | Yes | `payroll:manage` | Finalize period & lock payslips |
| Salary Structures| `GET` | `/api/v1/salary-structures` | Target | Yes | `payroll:manage` | List salary structures |
| Salary Structures| `POST` | `/api/v1/salary-structures` | Target | Yes | `payroll:manage` | Create salary structure |
| Salary Structures| `GET` | `/api/v1/salary-structures/:id` | Target | Yes | `payroll:manage` | Get salary structure details |
| Salary Structures| `PATCH`| `/api/v1/salary-structures/:id` | Target | Yes | `payroll:manage` | Update salary structure |
| Salary Structures| `DELETE`| `/api/v1/salary-structures/:id` | Target | Yes | `payroll:manage` | Delete salary structure |
| Payslips | `GET` | `/api/v1/payroll/payslips` | Target | Yes | `payroll:read:any` | Query payslips across organization |
| Payslips | `GET` | `/api/v1/payroll/payslips/:id` | Target | Yes | `payroll:read` | Get specific payslip with items |
| Payslips | `POST` | `/api/v1/payroll/payslips` | Target | Yes | `payroll:manage` | Generate individual payslip |

---

## 8. Notifications & Audit Activity Logs

| Domain | Method | Endpoint | Status | Auth Required | Permission | Description |
|---|---|---|---|---|---|---|
| Notifications | `GET` | `/api/v1/notifications` | Target | Yes | `notification:read` | List user notifications |
| Notifications | `POST` | `/api/v1/notifications` | Target | Yes | `notification:manage` | Send notification to user |
| Notifications | `PATCH`| `/api/v1/notifications/:id/read` | Target | Yes | `notification:read` | Mark single notification as read |
| Notifications | `PATCH`| `/api/v1/notifications/read-all` | Target | Yes | `notification:read` | Mark all user notifications as read |
| Notifications | `DELETE`| `/api/v1/notifications/:id` | Target | Yes | `notification:read` | Delete notification |
| Activity Logs | `GET` | `/api/v1/activity-logs` | Target | Yes | `audit:read` | Query organization audit log history |
