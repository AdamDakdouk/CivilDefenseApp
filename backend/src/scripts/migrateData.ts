// backend/src/scripts/migrateProductionData.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Admin from '../models/Admin';
import User from '../models/User';
import Mission from '../models/Mission';
import Shift from '../models/Shift';
import Attendance from '../models/Attendance';
import MonthlyReport from '../models/MonthlyReport';
import Settings from '../models/Settings';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function migrateData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to production DB\n');

    // Get the two admins
    const ziad = await Admin.findOne({ email: 'ziad.civildefense@gmail.com' });
    const adam = await Admin.findOne({ email: 'adamdakdouk2003@gmail.com' });

    if (!ziad || !adam) {
      console.error('❌ Could not find both admins');
      process.exit(1);
    }

    console.log('👥 Found admins:');
    console.log(`Ziad: ${ziad._id}`);
    console.log(`Adam: ${adam._id}\n`);

    // ✅ Step 1: Update admin profiles with station names
    console.log('📝 Step 1: Updating admin profiles...');
    
    await Admin.findByIdAndUpdate(ziad._id, {
      stationName: 'عرمون',
      name: 'Ziad'
    });
    
    await Admin.findByIdAndUpdate(adam._id, {
      stationName: 'Test Station',
      name: 'Adam (Test)'
    });
    
    console.log('✅ Admin profiles updated\n');

    // ✅ Step 2: Count existing data
    console.log('📊 Step 2: Checking existing data...\n');

    const userCount = await User.countDocuments({ adminId: { $exists: false } });
    const missionCount = await Mission.countDocuments({ adminId: { $exists: false } });
    const shiftCount = await Shift.countDocuments({ adminId: { $exists: false } });
    const attendanceCount = await Attendance.countDocuments({ adminId: { $exists: false } });
    const reportCount = await MonthlyReport.countDocuments({ adminId: { $exists: false } });

    console.log('📈 Found data without adminId:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Missions: ${missionCount}`);
    console.log(`   Shifts: ${shiftCount}`);
    console.log(`   Attendance: ${attendanceCount}`);
    console.log(`   Reports: ${reportCount}\n`);

    // ✅ Step 3: Assign ALL data to Ziad ONLY
    console.log('📊 Step 3: Assigning ALL data to Ziad...\n');

    const usersResult = await User.updateMany(
      { adminId: { $exists: false } },
      { adminId: ziad._id }
    );
    console.log(`✅ Assigned ${usersResult.modifiedCount} users to Ziad`);

    const missionsResult = await Mission.updateMany(
      { adminId: { $exists: false } },
      { adminId: ziad._id }
    );
    console.log(`✅ Assigned ${missionsResult.modifiedCount} missions to Ziad`);

    const shiftsResult = await Shift.updateMany(
      { adminId: { $exists: false } },
      { adminId: ziad._id }
    );
    console.log(`✅ Assigned ${shiftsResult.modifiedCount} shifts to Ziad`);

    const attendanceResult = await Attendance.updateMany(
      { adminId: { $exists: false } },
      { adminId: ziad._id }
    );
    console.log(`✅ Assigned ${attendanceResult.modifiedCount} attendance records to Ziad`);

    const reportsResult = await MonthlyReport.updateMany(
      { adminId: { $exists: false } },
      { adminId: ziad._id }
    );
    console.log(`✅ Assigned ${reportsResult.modifiedCount} monthly reports to Ziad`);

    // ✅ Step 4: Create settings for both admins
    console.log('\n⚙️ Step 4: Creating settings for both admins...');

    const ziadSettings = await Settings.findOne({ adminId: ziad._id });
    const adamSettings = await Settings.findOne({ adminId: adam._id });

    if (!ziadSettings) {
      await Settings.create({
        adminId: ziad._id,
        activeMonth: 1,
        activeYear: 2026,
        lastMonthEndTeam: '3'
      });
      console.log('✅ Created settings for Ziad');
    } else {
      console.log('⚠️ Settings for Ziad already exist');
    }

    if (!adamSettings) {
      await Settings.create({
        adminId: adam._id,
        activeMonth: 1,
        activeYear: 2026,
        lastMonthEndTeam: '3'
      });
      console.log('✅ Created settings for Adam');
    } else {
      console.log('⚠️ Settings for Adam already exist');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   ✅ Ziad: ${ziad.email} - Has ALL production data`);
    console.log(`   ✅ Adam: ${adam.email} - Has NO data (empty/clean)`);
    console.log('\n🧪 Testing:');
    console.log(`   1. Login with Adam → Should see NOTHING ❌`);
    console.log(`   2. Login with Ziad → Should see ALL DATA ✅`);
    console.log(`   3. If Adam sees data = multi-tenant FAILED 🚨`);
    console.log(`   4. If Adam sees nothing = multi-tenant WORKS 🎉`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateData();