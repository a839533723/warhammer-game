#!/bin/bash
# 手动推送脚本 - 用于在本地环境推送代码到GitHub
# 使用方法: ./manual_push.sh

echo "=== 战锤游戏手动推送脚本 ==="
echo

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  有未提交的更改，先提交..."
    git add -A
    git commit -m "手动提交: $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo
echo "🚀 开始推送到GitHub..."
echo "请输入GitHub密码/Token进行验证..."

# 尝试推送
if git push origin main; then
    echo
    echo "✅ 推送成功！"
    echo "GitHub Pages将在几分钟内自动更新。"
else
    echo
    echo "❌ 推送失败。"
    echo "请手动执行以下命令："
    echo "  cd /root/.openclaw/workspace/warhammer-game"
    echo "  git push origin main"
fi
