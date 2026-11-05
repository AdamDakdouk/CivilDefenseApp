import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import MonthlyReport from '../models/MonthlyReport';
import Settings from '../models/Settings';

dotenv.config();

// SET THESE TO THE MONTH/YEAR THAT WAS ACCIDENTALLY CLOSED
const CLOSED_MONTH = 7; 
const CLOSED_YEAR = 2026; 

const undoRollover = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civil-defense';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Get all monthly reports for the closed month
    const reports = await MonthlyReport.find({
      month: CLOSED_MONTH,
      year: CLOSED_YEAR
    });

    if (reports.length === 0) {
      console.log('❌ No monthly reports found for this month/year. Check CLOSED_MONTH/CLOSED_YEAR values.');
      process.exit(1);
    }

    console.log(`📋 Found ${reports.length} monthly reports to restore\n`);

    // 2. Restore each user's stats from their archived report
    let restoredCount = 0;
    for (const report of reports) {
      await User.findByIdAndUpdate(report.userId, {
        $set: {
          currentMonthHours: report.totalHours,
          currentMonthMissions: report.totalMissions,
          currentMonthDays: report.totalDays
        }
      });
      restoredCount++;
    }
    console.log(`✅ Restored stats for ${restoredCount} users`);

    // 3. Delete the monthly reports (un-archive them)
    const deleteResult = await MonthlyReport.deleteMany({
      month: CLOSED_MONTH,
      year: CLOSED_YEAR
    });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} monthly report records`);

    // 4. Revert Settings back to the closed month
    const settings = await Settings.findOneAndUpdate(
      {},
      {
        activeMonth: CLOSED_MONTH,
        activeYear: CLOSED_YEAR
      },
      { new: true, upsert: true }
    );
    console.log(`✅ Settings reverted to: ${settings.activeMonth}/${settings.activeYear}`);

    console.log('\n✅ Rollover undo COMPLETE. The head of station can continue working on this month.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error undoing rollover:', error);
    process.exit(1);
  }
};

undoRollover();