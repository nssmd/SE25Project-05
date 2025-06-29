import { chatAPI, historyAPI } from './api';

class ChatService {
  constructor() {
    this.currentChat = null;
    this.messages = [];
    this.isLoading = false;
  }

  // 创建新对话
  async createChat(chatData) {
    try {
      const errors = this.validateChatData(chatData);
      if (errors.length > 0) {
        throw new Error(errors[0]);
      }

      this.isLoading = true;
      const response = await chatAPI.create(chatData);
      this.currentChat = response.chat;
      
      return response;
    } catch (error) {
      console.error('创建对话失败:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  // 发送消息
  async sendMessage(messageData) {
    try {
      if (!this.currentChat) {
        throw new Error('请先创建对话');
      }

      const errors = this.validateMessageData(messageData);
      if (errors.length > 0) {
        throw new Error(errors[0]);
      }

      this.isLoading = true;
      const response = await chatAPI.sendMessage(this.currentChat.id, messageData);
      
      if (response.message) {
        this.messages.push(response.message);
      }
      
      return response;
    } catch (error) {
      console.error('发送消息失败:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  // 验证对话数据
  validateChatData(data) {
    const errors = [];
    
    if (!data.title || data.title.trim().length === 0) {
      errors.push('对话标题不能为空');
    }
    
    if (data.title.length > 100) {
      errors.push('对话标题不能超过100个字符');
    }
    
    const validTypes = ['text', 'image', 'video', '3d'];
    if (!validTypes.includes(data.type)) {
      errors.push('无效的对话类型');
    }
    
    return errors;
  }

  // 验证消息数据
  validateMessageData(data) {
    const errors = [];
    
    if (!data.content || data.content.trim().length === 0) {
      errors.push('消息内容不能为空');
    }
    
    if (data.content.length > 10000) {
      errors.push('消息内容不能超过10000个字符');
    }
    
    return errors;
  }
}

const chatService = new ChatService();
export default chatService; 