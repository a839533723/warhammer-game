/**
 * 战锤40K - 主入口（v0.3 AI增强版）
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    console.log('战锤40K v0.3 启动中...');
    
    // 初始化游戏
    initGame();
    
    // 添加"开始任务"按钮到页面底部
    addStartButton();
});

/**
 * 添加开始任务按钮
 */
function addStartButton() {
    const progressPanel = document.querySelector('.progress-panel');
    if (!progressPanel) return;
    
    // 移除现有的按钮（如果有）
    const existingBtn = document.getElementById('startGameBtn');
    if (existingBtn) existingBtn.remove();
    
    // 重新创建按钮
    const startBtn = document.createElement('button');
    startBtn.id = 'startGameBtn';
    startBtn.className = 'action-btn';
    
    // 根据游戏状态显示不同文本
    let btnText = '🎮 开始任务';
    let btnStyle = 'background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #fff; font-size: 16px; padding: 15px 30px; width: 100%; margin-top: 15px;';
    
    if (gameState.phase === 'main') {
        if (gameState.currentCard) {
            btnText = '🎯 继续当前任务';
        } else {
            btnText = '🃏 抽取新任务卡';
        }
    }
    
    startBtn.innerHTML = btnText;
    startBtn.style.cssText = btnStyle;
    startBtn.onclick = function() {
        if (gameState.phase === 'guide') {
            this.style.display = 'none';
            startMainPhase();
        } else if (gameState.currentCard) {
            // 显示当前任务信息
            addDialog('system', '🎯', '当前任务：' + gameState.currentCard.name);
            addDialog('system', '📋', gameState.currentCard.description);
        } else {
            // 抽取新卡
            drawCard();
        }
    };
    
    // 插入到进度面板后面
    progressPanel.parentNode.insertBefore(startBtn, progressPanel.nextSibling);
}

/**
 * 显示下一张卡按钮（任务完成后调用）
 */
function showNextCardButton() {
    const btn = document.getElementById('startGameBtn');
    if (btn) {
        btn.innerHTML = '🃏 抽取新任务卡';
        btn.style.display = 'block';
        btn.style.animation = 'pulse 1s infinite';
    } else {
        addStartButton();
        const newBtn = document.getElementById('startGameBtn');
        if (newBtn) {
            newBtn.innerHTML = '🃏 抽取新任务卡';
            newBtn.style.animation = 'pulse 1s infinite';
        }
    }
    
    // 添加脉冲动画样式（如果还没有）
    if (!document.getElementById('pulseStyle')) {
        const style = document.createElement('style');
        style.id = 'pulseStyle';
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7); }
                70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * 显示类目
 */
function showCategory(category) {
    document.querySelectorAll('.action-list').forEach(list => list.style.display = 'none');
    document.querySelectorAll('.action-category').forEach(btn => btn.classList.remove('active'));
    
    const actionList = document.getElementById(category + '-actions');
    if (actionList) actionList.style.display = 'grid';
    
    const categoryBtn = document.querySelector('.action-category[onclick="showCategory(\'' + category + '\')"]');
    if (categoryBtn) categoryBtn.classList.add('active');
}

/**
 * 添加对话框消息
 */
function addDialog(type, avatar, text) {
    const dialogContent = document.getElementById('dialogContent');
    if (!dialogContent) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'dialog-message ' + type;
    messageDiv.innerHTML = '<span class="dialog-avatar">' + avatar + '</span><div class="dialog-text">' + text.replace(/\n/g, '<br>') + '</div>';
    dialogContent.appendChild(messageDiv);
    
    const dialogPanel = document.getElementById('dialogPanel');
    dialogPanel.querySelector('.dialog-content').scrollTop = dialogPanel.querySelector('.dialog-content').scrollHeight;
}

/**
 * 更新UI
 */
