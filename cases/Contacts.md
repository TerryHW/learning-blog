# Python 每日一练 · 案例任务

> 日期：2026-07-21  
> 主题：JSON 联系人管理系统（Console 版）

---

## 一、案例项目详细需求

### 1. 项目背景

开发一个基于控制台的联系人管理系统。系统使用 JSON 文件持久化联系人数据，支持增、删、改、查、列表展示和按姓名搜索功能。适合练习 Python 的**字典操作、JSON 文件 I/O、函数拆分、输入校验和异常处理**。

### 2. 功能需求

程序启动后，显示菜单并循环等待用户输入，直到用户选择退出。

菜单选项：

```text
===== 联系人管理系统 =====
1. 添加联系人
2. 删除联系人
3. 修改联系人
4. 查询联系人
5. 列出全部联系人
6. 搜索联系人
0. 退出
==========================
```

#### 2.1 添加联系人

- 输入：姓名、手机号、邮箱（可选）、分组（可选，如 同事/朋友/家人）。
- 校验：
  - 姓名不能为空；
  - 手机号必须为 11 位数字；
  - 邮箱若输入，需包含 `@` 和 `.`。
- 如果姓名已存在，提示是否覆盖。
- 保存到 JSON 文件。

#### 2.2 删除联系人

- 按姓名删除。
- 删除前要求确认（Y/N）。
- 如果联系人不存在，给出提示。

#### 2.3 修改联系人

- 按姓名查找，可分别修改手机号、邮箱、分组。
- 某一项输入为空时，表示不修改该项。
- 若联系人不存在，给出提示。

#### 2.4 查询联系人

- 按姓名查询，展示该联系人的全部信息。
- 若不存在，给出提示。

#### 2.5 列出全部联系人

- 按姓名排序后展示。
- 如果没有联系人，提示“暂无联系人”。

#### 2.6 搜索联系人

- 支持按关键字模糊匹配姓名、手机号、分组。
- 展示所有匹配结果。

#### 2.7 退出

- 保存当前数据到 JSON 文件后退出。

### 3. 数据存储

- 数据文件：`contacts.json`
- 结构示例：

```json
{
  "张三": {
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "group": "同事"
  },
  "李四": {
    "phone": "13900139000",
    "email": "",
    "group": "朋友"
  }
}
```

### 4. 技术要求

- 使用标准库 `json` 进行读写。
- 使用函数拆分不同功能模块。
- 处理文件不存在的情况。
- 对非法输入进行友好提示。

### 5. 运行示例

```text
===== 联系人管理系统 =====
1. 添加联系人
2. 删除联系人
3. 修改联系人
4. 查询联系人
5. 列出全部联系人
6. 搜索联系人
0. 退出
==========================
请选择操作：1
请输入姓名：王五
请输入手机号：13700137000
请输入邮箱（直接回车跳过）：wangwu@example.com
请输入分组（直接回车跳过）：家人
联系人“王五”已添加。
```

---

## 二、案例开发答案（参考实现）

