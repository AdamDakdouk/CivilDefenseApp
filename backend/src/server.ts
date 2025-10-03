import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { checkAndPerformReset } from './utils/monthlyReset';
import { connectDB } from './config/database';
import userRoutes from './routes/userRoutes';
import shiftRoutes from './routes/shiftRoutes';
import missionRoutes from './routes/missionRoutes';
import monthlyReportRoutes from './routes/monthlyReportRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
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