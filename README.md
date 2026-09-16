# 📚 个人学习博客模板

一个开箱即用的**个人学习笔记博客**模板，基于 VitePress 构建，可免费部署到 Cloudflare Pages。

专门针对「记录知识点 + 整理实战案例」的场景设计。

## ✨ 特性

- ✅ **零成本**：Cloudflare Pages 免费计划永久 ¥0，无限带宽
- ✅ **开箱即用**：内置全文搜索、暗黑模式、移动端适配、左侧侧边栏
- ✅ **双内容区**：`notes/` 记知识点，`cases/` 记实战案例，结构清晰
- ✅ **写作顺畅**：写 Markdown → `git push` → 自动上线，无需手动构建
- ✅ **代码友好**：代码块高亮、指定行高亮、diff 显示、复制按钮

## 🚀 快速开始

### 环境要求

- Node.js **18+**（推荐 Node 22，本项目已在 Node 22.22 验证通过）
- npm（Node 自带）

检查版本：

```bash
node --version
npm --version
```

### 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 启动本地预览（默认 http://localhost:5173）
npm run dev

# 3. 构建静态文件（产物在 .vitepress/dist）
npm run build

# 4. 本地预览构建结果
npm run preview
```

## 📁 目录结构

```
learning-blog/
├── .vitepress/
│   ├── config.mts        # ⭐ 核心配置：导航、侧边栏、搜索、页脚
│   └── dist/             # 构建产物（已 gitignore，不要提交）
├── notes/                # 📚 知识点笔记
│   ├── index.md
│   ├── git-basics.md
│   ├── python-virtualenv.md
│   └── markdown-syntax.md    # 写作速查，忘了语法回来看这个
├── cases/                # 🛠 实战案例
│   ├── index.md
│   ├── first-api.md
│   └── blog-deploy.md
├── index.md              # 首页
├── about.md              # 关于页
├── package.json
├── .gitignore
└── README.md
```

## ✍️ 怎么写新文章

### 第一步：新建 Markdown 文件

```bash
# 知识点笔记
touch notes/新主题.md

# 实战案例
touch cases/新案例.md
```

建议开头加 frontmatter：

```markdown
---
title: 文章标题
description: 一句话描述，会显示在搜索结果里
---
```

> 忘了 Markdown 语法？打开 `notes/markdown-syntax.md` 有完整速查。

### 第二步：注册到侧边栏

打开 `.vitepress/config.mts`，在对应分组的 `items` 数组里加一行：

```ts
sidebar: {
  '/notes/': [
    {
      text: '💡 基础知识点',
      items: [
        { text: 'Git 常用命令速查', link: '/notes/git-basics' },
        { text: '我的新笔记', link: '/notes/新主题' }   // ← 新增这行
      ]
    }
  ]
}
```

### 第三步：推送上线

```bash
git add .
git commit -m "新增：XXX 学习笔记"
git push
```

## 🌐 部署到 Cloudflare Pages

### 前置准备

1. 注册 [Cloudflare](https://dash.cloudflare.com/sign-up)（免费，无需信用卡）
2. 把本项目推到你的 GitHub 仓库

### 部署步骤

1. 登录 Cloudflare 控制台
2. 进入 **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. 授权并选择你的 GitHub 仓库
4. **构建配置**（这一步最关键）：

   | 配置项 | 值 |
   |--------|-----|
   | Framework preset | `VitePress` 或留空 |
   | Build command | `npm run build` |
   | **Build output directory** | **`.vitepress/dist`** |

5. 点击 **Save and Deploy**，等待约 1 分钟

部署完成后会得到一个 `https://xxx.pages.dev` 的网址，直接可以访问。

> ⚠️ **最容易踩的坑**：Build output directory 必须是 `.vitepress/dist`，不是 `dist`。填错会导致部署成功但打开 404。

### 绑定自定义域名（可选）

在项目页 → **Custom domains** → **Set up a custom domain**，按提示操作即可。SSL 证书自动签发。

## ❓ 常见问题

<details>
<summary><b>本地正常，Cloudflare 构建失败？</b></summary>

大概率是 Node 版本不一致。在项目设置里加环境变量：

```
NODE_VERSION = 22
```

</details>

<details>
<summary><b>部署成功但页面 404 / 白屏？</b></summary>

检查 Build output directory 是否为 `.vitepress/dist`。

</details>

<details>
<summary><b>想改站点标题和导航？</b></summary>

全部在 `.vitepress/config.mts` 里，改完重新推送即可。搜索「change me」或「你的用户名」可以找到需要改的地方。

</details>

<details>
<summary><b>Cloudflare 免费额度够用吗？</b></summary>

绰绰有余。免费版每月 500 次构建，每次 `git push` 算 1 次——等于每天可以推送 16 次以上。

</details>

## 🎨 个性化建议

上手后你可能想改的地方：

| 想改什么 | 去哪改 |
|---------|--------|
| 站点标题/描述 | `config.mts` 顶部 `title` / `description` |
| 导航菜单 | `config.mts` → `themeConfig.nav` |
| 侧边栏结构 | `config.mts` → `themeConfig.sidebar` |
| GitHub 链接 | `config.mts` → `socialLinks` 和 `editLink`（搜「你的用户名」） |
| 首页内容 | `index.md` |
| 页脚文案 | `config.mts` → `themeConfig.footer` |
| 整体配色 | `config.mts` 加 CSS 变量，或新建 `.vitepress/theme/` |

## 📄 许可

MIT License —— 随意修改使用。

---

**祝写作愉快 🎉**
