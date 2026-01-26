import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import cron from 'node-cron';
import { checkAndPerformReset } from './utils/monthlyReset';
import { connectDB } from './config/database';
import shiftRoutes from './routes/shiftRoutes';
import missionRoutes from './routes/missionRoutes';
import monthlyReportRoutes from './routes/monthlyReportRoutes';
import volunteerStatsRoutes from './routes/volunteerStatsRoutes'
import attendanceRoutes from './routes/attendanceRoutes';
import monthRolloverRoutes from './routes/monthRolloverRoutes'
import settingsRoutes from './routes/settingsRoutes';
import dashboardRoutes from './routes/dashboardsRoutes';
import authRoutes from './routes//authRoutes';
import usersRoutes from './routes/usersRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Async error wrapper for route handlers
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Serve public assets
app.use('/public', express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/shifts', shiftRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/monthly-reports', monthlyReportRoutes);
app.use('/api/volunteer-stats', volunteerStatsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/month-rollover', monthRolloverRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/build');
  app.use(express.static(frontendPath));
  
  // Serve index.html for all non-API routes (SPA)
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Global error handler middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('🔴 Unhandled Error:', err.message);
  console.error('Stack:', err.stack);
  
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Make sure we only send response once
  if (!res.headersSent) {
    res.status(statusCode).json({
      message: message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('🔴 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('🔴 Uncaught Exception:', error);
  // Don't exit - let the error handler middleware deal with it
});

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Schedule monthly reset check - runs daily at 00:01 AM
cron.schedule('1 0 * * *', async () => {
  try {
    await checkAndPerformReset();
  } catch (error) {
    console.error('Error in monthly reset cron job:', error);
  }
});

startServer();