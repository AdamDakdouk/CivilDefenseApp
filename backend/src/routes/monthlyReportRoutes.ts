import express, { Request, Response } from 'express';
import MonthlyReport from '../models/MonthlyReport';
import User from '../models/User';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all monthly reports for a specific month/year
router.get('/', async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const reports = await MonthlyReport.find({
      month: Number(month),
      year: Number(year)
    }).populate('userId').sort({ totalHours: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching monthly reports', error });
  }
});

// Get available months (months that have archived data)
router.get('/available-months', async (req: Request, res: Response) => {
  try {
    const months = await MonthlyReport.aggregate([
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      }
    ]);

    const formattedMonths = months.map(m => ({
      month: m._id.month,
      year: m._id.year,
      label: `${m._id.month}/${m._id.year}`
    }));

    res.json(formattedMonths);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available months', error });
  }
});

// Get current month data (from User model)
router.get('/current', async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('name middleName motherName autoNumber cardNumber role team currentMonthHours currentMonthMissions currentMonthDays');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching current month data', error });
  }
});

// Get monthly reports for a specific month
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const reports = await MonthlyReport.find({
      month: Number(month),
      year: Number(year)
    }).populate('userId', 'name middleName motherName autoNumber cardNumber role team');

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching monthly reports', error });
  }
});

export default router;