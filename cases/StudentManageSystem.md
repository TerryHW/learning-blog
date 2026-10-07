# Python 每日一练 · 案例需求

> 日期：2026-07-25  
> 主题：学生成绩管理系统（Console 版）  
> 预计耗时：1.5 ~ 2.5 小时  
> 难度：★★☆☆☆

---

## 一、项目背景

开发一个基于控制台的**学生成绩管理系统**。系统帮助学生管理多门课程的考试成绩，支持学生信息的增删改查、成绩录入与修改、以及多维度的统计分析。数据使用 JSON 文件持久化存储。

本项目重点练习：**面向对象编程（类与对象）、JSON 序列化、列表/字典操作、排序与聚合、异常处理、菜单驱动的 CLI 设计**。

---

## 二、功能需求

程序启动后，显示主菜单并循环等待用户输入，直到用户选择退出。

```
======= 学生成绩管理系统 =======
1. 添加学生
2. 删除学生
3. 查看学生信息
4. 录入/修改成绩
5. 全班成绩总览
6. 单科统计分析
7. 排名报表
8. 按条件筛选
0. 退出系统
================================
```

### 2.1 添加学生

- 输入：学号、姓名。
- 校验规则：
  - 学号不能为空，且不能与已有学号重复。
  - 姓名不能为空。
- 新增学生的成绩字典初始为空 `{}`。
- 提示"学生 XXX（学号：XXX）已添加"。
- 自动保存到 JSON 文件。

### 2.2 删除学生

- 按学号删除学生及其所有成绩。
- 删除前要求确认（输入 `y` 确认）。
- 若学号不存在，给出提示。

### 2.3 查看学生信息

- 按学号查询，展示该学生的姓名、学号，以及各科成绩列表。
- 如该学生尚无成绩，提示"暂无成绩记录"。
- 若学号不存在，给出提示。

### 2.4 录入/修改成绩

- 先输入学号定位学生（不存在则提示）。
- 再输入科目名称（如"语文""数学""英语"等，科目名自由输入）。
- 再输入分数。
- 校验：分数必须在 0 ~ 100 之间（含边界），否则提示重新输入。
- 若该科目已有成绩则覆盖，否则新增。
- 操作成功后自动保存。

### 2.5 全班成绩总览

- 以表格形式列出所有学生的学号、姓名，以及**各科成绩汇总表格**。
- 输出示例：

```
学号       姓名      语文    数学    英语
-----------------------------------------
2024001    张三      85      92      78
2024002    李四      90      88      95
2024003    王五       -      76      82        # 未录入的成绩显示 "-"
-----------------------------------------
```

- 注意：不同学生可能录入了不同科目，表格的列（科目）需要**动态收集**所有出现过的科目名，并按字母/拼音排序展示。

### 2.6 单科统计分析

- 用户输入科目名称。
- 若该科目没有任何学生有成绩，提示后返回。
- 输出统计信息：
  - 参考人数
  - 平均分（保留一位小数）
  - 最高分（同时显示获得该分数的学生姓名）
  - 最低分（同时显示获得该分数的学生姓名）
  - 及格率（60 分及以上为及格，显示百分比，如 75.0%）

### 2.7 排名报表

- 按**总分**从高到低排名。
- 合计所有已录入科目的分数作为总分。
- 只展示至少有一科成绩的学生。
- 输出格式：

```
排名  学号       姓名      总分    科目数
-----------------------------------------
1     2024002    李四      273     3
2     2024001    张三      255     3
3     2024003    王五      158     2
```

### 2.8 按条件筛选

- 提供子菜单，支持三种筛选方式：
  1. **按科目及格线筛选**：输入科目名和分数线，列出该科目达到该分数的所有学生及分数。
  2. **按总分达标线筛选**：输入总分线，列出总分 >= 该分数的学生。
  3. **查看不及格学生**：列出所有存在不及格科目（< 60 分）的学生及对应科目。
- 若无匹配结果，提示"未找到符合条件的学生"。

### 2.9 退出系统

- 保存数据到 JSON 文件后退出。
- 退出前输出"数据已保存，再见！"

---

## 三、数据存储

- 数据文件：`students.json`，程序启动时自动加载，每次增删改后自动保存。
- 结构设计：

