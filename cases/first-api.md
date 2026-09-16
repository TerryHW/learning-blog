---
title: 搭建第一个 API 服务
description: 用 Flask 从零搭建一个能被外部访问的 REST API，含常见报错与解法
---

# 搭建第一个 API 服务

> 第一次让浏览器之外的程序能"对话"，记录完整过程。

## 目标

写一个本地运行的 Python 服务，提供一个接口：访问 `/api/user/1` 返回用户信息 JSON。

## 环境与版本

- Python `3.13`
- Flask `3.0.x`
- 系统：Windows（部分命令与 Mac 有差异，已标注）

## 步骤

### 1. 建虚拟环境并安装 Flask

```bash
mkdir my-api && cd my-api
python -m venv venv
source venv/Scripts/activate        # Windows Git Bash；Mac 用 source venv/bin/activate
pip install flask
```

### 2. 写代码

```python
# app.py
from flask import Flask, jsonify

app = Flask(__name__)

# 模拟数据（真实项目这里应该连数据库）
USERS = {
    1: {"id": 1, "name": "张三", "role": "admin"},
    2: {"id": 2, "name": "李四", "role": "user"},
}

@app.route("/api/user/<int:user_id>")
def get_user(user_id):
    user = USERS.get(user_id)
    if not user:
        return jsonify({"error": "用户不存在"}), 404
    return jsonify(user)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
```

### 3. 启动

```bash
python app.py
```

看到类似输出就成功了：

```
* Running on http://127.0.0.1:5000
* Debug mode: on
```

浏览器访问 `http://127.0.0.1:5000/api/user/1`，返回：

```json
{"id": 1, "name": "张三", "role": "admin"}
```

## 踩过的坑

::: danger 坑 1：外部访问不到
**现象**：本机可以访问，同一 WiFi 下的手机访问不了。

**原因**：`app.run()` 默认只监听 `127.0.0.1`（本机回环地址）。

**解法**：加 `host="0.0.0.0"`，监听所有网卡。

```python {5}
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",    # 关键：允许外部访问
        port=5000,
        debug=True
    )
```
:::

::: warning 坑 2：端口被占用
**现象**：报错 `Address already in use`。

**原因**：5000 端口被其他程序占了。

**解法**：换个端口，或者找出占用程序。

```bash
# 换端口最简单
app.run(port=5001)

# 想查是谁占了（Windows）
netstat -ano | findstr :5000
taskkill /PID <进程号> /F
```
:::

::: info 坑 3：改代码不生效
**现象**：改了 `app.py`，刷新页面没变化。

**原因**：没开 `debug=True`，Flask 不会自动重载。

**解法**：加上 `debug=True`（已经在上面代码里了）。注意生产环境**千万不能开**，会泄露代码。
:::

## 最终成果

一个能响应 GET 请求、处理 404 的 REST API。可以用 curl 验证：

```bash
curl http://127.0.0.1:5000/api/user/1
curl http://127.0.0.1:5000/api/user/999    # 返回 {"error": "用户不存在"}
```

## 复盘

- ✅ **学会了**：路由 + JSON 响应 + 状态码返回的基本套路
- ⚠️ **注意**：`debug=True` 只用于开发，上线必须关掉
- 🔜 **下一步**：加上 POST 接口接收数据 → 接 SQLite 数据库 → 部署到服务器

::: tip 延伸思考
这个服务现在只能在本地跑。要让它 7×24 小时能被任何人访问，就需要部署到服务器——这也是我开始研究那些免费服务器方案的原因。
:::
