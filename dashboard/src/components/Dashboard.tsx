import React from 'react';
import { 
  Users, 
  MessageCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface DashboardProps {
  sessions: any[];
  onNavigate: (tab: string, session?: any) => void;
  connectionError?: string | null;
  lastUpdated?: Date;
}

export const Dashboard: React.FC<DashboardProps> = ({ sessions, onNavigate, connectionError, lastUpdated }) => {
  const activeCount = sessions.filter(s => !s.status || s.status === 'ACTIVE').length;
  const pausedCount = sessions.filter(s => s.status === 'PAUSED').length;
  
  const urgentSessions = sessions.filter(s => {
    if (s.status !== 'PAUSED') return false;
    const lastMsg = s.history[s.history.length-1];
    if (!lastMsg) return false;
    const diff = (new Date().getTime() - new Date(lastMsg.timestamp).getTime()) / (1000 * 60);
    return diff > 15;
  });
  const urgentCount = urgentSessions.length;
  
  const idleSessions = sessions.filter(s => {
    const lastMsg = s.history[s.history.length-1];
    if (!lastMsg) return false;
    const diff = (new Date().getTime() - new Date(lastMsg.timestamp).getTime()) / (1000 * 60 * 60);
    return diff > 2;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Visão Geral</h1>
          <div style={{ fontSize: '12px', color: connectionError ? '#e74c3c' : 'var(--text-secondary)' }}>
             {connectionError ? (
                 <span>⚠️ {connectionError}</span>
             ) : (
                 <span>Bem-vindo ao painel de controle Lopes CRM. {lastUpdated && `(Atualizado: ${lastUpdated.toLocaleTimeString()})`}</span>
             )}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline">Filtrar: Hoje</button>
          <button className="btn btn-primary"><TrendingUp size={16} /> Relatórios</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <KpiCard 
          title="Atendimentos Ativos" 
          value={activeCount} 
          icon={MessageCircle} 
          color="var(--success)"
          trend="+12%"
          trendUp={true}
        />
        <KpiCard 
          title="Em Espera (Pausados)" 
          value={pausedCount} 
          icon={Clock} 
          color="var(--warning)"
          trend="-5%"
          trendUp={false}
        />
        <KpiCard 
          title="Atenção Necessária" 
          value={urgentCount} 
          icon={AlertTriangle} 
          color="var(--danger)"
          trend="+2"
          trendUp={true}
        />
        <KpiCard 
          title="Novos Leads" 
          value={128} 
          icon={Users} 
          color="var(--info)"
          trend="+24%"
          trendUp={true}
        />
      </div>

      {/* Lists Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Urgent Conversations */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Atenção Necessária (Urgent)</h3>
            <span className="badge badge-danger">{urgentCount}</span>
          </div>
          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto">
            {urgentSessions.length > 0 ? urgentSessions.map(s => (
              <div key={s.phone} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center text-red-700 font-bold text-xs">
                    {s.phone.slice(-2)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{s.phone}</div>
                    <div className="text-xs text-red-600">Pausado há &gt; 15 min</div>
                  </div>
                </div>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => onNavigate('sessions', s)}
                >
                  Ver
                </button>
              </div>
            )) : (
              <div className="text-center text-gray-400 py-4">Nenhuma conversa urgente</div>
            )}
          </div>
        </div>

        {/* Idle Conversations */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Sem Interação (&gt; 2h)</h3>
            <span className="badge badge-warning">{idleSessions.length}</span>
          </div>
          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto">
            {idleSessions.length > 0 ? idleSessions.map(s => (
              <div key={s.phone} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                    {s.phone.slice(-2)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{s.phone}</div>
                    <div className="text-xs text-gray-500">Ocioso há &gt; 2h</div>
                  </div>
                </div>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => onNavigate('sessions', s)}
                >
                  Ver
                </button>
              </div>
            )) : (
              <div className="text-center text-gray-400 py-4">Nenhuma conversa ociosa</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, icon: Icon, color, trend, trendUp }: any) => (
  <div className="card p-6">
    <div className="flex justify-between items-start mb-4">
      <div style={{ padding: '10px', borderRadius: '8px', background: `${color}20`, color: color }}>
        <Icon size={24} />
      </div>
      {trend && (
        <div className="flex items-center gap-1" style={{ fontSize: '12px', color: trendUp ? 'var(--success)' : 'var(--danger)' }}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      )}
    </div>
    <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>{value}</div>
    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{title}</div>
  </div>
);
