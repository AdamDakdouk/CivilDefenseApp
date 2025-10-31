import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Shift from '../models/Shift';
import Mission from '../models/Mission';
import Attendance from '../models/Attendance';
import MonthlyReport from '../models/MonthlyReport';
import User from '../models/User';
import Settings from '../models/Settings';

dotenv.config();

const cleanDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civil-defense';
    await mongoose.connect(mongoURI);

    console.log('✅ Connected to MongoDB');

    // Delete all shifts
    const shiftsResult = await Shift.deleteMany({});
    console.log(`✅ Deleted ${shiftsResult.deletedCount} shifts`);

    // Delete all missions
    const missionsResult = await Mission.deleteMany({});
    console.log(`✅ Deleted ${missionsResult.deletedCount} missions`);

    // Delete all attendance records
    const attendanceResult = await Attendance.deleteMany({});
    console.log(`✅ Deleted ${attendanceResult.deletedCount} attendance records`);

    // Delete all monthly reports
    const reportsResult = await MonthlyReport.deleteMany({});
    console.log(`✅ Deleted ${reportsResult.deletedCount} monthly reports`);

    // Delete settings (will reset to current month on next load)
    const settingsResult = await Settings.deleteMany({});
    console.log(`✅ Deleted ${settingsResult.deletedCount} settings records`);

    // Reset all user stats
    await User.updateMany(
      {},
      {
        $set: {
          currentMonthHours: 0,
          currentMonthMissions: 0,
          currentMonthDays: 0
        }
      }
    );
    console.log('✅ Reset all user stats to 0');

    console.log('✅ Database cleaned successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

cleanDatabase();