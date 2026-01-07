<template>
  <div class="bigdata-container">
    <!-- 分析模式切换 -->
    <div class="analysis-mode">
      <div class="mode-tabs">
        <button 
          :class="['tab-button', activeTab === 'real-time' ? 'active' : '']"
          @click="switchTab('real-time')"
        >
           实时分析
        </button>
        <button 
          :class="['tab-button', activeTab === 'historical' ? 'active' : '']"
          @click="switchTab('historical')"
        >
           宏观分析
        </button>
      </div>
    </div>

    <!-- 实时分析界面 -->
    <div v-if="activeTab === 'real-time'" class="real-time-analysis">
      <!-- 实时数据概览 -->
      <div class="real-time-stats" :class="{ 'updating': updateAnimation }">
        <div class="stat-item real-time">
          <div class="stat-value digital-font" :class="{ 'pulse': updateAnimation }">
            {{ realTimeStats.totalUsers || 0 }}
          </div>
          <div class="stat-label">今日用户数</div>
          <div class="real-time-indicator" :class="{ 'updating': updateAnimation }">
            {{ updateAnimation ? '更新中...' : '实时' }}
          </div>
        </div>
        <div class="stat-item real-time">
          <div class="stat-value digital-font" :class="{ 'pulse': updateAnimation }">
            {{ realTimeStats.totalSales || 0 }}
          </div>
          <div class="stat-label">今日销售额</div>
          <div class="real-time-indicator" :class="{ 'updating': updateAnimation }">
            {{ updateAnimation ? '更新中...' : '实时' }}
          </div>
        </div>
        <div class="stat-item real-time">
          <div class="stat-value digital-font" :class="{ 'pulse': updateAnimation }">
            {{ realTimeStats.totalProducts || 0 }}
          </div>
          <div class="stat-label">今日商品数</div>
          <div class="real-time-indicator" :class="{ 'updating': updateAnimation }">
            {{ updateAnimation ? '更新中...' : '实时' }}
          </div>
        </div>
        <div class="stat-item real-time">
          <div class="stat-value digital-font" :class="{ 'pulse': updateAnimation }">
            {{ lastUpdateTime }}
          </div>
          <div class="stat-label">最后更新</div>
          <div class="real-time-indicator" :class="{ 'updating': updateAnimation }">
            {{ updateAnimation ? '更新中...' : '实时' }}
          </div>
        </div>
      </div>

      <!-- 实时行为分析图表 -->
      <div class="layout-grid">
        <div class="data-card" :class="{ 'chart-updating': updateAnimation }">
          <div class="data-card-inner">
            <div class="data-card-title">
              实时行为分析
              <span v-if="updateAnimation" class="loading-dot">...</span>
            </div>
            <div ref="realTimeBehaviorChart" class="chart-container"></div>
          </div>
        </div>

        <!-- 实时商品排行 -->
        <div class="data-card" :class="{ 'chart-updating': updateAnimation }">
          <div class="data-card-inner">
            <div class="data-card-title">
              实时商品排行
              <span v-if="updateAnimation" class="loading-dot">...</span>
            </div>
            <div ref="realTimeTopProductsChart" class="chart-container"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史分析界面 -->
    <div v-if="activeTab === 'historical'" class="historical-analysis">
      <!-- 网格布局 -->
    <div class="layout-grid">
      <!-- 用户行为分析 -->
      <div class="data-card">
        <div class="data-card-inner">
          <div class="data-card-title">用户行为分析</div>
          <div ref="behaviorChart" class="chart-container"></div>
          <div class="data-table">
            <table>
              <thead>
                <tr>
                  <th>行为类型</th>
                  <th>数量</th>
                  <th>占比</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in behaviorStats" :key="item.name">
                  <td>{{ item.name }}</td>
                  <td>{{ item.value }}</td>
                  <td>{{ item.percentage }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 商品销售排行 -->
      <div class="data-card">
        <div class="data-card-inner">
          <div class="data-card-title">商品销售排行</div>
          <div ref="salesChart" class="chart-container"></div>
          <div class="data-table">
            <table>
              <thead>
                <tr>
                  <th>商品ID</th>
                  <th>销量</th>
                  <th>排名</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in topProducts" :key="item.productName">
                  <td>{{ item.productName }}</td>
                  <td>{{ item.saleCount }}</td>
                  <td>#{{ index + 1 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 每日销售趋势 -->
      <div class="data-card">
        <div class="data-card-inner">
          <div class="data-card-title">每日销售趋势</div>
          <div ref="dailyChart" class="chart-container"></div>
        </div>
      </div>

      <!-- 用户购买排行 -->
      <div class="data-card">
        <div class="data-card-inner">
          <div class="data-card-title">用户购买排行</div>
          <div ref="topUsersChart" class="chart-container"></div>
        </div>
      </div>

    </div>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, markRaw, computed } from 'vue'
import * as echarts from 'echarts'
import { 
  getBehaviorStats, 
  getTopProducts, 
  getDailySales,
  getTopUsers,
  getRealTimeStats,
  getRealTimeBehaviorAnalysis,
  getRealTimeTopProducts
} from '../api/analysis'
import '../assets/styles/bigdata.css'

// 选项卡状态
const activeTab = ref('historical')

// 历史分析相关变量
const behaviorChart = ref(null)
const salesChart = ref(null)
const dailyChart = ref(null)
const topUsersChart = ref(null)

const behaviorInstance = ref(null)
const salesInstance = ref(null)
const dailyInstance = ref(null)
const topUsersInstance = ref(null)

