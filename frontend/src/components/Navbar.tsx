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
  const [isRollingOver, setIsRollingOver] = useState(false); // Flag to prevent reset during rollover
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (activeMonth && activeYear) {
      fetchAvailableMonths();
    }
  }, [activeMonth, activeYear]);

  // Add optional parameters to use fresh values
  const fetchAvailableMonths = async (forceMonth?: number, forceYear?: number) => {
    try {
      const [archived, shifts, missions] = await Promise.all([
        getAvailableMonths(),
        getAvailableShiftMonths(),
        getAvailableMissionMonths()
      ]);

      const allMonths = [...archived];

      // Add months from shifts
      [...shifts, ...missions].forEach((m: any) => {
        if (!allMonths.find((am: any) => am.month === m.month && am.year === m.year)) {
          allMonths.push(m);
        }
      });

      // ✅ Use forced values if provided, otherwise use context
      const monthToUse = forceMonth ?? activeMonth;
      const yearToUse = forceYear ?? activeYear;

      // ✅ Always add active month if not in list
      if (monthToUse && yearToUse) {
        const hasActiveMonth = allMonths.some((m: any) => m.month === monthToUse && m.year === yearToUse);
        if (!hasActiveMonth) {
          allMonths.unshift({
            month: monthToUse,
            year: yearToUse,
            label: `${monthToUse}/${yearToUse}`
          });
        }
      }

      // Sort by year desc, then month desc
      allMonths.sort((a: any, b: any) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      setAvailableMonths(allMonths);

      // Only reset selectedMonth if it's empty
      if (!selectedMonth && monthToUse && yearToUse) {
        setSelectedMonth(`${monthToUse}-${yearToUse}`);
      }

    } catch (error) {
      console.error('[Navbar] Error fetching available months:', error);

      // Fallback: at minimum show the active month
      const monthToUse = forceMonth ?? activeYear;
      const yearToUse = forceYear ?? activeYear;

      if (monthToUse && yearToUse) {
        setAvailableMonths([{
          month: monthToUse,
          year: yearToUse,
          label: `${monthToUse}/${yearToUse}`
        }]);
      }
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
    if (isClosingMonth) return;

    setIsClosingMonth(true);
    setIsRollingOver(true);
    setShowConfirm(false);

    const { month, year } = confirmData;

    try {
      setAlertMessage('جاري إغلاق الشهر... الرجاء الانتظار');
      setAlertType('info');
      setShowAlert(true);

      const response = await rolloverMonth(month, year);

      const newMonth = response.newActiveMonth;
      const newYear = response.newActiveYear;

      // ✅ Update selected month FIRST
      setSelectedMonth(`${newMonth}-${newYear}`);

      // Refresh context
      await refreshActiveMonth();

      // ✅ Pass the NEW month values directly to fetchAvailableMonths
      setTimeout(async () => {
        await fetchAvailableMonths(newMonth, newYear);
      }, 500);

      setAlertMessage('تم إغلاق الشهر بنجاح!');
      setAlertType('success');
      setShowAlert(true);

      setTimeout(() => {
        setIsClosingMonth(false);
        setIsRollingOver(false);
      }, 1500);
    } catch (error: any) {
      console.error('Error closing month:', error);
      setIsClosingMonth(false);
      setIsRollingOver(false);
      setAlertMessage('حدث خطأ أثناء إغلاق الشهر: ' + (error?.message || 'Unknown error'));
      setAlertType('error');
      setShowAlert(true);
    }
  };

  // Handle logout
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <nav className={`navbar ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="nav-container">
        <div className="nav-brand">
          <img src="/logo.png" alt="Lebanese Civil Defense" className="nav-logo" />
          <h1 className="nav-title">الدفاع المدني - عمليات {admin?.stationName} </h1>
        </div>

        <div className="nav-links">
          <Link to="/dashboard">لوحة المعلومات</Link>
          <Link to="/volunteers">المتطوعون</Link>
          <Link to="/employees">الموظفون</Link>
          <Link to="/shifts">الحضور اليومي </Link>
          <Link to="/missions">المهمات</Link>
          <Link to="/users">إدارة العناصر</Link>
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
          <button
            onClick={handleLogoutClick}
            className="logout-btn"
            title="تسجيل الخروج"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
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

      {showLogoutConfirm && (
        <ConfirmCloseMonth
          title="هل أنت متأكد من تسجيل الخروج؟"
          message=""
          onConfirm={handleConfirmLogout}
          onCancel={() => setShowLogoutConfirm(false)}
          loading={false}
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