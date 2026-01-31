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
    return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Carregando chamados...</div>;
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

  const columns: { id: Ticket['status'], label: string }[] = [
    { id: 'open', label: 'Aberto / Triagem' },
    { id: 'in_progress', label: 'Em Atendimento' },
    { id: 'waiting', label: 'Aguardando Cliente' },
    { id: 'resolved', label: 'Resolvido' }
  ];

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'urgent': return '#ffebee'; // Red tint
      case 'high': return '#fff3e0';   // Orange tint
      case 'medium': return '#fffde7'; // Yellow tint
      default: return '#f5f5f5';       // Grey tint
    }
  };

  const getPriorityLabel = (p: string) => {
    switch(p) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      default: return 'Baixa';
    }
  };

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Quadro CRM</h1>
        <button 
          onClick={() => setShowNewTicket(true)}
          className="btn btn-primary"
        >
          + Novo Chamado
        </button>
      </div>

      {showNewTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '4px', width: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Novo Chamado</h3>
            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                placeholder="Título" 
                value={newTicket.title} 
                onChange={e => setNewTicket({...newTicket, title: e.target.value})} 
                required 
                style={{ padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '14px' }}
              />
              <textarea 
                placeholder="Descrição" 
                value={newTicket.description} 
                onChange={e => setNewTicket({...newTicket, description: e.target.value})} 
                style={{ padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '14px', minHeight: '80px', fontFamily: 'inherit' }}
              />
              <input 
                placeholder="Telefone do Cliente (55...)" 
                value={newTicket.customerPhone} 
                onChange={e => setNewTicket({...newTicket, customerPhone: e.target.value})} 
                required 
                style={{ padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '14px' }}
              />
              <div className="flex gap-2">
                <select 
                  value={newTicket.priority} 
                  onChange={e => setNewTicket({...newTicket, priority: e.target.value as any})}
                  style={{ flex: 1, padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '14px', background: 'white' }}
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
                <select 
                  value={newTicket.assigneeId} 
                  onChange={e => setNewTicket({...newTicket, assigneeId: e.target.value})}
                  style={{ flex: 1, padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '14px', background: 'white' }}
                >
                  <option value="">Sem Responsável</option>
                  {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Salvar</button>
                <button type="button" onClick={() => setShowNewTicket(false)} className="btn" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', flex: 1, paddingBottom: '10px' }}>
        {columns.map(col => (
          <div key={col.id} style={{ minWidth: '280px', width: '280px', background: 'var(--bg-secondary)', borderRadius: '4px', padding: '8px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 4px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>
              <span>{col.label}</span>
              <span style={{ fontSize: '12px', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                {tickets.filter(t => t.status === col.id).length}
              </span>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tickets.filter(t => t.status === col.id).map(ticket => (
                <div key={ticket.id} className="kanban-card" style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px', color: 'var(--text-primary)' }}>
                    {ticket.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ticket.description || 'Sem descrição'}
                  </div>
                  
                  <div className="flex justify-between items-center" style={{ marginTop: 'auto' }}>
                    <div className="flex gap-1 flex-wrap">
                      <span className="tag" style={{ background: getPriorityColor(ticket.priority), color: 'var(--text-primary)', border: 'none' }}>
                        {getPriorityLabel(ticket.priority)}
                      </span>
                      {ticket.assigneeId && (
                        <span className="tag" style={{ background: '#e3f2fd', border: 'none' }}>
                           👤 {users.find(u => u.id === ticket.assigneeId)?.name || '...'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                    <select 
                      value={ticket.status}
                      onChange={(e) => handleUpdateTicket(ticket.id, { status: e.target.value as any })}
                      style={{ fontSize: '11px', padding: '2px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </span>
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