import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  role: 'volunteer' | 'employee' | 'head' | 'administrative staff';
  team: 'A' | 'B' | 'C';
  currentMonthHours: number;
  currentMonthMissions: number;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['volunteer', 'employee', 'head', 'administrative staff'],
    required: true
  },
  team: {
    type: String,
    enum: ['A', 'B', 'C'],
    required: true
  },
  currentMonthHours: {
    type: Number,
    default: 0
  },
  currentMonthMissions: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IUser>('User', UserSchema);