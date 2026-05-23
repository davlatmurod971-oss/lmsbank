import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - add token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('skillpath_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('skillpath_token');
      localStorage.removeItem('skillpath_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.post('/auth/change-password', data)
};

// Employees
export const employeesAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  deactivate: (id) => api.patch(`/employees/${id}/deactivate`),
  assignCareerTrack: (id, data) => api.patch(`/employees/${id}/assign-career-track`, data),
  getLearningPath: (id) => api.get(`/employees/${id}/learning-path`),
  getTrainings: (id) => api.get(`/employees/${id}/trainings`),
  getFeedback: (id) => api.get(`/employees/${id}/feedback`)
};

// Career Tracks
export const careerTracksAPI = {
  getAll: () => api.get('/career-tracks'),
  getById: (id) => api.get(`/career-tracks/${id}`),
  create: (data) => api.post('/career-tracks', data),
  addLevel: (trackId, data) => api.post(`/career-tracks/${trackId}/levels`, data),
  addSkill: (levelId, data) => api.post(`/career-levels/${levelId}/skills`, data),
  addTraining: (levelId, data) => api.post(`/career-levels/${levelId}/trainings`, data)
};

// Skills
export const skillsAPI = {
  getAll: () => api.get('/skills'),
  create: (data) => api.post('/skills', data),
  updateEmployeeSkill: (employeeId, data) => api.patch(`/employee-skills/${employeeId}`, data)
};

// Trainings
export const trainingsAPI = {
  getAll: (params) => api.get('/trainings', { params }),
  create: (data) => api.post('/trainings', data),
  assign: (data) => api.post('/trainings/assign', data),
  start: (id) => api.patch(`/employee-trainings/${id}/start`),
  complete: (id) => api.patch(`/employee-trainings/${id}/complete`)
};

// Feedback
export const feedbackAPI = {
  getByEmployee: (id) => api.get(`/employees/${id}/feedback`),
  add: (id, data) => api.post(`/employees/${id}/feedback`, data)
};

// Promotion
export const promotionAPI = {
  generate: (data) => api.post('/promotion-packets/generate', data),
  getAll: () => api.get('/promotion-packets'),
  getById: (id) => api.get(`/promotion-packets/${id}`),
  updateStatus: (id, data) => api.patch(`/promotion-packets/${id}/status`, data)
};

// Branches & Departments
export const branchesAPI = {
  getAll: () => api.get('/branches'),
  create: (data) => api.post('/branches', data)
};

export const departmentsAPI = {
  getAll: () => api.get('/departments')
};

// Reports
export const reportsAPI = {
  trainingCompletion: () => api.get('/reports/training-completion'),
  promotionPipeline: () => api.get('/reports/promotion-pipeline')
};

// Notifications
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`)
};

// Audit logs
export const auditAPI = {
  getLogs: (params) => api.get('/audit-logs', { params })
};

export default api;
