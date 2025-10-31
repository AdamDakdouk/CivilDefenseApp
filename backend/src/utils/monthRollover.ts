import User from '../models/User';
import MonthlyReport from '../models/MonthlyReport';
import Mission from '../models/Mission';
import mongoose from 'mongoose';
import Attendance from '../models/Attendance';
import Settings from '../models/Settings';

export const rolloverMonth = async (month: number, year: number) => {
    try {
        console.log(`Starting month rollover for ${month}/${year}...`);

        // Get all users
        const users = await User.find();

        // Get missions for this month to calculate mission type counts
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const missions = await Mission.find({
            startTime: {
                $gte: startDate,
                $lte: endDate
            }
        }).populate('participants.user');

        // // Delete all attendance records for the closed month
        // const attendanceStartDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
        // const attendanceEndDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

        // await Attendance.deleteMany({
        //     date: {
        //         $gte: attendanceStartDate,
        //         $lte: attendanceEndDate
        //     }
        // });

        // console.log(`✅ Cleared attendance records for ${month}/${year}`);

        // Count mission types per user
        const userMissionCounts: any = {};
        for (const mission of missions) {
            for (const participant of mission.participants) {
                const userId = participant.user._id.toString();

                if (!userMissionCounts[userId]) {
                    userMissionCounts[userId] = {
                        fire: 0,
                        rescue: 0,
                        medic: 0,
                        publicService: 0,
                        misc: 0
                    };
                }

                switch (mission.missionType) {
                    case 'fire':
                        userMissionCounts[userId].fire++;
                        break;
                    case 'rescue':
                        userMissionCounts[userId].rescue++;
                        break;
                    case 'medic':
                        userMissionCounts[userId].medic++;
                        break;
                    case 'public-service':
                        userMissionCounts[userId].publicService++;
                        break;
                    case 'misc':
                        userMissionCounts[userId].misc++;
                        break;
                }
            }
        }

        // Create monthly reports for all users
        for (const user of users) {
            const missionCounts = userMissionCounts[(user._id as mongoose.Types.ObjectId).toString()] || {
                fire: 0,
                rescue: 0,
                medic: 0,
                publicService: 0,
                misc: 0
            };

            // Check if report already exists
            const existingReport = await MonthlyReport.findOne({
                userId: user._id,
                month,
                year
            });

            if (!existingReport) {
                await MonthlyReport.create({
                    userId: user._id,
                    month,
                    year,
                    totalHours: user.currentMonthHours,
                    totalMissions: user.currentMonthMissions,
                    totalDays: user.currentMonthDays,
                    missionTypeCounts: missionCounts
                });
            }
        }

        // Reset current month fields for all users
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

        // Update active month to next month
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;

        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({
                activeMonth: nextMonth,
                activeYear: nextYear
            });
        } else {
            settings.activeMonth = nextMonth;
            settings.activeYear = nextYear;
            settings.updatedAt = new Date();
            await settings.save();
        }

        console.log(`✅ Advanced active month to ${nextMonth}/${nextYear}`);

        console.log(`✅ Month rollover completed for ${month}/${year}`);
        return { success: true, usersProcessed: users.length };
    } catch (error) {
        console.error('Month rollover error:', error);
        throw error;
    }
};