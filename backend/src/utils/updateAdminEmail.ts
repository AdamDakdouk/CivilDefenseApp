import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin';

dotenv.config();

const updateAdminEmail = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civil-defense';
    await mongoose.connect(mongoURI);

    console.log('✅ Connected to MongoDB');

    // Find the admin and update email
    const admin = await Admin.findOneAndUpdate(
      {},
      { email: 'adamdakdouk2003@gmail.com' },
      { new: true }
    );

    if (admin) {
      console.log(`✅ Updated admin email to: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
    } else {
      console.log('❌ No admin found');
    }

    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      console.error('❌ Error closing connection:', closeError);
    }
    process.exit(1);
  }
};

updateAdminEmail();
