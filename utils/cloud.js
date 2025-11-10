// 云开发工具函数
const callCloudFunction = async (name, data) => {
  try {
    console.log('调用云函数:', name, data)
    const result = await wx.cloud.callFunction({
      name: name,
      data: data
    })
    console.log('云函数返回:', result)
    return result.result
  } catch (error) {
    console.error('云函数调用失败:', error)
    throw new Error(`云函数调用失败: ${error.errMsg || error.message}`)
  }
}

// 调用DeepSeek聊天API
const chatWithDeepSeek = async (messages) => {
  return await callCloudFunction('chat', { messages })
}

module.exports = {
  callCloudFunction,
  chatWithDeepSeek
}