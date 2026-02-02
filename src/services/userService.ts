import { db } from '../config/firebase';

export interface SystemUser {
  id?: string;
  name: string;
  email: string;
  password?: string; // In a real app, hash this!
  role: 'Administrativo' | 'Comercial' | 'Contador' | 'Financeiro' | 'Tecnologia';
  department?: string;
}

export const userService = {
  // For Chat Bot (End Users)
  findByPhone: async (phone: string) => {
    // Mock for now, or integrate with Superlogica later
    return { phone, name: 'Condômino' };
  },

  // For System Users (CRM)
  async createSystemUser(data: SystemUser) {
    if (!db) throw new Error('Database not initialized');
    // Basic check if email exists
    const existing = await db.collection('users').where('email', '==', data.email).get();
    if (!existing.empty) {
        throw new Error('User already exists');
    }
    
    const docRef = await db.collection('users').add(data);
    return { id: docRef.id, ...data };
  },

  async findSystemUserByEmail(email: string) {
    if (!db) throw new Error('Database not initialized');
    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as SystemUser;
  },

  async getAllSystemUsers() {
    if (!db) throw new Error('Database not initialized');
    const snapshot = await db.collection('users').get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        // Exclude password
        const { password, ...userWithoutPassword } = data as SystemUser;
        return { id: doc.id, ...userWithoutPassword };
    });
  }
};
