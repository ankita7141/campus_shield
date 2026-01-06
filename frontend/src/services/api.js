import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;


// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

const apiService = {
  // Initialize API service
  init: () => {
    console.log('API Service initialized with base URL:', API_BASE_URL);
  },

  // Set authentication token
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  },

  // Auth endpoints
  auth: {
    login: (email, password) => api.post('/auth/login', { email, password }),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    changePassword: (currentPassword, newPassword) => 
      api.put('/auth/change-password', { currentPassword, newPassword })
  },

  // Report endpoints
  reports: {
    // Submit a new report
    submitReport: (formData) => {
      return api.post('/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    },

    // Get all reports with optional filters
    getReports: (params = {}) => {
      const queryParams = new URLSearchParams();
      
      // Add all parameters to query string
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      return api.get(`/reports?${queryParams.toString()}`);
    },

    // Get single report by ID
    getReport: (id) => api.get(`/reports/${id}`),

    // Update report status
    updateReportStatus: (id, status) => 
      api.patch(`/reports/${id}`, { status }),

    // Add follow-up note to report
    addNote: (id, note, adminId) => 
      api.post(`/reports/${id}/notes`, { note, adminId }),

    // Delete report (admin only)
    deleteReport: (id) => api.delete(`/reports/${id}`)
  },

  // Statistics endpoints
  statistics: {
    getStatistics: (timeframe = '7days') => 
      api.get(`/reports/stats?timeframe=${timeframe}`),
    
    // Get custom statistics
    getCustomStats: (params) => api.get('/stats/custom', { params })
  },

  // Admin endpoints
  admin: {
    // Dashboard data
    getDashboard: () => api.get('/admin/dashboard'),

    // Admin management
    getAdmins: () => api.get('/admin/admins'),
    createAdmin: (data) => api.post('/admin/admins', data),
    updateAdmin: (id, data) => api.put(`/admin/admins/${id}`, data),
    deleteAdmin: (id) => api.delete(`/admin/admins/${id}`),

    // Report management
    assignReport: (reportId, adminId) => 
      api.patch(`/reports/${reportId}/assign`, { adminId }),

    // Bulk actions
    bulkUpdate: (reportIds, updates) => 
      api.post('/admin/reports/bulk-update', { reportIds, updates })
  },

  // Utility endpoints
  utils: {
    // Upload file
    uploadFile: (file, type = 'image') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      return api.post('/utils/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    },

    // Send notification
    sendNotification: (userId, title, message) => 
      api.post('/utils/notify', { userId, title, message }),

    // Export data
    exportData: (format, params) => 
      api.get(`/utils/export/${format}`, { params, responseType: 'blob' })
  },

  // Mock data for development (when backend is not available)
  mock: {
    getReports: () => {
      return Promise.resolve({
        success: true,
        data: [
          {
            _id: 'mock1',
            reportId: 'REP202400001',
            description: 'Suspicious activity near library',
            category: 'safety-threat',
            severity: 'medium',
            status: 'pending',
            location: {
              lat: 28.6139,
              lng: 77.2090,
              address: 'Library Building'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: 'mock2',
            reportId: 'REP202400002',
            description: 'Harassment incident reported',
            category: 'harassment',
            severity: 'high',
            status: 'under-review',
            location: {
              lat: 28.6145,
              lng: 77.2098,
              address: 'Cafeteria Area'
            },
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        count: 2,
        total: 2,
        totalPages: 1
      });
    },

    getStatistics: () => {
      return Promise.resolve({
        success: true,
        data: {
          total: 25,
          pending: 8,
          resolved: 15,
          underReview: 2,
          byCategory: {
            harassment: 10,
            'safety-threat': 8,
            misbehavior: 5,
            emergency: 2,
            other: 0
          },
          bySeverity: {
            critical: 2,
            high: 5,
            medium: 12,
            low: 6
          },
          dailyReports: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
            count: Math.floor(Math.random() * 10) + 1
          }))
        }
      });
    }
  }
};

// Helper function to check if backend is available
apiService.checkBackend = async () => {
  try {
    const response = await axios.get(API_BASE_URL.replace('/api', ''));
    return { available: true, message: 'Backend connected' };
  } catch (error) {
    return { 
      available: false, 
      message: 'Backend not available, using mock data',
      error: error.message 
    };
  }
};

// Global error handler
apiService.handleError = (error) => {
  console.error('API Error:', error);
  
  const errorMessage = error.response?.data?.error || 
                      error.message || 
                      'An unexpected error occurred';
  
  // Show error notification (you can customize this)
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('show-notification', {
      detail: {
        type: 'error',
        title: 'Error',
        message: errorMessage
      }
    });
    window.dispatchEvent(event);
  }
  
  return { success: false, error: errorMessage };
};

export default apiService;