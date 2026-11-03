import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Attendance from '../models/Attendance';
import User from '../models/User';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Usage: npx ts-node src/scripts/fixAttendanceAdminId.ts          (dry run, changes nothing)
//        npx ts-node src/scripts/fixAttendanceAdminId.ts --apply  (writes)
// Attendance records created without an adminId are invisible in the tables.
// This sets adminId from the record's user.
const run = async () => {
  const apply = process.argv.includes('--apply');

  await mongoose.connect(process.env.MONGODB_URI!);

  const orphans = await Attendance.collection.find({ adminId: { $exists: false } }).toArray();
  console.log(`Found ${orphans.length} attendance records without adminId`);

  let fixed = 0;
  for (const record of orphans) {
    const user = await User.findById(record.userId);
    if (!user) {
      console.log(`  skip ${record.date}: user ${record.userId} not found`);
      continue;
    }
    console.log(`  ${record.date} user ${user.name} code ${record.code} -> adminId ${user.adminId}`);
    if (apply) {
      await Attendance.collection.updateOne({ _id: record._id }, { $set: { adminId: user.adminId } });
      fixed++;
    }
  }

  console.log(apply ? `✅ Fixed ${fixed} records` : 'Dry run only. Re-run with --apply to write.');
  process.exit(0);
};

run().catch(err => {
  console.error('❌', err);
  process.exit(1);
});
