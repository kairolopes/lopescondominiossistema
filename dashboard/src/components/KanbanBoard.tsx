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

  const columns = [
    { id: 'open', label: 'Prospecção (Aberto)', color: '#3498db' },
    { id: 'in_progress', label: 'Qualificação (Em Andamento)', color: '#f1c40f' },
    { id: 'waiting', label: 'Apresentação (Aguardando)', color: '#e67e22' },
    { id: 'resolved', label: 'Fechamento (Resolvido)', color: '#2ecc71' }
  ];

  const getTagColor = (tag: string) => {
      const lower = tag.toLowerCase();
      if (lower.includes('quente')) return '#e74c3c'; // Red
      if (lower.includes('morno')) return '#f39c12';  // Orange
      if (lower.includes('frio')) return '#3498db';   // Blue
      if (lower.includes('whitelabel')) return '#9b59b6'; // Purple
      return '#95a5a6'; // Gray default
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Contratos de Clientes (CRM)</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Gerencie seus leads e oportunidades</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewTicket(true)}>+ Novo Ticket</button>
      </header>

      {/* Kanban Container */}
      <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '20px', flex: 1 }}>
        {columns.map(col => {
            const colTickets = tickets.filter(t => t.status === col.id);
            const totalValue = colTickets.reduce((acc) => acc + 240, 0); // Mock value per ticket based on screenshot "R$ 240,00"

            return (
                <div key={col.id} style={{ 
                    minWidth: '320px', 
                    background: '#f8f9fa', 
                    borderRadius: '12px', 
                    padding: '16px',
                    display: 'flex', 
                    flexDirection: 'column',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{col.label}</h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{colTickets.length}</span>
                    </div>
                    
                    <div style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Valor Estimado:</span>
                        <strong>R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1 }}>
                        {colTickets.map(ticket => (
                            <div key={ticket.id} className="kanban-card" style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>#{ticket.id.slice(0,6)}</span>
                                    {ticket.assigneeId && users.find(u => u.id === ticket.assigneeId)?.name && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                            <span>👤</span> {users.find(u => u.id === ticket.assigneeId)?.name.split(' ')[0]}
                                        </div>
                                    )}
                                </div>
                                
                                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: 'var(--text-primary)' }}>{ticket.title}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{ticket.customerPhone}</div>

                                {/* Tags & Priority */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                    {/* Mock Tags if empty for demo visual */}
                                    {(ticket.tags && ticket.tags.length > 0 ? ticket.tags : ['WhiteLabel', ticket.priority === 'urgent' ? 'Quente' : (ticket.priority === 'high' ? 'Morno' : 'Frio')]).map((tag, idx) => (
                                        <span key={idx} style={{ 
                                            fontSize: '10px', 
                                            fontWeight: 600, 
                                            padding: '2px 8px', 
                                            borderRadius: '4px', 
                                            color: 'white',
                                            backgroundColor: getTagColor(tag)
                                        }}>
                                            {tag.toUpperCase()}
                                        </span>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>R$ 240,00</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {col.id !== 'open' && (
                                            <button 
                                                onClick={() => handleUpdateTicket(ticket.id, { status: columns[columns.findIndex(c => c.id === col.id) - 1].id as any })}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: 0.5, fontSize: '14px' }}
                                                title="Voltar etapa"
                                            >
                                                ⬅️
                                            </button>
                                        )}
                                        {col.id !== 'resolved' && (
                                            <button 
                                                onClick={() => handleUpdateTicket(ticket.id, { status: columns[columns.findIndex(c => c.id === col.id) + 1].id as any })}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#2ecc71', fontSize: '14px' }}
                                                title="Avançar etapa"
                                            >
                                                ➡️
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        })}
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ marginTop: 0 }}>Novo Ticket</h2>
            <form onSubmit={handleCreateTicket} className="flex flex-col gap-4">
              <input 
                placeholder="Título / Nome do Cliente" 
                value={newTicket.title} onChange={e => setNewTicket({...newTicket, title: e.target.value})}
                required
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <textarea 
                placeholder="Descrição" 
                value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                rows={3}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <input 
                placeholder="Telefone (5511...)" 
                value={newTicket.customerPhone} onChange={e => setNewTicket({...newTicket, customerPhone: e.target.value})}
                required
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <select 
                value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value as any})}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="low">Baixa (Frio)</option>
                <option value="medium">Média (Morno)</option>
                <option value="high">Alta (Quente)</option>
                <option value="urgent">Urgente</option>
              </select>
              <select 
                value={newTicket.assigneeId} onChange={e => setNewTicket({...newTicket, assigneeId: e.target.value})}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">Sem responsável</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              
              <div className="flex justify-end gap-2" style={{ marginTop: '16px' }}>
                <button type="button" className="btn" onClick={() => setShowNewTicket(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Criar Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};