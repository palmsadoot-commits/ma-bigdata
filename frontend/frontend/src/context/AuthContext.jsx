import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../services/api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeProject, setActiveProject] = useState(() => {
    const savedProject = localStorage.getItem('activeProject');
    return savedProject ? JSON.parse(savedProject) : null;
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      // ✅ บอก Server ว่าจะ Logout แล้วนะ (เพื่อบันทึก Log)
      await axiosInstance.post('/users/logout');
    } catch (err) {
      console.error('Logout API error:', err.message);
    } finally {
      // ล้างข้อมูลในเครื่องเสมอไม่ว่าจะเรียก API สำเร็จหรือไม่
      setUser(null);
      setActiveProject(null);
      localStorage.removeItem('user');
      localStorage.removeItem('activeProject');
    }
  };

  const selectProject = (project) => {
    setActiveProject(project);
    localStorage.setItem('activeProject', JSON.stringify(project));
  };

  const changeProject = () => {
    setActiveProject(null);
    localStorage.removeItem('activeProject');
  };

  return (
    <AuthContext.Provider value={{ user, activeProject, login, logout, selectProject, changeProject, setActiveProject }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
