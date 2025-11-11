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
}

export interface Mission {
  _id: string;
  referenceNumber: string;
  vehicleNumbers: string;
  startTime: string;
  endTime: string;
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
  date: string;
  team: '1' | '2' | '3';
  participants: ShiftParticipant[];
  createdAt: string;
}

export interface ShiftParticipant {
  user: User;
  checkIn: string;
  checkOut: string;
  hoursServed: number;
}

export interface Attendance {
  _id: string;
  userId: string;
  date: string;
  code: 'ح' | 'مأ' | 'غ' | 'ع' | 'م' | 'ب';
  createdAt: string;
}