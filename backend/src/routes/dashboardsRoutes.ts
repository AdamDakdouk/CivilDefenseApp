import express, { Request, Response } from 'express';
import Mission from '../models/Mission';
import Shift from '../models/Shift';
import User from '../models/User';
import MonthlyReport from '../models/MonthlyReport';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

router.get('/stats', async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ message: 'Month and year are required' });
        }

        const startDate = new Date(Date.UTC(Number(year), Number(month) - 1, 1, 0, 0, 0, 0));
        const endDate = new Date(Date.UTC(Number(year), Number(month), 0, 23, 59, 59, 999));

        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ message: 'Invalid date range' });
        }

        // Get all missions for the month
        const missions = await Mission.find({
            startTime: {
                $gte: startDate,
                $lte: endDate
            }
        }).populate('participants.user');

        // Get all shifts for the month
        const shifts = await Shift.find({
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).populate('participants.user');

        // Total missions
        const totalMissions = missions.length;

        // Total hours from MISSIONS ONLY
        let totalHours = 0;
        missions.forEach(mission => {
            const missionStart = new Date(mission.startTime);
            let missionEnd = new Date(mission.endTime);
            if (missionEnd < missionStart) {
                missionEnd = new Date(missionEnd.getTime() + 24 * 60 * 60 * 1000);
            }
            const hours = Math.round((missionEnd.getTime() - missionStart.getTime()) / (1000 * 60 * 60));
            // Don't multiply by participants - just add mission hours once
            totalHours += hours;
        });

        // Missions by type
        const missionsByType: { [key: string]: number } = {};
        const typeTranslations: { [key: string]: string } = {
            'rescue': 'إنقاذ',
            'medic': 'إسعاف',
            'fire': 'إطفاء',
            'public-service': 'خدمة عامة',
            'misc': 'مختلف'
        };

        missions.forEach(mission => {
            const typeKey = mission.missionType || 'misc';
            const typeArabic = typeTranslations[typeKey] || mission.missionType || 'غير محدد';
            missionsByType[typeArabic] = (missionsByType[typeArabic] || 0) + 1;
        });

        // Daily activity
        const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
        const dailyActivity = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(Date.UTC(Number(year), Number(month) - 1, day, 0, 0, 0, 0));
            const nextDay = new Date(Date.UTC(Number(year), Number(month) - 1, day + 1, 0, 0, 0, 0));

            const dayMissions = missions.filter(m => {
                const mStart = new Date(m.startTime);
                return mStart >= dayDate && mStart < nextDay;
            }).length;

            const dayShifts = shifts.filter(s => {
                const sDate = new Date(s.date);
                return sDate.getUTCDate() === day;
            }).length;

            dailyActivity.push({
                day,
                missions: dayMissions,
                shifts: dayShifts
            });
        }

        // Top contributors - VOLUNTEERS ONLY
        const volunteerMap = new Map();

        // From missions
        missions.forEach(mission => {
            const missionStart = new Date(mission.startTime);
            let missionEnd = new Date(mission.endTime);
            if (missionEnd < missionStart) {
                missionEnd = new Date(missionEnd.getTime() + 24 * 60 * 60 * 1000);
            }
            const hours = Math.round((missionEnd.getTime() - missionStart.getTime()) / (1000 * 60 * 60));

            mission.participants.forEach((p: any) => {
                // Only include volunteers
                if (p.user.role === 'volunteer') {
                    const userId = p.user._id.toString();
                    const userName = p.user.name;

                    if (!volunteerMap.has(userId)) {
                        volunteerMap.set(userId, {
                            name: userName,
                            hours: 0,
                            missions: 0
                        });
                    }

                    const contributor = volunteerMap.get(userId);
                    contributor.hours += hours;
                    contributor.missions += 1;
                }
            });
        });

        const topContributors = Array.from(volunteerMap.values())
            .sort((a, b) => b.hours - a.hours);

        // Team performance - missions hours only
        const teamMap = new Map();

        missions.forEach(mission => {
            const team = mission.team || 'غير محدد';

            if (!teamMap.has(team)) {
                teamMap.set(team, { team, hours: 0, missions: 0 });
            }

            const missionStart = new Date(mission.startTime);
            let missionEnd = new Date(mission.endTime);
            if (missionEnd < missionStart) {
                missionEnd = new Date(missionEnd.getTime() + 24 * 60 * 60 * 1000);
            }
            const hours = Math.round((missionEnd.getTime() - missionStart.getTime()) / (1000 * 60 * 60));

            // Add mission hours only once per mission (not multiplied by participants)
            teamMap.get(team).hours += hours;
            teamMap.get(team).missions += 1;
        });

        const teamPerformance = Array.from(teamMap.values());

        res.json({
            totalMissions,
            totalHours,
            missionsByType,
            dailyActivity,
            topContributors,
            teamPerformance,
            recentActivity: []
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error fetching dashboard stats', error });
    }
});

export default router;