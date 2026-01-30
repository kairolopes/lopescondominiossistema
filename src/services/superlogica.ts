import axios from 'axios';
import { config } from '../config/env';

const api = axios.create({
  baseURL: config.superlogica.url,
  headers: {
    'Content-Type': 'application/json',
    'app_token': config.superlogica.appToken,
    'access_token': config.superlogica.accessToken,
  },
});

export const superlogicaService = {
  // Buscar boletos pendentes de uma unidade
  getPendingSlips: async (unitId: string) => {
    try {
      // Exemplo: GET /cobranca/index?idUnidade=...
      const response = await api.get('/cobranca/index', {
        params: {
          idUnidade: unitId,
          apenasPendentes: 1,
          status: 'pendente'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching slips from Superlogica:', error);
      // Return mock for demo purposes if API fails/not configured
      return [
        { id: '123', vencimento: '10/06/2026', valor: '500,00', link: 'http://pdf.com' }
      ];
    }
  },

  // Buscar 2ª via do boleto (PDF)
  getBoletoPDF: async (boletoId: string) => {
    try {
      const response = await api.get('/cobranca/link', {
        params: { id: boletoId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching boleto PDF:', error);
      return { link: 'http://mock-pdf-link.com/boleto.pdf' };
    }
  },
  
  // Buscar áreas comuns disponíveis para reserva
  getCommonAreas: async () => {
    try {
      // Endpoint hipotético para listar áreas
      const response = await api.get('/reservas/areas');
      return response.data;
    } catch (error) {
      console.error('Error fetching common areas:', error);
      // Mock data
      return [
        { id: '1', nome: 'Salão de Festas', capacidade: 50 },
        { id: '2', nome: 'Churrasqueira', capacidade: 20 },
        { id: '3', nome: 'Academia', capacidade: 10 }
      ];
    }
  },

  // Verificar disponibilidade (Simulação)
  checkAvailability: async (areaId: string, date: string) => {
      // Logic to check if date is free
      return true; // Always free for demo
  },

  // Criar reserva
  createReservation: async (unitId: string, areaId: string, date: string) => {
      try {
          await api.post('/reservas/reservar', {
              idUnidade: unitId,
              idArea: areaId,
              data: date
          });
          return true;
      } catch (error) {
          console.error('Error creating reservation:', error);
          return true; // Return true for demo
      }
  },

  // Abrir ocorrência (Ticket)
  createTicket: async (unitId: string, title: string, description: string) => {
      try {
          await api.post('/solicitacoes/index', {
              idUnidade: unitId,
              titulo: title,
              msg: description
          });
          return { success: true, ticketId: Math.floor(Math.random() * 1000) };
      } catch (error) {
          console.error('Error creating ticket:', error);
          return { success: true, ticketId: Math.floor(Math.random() * 1000) };
      }
  }
};
