# API Endpoints - Civil Defense Management System

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Users](#users)
4. [Shifts](#shifts)
5. [Missions](#missions)
6. [Attendance](#attendance)
7. [Dashboard](#dashboard)
8. [Monthly Reports](#monthly-reports)
9. [Settings](#settings)
10. [Month Rollover](#month-rollover)
11. [Error Handling](#error-handling)

---

## Overview

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-backend.onrender.com/api
```

### Authentication
Most endpoints require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Response Format
All responses follow a consistent JSON structure:

**Success Response**:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message",
  "details": { /* additional error info */ }
}
```

---

## Authentication

### POST /auth/login
Login with email and password to receive JWT token.

**Request**:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@civildefense.online",
  "password": "your-password"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "_id": "507f1f77bcf86cd799439099",
    "email": "admin@civildefense.online",
    "name": "Station Administrator"
  }
}
```

**Errors**:
- `400 Bad Request`: Missing email or password
- `401 Unauthorized`: Invalid credentials

---

### GET /auth/verify
Verify JWT token validity.

**Request**:
```http
GET /api/auth/verify
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "valid": true,
  "admin": {
    "_id": "507f1f77bcf86cd799439099",
    "email": "admin@civildefense.online",
    "name": "Station Administrator"
  }
}
```

**Errors**:
- `401 Unauthorized`: Invalid or expired token

---

### POST /auth/forgot-password
Request password reset code via email.

**Request**:
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "admin@civildefense.online"
}
```

**Response** (200 OK):
```json
{
  "message": "Reset code sent to email"
}
```

**Errors**:
- `404 Not Found`: Email not found
- `500 Internal Server Error`: Email sending failed

---

### POST /auth/verify-reset-code
Verify the 6-digit reset code.

**Request**:
```http
POST /api/auth/verify-reset-code
Content-Type: application/json

{
  "email": "admin@civildefense.online",
  "code": "123456"
}
```

**Response** (200 OK):
```json
{
  "message": "Code verified successfully",
  "resetToken": "temp-reset-token-xyz"
}
```

**Errors**:
- `400 Bad Request`: Invalid or expired code
- `404 Not Found`: Email not found

---

### POST /auth/reset-password
Reset password with verified token.

**Request**:
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "resetToken": "temp-reset-token-xyz",
  "newPassword": "new-secure-password"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset successfully"
}
```

**Errors**:
- `400 Bad Request`: Invalid or expired token
- `400 Bad Request`: Password too weak

---

## Users

### GET /users
Get all users with optional filtering.

**Request**:
```http
GET /api/users?role=volunteer&team=1
Authorization: Bearer <token>
```

**Query Parameters**:
- `role` (optional): Filter by role (volunteer/employee/head/administrative staff)
- `team` (optional): Filter by team (1/2/3)
- `search` (optional): Search by name

**Response** (200 OK):
```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "أحمد محمد",
      "role": "volunteer",
      "team": "1",
      "phoneNumber": "+961 3 123456",
      "emergencyContact": "+961 3 654321",
      "dateOfBirth": "1995-05-15T00:00:00.000Z",
      "address": "عرمون، لبنان",
      "currentMonthHours": 156.5,
      "currentMonthMissions": 23,
      "currentMonthDays": 15,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-10-15T14:22:00.000Z"
    }
  ],
  "count": 1
}
```

---

### GET /users/:id
Get specific user by ID.

**Request**:
```http
GET /api/users/507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "أحمد محمد",
    "role": "volunteer",
    "team": "1",
    "phoneNumber": "+961 3 123456",
    "emergencyContact": "+961 3 654321",
    "dateOfBirth": "1995-05-15T00:00:00.000Z",
    "address": "عرمون، لبنان",
    "currentMonthHours": 156.5,
    "currentMonthMissions": 23,
    "currentMonthDays": 15
  }
}
```

**Errors**:
- `404 Not Found`: User not found

---

### POST /users
Create a new user.

**Request**:
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "محمد علي",
  "role": "volunteer",
  "team": "2",
  "phoneNumber": "+961 3 987654",
  "emergencyContact": "+961 3 456789",
  "dateOfBirth": "1998-08-20",
  "address": "بيروت، لبنان"
}
```

