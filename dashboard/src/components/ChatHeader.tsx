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
  senderName?: string;
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
  const [selectedAssignee, setSelectedAssignee] = useState(session.assigneeId || '');
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    setSelectedAssignee(session.assigneeId || '');
  }, [session.assigneeId]);

  const handleTransfer = async () => {
    if (selectedAssignee && selectedAssignee !== session.assigneeId) {
        setIsTransferring(true);
        await onAssign(session.phone, selectedAssignee);
        setIsTransferring(false);
    }
  };
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

  const displayName = session.name || session.senderName || session.phone;

  // Format phone if displayName is same as phone
  const formatPhone = (phone: string) => {
    // Basic formatting for Brazil (55)(DD)(9XXXX)(XXXX)
    const match = phone.match(/^55(\d{2})(\d{5})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    // Try shorter (55)(DD)(XXXX)(XXXX)
    const matchShort = phone.match(/^55(\d{2})(\d{4})(\d{4})$/);
    if (matchShort) {
        return `(${matchShort[1]}) ${matchShort[2]}-${matchShort[3]}`;
    }
    return phone;
  };

  const displayTitle = displayName === session.phone ? formatPhone(displayName) : displayName;
  const displaySubtitle = formatPhone(session.phone);

  return (
    <div style={{
      padding: '16px 20px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexWrap: 'wrap', // Allow wrapping
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px', // Add gap for wrapped items
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
    }}>
      {/* LEFT: User Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
        {/* Avatar */}
        <div style={{
          width: '40px', // Slightly smaller
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          border: '2px solid #fff',
          boxShadow: '0 0 0 1px #e5e7eb',
          flexShrink: 0 // Prevent shrinking
        }}>
          {session.profilePicUrl ? (
            <img src={session.profilePicUrl} alt={displayTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#6b7280' }}>
              {getInitials(displayTitle)}
            </span>
          )}
        </div>

        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>
            {displayTitle}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>{displaySubtitle}</span>
            {/* Status Badge */}
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '999px',
              backgroundColor: session.status === 'paused' ? '#fff7ed' : '#ecfdf5',
              color: session.status === 'paused' ? '#c2410c' : '#047857',
              border: `1px solid ${session.status === 'paused' ? '#ffedd5' : '#a7f3d0'}`,
              whiteSpace: 'nowrap'
            }}>
              {session.status === 'paused' ? 'IA Pausada' : 'IA Ativa'}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
        
        {/* Pause Button */}
        {session.status === 'paused' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {timeLeft && (
              <span style={{ fontSize: '12px', color: '#c2410c', fontWeight: 500, whiteSpace: 'nowrap' }}>
                Volta em {timeLeft}
              </span>
            )}
            <button
              onClick={() => onTogglePause(session.phone, 'paused')} // Toggle back to active
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                color: '#374151',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              Retomar
            </button>
          </div>
        ) : (
          <button
            onClick={() => onTogglePause(session.phone, 'active', 20)} // Pause for 20m
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#fff7ed',
              border: '1px solid #ffedd5',
              color: '#c2410c',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>⏸️</span> Pausar (20m)
          </button>
        )}

        {/* Divider - Hide on small screens if wrapped */}
        <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb', display: 'none' }} className="hidden md:block" />

        {/* Transfer Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>Transferir:</span>
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              fontSize: '12px',
              color: '#374151',
              backgroundColor: '#fff',
              cursor: 'pointer',
              outline: 'none',
              maxWidth: '120px' // Limit width
            }}
          >
            <option value="">--</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          {selectedAssignee && selectedAssignee !== session.assigneeId && (
            <button
                onClick={handleTransfer}
                disabled={isTransferring}
                style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    opacity: isTransferring ? 0.7 : 1
                }}
            >
                {isTransferring ? '...' : 'Enviar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
