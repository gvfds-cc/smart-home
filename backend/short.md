# 智慧房屋租赁系统 — API 文档 & 测试清单

> **项目类型**: Express.js (Node.js) + MongoDB (Mongoose) 后端，Vue 3 + Element Plus 前端  
> **Base URL**: `http://localhost:3000/api`  
> **认证方式**: Bearer Token (JWT)，Header: `Authorization: Bearer <token>`  
> **日期**: 2026-07-04

---

## 实现状态

所有 API 端点已在前端和后端实现。文档中的路径为实际使用的路径。

---

## 1. 认证模块 (Auth)

### 1.1 `POST /api/auth/register` — 用户注册
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | 无（公开） |
| **请求体** | `{ phone?: string, email?: string, password: string, name: string, role: 'tenant' \| 'landlord' }` |
| **验证规则** | `password`, `name`, `role` 必填；`role` 仅限 `tenant`/`landlord`；`phone` 和 `email` 至少填一个；手机号/邮箱不能重复 |
| **成功响应 (201)** | `{ user: { id, name, phone, email, role, status, createdAt }, token: string }` |
| **错误响应 (400)** | `{ message: "请填写必填字段" }` / `"角色无效"` / `"手机号和邮箱至少填一个"` / `"该账号已被注册"` |
| **前端调用** | `RegisterPage.vue` → `auth.register()` |
| **测试优先级** | 🔴 P0 |

### 1.2 `POST /api/auth/login` — 用户登录
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | 无（公开） |
| **请求体** | `{ phone?: string, email?: string, password: string, role: string }` |
| **成功响应 (200)** | `{ user: { id, name, phone, email, role, status, createdAt }, token: string }` |
| **错误响应 (401/403)** | `{ message: "账号或密码错误" }` / `"角色选择错误"` / `"账号已被禁用"` |
| **前端调用** | `LoginPage.vue` → `auth.login()` |
| **测试优先级** | 🔴 P0 |

### 1.3 `GET /api/auth/me` — 获取当前用户信息
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需要登录 |
| **成功响应 (200)** | `{ user: { id, name, phone, email, role, status, createdAt } }` |
| **错误响应 (401)** | `{ message: "请先登录" }` |
| **前端调用** | `auth.checkAuth()` 在路由守卫中调用 |
| **测试优先级** | 🔴 P0 |

### 1.4 `PUT /api/auth/profile` — 更新个人信息
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需要登录 |
| **请求体** | `{ name?, phone?, email? }` |
| **成功响应 (200)** | `{ user: { id, name, phone, email, role }, message: "更新成功" }` |
| **测试优先级** | 🟡 P1 |

---

## 2. 房屋模块 (Houses)

### 2.1 `GET /api/houses` — 房源列表（公开搜索）
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | 无（公开浏览） |
| **查询参数** | `page` (默认1), `limit` (默认12), `keyword`, `area`, `minRent`, `maxRent`, `type` |
| **过滤器** | 默认只返回 `status='approved'` 的房源 |
| **成功响应 (200)** | `{ houses: [...], total: number, page: number, limit: number }` |
| **前端调用** | `HomePage.vue` |
| **测试优先级** | 🔴 P0 |

### 2.2 `GET /api/houses/my` — 房东自己的房源列表
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `landlord` 角色 |
| **查询参数** | `status`（筛选状态） |
| **成功响应 (200)** | 房源数组（返回裸数组） |
| **前端调用** | `HouseManage.vue`, `ContractManage.vue`, `FinanceManage.vue` |
| **测试优先级** | 🔴 P0 |

### 2.3 `GET /api/houses/all` — 管理后台房源列表
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `admin` 角色 |
| **查询参数** | `status`（筛选状态） |
| **成功响应 (200)** | 房源数组 |
| **前端调用** | `HouseReview.vue` |
| **测试优先级** | 🔴 P0 |

### 2.4 `GET /api/houses/pending` — 待审核房源列表
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `admin` 角色 |
| **成功响应 (200)** | 房源数组（仅 `status='pending'`） |
| **测试优先级** | 🟡 P1 |

### 2.5 `GET /api/houses/:id` — 房源详情
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | 无（公开查看） |
| **URL 参数** | `id` — 房源 MongoDB ObjectId |
| **成功响应 (200)** | 房源对象（含 `landlordId` populate `name phone`） |
| **错误响应 (404)** | `{ message: "房源不存在" }` |
| **前端调用** | `HouseDetail.vue`, `HouseForm.vue` |
| **测试优先级** | 🔴 P0 |

