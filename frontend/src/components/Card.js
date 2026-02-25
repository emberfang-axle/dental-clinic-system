import React from 'react';

function Card({ 
  children, 
  title, 
  style = {}, 
  className = '',
  headerStyle = {},
  onClick 
}) {
  return (
    <div 
      className={`card ${className}`}
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: '15px',
        padding: '25px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        marginBottom: '25px',
        transition: 'transform 0.3s, box-shadow 0.3s',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      {title && (
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '2px solid #f1f5f9',
            ...headerStyle
          }}
        >
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1e293b',
            margin: 0
          }}>
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({ icon, label, value, color = 'blue' }) {
  const colors = {
    blue: { background: '#dbeafe', color: '#2563eb' },
    green: { background: '#d1fae5', color: '#10b981' },
    orange: { background: '#fef3c7', color: '#f59e0b' },
    purple: { background: '#ede9fe', color: '#7c3aed' },
    red: { background: '#fee2e2', color: '#ef4444' }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '15px',
      padding: '25px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      transition: 'transform 0.3s'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.8rem',
        background: colors[color]?.background,
        color: colors[color]?.color
      }}>
        {icon}
      </div>
      <div>
        <h3 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#1e293b',
          margin: 0
        }}>
          {value}
        </h3>
        <p style={{
          color: '#64748b',
          fontSize: '0.9rem',
          margin: 0
        }}>
          {label}
        </p>
      </div>
    </div>
  );
}

export default Card;