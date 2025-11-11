import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getActiveMonth } from '../services/api';

interface MonthContextType {
  activeMonth: number;
  activeYear: number;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  isCurrentMonth: () => boolean;
  refreshActiveMonth: () => Promise<void>;
}

const MonthContext = createContext<MonthContextType | undefined>(undefined);

export const MonthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [activeMonth, setActiveMonth] = useState<number>(0);
  const [activeYear, setActiveYear] = useState<number>(0);
  const [selectedMonth, setSelectedMonthState] = useState<string>('');

  // Fetch active month from backend on mount
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchActiveMonth();
    }
  }, [isAuthenticated, token]);

  const fetchActiveMonth = async () => {

    if (!isAuthenticated || !token) {
      return;
    }

    try {
      const data = await getActiveMonth();
      setActiveMonth(data.activeMonth);
      setActiveYear(data.activeYear);
      setSelectedMonthState(`${data.activeMonth}-${data.activeYear}`);
    } catch (error) {
      console.error('Error fetching active month:', error);
      // Fallback to current date
      const now = new Date();
      setActiveMonth(now.getMonth() + 1);
      setActiveYear(now.getFullYear());
      if (!selectedMonth) {
        setSelectedMonthState(`${now.getMonth() + 1}-${now.getFullYear()}`);
      }
    }
  };

  const setSelectedMonth = (month: string) => {
    setSelectedMonthState(month);
  };

  const isCurrentMonth = () => {
    const [m, y] = selectedMonth.split('-').map(Number);
    return m === activeMonth && y === activeYear;
  };

  const refreshActiveMonth = async () => {
    await fetchActiveMonth();
  };

  return (
    <MonthContext.Provider value={{ activeMonth, activeYear, selectedMonth, setSelectedMonth, isCurrentMonth, refreshActiveMonth }}>
      {children}
    </MonthContext.Provider>
  );
};

export const useMonth = () => {
  const context = useContext(MonthContext);
  if (!context) {
    throw new Error('useMonth must be used within MonthProvider');
  }
  return context;
};