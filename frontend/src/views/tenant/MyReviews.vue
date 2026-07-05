<template>
  <div>
    <div class="card-header">
      <h2>我的评价</h2>
      <el-button type="primary" @click="showCreateDialog">写评价</el-button>
    </div>

    <el-table :data="reviews" v-loading="loading" stripe style="width:100%">
      <el-table-column label="房源" min-width="160">
        <template #default="{ row }">{{ row.houseId?.title || '--' }}</template>
      </el-table-column>
      <el-table-column label="评分" width="180">
        <template #default="{ row }">
          <el-rate :model-value="row.score" disabled :max="5" void-color="#e2e6e6" />
        </template>
      </el-table-column>
      <el-table-column prop="content" label="评价内容" min-width="260" show-overflow-tooltip />
      <el-table-column label="评价时间" width="160">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && reviews.length === 0" description="暂无评价，去写第一条评价吧" />

    <el-dialog v-model="dialogVisible" title="写评价" width="500px" :close-on-click-modal="false">
      <el-form :model="form" label-width="80px">
        <el-form-item label="房源" prop="houseId">
          <el-select v-model="form.houseId" placeholder="选择要评价的房源" style="width:100%">
            <el-option v-for="h in houseOptions" :key="h._id || h.id" :label="h.title" :value="h._id || h.id" />
          </el-select>
          <div v-if="houseOptions.length === 0" style="font-size:12px;color:#c0c5c5;margin-top:4px;">
            暂无可评价的房源，预约成功后才能评价
          </div>
        </el-form-item>
        <el-form-item label="评分" prop="score">
          <el-rate v-model="form.score" :max="5" void-color="#e2e6e6" />
        </el-form-item>
        <el-form-item label="评价" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="分享您的租房体验" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReview" :loading="submitLoading">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

const reviews = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const houseOptions = ref([])

const form = ref({ houseId: '', score: 5, content: '' })

function formatDate(dateStr) {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function loadReviews() {
  loading.value = true
  try {
    const res = await request.get('/reviews/my')
    reviews.value = Array.isArray(res) ? res : (res.reviews || res.data || [])
  } catch {
    reviews.value = []
  } finally {
    loading.value = false
  }
}

async function loadAvailableHouses() {
  try {
    const res = await request.get('/reviews/available-houses')
    houseOptions.value = Array.isArray(res) ? res : (res.houses || res.data || [])
  } catch {
    houseOptions.value = []
  }
}

function showCreateDialog() {
  form.value = { houseId: '', score: 5, content: '' }
  dialogVisible.value = true
}

async function submitReview() {
  if (!form.value.houseId) { ElMessage.warning('请选择房源'); return }
  if (!form.value.content) { ElMessage.warning('请输入评价内容'); return }
  submitLoading.value = true
  try {
    await request.post('/reviews', { houseId: form.value.houseId, score: form.value.score, content: form.value.content })
    ElMessage.success('评价提交成功')
    dialogVisible.value = false
    loadReviews()
  } catch (err) {
    console.error('提交评价失败:', err)
    // 错误消息已由请求拦截器显示
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadReviews()
  loadAvailableHouses()
})
</script>
