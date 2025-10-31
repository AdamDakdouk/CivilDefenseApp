import express, { Request, Response } from 'express';
import { rolloverMonth } from '../utils/monthRollover';

const router = express.Router();

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
    
    const result = await rolloverMonth(month, year);
    
    res.json({
      message: `Month ${month}/${year} archived successfully`,
      ...result
    });
  } catch (error) {
    console.error('Month rollover error:', error);
    res.status(500).json({ message: 'Error during month rollover', error });
  }
});

export default router;