<template>
  <div class="taobao-simulation">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="search-bar">
        <el-input
          placeholder="搜索商品"
          v-model="searchKeyword"
          class="search-input"
        >
          <template #append>
            <el-button icon="Search" @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 商品列表 -->
    <div class="product-list">
      <div class="product-grid">
        <div 
          v-for="product in filteredProducts" 
          :key="product.id"
          class="product-card"
          ref="productCard"
        >
          <!-- 商品图片 -->
          <div class="product-image">
            <img :src="product.image" :alt="product.name" @click="handleProductClick(product)" />
            <div class="image-overlay">
              <el-button 
                type="primary" 
                size="small" 
                @click="handleQuickBuy(product)"
                class="quick-buy-btn"
              >
                立即购买
              </el-button>
            </div>
          </div>

          <!-- 商品信息 -->
          <div class="product-info">
            <div class="product-name-section">
              <span class="name-label">商品名称：</span>
              <h3 class="product-title" @click="handleProductClick(product)">
                {{ product.name }}
              </h3>
            </div>
            <div class="product-category">
              <span class="category-label">分类：</span>
              <span class="category-value">{{ product.category }}</span>
            </div>
            <div class="product-price">
              <span class="price-label">价格：</span>
              <span class="current-price">¥{{ product.price }}</span>
            </div>
            <div class="product-actions">
              <el-button 
                type="primary" 
                size="small" 
                @click="handleAddToCart(product)"
                class="cart-btn"
              >
                <el-icon><ShoppingCart /></el-icon>
                加入购物车
              </el-button>
              <el-button 
                type="text" 
                @click="handleFavorite(product)"
                :class="{ 'favorited': product.isFavorited }"
                class="favorite-btn"
              >
                <el-icon v-if="product.isFavorited"><StarFilled /></el-icon>
                <el-icon v-else><Star /></el-icon>
                {{ product.isFavorited ? '已收藏' : '收藏' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分页组件 -->
      <div class="pagination-container" v-if="totalPages > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalElements"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 购物车弹窗 -->
    <el-dialog
      v-model="cartDialogVisible"
      title="加入购物车"
      width="400px"
    >
      <div class="cart-dialog">
        <p>商品：{{ selectedProduct?.name }}</p>
        <p>价格：¥{{ selectedProduct?.price }}</p>
        <div class="quantity-selector">
          <span>数量：</span>
          <el-input-number 
            v-model="quantity" 
            :min="1" 
            :max="99"
            size="small"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="cartDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddToCart">确定</el-button>
      </template>
    </el-dialog>

    <!-- 购买确认弹窗 -->
    <el-dialog
      v-model="purchaseDialogVisible"
      title="确认购买"
      width="400px"
    >
      <div class="purchase-dialog">
        <p>商品：{{ selectedProduct?.name }}</p>
        <p>价格：¥{{ selectedProduct?.price }}</p>
        <p>数量：{{ quantity }}</p>
        <p class="total-price">总价：¥{{ (selectedProduct?.price * quantity).toFixed(2) }}</p>
      </div>
      <template #footer>
        <el-button @click="purchaseDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPurchase">立即购买</el-button>
      </template>
    </el-dialog>

    <!-- 为您推荐区域 -->
    <div class="recommendation-section" v-if="recommendedProducts.length > 0">
      <h3 class="section-title">为您推荐</h3>
      <div class="recommendation-grid">
        <div 
          v-for="product in recommendedProducts" 
          :key="product.productId"
          class="recommendation-card"
          @click="handleRecommendationClick(product)"
        >
          <div class="recommendation-image">
            <img :src="product.image" :alt="product.productName" />
            <!-- <div class="recommendation-badge">推荐度: {{ (product.score * 100).toFixed(0) }}%</div> -->
          </div>
          <div class="recommendation-info">
            <div class="recommendation-name-section">
              <span class="name-label">商品名称：</span>
              <h4 class="recommendation-title">{{ product.productName }}</h4>
            </div>
            <div class="recommendation-category">
              <span class="category-label">分类：</span>
              <span class="category-value">{{ product.category }}</span>
            </div>
            <div class="recommendation-price-section">
              <span class="price-label">价格：</span>
              <p class="recommendation-price">¥{{ product.price }}</p>
            </div>
            <div class="recommendation-actions">
              <el-button 
                type="primary" 
                size="small" 
                @click.stop="handleQuickBuy(product)"
                class="quick-buy-btn"
              >
                立即购买
              </el-button>
              <el-button 
                type="text" 
                @click.stop="handleFavorite(product)"
                class="favorite-btn"
              >
                <el-icon><Star /></el-icon>
                收藏
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 埋点状态显示 -->
    <div class="tracking-status">
      <el-alert
        :title="`埋点状态：队列中有 ${queueStatus.queueSize} 条数据，${queueStatus.isReporting ? '正在上报' : '等待上报'}`"
        type="info"
        :closable="false"
        show-icon
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElPagination } from 'element-plus'
import { ShoppingCart, Star, StarFilled } from '@element-plus/icons-vue'
import trackingSDK from '../utils/tracking-sdk'
import { getUserRecommendations, getRealtimeRecommendations } from '../api/recommendation'
import { getAllProducts, searchProducts } from '../api/product'
import { useAuthStore } from '../stores/auth'

// 获取auth store实例
const authStore = useAuthStore()

// 获取当前用户ID
const getCurrentUserId = () => {
  return authStore.user?.id 
}

// 搜索关键词
const searchKeyword = ref('')

// 分页相关状态
const currentPage = ref(1)
const pageSize = ref(20)
const totalPages = ref(0)
const totalElements = ref(0)

// 商品数据
const products = ref([])

// 获取商品列表
const fetchProducts = async (page = currentPage.value, size = pageSize.value) => {
  try {
    const result = await getAllProducts(page - 1, size) // 后端页码从0开始，前端从1开始
    if (result.code === 200 && result.data) {
      products.value = result.data.map(product => ({
        id: product.product_id,
        name: product.product_name,
        price: product.price,
        image: product.image_url,
        category: product.category_name,
        categoryId: product.category_id,
        isFavorited: false
      }))
      
      // 更新分页信息
      if (result.pagination) {
        totalPages.value = result.pagination.totalPages
        totalElements.value = result.pagination.totalElements
      }
    }
  } catch (error) {
    console.error('获取商品列表失败:', error)
    ElMessage.error('获取商品列表失败')
  }
}

// 分页事件处理
const handlePageChange = (page) => {
  currentPage.value = page
  if (isSearching.value) {
    performSearch(searchKeyword.value, page, pageSize.value)
  } else {
    fetchProducts(page, pageSize.value)
  }
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  if (isSearching.value) {
    performSearch(searchKeyword.value, 1, size)
  } else {
    fetchProducts(1, size)
  }
}

// 弹窗控制
const cartDialogVisible = ref(false)
const purchaseDialogVisible = ref(false)
const selectedProduct = ref(null)
const quantity = ref(1)

// 推荐商品数据
const recommendedProducts = ref([])

// 埋点状态
const queueStatus = ref({
  queueSize: 0,
  isReporting: false,
  maxQueueSize: 50
})

// 搜索状态
const isSearching = ref(false)
const searchResults = ref([])

// 搜索商品
const performSearch = async (keyword, page = 1, size = pageSize.value) => {
  if (!keyword.trim()) {
    // 如果关键词为空，恢复显示所有商品
    isSearching.value = false
    fetchProducts(page, size)
    return
  }
  
  try {
    isSearching.value = true
    const result = await searchProducts(keyword, page - 1, size) // 后端页码从0开始，前端从1开始
    
    if (result.code === 200 && result.data) {
      searchResults.value = result.data.map(product => ({
        id: product.product_id,
        name: product.product_name,
        price: product.price,
        image: product.image_url,
        category: product.category_name,
        categoryId: product.category_id,
        isFavorited: false
      }))
      
      // 更新分页信息
      if (result.pagination) {
        totalPages.value = result.pagination.totalPages
        totalElements.value = result.pagination.totalElements
      }
    } else {
      ElMessage.error('搜索失败，请重试')
    }
  } catch (error) {
    console.error('搜索商品失败:', error)
    ElMessage.error('搜索商品失败')
  }
}

// 过滤商品列表（显示搜索结果或所有商品）
const filteredProducts = computed(() => {
  if (isSearching.value) {
    return searchResults.value
  }
  return products.value
})

// 获取推荐商品
const fetchRecommendations = async () => {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.log('用户未登录，无法获取推荐商品')
      return
    }
    
    const result = await getUserRecommendations(userId)
    
    if (result.code === 200 && result.data && result.data.recommendations) {
      // 推荐接口直接返回完整的商品信息，不需要转换
      const recommendations = result.data.recommendations.map(product => ({
        productId: product.productId,
        productName: product.productName,
        price: product.price,
        image: product.image,
        category: product.category,
        categoryId: product.categoryId,
        // score: 0.8 + Math.random() * 0.2 // 模拟推荐度评分
      }))
      
      if (recommendations.length > 0) {
        recommendedProducts.value = recommendations
        console.log('推荐商品获取成功:', recommendedProducts.value)
      } else {
        console.log('暂无推荐商品或获取失败')
      }
    }
  } catch (error) {
    console.error('获取推荐商品失败:', error)
  }
}

