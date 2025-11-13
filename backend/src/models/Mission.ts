import mongoose, { Schema, Document } from 'mongoose';

export interface IMissionParticipant {
    user: mongoose.Types.ObjectId;
    customStartTime?: Date;  // NEW: Optional custom start time for this participant
    customEndTime?: Date;    // NEW: Optional custom end time for this participant
}

export interface IMission extends Document {
    referenceNumber: string;
    vehicleNumbers: string;
    startTime: Date;
    endTime: Date;
    location: string;
    missionType: 'fire' | 'rescue' | 'medic' | 'public-service' | 'misc';
    missionDetails: string;  // Changed - specific details
    notes?: string;
    team: '1' | '2' | '3';
    participants: IMissionParticipant[];
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
}

const MissionParticipantSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customStartTime: {  // NEW: Optional custom start time
        type: Date,
        required: false
    },
    customEndTime: {    // NEW: Optional custom end time
        type: Date,
        required: false
    }
});

const MissionSchema = new Schema<IMission>({
    referenceNumber: {
        type: String,
        required: true
    },
    vehicleNumbers: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    missionType: {
        type: String,
        enum: ['fire', 'rescue', 'medic', 'public-service', 'misc'],
        required: true
    },
    missionDetails: {
        type: String,
        required: true
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
    participants: [MissionParticipantSchema],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model<IMission>('Mission', MissionSchema);