```json
{
  "2024001": {
    "name": "张三",
    "scores": {
      "语文": 85,
      "数学": 92,
      "英语": 78
    }
  },
  "2024002": {
    "name": "李四",
    "scores": {
      "语文": 90,
      "数学": 88,
      "英语": 95
    }
  }
}
```

> **设计提示**：使用学号作为外层字典的键，方便 O(1) 查找。每个学生内部包含姓名 `name` 和成绩字典 `scores`（科目名 → 分数）。

---

## 四、技术要求

| 要求 | 说明 |
|------|------|
| 面向对象 | 至少定义一个 `Student` 类和一个 `GradeManager` 类来组织代码 |
| JSON 持久化 | 使用 `json` 标准库，注意 `ensure_ascii=False` 和 `indent=2` |
| 异常处理 | 文件读取失败或 JSON 格式损坏时，应给出提示并初始化为空数据 |
| 输入校验 | 对所有用户输入进行合理校验，给出友好提示而非直接崩溃 |
| 代码风格 | 函数命名清晰，适当添加注释，避免过长的函数（建议每个函数不超过 40 行） |

---

## 五、运行示例

```
======= 学生成绩管理系统 =======
1. 添加学生
2. 删除学生
3. 查看学生信息
4. 录入/修改成绩
5. 全班成绩总览
6. 单科统计分析
7. 排名报表
8. 按条件筛选
0. 退出系统
================================
请选择操作：1

请输入学号：2024001
请输入姓名：张三
学生"张三"（学号：2024001）已添加。

请选择操作：4
请输入学号：2024001
请输入科目：语文
请输入分数（0-100）：85
成绩已保存：张三 - 语文 = 85

请选择操作：4
请输入学号：2024001
请输入科目：数学
请输入分数（0-100）：92
成绩已保存：张三 - 数学 = 92

请选择操作：6
请输入科目名称：数学

【数学 统计分析】
  参考人数：1
  平均分：92.0
  最高分：92（张三）
  最低分：92（张三）
  及格率：100.0%
```

---

## 六、扩展挑战（选做）

完成基础版本后，可尝试以下扩展：

1. **成绩导入导出**：支持从 CSV 文件批量导入成绩，或将统计报表导出为 CSV。
2. **加权平均**：为每门科目设置学分/权重，计算加权平均分。
3. **历史记录**：每次修改成绩时记录变更日志，支持查看某学生的成绩修改历史。
4. **ANSI 彩色输出**：使用 ANSI 转义码让不及格分数显示为红色，优秀（>=90）显示为绿色。
5. **多班级管理**：支持创建多个班级，每个班级独立管理一组学生。

---




# Python 每日一练 · 参考解答

> 日期：2026-07-25  
> 主题：学生成绩管理系统

---

## 完整参考实现

