import React from 'react';
import './TimePicker.css';

interface TimePickerProps {
  value: string; // Format: "HH:MM"
  onChange: (time: string) => void;
  label: string;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, label }) => {
  const [hour, minute] = value && value.includes(':') ? value.split(':') : ['08', '00'];

  const handleHourChange = (newHour: string) => {
    onChange(`${newHour.padStart(2, '0')}:${minute.padStart(2, '0')}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    onChange(`${hour.padStart(2, '0')}:${newMinute.padStart(2, '0')}`);
  };


  // Generate hours 00-23
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  
  // Generate minutes 00-59
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="time-picker">
      <label>{label}</label>
      <div className="time-picker-inputs">
        <select value={hour} onChange={(e) => handleHourChange(e.target.value)}>
          {hours.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span className="time-separator">:</span>
        <select value={minute} onChange={(e) => handleMinuteChange(e.target.value)}>
          {minutes.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TimePicker;