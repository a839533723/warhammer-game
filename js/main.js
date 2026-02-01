/**
 * 战锤40K - 主入口
 * 简化的游戏主逻辑，模块化调用各系统
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    console.log('战锤40K已启动（模块化版本）');
    
    // 初始化各系统
    initGame();
    
    // 加载存档
    loadGame();
    
    // 初始化抽卡
    startTurn();
});

/**
 * 初始化游戏
 */
function initGame() {
    // 更新UI
    updateUI();
    
    addDialog('system', '🌌', '欢迎回来，战士！你是极限战士钛-7，在荷鲁斯之乱的动荡时期醒来。');
    addDialog('system', '📋', '【新系统已启用】');
    addDialog('system', '🃏', '抽卡系统：每回合抽取3张卡牌，选择使用或弃牌');
    addDialog('system', '🔮', '混沌系统：混沌值会影响你的行动和结局');
    addDialog('system', '👥', '追随者系统：招募追随者获得加成');
    
    console.log('游戏初始化完成');
}

/**
 * 开始回合
 */
function startTurn() {
    // 重置行动计数
    gameState.actionsUsed = 0;
    
    // 抽卡
    cardSystem.drawCards(3);
    
    // 检查混沌审判倒计时
    if (chaosSystem.judgmentTimer > 0) {
        chaosSystem.judgmentTimer--;
        if (chaosSystem.judgmentTimer <= 0) {
            chaosSystem.executeJudgment();
        }
    }
    
    // 更新UI
    updateUI();
    
    addDialog('system', '🔄', '回合 ' + gameState.turn + ' 开始！');
    addDialog('system', '🃏', '你抽取了3张卡牌，请选择使用或弃牌。');
}

/**
 * 回合结束
 */
function endTurn() {
    // 建筑产出
    const buildingOutput = resourceSystem.updateDailyProduction();
    
    // 随机事件
    const randomEvent = Math.random();
    let eventMessage = '';
    
    if (randomEvent < 0.15) {
        const goodEvents = [
            { text: '意外收获：路过商队送了你一些物资。', materials: 10 },
            { text: '好消息：你的英勇事迹传开了，声望+5！', reputation: 5 },
            { text: '发现：工坊里找到了隐藏的工具箱。', materials: 8 }
        ];
        const event = goodEvents[Math.floor(Math.random() * goodEvents.length)];
        eventMessage = '。' + event.text;
        if (event.materials) resourceSystem.modify('materials', event.materials);
        if (event.reputation) resourceSystem.modify('reputation', event.reputation);
    } else if (randomEvent < 0.25) {
        const badEvents = [
            { text: '袭击：一小股混沌信徒袭击了你的巢穴！', chaos: 5 },
            { text: '损失：一些物资在仓库中腐烂了。', materials: -5 },
            { text: '监视：你感觉到有人在暗中监视你...', chaos: 0 }
        ];
        const event = badEvents[Math.floor(Math.random() * badEvents.length)];
        eventMessage = '。' + event.text;
        if (event.chaos) chaosSystem.addChaos(event.chaos);
        if (event.materials) resourceSystem.modify('materials', event.materials);
    }
    
    // 混沌值自然恢复（低概率）
    if (chaosSystem.chaosValue > 0 && Math.random() < 0.1) {
        chaosSystem.purify(2);
        eventMessage += '。净化仪式生效：混沌值-2';
    }
    
    // 混沌幻觉
    if (chaosSystem.phase === 'light' || chaosSystem.phase === 'corrupt' || chaosSystem.phase === 'heavy') {
        if (Math.random() < 0.3) {
            const hallucination = chaosSystem.generateHallucination();
            eventMessage += '。幻觉：' + hallucination;
        }
    }
    
    // 混沌警告
    let chaosWarning = '';
    if (chaosSystem.chaosValue >= 50) {
        const phaseInfo = chaosSystem.getPhaseInfo();
        chaosWarning = '。警告：混沌值达到' + chaosSystem.chaosValue + '！当前阶段：' + phaseInfo.name;
    }
    
    // 检查堕落
    if (chaosSystem.chaosValue >= 100) {
        addDialog('system', '☠️', '你已经堕落了...混沌吞噬了你的灵魂。');
        addDialog('system', '💀', '【游戏结束】你的灵魂已经彻底堕落入混沌。');
        return;
    }
    
    // 显示回合总结
    addDialog('system', '📊', '回合 ' + gameState.turn + ' 结束！');
    addDialog('system', '🏭', '建筑产出：' + buildingOutput + eventMessage + chaosWarning);
    addDialog('system', '📦', '当前物资：' + gameState.resources.materials.value + '，混沌值：' + chaosSystem.chaosValue + '/100');
    
    // 进入下一回合
    gameState.turn++;
    startTurn();
    
    updateUI();
    saveGame();
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
    gameState.selectedCategory = category;
}

/**
 * 行动处理（兼容旧系统）
 */
function performAction(category, action) {
    // 暂时禁用旧系统，提示用户使用新抽卡系统
    addDialog('system', '⚠️', '【新版本已更新】请使用新的抽卡系统进行游戏！');
    addDialog('system', '🃏', '抽取卡牌，选择使用或弃牌来完成行动。');
}

/**
 * 显示完整状态
 */