```python
"""
学生成绩管理系统 - 控制台版
============================
一个基于命令行的学生成绩管理工具，支持学生信息管理、
成绩录入、多维度统计分析与排名功能。
"""

import json
import os

# ─── 数据文件路径 ─────────────────────────────────────────
DATA_FILE = "students.json"


# ═══════════════════════════════════════════════════════════
#  Student 类：封装单个学生的数据与行为
# ═══════════════════════════════════════════════════════════

class Student:
    """学生类，存储学号、姓名和成绩字典。"""

    def __init__(self, student_id: str, name: str, scores: dict = None):
        self.student_id = student_id   # 学号（唯一标识）
        self.name = name               # 姓名
        self.scores = scores or {}     # 成绩字典：{科目: 分数}

    def add_score(self, subject: str, score: int):
        """添加或更新一门科目的成绩。"""
        self.scores[subject] = score

    def get_total_score(self) -> int:
        """计算总分（所有已录入科目的分数之和）。"""
        return sum(self.scores.values())

    def get_subject_count(self) -> int:
        """返回已录入成绩的科目数。"""
        return len(self.scores)

    def get_average(self) -> float:
        """计算平均分，无成绩时返回 0.0。"""
        if not self.scores:
            return 0.0
        return sum(self.scores.values()) / len(self.scores)

    def has_failed_subjects(self) -> list:
        """返回不及格（< 60 分）的科目名列表。"""
        return [subj for subj, s in self.scores.items() if s < 60]

    def to_dict(self) -> dict:
        """将学生对象序列化为字典，用于 JSON 保存。"""
        return {
            "name": self.name,
            "scores": self.scores,
        }

    @classmethod
    def from_dict(cls, student_id: str, data: dict):
        """从字典反序列化创建 Student 对象。"""
        return cls(
            student_id=student_id,
            name=data.get("name", ""),
            scores=data.get("scores", {}),
        )


# ═══════════════════════════════════════════════════════════
#  GradeManager 类：管理全部学生与业务逻辑
# ═══════════════════════════════════════════════════════════

class GradeManager:
    """成绩管理主类，负责数据加载、持久化和所有业务操作。"""

    def __init__(self):
        self.students: dict[str, Student] = {}  # 学号 → Student 对象
        self.load()

    # ── 数据持久化 ──────────────────────────────────────

    def load(self):
        """从 JSON 文件加载数据。文件不存在或损坏时初始化为空。"""
        if not os.path.exists(DATA_FILE):
            return
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.students = {
                sid: Student.from_dict(sid, info)
                for sid, info in data.items()
            }
        except (json.JSONDecodeError, TypeError):
            print("⚠️  数据文件损坏，已初始化为空数据。")

    def save(self):
        """将当前数据保存到 JSON 文件。"""
        data = {
            sid: stu.to_dict() for sid, stu in self.students.items()
        }
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    # ── 学生管理 ────────────────────────────────────────

    def add_student(self):
        """添加新学生。"""
        sid = input("请输入学号：").strip()
        if not sid:
            print("❌ 学号不能为空。")
            return
        if sid in self.students:
            print(f"❌ 学号 {sid} 已存在。")
            return

        name = input("请输入姓名：").strip()
        if not name:
            print("❌ 姓名不能为空。")
            return

        self.students[sid] = Student(sid, name)
        self.save()
        print(f"✅ 学生"{name}"（学号：{sid}）已添加。")

    def delete_student(self):
        """删除学生及其全部成绩。"""
        sid = input("请输入要删除的学号：").strip()
        if sid not in self.students:
            print(f"❌ 学号 {sid} 不存在。")
            return

        name = self.students[sid].name
        confirm = input(f"确认删除学生"{name}"（学号：{sid}）？(y/n)：").strip().lower()
        if confirm == "y":
            del self.students[sid]
            self.save()
            print(f"✅ 学生"{name}"已删除。")
        else:
            print("已取消删除。")

    def view_student(self):
        """查看单个学生信息。"""
        sid = input("请输入学号：").strip()
        if sid not in self.students:
            print(f"❌ 学号 {sid} 不存在。")
            return

        stu = self.students[sid]
        print(f"\n{'─' * 30}")
        print(f"  学号：{stu.student_id}")
        print(f"  姓名：{stu.name}")

        if not stu.scores:
            print("  暂无成绩记录")
        else:
            print(f"  成绩：")
            for subject, score in sorted(stu.scores.items()):
                flag = " ⚠️ 不及格" if score < 60 else ""
                print(f"    {subject}：{score}{flag}")
        print(f"{'─' * 30}\n")

    # ── 成绩管理 ────────────────────────────────────────

    def enter_score(self):
        """录入或修改成绩。"""
        sid = input("请输入学号：").strip()
        if sid not in self.students:
            print(f"❌ 学号 {sid} 不存在。")
            return

        stu = self.students[sid]
        subject = input("请输入科目：").strip()
        if not subject:
            print("❌ 科目不能为空。")
            return

        # 循环输入直到获得合法的分数
        while True:
            try:
                score_input = input("请输入分数（0-100）：").strip()
                score = int(score_input)
                if 0 <= score <= 100:
                    break
                else:
                    print("❌ 分数必须在 0-100 之间。")
            except ValueError:
                print("❌ 请输入有效的整数。")

        stu.add_score(subject, score)
        self.save()
        print(f"✅ 成绩已保存：{stu.name} - {subject} = {score}")

    # ── 全班成绩总览 ────────────────────────────────────

    def overview(self):
        """以表格形式展示全班所有学生的各科成绩。"""
        if not self.students:
            print("暂无学生数据。")
            return

        # 动态收集所有出现过的科目，按字母排序
        all_subjects = sorted(
            {subj for stu in self.students.values() for subj in stu.scores}
        )

        if not all_subjects:
            print("暂无成绩数据。")
            return

        # 表头
        header = f"{'学号':<10} {'姓名':<8}"
        for subj in all_subjects:
            header += f" {subj:>6}"
        print(f"\n{header}")
        print("-" * len(header))

        # 数据行
        for sid in sorted(self.students.keys()):
            stu = self.students[sid]
            row = f"{sid:<10} {stu.name:<8}"
            for subj in all_subjects:
                score = stu.scores.get(subj)
                if score is not None:
                    row += f" {score:>6}"
                else:
                    row += f" {'-':>6}"
            print(row)

        print("-" * len(header))
        print(f"共 {len(self.students)} 名学生\n")

    # ── 单科统计分析 ────────────────────────────────────

    def subject_stats(self):
        """对指定科目进行统计分析。"""
        subject = input("请输入科目名称：").strip()
        if not subject:
            print("❌ 科目不能为空。")
            return

        # 收集该科目所有成绩
        scores_list = []
        for stu in self.students.values():
            if subject in stu.scores:
                scores_list.append((stu.name, stu.scores[subject]))

        if not scores_list:
            print(f"❌ 科目"{subject}"暂无成绩数据。")
            return

        # 统计计算
        scores_only = [s for _, s in scores_list]
        count = len(scores_only)
        avg = sum(scores_only) / count
        max_score = max(scores_only)
        min_score = min(scores_only)
        pass_count = sum(1 for s in scores_only if s >= 60)
        pass_rate = pass_count / count * 100

        # 找出最高分和最低分的学生姓名
        max_students = [name for name, s in scores_list if s == max_score]
        min_students = [name for name, s in scores_list if s == min_score]

        print(f"\n{'─' * 30}")
        print(f"【{subject} 统计分析】")
        print(f"  参考人数：{count}")
        print(f"  平均分：{avg:.1f}")
        print(f"  最高分：{max_score}（{', '.join(max_students)}）")
        print(f"  最低分：{min_score}（{', '.join(min_students)}）")
        print(f"  及格率：{pass_rate:.1f}%")
        print(f"{'─' * 30}\n")

    # ── 排名报表 ────────────────────────────────────────

    def ranking(self):
        """按总分排名展示。"""
        # 筛选出至少有一科成绩的学生，计算总分
        ranked = []
        for stu in self.students.values():
            if stu.scores:
                ranked.append((
                    stu.student_id,
                    stu.name,
                    stu.get_total_score(),
                    stu.get_subject_count(),
                ))

        if not ranked:
            print("暂无成绩数据，无法排名。")
            return

        # 按总分降序排列
        ranked.sort(key=lambda x: x[2], reverse=True)

        # 输出排名表
        header = f"{'排名':<6} {'学号':<10} {'姓名':<8} {'总分':>6} {'科目数':>6}"
        print(f"\n{header}")
        print("-" * len(header))

        for rank, (sid, name, total, count) in enumerate(ranked, 1):
            row = f"{rank:<6} {sid:<10} {name:<8} {total:>6} {count:>6}"
            print(row)

        print("-" * len(header))
        print(f"共 {len(ranked)} 名有成绩的学生\n")

    # ── 条件筛选 ────────────────────────────────────────

    def filter_students(self):
        """按条件筛选学生。"""
        print("\n--- 筛选条件 ---")
        print("1. 按科目及格线筛选")
        print("2. 按总分达标线筛选")
        print("3. 查看不及格学生")
        print("----------------")

        choice = input("请选择筛选方式：").strip()

        if choice == "1":
            self._filter_by_subject()
        elif choice == "2":
            self._filter_by_total()
        elif choice == "3":
            self._show_failed()
        else:
            print("❌ 无效选项。")

    def _filter_by_subject(self):
        """筛选指定科目达到指定分数的学生。"""
        subject = input("请输入科目名称：").strip()
        if not subject:
            print("❌ 科目不能为空。")
            return

        try:
            threshold = int(input("请输入分数线：").strip())
        except ValueError:
            print("❌ 请输入有效的整数。")
            return

        results = []
        for stu in self.students.values():
            if subject in stu.scores and stu.scores[subject] >= threshold:
                results.append((stu.student_id, stu.name, stu.scores[subject]))

        if not results:
            print(f"未找到 {subject} 成绩 >= {threshold} 的学生。")
            return

        print(f"\n{subject} 成绩 >= {threshold} 的学生：")
        for sid, name, score in sorted(results, key=lambda x: x[2], reverse=True):
            print(f"  {sid}  {name}  {score}分")
        print()

    def _filter_by_total(self):
        """筛选总分达到指定线的学生。"""
        try:
            threshold = int(input("请输入总分线：").strip())
        except ValueError:
            print("❌ 请输入有效的整数。")
            return

        results = []
        for stu in self.students.values():
            total = stu.get_total_score()
            if total >= threshold:
                results.append((stu.student_id, stu.name, total))

        if not results:
            print(f"未找到总分 >= {threshold} 的学生。")
            return

        print(f"\n总分 >= {threshold} 的学生：")
        for sid, name, total in sorted(results, key=lambda x: x[2], reverse=True):
            print(f"  {sid}  {name}  总分：{total}")
        print()

    def _show_failed(self):
        """列出所有存在不及格科目的学生。"""
        results = []
        for stu in self.students.values():
            failed = stu.has_failed_subjects()
            if failed:
                results.append((stu.student_id, stu.name, failed))

        if not results:
            print("🎉 所有学生均无不及格科目！")
            return

        print("\n存在不及格科目的学生：")
        for sid, name, failed in results:
            detail = "、".join(f"{subj}({stu.scores.get(subj, '?')}分)" 
                               for subj in failed)
            # stu 在循环中不可直接访问，修正如下
            detail = "、".join(
                f"{subj}({self.students[sid].scores[subj]}分)"
                for subj in failed
            )
            print(f"  {sid}  {name}：{detail}")
        print()

    # ── 主菜单 ──────────────────────────────────────────

    @staticmethod
    def show_menu():
        """显示主菜单。"""
        print("\n======= 学生成绩管理系统 =======")
        print("1. 添加学生")
        print("2. 删除学生")
        print("3. 查看学生信息")
        print("4. 录入/修改成绩")
        print("5. 全班成绩总览")
        print("6. 单科统计分析")
        print("7. 排名报表")
        print("8. 按条件筛选")
        print("0. 退出系统")
        print("================================")

    def run(self):
        """主循环：显示菜单、处理用户输入。"""
        menu_actions = {
            "1": self.add_student,
            "2": self.delete_student,
            "3": self.view_student,
            "4": self.enter_score,
            "5": self.overview,
            "6": self.subject_stats,
            "7": self.ranking,
            "8": self.filter_students,
        }

        while True:
            self.show_menu()
            choice = input("请选择操作：").strip()

            if choice == "0":
                self.save()
                print("数据已保存，再见！")
                break
            elif choice in menu_actions:
                try:
                    menu_actions[choice]()
                except Exception as e:
                    print(f"❌ 发生未知错误：{e}")
            else:
                print("❌ 无效选项，请重新输入。")


# ═══════════════════════════════════════════════════════════
#  程序入口
# ═══════════════════════════════════════════════════════════

if __name__ == "__main__":
    manager = GradeManager()
    manager.run()
```

