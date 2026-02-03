import React, { useState, useRef, useEffect } from 'react';
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
  Globe,
  Mic,
  Image as ImageIcon,
  FileText,
  Camera,
  UserPlus,
  Trash2
} from 'lucide-react';

interface ChatInterfaceProps {
  sessions: any[];
  selectedSession: any;
  onSelectSession: (session: any) => void;
  onSendMessage: (phone: string, text: string) => void;
  onTogglePause: (phone: string, status: string) => void;
  onAddTag: (phone: string, tag: string) => void;
  onRemoveTag: (phone: string, tag: string) => void;
  onTransferSession: (phone: string, assigneeId: string) => void;
  user: any;
  usersList: any[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  sessions, 
  selectedSession, 
  onSelectSession, 
  onSendMessage,
  onTogglePause,
  onAddTag,
  onRemoveTag,
  onTransferSession,
  user,
  usersList
}) => {
  const [msgText, setMsgText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  // WhatsApp Features State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingInterval = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedSession?.history]);

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

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingInterval.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    clearInterval(recordingInterval.current);
    // Here we would handle the audio file
    console.log(`Audio recorded: ${recordingTime}s`);
    // For now, just send a text indicator or nothing
    alert('Funcionalidade de áudio simulada (upload pendente)');
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
    clearInterval(recordingInterval.current);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = () => {
    if (!msgText.trim()) return;
    
    let textToSend = msgText;
    if (replyingTo) {
      textToSend = `> ${replyingTo.content.substring(0, 50)}${replyingTo.content.length > 50 ? '...' : ''}\n\n${msgText}`;
    }
    
    onSendMessage(selectedSession.phone, textToSend);
    setMsgText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
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
                  {selectedSession.assigneeId && (
                    <span className="ml-2 text-blue-600">
                      • Atribuído a: {usersList.find(u => u.id === selectedSession.assigneeId)?.name || 'Desconhecido'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              {/* Transfer Button */}
              <button 
                className="btn btn-ghost" 
                title="Transferir Atendimento"
                onClick={() => setShowTransferModal(true)}
              >
                <UserPlus size={20} />
              </button>

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
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', backgroundSize: 'contain' }}>
            {selectedSession.history.map((msg: any, idx: number) => (
              <div key={idx} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: msg.role === 'user' ? 'flex-start' : 'flex-end',
                marginBottom: '12px'
              }}>
                <div 
                  className={`message-bubble ${msg.role === 'user' ? 'user' : 'agent'}`}
                  style={{ position: 'relative', cursor: 'pointer' }}
                  onClick={() => setReplyingTo(msg)}
                  title="Clique para responder"
                >
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
                    {msg.role !== 'user' && <CheckCheck size={12} color={idx === selectedSession.history.length - 1 ? '#3b82f6' : '#94a3b8'} />}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ 
            padding: '16px 24px', 
            background: 'var(--surface)', 
            borderTop: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            {/* Reply Preview */}
            {replyingTo && (
              <div className="flex items-center justify-between p-2 bg-gray-100 rounded-lg border-l-4 border-blue-500 mb-2">
                <div className="flex flex-col text-sm">
                  <span className="font-bold text-blue-600">{replyingTo.senderName || (replyingTo.role === 'user' ? 'Cliente' : 'Agente')}</span>
                  <span className="text-gray-600 truncate max-w-xs">{replyingTo.content}</span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-gray-700">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Attachments Menu */}
            {showAttachMenu && (
              <div style={{
                position: 'absolute', bottom: '80px', left: '24px',
                background: 'white', borderRadius: '12px', padding: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex', flexDirection: 'column', gap: '12px',
                zIndex: 50
              }}>
                <button className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded transition-colors" onClick={() => alert('Anexo de Imagem (Simulado)')}>
                  <ImageIcon size={20} color="#bf59cf" /> <span>Fotos e Vídeos</span>
                </button>
                <button className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded transition-colors" onClick={() => alert('Anexo de Câmera (Simulado)')}>
                  <Camera size={20} color="#d3396d" /> <span>Câmera</span>
                </button>
                <button className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded transition-colors" onClick={() => alert('Anexo de Documento (Simulado)')}>
                  <FileText size={20} color="#5157ae" /> <span>Documento</span>
                </button>
              </div>
            )}

            {/* Signature Preview */}
            <div className="flex items-center gap-2 text-xs text-gray-500 px-2">
                <span className="font-semibold text-blue-600">Assinatura Ativa:</span> 
                <span>{user?.name || 'Agente'} - {user?.jobTitle || user?.role || 'Suporte'}</span>
            </div>

            <div className="flex gap-2 items-center w-full">
                <button 
                  className="btn btn-ghost" 
                  style={{ padding: 8 }}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile size={24} />
                </button>
                <button 
                  className="btn btn-ghost" 
                  style={{ padding: 8 }}
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                >
                  <Paperclip size={24} />
                </button>
                
                <div className="flex-1 relative">
                  <input 
                    className="input w-full" 
                    style={{ padding: '12px', borderRadius: '24px' }}
                    placeholder={isRecording ? "Gravando áudio..." : "Digite sua mensagem..."}
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') handleSend();
                    }}
                    disabled={isRecording}
                  />
                  {isRecording && (
                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 text-red-500 font-bold animate-pulse">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        {formatTime(recordingTime)}
                     </div>
                  )}
                </div>
                
                {msgText.trim() ? (
                  <button 
                    className="btn btn-primary" 
                    style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0 }}
                    onClick={handleSend}
                  >
                    <Send size={20} />
                  </button>
                ) : (
                  <button 
                    className={`btn ${isRecording ? 'btn-danger' : 'btn-ghost'}`}
                    style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0 }}
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    title={isRecording ? "Parar e Enviar" : "Gravar Áudio"}
                  >
                    {isRecording ? <Send size={20} /> : <Mic size={24} />}
                  </button>
                )}
                
                {isRecording && (
                  <button 
                    className="btn btn-ghost text-red-500"
                    style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0 }}
                    onClick={handleCancelRecording}
                    title="Cancelar"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
            </div>
          </div>

          {/* Transfer Modal */}
          {showTransferModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999
            }}>
              <div className="card" style={{ width: '400px', padding: '24px' }}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Transferir Atendimento</h3>
                  <button onClick={() => setShowTransferModal(false)}><X size={20} /></button>
                </div>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {usersList.filter(u => u.id !== user.id).map(u => (
                    <button 
                      key={u.id}
                      className="p-3 text-left hover:bg-gray-100 rounded flex items-center gap-3"
                      onClick={() => {
                        onTransferSession(selectedSession.phone, u.id);
                        setShowTransferModal(false);
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                        {u.name?.[0]}
                      </div>
                      <div>
                        <div className="font-bold">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.jobTitle || u.role}</div>
                      </div>
                    </button>
                  ))}
                  {usersList.length <= 1 && <div className="text-gray-500 text-center py-4">Nenhum outro agente disponível.</div>}
                </div>
              </div>
            </div>
          )}
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
