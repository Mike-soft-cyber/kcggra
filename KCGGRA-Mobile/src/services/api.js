import { API_URL } from '../config/config';
import axios from 'axios' 
import * as SecureStore from 'expo-secure-store';
import { navigationRef } from '../navigation/navigationRef';

const API = axios.create({
  baseURL: `${API_URL}`
})

API.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if(error.response?.status === 401){
          navigationRef.navigate('Login')
        }
        return Promise.reject(error)
    }
)

const api = {
  // Request OTP
  requestOTP: async (phone) => {
    const response = await API.post(`/auth/request-otp`, { phone });
    return response.data;
},

  // Verify OTP
  verifyOTP: async (phone, otp) => {
    const response = await API.post(`/auth/verify-otp`, {phone, otp});
    return response.data
  },

  completeProfile: async(data) => {
    const response = await API.patch(`/auth/update-profile`, data)
    return response.data;
  },

  sendAlertIncident: async(type, latitude, longitude, address) => {
    const response = await API.post(`/incidents`, { type, latitude, longitude, address })
    return response.data;
  },

  getAnnouncements: async() => {
    const response = await API.get('/announcements')
    return response.data
  },

  getProjects: async() => {
    const response = await API.get('/projects')
    return response.data
  },

  getIncidents: async() => {
    const response = await API.get('/incidents')
    return response.data
  },

  createIncident: async(data) => {
    const response = await API.post('/incidents', data)
    return response.data
},

  getMyPayments: async () => {
    const response = await API.get('/payments/my-payments')
    return response.data
},

initiateMpesa: async (amount, phone, payment_type) => {
    const response = await API.post('/payments/mpesa/initiate', { amount, phone, payment_type })
    return response.data
},

createBankPayment: async (formData) => {
    const response = await API.post('/payments/bank', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    return response.data
},

getGroups: async () => {
    const response = await API.get('/groups')
    return response.data
},

getUpcomingEvents: async () => {
    const response = await API.get('/events')
    return response.data
},

getDiscussions: async () => {
    const response = await API.get('/discussions')
    return response.data
},

createDiscussion: async (data) => {
    const response = await API.post('/discussions', data)
    return response.data
},

createEvent: async (data) => {
    const response = await API.post('/events', data)
    return response.data
},

updateProfile: async (data) => {
    const response = await API.patch('/auth/update-profile', data)
    return response.data
},

getMe: async () => {
    const response = await API.get('/auth/me')
    return response.data
},

changePassword: async (data) => {
    const response = await API.post('/user/change-password', data)
    return response.data
},

getSessions: async () => {
    const response = await API.get('/user/sessions')
    return response.data
},

signOutAll: async () => {
    const response = await API.post('/user/signout-all')
    return response.data
},

addProxyAccount: async (data) => {
    const response = await API.post('/user/proxy', data)
    return response.data
},

deleteAccount: async () => {
    const response = await API.delete('/user/account')
    return response.data
},

getActiveGuardLocations: async () => {
    const response = await API.get('/guards/active-locations')
    return response.data
},

// Guard APIs
startShift: async () => {
    const response = await API.post('/guards/start-shift')
    return response.data
},

endShift: async () => {
    const response = await API.post('/guards/end-shift')
    return response.data
},

getCurrentShift: async () => {
    const response = await API.get('/guards/current-shift')
    return response.data
},

updateGuardLocation: async (latitude, longitude, status) => {
    const response = await API.post('/guards/update-location', { latitude, longitude, status })
    return response.data
},

getGuardStats: async () => {
    const response = await API.get('/guards/stats')
    return response.data
},

getOnDutyGuards: async () => {
    const response = await API.get('/guards/on-duty')
    return response.data
},

verifyVisitor: async (visitorId) => {
    const response = await API.post(`/visitors/${visitorId}/verify`)
    return response.data
},

checkoutVisitor: async (visitorId) => {
    const response = await API.post(`/visitors/${visitorId}/checkout`)
    return response.data
},

getActiveVisitors: async () => {
    const response = await API.get('/visitors/active')
    return response.data
},

updateIncidentStatus: async (incidentId, status, notes) => {
    const response = await API.patch(`/incidents/${incidentId}/status`, { status, notes })
    return response.data
},

getVisitor: async (visitorId) => {
    const response = await API.get(`/visitors/${visitorId}`)
    return response.data
},
  
};

export default api;