### 2.6 `POST /api/houses` — 发布新房源
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `landlord` 角色 |
| **请求体** | `{ title, area, address, rent, type, size, deposit?, floor?, facilities?, images?, description? }` |
| **验证规则** | `title`, `area`, `address`, `type` 必填；`rent > 0`, `size > 0` |
| **成功响应 (201)** | 房源对象（默认 `status='pending'`） |
| **前端调用** | `HouseForm.vue` |
| **测试优先级** | 🔴 P0 |

### 2.7 `PUT /api/houses/:id` — 编辑房源
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + 房源所属 `landlord` |
| **请求体** | 同 `POST`（部分更新） |
| **成功响应 (200)** | 更新后的房源对象 |
| **错误响应 (403)** | `{ message: "无权修改此房源" }` |
| **前端调用** | `HouseForm.vue` |
| **测试优先级** | 🟡 P1 |

### 2.8 `DELETE /api/houses/:id` — 下架房源（软删除）
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + 房源所属 `landlord` |
| **业务逻辑** | 将 `status` 设为 `'offline'` |
| **成功响应 (200)** | `{ message: "房源已下线" }` |
| **测试优先级** | 🟡 P1 |

### 2.9 `PUT /api/houses/:id/review` — 审核房源（管理员）
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `admin` 角色 |
| **请求体** | `{ status: 'approved' \| 'rejected', rejectReason?: string }` |
| **业务逻辑** | 记录操作日志 |
| **成功响应 (200)** | 审核后的房源对象 |
| **前端调用** | `HouseReview.vue` |
| **测试优先级** | 🔴 P0 |

### 2.10 `PUT /api/houses/:id/status` — 上架/下架（房东）
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + 房源所属 `landlord` |
| **请求体** | `{ status: 'approved' \| 'offline' }` |
| **成功响应 (200)** | `{ message: "已上架" }` / `"已下架"` |
| **前端调用** | `HouseManage.vue` |
| **测试优先级** | 🟡 P1 |

---

## 3. 预约模块 (Appointments)

### 3.1 `GET /api/appointments` — 预约列表（角色过滤）
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需要登录 |
| **角色过滤** | `tenant` → 只看自己的；`landlord` → 看自己的；`admin` → 全部 |
| **查询参数** | `status`（筛选状态） |
| **成功响应 (200)** | 预约数组（populate `tenantId`, `landlordId`, `houseId`） |
| **前端调用** | `MyAppointments.vue`, `AppointmentManage.vue` |
| **测试优先级** | 🔴 P0 |

### 3.2 `POST /api/appointments` — 创建预约
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `tenant` 角色 |
| **请求体** | `{ houseId, visitDate, visitTime, contact, remark? }` |
| **验证规则** | `houseId` 必须存在且 `status = 'approved'` |
| **业务逻辑** | 自动填充 `tenantId`、`landlordId` |
| **成功响应 (201)** | 预约对象 |
| **前端调用** | `HouseDetail.vue` |
| **测试优先级** | 🔴 P0 |

### 3.3 `PUT /api/appointments/:id/cancel` — 取消预约
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + 预约所属 `tenant` |
| **业务逻辑** | `status: 'pending'` → `'cancelled'` |
| **成功响应 (200)** | 预约对象 |
| **前端调用** | `MyAppointments.vue` |
| **测试优先级** | 🟡 P1 |

### 3.4 `PUT /api/appointments/:id/confirm` — 确认预约
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + 预约所属 `landlord` |
| **业务逻辑** | `status: 'pending'` → `'confirmed'` |
| **成功响应 (200)** | 预约对象 |
| **前端调用** | `AppointmentManage.vue` |
| **测试优先级** | 🟡 P1 |

### 3.5 `PUT /api/appointments/:id/reject` — 拒绝预约
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + 预约所属 `landlord` |
| **请求体** | `{ reason?: string }` |
| **业务逻辑** | `status: 'pending'` → `'rejected'` |
| **成功响应 (200)** | 预约对象 |
| **前端调用** | `AppointmentManage.vue` |
| **测试优先级** | 🟡 P1 |

---

## 4. 合同模块 (Contracts)

### 4.1 `GET /api/contracts` — 合同列表（角色过滤）
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需要登录 |
| **角色过滤** | `tenant` → 只看自己的；`landlord` → 看自己的；`admin` → 全部 |
| **成功响应 (200)** | 合同数组（populate `tenantId`, `landlordId`, `houseId`） |
| **前端调用** | `MyContracts.vue`, `ContractManage.vue` |
| **测试优先级** | 🔴 P0 |

