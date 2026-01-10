import React, { useState, useRef, useEffect } from 'react';
import './TimePicker.css';

interface DateTimePickerProps {
  value: string; // Format: "HH:MM" (time-only) or "YYYY-MM-DDTHH:MM"
  onChange: (time: string) => void;
  label: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange, label }) => {
  // Handle both time-only (HH:mm) and datetime (YYYY-MM-DDTHH:mm) formats
  let datePart = '';
  let timePart = '08:00';
  
  if (value) {
    if (value.includes('T')) {
      // Datetime format
      [datePart, timePart] = value.split('T');
    } else if (value.includes(':')) {
      // Time-only format
      timePart = value;
    }
  }
  
  const [hour, minute] = timePart ? timePart.split(':') : ['08', '00'];

  const [showHourDropdown, setShowHourDropdown] = useState(false);
  const [showMinuteDropdown, setShowMinuteDropdown] = useState(false);
  
  const hourDropdownRef = useRef<HTMLDivElement>(null);
  const minuteDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (hourDropdownRef.current && !hourDropdownRef.current.contains(event.target as Node)) {
        setShowHourDropdown(false);
      }
      if (minuteDropdownRef.current && !minuteDropdownRef.current.contains(event.target as Node)) {
        setShowMinuteDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateChange = (newDate: string) => {
    onChange(datePart ? `${newDate}T${timePart || '08:00'}` : timePart || '08:00');
  };

  const handleTimeChange = (newHour: string, newMinute: string) => {
    const newTime = `${newHour}:${newMinute}`;
    onChange(datePart ? `${datePart}T${newTime}` : newTime);
  };

  const handleHourChange = (newHour: string) => {
    handleTimeChange(newHour, minute);
    setShowHourDropdown(false);
  };

  const handleMinuteChange = (newMinute: string) => {
    handleTimeChange(hour, newMinute);
    setShowMinuteDropdown(false);
  };

  // Generate hours 00-23
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  
  // Split hours into three rows: 00-07, 08-15, 16-23
  const hoursRow1 = hours.slice(0, 8);
  const hoursRow2 = hours.slice(8, 16);
  const hoursRow3 = hours.slice(16, 24);
  
  // Generate minutes in increments of 10: 00, 10, 20, 30, 40, 50
  const minutes = Array.from({ length: 6 }, (_, i) => (i * 10).toString().padStart(2, '0'));

  return (
    <div className="datetime-picker">
      <label>{label}</label>
      <div className="datetime-picker-row">
       
        <div className="time-picker-inputs">
          <div className="custom-time-dropdown" ref={hourDropdownRef}>
            <div 
              className="time-display-button"
              onClick={() => setShowHourDropdown(!showHourDropdown)}
              title="Click to select"
            >
              {hour}
            </div>
            {showHourDropdown && (
              <div className="time-dropdown-menu hour-dropdown">
                <div className="hour-grid-row">
                  {hoursRow1.map(h => (
                    <button
                      key={h}
                      type="button"
                      className={`hour-button ${h === hour ? 'selected' : ''}`}
                      onClick={() => handleHourChange(h)}
                    >
                      {h}
                    </button>
                  ))}
                </div>
                <div className="hour-grid-row">
                  {hoursRow2.map(h => (
                    <button
                      key={h}
                      type="button"
                      className={`hour-button ${h === hour ? 'selected' : ''}`}
                      onClick={() => handleHourChange(h)}
                    >
                      {h}
                    </button>
                  ))}
                </div>
                <div className="hour-grid-row">
                  {hoursRow3.map(h => (
                    <button
                      key={h}
                      type="button"
                      className={`hour-button ${h === hour ? 'selected' : ''}`}
                      onClick={() => handleHourChange(h)}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <span className="time-separator">:</span>
          <div className="custom-time-dropdown" ref={minuteDropdownRef}>
            <div 
              className="time-display-button"
              onClick={() => setShowMinuteDropdown(!showMinuteDropdown)}
              title="Click to select"
            >
              {minute}
            </div>
            {showMinuteDropdown && (
              <div className="time-dropdown-menu minute-dropdown">
                <div className="minute-grid">
                  {minutes.map(m => (
                    <button
                      key={m}
                      type="button"
                      className={`minute-button ${m === minute ? 'selected' : ''}`}
                      onClick={() => handleMinuteChange(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateTimePicker;