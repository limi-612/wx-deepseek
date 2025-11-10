const axios = require('axios');

// 测试流式API
async function testStreamAPI() {
  try {
    console.log('测试流式API...');
    
    const response = await axios.post('http://localhost:3000/api/chat', {
      messages: [
        { role: 'user', content: '你好，请简单介绍一下自己' }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      timeout: 30000
    });
    
    console.log('响应状态:', response.status);
    console.log('响应数据:', response.data);
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

// 测试健康检查
async function testHealth() {
  try {
    console.log('测试健康检查...');
    
    const response = await axios.get('http://localhost:3000/api/health');
    console.log('健康检查结果:', response.data);
    
  } catch (error) {
    console.error('健康检查失败:', error.message);
  }
}

// 运行测试
async function runTests() {
  await testHealth();
  await testStreamAPI();
}

runTests();