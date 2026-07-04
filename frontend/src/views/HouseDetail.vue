<template>
  <div class="page-container">
    <el-button text @click="$router.back()" class="back-btn">
      <el-icon><ArrowLeft /></el-icon> 返回
    </el-button>

    <div v-loading="loading" v-if="house">
      <el-row :gutter="24">
        <el-col :span="16">
          <el-image
            v-if="house.images && house.images.length"
            :src="house.images[0]"
            fit="cover"
            class="detail-image"
          />
          <el-image
            v-else
            src="https://via.placeholder.com/800x400?text=暂无图片"
            fit="cover"
            class="detail-image"
          />
        </el-col>
        <el-col :span="8">
          <el-card shadow="never">
            <h2 class="house-title">{{ house.title }}</h2>
            <div class="price-tag">¥{{ Number(house.rent).toLocaleString() }}/月</div>
            <el-divider />
            <div class="info-list">
              <div class="info-row">
                <span class="label">面积：</span>
                <span>{{ house.size }}㎡</span>
              </div>
              <div class="info-row">
                <span class="label">类型：</span>
                <span>{{ house.type || house.houseType || '未分类' }}</span>
              </div>
              <div class="info-row">
                <span class="label">押金：</span>
                <span>¥{{ Number(house.deposit || 0).toLocaleString() }}</span>
              </div>
              <div class="info-row">
                <span class="label">地址：</span>
                <span>{{ house.address }}</span>
              </div>
              <div class="info-row">
                <span class="label">状态：</span>
                <el-tag :type="statusType">{{ statusText }}</el-tag>
              </div>
            </div>
            <el-divider />
            <el-button
              type="primary"
              size="large"
              style="width:100%"
              @click="handleAppointment"
              :disabled="house.status !== 'approved'"
            >
              预约看房
            </el-button>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="24" class="mt-20">
        <el-col :span="16">
          <el-card shadow="never" class="section-card">
            <h3>房屋描述</h3>
            <p>{{ house.description || '暂无描述' }}</p>
          </el-card>

          <el-card shadow="never" class="section-card" v-if="house.facilities">
            <h3>配套设施</h3>
            <div class="facilities-list">
              <el-tag v-for="(facility, index) in parseFacilities(house.facilities)" :key="index" class="facility-tag">
                {{ facility }}
              </el-tag>
            </div>
          </el-card>

          <el-card shadow="never" class="section-card">
            <h3>房东信息</h3>
            <div v-if="house.landlordId">
              <p>姓名：{{ house.landlordId.name || house.landlordId.phone }}</p>
              <p>电话：{{ house.landlordId.phone }}</p>
            </div>
            <p v-else>暂无房东信息</p>
          </el-card>

          <el-card shadow="never" class="section-card">
            <div class="card-header">
              <h3>用户评价</h3>
              <div v-if="avgRating > 0">
                <el-rate v-model="avgRating" disabled show-score :max="5" />
              </div>
            </div>
            <div v-if="reviews.length === 0" class="text-center" style="padding:20px;color:#909399">
              暂无评价
            </div>
            <div v-for="review in reviews" :key="review._id || review.id" class="review-item">
              <div class="review-header">
                <strong>{{ review.tenantId?.name || '匿名用户' }}</strong>
                <el-rate :model-value="review.score" disabled :max="5" size="small" />
              </div>
              <p class="review-content">{{ review.content }}</p>
              <el-divider />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-empty v-if="!loading && !house" description="房源不存在" />

    <el-dialog v-model="appointmentDialog" title="预约看房" width="400px">
      <el-form :model="appointmentForm" label-width="80px">
        <el-form-item label="看房日期">
          <el-date-picker v-model="appointmentForm.date" type="date" placeholder="选择日期" style="width:100%" />
        </el-form-item>
        <el-form-item label="看房时间">
          <el-time-picker v-model="appointmentForm.time" placeholder="选择时间" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="appointmentForm.note" type="textarea" rows="3" placeholder="可选备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appointmentDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAppointment" :loading="apptLoading">提交预约</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import request from '../utils/request'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const house = ref(null)
