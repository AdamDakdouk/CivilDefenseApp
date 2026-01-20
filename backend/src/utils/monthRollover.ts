import User from '../models/User';
import MonthlyReport from '../models/MonthlyReport';
import Mission from '../models/Mission';
import mongoose from 'mongoose';
import Attendance from '../models/Attendance';
import Settings from '../models/Settings';

export const rolloverMonth = async (month: number, year: number, adminId: string) => {
    try {
        // Convert string adminId to ObjectId
        const adminObjectId = new mongoose.Types.ObjectId(adminId);

        // Get all users FOR THIS ADMIN
        const users = await User.find({ adminId: adminObjectId });

        // Get missions for this month FOR THIS ADMIN using string dates
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const missions = await Mission.find({
            adminId: adminObjectId,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).populate('participants.user');


        // Count mission types per user
        const userMissionCounts: any = {};
        for (const mission of missions) {
            try {
                for (const participant of mission.participants) {
                    if (!participant.user) {
                        continue;
                    }

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
            } catch (err) {
            }
        }

        // Create monthly reports for all users
        let reportsCreated = 0;
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
                adminId: adminObjectId,
                userId: user._id,
                month,
                year
            });

            if (!existingReport) {
                await MonthlyReport.create({
                    adminId: adminObjectId,
                    userId: user._id,
                    month,
                    year,
                    totalHours: user.currentMonthHours,
                    totalMissions: user.currentMonthMissions,
                    totalDays: user.currentMonthDays,
                    missionTypeCounts: missionCounts
                });
                reportsCreated++;
            }
        }

        // Reset current month fields for users of THIS ADMIN
        const resetResult = await User.updateMany(
            { adminId: adminObjectId },
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


        // Find the last shift of the closing month to determine rotation FOR THIS ADMIN
        const Shift = mongoose.model('Shift');
        const lastShift = await Shift.findOne({
            adminId: adminObjectId,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ date: -1 }).limit(1);

        let lastMonthEndTeam: '1' | '2' | '3' = '3'; // Default to '3' so next month starts with '1'
        if (lastShift && lastShift.team) {
            lastMonthEndTeam = lastShift.team;
        } 

        const settings = await Settings.findOneAndUpdate(
            { adminId: adminObjectId },
            {
                activeMonth: nextMonth,
                activeYear: nextYear,
                lastMonthEndTeam: lastMonthEndTeam
            },
            {
                upsert: true,
                new: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        return { success: true, usersProcessed: users.length };
    } catch (error) {
        throw error;
    }
};