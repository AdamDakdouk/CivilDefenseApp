import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Admin from '../models/Admin';
import { sendResetCode } from '../utils/emailService';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

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

    // Generate token
    const token = jwt.sign({ adminId: admin._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name
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

    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string };
    const admin = await Admin.findById(decoded.adminId).select('-password');

    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }

    res.json({ admin });
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