import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const users = [
  // Employees - Team A
  { name: 'جهاد الحلواني', role: 'employee', team: 'A' },
  { name: 'وائل المهتار', role: 'employee', team: 'A' },
  
  // Employees - Team B
  { name: 'نعيم المهتار', role: 'employee', team: 'B' },
  { name: 'جمال المهتار', role: 'employee', team: 'B' },
  
  // Employees - Team C
  { name: 'ناجي ابو غنام', role: 'employee', team: 'C' },
  { name: 'سامي الحلواني', role: 'employee', team: 'C' },
  
  // Volunteers - Team A
  { name: 'آدم دقدوق', role: 'volunteer', team: 'A' },
  { name: 'جاد سليم الجوهري', role: 'volunteer', team: 'A' },
  { name: 'عمار ابو غنام', role: 'volunteer', team: 'A' },
  { name: 'داني المهتار', role: 'volunteer', team: 'A' },
  { name: 'بهاء الحلبي', role: 'volunteer', team: 'A' },
  { name: 'ريّان المهتار', role: 'volunteer', team: 'A' },
  
  // Volunteers - Team B
  { name: 'سلطان رافع', role: 'volunteer', team: 'B' },
  { name: 'غاندي الجوهري', role: 'volunteer', team: 'B' },
  { name: 'فداء رافع', role: 'volunteer', team: 'B' },
  { name: 'كارم العريضي', role: 'volunteer', team: 'B' },
  
  // Volunteers - Team C
  { name: 'كنان المهتار', role: 'volunteer', team: 'C' },
  { name: 'ياسر المهتار', role: 'volunteer', team: 'C' },
  { name: 'جاد عصام الجوهري', role: 'volunteer', team: 'C' },
  { name: 'ايهاب شعبان', role: 'volunteer', team: 'C' },
  
  // Head
  { name: 'زياد المهتار', role: 'head', team: 'A' },
  
  // Administrative Staff
  { name: 'منار المهتار', role: 'administrative staff', team: 'A' }
];

const seedUsers = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civil-defense';
    await mongoose.connect(mongoURI);
    
    console.log('✅ Connected to MongoDB');
    
    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');
    
    // Insert new users
    await User.insertMany(users);
    console.log(`✅ Successfully added ${users.length} users`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();