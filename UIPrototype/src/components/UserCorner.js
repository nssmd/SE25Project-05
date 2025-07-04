import React from "react";
import './UserCorner.css';

const UserCorner = ({ user, onLogout }) => {
    return (
        <div className="user-info">
            <div className="user-avatar">
                {(user?.username || user?.name)?.charAt(0) || 'U'}
            </div>
            <span>{user?.username || user?.name}</span>
            <button onClick={onLogout} className="logout-btn">退出</button>
        </div>
    );
}

export default UserCorner;