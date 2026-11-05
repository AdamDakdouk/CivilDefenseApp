import mongoose, { Schema, Document } from 'mongoose';

// One record per voucher (قسيمة). A fill-up that used 2 vouchers creates 2 records
// that share everything except voucherNumber.
export interface IFuelEntry extends Document {
  adminId: mongoose.Types.ObjectId;
  date: string;              // YYYY-MM-DD, the voucher date (تاريخ القسيمة)
  stationName: string;       // اسم المحطة
  vehicleName: string;       // ماركة
  vehiclePlate: string;      // رقم الآلية
  vehicleType: 'jeep' | 'fire';        // نوع: جيب / اطفاء
  fuelType: 'gasoline' | 'diesel';     // بنزين / مازوت
  liters: number;
  voucherNumber: string;     // رقم القسيمة
  odometer: string;          // العداد: a number as text, or 'معطل'
  createdAt: Date;
}

const FuelEntrySchema = new Schema<IFuelEntry>({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  stationName: {
    type: String,
    required: true,
    trim: true
  },
  vehicleName: {
    type: String,
    required: true,
    trim: true
  },
  vehiclePlate: {
    type: String,
    required: true,
    trim: true
  },
  vehicleType: {
    type: String,
    enum: ['jeep', 'fire'],
    required: true
  },
  fuelType: {
    type: String,
    enum: ['gasoline', 'diesel'],
    required: true
  },
  liters: {
    type: Number,
    required: true,
    min: 1
  },
  voucherNumber: {
    type: String,
    required: true,
    trim: true
  },
  odometer: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

FuelEntrySchema.index({ adminId: 1, date: 1 });
FuelEntrySchema.index({ adminId: 1, voucherNumber: 1 });

export default mongoose.model<IFuelEntry>('FuelEntry', FuelEntrySchema);