const chartData = ref({
  behavior: null,
  sales: null,
  daily: null,
  topUsers: null
})

// 实时分析相关变量
const realTimeBehaviorChart = ref(null)
const realTimeTopProductsChart = ref(null)

const realTimeBehaviorInstance = ref(null)
const realTimeTopProductsInstance = ref(null)

const realTimeStats = ref({
  totalUsers: 0,
  totalSales: 0,
  totalProducts: 0,
  timestamp: 0
})

const lastUpdateTime = ref('--:--:--')

// 定时器和状态相关变量
const refreshTimer = ref(null)
const isLoading = ref(false)
const updateAnimation = ref(false)

// 计算属性
const behaviorStats = computed(() => {
  if (!chartData.value.behavior?.data) return []
  const total = chartData.value.behavior.data.reduce((sum, item) => sum + (item.count || 0), 0)
  return chartData.value.behavior.data.map(item => {
    const behaviorMap = {
      'fav': '收藏',
      'pv': '点击',
      'buy': '购买',
      'cart': '加入购物车'
    }
    return {
      name: behaviorMap[item.behavior] || item.behavior,
      value: item.count,
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0'
    }
  })
})

const topProducts = computed(() => {
  if (!chartData.value.sales?.data) return []
  return chartData.value.sales.data
    .map(item => ({
      productName: item.product_id,
      saleCount: item.sale_count
    }))
    .sort((a, b) => b.saleCount - a.saleCount)
    .slice(0, 5)
})

// 选项卡切换
const switchTab = (tab) => {
  activeTab.value = tab
  if (tab === 'real-time') {
    // 切换到实时分析时加载实时数据并启动定时器
    loadRealTimeData()
    setTimeout(() => {
      initRealTimeCharts()
      // 启动实时刷新定时器
      startRealTimeRefresh()
    }, 100)
  } else {
    // 切换到历史分析时停止定时器并重新初始化图表
    stopRealTimeRefresh()
    setTimeout(() => {
      initBehaviorChart()
      initSalesChart()
      initDailyChart()
      initTopUsersChart()
      
      // 延迟再次检查以确保图表正确初始化
      setTimeout(() => {
        behaviorInstance.value?.resize()
        salesInstance.value?.resize()
        dailyInstance.value?.resize()
        topUsersInstance.value?.resize()
      }, 100)
    }, 100)
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '--:--:--'
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN')
}

// 加载实时数据
const loadRealTimeData = async () => {
  try {
    const [statsRes, behaviorRes, productsRes] = await Promise.all([
      getRealTimeStats().catch(() => ({ data: {} })),
      getRealTimeBehaviorAnalysis().catch(() => ({ data: {} })),
      getRealTimeTopProducts().catch(() => ({ data: [] }))
    ])
    
    // 更新实时统计信息
    if (statsRes.data) {
      realTimeStats.value = statsRes.data
      lastUpdateTime.value = formatTime(statsRes.data.timestamp)
    }
    
    // 更新实时行为分析数据
    if (behaviorRes.data) {
      realTimeBehaviorData.value = behaviorRes.data
    }
    
    // 更新实时商品排行数据
    if (productsRes.data) {
      realTimeProductsData.value = productsRes.data
    }
    
    return true
  } catch (error) {
    console.error('加载实时数据失败:', error)
    // 提供默认数据
    realTimeStats.value = {
      totalUsers: 0,
      totalSales: 0,
      totalProducts: 0,
      timestamp: Date.now()
    }
    lastUpdateTime.value = formatTime(Date.now())
    return false
  }
}

// 实时行为分析数据
const realTimeBehaviorData = ref({
  behaviorCounts: {},
  behaviorRatios: {},
  totalBehaviors: 0,
  timestamp: 0
})

// 实时商品排行数据
const realTimeProductsData = ref([])

// 加载数据
const loadData = async () => {
  try {
    const [behaviorRes, salesRes, dailyRes, topUsersRes] = await Promise.all([
      getBehaviorStats().catch(() => ({ data: [] })),
      getTopProducts().catch(() => ({ data: [] })),
      getDailySales().catch(() => ({ data: [] })),
      getTopUsers().catch(() => ({ data: [] }))
    ])
    
    // 提供默认数据以确保图表能够初始化
    const defaultBehaviorData = [
      { behavior: 'pv', count: 1000 },
      { behavior: 'fav', count: 300 },
      { behavior: 'cart', count: 200 },
      { behavior: 'buy', count: 150 }
    ]
    
    const defaultSalesData = [
      { product_id: 'P001', sale_count: 500 },
      { product_id: 'P002', sale_count: 450 },
      { product_id: 'P003', sale_count: 400 },
      { product_id: 'P004', sale_count: 350 },
      { product_id: 'P005', sale_count: 300 }
    ]
    
    const defaultDailyData = [
      { date: '2024-01-01', sale_count: 100 },
      { date: '2024-01-02', sale_count: 150 },
      { date: '2024-01-03', sale_count: 120 },
      { date: '2024-01-04', sale_count: 180 },
      { date: '2024-01-05', sale_count: 200 }
    ]
    
    const defaultTopUsersData = [
      { user_id: 'U001', buy_count: 50 },
      { user_id: 'U002', buy_count: 45 },
      { user_id: 'U003', buy_count: 40 },
      { user_id: 'U004', buy_count: 35 },
      { user_id: 'U005', buy_count: 30 }
    ]
    
    chartData.value.behavior = behaviorRes?.data?.length > 0 ? behaviorRes : { data: defaultBehaviorData }
    chartData.value.sales = salesRes?.data?.length > 0 ? salesRes : { data: defaultSalesData }
    chartData.value.daily = dailyRes?.data?.length > 0 ? dailyRes : { data: defaultDailyData }
    chartData.value.topUsers = topUsersRes?.data?.length > 0 ? topUsersRes : { data: defaultTopUsersData }
    
    return true
  } catch (error) {
    console.error('加载数据失败:', error)
    // 即使出错也提供默认数据
    chartData.value.behavior = { data: [
      { behavior: 'pv', count: 1000 },
      { behavior: 'fav', count: 300 },
      { behavior: 'cart', count: 200 },
      { behavior: 'buy', count: 150 }
    ]}
    chartData.value.sales = { data: [
      { product_id: 'P001', sale_count: 500 },
      { product_id: 'P002', sale_count: 450 },
      { product_id: 'P003', sale_count: 400 }
    ]}
    chartData.value.daily = { data: [
      { date: '2024-01-01', sale_count: 100 },
      { date: '2024-01-02', sale_count: 150 }
    ]}
    chartData.value.topUsers = { data: [
      { user_id: 'U001', buy_count: 50 },
      { user_id: 'U002', buy_count: 45 }
    ]}
    return true
  }
}

// 初始化图表
const initChart = async (chartRef, instanceRef, option) => {
  await nextTick()
  if (!chartRef.value) {
    console.warn('图表容器未找到')
    return
  }
  
  const isVisible = chartRef.value.offsetWidth > 0 && chartRef.value.offsetHeight > 0
  if (!isVisible) {
    console.warn('图表容器不可见，延迟初始化')
    setTimeout(() => initChart(chartRef, instanceRef, option), 100)
    return
  }

  try {
    // 如果实例已存在，先销毁
    if (instanceRef.value) {
      instanceRef.value.dispose()
      instanceRef.value = null
    }
    
    // 确保容器为空
    chartRef.value.innerHTML = ''
    
    // 创建新的图表实例
    instanceRef.value = markRaw(echarts.init(chartRef.value))
    
    // 应用深色主题样式
    const darkThemeOption = {
      backgroundColor: 'transparent',
      textStyle: {
        color: '#fff'
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#0174f5',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 12
        },
        ...option.tooltip
      },
      ...option
    }
    
    // 设置图表选项
    instanceRef.value.setOption(darkThemeOption, true)
    
    // 确保图表正确渲染
    setTimeout(() => {
      instanceRef.value?.resize()
    }, 50)
  } catch (error) {
    console.error('图表初始化失败:', error)
  }
}

