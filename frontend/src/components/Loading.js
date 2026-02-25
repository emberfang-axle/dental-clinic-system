import React from 'react';

function Loading({ type = 'spinner', size = 'md', text = 'Loading...' }) {
  const sizes = {
    sm: { spinner: '30px', text: '0.8rem' },
    md: { spinner: '50px', text: '1rem' },
    lg: { spinner: '70px', text: '1.2rem' }
  };

  if (type === 'spinner') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div style={{
          width: sizes[size].spinner,
          height: sizes[size].spinner,
          border: '4px solid #f1f5f9',
          borderTop: '4px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{
          marginTop: '15px',
          color: '#64748b',
          fontSize: sizes[size].text
        }}>
          {text}
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (type === 'dots') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '12px',
                height: '12px',
                background: '#2563eb',
                borderRadius: '50%',
                animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`
              }}
            ></div>
          ))}
        </div>
        <p style={{
          marginTop: '15px',
          color: '#64748b',
          fontSize: sizes[size].text
        }}>
          {text}
        </p>
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
            }
            40% {
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    );
  }

  if (type === 'bars') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '40px' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: `${20 + i * 5}px`,
                background: '#2563eb',
                borderRadius: '4px',
                animation: `wave 1s ease-in-out ${i * 0.1}s infinite both`
              }}
            ></div>
          ))}
        </div>
        <p style={{
          marginTop: '15px',
          color: '#64748b',
          fontSize: sizes[size].text
        }}>
          {text}
        </p>
        <style>{`
          @keyframes wave {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(0.5); }
          }
        `}</style>
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div style={{
          width: sizes[size].spinner,
          height: sizes[size].spinner,
          borderRadius: '50%',
          background: '#2563eb',
          animation: 'pulse 1.5s ease-in-out infinite'
        }}></div>
        <p style={{
          marginTop: '15px',
          color: '#64748b',
          fontSize: sizes[size].text
        }}>
          {text}
        </p>
        <style>{`
          @keyframes pulse {
            0% { transform: scale(0.8); opacity: 0.5; }
            50% { transform: scale(1); opacity: 1; }
            100% { transform: scale(0.8); opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  return null;
}

// Full Page Loading Component
export function FullPageLoading({ text = 'Loading...' }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(255, 255, 255, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <Loading type="spinner" size="lg" text={text} />
    </div>
  );
}

// Inline Loading Component
export function InlineLoading({ text = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 0'
    }}>
      <div style={{
        width: '20px',
        height: '20px',
        border: '2px solid #f1f5f9',
        borderTop: '2px solid #2563eb',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{text}</span>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Loading;