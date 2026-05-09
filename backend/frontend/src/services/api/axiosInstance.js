import axios from 'axios';
import { API_BASE_URL as BASE } from '../../utils/config';

const API_BASE_URL = `${BASE}/api`;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 600000, // ✅ รอได้นานถึง 10 นาที (สำหรับงาน Backup)
});

// ✅ แนบ Token อัตโนมัติในทุก Request
axiosInstance.interceptors.request.use(config => {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser && parsedUser.token) {
        config.headers.Authorization = `Bearer ${parsedUser.token}`;
      }
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
    }
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// ดักจับถ้า Token หมดอายุ (401) หรือไม่มีสิทธิ์ (403 - บางกรณี) ให้ Logout ทันที
axiosInstance.interceptors.response.use(response => {
  return response;
}, error => {
  if (error.response) {
    const status = error.response.status;

    // Dispatch global event for error handling in UI
    window.dispatchEvent(new CustomEvent('api_error', { detail: { status } }));

    if (status === 401 || status === 403) {
      // ป้องกันการ Loop ถ้าอยู่ที่หน้า Login อยู่แล้วไม่ต้องทำอะไร
      if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
        console.warn('Session expired or unauthorized. Logging out...');
        localStorage.removeItem('user');
        localStorage.removeItem('activeProject');
        window.location.href = '/';
      }
    }
  }
  return Promise.reject(error);
});

export default axiosInstance;
;
