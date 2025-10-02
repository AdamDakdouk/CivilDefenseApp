import express, { Request, Response } from 'express';
import Shift from '../models/Shift';
import User from '../models/User';

const router = express.Router();

// Get all shifts
router.get('/', async (req: Request, res: Response) => {
  try {
    const shifts = await Shift.find()
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
    
    // Update user hours
    for (const participant of processedParticipants) {
      await User.findByIdAndUpdate(participant.user, {
        $inc: { currentMonthHours: participant.hoursServed }
      });
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
    
    // Get the old shift to calculate hour differences
    const oldShift = await Shift.findById(id);
    if (!oldShift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    
    // Revert old hours from users
    for (const participant of oldShift.participants) {
      await User.findByIdAndUpdate(participant.user, {
        $inc: { currentMonthHours: -participant.hoursServed }
      });
    }
    
    // Calculate new hours for each participant
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
    
    // Add new hours to users
    for (const participant of processedParticipants) {
      await User.findByIdAndUpdate(participant.user, {
        $inc: { currentMonthHours: participant.hoursServed }
      });
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
    
    // Get the shift to revert hours
    const shift = await Shift.findById(id);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    
    // Revert hours from all participants
    for (const participant of shift.participants) {
      await User.findByIdAndUpdate(participant.user, {
        $inc: { currentMonthHours: -participant.hoursServed }
      });
    }
    
    // Delete the shift
    await Shift.findByIdAndDelete(id);
    
    res.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting shift', error });
  }
});

export default router;