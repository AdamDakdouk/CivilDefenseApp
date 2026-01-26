import axios from 'axios';
import { User, Mission, Shift, Vehicle } from '../types';

// Check hostname at runtime (most reliable)
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';

const API_URL = isLocalhost ? 'http://localhost:5000/api' : '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authorization token to all requests
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

// User API calls
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/users');
  return response.data;
};

export const searchUsers = async (query: string): Promise<User[]> => {
  const response = await api.get(`/users/search?q=${query}`);
  return response.data;
};

// Shift API calls
export const getShifts = async (): Promise<Shift[]> => {
  const response = await api.get('/shifts');
  return response.data;
};

export const createShift = async (shift: any): Promise<Shift> => {
  const response = await api.post('/shifts', shift);
  return response.data;
};

export const updateShift = async (id: string, shift: any): Promise<Shift> => {
  const response = await api.put(`/shifts/${id}`, shift);
  return response.data;
};

export const deleteShift = async (id: string): Promise<void> => {
  await api.delete(`/shifts/${id}`);
};

export const getAvailableShiftMonths = async (): Promise<any[]> => {
  const response = await api.get('/shifts/available-months');
  return response.data;
};

// Mission API calls
export const getMissions = async (): Promise<Mission[]> => {
  const response = await api.get('/missions');
  return response.data;
};

export const createMission = async (mission: any): Promise<Mission> => {
  const response = await api.post('/missions', mission);
  return response.data;
};

export const updateMission = async (id: string, mission: any): Promise<Mission> => {
  const response = await api.put(`/missions/${id}`, mission);
  return response.data;
};

export const deleteMission = async (id: string): Promise<void> => {
  await api.delete(`/missions/${id}`);
};

// Monthly Reports API calls
export const getMonthlyReports = async (month: number, year: number): Promise<any[]> => {
  const response = await api.get(`/monthly-reports?month=${month}&year=${year}`);
  return response.data;
};

export const getAvailableMonths = async (): Promise<any[]> => {
  const response = await api.get('/monthly-reports/available-months');
  return response.data;
};

export const getCurrentMonthData = async (): Promise<User[]> => {
  const response = await api.get('/monthly-reports/current');
  return response.data;
};

export const getShiftsByMonth = async (month: number, year: number): Promise<Shift[]> => {
  const response = await api.get(`/shifts/by-month?month=${month}&year=${year}`);
  return response.data;
};

export const getMissionsByMonth = async (month: number, year: number): Promise<Mission[]> => {
  const response = await api.get(`/missions/by-month?month=${month}&year=${year}`);
  return response.data;
};

export const getAvailableMissionMonths = async (): Promise<any[]> => {
  const response = await api.get('/missions/available-months');
  return response.data;
};

export const getVolunteerMissionCounts = async (month: number, year: number): Promise<any> => {
  const response = await api.get(`/volunteer-stats/mission-counts?month=${month}&year=${year}`);
  return response.data;
};

export const getAttendanceByMonth = async (month: number, year: number): Promise<any[]> => {
  const response = await api.get(`/attendance/month?month=${month}&year=${year}`);
  return response.data;
};

export const updateAttendanceCode = async (userId: string, date: string, code: string): Promise<any> => {
  const response = await api.put(`/attendance/update`, {
    userId,
    date,
    code
  });
  return response.data;
};

export const rolloverMonth = async (month: number, year: number): Promise<any> => {
  const response = await api.post(`/month-rollover/rollover`, {
    month,
    year
  });
  return response.data;
};

export const getActiveMonth = async (): Promise<any> => {
  const response = await api.get(`/settings/active-month`);
  return response.data;
};

export const createUser = async (userData: any) => {
  const response = await api.post('/users', userData);
  return response.data;
};

export const updateUser = async (userId: string, userData: any) => {
  const response = await api.put(`/users/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId: string) => {
  await api.delete(`/users/${userId}`);
};

export const getAdminMe = async () => {
  const res = await api.get('/admin/me');
  return res.data;
};

export const updateMissionSuffix = async (missionSuffix: string) => {
  const res = await api.put('/admin/mission-suffix', { missionSuffix });
  return res.data;
};

export const getVehicles = async (): Promise<Vehicle[]> => {
  const response = await api.get('/vehicles');
  return response.data;
};

export const createVehicle = async (vehicleData: { name: string; plateNumber: string }): Promise<Vehicle> => {
  const response = await api.post('/vehicles', vehicleData);
  return response.data;
};

export const updateVehicle = async (id: string, vehicleData: { name: string; plateNumber: string }): Promise<Vehicle> => {
  const response = await api.put(`/vehicles/${id}`, vehicleData);
  return response.data;
};

export const deleteVehicle = async (id: string): Promise<void> => {
  await api.delete(`/vehicles/${id}`);
};
export default api;