import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

interface YearlyStats {
    totalMissions: number;
    totalHours: number;
    missionsByType: { [key: string]: number };
    monthlyActivity: { month: number; missions: number }[];
    topContributors: { name: string; hours: number; missions: number }[];
    teamPerformance: { team: string; hours: number; missions: number }[];
}

const YearlyDashboard: React.FC = () => {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [stats, setStats] = useState<YearlyStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchYearlyStats(selectedYear);
    }, [selectedYear]);

    const fetchYearlyStats = async (year: number) => {
        try {
            setLoading(true);
            const response = await api.get(`/dashboard/yearly-stats?year=${year}`);
            setStats(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching yearly stats:', error);
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

    const getMonthAbbreviation = (monthNum: number) => {
        const monthAbbr = [
            'ك2', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
            'تموز', 'آب', 'أيلول', 'ت1', 'ت2', 'ك1'
        ];
        return monthAbbr[monthNum - 1];
    };

    // Generate year options (current year and past 5 years)
    const yearOptions = [];
    for (let i = 0; i < 6; i++) {
        yearOptions.push(currentYear - i);
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

    return (
        <div className="dashboard-container">
            {/* Floating Toggle Button */}
            <button 
                className="floating-toggle-btn"
                onClick={() => navigate('/dashboard')}
                title="العودة إلى العرض الشهري"
            >
                📅
            </button>

            <div className="dashboard-header">
                <h2>لوحة المعلومات  - سنة {selectedYear}</h2>
                <div className="year-selector">
                    <label htmlFor="year-select">السنة: </label>
                    <select 
                        id="year-select"
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="year-select-dropdown"
                    >
                        {yearOptions.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="metrics-grid">
                <div className="metric-card missions-card">
                    <div className="metric-icon">🚒</div>
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
                        {stats.topContributors.length > 0 ? (
                            [...stats.topContributors]
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
                                ))
                        ) : (
                            <div className="no-data">لا توجد بيانات</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Team Performance */}
            <div className="chart-card full-width">
                <h3>أداء الفرق</h3>
                <div className="team-performance-grid">
                    {stats.teamPerformance.length > 0 ? (
                        [...stats.teamPerformance]
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
                            ))
                    ) : (
                        <div className="no-data">لا توجد بيانات</div>
                    )}
                </div>
            </div>

            {/* Monthly Activity - Vertical Bars */}
            <div className="chart-card full-width">
                <h3>النشاط الشهري (المهمات)</h3>
                <div className="daily-activity-chart">
                    {stats.monthlyActivity.map((monthData) => {
                        const maxMissions = Math.max(...stats.monthlyActivity.map(m => m.missions), 1);
                        const heightPercent = (monthData.missions / maxMissions) * 100;
                        return (
                            <div key={monthData.month} className="month-bar-container">
                                <div
                                    className="month-bar"
                                    style={{ height: `${heightPercent}%` }}
                                    title={`${getMonthName(monthData.month)}: ${monthData.missions} مهمة`}
                                >
                                    {monthData.missions > 0 && (
                                        <span className="bar-value">{monthData.missions}</span>
                                    )}
                                </div>
                                <div className="month-label">{getMonthAbbreviation(monthData.month)}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default YearlyDashboard;