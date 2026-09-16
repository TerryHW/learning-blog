---
title: 免费 CMS 博客上线实录
description: 用 VitePress + Cloudflare Pages 搭建个人博客并上线，零成本永久免费
---

# 免费博客上线实录

> 想有个地方记录学习笔记，又不想花钱买服务器——记录这次从 0 到上线的完整过程。

## 目标

搭建一个能长期维护的学习博客，要求：

- ✅ **免费**（永久，不是试用）
- ✅ 写 Markdown 就能发布
- ✅ 有搜索、有暗黑模式
- ✅ 国内能正常访问

## 技术选型

调研了几种方案后对比：

| 方案 | 费用 | 维护成本 | 国内访问 | 结论 |
|------|------|----------|----------|------|
| VitePress + Cloudflare Pages | ¥0 永久 | 极低 | 较好 | ✅ **选它** |
| WordPress + 虚拟主机 | ¥100+/年 | 高（要更新补丁） | 好 | ❌ 要钱 |
| 自建 VPS（Oracle 免费） | ¥0 | 高（要配 Nginx、SSL） | 一般 | ⚠️ 太折腾 |
| GitHub Pages | ¥0 | 低 | 一般 | ⚠️ 备选 |

**决定理由**：静态博客没有数据库和后台，天然安全省事；Cloudflare Pages 免费额度给得足，还自带全球 CDN。

## 步骤

### 1. 初始化项目

```bash
mkdir learning-blog && cd learning-blog
npm init -y
npm install -D vitepress
```

### 2. 核心配置

创建 `.vitepress/config.mts`，配置导航、侧边栏、搜索（详见项目源码）。

### 3. 本地预览

```bash
npm run dev
# ➜ Local: http://localhost:5173/
```

这一步就能看到完整效果，边写边看。

### 4. 推送到 GitHub

```bash
git init
git add .
git commit -m "init: 博客项目初始化"
git remote add origin git@github.com:用户名/learning-blog.git
git push -u origin main
```

### 5. 接入 Cloudflare Pages

在 Cloudflare 控制台 → Workers & Pages → Create → Pages → Connect to Git，填写：

| 配置项 | 值 |
|--------|-----|
| Build command | `npm run build` |
| Build output directory | **`.vitepress/dist`** |

::: danger 关键坑：输出目录
VitePress 的产物在 **`.vitepress/dist`**，不是常见的 `dist`。

**填错的表现**：部署"成功"但打开是 404 白屏。

如果是多目录结构，路径需要对应调整。这是整个流程最容易卡住的一步。
:::

### 6. 上线

点 Save and Deploy，等待 1 分钟左右，拿到 `xxx.pages.dev` 域名。

## 踩过的坑

::: warning 坑 1：构建成功但页面 404
**现象**：Cloudflare 显示部署成功，打开却是 404。

**原因**：Build output directory 填成了 `dist`。

**解法**：改成 `.vitepress/dist`。
:::

::: info 坑 2：Node 版本问题
**现象**：本地能构建，Cloudflare 上报错。

**原因**：本地 Node 版本和云端不一致。

**解法**：在 Cloudflare 项目设置里加环境变量指定版本：

```
NODE_VERSION = 22
```
:::

::: tip 坑 3：侧边栏不更新
**现象**：新增了 Markdown 文件，侧边栏没出现。

**原因**：忘记在 `config.mts` 的 `sidebar` 里注册。

**解法**：手动加一行配置（本项目已包含注释说明）。
:::

## 最终成果

- 🌐 公网可访问：`https://xxx.pages.dev`
- 💰 费用：¥0
- ⚡ 部署耗时：约 1 分钟（git push 后自动触发）

## 复盘

::: tip 最大的收获
**写作和发布彻底分离了心智负担**。现在写完 Markdown，`git push` 一下就完事，剩下的交给自动化。这种顺畅感让我更愿意持续记录。

以前总觉得要"准备好"才开始写，现在明白：**先有个能随时记录的地方，比追求完美重要得多**。
:::

### 后续想加的

- [ ] 绑定自定义域名
- [ ] 加 Google Analytics 统计
- [ ] 首页加最近更新列表
- [ ] 文章标签分类
