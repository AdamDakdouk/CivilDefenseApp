import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import Shift from '../models/Shift';
import User from '../models/User';
import Mission from '../models/Mission';
import Attendance from '../models/Attendance';
import Settings from '../models/Settings';
import { authenticateToken } from '../middleware/auth';
import moment from 'moment-timezone';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

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
      .sort({ date: 1 });
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
      const checkIn = moment.tz(p.checkIn, 'Asia/Beirut').toDate();
      const checkOut = moment.tz(p.checkOut, 'Asia/Beirut').toDate();
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

    const [year, month, day] = date.split('-').map(Number);
    const shiftDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));


    // Get all employees, head, and admin staff
    const allStaff = await User.find({
      role: { $in: ['employee', 'head', 'administrative staff'] }
    });


    // Get participant IDs from this shift
    const participantIds = processedParticipants.map((p: any) => p.user.toString());

    // Mark attendance for all staff
    for (const staff of allStaff) {
      const staffId = (staff._id as mongoose.Types.ObjectId).toString();
      const code = participantIds.includes(staffId) ? 'ح' : 'ع';

      // Upsert attendance record (create or update)
      await Attendance.findOneAndUpdate(
        { userId: staff._id, date: shiftDate },
        { code },
        { upsert: true }
      );
    }

    // Only update user stats if this is the ACTIVE month (not calendar month)
    const settings = await Settings.findOne();
    const activeMonth = settings?.activeMonth || new Date().getMonth() + 1;
    const activeYear = settings?.activeYear || new Date().getFullYear();

    const shiftMonth = shiftDate.getUTCMonth() + 1; // Get month from UTC date
    const shiftYear = shiftDate.getUTCFullYear();

    const isCurrentMonth = (shiftMonth === activeMonth && shiftYear === activeYear);

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
            currentMonthHours: participant.hoursServed - hoursToRemove,
            currentMonthDays: 1
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

    // Check if old shift was in ACTIVE month
    const settings = await Settings.findOne();
    const activeMonth = settings?.activeMonth || new Date().getMonth() + 1;
    const activeYear = settings?.activeYear || new Date().getFullYear();

    const oldShiftDate = new Date(oldShift.date);
    const oldShiftMonth = oldShiftDate.getUTCMonth() + 1;
    const oldShiftYear = oldShiftDate.getUTCFullYear();
    const oldWasCurrentMonth = (oldShiftMonth === activeMonth && oldShiftYear === activeYear);

    // Step 1: Completely revert the old shift as if deleting it
    if (oldWasCurrentMonth) {
      for (const participant of oldShift.participants) {
        const userId = participant.user.toString();
        const shiftStart = new Date(participant.checkIn);
        const shiftEnd = new Date(participant.checkOut);

        await User.findByIdAndUpdate(userId, {
          $inc: {
            currentMonthHours: -participant.hoursServed,
            currentMonthDays: -1
          }
        });

        // Find missions that overlapped with OLD shift
        const overlappingMissions = await Mission.find({
          'participants.user': userId,
          $or: [
            {
              $and: [
                { startTime: { $lt: shiftEnd } },
                { endTime: { $gt: shiftStart } }
              ]
            }
          ]
        });

        for (const mission of overlappingMissions) {
          let missionStart = new Date(mission.startTime);
          let missionEnd = new Date(mission.endTime);

          if (missionEnd < missionStart) {
            missionEnd = new Date(missionEnd.getTime() + 24 * 60 * 60 * 1000);
          }

          const oldShiftDateNormalized = new Date(Date.UTC(
            oldShiftDate.getUTCFullYear(),
            oldShiftDate.getUTCMonth(),
            oldShiftDate.getUTCDate(),
            0, 0, 0, 0
          ));

          const otherShiftsOnSameDate = await Shift.find({
            _id: { $ne: id },
            date: oldShiftDateNormalized,
            'participants.user': userId
          });

          let coveredByOther = false;
          for (const other of otherShiftsOnSameDate) {
            const otherP = other.participants.find(p => p.user.toString() === userId);
            if (otherP) {
              const otherStart = new Date(otherP.checkIn);
              const otherEnd = new Date(otherP.checkOut);
              if (missionStart < otherEnd && missionEnd > otherStart) {
                coveredByOther = true;
                break;
              }
            }
          }

          if (!coveredByOther) {
            const missionHours = Math.round((missionEnd.getTime() - missionStart.getTime()) / (1000 * 60 * 60));
            await User.findByIdAndUpdate(userId, {
              $inc: { currentMonthHours: missionHours }
            });
          }
        }
      }
    }

    // Step 2: Calculate new shift data — FIXED TIMEZONE HERE
    const processedParticipants = participants.map((p: any) => {
      const checkIn = moment.tz(p.checkIn, 'Asia/Beirut').toDate();
      const checkOut = moment.tz(p.checkOut, 'Asia/Beirut').toDate();
      const hoursServed = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60));

      return {
        user: p.userId,
        checkIn,
        checkOut,
        hoursServed
      };
    });

    // Step 3: Normalize date to Beirut time too
    const [year, month, day] = date.split('-').map(Number);
    const newShiftDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    // Step 4: Update the shift
    const updatedShift = await Shift.findByIdAndUpdate(
      id,
      { date: newShiftDate, team, participants: processedParticipants },
      { new: true }
    ).populate('participants.user').populate('createdBy');

    // Step 5: Apply NEW shift logic
    const newShiftMonth = newShiftDate.getUTCMonth() + 1;
    const newShiftYear = newShiftDate.getUTCFullYear();
    const newIsCurrentMonth = (newShiftMonth === activeMonth && newShiftYear === activeYear);

    if (newIsCurrentMonth) {
      for (const participant of processedParticipants) {
        const shiftStart = new Date(participant.checkIn);
        const shiftEnd = new Date(participant.checkOut);

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

          if (missionEnd < missionStart) {
            missionEnd = new Date(missionEnd.getTime() + 24 * 60 * 60 * 1000);
          }

          if (missionStart < shiftEnd && missionEnd > shiftStart) {
            const missionHours = Math.round((missionEnd.getTime() - missionStart.getTime()) / (1000 * 60 * 60));
            hoursToRemove += missionHours;
          }
        }

        await User.findByIdAndUpdate(participant.user, {
          $inc: {
            currentMonthHours: participant.hoursServed - hoursToRemove,
            currentMonthDays: 1
          }
        });
      }
    }

    // Attendance recalculation (unchanged)
    const normalizedOldDate = new Date(Date.UTC(
      oldShiftDate.getUTCFullYear(),
      oldShiftDate.getUTCMonth(),
      oldShiftDate.getUTCDate(),
      0, 0, 0, 0
    ));

    const normalizedNewDate = new Date(Date.UTC(
      newShiftDate.getUTCFullYear(),
      newShiftDate.getUTCMonth(),
      newShiftDate.getUTCDate(),
      0, 0, 0, 0
    ));

    const allStaff = await User.find({
      role: { $in: ['employee', 'head', 'administrative staff'] }
    });

    const otherShiftsOnOldDate = await Shift.find({
      date: normalizedOldDate,
      _id: { $ne: id }
    });

    if (otherShiftsOnOldDate.length === 0) {
      for (const staff of allStaff) {
        await Attendance.findOneAndUpdate(
          { userId: staff._id, date: normalizedOldDate },
          { code: 'ع' },
          { upsert: true }
        );
      }
    } else {
      const oldParticipantIds = otherShiftsOnOldDate.flatMap(s =>
        s.participants.map((p: any) => p.user.toString())
      );

      for (const staff of allStaff) {
        const code = oldParticipantIds.includes((staff._id as mongoose.Types.ObjectId).toString()) ? 'ح' : 'ع';
        await Attendance.findOneAndUpdate(
          { userId: staff._id, date: oldShiftDate },
          { code },
          { upsert: true }
        );
      }
    }

    const newParticipantIds = processedParticipants.map((p: any) => p.user.toString());
    for (const staff of allStaff) {
      const code = newParticipantIds.includes((staff._id as mongoose.Types.ObjectId).toString()) ? 'ح' : 'ع';
      await Attendance.findOneAndUpdate(
        { userId: staff._id, date: normalizedNewDate },
        { code },
        { upsert: true }
      );
    }

    res.json(updatedShift);
  } catch (error) {
    console.error('Shift update error:', error);
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

    // Check if shift is in ACTIVE month
    const settings = await Settings.findOne();
    const activeMonth = settings?.activeMonth || new Date().getMonth() + 1;
    const activeYear = settings?.activeYear || new Date().getFullYear();

    const originalDate = new Date(shift.date);
    const shiftDate = new Date(Date.UTC(
      originalDate.getUTCFullYear(),
      originalDate.getUTCMonth(),
      originalDate.getUTCDate(),
      0, 0, 0, 0
    ));
    const shiftMonth = shiftDate.getUTCMonth() + 1;
    const shiftYear = shiftDate.getUTCFullYear();
    const isCurrentMonth = (shiftMonth === activeMonth && shiftYear === activeYear);

    // Revert hours and restore mission hours if current month
    if (isCurrentMonth) {
      for (const participant of shift.participants) {
        const userId = participant.user.toString();
        const shiftStart = new Date(participant.checkIn);
        const shiftEnd = new Date(participant.checkOut);

        // Remove shift hours
        await User.findByIdAndUpdate(userId, {
          $inc: {
            currentMonthHours: -participant.hoursServed,
            currentMonthDays: -1
          }
        });

        // Find missions that were during this shift
        const overlappingMissions = await Mission.find({
          'participants.user': userId,
          $or: [
            {
              $and: [
                { startTime: { $lt: shiftEnd } },
                { endTime: { $gt: shiftStart } }
              ]
            }
          ]
        });

        // For each overlapping mission, check if it's still covered by another shift
        for (const mission of overlappingMissions) {
          let missionStart = new Date(mission.startTime);
          let missionEnd = new Date(mission.endTime);

          // Fix midnight crossing
          if (missionEnd < missionStart) {
            missionEnd = new Date(missionEnd.getTime() + 24 * 60 * 60 * 1000);
          }

          // Check if there are OTHER shifts covering this mission
          const otherShifts = await Shift.find({
            _id: { $ne: id }, // Exclude the shift being deleted
            'participants.user': userId
          });

          let coveredByOtherShift = false;
          for (const otherShift of otherShifts) {
            const otherParticipant = otherShift.participants.find(
              p => p.user.toString() === userId
            );

            if (otherParticipant) {
              const otherShiftStart = new Date(otherParticipant.checkIn);
              const otherShiftEnd = new Date(otherParticipant.checkOut);

              // Check if mission overlaps with this other shift
              const hasOverlap = missionStart < otherShiftEnd && missionEnd > otherShiftStart;
              if (hasOverlap) {
                coveredByOtherShift = true;
                break;
              }
            }
          }

          // If mission is NOT covered by any other shift, add its hours back
          if (!coveredByOtherShift) {
            const missionHours = Math.round((missionEnd.getTime() - missionStart.getTime()) / (1000 * 60 * 60));
            console.log(`Adding back ${missionHours} hours for mission`, mission._id);
            await User.findByIdAndUpdate(userId, {
              $inc: { currentMonthHours: missionHours }
            });
          } else {
            console.log(`Mission still covered by another shift, not adding hours`);
          }
        }
      }
    }

    // Handle attendance records (MOVED INSIDE, uses shiftDate from above)
    // Check if there are any OTHER shifts on this same day
    const otherShiftsOnDay = await Shift.find({
      date: shiftDate,
      _id: { $ne: id }
    });

    if (otherShiftsOnDay.length === 0) {
      // No other shifts on this day - DELETE all attendance records
      await Attendance.deleteMany({ date: shiftDate });
    } else {
      // There are other shifts - recalculate attendance
      const allStaff = await User.find({
        role: { $in: ['employee', 'head', 'administrative staff'] }
      });

      const allParticipantIds = otherShiftsOnDay.flatMap(s =>
        s.participants.map((p: any) => p.user.toString())
      );

      // Delete all attendance for this day first
      await Attendance.deleteMany({ date: shiftDate });

      // Re-create attendance only for participants in remaining shifts
      for (const staff of allStaff) {
        if (allParticipantIds.includes((staff._id as mongoose.Types.ObjectId).toString())) {
          await Attendance.create({
            userId: staff._id,
            date: shiftDate,
            code: 'ح'
          });
        }
      }
    }

    // Actually delete the shift
    await Shift.findByIdAndDelete(id);

    res.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Shift delete error:', error);
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