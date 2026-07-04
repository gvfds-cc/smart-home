<template>
  <div class="page-container">
    <div class="sidebar-layout">
      <el-menu :default-active="activeMenu" mode="horizontal">
        <el-menu-item index="/tenant/appointments" @click="$router.push('/tenant/appointments')">
          <el-icon><Calendar /></el-icon>我的预约
        </el-menu-item>
        <el-menu-item index="/tenant/contracts" @click="$router.push('/tenant/contracts')">
          <el-icon><Document /></el-icon>我的合同
        </el-menu-item>
        <el-menu-item index="/tenant/reviews" @click="$router.push('/tenant/reviews')">
          <el-icon><Star /></el-icon>我的评价
        </el-menu-item>
        <el-menu-item index="/tenant/profile" @click="$router.push('/tenant/profile')">
          <el-icon><User /></el-icon>个人信息
        </el-menu-item>
      </el-menu>
      <div class="content-area">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Calendar, Document, Star, User } from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>
