import axios from 'axios';
import { io } from 'socket.io-client';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = axios.create({ baseURL: API_URL + '/api' });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = 'Bearer ' + t;
  return c;
});
export const errMsg = (e) => e?.response?.data?.message || e.message || 'Something went wrong';
export const connectSocket = () => io(API_URL, { auth: { token: localStorage.getItem('token') } });
export const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');
export const TAX_RATE = 0.05;
export default api;
