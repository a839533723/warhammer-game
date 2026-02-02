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

    // 资源历史（用于趋势显示）
    resourceHistory: {
        materials: [],   // [{turn: 1, value: 50}, ...]
        intelligence: [],
        faithPoints: []
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

// ============================================
// UI辅助函数（必须在gameState.js中定义，因为先加载）
// ============================================

function addDialog(type, avatar, text) {
    const dialogContent = document.getElementById('dialogContent');
    if (!dialogContent) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'dialog-message ' + type;
    messageDiv.innerHTML = '<span class="dialog-avatar">' + avatar + '</span><div class="dialog-text">' + text.replace(/\n/g, '<br>') + '</div>';
    dialogContent.appendChild(messageDiv);
    
    const dialogPanel = document.getElementById('dialogPanel');
    if (dialogPanel && dialogPanel.querySelector) {
        dialogPanel.querySelector('.dialog-content').scrollTop = dialogPanel.querySelector('.dialog-content').scrollHeight;
    }
}

function recordResourceHistory() {
    // 记录当前回合的资源值
    const turn = gameState.turn;
    gameState.resourceHistory.materials.push({turn: turn, value: gameState.resources.materials});
    gameState.resourceHistory.intelligence.push({turn: turn, value: gameState.resources.intelligence});
    gameState.resourceHistory.faithPoints.push({turn: turn, value: gameState.resources.faithPoints});

    // 限制历史记录数量（只保留最近10回合）
    const maxHistory = 10;
    if (gameState.resourceHistory.materials.length > maxHistory) {
        gameState.resourceHistory.materials.shift();
        gameState.resourceHistory.intelligence.shift();
        gameState.resourceHistory.faithPoints.shift();
    }
}

function updateResourceTrend(type, currentValue) {
    // 计算趋势
    const history = gameState.resourceHistory[type];
    if (!history || history.length < 2) return '';

    const current = history[history.length - 1].value;
    const previous = history[history.length - 2].value;

    if (current > previous) {
        return '<span class="resource-trend up">↑' + (current - previous) + '</span>';
    } else if (current < previous) {
        return '<span class="resource-trend down">↓' + (previous - current) + '</span>';
    } else {
        return '<span class="resource-trend same">-</span>';
    }
}

function updateUI() {
    if (!gameState) return;

    // 记录资源历史
    recordResourceHistory();

    // 角色信息
    const charName = document.getElementById('charName');
    const charClass = document.getElementById('charClass');
    const hpValue = document.getElementById('hpValue');
    const chaosValue = document.getElementById('chaosValue');
    const faithValue = document.getElementById('faithValue');

    if (charName) charName.textContent = gameState.character.name;
    if (charClass) charClass.textContent = gameState.character.class + ' Lv.' + gameState.character.level;
    if (hpValue) hpValue.textContent = gameState.character.hp;
    if (chaosValue) chaosValue.textContent = gameState.character.chaos;
    if (faithValue) faithValue.textContent = gameState.character.faith;

    // 资源（带趋势显示）
    const materialValue = document.getElementById('materialValue');
    const intelligenceValue = document.getElementById('intelligenceValue');
    const faithPointsValue = document.getElementById('faithPointsValue');

    if (materialValue) materialValue.innerHTML = gameState.resources.materials + updateResourceTrend('materials', gameState.resources.materials);
    if (intelligenceValue) intelligenceValue.innerHTML = gameState.resources.intelligence + updateResourceTrend('intelligence', gameState.resources.intelligence);
    if (faithPointsValue) faithPointsValue.innerHTML = gameState.resources.faithPoints + updateResourceTrend('faithPoints', gameState.resources.faithPoints);

    // 混沌进度条
    updateChaosUI();

    // 回合
    const turnNumber = document.getElementById('turnNumber');
    const chaosProgress = document.getElementById('chaosProgress');

    if (turnNumber) turnNumber.textContent = gameState.turn;
    if (chaosProgress) chaosProgress.textContent = gameState.character.chaos;
    
    // 当前任务卡
    updateCurrentCardUI();
    
    // 调查系统
    updateInvestigationUI();
    
    // 追随者
    updateFollowersUI();
}

function updateChaosUI() {
    const chaosFill = document.getElementById('chaosFill');
    const chaosBarValue = document.getElementById('chaosBarValue');
    const chaosPhaseLabel = document.getElementById('chaosPhaseLabel');
    const chaosContainer = document.querySelector('.chaos-container');

    if (!chaosFill || !chaosBarValue || !chaosPhaseLabel) return;

    const chaos = gameState.character.chaos;
    chaosFill.style.width = chaos + '%';
    chaosBarValue.textContent = chaos;

    // 定义混沌阶段（6个阶段，更多细节）
    const phases = [
        {threshold: 0, name: '纯净', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)'},
        {threshold: 20, name: '轻腐', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)'},
        {threshold: 40, name: '中腐', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)'},
        {threshold: 60, name: '重腐', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)'},
        {threshold: 80, name: '深渊', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)'},
        {threshold: 95, name: '堕落', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.25)'}
    ];

    // 找到当前阶段
    let currentPhase = phases[0];
    for (let i = phases.length - 1; i >= 0; i--) {
        if (chaos >= phases[i].threshold) {
            currentPhase = phases[i];
            break;
        }
    }

    // 更新UI
    chaosFill.style.background = currentPhase.color;
    chaosPhaseLabel.textContent = '当前阶段：' + currentPhase.name;
    chaosPhaseLabel.style.color = currentPhase.color;

    // 混沌阶段警告（背景光晕效果）
    if (chaosContainer) {
        chaosContainer.style.background = currentPhase.bg;
        if (chaos >= 60) {
            chaosContainer.style.boxShadow = '0 0 20px ' + currentPhase.color + '40';
        } else {
            chaosContainer.style.boxShadow = 'none';
        }
    }

    // 高混沌时添加视觉效果
    chaosFill.classList.remove('high-chaos', 'critical');
    if (chaos >= 80) {
        chaosFill.classList.add('critical');
    } else if (chaos >= 60) {
        chaosFill.classList.add('high-chaos');
    }

    // 计算到下一阶段的回合数
    let nextThreshold = 100;
    for (let i = 0; i < phases.length; i++) {
        if (chaos < phases[i].threshold) {
            nextThreshold = phases[i].threshold;
            break;
        }
    }

    // 混沌倒计时（根据平均每回合增长估算）
    if (chaos < 100 && gameState.resourceHistory.materials.length > 1) {
        // 估算增长趋势
        const history = gameState.resourceHistory.materials;
        if (history.length >= 2) {
            const lastChange = history[history.length - 1].value - history[history.length - 2].value;
            // 如果最近几个回合混沌值在增加
            if (lastChange < 0) { // 物资减少通常意味着混沌增加
                const roundsToNext = Math.ceil((nextThreshold - chaos) / 5); // 假设每回合增加5
                if (roundsToNext <= 5) {
                    chaosPhaseLabel.innerHTML += ' <span class="chaos-warning">⚠️ ' + roundsToNext + '回合后进入下一阶段</span>';
                }
            }
        }
    }

    // 堕落警告
    if (chaos >= 90) {
        chaosPhaseLabel.innerHTML += ' <span class="chaos-danger">⚠️ 即将堕落！</span>';
    }
}

function updateCurrentCardUI() {
    const cardArea = document.getElementById('currentCardArea');
    const cardInfo = document.getElementById('cardInfo');
    const cardTimer = document.getElementById('cardTimer');
    
    if (!cardArea || !cardInfo || !cardTimer) return;
    
    const card = gameState.currentCard;
    
    if (!card) {
        cardArea.innerHTML = '<p class="empty-text">等待抽取新任务...</p>';
        cardInfo.textContent = '暂无任务';
        cardTimer.textContent = '-';
        return;
    }
    
    const typeColors = {
        chaos: '#ef4444',
        faith: '#fbbf24',
        combat: '#3b82f6',
        devotion: '#ec4899'
    };
    
    const typeNames = {
        chaos: '混沌',
        faith: '信仰',
        combat: '战斗',
        devotion: '眷属'
    };
    
    let rewardsHTML = '';
    if (card.reward) {
        if (card.reward.materials) rewardsHTML += '<div class="reward-item">📦 成功：物资+' + card.reward.materials + '</div>';
        if (card.reward.chaosReduction) rewardsHTML += '<div class="reward-item">✨ 成功：混沌值-' + card.reward.chaosReduction + '</div>';
        if (card.reward.faith) rewardsHTML += '<div class="reward-item">⭐ 成功：信仰+' + card.reward.faith + '</div>';
        if (card.reward.follower) rewardsHTML += '<div class="reward-item">👥 成功：获得追随者</div>';
    }
    
    let penaltyHTML = '';
    if (card.penalty && card.penalty.chaosIncrease) {
        penaltyHTML = '<div class="penalty-item">💀 失败：混沌值+' + card.penalty.chaosIncrease + '</div>';
    }

    // 检查是否是新抽的卡（用于动画）
    const isNewCard = cardArea.getAttribute('data-card-id') !== card.id;

    // 添加动画类
    const animationClass = isNewCard ? 'card-draw-animation' : '';

    cardArea.innerHTML = `
        <div class="current-card-display ${card.type} ${animationClass}" style="border-color: ${typeColors[card.type]}">
            <div class="current-card-header">
                <span class="current-card-type ${card.type}">【${typeNames[card.type]}卡】</span>
                <span class="current-card-difficulty">${card.difficulty}</span>
            </div>
            <div class="current-card-name">${card.name}</div>
            <div class="current-card-description">${card.description}</div>
            <div class="current-card-progress">
                <span>任务进度：${gameState.cardProgress}/${gameState.maxCardProgress}回合</span>
                <span>剩余：${gameState.maxCardProgress - gameState.cardProgress}回合</span>
            </div>
            <div class="current-card-rewards">
                ${rewardsHTML}
                ${penaltyHTML}
            </div>
        </div>
    `;

    // 更新card-section的class（根据卡牌类型改变颜色）
    const cardSection = document.getElementById('cardSection');
    if (cardSection) {
        cardSection.className = 'card-section ' + card.type;
    }

    // 更新cardId属性
    cardArea.setAttribute('data-card-id', card.id);

    cardInfo.textContent = `【${typeNames[card.type]}】${card.name}`;
    cardTimer.textContent = `剩余回合：${gameState.maxCardProgress - gameState.cardProgress}`;
}

function updateInvestigationUI() {
    const section = document.getElementById('investigationSection');
    if (!section) return;
    
    section.style.display = (gameState.currentCard && gameState.currentCard.type === 'chaos') ? 'block' : 'none';
    
    const suspects = ['tam', 'carl', 'yuri'];
    for (const id of suspects) {
        const npc = gameState.npcs[id];
        if (!npc) continue;
        
        const suspicionEl = document.getElementById(id + 'Suspicion');
        const trustEl = document.getElementById(id + 'Trust');
        
        if (suspicionEl) suspicionEl.textContent = npc.suspicion;
        if (trustEl) trustEl.textContent = npc.trust;
    }
    
    const evidenceList = document.getElementById('evidenceList');
    if (evidenceList && gameState.investigation.evidence.length > 0) {
        evidenceList.innerHTML = gameState.investigation.evidence.map(e => `
            <div class="evidence-item ${e.isFalse ? 'false' : ''}">
                <div class="evidence-text">${e.text}</div>
                <div class="evidence-source">来自：${gameState.npcs[e.npcId].name} ${e.isFalse ? '（可能是幻觉）' : ''}</div>
            </div>
        `).join('');
    }
}

function updateFollowersUI() {
    const panel = document.getElementById('followersPanel');
    if (!panel) return;
    
    const followers = gameState.character.followers;
    
    if (!followers || followers.length === 0) {
        panel.innerHTML = '<p class="empty-text">还没有追随者...</p>';
        return;
    }
    
    panel.innerHTML = followers.map(f => `
        <div class="follower-card">
            <div class="follower-avatar">${f.type === 'combat' ? '⚔️' : '🔮'}</div>
            <div class="follower-info">
                <div class="follower-name">${f.name}</div>
                <div class="follower-type">${f.type === 'combat' ? '战斗追随者' : '灵能追随者'}</div>
                <div class="follower-bonus">${f.attack ? '+' + f.attack + ' 攻击' : ''} ${f.ability ? f.ability : ''}</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// 游戏逻辑函数
// ============================================

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
    addDialog('system', '🌌', '【战锤40K：虚空黎明 v0.3.1】');
    addDialog('system', '👩', '你好，战士。正在连接伊莲娜...');
    
    // 调用AI生成增强版开场白
    setTimeout(async () => {
        const enhancedGuide = await aiSystem.generateEnhancedGuide();
        
        if (enhancedGuide) {
            // 分段显示AI生成的文本
            const paragraphs = enhancedGuide.split('\n\n');
            for (const para of paragraphs) {
                if (para.trim()) {
                    addDialog('npc', '👩', para);
                    await new Promise(r => setTimeout(r, 500));
                }
            }
        } else {
            // AI失败时使用预设文本
            showDefaultGuide();
        }
    }, 1000);
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

你准备好了吗，战士？

【点击下方"开始任务"按钮开始冒险】`;

    addDialog('npc', '👩', guideText);
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
async function drawCard() {
    const types = ['chaos', 'faith', 'combat', 'devotion'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const card = generateCard(type);
    gameState.currentCard = card;
    gameState.cardProgress = 0;
    gameState.hand = [card];
    
    addDialog('system', '🃏', `【${getCardTypeName(type)}卡】`);
    
    // 调用AI生成事件描写
    const eventDesc = await aiSystem.generateEventDescription(card);
    
    if (eventDesc) {
        addDialog('npc', '🌍', eventDesc);
    } else {
        // AI失败时使用预设文本
        addDialog('npc', '📜', card.description);
    }
    
    addDialog('system', '⏰', `任务期限：${gameState.maxCardProgress}回合`);
    
    // 根据卡牌类型显示提示
    if (type === 'chaos') {
        addDialog('system', '🔍', '任务：找出内鬼。点击"调查"面板审问NPC。');
        startInvestigation();
    } else if (type === 'faith') {
        addDialog('system', '✨', '任务：完成帝皇的旨意。点击"信仰"面板进行祈祷或净化。');
    } else if (type === 'combat') {
        addDialog('system', '⚔️', '任务：击败敌人。点击"系统"面板使用战斗指令。');
    } else if (type === 'devotion') {
        addDialog('system', '💕', '任务：获取追随者。点击"眷属"面板送礼或帮助NPC。');
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
 * 审问NPC（AI生成对话）
 */
async function interrogate(npcId) {
    const npc = gameState.npcs[npcId];
    if (!npc) {
        addDialog('system', '⚠️', '找不到该NPC');
        return;
    }
    
    // 调用AI生成NPC对话
    const dialogue = await aiSystem.generateNPCDialogue(npcId);
    
    if (dialogue) {
        addDialog('npc', '💬', `${npc.name}：${dialogue}`);
    } else {
        // AI失败时使用预设对话
        const presetDialogue = npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)];
        addDialog('npc', '💬', `${npc.name}：${presetDialogue}`);
    }
    
    // 收集线索（可能是真线索或假线索，取决于混沌值）
    const chaosBonus = gameState.character.chaos > 50 ? 0.3 : 0;
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
            addDialog('system', '💀', `${npc.name}临死前喊着："我是清白的..."`);
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
        addDialog('system', '🎮', '点击下方"开始任务"按钮继续下一张卡');
        showNextCardButton();
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

// 存档/读档功能
function saveGame() {
    localStorage.setItem('warhammer_game_state', JSON.stringify(gameState));
    addDialog('system', '💾', '游戏已保存！');
}

function loadGame() {
    const saved = localStorage.getItem('warhammer_game_state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameState = { ...gameState, ...parsed };
            addDialog('system', '📂', '存档加载成功！');
        } catch (e) {
            addDialog('system', '⚠️', '存档已损坏，无法加载。');
        }
    }
}

function resetGame() {
    if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
        localStorage.removeItem('warhammer_game_state');
        location.reload();
    }
}

// 导出到全局
window.gameState = gameState;
window.initGame = initGame;
window.startGuidePhase = startGuidePhase;
window.startMainPhase = startMainPhase;
window.drawCard = drawCard;
window.generateCard = generateCard;
window.getCardTypeName = getCardTypeName;
window.startInvestigation = startInvestigation;
window.interrogate = interrogate;
window.vote = vote;
window.completeCard = completeCard;
window.endTurn = endTurn;
window.saveGame = saveGame;
window.loadGame = loadGame;
window.resetGame = resetGame;
window.addDialog = addDialog;
window.updateUI = updateUI;
