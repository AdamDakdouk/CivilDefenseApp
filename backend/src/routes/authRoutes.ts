import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Admin from '../models/Admin';
import Settings from '../models/Settings';
import { sendResetCode } from '../utils/emailService';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Register new admin
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, stationName } = req.body;

    if (!email || !password || !name || !stationName) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({ message: 'البريد الإلكتروني مسجل بالفعل' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await Admin.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      stationName
    });

    // ✅ Create initial settings for this admin
    await Settings.create({
      adminId: admin._id,
      activeMonth: 1,
      activeYear: new Date().getFullYear(),
      lastMonthEndTeam: '1'
    });

    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الحساب' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find admin
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // ✅ Ensure settings exist for this admin (for legacy accounts)
    const existingSettings = await Settings.findOne({ adminId: admin._id });
    if (!existingSettings) {
      console.log('[Auth] Creating settings for legacy admin:', admin._id);
      await Settings.create({
        adminId: admin._id,
        activeMonth: 1,
        activeYear: new Date().getFullYear(),
        lastMonthEndTeam: '1'
      });
    }

    // Generate token with stationName
    const token = jwt.sign({
      adminId: admin._id,
      email: admin.email,
      name: admin.name,
      stationName: admin.stationName
    }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      adminId: admin._id,
      stationName: admin.stationName,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        stationName: admin.stationName
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// Verify token (check if still valid)
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      adminId: string;
      email: string;
      name: string;
      stationName: string;
    };
    const admin = await Admin.findById(decoded.adminId).select('-password');

    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }

    res.json({
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        stationName: admin.stationName
      }
    });
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
});

// Request password reset - sends a code to email (or logs it for testing)
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'البريد الإلكتروني غير صحيح' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({ message: 'البريد الإلكتروني غير مسجل في النظام' });
    }

    // Generate a 6-digit code
    const resetCode = Math.random().toString().substring(2, 8);
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

    admin.resetCode = hashedCode;
    admin.resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await admin.save();

    // Send email with reset code
    const emailSent = await sendResetCode(admin.email, resetCode);

    if (!emailSent) {
      return res.status(500).json({ message: 'خطأ في إرسال البريد الإلكتروني' });
    }

    res.json({ 
      message: 'تم إرسال رمز التحقق إلى البريد الإلكتروني'
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في معالجة الطلب' });
  }
});

// Verify reset code - validates the code before allowing password reset
router.post('/verify-reset-code', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'البريد والرمز مطلوبان' });
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    const admin = await Admin.findOne({
      email: email.toLowerCase(),
      resetCode: hashedCode,
      resetCodeExpiry: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({ message: 'رمز غير صحيح أو انتهت صلاحيته' });
    }

    // Generate a temporary token for password reset (valid for 5 minutes)
    const resetToken = jwt.sign({ adminId: admin._id, type: 'password-reset' }, JWT_SECRET, { expiresIn: '5m' });

    res.json({ 
      message: 'تم التحقق من الرمز بنجاح',
      resetToken 
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في التحقق من الرمز' });
  }
});

// Reset password - with valid reset token
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'الرمز وكلمة المرور مطلوبان' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' });
    }

    // Verify the reset token
    const decoded = jwt.verify(resetToken, JWT_SECRET) as { adminId: string; type: string };
    
    if (decoded.type !== 'password-reset') {
      return res.status(400).json({ message: 'رمز غير صالح' });
    }

    const admin = await Admin.findById(decoded.adminId);

    if (!admin) {
      return res.status(400).json({ message: 'المسؤول غير موجود' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    admin.resetCode = undefined;
    admin.resetCodeExpiry = undefined;
    await admin.save();

    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(400).json({ message: 'انتهت صلاحية الرمز' });
    }
    res.status(400).json({ message: 'رمز غير صالح' });
  }
});

export default router;