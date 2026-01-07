import request from './index'

// 获取用户推荐商品
export const getUserRecommendations = (userId) => {
  return request({
    url: `/api/recommendations/${userId}`,
    method: 'get'
  })
}

// 获取实时推荐商品
export const getRealtimeRecommendations = (userId) => {
  return request({
    url: `/api/recommendations/${userId}/realtime`,
    method: 'get'
  })
}
