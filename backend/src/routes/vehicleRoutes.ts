import express, { Response } from 'express';
import Vehicle from '../models/Vehicle';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// protect all admin routes
router.use(authenticateToken);

// GET all vehicles (only for logged-in admin)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const vehicles = await Vehicle.find({ adminId: req.admin.adminId }).sort({ name: 1 });
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ message: 'خطأ في جلب الآليات' });
  }
});

// POST create vehicle
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, plateNumber } = req.body;

    if (!name || !plateNumber) {
      return res.status(400).json({ message: 'الاسم ورقم اللوحة مطلوبان' });
    }

    const existingVehicle = await Vehicle.findOne({
      plateNumber: plateNumber.trim(),
      adminId: req.admin.adminId
    });

    if (existingVehicle) {
      return res.status(400).json({ message: 'رقم اللوحة موجود مسبقاً' });
    }

    const vehicle = new Vehicle({
      name: name.trim(),
      plateNumber: plateNumber.trim(),
      adminId: req.admin.adminId
    });

    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الآلية' });
  }
});

// PUT update vehicle
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, plateNumber } = req.body;

    if (!name || !plateNumber) {
      return res.status(400).json({ message: 'الاسم ورقم اللوحة مطلوبان' });
    }

    const existingVehicle = await Vehicle.findOne({
      plateNumber: plateNumber.trim(),
      adminId: req.admin.adminId,
      _id: { $ne: req.params.id }
    });

    if (existingVehicle) {
      return res.status(400).json({ message: 'رقم اللوحة موجود مسبقاً' });
    }

    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, adminId: req.admin.adminId },
      {
        name: name.trim(),
        plateNumber: plateNumber.trim()
      },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({ message: 'الآلية غير موجودة' });
    }

    res.json(vehicle);
  } catch (error: any) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ message: 'خطأ في تحديث الآلية' });
  }
});

// DELETE vehicle
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const vehicle = await Vehicle.findOneAndDelete({
      _id: req.params.id,
      adminId: req.admin.adminId
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'الآلية غير موجودة' });
    }

    res.json({ message: 'تم حذف الآلية بنجاح' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ message: 'خطأ في حذف الآلية' });
  }
});

export default router;