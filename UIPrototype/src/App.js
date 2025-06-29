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
import MessageCenter from './components/MessageCenter';
import userService from './services/UserService';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查本地存储中的用户信息和token
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          // 如果没有角色信息，默认设置为普通用户
          if (!userData.role) {
            userData.role = 'user';
          }
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('解析用户信息失败:', error);
          // 清除无效的数据
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const handleLogin = (userData, token) => {
    // 如果没有角色信息，默认设置为普通用户
    if (!userData.role) {
      userData.role = 'user';
    }
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('authToken', token);
    }
  };

  const handleLogout = async () => {
    try {
      // 调用userService的logout方法，它会清理本地存储
      await userService.logout();
    } catch (error) {
      console.error('退出登录失败:', error);
    } finally {
      // 确保清除本地状态
      setUser(null);
      setIsAuthenticated(false);
    }
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

  // 在加载过程中显示loading
  if (isLoading) {
    return (
      <div className="App loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在加载...</p>
        </div>
      </div>
    );
  }

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
          
          <Route 
            path="/messages" 
            element={
              isAuthenticated ? 
              <MessageCenter user={user} onLogout={handleLogout} /> : 
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
