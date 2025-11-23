import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMonth } from '../contexts/MonthContext';
import { getAvailableMonths, getAvailableShiftMonths, getAvailableMissionMonths, rolloverMonth } from '../services/api';
import './Navbar.css';
import CustomAlert from './CustomAlert';
import ConfirmCloseMonth from './ConfirmCloseMonth';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { logout, admin } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { selectedMonth, setSelectedMonth, activeMonth, activeYear, refreshActiveMonth } = useMonth(); const [availableMonths, setAvailableMonths] = useState<any[]>([]);
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'success' | 'warning' | 'info'>('info');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState({ month: 0, year: 0, monthName: '' });
  const [isClosingMonth, setIsClosingMonth] = useState(false); // Loading state for month close

  useEffect(() => {
    fetchAvailableMonths();
  }, [activeMonth, activeYear])

  const fetchAvailableMonths = async () => {
    try {
      // Fetch from all sources using authenticated API client
      const [archived, shifts, missions] = await Promise.all([
        getAvailableMonths(),
        getAvailableShiftMonths(),
        getAvailableMissionMonths()
      ]);

      const allMonths = [...archived];

      [...shifts, ...missions].forEach((m: any) => {
        if (!allMonths.find((am: any) => am.month === m.month && am.year === m.year)) {
          allMonths.push(m);
        }
      });

      // Always add active month if not in list (so there's at least one option)
      if (activeMonth && activeYear) {
        const hasActiveMonth = allMonths.some((m: any) => m.month === activeMonth && m.year === activeYear);
        if (!hasActiveMonth) {
          allMonths.unshift({
            month: activeMonth,
            year: activeYear,
            label: `${activeMonth}/${activeYear}`
          });
        }
      }

      // If still empty, add current month as fallback
      allMonths.sort((a: any, b: any) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      setAvailableMonths(allMonths);

      const selectedExists = allMonths.some((m: any) => `${m.month}-${m.year}` === selectedMonth);
      if (!selectedExists && activeMonth && activeYear) {
        setSelectedMonth(`${activeMonth}-${activeYear}`);
      }
    } catch (error) {
      // Fallback: add current month
      const now = new Date();
      setAvailableMonths([{
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        label: `${now.getMonth() + 1}/${now.getFullYear()}`
      }]);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsVisible(true);
      } else if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        // Scrolling down and past 100px
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const closeCurrentMonth = () => {
    const month = activeMonth;
    const year = activeYear;

    const monthNames = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
    const monthName = monthNames[month - 1];

    setConfirmData({ month, year, monthName });
    setShowConfirm(true);
  };

  const handleConfirmClose = async () => {
    if (isClosingMonth) return; // Prevent double-click
    
    setIsClosingMonth(true);
    setShowConfirm(false);

    const { month, year } = confirmData;

    try {
      // Show processing message immediately
      setAlertMessage('جاري إغلاق الشهر... الرجاء الانتظار');
      setAlertType('info');
      setShowAlert(true);

      // Wait for rollover to complete
      await rolloverMonth(month, year);

      // Update to success message
      setAlertMessage('تم إغلاق الشهر بنجاح! جاري التحديث...');
      setAlertType('success');
      setShowAlert(true);

      // Reload page after a short delay to show success message
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setIsClosingMonth(false); // Re-enable on error
      setAlertMessage('حدث خطأ أثناء إغلاق الشهر');
      setAlertType('error');
      setShowAlert(true);
    }
  };

  return (
    <nav className={`navbar ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="nav-container">
        <div className="nav-brand">
          <img src="/logo.png" alt="Lebanese Civil Defense" className="nav-logo" />
          <h1 className="nav-title">الدفاع المدني - عمليات عرمون</h1>
        </div>

        <div className="nav-links">
          <Link to="/dashboard">لوحة المعلومات</Link>
          <Link to="/volunteers">المتطوعون</Link>
          <Link to="/employees">الموظفون</Link>
          <Link to="/shifts">الحضور اليومي </Link>
          <Link to="/missions">المهمات</Link>
        </div>


        <div className="navbar-controls">
          <div className="month-selector-navbar">
            <label>الشهر: </label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              {availableMonths.map(m => (
                <option key={`${m.month}-${m.year}`} value={`${m.month}-${m.year}`}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={closeCurrentMonth}
            className="close-month-btn"
            disabled={isClosingMonth}
          >
            {isClosingMonth ? 'جاري الإغلاق...' : 'إغلاق الشهر'}
          </button>
        </div>
      </div>

      {showConfirm && (
        <ConfirmCloseMonth
          title={`هل أنت متأكد من إغلاق شهر ${confirmData.monthName} ${confirmData.year}؟`}
          message={`سيتم:\n• حفظ جميع البيانات في الأرشيف\n• إعادة تعيين العدادات إلى الصفر\n• الانتقال إلى الشهر الجديد`}
          onConfirm={handleConfirmClose}
          onCancel={() => setShowConfirm(false)}
          loading={isClosingMonth}
        />
      )}

      {showAlert && (
        <CustomAlert
          message={alertMessage}
          onClose={() => {
            if (!isClosingMonth) { // Only allow closing if not in the middle of closing month
              setShowAlert(false);
            }
          }}
          type={alertType}
        />
      )}
    </nav>
  );
};

export default Navbar;