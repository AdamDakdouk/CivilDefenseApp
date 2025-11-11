import React, { useEffect, useState } from 'react';
import { getCurrentMonthData, getMonthlyReports, getAvailableMonths, getAvailableShiftMonths, getAvailableMissionMonths } from '../services/api';
import { User } from '../types';
import './Users.css';

interface MonthOption {
  month: number;
  year: number;
  label: string;
}

const Users: React.FC = () => {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableMonths, setAvailableMonths] = useState<MonthOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('current');

  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [selectedMonth]);

  const fetchAvailableMonths = async () => {
    try {
      // Get archived months from monthly reports
      const archivedMonths = await getAvailableMonths();

      // Get months from shifts and missions (for current month before archiving)
      const shiftMonths = await getAvailableShiftMonths();
      const missionMonths = await getAvailableMissionMonths();

      // Combine and deduplicate
      const allMonths = [...archivedMonths];

      // Add shift/mission months that aren't in archived
      [...shiftMonths, ...missionMonths].forEach(m => {
        if (!allMonths.find(am => am.month === m.month && am.year === m.year)) {
          allMonths.push(m);
        }
      });

      // Sort by date (newest first)
      allMonths.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      setAvailableMonths(allMonths);
    } catch (error) {
      console.error('Error fetching available months:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      if (selectedMonth === 'current' || selectedMonth === `${currentMonth}-${currentYear}`) {
        // Fetch current month data from User model
        const users = await getCurrentMonthData();
        separateUsers(users);
      } else {
        // Fetch archived month data from MonthlyReports
        const [month, year] = selectedMonth.split('-').map(Number);
        const reports = await getMonthlyReports(month, year);

        if (reports.length === 0) {
          // No archived data yet - this month hasn't been reset
          setVolunteers([]);
          setEmployees([]);
          setLoading(false);
          return;
        }

        // Transform reports to match user structure
        const users = reports.map((report: any) => ({
          _id: report.userId._id,
          name: report.userId.name,
          role: report.userId.role,
          team: report.userId.team,
          currentMonthHours: report.totalHours,
          currentMonthMissions: report.totalMissions
        }));

        separateUsers(users);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const separateUsers = (users: any[]) => {
    const vols = users.filter(u => u.role === 'volunteer');
    const emps = users.filter(u => u.role === 'employee' || u.role === 'head' || u.role === 'administrative staff');

    setVolunteers(vols);
    setEmployees(emps);
  };

  const getMonthLabel = () => {
    if (selectedMonth === 'current') {
      const now = new Date();
      const monthNames = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
      return `${monthNames[now.getMonth()]} ${now.getFullYear()} (الشهر الحالي)`;
    }

    const [month, year] = selectedMonth.split('-').map(Number);
    const monthNames = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
    return `${monthNames[month - 1]} ${year}`;
  };

  if (loading) {
    return <div className="container">جاري التحميل...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2 className="page-title">العناصر</h2>
        <div className="month-selector">
          <label>اختر الشهر: </label>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {availableMonths.map(m => (
              <option key={`${m.month}-${m.year}`} value={`${m.month}-${m.year}`}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <h3 className="section-title">{getMonthLabel()}</h3>

      

      <h4 className="subsection-title" >الموظفون</h4>
      <table>
        <thead>
          <tr>
            <th>الاسم</th>
            <th>ساعات العمل</th>
            <th>عدد المهمات</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(user => (
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.currentMonthHours}</td>
              <td>{user.currentMonthMissions}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 className="subsection-title" style={{ marginTop: '40px' }}>المتطوعون</h4>
      <table>
        <thead>
          <tr>
            <th>الاسم</th>
            <th>ساعات العمل</th>
            <th>عدد المهمات</th>
          </tr>
        </thead>
        <tbody>
          {volunteers.map(user => (
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.currentMonthHours}</td>
              <td>{user.currentMonthMissions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    
  );
};

export default Users;