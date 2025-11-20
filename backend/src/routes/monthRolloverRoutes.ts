import express, { Request, Response } from 'express';
import { rolloverMonth } from '../utils/monthRollover';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Manually trigger month rollover
router.post('/rollover', async (req: Request, res: Response) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }
    
    if (month < 1 || month > 12) {
      return res.status(400).json({ message: 'Invalid month' });
    }
    
    await rolloverMonth(month, year);
    
    // Calculate new month and year
    const newMonth = month === 12 ? 1 : month + 1;
    const newYear = month === 12 ? year + 1 : year;
    
    res.json({ 
      message: 'Month rollover completed successfully',
      newActiveMonth: newMonth,
      newActiveYear: newYear
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Error during month rollover', error });
  }
});

export default router;