import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  adminId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: String;
  code: 'ح' | 'مأ' | 'غ' | 'ع' | 'م' | 'ب';
  createdAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  code: {
    type: String,
    enum: ['ح', 'مأ', 'غ', 'ع', 'م', 'ب'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one attendance record per user per day
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);