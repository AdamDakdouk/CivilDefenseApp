// models/Vehicle.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicle extends Document {
  name: string;
  plateNumber: string;
  adminId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  plateNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// Compound unique index: plate number must be unique PER admin
VehicleSchema.index({ plateNumber: 1, adminId: 1 }, { unique: true });

export default mongoose.model<IVehicle>('Vehicle', VehicleSchema);