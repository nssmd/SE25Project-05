import React, { useState, useEffect, useRef } from 'react';
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
import { ThemeProvider } from './contexts/ThemeContext';
import userService from './services/UserService';
import { authAPI } from './services/api';
import './theme.css';
import './App.css';
import './styles/mobile.css';
import FeatureContent from "./components/FeatureContent";
import Sidebar from './components/Sidebar';
import { ChevronLeft, ChevronRight } from "lucide-react";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);

  const toggleSidebar = () => {
      setShowSidebar(!showSidebar);
  };

    // 移动端默认隐藏侧边栏
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setShowSidebar(false);
            }
        };
        
        // 初始化时检查屏幕大小
        handleResize();
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // const appRef = useRef();
    //
    // useEffect(() => {
    //     const handleClickOutside = (e) => {
    //         if (showSidebar && !appRef.current.contains(e.target)) {
    //             setShowSidebar(false);
    //         }
    //     };
    //     document.addEventListener('mousedown', handleClickOutside);
    //     return () => document.removeEventListener('mousedown', handleClickOutside);
    // }, [showSidebar]);

  useEffect(() => {
    // 检查本地存储中的用户信息和token，并验证token有效性
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          // 验证token是否仍然有效（通过获取当前用户信息）
          await authAPI.verify();
          
          // Token有效，解析用户信息
          const userData = JSON.parse(savedUser);
          // 如果没有角色信息，默认设置为普通用户
          if (!userData.role) {
            userData.role = 'user';
          }
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.warn('Token验证失败或已过期:', error.message);
          // Token无效或过期，清除本地存储
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
          setUser(null);
          setIsAuthenticated(false);
          
          // 如果是在非登录页面，显示友好提示
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            showTokenExpiredMessage();
          }
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  // 显示token过期提示
  const showTokenExpiredMessage = () => {
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ffa726;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        max-width: 320px;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">🔐</span>
          <div>
            <div style="font-weight: 600; margin-bottom: 4px;">会话已过期</div>
            <div style="opacity: 0.9; font-size: 13px;">请重新登录以继续使用</div>
          </div>
        </div>
      </div>
    `;

    // 添加CSS动画
    if (!document.querySelector('#slideInAnimation')) {
      const style = document.createElement('style');
      style.id = 'slideInAnimation';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);
    
    // 5秒后自动移除提示
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  };

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
    <ThemeProvider>
      <Router>
      <div className="App">
          {isAuthenticated &&
              <button
                  className="floating-sidebar-toggle"
                  onClick={toggleSidebar}
                  aria-label={showSidebar ? "隐藏侧边栏" : "显示侧边栏"}
              >
              {showSidebar ? <ChevronLeft/> : <ChevronRight/>}
          </button>}
          {isAuthenticated && <Sidebar user={user} onLogout={handleLogout} showSidebar={showSidebar} />}
          <main className={`main-content ${showSidebar ? 'sidebar-open' : 'sidebar-closed'}`}>
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
                              <Dashboard 
                                  user={user} 
                                  onLogout={handleLogout} 
                                  showSidebar={showSidebar}
                                  setShowSidebar={setShowSidebar}
                              /> :
                              <Navigate to="/login" replace />
                      }
                  >
                      <Route path=":featureId" element={<FeatureContent/>}/>
                  </Route>
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
          </main>
      </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
