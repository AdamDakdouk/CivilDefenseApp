import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Mission from '../models/Mission';
import Shift from '../models/Shift';
import User from '../models/User';
import Settings from '../models/Settings';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { calculateHours, daysBetween, timeToMinutes } from '../utils/timeUtils';
import Admin from '../models/Admin';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get current month missions
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Create date strings for filtering
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const missions = await Mission.find({
      adminId: req.admin.adminId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .populate('participants.user')
      .populate('createdBy')
      .sort({ date: 1, startTime: 1 });

    // Filter out participants with invalid user references
    const cleanedMissions = missions.map(mission => {
      const validParticipants = mission.participants.filter(p => p.user !== null);
      return {
        ...mission.toObject(),
        participants: validParticipants
      };
    });

    res.json(cleanedMissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching missions', error });
  }
});

// Helper function to check if mission overlaps with shift
const checkShiftOverlap = async (userId: string, missionDate: string, missionStart: string, missionEnd: string, adminId: string) => {
  // Find all shifts for this user on this date
  const shifts = await Shift.find({
    adminId,
    'participants.user': userId,
    date: missionDate
  });

  // Check each shift's participants for overlap
  for (const shift of shifts) {
    const userParticipant = shift.participants.find(
      p => p.user.toString() === userId
    );

    if (userParticipant) {
      const shiftStart = userParticipant.checkIn;
      const shiftEnd = userParticipant.checkOut;

      // Reconstruct full datetime for shift to handle midnight crossing
      const toMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };

      const shiftStartMin = toMinutes(shiftStart);
      const shiftEndMin = toMinutes(shiftEnd);

      let shiftCheckoutDate = missionDate;
      if (shiftEndMin < shiftStartMin || (shiftEndMin === shiftStartMin && shiftEndMin !== 0)) {
        const checkoutDateObj = new Date(missionDate);
        checkoutDateObj.setDate(checkoutDateObj.getDate() + 1);
        shiftCheckoutDate = checkoutDateObj.toISOString().split('T')[0];
      }

      const shiftStartFull = `${missionDate}T${shiftStart}`;
      const shiftEndFull = `${shiftCheckoutDate}T${shiftEnd}`;

      // Check if there's ANY time overlap with full datetimes
      const hasOverlap = checkTimeOverlapWithDates(
        missionStart, missionEnd,
        shiftStartFull, shiftEndFull
      );

      if (hasOverlap) {
        return true;
      }
    }
  }

  return false;
};

// Helper to check if two time ranges overlap
const checkTimeOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  let s1 = timeToMinutes(start1);
  let e1 = timeToMinutes(end1);
  let s2 = timeToMinutes(start2);
  let e2 = timeToMinutes(end2);

  // Handle midnight crossing for first range
  if (e1 < s1) e1 += 24 * 60;

  // Handle midnight crossing for second range
  if (e2 < s2) e2 += 24 * 60;

  // Check overlap
  return s1 < e2 && e1 > s2;
};

// Helper to check if two datetime ranges overlap (handles dates + times)
const checkTimeOverlapWithDates = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const extractDateTime = (t: string) => {
    if (t.includes('T')) {
      const [date, time] = t.split('T');
      return { date, time };
    }
    return { date: null, time: t };
  };

  const dt1Start = extractDateTime(start1);
  const dt1End = extractDateTime(end1);
  const dt2Start = extractDateTime(start2);
  const dt2End = extractDateTime(end2);

  let s1Min = timeToMinutes(dt1Start.time);
  let e1Min = timeToMinutes(dt1End.time);
  let s2Min = timeToMinutes(dt2Start.time);
  let e2Min = timeToMinutes(dt2End.time);

  // For range 1: if end < start OR (end == start AND endDate > startDate), crosses midnight
  const range1CrossesMidnight =
    e1Min < s1Min ||
    (e1Min === s1Min && dt1End.date && dt1Start.date && dt1End.date > dt1Start.date);
  if (range1CrossesMidnight) {
    e1Min += 24 * 60;
  }

  // For range 2: if end < start OR (end == start AND endDate > startDate), crosses midnight
  const range2CrossesMidnight =
    e2Min < s2Min ||
    (e2Min === s2Min && dt2End.date && dt2Start.date && dt2End.date > dt2Start.date);
  if (range2CrossesMidnight) {
    e2Min += 24 * 60;
  }

  // Check overlap
  return s1Min < e2Min && e1Min > s2Min;
};

