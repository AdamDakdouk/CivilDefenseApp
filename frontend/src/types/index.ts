export interface User {
  _id: string;
  name: string;
  middleName: String;
  motherName: string;
  autoNumber: String;
  cardNumber: string;
  role: 'volunteer' | 'employee' | 'head' | 'administrative staff';
  team: '1' | '2' | '3';
  currentMonthHours: number;
  currentMonthMissions: number;
  currentMonthDays: number;
  createdAt: string;
}

export interface MissionParticipant {
  user: User;
  customStartTime?: string;  // HH:mm format (e.g., "08:00")
  customEndTime?: string;    // HH:mm format (e.g., "21:00")
}

export interface Mission {
  _id: string;
  referenceNumber: string;
  vehicleNumbers: string;
  date: string;              // YYYY-MM-DD format (e.g., "2025-11-14")
  startTime: string;         // HH:mm format (e.g., "08:00")
  endTime: string;           // HH:mm format (e.g., "21:00")
  location: string;
  missionType: 'fire' | 'rescue' | 'medic' | 'public-service' | 'misc';
  missionDetails: string;
  notes?: string;
  team: '1' | '2' | '3';
  participants: MissionParticipant[];
  createdAt: string;
}

export interface Shift {
  _id: string;
  date: string;              // YYYY-MM-DD format (e.g., "2025-11-14")
  team: '1' | '2' | '3';
  participants: ShiftParticipant[];
  createdAt: string;
}

export interface ShiftParticipant {
  user: User;
  checkIn: string;           // HH:mm format (e.g., "08:00")
  checkOut: string;          // HH:mm format (e.g., "21:00")
  hoursServed: number;
}

export interface Attendance {
  _id: string;
  userId: string;
  date: string;              // YYYY-MM-DD format (e.g., "2025-11-14")
  code: 'ح' | 'مأ' | 'غ' | 'ع' | 'م' | 'ب';
  createdAt: string;
}