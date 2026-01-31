import { useState, useEffect } from 'react';
import { Login } from './Login';
import { KanbanBoard } from './components/KanbanBoard';

interface Session {
  phone: string;
  step: string;
  tags: string[];
  history: { role: 'user' | 'bot', content: string, timestamp: string }[];
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
  name: string;
  email: string;
  role: 'master' | 'user';
  department: string;
}

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3006');
const API_URL = `${BASE_URL}/api/admin`;
const AUTH_URL = `${BASE_URL}/api/auth`;

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);

  const [activeTab, setActiveTab] = useState<'sessions' | 'kanban' | 'campaigns' | 'broadcast' | 'users'>('sessions');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  
  // Forms
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastPhones, setBroadcastPhones] = useState('');
  
  const [campName, setCampName] = useState('');
  const [campMsg, setCampMsg] = useState('');
  const [campDate, setCampDate] = useState('');
  const [campTag, setCampTag] = useState('');

  // User Mgmt Form
  const [newUser, setNewUser] = useState({ name: '', email: '', department: '', role: 'user' });

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
    if (!token || user?.role !== 'master') return;
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
      const interval = setInterval(fetchSessions, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
        if (activeTab === 'campaigns') fetchCampaigns();
        if (activeTab === 'users') fetchUsers();
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
        setNewUser({ name: '', email: '', department: '', role: 'user' });
        fetchUsers();
    } catch (err) {
        alert('Erro ao criar usuário');
    }
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px', background: '#f5f7fa', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div>
          <h1 style={{ margin: 0, color: '#2c3e50' }}>Lopes Condomínios</h1>
          <p style={{ margin: '5px 0 0', color: '#7f8c8d' }}>
            Olá, <strong>{user?.name}</strong> ({user?.department})
            {user?.role === 'master' && <span style={{ marginLeft: '10px', background: '#f1c40f', color: 'black', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>MASTER</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={() => setActiveTab('sessions')}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'sessions' ? '#3498db' : '#ecf0f1', color: activeTab === 'sessions' ? 'white' : '#2c3e50', cursor: 'pointer', fontWeight: 'bold' }}
          >
            💬 Atendimentos
          </button>
          <button 
            onClick={() => setActiveTab('kanban')}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'kanban' ? '#e17055' : '#ecf0f1', color: activeTab === 'kanban' ? 'white' : '#2c3e50', cursor: 'pointer', fontWeight: 'bold' }}
          >
            📊 Kanban
          </button>
          <button 
            onClick={() => setActiveTab('campaigns')}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'campaigns' ? '#e67e22' : '#ecf0f1', color: activeTab === 'campaigns' ? 'white' : '#2c3e50', cursor: 'pointer', fontWeight: 'bold' }}
          >
            📅 Campanhas
          </button>
          <button 
            onClick={() => setActiveTab('broadcast')}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'broadcast' ? '#9b59b6' : '#ecf0f1', color: activeTab === 'broadcast' ? 'white' : '#2c3e50', cursor: 'pointer', fontWeight: 'bold' }}
          >
            📢 Broadcast
          </button>
          {user?.role === 'master' && (
             <button 
                onClick={() => setActiveTab('users')}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'users' ? '#2c3e50' : '#ecf0f1', color: activeTab === 'users' ? 'white' : '#2c3e50', cursor: 'pointer', fontWeight: 'bold' }}
             >
                👥 Usuários
             </button>
          )}
          <button 
            onClick={handleLogout}
            style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e74c3c', background: 'transparent', color: '#e74c3c', cursor: 'pointer', fontWeight: 'bold', marginLeft: '20px' }}
          >
            Sair
          </button>
        </div>
      </header>


      {/* SESSIONS TAB */}
      {activeTab === 'sessions' && (
        <div>
          <h2 style={{ color: '#34495e', marginBottom: '20px' }}>Atendimentos em Tempo Real</h2>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#95a5a6' }}>Nenhum atendimento ativo no momento.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {sessions.map(session => (
                <div key={session.phone} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: '4px solid #3498db' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>{session.phone}</h3>
                    <span style={{ background: '#ecf0f1', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{session.step}</span>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    {session.tags.map(tag => (
                      <span key={tag} style={{ display: 'inline-block', background: '#dff9fb', color: '#130f40', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', marginRight: '5px', marginBottom: '5px' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '8px', height: '150px', overflowY: 'auto', marginBottom: '15px', fontSize: '13px' }}>
                    {session.history.slice().reverse().map((msg, idx) => (
                      <div key={idx} style={{ marginBottom: '8px', textAlign: msg.role === 'user' ? 'left' : 'right' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          padding: '6px 10px', 
                          borderRadius: '8px', 
                          background: msg.role === 'user' ? '#e17055' : '#0984e3', 
                          color: 'white',
                          maxWidth: '80%'
                        }}>
                          {msg.content}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* KANBAN TAB */}
      {activeTab === 'kanban' && (
        <div style={{ height: 'calc(100vh - 150px)' }}>
          <KanbanBoard token={token || ''} baseUrl={BASE_URL} />
        </div>
      )}

      {/* CAMPAIGNS TAB */}
      {activeTab === 'campaigns' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', height: 'fit-content' }}>
            <h3 style={{ marginTop: 0 }}>Nova Campanha</h3>
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
            <h3 style={{ marginTop: 0 }}>Campanhas Agendadas</h3>
            {campaigns.length === 0 ? <p style={{ color: '#95a5a6' }}>Nenhuma campanha agendada.</p> : (
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

            <button type="submit" style={{ padding: '15px', background: '#9b59b6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
              🚀 Enviar Broadcast Agora
            </button>
          </form>
        </div>
      )}

      {/* USERS TAB (Master Only) */}
      {activeTab === 'users' && user?.role === 'master' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
           <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', height: 'fit-content' }}>
            <h3 style={{ marginTop: 0 }}>Cadastrar Novo Usuário</h3>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                placeholder="Nome Completo" 
                value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
                style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}
                required
              />
              <input 
                type="email"
                placeholder="E-mail" 
                value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}
                required
              />
              <input 
                placeholder="Departamento (ex: Contabilidade)" 
                value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})}
                style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}
                required
              />
              <select 
                value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}
              >
                <option value="user">Usuário Padrão</option>
                <option value="master">Master (Admin)</option>
              </select>
              <button type="submit" style={{ padding: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Cadastrar Usuário
              </button>
            </form>
            <p style={{ fontSize: '12px', color: '#95a5a6', marginTop: '10px' }}>
                * Senha padrão automática: 123456
            </p>
          </div>

          <div>
            <h3 style={{ marginTop: 0 }}>Usuários do Sistema</h3>
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#ecf0f1' }}>
                        <tr>
                            <th style={{ padding: '15px', color: '#2c3e50' }}>Nome</th>
                            <th style={{ padding: '15px', color: '#2c3e50' }}>E-mail</th>
                            <th style={{ padding: '15px', color: '#2c3e50' }}>Departamento</th>
                            <th style={{ padding: '15px', color: '#2c3e50' }}>Nível</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usersList.map(u => (
                            <tr key={u.email} style={{ borderBottom: '1px solid #ecf0f1' }}>
                                <td style={{ padding: '15px' }}>{u.name}</td>
                                <td style={{ padding: '15px', color: '#7f8c8d' }}>{u.email}</td>
                                <td style={{ padding: '15px' }}>
                                    <span style={{ background: '#dff9fb', color: '#130f40', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                        {u.department}
                                    </span>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    {u.role === 'master' ? (
                                        <span style={{ color: '#f1c40f', fontWeight: 'bold' }}>★ Master</span>
                                    ) : (
                                        <span style={{ color: '#95a5a6' }}>Padrão</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;