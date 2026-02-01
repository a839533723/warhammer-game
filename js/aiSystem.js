/**
 * 战锤40K - AI交互系统
 * 优先使用预设，AI通过后端代理调用
 */

const USE_LOCAL_BACKEND = true;  // 是否使用本地后端
const BACKEND_URL = 'http://localhost:5000/api/chat';  // 后端地址

/**
 * 调用AI（通过后端代理，避免CORS问题）
 */
async function callQwen(prompt, maxTokens = 500) {
    // 优先使用预设，直接返回null让预设接管
    return null;  // 由于浏览器端无法直接调用千问，我们完全使用预设文本
    
    // 如果有后端，可以取消注释以下代码：
    /*
    if (USE_LOCAL_BACKEND) {
        try {
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, max_tokens: maxTokens })
            });
            
            const data = await response.json();
            if (data.success && data.text && data.text.trim().length > 10) {
                return data.text.trim();
            }
            return null;
        } catch (error) {
            console.error('后端调用失败:', error);
            return null;
        }
    }
    */
}

/**
 * 生成NPC对话（AI + 预设fallback）
 */
async function generateNPCDialogue(npcId, context = {}) {
    // 直接使用预设，不尝试AI调用
    return getNPCDialogue(npcId);
}

/**
 * 生成事件描写（AI + 预设fallback）
 */
async function generateEventDescription(card) {
    // 直接使用预设，不尝试AI调用
    return getEventDescription(card.type);
}

/**
 * 生成伊莲娜提示（AI + 预设fallback）
 */
async function generateElenaTip(questionType) {
    // 直接使用预设，不尝试AI调用
    return getElenaTip(questionType);
}

/**
 * 生成开场白（AI + 预设fallback）
 */
async function generateEnhancedGuide() {
    // 直接使用预设，不尝试AI调用
    return getGuideText();
}

/**
 * 生成任务评价（AI + 预设fallback）
 */
async function generateTaskEvaluation(success, card) {
    // 直接使用预设，不尝试AI调用
    return getTaskEvaluation(success);
}

// 导出到全局
window.aiSystem = {
    callQwen,
    generateNPCDialogue,
    generateEventDescription,
    generateElenaTip,
    generateEnhancedGuide,
    generateTaskEvaluation
};

// 添加提示信息
console.log('%c=== 战锤40K AI系统 ===', 'color: #8b5cf6; font-size: 16px; font-weight: bold;');
console.log('%c由于浏览器CORS限制，AI功能暂时不可用。', 'color: #fbbf24;');
console.log('%c我们使用丰富的预设文本（113条）来保证游戏体验！', 'color: #4ade80;');
console.log('%c如需启用AI，请运行本地后端：python ai_backend.py', 'color: #60a5fa;');
console.log('%c====================', 'color: #8b5cf6;');
