/**
 * 战锤40K - 游戏状态管理（v0.3 AI版）
 */

// 游戏状态
let gameState = {
    // 游戏阶段
    phase: 'guide',  // guide(引导) -> main(主线)
    
    // 回合信息
    turn: 1,
    maxTurns: 14,    // 总回合数
    
    // 角色信息
    character: {
        name: '钛-7',
        class: '极限战士',  // 可选：刺客庭刺客/极限战士/灰骑士/机械教信徒/混沌信徒
        level: 1,
        hp: 100,
        maxHp: 100,
        chaos: 0,        // 混沌值（0-100）
        maxChaos: 100,
        faith: 50,       // 信仰值（影响帝皇相关任务）
        followers: []    // 追随者列表
    },
    
    // 当前任务卡
    currentCard: null,
    cardProgress: 0,     // 任务进度（0-3回合）
    maxCardProgress: 3,  // 任务限制回合数
    
    // 资源
    resources: {
        materials: 50,      // 物资
        intelligence: 10,   // 情报点（用于调查）
        faithPoints: 0      // 信仰点
    },
    
    // NPC系统（狼人杀）
    npcs: {
        tam: { 
            id: 'tam', name: '塔姆', 
            role: '士兵', 
            isTraitor: false,
            suspicion: 3,  // 可疑度 (1-10)
            trust: 5,      // 信任度 (1-10)
            clues: ['昨晚在仓库附近看到可疑身影', '他似乎在隐瞒什么'],
            dialogue: [
                "大人，我昨晚确实在仓库附近巡逻，但什么都没看到。",
                "帝皇在上，我对帝国忠心耿耿，绝无二心！",
                "最近营地里有股奇怪的味道，您注意到了吗？"
            ]
        },
        carl: { 
            id: 'carl', name: '卡尔', 
            role: '军需官', 
            isTraitor: true,  // 内鬼
            suspicion: 5,
            trust: 3,
            clues: ['经常深夜独自外出', '供给物资经常短缺'],
            dialogue: [
                "物资清单？我...我需要核对一下。",
                "最近补给线被切断，这不是我的错。",
                "您怀疑我？我为帝国效力二十年！"
            ]
        },
        yuri: { 
            id: 'yuri', name: '尤里', 
            role: '技术神甫', 
            isTraitor: false,
            suspicion: 4,
            trust: 2,
            clues: ['对机械的执念异常', '眼神有时会失焦'],
            dialogue: [
                "赞美欧姆尼赛亚，机械即是真理。",
                "这具身躯已经改造了87%，我几乎不再是人类。",
                "你知道吗？血肉苦弱，机械飞升。"
            ]
        }
    },
    
    // 狼人杀状态
    investigation: {
        active: false,
        suspects: ['tam', 'carl', 'yuri'],
        evidence: [],       // 收集的证据
        votingRound: 0,     // 投票轮次
        maxVotingRounds: 2, // 最多2轮投票
        correctVotes: 0     // 正确投票次数
    },
    
    // 卡牌系统
    cardDeck: {
        chaos: [],    // 混沌卡（调查内鬼）
        faith: [],    // 信仰卡（帝皇任务）
        combat: [],   // 战斗卡（战斗任务）
        devotion: [], // 眷属卡（获取追随者）
        discard: []   // 弃牌堆
    },
    hand: [],         // 当前手牌
    
    // 游戏设置
    settings: {
        useAI: true,      // 使用AI对话
        difficulty: 'normal'  // 难度
    }
};

/**
 * 初始化游戏
 */
function initGame() {
    // 从存档加载或使用默认状态
    loadGame();
    
    // 根据阶段执行不同逻辑
    if (gameState.phase === 'guide') {
        startGuidePhase();
    } else {
        startMainPhase();
    }
    
    updateUI();
}

/**
 * 引导阶段 - AI介绍背景
 */
function startGuidePhase() {
    // 显示开场白
    addDialog('system', '🌌', '【战锤40K：虚空黎明 v0.3】');
    addDialog('system', '👩', '你好，战士。');
    
    // 显示预设开场白（同时尝试调用AI）
    setTimeout(() => {
        showDefaultGuide();
        
        // 尝试调用AI（异步）
        callAIGuide().catch(() => {
            console.log('AI调用失败，使用预设文本');
        });
    }, 500);
}

