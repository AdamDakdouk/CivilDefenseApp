import express, { Request, Response } from 'express';
import Attendance from '../models/Attendance';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get attendance records for a specific month
router.get('/month', async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    // Create date range for the month using strings
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

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

// Update attendance code
router.put('/update', async (req: Request, res: Response) => {
  try {
    const { userId, date, code } = req.body;
    
    // Date should come as YYYY-MM-DD string from frontend
    // If it comes as ISO string, extract the date part
    let normalizedDate = date;
    if (date.includes('T')) {
      // Extract date part from ISO string
      normalizedDate = date.split('T')[0];
    }
    
    const attendance = await Attendance.findOneAndUpdate(
      { userId, date: normalizedDate },
      { code },
      { upsert: true, new: true }
    ).populate('userId');
    
    res.json(attendance);
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: 'Error updating attendance', error });
  }
});

export default router;