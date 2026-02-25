import React from 'react';

function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  style = {},
  className = ''
}) {
  const baseStyle = {
    padding: '12px 25px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    opacity: disabled ? 0.6 : 1
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      color: 'white'
    },
    success: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white'
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: 'white'
    },
    outline: {
      background: 'transparent',
      border: '2px solid #2563eb',
      color: '#2563eb'
    },
    warning: {
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: 'white'
    }
  };

  const sizes = {
    sm: { padding: '8px 15px', fontSize: '0.875rem' },
    md: { padding: '12px 25px', fontSize: '1rem' },
    lg: { padding: '15px 30px', fontSize: '1.1rem' }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...baseStyle,
        ...variants[variant],
        ...sizes[size],
        ...style
      }}
      className={className}
    >
      {children}
    </button>
  );
}

export default Button;