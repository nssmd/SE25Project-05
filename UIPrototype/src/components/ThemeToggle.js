import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = ({ variant = 'button', showLabel = false }) => {
  const { isDarkMode, toggleTheme, setTheme } = useTheme();

  if (variant === 'dropdown') {
    return (
      <div className="theme-dropdown">
        <select 
          value={isDarkMode ? 'dark' : 'light'} 
          onChange={(e) => setTheme(e.target.value)}
          className="theme-select"
        >
          <option value="light">浅色模式</option>
          <option value="dark">深色模式</option>
          <option value="system">跟随系统</option>
        </select>
      </div>
    );
  }

  if (variant === 'switch') {
    return (
      <div className="theme-switch">
        {showLabel && <span className="theme-label">深色模式</span>}
        <button 
          className={`theme-toggle-switch ${isDarkMode ? 'dark' : 'light'}`}
          onClick={toggleTheme}
          aria-label={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
        >
          <div className="switch-track">
            <div className="switch-thumb">
              {isDarkMode ? <Moon size={12} /> : <Sun size={12} />}
            </div>
          </div>
        </button>
      </div>
    );
  }

  // 默认按钮样式
  return (
    <button 
      className={`theme-toggle-btn ${isDarkMode ? 'dark' : 'light'}`}
      onClick={toggleTheme}
      aria-label={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
      title={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
    >
      <div className="icon-container">
        <Sun className={`sun-icon ${!isDarkMode ? 'active' : ''}`} size={18} />
        <Moon className={`moon-icon ${isDarkMode ? 'active' : ''}`} size={18} />
      </div>
      {showLabel && (
        <span className="theme-label">
          {isDarkMode ? '深色' : '浅色'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle; 