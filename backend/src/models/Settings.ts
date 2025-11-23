import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  activeMonth: number;
  activeYear: number;
  lastMonthEndTeam: '1' | '2' | '3';
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  activeMonth: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  activeYear: {
    type: Number,
    required: true
  },
  lastMonthEndTeam: {
    type: String,
    enum: ['1', '2', '3'],
    default: '3'
  }
}, {
  timestamps: true  // Let Mongoose handle createdAt and updatedAt automatically
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);