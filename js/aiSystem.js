/**
 * 战锤40K - AI交互系统
 * 优先使用AI，失败时使用预设
 */

const API_KEY = 'sk-7324d922204640fd87ad5ae868b82376';

/**
 * 调用千问API（添加CORS支持）
 */
async function callQwen(prompt, maxTokens = 500) {
    try {
        const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
            method: 'POST',
            mode: 'cors',  // 添加CORS模式
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                model: 'qwen-turbo',
                input: {
                    messages: [
                        { role: 'user', content: prompt }
                    ]
                },
                parameters: {
                    max_tokens: maxTokens,
                    temperature: 0.7
                }
            })
        });

        const data = await response.json();
        const text = data.output?.text;
        
        if (text && text.trim().length > 10) {
            return text.trim();
        }
        return null;
    } catch (error) {
        console.error('AI调用失败:', error.message);
        return null;
    }
}

/**
 * 生成NPC对话（AI + 预设fallback）
 */
async function generateNPCDialogue(npcId, context = {}) {
    const npcs = {
        'tam': { name: '塔姆', role: '帝国士兵', personality: '忠诚但紧张' },
        'carl': { name: '卡尔', role: '军需官', personality: '狡猾且心虚' },
        'yuri': { name: '尤里', role: '技术神甫', personality: '狂热且偏执' }
    };
    
    const npc = npcs[npcId];
    const chaosLevel = gameState.character.chaos;
    
    // 根据混沌值调整NPC表现
    let chaosHint = '';
    if (chaosLevel > 70) {
        chaosHint = '（玩家混沌值很高，NPC显得更加可疑，眼神躲闪）';
    } else if (chaosLevel > 40) {
        chaosHint = '（玩家有些混沌污染，NPC欲言又止）';
    }
    
    const prompt = `你是战锤40K游戏中的一个NPC。

NPC信息：
- 名字：${npc.name}
- 身份：${npc.role}
- 性格：${npc.personality}
- 当前混沌值：${chaosLevel}
${chaosHint}

请生成一段NPC对话（80-150字），在被玩家审问时的反应。符合NPC身份性格，可能包含可疑的暗示或真诚的辩白。

要求：
- 符合NPC的性格特点
- 包含一些有用的信息或暗示
- 不要太长，80-150字
- 用中文
- 不要加角色名，直接返回对话内容`;

    // 尝试AI生成
    const aiResult = await callQwen(prompt, 300);
    if (aiResult) return aiResult;
    
    // AI失败，使用预设
    console.log('AI不可用，使用预设对话');
    return getNPCDialogue(npcId);
}

/**
 * 生成事件描写（AI + 预设fallback）
 */
async function generateEventDescription(card) {
    const chaosLevel = gameState.character.chaos;
    const turn = gameState.turn;
    
    // 根据混沌值调整氛围
    let atmosphere = '';
    if (chaosLevel > 70) {
        atmosphere = '混沌的阴影笼罩一切，空气中弥漫着腐朽的气息。你感受到混沌之神的低语。';
    } else if (chaosLevel > 40) {
        atmosphere = '四周隐约传来低语声，视野边缘出现扭曲的幻影。';
    } else {
        atmosphere = '虽然危险重重，但帝皇的圣光仍在指引你前进。';
    }
    
    const cardTypes = {
        'chaos': { name: '混沌任务', focus: '找出内鬼' },
        'faith': { name: '信仰任务', focus: '完成帝皇旨意' },
        'combat': { name: '战斗任务', focus: '击败敌人' },
        'devotion': { name: '眷属任务', focus: '获取追随者' }
    };
    
    const type = cardTypes[card.type] || { name: '未知任务', focus: '完成任务' };
    
    const prompt = `你是战锤40K游戏的AI主持人伊莲娜。

任务信息：
- 类型：${type.name}
- 难度：${card.difficulty}
- 名称：${card.name}
- 回合：${turn}/14
- 混沌值：${chaosLevel}
- 当前氛围：${atmosphere}

请生成一段事件描写（100-150字），包含：
1. 环境描述（危险、机会）
2. 任务目标暗示
3. 紧迫感

要求：
- 富有沉浸感
- 符合战锤40K黑暗风格
- 用中文
- 不要标题，直接返回描写`;

    const aiResult = await callQwen(prompt, 300);
    if (aiResult) return aiResult;
    
    console.log('AI不可用，使用预设事件描写');
    return getEventDescription(card.type);
}

/**
 * 生成伊莲娜提示（AI + 预设fallback）
 */
async function generateElenaTip(questionType) {
    const states = {
        'card': '当前卡牌任务',
        'investigation': '调查任务',
        'chaos': '混沌状态',
        'general': '一般问题',
        'strategy': '策略建议'
    };
    
    const state = states[questionType] || '当前状态';
    const chaosLevel = gameState.character.chaos;
    const currentCard = gameState.currentCard;
    const turn = gameState.turn;
    
    let chaosTip = '';
    if (chaosLevel > 70) {
        chaosTip = '你的混沌值很高，必须尽快净化！';
    } else if (chaosLevel > 40) {
        chaosTip = '你已经开始受到混沌影响，小心行事。';
    } else {
        chaosTip = '你的灵魂目前纯净，保持警惕！';
    }
    
    const prompt = `你是战锤40K游戏的AI主持人伊莲娜（姐姐口吻，调皮但关心）。

当前状态：
- ${state}
- 回合：${turn}/14
- 混沌值：${chaosLevel}（${chaosTip}）
- 当前任务：${currentCard?.name || '无'}
- 任务类型：${currentCard?.type || '无'}

请给玩家一段提示或建议（80-120字），作为伊莲娜的指导。

要求：
- 姐姐口吻（稍微调皮但关心）
- 提供有用的信息
- 用中文
- 不要太长`;

    const aiResult = await callQwen(prompt, 250);
    if (aiResult) return aiResult;
    
    console.log('AI不可用，使用预设提示');
    return getElenaTip(questionType);
}

/**
 * 生成开场白（AI + 预设fallback）
 */
async function generateEnhancedGuide() {
    const charClass = gameState.character.class;
    
    const prompt = `你是战锤40K游戏的AI主持人伊莲娜，用姐姐的口吻（稍微调皮但关心）介绍游戏。

玩家职业：${charClass}

请生成一段沉浸式开场白（200-300字），包含：
1. 欢迎玩家醒来
2. 介绍身份和当前环境（混沌侵蚀、内鬼、危险）
3. 简要说明游戏规则
4. 鼓励玩家开始冒险

要求：
- 富有沉浸感和战锤40K风格
- 符合姐姐口吻
- 用中文
- 不要标题，直接返回文本`;

    const aiResult = await callQwen(prompt, 500);
    if (aiResult) return aiResult;
    
    console.log('AI不可用，使用预设开场白');
    return getGuideText();
}

/**
 * 生成任务评价（AI + 预设fallback）
 */
async function generateTaskEvaluation(success, card) {
    const chaosLevel = gameState.character.chaos;
    
    const prompt = `你是战锤40K游戏的AI主持人伊莲娜。

任务结果：
- 任务名称：${card.name}
- 任务类型：${card.type}
- 结果：${success ? '成功' : '失败'}
- 当前混沌值：${chaosLevel}

请生成一段评价（50-100字），评价玩家的表现。

要求：
- 姐姐口吻
- 成功则赞扬，失败则鼓励
- 用中文
- 不要太长`;

    const aiResult = await callQwen(prompt, 200);
    if (aiResult) return aiResult;
    
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
