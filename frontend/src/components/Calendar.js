import React, { useState } from 'react';

function Calendar({ 
  onDateSelect, 
  selectedDate, 
  availableDates = [],
  minDate = null,
  maxDate = null,
  style = {} 
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay, year, month };
  };

  const { days, firstDay, year, month } = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const isSelected = (day) => {
    if (!selectedDate) return false;
    const date = new Date(year, month, day);
    return date.toDateString() === selectedDate.toDateString();
  };

  const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

  const isAvailable = (day) => {
    const date = new Date(year, month, day);
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    if (availableDates.length > 0) {
      return return availableDates.includes(formatDate(date));
    }
    return true;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day) => {
    if (isAvailable(day)) {
      const selected = new Date(year, month, day);
      onDateSelect?.(selected);
    }
  };

  const renderDays = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayNames.map(day => (
      <div 
        key={day}
        style={{
          padding: '10px',
          textAlign: 'center',
          fontWeight: '600',
          color: '#64748b',
          fontSize: '0.875rem'
        }}
      >
        {day}
      </div>
    ));
  };

  const renderDates = () => {
    const dateElements = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      dateElements.push(
        <div key={`empty-${i}`} style={{ padding: '10px' }}></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= days; day++) {
      const available = isAvailable(day);
      const selected = isSelected(day);
      
      dateElements.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          style={{
            padding: '10px',
            textAlign: 'center',
            cursor: available ? 'pointer' : 'not-allowed',
            borderRadius: '10px',
            background: selected ? '#2563eb' : available ? 'transparent' : '#f1f5f9',
            color: selected ? 'white' : available ? '#1e293b' : '#cbd5e1',
            fontWeight: '500',
            transition: 'all 0.2s',
            transform: available ? 'scale(1)' : 'scale(0.9)'
          }}
          onMouseEnter={(e) => {
            if (available && !selected) {
              e.target.style.background = '#f1f5f9';
            }
          }}
          onMouseLeave={(e) => {
            if (available && !selected) {
              e.target.style.background = 'transparent';
            }
          }}
        >
          {day}
        </div>
      );
    }

    return dateElements;
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '15px',
      padding: '20px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      ...style
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <button
          onClick={handlePrevMonth}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            color: '#2563eb',
            padding: '5px 10px'
          }}
        >
          ◀
        </button>
        <h3 style={{
          fontSize: '1.2rem',
          fontWeight: '600',
          color: '#1e293b',
          margin: 0
        }}>
          {monthNames[month]} {year}
        </h3>
        <button
          onClick={handleNextMonth}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            color: '#2563eb',
            padding: '5px 10px'
          }}
        >
          ▶
        </button>
      </div>

      {/* Day Names */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        marginBottom: '10px'
      }}>
        {renderDays()}
      </div>

      {/* Dates */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '2px'
      }}>
        {renderDates()}
      </div>
    </div>
  );
}

export default Calendar;