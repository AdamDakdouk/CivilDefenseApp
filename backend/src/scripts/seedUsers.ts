import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set. Please add it to your .env file');
    }
    console.log('Connecting to MongoDB at:', mongoUri.substring(0, 50) + '...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Read the JSON file
    const filePath = path.join(__dirname, '../../civil-defense.users.json');
    const usersData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Transform BSON format to regular JavaScript objects
    const transformedUsers = usersData.map((user: any) => {
      return {
        ...user,
        _id: user._id?.$oid ? new mongoose.Types.ObjectId(user._id.$oid) : undefined,
        createdAt: user.createdAt?.$date ? new Date(user.createdAt.$date) : new Date(),
        updatedAt: user.updatedAt?.$date ? new Date(user.updatedAt.$date) : new Date(),
      };
    });

    // Filter out incomplete records
    const validUsers = transformedUsers.filter((user: any) => {
      return user.name && (user.role || user.cardNumber);
    });

    console.log(`Processing ${validUsers.length} users...`);

    // Clear existing users (optional - comment out if you want to keep existing data)
    const deleted = await User.deleteMany({});
    console.log(`Cleared ${deleted.deletedCount} existing users`);

    // Insert users
    const result = await User.insertMany(validUsers, { ordered: false });
    console.log(`✅ Successfully seeded ${result.length} users`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();