// 获取实时推荐商品
const fetchRealtimeRecommendations = async () => {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.log('用户未登录，无法获取实时推荐')
      return
    }
    
    const result = await getRealtimeRecommendations(userId)
    
    if (result.code === 200 && result.data && result.data.recommendations) {
      // 推荐接口直接返回完整的商品信息，不需要转换
      const recommendations = result.data.recommendations.map(product => ({
        productId: product.productId,
        productName: product.productName,
        price: product.price,
        image: product.image,
        category: product.category,
        categoryId: product.categoryId,
        // score: 0.8 + Math.random() * 0.2 // 模拟推荐度评分
      }))
      
      if (recommendations.length > 0) {
        recommendedProducts.value = recommendations
        console.log('实时推荐商品获取成功:', recommendedProducts.value)
        ElMessage.success('为您推荐了新的商品')
      }
    }
  } catch (error) {
    console.error('获取实时推荐商品失败:', error)
  }
}

// 推荐商品点击事件
const handleRecommendationClick = (product) => {
  // 使用埋点SDK记录推荐商品点击事件
  trackingSDK.trackManual('pv', {
    id: product.productId,
    name: product.productName,
    price: product.price,
    category: product.category,
    categoryId: product.categoryId
  }, {
    clickType: 'recommendation_click',
    recommendationScore: product.score
  })
  
  ElMessage.success(`查看推荐商品: ${product.productName}`)
}

