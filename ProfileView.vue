<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <h2 class="profile-title">个人信息管理</h2>
      <el-form
        ref="profileFormRef"
        :model="profileForm"
        :rules="profileRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="profileForm.username" disabled />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="profileForm.email" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-input v-model="profileForm.role" disabled />
        </el-form-item>
        <el-form-item label="原始密码" prop="originalPassword">
          <el-input
            v-model="profileForm.originalPassword"
            type="password"
            placeholder="请输入原始密码进行验证"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="profileForm.password"
            type="password"
            placeholder="留空则不修改密码"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleUpdateProfile"
          >
            更新信息
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const loading = ref(false)
const profileFormRef = ref()

const profileForm = ref({
  id: '',
  username: '',
  email: '',
  role: '',
  originalPassword: '',
  password: ''
})

const profileRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  originalPassword: [
    { required: true, message: '请输入原始密码进行验证', trigger: 'blur' }
  ],
  password: [
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

onMounted(async () => {
  await loadUserProfile()
})

const loadUserProfile = async () => {
  try {
    loading.value = true
    // 从store中获取当前用户ID
    const userId = authStore.user?.id
    
    if (!userId) {
      ElMessage.error('无法获取用户ID，请重新登录')
      return
    }
    
    const profile = await authStore.fetchUserProfile(userId)
    
    profileForm.value = {
      id: profile.id || '',
      username: profile.username || '',
      email: profile.email || '',
      role: profile.role || '',
      originalPassword: '',
      password: '' // 密码字段不显示当前密码
    }
  } catch (error) {
    ElMessage.error('加载用户信息失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleUpdateProfile = async () => {
  try {
    // 表单验证
    await profileFormRef.value.validate()
    
    loading.value = true
    
    // 构建更新数据，始终包含原始密码验证
    const updateData = {
      originalPassword: profileForm.value.originalPassword
    }
    
    if (profileForm.value.email) {
      updateData.email = profileForm.value.email
    }
    if (profileForm.value.password) {
      updateData.password = profileForm.value.password
    }
    
    // 从store中获取当前用户ID
    const userId = authStore.user?.id
    
    if (!userId) {
      ElMessage.error('无法获取用户ID，请重新登录')
      return
    }
    
    await authStore.updateUserProfile(userId, updateData)
    ElMessage.success('个人信息更新成功')
    
    // 重置密码字段
    profileForm.value.originalPassword = ''
    profileForm.value.password = ''
  } catch (error) {
    if (error.message.includes('验证')) {
      // 表单验证错误，不显示错误消息
      return
    }
    ElMessage.error('更新失败: ' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.profile-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f7fa;
}

.profile-card {
  width: 500px;
  padding: 20px;
}

.profile-title {
  text-align: center;
  margin-bottom: 30px;
  color: #409eff;
}
</style>
