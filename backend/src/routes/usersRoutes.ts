// backend/src/routes/usersRoutes.ts
import express, { Response } from 'express';
import User from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET all users for current admin
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const users = await User.find({ adminId: req.admin.adminId })
      .select('name middleName motherName autoNumber cardNumber role team')
      .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    console.error('[Users] Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error });
  }
});

// GET search users
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const query = req.query.q as string;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query required' });
    }

    const users = await User.find({
      adminId: req.admin.adminId,
      name: { $regex: query, $options: 'i' }
    })
      .select('name middleName motherName autoNumber cardNumber role team')
      .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    console.error('[Users] Error searching users:', error);
    res.status(500).json({ message: 'Error searching users', error });
  }
});

// POST create new user
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, middleName, motherName, role, autoNumber, cardNumber, team } = req.body;

    // Validation
    if (!name || !role || !team) {
      return res.status(400).json({ message: 'Name, role, and team are required' });
    }

    if (role === 'employee' && !autoNumber) {
      return res.status(400).json({ message: 'Auto number is required for employees' });
    }

    // Check if auto number or card number already exists
    if (role === 'employee') {
      const existing = await User.findOne({ adminId: req.admin.adminId, autoNumber });
      if (existing) {
        return res.status(400).json({ message: 'الرقم الآلي موجود مسبقاً' });
      }
    } else {
      const existing = await User.findOne({ adminId: req.admin.adminId, cardNumber });
      if (existing) {
        return res.status(400).json({ message: 'رقم البطاقة موجود مسبقاً' });
      }
    }

    const newUser = new User({
      adminId: req.admin.adminId,
      name,
      middleName: middleName || undefined,
      motherName: motherName || undefined,
      role,
      team,
      autoNumber: role === 'employee' ? autoNumber : undefined,
      cardNumber: role === 'volunteer' ? cardNumber : undefined,
      currentMonthHours: 0,
      currentMonthMissions: 0,
      currentMonthDays: 0
    });

    await newUser.save();

    res.status(201).json(newUser);
  } catch (error) {
    console.error('[Users] Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error });
  }
});

// PUT update user
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { name, middleName, motherName, role, autoNumber, cardNumber, team } = req.body;

    // Find user and verify ownership
    const user = await User.findOne({ _id: id, adminId: req.admin.adminId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validation
    if (!name || !role || !team) {
      return res.status(400).json({ message: 'Name, role, and team are required' });
    }

    if (role === 'employee' && !autoNumber) {
      return res.status(400).json({ message: 'Auto number is required for employees' });
    }

    if (role === 'volunteer' && !cardNumber) {
      return res.status(400).json({ message: 'Card number is required for volunteers' });
    }

    // Check for duplicate numbers (excluding current user)
    if (role === 'employee') {
      const existing = await User.findOne({ 
        adminId: req.admin.adminId, 
        autoNumber,
        _id: { $ne: id }
      });
      if (existing) {
        return res.status(400).json({ message: 'الرقم الآلي موجود مسبقاً' });
      }
    } else {
      const existing = await User.findOne({ 
        adminId: req.admin.adminId, 
        cardNumber,
        _id: { $ne: id }
      });
      if (existing) {
        return res.status(400).json({ message: 'رقم البطاقة موجود مسبقاً' });
      }
    }

    // Update user
    user.name = name;
    user.middleName = middleName || undefined;
    user.motherName = motherName || undefined;
    user.role = role;
    user.team = team;
    user.autoNumber = role === 'employee' ? autoNumber : undefined;
    user.cardNumber = role === 'volunteer' ? cardNumber : undefined;

    await user.save();

    res.json(user);
  } catch (error) {
    console.error('[Users] Error updating user:', error);
    res.status(500).json({ message: 'Error updating user', error });
  }
});

// DELETE user
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    // Find and delete user (only if belongs to this admin)
    const user = await User.findOneAndDelete({ _id: id, adminId: req.admin.adminId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('[Users] Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error });
  }
});

export default router;