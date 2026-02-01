#!/usr/bin/env python3
"""
任务管理器 - 伊莲娜的任务执行框架

使用方法：
1. 接收任务后，调用 confirm_task() 确认需求
2. 调用 split_task() 拆分成步骤
3. 每完成一步，调用 complete_step() 标记
4. 全部完成后，调用 final_check() 自查

"""

import json
import os
from datetime import datetime
from pathlib import Path

TASK_DIR = "/tmp/elena_tasks"

class TaskManager:
    def __init__(self):
        os.makedirs(TASK_DIR, exist_ok=True)
        self.current_task = None
    
    def start_task(self, task_name, description):
        """开始一个新任务"""
        task_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.current_task = {
            "id": task_id,
            "name": task_name,
            "description": description,
            "steps": [],
            "completed_steps": [],
            "start_time": datetime.now().isoformat(),
            "status": "in_progress"
        }
        return self.current_task
    
    def confirm_requirements(self, requirements):
        """
        确认需求（模板）
        
        接收任务后立即调用：
        
        task.confirm_requirements([
            "目标是什么？",
            "验收标准是什么？",
            "有无特殊要求？"
        ])
        """
        return {
            "checklist": requirements,
            "answered": {},
            "timestamp": datetime.now().isoformat()
        }
    
    def split_steps(self, steps):
        """
        拆分任务步骤（模板）
        
        steps = [
            "步骤1：需求分析",
            "步骤2：方案设计", 
            "步骤3：代码实现",
            "步骤4：验证测试"
        ]
        """
        numbered = []
        for i, step in enumerate(steps, 1):
            numbered.append(f"[ ] {i}. {step}")
        
        return {
            "total_steps": len(steps),
            "steps": numbered,
            "checklist": steps
        }
    
    def complete_step(self, step_description, notes=""):
        """标记步骤完成"""
        if self.current_task:
            self.current_task["completed_steps"].append({
                "step": step_description,
                "notes": notes,
                "completed_at": datetime.now().isoformat()
            })
            return self.get_progress()
        return None
    
    def get_progress(self):
        """获取进度"""
        if not self.current_task:
            return None
        total = len(self.current_task["steps"])
        completed = len(self.current_task["completed_steps"])
        return {
            "progress": f"{completed}/{total}",
            "percentage": int(completed/total*100) if total > 0 else 100,
            "remaining_steps": [s for s in self.current_task["steps"] if s not in [c["step"] for c in self.current_task["completed_steps"]]]
        }
    
    def final_check(self):
        """
        最终自查（模板）
        
        返回检查清单，让AI自查：
        """
        return {
            "checklist": [
                "需求确认了吗？每项都理解对了吗？",
                "所有步骤都完成了吗？有没有遗漏？",
                "代码/方案能直接用吗？有没有半成品？",
                "有没有明显的问题或错误？",
                "用户能理解和使用吗？",
                "是否需要我解释或补充什么？"
            ],
            "questions_to_ask": [
                "这样做符合你的预期吗？",
                "还需要添加什么功能？",
                "有什么需要修改的地方？"
            ]
        }
    
    def save_task(self):
        """保存任务记录"""
        if self.current_task:
            filepath = os.path.join(TASK_DIR, f"{self.current_task['id']}.json")
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(self.current_task, f, ensure_ascii=False, indent=2)
            return filepath
        return None


# ========== 伊莲娜的任务处理模板 ==========

TASK_TEMPLATE = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 任务处理清单
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 任务：{task_name}
📝 描述：{description}

【第一步】需求确认
┌─────────────────────────────────┐
│ 1. 目标是什么？                 │
│ 2. 验收标准是什么？             │
│ 3. 有无特殊要求/限制？          │
│ 4. 预期交付物是什么？           │
└─────────────────────────────────┘
（我会先确认这些，再动手）

【第二步】步骤拆分
┌─────────────────────────────────┐
│ {steps}
└─────────────────────────────────┘

【第三步】逐步执行
- 每完成一步，报告进度
- 遇到问题，及时沟通

【第四步】最终自查
┌─────────────────────────────────┐
│ □ 所有步骤都完成了吗？          │
│ □ 有没有遗漏或半成品？          │
│ □ 能直接用吗？                  │
│ □ 需要补充什么？                │
└─────────────────────────────────┘

【第五步】交付
┌─────────────────────────────────┐
│ 完整交付物 + 使用说明           │
│ 等你确认OK后任务结束            │
└─────────────────────────────────┘
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""


def print_task_template(task_name, description, steps):
    """打印任务模板"""
    steps_text = "\n│ ".join([f"{i+1}. {s}" for i, s in enumerate(steps)])
    print(TASK_TEMPLATE.format(
        task_name=task_name,
        description=description,
        steps=steps_text
    ))


# ========== 快速使用示例 ==========

EXAMPLE = '''
# 使用方法：

from task_manager import TaskManager, print_task_template

tm = TaskManager()

# 1. 接收任务后，立即确认
print("\\n🎯 让我先确认一下需求...")
requirements = tm.confirm_requirements([
    "你要的是什么？",
    "具体要求是什么？",
    "验收标准？"
])

# 2. 拆分步骤
steps = [
    "分析需求",
    "设计方案", 
    "写代码",
    "验证测试"
]
tm.start_task("设计战斗系统", "详细设计")
task_split = tm.split_steps(steps)

# 3. 打印模板
print_task_template("战斗系统设计", "详细设计", steps)

# 4. 每完成一步
tm.complete_step("需求分析", "用户要的是回合制战斗")

# 5. 最终交付前自检
check = tm.final_check()
'''

if __name__ == "__main__":
    print("任务管理器已就绪！")
    print("\n使用方法：")
    print("  from task_manager import TaskManager, print_task_template")
    print("\n" + "="*50)
    print(EXAMPLE)
