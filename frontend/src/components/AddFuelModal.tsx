import React, { useEffect, useState } from 'react';
import { getVehicles } from '../services/api';
import { FuelEntry, Vehicle } from '../types';
import VehicleManagement from './VehicleManagement';
import './Modal.css';
import './AddFuelModal.css';

const DEFAULT_STATIONS = ['كفرشيما اللواء', 'بيت الدين'];
const OTHER_STATION = '__other__';
const GASOLINE_LITERS = [20];
const DIESEL_LITERS = [30, 40];

// The SUV (Envoy) is the only jeep and the only gasoline vehicle; everything else is a diesel fire truck
const isEnvoy = (name: string) => /envoy|انفوي/i.test(name);

interface AddFuelModalProps {
    onClose: () => void;
    onSave: (payload: any) => Promise<void>;
    editMode?: boolean;
    initialData?: FuelEntry | null;
    activeMonth: number;
    activeYear: number;
    knownStations: string[];
}

const pad = (n: number) => String(n).padStart(2, '0');

const defaultDate = (month: number, year: number): string => {
    const now = new Date();
    if (now.getMonth() + 1 === month && now.getFullYear() === year) {
        return `${year}-${pad(month)}-${pad(now.getDate())}`;
    }
    return `${year}-${pad(month)}-01`;
};

