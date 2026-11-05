import express, { Response } from 'express';
import FuelEntry from '../models/FuelEntry';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

const VEHICLE_TYPES = ['jeep', 'fire'];
const FUEL_TYPES = ['gasoline', 'diesel'];

// Validates the fields shared by create and update. Returns an error message or null.
const validateCommon = (body: any): string | null => {
  const { date, stationName, vehicleName, vehiclePlate, vehicleType, fuelType, liters, odometer } = body;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'التاريخ غير صحيح';
  if (!stationName || !String(stationName).trim()) return 'اسم المحطة مطلوب';
  if (!vehicleName || !vehiclePlate) return 'الآلية مطلوبة';
  if (!VEHICLE_TYPES.includes(vehicleType)) return 'نوع الآلية غير صحيح';
  if (!FUEL_TYPES.includes(fuelType)) return 'نوع الوقود غير صحيح';
  if (!Number.isFinite(Number(liters)) || Number(liters) <= 0) return 'الكمية غير صحيحة';
  if (!odometer || !String(odometer).trim()) return 'قراءة العداد مطلوبة';

  return null;
};

// Entries for one month (by voucher date)
router.get('/by-month', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const entries = await FuelEntry.find({
      adminId: req.admin.adminId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1, createdAt: 1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fuel entries', error });
  }
});

// Station names used before, so custom stations can be picked again
router.get('/stations', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const stations = await FuelEntry.distinct('stationName', { adminId: req.admin.adminId });
    res.json(stations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stations', error });
  }
});

// Create one record per voucher number
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const error = validateCommon(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const voucherNumbers: string[] = Array.isArray(req.body.voucherNumbers)
      ? req.body.voucherNumbers.map((v: any) => String(v).trim())
      : [];

    if (voucherNumbers.length === 0 || voucherNumbers.some(v => !v)) {
      return res.status(400).json({ message: 'أرقام القسائم مطلوبة' });
    }
    if (new Set(voucherNumbers).size !== voucherNumbers.length) {
      return res.status(400).json({ message: 'أرقام القسائم مكررة' });
    }

    const existing = await FuelEntry.find({
      adminId: req.admin.adminId,
      voucherNumber: { $in: voucherNumbers }
    }).select('voucherNumber');

    if (existing.length > 0) {
      return res.status(409).json({
        message: `رقم القسيمة موجود مسبقاً: ${existing.map(e => e.voucherNumber).join(', ')}`
      });
    }

    const { date, stationName, vehicleName, vehiclePlate, vehicleType, fuelType, liters, odometer } = req.body;

    const created = await FuelEntry.insertMany(
      voucherNumbers.map(voucherNumber => ({
        adminId: req.admin!.adminId,
        date,
        stationName: String(stationName).trim(),
        vehicleName: String(vehicleName).trim(),
        vehiclePlate: String(vehiclePlate).trim(),
        vehicleType,
        fuelType,
        liters: Number(liters),
        voucherNumber,
        odometer: String(odometer).trim()
      }))
    );

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ message: `Error creating fuel entries: ${error.message}` });
  }
});

// Update a single record
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const error = validateCommon(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const voucherNumber = String(req.body.voucherNumber || '').trim();
    if (!voucherNumber) {
      return res.status(400).json({ message: 'رقم القسيمة مطلوب' });
    }

    const duplicate = await FuelEntry.findOne({
      adminId: req.admin.adminId,
      voucherNumber,
      _id: { $ne: req.params.id }
    });
    if (duplicate) {
      return res.status(409).json({ message: `رقم القسيمة موجود مسبقاً: ${voucherNumber}` });
    }

    const { date, stationName, vehicleName, vehiclePlate, vehicleType, fuelType, liters, odometer } = req.body;

    const entry = await FuelEntry.findOneAndUpdate(
      { _id: req.params.id, adminId: req.admin.adminId },
      {
        date,
        stationName: String(stationName).trim(),
        vehicleName: String(vehicleName).trim(),
        vehiclePlate: String(vehiclePlate).trim(),
        vehicleType,
        fuelType,
        liters: Number(liters),
        voucherNumber,
        odometer: String(odometer).trim()
      },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ message: 'Fuel entry not found' });
    }

    res.json(entry);
  } catch (error: any) {
    res.status(500).json({ message: `Error updating fuel entry: ${error.message}` });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const entry = await FuelEntry.findOneAndDelete({ _id: req.params.id, adminId: req.admin.adminId });
    if (!entry) {
      return res.status(404).json({ message: 'Fuel entry not found' });
    }

    res.json({ message: 'Fuel entry deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting fuel entry', error });
  }
});

export default router;