// 初始化各图表
const initBehaviorChart = () => {
  try {
    if (typeof echarts === 'undefined') return
    if (!chartData.value.behavior || !chartData.value.behavior.data) return

    const validData = chartData.value.behavior.data
      .filter(item => item && item.behavior && item.count !== undefined)
      .map(item => {
        const behaviorMap = {
          'fav': '收藏',
          'pv': '点击',
          'buy': '购买',
          'cart': '加入购物车'
        }
        return {
          name: behaviorMap[item.behavior] || item.behavior,
          value: item.count
        }
      })

    if (validData.length === 0) return

    initChart(behaviorChart, behaviorInstance, {
      // title: {
      //   text: '用户行为分布',
      //   left: 'center',
      //   textStyle: {
      //     color: '#11f6e2',
      //     fontSize: 16
      //   }
      // },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderColor: '#0174f5',
      borderWidth: 2,
      textStyle: {
        color: '#fff',
        fontSize: 12,
        lineHeight: 16
      },
      padding: [6, 10],
      position: function(point, params, dom, rect, size) {
        // 用户建议的算法：计算鼠标点到四个边的距离，找到最远的位置
        const x = point[0]
        const y = point[1]
        const viewWidth = size.viewSize[0]
        const viewHeight = size.viewSize[1]
        const contentWidth = size.contentSize[0]
        const contentHeight = size.contentSize[1]
        
        // 计算到四个边的距离
        const distanceToLeft = x
        const distanceToRight = viewWidth - x
        const distanceToTop = y
        const distanceToBottom = viewHeight - y
        
        // 找到最大的距离方向
        const maxDistance = Math.max(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom)
        
        let finalX, finalY
        
        // 根据最大距离方向确定tooltip位置
        if (maxDistance === distanceToRight) {
          // 右边空间最大，放在右边
          finalX = x + 15
          finalY = y - contentHeight / 2
        } else if (maxDistance === distanceToLeft) {
          // 左边空间最大，放在左边
          finalX = x - contentWidth - 15
          finalY = y - contentHeight / 2
        } else if (maxDistance === distanceToBottom) {
          // 下边空间最大，放在下边
          finalX = x - contentWidth / 2
          finalY = y + 15
        } else {
          // 上边空间最大，放在上边
          finalX = x - contentWidth / 2
          finalY = y - contentHeight - 15
        }
        
        // 边界检查，确保tooltip在容器内
        if (finalX < 5) finalX = 5
        if (finalX + contentWidth > viewWidth) finalX = viewWidth - contentWidth - 5
        if (finalY < 5) finalY = 5
        if (finalY + contentHeight > viewHeight) finalY = viewHeight - contentHeight - 5
        
        return [finalX, finalY]
      },
      confine: true,
      appendToBody: false,
      extraCssText: 'min-width: auto; max-width: 180px; max-height: 180px; word-wrap: break-word; white-space: normal; overflow-wrap: break-word;'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: {
        color: '#fff'
      },
      data: validData.map(item => item.name)
    },
    series: [
      {
        name: '用户行为',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        data: validData,
        label: {
          show: true,
          formatter: '{b}: {c} ({d}%)',
          color: '#fff'
        },
        labelLine: {
          show: true,
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.3)'
          }
        },
        itemStyle: {
          borderColor: '#0a1a3a',
          borderWidth: 2,
          color: function(params) {
            // 为饼图提供明确的颜色配置
            const colors = ['#0174f5', '#11f6e2', '#ff6e00', '#3490ba', '#52c41a', '#f5222d']
            return colors[params.dataIndex % colors.length]
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(255, 255, 255, 0.5)'
          },
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        }
      }
    ]
    })
  } catch (error) {
    console.error('初始化行为统计图表失败:', error)
  }
}

