/**
 * 战锤40K - AI交互系统
 * 负责所有AI调用：对话生成、事件描写、地点描写等
 */

const API_KEY = 'sk-7324d922204640fd87ad5ae868b82376';

/**
 * 调用千问API
 */
async function callQwen(prompt, maxTokens = 500) {
    try {
        const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
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
        return data.output?.text || null;
    } catch (error) {
        console.error('AI调用失败:', error);
        return null;
    }
}

/**
 * 生成NPC对话
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
    let chaosEffect = '';
    if (chaosLevel > 70) {
        chaosEffect = '（玩家混沌值很高，NPC显得更加可疑）';
    } else if (chaosLevel > 40) {
        chaosEffect = '（玩家有些混沌污染，NPC眼神闪烁）';
    }
    
    const prompt = `你是战锤40K游戏中的一个NPC。

NPC信息：
- 名字：${npc.name}
- 身份：${npc.role}
- 性格：${npc.personality}

当前游戏状态：
- 回合：${gameState.turn}
- 玩家混沌值：${chaosLevel}
- 任务类型：${gameState.currentCard?.type || '无'}

请生成一段NPC对话（50-100字），${npc.name}在被玩家审问时说的话。${chaosEffect}

要求：
- 符合NPC的身份和性格
- 包含一些可疑或真诚的暗示
- 不要太长，50-100字
- 用中文
- 不要加引号或角色名，直接返回对话内容`;

    return await callQwen(prompt, 200);
}

/**
 * 生成事件描写
 */
async function generateEventDescription(card) {
    const chaosLevel = gameState.character.chaos;
    
    // 根据混沌值调整事件氛围
    let chaosAtmosphere = '';
    if (chaosLevel > 70) {
        chaosAtmosphere = '混沌的阴影笼罩一切，空气中弥漫着腐朽的气息。你感受到混沌之神的注视。';
    } else if (chaosLevel > 40) {
        chaosAtmosphere = '四周隐约传来低语声，视野边缘出现扭曲的幻影。';
    } else {
        chaosAtmosphere = '虽然危险重重，但帝皇的圣光仍在指引你前进。';
    }
    
    const cardTypes = {
        'chaos': { name: '混沌任务', focus: '找出内鬼' },
        'faith': { name: '信仰任务', focus: '完成帝皇旨意' },
        'combat': { name: '战斗任务', focus: '击败敌人' },
        'devotion': { name: '眷属任务', focus: '获取追随者' }
    };
    
    const type = cardTypes[card.type] || { name: '未知任务', focus: '完成任务' };
    
    const prompt = `你是战锤40K游戏的AI主持人伊莲娜。

当前事件信息：
- 任务类型：${type.name}
- 任务难度：${card.difficulty}
- 任务名称：${card.name}
- 任务描述：${card.description}
- 回合：${gameState.turn}
- 玩家混沌值：${chaosLevel}

请生成一段事件描写（100-150字），包含：
1. 环境描述（危险、机会）
2. 任务目标暗示
3. 紧迫感

当前氛围：${chaosAtmosphere}

要求：
- 富有沉浸感
- 符合战锤40K的黑暗风格
- 用中文
- 不要太长，100-150字
- 不要加标题或角色名，直接返回描述文字`;

    return await callQwen(prompt, 300);
}

/**
 * 生成地点描写（战斗前）
 */
async function generateLocationDescription(enemyType, location) {
    const prompt = `你是战锤40K游戏的AI主持人伊莲娜。

战斗信息：
- 敌人类型：${enemyType}
- 地点：${location}
- 回合：${gameState.turn}
- 玩家混沌值：${gameState.character.chaos}

请生成一段地点描写（80-120字），包含：
1. 环境描述
2. 危险提示
3. 战术建议（如果适用）

要求：
- 富有沉浸感
- 符合战锤40K的黑暗风格
- 用中文
- 不要太长，80-120字
- 不要加标题，直接返回描述文字`;

    return await callQwen(prompt, 250);
}

/**
 * 生成伊莲娜的提示（玩家点击按钮时）
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
       混沌Tip = '你已经开始受到混沌影响，小心行事。';
    } else {
       混沌Tip = '你的灵魂目前纯净，保持警惕！';
    }
    
    const prompt = `你是战锤40K游戏的AI主持人伊莲娜。

当前游戏状态：
- ${state}
- 回合：${turn}/14
- 混沌值：${chaosLevel}（${chaosTip}）
- 当前任务：${currentCard?.name || '无'}
- 任务类型：${currentCard?.type || '无'}

请给玩家一段提示或建议（80-120字），作为伊莲娜对玩家的指导。

要求：
- 符合伊莲娜（姐姐）的口吻（稍微调皮的姐姐风格）
- 提供有用的信息
- 符合当前游戏状态
- 用中文
- 不要太长，80-120字`;

    return await callQwen(prompt, 250);
}

/**
 * 生成任务完成评价
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
- 符合伊莲娜的口吻
- 如果成功：赞扬玩家
- 如果失败：鼓励玩家或给出建议
- 用中文
- 不要太长，50-100字`;

    return await callQwen(prompt, 200);
}

/**
 * 生成开场白（增强版，包含玩家选择）
 */
async function generateEnhancedGuide() {
    const charClass = gameState.character.class;
    const classes = {
        '极限战士': { desc: '帝国最忠诚的战士，战术大师' },
        '刺客庭刺客': { desc: '隐匿于阴影中的致命刺客' },
        '灰骑士': { desc: '对抗混沌的灵能战士' },
        '机械教信徒': { desc: '机械与血肉融合的技术信徒' }
    };
    
    const classInfo = classes[charClass] || { desc: '帝国的战士' };
    
    const prompt = `你是战锤40K游戏的AI主持人伊莲娜，用姐姐的口吻（稍微调皮但关心）介绍游戏。

玩家身份：
- 职业：${charClass}
- 特点：${classInfo.desc}

游戏背景：
- 地点：麦加托普星球（极限战士母星）
- 威胁：混沌侵蚀、兽人入侵、内鬼背叛
- 目标：完成卡牌任务生存14回合
- 惩罚：混沌值达到100则堕落

请生成一段沉浸式开场白（200-300字），包含：
1. 欢迎玩家醒来
2. 介绍身份和当前环境
3. 简要说明游戏规则
4. 询问是否准备好开始

要求：
- 富有沉浸感和战锤40K风格
- 符合姐姐口吻
- 用中文
- 最后用"【点击下方开始按钮开始冒险】"结束`;

    return await callQwen(prompt, 500);
}

// 导出到全局
window.aiSystem = {
    callQwen,
    generateNPCDialogue,
    generateEventDescription,
    generateLocationDescription,
    generateElenaTip,
    generateTaskEvaluation,
    generateEnhancedGuide
};
