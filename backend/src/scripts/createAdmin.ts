import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin';
import Settings from '../models/Settings';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civil-defense';
    await mongoose.connect(MONGODB_URI);

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'example@gmail.com' });
    if (existingAdmin) {
      console.log('Admin already exists!');
      process.exit(0);
    }

    // Create admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new Admin({
      email: 'adamwissamdakdouk2003@gmail.com',
      password: hashedPassword,
      name: 'Administrator',
      stationName: 'بنيه' // Update this with your station name
    });

    await admin.save();
    console.log('Admin created successfully!');
    console.log(admin.email);
    console.log(admin.password);
    console.log('CHANGE THIS PASSWORD AFTER FIRST LOGIN!');

    // ✅ Create initial settings for this admin
    const settings = await Settings.create({
      adminId: admin._id,
      activeMonth: 1,
      activeYear: new Date().getFullYear(),
      lastMonthEndTeam: '1'
    });
    console.log('Initial Settings created for admin:', settings._id);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();