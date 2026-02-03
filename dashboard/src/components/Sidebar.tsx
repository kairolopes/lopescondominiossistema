import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Trello, 
  Megaphone, 
  Users, 
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
  user: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, user }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sessions', label: 'Atendimentos', icon: MessageSquare },
    { id: 'kanban', label: 'CRM / Pipeline', icon: Trello },
    { id: 'campaigns', label: 'Marketing', icon: Megaphone },
    { id: 'team', label: 'Equipe', icon: Users },
  ];

  return (
    <div style={{ 
      width: 'var(--sidebar-width)', 
      background: 'var(--sidebar-bg)', 
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'
    }}>
      {/* Brand */}
      <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '32px', height: '32px', 
            background: 'var(--primary)', 
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '18px'
          }}>L</div>
          <span style={{ fontSize: '18px', fontWeight: 600 }}>Lopes CRM</span>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, padding: '16px 0' }}>
        <div style={{ padding: '0 12px 8px 12px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--sidebar-text)', fontWeight: 600 }}>
          Menu Principal
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 24px',
                  background: isActive ? 'var(--sidebar-active)' : 'transparent',
                  color: isActive ? 'white' : 'var(--sidebar-text)',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  borderLeft: isActive ? '4px solid var(--primary)' : '4px solid transparent'
                }}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ 
            width: '40px', height: '40px', 
            background: 'var(--primary)', 
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 600
          }}>
            {user?.name?.[0] || 'U'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'Usuário'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--sidebar-text)' }}>
              {user?.role === 'master' ? 'Administrador' : 'Agente'}
            </div>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            width: '100%', padding: '8px', 
            background: 'rgba(255,255,255,0.05)', 
            border: 'none', borderRadius: '6px',
            color: 'var(--sidebar-text)', cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          <LogOut size={14} />
          Sair do Sistema
        </button>
      </div>
    </div>
  );
};
