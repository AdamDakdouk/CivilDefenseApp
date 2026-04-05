import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import Admin from '../models/Admin';
import User from '../models/User';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function importUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('✅ Connected to DB\n');

        // Load users JSON
        const users = JSON.parse(
            fs.readFileSync("C:\\dev\\React\\backup-civildefense-production\\CivilDefenseApp.users.json", "utf-8")
        );

        console.log(`📦 Loaded ${users.length} users\n`);

        // Get Ziad only
        const ziad = await Admin.findOne({ email: 'ziad.civildefense@gmail.com' });

        if (!ziad) {
            console.error('❌ Ziad admin not found');
            process.exit(1);
        }

        console.log(`👤 Ziad ID: ${ziad._id}\n`);

        console.log('🚀 Importing users...\n');

        for (const user of users) {

            // ✅ Fix _id
            if (user._id?.$oid) {
                user._id = new mongoose.Types.ObjectId(user._id.$oid);
            }

            // ✅ Fix dates
            if (user.createdAt?.$date) {
                user.createdAt = new Date(user.createdAt.$date);
            }

            if (user.updatedAt?.$date) {
                user.updatedAt = new Date(user.updatedAt.$date);
            }

            // ✅ Fix enum (VERY IMPORTANT)
            // adjust mapping based on your system
            if (user.team === 'A') user.team = '1';
            if (user.team === 'B') user.team = '2';
            if (user.team === 'C') user.team = '3';

            // ✅ Assign admin
            user.adminId = ziad._id;

            // ✅ Prevent duplicates
            const exists = await User.findById(user._id);
            if (exists) continue;

            await User.create(user);
        }

        console.log('\n🎉 Import completed!');
        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Import failed:', error);
        process.exit(1);
    }
}

importUsers();