const initSalesChart = () => {
  if (!chartData.value.sales || !chartData.value.sales.data) return
  
  const mappedData = chartData.value.sales.data
    .map(item => ({
      productName: item.product_id,
      saleCount: item.sale_count
    }))
    .sort((a, b) => b.saleCount - a.saleCount)
    .slice(0, 10)

  initChart(salesChart, salesInstance, {
    // title: {
    //   text: '商品销售排行',
    //   left: 'center',
    //   textStyle: {
    //     color: '#11f6e2',
    //     fontSize: 16
    //   }
    // },
    grid: {
      containLabel: true,
      left: '1%',
      right: '10%',
      bottom: '15%',
      top: '15%'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: params => {
        const data = params[0]
        return `${data.name}: ${data.value}`
      },
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderColor: '#0174f5',
      borderWidth: 1,
      textStyle: {
        color: '#fff',
        fontSize: 12,
        lineHeight: 16
      },
      padding: [4, 8],
      position: function(point, params, dom, rect, size) {
        // 用户建议的算法：计算鼠标点到四个边的距离，找到最远的位置
        const x = point[0]
        const y = point[1]
        const viewWidth = size.viewSize[0]
        const viewHeight = size.viewSize[1]
        const contentWidth = size.contentSize[0]
        const contentHeight = size.contentSize[1]
        
        // 计算到四个边的距离
        const distanceToLeft = x
        const distanceToRight = viewWidth - x
        const distanceToTop = y
        const distanceToBottom = viewHeight - y
        
        // 找到最大的距离方向
        const maxDistance = Math.max(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom)
        
        let finalX, finalY
        
        // 根据最大距离方向确定tooltip位置
        if (maxDistance === distanceToRight) {
          // 右边空间最大，放在右边
          finalX = x + 12
          finalY = y - contentHeight / 2
        } else if (maxDistance === distanceToLeft) {
          // 左边空间最大，放在左边
          finalX = x - contentWidth - 12
          finalY = y - contentHeight / 2
        } else if (maxDistance === distanceToBottom) {
          // 下边空间最大，放在下边
          finalX = x - contentWidth / 2
          finalY = y + 12
        } else {
          // 上边空间最大，放在上边
          finalX = x - contentWidth / 2
          finalY = y - contentHeight - 12
        }
        
        // 边界检查，确保tooltip在容器内
        if (finalX < 3) finalX = 3
        if (finalX + contentWidth > viewWidth) finalX = viewWidth - contentWidth - 3
        if (finalY < 3) finalY = 3
        if (finalY + contentHeight > viewHeight) finalY = viewHeight - contentHeight - 3
        
        return [finalX, finalY]
      },
      confine: true,
      appendToBody: false,
      extraCssText: 'min-width: auto; max-width: 180px; max-height: 180px; word-wrap: break-word; white-space: normal; overflow-wrap: break-word;'
    },
    xAxis: {
      type: 'category',
      name: '商品ID',
      nameLocation: 'end',
      nameTextStyle: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
      },
      data: mappedData.map(item => item.productName),
      axisLabel: {
        rotate: 45,
        color: '#fff',
        fontSize: 11,
        margin: 8
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#3490ba',
          width: 2
        }
      },
      axisTick: {
        show: true,
        lineStyle: {
          color: '#3490ba'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '销量',
      nameLocation: 'end',
      nameTextStyle: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#3490ba',
          width: 2
        }
      },
      axisTick: {
        show: true,
        lineStyle: {
          color: '#3490ba'
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          color: 'rgba(255, 255, 255, 0.2)',
          width: 1
        }
      }
    },
    series: [
      {
        name: '销量',
        type: 'bar',
        barWidth: '60%',
        data: mappedData.map(item => item.saleCount),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#0174f5' },
            { offset: 1, color: '#0b7ff3' }
          ])
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}',
          color: '#fff'
        }
      }
    ]
  })
}

