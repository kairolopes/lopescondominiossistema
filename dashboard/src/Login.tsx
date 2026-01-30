
import { useState } from 'react';

interface LoginProps {
    onLogin: (token: string, user: any) => void;
}

export function Login({ onLogin }: LoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('http://localhost:3005/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) throw new Error('Credenciais inválidas');

            const data = await res.json();
            onLogin(data.token, data.user);
        } catch (err) {
            setError('Login falhou. Verifique e-mail e senha.');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#ecf0f1' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
                <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '10px' }}>Lopes Condomínios</h1>
                <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: '30px' }}>Acesso Restrito</p>

                {error && <div style={{ background: '#ff7675', color: 'white', padding: '10px', borderRadius: '6px', marginBottom: '20px', textAlign: 'center', fontSize: '14px' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <input 
                        type="email" 
                        placeholder="E-mail" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={{ padding: '15px', borderRadius: '8px', border: '1px solid #dfe6e9', fontSize: '16px' }}
                        required
                    />
                    <input 
                        type="password" 
                        placeholder="Senha" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{ padding: '15px', borderRadius: '8px', border: '1px solid #dfe6e9', fontSize: '16px' }}
                        required
                    />
                    <button 
                        type="submit" 
                        style={{ padding: '15px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s' }}
                    >
                        Entrar
                    </button>
                </form>
                <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#bdc3c7' }}>
                    Senha padrão inicial: 123456
                </p>
            </div>
        </div>
    );
}
