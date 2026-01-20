import User from '../models/User';
import MonthlyReport from '../models/MonthlyReport';

export const performMonthlyReset = async (): Promise<void> => {
  try {
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // 1-12
    const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();


    // Get all users
    const users = await User.find();

    // Archive each user's stats
    for (const user of users) {
      // Only create report if user had any activity
      if (user.currentMonthHours > 0 || user.currentMonthMissions > 0) {
        await MonthlyReport.create({
          month: lastMonth,
          year: lastYear,
          userId: user._id,
          totalHours: user.currentMonthHours,
          totalMissions: user.currentMonthMissions
        });
      }

      // Reset user's current month counters
      user.currentMonthHours = 0;
      user.currentMonthMissions = 0;
      await user.save();
    }

  } catch (error) {
    console.error('❌ Error performing monthly reset:', error);
    throw error;
  }
};

export const checkAndPerformReset = async (): Promise<void> => {
  const now = new Date();
  const day = now.getDate();

  // Check if it's the 1st of the month
  if (day === 1) {
    await performMonthlyReset();
  }
};