import { useState, useEffect } from 'react';
import { Login } from './Login';
import { KanbanBoard } from './components/KanbanBoard';

interface Session {
  phone: string;
  step: string;
  status?: string; // 'active' | 'paused'
  tags: string[];
  history: { role: 'user' | 'bot' | 'agent', content: string, timestamp: string }[];
  assigneeId?: string;
}

interface Campaign {
  id: string;
  name: string;
  message: string;
  scheduledAt: string;
  targetTag: string;
  status: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'master' | 'agent' | 'admin';
  department?: string;
}

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3006');
const API_URL = `${BASE_URL}/api/admin`;
const AUTH_URL = `${BASE_URL}/api/auth`;

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);

  const [activeTab, setActiveTab] = useState<'sessions' | 'kanban' | 'campaigns' | 'broadcast' | 'team'>('sessions');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  
  // Forms
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastPhones, setBroadcastPhones] = useState('');
  
  // Chat Reply State
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const [campName, setCampName] = useState('');
  const [campMsg, setCampMsg] = useState('');
  const [campDate, setCampDate] = useState('');
  const [campTag, setCampTag] = useState('');

  // User Mgmt Form
  const [newUser, setNewUser] = useState({ name: '', email: '', department: '', role: 'agent', password: '' });

  const handleLogin = (token: string, userData: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const fetchWithAuth = async (url: string, options: any = {}) => {
    const headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 || res.status === 403) {
      handleLogout();
      throw new Error('Unauthorized');
    }
    return res;
  };

  const fetchSessions = async () => {
    if (!token) return;
    try {
      const res = await fetchWithAuth(`${API_URL}/sessions`);
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error('Error fetching sessions', err);
    }
  };

  const fetchCampaigns = async () => {
    if (!token) return;
    try {
      const res = await fetchWithAuth(`${API_URL}/campaigns`);
      const data = await res.json();
      setCampaigns(data);
    } catch (err) {
      console.error('Error fetching campaigns', err);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetchWithAuth(`${AUTH_URL}/users`);
      const data = await res.json();
      setUsersList(data);
    } catch (err) {
      console.error('Error fetching users', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSessions();
      fetchUsers();
      const interval = setInterval(fetchSessions, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
        if (activeTab === 'campaigns') fetchCampaigns();
        if (activeTab === 'team') fetchUsers();
    }
  }, [activeTab, token]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const phonesArray = broadcastPhones.split(',').map(p => p.trim()).filter(Boolean);
    try {
      await fetchWithAuth(`${API_URL}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMsg, phones: phonesArray })
      });
      alert('Broadcast enviado!');
      setBroadcastMsg('');
      setBroadcastPhones('');
    } catch (err) {
      alert('Erro ao enviar broadcast');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth(`${API_URL}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campName,
          message: campMsg,
          scheduledAt: campDate,
          targetTag: campTag
        })
      });
      alert('Campanha criada!');
      setCampName('');
      setCampMsg('');
      setCampDate('');
      setCampTag('');
      fetchCampaigns();
    } catch (err) {
      alert('Erro ao criar campanha');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await fetchWithAuth(`${AUTH_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });
        alert('Usuário criado com sucesso!');
        setNewUser({ name: '', email: '', department: '', role: 'agent', password: '' });
        fetchUsers();
    } catch (err) {
        alert('Erro ao criar usuário');
    }
  };

  const handleSendMessage = async (phone: string) => {
    const message = replyText[phone];
    if (!message?.trim()) return;

    try {
        await fetchWithAuth(`${API_URL}/messages/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              phone, 
              message,
              senderName: user?.name || 'Agente'
            })
        });
        setReplyText(prev => ({ ...prev, [phone]: '' }));
        fetchSessions(); // Refresh chat
    } catch (err) {
        alert('Erro ao enviar mensagem');
    }
  };

  const handleTogglePause = async (phone: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PAUSED' ? 'active' : 'paused';
    try {
        await fetchWithAuth(`${API_URL}/sessions/${phone}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        fetchSessions();
    } catch (err) {
        alert('Erro ao alterar status do atendimento');
    }
  };

  const handleAssignSession = async (phone: string, assigneeId: string) => {
    try {
        await fetchWithAuth(`${API_URL}/sessions/${phone}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assigneeId })
        });
        fetchSessions();
    } catch (err) {
        alert('Erro ao atribuir atendimento');
    }
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  const NavButton = ({ tab, label, icon }: { tab: typeof activeTab, label: string, icon: string }) => (
    <button 
      onClick={() => setActiveTab(tab)}
      style={{ 
        width: '100%',
        textAlign: 'left',
        padding: '12px 20px', 
        borderRadius: '8px', 
        border: 'none', 
        background: activeTab === tab ? '#e1f5fe' : 'transparent', 
        color: activeTab === tab ? '#0277bd' : '#546e7a', 
        cursor: 'pointer', 
        fontWeight: activeTab === tab ? 'bold' : 'normal',
        marginBottom: '5px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '14px',
        transition: 'all 0.2s'
      }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span> {label}
    </button>
  );

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', display: 'flex', height: '100vh', background: '#f5f7fa', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '250px', background: 'white', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <div style={{ marginBottom: '40px', paddingLeft: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '20px', color: '#2c3e50', fontWeight: '800' }}>Lopes CRM</h1>
            <span style={{ fontSize: '12px', color: '#95a5a6', letterSpacing: '1px' }}>CONDOMÍNIOS</span>
        </div>

        <nav style={{ flex: 1 }}>
            <NavButton tab="sessions" label="Atendimentos" icon="💬" />
            <NavButton tab="kanban" label="Kanban (Tarefas)" icon="📊" />
            <NavButton tab="campaigns" label="Campanhas" icon="📅" />
            <NavButton tab="broadcast" label="Broadcast" icon="📢" />
            <NavButton tab="team" label="Equipe" icon="👥" />
        </nav>

        <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#34495e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                    {user?.name?.charAt(0) || 'U'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                    <div style={{ fontSize: '11px', color: '#95a5a6' }}>{user?.role === 'master' ? 'Master Admin' : 'Agente'}</div>
                </div>
            </div>
            <button 
                onClick={handleLogout}
                style={{ width: '100%', padding: '8px', border: '1px solid #e74c3c', color: '#e74c3c', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
            >
                Sair
            </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px' }}>
            
            {/* SESSIONS TAB */}
            {activeTab === 'sessions' && (
                <div>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ margin: 0, color: '#2c3e50' }}>Atendimentos em Tempo Real</h2>
                    <span style={{ fontSize: '13px', color: '#7f8c8d' }}>{sessions.length} conversas ativas</span>
                </header>
                
                {sessions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#bdc3c7', background: 'white', borderRadius: '12px' }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                        Nenhum atendimento ativo no momento.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {sessions.map(session => (
                        <div key={session.phone} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: `4px solid ${session.status === 'PAUSED' ? '#e74c3c' : '#3498db'}`, display: 'flex', flexDirection: 'column', height: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px' }}>{session.phone}</h3>
                                {session.status === 'PAUSED' && <span style={{fontSize: '10px', color: '#e74c3c', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px'}}>🔴 PAUSADO (HUMANO)</span>}
                                <div style={{ marginTop: '5px' }}>
                                    <select
                                        value={session.assigneeId || ''}
                                        onChange={(e) => handleAssignSession(session.phone, e.target.value)}
                                        style={{ fontSize: '11px', padding: '2px', borderRadius: '4px', border: '1px solid #ddd', maxWidth: '150px' }}
                                    >
                                        <option value="">Sem responsável</option>
                                        {usersList.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                                <span style={{ background: '#ecf0f1', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', color: '#7f8c8d' }}>{session.step}</span>
                                <button 
                                    onClick={() => handleTogglePause(session.phone, session.status || 'active')}
                                    title={session.status === 'PAUSED' ? 'Retomar Bot' : 'Pausar Bot e Assumir'}
                                    style={{ 
                                        background: session.status === 'PAUSED' ? '#2ecc71' : '#e74c3c', 
                                        color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', padding: '6px 10px', fontWeight: 'bold'
                                    }}
                                >
                                    {session.status === 'PAUSED' ? '▶ Retomar Bot' : '⏸ Assumir'}
                                </button>
                            </div>
                        </div>
                        
                        <div style={{ marginBottom: '10px' }}>
                            {session.tags.map(tag => (
                            <span key={tag} style={{ display: 'inline-block', background: '#e1f5fe', color: '#0277bd', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', marginRight: '5px' }}>
                                #{tag}
                            </span>
                            ))}
                        </div>

                        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', flex: 1, overflowY: 'auto', marginBottom: '15px', fontSize: '13px', display: 'flex', flexDirection: 'column-reverse' }}>
                            {session.history.slice().reverse().map((msg, idx) => (
                            <div key={idx} style={{ marginBottom: '12px', textAlign: msg.role === 'user' ? 'left' : 'right' }}>
                                <div style={{ 
                                display: 'inline-block', 
                                padding: '8px 12px', 
                                borderRadius: '12px', 
                                background: msg.role === 'user' ? 'white' : (msg.role === 'bot' ? '#e3f2fd' : '#e0f2f1'),
                                border: msg.role === 'user' ? '1px solid #eee' : 'none',
                                color: '#2c3e50',
                                maxWidth: '85%',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                borderTopLeftRadius: msg.role === 'user' ? '2px' : '12px',
                                borderTopRightRadius: msg.role === 'user' ? '12px' : '2px',
                                }}>
                                {msg.content}
                                </div>
                                <div style={{ fontSize: '10px', color: '#b2bec3', marginTop: '4px', paddingLeft: '4px' }}>
                                    {msg.role === 'bot' ? '🤖 Bot' : (msg.role === 'user' ? '👤 Cliente' : '👨‍💻 Agente')} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                            <input 
                                value={replyText[session.phone] || ''}
                                onChange={e => setReplyText(prev => ({...prev, [session.phone]: e.target.value}))}
                                placeholder="Digite sua resposta..."
                                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #dfe6e9', outline: 'none', fontSize: '13px' }}
                                onKeyDown={e => { if(e.key === 'Enter') handleSendMessage(session.phone) }}
                            />
                            <button 
                                onClick={() => handleSendMessage(session.phone)}
                                style={{ background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', padding: '0 20px', cursor: 'pointer', fontSize: '18px' }}
                            >
                                ➤
                            </button>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
                </div>
            )}

            {/* KANBAN TAB */}
            {activeTab === 'kanban' && (
                <div style={{ height: 'calc(100vh - 60px)', margin: '-30px' }}>
                    <KanbanBoard token={token || ''} baseUrl={BASE_URL} users={usersList} />
                </div>
            )}

            {/* CAMPAIGNS TAB */}
            {activeTab === 'campaigns' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', height: 'fit-content' }}>
                    <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Nova Campanha</h3>
                    <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input 
                        placeholder="Nome da Campanha" 
                        value={campName} onChange={e => setCampName(e.target.value)}
                        style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                    <textarea 
                        placeholder="Mensagem" 
                        value={campMsg} onChange={e => setCampMsg(e.target.value)}
                        style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd', minHeight: '100px' }}
                    />
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Data/Hora de Envio</label>
                        <input 
                        type="datetime-local" 
                        value={campDate} onChange={e => setCampDate(e.target.value)}
                        style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                    <input 
                        placeholder="Tag Alvo (ex: todos, inadimplente)" 
                        value={campTag} onChange={e => setCampTag(e.target.value)}
                        style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                    <button type="submit" style={{ padding: '12px', background: '#e67e22', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Agendar Campanha
                    </button>
                    </form>
                </div>

                <div>
                    <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Campanhas Agendadas</h3>
                    {campaigns.length === 0 ? <div style={{ padding: '40px', background: 'white', borderRadius: '12px', textAlign: 'center', color: '#95a5a6' }}>Nenhuma campanha agendada.</div> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {campaigns.map(camp => (
                        <div key={camp.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: `4px solid ${camp.status === 'completed' ? '#2ecc71' : '#f1c40f'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h4 style={{ margin: 0 }}>{camp.name}</h4>
                            <span style={{ fontSize: '12px', color: '#7f8c8d' }}>{new Date(camp.scheduledAt).toLocaleString()}</span>
                            </div>
                            <p style={{ color: '#34495e', margin: '10px 0' }}>{camp.message}</p>
                            <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                            <span style={{ background: '#dfe6e9', padding: '2px 8px', borderRadius: '4px' }}>Tag: {camp.targetTag}</span>
                            <span style={{ background: camp.status === 'completed' ? '#2ecc71' : '#f1c40f', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>{camp.status}</span>
                            </div>
                        </div>
                        ))}
                    </div>
                    )}
                </div>
                </div>
            )}

            {/* BROADCAST TAB */}
            {activeTab === 'broadcast' && (
                <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                <h2 style={{ textAlign: 'center', color: '#9b59b6', marginTop: 0 }}>Enviar Broadcast (Imediato)</h2>
                <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: '30px' }}>Envie mensagens em massa para uma lista de números agora mesmo.</p>
                
                <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>Mensagem</label>
                    <textarea 
                        value={broadcastMsg}
                        onChange={e => setBroadcastMsg(e.target.value)}
                        placeholder="Digite sua mensagem aqui..."
                        style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #bdc3c7', minHeight: '120px', boxSizing: 'border-box' }}
                    />
                    </div>

                    <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>Telefones (separados por vírgula)</label>
                    <input 
                        value={broadcastPhones}
                        onChange={e => setBroadcastPhones(e.target.value)}
                        placeholder="5511999999999, 5511888888888"
                        style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #bdc3c7', boxSizing: 'border-box' }}
                    />
                    </div>

                    <button type="submit" style={{ padding: '15px', background: '#9b59b6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                        Enviar Transmissão
                    </button>
                </form>
                </div>
            )}

            {/* TEAM TAB */}
            {activeTab === 'team' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                    <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', height: 'fit-content' }}>
                        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Novo Usuário</h3>
                        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input 
                                placeholder="Nome Completo" 
                                value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
                                style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}
                                required
                            />
                            <input 
                                placeholder="Email" 
                                type="email"
                                value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                                style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}
                                required
                            />
                             <input 
                                placeholder="Senha" 
                                type="password"
                                value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                                style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}
                                required
                            />
                            <select 
                                value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                                style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}
                            >
                                <option value="agent">Agente</option>
                                <option value="admin">Admin</option>
                                <option value="master">Master</option>
                            </select>
                            <input 
                                placeholder="Departamento" 
                                value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})}
                                style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}
                            />
                            <button type="submit" style={{ padding: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Criar Usuário
                            </button>
                        </form>
                    </div>

                    <div>
                        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Equipe</h3>
                        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8f9fa' }}>
                                    <tr>
                                        <th style={{ padding: '15px', textAlign: 'left', color: '#7f8c8d', fontSize: '12px', textTransform: 'uppercase' }}>Nome</th>
                                        <th style={{ padding: '15px', textAlign: 'left', color: '#7f8c8d', fontSize: '12px', textTransform: 'uppercase' }}>Email</th>
                                        <th style={{ padding: '15px', textAlign: 'left', color: '#7f8c8d', fontSize: '12px', textTransform: 'uppercase' }}>Função</th>
                                        <th style={{ padding: '15px', textAlign: 'left', color: '#7f8c8d', fontSize: '12px', textTransform: 'uppercase' }}>Departamento</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersList.map(u => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '15px', fontWeight: 'bold' }}>{u.name}</td>
                                            <td style={{ padding: '15px', color: '#7f8c8d' }}>{u.email}</td>
                                            <td style={{ padding: '15px' }}>
                                                <span style={{ 
                                                    background: u.role === 'master' ? '#f1c40f' : (u.role === 'admin' ? '#e74c3c' : '#ecf0f1'),
                                                    color: u.role === 'master' || u.role === 'admin' ? 'white' : '#2c3e50',
                                                    padding: '4px 8px', borderRadius: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold'
                                                }}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px', color: '#7f8c8d' }}>{u.department || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
      </div>
    </div>
  );
}

export default App;
