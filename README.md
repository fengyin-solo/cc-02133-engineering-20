# 广州知运信息技术有限公司官网

## 1. How to Run

### 方式一：Docker Compose（推荐）

```bash
# 构建并启动
docker-compose up --build -d

# 访问地址
http://localhost:8081
```

### 方式二：本地开发

```bash
# 进入前端目录
cd frontend-user

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 2. Services

| 服务 | 端口 | 说明 |
|------|------|------|
| 官网前端 | 8081 | Vue 3 静态页面 |

## 3. 测试账号

本项目为纯静态官网，无需登录账号。

## 4. 题目内容

> 在此空文件夹帮我创建一个Vue项目，它是我公司的官网，静态页面来的，公司名称是广州知运信息技术有限公司，首页的内容先帮我随意填充，公司目前经营的内容是智慧物流的系统

## 5. 项目结构

```
├── docs/                          # 项目文档
│   └── project_design.md          # 设计文档
├── frontend-user/                 # 前端项目
│   ├── public/                    # 静态资源
│   ├── scripts/                   # 构建脚本
│   │   ├── cases-manifest.mjs     # 规范化清单共享逻辑
│   │   ├── check-cases.mjs        # 案例构建检查（prebuild 自动执行）
│   │   └── export-cases.mjs       # 案例基线导出
│   ├── src/
│   │   ├── assets/               # 资源文件
│   │   │   └── styles/           # 样式文件
│   │   ├── components/           # 公共组件
│   │   │   ├── NavHeader.vue     # 导航栏
│   │   │   ├── FooterSection.vue # 页脚
│   │   │   ├── HeroBanner.vue    # 首页横幅
│   │   │   ├── FeatureCard.vue   # 特性卡片
│   │   │   ├── ProductCard.vue   # 产品卡片
│   │   │   ├── CaseCard.vue      # 案例卡片
│   │   │   └── SectionTitle.vue  # 区块标题
│   │   ├── data/                 # 内容数据
│   │   │   ├── cases.json        # 成功案例基线文件（可导入导出）
│   │   │   ├── cases.defaults.js # 内置案例（无效文件时的兜底）
│   │   │   ├── validateCases.js  # 案例校验与规范化
│   │   │   ├── resolveCases.js   # 数据取舍（无效则回退）
│   │   │   └── cases.js          # 案例数据入口
│   │   ├── router/               # 路由配置
│   │   │   └── index.js
│   │   ├── views/                # 页面视图
│   │   │   ├── HomeView.vue      # 首页
│   │   │   ├── AboutView.vue     # 关于我们
│   │   │   ├── ProductView.vue   # 产品服务
│   │   │   ├── CaseView.vue      # 案例展示
│   │   │   └── ContactView.vue   # 联系我们
│   │   ├── App.vue               # 根组件
│   │   └── main.js               # 入口文件
│   ├── cases.manifest.json       # 案例规范化清单（构建检查生成/比对）
│   ├── Dockerfile                # Docker构建文件
│   ├── nginx.conf                # Nginx配置
│   ├── package.json              # 依赖配置
│   └── vite.config.js            # Vite配置
├── docker-compose.yml            # Docker编排
├── .gitignore                    # Git忽略配置
└── README.md                     # 项目说明
```

## 6. 功能清单

### 页面功能

| 页面 | 功能点 |
|------|--------|
| 首页 | Hero横幅、公司简介、核心优势、产品亮点、合作伙伴 |
| 关于我们 | 公司介绍、发展历程、企业文化、团队风采 |
| 产品服务 | 智慧物流系统介绍、功能模块、技术优势 |
| 案例展示 | 成功案例列表、案例详情 |
| 联系我们 | 联系方式、公司地址、在线留言表单 |

### 技术特性

- ✅ Vue 3 Composition API
- ✅ Vue Router 路由管理
- ✅ Element Plus UI组件库
- ✅ SCSS 样式预处理
- ✅ 响应式布局适配
- ✅ Docker 容器化部署

## 7. 成功案例内容基线

成功案例（行业、挑战、方案、实施效果）由 `frontend-user/src/data/cases.json` 统一维护，支持导入导出与构建检查，避免发布时配置漂移。

| 命令 | 说明 |
|------|------|
| `npm run cases:export` | 导出内置案例为基线文件 `cases.json`，并同步规范化清单 |
| `npm run cases:check` | 校验基线文件并与 `cases.manifest.json` 比对，标出缺失/重复/漂移（`npm run build` 前自动执行） |
| `npm run cases:update-manifest` | 确认有意调整后，接受当前案例为新基线并重写清单 |

维护流程：编辑 `src/data/cases.json` → `npm run cases:check` 校验 → `npm run build` 发布。

保障机制：

- 基线文件为空、字段不完整或格式不兼容时，构建检查直接失败，且运行时自动回退到内置案例，绝不覆盖线上现有内容
- 清单记录每个案例的规范化摘要与校验和，缺失、重复、内容篡改、顺序变化都会在构建时被标出
- 案例数据加载后冻结，首次进入、前进后退、窄屏切换时渲染内容保持稳定
