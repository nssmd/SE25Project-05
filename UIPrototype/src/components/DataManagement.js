import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  Clock, 
  Database, 
  Settings, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  ArrowLeft,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { dataAPI, chatAPI, historyAPI } from '../services/api';
import './DataManagement.css';
import UserCorner from "./UserCorner";

const DataManagement = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    autoDelete: true,
    retentionDays: 30,
    maxChatCount: 100,
    protectedChats: 10
  });
  const [stats, setStats] = useState({
    totalChats: 0,
    oldChats: 0,
    protectedChats: 0,
    totalSize: '0 MB',
    lastCleanup: null,
    totalMessages: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setIsLoadingData(true);
      
      // 并行获取数据
      const [settingsResponse, statisticsResponse, historyStatsResponse] = await Promise.all([
        dataAPI.getSettings().catch(err => {
          console.warn('获取设置失败:', err);
          return {
            autoDelete: true,
            retentionDays: 30,
            maxChatCount: 100,
            protectedChats: 10
          };
        }),
        dataAPI.getStatistics().catch(err => {
          console.warn('获取统计失败:', err);
          return { totalChats: 0, oldChats: 0, protectedChats: 0, totalSize: '0 MB' };
        }),
        historyAPI.getStats().catch(err => {
          console.warn('获取历史统计失败:', err);
          return { totalChats: 0, totalMessages: 0 };
        })
      ]);
      
      // 设置状态
      if (settingsResponse) {
        setSettings(settingsResponse);
      }
      
      // 合并统计数据
      const combinedStats = {
        ...statisticsResponse,
        ...historyStatsResponse,
        lastCleanup: new Date().toLocaleString()
      };
      
      setStats(combinedStats);
      
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // 保存设置
  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      setSaveStatus('saving');
      
      await dataAPI.updateSettings(settings);
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
      
    } catch (error) {
      console.error('保存设置失败:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsLoading(false);
    }
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

  // 导出数据
  const handleExportData = async () => {
    try {
      setIsLoading(true);
      const data = await dataAPI.exportData();
      
      // 创建下载链接
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('导出数据失败:', error);
      alert('导出数据失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 确认操作
  const confirmOperation = async () => {
    try {
      setIsLoading(true);
      setShowConfirm(false);
      
      if (confirmAction === 'cleanup') {
        await dataAPI.cleanup();
        alert('清理完成！删除了过期的对话记录。');
        loadData(); // 重新加载数据
      } else if (confirmAction === 'deleteAll') {
        await dataAPI.deleteAll('CONFIRM_DELETE');
        alert('所有非保护数据已删除！');
        loadData(); // 重新加载数据
      }
    } catch (error) {
      console.error('操作失败:', error);
      alert(error.message || '操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    loadData();
  };

  // 获取存储使用情况颜色
  const getStorageColor = () => {
    if (!stats?.totalSize) return '#10b981';
    const sizeStr = stats.totalSize.toString();
    const sizeNum = parseFloat(sizeStr);
    if (sizeNum < 1) return '#10b981'; // 绿色
    if (sizeNum < 5) return '#f59e0b'; // 橙色
    return '#ef4444'; // 红色
  };

  // 计算过期对话数
  const calculateOldChats = () => {
    const totalChats = stats.totalChats || 0;
    const protectedChats = stats.protectedChats || 0;
    const retentionDays = settings.retentionDays || 30;
    
    // 简单估算：假设有10%的对话是过期的
    return Math.floor((totalChats - protectedChats) * 0.1);
  };
  
  if (isLoadingData) {
    return (
      <div className="data-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="data-management">
      <header className="page-header">
        <button 
          className="back-button"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={20} />
          返回主界面
        </button>
        <div className="header-content">
          <h1>数据管理</h1>
          <p>管理您的对话数据，设置自动清理规则</p>
        </div>
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw size={16} />
            刷新
          </button>
          <UserCorner user={user} onLogout={onLogout} />
        </div>
      </header>
      
      <div className="dm-content">
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
              <h3>{calculateOldChats()}</h3>
              <p>过期对话</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{background: '#10b981'}}>
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.protectedChats || 0}</h3>
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

          <div className="stat-card">
            <div className="stat-icon" style={{background: '#8b5cf6'}}>
              <Database size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.totalMessages || 0}</h3>
              <p>总消息数</p>
            </div>
          </div>
        </div>

        {/* 最后清理时间 */}
        {stats.lastCleanup && (
          <div className="last-cleanup">
            <Clock size={16} />
            <span>上次数据更新：{stats.lastCleanup}</span>
          </div>
        )}

        {/* 自动清理设置 */}
        <div className="settings-section">
          <div className="section-header">
            <Settings size={20} />
            <h2>自动清理设置</h2>
          </div>
          
          <div className="settings-grid">
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.autoDelete}
                  onChange={(e) => setSettings({...settings, autoDelete: e.target.checked})}
                />
                启用自动清理
              </label>
              <p className="setting-desc">自动删除过期的对话记录</p>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                保留天数
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.retentionDays}
                  onChange={(e) => setSettings({...settings, retentionDays: parseInt(e.target.value)})}
                />
              </label>
              <p className="setting-desc">对话记录保留的天数</p>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                最大对话数
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={settings.maxChatCount}
                  onChange={(e) => setSettings({...settings, maxChatCount: parseInt(e.target.value)})}
                />
              </label>
              <p className="setting-desc">单个用户最大对话数量</p>
            </div>
          </div>

          <div className="save-section">
            <button 
              className={`save-btn ${saveStatus}`}
              onClick={handleSaveSettings}
              disabled={isLoading}
            >
              <Save size={16} />
              {isLoading ? '保存中...' : 
               saveStatus === 'success' ? '保存成功' :
               saveStatus === 'error' ? '保存失败' : '保存设置'}
            </button>
            
            {saveStatus === 'success' && (
              <span className="save-message success">设置已保存</span>
            )}
            {saveStatus === 'error' && (
              <span className="save-message error">保存失败，请重试</span>
            )}
          </div>
        </div>

        {/* 数据操作 */}
        <div className="actions-section">
          <div className="section-header">
            <Database size={20} />
            <h2>数据操作</h2>
          </div>
          
          <div className="actions-grid">
            <div className="action-card">
              <div className="action-info">
                <h3>立即清理</h3>
                <p>清理过期的对话记录，释放存储空间</p>
              </div>
              <button 
                className="action-btn cleanup"
                onClick={handleImmediateCleanup}
                disabled={isLoading}
              >
                <Trash2 size={16} />
                开始清理
              </button>
            </div>

            <div className="action-card">
              <div className="action-info">
                <h3>导出数据</h3>
                <p>导出所有对话记录到本地文件</p>
              </div>
              <button 
                className="action-btn export"
                onClick={handleExportData}
                disabled={isLoading}
              >
                <Download size={16} />
                导出数据
              </button>
            </div>

            <div className="action-card danger">
              <div className="action-info">
                <h3>删除所有数据</h3>
                <p>永久删除所有非保护的对话记录</p>
              </div>
              <button 
                className="action-btn delete"
                onClick={handleDeleteAllData}
                disabled={isLoading}
              >
                <AlertTriangle size={16} />
                删除全部
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 确认对话框 */}
      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <div className="confirm-header">
              <AlertTriangle size={24} className="warning-icon" />
              <h3>确认操作</h3>
            </div>
            <div className="confirm-content">
              {confirmAction === 'cleanup' && (
                <p>确定要清理过期的对话记录吗？此操作不可撤销。</p>
              )}
              {confirmAction === 'deleteAll' && (
                <p>确定要删除所有非保护的对话记录吗？此操作不可撤销！</p>
              )}
            </div>
            <div className="confirm-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowConfirm(false)}
              >
                取消
              </button>
              <button 
                className={confirmAction === 'deleteAll' ? 'btn-danger' : 'btn-primary'}
                onClick={confirmOperation}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagement; 