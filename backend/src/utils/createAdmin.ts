import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civil-defense';
    await mongoose.connect(MONGODB_URI);

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@civildefense.com' });
    if (existingAdmin) {
      console.log('Admin already exists!');
      process.exit(0);
    }

    // Create admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new Admin({
      email: 'admin@civildefense.com',
      password: hashedPassword,
      name: 'Administrator'
    });

    await admin.save();
    console.log('Admin created successfully!');
    console.log('Email: admin@civildefense.com');
    console.log('Password: admin123');
    console.log('CHANGE THIS PASSWORD AFTER FIRST LOGIN!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();