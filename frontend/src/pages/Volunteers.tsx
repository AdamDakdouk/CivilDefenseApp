import React, { useEffect, useState } from 'react';
import { getCurrentMonthData, getMonthlyReports, getAvailableMonths, getAvailableShiftMonths, getAvailableMissionMonths, getVolunteerMissionCounts } from '../services/api';
import { useMonth } from '../contexts/MonthContext';
import './Volunteers.css';
import './Volunteers.print.css';

interface MonthOption {
  month: number;
  year: number;
  label: string;
}

const Volunteers: React.FC = () => {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [missionCounts, setMissionCounts] = useState<any>({});
  const { selectedMonth, activeMonth, activeYear } = useMonth();

  useEffect(() => {
    if (selectedMonth) {
      fetchVolunteers();
    }
  }, [selectedMonth]);

  const fetchVolunteers = async () => {
  try {
    setLoading(true);

    const [month, year] = selectedMonth.split('-').map(Number);

    console.log('Fetching volunteers for:', month, year);
    console.log('Active month:', activeMonth, activeYear);
    console.log('Is active month?', month === activeMonth && year === activeYear);

    if (month === activeMonth && year === activeYear) {
      console.log('Fetching current month data...');
      const users = await getCurrentMonthData();
      const vols = users
        .filter(u => u.role === 'volunteer')
        .sort((a, b) => {
          // First, separate those with card numbers from those without
          const hasCardA = a.cardNumber && a.cardNumber.trim() !== '';
          const hasCardB = b.cardNumber && b.cardNumber.trim() !== '';
          
          // If one has card number and the other doesn't, those with card numbers come first
          if (hasCardA && !hasCardB) return -1;
          if (!hasCardA && hasCardB) return 1;
          
          // If both have or both don't have card numbers, sort by team
          const teamOrder: { [key: string]: number } = { '1': 1, '2': 2, '3': 3 };
          
          // If one has no team and the other does, no team goes last
          if (!a.team && b.team) return 1;
          if (a.team && !b.team) return -1;
          
          // If both have no team, keep original order
          if (!a.team && !b.team) return 0;
          
          // Compare by team order
          const orderA = teamOrder[a.team] || 999;
          const orderB = teamOrder[b.team] || 999;
          
          return orderA - orderB;
        });
      console.log('Current month volunteers:', vols);
      setVolunteers(vols);
    } else {
      console.log('Fetching archived data...');
      const reports = await getMonthlyReports(month, year);
      console.log('Monthly reports:', reports);

      const vols = reports
        .filter((report: any) => report.userId.role === 'volunteer')
        .map((report: any) => ({
          _id: report.userId._id,
          name: report.userId.name,
          cardNumber: report.userId.cardNumber,
          role: report.userId.role,
          team: report.userId.team,
          currentMonthHours: report.totalHours,
          currentMonthMissions: report.totalMissions,
          currentMonthDays: report.totalDays || 0
        }))
        .sort((a, b) => {
          // First, separate those with card numbers from those without
          const hasCardA = a.cardNumber && a.cardNumber.trim() !== '';
          const hasCardB = b.cardNumber && b.cardNumber.trim() !== '';
          
          // If one has card number and the other doesn't, those with card numbers come first
          if (hasCardA && !hasCardB) return -1;
          if (!hasCardA && hasCardB) return 1;
          
          // If both have or both don't have card numbers, sort by team
          const teamOrder: { [key: string]: number } = { '1': 1, '2': 2, '3': 3 };
          
          // If one has no team and the other does, no team goes last
          if (!a.team && b.team) return 1;
          if (a.team && !b.team) return -1;
          
          // If both have no team, keep original order
          if (!a.team && !b.team) return 0;
          
          // Compare by team order
          const orderA = teamOrder[a.team] || 999;
          const orderB = teamOrder[b.team] || 999;
          
          return orderA - orderB;
        });

      console.log('Archived volunteers:', vols);
      setVolunteers(vols);
    }

    // Fetch mission counts
    const counts = await getVolunteerMissionCounts(month, year);
    console.log('Mission counts:', counts);
    setMissionCounts(counts);

    setLoading(false);
  } catch (error) {
    console.error('Error fetching volunteers:', error);
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="container">جاري التحميل...</div>;
  }

  const emptyRows = Math.max(0, 15 - volunteers.length);

  return (
    <div className="report-container">
      {/* Header Section */}
      <button onClick={handlePrint} className="print-btn">
        طباعة الجدول
      </button>
      <div className="header-section">
        <div className="title">
          بيان جهوز وعدد المهمات المنفذة من قبل متطوعي مركز عرمون
        </div>
        <div className="date">خلال شهر {getMonthName()}</div>

      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th rowSpan={2}>الاسم والشهرة</th>
            <th rowSpan={2}>رقم البطاقة</th>
            <th rowSpan={2}>الصفة</th>
            <th>عدد الايام</th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th rowSpan={2}>المجموع بالساعات</th>
            <th rowSpan={2}>الامضاء</th>
          </tr>
          <tr className="sub-header">
            <th>الحضور</th>
            <th>اطفاء</th>
            <th>انقاذ</th>
            <th>اسعاف</th>
            <th>خدمة عامة</th>
            <th>مختلف</th>
          </tr>
        </thead>
        <tbody>
          {volunteers.map(volunteer => (
            <tr key={volunteer._id}>
              <td><strong>{volunteer.name}</strong></td>
              <td>{volunteer.cardNumber || ''}</td>
              <td>متطوع</td>
              <td>{volunteer.currentMonthDays}</td>
              <td>{missionCounts[volunteer._id]?.fire || ''}</td>
              <td>{missionCounts[volunteer._id]?.rescue || ''}</td>
              <td>{missionCounts[volunteer._id]?.medic || ''}</td>
              <td>{missionCounts[volunteer._id]?.publicService || ''}</td>
              <td>{missionCounts[volunteer._id]?.misc || ''}</td>
              <td>{volunteer.currentMonthHours}</td>
              <td></td>
            </tr>
          ))}


        </tbody>
      </table>

      {/* Footer */}
      <div className="footer-text">للتفضل بالاطلاع والقرار</div>
    </div>
  );
};

export default Volunteers;