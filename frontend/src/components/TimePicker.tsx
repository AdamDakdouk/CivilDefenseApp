import React, { useState } from 'react';
import './TimePicker.css';

interface TimePickerProps {
  value: string; // Format: "HH:MM"
  onChange: (time: string) => void;
  label: string;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, label }) => {
  const [hour, minute] = value && value.includes(':') ? value.split(':') : ['08', '00'];
  const [isEditingHour, setIsEditingHour] = useState(false);
  const [isEditingMinute, setIsEditingMinute] = useState(false);
  const [hourInput, setHourInput] = useState(hour);
  const [minuteInput, setMinuteInput] = useState(minute);

  const handleHourChange = (newHour: string) => {
    const validated = Math.min(23, Math.max(0, parseInt(newHour) || 0)).toString().padStart(2, '0');
    onChange(`${validated}:${minute.padStart(2, '0')}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    const validated = Math.min(59, Math.max(0, parseInt(newMinute) || 0)).toString().padStart(2, '0');
    onChange(`${hour.padStart(2, '0')}:${validated}`);
  };

  const handleHourInputBlur = () => {
    handleHourChange(hourInput);
    setIsEditingHour(false);
    setHourInput(hour);
  };

  const handleMinuteInputBlur = () => {
    handleMinuteChange(minuteInput);
    setIsEditingMinute(false);
    setMinuteInput(minute);
  };

  const handleHourInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Only allow digits, max 2 chars
    if (/^\d{0,2}$/.test(val)) {
      setHourInput(val);
    }
  };

  const handleMinuteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Only allow digits, max 2 chars
    if (/^\d{0,2}$/.test(val)) {
      setMinuteInput(val);
    }
  };

  // Generate hours 00-23
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  
  // Generate minutes in increments of 10: 00, 10, 20, 30, 40, 50
  const minutes = Array.from({ length: 6 }, (_, i) => (i * 10).toString().padStart(2, '0'));

  return (
    <div className="time-picker">
      <label>{label}</label>
      <div className="time-picker-inputs">
        {isEditingHour ? (
          <input
            type="text"
            value={hourInput}
            onChange={handleHourInputChange}
            onBlur={handleHourInputBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleHourInputBlur();
              if (e.key === 'Escape') {
                setIsEditingHour(false);
                setHourInput(hour);
              }
            }}
            placeholder="HH"
            maxLength={2}
            autoFocus
            className="time-input"
          />
        ) : (
          <select 
            value={hour} 
            onChange={(e) => handleHourChange(e.target.value)}
            onDoubleClick={() => setIsEditingHour(true)}
            title="Double-click to type manually"
          >
            {hours.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        )}
        <span className="time-separator">:</span>
        {isEditingMinute ? (
          <input
            type="text"
            value={minuteInput}
            onChange={handleMinuteInputChange}
            onBlur={handleMinuteInputBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleMinuteInputBlur();
              if (e.key === 'Escape') {
                setIsEditingMinute(false);
                setMinuteInput(minute);
              }
            }}
            placeholder="MM"
            maxLength={2}
            autoFocus
            className="time-input"
          />
        ) : (
          <select 
            value={minute} 
            onChange={(e) => handleMinuteChange(e.target.value)}
            onDoubleClick={() => setIsEditingMinute(true)}
            title="Double-click to type manually"
          >
            {minutes.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export default TimePicker;