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
    // 检查是否已有按钮
    if (document.getElementById('startGameBtn')) return;
    
    const progressPanel = document.querySelector('.progress-panel');
    if (!progressPanel) return;
    
    const startBtn = document.createElement('button');
    startBtn.id = 'startGameBtn';
    startBtn.className = 'action-btn';
    startBtn.style.cssText = 'background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #fff; font-size: 16px; padding: 15px 30px; width: 100%; margin-top: 15px;';
    startBtn.innerHTML = '🎮 开始任务';
    startBtn.onclick = function() {
        if (gameState.phase === 'guide') {
            this.style.display = 'none';
            startMainPhase();
        } else if (gameState.currentCard) {
            endTurn();
        } else {
            drawCard();
        }
    };
    
    progressPanel.parentNode.insertBefore(startBtn, progressPanel.nextSibling);
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
