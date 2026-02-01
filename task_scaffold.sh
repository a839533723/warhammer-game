#!/bin/bash
# ============================================
# 伊莲娜任务处理脚手架
# 一键调用，形成任务处理"肌肉记忆"
# ============================================

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

task_handle() {
    local task_name="$1"
    local description="$2"
    local steps="$3"  # 逗号分隔的步骤
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎯 任务：$task_name${NC}"
    echo -e "${YELLOW}📝 描述：$description${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # 第一步：确认需求
    echo -e "${YELLOW}【第一步】需求确认${NC}"
    echo -e "${RED}❓ 在动手之前，请确认：${NC}"
    echo "  1. 目标是什么？"
    echo "  2. 验收标准是什么？"
    echo "  3. 有无特殊要求？"
    echo ""
    
    # 第二步：拆分步骤
    echo -e "${YELLOW}【第二步】步骤拆分${NC}"
    IFS=',' read -ra STEP_ARRAY <<< "$steps"
    for i in "${!STEP_ARRAY[@]}"; do
        echo "  [ ] $((i+1)). ${STEP_ARRAY[$i]}"
    done
    echo ""
    
    # 第三步：执行说明
    echo -e "${YELLOW}【第三步】执行规则${NC}"
    echo "  ✓ 每完成一步，报告进度"
    echo "  ✓ 遇到问题，及时沟通"
    echo "  ✓ 不确定时，先问再动"
    echo ""
    
    # 第四步：自查清单
    echo -e "${YELLOW}【第四步】最终自查（交付前必做）${NC}"
    echo "  □ 所有步骤都完成了吗？"
    echo "  □ 有没有遗漏或半成品？"
    echo "  □ 能直接用吗？"
    echo "  □ 用户能理解吗？"
    echo ""
    
    # 第五步：交付要求
    echo -e "${YELLOW}【第五步】交付要求${NC}"
    echo "  □ 完整交付物 + 使用说明"
    echo "  □ 等用户确认OK后任务结束"
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# 快速确认模板
task_confirm() {
    echo -e "${YELLOW}🎯 任务确认清单${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━"
    echo "在动手之前，请先确认："
    echo ""
    echo "1️⃣  目标是什么？"
    echo "2️⃣  具体要求是什么？"
    echo "3️⃣  验收标准是什么？"
    echo "4️⃣  有无特殊限制？"
    echo ""
    echo "回答这些问题后，再开始动手！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━"
}

# 自查模板
task_check() {
    echo -e "${RED}🛑 最终自查（交付前必须检查）${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "技术层面："
    echo "  □ 代码/方案能直接运行吗？"
    echo "  □ 有没有明显的bug或错误？"
    echo "  □ 边界情况考虑了吗？"
    echo ""
    echo "交付层面："
    echo "  □ 用户能理解怎么用吗？"
    echo "  □ 有没有遗漏的部分？"
    echo "  □ 需要我解释什么？"
    echo ""
    echo "质量层面："
    echo "  □ 这是我能给出的最好结果吗？"
    echo "  □ 会不会很快就被要求返工？"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━"
}

# 任务进度模板
task_progress() {
    local total=$1
    local completed=$2
    
    local percent=$((completed * 100 / total))
    local bar_length=$((percent / 5))
    local bar=""
    
    for ((i=0; i<20; i++)); do
        if [ $i -lt $bar_length ]; then
            bar="${bar}█"
        else
            bar="${bar}░"
        fi
    done
    
    echo -e "${GREEN}📊 任务进度：${bar} ${percent}%${NC}"
    echo "  已完成：$completed / $total"
}

# 使用说明
usage() {
    echo "伊莲娜任务处理脚本"
    echo ""
    echo "使用方法："
    echo "  source task_scaffold.sh"
    echo ""
    echo "可用命令："
    echo "  task_handle '任务名' '描述' '步骤1,步骤2,步骤3'"
    echo "  task_confirm          # 任务确认清单"
    echo "  task_check            # 最终自查清单"
    echo "  task_progress 10 3    # 显示进度（总数 完成数）"
    echo ""
}

# 默认显示帮助
if [ -z "$1" ]; then
    usage
fi