const initDailyChart = () => {
  if (!chartData.value.daily || !chartData.value.daily.data) return
  
  const mappedData = chartData.value.daily.data.map(item => ({
    date: item.date,
    saleCount: item.sale_count
  }))

  initChart(dailyChart, dailyInstance, {
    // title: {
    //   text: '每日销售趋势',
    //   left: 'center',
    //   textStyle: {
    //     color: '#11f6e2',
    //     fontSize: 16
    //   }
    // },
    grid: {
      containLabel: true,
      left: '1%',
      right: '10%',
      bottom: '3%',
      top: '15%'
    },
    tooltip: {
      trigger: 'axis',
      formatter: params => {
        const data = params[0]
        return `${data.name}: ${data.value}`
      },
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderColor: '#0174f5',
      borderWidth: 1,
      textStyle: {
        color: '#fff',
        fontSize: 12,
        lineHeight: 16
      },
      padding: [4, 8],
      position: function(point, params, dom, rect, size) {
        // 用户建议的算法：计算鼠标点到四个边的距离，找到最远的位置
        const x = point[0]
        const y = point[1]
        const viewWidth = size.viewSize[0]
        const viewHeight = size.viewSize[1]
        const contentWidth = size.contentSize[0]
        const contentHeight = size.contentSize[1]
        
        // 计算到四个边的距离
        const distanceToLeft = x
        const distanceToRight = viewWidth - x
        const distanceToTop = y
        const distanceToBottom = viewHeight - y
        
        // 找到最大的距离方向
        const maxDistance = Math.max(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom)
        
        let finalX, finalY
        
        // 根据最大距离方向确定tooltip位置
        if (maxDistance === distanceToRight) {
          // 右边空间最大，放在右边
          finalX = x + 12
          finalY = y - contentHeight / 2
        } else if (maxDistance === distanceToLeft) {
          // 左边空间最大，放在左边
          finalX = x - contentWidth - 12
          finalY = y - contentHeight / 2
        } else if (maxDistance === distanceToBottom) {
          // 下边空间最大，放在下边
          finalX = x - contentWidth / 2
          finalY = y + 12
        } else {
          // 上边空间最大，放在上边
          finalX = x - contentWidth / 2
          finalY = y - contentHeight - 12
        }
        
        // 边界检查，确保tooltip在容器内
        if (finalX < 3) finalX = 3
        if (finalX + contentWidth > viewWidth) finalX = viewWidth - contentWidth - 3
        if (finalY < 3) finalY = 3
        if (finalY + contentHeight > viewHeight) finalY = viewHeight - contentHeight - 3
        
        return [finalX, finalY]
      },
      confine: true,
      appendToBody: false,
      extraCssText: 'min-width: auto; max-width: 180px; max-height: 180px; word-wrap: break-word; white-space: normal; overflow-wrap: break-word;'
    },
    xAxis: {
      type: 'category',
      name: '日期',
      nameLocation: 'end',
      nameTextStyle: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
      },
      data: mappedData.map(item => item.date),
      axisLabel: {
        color: '#fff',
        fontSize: 11,
        margin: 8
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#3490ba',
          width: 2
        }
      },
      axisTick: {
        show: true,
        lineStyle: {
          color: '#3490ba'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '销量',
      nameLocation: 'end',
      nameTextStyle: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#3490ba',
          width: 2
        }
      },
      axisTick: {
        show: true,
        lineStyle: {
          color: '#3490ba'
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          color: 'rgba(255, 255, 255, 0.2)',
          width: 1
        }
      }
    },
    series: [
      {
        name: '销量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: '#ff6e00'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 110, 0, 0.6)' },
            { offset: 1, color: 'rgba(255, 110, 0, 0.1)' }
          ])
        },
        itemStyle: {
          color: '#ff6e00'
        },
        data: mappedData.map(item => item.saleCount)
      }
    ]
  })
}

const initTopUsersChart = () => {
  if (!chartData.value.topUsers || !chartData.value.topUsers.data) return
  
  const mappedData = chartData.value.topUsers.data
    .map(item => ({
      userId: item.user_id,
      buyCount: item.buy_count
    }))
    .sort((a, b) => b.buyCount - a.buyCount)
    .slice(0, 10)

  initChart(topUsersChart, topUsersInstance, {
    // title: {
    //   text: '用户购买排行',
    //   left: 'center',
    //   textStyle: {
    //     color: '#11f6e2',
    //     fontSize: 16
    //   }
    // },
    grid: {
      containLabel: true,
      left: '1%',
      right: '10%',
      bottom: '15%',
      top: '15%'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: params => {
        const data = params[0]
        return `${data.name}: ${data.value}`
      },
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderColor: '#0174f5',
      borderWidth: 1,
      textStyle: {
        color: '#fff',
        fontSize: 12,
        lineHeight: 16
      },
      padding: [4, 8],
      position: function(point, params, dom, rect, size) {
        // 用户建议的算法：计算鼠标点到四个边的距离，找到最远的位置
        const x = point[0]
        const y = point[1]
        const viewWidth = size.viewSize[0]
        const viewHeight = size.viewSize[1]
        const contentWidth = size.contentSize[0]
        const contentHeight = size.contentSize[1]
        
        // 计算到四个边的距离
        const distanceToLeft = x
        const distanceToRight = viewWidth - x
        const distanceToTop = y
        const distanceToBottom = viewHeight - y
        
        // 找到最大的距离方向
        const maxDistance = Math.max(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom)
        
        let finalX, finalY
        
        // 根据最大距离方向确定tooltip位置
        if (maxDistance === distanceToRight) {
          // 右边空间最大，放在右边
          finalX = x + 12
          finalY = y - contentHeight / 2
        } else if (maxDistance === distanceToLeft) {
          // 左边空间最大，放在左边
          finalX = x - contentWidth - 12
          finalY = y - contentHeight / 2
        } else if (maxDistance === distanceToBottom) {
          // 下边空间最大，放在下边
          finalX = x - contentWidth / 2
          finalY = y + 12
        } else {
          // 上边空间最大，放在上边
          finalX = x - contentWidth / 2
          finalY = y - contentHeight - 12
        }
        
        // 边界检查，确保tooltip在容器内
        if (finalX < 3) finalX = 3
        if (finalX + contentWidth > viewWidth) finalX = viewWidth - contentWidth - 3
        if (finalY < 3) finalY = 3
        if (finalY + contentHeight > viewHeight) finalY = viewHeight - contentHeight - 3
        
        return [finalX, finalY]
      },
      confine: true,
      appendToBody: false,
      extraCssText: 'min-width: auto; max-width: 180px; max-height: 180px; word-wrap: break-word; white-space: normal; overflow-wrap: break-word;'
    },
    xAxis: {
      type: 'category',
      name: '用户ID',
      nameLocation: 'end',
      nameTextStyle: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
      },
      data: mappedData.map(item => item.userId),
      axisLabel: {
        rotate: 45,
        color: '#fff',
        fontSize: 11,
        margin: 8
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#3490ba',
          width: 2
        }
      },
      axisTick: {
        show: true,
        lineStyle: {
          color: '#3490ba'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '购买次数',
      nameLocation: 'end',
      nameTextStyle: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#3490ba',
          width: 2
        }
      },
      axisTick: {
        show: true,
        lineStyle: {
          color: '#3490ba'
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          color: 'rgba(255, 255, 255, 0.2)',
          width: 1
        }
      }
    },
    series: [
      {
        name: '购买次数',
        type: 'bar',
        barWidth: '60%',
        data: mappedData.map(item => item.buyCount),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#11f6e2' },
            { offset: 1, color: '#0b7ff3' }
          ])
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}',
          color: '#fff'
        }
      }
    ]
  })
}

