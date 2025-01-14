import axios from 'axios';
import { Client } from '../types';

const API_URL = 'http://localhost:3000/api';

export const api = {
  getClients: async () => {
    const response = await axios.get<Client[]>(`${API_URL}/clients`);
    return response.data;
  },

  addClient: async (client: Client) => {
    const response = await axios.post<Client>(`${API_URL}/clients`, client);
    return response.data;
  },

  updateClient: async (client: Client) => {
    const response = await axios.put<Client>(`${API_URL}/clients/${client.id}`, client);
    return response.data;
  },

  deleteClient: async (clientId: string) => {
    const response = await axios.delete(`${API_URL}/clients/${clientId}`);
    return response.data;
  },

  checkKeywords: async () => {
    const response = await axios.post(`${API_URL}/check-keywords`);
    return response.data;
  }
};
