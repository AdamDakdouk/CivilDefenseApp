import express, { Request, Response } from 'express';
import Settings from '../models/Settings';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getTeamForDate, getCurrentDate } from '../utils/timeUtils';
import mongoose from 'mongoose';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get active month
router.get('/active-month', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    console.log(`[Settings] Fetching active month for admin: ${req.admin.stationName} (${req.admin.adminId})`);
    
    // ✅ DON'T convert to ObjectId - query with string directly
    let settings = await Settings.findOne({ adminId: req.admin.adminId });
    
    if (!settings) {
      console.log(`[Settings] No settings found for admin: ${req.admin.adminId}, returning defaults`);
      return res.json({
        activeMonth: 1,
        activeYear: new Date().getFullYear(),
        lastMonthEndTeam: '1'
      });
    }

    console.log(`[Settings] Fetched active month for ${req.admin.stationName}:`, {
      activeMonth: settings.activeMonth,
      activeYear: settings.activeYear,
      lastMonthEndTeam: settings.lastMonthEndTeam
    });
    
    res.json({
      activeMonth: settings.activeMonth,
      activeYear: settings.activeYear,
      lastMonthEndTeam: settings.lastMonthEndTeam || '3'
    });
  } catch (error) {
    console.error('[Settings] Error fetching active month:', error);
    res.status(500).json({ message: 'Error fetching active month' });
  }
});

// Update active month (used by month selector)
router.get('/active-month', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // ✅ Convert to ObjectId for query
    const adminObjectId = new mongoose.Types.ObjectId(req.admin.adminId);
    console.log(`[Settings] Fetching active month for admin: ${req.admin.stationName} (${req.admin.adminId})`);
    
    let settings = await Settings.findOne({ adminId: adminObjectId });
    
    if (!settings) {
      console.log(`[Settings] No settings found for admin: ${req.admin.adminId}, returning defaults`);
      return res.json({
        activeMonth: 1,
        activeYear: new Date().getFullYear(),
        lastMonthEndTeam: '1'
      });
    }

    console.log(`[Settings] Fetched active month for ${req.admin.stationName}:`, {
      activeMonth: settings.activeMonth,
      activeYear: settings.activeYear,
      lastMonthEndTeam: settings.lastMonthEndTeam
    });
    
    res.json({
      activeMonth: settings.activeMonth,
      activeYear: settings.activeYear,
      lastMonthEndTeam: settings.lastMonthEndTeam || '3'
    });
  } catch (error) {
    console.error('[Settings] Error fetching active month:', error);
    res.status(500).json({ message: 'Error fetching active month' });
  }
});

export default router;