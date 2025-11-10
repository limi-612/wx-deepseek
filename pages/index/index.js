// const { chatWithDeepSeek } = require('../../utils/cloud.js')
const { callDeepSeekChat } = require('../../utils/deepseek.js')
import Toast from '@vant/weapp/toast/toast'

Page({
  data: {
    inputValue: '',
    messages: [],
    loading: false
  },

  onInputChange(e) {
    this.setData({
      inputValue: e.detail
    })
  },

  onLoad() {
    // 页面加载完成
  },

  async sendMessage() {
    const message = this.data.inputValue.trim()
    if (!message) {
      Toast.fail('请输入消息')
      return
    }

    const userMessage = { role: 'user', content: message }
    const updatedMessages = [...this.data.messages, userMessage]
    
    this.setData({
      messages: updatedMessages,
      inputValue: '',
      loading: true
    })

    try {
      const result = await callDeepSeekChat(updatedMessages)
      
      const aiMessage = { role: 'assistant', content: result }
      this.setData({
        messages: [...updatedMessages, aiMessage],
        loading: false
      })
    } catch (error) {
      console.error('发送消息错误:', error)
      this.setData({
        messages: updatedMessages,
        loading: false
      })
      Toast.fail(error.message || '发送失败')
    }
  }
})