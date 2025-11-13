import express, { Request, Response } from 'express';
import Mission from '../models/Mission';
import Shift from '../models/Shift';
import User from '../models/User';
import Settings from '../models/Settings';
import { authenticateToken } from '../middleware/auth';
import moment from 'moment-timezone';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get current month missions
router.get('/', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

// Line 21-30 - Update your GET route
const missions = await Mission.find({
  startTime: {
    $gte: startOfMonth,
    $lte: endOfMonth
  }
})
  .populate('participants.user')
  .populate('createdBy')
  .sort({ startTime: 1 });

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
const checkShiftOverlap = async (userId: string, missionStart: Date, missionEnd: Date) => {
  // Find all shifts for this user
  const shifts = await Shift.find({
    'participants.user': userId
  });

  // Check each shift's participants for overlap
  for (const shift of shifts) {
    const userParticipant = shift.participants.find(
      p => p.user.toString() === userId
    );

    if (userParticipant) {
      const shiftStart = new Date(userParticipant.checkIn);
      const shiftEnd = new Date(userParticipant.checkOut);

      // Check if there's ANY overlap between mission and shift
      const hasOverlap = missionStart < shiftEnd && missionEnd > shiftStart;

      if (hasOverlap) {
        return true;
      }
    }
  }
  return false;
};

// Create new mission
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      referenceNumber,
      vehicleNumbers,
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

    // Convert input to Lebanon time and then to a Date object (UTC-aware)
    const missionStart = moment.tz(startTime, 'Asia/Beirut').toDate();
    let missionEnd = moment.tz(endTime, 'Asia/Beirut').toDate();

    if (missionEnd < missionStart) {
      missionEnd = new Date(missionEnd.getTime() + 24 * 60 * 60 * 1000);
    }

    const missionHours = Math.round(
      (missionEnd.getTime() - missionStart.getTime()) / (1000 * 60 * 60)
    );

    // NEW: Process participants with optional custom times
    const processedParticipants = participants.map((p: any) => {
      const participantData: any = {
        user: p.userId,
      };
      
      // If custom times are provided, add them
      if (p.customStartTime && p.customEndTime) {
        participantData.customStartTime = moment.tz(p.customStartTime, 'Asia/Beirut').toDate();
        let customEnd = moment.tz(p.customEndTime, 'Asia/Beirut').toDate();
        
        // Handle midnight crossing for custom times
        if (customEnd < participantData.customStartTime) {
          customEnd = new Date(customEnd.getTime() + 24 * 60 * 60 * 1000);
        }
        
        participantData.customEndTime = customEnd;
      }
      
      return participantData;
    });

    const mission = new Mission({
      referenceNumber,
      vehicleNumbers,
      startTime: missionStart,
      endTime: missionEnd,
      location,
      missionType,
      missionDetails,
      notes: notes || '',
      team,
      participants: processedParticipants,
      createdBy
    });

    await mission.save();;

    // Only update user stats if this is the ACTIVE month
    const settings = await Settings.findOne();
    const activeMonth = settings?.activeMonth || new Date().getMonth() + 1;
    const activeYear = settings?.activeYear || new Date().getFullYear();

    const missionMonth = missionStart.getUTCMonth() + 1;
    const missionYear = missionStart.getUTCFullYear();
    const isCurrentMonth = (missionMonth === activeMonth && missionYear === activeYear);

    if (isCurrentMonth) {
      // Update user stats based on overlap logic
      for (const participant of participants) {
        const userId = participant.userId;

        // NEW: Determine participant's start and end times (custom or mission)
        let participantStart = missionStart;
        let participantEnd = missionEnd;
        let participantHours = missionHours;

        if (participant.customStartTime && participant.customEndTime) {
          participantStart = moment.tz(participant.customStartTime, 'Asia/Beirut').toDate();
          participantEnd = moment.tz(participant.customEndTime, 'Asia/Beirut').toDate();
          
          // Handle midnight crossing for custom times
          if (participantEnd < participantStart) {
            participantEnd = new Date(participantEnd.getTime() + 24 * 60 * 60 * 1000);
          }
          
          participantHours = Math.round(
            (participantEnd.getTime() - participantStart.getTime()) / (1000 * 60 * 60)
          );
        }

        // Check if user was on shift during their participation time (not mission time)
        const hadShift = await checkShiftOverlap(userId, participantStart, participantEnd);

        // Increment mission count always
        await User.findByIdAndUpdate(userId, {
          $inc: { currentMonthMissions: 1 }
        });

        // Add hours only if NOT on shift (to avoid double counting)
        // Use participant-specific hours
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

// Update mission
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      referenceNumber,
      vehicleNumbers,
      startTime,
      endTime,
      location,
      missionType,
      missionDetails,
      notes,
      team,
      participants
    } = req.body;

    // 🧭 Fetch old mission
    const oldMission = await Mission.findById(id);
    if (!oldMission) {
      return res.status(404).json({ message: 'Mission not found' });
    }

    // ✅ Parse old mission times safely
    let oldStart = moment.tz(oldMission.startTime, 'Asia/Beirut').toDate();
    let oldEnd = moment.tz(oldMission.endTime, 'Asia/Beirut').toDate();

    // Handle midnight crossing
    if (oldEnd < oldStart) {
      oldEnd = new Date(oldEnd.getTime() + 24 * 60 * 60 * 1000);
    }

    const oldHours = Math.round(
      (oldEnd.getTime() - oldStart.getTime()) / (1000 * 60 * 60)
    );

    // 🧾 Get active month/year
    const settings = await Settings.findOne();
    const activeMonth = settings?.activeMonth || new Date().getMonth() + 1;
    const activeYear = settings?.activeYear || new Date().getFullYear();

    const oldMissionMonth = oldStart.getMonth() + 1;
    const oldMissionYear = oldStart.getFullYear();
    const oldWasCurrentMonth =
      oldMissionMonth === activeMonth && oldMissionYear === activeYear;

    // 🧮 Revert old mission stats (if current month)
    if (oldWasCurrentMonth) {
      for (const participant of oldMission.participants) {
        const userId = participant.user.toString();

        // NEW: Use participant's custom times if available
        let oldParticipantStart = oldStart;
        let oldParticipantEnd = oldEnd;
        let oldParticipantHours = oldHours;

        if (participant.customStartTime && participant.customEndTime) {
          oldParticipantStart = new Date(participant.customStartTime);
          oldParticipantEnd = new Date(participant.customEndTime);
          
          // Handle midnight crossing
          if (oldParticipantEnd < oldParticipantStart) {
            oldParticipantEnd = new Date(oldParticipantEnd.getTime() + 24 * 60 * 60 * 1000);
          }
          
          oldParticipantHours = Math.round(
            (oldParticipantEnd.getTime() - oldParticipantStart.getTime()) / (1000 * 60 * 60)
          );
        }

        await User.findByIdAndUpdate(userId, {
          $inc: { currentMonthMissions: -1 }
        });

        const hadShift = await checkShiftOverlap(userId, oldParticipantStart, oldParticipantEnd);

        if (!hadShift) {
          await User.findByIdAndUpdate(userId, {
            $inc: { currentMonthHours: -oldParticipantHours }
          });
        }
      }
    }

    // ✅ Parse NEW mission times in Lebanon timezone
    const newStart = moment.tz(startTime, 'Asia/Beirut').toDate();
    let newEnd = moment.tz(endTime, 'Asia/Beirut').toDate();

    // Fix midnight crossing
    if (newEnd <= newStart) {
      newEnd = new Date(newEnd.getTime() + 24 * 60 * 60 * 1000);
    }

    console.log('Adjusted mission time:', newStart, 'to', newEnd);

    const newHours = Math.round(
      (newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60)
    );

    // NEW: Process participants with optional custom times
    const processedParticipants = participants.map((p: any) => {
      const participantData: any = {
        user: p.userId
      };
      
      // If custom times are provided, add them
      if (p.customStartTime && p.customEndTime) {
        participantData.customStartTime = moment.tz(p.customStartTime, 'Asia/Beirut').toDate();
        let customEnd = moment.tz(p.customEndTime, 'Asia/Beirut').toDate();
        
        // Handle midnight crossing for custom times
        if (customEnd < participantData.customStartTime) {
          customEnd = new Date(customEnd.getTime() + 24 * 60 * 60 * 1000);
        }
        
        participantData.customEndTime = customEnd;
      }
      
      return participantData;
    });

    // 🧱 Update mission document
    const updatedMission = await Mission.findByIdAndUpdate(
      id,
      {
        referenceNumber,
        vehicleNumbers,
        startTime: newStart,
        endTime: newEnd,
        location,
        missionType,
        missionDetails,
        notes: notes || '',
        team,
        participants: processedParticipants
      },
      { new: true }
    )
      .populate('participants.user')
      .populate('createdBy');

    // 🧾 Check if new mission is in the active month
    const newMissionMonth = newStart.getMonth() + 1;
    const newMissionYear = newStart.getFullYear();
    const newIsCurrentMonth =
      newMissionMonth === activeMonth && newMissionYear === activeYear;

    // 🔁 Add stats for new participants
    if (newIsCurrentMonth) {
      for (const participant of participants) {
        const userId = participant.userId;

        // NEW: Determine participant's start and end times (custom or mission)
        let participantStart = newStart;
        let participantEnd = newEnd;
        let participantHours = newHours;

        if (participant.customStartTime && participant.customEndTime) {
          participantStart = moment.tz(participant.customStartTime, 'Asia/Beirut').toDate();
          participantEnd = moment.tz(participant.customEndTime, 'Asia/Beirut').toDate();
          
          // Handle midnight crossing for custom times
          if (participantEnd < participantStart) {
            participantEnd = new Date(participantEnd.getTime() + 24 * 60 * 60 * 1000);
          }
          
          participantHours = Math.round(
            (participantEnd.getTime() - participantStart.getTime()) / (1000 * 60 * 60)
          );
        }

        await User.findByIdAndUpdate(userId, {
          $inc: { currentMonthMissions: 1 }
        });

        const hadShift = await checkShiftOverlap(userId, participantStart, participantEnd);

        if (!hadShift) {
          await User.findByIdAndUpdate(userId, {
            $inc: { currentMonthHours: participantHours }
          });
        }
      }
    }

    res.json(updatedMission);
  } catch (error) {
    console.error('Mission update error:', error);
    res.status(500).json({ message: 'Error updating mission', error });
  }
});

