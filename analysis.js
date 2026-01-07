import request from './index'

export const getBehaviorStats = () => {
  return request({
    url: '/api/analysis/behavior-stats',
    method: 'get'
  })
}

export const getTopProducts = () => {
  return request({
    url: '/api/analysis/top-products',
    method: 'get'
  })
}

export const getTopUsers = () => {
  return request({
    url: '/api/analysis/top-users',
    method: 'get'
  })
}

export const getDailySales = () => {
  return request({
    url: '/api/analysis/daily-sales',
    method: 'get'
  })
}

export const getAnalysisSummary = () => {
  return request({
    url: '/api/analysis/summary',
    method: 'get'
  })
}

export const triggerSparkJob = () => {
  return request({
    url: '/api/admin/analysis/trigger',
    method: 'post',
    timeout: 60000
  })
}

export const triggerSparkJobWithDays = (days) => {
  return request({
    url: `/api/admin/analysis/oldTrigger/${days}`,
    method: 'post',
    timeout: 60000
  })
}

export const getRealTimeStats = () => {
  return request({
    url: '/api/analysis/real-time/stats',
    method: 'get'
  })
}

export const getRealTimeBehaviorAnalysis = () => {
  return request({
    url: '/api/analysis/real-time/behavior',
    method: 'get'
  })
}

export const getRealTimeTopProducts = () => {
  return request({
    url: '/api/analysis/real-time/top-products',
    method: 'get'
  })
}