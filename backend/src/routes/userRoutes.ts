import express, { Request, Response } from 'express';
import User from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all users
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const users = await User.find({ adminId: req.admin.adminId }).sort({ name: 1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Error fetching users', 
      error: error.message 
    });
  }
});

// Search users by name (for autocomplete)
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const query = req.query.q as string;
    if (!query) {
      return res.json([]);
    }
    
    
    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Search for names that contain the query string
    const users = await User.find({
      adminId: req.admin.adminId,
      name: { $regex: escapedQuery, $options: 'i' }
    }).limit(20).sort({ name: 1 });
    
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Error searching users', 
      error: error.message 
    });
  }
});

export default router;