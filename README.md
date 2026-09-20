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

## 7. 成功案例构建基线（导入/导出与构建检查）

案例展示页（`/cases`）的案例数据以「构建基线」为唯一来源，支持维护者从文件载入，避免发布时配置漂移。

### 基线文件格式

```json
{
  "formatVersion": 1,
  "exportedAt": "2026-09-20T00:00:00.000Z",
  "cases": [
    {
      "title": "案例名称",
      "industry": "所属行业",
      "tag": "ecommerce",
      "description": "案例描述",
      "challenge": "面临挑战",
      "solution": "解决方案",
      "gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "results": [{ "value": "40%", "label": "效率提升" }]
    }
  ]
}
```

参考文件：`frontend-user/baseline/case-baseline.sample.json`（导出当前基线可得到同样格式）。`tag` 取值：`ecommerce` / `express` / `retail` / `manufacturing`。

### 维护操作

在案例展示页筛选栏点击「构建基线」：

- **导出基线**：下载当前案例为规范化 JSON 文件；
- **从文件导入**：选择基线文件，自动执行规范化与检查；
- **执行构建检查**：生成规范化清单，标出缺失字段、重复案例与缺失的内置案例；
- **恢复内置基线**：放弃导入内容，回到随版本发布的内置案例。

### 安全保证（不覆盖现有案例）

以下情况导入一律被拒绝，页面保持原有案例：文件为空、JSON 非法、`formatVersion` 不兼容、`cases` 缺失或为空、任一字段缺失/为空白、实施效果缺少 `value`/`label`、案例标题重复。未知行业标签和缺少内置案例只记为警告（疑似配置漂移），不阻断导入。

导入成功的基线保存在浏览器本地，首次进入、路由前进/后退、窄屏展示后内容保持稳定；首页案例卡与客户评价区域不受影响。

### 发布前检查

```bash
cd frontend-user
npm run check:baseline          # 检查内置基线与随仓样例
npm run check:baseline -- <文件> # 检查指定基线文件
npm test                        # 解析/校验/存储单元测试
npm run build                    # 构建开始时自动执行基线检查，检查失败则中断发布
```