function updateUI() {
    if (!gameState) return;
    
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
    
    // 资源
    const materialValue = document.getElementById('materialValue');
    const intelligenceValue = document.getElementById('intelligenceValue');
    const faithPointsValue = document.getElementById('faithPointsValue');
    
    if (materialValue) materialValue.textContent = gameState.resources.materials;
    if (intelligenceValue) intelligenceValue.textContent = gameState.resources.intelligence;
    if (faithPointsValue) faithPointsValue.textContent = gameState.resources.faithPoints;
    
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

/**
 * 更新混沌UI
 */
function updateChaosUI() {
    const chaosFill = document.getElementById('chaosFill');
    const chaosBarValue = document.getElementById('chaosBarValue');
    const chaosPhaseLabel = document.getElementById('chaosPhaseLabel');
    
    if (!chaosFill || !chaosBarValue || !chaosPhaseLabel) return;
    
    const chaos = gameState.character.chaos;
    chaosFill.style.width = chaos + '%';
    chaosBarValue.textContent = chaos;
    
    // 颜色和阶段
    let phase = '纯净';
    let color = '#8b5cf6';
    
    if (chaos >= 80) { phase = '堕落'; color = '#dc2626'; }
    else if (chaos >= 60) { phase = '重腐'; color = '#ef4444'; }
    else if (chaos >= 40) { phase = '中腐'; color = '#f97316'; }
    else if (chaos >= 20) { phase = '轻腐'; color = '#eab308'; }
    
    chaosFill.style.background = color;
    chaosPhaseLabel.textContent = '当前阶段：' + phase;
    chaosPhaseLabel.style.color = color;
}

/**
 * 更新当前任务卡UI
 */
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
    
    // 奖励和惩罚HTML
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
    
    cardArea.innerHTML = `
        <div class="current-card-display ${card.type}" style="border-color: ${typeColors[card.type]}">
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
    
    cardInfo.textContent = `【${typeNames[card.type]}】${card.name}`;
    cardTimer.textContent = `剩余回合：${gameState.maxCardProgress - gameState.cardProgress}`;
}

/**
 * 更新调查UI
 */
function updateInvestigationUI() {
    const section = document.getElementById('investigationSection');
    if (!section) return;
    
    // 显示/隐藏调查区域
    section.style.display = (gameState.currentCard && gameState.currentCard.type === 'chaos') ? 'block' : 'none';
    
    // 更新嫌疑人状态
    const suspects = ['tam', 'carl', 'yuri'];
    for (const id of suspects) {
        const npc = gameState.npcs[id];
        if (!npc) continue;
        
        const suspicionEl = document.getElementById(id + 'Suspicion');
        const trustEl = document.getElementById(id + 'Trust');
        
        if (suspicionEl) suspicionEl.textContent = npc.suspicion;
        if (trustEl) trustEl.textContent = npc.trust;
    }
    
    // 更新证据列表
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

/**
 * 更新追随者UI
 */
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

/**
 * 显示完整状态
 */
function showFullStatus() {
    const npcStatus = Object.values(gameState.npcs).map(npc => 
        `${npc.name}(${npc.role}): 可疑度${npc.suspicion}/10，信任度${npc.trust}/10`
    ).join('\n');
    
    const followers = gameState.character.followers.length > 0 ? 
        gameState.character.followers.map(f => f.name).join(', ') : '无';
    
    const statusText = 
        `角色状态\n` +
        `名称：${gameState.character.name}\n` +
        `职业：${gameState.character.class}\n` +
        `生命值：${gameState.character.hp}/${gameState.character.maxHp}\n` +
        `混沌值：${gameState.character.chaos}/100\n` +
        `信仰值：${gameState.character.faith}\n\n` +
        `资源\n` +
        `物资：${gameState.resources.materials}\n` +
        `情报：${gameState.resources.intelligence}\n` +
        `信仰点：${gameState.resources.faithPoints}\n\n` +
        `回合：${gameState.turn}/${gameState.maxTurns}\n\n` +
        `追随者：${followers}\n\n` +
        `NPC状态\n${npcStatus}`;
    
    addDialog('system', '📊', statusText);
}

/**
 * 信仰行动
 */
function performFaithAction(action) {
    if (action === 'pray') {
        if (gameState.resources.intelligence < 5) {
            addDialog('system', '⚠️', '情报不足！需要5情报');
            return;
        }
        gameState.resources.intelligence -= 5;
        gameState.character.faith = Math.min(100, gameState.character.faith + 10);
        addDialog('system', '🙏', '你进行了一次祈祷，信仰值+10');
    } else if (action === 'purify') {
        if (gameState.resources.materials < 20) {
            addDialog('system', '⚠️', '物资不足！需要20物资');
            return;
        }
        gameState.resources.materials -= 20;
        gameState.character.chaos = Math.max(0, gameState.character.chaos - 15);
        addDialog('system', '✨', '净化仪式完成，混沌值-15');
    }
    updateUI();
}

/**
 * 眷属行动
 */
function performDevotionAction(action) {
    if (action === 'gift') {
        if (gameState.resources.materials < 10) {
            addDialog('system', '⚠️', '物资不足！需要10物资');
            return;
        }
        gameState.resources.materials -= 10;
        gameState.character.faith = Math.min(100, gameState.character.faith + 5);
        addDialog('system', '🎁', '你送出了礼物，NPC好感度小幅提升');
    } else if (action === 'help') {
        if (gameState.resources.materials < 15) {
            addDialog('system', '⚠️', '物资不足！需要15物资');
            return;
        }
        gameState.resources.materials -= 15;
        gameState.character.faith = Math.min(100, gameState.character.faith + 10);
        addDialog('system', '🤝', '你帮助了NPC，信任度大幅提升');
    }
    updateUI();
}

/**
 * 招募追随者
 */
function recruitFollower() {
    const cost = 30;

    if (gameState.resources.materials < cost) {
        addDialog('system', '⚠️', '物资不足！需要' + cost + '物资');
        return;
    }

    // 检查是否已达到追随者上限
    if (gameState.character.followers.length >= 5) {
        addDialog('system', '⚠️', '追随者已达到上限（5人）！');
        return;
    }

    // 消耗物资
    gameState.resources.materials -= cost;

    // 随机生成追随者
    const followerTypes = ['combat', 'psychic'];
    const type = followerTypes[Math.floor(Math.random() * followerTypes.length)];

    const names = {
        combat: ['突击队员阿尔法', '重装战士贝塔', '近战专家伽马', '狙击手德尔塔', '爆破手艾普西隆'],
        psychic: ['灵能者泽塔', '先知伊塔', '读心者Theta', '预言者Kappa', '灵能刺客Lambda']
    };

    const abilities = {
        combat: ['+5攻击', '+3防御', '+2闪避'],
        psychic: ['混沌抗性+10', '灵能感知', '心灵护盾']
    };

    const name = names[type][Math.floor(Math.random() * names[type].length)];
    const ability = abilities[type][Math.floor(Math.random() * abilities[type].length)];

    const follower = {
        name: name,
        type: type,
        ability: ability,
        recruitedAt: gameState.turn
    };

    // 添加追随者
    gameState.character.followers.push(follower);

    addDialog('system', '👥', '你成功招募了追随者！');
    addDialog('npc', '👤', '我叫' + name + '，将为您效忠！');
    addDialog('system', '✨', '获得追随者：' + name + '（' + (type === 'combat' ? '战斗型' : '灵能型') + '，' + ability + '）');

    updateUI();
}

// 导出函数到全局
window.showCategory = showCategory;
window.addDialog = addDialog;
window.updateUI = updateUI;
window.showFullStatus = showFullStatus;
window.performFaithAction = performFaithAction;
window.performDevotionAction = performDevotionAction;
window.recruitFollower = recruitFollower;
window.saveGame = saveGame;
window.loadGame = loadGame;
window.resetGame = resetGame;

// 导出函数到全局
window.showCategory = showCategory;
window.addDialog = addDialog;
window.updateUI = updateUI;
window.showFullStatus = showFullStatus;
window.performFaithAction = performFaithAction;
window.performDevotionAction = performDevotionAction;
window.saveGame = saveGame;
window.loadGame = loadGame;
window.resetGame = resetGame;

// ============================================
// 伊莲娜对话系统
// ============================================

function showElenaChat() {
    document.getElementById('elenaPopup').style.display = 'flex';
}

function hideElenaChat() {
    document.getElementById('elenaPopup').style.display = 'none';
}

async function askElena(questionType) {
    const messagesContainer = document.getElementById('elenaMessages');
    
    // 添加加载状态
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'elena-message';
    loadingDiv.id = 'elenaLoading';
    loadingDiv.textContent = '伊莲娜正在思考...';
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // 使用预设对话（不再调用AI）
    const response = getElenaTip(questionType);

    // 移除加载状态
    document.getElementById('elenaLoading')?.remove();
    
    if (response) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'elena-message';
        messageDiv.textContent = response;
        messagesContainer.appendChild(messageDiv);
    } else {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'elena-message';
        messageDiv.textContent = '连接失败了...你可以试试预设的问题。';
        messagesContainer.appendChild(messageDiv);
    }
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendToElena() {
    const input = document.getElementById('elenaInput');
    const question = input.value.trim();
    
    if (!question) return;
    
    // 显示玩家的问题
    const messagesContainer = document.getElementById('elenaMessages');
    const playerDiv = document.createElement('div');
    playerDiv.style.cssText = 'background: rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 10px 15px; margin-bottom: 10px; color: #fff; text-align: right;';
    playerDiv.textContent = '你：' + question;
    messagesContainer.appendChild(playerDiv);
    
    input.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // 调用AI（使用general类型，但传入用户问题）
    const messagesDiv = document.createElement('div');
    messagesDiv.className = 'elena-message';
    messagesDiv.id = 'elenaLoading';
    messagesDiv.textContent = '伊莲娜正在思考...';
    messagesContainer.appendChild(messagesDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // 构建基于用户问题的prompt
    const chaosLevel = gameState.character.chaos;
    const turn = gameState.turn;
    const currentCard = gameState.currentCard;
    
    const prompt = `你是战锤40K游戏的AI主持人伊莲娜，用姐姐的口吻（稍微调皮但关心）回答玩家的问题。

当前游戏状态：
- 回合：${turn}/14
- 混沌值：${chaosLevel}
- 当前任务：${currentCard?.name || '无'}
- 任务类型：${currentCard?.type || '无'}

请用中文回答玩家的问题，符合伊莲娜的姐姐口吻。`;

    // 使用预设对话（不再调用AI）
    // 根据问题关键词选择合适的预设回答
    let response = '';
    const questionLower = question.toLowerCase();

    if (questionLower.includes('任务') || questionLower.includes('卡')) {
        response = getElenaTip('card');
    } else if (questionLower.includes('混沌')) {
        response = getElenaTip('chaos');
    } else if (questionLower.includes('怎么') || questionLower.includes('做') || questionLower.includes('策略')) {
        response = getElenaTip('strategy');
    } else if (questionLower.includes('玩法') || questionLower.includes('游戏')) {
        response = getElenaTip('general');
    } else {
        // 通用回答（根据当前状态）
        if (gameState.character.chaos > 50) {
            response = '小鬼，你混沌值有点高啊...小心点，别被混沌影响了。记住，不管发生什么，姐姐都会帮你的。';
        } else if (gameState.turn > 10) {
            response = '战斗已经持续很久了...你还好吗？坚持住，胜利就在前方！';
        } else {
            response = getElenaTip('general');
        }
    }

    document.getElementById('elenaLoading')?.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = 'elena-message';
    messageDiv.textContent = response;
    messagesContainer.appendChild(messageDiv);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 导出伊莲娜对话函数
window.showElenaChat = showElenaChat;
window.hideElenaChat = hideElenaChat;
window.askElena = askElena;
window.sendToElena = sendToElena;
window.showNextCardButton = showNextCardButton;
