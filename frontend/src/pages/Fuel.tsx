import React, { useEffect, useState } from 'react';
import { getFuelByMonth, getFuelStations, createFuelEntries, updateFuelEntry, deleteFuelEntry } from '../services/api';
import { FuelEntry } from '../types';
import AddFuelModal from '../components/AddFuelModal';
import ConfirmModal from '../components/ConfirmModal';
import CustomAlert from '../components/CustomAlert';
import { useMonth } from '../contexts/MonthContext';
import { getCurrentDate } from '../utils/timeUtils';
import './Fuel.css';
import './Fuel.print.css';

const MONTH_NAMES = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];

const TYPE_LABELS = { jeep: 'جيب', fire: 'اطفاء' };
const FUEL_LABELS = { gasoline: 'بنزين', diesel: 'مازوت' };

// YYYY-MM-DD -> DD-MM-YYYY (as written on the paper sheet)
const formatDMY = (date: string): string => {
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
};

const Fuel: React.FC = () => {
    const [entries, setEntries] = useState<FuelEntry[]>([]);
    const [stations, setStations] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState<FuelEntry | null>(null);
    const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [docNumber, setDocNumber] = useState('');
    const [docDate, setDocDate] = useState(getCurrentDate());
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'error' | 'success' | 'warning' | 'info'>('info');
    const { selectedMonth, activeMonth, activeYear } = useMonth();

    useEffect(() => {
        if (selectedMonth) {
            fetchEntries();
        }
    }, [selectedMonth]);

    const fetchEntries = async () => {
        try {
            const [month, year] = selectedMonth.split('-').map(Number);
            setEntries(await getFuelByMonth(month, year));
        } catch (error) {
            console.error('Error fetching fuel entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = async () => {
        try {
            setStations(await getFuelStations());
        } catch (error) {
            setStations([]);
        }
        setEditingEntry(null);
        setShowModal(true);
    };

    const openEditModal = async (entry: FuelEntry) => {
        try {
            setStations(await getFuelStations());
        } catch (error) {
            setStations([]);
        }
        setEditingEntry(entry);
        setShowModal(true);
    };

    // Throws on failure so the modal can show the server message
    const handleSave = async (payload: any) => {
        if (editingEntry) {
            await updateFuelEntry(editingEntry._id, payload);
        } else {
            await createFuelEntries(payload);
        }
        setShowModal(false);
        setEditingEntry(null);
        fetchEntries();
    };

    const handleDelete = async () => {
        if (!entryToDelete || deleting) return;
        setDeleting(true);
        try {
            await deleteFuelEntry(entryToDelete);
            setEntryToDelete(null);
            fetchEntries();
            setAlertMessage('تم حذف القسيمة بنجاح');
            setAlertType('success');
            setShowAlert(true);
        } catch (error) {
            setAlertMessage('حدث خطأ أثناء حذف القسيمة');
            setAlertType('warning');
            setShowAlert(true);
        } finally {
            setDeleting(false);
        }
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

    const [month, year] = selectedMonth.split('-').map(Number);
    const isCurrentMonth = month === activeMonth && year === activeYear;
    const monthName = `${MONTH_NAMES[month - 1]} ${year}`;

    const gasolineTotal = entries.filter(e => e.fuelType === 'gasoline').reduce((sum, e) => sum + e.liters, 0);
    const dieselTotal = entries.filter(e => e.fuelType === 'diesel').reduce((sum, e) => sum + e.liters, 0);

    return (
        <div className="container fuel-page-print">
            <div className="page-header">
                <div>
                    <h2 className="fuel-title">المحروقات</h2>
                    <div className="fuel-subtitle-line">خلال شهر {monthName}</div>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button onClick={() => window.print()} className="export-btn">
                        <span style={{ fontSize: '14px' }}>طباعة الجدول</span>
                    </button>
                    {isCurrentMonth && (
                        <button className="btn-add" onClick={openAddModal}>
                            إضافة محروقات
                        </button>
                    )}
                </div>
            </div>

            {entries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">⛽</div>
                    <p className="empty-message">لا توجد قسائم محروقات مسجلة</p>
                    {isCurrentMonth && <p className="empty-hint">قم بإضافة محروقات جديدة للبدء</p>}
                </div>
            ) : (
                <>
                    {/* Screen view (never printed) */}
                    <div className="screen-only fuel-screen">
                        <div className="print-meta">
                            <span className="print-meta-title">بيانات الطباعة</span>
                            <label className="print-meta-field">
                                <span>الرقم</span>
                                <input
                                    type="text"
                                    value={docNumber}
                                    onChange={(e) => setDocNumber(e.target.value)}
                                    placeholder="..."
                                />
                            </label>
                            <label className="print-meta-field">
                                <span>التاريخ</span>
                                <input
                                    type="date"
                                    value={docDate}
                                    onChange={(e) => setDocDate(e.target.value)}
                                />
                            </label>
                        </div>

                        <div className="fuel-list-wrap">
                            <table className="fuel-list-table">
                                <thead>
                                    <tr>
                                        <th>التاريخ</th>
                                        <th>رقم القسيمة</th>
                                        <th>المحطة</th>
                                        <th>الآلية</th>
                                        <th>النوع</th>
                                        <th>الوقود</th>
                                        <th>الكمية</th>
                                        <th>العداد</th>
                                        {isCurrentMonth && <th></th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map(entry => (
                                        <tr key={entry._id}>
                                            <td className="nowrap">{formatDMY(entry.date)}</td>
                                            <td className="nowrap num">{entry.voucherNumber}</td>
                                            <td>{entry.stationName}</td>
                                            <td>
                                                <div className="vehicle-cell">
                                                    <span>{entry.vehicleName}</span>
                                                    <span className="vehicle-plate-sub">{entry.vehiclePlate}</span>
                                                </div>
                                            </td>
                                            <td className="center">
                                                <span className={`fuel-badge type-${entry.vehicleType}`}>{TYPE_LABELS[entry.vehicleType]}</span>
                                            </td>
                                            <td className="center">
                                                <span className={`fuel-badge fuel-${entry.fuelType}`}>{FUEL_LABELS[entry.fuelType]}</span>
                                            </td>
                                            <td className="center num">{entry.liters} ل</td>
                                            <td className="center num">{entry.odometer}</td>
                                            {isCurrentMonth && (
                                                <td>
                                                    <div className="action-buttons">
                                                        <button onClick={() => openEditModal(entry)} className="edit-btn">
                                                            <span className="gradient-text-edit">✎</span>
                                                        </button>
                                                        <button onClick={() => setEntryToDelete(entry._id)} className="delete-btn">
                                                            <span className="gradient-text-delete">🗑️</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Official sheet: only shown when printing */}
                    <div className="print-only fuel-sheet">
                        <div className="fuel-sheet-header">
                            <div className="fuel-sheet-right">
                                <div>الجمهورية اللبنانية</div>
                                <div>وزارة الداخلية والبلديات</div>
                                <div>المديرية العامة للدفاع المدني</div>
                                <div><strong>مركز عرمون</strong></div>
                            </div>
                            <div className="fuel-sheet-meta">
                                <span>رقم : {docNumber || '........'} د م ر ع /</span>
                                <span>التاريخ : <bdi dir="ltr">{formatDMY(docDate)}</bdi></span>
                            </div>
                        </div>

                        <table className="fuel-table">
                            <colgroup>
                                {Array.from({ length: 12 }, (_, i) => <col key={i} />)}
                            </colgroup>
                            <thead>
                                <tr>
                                    <th colSpan={12} className="fuel-title-cell">
                                        كشف عام المحروقات الخاصة بالآليات التابعة لمركز بعقلين الإقليمي عن شهر {MONTH_NAMES[month - 1]} سنة {year}
                                    </th>
                                </tr>
                                <tr>
                                    <th>الشهر</th>
                                    <th>المركز</th>
                                    <th>اسم المحطة</th>
                                    <th>نوع</th>
                                    <th>ماركة</th>
                                    <th>رقم الآلية</th>
                                    <th>بنزين</th>
                                    <th>مازوت</th>
                                    <th>رقم القسيمة</th>
                                    <th>تاريخ القسيمة</th>
                                    <th>العداد</th>
                                    <th>عسكري</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map(entry => (
                                    <tr key={entry._id}>
                                        <td></td>
                                        <td>عرمون</td>
                                        <td>{entry.stationName}</td>
                                        <td>{TYPE_LABELS[entry.vehicleType]}</td>
                                        <td>{entry.vehicleName}</td>
                                        <td>{entry.vehiclePlate}</td>
                                        <td>{entry.fuelType === 'gasoline' ? entry.liters : 0}</td>
                                        <td>{entry.fuelType === 'diesel' ? entry.liters : 0}</td>
                                        <td>{entry.voucherNumber}</td>
                                        <td>{formatDMY(entry.date)}</td>
                                        <td>{entry.odometer}</td>
                                        <td>نعم</td>
                                    </tr>
                                ))}
                                <tr className="fuel-spacer-row">
                                    {Array.from({ length: 12 }, (_, i) => <td key={i}></td>)}
                                </tr>
                                <tr className="fuel-total-row">
                                    <td colSpan={6}>مجموع المصروف :</td>
                                    <td>{gasolineTotal}</td>
                                    <td>{dieselTotal}</td>
                                    <td colSpan={4}></td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="fuel-sheet-footer">
                            <div className="fuel-footer-col fuel-footer-returned">
                                <div>بونات مرتجعة / بنزين :</div>
                            </div>
                            <div className="fuel-footer-col">
                                <div>عدد : ............</div>
                                <div>عدد : ............</div>
                            </div>
                            <div className="fuel-footer-col">
                                <div>قيمة القسيمة : ............</div>
                                <div>قيمة القسيمة : ............</div>
                            </div>
                            <div className="fuel-footer-col fuel-footer-total">
                                <div>إجمالي بنزين : ............ ليتر</div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {showModal && (
                <AddFuelModal
                    onClose={() => { setShowModal(false); setEditingEntry(null); }}
                    onSave={handleSave}
                    editMode={!!editingEntry}
                    initialData={editingEntry}
                    activeMonth={activeMonth}
                    activeYear={activeYear}
                    knownStations={stations}
                />
            )}

            {entryToDelete && (
                <ConfirmModal
                    message="هل أنت متأكد من حذف هذه القسيمة؟"
                    onConfirm={handleDelete}
                    onCancel={() => { if (!deleting) setEntryToDelete(null); }}
                    loading={deleting}
                />
            )}

            {showAlert && (
                <CustomAlert
                    message={alertMessage}
                    onClose={() => setShowAlert(false)}
                    type={alertType}
                />
            )}
        </div>
    );
};

export default Fuel;