// Create new mission
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const {
      referenceNumber,
      vehicleNumbers,
      date,
      startTime,
      endTime,
      location,
      missionType,
      missionDetails,
      notes,
      team,
      participants,
      createdBy
    } = req.body;

    // Calculate mission hours using our simple utility
    const missionHours = calculateHours(startTime, endTime);

    // Process participants - no timezone conversions needed!
    const processedParticipants = participants.map((p: any) => ({
      user: p.userId,
      ...(p.customStartTime && p.customEndTime ? {
        customStartTime: p.customStartTime,
        customEndTime: p.customEndTime
      } : {})
    }));

    const admin = await Admin.findById(req.admin.adminId).select('missionSuffix');

    const suffix = admin?.missionSuffix ? admin.missionSuffix : '';


    const mission = new Mission({
      adminId: req.admin.adminId,
      referenceNumber: referenceNumber + suffix,
      vehicleNumbers,
      date,
      startTime,
      endTime,
      location,
      missionType,
      missionDetails,
      notes: notes || '',
      team,
      participants: processedParticipants,
      createdBy
    });

    await mission.save();

    // Only update user stats if this is the ACTIVE month
    const settings = await Settings.findOne({ adminId: req.admin.adminId });
    const activeMonth = settings?.activeMonth || new Date().getMonth() + 1;
    const activeYear = settings?.activeYear || new Date().getFullYear();

    const [missionYear, missionMonth] = date.split('-').map(Number);
    const isCurrentMonth = (missionMonth === activeMonth && missionYear === activeYear);

    if (isCurrentMonth) {
      // Update user stats based on overlap logic
      for (const participant of participants) {
        const userId = participant.userId;

        // Determine participant's hours (custom or mission)
        let participantHours = missionHours;
        let participantStart = startTime;
        let participantEnd = endTime;

        if (participant.customStartTime && participant.customEndTime) {
          participantStart = participant.customStartTime;
          participantEnd = participant.customEndTime;
          participantHours = calculateHours(participantStart, participantEnd);
        }

        // Check if user was on shift during their participation time
        const hadShift = await checkShiftOverlap(userId, date, participantStart, participantEnd, req.admin.adminId);

        // Increment mission count always
        await User.findByIdAndUpdate(userId, {
          $inc: { currentMonthMissions: 1 }
        });

        // Add hours only if NOT on shift (to avoid double counting)
        if (!hadShift) {
          await User.findByIdAndUpdate(userId, {
            $inc: { currentMonthHours: participantHours }
          });
        }
      }
    }

    const populatedMission = await Mission.findById(mission._id)
      .populate('participants.user')
      .populate('createdBy');

    res.status(201).json(populatedMission);
  } catch (error) {
    res.status(500).json({ message: 'Error creating mission', error });
  }
});

// Update existing mission
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { id } = req.params;
    const {
      referenceNumber,
      vehicleNumbers,
      date,
      startTime,
      endTime,
      location,
      missionType,
      missionDetails,
      notes,
      team,
      participants
    } = req.body;

    const oldMission = await Mission.findOne({ _id: id, adminId: req.admin.adminId });
    if (!oldMission) {
      return res.status(404).json({ message: 'Mission not found' });
    }

    // Check if old mission was in ACTIVE month
    const settings = await Settings.findOne({ adminId: req.admin.adminId });
    const activeMonth = settings?.activeMonth || new Date().getMonth() + 1;
    const activeYear = settings?.activeYear || new Date().getFullYear();

    const [oldYear, oldMonth] = oldMission.date.split('-').map(Number);
    const oldWasCurrentMonth = (oldMonth === activeMonth && oldYear === activeYear);

    // Calculate old and new mission hours
    const oldHours = calculateHours(oldMission.startTime, oldMission.endTime);
    const newHours = calculateHours(startTime, endTime);

    // Step 1: Revert stats for old participants (if was current month)
    if (oldWasCurrentMonth) {
      for (const participant of oldMission.participants) {
        const userId = participant.user.toString();

        // Calculate old participant hours
        let oldParticipantHours = oldHours;
        let oldParticipantStart = oldMission.startTime;
        let oldParticipantEnd = oldMission.endTime;

        if (participant.customStartTime && participant.customEndTime) {
          oldParticipantStart = participant.customStartTime;
          oldParticipantEnd = participant.customEndTime;
          oldParticipantHours = calculateHours(oldParticipantStart, oldParticipantEnd);
        }

        await User.findByIdAndUpdate(userId, {
          $inc: { currentMonthMissions: -1 }
        });

        const hadShift = await checkShiftOverlap(userId, oldMission.date, oldParticipantStart, oldParticipantEnd, req.admin.adminId);

        if (!hadShift) {
          await User.findByIdAndUpdate(userId, {
            $inc: { currentMonthHours: -oldParticipantHours }
          });
        }
      }
    }

    // Step 2: Update the mission
    const processedParticipants = participants.map((p: any) => ({
      user: p.userId,
      ...(p.customStartTime && p.customEndTime ? {
        customStartTime: p.customStartTime,
        customEndTime: p.customEndTime
      } : {})
    }));

    await Mission.findByIdAndUpdate(id, {
      referenceNumber,
      vehicleNumbers,
      date,
      startTime,
      endTime,
      location,
      missionType,
      missionDetails,
      notes: notes || '',
      team,
      participants: processedParticipants
    });

    // Step 3: Add stats for new participants (if is current month)
    const [newYear, newMonth] = date.split('-').map(Number);
    const newIsCurrentMonth = (newMonth === activeMonth && newYear === activeYear);

    if (newIsCurrentMonth) {
      for (const participant of participants) {
        const userId = participant.userId;

        // Calculate new participant hours
        let participantHours = newHours;
        let participantStart = startTime;
        let participantEnd = endTime;

        if (participant.customStartTime && participant.customEndTime) {
          participantStart = participant.customStartTime;
          participantEnd = participant.customEndTime;
          participantHours = calculateHours(participantStart, participantEnd);
        }

        await User.findByIdAndUpdate(userId, {
          $inc: { currentMonthMissions: 1 }
        });

        const hadShift = await checkShiftOverlap(userId, date, participantStart, participantEnd, req.admin.adminId);

        if (!hadShift) {
          await User.findByIdAndUpdate(userId, {
            $inc: { currentMonthHours: participantHours }
          });
        }
      }
    }

    const updatedMission = await Mission.findById(id)
      .populate('participants.user')
      .populate('createdBy');

    res.json(updatedMission);
  } catch (error) {
    res.status(500).json({ message: 'Error updating mission', error });
  }
});