### 4.2 `POST /api/contracts` — 创建合同
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `landlord` 角色 |
| **请求体** | `{ tenantId, houseId, startDate, endDate, rent, deposit }` |
| **验证规则** | 所有字段必填；房源必须属于该房东 |
| **业务逻辑** | 默认 `status = 'draft'` |
| **成功响应 (201)** | 合同对象 |
| **前端调用** | `ContractManage.vue` |
| **测试优先级** | 🔴 P0 |

### 4.3 `PUT /api/contracts/:id/sign` — 签署合同
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需要登录（双方均可签署） |
| **业务逻辑** | 租客→`signedByTenant=true`；房东→`signedByLandlord=true`；双方都签署→`status='signed'` |
| **成功响应 (200)** | 合同对象 |
| **前端调用** | `MyContracts.vue`, `ContractManage.vue` |
| **测试优先级** | 🔴 P0 |

### 4.4 `PUT /api/contracts/:id/terminate` — 终止合同
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需要登录（双方均可操作） |
| **业务逻辑** | `status: 'draft'|'pending_sign'|'signed'` → `'terminated'` |
| **成功响应 (200)** | 合同对象 |
| **测试优先级** | 🟡 P1 |

### 4.5 `GET /api/contracts/:id` — 合同详情
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需要登录（双方或 admin 可查看） |
| **成功响应 (200)** | 合同对象（populate 所有关联字段） |
| **错误响应 (403)** | `{ message: "无权查看此合同" }` |
| **测试优先级** | 🟡 P1 |

---

## 5. 财务模块 (Finance)

### 5.1 `GET /api/finance` — 财务记录列表
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `landlord` 角色 |
| **查询参数** | `month` (格式: `YYYY-MM`), `houseId` |
| **成功响应 (200)** | 财务记录数组（populate `houseId`, `contractId`） |
| **前端调用** | `FinanceManage.vue` |
| **测试优先级** | 🟡 P1 |

### 5.2 `POST /api/finance` — 添加财务记录
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `landlord` 角色 |
| **请求体** | `{ houseId, contractId, amount, month (YYYY-MM) }` |
| **验证规则** | 房源必须属于该房东 |
| **成功响应 (201)** | 财务记录对象 |
| **前端调用** | `FinanceManage.vue` |
| **测试优先级** | 🟡 P1 |

---

## 6. 评价模块 (Reviews)

### 6.1 `GET /api/reviews/house/:houseId` — 获取房源评价
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | 无（公开查看） |
| **成功响应 (200)** | `{ reviews: [...], averageScore: number, total: number }`（仅返回 `visible=true` 的评价） |
| **前端调用** | `HouseDetail.vue` |
| **测试优先级** | 🟡 P1 |

### 6.2 `GET /api/reviews/my` — 租客自己的评价列表
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `tenant` 角色 |
| **成功响应 (200)** | 评价数组（populate `houseId`） |
| **前端调用** | `MyReviews.vue` |
| **测试优先级** | 🟢 P2 |

### 6.3 `POST /api/reviews` — 创建评价
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `tenant` 角色 |
| **请求体** | `{ houseId, score: 1-5, content? }` |
| **验证规则** | `houseId`、`score` 必填；`score` 1-5；同一租客对同一房源不可重复评价 |
| **成功响应 (201)** | 评价对象 |
| **前端调用** | `MyReviews.vue` |
| **测试优先级** | 🟢 P2 |

### 6.4 `PUT /api/reviews/:id/hide` — 隐藏/显示评价（管理员）
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `admin` 角色 |
| **业务逻辑** | 切换 `visible` 状态 |
| **成功响应 (200)** | 评价对象 |
| **测试优先级** | 🟢 P2 |

---

## 7. 管理后台 (Admin)

### 7.1 `GET /api/admin/users` — 用户列表
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `admin` 角色 |
| **查询参数** | `search` (姓名/手机号), `role` |
| **成功响应 (200)** | 用户数组 |
| **前端调用** | `UserManage.vue`, `ContractManage.vue` |
| **测试优先级** | 🟡 P1 |

### 7.2 `PUT /api/admin/users/:id/status` — 启用/禁用用户
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `admin` 角色 |
| **请求体** | `{ status: 'active' | 'disabled' }` |
| **成功响应 (200)** | 用户对象 |
| **前端调用** | `UserManage.vue` |
| **测试优先级** | 🟡 P1 |

### 7.3 `GET /api/admin/stats` — 统计
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `admin` 角色 |
| **成功响应 (200)** | `{ userCount: {tenant,landlord,admin}, houseCount: {pending,approved,...}, appointmentCount, contractCount, popularAreas, rentRanges }` |
| **前端调用** | `DataStats.vue` |
| **测试优先级** | 🟢 P2 |

