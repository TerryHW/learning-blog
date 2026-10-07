import { defineConfig } from 'vitepress'

// ===== base 路径（GitHub Pages 部署的关键！）=====
// GitHub Pages 会把站点放在 https://用户名.github.io/仓库名/ 子路径下，
// 此时必须设置 base: '/仓库名/'，否则页面样式全部丢失、白屏。
// 用法：构建时设置环境变量，本地开发不用动：
//   GitHub Pages 部署 →  set VP_BASE=/learning-blog/  (Windows CMD)
//   云端由 .github/workflows/deploy.yml 自动处理
// 如果仓库命名为 用户名.github.io（个人主页仓库），则保持 base 为 '/' 即可。
const base = process.env.VP_BASE || '/'

export default defineConfig({
  // ===== 站点基本信息 =====
  base,
  title: '我的学习笔记',
  description: '记录和整理学习过程中的知识点与实战案例',
  lang: 'zh-CN',

  // 站点图标：把 favicon.ico 放到 public/ 目录后取消下面注释
  // head: [['link', { rel: 'icon', href: '/favicon.ico' }]],

  // 生成 sitemap（绑定自定义域名后建议开启，利于 SEO）
  // sitemap: { hostname: 'https://你的域名.com' },

  themeConfig: {
    // ===== 顶部导航 =====
    nav: [
      { text: '首页', link: '/' },
      { text: '📚 知识点', link: '/notes/' },
      { text: '🛠 实战案例', link: '/cases/' },
      { text: '关于', link: '/about' }
    ],

    // ===== 侧边栏（按路径自动切换）=====
    // 访问 /notes/ 显示第一组，访问 /cases/ 显示第二组
    sidebar: {
      '/notes/': [
        {
          text: '💡 基础知识点',
          collapsed: false,
          items: [
            { text: 'Git 常用命令速查', link: '/notes/git-basics' },
            { text: 'Python 虚拟环境', link: '/notes/python-virtualenv' },
            { text: 'Markdown 写作语法', link: '/notes/markdown-syntax' },
			{ text: 'MySQL使用参考手册', link:'/notes/MySQL使用参考手册'}
          ]
        }
      ],
      '/cases/': [
        {
          text: '🛠 实战案例记录',
          collapsed: false,
          items: [
            { text: '搭建第一个 API 服务', link: '/cases/first-api' },
            { text: '免费 CMS 博客上线实录', link: '/cases/blog-deploy' },
			{ text: '学生成绩管理系统', link: '/cases/StudentManageSystem' },
			{ text: '通讯录', link: '/cases/Contacts' }
          ]
        }
      ]
    },

    // ===== 本地全文搜索（VitePress 内置，无需装插件）=====
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '没有找到相关内容',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
    },

    // ===== 右侧大纲 =====
    outline: {
      level: [2, 3],
      label: '本页目录'
    },

    // ===== 社交/仓库链接（改成你自己的 GitHub）=====
    socialLinks: [
      { icon: 'github', link: 'https://github.com/你的用户名' }
    ],

    // ===== 底部翻页 =====
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },

    // ===== 页脚 =====
    footer: {
      message: '记录 · 整理 · 沉淀 | 基于 VitePress 构建',
      copyright: 'Copyright © 2026 · 持续学习中'
    },

    // ===== 最后更新时间（读取 Git 提交时间）=====
    lastUpdated: {
      text: '最后更新于',
      formatOptions: { dateStyle: 'medium', timeStyle: 'short' }
    },

    // ===== 编辑此页链接 =====
    editLink: {
      pattern: 'https://github.com/你的用户名/learning-blog/edit/main/:path',
      text: '在 GitHub 上编辑此页'
    },

    // ===== 界面文案 =====
    darkModeSwitchLabel: '主题',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
    outlineTitle: '本页目录',
    lastUpdatedText: '最后更新于'
  }
})
