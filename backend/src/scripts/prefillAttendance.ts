import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import { prefillMonthAttendance } from '../utils/attendancePrefill';

dotenv.config();

// Usage: npx ts-node src/scripts/prefillAttendance.ts <month> <year> [adminId]
// Only inserts missing attendance records, existing ones are never touched.
const run = async () => {
  const month = Number(process.argv[2]);
  const year = Number(process.argv[3]);
  const onlyAdminId = process.argv[4];

  if (!month || month < 1 || month > 12 || !year) {
    console.log('Usage: npx ts-node src/scripts/prefillAttendance.ts <month> <year> [adminId]');
    process.exit(1);
  }

  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civil-defense';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    const adminIds: string[] = onlyAdminId
      ? [onlyAdminId]
      : (await User.distinct('adminId')).map((id: any) => id.toString());

    for (const adminId of adminIds) {
      const { inserted } = await prefillMonthAttendance(month, year, adminId);
      console.log(`Admin ${adminId}: ${inserted} attendance records created for ${month}/${year}`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error pre-filling attendance:', error);
    process.exit(1);
  }
};

run();
