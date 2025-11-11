import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import cron from 'node-cron';
import { checkAndPerformReset } from './utils/monthlyReset';
import { connectDB } from './config/database';
import userRoutes from './routes/userRoutes';
import shiftRoutes from './routes/shiftRoutes';
import missionRoutes from './routes/missionRoutes';
import monthlyReportRoutes from './routes/monthlyReportRoutes';
import volunteerStatsRoutes from './routes/volunteerStatsRoutes'
import attendanceRoutes from './routes/attendanceRoutes';
import monthRolloverRoutes from './routes/monthRolloverRoutes'
import settingsRoutes from './routes/settingsRoutes';
import dashboardRoutes from './routes/dashboardsRoutes';
import authRoutes from './routes//authRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Civil Defense API is running' });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/monthly-reports', monthlyReportRoutes);
app.use('/api/volunteer-stats', volunteerStatsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/month-rollover', monthRolloverRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/build');
  app.use(express.static(frontendPath));
  
  // Serve index.html for all non-API routes (SPA)
  app.get('/*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Schedule monthly reset check - runs daily at 00:01 AM
cron.schedule('1 0 * * *', async () => {
  console.log('🔍 Checking if monthly reset is needed...');
  try {
    await checkAndPerformReset();
  } catch (error) {
    console.error('Error in monthly reset cron job:', error);
  }
});

console.log('⏰ Monthly reset scheduler initialized');
startServer();