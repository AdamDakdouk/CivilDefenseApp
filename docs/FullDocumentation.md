# Full Documentation - Civil Defense Station Management System

## Table of Contents
1. [System Overview](#system-overview)
2. [Problem Statement & Solution](#problem-statement--solution)
3. [Core Features](#core-features)
4. [Technical Architecture](#technical-architecture)
5. [Custom Clock System](#custom-clock-system)
6. [Email Configuration](#email-configuration)
7. [Deployment & Infrastructure](#deployment--infrastructure)
8. [User Interface](#user-interface)
9. [Known Issues & Solutions](#known-issues--solutions)
10. [Development Guidelines](#development-guidelines)

---

## System Overview

The Civil Defense Station Management System is a comprehensive full-stack web application designed specifically for the Lebanese Civil Defense - Aramoun Center. It digitizes and streamlines daily operations, volunteer coordination, emergency mission tracking, and administrative workflows.

### Key Objectives
- Replace paper-based processes with a digital solution
- Improve operational efficiency and reduce errors
- Provide valuable insights through data tracking and analytics
- Ensure data security and accessibility through cloud storage
- Generate automated reports for administrative purposes

---

## Problem Statement & Solution

### The Challenge

Civil Defense stations traditionally manage their operations using paper-based systems, which creates several challenges:

#### Operational Challenges
- **Manual Attendance Sheets**: Prone to errors, loss, and difficult to maintain
- **Volunteer Hour Tracking**: No systematic way to track individual contributions
- **Report Generation**: Time-consuming monthly reports compiled manually
- **Mission Logging**: Decentralized and inconsistent documentation
- **Performance Analysis**: Difficult to analyze trends and metrics

#### Business Impact
- Increased administrative overhead
- Higher risk of data loss
- Delayed decision-making due to lack of real-time insights
- Difficulty in resource allocation
- Limited accountability and transparency

### The Solution

This application provides a comprehensive digital platform with:

#### Immediate Benefits
- **Digital Attendance Tracking**: Automated calculations with zero manual errors
- **Real-Time Mission Logging**: Detailed participant tracking and documentation
- **Automated Monthly Reports**: Comprehensive statistics generated instantly
- **Dashboard Analytics**: Data-driven decision making with visual insights
- **Cloud-Based Storage**: Secure, accessible data with automatic backups

#### Long-Term Value
- Historical data preservation for trend analysis
- Improved volunteer recognition through accurate tracking
- Better resource allocation based on performance metrics
- Enhanced operational transparency and accountability
- Scalable system that grows with organizational needs

---

## Core Features

### 1. User Management

#### User Types & Roles
The system supports four distinct user types:

1. **Volunteers** (`role: 'volunteer'`)
   - Part-time emergency responders
   - Assigned to specific teams (1, 2, or 3)
   - Tracked for hours, missions, and working days
   - Included in performance rankings

2. **Employees** (`role: 'employee'`)
   - Full-time paid staff
   - Assigned to specific teams
   - Separate attendance tracking
   - Excluded from volunteer rankings

3. **Head Staff** (`role: 'head'`)
   - Station leadership
   - Work weekdays only
   - Access to all system features
   - Administrative oversight capabilities

4. **Administrative Staff** (`role: 'administrative staff'`)
   - Office and support personnel
   - Work weekdays only
   - Limited field operations
   - Focus on documentation and coordination

#### User Profile Information
Each user profile contains:
- **Basic Information**: Name, role, team assignment
- **Contact Details**: Phone number, emergency contact
- **Personal Data**: Date of birth, address
- **Current Statistics**: 
  - `currentMonthHours`: Total hours worked this month
  - `currentMonthMissions`: Total missions participated in
  - `currentMonthDays`: Total days worked
- **Team Assignment**: Team 1, 2, or 3 for operational organization

#### User Management Features
- Create, read, update, delete (CRUD) operations
- Search and filter by name, role, or team
- Visual distinction between volunteers and employees
- Bulk operations for team management
- Export user lists for external use

---

### 2. Shift Management (Daily Attendance)

Shifts represent daily attendance periods where personnel are on duty at the station.

#### Shift Creation Process

1. **Automated Team Pre-filling**
   - System automatically loads appropriate team members based on selected team
   - Weekend logic: Only head and administrative staff on weekends
   - Weekday logic: All team members available for selection

2. **Flexible Participant Selection**
   - Add or remove participants from pre-filled list
   - Search functionality for quick participant finding
   - Support for cross-team participation (special circumstances)

3. **Time Tracking**
   - Default times: 8:00 AM - 8:00 AM next day (24-hour shift)
   - Custom check-in/check-out times for each participant
   - Automatic duration calculation
   - Support for shifts spanning midnight

#### Shift Features

**Attendance Tracking**
- Each participant has individual check-in and check-out times
- Automatic attendance marking based on shift presence
- Override capability for special attendance codes
- Integration with attendance calendar

**Edit and Delete**
- Full edit capability for correcting mistakes
- Delete protection with confirmation dialog
- Audit trail for administrative oversight
- Preservation of related mission data

**Participant Management**
- Real-time participant search and filtering
- Team-based participant organization
- Visual indicators for attendance status
- Batch participant operations

---

### 3. Mission Tracking

Missions represent emergency response operations where personnel respond to incidents.

#### Mission Types

The system categorizes missions into five primary types:

1. **Fire Missions** (`missionType: 'fire'`)
   - Structural fires
   - Vehicle fires
   - Forest fires
   - Custom fire types via dropdown

2. **Rescue Missions** (`missionType: 'rescue'`)
   - Vehicle accidents
   - Building collapses
   - Search and rescue operations
   - Water rescue

3. **Medical Missions** (`missionType: 'medic'`)
   - Emergency medical response
   - Patient transport
   - Medical assistance calls
   - On-site medical support

4. **Public Service** (`missionType: 'publicService'`)
   - Community assistance
   - Event coverage
   - Training exercises
   - Public safety operations

5. **Miscellaneous** (`missionType: 'misc'`)
   - Administrative missions
   - Equipment maintenance
   - Custom mission types
   - Other operational activities

#### Mission Data Structure

Each mission contains comprehensive information:

**Core Information**
- `referenceNumber`: Official documentation reference
- `vehicleNumber`: Vehicles deployed (supports multiple: "101, 102, 103")
- `startTime`: Mission start timestamp
- `endTime`: Mission completion timestamp
- `location`: Incident location
- `missionType`: Category (fire/rescue/medic/publicService/misc)
- `missionDetails`: Specific mission details (e.g., "structural fire")
- `notes`: Additional notes and observations
- `team`: Primary responding team

**Participant Tracking**
```javascript
participants: [
  {
    user: ObjectId,      // Reference to User document
    checkIn: Date,       // When participant joined mission
    checkOut: Date       // When participant completed mission
  }
]
```

#### Mission Features

**Smart Dropdowns**
- Pre-defined common mission types
- Custom entry option for unique situations
- Auto-complete for frequent locations
- Vehicle number selection with multi-select

**Time Tracking**
- Automatic duration calculation
- Hour counting for participant statistics
- Support for multi-day missions
- Accurate time zone handling via Custom Clock

**Participant Management**
- Flexible participant assignment
- Different check-in/out times per participant
- Team-based participant suggestions
- Real-time participant search

**Data Validation**
- Required field validation
- Date/time consistency checks
- Participant duplicate prevention
- Reference number uniqueness

---

### 4. Attendance System

The attendance system provides a visual monthly calendar for tracking personnel presence.

#### Attendance Codes

The system supports multiple attendance status codes:

- **حاضر (Present)**: Regular attendance
- **غياب (Absent)**: Absent without leave
- **إجازة مرضية (Sick Leave)**: Medical leave
- **إجازة (Vacation)**: Scheduled time off
- **Additional Codes**: Customizable based on organization needs

#### Attendance Features

**Monthly Calendar View**
- Visual grid showing all days of the month
- Color-coded attendance indicators
- Quick navigation between months
- User-specific attendance views

**Automatic Marking**
- Attendance automatically marked when user participates in shift
- Integration with shift and mission data
- Real-time updates as shifts/missions are logged

**Manual Override**
- Admin can manually set attendance codes
- Override automatic marking for special cases
- Add notes for attendance exceptions
- Historical attendance modification with audit trail

**Print-Optimized Tables**
- A4 landscape format for physical records
- Separate tables for employees and volunteers
- Professional formatting for official documentation
- Arabic RTL support

---

### 5. Dashboard & Analytics

The dashboard provides real-time insights into station operations.

#### Key Metrics (Current Month)

**Overview Statistics**
- Total missions completed
- Total working hours logged
- Active personnel count
- Average hours per person

**Mission Distribution**
- Bar chart showing missions by type
- Percentage breakdown
- Trend indicators (up/down from previous month)
- Color-coded visualization

**Top Contributors**
- Ranking of volunteers by hours worked
- Excludes employees from rankings
- Shows missions and hours per volunteer
- Visual leaderboard display

**Team Performance**
- Comparison across all three teams
- Hours, missions, and participation rates
- Team efficiency metrics
- Resource allocation insights

**Daily Activity**
- Calendar-style view of mission counts per day
- Peak activity identification
- Pattern recognition for resource planning
- Historical comparison capability

#### Dashboard Features

**Month Selector**
- Navigate to any archived month
- Compare current vs historical data
- Access past performance metrics
- Generate comparative reports

**Interactive Visualizations**
- Clickable charts for detailed views
- Hover tooltips with additional data
- Responsive design for all screen sizes
- Export charts as images

**Data Filtering**
- Filter by team
- Filter by date range
- Filter by mission type
- Filter by user role

---

### 6. Monthly Reporting System

The monthly reporting system archives data and generates comprehensive reports.

#### Month Rollover Process

**Automated Archival**
1. System calculates totals for all users:
   - Total working hours
   - Total missions participated
   - Total working days
   - Mission type breakdown (fire/rescue/medic/publicService/misc)

2. Creates `MonthlyReport` documents for each user:
```javascript
{
  userId: ObjectId,
  month: 10,              // October
  year: 2024,
  totalHours: 156,
  totalMissions: 23,
  totalDays: 15,
  missionTypeCounts: {
    fire: 5,
    rescue: 8,
    medic: 6,
    publicService: 3,
    misc: 1
  }
}
```

3. Resets current month counters to zero:
   - `currentMonthHours = 0`
   - `currentMonthMissions = 0`
   - `currentMonthDays = 0`

4. Updates system settings:
   - `activeMonth` advances to next month
   - `activeYear` updates if year changes

5. Preserves all historical data:
   - Missions remain unchanged
   - Shifts remain unchanged
   - Attendance remains unchanged
   - Only statistical counters reset

#### Monthly Report Features

**Per-User Reports**
- Comprehensive breakdown of individual performance
- Mission type distribution
- Hour allocation analysis
- Comparative statistics (vs team average)

**Archive Access**
- Navigate to any archived month via dropdown
- View historical reports
- Generate comparative analysis
- Export reports as PDF/Excel

**Data Integrity**
- No data loss during rollover
- All missions and shifts preserved
- Double-check confirmations before rollover
- Rollback capability (if implemented)

**Automated Generation**
- One-click month closing
- Automatic report generation for all users
- Email notifications (if configured)
- Administrative approval workflow

---

### 7. Print & Export Features

The system provides comprehensive printing and export capabilities.

#### Print Layouts

**Employee Attendance Tables**
- A4 landscape orientation
- Professional header with organization branding
- Grid layout with all dates of the month
- Attendance codes clearly visible
- Footer with signature lines

**Volunteer Attendance Tables**
- Same professional format as employees
- Separate tables to distinguish categories
- Optimized for archival purposes
- Pre-printed form replacement

**Mission Logs**
- Detailed mission information printout
- Participant lists with times
- Vehicle and location information
- Notes and reference numbers
- Official documentation format

**Monthly Reports**
- Summary statistics per user
- Mission type breakdown
- Comparative charts and graphs
- Professional report template

#### Export Features

**CSV Export**
- User lists with all information
- Mission logs for external analysis
- Attendance records for payroll
- Monthly statistics for reporting

**PDF Generation**
- Professional document formatting
- Embedded organization branding
- Arabic RTL text support
- Digital signature fields

**Excel Export**
- Formatted spreadsheets
- Pre-built formulas for calculations
- Pivot table templates
- Chart visualizations

---

### 8. Month Management

The month management system controls the active reporting period.

#### Active Month Concept

The **active month** represents the current operational period:
- All new shifts are created in the active month
- All new missions are logged to the active month
- Dashboard shows statistics for the active month
- User counters accumulate for the active month

#### Manual Month Closing

**When to Close a Month**
- At the end of each calendar month
- When all missions and shifts are finalized
- Before generating official reports
- After administrative review and approval

**Closing Process**
1. Admin navigates to settings/month management
2. Clicks "Close Current Month" button
3. System shows confirmation dialog with:
   - Current month/year
   - Total missions to be archived
   - Total shifts to be archived
   - Total users to generate reports for
4. Admin confirms action
5. System performs rollover (see Monthly Reporting section)
6. Success message displayed
7. Active month automatically advances

**Safety Features**
- Confirmation dialog prevents accidental closing
- Double-click prevention
- Admin-only access
- Audit logging of month closures
- Warning if current month has no data

#### Month Navigation

**Viewing Historical Data**
- Month selector dropdown in navbar
- Shows all months with data
- Clicking a month loads that month's data
- Dashboard updates to show archived statistics
- Missions and shifts filtered by selected month

**Current Month Indicator**
- Visual badge showing "Current Month" in dropdown
- Navbar displays active month/year
- Color coding for current vs archived months

---

## Technical Architecture

### Frontend Architecture

#### Component Structure

```
src/
├── components/
│   ├── Auth/
│   │   ├── Login.tsx
│   │   ├── ForgotPassword.tsx
│   │   └── ResetPassword.tsx
│   ├── Dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── StatsCard.tsx
│   │   └── Charts.tsx
│   ├── Users/
│   │   ├── UserList.tsx
│   │   ├── UserForm.tsx
│   │   └── UserCard.tsx
│   ├── Shifts/
│   │   ├── ShiftList.tsx
│   │   ├── ShiftForm.tsx
│   │   └── ShiftCard.tsx
│   ├── Missions/
│   │   ├── MissionList.tsx
│   │   ├── MissionForm.tsx
│   │   └── MissionCard.tsx
│   ├── Attendance/
│   │   ├── AttendanceCalendar.tsx
│   │   ├── AttendanceTable.tsx
│   │   └── AttendanceForm.tsx
│   ├── Reports/
│   │   ├── MonthlyReport.tsx
│   │   └── UserReport.tsx
│   ├── Common/
│   │   ├── Navbar.tsx
│   │   ├── CustomAlert.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ProtectedRoute.tsx
│   └── Settings/
│       └── MonthManagement.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── MonthContext.tsx
├── hooks/
│   ├── useApi.ts
│   ├── useAuth.ts
│   └── useMonth.ts
├── services/
│   └── api.ts
├── utils/
│   ├── dateUtils.ts
│   ├── calculationUtils.ts
│   └── validationUtils.ts
└── types/
    ├── User.ts
    ├── Mission.ts
    ├── Shift.ts
    └── Attendance.ts
```

#### State Management

**Context API Architecture**

1. **AuthContext**
```typescript
interface AuthContextType {
  admin: Admin | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}
```

2. **MonthContext**
```typescript
interface MonthContextType {
  activeMonth: number;
  activeYear: number;
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (month: number, year: number) => void;
  refreshActiveMonth: () => Promise<void>;
}
```

#### Custom Hooks

**useApi Hook**
```typescript
function useApi<T>(endpoint: string, dependencies?: any[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch logic with error handling
  // Automatic refetch on dependency change
  // Loading state management
  
  return { data, loading, error, refetch };
}
```

**useAuth Hook**
```typescript
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

#### Routing Structure

```typescript
<Router>
  <Routes>
    {/* Public Routes */}
    <Route path="/login" element={<Login />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password/:token" element={<ResetPassword />} />
    
    {/* Protected Routes */}
    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/users" element={<UserList />} />
      <Route path="/shifts" element={<ShiftList />} />
      <Route path="/missions" element={<MissionList />} />
      <Route path="/attendance" element={<AttendanceCalendar />} />
      <Route path="/reports" element={<MonthlyReport />} />
      <Route path="/settings" element={<MonthManagement />} />
    </Route>
  </Routes>
</Router>
```

---

### Backend Architecture

#### Project Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── User.ts
│   │   ├── Mission.ts
│   │   ├── Shift.ts
│   │   ├── Attendance.ts
│   │   ├── MonthlyReport.ts
│   │   ├── Settings.ts
│   │   └── Admin.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── missions.ts
│   │   ├── shifts.ts
│   │   ├── attendance.ts
│   │   ├── dashboard.ts
│   │   ├── monthlyReports.ts
│   │   ├── settings.ts
│   │   └── monthRollover.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── services/
│   │   ├── emailService.ts
│   │   ├── calculationService.ts
│   │   └── reportService.ts
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   └── validators.ts
│   ├── config/
│   │   └── database.ts
│   └── server.ts
├── scripts/
│   ├── createAdmin.ts
│   └── seedAtlas.ts
└── package.json
```

#### Middleware Pipeline

**Request Flow**
```
Client Request
    ↓
CORS Middleware (allow cross-origin)
    ↓
Body Parser (parse JSON)
    ↓
Authentication Middleware (verify JWT)
    ↓
Route Handler
    ↓
Business Logic / Database Operations
    ↓
Response Formatter
    ↓
Error Handler (if error occurs)
    ↓
Client Response
```

**Authentication Middleware**
```typescript
async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.id;
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
```

#### Service Layer

**Calculation Service**
```typescript
class CalculationService {
  // Calculate hours for a participant
  calculateHours(checkIn: Date, checkOut: Date): number {
    const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    return Math.round(hours * 100) / 100; // Round to 2 decimals
  }
  
  // Calculate total hours for a user in a month
  async calculateUserMonthlyHours(userId: string, month: number, year: number): Promise<number> {
    // Query shifts and missions
    // Sum participant hours
    // Return total
  }
  
  // Prevent double-counting when mission overlaps with shift
  async calculateNetHours(userId: string, month: number, year: number): Promise<number> {
    // Get all shifts and missions for user
    // Detect time overlaps
    // Subtract overlapping periods
    // Return net hours
  }
}
```

**Email Service**
```typescript
class EmailService {
  async sendPasswordResetEmail(email: string, code: string): Promise<void> {
    const mailgun = new Mailgun({
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN
    });
    
    const emailTemplate = `
      <h2>Civil Defense - Password Reset</h2>
      <p>Your reset code is: <strong>${code}</strong></p>
      <p>This code expires in 15 minutes.</p>
    `;
    
    await mailgun.messages().send({
      from: 'Civil Defense <noreply@civildefense.online>',
      to: email,
      subject: 'Password Reset Code',
      html: emailTemplate
    });
  }
}
```

---

## Custom Clock System

### The Timezone Problem

Traditional date/time handling in JavaScript uses the `Date` object, which automatically converts times to the user's local timezone. This causes issues in a distributed system:

#### Problem Scenarios

**Scenario 1: Midnight Crossing**
```javascript
// Server in UTC timezone
const shiftDate = new Date('2024-10-15T20:00:00.000Z'); // 8 PM UTC
// Client in Lebanon (UTC+3)
```

**Scenario 2: Hour Calculation Errors**
```javascript
// Mission starts 11 PM and ends 1 AM next day (2 hours)
const startTime = new Date('2024-10-15T23:00:00.000Z');
const endTime = new Date('2024-10-16T01:00:00.000Z');

// Timezone conversion causes incorrect calculations
// If displayed times change due to timezone, hours calculated wrong
```

**Scenario 3: Month Boundary Issues**
```javascript
// Mission on last day of month at 11 PM
const missionDate = new Date('2024-10-31T23:00:00.000Z');
// Might appear as November 1st in some timezones
// Causes mission to be counted in wrong month
```

### The Solution: Civil Defense Clock

The Civil Defense Clock system eliminates timezone dependencies entirely by:

1. **Using Date Strings Instead of Date Objects**
```javascript
// Traditional approach (WRONG)
const shiftDate = new Date(); // Subject to timezone conversion

// Civil Defense Clock (CORRECT)
const shiftDate = '2024-10-15'; // Pure date string, no timezone
```

2. **Consistent Date Format**
```javascript
// All dates stored as: YYYY-MM-DD
// All times stored as: YYYY-MM-DDTHH:mm

const shift = {
  date: '2024-10-15',
  checkIn: '2024-10-15T08:00',
  checkOut: '2024-10-16T08:00'
};
```

3. **Timezone-Free Calculations**
```javascript
// Calculate hours without timezone interference
function calculateHours(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

// Works correctly regardless of server or client timezone
const hours = calculateHours('2024-10-15T23:00', '2024-10-16T01:00');
// Always returns 2 hours
```

4. **Correct Month Assignment**
```javascript
// Extract month from date string directly
const missionDate = '2024-10-31T23:00';
const month = parseInt(missionDate.substring(5, 7)); // Always 10 (October)
// No timezone conversion can change this value
```

### Implementation Details

**Date Input Handling**
```typescript
// Frontend: User selects date via date picker
const selectedDate = '2024-10-15';

// Backend: Store exactly as received
await Shift.create({
  date: selectedDate, // No Date() constructor, no conversion
  team: '1',
  participants: []
});
```

**Time Range Queries**
```typescript
// Query all missions for October 2024
const missions = await Mission.find({
  // Use string comparison instead of Date comparison
  startTime: {
    $gte: '2024-10-01T00:00',
    $lt: '2024-11-01T00:00'
  }
});
```

**Displaying Dates**
```typescript
// Frontend: Display dates without conversion
function formatDate(dateString: string): string {
  // Parse string manually instead of using Date object
  const [year, month, day] = dateString.substring(0, 10).split('-');
  return `${day}/${month}/${year}`; // Lebanese format
}
```

### Benefits

✅ **Consistency**: Same date/time values across all servers and clients
✅ **Accuracy**: Hour calculations always correct
✅ **Simplicity**: No timezone conversion logic needed
✅ **Reliability**: No midnight crossing issues
✅ **Scalability**: Works with global users without modification

---

## Email Configuration

### Mailgun Setup

The system uses Mailgun for transactional email delivery.

#### Domain Configuration

**Domain Purchase**
- Domain: `civildefense.online`
- Registrar: Namecheap
- Cost: ~$15/year
- Purpose: Professional email sending

**DNS Records**
```
Type    Host                    Value                           TTL
MX      @                       mxa.mailgun.org                 3600
MX      @                       mxb.mailgun.org                 3600
TXT     @                       v=spf1 include:mailgun.org ~all 3600
TXT     mail._domainkey         [DKIM public key from Mailgun]  3600
CNAME   email.civildefense      mailgun.org                     3600
```

**Verification**
- Domain verified in Mailgun dashboard
- SPF record authenticated
- DKIM keys configured
- Email sending enabled

#### Email Templates

**Password Reset Email**
```html
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; padding: 20px; text-align: center; }
    .code { font-size: 32px; font-weight: bold; color: #667eea; 
            text-align: center; padding: 20px; }
    .footer { color: #666; font-size: 12px; text-align: center; 
              padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>الدفاع المدني اللبناني</h1>
      <p>Lebanese Civil Defense</p>
    </div>
    <div style="padding: 20px;">
      <h2>إعادة تعيين كلمة المرور</h2>
      <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك.</p>
      <p>استخدم الرمز التالي لإكمال العملية:</p>
      <div class="code">{{code}}</div>
      <p>هذا الرمز صالح لمدة 15 دقيقة فقط.</p>
      <p>إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.</p>
    </div>
    <div class="footer">
      <p>© 2024 الدفاع المدني اللبناني - جميع الحقوق محفوظة</p>
    </div>
  </div>
</body>
</html>
```

#### Email Sending Implementation

```typescript
import Mailgun from 'mailgun.js';
import formData from 'form-data';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY!
});

async function sendResetCode(email: string, code: string) {
  try {
    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN!, {
      from: 'Civil Defense <noreply@civildefense.online>',
      to: [email],
      subject: 'رمز إعادة تعيين كلمة المرور - Civil Defense Password Reset',
      html: generateEmailTemplate(code)
    });
    
    console.log('Email sent:', result);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send reset code');
  }
}
```

#### Error Handling

**Common Email Issues**
1. **Domain Not Verified**: Ensure DNS records are correct
2. **API Key Invalid**: Check environment variable
3. **Rate Limiting**: Mailgun free tier limits apply
4. **Spam Filters**: Ensure SPF and DKIM configured

**Fallback Strategy**
```typescript
async function sendEmailWithFallback(email: string, code: string) {
  try {
    await sendViaMailgun(email, code);
  } catch (error) {
    console.error('Mailgun failed, trying console.log fallback');
    console.log(`Reset code for ${email}: ${code}`);
    // In production, could try alternative email service
  }
}
```

---

## Deployment & Infrastructure

### MongoDB Atlas Configuration

#### Cluster Setup

**Configuration**
- **Cluster Type**: M0 Shared (Free Tier) or M10 Dedicated
- **Cloud Provider**: AWS or Google Cloud
- **Region**: Europe (Frankfurt) - closest to Lebanon
- **Backup**: Automated daily snapshots
- **Storage**: Auto-scaling enabled

**Connection String**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/civil-defense?retryWrites=true&w=majority
```

#### Security Configuration

**Network Access**
- IP Whitelist: `0.0.0.0/0` (allow all) for development
- Production: Specific IP addresses only
- VPN consideration for enhanced security

**Database Access**
- Username: `civildefenseadmin`
- Password: Strong password with special characters
- Role: `readWrite` on `civil-defense` database
- Additional users for backup/monitoring

#### Performance Optimization

**Indexes**
```javascript
// User collection
db.users.createIndex({ name: 1 });
db.users.createIndex({ role: 1, team: 1 });

// Mission collection
db.missions.createIndex({ startTime: -1 });
db.missions.createIndex({ missionType: 1 });
db.missions.createIndex({ team: 1, startTime: -1 });

// Shift collection
db.shifts.createIndex({ date: -1 });
db.shifts.createIndex({ team: 1, date: -1 });

// Attendance collection
db.attendance.createIndex({ userId: 1, date: -1 });

// Monthly Reports
db.monthlyreports.createIndex({ userId: 1, year: -1, month: -1 });
```

**Connection Pooling**
```typescript
mongoose.connect(process.env.MONGODB_URI!, {
  maxPoolSize: 10,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

---

### Render.com Deployment

#### Backend Deployment

**Service Configuration**
- **Type**: Web Service
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Instance Type**: Free tier (can upgrade)

**Environment Variables**
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=super-secret-key-here
PORT=5000
MAILGUN_API_KEY=key-xxxxx
MAILGUN_DOMAIN=civildefense.online
NODE_ENV=production
```

**Deployment Pipeline**
1. Push code to GitHub repository
2. Render detects changes automatically
3. Runs build command
4. Deploys new version
5. Zero-downtime deployment

#### Frontend Deployment

**Option 1: Netlify**
- Automatic deployment from GitHub
- Build command: `npm run build`
- Publish directory: `build`
- Environment variables: `REACT_APP_API_URL`

**Option 2: Vercel**
- Similar to Netlify
- Excellent performance
- Free SSL certificates
- Global CDN

**Option 3: Render Static Site**
- Hosted alongside backend
- Simplifies configuration
- Single domain management

---

### Environment Variables

#### Backend (.env)
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/civil-defense

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Server
PORT=5000
NODE_ENV=production

# Email
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=civildefense.online

# CORS (if needed)
CORS_ORIGIN=https://your-frontend-domain.com
```

#### Frontend (.env)
```env
# API Configuration
REACT_APP_API_URL=https://your-backend.onrender.com/api

# Environment
REACT_APP_ENV=production
```

---

### Backup Strategy

#### Automated Backups

**MongoDB Atlas**
- Daily snapshots automatically
- 7-day retention for free tier
- Point-in-time recovery for paid tiers
- Download backup capability

**Manual Backup Script**
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Export database
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/backup_$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" "$BACKUP_DIR/backup_$DATE"

# Remove uncompressed backup
rm -rf "$BACKUP_DIR/backup_$DATE"

# Keep only last 30 backups
ls -t $BACKUP_DIR/*.tar.gz | tail -n +31 | xargs rm -f

echo "Backup completed: backup_$DATE.tar.gz"
```

#### Restore Procedure
```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

# Extract backup
tar -xzf "$BACKUP_FILE" -C ./

# Restore to MongoDB
mongorestore --uri="$MONGODB_URI" --drop ./backup_*/

echo "Restore completed from $BACKUP_FILE"
```

---

## User Interface

### Design System

#### Color Palette

**Primary Colors**
- Primary: `#667eea` (Purple-blue)
- Secondary: `#764ba2` (Deep purple)
- Accent: `#f093fb` (Pink)

**Semantic Colors**
- Success: `#4ade80` (Green)
- Warning: `#fbbf24` (Yellow)
- Danger: `#f87171` (Red)
- Info: `#60a5fa` (Blue)

**Neutral Colors**
- Background: `#f8fafc` (Light gray)
- Surface: `#ffffff` (White)
- Text Primary: `#1e293b` (Dark gray)
- Text Secondary: `#64748b` (Medium gray)

#### Typography

**Font Family**
- Arabic: `'Cairo', 'Tajawal', sans-serif`
- English: `'Inter', 'Roboto', sans-serif`
- Monospace: `'Fira Code', monospace`

**Font Sizes**
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

#### Spacing System
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

---

### Component Library

#### Buttons

**Primary Button**
```css
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
}
```

**Secondary Button**
```css
.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}
```

#### Cards

**Glassmorphism Card**
```css
.glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

#### Modals

**Modal Overlay**
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
```

---

### RTL (Right-to-Left) Support

#### CSS Configuration

```css
/* Root RTL setup */
html[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

/* Flip margins and paddings */
html[dir="rtl"] .ml-4 {
  margin-left: 0;
  margin-right: 1rem;
}

html[dir="rtl"] .mr-4 {
  margin-right: 0;
  margin-left: 1rem;
}

/* Flip float */
html[dir="rtl"] .float-left {
  float: right;
}

html[dir="rtl"] .float-right {
  float: left;
}

/* Flip text alignment */
html[dir="rtl"] .text-left {
  text-align: right;
}

html[dir="rtl"] .text-right {
  text-align: left;
}
```

#### Component RTL Handling

```typescript
// Table with RTL support
<table dir="rtl" className="rtl-table">
  <thead>
    <tr>
      <th>الاسم</th>
      <th>الدور</th>
      <th>الفريق</th>
    </tr>
  </thead>
  <tbody>
    {users.map(user => (
      <tr key={user._id}>
        <td>{user.name}</td>
        <td>{user.role}</td>
        <td>{user.team}</td>
      </tr>
    ))}
  </tbody>
</table>
```

---

### Animations

#### Loading Spinner

```css
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner {
  border: 4px solid rgba(102, 126, 234, 0.1);
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}
```

#### Fade In Animation

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.5s ease-out;
}
```

#### Slide In Animation

```css
@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.slide-in {
  animation: slideIn 0.3s ease-out;
}
```

---

### Responsive Design

#### Breakpoints

```css
/* Mobile first approach */
/* Base styles for mobile */

/* Tablet: 768px and up */
@media (min-width: 768px) {
  /* Tablet styles */
}

/* Desktop: 1024px and up */
@media (min-width: 1024px) {
  /* Desktop styles */
}

/* Large Desktop: 1440px and up */
@media (min-width: 1440px) {
  /* Large desktop styles */
}
```

#### Responsive Table

```css
/* Mobile: Stack table vertically */
@media (max-width: 767px) {
  table, thead, tbody, th, td, tr {
    display: block;
  }
  
  thead tr {
    display: none;
  }
  
  tr {
    margin-bottom: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
  }
  
  td {
    text-align: right;
    padding-left: 50%;
    position: relative;
  }
  
  td:before {
    content: attr(data-label);
    position: absolute;
    left: 1rem;
    font-weight: bold;
  }
}
```

---

## Known Issues & Solutions

### Issue 1: Month Selector Shows Wrong Month

**Problem**
After month rollover, the month selector dropdown sometimes displayed the previous month instead of the newly active month.

**Root Cause**
Race condition between two async operations:
1. Month rollover updating Settings document
2. Frontend fetching active month

**Solution**
Implemented atomic database update using `findOneAndUpdate`:

```typescript
// Before (caused race condition)
const settings = await Settings.findOne();
settings.activeMonth = newMonth;
settings.activeYear = newYear;
await settings.save();

// After (atomic operation)
const settings = await Settings.findOneAndUpdate(
  {}, // Find first settings doc
  {
    $set: {
      activeMonth: newMonth,
      activeYear: newYear
    }
  },
  {
    new: true,  // Return updated document
    upsert: true // Create if doesn't exist
  }
);
```

---

### Issue 2: Timezone Calculation Errors

**Problem**
- Mission hours counted incorrectly
- Shifts showing wrong dates
- Month-end rollover timing issues

**Root Cause**
JavaScript `Date` object automatically converts times to local timezone, causing:
- Midnight crossing issues
- Incorrect hour calculations
- Wrong month assignment

**Solution**
Implemented Custom Clock System (see [Custom Clock System](#custom-clock-system) section).

---

### Issue 3: Double Mission/Shift Creation

**Problem**
Users accidentally creating duplicate entries by double-clicking submit button.

**Root Cause**
No protection against rapid repeated submissions.

**Solution**
```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

async function handleSubmit() {
  if (isSubmitting) return; // Prevent double submission
  
  setIsSubmitting(true);
  
  try {
    await api.post('/missions', missionData);
    // Success handling
  } catch (error) {
    // Error handling
  } finally {
    setIsSubmitting(false);
  }
}

// In JSX
<button 
  onClick={handleSubmit}
  disabled={isSubmitting}
>
  {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
</button>
```

---

### Issue 4: Participant Dates Not Updating

**Problem**
When editing a mission or shift, participant check-in/out times not updating correctly.

**Root Cause**
Using `toISOString()` which converts to UTC timezone:

```typescript
// WRONG - causes timezone conversion
const checkIn = new Date(selectedTime).toISOString();
// "2024-10-15T08:00:00.000Z" becomes "2024-10-15T05:00:00.000Z" in UTC+3
```

**Solution**
Use date strings directly without conversion:

```typescript
// CORRECT - preserves original time
const checkIn = selectedTime; // "2024-10-15T08:00"
// Store exactly as entered, no timezone conversion
```

---

### Issue 5: Month Rollover Data Loss

**Problem**
During testing, some user statistics were not preserved during month rollover.

**Root Cause**
MongoDB transaction not properly handling all updates atomically.

**Solution**
Implemented comprehensive rollover with verification:

```typescript
async function rolloverMonth() {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 1. Calculate and save monthly reports
    const users = await User.find().session(session);
    for (const user of users) {
      const report = await calculateMonthlyReport(user);
      await MonthlyReport.create([report], { session });
    }
    
    // 2. Reset user counters
    await User.updateMany(
      {},
      {
        $set: {
          currentMonthHours: 0,
          currentMonthMissions: 0,
          currentMonthDays: 0
        }
      },
      { session }
    );
    
    // 3. Update settings
    await Settings.findOneAndUpdate(
      {},
      { $inc: { activeMonth: 1 } },
      { session, new: true }
    );
    
    // 4. Verify all operations
    const verification = await verifyRollover(session);
    if (!verification.success) {
      throw new Error('Rollover verification failed');
    }
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

---

## Development Guidelines

### Code Style

#### TypeScript Standards

```typescript
// Use explicit types
function calculateHours(checkIn: string, checkOut: string): number {
  // Implementation
}

// Use interfaces for objects
interface User {
  _id: string;
  name: string;
  role: 'volunteer' | 'employee' | 'head' | 'administrative staff';
  team: '1' | '2' | '3';
}

// Use enums for constants
enum MissionType {
  FIRE = 'fire',
  RESCUE = 'rescue',
  MEDIC = 'medic',
  PUBLIC_SERVICE = 'publicService',
  MISC = 'misc'
}
```

#### React Best Practices

```typescript
// Use functional components with hooks
function UserCard({ user }: { user: User }) {
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    // Side effects here
  }, [user]);
  
  return <div>{user.name}</div>;
}

// Extract custom hooks
function useUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);
  
  return { user, loading };
}

// Use proper naming
// Components: PascalCase (UserCard, MissionList)
// Functions: camelCase (calculateHours, formatDate)
// Constants: UPPER_SNAKE_CASE (API_URL, MAX_PARTICIPANTS)
```

---

### Git Workflow

#### Branch Strategy

```bash
main              # Production-ready code
├── develop       # Integration branch
    ├── feature/user-management
    ├── feature/mission-tracking
    ├── fix/timezone-issue
    └── hotfix/critical-bug
```

#### Commit Messages

```bash
# Format: <type>(<scope>): <subject>

# Types:
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Code formatting (no functional changes)
refactor: Code restructuring
test:     Adding tests
chore:    Maintenance tasks

# Examples:
feat(missions): Add fire mission subtypes dropdown
fix(clock): Resolve timezone calculation errors
docs(readme): Update installation instructions
refactor(api): Simplify authentication middleware
```

#### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] No console errors

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

---

### Testing Strategy

#### Unit Tests

```typescript
// Example: Test hour calculation
describe('calculateHours', () => {
  it('calculates hours correctly for same-day shift', () => {
    const checkIn = '2024-10-15T08:00';
    const checkOut = '2024-10-15T16:00';
    const hours = calculateHours(checkIn, checkOut);
    expect(hours).toBe(8);
  });
  
  it('calculates hours correctly across midnight', () => {
    const checkIn = '2024-10-15T20:00';
    const checkOut = '2024-10-16T08:00';
    const hours = calculateHours(checkIn, checkOut);
    expect(hours).toBe(12);
  });
  
  it('handles invalid dates gracefully', () => {
    const checkIn = 'invalid-date';
    const checkOut = '2024-10-15T08:00';
    expect(() => calculateHours(checkIn, checkOut)).toThrow();
  });
});
```

#### Integration Tests

```typescript
// Example: Test mission creation API
describe('POST /api/missions', () => {
  it('creates mission successfully with valid data', async () => {
    const missionData = {
      referenceNumber: 'REF-001',
      vehicleNumber: '101',
      startTime: '2024-10-15T10:00',
      endTime: '2024-10-15T12:00',
      location: 'Downtown',
      missionType: 'fire',
      participants: []
    };
    
    const response = await request(app)
      .post('/api/missions')
      .set('Authorization', `Bearer ${token}`)
      .send(missionData)
      .expect(201);
    
    expect(response.body.mission).toHaveProperty('_id');
    expect(response.body.mission.location).toBe('Downtown');
  });
  
  it('rejects mission without authentication', async () => {
    const response = await request(app)
      .post('/api/missions')
      .send({})
      .expect(401);
  });
});
```

#### Manual Testing Checklist

**Before Each Release**
- [ ] Login/logout flow works
- [ ] User CRUD operations function correctly
- [ ] Shift creation with team pre-filling works
- [ ] Mission creation and participant assignment works
- [ ] Hour calculations are accurate
- [ ] Dashboard displays correct statistics
- [ ] Month rollover preserves data correctly
- [ ] Print layouts format properly
- [ ] RTL text displays correctly
- [ ] Responsive design on tablet
- [ ] No console errors
- [ ] Password reset email delivers
- [ ] Navigation between months works

---

### Performance Optimization

#### Database Query Optimization

```typescript
// BAD: N+1 query problem
const missions = await Mission.find();
for (const mission of missions) {
  const participants = await User.find({ _id: { $in: mission.participantIds } });
  mission.participants = participants;
}

// GOOD: Use population
const missions = await Mission.find().populate({
  path: 'participants.user',
  select: 'name role team'
});
```

#### React Performance

```typescript
// Use memo for expensive calculations
const totalHours = useMemo(() => {
  return missions.reduce((sum, m) => sum + m.hours, 0);
}, [missions]);

// Use callback for event handlers
const handleDelete = useCallback((id: string) => {
  deleteMission(id);
}, [deleteMission]);

// Use React.memo for components that render often
const UserCard = React.memo(({ user }: { user: User }) => {
  return <div>{user.name}</div>;
});
```

---

### Documentation Standards

#### Code Comments

```typescript
/**
 * Calculates the total hours worked by a user in a specific month,
 * preventing double-counting when missions overlap with shifts.
 * 
 * @param userId - The MongoDB ObjectId of the user
 * @param month - The month number (1-12)
 * @param year - The full year (e.g., 2024)
 * @returns The net hours worked, rounded to 2 decimal places
 * 
 * @example
 * const hours = await calculateUserMonthlyHours('123abc', 10, 2024);
 * // Returns: 156.50
 */
async function calculateUserMonthlyHours(
  userId: string,
  month: number,
  year: number
): Promise<number> {
  // Implementation
}
```

#### README Updates

Keep README.md updated when:
- Adding new features
- Changing installation steps
- Updating dependencies
- Modifying architecture
- Adding new environment variables

---

## Conclusion

This documentation provides a comprehensive overview of the Civil Defense Station Management System. For additional support or questions:

- **Developer**: Adam Dakdouk
- **Email**: adamdakdouk2003@gmail.com
- **LinkedIn**: [linkedin.com/in/adamdakdouk](https://www.linkedin.com/in/adamdakdouk/)

---

**Document Version**: 1.0.0  
**Last Updated**: November 2025  
**Status**: Production