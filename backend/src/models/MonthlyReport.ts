import mongoose, { Schema, Document } from 'mongoose';

export interface IMonthlyReport extends Document {
  month: number;
  year: number;
  userId: mongoose.Types.ObjectId;
  totalHours: number;
  totalMissions: number;
  createdAt: Date;
}

const MonthlyReportSchema = new Schema<IMonthlyReport>({
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
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalHours: {
    type: Number,
    required: true,
    default: 0
  },
  totalMissions: {
    type: Number,
    required: true,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one report per user per month
MonthlyReportSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model<IMonthlyReport>('MonthlyReport', MonthlyReportSchema);