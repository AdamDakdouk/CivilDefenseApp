import mongoose, { Schema, Document } from 'mongoose';

export interface IMission extends Document {
  adminId: mongoose.Types.ObjectId;
  referenceNumber: string;
  vehicleNumbers: string;
  date: string;              // YYYY-MM-DD format (e.g., "2025-11-14")
  startTime: string;         // HH:mm format (e.g., "08:00")
  endTime: string;           // HH:mm format (e.g., "21:00")
  location: string;
  missionType: 'fire' | 'rescue' | 'medic' | 'public-service' | 'misc';
  missionDetails: string;
  notes: string;
  team: '1' | '2' | '3';
  participants: {
    user: mongoose.Types.ObjectId;
    customStartTime?: string;  // HH:mm format (optional)
    customEndTime?: string;    // HH:mm format (optional)
  }[];
  createdBy: mongoose.Types.ObjectId | null;
  createdAt: Date;           // Keep for audit purposes only
}

const MissionSchema = new Schema<IMission>({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  referenceNumber: {
    type: String,
    required: true,
    trim: true
  },
  vehicleNumbers: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true,
    // Format: YYYY-MM-DD
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  startTime: {
    type: String,
    required: true,
    // Format: HH:mm (24-hour)
    match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    // Format: HH:mm (24-hour)
    match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  missionType: {
    type: String,
    enum: ['fire', 'rescue', 'medic', 'public-service', 'misc'],
    required: true
  },
  missionDetails: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    default: ''
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
    customStartTime: {
      type: String,
      // Format: HH:mm (24-hour)
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    },
    customEndTime: {
      type: String,
      // Format: HH:mm (24-hour)
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
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
MissionSchema.index({ date: 1 });
MissionSchema.index({ date: 1, team: 1 });

export default mongoose.model<IMission>('Mission', MissionSchema);