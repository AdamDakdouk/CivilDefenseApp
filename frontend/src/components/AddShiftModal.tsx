import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { searchUsers, getUsers } from '../services/api';
import DateTimePicker from './DateTimePicker';
import { useMonth } from '../contexts/MonthContext';
import './Modal.css';
import CustomAlert from './CustomAlert';

interface Participant {
    userId: string;
    name: string;
    checkIn: string;   // YYYY-MM-DDTHH:mm format
    checkOut: string;  // YYYY-MM-DDTHH:mm format
}

interface AddShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (shiftData: any) => void;
    editMode?: boolean;
    initialData?: any;
    existingShifts?: any[]; // Array of existing shifts to check for duplicates
}


const AddShiftModal: React.FC<AddShiftModalProps> = ({ isOpen, onClose, onSave, editMode = false, initialData, existingShifts = [] }) => {
    const getToday = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const { activeMonth, activeYear, selectedMonth } = useMonth();
    const today = getToday();
    const [date, setDate] = useState(initialData?.date || today);
    const [team, setTeam] = useState<'1' | '2' | '3'>(initialData?.team || '1');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [initialLoad, setInitialLoad] = useState(true);
    const prevDateRef = useRef<string | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'error' | 'success' | 'warning' | 'info'>('info');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastMonthEndTeam, setLastMonthEndTeam] = useState<'1' | '2' | '3'>('3'); // Default to '3'

    const sortParticipants = (participantsList: Participant[]) => {
        return participantsList.sort((a, b) => {
            const userA = allUsers.find(u => u._id === a.userId);
            const userB = allUsers.find(u => u._id === b.userId);

            if (!userA || !userB) return 0;

            const rolePriority: { [key: string]: number } = {
                'head': 1,
                'administrative staff': 2,
                'employee': 3,
                'volunteer': 4
            };

            const priorityA = rolePriority[userA.role] || 5;
            const priorityB = rolePriority[userB.role] || 5;

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            return userA.name.localeCompare(userB.name, 'ar');
        });
    };

    // Helper: Update participant dates when shift date changes
    const updateParticipantDates = (newShiftDate: string, currentParticipants: Participant[]) => {
        return currentParticipants.map(p => {
            // Extract time from existing check-in/check-out
            const checkInTime = p.checkIn.split('T')[1] || '08:00';
            const checkOutTime = p.checkOut.split('T')[1] || '08:00';
            
            // Calculate next day for checkout
            const nextDay = new Date(newShiftDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
            
            return {
                ...p,
                checkIn: `${newShiftDate}T${checkInTime}`,
                checkOut: `${nextDayStr}T${checkOutTime}`
            };
        });
    };

    // Helper: Validate datetime change (allow day change, block month/year change)
    const validateDateTimeChange = (newDatetime: string, shiftDate: string): boolean => {
        const newDate = new Date(newDatetime.split('T')[0]);
        const shiftDateObj = new Date(shiftDate);
        
        // Check if shift is on the last day of the month
        const lastDayOfMonth = new Date(shiftDateObj.getFullYear(), shiftDateObj.getMonth() + 1, 0).getDate();
        const isLastDayOfMonth = shiftDateObj.getDate() === lastDayOfMonth;
        
        if (isLastDayOfMonth) {
            // Allow same month OR next month only
            const shiftMonth = shiftDateObj.getMonth();
            const shiftYear = shiftDateObj.getFullYear();
            const newMonth = newDate.getMonth();
            const newYear = newDate.getFullYear();
            
            const isSameMonth = (newMonth === shiftMonth && newYear === shiftYear);
            const isNextMonth = (
                (newMonth === shiftMonth + 1 && newYear === shiftYear) || // Next month same year
                (newMonth === 0 && shiftMonth === 11 && newYear === shiftYear + 1) // Dec -> Jan
            );
            
            return isSameMonth || isNextMonth;
        } else {
            // Not last day - must be same month/year
            return newDate.getMonth() === shiftDateObj.getMonth() && 
                   newDate.getFullYear() === shiftDateObj.getFullYear();
        }
    };

    useEffect(() => {
        fetchAllUsers();
        fetchSettings();
    }, []);

    useEffect(() => {
        if (allUsers.length > 0 && initialLoad) {
            if (editMode && initialData?.participants) {
                setParticipants(sortParticipants(initialData.participants));
            } else {
                autoFillEmployees(team);
            }
            setInitialLoad(false);
        }
    }, [allUsers]);

    useEffect(() => {
        if (!editMode && !initialLoad) {
            autoFillEmployees(team);
        }
    }, [team]);

    useEffect(() => {
        if (isOpen && !editMode && date) {
            const defaultDate = `${activeYear}-${String(activeMonth).padStart(2, '0')}-01`;
            setDate(defaultDate);
        }
    }, [isOpen, activeMonth, activeYear, editMode]);

    useEffect(() => {
        if (!editMode && date && participants.length > 0) {
            setParticipants(prev => updateParticipantDates(date, prev));
        }
    }, [date, editMode]);

    useEffect(() => {
        if (!date) return;

        const selectedDate = new Date(date);
        const dayOfWeek = selectedDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const wasWeekend = prevDateRef.current ? new Date(prevDateRef.current).getDay() === 0 || new Date(prevDateRef.current).getDay() === 6 : false;

        if (isWeekend && !wasWeekend) {
            setParticipants(prevParticipants =>
                prevParticipants.filter(p => {
                    const user = allUsers.find(u => u._id === p.userId);
                    return user && user.role !== 'head' && user.role !== 'administrative staff';
                })
            );
        }

        if (!isWeekend && wasWeekend && participants.length > 0) {
            const headAndAdmin = allUsers.filter(u =>
                u.role === 'head' || u.role === 'administrative staff'
            );

            const adminCheckIn = `${date}T08:00`;
            const adminCheckOut = `${date}T15:00`;

            const newParticipants = headAndAdmin
                .filter(person => !participants.some(p => p.userId === person._id))
                .map(person => ({
                    userId: person._id,
                    name: person.name,
                    checkIn: adminCheckIn,
                    checkOut: adminCheckOut
                }));

            if (newParticipants.length > 0) {
                setParticipants(prev => sortParticipants([...prev, ...newParticipants]));
            }
        }

        prevDateRef.current = date;
    }, [date, allUsers, participants]);

    // Auto-calculate team based on date and last month's end team
    useEffect(() => {
        if (date && lastMonthEndTeam) {
            const dayOfMonth = new Date(date).getDate();
            const monthStartTeam = ((parseInt(lastMonthEndTeam) % 3) + 1); // Team that starts this month
            const calculatedTeam = (((monthStartTeam + dayOfMonth - 2) % 3) + 1).toString() as '1' | '2' | '3';
            setTeam(calculatedTeam);
        }
    }, [date, lastMonthEndTeam]);

    useEffect(() => {
        if (team && !editMode) {
            const teamUsers = allUsers.filter(u =>
                u.team === team && (u.role === 'employee' || u.role === 'volunteer')
            );

            const isWeekend = date ? (new Date(date).getDay() === 0 || new Date(date).getDay() === 6) : false;
            const headAndAdmin = !isWeekend ? allUsers.filter(u =>
                u.role === 'head' || u.role === 'administrative staff'
            ) : [];

            const allRelevantUsers = [...headAndAdmin, ...teamUsers];

            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().split('T')[0];

            const updatedParticipants = allRelevantUsers.map(user => {
                const existing = participants.find(p => p.userId === user._id);

                if (existing) {
                    return existing;
                } else {
                    const isAdmin = user.role === 'head' || user.role === 'administrative staff';
                    const defaultCheckIn = date ? `${date}T08:00` : '';
                    const defaultCheckOut = date ? (isAdmin ? `${date}T15:00` : `${nextDayStr}T08:00`) : '';

                    return {
                        userId: user._id,
                        name: user.name,
                        checkIn: defaultCheckIn,
                        checkOut: defaultCheckOut
                    };
                }
            });

            setParticipants(sortParticipants(updatedParticipants));
        }
    }, [team, allUsers, date, editMode]);

    const fetchAllUsers = async () => {
        const users = await getUsers();
        setAllUsers(users);
    };

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings/active-month', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.lastMonthEndTeam) {
                setLastMonthEndTeam(data.lastMonthEndTeam);
            }
        } catch (error) {
            throw(error)
        }
    };

    const autoFillEmployees = (selectedTeam: '1' | '2' | '3') => {
        if (!date) return;

        const shiftDate = new Date(date);
        const dayOfWeek = shiftDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];

        const checkInStr = `${date}T08:00`;
        const checkOutStr = `${nextDayStr}T08:00`;
        const adminCheckOutStr = `${date}T15:00`;

        const allParticipants: Participant[] = [];

        if (!isWeekend) {
            const headAndAdminStaff = allUsers.filter(u =>
                u.role === 'head' || u.role === 'administrative staff'
            );

            headAndAdminStaff.forEach(person => {
                if (!allParticipants.find(p => p.userId === person._id)) {
                    allParticipants.push({
                        userId: person._id,
                        name: person.name,
                        checkIn: checkInStr,
                        checkOut: adminCheckOutStr
                    });
                }
            });
        }

        const teamEmployees = allUsers.filter(u =>
            u.role === 'employee' && u.team === selectedTeam
        );

        teamEmployees.forEach(emp => {
            if (!allParticipants.find(p => p.userId === emp._id)) {
                allParticipants.push({
                    userId: emp._id,
                    name: emp.name,
                    checkIn: checkInStr,
                    checkOut: checkOutStr
                });
            }
        });

        const teamVolunteers = allUsers.filter(u =>
            u.role === 'volunteer' && u.team === selectedTeam
        );

        teamVolunteers.forEach(vol => {
            allParticipants.push({
                userId: vol._id,
                name: vol.name,
                checkIn: checkInStr,
                checkOut: checkOutStr
            });
        });

        setParticipants(sortParticipants(allParticipants));
    };

    const validateDate = (dateString: string): boolean => {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length > 0) {
            const results = await searchUsers(query);
            setSearchResults(results);
            setShowSuggestions(true);
        } else {
            setSearchResults([]);
            setShowSuggestions(false);
        }
    };

    const addParticipant = (user: User) => {
        if (!participants.find(p => p.userId === user._id)) {
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;

            setParticipants([...participants, {
                userId: user._id,
                name: user.name,
                checkIn: date + 'T00:00',
                checkOut: nextDayStr + 'T00:00'
            }]);
        }
        setSearchQuery('');
        setShowSuggestions(false);
    };

    const removeParticipant = (userId: string) => {
        setParticipants(participants.filter(p => p.userId !== userId));
    };

    const updateParticipant = (userId: string, field: 'checkIn' | 'checkOut', value: string) => {
        // Validate that month/year didn't change inappropriately
        if (!validateDateTimeChange(value, date)) {
            // Check if shift is on last day to provide appropriate error message
            const shiftDateObj = new Date(date);
            const lastDayOfMonth = new Date(shiftDateObj.getFullYear(), shiftDateObj.getMonth() + 1, 0).getDate();
            const isLastDayOfMonth = shiftDateObj.getDate() === lastDayOfMonth;
            
            if (isLastDayOfMonth) {
                setAlertMessage('يمكنك تغيير الشهر فقط إلى الشهر الحالي أو الشهر التالي');
            } else {
                setAlertMessage('لا يمكن تغيير الشهر أو السنة، يمكنك تغيير اليوم فقط');
            }
            setAlertType('warning');
            setShowAlert(true);
            return;
        }
        
        setParticipants(participants.map(p =>
            p.userId === userId ? { ...p, [field]: value } : p
        ));
    };

    const handleSubmit = async () => {
        if (!date || participants.length === 0) {
            setAlertMessage('يرجى ملء جميع الحقول');
            setAlertType('error')
            setShowAlert(true);
            return;
        }

        const invalidParticipant = participants.find(p => !p.checkIn || !p.checkOut);
        if (invalidParticipant) {
            setAlertMessage('يرجى إدخال أوقات الدخول والخروج لجميع المشاركين');
            setAlertType('error')
            setShowAlert(true);
            return;
        }

        // Check for duplicate shift on the same date (only when adding, not editing)
        if (!editMode) {
            const duplicateShift = existingShifts.find(shift => shift.date === date);
            if (duplicateShift) {
                setAlertMessage('يوجد مناوبة في هذا التاريخ');
                setAlertType('warning');
                setShowAlert(true);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await onSave({
                ...(editMode && initialData?._id ? { id: initialData._id } : {}),
                date,
                team,
                participants: participants.map(p => ({
                    userId: p.userId,
                    checkIn: p.checkIn,
                    checkOut: p.checkOut
                })),
                createdBy: '674c8f9e8e7b4c001234abcd'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content shift-modal" onClick={(e) => e.stopPropagation()}>
                <h2>{editMode ? 'تعديل المناوبة' : 'إضافة مناوبة جديدة'}</h2>

                <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                        const newDate = e.target.value;
                        if (validateDate(newDate)) {
                            const selectedDate = new Date(newDate);
                            const dateMonth = selectedDate.getMonth() + 1;
                            const dateYear = selectedDate.getFullYear();

                            if (dateMonth === activeMonth && dateYear === activeYear) {
                                setDate(newDate);
                                setParticipants(updateParticipantDates(newDate, participants));
                            } else {
                                setAlertMessage(`يمكنك فقط إضافة مناوبات في الشهر النشط (${activeMonth}/${activeYear})`);
                                setAlertType('error')
                                setShowAlert(true);
                            }
                        }
                    }}
                    min={`${activeYear}-${String(activeMonth).padStart(2, '0')}-01`}
                    max={`${activeYear}-${String(activeMonth).padStart(2, '0')}-${new Date(activeYear, activeMonth, 0).getDate()}`}
                />

                <div className="form-group shift-form-group">
                    <label>الفريق</label>
                    <select value={team} onChange={(e) => setTeam(e.target.value as '1' | '2' | '3')}>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                </div>

                <div className="form-group shift-form-group">
                    <label>إضافة مشارك إضافي</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="ابحث عن اسم متطوع..."
                        />
                        {showSuggestions && searchResults.length > 0 && (
                            <div className="suggestions">
                                {searchResults.map(user => (
                                    <div
                                        key={user._id}
                                        className="suggestion-item"
                                        onClick={() => addParticipant(user)}
                                    >
                                        {user.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {participants.length > 0 && (
                    <div className="participants-list shift-participants-list">
                        <h3>المشاركون</h3>
                        {participants
                            .filter(p => {
                                const user = allUsers.find(u => u._id === p.userId);
                                return user && user.role !== 'employee' && user.role !== 'head' && user.role !== 'administrative staff';
                            }).map(p => (
                                <div key={p.userId} className="participant-datetime-row shift-participant-row">
                                    <span className="participant-name shift-participant-name">{p.name}</span>
                                    <div className="datetime-inputs shift-datetime-inputs">
                                        <DateTimePicker
                                            label="وقت الدخول"
                                            value={p.checkIn}
                                            onChange={(datetime) => updateParticipant(p.userId, 'checkIn', datetime)}
                                        />
                                        <DateTimePicker
                                            label="وقت الخروج"
                                            value={p.checkOut}
                                            onChange={(datetime) => updateParticipant(p.userId, 'checkOut', datetime)}
                                        />
                                    </div>
                                    <button onClick={() => removeParticipant(p.userId)} className="btn-remove shift-btn-remove">
                                        حذف
                                    </button>
                                </div>
                            ))}
                    </div>
                )}

                <div className="modal-actions">
                    <button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'جاري الحفظ...' : editMode ? 'تحديث' : 'حفظ'}</button>
                    <button onClick={onClose} className="btn-cancel" disabled={isSubmitting}>إلغاء</button>
                </div>
            </div>

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

export default AddShiftModal;