// 初始化实时行为分析图表
const initRealTimeBehaviorChart = () => {
  try {
    if (typeof echarts === 'undefined') return
    if (!realTimeBehaviorData.value.behaviorCounts) return

    const behaviorCounts = realTimeBehaviorData.value.behaviorCounts
    const behaviorRatios = realTimeBehaviorData.value.behaviorRatios
    
    // 转换数据格式
    const chartData = Object.entries(behaviorCounts).map(([behavior, count]) => {
      const behaviorMap = {
        'pv': '点击',
        'fav': '收藏',
        'cart': '加入购物车',
        'buy': '购买'
      }
      return {
        name: behaviorMap[behavior] || behavior,
        value: count,
        ratio: behaviorRatios[behavior] || 0
      }
    })

    if (chartData.length === 0) return

    initChart(realTimeBehaviorChart, realTimeBehaviorInstance, {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderColor: '#0174f5',
        borderWidth: 2,
        textStyle: {
          color: '#fff',
          fontSize: 12,
          lineHeight: 16
        },
        padding: [6, 10],
        position: function(point, params, dom, rect, size) {
          // 用户建议的算法：计算鼠标点到四个边的距离，找到最远的位置
          const x = point[0]
          const y = point[1]
          const viewWidth = size.viewSize[0]
          const viewHeight = size.viewSize[1]
          const contentWidth = size.contentSize[0]
          const contentHeight = size.contentSize[1]
          
          // 计算到四个边的距离
          const distanceToLeft = x
          const distanceToRight = viewWidth - x
          const distanceToTop = y
          const distanceToBottom = viewHeight - y
          
          // 找到最大的距离方向
          const maxDistance = Math.max(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom)
          
          let finalX, finalY
          
          // 根据最大距离方向确定tooltip位置
          if (maxDistance === distanceToRight) {
            // 右边空间最大，放在右边
            finalX = x + 15
            finalY = y - contentHeight / 2
          } else if (maxDistance === distanceToLeft) {
            // 左边空间最大，放在左边
            finalX = x - contentWidth - 15
            finalY = y - contentHeight / 2
          } else if (maxDistance === distanceToBottom) {
            // 下边空间最大，放在下边
            finalX = x - contentWidth / 2
            finalY = y + 15
          } else {
            // 上边空间最大，放在上边
            finalX = x - contentWidth / 2
            finalY = y - contentHeight - 15
          }
          
          // 边界检查，确保tooltip在容器内
          if (finalX < 5) finalX = 5
          if (finalX + contentWidth > viewWidth) finalX = viewWidth - contentWidth - 5
          if (finalY < 5) finalY = 5
          if (finalY + contentHeight > viewHeight) finalY = viewHeight - contentHeight - 5
          
          return [finalX, finalY]
        },
        confine: true,
        appendToBody: false,
      extraCssText: 'min-width: auto; max-width: 180px; max-height: 180px; word-wrap: break-word; white-space: normal; overflow-wrap: break-word;'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: {
          color: '#fff'
        },
        data: chartData.map(item => item.name)
      },
      series: [
        {
          name: '实时行为分析',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          data: chartData,
          label: {
            show: true,
            formatter: '{b}: {c}',
            color: '#fff'
          },
          labelLine: {
            show: true,
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.3)'
            }
          },
          itemStyle: {
            borderColor: '#0a1a3a',
            borderWidth: 2,
            color: function(params) {
              const colors = ['#0174f5', '#11f6e2', '#ff6e00', '#3490ba']
              return colors[params.dataIndex % colors.length]
            }
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(255, 255, 255, 0.5)'
            }
          }
        }
      ]
    })
  } catch (error) {
    console.error('初始化实时行为分析图表失败:', error)
  }
}

