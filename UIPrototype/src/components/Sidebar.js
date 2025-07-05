import {
    Brain,
    Cpu,
    Crown,
    Database,
    LogOut,
    Mail,
    Search,
    User,
} from "lucide-react";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Sidebar.css";

import features from "../data/features";

const Sidebar = ({ user, onLogout, showSidebar }) => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <aside className={`sidebar ${showSidebar ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                <div className="logo">
                    <Brain className="logo-icon" />
                    <span>AI平台</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <h3>AI功能</h3>
                    {features.map(feature => (
                        <button
                            key={feature.id}
                            className={`nav-item ${location.pathname.startsWith(`/dashboard/${feature.id}`) ? 'active' : ''}`}
                            onClick={() =>  navigate(`/dashboard/${feature.id}`)}
                        >
                            <feature.icon className="nav-icon" />
                            <span>{feature.name}</span>
                        </button>
                    ))}
                </div>

                <div className="nav-section">
                    <h3>工具</h3>
                    <button
                        key="finetuning"
                        className={`nav-item ${location.pathname.startsWith('/finetuning') ? 'active' : ''}`}
                        onClick={() => navigate('/finetuning')}
                    >
                        <Cpu className="nav-icon" />
                        <span>数据微调</span>
                    </button>
                    <button
                        key="history"
                        className={`nav-item ${location.pathname.startsWith('/history') ? 'active' : ''}`}
                        onClick={() => navigate('/history')}
                    >
                        <Search className="nav-icon" />
                        <span>历史搜索</span>
                    </button>
                    <button
                        key="data-management"
                        className={`nav-item ${location.pathname.startsWith('/data-management') ? 'active' : ''}`}
                        onClick={() => navigate('/data-management')}
                    >
                        <Database className="nav-icon" />
                        <span>数据管理</span>
                    </button>
                    <button
                        key="profile"
                        className={`nav-item ${location.pathname.startsWith('/profile') ? 'active' : ''}`}
                        onClick={() => navigate('/profile')}
                    >
                        <User className="nav-icon" />
                        <span>个人中心</span>
                    </button>
                    <button
                        key="messages"
                        className={`nav-item ${location.pathname.startsWith('/messages') ? 'active' : ''}`}
                        onClick={() => navigate('/messages')}
                    >
                        <Mail className="nav-icon" />
                        <span>消息中心</span>
                    </button>
                    {/* 管理员专用功能 */}
                    {user?.role === 'admin' && (
                        <button
                            key="admin"
                            className={`nav-item admin-only ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
                            onClick={() => navigate('/admin')}
                        >
                            <Crown className="nav-icon" />
                            <span>管理员面板</span>
                        </button>
                    )}
                </div>
            </nav>

            <div className="sidebar-footer">
                <button className="logout-button" onClick={onLogout}>
                    <LogOut className="nav-icon" />
                    <span>退出登录</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;