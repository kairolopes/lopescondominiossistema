import axios from 'axios';
import { config } from '../config/env';

const baseUrl = `https://api.z-api.io/instances/${config.zapi.instanceId}/token/${config.zapi.token}`;

export const zapiService = {
  sendText: async (phone: string, message: string) => {
    try {
      await axios.post(`${baseUrl}/send-text`, {
        phone,
        message,
      });
    } catch (error) {
      console.error('Error sending text via Z-API:', error);
    }
  },

  sendPDF: async (phone: string, pdfUrl: string, caption: string = 'Seu boleto') => {
    try {
      await axios.post(`${baseUrl}/send-document-pdf`, {
        phone,
        document: pdfUrl,
        fileName: 'boleto.pdf',
        caption
      });
    } catch (error) {
        console.error('Error sending PDF via Z-API:', error);
    }
  },
  
  sendOptionList: async (phone: string, message: string, title: string, options: {id: string, label: string}[]) => {
      try {
          // Z-API structure for lists might vary, checking simple button/list implementation
          // For simplicity using text with options if list is complex, but let's try buttons if few
          
           await axios.post(`${baseUrl}/send-button-list`, {
            phone,
            message,
            buttonList: {
                buttons: options.map(opt => ({
                    id: opt.id,
                    label: opt.label
                }))
            }
          });
      } catch (error) {
           console.error('Error sending list via Z-API:', error);
           // Fallback to text
           const textOptions = options.map((opt, i) => `${i+1}. ${opt.label}`).join('\n');
           await axios.post(`${baseUrl}/send-text`, {
               phone,
               message: `${message}\n\n${title}\n${textOptions}`
           });
      }
  }
};