// Delete mission
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const mission = await Mission.findById(id);
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }

    const missionStart = new Date(mission.startTime);
    let missionEnd = new Date(mission.endTime);

    // Fix midnight crossing
    if (missionEnd < missionStart) {
      missionEnd = new Date(missionEnd.getTime() + 24 * 60 * 60 * 1000);
    }

    const missionHours = Math.round((missionEnd.getTime() - missionStart.getTime()) / (1000 * 60 * 60));

    // Only update user stats if this is the ACTIVE month
    const settings = await Settings.findOne();
    const activeMonth = settings?.activeMonth || new Date().getMonth() + 1;
    const activeYear = settings?.activeYear || new Date().getFullYear();

    const missionMonth = missionStart.getUTCMonth() + 1;
    const missionYear = missionStart.getUTCFullYear();
    const isCurrentMonth = (missionMonth === activeMonth && missionYear === activeYear);

    // Revert mission stats from all participants (only if current month)
    if (isCurrentMonth) {
      for (const participant of mission.participants) {
        const userId = participant.user.toString();

        // NEW: Use participant's custom times if available
        let participantStart = missionStart;
        let participantEnd = missionEnd;
        let participantHours = missionHours;

        if (participant.customStartTime && participant.customEndTime) {
          participantStart = new Date(participant.customStartTime);
          participantEnd = new Date(participant.customEndTime);
          
          // Handle midnight crossing
          if (participantEnd < participantStart) {
            participantEnd = new Date(participantEnd.getTime() + 24 * 60 * 60 * 1000);
          }
          
          participantHours = Math.round(
            (participantEnd.getTime() - participantStart.getTime()) / (1000 * 60 * 60)
          );
        }

        // Decrement mission count
        await User.findByIdAndUpdate(userId, {
          $inc: { currentMonthMissions: -1 }
        });

        // Check if user was on shift during their participation time
        const hadShift = await checkShiftOverlap(userId, participantStart, participantEnd);

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
router.get('/by-month', async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

    const missions = await Mission.find({
      startTime: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .populate('participants.user')
      .populate('createdBy')
      .sort({ startTime: 1 });

    res.json(missions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching missions by month', error });
  }
});

// Get available months that have missions
router.get('/available-months', async (req: Request, res: Response) => {
  try {
    const months = await Mission.aggregate([
      {
        $group: {
          _id: {
            month: { $month: '$startTime' },
            year: { $year: '$startTime' }
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