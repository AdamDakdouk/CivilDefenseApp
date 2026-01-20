import mongoose, { Schema, Document } from 'mongoose';

export interface IMonthlyReport extends Document {
  adminId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  totalHours: number;
  totalMissions: number;
  totalDays: number;
  missionTypeCounts: {
    fire: number;
    rescue: number;
    medic: number;
    publicService: number;
    misc: number;
  };
  createdAt: Date;
}

const MonthlyReportSchema = new Schema<IMonthlyReport>({
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
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  totalHours: {
    type: Number,
    default: 0
  },
  totalMissions: {
    type: Number,
    default: 0
  },
  totalDays: {
    type: Number,
    default: 0
  },
  missionTypeCounts: {
    fire: { type: Number, default: 0 },
    rescue: { type: Number, default: 0 },
    medic: { type: Number, default: 0 },
    publicService: { type: Number, default: 0 },
    misc: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one report per user per month
MonthlyReportSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model<IMonthlyReport>('MonthlyReport', MonthlyReportSchema);