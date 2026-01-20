import mongoose, { Schema, Document } from 'mongoose';

export interface IShift extends Document {
  adminId: mongoose.Types.ObjectId;
  date: string;              // YYYY-MM-DD format (e.g., "2025-11-14")
  team: '1' | '2' | '3';
  participants: {
    user: mongoose.Types.ObjectId;
    checkIn: string;         // HH:mm format (e.g., "08:00")
    checkOut: string;        // HH:mm format (e.g., "08:00" next day)
    hoursServed: number;     // Calculated hours
  }[];
  createdBy: mongoose.Types.ObjectId | null;
  createdAt: Date;           // Keep for audit purposes only
}

const ShiftSchema = new Schema<IShift>({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  date: {
    type: String,
    required: true,
    // Format: YYYY-MM-DD
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  team: {
    type: String,
    enum: ['1', '2', '3'],
    required: true
  },
  participants: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    checkIn: {
      type: String,
      required: true,
      // Format: HH:mm (24-hour)
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    },
    checkOut: {
      type: String,
      required: true,
      // Format: HH:mm (24-hour)
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    },
    hoursServed: {
      type: Number,
      required: true,
      min: 0,
      max: 48  // Allow up to 48 hours (shift can span two days, e.g., 16:00 to 16:00 next day)
    }
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying by date
ShiftSchema.index({ date: 1 });
ShiftSchema.index({ date: 1, team: 1 });

export default mongoose.model<IShift>('Shift', ShiftSchema);