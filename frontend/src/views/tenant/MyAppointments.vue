<template>
  <div>
    <div class="card-header">
      <h2>我的预约</h2>
    </div>

    <el-table :data="appointments" v-loading="loading" stripe style="width:100%">
      <el-table-column label="房源" min-width="160">
        <template #default="{ row }">{{ row.houseId?.title || '--' }}</template>
      </el-table-column>
      <el-table-column label="看房日期" width="120">
        <template #default="{ row }">{{ formatDate(row.visitDate) }}</template>
      </el-table-column>
      <el-table-column label="时间" width="100">
        <template #default="{ row }">{{ row.visitTime || '--' }}</template>
      </el-table-column>
      <el-table-column label="备注" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ row.remark || '--' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag class="status-tag" :type="statusType(row.status)" size="small">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'pending'"
            type="danger"
            size="small"
            plain
            @click="cancelAppointment(row._id)"
          >取消预约</el-button>
          <span v-else class="muted-text">-</span>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && appointments.length === 0" description="暂无预约记录" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'

const appointments = ref([])
const loading = ref(false)

function statusType(s) {
  return { pending: 'warning', confirmed: 'success', rejected: 'danger', cancelled: 'info' }[s] || 'info'
}

function statusText(s) {
  return { pending: '待确认', confirmed: '已确认', rejected: '已拒绝', cancelled: '已取消' }[s] || s
}

function formatDate(dateStr) {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function loadAppointments() {
  loading.value = true
  try {
    const res = await request.get('/appointments')
    appointments.value = Array.isArray(res) ? res : (res.appointments || res.data || [])
  } catch {
    appointments.value = []
  } finally {
    loading.value = false
  }
}

async function cancelAppointment(id) {
  try {
    await ElMessageBox.confirm('确定取消该预约吗？', '提示')
    await request.put(`/appointments/${id}/cancel`)
    ElMessage.success('预约已取消')
    loadAppointments()
  } catch { /* cancelled */ }
}

onMounted(loadAppointments)
</script>
