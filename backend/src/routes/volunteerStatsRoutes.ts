import express, { Request, Response } from 'express';
import Mission from '../models/Mission';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get mission type counts for volunteers in a specific month
router.get('/mission-counts', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    // Create date range for the month using strings
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Get all missions in the month FOR THIS ADMIN
    const missions = await Mission.find({
      adminId: req.admin.adminId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('participants.user');

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

        // Increment count based on mission type
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

    res.json(userMissionCounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching volunteer stats', error });
  }
});

export default router;