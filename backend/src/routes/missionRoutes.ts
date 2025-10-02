import express, { Request, Response } from 'express';
import Mission from '../models/Mission';
import Shift from '../models/Shift';
import User from '../models/User';

const router = express.Router();

// Get all missions
router.get('/', async (req: Request, res: Response) => {
  try {
    const missions = await Mission.find()
      .populate('participants.user')
      .populate('createdBy')
      .sort({ startTime: -1 });
    res.json(missions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching missions', error });
  }
});

// Helper function to check if mission overlaps with shift
const checkShiftOverlap = async (userId: string, missionStart: Date, missionEnd: Date) => {
  const shifts = await Shift.find({
    'participants.user': userId,
    $or: [
      {
        // Mission starts during shift
        $and: [
          { 'participants.checkIn': { $lte: missionStart } },
          { 'participants.checkOut': { $gte: missionStart } }
        ]
      },
      {
        // Mission ends during shift
        $and: [
          { 'participants.checkIn': { $lte: missionEnd } },
          { 'participants.checkOut': { $gte: missionEnd } }
        ]
      },
      {
        // Mission completely encompasses shift
        $and: [
          { 'participants.checkIn': { $gte: missionStart } },
          { 'participants.checkOut': { $lte: missionEnd } }
        ]
      }
    ]
  });

  return shifts.length > 0;
};

// Create new mission
router.post('/', async (req: Request, res: Response) => {
  try {
    const { referenceNumber, vehicleNumber, startTime, endTime, location, team, participants, createdBy } = req.body;
    
    const missionStart = new Date(startTime);
    const missionEnd = new Date(endTime);
    const missionHours = Math.round((missionEnd.getTime() - missionStart.getTime()) / (1000 * 60 * 60));
    
    const processedParticipants = participants.map((p: any) => ({
      user: p.userId
    }));
    
    const mission = new Mission({
      referenceNumber,
      vehicleNumber,
      startTime: missionStart,
      endTime: missionEnd,
      location,
      team,
      participants: processedParticipants,
      createdBy
    });
    
    await mission.save();
    
    // Update user stats based on overlap logic
    for (const participant of participants) {
      const userId = participant.userId;
      
      // Check if user was on shift during mission
      const hadShift = await checkShiftOverlap(userId, missionStart, missionEnd);
      
      // Increment mission count always
      await User.findByIdAndUpdate(userId, {
        $inc: { currentMonthMissions: 1 }
      });
      
      // Add hours only if NOT on shift (to avoid double counting)
      if (!hadShift) {
        await User.findByIdAndUpdate(userId, {
          $inc: { currentMonthHours: missionHours }
        });
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
    const { referenceNumber, vehicleNumber, startTime, endTime, location, team, participants } = req.body;
    
    // Get old mission
    const oldMission = await Mission.findById(id);
    if (!oldMission) {
      return res.status(404).json({ message: 'Mission not found' });
    }
    
    const oldStart = new Date(oldMission.startTime);
    const oldEnd = new Date(oldMission.endTime);
    const oldHours = Math.round((oldEnd.getTime() - oldStart.getTime()) / (1000 * 60 * 60));
    
    // Revert old mission stats
    for (const participant of oldMission.participants) {
      const userId = participant.user.toString();
      
      // Decrement mission count
      await User.findByIdAndUpdate(userId, {
        $inc: { currentMonthMissions: -1 }
      });
      
      // Check if user was on shift during old mission
      const hadShift = await checkShiftOverlap(userId, oldStart, oldEnd);
      
      // Remove hours only if they were NOT on shift
      if (!hadShift) {
        await User.findByIdAndUpdate(userId, {
          $inc: { currentMonthHours: -oldHours }
        });
      }
    }
    
    // Calculate new mission hours
    const newStart = new Date(startTime);
    const newEnd = new Date(endTime);
    const newHours = Math.round((newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60));
    
    const processedParticipants = participants.map((p: any) => ({
      user: p.userId
    }));
    
    // Update mission
    const updatedMission = await Mission.findByIdAndUpdate(
      id,
      {
        referenceNumber,
        vehicleNumber,
        startTime: newStart,
        endTime: newEnd,
        location,
        team,
        participants: processedParticipants
      },
      { new: true }
    ).populate('participants.user').populate('createdBy');
    
    // Add new mission stats
    for (const participant of participants) {
      const userId = participant.userId;
      
      // Increment mission count
      await User.findByIdAndUpdate(userId, {
        $inc: { currentMonthMissions: 1 }
      });
      
      // Check if user was on shift during new mission
      const hadShift = await checkShiftOverlap(userId, newStart, newEnd);
      
      // Add hours only if NOT on shift
      if (!hadShift) {
        await User.findByIdAndUpdate(userId, {
          $inc: { currentMonthHours: newHours }
        });
      }
    }
    
    res.json(updatedMission);
  } catch (error) {
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
    const missionEnd = new Date(mission.endTime);
    const missionHours = Math.round((missionEnd.getTime() - missionStart.getTime()) / (1000 * 60 * 60));
    
    // Revert mission stats from all participants
    for (const participant of mission.participants) {
      const userId = participant.user.toString();
      
      // Decrement mission count
      await User.findByIdAndUpdate(userId, {
        $inc: { currentMonthMissions: -1 }
      });
      
      // Check if user was on shift during mission
      const hadShift = await checkShiftOverlap(userId, missionStart, missionEnd);
      
      // Remove hours only if they were NOT on shift
      if (!hadShift) {
        await User.findByIdAndUpdate(userId, {
          $inc: { currentMonthHours: -missionHours }
        });
      }
    }
    
    await Mission.findByIdAndDelete(id);
    
    res.json({ message: 'Mission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting mission', error });
  }
});

export default router;