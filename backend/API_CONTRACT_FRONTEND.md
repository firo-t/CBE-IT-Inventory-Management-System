# CBE Inventory Management System - Frontend API Contract (Verified against Source Code)

This document is the authoritative API contract based EXCLUSIVELY on the actual backend implementation. It provides exact endpoints, authentication details, role-based access control (RBAC), request/response schemas, and integration guidelines.

---

## 1. BACKEND BASE INFORMATION

- **Framework**: NestJS (v10)
- **API Architecture**: RESTful API
- **API Base URL (Development)**: `http://localhost:3001` (No `/api` prefix)
- **Authentication**: JWT (JSON Web Tokens) via Passport
- **Database**: PostgreSQL (via Prisma ORM)
- **CORS**: Enabled globally

---

## 2. AUTHENTICATION

The backend uses JWT Bearer tokens. The token must be sent in the `Authorization` header of all protected requests:

```http
Authorization: Bearer <JWT_TOKEN>
```

### POST `/auth/login`
- **Purpose**: Authenticates a user and returns a JWT.
- **Auth Required**: No
- **Request Body**:
  - `email` (string, required)
  - `password` (string, required)
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR...",
    "user": {
      "userId": "uuid",
      "email": "user@cbe.com",
      "role": "System Administrator / Admin",
      "employeeId": "EMP-001",
      "branchId": "uuid-or-null",
      "fullName": "John Doe"
    }
  }
  ```
- **Error**: 401 Unauthorized

### GET `/auth/profile` and GET `/auth/me`
- **Purpose**: Retrieves the currently authenticated user's session payload.
- **Auth Required**: Yes
- **Response (200 OK)**:
  ```json
  {
    "user": {
      "userId": "uuid",
      "email": "user@cbe.com",
      "role": "System Administrator / Admin",
      "employeeId": "EMP-001",
      "branchId": "uuid-or-null",
      "fullName": "John Doe"
    }
  }
  ```

---

## 3. CURRENT USER

The backend explicitly strips the `password_hash` from all user query responses. The JWT secret is never returned.

Returned Fields (JWT Payload):
- `userId` (uuid)
- `email` (string)
- `role` (string - exact role name)
- `employeeId` (string)
- `branchId` (uuid or null)
- `fullName` (string)

---

## 4. ROLES

### GET `/roles`
- **Auth Required**: Yes
- **RBAC**: `System Administrator / Admin` only
- **Response**: Array of roles
  ```json
  [
    {
      "role_id": "uuid",
      "role_name": "System Administrator / Admin",
      "description": "..."
    }
  ]
  ```
- **Exact Role Names**:
  - `System Administrator / Admin`
  - `IT Inventory Officer`
  - `Hardware Technician`
  - `Branch Manager`

---

## 5. USERS

All endpoints require JWT Auth and `System Administrator / Admin` role. Passwords are never returned in responses.

### POST `/users`
- **Request Body**:
  - `full_name` (string, required)
  - `employee_id` (string, required)
  - `email` (string, required)
  - `password` (string, required)
  - `role_id` (uuid, required)
  - `phone` (string, optional)
  - `branch_id` (uuid, optional)

### GET `/users`
- **Response**: Array of users with role and branch relations included.

### GET `/users/:id`
- **Response**: Single user object.

### PATCH `/users/:id`
- **Request Body**: Same fields as creation (except password), all optional. 

### PATCH `/users/:id/password`
- **Request Body**:
  - `new_password` (string, required)

### PATCH `/users/:id/status`
- **Request Body**:
  - `status` (enum: `ACTIVE`, `INACTIVE`)

---

## 6. BRANCHES

**IMPORTANT**: All `/branches` endpoints require `System Administrator / Admin` role.

### POST `/branches`
- **Request Body**:
  - `branch_code` (string, required)
  - `branch_name` (string, required)
  - `location` (string, optional)
  - `manager_id` (uuid, optional) - *User must exist and cannot be manager of another branch.*
  - `contact_person` (string, optional)
  - `phone` (string, optional)

### GET `/branches`
### GET `/branches/:id`
### PATCH `/branches/:id`
- **Request Body**: Same as POST, all optional.

---

## 7. ASSET TYPES

**IMPORTANT**: All `/asset-types` endpoints require `System Administrator / Admin` role. (Officers cannot create or view asset types directly via this controller endpoint).

### POST `/asset-types`
- **Request Body**: `type_name` (string, required), `description` (string, optional)

### GET `/asset-types`
### GET `/asset-types/:id`
### PATCH `/asset-types/:id`

---

## 8. ASSETS

### POST `/assets`
- **RBAC**: `System Administrator / Admin`, `IT Inventory Officer`
- **Request Body**:
  - `tag_no` (string, required)
  - `asset_type_id` (uuid, required)
  - `serial_no` (string, optional)
  - `model` (string, optional)
  - `ws_no` (string, optional)
  - `condition` (string, optional)
  - `description` (string, optional)
  - `current_branch_id` (uuid, optional)

### GET `/assets`
- **RBAC**: `System Administrator / Admin`, `IT Inventory Officer`, `Branch Manager`, `Hardware Technician`
- **Query Parameters (all optional)**:
  - `search` (Partial match on `tag_no`, `serial_no`, `model`, `ws_no`, or `description` - case insensitive)
  - `tag_no` (Exact match)
  - `serial_no` (Exact match)
  - `asset_type_id` (Exact match)
  - `current_branch_id` (Exact match)
  - `status` (Enum match)
  - `condition` (Exact match)

### GET `/assets/:id`
- **RBAC**: Admin, Officer, Manager, Tech

### PATCH `/assets/:id`
- **RBAC**: `System Administrator / Admin`, `IT Inventory Officer`
- **Request Body**: Same as POST, all optional.

### PATCH `/assets/:id/status`
- **RBAC**: `System Administrator / Admin`, `IT Inventory Officer`
- **Request Body**: `status` (Enum: `DAMAGED`, `LOST`, `DISPOSED`, `RETIRED`)
- **Note**: This endpoint strictly accepts only terminal/manual statuses. Normal lifecycle changes (`AVAILABLE`, `ASSIGNED`, `IN_TRANSIT`, `UNDER_MAINTENANCE`) are securely managed server-side and automatically updated by their respective workflows.

---

## 9. ASSIGNMENTS

### POST `/assignments`
- **RBAC**: `System Administrator / Admin`, `IT Inventory Officer`
- **Business Rules**: Asset must be `AVAILABLE`. Changes asset status to `ASSIGNED`.
- **Request Body**:
  - `asset_id` (uuid, required)
  - `employee_id` (string, required)
  - `employee_name` (string, required)
  - `branch_id` (uuid, required)
  - `assigned_date` (string/ISO, optional)
- **Server Generated**: `assignment_id`, `assigned_by`, `status` (`ACTIVE`)

### GET `/assignments`
- **RBAC**: Admin, Officer, Manager, Tech
- **Query Parameters**: `status` (`ACTIVE`, `RETURNED`)

### GET `/assignments/:id`
- **RBAC**: Admin, Officer, Manager, Tech

### PATCH `/assignments/:id/return`
- **RBAC**: `System Administrator / Admin`, `IT Inventory Officer`
- **Business Rules**: Sets assignment status to `RETURNED` and `returned_date`. Asset status reverts to `AVAILABLE`.

---

## 10. DISPATCH AND RECEIPT

### POST `/dispatches`
- **RBAC**: `System Administrator / Admin`, `IT Inventory Officer`
- **Business Rules**: Asset must be `AVAILABLE` or `ASSIGNED`. 
  - *IMPORTANT: The active assignment is NOT returned.* 
  - Sets Dispatch to `DISPATCHED`. Sets Asset to `IN_TRANSIT`.
- **Request Body**:
  - `asset_id` (uuid, required)
  - `source_location` (string, required)
  - `destination_branch_id` (uuid, required)
  - `receiver_name` (string, required)
  - `receiver_id` (string, required)
  - `receiver_phone` (string, required)
  - `dispatched_date` (string/ISO, optional)

### GET `/dispatches`
- **RBAC**: Admin, Officer, Manager, Tech
- **Query Parameters**: `status` (`DISPATCHED`, `RECEIVED`, `CANCELLED`)

### GET `/dispatches/:id`
- **RBAC**: Admin, Officer, Manager, Tech

### PATCH `/dispatches/:id/receive`
- **RBAC**: `System Administrator / Admin`, `IT Inventory Officer`, `Branch Manager`
- **Business Rules**: 
  - If user is a Branch Manager, their `branchId` MUST equal the dispatch's `destination_branch_id`.
  - Sets dispatch to `RECEIVED`.
  - Asset's `current_branch_id` is updated to destination branch.
  - *IMPORTANT: Asset status becomes `ASSIGNED` if there was a suspended active assignment, otherwise `AVAILABLE`.*

---

## 11. MAINTENANCE

### POST `/maintenance/requests`
- **RBAC**: Admin, IT Officer, Branch Manager
- **Business Rules**: Asset status becomes `UNDER_MAINTENANCE`. Branch Managers can only report for assets currently in their own branch.
- **Request Body**:
  - `asset_id` (uuid, required)
  - `problem_description` (string, required)
  - `priority` (Enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, optional - defaults to `MEDIUM`)

### GET `/maintenance/requests`
- **RBAC**: Admin, IT Officer, Branch Manager, Technician
- **Query Parameters**: `asset_id`, `status`, `priority`
- **Scoping**: Branch Managers only see requests for their branch.

### GET `/maintenance/requests/:id`
- **RBAC**: Admin, IT Officer, Branch Manager, Technician

### PATCH `/maintenance/requests/:id`
- **RBAC**: Admin, IT Officer, Branch Manager
- **Request Body**: `problem_description`, `priority` (all optional)

### POST `/maintenance/requests/:id/assign`
- **RBAC**: Admin, IT Officer, Branch Manager, Technician
- **Business Rules**: Technicians can only self-assign. Branch Managers can only assign to technicians in their own branch.
- **Request Body**: `technician_id` (uuid, optional if Technician self-assigning).

### POST `/maintenance/requests/:id/records`
- **RBAC**: Admin, IT Officer, Hardware Technician
- **Request Body**:
  - `diagnosis` (string, optional)
  - `repair_action` (string, optional)
  - `parts_used` (string, optional)
  - `remarks` (string, optional)
  - `condition` (string, optional) -> *Updates Asset.condition directly.*
  - `start_date` (ISO date, optional)
  - `completion_date` (ISO date, optional)

### PATCH `/maintenance/requests/:id/status`
- **RBAC**: Admin, IT Officer, Hardware Technician
- **Request Body**: `status` (Enum: `REPORTED`, `RECEIVED`, `ASSIGNED`, `UNDER_INSPECTION`, `UNDER_REPAIR`, `WAITING_FOR_PARTS`, `REPAIRED`, `COMPLETED`, `CLOSED`)
- **Business Rules**: Moving to `COMPLETED` requires a maintenance record to exist with `repair_action` populated AND the parent `Asset` must have a `condition` recorded. Completion restores the asset to `AVAILABLE` (or `ASSIGNED` if there was an active assignment).

---

## 12. ATTACHMENTS

### POST `/attachments`
- **RBAC**: Admin, Officer, Manager, Tech
- **Request**: `multipart/form-data`
  - `file` (File, max 5MB. Allowed: `image/jpeg`, `image/png`, `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`)
  - `asset_id` (uuid, optional)
  - `maintenance_request_id` (uuid, optional)
  - *At least one ID is required.*

### GET `/attachments`
- **RBAC**: Admin, Officer, Manager, Tech
- **Query Parameters**: `asset_id`, `maintenance_request_id`

### GET `/attachments/:id/download`
- **Response**: Binary file stream.

### DELETE `/attachments/:id`
- **RBAC**: Admin, Officer, Manager, Tech (User must be uploader, Admin, or IT Officer).

---

## 13. NOTIFICATIONS

### GET `/notifications`
- **RBAC**: All authenticated users (returns current user's notifications).
- **Notification Types**: `DISPATCH_CREATED`, `DISPATCH_RECEIVED`, `ASSIGNMENT_CREATED`, `MAINTENANCE_CREATED`, `MAINTENANCE_ASSIGNED`, `MAINTENANCE_COMPLETED`, `MAINTENANCE_STATUS_CHANGED`.

### GET `/notifications/unread`
### PATCH `/notifications/read-all`
### PATCH `/notifications/:id/read`

---

## 14. DASHBOARD

### GET `/dashboard`
- **RBAC**: Admin, Officer, Manager, Tech
- **Response (Admin)**: `totalAssets`, `totalBranches`, `totalUsers`, `availableAssets`, `assignedAssets`, `damagedAssets`, `maintenanceStats`, `recentActivities`
- **Response (IT Officer)**: `availableAssets`, `assignedAssets`, `pendingDispatches`, `activeMaintenance`, `recentReceivedAssets`, `recentDispatchedAssets`
- **Response (Technician)**: `assignedRequests`, `pendingInspections`, `underRepair`, `waitingForParts`, `completedMaintenance`, `recentAssignedRequests` (scoped to their ID).
- **Response (Branch Manager)**: `branchTotalAssets`, `branchAssignedAssets`, `pendingInTransit`, `branchMaintenanceRequests`, `recentBranchMaintenance` (scoped to their `branchId`). Throws 403 if user lacks a `branchId`.

---

## 15. REPORTS

### GET `/reports/inventory`
- **Query Params**: `branch_id`, `asset_type_id`, `status`, `condition`, `start_date`, `end_date`

### GET `/reports/assignments`
- **Query Params**: `branch_id`, `status`, `start_date`, `end_date`

### GET `/reports/dispatches`
- **Query Params**: `destination_branch_id`, `status`, `start_date`, `end_date`

### GET `/reports/maintenance`
- **Query Params**: `branch_id`, `status`, `priority`, `technician_id`, `start_date`, `end_date`

---

## 16. PDF AND EXCEL EXPORT

Accepts the EXACT SAME query parameters as their JSON equivalents.
- **Method**: `GET`
- **RBAC**: Admin, Officer, Manager, Tech
- **Endpoints**:
  - `/reports/inventory/pdf` & `/reports/inventory/excel`
  - `/reports/assignments/pdf` & `/reports/assignments/excel`
  - `/reports/dispatches/pdf` & `/reports/dispatches/excel`
  - `/reports/maintenance/pdf` & `/reports/maintenance/excel`
- **Frontend Note**: Requires `responseType: 'blob'` in Axios/Fetch.

---

## 17. AUDIT LOGS

### GET `/audit-logs`
- **RBAC**: `System Administrator / Admin` only
- **Query Params**: `user_id`, `action`, `entity_type`, `entity_id`

### GET `/audit-logs/:id`
- **RBAC**: `System Administrator / Admin` only

---

## 18. ERROR HANDLING

The API relies on standard NestJS HTTP exceptions:
- **400 Bad Request**: Validation failed (e.g., condition/result missing for maintenance completion, dispatching non-available asset).
- **401 Unauthorized**: Missing/invalid JWT token.
- **403 Forbidden**: Token valid, but user lacks role OR service-level ownership (e.g. Branch Manager accessing another branch's requests).
- **404 Not Found**: Resource ID does not exist.
- **409 Conflict**: Concurrency/duplication (e.g. active dispatch exists, active maintenance exists, tag_no exists).

---

## 19. RBAC MATRIX

| Feature | Admin | IT Officer | Technician | Branch Manager |
|---|---|---|---|---|
| Users/Roles Mgmt | Yes | No | No | No |
| Branches Mgmt | Yes | No | No | No |
| Asset Types Mgmt | Yes | No | No | No |
| Assets Mgmt (Create/Update)| Yes | Yes | No | No |
| Asset View | Yes | Yes | Yes | Yes |
| Assignments (Create/Return)| Yes | Yes | No | No |
| Dispatch (Create) | Yes | Yes | No | No |
| Receipt | Yes | Yes | No | Yes (Own Branch Only) |
| Maint Request (Create/Update)| Yes | Yes | No | Yes (Own Branch Only) |
| Tech Assignment | Yes | Yes | Yes (Self Only) | Yes (Own Branch Only) |
| Maint Status Updates | Yes | Yes | Yes | No |
| Maint Records (Post/Close) | Yes | Yes | Yes | No |
| Attachments | Yes | Yes | Yes | Yes |
| Audit Logs | Yes | No | No | No |
| Dashboard/Reports | Yes (All) | Yes (All) | Yes (Scoped) | Yes (Scoped) |

*(Note: IT Officer does NOT have access to POST/PATCH `asset-types`.)*

---

## 20. ASSET LIFECYCLE (Actual Implementation)

1. **AVAILABLE** -> `POST /assignments` -> **ASSIGNED** -> `PATCH /assignments/:id/return` -> **AVAILABLE**
2. **AVAILABLE/ASSIGNED** -> `POST /dispatches` -> **IN_TRANSIT** -> `PATCH /dispatches/:id/receive` -> **AVAILABLE** (or **ASSIGNED** if active assignment exists)
3. **AVAILABLE/ASSIGNED** -> `POST /maintenance/requests` -> **UNDER_MAINTENANCE** -> `PATCH /status` to COMPLETED -> **AVAILABLE** (or **ASSIGNED**)

---

## 21. SRS TRACEABILITY

- **FR-01 User Authentication**: `POST /auth/login`, `GET /auth/profile`, `GET /auth/me`
- **FR-02 Role Configuration**: `GET /roles`, `@Roles()` guards.
- **FR-03 Asset Registration**: `POST /assets`, `PATCH /assets/:id`
- **FR-04 Asset Assignment**: `POST /assignments`, `PATCH /assignments/:id/return`
- **FR-05 Dispatching Assets**: `POST /dispatches`
- **FR-06 Receiving Assets**: `PATCH /dispatches/:id/receive`
- **FR-07 Maintenance Log**: `POST /maintenance/requests`, `POST /.../assign`, `POST /.../records`, `PATCH /.../status`
- **FR-08 Dashboard Overviews**: `GET /dashboard`
- **FR-09 Reporting Capabilities**: `GET /reports/*`
- **FR-11 Audit Trails**: `GET /audit-logs`
- **FR-13 Attachments**: `POST /attachments`

---

## 22. FRONTEND WORKFLOW EXAMPLE

**1. Login & Init**
```javascript
const res = await axios.post('/auth/login', { email: 'manager@cbe.com', password: 'password123' });
localStorage.setItem('token', res.data.access_token);
const profile = await axios.get('/auth/me', { headers: { Authorization: `Bearer ${res.data.access_token}` }});
```

**2. Receive Dispatch (Manager)**
```javascript
// Branch Manager receives equipment at their branch
await axios.patch(`/dispatches/${dispatchId}/receive`, {}, { headers });
```

**3. Complete Maintenance (Technician)**
```javascript
// Tech submits repair action AND condition, then updates status
await axios.post(`/maintenance/requests/${reqId}/records`, {
  repair_action: 'Replaced RAM',
  condition: 'Good'
}, { headers });

await axios.patch(`/maintenance/requests/${reqId}/status`, {
  status: 'COMPLETED'
}, { headers });
```

---

## 23. EXACT DATA TYPES (TypeScript)

```typescript
export interface User {
  userId: string;
  email: string;
  role: string;
  employeeId: string;
  branchId: string | null;
  fullName: string;
}

export interface Asset {
  asset_id: string;
  tag_no: string;
  serial_no?: string;
  asset_type_id: string;
  current_branch_id?: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'IN_TRANSIT' | 'UNDER_MAINTENANCE' | 'DAMAGED' | 'LOST' | 'DISPOSED' | 'RETIRED';
  condition?: string;
}
```

---

## 24. FINAL API INVENTORY

| METHOD | ENDPOINT | AUTH | ROLES | PURPOSE |
|---|---|---|---|---|
| POST | `/auth/login` | No | Any | Login |
| GET | `/auth/profile`, `/auth/me` | Yes | Any | Get Session |
| GET | `/roles` | Yes | Admin | List Roles |
| POST | `/users` | Yes | Admin | Create User |
| GET | `/users`, `/users/:id` | Yes | Admin | List/Get User |
| PATCH | `/users/:id`, `/users/:id/password`, `/users/:id/status` | Yes | Admin | Update User |
| POST | `/branches` | Yes | Admin | Create Branch |
| GET | `/branches`, `/branches/:id` | Yes | Admin | View Branches |
| PATCH | `/branches/:id` | Yes | Admin | Update Branch |
| POST | `/asset-types` | Yes | Admin | Create Asset Type |
| GET | `/asset-types`, `/asset-types/:id` | Yes | Admin | View Asset Types |
| PATCH | `/asset-types/:id` | Yes | Admin | Update Asset Type |
| POST | `/assets` | Yes | Admin, Officer | Register Asset |
| GET | `/assets`, `/assets/:id` | Yes | Admin, Officer, Manager, Tech | Search/View Assets |
| PATCH | `/assets/:id`, `/assets/:id/status` | Yes | Admin, Officer | Update Asset / Status |
| POST | `/assignments` | Yes | Admin, Officer | Assign Asset |
| GET | `/assignments`, `/assignments/:id` | Yes | Admin, Officer, Manager, Tech | View Assignments |
| PATCH | `/assignments/:id/return` | Yes | Admin, Officer | Return Assignment |
| POST | `/dispatches` | Yes | Admin, Officer | Dispatch Asset |
| GET | `/dispatches`, `/dispatches/:id` | Yes | Admin, Officer, Manager, Tech | View Dispatches |
| PATCH | `/dispatches/:id/receive` | Yes | Admin, Officer, Manager| Receive Asset |
| POST | `/maintenance/requests` | Yes | Admin, Officer, Manager| Request Maintenance|
| GET | `/maintenance/requests`, `/:id`| Yes | Admin, Officer, Manager, Tech | View Requests |
| PATCH | `/maintenance/requests/:id` | Yes | Admin, Officer, Manager| Update Request |
| POST | `/maintenance/requests/:id/assign`| Yes | Admin, Officer, Manager, Tech | Assign Technician |
| PATCH | `/maintenance/requests/:id/status`| Yes | Admin, Officer, Tech | Update Maint Status|
| POST | `/maintenance/requests/:id/records`| Yes | Admin, Officer, Tech | Post Maint Record |
| POST | `/attachments` | Yes | Admin, Officer, Manager, Tech | Upload File |
| GET | `/attachments`, `/attachments/:id`| Yes | Admin, Officer, Manager, Tech | List/View File Meta|
| GET | `/attachments/:id/download` | Yes | Admin, Officer, Manager, Tech | Download Binary |
| DELETE| `/attachments/:id` | Yes | Admin, Officer, Manager, Tech | Delete File |
| GET | `/notifications`, `/notifications/unread`| Yes | Authenticated User | View Notifications |
| PATCH | `/notifications/read-all`, `/:id/read`| Yes | Authenticated User | Mark Read |
| GET | `/dashboard` | Yes | Admin, Officer, Manager, Tech | View Dashboard |
| GET | `/reports/...` (4 endpoints) | Yes | Admin, Officer, Manager, Tech | JSON Reports |
| GET | `/reports/.../pdf or excel` (8 endpts) | Yes | Admin, Officer, Manager, Tech | Binary Reports |
| GET | `/audit-logs`, `/audit-logs/:id`| Yes | Admin | View Audit Logs |
