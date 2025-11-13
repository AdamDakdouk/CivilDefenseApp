import React, { useEffect, useState } from 'react';
import { getMissions, getMissionsByMonth, getAvailableMissionMonths, createMission, updateMission, deleteMission } from '../services/api';
import { Mission } from '../types';
import AddMissionModal from '../components/AddMissionModal';
import ConfirmModal from '../components/ConfirmModal';
import { useMonth } from '../contexts/MonthContext';
import './Missions.css';
import './Missions.print.css';
import CustomAlert from '../components/CustomAlert';

const Missions: React.FC = () => {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMission, setEditingMission] = useState<any>(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [missionToDelete, setMissionToDelete] = useState<string | null>(null);
    const [docNumber, setDocNumber] = useState('');
    const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
    const { selectedMonth, setSelectedMonth, activeMonth, activeYear } = useMonth();
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'error' | 'success' | 'warning' | 'info'>('info');
    const [deletingMission, setDeletingMission] = useState(false);

    useEffect(() => {
        fetchMissions();
    }, [selectedMonth]);

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
            console.error('Error fetching missions:', error);
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
    // Format times without timezone conversion
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const formattedMission = {
        ...mission,
        startTime: formatDateTime(mission.startTime),
        endTime: formatDateTime(mission.endTime),
        participants: mission.participants.map(p => ({
            user: {
                _id: p.user._id,
                name: p.user.name
            },
            customStartTime: p.customStartTime ? formatDateTime(p.customStartTime) : undefined,
            customEndTime: p.customEndTime ? formatDateTime(p.customEndTime) : undefined
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
        return <div className="container">جاري التحميل...</div>;
    }

    return (
        <div className="container">
            <div className="page-header">
                <h2 className="page-title">المهمات</h2>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button onClick={handlePrint} className="export-btn">
                        طباعة / تصدير PDF
                    </button>
                    {isCurrentMonth() && (
                        <button onClick={() => { setEditingMission(null); setShowModal(true); }}>
                            إضافة مهمة
                        </button>
                    )}

                </div>
            </div>
            {/* Report Header */}
            <div className="report-header">
                <div className="header-right">
                    <div>الجمهورية اللبنانية ٢ </div>
                    <div>وزارة الداخلية والبلديات</div>
                    <div>المديرية العامة للدفاع المدني</div>
                    <div><strong>مركز عرمون</strong></div>
                    <div className="doc-info">
                        <span>برقية رقم: </span>
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
                        سعادة المدير العام الدفاع المدني بالتكليف<br />
                        العميد الركن عماد خريش <span className="hierarchy">بالتراتبيه</span>
                    </h1>
                    <p className="subtitle">
                        ارفع لسعادتكم جدول بالمهمات والخدمات المنفذة في المركز خلال شهر {getMonthName()}
                    </p>
                </div>
            </div>
            {missions.length === 0 ? (
                <p>لا توجد مهمات مسجلة</p>
            ) : (
                <table className='mission-table'>
                    <thead>
                        <tr>
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
                        <tr>
                            <th>اسعاف - اطفاء</th>
                            <th>خدمة عامة</th>
                            <th>الذهاب</th>
                            <th>الإياب</th>
                        </tr>
                    </thead>
                    <tbody>
                        {missions.map(mission => (
                            <tr key={mission._id}>
                                <td>{new Date(mission.startTime).toLocaleDateString('ar-LB')}</td>
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
                                <td>{mission.participants.map(p => p.user.name).join('، ')}</td>
                                <td>{new Date(mission.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}</td>
                                <td>{new Date(mission.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}</td>
                                <td>{Array.isArray(mission.vehicleNumbers)
                                    ? mission.vehicleNumbers.join(', ')
                                    : mission.vehicleNumbers || ''}</td>
                                <td>{mission.notes || ' '}</td>
                                <td>
                                    {isCurrentMonth() && (
                                        <div className="action-buttons">
                                            <button onClick={() => handleEditMission(mission)} className="btn-edit-small">
                                                تعديل
                                            </button>
                                            <button onClick={() => confirmDelete(mission._id)} className="btn-delete-small">
                                                حذف
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
                        if (!deletingMission) { // ✅ Only allow cancel if not deleting
                            setShowConfirmDelete(false);
                            setMissionToDelete(null);
                        }
                    }}
                    loading={deletingMission} // ✅ Pass loading state to modal
                />
            )}

            {showAlert && (
                <CustomAlert
                    message={alertMessage}
                    onClose={() => setShowAlert(false)}
                    type={alertType} // ✅ Use alertType from state
                />
            )}
        </div>
    );
};

export default Missions;