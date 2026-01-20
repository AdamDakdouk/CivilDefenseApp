# Multi-Tenant Architecture Implementation

This document outlines the implementation of multi-tenant support for the Civil Defense App. Each station now has its own admin account and data isolation.

## Overview

The application has been converted from a single-tenant system (Aramoun station only) to a multi-tenant architecture where:
- Each station has one admin account
- Each admin only sees data related to their station
- All station-specific data is automatically filtered by `adminId`

## Phase 1: Database Schema Updates ✅

### Models Updated:

1. **Admin.ts**
   - Added: `stationName` (String, required)
   - Now identifies which station the admin manages

2. **User.ts**
   - Added: `adminId` (ObjectId reference to Admin, required)
   - All users are now tied to a specific admin/station

3. **Mission.ts**
   - Added: `adminId` (ObjectId reference to Admin, required)
   - All missions are station-specific

4. **Shift.ts**
   - Added: `adminId` (ObjectId reference to Admin, required)
   - All shifts are station-specific

5. **Attendance.ts**
   - Added: `adminId` (ObjectId reference to Admin, required)
   - All attendance records are station-specific

6. **MonthlyReport.ts**
   - Added: `adminId` (ObjectId reference to Admin, required)
   - All reports are station-specific

7. **Settings.ts**
   - Added: `adminId` (ObjectId reference to Admin, required, unique)
   - One settings document per admin/station

## Phase 2: Authentication & Authorization ✅

### Auth Middleware (`middleware/auth.ts`)
```typescript
// Updated AuthRequest interface to include full admin object:
interface AuthRequest extends Request {
  admin?: {
    adminId: string;
    email: string;
    name: string;
    stationName: string;
  };
}
```

### Auth Routes (`routes/authRoutes.ts`)

**Login Endpoint** now returns:
```json
{
  "token": "jwt-token",
  "adminId": "admin-id",
  "stationName": "Station Name",
  "admin": {
    "id": "admin-id",
    "email": "admin@email.com",
    "name": "Admin Name",
    "stationName": "Station Name"
  }
}
```

**JWT Token** now includes:
```javascript
{
  adminId: admin._id,
  email: admin.email,
  name: admin.name,
  stationName: admin.stationName
}
```

## Phase 3: API Routes Updated ✅

All route files have been updated with the following pattern:

### 1. Import Update
```typescript
import { authenticateToken, AuthRequest } from '../middleware/auth';
```

### 2. Route Handlers
```typescript
router.get('/', async (req: AuthRequest, res: Response) => {
  if (!req.admin) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  // All queries now filter by adminId
  const data = await Model.find({ adminId: req.admin.adminId });
});
```

### 3. Create Operations
```typescript
const item = new Model({
  adminId: req.admin.adminId,  // Auto-assign to current admin
  ...otherFields
});
```

### Updated Routes:

| Route File | Updated Endpoints |
|-----------|-----------------|
| userRoutes.ts | GET /, GET /search |
| missionRoutes.ts | GET /, POST /, PUT /:id, DELETE /:id, GET /by-month, GET /available-months |
| shiftRoutes.ts | GET /, POST /, PUT /:id, DELETE /:id, GET /by-month, GET /available-months |
| attendanceRoutes.ts | GET /month, PUT /update |
| monthlyReportRoutes.ts | GET /, GET /available-months, GET /current, GET /reports |
| dashboardsRoutes.ts | GET /stats |
| settingsRoutes.ts | GET /active-month, PUT /active-month |
| volunteerStatsRoutes.ts | GET /mission-counts |
| monthRolloverRoutes.ts | POST /rollover |

## Phase 4: Frontend Updates ✅

### AuthContext (`contexts/AuthContext.tsx`)

**Admin Interface** updated:
```typescript
interface Admin {
  id: string;
  email: string;
  name: string;
  stationName: string;
}
```

**Session Storage** now stores:
- `token`: JWT token
- `adminId`: Current admin's ID
- `stationName`: Current admin's station name

**Login Method** updated to store additional data:
```typescript
sessionStorage.setItem('adminId', response.data.adminId);
sessionStorage.setItem('stationName', response.data.stationName);
```

**Logout Method** updated to clear all multi-tenant data:
```typescript
sessionStorage.removeItem('adminId');
sessionStorage.removeItem('stationName');
```

## Phase 5: Utility Scripts & Functions ✅

### monthRollover.ts
- Function signature: `rolloverMonth(month, year, adminId)`
- Now filters all operations by admin:
  - Gets users for specific admin
  - Gets missions for specific admin
  - Creates reports for specific admin
  - Updates settings for specific admin

### createAdmin.ts
- Now requires `stationName` field
- Creates admin with station identifier

### seedUsers.ts
- Looks up default admin first
- Adds `adminId` to all seeded users
- Only clears users belonging to current admin

## Security Features

✅ **Data Isolation**
- All queries automatically filter by `adminId`
- Admin can only see their own data
- Missions, shifts, attendance, and reports are all isolated

✅ **Authorization Checks**
- Every protected route checks `req.admin` existence
- Returns 401 Unauthorized if not authenticated
- Admin ID is extracted from JWT token (server-verified)

✅ **Compound Indexes**
- Settings has unique constraint on `adminId` (one settings per admin)
- Attendance has compound index on `(userId, date)` per admin

## Testing the Implementation

### Step 1: Create First Admin Account
```bash
npm run seed:admin
# Creates: admin1@example.com (Station A)
```

