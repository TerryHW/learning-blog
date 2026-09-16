---
title: Python 虚拟环境
description: 为什么需要虚拟环境，以及 venv 的创建、激活、依赖导出全流程
---

# Python 虚拟环境

刚学 Python 时我一直用全局 pip 装包，直到两个项目需要**同一个库的不同版本**，才理解了虚拟环境的意义。

## 为什么需要它

想象这个场景：

- 项目 A 需要 `requests==2.25.1`（老项目）
- 项目 B 需要 `requests==2.31.0`（新项目）

全局只能装一个版本。**虚拟环境的作用就是给每个项目一个独立的"小房间"，互不干扰。**

::: info 本质是什么
虚拟环境就是在项目目录下建一个独立的 Python 解释器和 `site-packages` 目录。激活它，本质上只是**临时把终端的 `python`/`pip` 命令指向这个目录**。
:::

## 三步上手（venv）

Python 3.3+ 自带 `venv`，不需要装任何额外工具。

### 第一步：创建

```bash
cd my-project
python -m venv venv
```

::: tip Windows 和 Mac 的命令区别
Windows 用 `python`，Mac/Linux 通常是 `python3`：

```bash
python3 -m venv venv
```

如果 `python --version` 显示 3.x，用 `python` 就行。
:::

### 第二步：激活

```bash
# Windows (Git Bash / PowerShell)
source venv/Scripts/activate        # Git Bash
venv\Scripts\activate               # PowerShell / CMD

# Mac / Linux
source venv/bin/activate
```

激活成功的标志：**终端提示符前面出现 `(venv)`**。

```bash
(venv) $ pip install requests
(venv) $ python app.py
```

### 第三步：退出

```bash
deactivate
```

## 依赖管理（团队协作必备）

光有虚拟环境不够——别人拿到你的代码，怎么知道要装哪些包？

```bash
# 导出当前环境的依赖清单
pip freeze > requirements.txt

# 别人拿到项目后一键还原
pip install -r requirements.txt
```

生成的 `requirements.txt` 长这样：

```
requests==2.31.0
flask==3.0.0
numpy==1.26.0
```

::: warning 常见错误
不要在 `venv` 目录里直接做 `git add`。虚拟环境是**本地产物**，必须写进 `.gitignore`：

```
venv/
.venv/
env/
```

团队协作靠的是 `requirements.txt`，不是把几百 MB 的依赖传上去。
:::

## 我的常用习惯

```bash
# 新建项目时的标准流程
mkdir my-project && cd my-project
python -m venv venv
source venv/Scripts/activate        # Windows Git Bash
pip install --upgrade pip           # 顺手升级 pip
touch requirements.txt

# 之后每次装包都记得更新清单
pip install flask
pip freeze > requirements.txt
```

## 进阶：更现代的工具

等熟练后可以了解这些（不必现在就学）：

| 工具 | 特点 | 适合 |
|------|------|------|
| `venv` | Python 自带，零依赖 | ⭐ 初学者首选 |
| `virtualenv` | 更快，支持旧 Python | 需要兼容老项目 |
| `poetry` | 依赖锁定 + 打包发布一条龙 | 正经开源项目 |
| `uv` | Rust 写的，速度极快 | 追求极致体验 |

::: tip 建议
初学者把 `venv` 用熟就够了。等哪天你觉得"管理依赖好麻烦"，再去了解 `uv` 或 `poetry`。**工具是解决问题的，不是用来背的。**
:::