---

## 代码说明

### 1. 类的设计

| 类 | 职责 |
|---|---|
| `Student` | 学生数据模型：封装学号、姓名、成绩字典。提供 `to_dict()` / `from_dict()` 用于序列化。 |
| `GradeManager` | 业务逻辑层：数据加载/保存、所有菜单功能的实现。作为"控制器"协调各模块。 |

### 2. 关键设计决策

- **学号作为字典键**：`self.students` 是 `dict[str, Student]`，学号作为 key，保证 O(1) 查找效率。
- **即时保存**：每次增删改操作后立即调用 `self.save()`，避免意外退出时数据丢失。
- **动态科目列**：`overview()` 方法使用集合推导式收集所有学生出现过的科目名，表格列自动适应。
- **菜单映射**：使用 `menu_actions` 字典将菜单编号映射到对应方法，替代冗长的 if-elif 链。
- **异常保护**：主循环中 `try/except` 包裹每个操作，防止单个操作出错导致程序崩溃。

### 3. 涉及的 Python 知识点

- **面向对象**：类的定义、构造方法、实例方法、`@classmethod`
- **字典推导式**：`{sid: Student.from_dict(...) for ...}`
- **列表推导式**：`[subj for subj, s in ... if s < 60]`
- **sorted + lambda**：自定义排序键
- **try/except**：异常处理（文件读取、用户输入转换）
- **json 模块**：`json.load` / `json.dump` 与中文编码处理
- **字符串格式化**：f-string 配合 `<` `>` 对齐控制

---

