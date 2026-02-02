#!/usr/bin/env python3
"""
战锤40K游戏开发反思与提问机制
在每次开发前进行自我反思，确保方向正确

使用方法：
    python3 dev_reflection.py [--new-feature "功能名"] [--before-commit]
"""

import os, sys, json, subprocess, re
from pathlib import Path
from datetime import datetime
from enum import Enum

GAME_DIR = Path("/root/.openclaw/workspace/warhammer-game")
QUESTIONS_FILE = GAME_DIR / "dev_reflection_questions.md"
LOG_FILE = GAME_DIR / "dev_reflection_log.md"

# 开发前必须回答的问题
REQUIRED_QUESTIONS = {
    "purpose": {
        "question": "这个功能解决什么问题？玩家为什么需要它？",
        "required": True,
        "weight": 3
    },
    "completeness": {
        "question": "这个功能是完整的吗？还是只是半成品？",
        "required": True,
        "weight": 3
    },
    "ui": {
        "question": "UI是否与其他部分一致？是否美观？",
        "required": True,
        "weight": 2
    },
    "integration": {
        "question": "新功能如何与现有系统集成？是否破坏现有功能？",
        "required": True,
        "weight": 2
    },
    "testing": {
        "question": "如何测试这个功能？是否进行了基本测试？",
        "required": False,
        "weight": 1
    },
    "performance": {
        "question": "性能是否有影响？是否有内存泄漏？",
        "required": False,
        "weight": 1
    }
}

class Response(Enum):
    SKIP = "skip"  # 跳过
    YES = "yes"    # 是
    NO = "no"      # 否
    PARTIAL = "partial"  # 部分

class DevelopmentReflection:
    def __init__(self):
        self.responses = {}
        self.score = 0
        self.max_score = 0
        
    def ask_question(self, key, question_data) -> str:
        """向开发者提问"""
        question = question_data["question"]
        required = question_data["required"]
        weight = question_data["weight"]
        
        print(f"\n{'='*50}")
        print(f"📋 {question}")
        print(f"{'='*50}")
        
        if required:
            print("⚠️  这个问题必须回答")
            
        print("\n选项:")
        print("  [y] 是/有")
        print("  [n] 否/没有")
        print("  [p] 部分完成")
        print("  [s] 跳过")
        print("  [q] 退出")
        
        while True:
            response = input("\n你的回答: ").strip().lower()
            
            if response in ['y', 'yes']:
                self.responses[key] = Response.YES
                return Response.YES
            elif response in ['n', 'no']:
                self.responses[key] = Response.NO
                return Response.NO
            elif response in ['p', 'partial']:
                self.responses[key] = Response.PARTIAL
                return Response.PARTIAL
            elif response in ['s', 'skip']:
                if required:
                    print("❌ 这是必答题，不能跳过！")
                    continue
                self.responses[key] = Response.SKIP
                return Response.SKIP
            elif response in ['q', 'quit']:
                print("👋 退出开发")
                sys.exit(0)
            else:
                print("无效输入，请重试")
                
    def calculate_score(self) -> float:
        """计算完成度分数"""
        total = 0
        max_total = 0
        
        for key, question in REQUIRED_QUESTIONS.items():
            weight = question["weight"]
            max_total += weight
            
            if key not in self.responses:
                continue
                
            response = self.responses[key]
            if response == Response.YES:
                total += weight
            elif response == Response.PARTIAL:
                total += weight * 0.5
            elif response == Response.SKIP:
                if question["required"]:
                    total -= weight  # 惩罚跳过必答题
                    
        self.score = total
        self.max_score = max_total
        return total / max_total * 100 if max_total > 0 else 0
        
    def generate_recommendation(self, score: float) -> str:
        """根据分数给出建议"""
        if score >= 90:
            return "🌟 完美！可以提交了。"
        elif score >= 70:
            return "👍 良好，但建议修复部分问题后再提交。"
        elif score >= 50:
            return "⚠️  中等，需要改进后才能提交。"
        else:
            return "❌ 糟糕！需要大幅改进才能提交。"
            
    def log_session(self, feature: str = "未知"):
        """记录这次反思"""
        lines = [
            f"## {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            f"**功能**: {feature}",
            f"**分数**: {self.score:.0f}/{self.max_score} ({self.calculate_score():.0f}%)",
            "",
            "### 回答",
        ]
        
        for key, response in self.responses.items():
            question = REQUIRED_QUESTIONS[key]["question"]
            lines.append(f"**{question}**")
            lines.append(f"- 回答: {response.value}")
            lines.append("")
            
        lines.append(f"**建议**: {self.generate_recommendation(self.calculate_score())}")
        lines.append("")
        lines.append("---")
        lines.append("")
        
        # 追加到日志
        if LOG_FILE.exists():
            content = LOG_FILE.read_text()
        else:
            content = ""
            
        LOG_FILE.write_text(content + "\n".join(lines))
        
    def run(self, feature: str = "开发"):
        """运行完整反思流程"""
        print("\n" + "=" * 60)
        print("🎮 战锤40K游戏开发反思机制")
        print("=" * 60)
        print(f"\n功能: {feature}")
        print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        
        # 提问
        for key, question in REQUIRED_QUESTIONS.items():
            self.ask_question(key, question)
            
        # 计算分数
        score = self.calculate_score()
        recommendation = self.generate_recommendation(score)
        
        # 总结
        print("\n" + "=" * 60)
        print("📊 反思结果")
        print("=" * 60)
        print(f"\n分数: {self.score:.0f}/{self.max_score} ({score:.0f}%)")
        print(f"\n建议: {recommendation}")
        
        # 记录
        self.log_session(feature)
        
        return score >= 70  # 70分以上可以继续

def run_quality_check():
    """运行质量检查"""
    print("\n🔍 首先运行质量检查...")
    result = subprocess.run(
        [sys.executable, str(GAME_DIR / "quality_check.py")],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        print("✅ 质量检查通过")
        return True
    else:
        print("❌ 质量检查未通过")
        print(result.stdout)
        return False

def main():
    feature = "未知"
    
    # 解析参数
    if "--new-feature" in sys.argv:
        idx = sys.argv.index("--new-feature")
        if idx + 1 < len(sys.argv):
            feature = sys.argv[idx + 1]
    elif "--before-commit" in sys.argv:
        feature = "提交前检查"
    else:
        # 交互式
        feature = input("请输入要开发的功能（直接回车开始常规开发）: ").strip() or "常规开发"
        
    reflection = DevelopmentReflection()
    
    # 先运行质量检查
    if feature != "常规开发":
        if not run_quality_check():
            print("\n❌ 请先修复质量问题")
            return 1
            
    # 运行反思
    if reflection.run(feature):
        print("\n🚀 开始开发！")
        return 0
    else:
        print("\n🛑 停止开发，请改进后再试")
        return 1

if __name__ == "__main__":
    sys.exit(main())
