import express, { Request, Response } from 'express';
import Settings from '../models/Settings';
import { authenticateToken } from '../middleware/auth';
import { getTeamForDate, getCurrentDate } from '../utils/timeUtils';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get active month
router.get('/active-month', async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    
    // If no settings exist, create with current month
    if (!settings) {
      const now = new Date();
      const today = getCurrentDate();
      const todayTeam = getTeamForDate(today);
      
      // Calculate yesterday's team to get lastMonthEndTeam
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      const lastMonthEndTeam = getTeamForDate(yesterdayStr);
      
      settings = await Settings.create({
        activeMonth: now.getMonth() + 1,
        activeYear: now.getFullYear(),
        lastMonthEndTeam
      });
    }
    
    res.json({
      activeMonth: settings.activeMonth,
      activeYear: settings.activeYear,
      lastMonthEndTeam: settings.lastMonthEndTeam || '3'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active month', error });
  }
});

// Update active month (used by month selector)
router.put('/active-month', async (req: Request, res: Response) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({
        activeMonth: month,
        activeYear: year
      });
    } else {
      settings.activeMonth = month;
      settings.activeYear = year;
      settings.updatedAt = new Date();
      await settings.save();
    }
    
    res.json({
      activeMonth: settings.activeMonth,
      activeYear: settings.activeYear
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating active month', error });
  }
});

export default router;