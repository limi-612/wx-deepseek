require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS配置
app.use(cors({
  origin: ['http://localhost', 'https://servicewechat.com'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// DeepSeek API配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

// 输入验证中间件
const validateChatRequest = (req, res, next) => {
  const { messages } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({
      success: false,
      error: '消息格式错误'
    });
  }
  
  if (messages.length === 0) {
    return res.status(400).json({
      success: false,
      error: '消息不能为空'
    });
  }
  
  next();
};

// 聊天接口
app.post('/api/chat', validateChatRequest, async (req, res) => {
  try {
    const { messages } = req.body;
    
    // 验证API密钥
    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'your-api-key-here') {
      throw new Error('API密钥未配置');
    }
    
    // 设置SSE响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    const response = await axios.post(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      model: 'deepseek-chat',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
      stream: true,
    }, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream',
      timeout: 30000
    });

    let fullContent = '';
    
    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          if (data === '[DONE]') {
            res.write(`data: ${JSON.stringify({ type: 'done', content: fullContent })}\n\n`);
            res.end();
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content) {
              fullContent += content;
              res.write(`data: ${JSON.stringify({ type: 'content', content: content })}\n\n`);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    });
    
    response.data.on('end', () => {
      res.write(`data: ${JSON.stringify({ type: 'done', content: fullContent })}\n\n`);
      res.end();
    });
    
    response.data.on('error', (error) => {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    });
  } catch (error) {
    console.error('DeepSeek API错误:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      code: error.code
    });
    
    // 详细错误处理
    let errorMessage = '请求失败';
    let statusCode = 500;
    
    if (error.response) {
      statusCode = error.response.status;
      const responseData = error.response.data;
      
      if (error.response.status === 401) {
        errorMessage = 'API密钥无效';
      } else if (error.response.status === 429) {
        errorMessage = '请求过于频繁，请稍后再试';
      } else if (error.response.status === 400) {
        errorMessage = responseData?.error?.message || '请求参数错误';
      } else {
        errorMessage = responseData?.error?.message || `服务器错误: ${statusCode}`;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = '请求超时';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = '网络连接失败';
    } else if (error.message.includes('API响应格式错误')) {
      errorMessage = 'API响应格式错误';
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});