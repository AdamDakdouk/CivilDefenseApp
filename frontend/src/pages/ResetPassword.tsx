import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api'; // Add this import
import './Login.css';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [resetToken, setResetToken] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get reset token from sessionStorage (set by ForgotPassword page after code verification)
    const token = sessionStorage.getItem('resetToken');
    if (!token) {
      setError('No valid reset session. Please start over.');
      setTimeout(() => navigate('/forgot-password'), 2000);
      return;
    }
    setResetToken(token);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    if (newPassword.length < 6) {
      setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return;
    }

    if (!resetToken) {
      setError('No valid reset session');
      return;
    }

    setLoading(true);

    try {
      // ✅ Fixed: Use api instance
      await api.post('/auth/reset-password', { resetToken, newPassword });

      setMessage('تم تغيير كلمة المرور بنجاح');
      sessionStorage.removeItem('resetToken');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="error-message">{error || 'جاري التحميل...'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img src="/logo.jpeg" alt="الدفاع المدني اللبناني" />
          <h1>الدفاع المدني اللبناني</h1>
          <h2>إعادة تعيين كلمة المرور</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <div className="form-group">
            <label>كلمة المرور الجديدة</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="أدخل كلمة المرور الجديدة"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label>تأكيد كلمة المرور</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="أدخل تأكيد كلمة المرور"
              minLength={6}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
          </button>

          <div className="login-footer">
            <Link to="/login">العودة إلى تسجيل الدخول</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;