---
title: Git 常用命令速查
description: 日常开发中最常用的 Git 命令与典型工作流，附常见报错的处理方法
---

# Git 常用命令速查

Git 命令很多，但**日常真正高频用的就这十几条**。按场景分组记忆比背完整命令表有效得多。

## 一、最基础的四步

每次改完代码要走的标准流程：

```bash
git status                    # 1. 看看改了哪些文件
git add .                     # 2. 把改动加入暂存区
git commit -m "说明这次改了啥"  # 3. 提交到本地仓库
git push                      # 4. 推送到远程仓库
```

::: warning 关于 commit message
不要写"修改""更新""123"这种。三个月后你会完全看不懂当时改了什么。

推荐写法：`类型: 简短描述`，例如 `feat: 新增登录接口`、`fix: 修复首页 404`。
:::

## 二、分支操作

```bash
git branch                    # 查看本地所有分支
git branch feature/login      # 创建分支
git checkout feature/login    # 切换分支
git checkout -b hotfix/bug    # 创建并切换（合二为一，最常用）
git branch -d feature/login   # 删除已合并的分支
git merge feature/login       # 把该分支合并到当前分支
```

## 三、后悔药（撤销操作）

这是最容易慌的场景，记住这三板斧：

| 场景 | 命令 | 说明 |
|------|------|------|
| 文件改了但还没 `add` | `git checkout -- 文件名` | 丢弃工作区修改 |
| 已经 `add` 了想撤回 | `git reset HEAD 文件名` | 从暂存区退回 |
| 已 `commit` 想反悔 | `git reset --soft HEAD^` | 撤销提交，代码保留 |
| 已 `commit` 且要丢弃代码 | `git reset --hard HEAD^` | ⚠️ 代码会消失，慎用 |

```bash
# 最常用：提交了才发现漏了文件，想重新提交
git add forgotten.txt
git commit --amend --no-edit    # 并入上一次提交，不改 message
```

::: danger ⚠️ 危险操作
`git reset --hard` 和 `git push --force` 会**不可逆地丢失代码**。执行前务必确认：
1. 改动是否真的不要了
2. 是否会影响别人的提交
:::

## 四、查看历史

```bash
git log                        # 查看提交历史
git log --oneline              # 精简版（推荐，一行一个）
git log --oneline --graph      # 图形化显示分支合并
git show <commit-id>           # 查看某次提交的具体改动
git diff                       # 查看未暂存的改动
```

## 五、我实际踩过的坑

### 提交了敏感信息怎么办

如果不小心把密码提交上去了：

```bash
# 1. 立刻改掉那个密码！（第一步永远是改密码）
# 2. 从历史中彻底删除文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch config.env" \
  --prune-empty --tag-name-filter cat -- --all
git push --force
```

**更好的做法是预防**：把 `.env` 写进 `.gitignore`，用 `.env.example` 模板代替。

### 本地改乱了想重来

```bash
# 只要还没 push，最保险的重置方式
git fetch origin
git reset --hard origin/main    # 完全同步远程状态，本地改动全丢
```

## 六、配置（只需做一次）

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
git config --global init.defaultBranch main
```

::: tip 记住
以上命令不需要全背下来。用得多了自然记住，**卡住的时候回到这篇翻一翻**就够了。
:::
