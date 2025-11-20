import React, { useEffect, useState } from 'react';
import { getShifts, getShiftsByMonth, getAvailableShiftMonths, createShift, updateShift, deleteShift } from '../services/api';
import { Shift } from '../types';
import AddShiftModal from '../components/AddShiftModal';
import ConfirmModal from '../components/ConfirmModal';
import { useMonth } from '../contexts/MonthContext';
import CustomAlert from '../components/CustomAlert';
import { formatDateArabic } from '../utils/timeUtils';
import './Shifts.css';

const Shifts: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<string | null>(null);
  const { selectedMonth, setSelectedMonth, activeMonth, activeYear } = useMonth();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'success' | 'warning' | 'info'>('info');
  const [deletingShift, setDeletingShift] = useState(false);
  const [teamFilter, setTeamFilter] = useState<'all' | '1' | '2' | '3'>('all'); // ✅ Add this

  useEffect(() => {
    fetchShifts();
  }, [selectedMonth]);

  const fetchShifts = async () => {
    try {
      let data;
      if (selectedMonth === 'current') {
        data = await getShifts();
      } else {
        const [month, year] = selectedMonth.split('-').map(Number);
        data = await getShiftsByMonth(month, year);
      }
      setShifts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      setLoading(false);
    }
  };

  const handleSaveMission = async (shiftData: any) => {
    if (editingShift) {
      await handleUpdateShift(shiftData);
    } else {
      try {
        await createShift(shiftData);
        setShowModal(false);
        fetchShifts();
      } catch (error: any) {
        console.error('Error creating shift:', error);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        console.error('Error response data:', error.response?.data);
        console.error('Error response status:', error.response?.status);
        console.error('Error message:', error.message);
        console.error('Shift data sent:', shiftData);
        const errorMsg = error.response?.data?.message || error.message || 'حدث خطأ أثناء إضافة المناوبة';
        setAlertMessage(errorMsg);
        setAlertType('warning');
        setShowAlert(true);
      }
    }
  };

  const handleEditShift = (shift: Shift) => {
    // No formatting needed! Backend already sends data in Civil Defense Clock format
    // date: "YYYY-MM-DD", checkIn: "HH:mm", checkOut: "HH:mm"
    const formattedShift = {
      ...shift,
      date: shift.date,
      participants: shift.participants.map(p => {
        const checkIn = `${shift.date}T${p.checkIn}`;

        // detect next-day checkout
        const checkOutDate = new Date(shift.date);
        if (p.checkOut <= p.checkIn) {
          checkOutDate.setDate(checkOutDate.getDate() + 1);
        }
        const checkOutDateStr = checkOutDate.toISOString().split('T')[0];

        return {
          userId: p.user._id,
          name: p.user.name,
          checkIn,
          checkOut: `${checkOutDateStr}T${p.checkOut}`
        };
      })
    };
    setEditingShift(formattedShift);
    setShowModal(true);
  };

  const handleUpdateShift = async (shiftData: any) => {
    try {
      await updateShift(shiftData.id, shiftData);
      setShowModal(false);
      setEditingShift(null);
      fetchShifts();
    } catch (error) {
      console.error('Error updating shift:', error);
      setAlertMessage('حدث خطأ أثناء تحديث المناوبة');
      setAlertType('warning');
      setShowAlert(true);
    }
  };

  const handleDeleteShift = async () => {
    if (shiftToDelete && !deletingShift) { // ✅ Check if not already deleting
      setDeletingShift(true); // ✅ Set deleting state
      try {
        await deleteShift(shiftToDelete);
        fetchShifts();
        setShowConfirmDelete(false);
        setShiftToDelete(null);
        setAlertMessage('تم حذف المناوبة بنجاح');
        setAlertType('success');
        setShowAlert(true);
      } catch (error) {
        console.error('Error deleting shift:', error);
        setAlertMessage('حدث خطأ أثناء حذف المناوبة');
        setAlertType('warning');
        setShowAlert(true);
      } finally {
        setDeletingShift(false);
      }
    }
  };

  const confirmDelete = (shiftId: string) => {
    setShiftToDelete(shiftId);
    setShowConfirmDelete(true);
  };

  const formatTime = (timeString: string) => {
    // Time is already in HH:mm format, return as-is
    return timeString;
  };

  const isCurrentMonth = () => {
    const [month, year] = selectedMonth.split('-').map(Number);
    return month === activeMonth && year === activeYear;
  };

  // Filter shifts based on selected team
  const filteredShifts = teamFilter === 'all'
    ? shifts
    : shifts.filter(shift => shift.team === teamFilter);

  if (loading) {
    return <div className="container">جاري التحميل...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2 className="page-title">المناوبات</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value as 'all' | '1' | '2' | '3')}
            style={{
              fontSize: '15px',
              cursor: 'pointer',
              backgroundColor: '#bfbebeff',
              width: '85px',
            }}
          >
            <option value="all">الكل</option>
            <option value="1">الفريق 1</option>
            <option value="2">الفريق 2</option>
            <option value="3">الفريق 3</option>
          </select>
          {isCurrentMonth() && (
            <button onClick={() => { setEditingShift(null); setShowModal(true); }}>
              إضافة مناوبة
            </button>
          )}
        </div>
      </div>

      {filteredShifts.length === 0 ? (
        <p>لا توجد مناوبات مسجلة</p>
      ) : (
        filteredShifts.map(shift => (
          <div key={shift._id} className="shift-card">
            <div className="shift-header">
              <h3 className="shift-date">{formatDateArabic(shift.date)}</h3>
              {isCurrentMonth() && (
                <div className="shift-actions">
                  <button onClick={() => handleEditShift(shift)} className="btn-edit">
                    تعديل
                  </button>
                  <button onClick={() => confirmDelete(shift._id)} className="btn-delete">
                    حذف
                  </button>
                </div>
              )}
            </div>
            <table>
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>وقت الدخول</th>
                  <th>وقت الخروج</th>
                  <th>ساعات العمل</th>
                </tr>
              </thead>
              <tbody>
                {[...shift.participants]
                  .sort((a, b) => {
                    // Sort order: employee/head/admin first, then volunteers
                    const roleOrder: any = {
                      'employee': 1,
                      'head': 2,
                      'administrative staff': 3,
                      'volunteer': 4
                    };
                    return roleOrder[a.user.role] - roleOrder[b.user.role];
                  })
                  .filter(p => {
                    const user = p.user;
                    // Hide employees, head, and admin staff from the list
                    return user && user.role !== 'employee' && user.role !== 'head' && user.role !== 'administrative staff';
                  })
                  .map((participant, index) => (
                    <tr key={index}>
                      <td>{participant.user.name}</td>
                      <td>{formatTime(participant.checkIn)}</td>
                      <td>{formatTime(participant.checkOut)}</td>
                      <td>{participant.hoursServed}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        ))
      )}

      {showModal && (
        <AddShiftModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setEditingShift(null); }}
          onSave={handleSaveMission}
          editMode={!!editingShift}
          initialData={editingShift}
          existingShifts={shifts}
        />
      )}

      {showConfirmDelete && (
        <ConfirmModal
          message="هل أنت متأكد من حذف هذه المناوبة؟"
          onConfirm={handleDeleteShift}
          onCancel={() => {
            if (!deletingShift) { // ✅ Only allow cancel if not deleting
              setShowConfirmDelete(false);
              setShiftToDelete(null);
            }
          }}
          loading={deletingShift} // ✅ Pass loading state to modal
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

export default Shifts;