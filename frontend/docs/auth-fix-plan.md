# 认证逻辑修复与重构计划

## 问题背景
用户反馈点击“用户中心”时提示“登录过期”。
经排查，原因是 `UserCenter.vue` 仅从 `localStorage` 获取 Token，而 `Login.vue` 在未勾选“记住我”时会将 Token 存入 `sessionStorage`。此外，路由守卫与组件内部的 Token 检查逻辑不统一。

## 修复目标
1. 统一 Token 存储与获取逻辑。
2. 消除组件内部硬编码的存储访问。
3. 提高代码可维护性，防止类似 Bug 再次发生。

## 实施步骤

### 1. 创建认证工具类 (`src/utils/auth.js`)
提供统一的 API：
- `getToken()`: 依次从 `localStorage` 和 `sessionStorage` 获取。
- `saveToken(accessToken, refreshToken, expiresIn, remember)`: 根据 `remember` 标志存储。
- `clearToken()`: 清除所有存储中的认证信息。
- `isAuthenticated()`: 返回布尔值，判断当前是否已登录。

### 2. 重构登录页面 (`src/views/Login.vue`)
- 引入 `auth.js`。
- 使用 `auth.saveToken` 替换原有的 `storeTokens` 方法。

### 3. 重构路由守卫 (`src/router/index.js`)
- 引入 `auth.js`。
- 使用 `auth.isAuthenticated()` 替换手写的逻辑。

### 4. 修复用户中心 (`src/views/UserCenter.vue`)
- 引入 `auth.js`。
- 使用 `auth.getToken()` 获取 Token 用于 API 请求。
- 使用 `auth.isAuthenticated()` 进行初始化检查。
- 退出登录和修改密码成功后调用 `auth.clearToken()`。

### 5. 全局检查
- 确保 `Bookshelf.vue` 等其他受保护页面也遵循统一逻辑。

## 逻辑流程图
```mermaid
graph LR
    subgraph "Auth Utility (auth.js)"
        GT[getToken]
        ST[saveToken]
        CT[clearToken]
    end

    Login[Login.vue] -- "调用 ST" --> ST
    Router[router/index.js] -- "调用 GT" --> GT
    UserCenter[UserCenter.vue] -- "调用 GT" --> GT
    
    GT -- "查找" --> LS[(localStorage)]
    GT -- "查找" --> SS[(sessionStorage)]