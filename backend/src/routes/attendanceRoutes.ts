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

// Update attendance code
// router.put('/update', async (req: Request, res: Response) => {
//   try {
//     const { userId, date, code } = req.body;
    
//     const attendanceDate = new Date(date);
//     attendanceDate.setHours(0, 0, 0, 0);
    
//     const attendance = await Attendance.findOneAndUpdate(
//       { userId, date: attendanceDate },
//       { code },
//       { upsert: true, new: true }
//     );
    
//     res.json(attendance);
//   } catch (error) {
//     res.status(500).json({ message: 'Error updating attendance', error });
//   }
// });

router.put('/update', async (req: Request, res: Response) => {
  try {
    const { userId, date, code } = req.body;
    
    // Parse as UTC date
    const attendanceDate = new Date(date);
    const normalizedDate = new Date(Date.UTC(
      attendanceDate.getUTCFullYear(),
      attendanceDate.getUTCMonth(),
      attendanceDate.getUTCDate(),
      0, 0, 0, 0
    ));
    
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