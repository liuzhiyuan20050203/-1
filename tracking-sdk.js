import { reportUserBehavior, batchReportUserBehavior } from '../api/tracking'
import { useAuthStore } from '../stores/auth'

class TrackingSDK {
  constructor() {
    this.queue = [] // 数据上报队列
    this.maxQueueSize = 50 // 最大队列大小
    this.reportInterval = 5000 // 批量上报间隔（5秒）
    this.isReporting = false // 是否正在上报
    this.authStore = useAuthStore()
    this.init()
  }

  /**
   * 初始化SDK
   */
  init() {
    // 启动定时批量上报
    setInterval(() => {
      this.flushQueue()
    }, this.reportInterval)
  }

  /**
   * 监听元素事件
   * @param {HTMLElement} element - 要监听的元素
   * @param {string} eventType - 事件类型
   * @param {Object} productData - 商品数据
   * @param {Function} callback - 回调函数
   */
  trackEvent(element, eventType, productData, callback = null) {
    if (!element || !eventType) {
      console.warn('TrackingSDK: 缺少必要的参数')
      return
    }

    const handler = (event) => {
      // 获取用户ID（如果用户已登录）
      const userId = this.authStore.user?.id || null
      
      const trackingData = {
        eventType,
        productId: productData.id || '',
        productName: productData.name || '',
        productPrice: productData.price || 0,
        productCategory: productData.category || '',
        categoryId: productData.categoryId || '',
        userId, // 添加用户ID
        timestamp: Date.now(),
        extraData: {
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          eventTarget: event.target?.tagName || '',
          eventPosition: {
            x: event.clientX,
            y: event.clientY
          }
        }
      }

      // 添加到上报队列
      this.addToQueue(trackingData)

      // 执行回调函数
      if (callback && typeof callback === 'function') {
        callback(event, trackingData)
      }

      console.log(`TrackingSDK: ${eventType}事件已记录`, trackingData)
    }

    element.addEventListener('click', handler)
    
    // 返回移除监听器的方法
    return () => {
      element.removeEventListener('click', handler)
    }
  }

  /**
   * 添加数据到上报队列
   * @param {Object} data - 用户行为数据
   */
  addToQueue(data) {
    this.queue.push(data)
    
    // 如果队列达到最大大小，立即上报
    if (this.queue.length >= this.maxQueueSize) {
      this.flushQueue()
    }
  }

  /**
   * 批量上报队列中的数据
   */
  async flushQueue() {
    if (this.isReporting || this.queue.length === 0) {
      return
    }

    this.isReporting = true
    const behaviors = [...this.queue]
    this.queue = [] // 清空队列

    try {
      if (behaviors.length === 1) {
        await reportUserBehavior(behaviors[0])
      } else {
        await batchReportUserBehavior(behaviors)
      }
      console.log(`TrackingSDK: 成功上报${behaviors.length}条行为数据`)
    } catch (error) {
      console.error('TrackingSDK: 上报失败，将数据重新加入队列', error)
      // 上报失败，将数据重新加入队列
      this.queue.unshift(...behaviors)
    } finally {
      this.isReporting = false
    }
  }

  /**
   * 手动上报单个行为
   * @param {string} eventType - 事件类型
   * @param {Object} productData - 商品数据
   * @param {Object} extraData - 额外数据
   */
  async trackManual(eventType, productData, extraData = {}) {
    // 获取用户ID（如果用户已登录）
    const userId = this.authStore.user?.id || null
    
    const trackingData = {
      eventType,
      productId: productData.id || '',
      productName: productData.name || '',
      productPrice: productData.price || 0,
      productCategory: productData.category || '',
      categoryId: productData.categoryId || '',
      userId, // 添加用户ID
      timestamp: Date.now(),
      extraData: {
        ...extraData,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        manualTrack: true
      }
    }

    try {
      await reportUserBehavior(trackingData)
      console.log(`TrackingSDK: 手动上报${eventType}事件成功`, trackingData)
    } catch (error) {
      console.error('TrackingSDK: 手动上报失败', error)
      // 手动上报失败也加入队列
      this.addToQueue(trackingData)
    }
  }

  /**
   * 获取当前队列状态
   */
  getQueueStatus() {
    return {
      queueSize: this.queue.length,
      isReporting: this.isReporting,
      maxQueueSize: this.maxQueueSize
    }
  }

  /**
   * 清空队列
   */
  clearQueue() {
    this.queue = []
    console.log('TrackingSDK: 队列已清空')
  }
}

// 创建全局实例
const trackingSDK = new TrackingSDK()

export default trackingSDK

// 导出类以便需要时创建新实例
export { TrackingSDK }