**Response** (201 Created):
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "محمد علي",
    "role": "volunteer",
    "team": "2",
    "phoneNumber": "+961 3 987654",
    "emergencyContact": "+961 3 456789",
    "dateOfBirth": "1998-08-20T00:00:00.000Z",
    "address": "بيروت، لبنان",
    "currentMonthHours": 0,
    "currentMonthMissions": 0,
    "currentMonthDays": 0,
    "createdAt": "2024-10-20T10:00:00.000Z",
    "updatedAt": "2024-10-20T10:00:00.000Z"
  },
  "message": "User created successfully"
}
```

**Validation**:
- `name`: Required, 2-100 characters
- `role`: Required, one of [volunteer, employee, head, administrative staff]
- `team`: Required, one of [1, 2, 3]
- `phoneNumber`: Required, valid phone format
- `emergencyContact`: Required
- `dateOfBirth`: Required, valid date
- `address`: Required

**Errors**:
- `400 Bad Request`: Validation failed
- `409 Conflict`: User with same name already exists

---

### PUT /users/:id
Update existing user.

**Request**:
```http
PUT /api/users/507f1f77bcf86cd799439012
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneNumber": "+961 3 111222",
  "team": "3"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "محمد علي",
    "role": "volunteer",
    "team": "3",
    "phoneNumber": "+961 3 111222",
    /* ... other fields ... */
  },
  "message": "User updated successfully"
}
```

**Errors**:
- `404 Not Found`: User not found
- `400 Bad Request`: Validation failed

---

### DELETE /users/:id
Delete a user.

**Request**:
```http
DELETE /api/users/507f1f77bcf86cd799439012
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "message": "User deleted successfully"
}
```

**Notes**:
- Deleting a user does NOT delete associated shifts, missions, or attendance records
- Consider soft delete (adding `isDeleted` flag) for data integrity

**Errors**:
- `404 Not Found`: User not found

---

## Shifts

### GET /shifts
Get all shifts with optional filtering.

**Request**:
```http
GET /api/shifts?team=1&month=10&year=2024
Authorization: Bearer <token>
```

**Query Parameters**:
- `team` (optional): Filter by team (1/2/3)
- `month` (optional): Filter by month (1-12)
- `year` (optional): Filter by year (e.g., 2024)
- `date` (optional): Filter by specific date (YYYY-MM-DD)

**Response** (200 OK):
```json
{
  "shifts": [
    {
      "_id": "507f1f77bcf86cd799439022",
      "date": "2024-10-15",
      "team": "1",
      "participants": [
        {
          "_id": "507f1f77bcf86cd799439033",
          "user": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "أحمد محمد",
            "role": "volunteer",
            "team": "1"
          },
          "checkIn": "2024-10-15T08:00",
          "checkOut": "2024-10-16T08:00"
        }
      ],
      "createdAt": "2024-10-15T07:30:00.000Z",
      "updatedAt": "2024-10-15T07:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### GET /shifts/:id
Get specific shift by ID.

**Request**:
```http
GET /api/shifts/507f1f77bcf86cd799439022
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "shift": {
    "_id": "507f1f77bcf86cd799439022",
    "date": "2024-10-15",
    "team": "1",
    "participants": [/* ... */]
  }
}
```

**Errors**:
- `404 Not Found`: Shift not found

---

### POST /shifts
Create a new shift.

**Request**:
```http
POST /api/shifts
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-10-20",
  "team": "1",
  "participants": [
    {
      "user": "507f1f77bcf86cd799439011",
      "checkIn": "2024-10-20T08:00",
      "checkOut": "2024-10-21T08:00"
    },
    {
      "user": "507f1f77bcf86cd799439012",
      "checkIn": "2024-10-20T08:00",
      "checkOut": "2024-10-21T08:00"
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "shift": {
    "_id": "507f1f77bcf86cd799439023",
    "date": "2024-10-20",
    "team": "1",
    "participants": [/* ... */],
    "createdAt": "2024-10-20T07:00:00.000Z",
    "updatedAt": "2024-10-20T07:00:00.000Z"
  },
  "message": "Shift created successfully"
}
```

**Side Effects**:
- Creates Attendance records for each participant
- Updates User.currentMonthDays for each participant
- Calculates and adds hours to User.currentMonthHours

**Validation**:
- `date`: Required, YYYY-MM-DD format
- `team`: Required, one of [1, 2, 3]
- `participants`: Required, non-empty array
- Each participant must have valid user ID, checkIn, and checkOut

**Errors**:
- `400 Bad Request`: Validation failed
- `404 Not Found`: User not found in participants

---

### PUT /shifts/:id
Update existing shift.

**Request**:
```http
PUT /api/shifts/507f1f77bcf86cd799439023
Authorization: Bearer <token>
Content-Type: application/json

{
  "participants": [
    {
      "user": "507f1f77bcf86cd799439011",
      "checkIn": "2024-10-20T08:00",
      "checkOut": "2024-10-20T20:00"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "shift": {
    "_id": "507f1f77bcf86cd799439023",
    "date": "2024-10-20",
    "team": "1",
    "participants": [/* updated participants */],
    "updatedAt": "2024-10-20T15:00:00.000Z"
  },
  "message": "Shift updated successfully"
}
```

**Side Effects**:
- Recalculates hours for affected users
- Updates attendance records

**Errors**:
- `404 Not Found`: Shift not found
- `400 Bad Request`: Validation failed

---

### DELETE /shifts/:id
Delete a shift.

**Request**:
```http
DELETE /api/shifts/507f1f77bcf86cd799439023
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "message": "Shift deleted successfully"
}
```

**Side Effects**:
- Removes associated Attendance records
- Recalculates User statistics

**Errors**:
- `404 Not Found`: Shift not found

---

### GET /shifts/available-months
Get list of months that have shifts.

**Request**:
```http
GET /api/shifts/available-months
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "months": [
    { "month": 10, "year": 2024 },
    { "month": 9, "year": 2024 },
    { "month": 8, "year": 2024 }
  ]
}
```

---

## Missions

### GET /missions
Get all missions with optional filtering.

**Request**:
```http
GET /api/missions?type=fire&team=1&month=10&year=2024
Authorization: Bearer <token>
```

**Query Parameters**:
- `type` (optional): Filter by mission type (fire/rescue/medic/publicService/misc)
- `team` (optional): Filter by team (1/2/3)
- `month` (optional): Filter by month (1-12)
- `year` (optional): Filter by year
- `startDate` (optional): Filter missions starting from date
- `endDate` (optional): Filter missions ending before date

**Response** (200 OK):
```json
{
  "missions": [
    {
      "_id": "507f1f77bcf86cd799439044",
      "referenceNumber": "REF-2024-1015-001",
      "vehicleNumber": "101, 103",
      "startTime": "2024-10-15T14:30",
      "endTime": "2024-10-15T16:45",
      "location": "شارع الرئيسي، عرمون",
      "missionType": "fire",
      "missionDetails": "حريق في مبنى سكني - الطابق الثالث",
      "notes": "تم إخماد الحريق بنجاح، لا إصابات",
      "team": "1",
      "participants": [
        {
          "_id": "507f1f77bcf86cd799439055",
          "user": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "أحمد محمد",
            "role": "volunteer"
          },
          "checkIn": "2024-10-15T14:30",
          "checkOut": "2024-10-15T16:45"
        }
      ],
      "createdAt": "2024-10-15T14:25:00.000Z",
      "updatedAt": "2024-10-15T16:50:00.000Z"
    }
  ],
  "count": 1
}
```

---

### GET /missions/:id
Get specific mission by ID.

**Request**:
```http
GET /api/missions/507f1f77bcf86cd799439044
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "mission": {
    "_id": "507f1f77bcf86cd799439044",
    "referenceNumber": "REF-2024-1015-001",
    /* ... all mission fields ... */
  }
}
```

**Errors**:
- `404 Not Found`: Mission not found

---

### POST /missions
Create a new mission.

**Request**:
```http
POST /api/missions
Authorization: Bearer <token>
Content-Type: application/json

{
  "referenceNumber": "REF-2024-1020-001",
  "vehicleNumber": "102",
  "startTime": "2024-10-20T10:00",
  "endTime": "2024-10-20T12:30",
  "location": "بيروت، لبنان",
  "missionType": "rescue",
  "missionDetails": "حادث سير",
  "notes": "نقل المصابين إلى المستشفى",
  "team": "2",
  "participants": [
    {
      "user": "507f1f77bcf86cd799439011",
      "checkIn": "2024-10-20T10:00",
      "checkOut": "2024-10-20T12:30"
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "mission": {
    "_id": "507f1f77bcf86cd799439045",
    "referenceNumber": "REF-2024-1020-001",
    /* ... all mission fields ... */
  },
  "message": "Mission created successfully"
}
```

**Side Effects**:
- Updates User.currentMonthMissions for each participant
- Calculates net hours (excluding shift overlaps)
- Adds net hours to User.currentMonthHours

**Validation**:
- `vehicleNumber`: Required
- `startTime`: Required, valid datetime format
- `endTime`: Required, valid datetime format, must be after startTime
- `location`: Required
- `missionType`: Required, one of [fire, rescue, medic, publicService, misc]
- `team`: Required, one of [1, 2, 3]
- `participants`: Required, non-empty array

**Errors**:
- `400 Bad Request`: Validation failed
- `404 Not Found`: User not found in participants
- `409 Conflict`: Duplicate reference number

---

### PUT /missions/:id
Update existing mission.

**Request**:
```http
PUT /api/missions/507f1f77bcf86cd799439045
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Updated notes: All clear, no casualties",
  "endTime": "2024-10-20T13:00"
}
```

**Response** (200 OK):
```json
{
  "mission": {
    "_id": "507f1f77bcf86cd799439045",
    /* ... updated mission fields ... */
  },
  "message": "Mission updated successfully"
}
```

**Side Effects**:
- Recalculates hours for affected participants

**Errors**:
- `404 Not Found`: Mission not found
- `400 Bad Request`: Validation failed

---

### DELETE /missions/:id
Delete a mission.

**Request**:
```http
DELETE /api/missions/507f1f77bcf86cd799439045
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "message": "Mission deleted successfully"
}
```

**Side Effects**:
- Recalculates User statistics

**Errors**:
- `404 Not Found`: Mission not found

---

### GET /missions/available-months
Get list of months that have missions.

**Request**:
```http
GET /api/missions/available-months
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "months": [
    { "month": 10, "year": 2024 },
    { "month": 9, "year": 2024 }
  ]
}
```

---

## Attendance

### GET /attendance
Get attendance records with filtering.

**Request**:
```http
GET /api/attendance?userId=507f1f77bcf86cd799439011&month=10&year=2024
Authorization: Bearer <token>
```

**Query Parameters**:
- `userId` (optional): Filter by user ID
- `month` (optional): Filter by month (1-12)
- `year` (optional): Filter by year
- `date` (optional): Filter by specific date (YYYY-MM-DD)

**Response** (200 OK):
```json
{
  "attendance": [
    {
      "_id": "507f1f77bcf86cd799439066",
      "userId": "507f1f77bcf86cd799439011",
      "date": "2024-10-15",
      "code": "حاضر",
      "isPresent": true,
      "createdAt": "2024-10-15T08:00:00.000Z",
      "updatedAt": "2024-10-15T08:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### POST /attendance
Create attendance record (manual).

**Request**:
```http
POST /api/attendance
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439011",
  "date": "2024-10-20",
  "code": "إجازة مرضية",
  "isPresent": false
}
```

**Response** (201 Created):
```json
{
  "attendance": {
    "_id": "507f1f77bcf86cd799439067",
    "userId": "507f1f77bcf86cd799439011",
    "date": "2024-10-20",
    "code": "إجازة مرضية",
    "isPresent": false,
    "createdAt": "2024-10-20T10:00:00.000Z",
    "updatedAt": "2024-10-20T10:00:00.000Z"
  },
  "message": "Attendance record created"
}
```

**Validation**:
- `userId`: Required, valid user ID
- `date`: Required, YYYY-MM-DD format
- `code`: Required, attendance code
- `isPresent`: Boolean

**Errors**:
- `400 Bad Request`: Validation failed
- `409 Conflict`: Attendance already exists for this user/date

---

### PUT /attendance/:id
Update attendance record.

**Request**:
```http
PUT /api/attendance/507f1f77bcf86cd799439067
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "إجازة",
  "isPresent": false
}
```

**Response** (200 OK):
```json
{
  "attendance": {
    "_id": "507f1f77bcf86cd799439067",
    "code": "إجازة",
    "isPresent": false,
    /* ... */
  },
  "message": "Attendance updated"
}
```

---

### DELETE /attendance/:id
Delete attendance record.

**Request**:
```http
DELETE /api/attendance/507f1f77bcf86cd799439067
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "message": "Attendance deleted successfully"
}
```

---

## Dashboard

### GET /dashboard/stats
Get dashboard statistics for selected month.

**Request**:
```http
GET /api/dashboard/stats?month=10&year=2024
Authorization: Bearer <token>
```

**Query Parameters**:
- `month`: Month number (1-12)
- `year`: Year (e.g., 2024)

**Response** (200 OK):
```json
{
  "stats": {
    "totalMissions": 145,
    "totalHours": 3240.5,
    "activePersonnel": 45,
    "averageHoursPerPerson": 72,
    
    "missionsByType": {
      "fire": 35,
      "rescue": 48,
      "medic": 32,
      "publicService": 25,
      "misc": 5
    },
    
    "topContributors": [
      {
        "userId": "507f1f77bcf86cd799439011",
        "name": "أحمد محمد",
        "hours": 186.5,
        "missions": 28,
        "team": "1"
      },
      {
        "userId": "507f1f77bcf86cd799439012",
        "name": "محمد علي",
        "hours": 165,
        "missions": 25,
        "team": "2"
      }
    ],
    
    "teamPerformance": [
      {
        "team": "1",
        "totalHours": 1050,
        "totalMissions": 48,
        "memberCount": 15
      },
      {
        "team": "2",
        "totalHours": 980,
        "totalMissions": 45,
        "memberCount": 14
      },
      {
        "team": "3",
        "totalHours": 1210.5,
        "totalMissions": 52,
        "memberCount": 16
      }
    ],
    
    "dailyActivity": [
      { "date": "2024-10-01", "missionCount": 4 },
      { "date": "2024-10-02", "missionCount": 6 },
      { "date": "2024-10-03", "missionCount": 3 }
      /* ... for entire month ... */
    ]
  }
}
```

**Notes**:
- If querying current month, uses User.currentMonth* fields
- If querying archived month, uses MonthlyReports collection
- Top contributors exclude employees (volunteers only)
- Daily activity shows mission counts per day

---

## Monthly Reports

### GET /monthly-reports
Get all monthly reports with filtering.

**Request**:
```http
GET /api/monthly-reports?month=10&year=2024
Authorization: Bearer <token>
```

**Query Parameters**:
- `month` (optional): Filter by month
- `year` (optional): Filter by year
- `userId` (optional): Filter by user ID

**Response** (200 OK):
```json
{
  "reports": [
    {
      "_id": "507f1f77bcf86cd799439077",
      "userId": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "أحمد محمد",
        "role": "volunteer",
        "team": "1"
      },
      "month": 10,
      "year": 2024,
      "totalHours": 156.5,
      "totalMissions": 23,
      "totalDays": 15,
      "missionTypeCounts": {
        "fire": 5,
        "rescue": 8,
        "medic": 6,
        "publicService": 3,
        "misc": 1
      },
      "createdAt": "2024-11-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### GET /monthly-reports/user/:userId
Get all monthly reports for specific user.

**Request**:
```http
GET /api/monthly-reports/user/507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "reports": [
    {
      "month": 10,
      "year": 2024,
      "totalHours": 156.5,
      "totalMissions": 23,
      "totalDays": 15,
      "missionTypeCounts": { /* ... */ }
    },
    {
      "month": 9,
      "year": 2024,
      "totalHours": 142,
      "totalMissions": 20,
      "totalDays": 14,
      "missionTypeCounts": { /* ... */ }
    }
  ]
}
```

---

### GET /monthly-reports/available-months
Get list of months with archived reports.

**Request**:
```http
GET /api/monthly-reports/available-months
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "months": [
    { "month": 10, "year": 2024 },
    { "month": 9, "year": 2024 },
    { "month": 8, "year": 2024 }
  ]
}
```

---

## Settings

### GET /settings/active-month
Get current active month and year.

**Request**:
```http
GET /api/settings/active-month
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "activeMonth": 11,
  "activeYear": 2024
}
```

---

### PUT /settings/active-month
Update active month (used by month rollover).

**Request**:
```http
PUT /api/settings/active-month
Authorization: Bearer <token>
Content-Type: application/json

{
  "activeMonth": 11,
  "activeYear": 2024
}
```

**Response** (200 OK):
```json
{
  "settings": {
    "activeMonth": 11,
    "activeYear": 2024,
    "updatedAt": "2024-11-01T00:00:00.000Z"
  },
  "message": "Settings updated successfully"
}
```

---

## Month Rollover

### POST /month-rollover/rollover
Close current month and advance to next month.

**Request**:
```http
POST /api/month-rollover/rollover
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "message": "Month rollover completed successfully",
  "summary": {
    "previousMonth": 10,
    "previousYear": 2024,
    "newMonth": 11,
    "newYear": 2024,
    "usersProcessed": 45,
    "reportsCreated": 45
  }
}
```

**Process**:
1. Calculates monthly statistics for all users
2. Creates MonthlyReport documents
3. Resets User.currentMonth* fields to 0
4. Updates Settings.activeMonth to next month
5. All operations in transaction for data integrity

**Errors**:
- `500 Internal Server Error`: Rollover failed (transaction rolled back)

---

## Error Handling

### Error Response Format

All errors follow this structure:
```json
{
  "success": false,
  "error": "Error message",
  "details": {
    /* Additional error information */
  }
}
```

### Common HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry, constraint violation |
| 500 | Internal Server Error | Server error, database error |

### Example Error Responses

**Validation Error** (400):
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "name": "Name is required",
    "phoneNumber": "Invalid phone number format"
  }
}
```

**Authentication Error** (401):
```json
{
  "success": false,
  "error": "Authentication failed",
  "message": "Invalid or expired token"
}
```

**Not Found Error** (404):
```json
{
  "success": false,
  "error": "User not found",
  "resourceId": "507f1f77bcf86cd799439011"
}
```

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding for production:
- Authentication endpoints: 5 requests/minute
- General endpoints: 100 requests/minute
- Implement using express-rate-limit middleware

---

## Pagination

For large datasets, consider adding pagination:

**Request**:
```http
GET /api/users?page=1&limit=20
```

**Response**:
```json
{
  "users": [/* ... */],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 95,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## Conclusion

This API provides comprehensive endpoints for managing all aspects of Civil Defense operations. All endpoints require authentication except for login and password reset flows.

For questions or support:
- **Developer**: Adam Dakdouk
- **Email**: adamdakdouk2003@gmail.com
- **LinkedIn**: [linkedin.com/in/adamdakdouk](https://www.linkedin.com/in/adamdakdouk/)

---

**Document Version**: 1.0.0  
**Last Updated**: November 2025