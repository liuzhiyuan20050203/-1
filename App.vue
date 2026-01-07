<script setup>
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { House, DataAnalysis, User, UserFilled } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const route = useRoute()
const isAdmin = computed(() => authStore.user?.role === 'ADMIN')
const hideNavbar = computed(() => route.path === '/login' || route.path === '/register')
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-container">
    <!-- 顶部标题栏 -->
    <el-header v-if="!hideNavbar" class="header">
      <div class="header-content">
        <h1 class="title">{{ isAdmin ? '淘宝商品推荐和数据分析系统' : '淘淘购' }}</h1>
        <div class="user-info">
          <el-avatar 
            :size="40" 
            :src="authStore.user?.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'"
            class="user-avatar"
          />
          <span class="username">{{ authStore.user?.username || '用户' }}</span>
          <el-button 
            type="text" 
            @click="handleLogout" 
            class="logout-btn"
          >
            退出登录
          </el-button>
        </div>
      </div>
    </el-header>

    <!-- 主体内容区域 -->
    <el-container v-if="!hideNavbar" class="main-container">
      <!-- 左侧导航栏 -->
      <el-aside width="200px" class="sidebar">
        <el-menu
          :default-active="route.path"
          :router="true"
          background-color="#f5f7fa"
          text-color="#303133"
          active-text-color="#409eff"
          class="sidebar-menu"
        >
          <el-menu-item index="/">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item v-if="isAdmin" index="/analysis">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据分析</span>
          </el-menu-item>
          <el-menu-item v-if="isAdmin" index="/admin">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/profile">
            <el-icon><UserFilled /></el-icon>
            <span>个人资料</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 右侧内容区域 -->
      <el-main class="content">
        <RouterView />
      </el-main>
    </el-container>

    <!-- 登录/注册页面不显示导航 -->
    <div v-else>
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 0;
  height: 60px;
}

.header-content {
  display: flex;
  justify-content: flex-start; /* Changed from space-between */
  align-items: center;
  height: 100%;
  padding: 0 20px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative; /* Added for better layout control */
}

.title {
  color: white;
  font-size: 28px; /* Increased from 20px */
  font-weight: 600;
  margin: 0;
  position: absolute; /* Added for centering */
  left: 50%;
  transform: translateX(-50%);
  flex-grow: 1;
  text-align: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto; /* Ensures it stays on the far right */
}

.user-avatar {
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.username {
  color: white;
  font-size: 14px;
}

.logout-btn {
  color: white !important;
  font-size: 14px;
}

.logout-btn:hover {
  color: #ffd04b !important;
}

.main-container {
  flex: 1;
  height: calc(100vh - 60px);
}

.sidebar {
  background-color: #f5f7fa;
  border-right: 1px solid #e6e8eb;
}

.sidebar-menu {
  border: none;
  height: 100%;
}

.sidebar-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
  margin: 4px 8px;
  border-radius: 6px;
}

.sidebar-menu .el-menu-item.is-active {
  background-color: #ecf5ff;
  color: #409eff;
}

.content {
  padding: 20px;
  background-color: #f8f9fa;
  overflow-y: auto;
}
</style>
