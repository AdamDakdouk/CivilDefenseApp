// frontend/src/pages/Users.tsx
import React, { useState, useEffect } from 'react';
import { getUsers, searchUsers, createUser, updateUser, deleteUser } from '../services/api';
import { User as UserType } from '../types';
import CustomAlert from '../components/CustomAlert';
import axios from 'axios';
import './Users.css';
import ConfirmModal from '../components/ConfirmModal';

interface User {
    _id: string;
    name: string | String;
    middleName?: string | String;
    motherName?: string | String;
    autoNumber?: string | String;
    cardNumber?: string | String;
    role: 'volunteer' | 'employee' | 'head' | 'administrative staff';
    team: '1' | '2' | '3';
}

const Users: React.FC = () => {
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserType | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'employee' | 'volunteer'>('all');
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [teamFilter, setTeamFilter] = useState<'all' | '1' | '2' | '3'>('all');
    const [showTeamDropdown, setShowTeamDropdown] = useState(false);
    const [alertData, setAlertData] = useState<{
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
    } | null>(null);
    const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        middleName: '',
        motherName: '',
        role: 'volunteer' as 'employee' | 'volunteer' | 'head' | 'administrative staff',
        autoNumber: '',
        cardNumber: '',
        team: '1' as '1' | '2' | '3'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setAlertData({ message: 'فشل في تحميل المستخدمين', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            fetchUsers();
            return;
        }

        try {
            const data = await searchUsers(query);
            setUsers(data);
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    const handleAdd = () => {
        setFormData({
            name: '',
            middleName: '',
            motherName: '',
            role: 'volunteer',
            autoNumber: '',
            cardNumber: '',
            team: '1'
        });
        setShowAddModal(true);
    };

    const handleEdit = (user: UserType) => {
        setEditingUser(user);

        setFormData({
            name: String(user.name || ''),
            middleName: String(user.middleName || ''),
            motherName: String(user.motherName || ''),
            role: user.role, // ✅ Just use the role directly
            autoNumber: String(user.autoNumber || ''),
            cardNumber: String(user.cardNumber || ''),
            team: user.team
        });

        setShowEditModal(true);
    };

    const handleDeleteClick = (userId: string, userName: string) => {
        setPendingDelete({ id: userId, name: userName });
        setShowConfirmDelete(true);
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;

        const scrollPosition = window.scrollY;

        try {
            setDeleteLoading(true);
            setDeletingUserId(pendingDelete.id);

            await deleteUser(pendingDelete.id);

            setShowConfirmDelete(false);
            setPendingDelete(null);

            // Wait for animation (1 second)
            await new Promise(resolve => setTimeout(resolve, 1000));

            await fetchUsers();

            requestAnimationFrame(() => {
                window.scrollTo({
                    top: scrollPosition,
                    behavior: 'smooth' // 👈 Add smooth scrolling
                });
            });
        } catch (error) {
            console.error(error);
            setAlertData({ message: 'فشل في حذف المستخدم', type: 'error' });
            setDeletingUserId(null);
        } finally {
            setDeleteLoading(false);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: { [key: string]: boolean } = {};

        if (!formData.name.trim()) newErrors.name = true;
        if (formData.role === 'employee' && !formData.autoNumber.trim()) newErrors.autoNumber = true;
        if (!formData.team) newErrors.team = true;
        if (formData.role === 'head') {
            // Check if another user is already head (and it's not the current user being edited)
            const existingHead = users.find(u =>
                u.role === 'head' &&
                (!editingUser || u._id !== editingUser._id)
            );

            if (existingHead) {
                setAlertData({
                    message: ` يوجود رئيس مركز  : ${existingHead.name}`,
                    type: 'error'
                });
                return;
            }
        }

        // Check for duplicate autoNumber on frontend
        if (['employee', 'head', 'administrative staff'].includes(formData.role) && formData.autoNumber.trim()) {
            const existingAutoNumber = users.find(u =>
                u.autoNumber === formData.autoNumber.trim() &&
                (!editingUser || u._id !== editingUser._id)
            );

            if (existingAutoNumber) {
                setAlertData({
                    message: `الرقم الآلي موجود مسبقاً: ${existingAutoNumber.name}`,
                    type: 'error'
                });
                return;
            }
        }

        // Check for duplicate cardNumber on frontend
        if (formData.role === 'volunteer' && formData.cardNumber.trim()) {
            const existingCardNumber = users.find(u =>
                u.cardNumber === formData.cardNumber.trim() &&
                (!editingUser || u._id !== editingUser._id)
            );

            if (existingCardNumber) {
                setAlertData({
                    message: `رقم البطاقة موجود مسبقاً: ${existingCardNumber.name}`,
                    type: 'error'
                });
                return;
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);

            const firstErrorField = Object.keys(newErrors)[0];
            const element = document.querySelector(`[data-field="${firstErrorField}"]`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setErrors({});

        try {
            const payload: any = {
                name: formData.name.trim(),
                middleName: formData.middleName.trim() || undefined,
                motherName: formData.motherName.trim() || undefined,
                role: formData.role,
                team: formData.team
            };

            // Only add autoNumber if it exists
            if (['employee', 'head', 'administrative staff'].includes(formData.role) && formData.autoNumber.trim()) {
                payload.autoNumber = formData.autoNumber.trim();
            }

            // Only add cardNumber if it exists
            if (formData.role === 'volunteer' && formData.cardNumber.trim()) {
                payload.cardNumber = formData.cardNumber.trim();
            }

            if (editingUser) {
                await updateUser(editingUser._id, payload);
            } else {
                await createUser(payload);
            }

            setShowAddModal(false);
            setShowEditModal(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error: any) {
            console.error('Error saving user:', error);
            console.error('Error response:', error.response?.data); // 👈 ADD THIS  
            console.error('Full error details:', JSON.stringify(error.response?.data, null, 2));
            setAlertData({ message: 'فشل في حفظ المستخدم', type: 'error' });
        }
    };

    return (
        <div className="users-page">
            <div className="users-header">
                <h2 className='page-title'>إدارة العناصر</h2>
                <div className="users-actions">
                    <input
                        type="text"
                        placeholder="بحث عن مستخدم..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="search-input"
                    />
                    <button onClick={handleAdd} className="add-user-btn">
                        + إضافة عنصر
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading">جاري التحميل...</div>
            ) : (
                <div className="users-table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>الاسم الكامل</th>
                                <th>اسم الأم</th>
                                <th>الرقم</th>
                                <th
                                    className="role-th"
                                    onMouseLeave={() => setShowRoleDropdown(false)}
                                >
                                    <span
                                        className="role-title"
                                        onClick={() => setShowRoleDropdown(prev => !prev)}
                                    >
                                        الدور <span className="role-arrow">▾</span>
                                    </span>

                                    {showRoleDropdown && (
                                        <div className="role-dropdown">
                                            <div onClick={() => { setRoleFilter('all'); setShowRoleDropdown(false); }}>الكل</div>
                                            <div onClick={() => { setRoleFilter('employee'); setShowRoleDropdown(false); }}>الموظفين</div>
                                            <div onClick={() => { setRoleFilter('volunteer'); setShowRoleDropdown(false); }}>المتطوعين</div>
                                        </div>
                                    )}
                                </th>


                                <th
                                    className="team-th"
                                    onMouseLeave={() => setShowTeamDropdown(false)}
                                >
                                    <span
                                        className="team-title"
                                        onClick={() => setShowTeamDropdown(prev => !prev)}
                                    >
                                        الفريق <span className="team-arrow">▾</span>
                                    </span>

                                    {showTeamDropdown && (
                                        <div className="team-dropdown">
                                            <div onClick={() => { setTeamFilter('all'); setShowTeamDropdown(false); }}>الكل</div>
                                            <div onClick={() => { setTeamFilter('1'); setShowTeamDropdown(false); }}>فريق 1</div>
                                            <div onClick={() => { setTeamFilter('2'); setShowTeamDropdown(false); }}>فريق 2</div>
                                            <div onClick={() => { setTeamFilter('3'); setShowTeamDropdown(false); }}>فريق 3</div>
                                        </div>
                                    )}
                                </th>

                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="no-data">لا يوجد مستخدمين</td>
                                </tr>
                            ) : (
                                users
                                    .filter(user => {
                                        // Role filter logic
                                        if (roleFilter === 'employee') {
                                            // Show employees, head, and admin staff
                                            if (!['employee', 'head', 'administrative staff'].includes(user.role)) {
                                                return false;
                                            }
                                        } else if (roleFilter === 'volunteer') {
                                            // Show only volunteers
                                            if (user.role !== 'volunteer') {
                                                return false;
                                            }
                                        }
                                        // 'all' shows everyone (no filtering needed)

                                        // Team filter
                                        if (teamFilter !== 'all' && user.team !== teamFilter) return false;

                                        return true;
                                    })
                                    .sort((a, b) => {
                                        // employees first, then volunteers
                                        if (a.role !== b.role) {
                                            return a.role === 'employee' ? -1 : 1;
                                        }
                                        // within same role → team 1,2,3
                                        return Number(a.team) - Number(b.team);
                                    })
                                    .map((user) => (

                                        <tr
                                            key={user._id}
                                            className={deletingUserId === user._id ? 'deleting-row' : ''}
                                        >
                                            <td>
                                                {user.name.split(' ')[0]}
                                                {user.middleName && ` ${user.middleName}`}
                                                {` ${user.name.split(' ').slice(1).join(' ')}`}
                                            </td>
                                            <td>{user.motherName || '-'}</td>
                                            <td className='card-number'>
                                                {['employee', 'head', 'administrative staff'].includes(user.role)
                                                    ? user.autoNumber
                                                    : user.cardNumber}
                                            </td>
                                            <td>
                                                <span className={`role-badge ${user.role.replace(/\s+/g, '-')}`}>
                                                    {{
                                                        'employee': 'موظف',
                                                        'volunteer': 'متطوع',
                                                        'head': 'رئيس مركز',
                                                        'administrative staff': 'إداري'
                                                    }[user.role]}
                                                </span>
                                            </td>
                                            <td>فريق {user.team}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="edit-btn"
                                                        title="تعديل"
                                                    >
                                                        <span className="gradient-text-edit">✎</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(user._id, user.name)}
                                                        className="delete-btn"
                                                        title="حذف"
                                                    >
                                                        <span className='gradient-text-delete'>🗑️</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Modal */}
            {(showAddModal || showEditModal) && (
                <div className="modal-overlay" >
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h2>
                        <button className="modal-close-btn" onClick={() => {
                            setShowAddModal(false);
                            setShowEditModal(false);
                            setEditingUser(null);
                            setErrors({});
                        }}>
                            ×
                        </button>
                        <form onSubmit={handleSubmit} className="user-form" noValidate>
                            <div className="form-group">
                                <label>الاسم الأول والأخير *</label>
                                <div className="input-wrapper" data-field="name">
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => {
                                            setFormData({ ...formData, name: e.target.value });
                                            if (errors.name) setErrors({ ...errors, name: false });
                                        }}
                                        style={{ borderColor: errors.name ? '#c41e3a' : '#ddd' }}
                                    />
                                    {errors.name && <span className="error-icon">⚠</span>}
                                </div>

                            </div>

                            <div className="form-group">
                                <label>اسم الأب</label>
                                <input
                                    type="text"
                                    value={formData.middleName}
                                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                                    placeholder="اختياري"
                                />
                            </div>

                            <div className="form-group">
                                <label>اسم الأم</label>
                                <input
                                    type="text"
                                    value={formData.motherName}
                                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                                    placeholder="اختياري"
                                />
                            </div>

                            <div className="form-group">
                                <label>الدور *</label>
                                <div className="role-checkboxes">
                                    <label className={`role-option ${formData.role === 'volunteer' ? 'checked' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={formData.role === 'volunteer'}
                                            onChange={() => setFormData({
                                                ...formData,
                                                role: 'volunteer',
                                                autoNumber: '',
                                                cardNumber: ''
                                            })}
                                        />
                                        <span className="checkmark">✓</span>
                                        <span className="role-text">متطوع</span>
                                    </label>

                                    <label className={`role-option ${formData.role === 'employee' ? 'checked' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={formData.role === 'employee'}
                                            onChange={() => setFormData({
                                                ...formData,
                                                role: 'employee',
                                                autoNumber: '',
                                                cardNumber: ''
                                            })}
                                        />
                                        <span className="checkmark">✓</span>
                                        <span className="role-text">موظف</span>
                                    </label>
                                    <label className={`role-option ${formData.role === 'head' ? 'checked' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={formData.role === 'head'}
                                            onChange={() => setFormData({
                                                ...formData,
                                                role: 'head',
                                                autoNumber: '',
                                                cardNumber: ''
                                            })}
                                        />
                                        <span className="checkmark">✓</span>
                                        <span className="role-text">رئيس مركز</span>
                                    </label>

                                    <label className={`role-option ${formData.role === 'administrative staff' ? 'checked' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={formData.role === 'administrative staff'}
                                            onChange={() => setFormData({
                                                ...formData,
                                                role: 'administrative staff',
                                                autoNumber: '',
                                                cardNumber: ''
                                            })}
                                        />
                                        <span className="checkmark">✓</span>
                                        <span className="role-text">اداري</span>
                                    </label>
                                </div>
                            </div>

                            {formData.role === 'employee' || formData.role === 'head' || formData.role === 'administrative staff' ? (
                                <div className="form-group">
                                    <label>الرقم الآلي *</label>
                                    <div className="input-wrapper" data-field="autoNumber">
                                        <input
                                            type="text"
                                            value={formData.autoNumber}
                                            onChange={(e) => {
                                                setFormData({ ...formData, autoNumber: e.target.value });
                                                if (errors.autoNumber) setErrors({ ...errors, autoNumber: false });
                                            }}
                                            placeholder="أدخل الرقم الآلي"
                                            style={{ borderColor: errors.autoNumber ? '#c41e3a' : '#ddd' }}
                                        />
                                        {errors.autoNumber && <span className="error-icon">⚠</span>}
                                    </div>

                                </div>
                            ) : (
                                <div className="form-group">
                                    <label>رقم البطاقة</label>
                                    <input
                                        type="text"
                                        value={formData.cardNumber}
                                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                                        placeholder="أدخل رقم البطاقة"
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>الفريق *</label>
                                <div className="team-checkboxes">
                                    <label className={`team-option ${formData.team === '1' ? 'checked' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={formData.team === '1'}
                                            onChange={() => setFormData({ ...formData, team: '1' })}
                                        />
                                        <span className="checkmark">✓</span>
                                        <span className="team-text">فريق 1</span>
                                    </label>

                                    <label className={`team-option ${formData.team === '2' ? 'checked' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={formData.team === '2'}
                                            onChange={() => setFormData({ ...formData, team: '2' })}
                                        />
                                        <span className="checkmark">✓</span>
                                        <span className="team-text">فريق 2</span>
                                    </label>

                                    <label className={`team-option ${formData.team === '3' ? 'checked' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={formData.team === '3'}
                                            onChange={() => setFormData({ ...formData, team: '3' })}
                                        />
                                        <span className="checkmark">✓</span>
                                        <span className="team-text">فريق 3</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn-save">
                                    {editingUser ? 'تحديث' : 'إضافة'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setShowEditModal(false);
                                        setEditingUser(null);
                                        setErrors({});
                                    }}
                                    className="btn-cancel"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {alertData && (
                <CustomAlert
                    message={alertData.message}
                    type={alertData.type}
                    onClose={() => setAlertData(null)}
                />
            )}

            {showConfirmDelete && pendingDelete && (
                <ConfirmModal
                    message={`هل أنت متأكد من حذف ${pendingDelete.name}؟`}
                    onConfirm={confirmDelete}
                    onCancel={() => {
                        if (deleteLoading) return;
                        setShowConfirmDelete(false);
                        setPendingDelete(null);
                    }}
                    loading={deleteLoading}
                />
            )}

        </div>
    );
};

export default Users;