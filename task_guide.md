# 任务处理指南

## 概述

每次接到复杂任务时，使用这些脚本来规范执行流程。

## 快速开始

```bash
# 加载脚本
source /root/.openclaw/workspace/warhammer-game/task_scaffold.sh
```

## 命令列表

### 1. 任务启动
```bash
task_handle "任务名" "描述" "步骤1,步骤2,步骤3,步骤4"
```
输出完整的任务处理清单模板。

### 2. 需求确认
```bash
task_confirm
```
在动手之前，确认需求。

### 3. 最终自查
```bash
task_check
```
交付前必须检查的项目。

### 4. 进度显示
```bash
task_progress 10 3
```
显示进度条（总数 已完成）。

## Python版（更完整）

```python
from task_manager import TaskManager, print_task_template

tm = TaskManager()

# 1. 启动任务
tm.start_task("战斗系统设计", "详细设计")

# 2. 拆分步骤
steps = ["需求分析", "方案设计", "代码实现", "测试验证"]
tm.split_steps(steps)

# 3. 打印模板
print_task_template("战斗系统设计", "详细设计", steps)

# 4. 完成步骤
tm.complete_step("需求分析", notes="用户要回合制")

# 5. 自查
check = tm.final_check()
for item in check["checklist"]:
    print(item)

# 6. 保存记录
tm.save_task()
```

## 任务处理标准流程

```
┌─────────────────────────────────────┐
│ 1. 接收任务                          │
│    → 不立即动手，先理解              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 2. 需求确认                          │
│    → task_confirm                   │
│    → 列出问题清单                    │
│    → 确认后再动                      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 3. 步骤拆分                          │
│    → task_handle 或 split_steps     │
│    → 列出所有步骤                    │
│    → 预估时间                        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 4. 逐步执行                          │
│    → 每完成一步报告进度              │
│    → 遇到问题及时沟通                │
│    → task_progress 显示进度          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 5. 最终自查                          │
│    → task_check                     │
│    → 逐项检查                        │
│    → 确保可直接使用                  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 6. 交付                              │
│    → 完整交付物 + 使用说明           │
│    → 等用户确认OK                    │
└─────────────────────────────────────┘
```

## 核心原则

| 原则 | 说明 |
|------|------|
| 不急于动手 | 先理解需求 |
| 分步骤 | 不贪多 |
| 常自查 | 交付前检查 |
| 及时报告 | 进度透明 |
| 等确认 | 用户OK才算完 |

## 位置

- 脚本：`/root/.openclaw/workspace/warhammer-game/task_scaffold.sh`
- Python：`/root/.openclaw/workspace/warhammer-game/task_manager.py`
- 指南：`/root/.openclaw/workspace/warhammer-game/task_guide.md`

## 下次任务使用示例

接到"设计战斗系统"任务时：

```bash
source /root/.openclaw/workspace/warhammer-game/task_scaffold.sh

task_handle "战斗系统设计" "详细设计" "数值公式,流程设计,代码实现,验证测试"

# 然后按模板一步步执行...
```
