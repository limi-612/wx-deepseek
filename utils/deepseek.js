// DeepSeek API调用工具
const API_BASE_URL = 'http://localhost:3000/api'; // 后端服务地址

/**
 * 检查服务器健康状态
 * @returns {Promise} 健康检查结果
 */
function checkServerHealth() {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}/health`,
      method: 'GET',
      timeout: 5000,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error('服务器不可用'));
        }
      },
      fail: (error) => {
        reject(new Error('无法连接到服务器'));
      }
    });
  });
}

/**
 * 调用DeepSeek聊天API（流式响应）
 * @param {Array} messages 消息数组
 * @param {Function} onMessage 消息回调函数
 * @param {Function} onComplete 完成回调函数
 * @param {Function} onError 错误回调函数
 */
function callDeepSeekChatStream(messages, onMessage, onComplete, onError) {
  // 输入验证
  if (!messages || !Array.isArray(messages)) {
    onError(new Error('消息格式错误'));
    return;
  }
  
  if (messages.length === 0) {
    onError(new Error('消息不能为空'));
    return;
  }
  
  // 使用wx.request模拟SSE
  wx.request({
    url: `${API_BASE_URL}/chat`,
    method: 'POST',
    data: {
      messages: messages
    },
    header: {
      'content-type': 'application/json',
      'Accept': 'text/event-stream'
    },
    timeout: 60000,
    success: (res) => {
      if (res.statusCode !== 200) {
        onError(new Error(`服务器错误: ${res.statusCode}`));
        return;
      }
      
      // 处理流式响应数据
      const responseText = res.data;
      if (typeof responseText === 'string') {
        const lines = responseText.split('\n');
        let fullContent = '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'content') {
                fullContent += data.content;
                onMessage(data.content, fullContent);
              } else if (data.type === 'done') {
                onComplete(fullContent);
                return;
              } else if (data.type === 'error') {
                onError(new Error(data.error));
                return;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
        
        // 如果没有正常结束，就直接返回全部内容
        if (fullContent) {
          onComplete(fullContent);
        }
      } else {
        onError(new Error('响应格式错误'));
      }
    },
    fail: (error) => {
      console.error('请求失败:', error);
      
      let errorMessage = '网络请求失败';
      
      if (error.errMsg) {
        if (error.errMsg.includes('timeout')) {
          errorMessage = '请求超时，请检查网络连接';
        } else if (error.errMsg.includes('fail')) {
          errorMessage = '网络连接失败，请检查服务器状态';
        }
      }
      
      onError(new Error(errorMessage));
    }
  });
}

/**
 * 调用DeepSeek聊天API（非流式，兼容旧版本）
 * @param {Array} messages 消息数组
 * @returns {Promise} API响应
 */
function callDeepSeekChat(messages) {
  return new Promise((resolve, reject) => {
    callDeepSeekChatStream(
      messages,
      (chunk, fullContent) => {
        // 流式模式下不做处理
      },
      (fullContent) => {
        resolve(fullContent);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

module.exports = {
  callDeepSeekChat,
  callDeepSeekChatStream,
  checkServerHealth
};