Edit the script to add `stationName`:
```typescript
stationName: 'Station A'
```

### Step 2: Create Second Admin Account
Create another admin using the UI or by running the script again with different email/station.

### Step 3: Create Users for Each Admin
```bash
npm run seed:users
# Seeds users with admin 1's adminId
```

Run again for second admin (modify script to use admin 2).

### Step 4: Test Data Isolation
1. Login as Admin 1 → See only Station A data
2. Logout
3. Login as Admin 2 → See only Station B data
4. Try accessing Admin 1's data via API → Should fail

## Database Migration Steps (if you have existing data)

If you have existing data without multi-tenant support:

```typescript
// In utils/clearDatabase.ts or a new migration script:
const defaultAdmin = await Admin.findOne();

await User.updateMany(
  { adminId: { $exists: false } },
  { adminId: defaultAdmin._id }
);

await Mission.updateMany(
  { adminId: { $exists: false } },
  { adminId: defaultAdmin._id }
);

// Repeat for Shift, Attendance, MonthlyReport, Settings
```

## API Response Examples

### Login Request
```
POST /api/auth/login
{
  "email": "admin@station.com",
  "password": "password"
}
```

### Login Response (200 OK)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "adminId": "507f1f77bcf86cd799439011",
  "stationName": "Station A",
  "admin": {
    "id": "507f1f77bcf86cd799439011",
    "email": "admin@station.com",
    "name": "Admin Name",
    "stationName": "Station A"
  }
}
```

### Get Users Request
```
GET /api/users
Authorization: Bearer <token>
```

### Get Users Response (filtered by adminId from token)
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "adminId": "507f1f77bcf86cd799439011",
    "name": "User Name",
    "role": "volunteer",
    "team": "1",
    ...
  }
]
```

## Key Files Changed

**Backend Models:**
- `backend/src/models/Admin.ts` - Added stationName
- `backend/src/models/User.ts` - Added adminId
- `backend/src/models/Mission.ts` - Added adminId
- `backend/src/models/Shift.ts` - Added adminId
- `backend/src/models/Attendance.ts` - Added adminId
- `backend/src/models/MonthlyReport.ts` - Added adminId
- `backend/src/models/Settings.ts` - Added adminId with unique constraint

**Backend Middleware & Auth:**
- `backend/src/middleware/auth.ts` - Updated to return full admin object
- `backend/src/routes/authRoutes.ts` - JWT now includes stationName

**Backend Routes (All Updated):**
- `backend/src/routes/userRoutes.ts`
- `backend/src/routes/missionRoutes.ts`
- `backend/src/routes/shiftRoutes.ts`
- `backend/src/routes/attendanceRoutes.ts`
- `backend/src/routes/monthlyReportRoutes.ts`
- `backend/src/routes/dashboardsRoutes.ts`
- `backend/src/routes/settingsRoutes.ts`
- `backend/src/routes/volunteerStatsRoutes.ts`
- `backend/src/routes/monthRolloverRoutes.ts`

**Backend Utilities & Scripts:**
- `backend/src/utils/monthRollover.ts` - Now accepts adminId parameter
- `backend/src/scripts/createAdmin.ts` - Added stationName field
- `backend/src/scripts/seedUsers.ts` - Now associates users with admin

**Frontend:**
- `frontend/src/contexts/AuthContext.tsx` - Updated to store stationName
- `.gitignore` - Added `backend/scripts/` folder

## Implementation Notes

### Authorization Pattern
All protected endpoints follow this pattern:
```typescript
if (!req.admin) {
  return res.status(401).json({ message: 'Unauthorized' });
}
// Use req.admin.adminId for queries
```

### Data Filtering Pattern
All queries follow this pattern:
```typescript
const results = await Model.find({
  adminId: req.admin.adminId,
  // ...other query conditions
});
```

### Create/Update Pattern
When creating/updating data:
```typescript
const item = new Model({
  adminId: req.admin.adminId,  // Always add this
  ...otherFields
});
```

## Future Enhancements

1. **Admin Management Dashboard**
   - Allow super-admin to manage multiple admin accounts
   - View statistics across all stations

2. **Role-Based Access Control (RBAC)**
   - Add role field to Admin model (super-admin, admin, viewer)
   - Implement fine-grained permissions

3. **Audit Logging**
   - Log all data modifications with admin ID
   - Track who made what changes and when

4. **Multi-Station Reports**
   - Allow super-admin to view aggregated reports
   - Compare performance across stations

5. **Data Export**
   - Export station-specific data with admin ID in filename

## Troubleshooting

### Issue: "Unauthorized" on all endpoints
**Solution:** Check that token is being sent in Authorization header
```
Authorization: Bearer <token>
```

### Issue: Users/Missions from other admins are visible
**Solution:** Check that all queries have `adminId: req.admin.adminId` filter

### Issue: Can't create new admin
**Solution:** Ensure `stationName` is provided in createAdmin script

### Issue: Month rollover fails
**Solution:** Verify `adminId` parameter is passed to `rolloverMonth()` function

## Summary

The multi-tenant implementation ensures:
- ✅ Complete data isolation between stations
- ✅ Automatic filtering without additional logic needed
- ✅ Secure authorization using JWT tokens
- ✅ Seamless frontend integration with session storage
- ✅ Backward-compatible API response structure
- ✅ Database-level constraints for data consistency

Each station operates independently while using the same application instance.
