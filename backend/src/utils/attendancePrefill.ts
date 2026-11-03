import mongoose from 'mongoose';
import User from '../models/User';
import Attendance from '../models/Attendance';

// Codes the system writes by itself. Anything else (مأ, م, ب, manual غ) was set by the admin.
const AUTO_CODES = ['ح', 'ع'];

export const isAutoCode = (code?: string | null): boolean =>
    !code || AUTO_CODES.includes(code);

// Same 3-day rotation as frontend/src/utils/timeUtils.ts (Dec 31, 2025 = Team 1)
export const getTeamForDate = (dateString: string): '1' | '2' | '3' => {
    const [year, month, day] = dateString.split('-').map(Number);
    const referenceDate = Date.UTC(2025, 11, 31);
    const targetDate = Date.UTC(year, month - 1, day);
    const daysDiff = Math.round((targetDate - referenceDate) / (1000 * 60 * 60 * 24));
    const teamIndex = ((daysDiff % 3) + 3) % 3;
    return (['1', '2', '3'] as const)[teamIndex];
};

// Saturday / Sunday (matches AddShiftModal, which drops head + admin staff on these days)
const isWeekend = (dateString: string): boolean => {
    const [year, month, day] = dateString.split('-').map(Number);
    const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    return dow === 0 || dow === 6;
};

// Default code for one staff member on one day, mirroring what adding a shift would produce
export const getDefaultAttendanceCode = (
    staff: { role: string; team: string; isActive: boolean },
    dateString: string
): 'ح' | 'ع' | 'غ' => {
    if (!staff.isActive) return 'غ';

    if (staff.role === 'head' || staff.role === 'administrative staff') {
        return isWeekend(dateString) ? 'ع' : 'ح';
    }

    return staff.team === getTeamForDate(dateString) ? 'ح' : 'ع';
};

// Pre-fill the employee attendance table for a whole month.
// Only inserts missing records ($setOnInsert), so existing records (shifts already added,
// manual edits) are never touched and running it twice is harmless.
export const prefillMonthAttendance = async (month: number, year: number, adminId: string) => {
    const adminObjectId = new mongoose.Types.ObjectId(adminId);

    const staff = await User.find({
        adminId: adminObjectId,
        role: { $in: ['employee', 'head', 'administrative staff'] }
    });

    const daysInMonth = new Date(year, month, 0).getDate();
    const operations: any[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        for (const member of staff) {
            operations.push({
                updateOne: {
                    // userId + date matches the unique index, so a leftover record without adminId can't cause a duplicate-key error
                    filter: { userId: member._id, date },
                    update: {
                        $setOnInsert: {
                            adminId: adminObjectId,
                            userId: member._id,
                            date,
                            code: getDefaultAttendanceCode(member, date)
                        }
                    },
                    upsert: true
                }
            });
        }
    }

    if (operations.length === 0) return { inserted: 0 };

    const result = await Attendance.bulkWrite(operations, { ordered: false });
    return { inserted: result.upsertedCount };
};
