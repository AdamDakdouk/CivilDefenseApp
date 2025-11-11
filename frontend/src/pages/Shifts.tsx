import React, { useEffect, useState } from 'react';
import { getShifts, getShiftsByMonth, getAvailableShiftMonths, createShift, updateShift, deleteShift } from '../services/api';
import { Shift } from '../types';
import AddShiftModal from '../components/AddShiftModal';
import ConfirmModal from '../components/ConfirmModal';
import { useMonth } from '../contexts/MonthContext';
import CustomAlert from '../components/CustomAlert';
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
      } catch (error) {
        console.error('Error creating shift:', error);
        setAlertMessage('حدث خطأ أثناء إضافة المناوبة');
        setAlertType('warning');
        setShowAlert(true);
      }
    }
  };

  const handleEditShift = (shift: Shift) => {
    const formattedShift = {
      ...shift,
      date: new Date(shift.date).toISOString().split('T')[0],
      participants: shift.participants.map(p => {
        const checkInDate = new Date(p.checkIn);
        const checkOutDate = new Date(p.checkOut);

        // Format without timezone conversion
        const formatDateTime = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        return {
          userId: p.user._id,
          name: p.user.name,
          checkIn: formatDateTime(checkInDate),
          checkOut: formatDateTime(checkOutDate)
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
    if (shiftToDelete) {
      try {
        await deleteShift(shiftToDelete);
        fetchShifts();
        setShowConfirmDelete(false);
        setShiftToDelete(null);
      } catch (error) {
        console.error('Error deleting shift:', error);
        setAlertMessage('حدث خطأ أثناء حذف المناوبة');
        setAlertType('warning');
        setShowAlert(true);
      }
    }
  };

  const confirmDelete = (shiftId: string) => {
    setShiftToDelete(shiftId);
    setShowConfirmDelete(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-LB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const isCurrentMonth = () => {
    const [month, year] = selectedMonth.split('-').map(Number);
    return month === activeMonth && year === activeYear;
  };

  if (loading) {
    return <div className="container">جاري التحميل...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2 className="page-title">المناوبات</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {isCurrentMonth() && (
            <button onClick={() => { setEditingShift(null); setShowModal(true); }}>
              إضافة مناوبة
            </button>
          )}
        </div>
      </div>

      {shifts.length === 0 ? (
        <p>لا توجد مناوبات مسجلة</p>
      ) : (
        shifts.map(shift => (
          <div key={shift._id} className="shift-card">
            <div className="shift-header">
              <h3 className="shift-date">{formatDate(shift.date)}</h3>
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
        />
      )}

      {showConfirmDelete && (
        <ConfirmModal
          message="هل أنت متأكد من حذف هذه المناوبة؟"
          onConfirm={handleDeleteShift}
          onCancel={() => {
            setShowConfirmDelete(false);
            setShiftToDelete(null);
          }}
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