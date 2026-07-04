<template>
  <header class="navbar">
    <div class="navbar-inner">
      <router-link to="/" class="logo">
        <span class="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M9 21V13H15V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="logo-text">智慧房屋租赁</span>
      </router-link>

      <nav class="nav-links">
        <template v-if="auth.isLoggedIn">
          <el-dropdown trigger="click">
            <span class="user-info">
              <el-avatar :size="32" :style="avatarStyle">{{ avatarText }}</el-avatar>
              <span class="username">{{ auth.user?.name || auth.user?.phone || '用户' }}</span>
              <el-icon class="arrow-icon"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="auth.isTenant">
                  <router-link to="/tenant/appointments" class="dropdown-link">我的预约</router-link>
                </el-dropdown-item>
                <el-dropdown-item v-if="auth.isTenant">
                  <router-link to="/tenant/contracts" class="dropdown-link">我的合同</router-link>
                </el-dropdown-item>
                <el-dropdown-item v-if="auth.isTenant">
                  <router-link to="/tenant/reviews" class="dropdown-link">我的评价</router-link>
                </el-dropdown-item>
                <el-dropdown-item v-if="auth.isTenant">
                  <router-link to="/tenant/profile" class="dropdown-link">个人信息</router-link>
                </el-dropdown-item>
                <el-dropdown-item v-if="auth.isLandlord">
                  <router-link to="/landlord/houses" class="dropdown-link">房源管理</router-link>
                </el-dropdown-item>
                <el-dropdown-item v-if="auth.isLandlord">
                  <router-link to="/landlord/appointments" class="dropdown-link">预约管理</router-link>
                </el-dropdown-item>
                <el-dropdown-item v-if="auth.isLandlord">
                  <router-link to="/landlord/contracts" class="dropdown-link">合同管理</router-link>
                </el-dropdown-item>
                <el-dropdown-item v-if="auth.isLandlord">
                  <router-link to="/landlord/finance" class="dropdown-link">财务管理</router-link>
                </el-dropdown-item>
                <el-dropdown-item v-if="auth.isAdmin">
                  <router-link to="/admin/users" class="dropdown-link">用户管理</router-link>
                </el-dropdown-item>
                <el-dropdown-item v-if="auth.isAdmin">
                  <router-link to="/admin/houses" class="dropdown-link">房源审核</router-link>
                </el-dropdown-item>
                <el-dropdown-item v-if="auth.isAdmin">
                  <router-link to="/admin/stats" class="dropdown-link">数据统计</router-link>
                </el-dropdown-item>
                <el-dropdown-item v-if="auth.isAdmin">
                  <router-link to="/admin/settings" class="dropdown-link">系统设置</router-link>
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <router-link to="/login" class="nav-btn-link">登录</router-link>
          <router-link to="/register" class="nav-btn-register">注册</router-link>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const avatarText = computed(() => {
  const name = auth.user?.name || auth.user?.phone || 'U'
  return name.charAt(0).toUpperCase()
})

const avatarStyle = computed(() => ({
  backgroundColor: '#0d7a7a',
  color: '#fff',
  fontWeight: 600,
  fontSize: '14px'
}))

function handleLogout() {
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
.navbar {
  background: #fff;
  border-bottom: 1px solid #e2e6e6;
  position: sticky;
  top: 0;
  z-index: 100;
}
.navbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.logo-icon {
  color: #0d7a7a;
  display: flex;
  align-items: center;
}
.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #1a1d1d;
  letter-spacing: 0.5px;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 12px;
}
.nav-btn-link {
  font-size: 14px;
  color: #6b7272;
  padding: 8px 16px;
  border-radius: 8px;
  transition: color 0.2s, background 0.2s;
}
.nav-btn-link:hover {
  color: #0d7a7a;
  background: #e2f3f3;
}
.nav-btn-register {
  font-size: 14px;
  color: #fff;
  background: #0d7a7a;
  padding: 8px 20px;
  border-radius: 8px;
  font-weight: 500;
  transition: background 0.2s;
}
.nav-btn-register:hover {
  background: #0b6b6b;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}
.user-info:hover {
  background: #f7f9f9;
}
.username {
  font-size: 14px;
  font-weight: 500;
  color: #1a1d1d;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.arrow-icon {
  color: #6b7272;
  display: flex;
  align-items: center;
}
.dropdown-link {
  display: block;
  width: 100%;
  color: inherit;
}
</style>
