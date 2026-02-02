import { useState, useEffect } from 'react';
import { Login } from './Login';
import { KanbanBoard } from './components/KanbanBoard';
import { Sidebar } from './components/Sidebar';
import { Profile } from './components/Profile';
import { SessionCard } from './components/SessionCard';

interface Session {
  phone: string;
  name?: string;
  senderName?: string; // Sometimes data comes as senderName
  step: string;
  status?: string; // 'active' | 'paused'
  pausedAt?: string | null;
  tags: string[];
  history: { role: 'user' | 'bot' | 'agent', content: string, timestamp: string, senderName?: string }[];
  assigneeId?: string;
  profilePicUrl?: string;
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
  role: 'Administrativo' | 'Comercial' | 'Contador' | 'Financeiro' | 'Tecnologia';
  department?: string;
  customRole?: string;
}

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3006');
const API_URL = `${BASE_URL}/api/admin`;
const AUTH_URL = `${BASE_URL}/api/auth`;

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);

  const [activeTab, setActiveTab] = useState<'sessions' | 'kanban' | 'campaigns' | 'broadcast' | 'team' | 'profile'>('sessions');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  
  // Forms
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastPhones, setBroadcastPhones] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Chat Reply State
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const [campName, setCampName] = useState('');
  const [campMsg, setCampMsg] = useState('');
  const [campDate, setCampDate] = useState('');
  const [campTag, setCampTag] = useState('');

  // User Mgmt Form
  const [newUser, setNewUser] = useState({ name: '', email: '', department: '', role: 'Comercial', password: '' });

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
      if (!res.ok) {
        if (res.status === 503) throw new Error('Banco de dados desconectado (Verifique FIREBASE_SERVICE_ACCOUNT no Render)');
        throw new Error(`Erro ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setSessions(data);
      setConnectionError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error fetching sessions', err);
      setConnectionError(err.message || 'Erro de conexão com o servidor');
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
        setNewUser({ name: '', email: '', department: '', role: 'Comercial', password: '' });
        fetchUsers();
    } catch (err) {
        alert('Erro ao criar usuário');
    }
  };

  const handleSendMessage = async (phone: string) => {
    const message = replyText[phone];
    if (!message?.trim()) return;

    try {
        // No mapping needed as roles are now explicit
        const role = user?.role || 'Comercial';
        
        const userName = user?.name || 'Agente';
        const signature = `*${userName} - ${role}*`;
        const finalMessage = `${signature}\n${message}`;

        await fetchWithAuth(`${API_URL}/messages/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              phone, 
              message: finalMessage,
              senderName: userName
            })
        });
        setReplyText(prev => ({ ...prev, [phone]: '' }));
        fetchSessions(); // Refresh chat
    } catch (err) {
        alert('Erro ao enviar mensagem');
    }
  };

  const handleTogglePause = async (phone: string, targetStatus: string, duration?: number) => {
    try {
        await fetchWithAuth(`${API_URL}/sessions/${phone}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: targetStatus, duration })
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

  const handleUpdateUser = (updatedData: any) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex">
      
      {/* SIDEBAR */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout} 
      />

      {/* MAIN CONTENT */}
      <div className="main-content w-full">
        <div className="page-container">
            
            {activeTab === 'profile' && (
                <Profile user={user} onUpdateUser={handleUpdateUser} />
            )}

            {/* SESSIONS TAB */}
            {activeTab === 'sessions' && (
                <div>
                <header className="flex justify-between items-center" style={{ marginBottom: '32px' }}>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 style={{ margin: 0 }}>Atendimentos</h1>
                            <span style={{ fontSize: '12px', background: '#e3f2fd', color: '#1565c0', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bbdefb', whiteSpace: 'nowrap' }}>
                                ⚡ Antigravity System
                            </span>
                        </div>
                        {lastUpdated && <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Atualizado às {lastUpdated.toLocaleTimeString()}</span>}
                    </div>
                    <span className="tag" style={{ fontSize: '13px', padding: '6px 10px' }}>{sessions.length} ativos</span>
                </header>

                {connectionError && (
                    <div style={{ background: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '4px', marginBottom: '20px', border: '1px solid #ef9a9a' }}>
                        <strong>Erro de Conexão:</strong> {connectionError}
                    </div>
                )}
                
                {sessions.length === 0 && !connectionError ? (
                    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '32px', marginBottom: '16px' }}>📭</div>
                        Nenhum atendimento ativo no momento.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                    {sessions.map(session => (
                        <SessionCard 
                            key={session.phone}
                            session={session}
                            users={usersList}
                            replyText={replyText[session.phone] || ''}
                            setReplyText={(text) => setReplyText(prev => ({...prev, [session.phone]: text}))}
                            onSendMessage={() => handleSendMessage(session.phone)}
                            onTogglePause={handleTogglePause}
                            onAssign={handleAssignSession}
                        />
                    ))}
                    </div>
                )}
                </div>
            )}

            {/* KANBAN TAB */}
            {activeTab === 'kanban' && (
                <div style={{ height: 'calc(100vh - 48px)' }}>
                    <KanbanBoard token={token || ''} baseUrl={BASE_URL} users={usersList} />
                </div>
            )}

            {/* CAMPAIGNS TAB */}
            {activeTab === 'campaigns' && (
                <div>
                <header style={{ marginBottom: '32px' }}>
                    <h1>Campanhas</h1>
                </header>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '48px' }}>
                <div>
                    <h3>Nova Campanha</h3>
                    <form onSubmit={handleCreateCampaign} className="flex flex-col gap-4" style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <input 
                        placeholder="Nome da Campanha" 
                        value={campName} onChange={e => setCampName(e.target.value)}
                        style={{ background: '#fafafa' }}
                    />
                    <textarea 
                        placeholder="Mensagem" 
                        value={campMsg} onChange={e => setCampMsg(e.target.value)}
                        rows={4}
                        style={{ background: '#fafafa' }}
                    />
                    <div className="flex gap-2">
                        <input 
                            type="datetime-local" 
                            value={campDate} onChange={e => setCampDate(e.target.value)}
                            style={{ background: '#fafafa' }}
                        />
                        <input 
                            placeholder="Tag Alvo" 
                            value={campTag} onChange={e => setCampTag(e.target.value)}
                            style={{ background: '#fafafa' }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-full">Agendar Disparo</button>
                    </form>
                </div>

                <div>
                    <h3>Histórico</h3>
                    <div className="flex flex-col gap-4">
                    {campaigns.map(c => (
                        <div key={c.id} className="kanban-card">
                        <div className="flex justify-between">
                            <strong>{c.name}</strong>
                            <span className="tag">{c.status}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>{c.message}</div>
                        <div style={{ fontSize: '11px', marginTop: '12px', color: 'var(--text-secondary)' }}>
                            Alvo: #{c.targetTag} • Agendado: {new Date(c.scheduledAt).toLocaleString()}
                        </div>
                        </div>
                    ))}
                    </div>
                </div>
                </div>
                </div>
            )}

            {/* BROADCAST TAB */}
            {activeTab === 'broadcast' && (
                <div>
                <header style={{ marginBottom: '32px' }}>
                    <h1>Broadcast Rápido</h1>
                </header>
                <div style={{ maxWidth: '600px', background: 'white', padding: '32px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <form onSubmit={handleBroadcast} className="flex flex-col gap-4">
                    <label style={{ fontSize: '14px', fontWeight: 500 }}>Telefones (separados por vírgula)</label>
                    <input 
                        placeholder="5511999999999, 5511888888888" 
                        value={broadcastPhones} onChange={e => setBroadcastPhones(e.target.value)}
                        style={{ background: '#fafafa' }}
                    />
                    
                    <label style={{ fontSize: '14px', fontWeight: 500 }}>Mensagem</label>
                    <textarea 
                        placeholder="Digite sua mensagem..." 
                        value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)}
                        rows={5}
                        style={{ background: '#fafafa' }}
                    />
                    
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }}>Enviar Mensagem em Massa</button>
                    </form>
                </div>
                </div>
            )}

            {/* TEAM TAB */}
            {activeTab === 'team' && (
                <div>
                <header style={{ marginBottom: '32px' }}>
                    <h1>Equipe</h1>
                </header>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '48px' }}>
                    <div>
                        <h3>Adicionar Membro</h3>
                        <form onSubmit={handleCreateUser} className="flex flex-col gap-4" style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                            <input 
                                placeholder="Nome Completo" 
                                value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
                                required
                                style={{ background: '#fafafa' }}
                            />
                            <input 
                                placeholder="Email" 
                                type="email"
                                value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                                required
                                style={{ background: '#fafafa' }}
                            />
                            <input 
                                placeholder="Senha" 
                                type="password"
                                value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                                required
                                style={{ background: '#fafafa' }}
                            />
                            <select 
                                value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                                style={{ background: '#fafafa' }}
                            >
                                <option value="Administrativo">Administrativo</option>
                                <option value="Comercial">Comercial</option>
                                <option value="Contador">Contador</option>
                                <option value="Financeiro">Financeiro</option>
                                <option value="Tecnologia">Tecnologia</option>
                            </select>
                            <input 
                                placeholder="Departamento (Ex: Financeiro)" 
                                value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})}
                                style={{ background: '#fafafa' }}
                            />
                            <button type="submit" className="btn btn-primary">Cadastrar</button>
                        </form>
                    </div>

                    <div>
                        <h3>Membros Ativos</h3>
                        <div className="flex flex-col gap-2">
                            {usersList.map(u => (
                                <div key={u.id} className="kanban-card flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div style={{ width: 32, height: 32, background: '#e3e2e0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold' }}>
                                            {u.name[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{u.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="tag">{u.department || 'Geral'}</span>
                                        <span className="tag" style={{ background: '#e1f5fe', color: '#0277bd' }}>{u.role}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
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
