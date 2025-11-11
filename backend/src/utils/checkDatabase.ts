import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Shift from '../models/Shift';
import Mission from '../models/Mission';
import Attendance from '../models/Attendance';
import MonthlyReport from '../models/MonthlyReport';

dotenv.config();

const checkDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civil-defense';
    await mongoose.connect(mongoURI);

    console.log('✅ Connected to MongoDB\n');

    const shiftsCount = await Shift.countDocuments();
    console.log(`Shifts: ${shiftsCount} documents`);

    const missionsCount = await Mission.countDocuments();
    console.log(`Missions: ${missionsCount} documents`);

    const attendanceCount = await Attendance.countDocuments();
    console.log(`Attendance: ${attendanceCount} documents`);

    const reportsCount = await MonthlyReport.countDocuments();
    console.log(`Monthly Reports: ${reportsCount} documents`);

    if (reportsCount > 0) {
      console.log('\n📋 Sample Monthly Reports:');
      const reports = await MonthlyReport.find().limit(3);
      reports.forEach((r, i) => {
        console.log(`  ${i + 1}. Month ${r.month}/${r.year}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkDatabase();
