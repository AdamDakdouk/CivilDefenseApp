import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { searchUsers, getUsers } from '../services/api';
import TimePicker from './TimePicker';
import './Modal.css';
import { useMonth } from '../contexts/MonthContext';
import CustomAlert from './CustomAlert';
import { getCurrentDate } from '../utils/timeUtils';

interface Participant {
    userId: string;
    name: string;
    customStartTime?: string;  // HH:mm format (e.g., "08:00")
    customEndTime?: string;    // HH:mm format (e.g., "21:00")
    showCustomTimes?: boolean; // Flag to show/hide custom time inputs
}

interface AddMissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (missionData: any) => void;
    editMode?: boolean;
    initialData?: any;
}

const AddMissionModal: React.FC<AddMissionModalProps> = ({ isOpen, onClose, onSave, editMode = false, initialData }) => {
    const { activeMonth, activeYear, selectedMonth } = useMonth();
    const today = getCurrentDate(); // Use Civil Defense Clock
    const [referenceNumber, setReferenceNumber] = useState(initialData?.referenceNumber || '');
    const [vehicleNumbers, setVehicleNumbers] = useState<string[]>(() => {
        if (!initialData?.vehicleNumbers) return [];
        if (Array.isArray(initialData.vehicleNumbers)) return initialData.vehicleNumbers;
        if (typeof initialData.vehicleNumbers === 'string') return initialData.vehicleNumbers.split(', ').filter(Boolean);
        return [];
    });
    // Store date and times separately using Civil Defense Clock format
    const [missionDate, setMissionDate] = useState(initialData?.date || today);
    const [startTime, setStartTime] = useState(initialData?.startTime || '08:00');
    const [endTime, setEndTime] = useState(initialData?.endTime || '20:00');
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
            setMissionDate(defaultDate);
            setStartTime('08:00');
            setEndTime('10:00');
        }
    }, [isOpen, activeMonth, editMode]);

    useEffect(() => {
        if (editMode && initialData?.participants) {
            const transformedParticipants = initialData.participants.map((p: any) => ({
                userId: p.user._id || p.user,
                name: p.user.name || '',
                customStartTime: p.customStartTime,
                customEndTime: p.customEndTime,
                showCustomTimes: !!(p.customStartTime && p.customEndTime)
            }));
            setParticipants(transformedParticipants);
        }
    }, [editMode, initialData]);

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
            name: emp.name,
            showCustomTimes: false  // NEW: Initialize with custom times disabled
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
                name: user.name,
                showCustomTimes: false  // NEW: Initialize with custom times disabled
            }]);
        }
        setSearchQuery('');
        setShowSuggestions(false);
    };

    const removeParticipant = (userId: string) => {
        setParticipants(participants.filter(p => p.userId !== userId));
    };

    // Toggle custom times for a participant
    const toggleCustomTimes = (userId: string) => {
        setParticipants(participants.map(p => {
            if (p.userId === userId) {
                if (!p.showCustomTimes) {
                    // When enabling custom times, initialize with mission times (HH:mm only)
                    return {
                        ...p,
                        showCustomTimes: true,
                        customStartTime: startTime,
                        customEndTime: endTime
                    };
                } else {
                    // When disabling, remove custom times
                    return {
                        ...p,
                        showCustomTimes: false,
                        customStartTime: undefined,
                        customEndTime: undefined
                    };
                }
            }
            return p;
        }));
    };

    // Update custom start time for a participant (HH:mm format only)
    const updateCustomStartTime = (userId: string, time: string) => {
        setParticipants(participants.map(p => {
            if (p.userId === userId) {
                return {
                    ...p,
                    customStartTime: time
                };
            }
            return p;
        }));
    };

    // Update custom end time for a participant (HH:mm format only)
    const updateCustomEndTime = (userId: string, time: string) => {
        setParticipants(participants.map(p => {
            if (p.userId === userId) {
                return {
                    ...p,
                    customEndTime: time
                };
            }
            return p;
        }));
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

        // DEBUG: Check participants state before submission
        console.log('🔍 Participants state before submit:', participants);
        console.log('🔍 Mapped participants for API:', participants.map(p => ({
            userId: p.userId,
            showCustomTimes: p.showCustomTimes,
            customStartTime: p.customStartTime,
            customEndTime: p.customEndTime
        })));

        try {
            const payload = {
                ...(editMode && initialData?._id ? { id: initialData._id } : {}),
                referenceNumber,
                vehicleNumbers: vehicleNumbers.join(', '),
                date: missionDate,     // YYYY-MM-DD format
                startTime,             // HH:mm format
                endTime,               // HH:mm format
                location,
                missionType,
                missionDetails,
                notes,
                team,
                // Include custom times in participants if they exist (HH:mm format)
                participants: participants.map(p => ({
                    userId: p.userId,
                    // Only include custom times if they were set
                    ...(p.customStartTime && p.customEndTime ? {
                        customStartTime: p.customStartTime,
                        customEndTime: p.customEndTime
                    } : {})
                })),
                createdBy: '674c8f9e8e7b4c001234abcd'
            };

            console.log('🔍 Final payload being sent:', JSON.stringify(payload, null, 2));

            await onSave(payload);
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
                            value={missionDate}
                            onChange={(e) => {
                                const newDate = e.target.value;
                                const selectedDate = new Date(newDate);
                                const dateMonth = selectedDate.getMonth() + 1;
                                const dateYear = selectedDate.getFullYear();

                                // Only allow dates in active month
                                if (dateMonth === activeMonth && dateYear === activeYear) {
                                    setMissionDate(newDate);
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
                                onChange={(e) => {
                                    setMissionType(e.target.value as 'fire');
                                    setMissionDetails(''); // Reset mission details when type changes
                                }}
                            />
                            اطفاء
                        </label>
                        <label className="radio-label mission-radio-label">
                            <input
                                type="radio"
                                name="missionType"
                                value="rescue"
                                checked={missionType === 'rescue'}
                                onChange={(e) => {
                                    setMissionType(e.target.value as 'rescue');
                                    setMissionDetails(''); // Reset mission details when type changes
                                }}
                            />
                            انقاذ
                        </label>
                        <label className="radio-label mission-radio-label">
                            <input
                                type="radio"
                                name="missionType"
                                value="medic"
                                checked={missionType === 'medic'}
                                onChange={(e) => {
                                    setMissionType(e.target.value as 'medic');
                                    setMissionDetails(''); // Reset mission details when type changes
                                }}
                            />
                            اسعاف
                        </label>
                        <label className="radio-label mission-radio-label">
                            <input
                                type="radio"
                                name="missionType"
                                value="public-service"
                                checked={missionType === 'public-service'}
                                onChange={(e) => {
                                    setMissionType(e.target.value as 'public-service');
                                    setMissionDetails(''); // Reset mission details when type changes
                                }}
                            />
                            خدمة عامة
                        </label>
                        <label className="radio-label mission-radio-label">
                            <input
                                type="radio"
                                name="missionType"
                                value="misc"
                                checked={missionType === 'misc'}
                                onChange={(e) => {
                                    setMissionType(e.target.value as 'misc');
                                    setMissionDetails(''); // Reset mission details when type changes
                                }}
                            />
                            مختلف
                        </label>
                    </div>

                    {/* Conditional rendering based on mission type */}
                    {missionType === 'fire' && (
                        <div style={{ marginTop: '10px' }}>
                            <input
                                list="fire-details"
                                value={missionDetails}
                                onChange={(e) => {
                                    setMissionDetails(e.target.value);
                                    if (errors.missionDetails) setErrors({ ...errors, missionDetails: false });
                                }}
                                placeholder="حدد تفاصيل المهمة"
                                style={{ 
                                    width: '100%', 
                                    padding: '8px', 
                                    borderRadius: '4px', 
                                    border: errors.missionDetails ? '1px solid #c41e3a' : '1px solid #ddd' 
                                }}
                                data-field="missionDetails"
                            />
                            <datalist id="fire-details">
                                <option value="اطفاء حريق اعشاب" />
                                <option value="اطفاء حريق اعشاب واشجار" />
                                <option value="اطفاء حريق اعشاب ونفايات" />
                                <option value="اطفاء حريق سيارة" />
                                <option value="اطفاء حريق مستودع" />
                                <option value="اطفاء حريق شقة" />
                            </datalist>
                        </div>
                    )}

                    {(missionType === 'rescue' || missionType === 'medic' || missionType === 'public-service') && (
                        <div style={{ marginTop: '10px' }}>
                            <input
                                type="text"
                                value={missionDetails}
                                onChange={(e) => {
                                    setMissionDetails(e.target.value);
                                    if (errors.missionDetails) setErrors({ ...errors, missionDetails: false });
                                }}
                                placeholder="ادخل تفاصيل المهمة"
                                style={{ 
                                    width: '100%', 
                                    padding: '8px', 
                                    borderRadius: '4px', 
                                    border: errors.missionDetails ? '1px solid #c41e3a' : '1px solid #ddd' 
                                }}
                                data-field="missionDetails"
                            />
                        </div>
                    )}

                    {missionType === 'misc' && (
                        <div style={{ marginTop: '10px' }}>
                            <input
                                list="misc-details"
                                value={missionDetails}
                                onChange={(e) => {
                                    setMissionDetails(e.target.value);
                                    if (errors.missionDetails) setErrors({ ...errors, missionDetails: false });
                                }}
                                placeholder="حدد أو اكتب تفاصيل المهمة"
                                style={{ 
                                    width: '100%', 
                                    padding: '8px', 
                                    borderRadius: '4px', 
                                    border: errors.missionDetails ? '1px solid #c41e3a' : '1px solid #ddd' 
                                }}
                                data-field="missionDetails"
                            />
                            <datalist id="misc-details">
                                <option value="تزود الية الاطفاء بالمحروقات" />
                                <option value="تزود الية الاطفاء بالمياه" />
                            </datalist>
                        </div>
                    )}

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
                            placeholder="حدد المكان"
                            style={{ borderColor: errors.location ? '#c41e3a' : '#ddd' }}
                            data-field="location"
                        />
                        {errors.location && <span className="error-icon mission-error-icon">⚠</span>}
                    </div>
                </div>

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

                <TimePicker
                    label="الذهاب"
                    value={startTime}
                    onChange={(time) => setStartTime(time)}
                />

                <TimePicker
                    label="الإياب"
                    value={endTime}
                    onChange={(time) => setEndTime(time)}
                />
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
                                <div key={p.userId} style={{ marginBottom: '10px', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="participant-tag mission-participant-tag">
                                            {p.name}
                                            <button onClick={() => removeParticipant(p.userId)} className="remove-tag mission-remove-tag">×</button>
                                        </span>
                                        {/* NEW: Toggle button for custom times */}
                                        <button
                                            type="button"
                                            onClick={() => toggleCustomTimes(p.userId)}
                                            style={{
                                                padding: '4px 8px',
                                                fontSize: '12px',
                                                backgroundColor: p.showCustomTimes ? '#28a745' : '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {p.showCustomTimes ? '✓ وقت خاص' : '⏱ تعديل الوقت'}
                                        </button>
                                    </div>

                                    {/* Show custom time pickers if enabled */}
                                    {p.showCustomTimes && (
                                        <div style={{ marginTop: '8px', marginRight: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                                            <div style={{ display: 'flex', gap: '100px', flexWrap: 'wrap' }}>
                                                <div style={{ flex: '1', minWidth: '150px' }}>
                                                    <TimePicker
                                                        label="بداية"
                                                        value={p.customStartTime || startTime}
                                                        onChange={(time) => updateCustomStartTime(p.userId, time)}
                                                    />
                                                </div>
                                                <div style={{ flex: '2', minWidth: '150px' }}>
                                                    <TimePicker
                                                        label="نهاية"
                                                        value={p.customEndTime || endTime}
                                                        onChange={(time) => updateCustomEndTime(p.userId, time)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
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