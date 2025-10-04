import express, { Request, Response } from 'express';
import Shift from '../models/Shift';
import User from '../models/User';
import Mission from '../models/Mission';

const router = express.Router();

// Get current month shifts
router.get('/', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const shifts = await Shift.find({
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    })
      .populate('participants.user')
      .populate('createdBy')
      .sort({ date: -1 });
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shifts', error });
  }
});

// Create new shift
router.post('/', async (req: Request, res: Response) => {
  try {
    const { date, team, participants, createdBy } = req.body;

    // Calculate hours for each participant
    const processedParticipants = participants.map((p: any) => {
      const checkIn = new Date(p.checkIn);
      const checkOut = new Date(p.checkOut);
      const hoursServed = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60));

      return {
        user: p.userId,
        checkIn,
        checkOut,
        hoursServed
      };
    });

    const shift = new Shift({
      date,
      team,
      participants: processedParticipants,
      createdBy
    });

    await shift.save();

    // Only update user stats if this is the current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const shiftDate = new Date(date);
    const shiftMonth = shiftDate.getMonth();
    const shiftYear = shiftDate.getFullYear();

    const isCurrentMonth = (shiftMonth === currentMonth && shiftYear === currentYear);

    if (isCurrentMonth) {
      // Update user hours and handle existing missions
      for (const participant of processedParticipants) {
        const shiftStart = new Date(participant.checkIn);
        const shiftEnd = new Date(participant.checkOut);

        // Find missions that overlap with this shift for this user
        const overlappingMissions = await Mission.find({
          'participants.user': participant.user,
          $or: [
            {
              $and: [
                { startTime: { $lt: shiftEnd } },
                { endTime: { $gt: shiftStart } }
              ]
            }
          ]
        });

        // Calculate hours to remove from missions that now overlap
        let hoursToRemove = 0;
        for (const mission of overlappingMissions) {
          let missionStart = new Date(mission.startTime);
          let missionEnd = new Date(mission.endTime);

          // Fix midnight crossing
          if (missionEnd <= missionStart) {
            missionEnd = new Date(missionEnd.getTime() + 24 * 60 * 60 * 1000);
          }

          const missionHours = Math.round((missionEnd.getTime() - missionStart.getTime()) / (1000 * 60 * 60));
          hoursToRemove += missionHours;
        }

        // Add shift hours and remove overlapping mission hours
        await User.findByIdAndUpdate(participant.user, {
          $inc: {
            currentMonthHours: participant.hoursServed - hoursToRemove
          }
        });
      }
    }

    const populatedShift = await Shift.findById(shift._id)
      .populate('participants.user')
      .populate('createdBy');

    res.status(201).json(populatedShift);
  } catch (error) {
    res.status(500).json({ message: 'Error creating shift', error });
  }
});

// Update existing shift
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, team, participants } = req.body;
    
    // Get the old shift
    const oldShift = await Shift.findById(id);
    if (!oldShift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    // Check if old shift was in current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const oldShiftDate = new Date(oldShift.date);
    const oldShiftMonth = oldShiftDate.getMonth();
    const oldShiftYear = oldShiftDate.getFullYear();
    const oldWasCurrentMonth = (oldShiftMonth === currentMonth && oldShiftYear === currentYear);

    // Revert old hours only if it was current month
    if (oldWasCurrentMonth) {
      for (const participant of oldShift.participants) {
        await User.findByIdAndUpdate(participant.user, {
          $inc: { currentMonthHours: -participant.hoursServed }
        });
      }
    }
    
    // Calculate new hours
    const processedParticipants = participants.map((p: any) => {
      const checkIn = new Date(p.checkIn);
      const checkOut = new Date(p.checkOut);
      const hoursServed = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60));
      
      return {
        user: p.userId,
        checkIn,
        checkOut,
        hoursServed
      };
    });
    
    // Update shift
    const updatedShift = await Shift.findByIdAndUpdate(
      id,
      {
        date,
        team,
        participants: processedParticipants
      },
      { new: true }
    ).populate('participants.user').populate('createdBy');
    
    // Check if new shift is in current month
    const newShiftDate = new Date(date);
    const newShiftMonth = newShiftDate.getMonth();
    const newShiftYear = newShiftDate.getFullYear();
    const newIsCurrentMonth = (newShiftMonth === currentMonth && newShiftYear === currentYear);

    // Add new hours only if current month
    if (newIsCurrentMonth) {
      for (const participant of processedParticipants) {
        const shiftStart = new Date(participant.checkIn);
        const shiftEnd = new Date(participant.checkOut);

        // Find overlapping missions
        const overlappingMissions = await Mission.find({
          'participants.user': participant.user,
          $or: [
            {
              $and: [
                { startTime: { $lt: shiftEnd } },
                { endTime: { $gt: shiftStart } }
              ]
            }
          ]
        });

        let hoursToRemove = 0;
        for (const mission of overlappingMissions) {
          let missionStart = new Date(mission.startTime);
          let missionEnd = new Date(mission.endTime);

          if (missionEnd <= missionStart) {
            missionEnd = new Date(missionEnd.getTime() + 24 * 60 * 60 * 1000);
          }

          const missionHours = Math.round((missionEnd.getTime() - missionStart.getTime()) / (1000 * 60 * 60));
          hoursToRemove += missionHours;
        }

        await User.findByIdAndUpdate(participant.user, {
          $inc: {
            currentMonthHours: participant.hoursServed - hoursToRemove
          }
        });
      }
    }
    
    res.json(updatedShift);
  } catch (error) {
    res.status(500).json({ message: 'Error updating shift', error });
  }
});

// Delete shift
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const shift = await Shift.findById(id);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    // Check if shift is in current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const shiftDate = new Date(shift.date);
    const shiftMonth = shiftDate.getMonth();
    const shiftYear = shiftDate.getFullYear();
    const isCurrentMonth = (shiftMonth === currentMonth && shiftYear === currentYear);
    
    // Revert hours only if current month
    if (isCurrentMonth) {
      for (const participant of shift.participants) {
        await User.findByIdAndUpdate(participant.user, {
          $inc: { currentMonthHours: -participant.hoursServed }
        });
      }
    }
    
    await Shift.findByIdAndDelete(id);
    
    res.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting shift', error });
  }
});

// Get shifts for specific month/year
router.get('/by-month', async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

    const shifts = await Shift.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .populate('participants.user')
      .populate('createdBy')
      .sort({ date: -1 });

    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shifts by month', error });
  }
});

// Get available months that have shifts
router.get('/available-months', async (req: Request, res: Response) => {
  try {
    const months = await Shift.aggregate([
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            year: { $year: '$date' }
          }
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
export default router;