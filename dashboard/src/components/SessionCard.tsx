import React, { useRef, useEffect } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';

interface Session {
  phone: string;
  name?: string;
  step: string;
  status?: string;
  pausedAt?: string | null;
  history: { role: 'user' | 'bot' | 'agent', content: string, timestamp: string, senderName?: string }[];
  assigneeId?: string;
  profilePicUrl?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SessionCardProps {
  session: Session;
  users: User[];
  replyText: string;
  setReplyText: (text: string) => void;
  onSendMessage: () => void;
  onTogglePause: (phone: string, status: string, duration?: number) => void;
  onAssign: (phone: string, assigneeId: string) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  users,
  replyText,
  setReplyText,
  onSendMessage,
  onTogglePause,
  onAssign
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.history]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '600px', // Taller for better view
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      overflow: 'hidden',
      border: '1px solid #e5e7eb'
    }}>
      
      {/* Header */}
      <ChatHeader 
        session={session} 
        users={users} 
        onTogglePause={onTogglePause} 
        onAssign={onAssign} 
      />

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        backgroundColor: '#f9fafb',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {session.history.map((msg, idx) => (
          <MessageBubble 
            key={idx}
            content={msg.content}
            sender={msg.role === 'user' ? 'user' : (msg.role === 'bot' ? 'bot' : 'agent')}
            timestamp={msg.timestamp}
            senderName={msg.role === 'user' ? undefined : (msg.senderName || (msg.role === 'bot' ? 'Antigravity Bot' : 'Agente'))}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <input
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Digite sua mensagem..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s',
            backgroundColor: '#f9fafb'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          onKeyDown={(e) => { if (e.key === 'Enter') onSendMessage() }}
        />
        <button
          onClick={onSendMessage}
          style={{
            padding: '10px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
        >
          Enviar
        </button>
      </div>
    </div>
  );
};
