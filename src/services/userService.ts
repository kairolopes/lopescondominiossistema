import { db } from '../config/firebase';
import fs from 'fs';
import path from 'path';

export interface SystemUser {
  id?: string;
  name: string;
  email: string;
  password?: string; // In a real app, hash this!
  role: 'admin' | 'agent';
  department?: string;
}

const DATA_FILE = path.join(__dirname, '../../data/users.json');

const getLocalUsers = (): any[] => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error reading local users:', e);
    }
    return [];
};

export const userService = {
  // For Chat Bot (End Users)
  findByPhone: async (phone: string) => {
    // Mock for now, or integrate with Superlogica later
    return { phone, name: 'Condômino' };
  },

  // For System Users (CRM)
  async createSystemUser(data: SystemUser) {
    if (!db) {
        console.warn('Database not initialized. Creating user in temporary memory/local file logic could be added here.');
        // For now, simulate success so frontend doesn't break
        return { id: 'temp_' + Date.now(), ...data };
    }
    // Basic check if email exists
    const existing = await db.collection('users').where('email', '==', data.email).get();
    if (!existing.empty) {
        throw new Error('User already exists');
    }
    
    const docRef = await db.collection('users').add(data);
    return { id: docRef.id, ...data };
  },

  async findSystemUserByEmail(email: string) {
    if (!db) {
        const users = getLocalUsers();
        const user = users.find(u => u.email === email);
        if (user) {
            // Inject default password for dev mode (since json has hash and auth expects plain text)
            // This allows login with '123456' for any user in users.json when DB is down
            return { ...user, password: '123456' } as SystemUser;
        }
        return null;
    }
    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as SystemUser;
  },

  async getAllSystemUsers() {
    if (!db) {
        return getLocalUsers().map(u => {
            const { password, passwordHash, ...rest } = u;
            return { id: u.id, ...rest };
        });
    }
    const snapshot = await db.collection('users').get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        // Exclude password
        const { password, ...userWithoutPassword } = data as SystemUser;
        return { id: doc.id, ...userWithoutPassword };
    });
  }
};
