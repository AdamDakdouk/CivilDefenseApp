import express, { Request, Response } from 'express';
import Mission from '../models/Mission';
import Shift from '../models/Shift';
import User from '../models/User';
import MonthlyReport from '../models/MonthlyReport';
import { authenticateToken } from '../middleware/auth';
import { calculateHours } from '../utils/timeUtils';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

router.get('/stats', async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ message: 'Month and year are required' });
        }

        // Create date range for the month
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(Number(year), Number(month), 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        // Get all missions for the month
        const missions = await Mission.find({
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).populate('participants.user');

        // Get all shifts for the month (not used for now, but keep for future)
        const shifts = await Shift.find({
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).populate('participants.user');

        // Total missions
        const totalMissions = missions.length;

        // Total hours from MISSIONS ONLY (sum of mission hours, not participant hours)
        let totalHours = 0;
        missions.forEach(mission => {
            const hours = calculateHours(mission.startTime, mission.endTime);
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
            const dayString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const dayMissions = missions.filter(m => m.date === dayString).length;
            const dayShifts = shifts.filter(s => s.date === dayString).length;

            dailyActivity.push({
                day,
                missions: dayMissions,
                shifts: dayShifts
            });
        }

        // Top contributors - VOLUNTEERS ONLY
        // FIXED: Now uses custom participant hours!
        const volunteerMap = new Map();

        missions.forEach(mission => {
            const missionHours = calculateHours(mission.startTime, mission.endTime);

            mission.participants.forEach((p: any) => {
                // Only include volunteers
                if (p.user && p.user.role === 'volunteer') {
                    const userId = p.user._id.toString();
                    const userName = p.user.name;

                    if (!volunteerMap.has(userId)) {
                        volunteerMap.set(userId, {
                            name: userName,
                            hours: 0,
                            missions: 0
                        });
                    }

                    // FIXED: Use participant's custom hours if available
                    let participantHours = missionHours;
                    
                    if (p.customStartTime && p.customEndTime) {
                        participantHours = calculateHours(p.customStartTime, p.customEndTime);
                    }

                    const contributor = volunteerMap.get(userId);
                    contributor.hours += participantHours;
                    contributor.missions += 1;
                }
            });
        });

        const topContributors = Array.from(volunteerMap.values())
            .sort((a, b) => b.hours - a.hours);

        // Team performance - missions hours only (NOT participant hours)
        const teamMap = new Map();

        missions.forEach(mission => {
            const team = mission.team || 'غير محدد';

            if (!teamMap.has(team)) {
                teamMap.set(team, { team, hours: 0, missions: 0 });
            }

            const hours = calculateHours(mission.startTime, mission.endTime);

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
        res.status(500).json({ message: 'Error fetching dashboard stats', error });
    }
});

export default router;