/**
 * 显示默认引导文本（当AI不可用时）
 */
function showDefaultGuide() {
    const guideText = `黑暗中，你睁开双眼，感受到冰冷的金属地板贴着你的肌肤。

你是${gameState.character.class}，帝国最忠诚的战士之一。此刻你身处麦加托普星球——极限战士战团的母星，但这里已经不再是曾经的圣地。

混沌的阴影正在蔓延。兽人的入侵、混沌信徒的渗透、内鬼的背叛...这座星球正处在崩溃的边缘。

你的任务是通过完成各种挑战卡牌来生存：
• 🃏 每回合抽取一张任务卡牌
• ⏰ 必须在3个回合内完成任务
• 💀 超时未完成：混沌值+30
• 🔮 混沌值达到100：你将堕落

任务类型：
• 🔴 混沌卡：找出内鬼（狼人杀）
• 🟡 信仰卡：完成帝皇的旨意  
• ⚔️ 战斗卡：击败敌人
• 💕 眷属卡：获取追随者

你准备好了吗，战士？`;

    addDialog('npc', '👩', guideText);
    
    // 添加开始按钮
    setTimeout(() => {
        addDialog('system', '🎮', '【点击下方"开始任务"按钮继续】');
    }, 1000);
}

/**
 * 调用AI生成引导文本（异步，不阻塞显示）
 */
async function callAIGuide() {
    const API_KEY = 'sk-7324d922204640fd87ad5ae868b82376';
    
    const prompt = `你是战锤40K游戏的AI主持人伊莲娜。用200字左右的中文，生成一段沉浸式开场白，介绍：
1. 主角身份（${gameState.character.class}）
2. 当前环境的危险
3. 混沌的威胁
4. 游戏基本规则

用富有沉浸感的方式，不要太长。`;

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
                    max_tokens: 500,
                    temperature: 0.7
                }
            })
        });

        const data = await response.json();
        const guideText = data.output?.text;
        
        if (guideText) {
            // 在预设文本后追加AI文本
            setTimeout(() => {
                addDialog('npc', '🤖', '【AI补充】' + guideText);
            }, 1500);
        }
        
    } catch (error) {
        console.error('AI调用失败:', error);
        // 静默失败，使用预设文本
    }
}

/**
 * 开始主线阶段
 */
function startMainPhase() {
    gameState.phase = 'main';
    gameState.turn = 1;
    
    addDialog('system', '⚔️', '【主线任务开始】');
    addDialog('system', '📋', '游戏规则：');
    addDialog('system', '🃏', '• 每回合抽取一张卡牌任务');
    addDialog('system', '⏰', '• 必须在3回合内完成任务');
    addDialog('system', '💀', '• 超时未完成：混沌值+30');
    addDialog('system', '🎯', '• 任务类型：混沌/信仰/战斗/眷属');
    
    // 抽取第一张卡
    drawCard();
    
    saveGame();
}

/**
 * 抽取卡牌
 */
