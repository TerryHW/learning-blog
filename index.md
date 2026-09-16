---
layout: home

hero:
  name: "我的学习手册"
  text: "记录知识 · 沉淀成长"
  tagline: 边学边记，把踩过的坑变成路标
  actions:
    - theme: brand
      text: 开始阅读笔记
      link: /notes/
    - theme: alt
      text: 看实战案例
      link: /cases/

features:
  - icon: 💡
    title: 知识点整理
    details: 把零散学到的概念，整理成结构化的长期笔记。遗忘是常态，写下来才是自己的。
  - icon: 🛠
    title: 实战案例
    details: 记录真实动手过程的完整链路——背景、步骤、报错、解法，复盘才是真正的成长。
  - icon: 🔍
    title: 全文搜索
    details: 内置本地搜索引擎，写过的任何一句话都能秒级检索回来。
  - icon: 🌙
    title: 暗黑模式
    details: 深夜写笔记也不刺眼，一键切换护眼主题。
---

## 👋 这是什么地方

一个纯粹的自用学习档案库。这里记录的都是我在学习过程中：

- **搞懂的概念** → 归到 [📚 知识点笔记](/notes/)
- **动手做过的事** → 归到 [🛠 实战案例](/cases/)

不追求文采，只追求**下次遇到问题能立刻翻回来解决**。

## 📝 我怎么用它

每天学完新东西，花 5 分钟做两件事：

```bash
# 1. 在 notes/ 或 cases/ 下新建一个 Markdown 文件
# 2. 写完更新 .vitepress/config.mts 的侧边栏，然后推送
git add .
git commit -m "新增：XXX 学习笔记"
git push
```

推送完成 → Cloudflare 自动构建 → 30 秒后网站更新完毕。**写作即发布，没有中间步骤。**

::: tip 💡 想看看能写出什么效果？
翻翻 [Markdown 写作速查](/notes/markdown-syntax)，那里演示了本站支持的所有写作语法——包括代码块、表格、数学公式和这些彩色的提示框。
:::
