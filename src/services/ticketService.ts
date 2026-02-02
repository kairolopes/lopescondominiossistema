import { db } from '../config/firebase';

export interface Ticket {
  id?: string;
  customerPhone: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string; // Employee ID
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export const ticketService = {
  async create(data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!db) {
        console.warn('Database not initialized. Ticket created in memory (temporary).');
        return { id: 'temp_' + Date.now(), ...data, createdAt: new Date(), updatedAt: new Date() };
    }
    
    const ticketData = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await db.collection('tickets').add(ticketData);
    return { id: docRef.id, ...ticketData };
  },

  async getAll() {
    if (!db) {
        return []; // Return empty list for local mode
    }
    
    const snapshot = await db.collection('tickets').orderBy('updatedAt', 'desc').get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
      };
    });
  },

  async getByStatus(status: string) {
    if (!db) return [];
    
    const snapshot = await db.collection('tickets').where('status', '==', status).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async update(id: string, data: Partial<Ticket>) {
    if (!db) {
         console.warn('Database not initialized. Ticket update ignored.');
         return { id, ...data };
    }
    
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    await db.collection('tickets').doc(id).update(updateData);
    return { id, ...updateData };
  },
  
  async delete(id: string) {
      if (!db) return { id };
      await db.collection('tickets').doc(id).delete();
      return { id };
  }
};