// 初始化实时商品排行图表
const initRealTimeTopProductsChart = () => {
  try {
    if (typeof echarts === 'undefined') return
    if (!realTimeProductsData.value || realTimeProductsData.value.length === 0) return

    const chartData = realTimeProductsData.value
      .map(item => ({
        productId: item.productId,
        productName: item.productName || item.productId, // 使用商品名称，如果没有则使用商品ID
        salesCount: item.salesCount || 0,
        viewCount: item.viewCount || 0,
        cartCount: item.cartCount || 0,
        favCount: item.favCount || 0
      }))
      .sort((a, b) => b.salesCount - a.salesCount) // 按销量排序
      .slice(0, 10)

    if (chartData.length === 0) return

    initChart(realTimeTopProductsChart, realTimeTopProductsInstance, {
    grid: {
      containLabel: true,
      left: '1%',
      right: '10%',
      bottom: '15%',
      top: '10%'
    },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: params => {
          const data = params[0]
          return `${data.name}: ${data.value}`
        },
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderColor: '#0174f5',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 12,
          lineHeight: 16
        },
        padding: [4, 8],
        position: function(point, params, dom, rect, size) {
          // 用户建议的算法：计算鼠标点到四个边的距离，找到最远的位置
          const x = point[0]
          const y = point[1]
          const viewWidth = size.viewSize[0]
          const viewHeight = size.viewSize[1]
          const contentWidth = size.contentSize[0]
          const contentHeight = size.contentSize[1]
          
          // 计算到四个边的距离
          const distanceToLeft = x
          const distanceToRight = viewWidth - x
          const distanceToTop = y
          const distanceToBottom = viewHeight - y
          
          // 找到最大的距离方向
          const maxDistance = Math.max(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom)
          
          let finalX, finalY
          
          // 根据最大距离方向确定tooltip位置
          if (maxDistance === distanceToRight) {
            // 右边空间最大，放在右边
            finalX = x + 12
            finalY = y - contentHeight / 2
          } else if (maxDistance === distanceToLeft) {
            // 左边空间最大，放在左边
            finalX = x - contentWidth - 12
            finalY = y - contentHeight / 2
          } else if (maxDistance === distanceToBottom) {
            // 下边空间最大，放在下边
            finalX = x - contentWidth / 2
            finalY = y + 12
          } else {
            // 上边空间最大，放在上边
            finalX = x - contentWidth / 2
            finalY = y - contentHeight - 12
          }
          
          // 边界检查，确保tooltip在容器内
          if (finalX < 3) finalX = 3
          if (finalX + contentWidth > viewWidth) finalX = viewWidth - contentWidth - 3
          if (finalY < 3) finalY = 3
          if (finalY + contentHeight > viewHeight) finalY = viewHeight - contentHeight - 3
          
          return [finalX, finalY]
        },
        confine: true,
        appendToBody: false,
      extraCssText: 'min-width: auto; max-width: 180px; max-height: 180px; word-wrap: break-word; white-space: normal; overflow-wrap: break-word;'
      },
      xAxis: {
        type: 'category',
        name: '商品名称',
        nameLocation: 'end',
        nameTextStyle: {
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold'
        },
        data: chartData.map(item => item.productName),
        axisLabel: {
          rotate: 45,
          color: '#fff',
          fontSize: 11,
          margin: 8,
          formatter: function(value) {
            // 商品名称过长时截断显示
            return value.length > 8 ? value.substring(0, 8) + '...' : value
          }
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#3490ba',
            width: 2
          }
        },
        axisTick: {
          show: true,
          lineStyle: {
            color: '#3490ba'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '销量',
        nameLocation: 'end',
        nameTextStyle: {
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold'
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#3490ba',
            width: 2
          }
        },
        axisTick: {
          show: true,
          lineStyle: {
            color: '#3490ba'
          }
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: 'rgba(255, 255, 255, 0.2)',
            width: 1
          }
        }
      },
      series: [
        {
          name: '实时销量',
          type: 'bar',
          barWidth: '60%',
          data: chartData.map(item => item.salesCount),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#11f6e2' },
              { offset: 1, color: '#0b7ff3' }
            ])
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}',
            color: '#fff'
          }
        }
      ]
    })
  } catch (error) {
    console.error('初始化实时商品排行图表失败:', error)
  }
}

// 初始化实时图表
const initRealTimeCharts = () => {
  initRealTimeBehaviorChart()
  initRealTimeTopProductsChart()
}

// 平滑更新实时数据
const updateRealTimeData = async () => {
  if (isLoading.value) return // 防止重复加载
  
  isLoading.value = true
  updateAnimation.value = true
  
  try {
    await loadRealTimeData()
    
    // 使用requestAnimationFrame确保在下一帧更新图表
    requestAnimationFrame(() => {
      initRealTimeBehaviorChart()
      initRealTimeTopProductsChart()
      
      // 添加短暂的动画效果
      setTimeout(() => {
        updateAnimation.value = false
      }, 300)
    })
  } catch (error) {
    console.error('实时数据更新失败:', error)
    updateAnimation.value = false
  } finally {
    isLoading.value = false
  }
}

// 启动实时数据刷新定时器
const startRealTimeRefresh = () => {
  // 如果定时器已存在，先清除
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
  
  // 立即加载一次数据
  updateRealTimeData()
  
  // 每5秒刷新一次实时数据
  refreshTimer.value = setInterval(() => {
    if (activeTab.value === 'real-time') {
      updateRealTimeData()
    }
  }, 5000)
}

// 停止实时数据刷新定时器
const stopRealTimeRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
  isLoading.value = false
  updateAnimation.value = false
}

onMounted(async () => {
  // 确保ECharts库已加载
  if (typeof echarts === 'undefined') {
    console.error('ECharts库未正确加载')
    return
  }
  
  const loaded = await loadData()
  if (loaded) {
    // 使用setTimeout确保DOM完全渲染后再初始化图表
    setTimeout(() => {
      initBehaviorChart()
      initSalesChart()
      initDailyChart()
      initTopUsersChart()
      
      // 延迟再次检查以确保图表正确初始化
      setTimeout(() => {
        // 强制重新渲染所有图表以确保tooltip正常工作
        behaviorInstance.value?.resize()
        salesInstance.value?.resize()
        dailyInstance.value?.resize()
        topUsersInstance.value?.resize()
      }, 100)
    }, 100)
    
    // 响应式调整
    window.addEventListener('resize', () => {
      behaviorInstance.value?.resize()
      salesInstance.value?.resize()
      dailyInstance.value?.resize()
      topUsersInstance.value?.resize()
    })
  }
})