function drawCard() {
    const types = ['chaos', 'faith', 'combat', 'devotion'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const card = generateCard(type);
    gameState.currentCard = card;
    gameState.cardProgress = 0;
    gameState.hand = [card];
    
    addDialog('system', '🃏', `【${getCardTypeName(type)}卡】`);
    addDialog('npc', '📜', card.description);
    addDialog('system', '⏰', `任务期限：${gameState.maxCardProgress}回合`);
    
    // 根据卡牌类型显示不同提示
    if (type === 'chaos') {
        addDialog('system', '🔍', '任务：找出内鬼。审问NPC，收集证据，投票决定。');
        startInvestigation();
    } else if (type === 'faith') {
        addDialog('system', '✨', '任务：完成帝皇的旨意。做出选择，证明你的信仰。');
    } else if (type === 'combat') {
        addDialog('system', '⚔️', '任务：前往指定地点战斗。击败敌人，获得胜利。');
    } else if (type === 'devotion') {
        addDialog('system', '💕', '任务：获取NPC的好感或追随。送礼、帮助、对话。');
    }
    
    updateUI();
}

/**
 * 生成卡牌
 */
function generateCard(type) {
    const difficulties = ['simple', 'normal', 'hard', 'extreme'];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    
    const cards = {
        chaos: {
            simple: {
                name: '轻微怀疑',
                description: '你感觉到有人在暗中监视。调查一下塔姆最近的行踪。',
                target: 'tam',
                difficulty: '简单',
                reward: { chaosReduction: 10, intelligence: 5 },
                penalty: { chaosIncrease: 20 },
                cluesNeeded: 1
            },
            normal: {
                name: '物资失踪',
                description: '军需官的物资清单对不上。审问所有嫌疑人，找出内鬼。',
                target: 'all',
                difficulty: '普通',
                reward: { chaosReduction: 15, materials: 20 },
                penalty: { chaosIncrease: 30 },
                cluesNeeded: 2
            },
            hard: {
                name: '混沌渗透',
                description: '有混沌信徒隐藏在营地中。你必须找出并处决他。',
                target: 'all',
                difficulty: '困难',
                reward: { chaosReduction: 20, reputation: 20 },
                penalty: { chaosIncrease: 40 },
                cluesNeeded: 3
            },
            extreme: {
                name: '审判时刻',
                description: '混沌的爪牙就在你身边。找出所有内鬼，否则你将被混沌吞噬。',
                target: 'all',
                difficulty: '极难',
                reward: { chaosReduction: 30, reputation: 50 },
                penalty: { chaosIncrease: 50 },
                cluesNeeded: 4
            }
        },
        faith: {
            simple: {
                name: '祈祷仪式',
                description: '帝皇的圣光需要你的祈祷。在圣坛前祈祷10分钟。',
                target: 'self',
                difficulty: '简单',
                reward: { faith: 10, chaosReduction: 5 },
                penalty: { chaosIncrease: 10 }
            },
            normal: {
                name: '净化异端',
                description: '发现一个正在祈祷的混沌信徒。净化他，或者...放走他？',
                target: 'npc',
                difficulty: '普通',
                reward: { faith: 20, chaosReduction: 15 },
                penalty: { chaosIncrease: 25 },
                choice: true
            },
            hard: {
                name: '艰难抉择',
                description: '你的战友被混沌腐化了。处决他以拯救灵魂，还是让他痛苦地活着？',
                target: 'follower',
                difficulty: '困难',
                reward: { faith: 30, chaosReduction: 20 },
                penalty: { chaosIncrease: 35 },
                choice: true
            },
            extreme: {
                name: '献祭',
                description: '帝皇需要牺牲。你愿意献祭一个追随者来换取力量吗？',
                target: 'follower',
                difficulty: '极难',
                reward: { faith: 50, chaosReduction: 30 },
                penalty: { chaosIncrease: 45 },
                choice: true
            }
        },
        combat: {
            simple: {
                name: '清理巡逻队',
                description: '一队兽人正在附近巡逻。消灭他们。',
                target: 'orc_patrol',
                difficulty: '简单',
                reward: { materials: 30, reputation: 5 },
                penalty: { chaosIncrease: 10 },
                enemies: [{ type: 'orc', hp: 30, damage: 10 }]
            },
            normal: {
                name: '伏击据点',
                description: '混沌信徒在废弃仓库建立了据点。摧毁它。',
                target: 'warehouse',
                difficulty: '普通',
                reward: { materials: 50, reputation: 15 },
                penalty: { chaosIncrease: 20 },
                enemies: [{ type: 'cultist', hp: 50, damage: 15 }, { type: 'cultist', hp: 40, damage: 12 }]
            },
            hard: {
                name: '首领对决',
                description: '混沌首领躲藏在地下堡垒中。击败他。',
                target: 'boss',
                difficulty: '困难',
                reward: { materials: 100, reputation: 30 },
                penalty: { chaosIncrease: 35 },
                enemies: [{ type: 'chaos_leader', hp: 150, damage: 25 }]
            },
            extreme: {
                name: '生存挑战',
                description: '被混沌大军包围。生存10回合，或者杀出血路。',
                target: 'survival',
                difficulty: '极难',
                reward: { materials: 200, reputation: 50 },
                penalty: { chaosIncrease: 50 },
                waves: 5
            }
        },
        devotion: {
            simple: {
                name: '建立信任',
                description: '与塔姆对话，建立初步信任关系。',
                target: 'tam',
                difficulty: '简单',
                reward: { trust: 10, follower: null },
                penalty: { chaosIncrease: 10 }
            },
            normal: {
                name: '英雄救美',
                description: '尤里被困在废墟中。救他出来。',
                target: 'yuri',
                difficulty: '普通',
                reward: { trust: 20, follower: 'yuri' },
                penalty: { chaosIncrease: 15 }
            },
            hard: {
                name: '招募追随者',
                description: '一名帝国士兵愿意追随你。但你需要证明自己的价值。',
                target: 'new_npc',
                difficulty: '困难',
                reward: { follower: { name: '忠诚士兵', type: 'combat', attack: 10 } },
                penalty: { chaosIncrease: 20 }
            },
            extreme: {
                name: '灵魂契约',
                description: '与一名强大的灵能者建立灵魂契约。他将永久追随你。',
                target: 'psychic',
                difficulty: '极难',
                reward: { follower: { name: '灵能者', type: 'psychic', attack: 30, ability: '心灵感知' } },
                penalty: { chaosIncrease: 30 }
            }
        }
    };
    
    return {
        id: `${type}_${difficulty}_${Date.now()}`,
        type: type,
        difficulty: difficulty,
        ...cards[type][difficulty]
    };
}

/**
 * 获取卡牌类型名称
 */
function getCardTypeName(type) {
    const names = {
        chaos: '混沌',
        faith: '信仰',
        combat: '战斗',
        devotion: '眷属'
    };
    return names[type] || type;
}

/**
 * 开始调查（混沌卡）
 */
function startInvestigation() {
    gameState.investigation.active = true;
    gameState.investigation.evidence = [];
    gameState.investigation.votingRound = 0;
    
    addDialog('system', '🔍', '【调查模式】');
    addDialog('system', '👥', '嫌疑人：塔姆(士兵)、卡尔(军需官)、尤里(技术神甫)');
    addDialog('system', '📋', '操作：审问/试探/信任/收集证据 → 投票决定');
}

/**
 * 审问NPC
 */
function interrogate(npcId) {
    const npc = gameState.npcs[npcId];
    if (!npc) {
        addDialog('system', '⚠️', '找不到该NPC');
        return;
    }
    
    // 随机选择对话
    const dialogue = npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)];
    
    addDialog('npc', '💬', `${npc.name}：${dialogue}`);
    
    // 收集线索（可能是真线索或假线索，取决于混沌值）
    const chaosBonus = gameState.character.chaos > 50 ? 0.3 : 0; // 高混沌值时容易获得假线索
    const isFalseClue = Math.random() < chaosBonus;
    
    const clue = {
        npcId: npcId,
        text: npc.clues[Math.floor(Math.random() * npc.clues.length)],
        isFalse: isFalseClue,
        turn: gameState.turn
    };
    
    gameState.investigation.evidence.push(clue);
    
    setTimeout(() => {
        if (isFalseClue) {
            addDialog('system', '🔮', '你的心智受到混沌干扰，这条线索可能是幻觉...');
        } else {
            addDialog('system', '📝', `获得线索：${clue.text}`);
        }
    }, 500);
    
    updateUI();
}

