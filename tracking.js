import request from './index'

/**
 * 上报用户行为数据
 * @param {Object} data - 用户行为数据
 * @param {string} data.eventType - 事件类型：pv(点击)、buy(购买)、fav(收藏)、cart(加购)
 * @param {string} data.productId - 商品ID
 * @param {string} data.productName - 商品名称
 * @param {string|null} data.userId - 用户ID（用户未登录时为null）
 * @param {number} data.timestamp - 时间戳
 * @param {Object} data.extraData - 额外数据
 * @returns {Promise}
 */
export const reportUserBehavior = (data) => {
  return request({
    url: '/api/tracking/behavior',
    method: 'post',
    data: data,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }).catch(error => {
    if (error.response) {
      console.error('上报用户行为数据失败:', error.response.data)
      throw new Error(error.response.data.message || '上报用户行为数据失败')
    } else {
      console.error('网络错误，无法上报用户行为数据:', error)
      throw new Error('网络错误，请稍后再试')
    }
  })
}

/**
 * 批量上报用户行为数据
 * @param {Array} behaviors - 用户行为数据数组
 * @returns {Promise}
 */
export const batchReportUserBehavior = (behaviors) => {
  return request({
    url: '/api/tracking/behavior/batch',
    method: 'post',
    data: { behaviors },
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }).catch(error => {
    if (error.response) {
      console.error('批量上报用户行为数据失败:', error.response.data)
      throw new Error(error.response.data.message || '批量上报用户行为数据失败')
    } else {
      console.error('网络错误，无法批量上报用户行为数据:', error)
      throw new Error('网络错误，请稍后再试')
    }
  })
}
