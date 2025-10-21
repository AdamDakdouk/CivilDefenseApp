import express, { Request, Response } from 'express';
import Attendance from '../models/Attendance';

const router = express.Router();

// Get attendance records for a specific month
router.get('/month', async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

    const attendance = await Attendance.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('userId');

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance', error });
  }
});

export default router;