// 搜索处理
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  
  currentPage.value = 1
  performSearch(searchKeyword.value, 1, pageSize.value)
  ElMessage.info(`搜索关键词: ${searchKeyword.value}`)
}

// 商品点击事件
const handleProductClick = (product) => {
  // 使用埋点SDK记录点击事件
  trackingSDK.trackManual('pv', product, {
    clickType: 'product_detail'
  })
  ElMessage.success(`查看商品: ${product.name}`)
}

// 转换商品数据结构为跟踪SDK期望的格式
const convertProductForTracking = (product) => {
  // 如果是推荐商品（有productId字段），转换为标准格式
  if (product.productId) {
    return {
      id: product.productId,
      name: product.productName,
      price: product.price,
      category: product.category,
      categoryId: product.categoryId || null
    }
  }
  // 如果是普通商品，直接返回
  return product
}

// 快速购买
const handleQuickBuy = (product) => {
  selectedProduct.value = product
  quantity.value = 1
  purchaseDialogVisible.value = true
}

// 加入购物车
const handleAddToCart = (product) => {
  selectedProduct.value = product
  quantity.value = 1
  cartDialogVisible.value = true
}

// 确认加入购物车
const confirmAddToCart = () => {
  if (selectedProduct.value) {
    // 转换商品数据结构
    const trackingProduct = convertProductForTracking(selectedProduct.value)
    
    // 使用埋点SDK记录加购事件
    trackingSDK.trackManual('cart', trackingProduct, {
      quantity: quantity.value
    })
    ElMessage.success(`已加入购物车: ${trackingProduct.name} x${quantity.value}`)
    cartDialogVisible.value = false
    
    // 加购后获取实时推荐
    setTimeout(() => {
      fetchRealtimeRecommendations()
    }, 500)
  }
}

// 收藏商品
const handleFavorite = (product) => {
  product.isFavorited = !product.isFavorited
  
  // 转换商品数据结构
  const trackingProduct = convertProductForTracking(product)
  
  // 使用埋点SDK记录收藏事件
  const eventType = 'fav'
  trackingSDK.trackManual(eventType, trackingProduct)
  
  ElMessage.success(product.isFavorited ? '收藏成功' : '取消收藏')
  
    // 收藏后获取实时推荐
    setTimeout(() => {
      fetchRealtimeRecommendations()
    }, 500)
}