/**
 * 投票决定
 */
function vote(npcId) {
    if (!gameState.investigation.active) {
        addDialog('system', '⚠️', '当前没有调查任务');
        return;
    }
    
    gameState.investigation.votingRound++;
    
    const npc = gameState.npcs[npcId];
    const isCorrect = npc.isTraitor;
    
    addDialog('system', '🗳️', `你投票处决：${npc.name}`);
    
    setTimeout(() => {
        if (isCorrect) {
            // 处决正确
            addDialog('system', '✅', `处决成功！${npc.name}果然是混沌奸细！`);
            addDialog('system', '✨', `混沌值-${gameState.currentCard.reward.chaosReduction || 20}，获得情报+10`);
            
            gameState.character.chaos = Math.max(0, gameState.character.chaos - (gameState.currentCard.reward.chaosReduction || 20));
            gameState.resources.intelligence += 10;
            
            // 完成任务
            completeCard(true);
        } else {
            // 处决错误
            addDialog('system', '❌', `处决错误！${npc.name}是清白的！`);
            addDialog('system', '💀', `${npc.name}临死前喊着：“我是清白的...”`);
            addDialog('system', '☠️', `混沌值+30，因为你处决了无辜者`);
            
            gameState.character.chaos = Math.min(100, gameState.character.chaos + 30);
            
            // 任务失败
            completeCard(false);
        }
        
        // 结束调查
        gameState.investigation.active = false;
        updateUI();
    }, 1000);
}

