#!/bin/bash
# ============================================
# 伊莲娜随机聊天 - 定时任务设置
# ============================================

echo "💜 伊莲娜随机聊天 - 定时任务设置"
echo "================================"
echo ""

# 检查cron是否可用
echo "📋 当前定时任务："
crontab -l 2>/dev/null | grep -i elena || echo "  （暂无）"
echo ""

# 设置随机时间发送（每天1-3次）
echo "⏰ 设置随机发送时间..."

# 方案1：每天3次（固定时间）
# 早: 9:00-11:00
# 中: 14:00-17:00  
# 晚: 20:00-22:00

echo ""
echo "📝 使用说明："
echo ""
echo "1️⃣  手动发送一次："
echo "   python3 /root/.openclaw/workspace/warhammer-game/elena_daily_chat.py"
echo ""
echo "2️⃣  设置随机时间发送："
echo "   # 编辑crontab"
echo "   crontab -e"
echo ""
echo "   # 添加以下行（每天3次，随机分钟）："
echo "   0 9 * * * python3 /root/.openclaw/workspace/warhammer-game/elena_daily_chat.py"
echo "   0 14 * * * python3 /root/.openclaw/workspace/warhammer-game/elena_daily_chat.py"
echo "   0 20 * * * python3 /root/.openclaw/workspace/warhammer-game/elena_daily_chat.py"
echo ""
echo "3️⃣  或者用随机时间脚本（更真实）："
echo "   python3 /root/.openclaw/workspace/warhammer-game/elena_random_chat.py"
echo ""
echo "================================"
echo ""

# 创建随机时间版本
cat > /root/.openclaw/workspace/warhammer-game/elena_random_chat.py << 'RANDOM'
#!/usr/bin/env python3
"""
伊莲娜随机聊天 - 随机时间版本
每次运行随机选择发送时间
"""

import subprocess
import random
from datetime import datetime, timedelta
import os

# 随机时间（8:00-22:00）
def get_random_time():
    hour = random.randint(8, 22)
    minute = random.randint(0, 59)
    return f"{hour:02d}:{minute:02d}"

def get_next_send_time():
    now = datetime.now()
    hour = random.randint(8, 22)
    minute = random.randint(0, 59)
    next_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    
    if next_time <= now:
        next_time += timedelta(days=1)
    
    return next_time

if __name__ == '__main__':
    print("💜 伊莲娜随机聊天")
    print("================")
    print()
    
    # 发送邮件
    result = subprocess.run(
        ['python3', '/root/.openclaw/workspace/warhammer-game/elena_daily_chat.py'],
        capture_output=True,
        text=True
    )
    
    print(result.stdout)
    if result.stderr:
        print("警告:", result.stderr)
    
    # 下次发送时间
    next_time = get_next_send_time()
    print()
    print(f"📅 下次随机发送：{next_time.strftime('%Y-%m-%d %H:%M')}")
RANDOM

chmod +x /root/.openclaw/workspace/warhammer-game/elena_random_chat.py

echo "✅ 已创建 elena_random_chat.py"
echo ""
echo "使用方法："
echo "  python3 /root/.openclaw/workspace/warhammer-game/elena_random_chat.py"
echo ""
echo "这会："
echo "  1. 发送一封随机话题的邮件"
echo "  2. 显示下次随机发送时间"