// Delete mission
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { id } = req.params;

    const mission = await Mission.findOne({ _id: id, adminId: req.admin.adminId });
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }

    // Calculate mission hours
    const missionHours = calculateHours(mission.startTime, mission.endTime);

    // Only update user stats if this is the ACTIVE month
    const settings = await Settings.findOne({ adminId: req.admin.adminId });
    const activeMonth = settings?.activeMonth || new Date().getMonth() + 1;
    const activeYear = settings?.activeYear || new Date().getFullYear();

    const [missionYear, missionMonth] = mission.date.split('-').map(Number);
    const isCurrentMonth = (missionMonth === activeMonth && missionYear === activeYear);

    // Revert mission stats from all participants (only if current month)
    if (isCurrentMonth) {
      for (const participant of mission.participants) {
        const userId = participant.user.toString();

        // Calculate participant hours
        let participantHours = missionHours;
        let participantStart = mission.startTime;
        let participantEnd = mission.endTime;

        if (participant.customStartTime && participant.customEndTime) {
          participantStart = participant.customStartTime;
          participantEnd = participant.customEndTime;
          participantHours = calculateHours(participantStart, participantEnd);
        }

        // Decrement mission count
        await User.findByIdAndUpdate(userId, {
          $inc: { currentMonthMissions: -1 }
        });

        // Check if user was on shift during their participation time
        const hadShift = await checkShiftOverlap(userId, mission.date, participantStart, participantEnd, req.admin.adminId);

        // Remove hours only if they were NOT on shift
        if (!hadShift) {
          await User.findByIdAndUpdate(userId, {
            $inc: { currentMonthHours: -participantHours }
          });
        }
      }
    }

    await Mission.findByIdAndDelete(id);

    res.json({ message: 'Mission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting mission', error });
  }
});

// Get missions for specific month/year
router.get('/by-month', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    // Create date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const missions = await Mission.find({
      adminId: req.admin.adminId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .populate('participants.user')
      .populate('createdBy')
      .sort({ date: 1, startTime: 1 });

    res.json(missions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching missions by month', error });
  }
});

// Get available months that have missions
router.get('/available-months', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // ✅ Convert to ObjectId for aggregate query
    const adminObjectId = new mongoose.Types.ObjectId(req.admin.adminId);

    const months = await Mission.aggregate([
      { $match: { adminId: adminObjectId } }, // ✅ Use ObjectId
      {
        $addFields: {
          yearMonth: { $substr: ['$date', 0, 7] }
        }
      },
      {
        $group: {
          _id: '$yearMonth'
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    const formattedMonths = months.map(m => {
      const [year, month] = m._id.split('-');
      return {
        month: parseInt(month),
        year: parseInt(year),
        label: `${month}/${year}`
      };
    });

    res.json(formattedMonths);
  } catch (error) {
    console.error('[Missions] Error fetching available months:', error);
    res.status(500).json({ message: 'Error fetching available months', error });
  }
});

export default router;