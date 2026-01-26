import express, { Response } from 'express';
import Admin from '../models/Admin';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// protect all admin routes
router.use(authenticateToken);

/**
 * GET current admin config
 * used to fetch mission suffix on frontend load
 */
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const admin = await Admin.findById(req.admin.adminId)
      .select('email name stationName missionSuffix');

    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admin data' });
  }
});

/**
 * UPDATE mission reference suffix
 */
router.put('/mission-suffix', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { missionSuffix } = req.body;

    if (typeof missionSuffix !== 'string') {
      return res.status(400).json({ message: 'Invalid suffix' });
    }

    const admin = await Admin.findByIdAndUpdate(
      req.admin.adminId,
      { missionSuffix: missionSuffix.trim() },
      { new: true }
    ).select('missionSuffix');

    res.json({ missionSuffix: admin?.missionSuffix });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update mission suffix' });
  }
});

export default router;