function showFullStatus() {
    const npcStatus = Object.values(gameState.npcs).map(npc => npc.name + '：可疑度' + npc.suspicion + '/10，信任度' + npc.trust + '/10').join('\n');
    const buildings = gameState.base.buildings.length > 0 ? gameState.base.buildings.map(b => b.name).join(', ') : '无';
    const followers = gameState.resources.followers.list.length > 0 ? gameState.resources.followers.list.map(f => f.name).join(', ') : '无';
    
    const statusText = 
        '角色状态\n' +
        '名称：' + gameState.character.name + '\n' +
        '职业：' + gameState.character.class + ' Lv.' + gameState.character.level + '\n' +
        '生命值：' + gameState.character.hp + '/' + gameState.character.maxHp + '\n' +
        '混沌值：' + chaosSystem.chaosValue + '/100\n' +
        '声望：' + gameState.resources.reputation.value + '\n' +
        '\n资源\n' +
        '物资：' + gameState.resources.materials.value + '/' + gameState.resources.materials.max + '\n' +
        '记忆碎片：' + gameState.resources.memoryFragments.value + '/' + gameState.resources.memoryFragments.max + '\n' +
        '巢穴等级：' + gameState.base.level + '\n' +
        '建筑：' + buildings + '\n' +
        '追随者：' + followers + '\n' +
        '\nNPC\n' + 
        npcStatus + '\n' +
        '\n回合信息\n' +
        '当前回合：' + gameState.turn + '\n' +
        '混沌阶段：' + chaosSystem.getPhaseInfo().name;
    
    addDialog('system', '📊', statusText);
}

/**
 * 获取行动名称（兼容旧系统）
 */
function getActionName(category, action) {
    const names = {
        'combat': { 'attack_chaos': '迎击混沌入侵者', 'defend_base': '防守要塞入口' },
        'building': { 'upgrade_base': '升级巢穴', 'build_training': '建造训练场', 'build_workshop': '建造工坊', 'build_shrine': '建造灵魂圣殿' },
        'investigation': { 'talk_tam': '与塔姆对话', 'talk_carl': '与卡尔对话', 'talk_yuri': '与尤里对话' },
        'exploration': { 'explore_wilderness': '探索北境荒野', 'searchruins': '搜索古代遗迹' },
        'system': { 'save': '存档', 'load': '读档', 'status': '查看状态', 'endTurn': '回合结束', 'reset': '重置游戏' }
    };
    return names[category] && names[category][action] ? names[category][action] : action;
}

/**
 * 添加对话框消息
 */
function addDialog(type, avatar, text) {
    const dialogContent = document.getElementById('dialogContent');
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
    // 角色信息
    document.getElementById('charName').textContent = gameState.character.name;
    document.getElementById('charClass').textContent = gameState.character.class + ' Lv.' + gameState.character.level;
    document.getElementById('hpValue').textContent = gameState.character.hp;
    document.getElementById('hpMax').textContent = gameState.character.maxHp;
    document.getElementById('reputationValue').textContent = gameState.resources.reputation.value;
    
    // 回合信息
    document.getElementById('turnNumber').textContent = gameState.turn;
    
    // 资源面板
    updateResourcePanel();
    
    // 混沌进度条
    updateChaosBar();
    
    // 追随者面板
    updateFollowerPanel();
    
    // 手牌区域
    updateCardArea();
}

/**
 * 更新资源面板
 */
function updateResourcePanel() {
    const panel = document.querySelector('.resource-panel');
    if (panel) {
        panel.outerHTML = resourceSystem.getResourcePanelHTML();
    }
}

/**
 * 更新混沌进度条
 */
function updateChaosBar() {
    const chaosFill = document.getElementById('chaosFill');
    if (chaosFill) {
        chaosFill.style.width = chaosSystem.chaosValue + '%';
        
        const colors = {
            'pure': '#8b5cf6',
            'light': '#eab308',
            'corrupt': '#f97316',
            'heavy': '#ef4444',
            'fallen': '#dc2626'
        };
        
        chaosFill.style.background = colors[chaosSystem.phase] || colors['pure'];
    }
    
    const chaosValueEl = document.getElementById('chaosValue');
    if (chaosValueEl) {
        chaosValueEl.textContent = chaosSystem.chaosValue;
    }
}

/**
 * 更新追随者面板
 */
function updateFollowerPanel() {
    const panel = document.querySelector('.followers-panel');
    if (panel) {
        let html = '<div class="followers-list">';
        
        for (const follower of gameState.resources.followers.list) {
            const typeIcons = { 'combat': '⚔️', 'function': '🔧', 'special': '✨' };
            html += `
                <div class="follower-card">
                    <div class="follower-avatar">${typeIcons[follower.type] || '👤'}</div>
                    <div class="follower-info">
                        <div class="follower-name">${follower.name}</div>
                        <div class="follower-type">${follower.type}</div>
                        <div class="follower-bonus">+${follower.bonus.attack || 0} 攻击</div>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        panel.innerHTML = html;
    }
}

/**
 * 更新手牌区域
 */
function updateCardArea() {
    const cardArea = document.getElementById('cardArea');
    if (cardArea) {
        cardArea.innerHTML = cardSystem.getHandHTML();
    }
}

/**
 * 获取行动名称（全局）
 */
window.getActionName = getActionName;
window.addDialog = addDialog;
window.updateUI = updateUI;
window.showCategory = showCategory;
window.performAction = performAction;
window.showFullStatus = showFullStatus;
window.endTurn = endTurn;
window.startTurn = startTurn;
