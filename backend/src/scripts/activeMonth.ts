import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Settings from '../models/Settings';
import Admin from '../models/Admin';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function fixMonth() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const ziad = await Admin.findOne({ email: 'ziad.civildefense@gmail.com' });

  if (!ziad) {
    console.log('❌ Ziad not found');
    process.exit(1);
  }

  await Settings.updateOne(
    { adminId: ziad._id },
    {
      activeMonth: 4,
      activeYear: 2026
    }
  );

  console.log('✅ Month updated to 4/2026');

  process.exit(0);
}

fixMonth();