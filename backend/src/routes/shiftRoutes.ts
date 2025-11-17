import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import Shift from '../models/Shift';
import User from '../models/User';
import Mission from '../models/Mission';
import Attendance from '../models/Attendance';
import Settings from '../models/Settings';
import { authenticateToken } from '../middleware/auth';
import { calculateHours, timeToMinutes } from '../utils/timeUtils';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get current month shifts
router.get('/', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Create date strings for filtering
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const shifts = await Shift.find({
      date: {
        $gte: startDate,
        $lte: endDate
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

// Helper function to get participant's actual hours in a mission (custom or mission hours)
const getParticipantMissionHours = (mission: any, userId: string): number => {
  // Find this participant in the mission
  const missionParticipant = mission.participants.find(
    (p: any) => p.user.toString() === userId
  );

  let participantStart: string;
  let participantEnd: string;

  // Use custom times if they exist, otherwise use mission times
  if (missionParticipant && missionParticipant.customStartTime && missionParticipant.customEndTime) {
    participantStart = missionParticipant.customStartTime;
    participantEnd = missionParticipant.customEndTime;
  } else {
    participantStart = mission.startTime;
    participantEnd = mission.endTime;
  }

  // Calculate hours using our simple utility
  return calculateHours(participantStart, participantEnd);
};

// Helper to check if two time ranges overlap
// Now handles both time-only ("08:00") and datetime ("2025-11-01T08:00") formats
// Properly accounts for dates when provided
const checkTimeOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
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
  // Two ranges [s1, e1] and [s2, e2] overlap if: s1 < e2 AND e1 > s2
  const overlaps = s1Min < e2Min && e1Min > s2Min;
  
  console.log(`   Overlap debug: range1=[${s1Min}, ${e1Min}] (crosses midnight: ${range1CrossesMidnight}), range2=[${s2Min}, ${e2Min}] (crosses midnight: ${range2CrossesMidnight}), overlaps=${overlaps}`);
  
  return overlaps;
};

// Create new shift
router.post('/', async (req: Request, res: Response) => {
  try {
    const { date, team, participants, createdBy } = req.body;

    console.log(`📌 Shift creation - date: ${date}`);
    console.log(`📌 Raw participants:`, JSON.stringify(participants, null, 2));

    // Validate inputs
    if (!date || !team || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ message: 'Missing required fields: date, team, or participants' });
    }

    // Calculate hours for each participant using simple utility
    // Pass full datetime (date + time) to calculateHours for proper date-aware calculation
    const processedParticipants = participants.map((p: any) => {
      if (!p.checkIn || !p.checkOut || !p.userId) {
        throw new Error(`Invalid participant data: missing checkIn (${p.checkIn}), checkOut (${p.checkOut}), or userId (${p.userId})`);
      }

      // Extract time part for storage
      const startTime = p.checkIn.includes('T') ? p.checkIn.split('T')[1] : p.checkIn;
      const endTime = p.checkOut.includes('T') ? p.checkOut.split('T')[1] : p.checkOut;
      
      // Validate time format
      if (!startTime.includes(':') || !endTime.includes(':')) {
        throw new Error(`Invalid time format - startTime: ${startTime}, endTime: ${endTime}`);
      }
      
      // Calculate hours using full datetime for accuracy
      const hoursServed = calculateHours(p.checkIn, p.checkOut);
      
      if (isNaN(hoursServed)) {
        throw new Error(`Failed to calculate hours for participant ${p.userId}: checkIn=${p.checkIn}, checkOut=${p.checkOut}`);
      }
      
      console.log(`   Participant ${p.userId}: ${p.checkIn} -> ${p.checkOut} = ${hoursServed} hours`);

      return {
        user: p.userId,
        checkIn: startTime,
        checkOut: endTime,
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
        { userId: staff._id, date: date },
        { code },
        { upsert: true }
      );
    }

    // Only update user stats if this is the ACTIVE month
    const settings = await Settings.findOne();
    const activeMonth = settings?.activeMonth || new Date().getMonth() + 1;
    const activeYear = settings?.activeYear || new Date().getFullYear();

    const [shiftYear, shiftMonth] = date.split('-').map(Number);
    const isCurrentMonth = (shiftMonth === activeMonth && shiftYear === activeYear);

    if (isCurrentMonth) {
      // Update user hours and handle existing missions
      // Keep a map of original full datetime strings for overlap detection
      const originalCheckTimes = new Map<string, { checkIn: string; checkOut: string }>();
      for (const p of participants) {
        originalCheckTimes.set(p.userId, { checkIn: p.checkIn, checkOut: p.checkOut });
      }

      for (const participant of processedParticipants) {
        const shiftStart = participant.checkIn;
        const shiftEnd = participant.checkOut;
        
        // Get the ORIGINAL full datetime strings from the request
        const originalTimes = originalCheckTimes.get(participant.user);
        if (!originalTimes) continue;

        // Find missions that overlap with this shift for this user on this date
        const overlappingMissions = await Mission.find({
          'participants.user': participant.user,
          date: date
        });

        console.log(`🔍 Checking for missions on DATE: "${date}" for user ${participant.user}`);
        console.log(`   Query: { 'participants.user': ${participant.user}, date: "${date}" }`);
        console.log(`   Found ${overlappingMissions.length} missions`);
        
        // Also check what missions exist for this user regardless of date
        const allUserMissions = await Mission.find({
          'participants.user': participant.user
        });
        console.log(`   Total missions for this user (all dates): ${allUserMissions.length}`);
        if (allUserMissions.length > 0) {
          allUserMissions.forEach(m => console.log(`     - Mission on ${m.date}`));
        }

        // Calculate hours to remove from missions that now overlap
        let hoursToRemove = 0;
        for (const mission of overlappingMissions) {
          console.log(`   Mission: ${mission.startTime} - ${mission.endTime}`);
          console.log(`   Shift: ${shiftStart} - ${shiftEnd}`);
          console.log(`   Using original full datetimes: ${originalTimes.checkIn} -> ${originalTimes.checkOut}`);
          
          // Check if mission time overlaps with shift time
          // Use the ORIGINAL full datetime strings from frontend
          const hasOverlap = checkTimeOverlap(
            mission.startTime, mission.endTime,
            originalTimes.checkIn, originalTimes.checkOut
          );

          console.log(`   Overlap check result: ${hasOverlap}`);

          if (hasOverlap) {
            // Get this participant's actual hours in the mission
            const missionHours = getParticipantMissionHours(mission, participant.user.toString());
            console.log(`⏱️ Shift overlap detected: Mission ${mission._id} (${mission.startTime}-${mission.endTime}) overlaps with shift (${shiftStart}-${shiftEnd}). Removing ${missionHours} mission hours.`);
            hoursToRemove += missionHours;
          }
        }

        // Add shift hours and remove overlapping mission hours
        console.log(`📊 User ${participant.user}: Adding ${participant.hoursServed} shift hours - ${hoursToRemove} overlapping mission hours = ${participant.hoursServed - hoursToRemove} total`);
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
  } catch (error: any) {
    console.error('❌ Error creating shift:', error);
    console.error('Error stack:', error.stack);
    const message = error.message || 'Unknown error occurred';
    res.status(500).json({ message: `Error creating shift: ${message}`, error: error.message });
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

    const [oldYear, oldMonth] = oldShift.date.split('-').map(Number);
    const oldWasCurrentMonth = (oldMonth === activeMonth && oldYear === activeYear);

    // Step 1: Completely revert the old shift as if deleting it
    if (oldWasCurrentMonth) {
      for (const participant of oldShift.participants) {
        const userId = participant.user.toString();
        const shiftStart = participant.checkIn;
        const shiftEnd = participant.checkOut;

        // Reconstruct full datetime for old shift
        const shiftStartMin = timeToMinutes(shiftStart);
        const shiftEndMin = timeToMinutes(shiftEnd);
        
        let shiftCheckoutDate = oldShift.date;
        if (shiftEndMin < shiftStartMin || (shiftEndMin === shiftStartMin && shiftEndMin !== 0)) {
          // Could be midnight crossing - for same time, assume 24-hour shift
          const checkoutDateObj = new Date(oldShift.date);
          checkoutDateObj.setDate(checkoutDateObj.getDate() + 1);
          shiftCheckoutDate = checkoutDateObj.toISOString().split('T')[0];
        }
        
        const shiftStartFull = `${oldShift.date}T${shiftStart}`;
        const shiftEndFull = `${shiftCheckoutDate}T${shiftEnd}`;

        // Remove the old shift hours
        await User.findByIdAndUpdate(userId, {
          $inc: {
            currentMonthHours: -participant.hoursServed,
            currentMonthDays: -1
          }
        });

        // Find missions that overlapped with OLD shift on that date
        const overlappingMissions = await Mission.find({
          'participants.user': userId,
          date: oldShift.date
        });

        for (const mission of overlappingMissions) {
          // Check if mission overlapped with old shift using full datetimes
          const hasOverlap = checkTimeOverlap(
            mission.startTime, mission.endTime,
            shiftStartFull, shiftEndFull
          );

          if (hasOverlap) {
            // Check if there are OTHER shifts on same date covering this mission
            const otherShiftsOnSameDate = await Shift.find({
              _id: { $ne: id },
              date: oldShift.date,
              'participants.user': userId
            });

            let coveredByOther = false;
            for (const other of otherShiftsOnSameDate) {
              const otherP = other.participants.find(p => p.user.toString() === userId);
              if (otherP) {
                // Reconstruct full datetime for other shift
                const otherStartMin = timeToMinutes(otherP.checkIn);
                const otherEndMin = timeToMinutes(otherP.checkOut);
                let otherCheckoutDate = oldShift.date;
                if (otherEndMin < otherStartMin || (otherEndMin === otherStartMin && otherEndMin !== 0)) {
                  const otherCheckoutDateObj = new Date(oldShift.date);
                  otherCheckoutDateObj.setDate(otherCheckoutDateObj.getDate() + 1);
                  otherCheckoutDate = otherCheckoutDateObj.toISOString().split('T')[0];
                }
                const otherStartFull = `${oldShift.date}T${otherP.checkIn}`;
                const otherEndFull = `${otherCheckoutDate}T${otherP.checkOut}`;

                const otherHasOverlap = checkTimeOverlap(
                  mission.startTime, mission.endTime,
                  otherStartFull, otherEndFull
                );
                if (otherHasOverlap) {
                  coveredByOther = true;
                  break;
                }
              }
            }

            if (!coveredByOther) {
              const missionHours = getParticipantMissionHours(mission, userId);
              console.log(`✅ Reverting mission hours for user ${userId}: ${missionHours} hours (no other shift covers this mission)`);
              await User.findByIdAndUpdate(userId, {
                $inc: { currentMonthHours: missionHours }
              });
            }
          }
        }
      }
    }

    // Step 2: Calculate new participant hours
    // Pass full datetime (date + time) to calculateHours for proper date-aware calculation
    const processedParticipants = participants.map((p: any) => {
      // Extract time part for storage
      const startTime = p.checkIn.includes('T') ? p.checkIn.split('T')[1] : p.checkIn;
      const endTime = p.checkOut.includes('T') ? p.checkOut.split('T')[1] : p.checkOut;
      
      // Calculate hours using full datetime for accuracy
      const hoursServed = calculateHours(p.checkIn, p.checkOut);

      return {
        user: p.userId,
        checkIn: startTime,
        checkOut: endTime,
        hoursServed
      };
    });

    // Update the shift
    await Shift.findByIdAndUpdate(id, {
      date,
      team,
      participants: processedParticipants
    });

    // Step 3: Apply new shift stats (if is current month)
    const [newYear, newMonth] = date.split('-').map(Number);
    const newIsCurrentMonth = (newMonth === activeMonth && newYear === activeYear);

    if (newIsCurrentMonth) {
      // Keep a map of original full datetime strings for overlap detection
      const originalCheckTimes = new Map<string, { checkIn: string; checkOut: string }>();
      for (const p of participants) {
        originalCheckTimes.set(p.userId, { checkIn: p.checkIn, checkOut: p.checkOut });
      }

      for (const participant of processedParticipants) {
        const shiftStart = participant.checkIn;
        const shiftEnd = participant.checkOut;
        
        // Get the ORIGINAL full datetime strings from the request
        const originalTimes = originalCheckTimes.get(participant.user);
        if (!originalTimes) continue;

        // Find missions that overlap with NEW shift
        const overlappingMissions = await Mission.find({
          'participants.user': participant.user,
          date: date
        });

        let hoursToRemove = 0;
        for (const mission of overlappingMissions) {
          // Use the ORIGINAL full datetime strings from frontend
          const hasOverlap = checkTimeOverlap(
            mission.startTime, mission.endTime,
            originalTimes.checkIn, originalTimes.checkOut
          );

          if (hasOverlap) {
            const missionHours = getParticipantMissionHours(mission, participant.user.toString());
            console.log(`⏱️ Shift update overlap detected: Mission ${mission._id} (${mission.startTime}-${mission.endTime}) overlaps with new shift (${shiftStart}-${shiftEnd}). Removing ${missionHours} mission hours.`);
            hoursToRemove += missionHours;
          }
        }

        console.log(`📊 User ${participant.user}: Adding ${participant.hoursServed} shift hours - ${hoursToRemove} overlapping mission hours = ${participant.hoursServed - hoursToRemove} total`);
        await User.findByIdAndUpdate(participant.user, {
          $inc: {
            currentMonthHours: participant.hoursServed - hoursToRemove,
            currentMonthDays: 1
          }
        });
      }
    }

    // Handle attendance records
    const allStaff = await User.find({
      role: { $in: ['employee', 'head', 'administrative staff'] }
    });

    // If date changed, handle old and new dates
    if (oldShift.date !== date) {
      // Handle old date attendance
      const oldShiftsOnOldDate = await Shift.find({
        _id: { $ne: id },
        date: oldShift.date
      });

      if (oldShiftsOnOldDate.length === 0) {
        // No other shifts on old date - delete all attendance
        await Attendance.deleteMany({ date: oldShift.date });
      } else {
        // Recalculate attendance for old date
        const oldParticipantIds = oldShiftsOnOldDate.flatMap(s =>
          s.participants.map((p: any) => p.user.toString())
        );

        for (const staff of allStaff) {
          const code = oldParticipantIds.includes((staff._id as mongoose.Types.ObjectId).toString()) ? 'ح' : 'ع';
          await Attendance.findOneAndUpdate(
            { userId: staff._id, date: oldShift.date },
            { code },
            { upsert: true }
          );
        }
      }
    }

    // Handle new date attendance
    const newParticipantIds = processedParticipants.map((p: any) => p.user.toString());
    for (const staff of allStaff) {
      const code = newParticipantIds.includes((staff._id as mongoose.Types.ObjectId).toString()) ? 'ح' : 'ع';
      await Attendance.findOneAndUpdate(
        { userId: staff._id, date: date },
        { code },
        { upsert: true }
      );
    }

    const updatedShift = await Shift.findById(id)
      .populate('participants.user')
      .populate('createdBy');

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

    const [shiftYear, shiftMonth] = shift.date.split('-').map(Number);
    const isCurrentMonth = (shiftMonth === activeMonth && shiftYear === activeYear);

    // Revert hours and restore mission hours if current month
    if (isCurrentMonth) {
      for (const participant of shift.participants) {
        const userId = participant.user.toString();
        const shiftStart = participant.checkIn;
        const shiftEnd = participant.checkOut;

        // Remove shift hours
        await User.findByIdAndUpdate(userId, {
          $inc: {
            currentMonthHours: -participant.hoursServed,
            currentMonthDays: -1
          }
        });

        // Find missions that were during this shift on this date
        const overlappingMissions = await Mission.find({
          'participants.user': userId,
          date: shift.date
        });

        // For each overlapping mission, check if it's still covered by another shift
        for (const mission of overlappingMissions) {
          const hasOverlap = checkTimeOverlap(
            mission.startTime, mission.endTime,
            shiftStart, shiftEnd
          );

          if (hasOverlap) {
            // Check if there are OTHER shifts covering this mission
            const otherShifts = await Shift.find({
              _id: { $ne: id }, // Exclude the shift being deleted
              'participants.user': userId,
              date: shift.date
            });

            let coveredByOtherShift = false;
            for (const otherShift of otherShifts) {
              const otherParticipant = otherShift.participants.find(
                p => p.user.toString() === userId
              );

              if (otherParticipant) {
                const otherHasOverlap = checkTimeOverlap(
                  mission.startTime, mission.endTime,
                  otherParticipant.checkIn, otherParticipant.checkOut
                );
                if (otherHasOverlap) {
                  coveredByOtherShift = true;
                  break;
                }
              }
            }

            // If mission is NOT covered by any other shift, add its hours back
            if (!coveredByOtherShift) {
              const missionHours = getParticipantMissionHours(mission, userId);
              await User.findByIdAndUpdate(userId, {
                $inc: { currentMonthHours: missionHours }
              });
            }
          }
        }
      }
    }

    // Handle attendance records
    // Check if there are any OTHER shifts on this same day
    const otherShiftsOnDay = await Shift.find({
      date: shift.date,
      _id: { $ne: id }
    });

    if (otherShiftsOnDay.length === 0) {
      // No other shifts on this day - DELETE all attendance records
      await Attendance.deleteMany({ date: shift.date });
    } else {
      // There are other shifts - recalculate attendance
      const allStaff = await User.find({
        role: { $in: ['employee', 'head', 'administrative staff'] }
      });

      const allParticipantIds = otherShiftsOnDay.flatMap(s =>
        s.participants.map((p: any) => p.user.toString())
      );

      // Delete all attendance for this day first
      await Attendance.deleteMany({ date: shift.date });

      // Re-create attendance only for participants in remaining shifts
      for (const staff of allStaff) {
        if (allParticipantIds.includes((staff._id as mongoose.Types.ObjectId).toString())) {
          await Attendance.create({
            userId: staff._id,
            date: shift.date,
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

    // Create date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

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
        $addFields: {
          yearMonth: { $substr: ['$date', 0, 7] } // Extract YYYY-MM
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
    res.status(500).json({ message: 'Error fetching available months', error });
  }
});

export default router;