const AddFuelModal: React.FC<AddFuelModalProps> = ({ onClose, onSave, editMode = false, initialData, activeMonth, activeYear, knownStations }) => {
    const stationOptions = Array.from(new Set([
        ...DEFAULT_STATIONS,
        ...knownStations,
        ...(initialData ? [initialData.stationName] : [])
    ]));

    const [stationChoice, setStationChoice] = useState<string>(initialData?.stationName || '');
    const [stationOther, setStationOther] = useState('');
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [vehiclePlate, setVehiclePlate] = useState(initialData?.vehiclePlate || '');
    const [vehicleType, setVehicleType] = useState<'jeep' | 'fire'>(initialData?.vehicleType || 'fire');
    const [fuelType, setFuelType] = useState<'gasoline' | 'diesel'>(initialData?.fuelType || 'diesel');
    const [liters, setLiters] = useState<number>(initialData?.liters || 30);
    const [voucherPreset, setVoucherPreset] = useState<'1' | '2' | '3' | 'more'>('1');
    const [moreCount, setMoreCount] = useState(4);
    const [voucherNumbers, setVoucherNumbers] = useState<string[]>([initialData?.voucherNumber || '']);
    const [date, setDate] = useState(initialData?.date || defaultDate(activeMonth, activeYear));
    const [odometerBroken, setOdometerBroken] = useState(initialData ? initialData.odometer === 'معطل' : false);
    const [odometerValue, setOdometerValue] = useState(initialData && initialData.odometer !== 'معطل' ? initialData.odometer : '');
    const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showVehicleManagement, setShowVehicleManagement] = useState(false);

    const voucherCount = editMode ? 1 : voucherPreset === 'more' ? moreCount : Number(voucherPreset);
    const selectedVehicle = vehicles.find(v => v.plateNumber === vehiclePlate);
    const literOptions = fuelType === 'gasoline' ? GASOLINE_LITERS : DIESEL_LITERS;

    useEffect(() => {
        fetchVehicles();
    }, []);

    // Keep one input per voucher
    useEffect(() => {
        setVoucherNumbers(prev => {
            if (prev.length === voucherCount) return prev;
            return Array.from({ length: voucherCount }, (_, i) => prev[i] || '');
        });
    }, [voucherCount]);

    const fetchVehicles = async () => {
        try {
            setVehicles(await getVehicles());
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };

    const clearError = (key: string) => {
        if (errors[key]) setErrors({ ...errors, [key]: false });
    };

    const handleSelectVehicle = (vehicle: Vehicle) => {
        setVehiclePlate(vehicle.plateNumber);
        clearError('vehicle');

        // Auto-fill type, fuel and liters from the vehicle, all still editable
        const envoy = isEnvoy(vehicle.name);
        setVehicleType(envoy ? 'jeep' : 'fire');
        setFuelType(envoy ? 'gasoline' : 'diesel');
        setLiters(envoy ? 20 : 30);
    };

    const handleSelectFuel = (fuel: 'gasoline' | 'diesel') => {
        setFuelType(fuel);
        setLiters(fuel === 'gasoline' ? 20 : (DIESEL_LITERS.includes(liters) ? liters : 30));
    };

    const stationName = stationChoice === OTHER_STATION ? stationOther.trim() : stationChoice;

    const handleSubmit = async () => {
        const newErrors: { [key: string]: boolean } = {};

        if (!stationName) newErrors.station = true;
        if (!selectedVehicle && !(editMode && initialData && vehiclePlate)) newErrors.vehicle = true;
        if (voucherNumbers.some(v => !v.trim())) newErrors.vouchers = true;
        if (new Set(voucherNumbers.map(v => v.trim())).size !== voucherNumbers.length) newErrors.vouchers = true;
        if (!date) newErrors.date = true;
        if (!odometerBroken && !odometerValue.trim()) newErrors.odometer = true;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setSubmitError(newErrors.vouchers && voucherNumbers.every(v => v.trim()) ? 'أرقام القسائم مكررة' : '');
            return;
        }

        setErrors({});
        setSubmitError('');
        setIsSubmitting(true);

        const vehicleName = selectedVehicle?.name || initialData?.vehicleName || '';

        const payload = {
            date,
            stationName,
            vehicleName,
            vehiclePlate,
            vehicleType,
            fuelType,
            liters,
            odometer: odometerBroken ? 'معطل' : odometerValue.trim(),
            ...(editMode
                ? { voucherNumber: voucherNumbers[0].trim() }
                : { voucherNumbers: voucherNumbers.map(v => v.trim()) })
        };

        try {
            await onSave(payload);
        } catch (error: any) {
            setSubmitError(error?.response?.data?.message || 'حدث خطأ أثناء الحفظ');
        } finally {
            setIsSubmitting(false);
        }
    };

    const monthStart = `${activeYear}-${pad(activeMonth)}-01`;
    const monthEnd = `${activeYear}-${pad(activeMonth)}-${pad(new Date(activeYear, activeMonth, 0).getDate())}`;

    return (
        <div className="modal-overlay">
            <div className="modal-content fuel-modal" onClick={(e) => e.stopPropagation()}>
                <h2>{editMode ? 'تعديل قسيمة محروقات' : 'إضافة محروقات'}</h2>
                <button className="modal-close-btn" onClick={onClose}>×</button>

                {/* Station */}
                <div className="fuel-field">
                    <label>اسم المحطة *</label>
                    <div className="choice-row">
                        {stationOptions.map(name => (
                            <button
                                key={name}
                                type="button"
                                className={`choice-chip ${stationChoice === name ? 'selected' : ''}`}
                                onClick={() => { setStationChoice(name); clearError('station'); }}
                            >
                                {name}
                            </button>
                        ))}
                        <button
                            type="button"
                            className={`choice-chip ${stationChoice === OTHER_STATION ? 'selected' : ''}`}
                            onClick={() => { setStationChoice(OTHER_STATION); clearError('station'); }}
                        >
                            أخرى...
                        </button>
                    </div>
                    {stationChoice === OTHER_STATION && (
                        <input
                            type="text"
                            className="fuel-input"
                            value={stationOther}
                            onChange={(e) => { setStationOther(e.target.value); clearError('station'); }}
                            placeholder="اكتب اسم المحطة"
                        />
                    )}
                    {errors.station && <span className="fuel-error">⚠ اسم المحطة مطلوب</span>}
                </div>

                {/* Vehicle */}
                <div className="fuel-field">
                    <div className="fuel-label-row">
                        <label>الآلية *</label>
                        <button
                            type="button"
                            className="settings-btn"
                            onClick={() => setShowVehicleManagement(true)}
                            title="إدارة الآليات"
                        >
                            ⚙️
                        </button>
                    </div>
                    {vehicles.length === 0 ? (
                        <div className="no-vehicles">
                            <p>لا توجد آليات مضافة بعد</p>
                            <button type="button" className="btn-add add-vehicle-btn" onClick={() => setShowVehicleManagement(true)}>
                                + إضافة آلية
                            </button>
                        </div>
                    ) : (
                        <div className="choice-row">
                            {vehicles.map(vehicle => (
                                <button
                                    key={vehicle._id}
                                    type="button"
                                    className={`choice-chip ${vehiclePlate === vehicle.plateNumber ? 'selected' : ''}`}
                                    onClick={() => handleSelectVehicle(vehicle)}
                                >
                                    {vehicle.name}
                                    <span className="chip-sub">{vehicle.plateNumber}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    {errors.vehicle && <span className="fuel-error">⚠ يرجى اختيار آلية</span>}
                </div>

                {/* Type, fuel, liters */}
                <div className="fuel-row">
                    <div className="fuel-field">
                        <label>النوع</label>
                        <div className="choice-row">
                            <button type="button" className={`choice-chip ${vehicleType === 'jeep' ? 'selected' : ''}`} onClick={() => setVehicleType('jeep')}>جيب</button>
                            <button type="button" className={`choice-chip ${vehicleType === 'fire' ? 'selected' : ''}`} onClick={() => setVehicleType('fire')}>إطفاء</button>
                        </div>
                    </div>

                    <div className="fuel-field">
                        <label>الوقود</label>
                        <div className="choice-row">
                            <button type="button" className={`choice-chip ${fuelType === 'gasoline' ? 'selected' : ''}`} onClick={() => handleSelectFuel('gasoline')}>بنزين</button>
                            <button type="button" className={`choice-chip ${fuelType === 'diesel' ? 'selected' : ''}`} onClick={() => handleSelectFuel('diesel')}>مازوت</button>
                        </div>
                    </div>

                    <div className="fuel-field">
                        <label>الكمية (ليتر)</label>
                        <div className="choice-row">
                            {literOptions.map(option => (
                                <button
                                    key={option}
                                    type="button"
                                    className={`choice-chip ${liters === option ? 'selected' : ''}`}
                                    onClick={() => setLiters(option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Vouchers */}
                {!editMode && (
                    <div className="fuel-field">
                        <label>عدد القسائم المستعملة</label>
                        <div className="choice-row">
                            {(['1', '2', '3'] as const).map(count => (
                                <button
                                    key={count}
                                    type="button"
                                    className={`choice-chip ${voucherPreset === count ? 'selected' : ''}`}
                                    onClick={() => setVoucherPreset(count)}
                                >
                                    {count}
                                </button>
                            ))}
                            <button
                                type="button"
                                className={`choice-chip ${voucherPreset === 'more' ? 'selected' : ''}`}
                                onClick={() => setVoucherPreset('more')}
                            >
                                أكثر
                            </button>
                            {voucherPreset === 'more' && (
                                <input
                                    type="number"
                                    min={4}
                                    max={12}
                                    className="fuel-input count-input"
                                    value={moreCount}
                                    onChange={(e) => setMoreCount(Math.min(12, Math.max(4, Number(e.target.value) || 4)))}
                                />
                            )}
                        </div>
                    </div>
                )}

                <div className="fuel-field">
                    <label>{voucherCount > 1 ? 'أرقام القسائم *' : 'رقم القسيمة *'}</label>
                    <div className="voucher-inputs">
                        {voucherNumbers.map((value, index) => (
                            <input
                                key={index}
                                type="text"
                                inputMode="numeric"
                                className="fuel-input"
                                value={value}
                                onChange={(e) => {
                                    const next = [...voucherNumbers];
                                    next[index] = e.target.value;
                                    setVoucherNumbers(next);
                                    clearError('vouchers');
                                }}
                                placeholder={voucherCount > 1 ? `رقم القسيمة ${index + 1}` : 'رقم القسيمة'}
                            />
                        ))}
                    </div>
                    {errors.vouchers && <span className="fuel-error">⚠ {submitError === 'أرقام القسائم مكررة' ? 'أرقام القسائم مكررة' : 'يرجى إدخال جميع أرقام القسائم'}</span>}
                </div>

                {/* Date and odometer */}
                <div className="fuel-row">
                    <div className="fuel-field">
                        <label>تاريخ القسيمة *</label>
                        <input
                            type="date"
                            className="fuel-input"
                            value={date}
                            min={monthStart}
                            max={monthEnd}
                            onChange={(e) => { setDate(e.target.value); clearError('date'); }}
                        />
                        {errors.date && <span className="fuel-error">⚠ التاريخ مطلوب</span>}
                    </div>

                    <div className="fuel-field">
                        <label>العداد *</label>
                        <div className="odometer-row">
                            <input
                                type="text"
                                inputMode="numeric"
                                className="fuel-input"
                                value={odometerValue}
                                onChange={(e) => {
                                    setOdometerValue(e.target.value);
                                    // typing a reading un-presses the broken button
                                    if (odometerBroken) setOdometerBroken(false);
                                    clearError('odometer');
                                }}
                                placeholder="قراءة العداد"
                            />
                            <button
                                type="button"
                                className={`choice-chip ${odometerBroken ? 'selected' : ''}`}
                                onClick={() => {
                                    // pressing it clears the reading
                                    setOdometerBroken(!odometerBroken);
                                    if (!odometerBroken) setOdometerValue('');
                                    clearError('odometer');
                                }}
                            >
                                معطل
                            </button>
                        </div>
                        {errors.odometer && <span className="fuel-error">⚠ قراءة العداد مطلوبة</span>}
                    </div>
                </div>

                {submitError && submitError !== 'أرقام القسائم مكررة' && <div className="fuel-submit-error">{submitError}</div>}

                <div className="modal-actions">
                    <button onClick={handleSubmit} className="btn-save" disabled={isSubmitting}>
                        {isSubmitting ? 'جاري الحفظ...' : editMode ? 'تحديث' : voucherCount > 1 ? `حفظ (${voucherCount} صفوف)` : 'حفظ'}
                    </button>
                    <button onClick={onClose} className="btn-cancel" disabled={isSubmitting}>إلغاء</button>
                </div>
            </div>

            <VehicleManagement
                isOpen={showVehicleManagement}
                onClose={() => setShowVehicleManagement(false)}
                onSave={() => fetchVehicles()}
            />
        </div>
    );
};

export default AddFuelModal;
