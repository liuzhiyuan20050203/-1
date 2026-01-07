import request from './index'

export const register = (data) => {
  const { username, email, password } = data
  return request({
    url: '/api/auth/register',
    method: 'post',
    data: {
      username,
      email,
      password
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }).catch(error => {
    if (error.response) {
      const errorMsg = error.response.data.message || 
                      (typeof error.response.data === 'string' ? error.response.data : '注册失败')
      throw new Error(errorMsg)
    } else {
      throw new Error('网络错误，请稍后再试')
    }
  })
}

export const login = (data) => {
  return request({
    url: '/api/auth/login',
    method: 'post',
    data: {
      username: data.username,
      password: data.password
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }).then(response => {
    if (!response.data || !response.data.token || !response.data.username) {
      throw new Error('无效的响应格式')
    }
    return {
      token: response.data.token,
      user: {
        id: response.data.id, // 添加用户ID
        username: response.data.username,
        role: response.data.role
      }
    }
  }).catch(error => {
    if (error.response) {
      // 处理HTTP错误响应
      const errorMsg = error.response.data?.message || 
                      (typeof error.response.data === 'string' ? error.response.data : '登录失败')
      throw new Error(errorMsg)
    } else if (error.request) {
      // 请求已发出但没有收到响应
      throw new Error('网络错误，请检查网络连接')
    } else {
      // 其他错误（如无效响应格式）
      throw new Error(error.message || '登录失败')
    }
  })
}

export const getProfile = (userId) => {
  return request({
    url: `/api/auth/profile/${userId}`,
    method: 'get'
  }).then(response => {
    if (!response.data || !response.data.id) {
      throw new Error('无效的响应格式')
    }
    return response.data
  }).catch(error => {
    if (error.response) {
      const errorMsg = error.response.data?.message || 
                      (typeof error.response.data === 'string' ? error.response.data : '获取用户信息失败')
      throw new Error(errorMsg)
    } else if (error.request) {
      throw new Error('网络错误，请检查网络连接')
    } else {
      throw new Error(error.message || '获取用户信息失败')
    }
  })
}

export const updateProfile = (userId, updateData) => {
  return request({
    url: '/api/auth/profile',
    method: 'put',
    data: {
      id: userId,
      ...updateData
    }
  }).then(response => {
    if (!response.data || !response.data.id) {
      throw new Error('无效的响应格式')
    }
    return response.data
  }).catch(error => {
    if (error.response) {
      const errorMsg = error.response.data?.message || 
                      (typeof error.response.data === 'string' ? error.response.data : '更新用户信息失败')
      throw new Error(errorMsg)
    } else if (error.request) {
      throw new Error('网络错误，请检查网络连接')
    } else {
      throw new Error(error.message || '更新用户信息失败')
    }
  })
}

export const logout = () => {
  return Promise.resolve()
}
