const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { messages } = event
  
  // 暂时硬编码API密钥（请替换为你的实际密钥）
  const DEEPSEEK_API_KEY = 'you-key'
  
  try {
    const response = await axios.post('https://api.deepseek.com/chat/completions', {
      model: 'deepseek-chat',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    return {
      success: true,
      data: response.data.choices[0].message.content
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}