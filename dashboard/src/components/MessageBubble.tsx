import React from 'react';

interface MessageBubbleProps {
  content: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: string;
  senderName?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ content, sender, timestamp, senderName }) => {
  const isUser = sender === 'user';
  
  // Format WhatsApp markdown
  const formatMessage = (text: string) => {
    if (!text) return '';
    
    // HTML escape to prevent XSS (basic)
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold *text*
    formatted = formatted.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    
    // Italic _text_
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Strikethrough ~text~
    formatted = formatted.replace(/~(.*?)~/g, '<del>$1</del>');
    
    // Code `text`
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Newlines
    formatted = formatted.replace(/\n/g, '<br/>');

    return formatted;
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: isUser ? 'flex-start' : 'flex-end',
      marginBottom: '16px',
      maxWidth: '85%',
      alignSelf: isUser ? 'flex-start' : 'flex-end',
      marginLeft: isUser ? '0' : 'auto',
      marginRight: isUser ? 'auto' : '0'
    }}>
      {/* Sender Name for Agent/Bot messages */}
      {!isUser && senderName && (
        <span style={{ 
          fontSize: '11px', 
          color: '#6b7280', 
          marginBottom: '2px', 
          marginRight: '4px'
        }}>
          {senderName}
        </span>
      )}
      
      {/* Sender Name for User messages */}
      {isUser && senderName && (
        <span style={{ 
          fontSize: '11px', 
          color: '#6b7280', 
          marginBottom: '2px', 
          marginLeft: '4px'
        }}>
          {senderName}
        </span>
      )}

      <div style={{
        padding: '12px 16px',
        borderRadius: isUser ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
        backgroundColor: isUser ? '#ffffff' : '#e3f2fd', // White for user, Light Blue for agent/bot
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        border: '1px solid',
        borderColor: isUser ? '#e5e7eb' : '#bbdefb',
        color: '#1f2937',
        fontSize: '14px',
        lineHeight: '1.5',
        position: 'relative'
      }}>
        <div dangerouslySetInnerHTML={{ __html: formatMessage(content) }} />
        
        <div style={{ 
          fontSize: '10px', 
          color: '#9ca3af', 
          marginTop: '6px',
          textAlign: 'right' 
        }}>
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};