/**
 * 完成卡牌任务
 */
function completeCard(success) {
    const card = gameState.currentCard;
    
    if (success) {
        addDialog('system', '🎉', `任务成功：${card.name}`);
        
        // 应用奖励
        if (card.reward) {
            if (card.reward.materials) {
                gameState.resources.materials += card.reward.materials;
                addDialog('system', '📦', `获得物资+${card.reward.materials}`);
            }
            if (card.reward.reputation) {
                gameState.character.faith += card.reward.reputation;
                addDialog('system', '⭐', `信仰值+${card.reward.reputation}`);
            }
            if (card.reward.follower) {
                gameState.character.followers.push(card.reward.follower);
                addDialog('system', '👥', `获得追随者：${card.reward.follower.name}`);
            }
        }
    } else {
        addDialog('system', '💀', `任务失败：${card.name}`);
        
        // 应用惩罚
        if (card.penalty && card.penalty.chaosIncrease) {
            gameState.character.chaos = Math.min(100, gameState.character.chaos + card.penalty.chaosIncrease);
            addDialog('system', '🔮', `混沌值+${card.penalty.chaosIncrease}`);
        }
    }
    
    // 清除当前卡牌
    gameState.currentCard = null;
    gameState.cardProgress = 0;
    
    // 检查是否堕落
    if (gameState.character.chaos >= 100) {
        addDialog('system', '☠️', '【堕落】你的灵魂已被混沌吞噬...');
        addDialog('system', '💀', '游戏结束');
        return;
    }
    
    // 询问是否继续
    setTimeout(() => {
        addDialog('system', '🎮', '是否继续下一张卡牌？');
    }, 500);
}

/**
 * 回合结束
 */
function endTurn() {
    gameState.turn++;
    gameState.cardProgress++;
    
    // 检查卡牌任务进度
    if (gameState.currentCard) {
        gameState.cardProgress++;
        
        if (gameState.cardProgress >= gameState.maxCardProgress) {
            addDialog('system', '⏰', '任务超时！');
            addDialog('system', '💀', '混沌值+30');
            gameState.character.chaos = Math.min(100, gameState.character.chaos + 30);
            
            // 任务失败
            completeCard(false);
        } else {
            addDialog('system', '📊', `任务剩余回合：${gameState.maxCardProgress - gameState.cardProgress}`);
        }
    }
    
    // 建筑产出
    const baseOutput = 10 * gameState.turn;  // 每回合固定产出
    gameState.resources.materials += baseOutput;
    
    addDialog('system', '📦', `回合 ${gameState.turn} 开始！巢穴产出 +${baseOutput} 物资`);
    
    // 抽取新卡牌
    if (!gameState.currentCard) {
        drawCard();
    }
    
    // 混沌自然恢复（低概率）
    if (gameState.character.chaos > 0 && Math.random() < 0.1) {
        gameState.character.chaos = Math.max(0, gameState.character.chaos - 2);
        addDialog('system', '✨', '净化仪式生效：混沌值-2');
    }
    
    // 检查游戏结束
    if (gameState.turn > gameState.maxTurns) {
        addDialog('system', '🎉', '恭喜！你成功在14回合内存活下来！');
        addDialog('system', '🏆', '最终混沌值：' + gameState.character.chaos);
        
        if (gameState.character.chaos < 50) {
            addDialog('system', '✨', '你保持了纯净的灵魂，帝国会记住你的功绩！');
        } else {
            addDialog('system', '🔮', '你的灵魂虽然有污点，但仍然为帝国而战。');
        }
        return;
    }
    
    // 检查堕落
    if (gameState.character.chaos >= 100) {
        addDialog('system', '☠️', '【堕落】你的灵魂已被混沌吞噬...');
        addDialog('system', '💀', '游戏结束');
        return;
    }
    
    saveGame();
    updateUI();
}

// 导出到全局
window.gameState = gameState;
window.initGame = initGame;
window.startGuidePhase = startGuidePhase;
window.callAIGuide = callAIGuide;
window.startMainPhase = startMainPhase;
window.drawCard = drawCard;
window.generateCard = generateCard;
window.getCardTypeName = getCardTypeName;
window.startInvestigation = startInvestigation;
window.interrogate = interrogate;
window.vote = vote;
window.completeCard = completeCard;
window.endTurn = endTurn;
