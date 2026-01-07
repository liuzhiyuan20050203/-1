import request from './index'

export const getAllUsers = () => {
  return request({
    url: '/api/admin/users',
    method: 'get'
  })
}

export const createUser = (data) => {
  return request({
    url: '/api/admin/users',
    method: 'post',
    data
  })
}

export const deleteUser = (id) => {
  return request({
    url: `/api/admin/users/${id}`,
    method: 'delete'
  })
}
