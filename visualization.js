import request from './index'

export const getConsumptionTrend = () => {
  return request({
    url: '/api/visual/trend',
    method: 'get',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }).catch(error => {
    if (error.response) {
      throw new Error(error.response.data.message || '获取消费趋势数据失败')
    } else {
      throw new Error('网络错误，请稍后再试')
    }
  })
}

export const getProductHeat = () => {
  return request({
    url: '/api/visual/hot-products',
    method: 'get',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }).catch(error => {
    if (error.response) {
      throw new Error(error.response.data.message || '获取热门商品数据失败')
    } else {
      throw new Error('网络错误，请稍后再试')
    }
  })
}

export const getUserStatistics = () => {
  return request({
    url: '/api/visual/user-stats',
    method: 'get',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }).catch(error => {
    if (error.response) {
      throw new Error(error.response.data.message || '获取用户统计数据失败')
    } else {
      throw new Error('网络错误，请稍后再试')
    }
  })
}
