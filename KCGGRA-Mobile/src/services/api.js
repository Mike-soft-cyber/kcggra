import { API_URL } from '../config/config';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { navigationRef } from '../navigation/navigationRef';

const API = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
});

let isRedirectingToLogin = false;

const handleAuthFailure = async () => {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;
  try { await SecureStore.deleteItemAsync('token'); } catch {}
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
  }
  setTimeout(() => { isRedirectingToLogin = false; }, 3000);
};

API.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
 
    if (status === 401) {
      // Token expired or invalid — redirect to login
      console.warn('🔒 Session expired — redirecting to login');
      window.location.href = '/login';
    }
 
    // Log every error for debugging
    console.error(
      '❌ API Error:',
      error.config?.url,
      status,
      error.response?.data?.message || error.message
    );
 
    return Promise.reject(error);
  }
);

const api = {
  // ── Auth ──────────────────────────────────────────────
  requestOTP: async (phone) => {
    const res = await API.post('/auth/request-otp', { phone });
    return res.data;
  },

  verifyOTP: async (phone, otp) => {
    const res = await API.post('/auth/verify-otp', { phone, otp });
    return res.data;
  },

  completeProfile: async (data) => {
    // ✅ Never sends role — backend ignores it anyway
    const { username, email, street } = data;
    const res = await API.patch('/auth/update-profile', { username, email, street });
    return res.data;
  },

  updateProfile: async (data) => {
    const { username, email, street } = data; // ✅ role stripped
    const res = await API.patch('/auth/update-profile', { username, email, street });
    return res.data;
  },

  getMe: async () => {
    const res = await API.get('/auth/me');
    return res.data;
  },

  /**
   * Admin-only login — called from the hidden modal (7 logo taps + PIN)
   * Uses email + password, NOT OTP
   * Hits a separate endpoint from the resident login
   */
  adminLogin: async (email, password) => {
    const res = await API.post('/auth/admin-login', { email, password });
    return res.data;
  },

  // ── Incidents ─────────────────────────────────────────
  sendAlertIncident: async (type, latitude, longitude, address) => {
    const res = await API.post('/incidents', { type, latitude, longitude, address });
    return res.data;
  },

  getIncidents: async () => {
    const res = await API.get('/incidents');
    return res.data;
  },

  createIncident: async (data) => {
    const res = await API.post('/incidents', data);
    return res.data;
  },

  updateIncidentStatus: async (incidentId, status, notes) => {
    const res = await API.patch(`/incidents/${incidentId}/status`, { status, notes });
    return res.data;
  },

  // ── Announcements ─────────────────────────────────────
  getAnnouncements: async () => {
    const res = await API.get('/announcements');
    return res.data;
  },

  // ── Projects ──────────────────────────────────────────
  getProjects: async () => {
    const res = await API.get('/projects');
    return res.data;
  },

  // ── Payments ──────────────────────────────────────────
  getMyPayments: async () => {
    const res = await API.get('/payments/my-payments');
    return res.data;
  },

  initiateMpesa: async (amount, phone, payment_type) => {
    const res = await API.post('/payments/mpesa/initiate', { amount, phone, payment_type });
    return res.data;
  },

  createBankPayment: async (formData) => {
    const res = await API.post('/payments/bank', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // ── Community ─────────────────────────────────────────
  getGroups: async () => {
    const res = await API.get('/groups');
    return res.data;
  },

  getUpcomingEvents: async () => {
    const res = await API.get('/events');
    return res.data;
  },

  getDiscussions: async () => {
    const res = await API.get('/discussions');
    return res.data;
  },

  createDiscussion: async (data) => {
    const res = await API.post('/discussions', data);
    return res.data;
  },

  createEvent: async (data) => {
    const res = await API.post('/events', data);
    return res.data;
  },

  // ── User Settings ─────────────────────────────────────
  changePassword: async (data) => {
    const res = await API.post('/user/change-password', data);
    return res.data;
  },

  getSessions: async () => {
    const res = await API.get('/user/sessions');
    return res.data;
  },

  signOutAll: async () => {
    const res = await API.post('/user/signout-all');
    return res.data;
  },

  addProxyAccount: async (data) => {
    const res = await API.post('/user/proxy', data);
    return res.data;
  },

  deleteAccount: async () => {
    const res = await API.delete('/user/account');
    return res.data;
  },

  // ── Guards ────────────────────────────────────────────
  getActiveGuardLocations: async () => {
    const res = await API.get('/guards/active-locations');
    return res.data;
  },

  startShift: async () => {
    const res = await API.post('/guards/start-shift');
    return res.data;
  },

  endShift: async () => {
    const res = await API.post('/guards/end-shift');
    return res.data;
  },

  getCurrentShift: async () => {
    const res = await API.get('/guards/current-shift');
    return res.data;
  },

  updateGuardLocation: async (latitude, longitude, status) => {
    const res = await API.post('/guards/update-location', { latitude, longitude, status });
    return res.data;
  },

  getGuardStats: async () => {
    const res = await API.get('/guards/stats');
    return res.data;
  },

  getOnDutyGuards: async () => {
    const res = await API.get('/guards/on-duty');
    return res.data;
  },

  // ── Visitors ──────────────────────────────────────────
  verifyVisitor: async (visitorId) => {
    const res = await API.post(`/visitors/${visitorId}/verify`);
    return res.data;
  },

  checkoutVisitor: async (visitorId) => {
    const res = await API.post(`/visitors/${visitorId}/checkout`);
    return res.data;
  },

  getActiveVisitors: async () => {
    const res = await API.get('/visitors/active');
    return res.data;
  },

  getVisitor: async (visitorId) => {
    const res = await API.get(`/visitors/${visitorId}`);
    return res.data;
  },
};

export default api;