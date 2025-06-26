import React, { useState, useEffect } from 'react';
import { Trash2, Clock, Database, Settings, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import './DataManagement.css';

const DataManagement = () => {
  const [settings, setSettings] = useState({
    autoDelete: true,
    retentionDays: 30,
    maxChatCount: 100,
    protectedChats: 10,
    deleteInterval: 'daily'
  });
  const [stats, setStats] = useState({
    totalChats: 0,
    oldChats: 0,
    protectedChats: 0,
    totalSize: 0,
    lastCleanup: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');

  // 模拟获取统计数据
  useEffect(() => {
    const mockStats = {
      totalChats: 87,
      oldChats: 23,
      protectedChats: 5,
      totalSize: '2.3 GB',
      lastCleanup: '2024-01-19 10:30:00'
    };
    setStats(mockStats);
  }, []);

  // 保存设置
  const handleSaveSettings = async () => {
    setIsLoading(true);
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 保存到localStorage
    localStorage.setItem('dataManagementSettings', JSON.stringify(settings));
    setIsLoading(false);
    
    // 显示成功消息
    alert('设置已保存');
  };

  // 立即清理
  const handleImmediateCleanup = () => {
    setConfirmAction('cleanup');
    setShowConfirm(true);
  };

  // 删除所有数据
  const handleDeleteAllData = () => {
    setConfirmAction('deleteAll');
    setShowConfirm(true);
  };

  // 确认操作
  const confirmOperation = async () => {
    setIsLoading(true);
    setShowConfirm(false);
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (confirmAction === 'cleanup') {
      // 模拟清理过期数据
      setStats(prev => ({
        ...prev,
        totalChats: prev.totalChats - prev.oldChats,
        oldChats: 0,
        totalSize: '1.8 GB',
        lastCleanup: new Date().toLocaleString('zh-CN')
      }));
      alert('清理完成！删除了过期的对话记录。');
    } else if (confirmAction === 'deleteAll') {
      // 模拟删除所有数据
      setStats(prev => ({
        ...prev,
        totalChats: prev.protectedChats,
        oldChats: 0,
        totalSize: '0.3 GB',
        lastCleanup: new Date().toLocaleString('zh-CN')
      }));
      alert('所有非保护数据已删除！');
    }
    
    setIsLoading(false);
  };

  // 获取存储使用情况颜色
  const getStorageColor = () => {
    const sizeNum = parseFloat(stats.totalSize);
    if (sizeNum < 1) return '#10b981'; // 绿色
    if (sizeNum < 3) return '#f59e0b'; // 橙色
    return '#ef4444'; // 红色
  };

  return (
    <div className="data-management">
      <div className="dm-header">
        <h2>数据管理</h2>
        <p>管理您的对话数据，设置自动清理规则</p>
      </div>

      {/* 统计信息 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#3b82f6'}}>
            <Database size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalChats}</h3>
            <p>总对话数</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: '#f59e0b'}}>
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.oldChats}</h3>
            <p>过期对话</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: '#10b981'}}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.protectedChats}</h3>
            <p>保护对话</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: getStorageColor()}}>
            <Database size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalSize}</h3>
            <p>存储占用</p>
          </div>
        </div>
      </div>

      {/* 最后清理时间 */}
      {stats.lastCleanup && (
        <div className="last-cleanup">
          <Clock size={16} />
          <span>上次清理时间：{stats.lastCleanup}</span>
        </div>
      )}

      {/* 设置面板 */}
      <div className="settings-panel">
        <div className="panel-header">
          <Settings size={20} />
          <h3>自动清理设置</h3>
        </div>

        <div className="settings-grid">
          <div className="setting-group">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.autoDelete}
                onChange={(e) => setSettings({...settings, autoDelete: e.target.checked})}
              />
              <span>启用自动清理</span>
            </label>
            <p className="setting-desc">系统将根据设定规则自动删除过期数据</p>
          </div>

          <div className="setting-group">
            <label>数据保留天数</label>
            <div className="input-with-unit">
              <input
                type="number"
                min="1"
                max="365"
                value={settings.retentionDays}
                onChange={(e) => setSettings({...settings, retentionDays: parseInt(e.target.value)})}
                disabled={!settings.autoDelete}
              />
              <span>天</span>
            </div>
            <p className="setting-desc">超过此天数的对话将被自动删除</p>
          </div>

          <div className="setting-group">
            <label>最大对话数量</label>
            <div className="input-with-unit">
              <input
                type="number"
                min="10"
                max="1000"
                value={settings.maxChatCount}
                onChange={(e) => setSettings({...settings, maxChatCount: parseInt(e.target.value)})}
                disabled={!settings.autoDelete}
              />
              <span>条</span>
            </div>
            <p className="setting-desc">超过此数量时将删除最旧的对话</p>
          </div>

          <div className="setting-group">
            <label>保护对话数量</label>
            <div className="input-with-unit">
              <input
                type="number"
                min="0"
                max="50"
                value={settings.protectedChats}
                onChange={(e) => setSettings({...settings, protectedChats: parseInt(e.target.value)})}
                disabled={!settings.autoDelete}
              />
              <span>条</span>
            </div>
            <p className="setting-desc">最新的N条对话将不会被自动删除</p>
          </div>

          <div className="setting-group">
            <label>清理频率</label>
            <select
              value={settings.deleteInterval}
              onChange={(e) => setSettings({...settings, deleteInterval: e.target.value})}
              disabled={!settings.autoDelete}
            >
              <option value="hourly">每小时</option>
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
            <p className="setting-desc">系统执行自动清理的频率</p>
          </div>
        </div>

        <div className="setting-actions">
          <button 
            className="save-btn" 
            onClick={handleSaveSettings}
            disabled={isLoading}
          >
            <Save size={16} />
            {isLoading ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>

      {/* 手动操作 */}
      <div className="manual-actions">
        <h3>手动操作</h3>
        <div className="action-buttons">
          <button 
            className="action-btn warning"
            onClick={handleImmediateCleanup}
            disabled={isLoading}
          >
            <Trash2 size={16} />
            立即清理过期数据
          </button>
          
          <button 
            className="action-btn danger"
            onClick={handleDeleteAllData}
            disabled={isLoading}
          >
            <AlertTriangle size={16} />
            删除所有数据
          </button>
        </div>
        <p className="action-note">
          注意：手动操作将立即执行，无法撤销。请谨慎操作。
        </p>
      </div>

      {/* 确认对话框 */}
      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <div className="confirm-header">
              <AlertTriangle size={24} />
              <h3>确认操作</h3>
            </div>
            <div className="confirm-content">
              {confirmAction === 'cleanup' ? (
                <p>确定要清理过期的对话数据吗？此操作将删除 {stats.oldChats} 条过期对话，无法撤销。</p>
              ) : (
                <p>确定要删除所有对话数据吗？此操作将删除除保护对话外的所有数据，无法撤销。</p>
              )}
            </div>
            <div className="confirm-actions">
              <button 
                className="confirm-btn cancel"
                onClick={() => setShowConfirm(false)}
              >
                取消
              </button>
              <button 
                className="confirm-btn confirm"
                onClick={confirmOperation}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 加载遮罩 */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>处理中...</p>
        </div>
      )}
    </div>
  );
};

export default DataManagement; 