import request from './index'

/**
 * 获取所有商品列表（分页）
 * @param {number} page - 页码，默认0
 * @param {number} size - 每页大小，默认20
 * @param {string} sort - 排序字段，默认productId
 * @returns {Promise} API响应
 */
export const getAllProducts = (page = 0, size = 20, sort = 'productId') => {
  return request({
    url: '/api/products',
    method: 'get',
    params: {
      page,
      size,
      sort
    }
  })
}

/**
 * 根据ID获取商品详情
 * @param {string} productId - 商品ID
 * @returns {Promise} API响应
 */
export const getProductById = (productId) => {
  return request({
    url: `/api/products/${productId}`,
    method: 'get'
  })
}

/**
 * 搜索商品
 * @param {string} keyword - 搜索关键词
 * @param {number} page - 页码，默认0
 * @param {number} size - 每页大小，默认20
 * @returns {Promise} API响应
 */
export const searchProducts = (keyword, page = 0, size = 20) => {
  return request({
    url: '/api/products/search',
    method: 'get',
    params: {
      keyword,
      page,
      size
    }
  })
}
