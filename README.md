# 🚨 Civil Defense Station Management System

> A comprehensive full-stack web application designed to digitize and streamline emergency response operations for the Lebanese Civil Defense - Aramoun Center.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat&logo=linkedin)](https://www.linkedin.com/in/adamdakdouk/)
[![Email](https://img.shields.io/badge/Email-Contact-red?style=flat&logo=gmail)](mailto:adamdakdouk2003@gmail.com)

---

## 📋 Overview

This system replaces traditional paper-based civil defense operations with an efficient, centralized digital platform. It addresses critical challenges in emergency response coordination by providing real-time tracking, automated reporting, and data-driven insights for station management.

### The Problem

Civil Defense stations traditionally rely on manual, paper-based processes:
- ✍️ Manual attendance sheets prone to errors and loss
- 📊 Difficult to track volunteer hours and mission participation  
- ⏱️ Time-consuming monthly report generation
- 🗂️ No centralized system for mission logging
- 📈 Hard to analyze performance metrics and trends

### The Solution

A cloud-based management platform that provides:
- ✅ Digital attendance tracking with automated calculations
- 🚑 Real-time mission logging with detailed participant tracking
- 📑 Automated monthly reports with comprehensive statistics
- 📊 Dashboard analytics for data-driven decision making
- ☁️ Secure cloud storage ensuring data accessibility

---

## 🎯 Key Features

### 👥 Personnel Management
- Comprehensive user profiles (volunteers, employees, head staff, admin staff)
- Team-based organization
- Emergency contact tracking and employment details
- Visual distinction between active volunteers and employees

### 📅 Shift Management
- Automated shift creation with intelligent team-based pre-filling
- Weekend-aware scheduling (head/admin staff only on weekdays)
- Flexible time tracking with custom check-in/check-out times
- Attendance code generation (present/absent/sick/vacation)
- Real-time participant search and filtering

### 🚑 Mission Tracking
- Comprehensive emergency mission logging with:
  - Mission type categorization (rescue, medical, fire, public service, misc)
  - Smart dropdowns with custom entry options
  - Location and vehicle tracking (supports 3 vehicles: 101, 102, 103)
  - Reference numbers for official documentation
  - Detailed notes and mission specifics
- Participant assignment and time duration calculation
- Automatic hour counting for accurate reporting

### 📊 Dashboard & Analytics
Real-time visualizations and statistics:
- Total missions and working hours for selected month
- Mission distribution by type (interactive bar charts)
- Top contributors ranking (volunteers only)
- Team performance comparison
- Daily activity visualization
- Historical data access via month selector

### 📑 Monthly Reporting System
- Month-end rollover with data archival
- Comprehensive monthly reports per user:
  - Total working hours, missions, and days
  - Mission type breakdown
- Archive access for historical data
- Automatic counter reset while preserving data integrity

### 🖨️ Print & Export
- Employee/volunteer attendance tables (A4 landscape optimized)
- Mission logs with all details
- Monthly reports for official documentation
- Full Arabic RTL support in printed materials

---

## 🛠️ Technology Stack

### Frontend
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-3178C6?style=flat&logo=typescript)
![React Router](https://img.shields.io/badge/React_Router-6.27.0-CA4245?style=flat&logo=react-router)

- **React 18.3.1** - Modern UI framework with hooks
- **TypeScript 4.9.5** - Type safety and enhanced developer experience
- **React Router 6.27.0** - Client-side routing
- **Context API** - State management (Auth, Month contexts)
- **Axios** - HTTP client for API communication
- **CSS3** - Custom styling with animations and RTL support

### Backend
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js)
![Express](https://img.shields.io/badge/Express-4.21.1-000000?style=flat&logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6?style=flat&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-8.8.1-47A248?style=flat&logo=mongodb)

- **Node.js 18+** - JavaScript runtime
- **Express 4.21.1** - Web application framework
- **TypeScript 5.6.3** - Type-safe backend development
- **MongoDB 8.8.1** - NoSQL database
- **Mongoose 8.8.2** - MongoDB object modeling
- **JWT** - Secure authentication tokens
- **Bcrypt** - Password hashing (10 rounds)
- **Mailgun** - Email service for password reset

### Infrastructure
- **MongoDB Atlas** - Cloud-hosted database with automatic backups
- **Render.com** - Backend deployment platform
- **Namecheap** - Domain registration (civildefense.online)
- **Mailgun** - Transactional email service

---

## 🏗️ Architecture Highlights

### Custom "Civil Defense Clock" System
A timezone-independent time tracking system that eliminates calculation errors:
- No timezone conversions required
- Consistent date strings (YYYY-MM-DD format)
- Accurate hour calculations regardless of server location
- Prevents date boundary issues (midnight crossing problems)
- Ensures data integrity across all operations

### Security Features
- JWT-based authentication with 7-day token expiration
- Bcrypt password hashing (10 rounds)
- Protected API routes with authentication middleware
- CORS configuration for cross-origin security
- Input validation on all endpoints
- SQL injection prevention through Mongoose ODM

### Database Design
7 optimized collections:
- **Users** - Personnel information and current stats
- **Missions** - Emergency mission records with participants
- **Shifts** - Daily attendance records
- **Attendance** - Individual attendance tracking
- **MonthlyReports** - Archived monthly statistics
- **Settings** - System configuration (active month/year)
- **Admins** - Authentication credentials

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Mailgun account with verified domain
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd civil-defense-management-system
```

2. **Backend Setup**
```bash
cd backend
npm install

# Create .env file with your credentials
cp .env.example .env

# Create initial admin account
npm run create-admin

# Start development server
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install

# Start development server
npm start
```

4. **Environment Variables**

Backend `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/civil-defense
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=civildefense.online
```

---

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- **[Full Documentation](docs/FullDocumentation.md)** - Complete system overview and features
- **[Database Structure](docs/DatabaseStructure.md)** - Schema design and relationships
- **[API Endpoints](docs/APIEndpoints.md)** - Complete API reference
- **[Reports & Logic](docs/ReportsLogic.md)** - Calculation rules and business logic
- **[Setup Guide](docs/SetupGuide.md)** - Detailed installation and configuration

---

## 🎨 UI/UX Features

- **Modern Design** - Gradient backgrounds with glassmorphism effects
- **Arabic RTL Support** - Full right-to-left layout for Arabic interface
- **Responsive Design** - Desktop-first with tablet compatibility
- **Color-Coded System**:
  - 🔴 Red - Delete, cancel, errors
  - 🟢 Green - Add, confirm, success
  - 🟡 Yellow - Edit, warnings
  - ⚪ White - Primary background
- **Auto-Hiding Navbar** - More screen space during scrolling
- **Loading States** - Spinners and feedback for all async operations
- **Print-Optimized** - Professional layouts for physical records

---

## 🔮 Future Enhancements

- **Mobile Application** - React Native app with offline support
- **Email Notifications** - Mission alerts and shift reminders
- **Advanced Reporting** - Custom report builder with PDF/Excel export
- **Third-Party Integration** - Emergency dispatch systems and SMS notifications

---

## 🤝 Contributing

This is a proprietary project developed for the Lebanese Civil Defense - Aramoun Center. For feature requests or bug reports, please contact the development team.

---

## 📄 License

Proprietary - All rights reserved by Lebanese Civil Defense

---

## 👨‍💻 Developer

**Adam Dakdouk**  
Full-Stack Developer | MERN Stack & TypeScript Specialist

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/adamdakdouk/)
[![Email](https://img.shields.io/badge/Email-Contact-D14836?style=for-the-badge&logo=gmail)](mailto:adamdakdouk2003@gmail.com)

---

## 🙏 Acknowledgments

- **Lebanese Civil Defense** - For the opportunity to modernize operations
- **Aramoun Center Staff** - For requirements gathering and testing
- **MongoDB Atlas** - Cloud database hosting
- **Mailgun** - Email service provider
- **Namecheap** - Domain registration

---

<div align="center">

**Last Updated:** November 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Deployed

</div>
