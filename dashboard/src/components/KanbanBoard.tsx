import React, { useState, useEffect } from 'react';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customerPhone: string;
  assigneeId?: string;
  tags: string[];
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface KanbanBoardProps {
  token: string;
  baseUrl: string;
  users: User[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ token, baseUrl, users }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  
  // New Ticket Form State
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    customerPhone: '',
    priority: 'medium' as Ticket['priority'],
    status: 'open' as Ticket['status'],
    assigneeId: ''
  });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [token]);

  if (loading) {
    return <div style={{ padding: '20px' }}>Carregando chamados...</div>;
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...newTicket, tags: [] };
      // Remove empty assigneeId
      if (!payload.assigneeId) delete (payload as any).assigneeId;

      const res = await fetch(`${baseUrl}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowNewTicket(false);
        setNewTicket({ title: '', description: '', customerPhone: '', priority: 'medium', status: 'open', assigneeId: '' });
        fetchTickets();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const handleUpdateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    // Optimistic update
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates } : t));
    
    try {
      await fetch(`${baseUrl}/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.error('Error updating ticket:', error);
      fetchTickets(); // Revert on error
    }
  };

  const columns: { id: Ticket['status'], label: string, color: string }[] = [
    { id: 'open', label: 'Aberto / Triagem', color: '#e3f2fd' },
    { id: 'in_progress', label: 'Em Atendimento', color: '#fff3e0' },
    { id: 'waiting', label: 'Aguardando Cliente', color: '#f3e5f5' },
    { id: 'resolved', label: 'Resolvido', color: '#e8f5e9' }
  ];

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'urgent': return '#ffcdd2';
      case 'high': return '#ffcc80';
      case 'medium': return '#fff9c4';
      default: return '#f5f5f5';
    }
  };

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Gestão de Atendimentos (Kanban)</h2>
        <button 
          onClick={() => setShowNewTicket(true)}
          style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          + Novo Chamado
        </button>
      </div>

      {showNewTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '400px' }}>
            <h3>Novo Chamado</h3>
            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                placeholder="Título" 
                value={newTicket.title} 
                onChange={e => setNewTicket({...newTicket, title: e.target.value})} 
                required 
                style={{ padding: '8px' }}
              />
              <textarea 
                placeholder="Descrição" 
                value={newTicket.description} 
                onChange={e => setNewTicket({...newTicket, description: e.target.value})} 
                style={{ padding: '8px' }}
              />
              <input 
                placeholder="Telefone do Cliente (55...)" 
                value={newTicket.customerPhone} 
                onChange={e => setNewTicket({...newTicket, customerPhone: e.target.value})} 
                required 
                style={{ padding: '8px' }}
              />
              <select 
                value={newTicket.priority} 
                onChange={e => setNewTicket({...newTicket, priority: e.target.value as any})}
                style={{ padding: '8px' }}
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>

              <select 
                value={newTicket.assigneeId} 
                onChange={e => setNewTicket({...newTicket, assigneeId: e.target.value})}
                style={{ padding: '8px' }}
              >
                <option value="">Sem Responsável</option>
                {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>Salvar</button>
                <button type="button" onClick={() => setShowNewTicket(false)} style={{ flex: 1, padding: '10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', flex: 1, paddingBottom: '10px' }}>
        {columns.map(col => (
          <div key={col.id} style={{ minWidth: '300px', background: '#f8f9fa', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px', fontWeight: 'bold', borderBottom: `3px solid ${col.color}`, marginBottom: '10px', background: 'white', borderRadius: '4px' }}>
              {col.label} ({tickets.filter(t => t.status === col.id).length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
              {tickets.filter(t => t.status === col.id).map(ticket => (
                <div key={ticket.id} style={{ background: 'white', padding: '15px', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${getPriorityColor(ticket.priority)}` }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{ticket.title}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>{ticket.customerPhone}</div>
                  <div style={{ fontSize: '14px', marginBottom: '10px' }}>{ticket.description}</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', padding: '2px 6px', background: '#eee', borderRadius: '4px' }}>
                      {ticket.priority.toUpperCase()}
                    </span>
                    <select 
                      value={ticket.status} 
                      onChange={(e) => handleUpdateTicket(ticket.id, { status: e.target.value as any })}
                      style={{ fontSize: '12px', padding: '2px' }}
                    >
                      {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>

                  <div style={{ fontSize: '12px', color: '#555', display: 'flex', alignItems: 'center', gap: '5px' }}>
                     <span>👤</span>
                     <select 
                        value={ticket.assigneeId || ''}
                        onChange={(e) => handleUpdateTicket(ticket.id, { assigneeId: e.target.value })}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', maxWidth: '150px' }}
                     >
                        <option value="">Atribuir...</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                     </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
