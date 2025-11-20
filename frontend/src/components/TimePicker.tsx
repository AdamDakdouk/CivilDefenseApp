import React, { useState, useRef, useEffect } from 'react';
import './TimePicker.css';

interface TimePickerProps {
  value: string; // Format: "HH:MM"
  onChange: (time: string) => void;
  label: string;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, label }) => {
  // Parse current value
  const getCurrentTime = () => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      return { hour: h, minute: m };
    }
    return { hour: '08', minute: '00' };
  };

  const currentTime = getCurrentTime();
  
  const [isEditingHour, setIsEditingHour] = useState(false);
  const [isEditingMinute, setIsEditingMinute] = useState(false);
  const [showHourDropdown, setShowHourDropdown] = useState(false);
  const [showMinuteDropdown, setShowMinuteDropdown] = useState(false);
  const [hourInput, setHourInput] = useState(currentTime.hour);
  const [minuteInput, setMinuteInput] = useState(currentTime.minute);
  
  const hourDropdownRef = useRef<HTMLDivElement>(null);
  const minuteDropdownRef = useRef<HTMLDivElement>(null);

  // Update input values when value prop changes
  useEffect(() => {
    const time = getCurrentTime();
    setHourInput(time.hour);
    setMinuteInput(time.minute);
  }, [value]);

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

  const handleHourChange = (newHour: string) => {
    const validated = Math.min(23, Math.max(0, parseInt(newHour) || 0)).toString().padStart(2, '0');
    onChange(`${validated}:${currentTime.minute}`);
    setShowHourDropdown(false);
  };

  const handleMinuteChange = (newMinute: string) => {
    const validated = Math.min(59, Math.max(0, parseInt(newMinute) || 0)).toString().padStart(2, '0');
    onChange(`${currentTime.hour}:${validated}`);
    setShowMinuteDropdown(false);
  };

  const handleHourInputBlur = () => {
    handleHourChange(hourInput);
    setIsEditingHour(false);
  };

  const handleMinuteInputBlur = () => {
    handleMinuteChange(minuteInput);
    setIsEditingMinute(false);
  };

  const handleHourInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d{0,2}$/.test(val)) {
      setHourInput(val);
    }
  };

  const handleMinuteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d{0,2}$/.test(val)) {
      setMinuteInput(val);
    }
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
                setHourInput(currentTime.hour);
              }
            }}
            placeholder="HH"
            maxLength={2}
            autoFocus
            className="time-input"
          />
        ) : (
          <div className="custom-time-dropdown" ref={hourDropdownRef}>
            <div 
              className="time-display-button"
              onClick={() => setShowHourDropdown(!showHourDropdown)}
              title="Click to select"
            >
              {currentTime.hour}
            </div>
            {showHourDropdown && (
              <div className="time-dropdown-menu hour-dropdown">
                <div className="hour-grid-row">
                  {hoursRow1.map(h => (
                    <button
                      key={h}
                      type="button"
                      className={`hour-button ${h === currentTime.hour ? 'selected' : ''}`}
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
                      className={`hour-button ${h === currentTime.hour ? 'selected' : ''}`}
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
                      className={`hour-button ${h === currentTime.hour ? 'selected' : ''}`}
                      onClick={() => handleHourChange(h)}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
                setMinuteInput(currentTime.minute);
              }
            }}
            placeholder="MM"
            maxLength={2}
            autoFocus
            className="time-input"
          />
        ) : (
          <div className="custom-time-dropdown" ref={minuteDropdownRef}>
            <div 
              className="time-display-button"
              onClick={() => setShowMinuteDropdown(!showMinuteDropdown)}
              title="Click to select"
            >
              {currentTime.minute}
            </div>
            {showMinuteDropdown && (
              <div className="time-dropdown-menu minute-dropdown">
                <div className="minute-grid">
                  {minutes.map(m => (
                    <button
                      key={m}
                      type="button"
                      className={`minute-button ${m === currentTime.minute ? 'selected' : ''}`}
                      onClick={() => handleMinuteChange(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimePicker;