import express, { Request, Response } from 'express';
import User from '../models/User';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all users
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📥 GET /api/users - Fetching all users');
    const users = await User.find().sort({ name: 1 });
    console.log(`✅ Retrieved ${users.length} users`);
    res.json(users);
  } catch (error: any) {
    console.error('❌ Error fetching users:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      message: 'Error fetching users', 
      error: error.message 
    });
  }
});

// Search users by name (for autocomplete)
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.json([]);
    }
    
    console.log(`🔍 Searching users for query: "${query}"`);
    
    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Search for names that contain the query string
    const users = await User.find({
      name: { $regex: escapedQuery, $options: 'i' }
    }).limit(20).sort({ name: 1 });
    
    console.log(`✅ Found ${users.length} matching users`);
    res.json(users);
  } catch (error: any) {
    console.error('❌ Search error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      message: 'Error searching users', 
      error: error.message 
    });
  }
});

export default router;  