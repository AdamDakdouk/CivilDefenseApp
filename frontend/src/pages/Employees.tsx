import React, { useEffect, useState } from 'react';
import { getCurrentMonthData, getAttendanceByMonth, getMonthlyReports, getAvailableMonths, getAvailableShiftMonths, getAvailableMissionMonths, updateAttendanceCode } from '../services/api';
import { useMonth } from '../contexts/MonthContext';
import './Employees.print.css';
import './Employees.css';

interface MonthOption {
  month: number;
  year: number;
  label: string;
}

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ employeeId: string, day: number } | null>(null);
  const { selectedMonth, activeMonth, activeYear } = useMonth();

  useEffect(() => {
    if (selectedMonth) {
      fetchEmployees();
    }
  }, [selectedMonth]);

  const handleUpdateAttendanceCode = async (employeeId: string, day: number, newCode: string) => {
    try {
      const [month, year] = selectedMonth.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

      await updateAttendanceCode(employeeId, date.toISOString(), newCode);

      fetchEmployees();
      setEditingCell(null);
    } catch (error) {
      throw (error);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const [month, year] = selectedMonth.split('-').map(Number);

      // Check if viewing active month or archived month
      if (month === activeMonth && year === activeYear) {
        // Viewing current/active month
        const users = await getCurrentMonthData();
        const emps = users
          .filter(u =>
            u.role === 'employee' || u.role === 'head' || u.role === 'administrative staff'
          )
          .sort((a, b) => {
            if (a.role === 'head') return -1;
            if (b.role === 'head') return 1;
            return a.name.localeCompare(b.name, 'ar');
          });

        setEmployees(emps);
      } else {
        // Viewing archived month
        const reports = await getMonthlyReports(month, year);
        const emps = reports
          .filter((report: any) =>
            report.userId.role === 'employee' ||
            report.userId.role === 'head' ||
            report.userId.role === 'administrative staff'
          )
          .map((report: any) => ({
            _id: report.userId._id,
            name: report.userId.name,
            middleName: report.userId.middleName || '',
            motherName: report.userId.motherName || '',
            autoNumber: report.userId.autoNumber || '',
            cardNumber: report.userId.cardNumber,
            role: report.userId.role,
            team: report.userId.team,
            currentMonthHours: report.totalHours,
            currentMonthMissions: report.totalMissions,
            currentMonthDays: report.totalDays || 0
          }))
          .sort((a, b) => {
            if (a.role === 'head') return -1;
            if (b.role === 'head') return 1;
            return a.name.localeCompare(b.name, 'ar');
          });

        setEmployees(emps);
      }

      // Fetch attendance for the month (works for both current and archived)
      const attendanceData = await getAttendanceByMonth(month, year);
      setAttendance(attendanceData);

      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const getMonthName = () => {
    const [month, year] = selectedMonth.split('-').map(Number);
    const monthNames = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
    return `${monthNames[month - 1]} ${toArabicNumerals(year.toString())}`;
  };

  const toArabicNumerals = (str: string): string => {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[0-9]/g, (digit) => arabicNumerals[parseInt(digit)]);
  };

  const getPosition = (role: string): string => {
    switch (role) {
      case 'employee': return 'عمليات';
      case 'head': return 'رئيس مركز';
      case 'administrative staff': return 'ادارة';
      default: return '';
    }
  };

  const getAttendanceCode = (employeeId: string, day: number): string => {
    const [month, year] = selectedMonth.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const dateStr = date.toISOString().split('T')[0];

    const record = attendance.find(a => {
      const aDate = new Date(a.date).toISOString().split('T')[0];
      const aUserId = (a.userId as any)._id || a.userId;
      return aUserId === employeeId && aDate === dateStr;
    });

    return record ? record.code : '';
  };

  const countAttendanceCode = (employeeId: string, code: string): number => {
    return attendance.filter(a => {
      const aUserId = a.userId._id || a.userId;
      return aUserId === employeeId && a.code === code;
    }).length;
  };

  const getDaysInMonth = (): number => {
    const [month, year] = selectedMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  };

  const getFullName = (name: string, middleName?: string) => {
    if (!middleName) return name;

    const nameParts = name.split(' ');
    const firstName = nameParts[0]; // "Naji"
    const lastName = nameParts.slice(1).join(' '); // "Abou Ghannam" (everything after first name)

    return `${firstName} ${middleName} ${lastName}`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p className="loading-text">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const totalDayCols = 31;
  const daysInMonth = getDaysInMonth();
  const days = Array.from({ length: totalDayCols }, (_, i) => i + 1);
  const legendCodes = ['ح', 'مأ', 'غ', 'ع', 'م', 'ب'];

  return (
    <div className="attendance-container">
      {/* Header Section */}
      <button onClick={handlePrint} className="print-btn">
        طباعة الجدول
      </button>
      <div className="header-section">
        <div className="top-section">
          {/* Right Side - Organization Info */}
          <div className="org-info">
            <div className="org-name">المديرية العامة للدفاع المدني</div>
            <div className="info-line">رقم:</div>
            <div className="info-line">تاريخ:</div>
          </div>

          {/* Center - Titles */}
          <div className="titles-container">
            <h1 className="main-title">بعقلين الاقليمي</h1>
            <h2 className="sub-title">
              بيان جهوزية الموظفين الجدد لمركز ( عرمون العضوي ) عن شهر ( {getMonthName()} )
            </h2>
          </div>

          {/* Left Side - Legend */}
          <div className="legend-container">
            <table className="legend-table">
              <tbody>
                <tr>
                  <td className="legend-code">ح</td>
                  <td className="legend-text">حضور</td>
                </tr>
                <tr>
                  <td className="legend-code">مأ</td>
                  <td className="legend-text">مأذونية إدارية</td>
                </tr>
                <tr>
                  <td className="legend-code">غ</td>
                  <td className="legend-text">غياب غير مبرر</td>
                </tr>
                <tr>
                  <td className="legend-code">ع</td>
                  <td className="legend-text">عطلة</td>
                </tr>
                <tr>
                  <td className="legend-code">م</td>
                  <td className="legend-text">مأذونية مرضية</td>
                </tr>
                <tr>
                  <td className="legend-code">ب</td>
                  <td className="legend-text">مأذونية بلا راتب</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-wrapper">
        <table className="main-table">
          <thead>
            <tr>
              <th className="col-serial">الرقم المتسلسل</th>
              <th>الرقم الآلي</th>
              <th>الاسم الثلاثي</th>
              <th>اسم الأم</th>
              <th>الوظيفة</th>
              {days.map((day, index) => (
                <th key={day} className="day-cell">
                  {index < daysInMonth ? day : ''}
                </th>
              ))}
              {legendCodes.map(code => (
                <th key={code} className="day-cell">{code}</th>
              ))}
              <th className="col-overtime">عدد الساعات الإضافية</th>
              <th>الفئة</th>
              <th className="col-signature">التوقيع</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, index) => (
              <tr key={emp._id}>
                <td className="center-text"></td>
                <td className="center-text">{emp.autoNumber || ''}</td>
                <td>{getFullName(emp.name, emp.middleName)}</td>
                <td>{emp.motherName || ''}</td>
                <td>{getPosition(emp.role)}</td>
                {days.map((day, i) => {
                  const code = i < daysInMonth ? getAttendanceCode(emp._id, day) : '';
                  const isVacation = code === 'ع';
                  const isEditing = editingCell?.employeeId === emp._id && editingCell?.day === day;

                  return (
                    <td
                      key={day}
                      className="day-cell"
                      style={{
                        backgroundColor: isVacation ? '#d3d3d3' : 'transparent',
                        cursor: i < daysInMonth ? 'pointer' : 'default'
                      }}
                      onClick={() => i < daysInMonth && setEditingCell({ employeeId: emp._id, day })}
                    >
                      {isEditing ? (
                        <select
                          value={code}
                          onChange={(e) => handleUpdateAttendanceCode(emp._id, day, e.target.value)}
                          onBlur={() => setEditingCell(null)}
                          autoFocus
                          style={{ width: '100%', border: 'none', textAlign: 'center' }}
                        >
                          <option value="">-</option>
                          <option value="ح">ح</option>
                          <option value="مأ">مأ</option>
                          <option value="غ">غ</option>
                          <option value="ع">ع</option>
                          <option value="م">م</option>
                          <option value="ب">ب</option>
                        </select>
                      ) : (
                        code
                      )}
                    </td>
                  );
                })}
                {legendCodes.map(code => (
                  <td key={code} className="day-cell">
                    {countAttendanceCode(emp._id, code)}
                  </td>
                ))}
                <td className="center-text">
                  {(emp.role === 'head' || emp.role === 'administrative staff') ? '75' : ''}
                </td>
                <td className="center-text">5</td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="footer-section">
        <div className="notes-section">
          <div className="notes-title">ملاحظة</div>
        </div>
        <div className="notes-content">
          <div>1 الموظف G نقل من مركز ...... الى مركز .........</div>
          <div>2 الموظف H نقل من مركز ........ الى مركز ..........</div>
          <div>3 ان رئيس المركز ( زياد شوقي المهتار ) يداوم بشكل يومي</div>
          <div>4</div>
          <div>5</div>
        </div>
        <div className="signatures-section">
          <div className="signature-box">
            <div className="signature-label">توقيع رئيس المركز الإقليمي</div>
            <div className="signature-line"></div>
          </div>
          <div className="signature-box">
            <div className="signature-label">توقيع رئيس المركز العضوي</div>
            <div className="signature-line"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Employees;