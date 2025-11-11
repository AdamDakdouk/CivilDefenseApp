import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  activeMonth: number;
  activeYear: number;
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
  }
  // Remove the manual updatedAt field
}, {
  timestamps: true  // Let Mongoose handle createdAt and updatedAt automatically
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);