```python
import json
import os
import re

DATA_FILE = "contacts.json"


def load_contacts():
    """从 JSON 文件加载联系人数据。"""
    if not os.path.exists(DATA_FILE):
        return {}
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        print("数据文件损坏，将初始化空联系人列表。")
        return {}


def save_contacts(contacts):
    """将联系人数据保存到 JSON 文件。"""
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(contacts, f, ensure_ascii=False, indent=2)


def validate_phone(phone):
    """校验手机号是否为 11 位数字。"""
    return bool(re.fullmatch(r"\d{11}", phone))


def validate_email(email):
    """简单校验邮箱格式。"""
    if not email:
        return True
    return "@" in email and "." in email


def input_phone():
    """循环输入直到获得合法手机号。"""
    while True:
        phone = input("请输入手机号：").strip()
        if validate_phone(phone):
            return phone
        print("手机号格式不正确，请输入 11 位数字。")


def input_email():
    """循环输入直到获得合法邮箱。"""
    while True:
        email = input("请输入邮箱（直接回车跳过）：").strip()
        if validate_email(email):
            return email
        print("邮箱格式不正确，请重新输入。")


def add_contact(contacts):
    """添加联系人。"""
    name = input("请输入姓名：").strip()
    if not name:
        print("姓名不能为空。")
        return

    if name in contacts:
        confirm = input(f"联系人“{name}”已存在，是否覆盖？(y/n)：").strip().lower()
        if confirm != "y":
            print("已取消添加。")
            return

    phone = input_phone()
    email = input_email()
    group = input("请输入分组（直接回车跳过）：").strip()

    contacts[name] = {
        "phone": phone,
        "email": email,
        "group": group,
    }
    save_contacts(contacts)
    print(f"联系人“{name}”已添加。")


def delete_contact(contacts):
    """删除联系人。"""
    name = input("请输入要删除的姓名：").strip()
    if name not in contacts:
        print(f"联系人“{name}”不存在。")
        return

    confirm = input(f"确认删除联系人“{name}”？(y/n)：").strip().lower()
    if confirm == "y":
        del contacts[name]
        save_contacts(contacts)
        print(f"联系人“{name}”已删除。")
    else:
        print("已取消删除。")


def update_contact(contacts):
    """修改联系人。"""
    name = input("请输入要修改的姓名：").strip()
    if name not in contacts:
        print(f"联系人“{name}”不存在。")
        return

    contact = contacts[name]
    print(f"当前信息：{contact}")

    new_phone = input("请输入新手机号（直接回车不修改）：").strip()
    if new_phone:
        if validate_phone(new_phone):
            contact["phone"] = new_phone
        else:
            print("手机号格式不正确，未修改手机号。")

    new_email = input("请输入新邮箱（直接回车不修改）：").strip()
    if new_email:
        if validate_email(new_email):
            contact["email"] = new_email
        else:
            print("邮箱格式不正确，未修改邮箱。")

    new_group = input("请输入新分组（直接回车不修改）：").strip()
    if new_group:
        contact["group"] = new_group

    save_contacts(contacts)
    print(f"联系人“{name}”已更新。")


def query_contact(contacts):
    """按姓名查询单个联系人。"""
    name = input("请输入要查询的姓名：").strip()
    if name in contacts:
        show_contact(name, contacts[name])
    else:
        print(f"联系人“{name}”不存在。")


def list_contacts(contacts):
    """列出全部联系人。"""
    if not contacts:
        print("暂无联系人。")
        return

    print("\n--- 联系人列表 ---")
    for name in sorted(contacts):
        show_contact(name, contacts[name])
    print("------------------\n")


def search_contacts(contacts):
    """按关键字模糊搜索。"""
    keyword = input("请输入搜索关键字：").strip().lower()
    if not keyword:
        print("关键字不能为空。")
        return

    results = []
    for name, info in contacts.items():
        fields = [name, info.get("phone", ""), info.get("group", "")]
        if any(keyword in field.lower() for field in fields):
            results.append((name, info))

    if not results:
        print("未找到匹配的联系人。")
        return

    print(f"\n找到 {len(results)} 个结果：")
    for name, info in results:
        show_contact(name, info)


def show_contact(name, info):
    """格式化展示单个联系人。"""
    print(f"  姓名：{name}")
    print(f"  手机：{info.get('phone', '')}")
    print(f"  邮箱：{info.get('email', '') or '未填写'}")
    print(f"  分组：{info.get('group', '') or '未分组'}")
    print()


def show_menu():
    """显示主菜单。"""
    print("\n===== 联系人管理系统 =====")
    print("1. 添加联系人")
    print("2. 删除联系人")
    print("3. 修改联系人")
    print("4. 查询联系人")
    print("5. 列出全部联系人")
    print("6. 搜索联系人")
    print("0. 退出")
    print("==========================")


def main():
    contacts = load_contacts()

    while True:
        show_menu()
        choice = input("请选择操作：").strip()

        if choice == "1":
            add_contact(contacts)
        elif choice == "2":
            delete_contact(contacts)
        elif choice == "3":
            update_contact(contacts)
        elif choice == "4":
            query_contact(contacts)
        elif choice == "5":
            list_contacts(contacts)
        elif choice == "6":
            search_contacts(contacts)
        elif choice == "0":
            save_contacts(contacts)
            print("数据已保存，再见！")
            break
        else:
            print("无效选项，请重新输入。")


if __name__ == "__main__":
    main()
```

### 扩展挑战

完成基础版本后，可尝试以下扩展：

1. **按分组筛选**：增加菜单项，只显示某个分组的联系人。
2. **数据导出**：支持将联系人导出为 CSV 文件。
3. **生日字段**：增加生日字段，并在启动时提示当天过生日的联系人。
4. **命令行参数**：使用 `argparse` 支持通过命令行直接查询或添加联系人。

---

*祝你编码愉快！*
