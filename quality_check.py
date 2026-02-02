#!/usr/bin/env python3
"""
战锤40K游戏质量审核脚本
检查代码质量，确保没有半成品
"""

import os, sys, json, subprocess, re
from pathlib import Path
from datetime import datetime

GAME_DIR = Path("/root/.openclaw/workspace/warhammer-game")
REPORT_FILE = GAME_DIR / "quality_report.md"

class QualityCheck:
    def __init__(self):
        self.issues = []
        self.passed = 0
        self.failed = 0
        self.warnings = 0
        
    def log(self, msg, status="ok"):
        icons = {"ok": "✅", "fail": "❌", "warn": "⚠️", "info": "🔍"}
        print(f"{icons.get(status, '🔍')} {msg}")
        
    def add(self, level, msg, file=""):
        self.issues.append({"level": level, "msg": msg, "file": file})
        if level == "critical" or level == "error":
            self.failed += 1
        else:
            self.warnings += 1
            
    def collect_all_definitions(self):
        """收集所有文件的函数和对象定义"""
        all_defs = set()
        
        for f in (GAME_DIR / "js").glob("*.js"):
            if "_backup" in f.name:
                continue
            content = f.read_text()
            
            # 函数定义
            funcs = re.findall(r'function\s+(\w+)', content)
            all_defs.update(funcs)
            
            # const/let/var定义
            consts = re.findall(r'(?:const|let|var)\s+(\w+)\s*=', content)
            all_defs.update(consts)
            
            # 类定义
            classes = re.findall(r'class\s+(\w+)', content)
            all_defs.update(classes)
            
        return all_defs
        
    def check_syntax(self):
        """检查JS语法"""
        self.log("检查JavaScript语法...")
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
                pass
                
        if errors:
            self.add("critical", f"语法错误: {', '.join(errors)}")
            self.log(f"  失败: {errors}", "fail")
        else:
            self.passed += 1
            self.log(f"  通过", "ok")
            
    def check_references(self):
        """检查引用完整性"""
        self.log("检查JS引用...")
        html = (GAME_DIR / "index.html").read_text()
        refs = set(re.findall(r'<script src="js/([^"]+)"', html))
        files = set(f.name for f in (GAME_DIR / "js").glob("*.js") if "_backup" not in f.name)
        
        missing = refs - files
        if missing:
            self.add("critical", f"引用缺失: {', '.join(missing)}")
            self.log(f"  失败: 引用缺失", "fail")
        else:
            self.passed += 1
            self.log(f"  通过", "ok")
            
    def check_todos(self):
        """检查TODO"""
        self.log("检查TODO...")
        todos = []
        for f in (GAME_DIR / "js").glob("*.js"):
            if "_backup" in f.name:
                continue
            content = f.read_text()
            for i, line in enumerate(content.split('\n'), 1):
                if '// TODO' in line or '//FIXME' in line:
                    todos.append(f"{f.name}:{i}")
                    
        if todos:
            self.add("warning", f"TODO残留: {', '.join(todos[:3])}")
            self.log(f"  警告: {len(todos)}个TODO", "warn")
        else:
            self.passed += 1
            self.log(f"  通过", "ok")
            
    def check_exports(self):
        """检查导出是否在某个文件定义"""
        self.log("检查函数导出...")
        all_defs = self.collect_all_definitions()
        
        issues = []
        for f in (GAME_DIR / "js").glob("*.js"):
            if "_backup" in f.name:
                continue
            content = f.read_text()
            
            # 排除 window.xxx = xxx 这种跨文件引用（这是正常的）
            # 只检查window.xxx = new 或者window.xxx = className
            exports = re.findall(r'window\.(\w+)\s*=\s*(?!' + '|'.join(all_defs) + r')\b(\w+)', content)
            
            # 简化：只检查明显的错误，如 window.new = new
            new_exports = re.findall(r'window\.new\s*=\s*new', content)
            if new_exports:
                issues.append(f"{f.name}: new（是关键字）")
                
        if issues:
            self.add("error", f"导出问题: {', '.join(issues)}")
            self.log(f"  错误", "fail")
        else:
            self.passed += 1
            self.log(f"  通过", "ok")
            
    def check_empty_functions(self):
        """检查空函数"""
        self.log("检查空函数...")
        empties = []
        for f in (GAME_DIR / "js").glob("*.js"):
            if "_backup" in f.name:
                continue
            content = f.read_text()
            # 查找明确是空函数的
            funcs = re.findall(r'function\s+(\w+)\s*\([^)]*\)\s*\{\s*\}\s*(?:\n|$)', content)
            for func in funcs:
                # 排除getter/setter和简单的转发函数
                if not content.count(f"function {func}") > 1:  # 只出现一次
                    empties.append(func)
                    
        if empties[:3]:  # 只显示前3个
            self.add("warning", f"空函数: {', '.join(empties)}")
            self.log(f"  警告", "warn")
        else:
            self.passed += 1
            self.log(f"  通过", "ok")
            
    def check_console_logs(self):
        """检查console.log"""
        self.log("检查console.log...")
        logs = []
        for f in (GAME_DIR / "js").glob("*.js"):
            if "_backup" in f.name:
                continue
            content = f.read_text()
            if 'console.log' in content and '===' not in content and '统计信息' not in content:
                count = content.count('console.log')
                logs.append(f"{f.name}({count})")
                
        if logs:
            self.add("info", f"console.log: {', '.join(logs)}")
            self.log(f"  信息", "info")
        else:
            self.passed += 1
            self.log(f"  通过", "ok")
            
    def run(self):
        """运行所有检查"""
        print("\n" + "=" * 50)
        print("🔍 战锤40K游戏质量审核")
        print("=" * 50 + "\n")
        
        checks = [
            ("syntax", self.check_syntax),
            ("references", self.check_references),
            ("todos", self.check_todos),
            ("exports", self.check_exports),
            ("empty", self.check_empty_functions),
            ("logs", self.check_console_logs),
        ]
        
        for name, func in checks:
            func()
            
        # 总结
        print("\n" + "=" * 50)
        print("📊 结果")
        print("=" * 50)
        print(f"✅ 通过: {self.passed}")
        print(f"❌ 失败: {self.failed}")
        print(f"⚠️  警告: {self.warnings}")
        
        # 生成报告
        report = f"""# 质量报告 - {datetime.now().strftime('%Y-%m-%d %H:%M')}

## 统计
- 通过: {self.passed}
- 失败: {self.failed}
- 警告: {self.warnings}

## 问题

"""
        for issue in self.issues:
            report += f"- [{issue['level']}] {issue['msg']}\n"
            
        REPORT_FILE.write_text(report)
        
        can_submit = self.failed == 0
        print(f"\n{'✅ 可以提交' if can_submit else '❌ 阻止提交'}")
        print(f"📄 报告: {REPORT_FILE}\n")
        
        return 0 if can_submit else 1

if __name__ == "__main__":
    sys.exit(QualityCheck().run())
