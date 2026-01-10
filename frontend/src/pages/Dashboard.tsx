import React, { useState, useEffect } from 'react';
import { useMonth } from '../contexts/MonthContext';
import api from '../services/api';
import './Dashboard.css';

interface DashboardStats {
    totalMissions: number;
    totalHours: number;
    missionsByType: { [key: string]: number };
    dailyActivity: { day: number; missions: number; shifts: number }[];
    topContributors: { name: string; hours: number; missions: number }[];
    teamPerformance: { team : string; hours: number; missions: number }[];
    recentActivity: any[];
}

const Dashboard: React.FC = () => {
    const { selectedMonth } = useMonth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedMonth) {
      const [month, year] = selectedMonth.split('-').map(Number);
      
      if (!isNaN(month) && !isNaN(year)) {
        fetchDashboardStats(month, year);
      }
    }
  }, [selectedMonth]);

    const fetchDashboardStats = async (month: number, year: number) => {
        try {
            setLoading(true);
            const response = await api.get(`/dashboard/stats?month=${month}&year=${year}`);
            setStats(response.data);
            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
    };

    const getMonthName = (monthNum: number) => {
        const monthNames = [
            'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
            'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
        ];
        return monthNames[monthNum - 1];
    };

    const typeTranslations: { [key: string]: string } = {
        'rescue': 'إنقاذ',
        'medic': 'إسعاف',
        'fire': 'إطفاء',
        'public-service': 'خدمة عامة',
        'misc': 'مختلف'
    };

    if (!selectedMonth) {
        return <div className="loading">جاري التحميل...</div>;
    }

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

    if (!stats) {
        return <div className="error">خطأ في تحميل البيانات</div>;
    }

    const [displayMonth, displayYear] = selectedMonth.split('-').map(Number);

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>لوحة المعلومات - {getMonthName(displayMonth)} {displayYear}</h2>
            </div>

            {/* Key Metrics */}
            <div className="metrics-grid">
                <div className="metric-card missions-card">
                    <div className="metric-icon">🚑</div>
                    <div className="metric-value">{stats.totalMissions}</div>
                    <div className="metric-label">عدد المهمات</div>
                </div>

                <div className="metric-card hours-card">
                    <div className="metric-icon">⏱️</div>
                    <div className="metric-value">{stats.totalHours}</div>
                    <div className="metric-label">مجموع ساعات العمل</div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section">
                {/* Missions by Type - Horizontal Bars */}
                <div className="chart-card">
                    <h3>المهمات حسب النوع</h3>
                    <div className="missions-type-list">
                        {Object.entries(stats.missionsByType).length > 0 ? (
                            Object.entries(stats.missionsByType).map(([type, count]) => {
                                const maxCount = Math.max(...Object.values(stats.missionsByType));
                                // Scale to max 80% width so bars don't completely fill
                                const widthPercent = maxCount > 0 ? (count / maxCount) * 80 : 0;

                                return (
                                    <div key={type} className="type-item-horizontal">
                                        <span className="type-name-horizontal">{type}</span>
                                        <div className="type-progress-bar">
                                            <div
                                                className="type-progress-fill"
                                                style={{ width: `${widthPercent}%` }}
                                            >
                                                <span className="type-count-inside">{count}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="no-data">لا توجد بيانات</div>
                        )}
                    </div>
                </div>

                {/* Top Contributors */}
                <div className="chart-card">
                    <h3>الأكثر مساهمة</h3>
                    <div className="contributors-list">
                        {[...stats.topContributors]
                            .sort((a, b) => b.missions - a.missions)
                            .slice(0, 10)
                            .map((contributor, index) => (
                                <div key={index} className="contributor-item">
                                    <div className="contributor-rank">{index + 1}</div>
                                    <div className="contributor-info">
                                        <div className="contributor-name">{contributor.name}</div>
                                        <div className="contributor-stats">
                                            {contributor.hours} ساعات • {contributor.missions === 1 ? 'مهمة واحدة' : `${contributor.missions} مهمات`}
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {/* Team Performance */}
            <div className="chart-card full-width">
                <h3>أداء الفرق</h3>
                <div className="team-performance-grid">
                    {[...stats.teamPerformance]
                        .sort((a, b) => parseInt(a.team) - parseInt(b.team))
                        .map((team) => (
                        <div key={team.team} className="team-card">
                            <div className="team-name">الفريق {team.team}</div>
                            <div className="team-stats">
                                <div className="team-stat">
                                    <span className="stat-label">الساعات:</span>
                                    <span className="stat-value">{team.hours}</span>
                                </div>
                                <div className="team-stat">
                                    <span className="stat-label">المهمات:</span>
                                    <span className="stat-value">{team.missions}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Daily Activity - Vertical Bars (Missions Only) */}
            <div className="chart-card full-width">
                <h3>النشاط اليومي (المهمات)</h3>
                <div className="daily-activity-chart">
                    {stats.dailyActivity.map((day) => {
                        const missionCount = day.missions;

                        return (
                            <div key={day.day} className="day-bar-container">
                                <div
                                    className="day-bar"
                                    title={`${missionCount} مهمة`}
                                >
                                    {missionCount > 0 && <span className="bar-value">{missionCount}</span>}
                                </div>
                                <div className="day-label">{day.day}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;