#!/usr/bin/env python3
"""
战锤40K游戏开发自检系统
自动检查当前开发状态，无需交互

使用方法：
    python3 self_check.py
"""

import os, sys, json, subprocess, re
from pathlib import Path
from datetime import datetime

GAME_DIR = Path("/root/.openclaw/workspace/warhammer-game")
REPORT_FILE = GAME_DIR / "self_check_report.md"

class SelfChecker:
    def __init__(self):
        self.checks = []
        self.passed = 0
        self.failed = 0
        
    def run(self):
        print("\n" + "=" * 60)
        print("🔍 战锤40K游戏自检系统")
        print("=" * 60)
        print(f"\n时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        
        # 1. 语法检查
        self.check_syntax()
        
        # 2. 引用检查
        self.check_references()
        
        # 3. 功能完整性
        self.check_completeness()
        
        # 4. 游戏平衡
        self.check_balance()
        
        # 5. 代码质量
        self.check_quality()
        
        # 总结
        print("\n" + "=" * 60)
        print("📊 自检结果")
        print("=" * 60)
        print(f"✅ 通过: {self.passed}")
        print(f"❌ 失败: {self.failed}")
        
        score = self.passed / (self.passed + self.failed) * 100 if (self.passed + self.failed) > 0 else 0
        
        print(f"\n📈 完成度: {score:.0f}%")
        
        if score >= 90:
            print("\n🌟 完美！游戏状态良好。")
        elif score >= 70:
            print("\n👍 良好！有小问题但可以接受。")
        elif score >= 50:
            print("\n⚠️  一般！需要改进。")
        else:
            print("\n❌ 糟糕！需要大幅改进。")
            
        # 生成报告
        self.generate_report(score)
        
        return score >= 70
        
    def check_syntax(self):
        """语法检查"""
        print("\n📝 检查语法...")
        js_dir = GAME_DIR / "js"
        errors = []
        
        for f in js_dir.glob("*.js"):
            if "_backup" in f.name:
                continue
            try:
                result = subprocess.run(
                    ["node", "--check", str(f)],
                    capture_output=True, text=True, timeout=10
                )
                if result.returncode != 0:
                    errors.append(f.name)
            except:
                errors.append(f.name + "(node_error)")
                
        if errors:
            print(f"  ❌ 语法错误: {', '.join(errors)}")
            self.failed += 1
        else:
            print(f"  ✅ 语法正确")
            self.passed += 1
            
    def check_references(self):
        """引用检查"""
        print("\n🔗 检查引用...")
        html = (GAME_DIR / "index.html").read_text()
        refs = set(re.findall(r'<script src="js/([^"]+)"', html))
        files = set(f.name for f in (GAME_DIR / "js").glob("*.js") if "_backup" not in f.name)
        
        missing = refs - files
        if missing:
            print(f"  ❌ 引用缺失: {', '.join(missing)}")
            self.failed += 1
        else:
            print(f"  ✅ 引用完整")
            self.passed += 1
            
    def check_completeness(self):
        """功能完整性"""
        print("\n🎮 检查功能完整性...")
        
        # 检查核心功能
        features = {
            "战斗系统": "combatSystem.js",
            "建筑系统": "buildingSystem.js", 
            "卡牌系统": "gameState.js",
            "预设对话": "presetDialogues.js",
            "扩展卡牌": "expandedCards.js"
        }
        
        missing = []
        for name, file in features.items():
            if not (GAME_DIR / "js" / file).exists():
                missing.append(name)
                
        if missing:
            print(f"  ❌ 缺失功能: {', '.join(missing)}")
            self.failed += 1
        else:
            print(f"  ✅ 核心功能完整")
            self.passed += 1
            
    def check_balance(self):
        """游戏平衡"""
        print("\n⚖️ 检查游戏平衡...")
        
        # 检查资源产出
        game_state = (GAME_DIR / "js" / "gameState.js").read_text()
        
        checks = [
            ("基础产出", r"baseOutput\s*=\s*(\d+)"),
            ("最大回合", r"maxTurns:\s*(\d+)"),
            ("任务时限", r"maxCardProgress:\s*(\d+)"),
            ("混沌上限", r"maxChaos:\s*100"),
        ]
        
        balance_ok = True
        for name, pattern in checks:
            if not re.search(pattern, game_state):
                print(f"  ⚠️  {name}未配置")
                balance_ok = False
                
        if balance_ok:
            print(f"  ✅ 平衡配置完整")
            self.passed += 1
        else:
            self.failed += 1
            
    def check_quality(self):
        """代码质量"""
        print("\n✨ 检查代码质量...")
        
        issues = []
        
        # 检查TODO
        for f in (GAME_DIR / "js").glob("*.js"):
            if "_backup" in f.name:
                continue
            content = f.read_text()
            if '// TODO' in content or '//FIXME' in content:
                issues.append(f"{f.name}:有TODO")
                
        if issues:
            print(f"  ⚠️  代码质量问题: {', '.join(issues[:3])}")
            self.failed += 1
        else:
            print(f"  ✅ 代码质量良好")
            self.passed += 1
            
    def generate_report(self, score):
        """生成报告"""
        report = f"""# 游戏自检报告 - {datetime.now().strftime('%Y-%m-%d %H:%M')}

## 统计
- 通过: {self.passed}
- 失败: {self.failed}
- 完成度: {score:.0f}%

## 状态
"""
        
        if score >= 90:
            report += "🌟 完美状态"
        elif score >= 70:
            report += "👍 良好状态"
        elif score >= 50:
            report += "⚠️ 需要改进"
        else:
            report += "❌ 需要大幅改进"
            
        REPORT_FILE.write_text(report)
        print(f"\n📄 报告: {REPORT_FILE}")

if __name__ == "__main__":
    checker = SelfChecker()
    can_develop = checker.run()
    print("\n" + ("🚀 可以继续开发" if can_develop else "🛑 暂停开发"))
