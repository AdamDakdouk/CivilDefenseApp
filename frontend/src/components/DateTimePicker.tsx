import React from 'react';
import './TimePicker.css';

interface DateTimePickerProps {
  value: string; // Format: "YYYY-MM-DDTHH:MM"
  onChange: (datetime: string) => void;
  label: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange, label }) => {
  const [datePart, timePart] = value ? value.split('T') : ['', '08:00'];
  const [hour, minute] = timePart ? timePart.split(':') : ['08', '00'];

  const handleDateChange = (newDate: string) => {
    onChange(`${newDate}T${timePart || '08:00'}`);
  };

  const handleTimeChange = (newHour: string, newMinute: string) => {
    onChange(`${datePart}T${newHour}:${newMinute}`);
  };

  // Generate hours 00-23
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  
  // Generate minutes 00-59
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="datetime-picker">
      <label>{label}</label>
      <div className="datetime-picker-row">
        <input 
          type="date" 
          value={datePart} 
          onChange={(e) => handleDateChange(e.target.value)}
          className="date-input"
        />
        <div className="time-picker-inputs">
          <select value={hour} onChange={(e) => handleTimeChange(e.target.value, minute)}>
            {hours.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <span className="time-separator">:</span>
          <select value={minute} onChange={(e) => handleTimeChange(hour, e.target.value)}>
            {minutes.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default DateTimePicker;