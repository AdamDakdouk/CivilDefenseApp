import React, { useEffect, useState } from 'react';
import { getMissions, getMissionsByMonth, getAvailableMissionMonths, createMission, updateMission, deleteMission, getAdminMe, updateMissionSuffix } from '../services/api';
import { Mission } from '../types';
import AddMissionModal from '../components/AddMissionModal';
import ConfirmModal from '../components/ConfirmModal';
import { useMonth } from '../contexts/MonthContext';
import './Missions.css';
import './Missions.print.css';
import CustomAlert from '../components/CustomAlert';
import { getCurrentDate } from '../utils/timeUtils';

const Missions: React.FC = () => {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMission, setEditingMission] = useState<any>(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [missionToDelete, setMissionToDelete] = useState<string | null>(null);
    const [docNumber, setDocNumber] = useState('');
    const [docDate, setDocDate] = useState(getCurrentDate());
    const { selectedMonth, setSelectedMonth, activeMonth, activeYear } = useMonth();
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'error' | 'success' | 'warning' | 'info'>('info');
    const [missionSuffix, setMissionSuffix] = useState('');
    const [showSuffixModal, setShowSuffixModal] = useState(false);
    const [deletingMission, setDeletingMission] = useState(false);

    useEffect(() => {
        fetchMissions();
    }, [selectedMonth]);

    useEffect(() => {
        const loadSuffix = async () => {
            try {
                const res = await getAdminMe();
                setMissionSuffix(res.missionSuffix || '');
            } catch {
                console.error('Failed to load suffix');
            }
        };

        loadSuffix();
    }, []);

    const fetchMissions = async () => {
        try {
            let data;
            if (selectedMonth === 'current') {
                data = await getMissions();
            } else {
                const [month, year] = selectedMonth.split('-').map(Number);
                data = await getMissionsByMonth(month, year);
            }
            setMissions(data);
            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
    };

    if (!selectedMonth) {
        return <div className="loading">جاري التحميل...</div>;
    }

    const handleSaveMission = async (missionData: any) => {
        if (editingMission) {
            await handleUpdateMission(missionData);
        } else {
            try {
                await createMission(missionData);
                setShowModal(false);
                fetchMissions();
            } catch (error) {
                setAlertMessage('حدث خطأ أثناء إضافة المهمة');
                setAlertType('warning')
                setShowAlert(true);
            }
        }
    };

    const handleEditMission = (mission: Mission) => {
        // No formatting needed! Backend already sends data in Civil Defense Clock format
        // date: "YYYY-MM-DD", startTime: "HH:mm", endTime: "HH:mm"
        const formattedMission = {
            ...mission,
            // Times are already in HH:mm format, use them directly
            startTime: mission.startTime,
            endTime: mission.endTime,
            participants: mission.participants.map(p => ({
                user: {
                    _id: p.user._id,
                    name: p.user.name
                },
                // Custom times are already in HH:mm format
                customStartTime: p.customStartTime,
                customEndTime: p.customEndTime
            }))
        };
        setEditingMission(formattedMission);
        setShowModal(true);
    };

    const handleUpdateMission = async (missionData: any) => {
        try {
            await updateMission(missionData.id, missionData);
            setShowModal(false);
            setEditingMission(null);
            fetchMissions();
        } catch (error) {
            setAlertMessage('حدث خطأ أثناء تحديث المهمة');
            setAlertType('warning');
            setShowAlert(true);
        }
    };

    const handleDeleteMission = async () => {
        if (missionToDelete && !deletingMission) { // ✅ Check if not already deleting
            setDeletingMission(true); // ✅ Set deleting state
            try {
                await deleteMission(missionToDelete);
                fetchMissions();
                setShowConfirmDelete(false);
                setMissionToDelete(null);
                setAlertMessage('تم حذف المهمة بنجاح');
                setAlertType('success');
                setShowAlert(true);
            } catch (error) {
                setAlertMessage('حدث خطأ أثناء حذف المهمة');
                setAlertType('warning');
                setShowAlert(true);
            } finally {
                setDeletingMission(false); // ✅ Reset deleting state
            }
        }
    };

    const confirmDelete = (missionId: string) => {
        setMissionToDelete(missionId);
        setShowConfirmDelete(true);
    };

    const isCurrentMonth = () => {
        const [month, year] = selectedMonth.split('-').map(Number);
        return month === activeMonth && year === activeYear;
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
        return (
            <div className="container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container missions-page-print">
            <div className="page-header">
                <h2 className="page-title">المهمات</h2>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button
                        onClick={() => setShowSuffixModal(true)}
                        className="settings-btn no-print"
                        title="إعدادات رقم البرقية"
                    >
                        ⚙️
                    </button>
                    <button onClick={handlePrint} className="export-btn">
                        <span style={{ fontSize: '14px' }}>طباعة الجدول</span>
                    </button>
                    {isCurrentMonth() && (
                        <button className='btn-add' onClick={() => { setEditingMission(null); setShowModal(true); }}>
                            إضافة مهمة
                        </button>
                    )}
                </div>
            </div>

            {missions.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🚒</div>
                    <p className="empty-message">لا توجد مهمات مسجلة</p>
                    <p className="empty-hint">قم بإضافة مهمة جديدة للبدء</p>
                </div>
            ) : (
                <>
                    {/* Report Header */}
                    <div className="report-header">
                        <div className="header-right">
                            <div>الجمهورية اللبنانية</div>
                            <div>وزارة الداخلية والبلديات</div>
                            <div>المديرية العامة للدفاع المدني</div>
                            <div><strong>مركز عرمون</strong></div>
                            <div className="doc-info">
                                <span>رقم البرقية:</span>
                                <input
                                    type="text"
                                    value={docNumber}
                                    onChange={(e) => setDocNumber(e.target.value)}
                                    placeholder="..."
                                    className="inline-input"
                                />
                            </div>
                            <div className="doc-info">
                                <span>التاريخ: </span>
                                <input
                                    type="date"
                                    value={docDate}
                                    onChange={(e) => setDocDate(e.target.value)}
                                    className="date-input-arabic"
                                    onFocus={(e) => {
                                        try {
                                            e.target.showPicker();
                                        } catch (err) {
                                            // Browser blocked showPicker (needs user gesture)
                                            // Ignore the error, user can click manually
                                        }
                                    }}
                                />
                                <span className="date-display-overlay">
                                    {toArabicNumerals(docDate.split('-').join('/'))}
                                </span>
                            </div>
                        </div>

                        <div className="header-center">
                            <h1 className="main-title">
                                سعادة المدير العام الدفاع المدني<br />
                                العميد الركن عماد خريش <span className="hierarchy">بالتراتبيه</span>
                            </h1>
                            <p className="subtitle">
                                ارفع لسعادتكم جدول بالمهمات والخدمات المنفذة في المركز خلال شهر {getMonthName()}
                            </p>
                        </div>
                    </div>

                    <table className='mission-table'>
                        <thead>
                            <tr className='missions-table-headers'>
                                <th rowSpan={2}>التاريخ</th>
                                <th rowSpan={2}>رقم البرقية</th>
                                <th colSpan={2}>نوع المهمة</th>
                                <th rowSpan={2}>المكان</th>
                                <th rowSpan={2}>العناصر المنفذة</th>
                                <th colSpan={2}>الساعة</th>
                                <th rowSpan={2}>نوع الآلية</th>
                                <th rowSpan={2}>ملاحظات</th>
                                <th rowSpan={2}>إجراءات</th>
                            </tr>
                            <tr className='missions-table-headers'>
                                <th>اسعاف - اطفاء</th>
                                <th>خدمة عامة</th>
                                <th>الذهاب</th>
                                <th>الإياب</th>
                            </tr>
                        </thead>
                        <tbody>
                            {missions.map(mission => (
                                <tr className='missions-table-text' key={mission._id}>
                                    <td>{mission.date ? new Date(mission.date).toLocaleDateString('ar-LB') : ''}</td>
                                    <td>{mission.referenceNumber}</td>
                                    <td>
                                        {(mission.missionType === 'fire' || mission.missionType === 'rescue' || mission.missionType === 'medic' || mission.missionType === 'misc')
                                            ? mission.missionDetails
                                            : ''}
                                    </td>
                                    <td>
                                        {mission.missionType === 'public-service' ? mission.missionDetails : ''}
                                    </td>
                                    <td>{mission.location}</td>
                                    <td>{mission.participants
                                        .filter(p => p && p.user) // ✅ Filter out null/undefined participants
                                        .sort((a, b) => {
                                            // ✅ Additional safety check
                                            if (!a?.user || !b?.user) return 0;
                                            if (a.user.role === 'head') return -1;
                                            if (b.user.role === 'head') return 1;
                                            return 0;
                                        })
                                        .map(p => p.user.name)
                                        .join('، ')}</td>
                                    <td>{mission.startTime}</td>
                                    <td>{mission.endTime}</td>
                                    <td>{Array.isArray(mission.vehicleNumbers)
                                        ? mission.vehicleNumbers.join(', ')
                                        : mission.vehicleNumbers || ''}</td>
                                    <td>{mission.notes || ' '}</td>
                                    <td>
                                        {isCurrentMonth() && (
                                            <div className="action-buttons">
                                                <button onClick={() => handleEditMission(mission)} className="edit-btn">
                                                    <span className='gradient-text-edit'>✎</span>
                                                </button>
                                                <button onClick={() => confirmDelete(mission._id)} className="delete-btn">
                                                    <span className='gradient-text-delete'>🗑️</span>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {showModal && (
                <AddMissionModal
                    isOpen={showModal}
                    onClose={() => { setShowModal(false); setEditingMission(null); }}
                    onSave={handleSaveMission}
                    editMode={!!editingMission}
                    initialData={editingMission}
                />
            )}

            {showConfirmDelete && (
                <ConfirmModal
                    message="هل أنت متأكد من حذف هذه المهمة؟"
                    onConfirm={handleDeleteMission}
                    onCancel={() => {
                        if (!deletingMission) {
                            setShowConfirmDelete(false);
                            setMissionToDelete(null);
                        }
                    }}
                    loading={deletingMission}
                />
            )}

            {showAlert && (
                <CustomAlert
                    message={alertMessage}
                    onClose={() => setShowAlert(false)}
                    type={alertType}
                />
            )}

            {showSuffixModal && (
                <div className="modal-overlay">
                    <div className="modal-content">

                        <h3 className='suffix-form-title'>تعديل لاحقة رقم البرقية</h3>

                        <label className='suffix-form-label'>اللاحقة</label>
                        <input
                            className='suffix-form-input'
                            type="text"
                            value={missionSuffix}
                            onChange={(e) => setMissionSuffix(e.target.value)}
                        />

                        <div className="suffix-preview">
                            معاينة: <strong>123{missionSuffix}</strong>
                        </div>

                        <div className="form-actions suffix-form">
                            <button
                                className='btn-save btn-save-suffix'
                                onClick={async () => {
                                    try {
                                        await updateMissionSuffix(missionSuffix);

                                        setAlertMessage('تم حفظ اللاحقة بنجاح');
                                        setAlertType('success')
                                        setShowAlert(true);
                                        setShowSuffixModal(false);
                                    } catch {
                                        setAlertMessage('فشل في حفظ اللاحقة');
                                        setAlertType('warning')
                                        setShowAlert(true);
                                    }
                                }}
                            >
                                حفظ
                            </button>

                            <button className='btn-cancel' onClick={() => setShowSuffixModal(false)}>
                                إلغاء
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default Missions;