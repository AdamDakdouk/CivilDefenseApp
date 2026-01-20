import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  email: string;
  password: string;
  name: string;
  stationName: string;
  resetCode?: string;
  resetCodeExpiry?: Date;
}

const AdminSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  stationName: {
    type: String,
    required: true,
    trim: true
  },
  resetCode: {
    type: String,
    required: false
  },
  resetCodeExpiry: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

export default mongoose.model<IAdmin>('Admin', AdminSchema);