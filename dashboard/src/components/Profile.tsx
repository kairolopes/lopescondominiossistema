import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Administrativo' | 'Comercial' | 'Contador' | 'Financeiro' | 'Tecnologia';
  department?: string;
  customRole?: string; // For the new requested roles
}

interface ProfileProps {
  user: User | null;
  onUpdateUser: (updatedUser: Partial<User>) => void;
}

const ROLES = [
  'Administrativo',
  'Comercial',
  'Contador',
  'Financeiro',
  'Tecnologia'
];

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      // Map internal roles to display roles if needed, or use stored custom role
      if (user.email === 'admin@lopes.com.br') {
        setSelectedRole('Tecnologia');
      } else {
        setSelectedRole(user.role || ROLES[1]); // Default to Comercial
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate API update
    try {
      // Here you would typically make an API call to update the user profile
      // For now we'll just update the local state via the callback
      
      onUpdateUser({
        name,
        email,
        customRole: selectedRole
      });
      
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
    }
  };

  const isFixedAdmin = email === 'admin@lopes.com.br';

  return (
    <div className="content-area">
      <div className="header">
        <h2>Meu Perfil</h2>
      </div>

      <div style={{ maxWidth: '600px', background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {message && (
          <div style={{ 
            padding: '12px', 
            borderRadius: '4px', 
            marginBottom: '16px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: isFixedAdmin ? '#f8f9fa' : 'white' }}
              readOnly={isFixedAdmin}
              required
            />
            {isFixedAdmin && <small style={{ color: '#666' }}>O email do administrador não pode ser alterado.</small>}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Cargo</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: isFixedAdmin ? '#f8f9fa' : 'white' }}
              disabled={isFixedAdmin}
            >
              {ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            {isFixedAdmin && <small style={{ color: '#666' }}>O cargo de Administrador é fixo para este usuário.</small>}
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 500
            }}
          >
            Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  );
};
