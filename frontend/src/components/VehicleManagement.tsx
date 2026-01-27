import React, { useState, useEffect } from 'react';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import './VehicleManagement.css';

interface Vehicle {
    _id?: string;
    name: string;
    plateNumber: string;
}

interface VehicleManagementProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

const VehicleManagement: React.FC<VehicleManagementProps> = ({ isOpen, onClose, onSave }) => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', plateNumber: '' });
    const [errors, setErrors] = useState({ name: false, plateNumber: false });
    const [showConfirm, setShowConfirm] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);


    useEffect(() => {
        if (isOpen) {
            fetchVehicles();
        }
    }, [isOpen]);

    const fetchVehicles = async () => {
        try {
            // Replace with your actual API call
            const data = await getVehicles()
            setVehicles(data);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors = {
            name: !formData.name.trim(),
            plateNumber: !formData.plateNumber.trim()
        };

        if (newErrors.name || newErrors.plateNumber) {
            setErrors(newErrors);
            return;
        }

        try {
            if (editingVehicle) {
                // Update existing vehicle
                await updateVehicle(editingVehicle._id!, formData);
            } else {
                // Create new vehicle
                await createVehicle(formData);
            }

            setFormData({ name: '', plateNumber: '' });
            setEditingVehicle(null);
            setShowForm(false);
            setErrors({ name: false, plateNumber: false });
            fetchVehicles();
            onSave(); // Notify parent to refresh
        } catch (error) {
            console.error('Error saving vehicle:', error);
        }
    };

    const handleEdit = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle);
        setFormData({ name: vehicle.name, plateNumber: vehicle.plateNumber });
        setShowForm(true);
    };

    const handleDelete = (vehicleId: string) => {
        setVehicleToDelete(vehicleId);
        setShowConfirm(true);
    };

    const confirmDelete = async () => {
        if (!vehicleToDelete) return;

        try {
            setDeleteLoading(true);
            await deleteVehicle(vehicleToDelete);
            fetchVehicles();
            onSave();
            setShowConfirm(false);
            setVehicleToDelete(null);
        } catch (error) {
            console.error('Error deleting vehicle:', error);
        } finally {
            setDeleteLoading(false);
        }
    };


    const handleCancel = () => {
        setFormData({ name: '', plateNumber: '' });
        setEditingVehicle(null);
        setShowForm(false);
        setErrors({ name: false, plateNumber: false });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="vehicle-modal" onClick={(e) => e.stopPropagation()}>
                <div className="vehicle-modal-header">
                    <h3>إدارة الآليات</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="vehicle-modal-body">
                    {!showForm ? (
                        <>
                            <button
                                className="btn-add add-vehicle-btn"
                                onClick={() => setShowForm(true)}
                            >
                                <span className='btn-add-text'>+ إضافة آلية جديدة</span>
                            </button>

                            <div className="vehicles-list">
                                {vehicles.length === 0 ? (
                                    <div className="empty-vehicles">
                                        <p>لا توجد آليات مسجلة</p>
                                    </div>
                                ) : (
                                    vehicles.map(vehicle => (
                                        <div key={vehicle._id} className="vehicle-item">
                                            <div className="vehicle-info">
                                                <div className="vehicle-name">{vehicle.name}</div>
                                                <div className="vehicle-plate">{vehicle.plateNumber}</div>
                                            </div>
                                            <div className="vehicle-actions">
                                                <button
                                                    className="edit-btn"
                                                    onClick={() => handleEdit(vehicle)}
                                                >
                                                    <span className='gradient-text-edit'>✎</span>
                                                </button>
                                                <button
                                                    className="delete-btn gradient-text-delete"
                                                    onClick={() => handleDelete(vehicle._id!)}
                                                >
                                                    <span className='gradient-text-delete'>🗑️</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleSubmit} className="vehicle-form">
                            <h4>{editingVehicle ? 'تعديل آلية' : 'إضافة آلية جديدة'}</h4>

                            <div className="form-field">
                                <label>اسم الآلية *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, name: e.target.value });
                                        if (errors.name) setErrors({ ...errors, name: false });
                                    }}
                                    placeholder="مثال: Renault"
                                    className={errors.name ? 'error' : ''}
                                />
                                {errors.name && <span className="error-text">⚠ الاسم مطلوب</span>}
                            </div>

                            <div className="form-field">
                                <label>رقم اللوحة *</label>
                                <input
                                    type="text"
                                    value={formData.plateNumber}
                                    onChange={(e) => {
                                        setFormData({ ...formData, plateNumber: e.target.value });
                                        if (errors.plateNumber) setErrors({ ...errors, plateNumber: false });
                                    }}
                                    placeholder="مثال: 921306"
                                    className={errors.plateNumber ? 'error' : ''}
                                />
                                {errors.plateNumber && <span className="error-text">⚠ رقم اللوحة مطلوب</span>}
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={handleCancel} className="btn-cancel">
                                    إلغاء
                                </button>
                                <button type="submit" className="btn-save">
                                    {editingVehicle ? 'تحديث' : 'حفظ'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {showConfirm && (
                <ConfirmModal
                    message="هل أنت متأكد من حذف هذه الآلية؟"
                    onConfirm={confirmDelete}
                    onCancel={() => {
                        if (deleteLoading) return;
                        setShowConfirm(false);
                        setVehicleToDelete(null);
                    }}
                    loading={deleteLoading}
                />
            )}

        </div>
    );
};

export default VehicleManagement;