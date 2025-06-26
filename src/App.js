import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import DataFinetuning from './components/DataFinetuning';
import Profile from './components/Profile';
import CustomerService from './components/CustomerService';
import HistorySearch from './components/HistorySearch';
import DataManagement from './components/DataManagement';
import AdminPanel from './components/AdminPanel';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 检查本地存储中的用户信息
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      // 如果没有角色信息，默认设置为普通用户
      if (!userData.role) {
        userData.role = 'user';
      }
      setUser(userData);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (userData) => {
    // 如果没有角色信息，默认设置为普通用户
    if (!userData.role) {
      userData.role = 'user';
    }
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  // 检查用户权限
  const hasRole = (requiredRole) => {
    if (!user) return false;
    
    const roleHierarchy = {
      'admin': 3,
      'support': 2,
      'user': 1
    };
    
    const userLevel = roleHierarchy[user.role] || 1;
    const requiredLevel = roleHierarchy[requiredRole] || 1;
    
    return userLevel >= requiredLevel;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? 
              <Login onLogin={handleLogin} /> : 
              <Navigate to="/dashboard" replace />
            } 
          />
          <Route 
            path="/register" 
            element={
              !isAuthenticated ? 
              <Register onRegister={handleLogin} /> : 
              <Navigate to="/dashboard" replace />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
              <Dashboard user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/finetuning" 
            element={
              isAuthenticated ? 
              <DataFinetuning user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/profile" 
            element={
              isAuthenticated ? 
              <Profile user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/history" 
            element={
              isAuthenticated ? 
              <HistorySearch user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/data-management" 
            element={
              isAuthenticated ? 
              <DataManagement user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" replace />
            } 
          />
          
          {/* 管理员专用路由 */}
          <Route 
            path="/admin" 
            element={
              isAuthenticated && hasRole('admin') ? 
              <AdminPanel user={user} onLogout={handleLogout} /> : 
              <Navigate to="/dashboard" replace />
            } 
          />
          
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
          />
        </Routes>
        
        {/* 客服组件 - 仅在登录后显示 */}
        {isAuthenticated && <CustomerService user={user} />}
      </div>
    </Router>
  );
}

export default App;