### 7.4 `GET /api/admin/settings` — 获取系统设置
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `admin` 角色 |
| **成功响应 (200)** | 设置对象（key-value 格式） |
| **前端调用** | `SystemSettings.vue` |
| **测试优先级** | 🟢 P2 |

### 7.5 `PUT /api/admin/settings` — 更新系统设置
**状态**: ✅ 已实现

| 项目 | 详情 |
|------|------|
| **认证** | ✅ 需登录 + `admin` 角色 |
| **请求体** | `{ houseTypes?: string[], paymentMethods?: string[], auditEnabled?: boolean, ... }` |
| **成功响应 (200)** | 设置对象 |
| **前端调用** | `SystemSettings.vue` |
| **测试优先级** | 🟢 P2 |

---

## 认证与权限矩阵

| API 端点 | 公开 | tenant | landlord | admin |
|----------|:----:|:------:|:--------:|:-----:|
| `POST /auth/register` | ✅ | — | — | — |
| `POST /auth/login` | ✅ | — | — | — |
| `GET /auth/me` | — | ✅ | ✅ | ✅ |
| `PUT /auth/profile` | — | ✅ | ✅ | ✅ |
| `GET /houses` | ✅ | ✅ | ✅ | ✅ |
| `GET /houses/my` | — | — | ✅ | — |
| `GET /houses/all` | — | — | — | ✅ |
| `GET /houses/pending` | — | — | — | ✅ |
| `GET /houses/:id` | ✅ | ✅ | ✅ | ✅ |
| `POST /houses` | — | — | ✅ | — |
| `PUT /houses/:id` | — | — | ✅ (own) | — |
| `DELETE /houses/:id` | — | — | ✅ (own) | — |
| `PUT /houses/:id/review` | — | — | — | ✅ |
| `PUT /houses/:id/status` | — | — | ✅ (own) | — |
| `GET /appointments` | — | ✅ | ✅ | ✅ |
| `POST /appointments` | — | ✅ | — | — |
| `PUT /appointments/:id/cancel` | — | ✅ (own) | — | — |
| `PUT /appointments/:id/confirm` | — | — | ✅ (own) | — |
| `PUT /appointments/:id/reject` | — | — | ✅ (own) | — |
| `GET /contracts` | — | ✅ | ✅ | ✅ |
| `POST /contracts` | — | — | ✅ | — |
| `PUT /contracts/:id/sign` | — | ✅ | ✅ | — |
| `PUT /contracts/:id/terminate` | — | ✅ | ✅ | — |
| `GET /contracts/:id` | — | ✅ | ✅ | ✅ |
| `GET /finance` | — | — | ✅ | — |
| `POST /finance` | — | — | ✅ | — |
| `GET /reviews/house/:houseId` | ✅ | ✅ | ✅ | ✅ |
| `GET /reviews/my` | — | ✅ | — | — |
| `POST /reviews` | — | ✅ | — | — |
| `PUT /reviews/:id/hide` | — | — | — | ✅ |
| `GET /admin/users` | — | — | — | ✅ |
| `PUT /admin/users/:id/status` | — | — | — | ✅ |
| `GET /admin/stats` | — | — | — | ✅ |
| `GET /admin/settings` | — | — | — | ✅ |
| `PUT /admin/settings` | — | — | — | ✅ |

---

## 数据模型参考

### User
```
{ name, phone?, email?, passwordHash, role: 'tenant'|'landlord'|'admin', status: 'active'|'disabled', createdAt, updatedAt }
```

### House
```
{ landlordId, title, area, address, rent, deposit, type, size, floor, facilities[], description, images[], status: 'pending'|'approved'|'rejected'|'offline', rejectReason, createdAt, updatedAt }
```

### Appointment
```
{ tenantId, landlordId, houseId, visitDate, visitTime, contact, remark, status: 'pending'|'confirmed'|'rejected'|'cancelled', rejectReason, createdAt, updatedAt }
```

### Contract
```
{ tenantId, landlordId, houseId, startDate, endDate, rent, deposit, status: 'draft'|'pending_sign'|'signed'|'terminated', signedByTenant, signedByLandlord, createdAt, updatedAt }
```

### FinanceRecord
```
{ landlordId, houseId, contractId, amount, month, status: 'paid'|'pending', createdAt, updatedAt }
```

### Review
```
{ tenantId, houseId, landlordId, score: 1-5, content, visible, createdAt, updatedAt }
```

### OperationLog
```
{ operatorId, action, targetType, targetId, detail, createdAt }
```

### Setting
```
{ key, value (Mixed), updatedBy, createdAt, updatedAt }
```
