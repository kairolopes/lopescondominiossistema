import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Session {
  phone: string;
  name?: string;
  status?: string;
  pausedAt?: string | null; // ISO string
  assigneeId?: string;
  profilePicUrl?: string; // New field
}

interface ChatHeaderProps {
  session: Session;
  users: User[];
  onTogglePause: (phone: string, status: string, duration?: number) => void;
  onAssign: (phone: string, assigneeId: string) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ session, users, onTogglePause, onAssign }) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (session.status === 'paused' && session.pausedAt) {
      const interval = setInterval(() => {
        const pausedTime = new Date(session.pausedAt!).getTime();
        const now = new Date().getTime();
        const elapsed = now - pausedTime;
        const duration = 20 * 60 * 1000; // 20 minutes in ms
        const remaining = duration - elapsed;

        if (remaining <= 0) {
          setTimeLeft('Retornando...');
          // Optionally trigger auto-resume here if frontend-driven, but backend handles it too
        } else {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
    }
  }, [session.status, session.pausedAt]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const displayName = session.name || session.phone;

  return (
    <div style={{
      padding: '16px 24px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
    }}>
      {/* LEFT: User Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Avatar */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          border: '2px solid #fff',
          boxShadow: '0 0 0 1px #e5e7eb'
        }}>
          {session.profilePicUrl ? (
            <img src={session.profilePicUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#6b7280' }}>
              {getInitials(displayName)}
            </span>
          )}
        </div>

        {/* Name & Phone */}
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>
            {displayName}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              {session.phone}
            </span>
            {/* Status Badge */}
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: session.status === 'paused' ? '#fff7ed' : '#ecfdf5',
              color: session.status === 'paused' ? '#c2410c' : '#047857',
              border: `1px solid ${session.status === 'paused' ? '#ffedd5' : '#a7f3d0'}`
            }}>
              {session.status === 'paused' ? 'IA Pausada' : 'IA Ativa'}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Pause Button */}
        {session.status === 'paused' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {timeLeft && (
              <span style={{ fontSize: '13px', color: '#c2410c', fontWeight: 500 }}>
                Retorna em {timeLeft}
              </span>
            )}
            <button
              onClick={() => onTogglePause(session.phone, 'paused')} // Toggle back to active
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                color: '#374151',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Retomar Agora
            </button>
          </div>
        ) : (
          <button
            onClick={() => onTogglePause(session.phone, 'active', 20)} // Pause for 20m
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: '#fff7ed',
              border: '1px solid #ffedd5',
              color: '#c2410c',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⏸️</span> Pausar IA (20m)
          </button>
        )}

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb' }} />

        {/* Transfer Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Transferir para:</span>
          <select
            value={session.assigneeId || ''}
            onChange={(e) => onAssign(session.phone, e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
              color: '#374151',
              backgroundColor: '#fff',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '140px'
            }}
          >
            <option value="">-- Escolher --</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
