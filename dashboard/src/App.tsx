import React, { useState, useEffect } from 'react';
import { Login } from './Login';
import { KanbanBoard } from './components/KanbanBoard';
import { Layout } from './components/Layout';
import { ChatInterface } from './components/ChatInterface';
import { Dashboard } from './components/Dashboard';

interface Session {
  phone: string;
  channel?: 'whatsapp' | 'instagram' | 'email' | 'web';
  step: string;
  status?: string; // 'active' | 'paused'
  tags: string[];
  history: { role: 'user' | 'bot' | 'agent', content: string, timestamp: string, senderName?: string }[];
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
  jobTitle?: string;
}

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3006');
const API_URL = `${BASE_URL}/api/admin`;
const AUTH_URL = `${BASE_URL}/api/auth`;

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'sessions' | 'kanban' | 'campaigns' | 'broadcast' | 'team'>('dashboard');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  
  // Profile Completion State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', jobTitle: '' });

  // Forms
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastPhones, setBroadcastPhones] = useState('');
  
  const [campName, setCampName] = useState('');
  const [campMsg, setCampMsg] = useState('');
  const [campDate, setCampDate] = useState('');
  const [campTag, setCampTag] = useState('');

  // User Mgmt Form
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'agent', jobTitle: '' });

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

  useEffect(() => {
     if (user && (!user.name || !user.jobTitle || user.name === 'Master Admin')) {
         setShowProfileModal(true);
         setProfileData({ 
             name: user.name !== 'Master Admin' ? user.name : '', 
             jobTitle: user.jobTitle || 'Comercial'
         });
     }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetchWithAuth(`${AUTH_URL}/users/me`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: profileData.name,
                    jobTitle: profileData.jobTitle
                })
            });
 
            if (res.ok) {
                const updatedUser = { ...user!, ...profileData };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setShowProfileModal(false);
            } else {
                throw new Error('Falha ao atualizar');
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao atualizar perfil');
        }
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
      console.error(err);
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
        setNewUser({ name: '', email: '', password: '', role: 'agent', jobTitle: '' });
        fetchUsers();
    } catch (err) {
        console.error(err);
        alert('Erro ao criar usuário');
    }
  };

  const handleSendMessage = async (phone: string, message: string) => {
    if (!message?.trim()) return;

    try {
        await fetchWithAuth(`${API_URL}/messages/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              phone, 
              message,
              senderName: user?.name || 'Agente',
              senderRole: user?.jobTitle || user?.role // Pass jobTitle if available, else role
            })
        });
        fetchSessions(); // Refresh chat
    } catch (err) {
        console.error(err);
        alert('Erro ao enviar mensagem');
    }
  };

  const handleTogglePause = async (phone: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
    try {
        await fetchWithAuth(`${API_URL}/sessions/${phone}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        fetchSessions();
    } catch (err) {
        console.error(err);
        alert('Erro ao alterar status do atendimento');
    }
  };

  const handleAddTag = async (phone: string, newTag: string) => {
      if (!newTag) return;
      const session = sessions.find(s => s.phone === phone);
      if (!session) return;
      
      if (session.tags?.includes(newTag)) {
        alert('Tag já existe');
        return;
      }
      const updatedTags = [...(session.tags || []), newTag];
      try {
          await fetchWithAuth(`${API_URL}/sessions/${phone}/tags`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tags: updatedTags })
          });
          fetchSessions();
      } catch (err) {
          console.error(err);
          alert('Erro ao adicionar tag');
      }
  };

  const handleRemoveTag = async (phone: string, tagToRemove: string) => {
      const session = sessions.find(s => s.phone === phone);
      if (!session) return;

      if (!confirm('Remover tag?')) return;
      const updatedTags = (session.tags || []).filter(t => t !== tagToRemove);
      try {
          await fetchWithAuth(`${API_URL}/sessions/${phone}/tags`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tags: updatedTags })
          });
          fetchSessions();
      } catch (err) {
          console.error(err);
          alert('Erro ao remover tag');
      }
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        user={user}
      >
        {activeTab === 'dashboard' && (
          <Dashboard 
            sessions={sessions} 
            onNavigate={(tab, session) => {
              setActiveTab(tab as any);
              if (session) setSelectedSession(session);
            }}
            connectionError={connectionError}
            lastUpdated={lastUpdated}
          />
        )}
        
        {activeTab === 'sessions' && (
          <ChatInterface 
            sessions={sessions}
            selectedSession={selectedSession}
            onSelectSession={setSelectedSession}
            onSendMessage={handleSendMessage}
            onTogglePause={handleTogglePause}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            user={user}
          />
        )}

        {activeTab === 'kanban' && (
          <div className="p-6 h-full">
            <KanbanBoard token={token!} baseUrl={BASE_URL} users={usersList} />
          </div>
        )}

        {activeTab === 'campaigns' && (
           <div className="p-6">
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Campanhas de Marketing</h1>
              
              <div className="card p-6 mb-6">
                <h3 className="mb-4">Nova Campanha</h3>
                <form onSubmit={handleCreateCampaign} className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <input className="input" placeholder="Nome da Campanha" value={campName} onChange={e => setCampName(e.target.value)} required />
                    <input className="input" type="datetime-local" value={campDate} onChange={e => setCampDate(e.target.value)} required />
                  </div>
                  <textarea className="input" placeholder="Mensagem" rows={3} value={campMsg} onChange={e => setCampMsg(e.target.value)} required />
                  <input className="input" placeholder="Tag Alvo (ex: Quente)" value={campTag} onChange={e => setCampTag(e.target.value)} required />
                  <button type="submit" className="btn btn-primary w-fit">Criar Campanha</button>
                </form>
              </div>

              <div className="card p-6 mb-6">
                <h3 className="mb-4">Disparo em Massa (Broadcast)</h3>
                <form onSubmit={handleBroadcast} className="flex flex-col gap-4">
                  <textarea className="input" placeholder="Números (separados por vírgula)" rows={2} value={broadcastPhones} onChange={e => setBroadcastPhones(e.target.value)} required />
                  <textarea className="input" placeholder="Mensagem" rows={3} value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} required />
                  <button type="submit" className="btn btn-primary w-fit">Enviar Broadcast</button>
                </form>
              </div>

              <div className="card p-6">
                <h3 className="mb-4">Campanhas Ativas</h3>
                <div className="flex flex-col gap-2">
                  {campaigns.map(c => (
                    <div key={c.id} className="p-4 border rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-bold">{c.name}</div>
                        <div className="text-sm text-gray-500">{new Date(c.scheduledAt).toLocaleString()} - Alvo: {c.targetTag}</div>
                      </div>
                      <span className={`badge ${c.status === 'sent' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span>
                    </div>
                  ))}
                  {campaigns.length === 0 && <div className="text-gray-500">Nenhuma campanha encontrada.</div>}
                </div>
              </div>
           </div>
        )}

        {activeTab === 'team' && (
           <div className="p-6">
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Gestão de Equipe</h1>
              
              <div className="card p-6 mb-6">
                <h3 className="mb-4">Novo Usuário</h3>
                <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <input className="input" placeholder="Nome" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
                    <input className="input" placeholder="Email" type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
                  </div>
                  <div className="flex gap-4">
                    <input className="input" placeholder="Senha" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
                    <select className="input" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                      <option value="agent">Agente</option>
                      <option value="admin">Admin</option>
                      <option value="master">Master</option>
                    </select>
                  </div>
                  <select className="input" value={newUser.jobTitle} onChange={e => setNewUser({...newUser, jobTitle: e.target.value})} required>
                    <option value="">Selecione o Cargo...</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Contabilidade">Contabilidade</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Jurídico">Jurídico</option>
                    <option value="Tecnologia">Tecnologia</option>
                  </select>
                  <button type="submit" className="btn btn-primary w-fit">Adicionar Usuário</button>
                </form>
              </div>

              <div className="card p-6">
                <h3 className="mb-4">Membros da Equipe</h3>
                <div className="flex flex-col gap-2">
                  {usersList.map(u => (
                    <div key={u.id} className="p-4 border rounded-lg flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          {u.name?.[0]}
                        </div>
                        <div>
                          <div className="font-bold">{u.name}</div>
                          <div className="text-sm text-gray-500">{u.email} - {u.role}</div>
                        </div>
                      </div>
                      <span className="badge badge-primary">{u.jobTitle || 'Sem Cargo'}</span>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        )}
      </Layout>

      {/* Profile Modal */}
      {showProfileModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="card" style={{ width: '400px', padding: '24px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '20px' }}>Complete seu Perfil</h2>
            <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
              Para continuar, precisamos que você preencha seus dados para identificação nos atendimentos.
            </p>
            <form onSubmit={handleUpdateProfile}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Seu Nome Completo</label>
                <input 
                  className="input"
                  value={profileData.name}
                  onChange={e => setProfileData({...profileData, name: e.target.value})}
                  placeholder="Ex: João Silva"
                  required
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Cargo / Área</label>
                <select 
                  className="input"
                  value={profileData.jobTitle}
                  onChange={e => setProfileData({...profileData, jobTitle: e.target.value})}
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Contabilidade">Contabilidade</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Jurídico">Jurídico</option>
                    <option value="Tecnologia">Tecnologia</option>
                  </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Salvar e Continuar
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
