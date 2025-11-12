import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api'; // Add this import
import './Login.css';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'code'>('email'); // Track which step we're on

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // ✅ Fixed: Use api instance
      const response = await api.post('/auth/forgot-password', { email });

      setMessage('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
      setStep('code');
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // ✅ Fixed: Use api instance
      const response = await api.post('/auth/verify-reset-code', { email, code });

      setMessage('تم التحقق من الرمز بنجاح');
      // Store the reset token and navigate to password reset
      sessionStorage.setItem('resetToken', response.data.resetToken);
      setTimeout(() => {
        navigate('/reset-password');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'رمز غير صحيح أو منتهي الصلاحية');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img src="/logo.jpeg" alt="الدفاع المدني اللبناني" />
          <h1>الدفاع المدني اللبناني</h1>
          <h2>نسيت كلمة المرور</h2>
        </div>

        <form onSubmit={step === 'email' ? handleEmailSubmit : handleCodeSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          {step === 'email' ? (
            <>
              <div className="form-group">
                <label>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="أدخل البريد الإلكتروني المسجل"
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
              </button>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>رمز التحقق</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.substring(0, 6))}
                  required
                  placeholder="أدخل الرمز المكون من 6 أرقام"
                  maxLength={6}
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'جاري التحقق...' : 'التحقق من الرمز'}
              </button>
            </>
          )}

          <div className="login-footer">
            <Link to="/login">العودة إلى تسجيل الدخول</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;