const reviews = ref([])
const loading = ref(false)
const apptLoading = ref(false)
const appointmentDialog = ref(false)

const appointmentForm = ref({
  date: '',
  time: '',
  note: ''
})

const avgRating = computed(() => {
  if (!reviews.value.length) return 0
  const sum = reviews.value.reduce((s, r) => s + (r.score || 0), 0)
  return Math.round((sum / reviews.value.length) * 10) / 10
})

const statusType = computed(() => {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger', rented: 'info', offline: 'info' }
  return map[house.value?.status] || 'info'
})

const statusText = computed(() => {
  const map = { pending: '待审核', approved: '已上架', rejected: '未通过', rented: '已租出', offline: '已下架' }
  return map[house.value?.status] || house.value?.status
})

function parseFacilities(facilities) {
  if (Array.isArray(facilities)) return facilities
  if (typeof facilities === 'string') {
    try { return JSON.parse(facilities) } catch { return facilities.split(/[,，、\s]+/).filter(Boolean) }
  }
  return []
}

async function loadHouse() {
  loading.value = true
  try {
    const res = await request.get(`/houses/${route.params.id}`)
    house.value = res.house || res.data || res
    if (house.value.landlordId && typeof house.value.landlordId === 'string') {
      try { house.value.landlordId = JSON.parse(house.value.landlordId) } catch {}
    }
  } catch {
    house.value = null
  } finally {
    loading.value = false
  }
}

async function loadReviews() {
  try {
    const res = await request.get(`/reviews/house/${route.params.id}`)
    reviews.value = res.reviews || res.data || []
  } catch {
    reviews.value = []
  }
}

function handleAppointment() {
  if (!auth.isLoggedIn) {
    ElMessage.warning('请先登录')
    return router.push('/login')
  }
  if (auth.isTenant) {
    appointmentDialog.value = true
  } else {
    ElMessage.warning('只有租户可以预约看房')
  }
}

async function submitAppointment() {
  if (!appointmentForm.value.date || !appointmentForm.value.time) {
    ElMessage.warning('请选择看房日期和时间')
    return
  }
  apptLoading.value = true
  try {
    const dateStr = appointmentForm.value.date.toISOString().split('T')[0]
    const timeStr = appointmentForm.value.time.toTimeString().split(' ')[0]
    await request.post('/appointments', {
      houseId: route.params.id,
      visitDate: dateStr,
      visitTime: timeStr,
      contact: appointmentForm.value.note || '',
      remark: appointmentForm.value.note || ''
    })
    ElMessage.success('预约成功，等待房东确认')
    appointmentDialog.value = false
  } catch {
    // handled
  } finally {
    apptLoading.value = false
  }
}

onMounted(() => {
  loadHouse()
  loadReviews()
})
</script>

<style scoped>
.back-btn {
  margin-bottom: 16px;
  font-size: 14px;
  color: #6b7272;
}
.back-btn:hover {
  color: #0d7a7a;
}
.detail-image {
  width: 100%;
  height: 400px;
  border-radius: 8px;
}
.house-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1a1d1d;
}
.price-tag {
  font-size: 28px;
  font-weight: 700;
  color: #d4943a;
}
.info-list {
  font-size: 14px;
  color: #1a1d1d;
}
.info-row {
  padding: 8px 0;
  display: flex;
  align-items: center;
}
.label {
  color: #6b7272;
  width: 60px;
  flex-shrink: 0;
}
.section-card {
  margin-top: 20px;
  border-radius: 8px;
}
.section-card h3 {
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
  color: #1a1d1d;
}
.section-card p {
  color: #1a1d1d;
  line-height: 1.8;
}
.facilities-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.facility-tag {
  font-size: 13px;
}
.review-item {
  padding: 12px 0;
}
.review-item:last-child .el-divider {
  display: none;
}
.review-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.review-content {
  color: #1a1d1d;
  line-height: 1.6;
}
</style>
