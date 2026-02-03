import React, { useState } from 'react';
import { 
  Search, 
  Paperclip, 
  Send, 
  MoreVertical, 
  Phone, 
  Smile, 
  CheckCheck,
  Tag,
  Users,
  MessageCircle,
  X,
  Instagram,
  Mail,
  Globe
} from 'lucide-react';

interface ChatInterfaceProps {
  sessions: any[];
  selectedSession: any;
  onSelectSession: (session: any) => void;
  onSendMessage: (phone: string, text: string) => void;
  onTogglePause: (phone: string, status: string) => void;
  onAddTag: (phone: string, tag: string) => void;
  onRemoveTag: (phone: string, tag: string) => void;
  user: any;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  sessions, 
  selectedSession, 
  onSelectSession, 
  onSendMessage,
  onTogglePause,
  onAddTag,
  onRemoveTag,
  user
}) => {
  const [msgText, setMsgText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');

  const getChannelIcon = (channel: string = 'whatsapp') => {
    switch (channel) {
      case 'instagram': return <Instagram size={12} color="#E1306C" />;
      case 'email': return <Mail size={12} color="#EA4335" />;
      case 'web': return <Globe size={12} color="#4285F4" />;
      default: return <MessageCircle size={12} color="#25D366" />; // WhatsApp
    }
  };

  const formatMessage = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i, arr) => (
      <React.Fragment key={i}>
        {line.split(/(\*[^*]+\*)/g).map((part, j) => {
           if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
             return <strong key={j}>{part.slice(1, -1)}</strong>;
           }
           return part;
        })}
        {i < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const filteredSessions = sessions.filter(s => 
    s.phone.includes(searchTerm) || 
    s.history[s.history.length-1]?.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="chat-container">
      {/* Sidebar List */}
      <div className="chat-list">
        <div style={{ padding: '16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              className="input" 
              placeholder="Buscar conversa..." 
              style={{ paddingLeft: '36px', background: 'var(--background)' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filteredSessions.map(session => (
            <div 
              key={session.phone}
              onClick={() => onSelectSession(session)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                background: selectedSession?.phone === session.phone ? 'var(--surface-hover)' : 'transparent',
                display: 'flex',
                gap: '12px',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  width: '40px', height: '40px', 
                  borderRadius: '50%', 
                  background: '#e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 600, color: '#64748b'
                }}>
                  {session.phone.slice(-2)}
                </div>
                <div style={{ 
                  position: 'absolute', bottom: 0, right: 0, 
                  width: '10px', height: '10px', 
                  borderRadius: '50%', 
                  background: session.status === 'PAUSED' ? 'var(--warning)' : 'var(--success)',
                  border: '2px solid white'
                }}></div>
                
                <div style={{ 
                   position: 'absolute', top: -4, right: -4, 
                   background: 'white', borderRadius: '50%', padding: 3,
                   boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                   display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                   {getChannelIcon(session.channel)}
                </div>
              </div>
              
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{session.phone}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {new Date(session.history[session.history.length-1]?.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {session.history[session.history.length-1]?.content || 'Nova conversa'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      {selectedSession ? (
        <div className="chat-window">
          {/* Header */}
          <header style={{ 
            padding: '12px 24px', 
            background: 'var(--surface)', 
            borderBottom: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div className="flex items-center gap-3">
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} color="#64748b" />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{selectedSession.phone}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {selectedSession.status === 'PAUSED' ? 'Em atendimento (Pausado)' : 'Ativo (Bot)'}
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div className="flex gap-1 items-center relative">
                {selectedSession.tags?.map((tag: string, i: number) => (
                    <div key={i} className="flex items-center gap-1" style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1' }}>
                        {tag}
                        <X 
                          size={10} 
                          style={{ cursor: 'pointer' }}
                          onClick={() => onRemoveTag(selectedSession.phone, tag)} 
                        />
                    </div>
                ))}
                
                <div style={{ position: 'relative' }}>
                  <button 
                      onClick={() => setShowTagInput(!showTagInput)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                      <Tag size={16} />
                  </button>

                  {showTagInput && (
                    <div style={{ 
                      position: 'absolute', top: '100%', right: 0, 
                      background: 'white', padding: '8px', 
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', 
                      borderRadius: '6px', zIndex: 50,
                      display: 'flex', gap: '4px', minWidth: '200px',
                      border: '1px solid var(--border)'
                    }}>
                      <select 
                          onChange={(e) => {
                              if (e.target.value) {
                                  onAddTag(selectedSession.phone, e.target.value);
                                  setShowTagInput(false);
                              }
                          }}
                          style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '12px' }}
                      >
                          <option value="">Selecione...</option>
                          <option value="Quente">Quente</option>
                          <option value="Morno">Morno</option>
                          <option value="Frio">Frio</option>
                          <option value="Reunião Agendada">Reunião Agendada</option>
                          <option value="Cliente Antigo">Cliente Antigo</option>
                          <option value="Lead Novo">Lead Novo</option>
                      </select>
                      <input 
                          placeholder="Nova tag..." 
                          value={newTag} 
                          onChange={e => setNewTag(e.target.value)}
                          style={{ width: '80px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '12px' }}
                      />
                      <button 
                          onClick={() => {
                            if (newTag) {
                              onAddTag(selectedSession.phone, newTag);
                              setNewTag('');
                              setShowTagInput(false);
                            }
                          }}
                          className="btn btn-primary"
                          style={{ padding: '4px 8px', fontSize: '12px', height: 'auto' }}
                      >
                          OK
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ width: 1, height: 24, background: 'var(--border)' }}></div>
              <button className="btn btn-ghost" title="Pausar/Retomar" onClick={() => onTogglePause(selectedSession.phone, selectedSession.status)}>
                 {selectedSession.status === 'PAUSED' ? 'Devolver p/ Bot' : 'Assumir Conversa'}
              </button>
              <button className="btn btn-ghost"><Phone size={20} /></button>
              <button className="btn btn-ghost"><MoreVertical size={20} /></button>
            </div>
          </header>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {selectedSession.history.map((msg: any, idx: number) => (
              <div key={idx} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: msg.role === 'user' ? 'flex-start' : 'flex-end',
                marginBottom: '12px'
              }}>
                <div className={`message-bubble ${msg.role === 'user' ? 'user' : 'agent'}`}>
                  {msg.senderName && msg.role !== 'user' && (
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', marginBottom: '2px' }}>
                        {msg.senderName}
                    </div>
                  )}
                  {formatMessage(msg.content)}
                  <div style={{ 
                    fontSize: '10px', 
                    color: '#94a3b8', 
                    textAlign: 'right', 
                    marginTop: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px'
                  }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    {msg.role !== 'user' && <CheckCheck size={12} />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div style={{ 
            padding: '16px 24px', 
            background: 'var(--surface)', 
            borderTop: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            {/* Signature Preview */}
            <div className="flex items-center gap-2 text-xs text-gray-500 px-2">
                <span className="font-semibold text-blue-600">Assinatura Ativa:</span> 
                <span>{user?.name || 'Agente'} - {user?.jobTitle || user?.role || 'Suporte'}</span>
            </div>

            <div className="flex gap-4 items-center w-full">
                <button className="btn btn-ghost" style={{ padding: 8 }}><Smile size={20} /></button>
                <button className="btn btn-ghost" style={{ padding: 8 }}><Paperclip size={20} /></button>
                
                <input 
                  className="input" 
                  style={{ flex: 1, padding: '12px', borderRadius: '24px' }}
                  placeholder="Digite sua mensagem..."
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  onKeyDown={e => {
                      if (e.key === 'Enter') {
                          onSendMessage(selectedSession.phone, msgText);
                          setMsgText('');
                      }
                  }}
                />
                
                <button 
                  className="btn btn-primary" 
                  style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
                  onClick={() => {
                      onSendMessage(selectedSession.phone, msgText);
                      setMsgText('');
                  }}
                >
                  <Send size={18} />
                </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1" style={{ background: '#f0f2f5', borderLeft: '1px solid var(--border)' }}>
          <div style={{ width: 120, height: 120, background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
             <MessageCircle size={48} color="#94a3b8" />
          </div>
          <h2 style={{ color: '#475569' }}>Lopes CRM Web</h2>
          <p style={{ color: '#64748b', marginTop: 8 }}>Selecione uma conversa para começar o atendimento.</p>
        </div>
      )}
    </div>
  );
};
