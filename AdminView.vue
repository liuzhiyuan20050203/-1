<template>
  <div class="admin-container">
    <el-tabs type="border-card">
      <el-tab-pane label="用户管理">
        <el-button 
          type="primary" 
          @click="showCreateDialog = true"
          style="margin-bottom: 20px;"
        >
          创建用户
        </el-button>
        <el-table :data="users" border style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="role" label="角色">
            <template #default="{row}">
              <el-tag :type="row.role === 'ADMIN' ? 'danger' : 'primary'">
                {{ row.role === 'ADMIN' ? '管理员' : '用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{row}">
              <el-button
                size="small"
                type="danger"
                @click="handleDelete(row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="数据分析控制">
        <el-card>
          <h3>手动触发数据分析</h3>
          <p style="margin: 15px 0;">
            点击下方按钮手动执行Spark数据分析任务
          </p>
          <div class="analysis-form">
            <el-form label-position="top">
              <el-form-item label="分析天数">
                <el-input-number 
                  v-model="daysToAnalyze"
                  :min="1"
                  :max="30"
                  placeholder="输入要分析的天数"
                />
              </el-form-item>
            </el-form>
            
            <el-button 
              type="primary" 
              :loading="triggerLoading"
              @click="handleTriggerSpark"
              style="margin-right: 15px;"
            >
              执行训练分析
            </el-button>
            
            <el-button 
              type="success" 
              :loading="triggerWithDaysLoading"
              @click="handleTriggerSparkWithDays"
            >
              执行实时分析
            </el-button>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 创建用户对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建用户">
      <el-form :model="createForm" :rules="rules" ref="createFormRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createForm.username" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="createForm.email" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="createForm.role">
            <el-option label="用户" value="USER" />
            <el-option label="管理员" value="ADMIN" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAllUsers, createUser, deleteUser } from '../api/admin'
import { triggerSparkJob, triggerSparkJobWithDays } from '../api/analysis'
import { ElMessage } from 'element-plus'

const users = ref([])
const showCreateDialog = ref(false)
const triggerLoading = ref(false)
const triggerWithDaysLoading = ref(false)
const daysToAnalyze = ref(7)

const createForm = ref({
  username: '',
  email: '',
  password: '',
  role: 'USER'
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

onMounted(async () => {
  await fetchUsers()
})

const fetchUsers = async () => {
  try {
    const res = await getAllUsers()
    users.value = res.data
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

const handleCreate = async () => {
  try {
    await createUser(createForm.value)
    showCreateDialog.value = false
    await fetchUsers()
    ElMessage.success('创建用户成功')
  } catch (error) {
    ElMessage.error('创建用户失败: ' + error.message)
  }
}

const handleDelete = async (id) => {
  try {
    await deleteUser(id)
    await fetchUsers()
    ElMessage.success('删除用户成功')
  } catch (error) {
    ElMessage.error('删除用户失败: ' + error.message)
  }
}

const handleTriggerSpark = async () => {
  try {
    triggerLoading.value = true
    await triggerSparkJob()
    ElMessage.success('训练分析任务已触发')
  } catch (error) {
    ElMessage.error('触发失败: ' + error.message)
  } finally {
    triggerLoading.value = false
  }
}

const handleTriggerSparkWithDays = async () => {
  if (!daysToAnalyze.value) {
    ElMessage.warning('请输入要分析的天数')
    return
  }
  try {
    triggerWithDaysLoading.value = true
    await triggerSparkJobWithDays(daysToAnalyze.value)
    ElMessage.success(`实时分析任务已触发 (分析天数: ${daysToAnalyze.value})`)
  } catch (error) {
    ElMessage.error('触发失败: ' + error.message)
  } finally {
    triggerWithDaysLoading.value = false
  }
}
</script>

<style scoped>
.admin-container {
  padding: 20px;
}
</style>