onUnmounted(() => {
  // 清理定时器
  stopRealTimeRefresh()
  
  // 清理图表实例
  behaviorInstance.value?.dispose()
  salesInstance.value?.dispose()
  dailyInstance.value?.dispose()
  topUsersInstance.value?.dispose()
  realTimeBehaviorInstance.value?.dispose()
  realTimeTopProductsInstance.value?.dispose()
  
  // 移除事件监听器
  window.removeEventListener('resize', () => {
    behaviorInstance.value?.resize()
    salesInstance.value?.resize()
    dailyInstance.value?.resize()
    topUsersInstance.value?.resize()
  })
})
</script>

<style scoped>
.positive {
  color: #52c41a;
  font-weight: bold;
}

.negative {
  color: #f5222d;
  font-weight: bold;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
}

.data-table th,
.data-table td {
  padding: 8px 12px;
  text-align: center;
  border: 1px solid #3490ba;
  font-size: 12px;
}

.data-table th {
  background-color: #3490ba;
  color: #fff;
  font-weight: bold;
}

.data-table td {
  background-color: rgba(255, 255, 255, 0.05);
  color: #dedfe0;
}

/* 分析模式切换样式 */
.analysis-mode {
  margin-bottom: 20px;
  text-align: center;
}

.mode-tabs {
  display: inline-flex;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 4px;
  border: 1px solid #3490ba;
}

.tab-button {
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: #dedfe0;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.tab-button:hover {
  background: rgba(52, 144, 186, 0.2);
}

.tab-button.active {
  background: #3490ba;
  color: #fff;
  box-shadow: 0 2px 8px rgba(52, 144, 186, 0.3);
}

/* 实时分析界面样式 */
.real-time-analysis {
  animation: fadeIn 0.5s ease-in-out;
}

.real-time-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-item.real-time {
  position: relative;
  background: linear-gradient(135deg, rgba(52, 144, 186, 0.3), rgba(17, 246, 226, 0.2));
  border: 1px solid #3490ba;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-item.real-time:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(52, 144, 186, 0.3);
}

.real-time-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #ff6e00;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  animation: pulse 2s infinite;
  transition: all 0.3s ease;
}

.real-time-indicator.updating {
  background: #11f6e2;
  animation: pulse-fast 1s infinite;
}

@keyframes pulse-fast {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    opacity: 1;
  }
}

.stat-value.pulse {
  animation: number-pulse 0.5s ease-in-out;
}

@keyframes number-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.real-time-stats.updating .stat-item {
  animation: card-pulse 0.5s ease-in-out;
}

@keyframes card-pulse {
  0% {
    box-shadow: 0 0 0 rgba(52, 144, 186, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(52, 144, 186, 0.6);
  }
  100% {
    box-shadow: 0 0 0 rgba(52, 144, 186, 0.3);
  }
}

.chart-updating {
  position: relative;
}

.chart-updating::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(52, 144, 186, 0.1);
  border-radius: 8px;
  z-index: 1;
  animation: chart-highlight 0.5s ease-in-out;
}

@keyframes chart-highlight {
  0% {
    background: rgba(52, 144, 186, 0.1);
  }
  50% {
    background: rgba(52, 144, 186, 0.3);
  }
  100% {
    background: rgba(52, 144, 186, 0.1);
  }
}

.loading-dot {
  animation: dot-pulse 1.5s infinite;
  display: inline-block;
}

@keyframes dot-pulse {
  0%, 20% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.loading-dot::after {
  content: '...';
  animation: dot-sequence 1.5s infinite;
}

@keyframes dot-sequence {
  0% {
    content: '.';
  }
  33% {
    content: '..';
  }
  66% {
    content: '...';
  }
  100% {
    content: '.';
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 历史分析界面布局 */
.historical-analysis .layout-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 20px;
}

.historical-analysis .data-card {
  min-height: 500px;
  background: rgba(2, 8, 23, 0.54);
  border-radius: 10px;
  border: 1px solid #0174f5;
  position: relative;
  margin: 10px;
  overflow: visible;
}

.historical-analysis .data-card-inner {
  border-radius: 9px;
  border: 2px solid #0b7ff3;
  height: calc(100% - 2px);
  margin: 1px;
  padding: 15px;
  background: rgba(17, 25, 69, 0.3);
}

.historical-analysis .chart-container {
  width: 100%;
  height: 350px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 15px;
  position: relative;
  overflow: hidden;
  margin-bottom: 15px;
}

/* 实时分析图表布局 */
.real-time-analysis .layout-grid {
  grid-template-columns: 1fr 1fr;
}

.real-time-analysis .data-card {
  min-height: 400px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .real-time-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .real-time-analysis .layout-grid {
    grid-template-columns: 1fr;
  }
  
  .historical-analysis .layout-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .real-time-stats {
    grid-template-columns: 1fr;
  }
  
  .mode-tabs {
    flex-direction: column;
    width: 100%;
  }
  
  .tab-button {
    width: 100%;
    margin-bottom: 4px;
  }
  
  .historical-analysis .layout-grid {
    grid-template-columns: 1fr;
    padding: 10px;
    gap: 10px;
  }
  
  .historical-analysis .data-card {
    min-height: 450px;
    margin: 5px;
  }
}
</style>
