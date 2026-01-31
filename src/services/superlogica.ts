import axios from 'axios';
import { config } from '../config/env';

export const superlogicaService = {
    getPendingSlips: async (cpf: string) => {
        try {
            const response = await axios.get(`${config.superlogica.url}/cobranca`, {
                headers: {
                    app_token: config.superlogica.appToken,
                    access_token: config.superlogica.accessToken
                },
                params: {
                    status: 'pendente',
                    cpf: cpf,
                    apenasColunasPrincipais: 1
                }
            });
            return response.data;
        } catch (error) {
            console.error('Superlogica API Error:', error);
            throw error;
        }
    }
};
