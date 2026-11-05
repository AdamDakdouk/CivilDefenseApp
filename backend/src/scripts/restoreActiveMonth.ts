import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Settings from '../models/Settings';
import Admin from '../models/Admin';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Restores the active month after temp.ts set it to 4/2026 by mistake.
// Only touches activeMonth/activeYear, and only if they are still 4/2026.
const EXPECTED_CURRENT = { month: 4, year: 2026 };
const RESTORE_TO = { month: 11, year: 2026 };

async function restore() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const admin = await Admin.findOne({ email: 'ziad.civildefense@gmail.com' });
  if (!admin) {
    console.log('❌ Admin not found');
    process.exit(1);
  }

  const settings = await Settings.findOne({ adminId: admin._id });
  if (!settings) {
    console.log('❌ Settings not found');
    process.exit(1);
  }

  console.log(`Current: ${settings.activeMonth}/${settings.activeYear}, lastMonthEndTeam: ${settings.lastMonthEndTeam}`);

  if (settings.activeMonth !== EXPECTED_CURRENT.month || settings.activeYear !== EXPECTED_CURRENT.year) {
    console.log('❌ Not 4/2026 anymore, aborting without changes.');
    process.exit(1);
  }

  await Settings.updateOne(
    { adminId: admin._id },
    { activeMonth: RESTORE_TO.month, activeYear: RESTORE_TO.year }
  );

  console.log(`✅ Active month restored to ${RESTORE_TO.month}/${RESTORE_TO.year}`);
  process.exit(0);
}

restore();
