import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { searchUsers, getUsers } from '../services/api';
import TimePicker from './TimePicker';
import './Modal.css';
import { useMonth } from '../contexts/MonthContext';
import CustomAlert from './CustomAlert';

interface Participant {
    userId: string;
    name: string;
}

interface AddMissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (missionData: any) => void;
    editMode?: boolean;
    initialData?: any;
}

const AddMissionModal: React.FC<AddMissionModalProps> = ({ isOpen, onClose, onSave, editMode = false, initialData }) => {
    const getToday = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const { activeMonth, activeYear, selectedMonth } = useMonth();
    const today = getToday();
    const [referenceNumber, setReferenceNumber] = useState(initialData?.referenceNumber || '');
    const [vehicleNumbers, setVehicleNumbers] = useState<string[]>(() => {
        if (!initialData?.vehicleNumbers) return [];
        if (Array.isArray(initialData.vehicleNumbers)) return initialData.vehicleNumbers;
        if (typeof initialData.vehicleNumbers === 'string') return initialData.vehicleNumbers.split(', ').filter(Boolean);
        return [];
    });
    const [startTime, setStartTime] = useState(initialData?.startTime || `${today}T08:00`);
    const [endTime, setEndTime] = useState(initialData?.endTime || `${today}T20:00`);
    const [location, setLocation] = useState(initialData?.location || '');
    const [missionType, setMissionType] = useState<'fire' | 'rescue' | 'medic' | 'public-service' | 'misc'>(initialData?.missionType || 'fire');
    const [missionDetails, setMissionDetails] = useState(initialData?.missionDetails || '');
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [team, setTeam] = useState<'1' | '2' | '3'>(initialData?.team || '1');
    const [participants, setParticipants] = useState<Participant[]>(initialData?.participants || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'error' | 'success' | 'warning' | 'info'>('info');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchAllUsers();
    }, []);

    useEffect(() => {
        if (allUsers.length > 0 && !editMode) {
            autoFillTeamEmployees(team);
        }
    }, [team, allUsers]);

    useEffect(() => {
        if (isOpen && !editMode) {
            // Only set defaults when ADDING (not editing)
            const defaultDate = `${activeYear}-${String(activeMonth).padStart(2, '0')}-01`;
            const defaultStart = `${defaultDate}T08:00`;
            const defaultEnd = `${defaultDate}T10:00`;
            setStartTime(defaultStart);
            setEndTime(defaultEnd);
        }
    }, [isOpen, activeMonth, editMode]);

    const fetchAllUsers = async () => {
        const users = await getUsers();
        setAllUsers(users);
    };

    const autoFillTeamEmployees = (selectedTeam: '1' | '2' | '3') => {
        const teamEmployees = allUsers.filter(u =>
            u.role === 'employee' && u.team === selectedTeam
        );

        const employeeParticipants: Participant[] = teamEmployees.map(emp => ({
            userId: emp._id,
            name: emp.name
        }));

        setParticipants(employeeParticipants);
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
            setParticipants([...participants, {
                userId: user._id,
                name: user.name
            }]);
        }
        setSearchQuery('');
        setShowSuggestions(false);
    };

    const removeParticipant = (userId: string) => {
        setParticipants(participants.filter(p => p.userId !== userId));
    };

    const handleSubmit = async () => {
    const newErrors: { [key: string]: boolean } = {};

    if (!referenceNumber) newErrors.referenceNumber = true;
    if (vehicleNumbers.length === 0) newErrors.vehicleNumber = true;
    if (!location) newErrors.location = true;
    if (!missionDetails) newErrors.missionDetails = true;
    if (participants.length === 0) newErrors.participants = true;

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);

        // Scroll to first error
        const firstErrorField = Object.keys(newErrors)[0];
        const element = document.querySelector(`[data-field="${firstErrorField}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
        await onSave({
            ...(editMode && initialData?._id ? { id: initialData._id } : {}),
            referenceNumber,
            vehicleNumbers: vehicleNumbers.join(', '),
            startTime, // Send as-is: "2025-11-13T08:00"
            endTime,   // Send as-is: "2025-11-13T10:00"
            location,
            missionType,
            missionDetails,
            notes,
            team,
            participants,
            createdBy: '674c8f9e8e7b4c001234abcd'
        });
    } finally {
        setIsSubmitting(false);
    }
};

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-large mission-modal" onClick={(e) => e.stopPropagation()}>
                <h2>{editMode ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}</h2>

                <div className="form-row mission-form-row">
                    {/* Date Selection */}
                    <div className="form-group mission-form-group">
                        <label>التاريخ *</label>
                        <input
                            type="date"
                            value={startTime.split('T')[0]}
                            onChange={(e) => {
                                const newDate = e.target.value;
                                const selectedDate = new Date(newDate);
                                const dateMonth = selectedDate.getMonth() + 1;
                                const dateYear = selectedDate.getFullYear();

                                // Only allow dates in active month
                                if (dateMonth === activeMonth && dateYear === activeYear) {
                                    const currentStartTime = startTime.split('T')[1] || '08:00';
                                    const currentEndTime = endTime.split('T')[1] || '10:00';
                                    setStartTime(`${newDate}T${currentStartTime}`);
                                    setEndTime(`${newDate}T${currentEndTime}`);
                                } else {
                                    setAlertMessage(`يمكنك فقط إضافة مهمات في الشهر النشط (${activeMonth}/${activeYear})`);
                                    setAlertType('error')
                                    setShowAlert(true);
                                }
                            }}
                            min={`${activeYear}-${String(activeMonth).padStart(2, '0')}-01`}
                            max={`${activeYear}-${String(activeMonth).padStart(2, '0')}-${new Date(activeYear, activeMonth, 0).getDate()}`}
                        />
                    </div>
                    <div className="form-group mission-form-group">
                        <label className='required mission-required'>رقم البرقية</label>
                        <div className="input-wrapper mission-input-wrapper">
                            <input
                                type="text"
                                value={referenceNumber}
                                onChange={(e) => {
                                    setReferenceNumber(e.target.value);
                                    if (errors.referenceNumber) setErrors({ ...errors, referenceNumber: false });
                                }}
                                placeholder="أدخل رقم البرقية"
                                style={{ borderColor: errors.referenceNumber ? '#c41e3a' : '#ddd' }}
                                data-field="referenceNumber"
                            />
                            {errors.referenceNumber && <span className="error-icon mission-error-icon">⚠</span>}
                        </div>
                    </div>
                </div>

                <div className="form-group mission-form-group">
                    <label className="required mission-required">نوع المهمة</label>
                    <div className="radio-group mission-radio-group">
                        <label className="radio-label mission-radio-label">
                            <input
                                type="radio"
                                name="missionType"
                                value="fire"
                                checked={missionType === 'fire'}
                                onChange={(e) => setMissionType(e.target.value as 'fire')}
                            />
                            اطفاء
                        </label>
                        <label className="radio-label mission-radio-label">
                            <input
                                type="radio"
                                name="missionType"
                                value="rescue"
                                checked={missionType === 'rescue'}
                                onChange={(e) => setMissionType(e.target.value as 'rescue')}
                            />
                            انقاذ
                        </label>
                        <label className="radio-label mission-radio-label">
                            <input
                                type="radio"
                                name="missionType"
                                value="medic"
                                checked={missionType === 'medic'}
                                onChange={(e) => setMissionType(e.target.value as 'medic')}
                            />
                            اسعاف
                        </label>
                        <label className="radio-label mission-radio-label">
                            <input
                                type="radio"
                                name="missionType"
                                value="public-service"
                                checked={missionType === 'public-service'}
                                onChange={(e) => setMissionType(e.target.value as 'public-service')}
                            />
                            خدمة عامة
                        </label>
                        <label className="radio-label mission-radio-label">
                            <input
                                type="radio"
                                name="missionType"
                                value="misc"
                                checked={missionType === 'misc'}
                                onChange={(e) => setMissionType(e.target.value as 'misc')}
                            />
                            مختلف
                        </label>
                    </div>
                    <input
                        type="text"
                        value={missionDetails}
                        onChange={(e) => {
                            setMissionDetails(e.target.value);
                            if (errors.missionDetails) setErrors({ ...errors, missionDetails: false });
                        }}
                        placeholder="حدد تفاصيل المهمة"
                        style={{ marginTop: '10px', borderColor: errors.missionDetails ? '#c41e3a' : '#ddd' }}
                        data-field="missionDetails"
                    />
                </div>

                <div className="form-group mission-form-group">
                    <label className='required mission-required'>المكان</label>
                    <div className="input-wrapper mission-input-wrapper">
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => {
                                setLocation(e.target.value);
                                if (errors.location) setErrors({ ...errors, location: false });
                            }}
                            placeholder="أدخل المكان"
                            style={{ borderColor: errors.location ? '#c41e3a' : '#ddd' }}
                            data-field="location"
                        />
                        {errors.location && <span className="error-icon mission-error-icon">⚠</span>}
                    </div>
                </div>

                <div className="form-group mission-form-group">
                    <label>الفريق</label>
                    <select value={team} onChange={(e) => {
                        setTeam(e.target.value as '1' | '2' | '3');
                        if (errors.referenceNumber) setErrors({ ...errors, referenceNumber: false });
                    }}>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>

                    </select>
                </div>

                <div className="form-group mission-form-group">
                    <label className='required mission-required'>العناصر المنفذة</label>
                    <div style={{ position: 'relative' }}>
                        <div className="input-wrapper mission-input-wrapper">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    handleSearch(e.target.value);
                                    if (errors.referenceNumber) setErrors({ ...errors, referenceNumber: false });
                                }}
                                placeholder="ابحث عن اسم..."
                                style={{ borderColor: errors.participants ? '#c41e3a' : '#ddd' }}
                                data-field="participants"
                            />
                        </div>
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
                    {participants.length > 0 && (
                        <div className="selected-participants mission-selected-participants">
                            {participants.map(p => (
                                <span key={p.userId} className="participant-tag mission-participant-tag">
                                    {p.name}
                                    <button onClick={() => removeParticipant(p.userId)} className="remove-tag mission-remove-tag">×</button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <TimePicker
                    label="الذهاب"
                    value={startTime.split('T')[1] || '08:00'}
                    onChange={(time) => {
                        const date = startTime.split('T')[0] || today;
                        setStartTime(`${date}T${time}`);
                    }}
                />

                <TimePicker
                    label="الإياب"
                    value={endTime.split('T')[1] || '08:00'}
                    onChange={(time) => {
                        const date = endTime.split('T')[0] || startTime.split('T')[0] || today;
                        setEndTime(`${date}T${time}`);
                    }}
                />

                <div className="form-group mission-form-group">
                    <label className='required mission-required'>نوع الآلية</label>
                    <div className="radio-group mission-radio-group">
                        <label className="radio-label mission-radio-label">
                            <input
                                type="checkbox"
                                value="921306"
                                checked={vehicleNumbers.includes("921306")}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setVehicleNumbers([...vehicleNumbers, "921306"]);
                                    } else {
                                        setVehicleNumbers(vehicleNumbers.filter(v => v !== "921306"));
                                    }
                                    if (errors.vehicleNumber) setErrors({ ...errors, vehicleNumber: false });
                                }}
                            />
                            Renault
                        </label>
                        <label className="radio-label mission-radio-label">
                            <input
                                type="checkbox"
                                value="921034"
                                checked={vehicleNumbers.includes("921034")}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setVehicleNumbers([...vehicleNumbers, "921034"]);
                                    } else {
                                        setVehicleNumbers(vehicleNumbers.filter(v => v !== "921034"));
                                    }
                                    if (errors.vehicleNumber) setErrors({ ...errors, vehicleNumber: false });
                                }}
                            />
                            Envoy
                        </label>
                        <label className="radio-label mission-radio-label">
                            <input
                                type="checkbox"
                                value="921269"
                                checked={vehicleNumbers.includes("921269")}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setVehicleNumbers([...vehicleNumbers, "921269"]);
                                    } else {
                                        setVehicleNumbers(vehicleNumbers.filter(v => v !== "921269"));
                                    }
                                    if (errors.vehicleNumber) setErrors({ ...errors, vehicleNumber: false });
                                }}
                            />
                            Rio
                        </label>
                    </div>
                    {vehicleNumbers.length > 0 && (
                        <div className="selected-participants mission-selected-participants" style={{ marginTop: '10px' }}>
                            {vehicleNumbers.map(vNum => {
                                const vehicleNames: { [key: string]: string } = {
                                    "921306": "Renault",
                                    "921034": "Envoy",
                                    "921269": "Rio"
                                };
                                return (
                                    <span key={vNum} className="participant-tag mission-participant-tag">
                                        {vehicleNames[vNum] || vNum}
                                        <button
                                            onClick={() => {
                                                setVehicleNumbers(vehicleNumbers.filter(v => v !== vNum));
                                            }}
                                            className="remove-tag mission-remove-tag"
                                        >×</button>
                                    </span>
                                );
                            })}
                        </div>
                    )}
                    {errors.vehicleNumber && <span className="error-icon mission-error-icon" style={{ position: 'static', marginTop: '5px', display: 'block' }}>⚠ يرجى اختيار آلية واحدة على الأقل</span>}
                </div>

                <div className="form-group mission-form-group">
                    <label>ملاحظات</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="أدخل ملاحظات إضافية (اختياري)"
                        rows={3}
                    />
                </div>

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
        </div >
    );
};

export default AddMissionModal;