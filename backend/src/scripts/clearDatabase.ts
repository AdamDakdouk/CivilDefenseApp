import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Shift from '../models/Shift';
import Mission from '../models/Mission';
import Attendance from '../models/Attendance';
import MonthlyReport from '../models/MonthlyReport';
import User from '../models/User';
import Settings from '../models/Settings';
import Admin from '../models/Admin';

dotenv.config();

/**
 * Clear all data from the database
 * Keeps user records but resets their stats
 */
export const clearDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civil-defense';
    await mongoose.connect(mongoURI);

    console.log('🔄 Connected to MongoDB - Starting database clear...\n');

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

    // Delete settings
    const settingsResult = await Settings.deleteMany({});
    console.log(`✅ Deleted ${settingsResult.deletedCount} settings records`);

    // Reset all user stats
    const updateResult = await User.updateMany(
      {},
      {
        $set: {
          currentMonthHours: 0,
          currentMonthMissions: 0,
          currentMonthDays: 0
        }
      }
    );
    console.log(`✅ Reset stats for ${updateResult.modifiedCount} users`);

    console.log('\n✨ Database cleared successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
};

/**
 * Clear everything including users and admins (full reset)
 */
export const clearDatabaseComplete = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civil-defense';
    await mongoose.connect(mongoURI);

    console.log('🔄 Connected to MongoDB - Starting complete database clear...\n');

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

    // Delete settings
    const settingsResult = await Settings.deleteMany({});
    console.log(`✅ Deleted ${settingsResult.deletedCount} settings records`);

    // Delete all users
    const usersResult = await User.deleteMany({});
    console.log(`✅ Deleted ${usersResult.deletedCount} users`);

    // Delete all admins
    const adminsResult = await Admin.deleteMany({});
    console.log(`✅ Deleted ${adminsResult.deletedCount} admins`);

    console.log('\n✨ Database completely cleared!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
};
