import mongoose, { Schema, Document } from 'mongoose';

export interface IMissionParticipant {
    user: mongoose.Types.ObjectId;
}

export interface IMission extends Document {
    referenceNumber: string;
    vehicleNumber: string;
    startTime: Date;
    endTime: Date;
    location: string;
    missionType: string;
    notes?: string;
    team: 'A' | 'B' | 'C';
    participants: IMissionParticipant[];
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
}

const MissionParticipantSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

const MissionSchema = new Schema<IMission>({
    referenceNumber: {
        type: String,
        required: true
    },
    vehicleNumber: {
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
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    team: {
        type: String,
        enum: ['A', 'B', 'C'],
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