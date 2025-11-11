import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  middleName: string;
  cardNumber: string;
  motherName: string;
  autoNumber: string;
  role: 'volunteer' | 'employee' | 'head' | 'administrative staff';
  team: '1' | '2' | '3';
  currentMonthHours: number;
  currentMonthMissions: number;
  currentMonthDays: number;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  middleName: {  
    type: String,
    default: ''
  },
  cardNumber: {
    type: String,
    default: ''
  },
  motherName: {
    type: String,
    default: ''
  },
  autoNumber: {  
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['volunteer', 'employee', 'head', 'administrative staff'],
    required: true
  },
  team: {
    type: String,
    enum: ['1', '2', '3'],
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
  currentMonthDays: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IUser>('User', UserSchema);