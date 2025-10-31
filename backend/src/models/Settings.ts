import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  activeMonth: number;
  activeYear: number;
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
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);