import axios from 'axios';
import { Client } from '../types';
import { API_URL } from '../config';

export const api = {
  getClients: async () => {
    const response = await axios.get<Client[]>(`${API_URL}/api/clients`);
    return response.data;
  },

  addClient: async (client: Client) => {
    const response = await axios.post<Client>(`${API_URL}/api/clients`, client);
    return response.data;
  },

  updateClient: async (client: Client) => {
    const response = await axios.put<Client>(`${API_URL}/api/clients/${client.id}`, client);
    return response.data;
  },

  deleteClient: async (clientId: string) => {
    const response = await axios.delete(`${API_URL}/api/clients/${clientId}`);
    return response.data;
  },

  checkKeywords: async () => {
    const response = await axios.post(`${API_URL}/api/check-keywords`);
    return response.data;
  }
};
