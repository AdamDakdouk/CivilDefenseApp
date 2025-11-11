import mongoose, { Schema, Document } from 'mongoose';

export interface IShiftParticipant {
  user: mongoose.Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  hoursServed: number;
}

export interface IShift extends Document {
  date: Date;
  team: '1' | '2' | '3';
  participants: IShiftParticipant[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ShiftParticipantSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  hoursServed: {
    type: Number,
    required: true
  }
});

const ShiftSchema = new Schema<IShift>({
  date: {
    type: Date,
    required: true
  },
  team: {
    type: String,
    enum: ['1', '2', '3'],
    required: true
  },
  participants: [ShiftParticipantSchema],
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

export default mongoose.model<IShift>('Shift', ShiftSchema);