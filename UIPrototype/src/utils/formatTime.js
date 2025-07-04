// 格式化时间
const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 1) {
        return '刚刚';
    } else if (diffHours < 24) {
        return `${Math.floor(diffHours)}小时前`;
    } else if (diffDays < 7) {
        return `${Math.floor(diffDays)}天前`;
    } else {
        return date.toLocaleDateString();
    }
};

export default formatTime;