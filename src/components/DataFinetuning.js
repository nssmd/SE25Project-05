import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  Brain, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Download,
  Cpu,
  Cloud,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import './DataFinetuning.css';

const DataFinetuning = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [trainingConfig, setTrainingConfig] = useState({
    modelType: 'text-generation',
    epochs: 10,
    learningRate: 0.001,
    batchSize: 16,
    modelName: '',
    description: ''
  });
  const [trainingJobs, setTrainingJobs] = useState([
    {
      id: 1,
      name: '客服对话模型',
      status: 'completed',
      progress: 100,
      startTime: '2024-01-15 10:30',
      duration: '2h 15m',
      modelType: 'text-generation'
    },
    {
      id: 2,
      name: '图像分类模型',
      status: 'training',
      progress: 65,
      startTime: '2024-01-16 14:20',
      duration: '1h 22m',
      modelType: 'image-classification'
    },
    {
      id: 3,
      name: '文本分类模型',
      status: 'failed',
      progress: 30,
      startTime: '2024-01-16 09:15',
      duration: '45m',
      modelType: 'text-classification'
    }
  ]);

  const modelTypes = [
    { id: 'text-generation', name: '文本生成', description: '适用于对话、文章生成等任务' },
    { id: 'text-classification', name: '文本分类', description: '适用于情感分析、内容分类等任务' },
    { id: 'image-classification', name: '图像分类', description: '适用于图像识别、物体检测等任务' },
    { id: 'image-generation', name: '图像生成', description: '适用于图像生成、风格转换等任务' }
  ];

  const steps = [
    { id: 1, title: '数据上传', description: '上传训练数据文件' },
    { id: 2, title: '模型配置', description: '设置训练参数' },
    { id: 3, title: '开始训练', description: '提交训练任务' },
    { id: 4, title: '训练管理', description: '监控训练进度' }
  ];

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      setUploadedFile(file);
      setActiveStep(2);
    } else {
      alert('请上传JSON格式的文件');
    }
  };

  const handleConfigChange = (key, value) => {
    setTrainingConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const validateConfig = () => {
    return trainingConfig.modelName && 
           trainingConfig.description && 
           trainingConfig.epochs > 0 && 
           trainingConfig.learningRate > 0 && 
           trainingConfig.batchSize > 0;
  };

  const startTraining = () => {
    if (!validateConfig()) {
      alert('请填写完整的配置信息');
      return;
    }

    const newJob = {
      id: Date.now(),
      name: trainingConfig.modelName,
      status: 'training',
      progress: 0,
      startTime: new Date().toLocaleString(),
      duration: '0m',
      modelType: trainingConfig.modelType
    };

    setTrainingJobs(prev => [newJob, ...prev]);
    setActiveStep(4);
    
    // 模拟训练进度
    const progressInterval = setInterval(() => {
      setTrainingJobs(prev => 
        prev.map(job => 
          job.id === newJob.id ? 
          { ...job, progress: Math.min(job.progress + 5, 100) } : 
          job
        )
      );
    }, 1000);

    setTimeout(() => {
      clearInterval(progressInterval);
      setTrainingJobs(prev => 
        prev.map(job => 
          job.id === newJob.id ? 
          { ...job, status: 'completed', progress: 100 } : 
          job
        )
      );
    }, 20000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="status-icon success" />;
      case 'training':
        return <Clock className="status-icon training" />;
      case 'failed':
        return <AlertCircle className="status-icon error" />;
      default:
        return <Clock className="status-icon" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'training':
        return '训练中';
      case 'failed':
        return '失败';
      default:
        return '未知';
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="step-content">
            <div className="upload-area">
              <div className="upload-zone" onClick={() => document.getElementById('file-input').click()}>
                <Upload size={48} />
                <h3>点击上传训练数据</h3>
                <p>支持JSON格式文件，最大100MB</p>
                <div className="file-format-info">
                  <h4>数据格式示例：</h4>
                  <pre>{`{
  "data": [
    {
      "input": "用户问题或输入",
      "output": "期望的回答或输出"
    },
    {
      "input": "另一个问题",
      "output": "对应的回答"
    }
  ]
}`}</pre>
                </div>
                <input
                  id="file-input"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>
              {uploadedFile && (
                <div className="file-info">
                  <FileText size={20} />
                  <span>{uploadedFile.name}</span>
                  <span className="file-size">({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="config-form">
              <div className="form-section">
                <h3>基本信息</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>模型名称</label>
                    <input
                      type="text"
                      value={trainingConfig.modelName}
                      onChange={(e) => handleConfigChange('modelName', e.target.value)}
                      placeholder="输入模型名称"
                    />
                  </div>
                  <div className="form-group">
                    <label>模型描述</label>
                    <textarea
                      value={trainingConfig.description}
                      onChange={(e) => handleConfigChange('description', e.target.value)}
                      placeholder="描述模型的用途和特点"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>模型类型</h3>
                <div className="model-type-grid">
                  {modelTypes.map(type => (
                    <div
                      key={type.id}
                      className={`model-type-card ${trainingConfig.modelType === type.id ? 'selected' : ''}`}
                      onClick={() => handleConfigChange('modelType', type.id)}
                    >
                      <h4>{type.name}</h4>
                      <p>{type.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <h3>训练参数</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>训练轮次 (Epochs)</label>
                    <input
                      type="number"
                      value={trainingConfig.epochs}
                      onChange={(e) => handleConfigChange('epochs', parseInt(e.target.value))}
                      min="1"
                      max="100"
                    />
                  </div>
                  <div className="form-group">
                    <label>学习率 (Learning Rate)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={trainingConfig.learningRate}
                      onChange={(e) => handleConfigChange('learningRate', parseFloat(e.target.value))}
                      min="0.0001"
                      max="0.1"
                    />
                  </div>
                  <div className="form-group">
                    <label>批次大小 (Batch Size)</label>
                    <input
                      type="number"
                      value={trainingConfig.batchSize}
                      onChange={(e) => handleConfigChange('batchSize', parseInt(e.target.value))}
                      min="1"
                      max="128"
                    />
                  </div>
                </div>
              </div>

              <div className="step-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setActiveStep(1)}
                >
                  上一步
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => setActiveStep(3)}
                  disabled={!validateConfig()}
                >
                  下一步
                </button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <div className="training-summary">
              <h3>训练配置确认</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <label>数据文件</label>
                  <span>{uploadedFile?.name}</span>
                </div>
                <div className="summary-item">
                  <label>模型名称</label>
                  <span>{trainingConfig.modelName}</span>
                </div>
                <div className="summary-item">
                  <label>模型类型</label>
                  <span>{modelTypes.find(t => t.id === trainingConfig.modelType)?.name}</span>
                </div>
                <div className="summary-item">
                  <label>训练轮次</label>
                  <span>{trainingConfig.epochs}</span>
                </div>
                <div className="summary-item">
                  <label>学习率</label>
                  <span>{trainingConfig.learningRate}</span>
                </div>
                <div className="summary-item">
                  <label>批次大小</label>
                  <span>{trainingConfig.batchSize}</span>
                </div>
              </div>
              
              <div className="training-info">
                <div className="info-card">
                  <Cpu size={24} />
                  <div>
                    <h4>计算资源</h4>
                    <p>将在云服务器上使用GPU进行训练</p>
                  </div>
                </div>
                <div className="info-card">
                  <Clock size={24} />
                  <div>
                    <h4>预估时间</h4>
                    <p>约 {Math.ceil(trainingConfig.epochs * 0.5)} - {Math.ceil(trainingConfig.epochs * 1)} 小时</p>
                  </div>
                </div>
              </div>

              <div className="step-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setActiveStep(2)}
                >
                  返回修改
                </button>
                <button 
                  className="btn-primary"
                  onClick={startTraining}
                >
                  <Play size={20} />
                  开始训练
                </button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <div className="training-management">
              <div className="management-header">
                <h3>训练任务管理</h3>
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setActiveStep(1);
                    setUploadedFile(null);
                    setTrainingConfig({
                      modelType: 'text-generation',
                      epochs: 10,
                      learningRate: 0.001,
                      batchSize: 16,
                      modelName: '',
                      description: ''
                    });
                  }}
                >
                  新建训练
                </button>
              </div>

              <div className="training-jobs">
                {trainingJobs.map(job => (
                  <div key={job.id} className="job-card">
                    <div className="job-header">
                      <div className="job-info">
                        {getStatusIcon(job.status)}
                        <div>
                          <h4>{job.name}</h4>
                          <span className="job-type">
                            {modelTypes.find(t => t.id === job.modelType)?.name}
                          </span>
                        </div>
                      </div>
                      <div className="job-status">
                        <span className={`status-badge ${job.status}`}>
                          {getStatusText(job.status)}
                        </span>
                      </div>
                    </div>

                    <div className="job-progress">
                      <div className="progress-info">
                        <span>进度: {job.progress}%</span>
                        <span>耗时: {job.duration}</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="job-meta">
                      <span>开始时间: {job.startTime}</span>
                    </div>

                    <div className="job-actions">
                      {job.status === 'completed' && (
                        <button className="btn-success">
                          <Download size={16} />
                          下载模型
                        </button>
                      )}
                      {job.status === 'training' && (
                        <button className="btn-warning">
                          <Pause size={16} />
                          暂停训练
                        </button>
                      )}
                      {job.status === 'failed' && (
                        <button className="btn-secondary">
                          <RotateCcw size={16} />
                          重新训练
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="finetuning-page">
      <header className="page-header">
        <button 
          className="back-button"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={20} />
          返回主界面
        </button>
        <div className="header-content">
          <h1>数据微调</h1>
          <p>上传您的数据，训练专属的AI模型</p>
        </div>
        <div className="user-info">
          <span>{user?.name}</span>
          <button onClick={onLogout} className="logout-btn">退出</button>
        </div>
      </header>

      <div className="finetuning-content">
        <div className="steps-nav">
          {steps.map(step => (
            <div 
              key={step.id}
              className={`step-item ${activeStep >= step.id ? 'active' : ''} ${activeStep === step.id ? 'current' : ''}`}
            >
              <div className="step-number">{step.id}</div>
              <div className="step-info">
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="main-content">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default DataFinetuning; 