// 确认购买
const confirmPurchase = () => {
  if (selectedProduct.value) {
    // 转换商品数据结构
    const trackingProduct = convertProductForTracking(selectedProduct.value)
    
    // 使用埋点SDK记录购买事件
    trackingSDK.trackManual('buy', trackingProduct, {
      quantity: quantity.value,
      totalAmount: trackingProduct.price * quantity.value
    })
    ElMessage.success(`购买成功: ${trackingProduct.name} x${quantity.value}`)
    purchaseDialogVisible.value = false
    
    // 购买后获取实时推荐
    setTimeout(() => {
      fetchRealtimeRecommendations()
    }, 500)
  }
}

// 初始化埋点监听
const initTracking = () => {
  // 可以在这里添加更精细的事件监听
  console.log('埋点SDK初始化完成')
  
  // 定时更新队列状态
  setInterval(() => {
    queueStatus.value = trackingSDK.getQueueStatus()
  }, 1000)
}

onMounted(() => {
  initTracking()
  // 页面加载时获取商品列表和推荐商品
  fetchProducts()
  fetchRecommendations()
  
  // 每5分钟刷新推荐商品
  setInterval(fetchRecommendations, 5 * 60 * 1000)
})
</script>

<style scoped>
.taobao-simulation {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.search-bar {
  max-width: 600px;
  margin: 0 auto;
}

.product-list {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.product-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.product-image:hover .image-overlay {
  opacity: 1;
}

.quick-buy-btn {
  background: #ff5000;
  border-color: #ff5000;
}

.product-info {
  padding: 15px;
}

.product-title {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 10px;
  cursor: pointer;
  color: #333;
}

.product-title:hover {
  color: #ff5000;
}

.product-price {
  margin-bottom: 8px;
}

.current-price {
  font-size: 18px;
  font-weight: bold;
  color: #ff5000;
  margin-right: 8px;
}

.original-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.product-sales {
  font-size: 12px;
  color: #999;
  margin-bottom: 10px;
}

.product-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-btn {
  background: #ff5000;
  border-color: #ff5000;
}

.favorite-btn {
  color: #666;
}

.favorite-btn.favorited {
  color: #ff5000;
}

.cart-dialog,
.purchase-dialog {
  padding: 10px 0;
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 15px 0;
}

.total-price {
  font-size: 16px;
  font-weight: bold;
  color: #ff5000;
}

/* 推荐区域样式 */
.recommendation-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
  border-left: 4px solid #ff5000;
  padding-left: 10px;
}

.recommendation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 15px;
}

.recommendation-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
  cursor: pointer;
}

.recommendation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.recommendation-image {
  position: relative;
  height: 150px;
  overflow: hidden;
}

.recommendation-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recommendation-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(45deg, #ff6b6b, #ff8e53);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.recommendation-info {
  padding: 12px;
}

.recommendation-title {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 8px;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recommendation-price {
  font-size: 16px;
  font-weight: bold;
  color: #ff5000;
  margin-bottom: 10px;
}

.recommendation-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recommendation-actions .quick-buy-btn {
  background: #ff5000;
  border-color: #ff5000;
  font-size: 12px;
  padding: 6px 12px;
}

.recommendation-actions .favorite-btn {
  color: #666;
  font-size: 12px;
  padding: 6px 8px;
}

.tracking-status {
  margin-top: 20px;
}

/* 分页样式 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding: 20px 0;
  border-top: 1px solid #e8e8e8;
}

.pagination-container .el-pagination {
  --el-pagination-bg-color: #fff;
  --el-pagination-text-color: #333;
  --el-pagination-border-color: #e8e8e8;
}

.pagination-container .el-pagination .btn-prev,
.pagination-container .el-pagination .btn-next,
.pagination-container .el-pagination .number {
  border-radius: 4px;
  border: 1px solid #e8e8e8;
  margin: 0 2px;
}

.pagination-container .el-pagination .number:hover,
.pagination-container .el-pagination .btn-prev:hover,
.pagination-container .el-pagination .btn-next:hover {
  color: #ff5000;
  border-color: #ff5000;
}

.pagination-container .el-pagination .number.active {
  background-color: #ff5000;
  border-color: #ff5000;
  color: #fff;
}
</style>
